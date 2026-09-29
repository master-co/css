use super::Migration;
use mastercss_lexer::{
    CssSyntaxKind, byte_to_utf16_offset, collect_class_list_token_ranges,
    collect_css_syntax_statements, tokenize_css_syntax, utf16_to_byte_offset,
};
use mastercss_schema::SourceRange;
use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RcStylesheetMigration {
    pub is_entry: bool,
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
    pub(super) fn stylesheet(
        &self,
        source: &str,
        file_index: usize,
        previous: &mut super::managed::PreviousStyles,
    ) -> RcStylesheetMigration {
        let tokens = tokenize_css_syntax(source);
        let statements = collect_css_syntax_statements(&tokens);
        let mut result = RcStylesheetMigration {
            is_entry: mastercss_lexer::has_master_css_manifest_entrypoint(source),
            edits: Vec::new(),
            notes: Vec::new(),
        };
        // Only declaration values were RC macros. A native function declaration
        // anywhere in the selected source set makes the name ambiguous.
        for statement in &statements {
            if matches!(
                self.profile,
                super::RcMigrationProfile::RcManaged
                    | super::RcMigrationProfile::RcUtilities
                    | super::RcMigrationProfile::RcSizing
            ) {
                break;
            }
            let Some(colon) = tokens
                .get(statement.tokens.start + 1)
                .filter(|token| token.kind == CssSyntaxKind::Delim(':'))
            else {
                continue;
            };
            let mut index = statement.tokens.start + 2;
            while index < statement.tokens.end {
                let token = &tokens[index];
                if matches!(&token.kind, CssSyntaxKind::Function(name) if name == "--alpha")
                    && token.bytes.start >= colon.bytes.end
                {
                    if self.native_alpha {
                        result.notes.push("Native @function --alpha collides with the RC macro; review all calls manually".into());
                        break;
                    }
                    if let Some(close) = token.close {
                        match super::native::alpha(
                            &source[token.bytes.end..tokens[close].bytes.start],
                        ) {
                            Ok(after) => add_edit(
                                &mut result,
                                source,
                                token.bytes.start,
                                tokens[close].bytes.end,
                                after,
                            ),
                            Err(note) => result.notes.push(note),
                        }
                    }
                }
                index += 1;
            }
        }
        for statement in &statements {
            let Some(first) = tokens.get(statement.tokens.start) else {
                continue;
            };
            let end = tokens
                .get(statement.tokens.end)
                .map_or(source.len(), |token| token.bytes.start);
            let prelude = &source[first.bytes.start..end];
            if statement.parent.is_none()
                && matches!(&first.kind, CssSyntaxKind::AtKeyword(name) if name.eq_ignore_ascii_case("master"))
                && statement.tokens.end == statement.tokens.start + 2
                && matches!(&tokens[statement.tokens.start + 1].kind, CssSyntaxKind::Ident(name) if name.eq_ignore_ascii_case("entry"))
                && !statement.has_block
            {
                result.is_entry = true;
                let import_preamble = statements.iter().take_while(|prior| prior.tokens.start < statement.tokens.start).filter(|prior| prior.parent.is_none()).all(|prior| {
                    matches!(&tokens[prior.tokens.start].kind, CssSyntaxKind::AtKeyword(name)
                        if name.eq_ignore_ascii_case("charset") || name.eq_ignore_ascii_case("import")
                            || name.eq_ignore_ascii_case("layer") && !prior.has_block)
                });
                if !import_preamble {
                    result.notes.push("Move the replacement @import to the CSS import preamble; this @master entry follows other rules".into());
                    continue;
                }
                let end = tokens
                    .get(statement.tokens.end)
                    .filter(|token| token.kind == CssSyntaxKind::Delim(';'))
                    .map_or(end, |token| token.bytes.end);
                add_edit(
                    &mut result,
                    source,
                    first.bytes.start,
                    end,
                    "@import \"@master/css\";".into(),
                );
            } else if matches!(&first.kind, CssSyntaxKind::AtKeyword(name) if name.eq_ignore_ascii_case("master"))
            {
                result.notes.push("Only a top-level @master entry can migrate automatically; replace this removed directive manually".into());
            }
            if matches!(&first.kind, CssSyntaxKind::AtKeyword(name) if name.eq_ignore_ascii_case("dark") || name.eq_ignore_ascii_case("light"))
                || matches!(&first.kind, CssSyntaxKind::AtKeyword(name) if name.eq_ignore_ascii_case("variant"))
                    && !matches!(
                        tokens
                            .get(statement.tokens.start + 1)
                            .map(|token| &token.kind),
                        Some(CssSyntaxKind::Ident(_))
                    )
            {
                result.notes.push("Replace removed mode/query directives with explicit native CSS conditions or @mixin with @apply and @contents".into());
            }
            if matches!(&first.kind, CssSyntaxKind::AtKeyword(name) if matches!(name.as_ref(), "custom-variant" | "variant" | "slot"))
            {
                result.notes.push("Variants were removed: migrate media wrappers to @custom-media and other wrappers to @mixin/@apply/@contents. Move any layer branches to explicit call-site @layer blocks or @layer(...) suffixes before conversion".into());
            }
            if let CssSyntaxKind::AtKeyword(name) = &first.kind
                && (name.eq_ignore_ascii_case("mode") || name.eq_ignore_ascii_case("theme"))
            {
                let block_end = tokens
                    .get(statement.tokens.end)
                    .and_then(|token| token.close)
                    .and_then(|close| tokens.get(close))
                    .map_or(end, |token| token.bytes.end);
                let valid = crate::compile_css_directives(
                    &source[first.bytes.start..block_end],
                    &Default::default(),
                )
                .is_ok();
                if !valid {
                    result.notes.push(format!("Review @{name} manually: use explicit native theme selectors and @mixin with @apply and @contents; inline/static and managed modes are removed"));
                }
            }

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
            if matches!(parent.map(|token| &token.kind), Some(CssSyntaxKind::AtKeyword(name)) if name == "settings")
                && let CssSyntaxKind::Ident(name) = &first.kind
                && matches!(
                    name.as_ref(),
                    "root-size" | "mode-trigger" | "default-mode" | "modes"
                )
            {
                let actual = prelude
                    .split_once(':')
                    .map(|(_, value)| value.trim())
                    .unwrap_or_default();
                let key = match name.as_ref() {
                    "root-size" => "rootSize",
                    "mode-trigger" => "modeTrigger",
                    "default-mode" => "defaultMode",
                    _ => "modes",
                };
                let saved = self
                    .original
                    .get("settings")
                    .and_then(|settings| settings.get(key));
                let matches = if key == "rootSize" {
                    actual.parse::<f64>().ok() == Some(self.root_size)
                } else if key == "modes" {
                    let names: Vec<_> = actual
                        .split(|character: char| character == ',' || character.is_whitespace())
                        .filter(|name| !name.is_empty())
                        .collect();
                    names == self.modes.iter().map(String::as_str).collect::<Vec<_>>()
                } else {
                    saved
                        .and_then(serde_json::Value::as_str)
                        .unwrap_or(if key == "modeTrigger" {
                            "media"
                        } else {
                            "light"
                        })
                        == actual
                };
                if matches {
                    let end = tokens
                        .get(statement.tokens.end)
                        .filter(|token| token.kind == CssSyntaxKind::Delim(';'))
                        .map_or(end, |token| token.bytes.end);
                    add_edit(&mut result, source, first.bytes.start, end, String::new());
                } else {
                    result.notes.push(format!(
                        "CSS {name} does not match the saved RC configuration"
                    ));
                }
            }
            if matches!(&first.kind, CssSyntaxKind::AtKeyword(name) if name.eq_ignore_ascii_case("compose"))
            {
                result.notes.push(format!("UTF-16 {}: @compose has been removed; replace it with native CSS declarations/selectors or use utilities in markup", byte_to_utf16_offset(source, first.bytes.start).unwrap()));
                continue;
            }
            if matches!(&first.kind, CssSyntaxKind::AtKeyword(name) if matches!(name.as_ref(), "custom-variant" | "variant" | "slot"))
            {
                result.notes.push("Variants were removed: migrate media wrappers to @custom-media and other wrappers to @mixin/@apply/@contents. Move any layer branches to explicit call-site @layer blocks or @layer(...) suffixes before conversion".into());
            }
            if let CssSyntaxKind::AtKeyword(name) = &first.kind
                && matches!(name.as_ref(), "safelist" | "blocklist")
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
                    if let Some(managed) = self.managed_reference(class) {
                        let line = source[..body_start + start]
                            .bytes()
                            .filter(|byte| *byte == b'\n')
                            .count()
                            + 1;
                        if name == "safelist" || name == "blocklist" {
                            result.notes.push(format!("line {line}, UTF-16 {}: @{name} references removed managed class `{managed}`; write native declarations/selectors, or explicitly extract shared behavior into @utility after reviewing its layer and emission", byte_to_utf16_offset(source, body_start + start).unwrap()));
                            continue;
                        }
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
        // Collapse fully migrated settings as one edit; never leave a removed empty at-rule.
        for statement in &statements {
            let first = &tokens[statement.tokens.start];
            if !matches!(&first.kind, CssSyntaxKind::AtKeyword(name) if name.eq_ignore_ascii_case("settings"))
            {
                continue;
            }
            let Some(open) = tokens.get(statement.tokens.end) else {
                continue;
            };
            let Some(close) = open.close.and_then(|index| tokens.get(index)) else {
                continue;
            };
            let start = byte_to_utf16_offset(source, open.bytes.end).unwrap();
            let end = byte_to_utf16_offset(source, close.bytes.start).unwrap();
            let mut body = source[open.bytes.end..close.bytes.start].to_owned();
            let mut edits = result
                .edits
                .iter()
                .filter(|edit| edit.range.start >= start && edit.range.end <= end)
                .collect::<Vec<_>>();
            edits.sort_by_key(|edit| edit.range.start);
            for edit in edits.into_iter().rev() {
                let from = utf16_to_byte_offset(&body, edit.range.start - start).unwrap();
                let to = utf16_to_byte_offset(&body, edit.range.end - start).unwrap();
                body.replace_range(from..to, &edit.after);
            }
            if tokenize_css_syntax(&body).is_empty() {
                result
                    .edits
                    .retain(|edit| edit.range.start < start || edit.range.end > end);
                add_edit(
                    &mut result,
                    source,
                    first.bytes.start,
                    close.bytes.end,
                    String::new(),
                );
            } else {
                result.notes.push("Remaining @settings declarations require native CSS or per-class ! before removing the container".into());
            }
        }
        self.managed_stylesheet(source, &mut result, file_index, previous);
        self.utility_stylesheet(source, &mut result);
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

pub(super) fn add_edit(
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
