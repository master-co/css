use super::Migration;
use crate::{
    CompileManifestOptions, CompileNativeCssOptions, compile_css_directives, compile_manifest_input,
};
use mastercss_lexer::{
    CssSyntaxKind, byte_to_utf16_offset, collect_class_list_token_ranges,
    collect_css_syntax_statements, tokenize_css_syntax, utf16_to_byte_offset,
};
use mastercss_schema::SourceRange;
use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RcStylesheetMigration {
    pub edits: Vec<RcMigrationEdit>,
    pub notes: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RcMigrationEdit {
    pub range: SourceRange,
    pub before: String,
    pub after: String,
}

impl Migration {
    pub(super) fn stylesheet(&self, source: &str) -> RcStylesheetMigration {
        let tokens = tokenize_css_syntax(source);
        let statements = collect_css_syntax_statements(&tokens);
        let mut result = RcStylesheetMigration {
            edits: Vec::new(),
            notes: Vec::new(),
        };
        for statement in &statements {
            let Some(first) = tokens.get(statement.tokens.start) else {
                continue;
            };
            let end = tokens
                .get(statement.tokens.end)
                .map_or(source.len(), |token| token.bytes.start);
            let prelude = &source[first.bytes.start..end];
            let parent = statement
                .parent
                .and_then(|index| tokens.get(statements[index].tokens.start));
            if matches!(parent.map(|token| &token.kind), Some(CssSyntaxKind::AtKeyword(name)) if name == "settings")
                && matches!(&first.kind, CssSyntaxKind::Ident(name) if name == "base-unit")
            {
                let declared = prelude
                    .split_once(':')
                    .and_then(|(_, value)| value.trim().parse::<f64>().ok());
                if declared != Some(self.base_unit) {
                    result.notes.push("CSS base-unit does not match the saved RC manifest; recover the exact project configuration".into());
                    continue;
                }
                let end = tokens
                    .get(statement.tokens.end)
                    .filter(|token| token.kind == CssSyntaxKind::Delim(';'))
                    .map_or(end, |token| token.bytes.end);
                add_edit(&mut result, source, first.bytes.start, end, String::new());
            }
            if statement.has_block
                && matches!(parent.map(|token| &token.kind), Some(CssSyntaxKind::AtKeyword(name)) if matches!(name.as_ref(), "utilities" | "components" | "defaults"))
            {
                let Some((key, pattern)) = prelude.trim().split_once(":<") else {
                    continue;
                };
                let Some(pattern) = pattern.strip_suffix('>') else {
                    continue;
                };
                let Some(close) = tokens
                    .get(statement.tokens.end)
                    .and_then(|token| token.close)
                    .and_then(|index| tokens.get(index))
                else {
                    continue;
                };
                let body = &source[end..close.bytes.end];
                match migrate_pattern(key, pattern, body) {
                    Ok(replacement)
                        if replacement != source[first.bytes.start..close.bytes.end] =>
                    {
                        add_edit(
                            &mut result,
                            source,
                            first.bytes.start,
                            close.bytes.end,
                            replacement,
                        )
                    }
                    Ok(_) => {}
                    Err(note) => result.notes.push(note),
                }
            }
            if let CssSyntaxKind::AtKeyword(name) = &first.kind
                && matches!(name.as_ref(), "compose" | "safelist" | "blocklist")
            {
                let body_start = first.bytes.end;
                let body = &source[body_start..end];
                let mut classes = Vec::new();
                for item in collect_class_list_token_ranges(body) {
                    let start = utf16_to_byte_offset(body, item.range.start).unwrap();
                    let finish = utf16_to_byte_offset(body, item.range.end).unwrap();
                    let raw = &body[start..finish];
                    let quote = raw
                        .chars()
                        .next()
                        .filter(|character| matches!(character, '\'' | '"'));
                    let class = if let Some(quote) = quote {
                        if raw.len() < 2 || !raw.ends_with(quote) {
                            result
                                .notes
                                .push("Quoted extraction pattern requires manual migration".into());
                            continue;
                        }
                        &raw[1..raw.len() - 1]
                    } else {
                        raw
                    };
                    if name == "blocklist" && (class.starts_with('/') || class.contains('*')) {
                        result.notes.push("Blocklist patterns must be reviewed against the new generated selectors".into());
                        continue;
                    }
                    match self.convert(class) {
                        Ok(after) => {
                            classes.push(after.clone());
                            let after = quote
                                .map_or(after.clone(), |quote| format!("{quote}{after}{quote}"));
                            if after != raw {
                                add_edit(
                                    &mut result,
                                    source,
                                    body_start + start,
                                    body_start + finish,
                                    after,
                                );
                            }
                        }
                        Err(note) => result.notes.push(note),
                    }
                }
                for (index, a) in classes.iter().enumerate() {
                    if classes[index + 1..].iter().any(|b| self.overlap(a, b)) {
                        result.notes.push(
                            "Directive contains overlapping declarations; review cascade order"
                                .into(),
                        );
                        break;
                    }
                }
            }
            if statement.has_block && prelude.contains("\\:") {
                result.notes.push("Generated selector reference requires manual migration and browser verification".into());
            }
        }
        result.edits.sort_by_key(|edit| edit.range.start);
        if result
            .edits
            .windows(2)
            .any(|pair| pair[0].range.end > pair[1].range.start)
        {
            result
                .notes
                .push("Nested migration edits require manual review".into());
        }
        result.notes.sort();
        result.notes.dedup();
        result
    }
}

fn add_edit(
    result: &mut RcStylesheetMigration,
    source: &str,
    start: usize,
    end: usize,
    after: String,
) {
    result.edits.push(RcMigrationEdit {
        range: SourceRange {
            start: byte_to_utf16_offset(source, start).unwrap(),
            end: byte_to_utf16_offset(source, end).unwrap(),
        },
        before: source[start..end].into(),
        after,
    });
}

fn migrate_pattern(key: &str, pattern: &str, body: &str) -> Result<String, String> {
    let members = pattern.split('|').map(str::trim).collect::<Vec<_>>();
    let namespaces = members
        .iter()
        .copied()
        .filter(|member| member.starts_with(['~', '=']))
        .collect::<Vec<_>>();
    // RC's raw color kind also admitted the color namespace implicitly.
    // Splitting it without an explicit token branch would lose that behavior.
    if members.contains(&"color")
        && !namespaces
            .iter()
            .any(|member| matches!(*member, "~color" | "=color"))
    {
        return Err(format!(
            "Custom utility {key}:<color> previously implied ~color; explicitly define {key}-<~color> and review native color behavior"
        ));
    }
    let raw = members
        .iter()
        .copied()
        .filter(|member| !member.starts_with(['~', '=']))
        .collect::<Vec<_>>();
    if namespaces.is_empty()
        && !raw
            .iter()
            .all(|kind| matches!(*kind, "number" | "color" | "image" | "*"))
    {
        return Ok(format!("{key}:<{pattern}>{body}"));
    }
    let mut definitions = Vec::new();
    if !namespaces.is_empty() {
        definitions.push(format!("{key}-<{}>{body}", namespaces.join("|")));
    }
    if !raw.is_empty() {
        let mut target = if key == "line-clamp" {
            "clamp-lines"
        } else {
            key
        }
        .to_owned();
        let property = mastercss_engine::builtin_key_aliases()
            .iter()
            .find_map(|(alias, property)| (*alias == key).then_some(*property))
            .unwrap_or(key);
        if mastercss_schema::is_native_css_property(property) {
            // Inspect a neutral managed name using the real directive parser.
            let neutral = format!("@utilities{{migration-raw:<{}>{body}}}", raw.join("|"));
            let parsed = compile_css_directives(&neutral, &CompileNativeCssOptions::default())
                .map_err(|err| err.to_string())?;
            let compiled =
                compile_manifest_input(&parsed.manifest_input, &CompileManifestOptions::default())
                    .map_err(|err| err.to_string())?;
            let rules = compiled.manifest["utilities"][0]["emit"]["rules"]
                .as_array()
                .ok_or("Cannot identify managed declarations")?;
            if rules.len() == 1
                && let Some(declarations) = rules[0]["declarations"].as_object()
                && declarations.len() == 1
                && declarations.values().all(|value| value.is_null())
            {
                target = declarations.keys().next().unwrap().clone();
            }
        }
        definitions.push(format!("{target}:<{}>{body}", raw.join("|")));
    }
    let result = definitions.join("\n");
    let source = format!("@utilities{{{result}}}");
    let parsed = compile_css_directives(&source, &CompileNativeCssOptions::default())
        .map_err(|err| err.to_string())?;
    compile_manifest_input(&parsed.manifest_input, &CompileManifestOptions::default())
        .map_err(|err| err.to_string())?;
    Ok(result)
}
