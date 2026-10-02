//! Convert the removed utility container as one reviewable source edit.
use super::{
    Migration,
    stylesheets::{RcStylesheetMigration, add_edit},
};
use mastercss_lexer::{CssSyntaxKind as Kind, collect_css_syntax_statements, tokenize_css_syntax};

fn parameter(body: &str, function: &str, value: &str) -> String {
    let tokens = tokenize_css_syntax(body);
    let mut edits = Vec::new();
    let mut index = 0;
    while index < tokens.len() {
        let token = &tokens[index];
        if matches!(&token.kind, Kind::Function(name) if name.eq_ignore_ascii_case("url")) {
            index = token.close.map_or(index + 1, |close| close + 1);
            continue;
        }
        if matches!(&token.kind, Kind::Function(name) if name == function)
            && let Some(close) = token.close
            && close == index + 1
        {
            edits.push(token.bytes.start..tokens[close].bytes.end);
        }
        index += 1;
    }
    let mut output = body.to_owned();
    for range in edits.into_iter().rev() {
        output.replace_range(range, value);
    }
    output
}

fn definition(name: &str, body: &str) -> Result<String, String> {
    let Some((prefix, members)) = name
        .split_once('<')
        .and_then(|(prefix, rest)| rest.strip_suffix('>').map(|rest| (prefix, rest)))
    else {
        if !mastercss_lexer::valid_utility_name(name) {
            return Err(format!(
                "Utility {name} requires a manual identifier migration"
            ));
        }
        return Ok(format!("@utility {name}{{{body}}}"));
    };
    let members = members.split('|').map(str::trim).collect::<Vec<_>>();
    let namespaces = members
        .iter()
        .copied()
        .filter(|name| name.starts_with(['~', '=']))
        .collect::<Vec<_>>();
    let raw = members
        .iter()
        .copied()
        .filter(|name| !name.starts_with(['~', '=']))
        .collect::<Vec<_>>();
    if !namespaces.is_empty() && !raw.is_empty() {
        return Err(format!(
            "Mixed raw and named family {name} requires manual migration to distinct utility names"
        ));
    }
    if prefix.ends_with(':') && !raw.is_empty() && !raw.contains(&"*") {
        return Err(format!(
            "Utility {name} has typed-only or enum acceptance; widening its domain requires review"
        ));
    }
    let key = prefix.trim_end_matches([':', '-']);
    if !namespaces.is_empty() {
        let value = parameter(body, "--value", "var(--value)");
        let definition = crate::mixins::definition("--migration(--value)", &value)?;
        if let Some((_, property)) = mastercss_engine::direct_value_mixin(&definition)
            && namespaces.len() == 1
        {
            let namespace = &namespaces[0][1..];
            return Ok(format!(
                "@utility {key}-(--{namespace}){{{property}:var(--{namespace})}}"
            ));
        }
        if namespaces.len() == 1 && &namespaces[0][1..] == key {
            let body = parameter(
                body,
                "--value",
                &format!("var(ident(\"--{key}-\" var(--{key})))"),
            );
            return Ok(format!("@utility {key}-(--{key} <string>){{{body}}}"));
        }
        return Err(format!(
            "Named family {name} needs same-name primary/alias tokens and a <string> token pattern; preserve cross-namespace priority explicitly"
        ));
    }
    if prefix.ends_with(':') {
        let key = if key == "line-clamp" {
            "clamp-lines"
        } else {
            key
        };
        let body = parameter(body, "--value", "var(--value)");
        let syntax = if [
            "grid-cols",
            "grid-rows",
            "grid-col-span",
            "grid-row-span",
            "clamp-lines",
        ]
        .contains(&key)
        {
            " <integer>"
        } else {
            ""
        };
        return Ok(format!("@utility {key}(--value{syntax}){{{body}}}"));
    }
    Ok(raw
        .into_iter()
        .map(|member| {
            let (key, value) = member.split_once('=').unwrap_or((member, member));
            format!(
                "@utility {prefix}{key}{{{}}}",
                parameter(body, "--value", value)
            )
        })
        .collect::<Vec<_>>()
        .join("\n"))
}

impl Migration {
    pub(super) fn utility_stylesheet(&self, source: &str, result: &mut RcStylesheetMigration) {
        let tokens = tokenize_css_syntax(source);
        let statements = collect_css_syntax_statements(&tokens);
        for (index, container) in statements.iter().enumerate() {
            let first = &tokens[container.tokens.start];
            if !matches!(&first.kind, Kind::AtKeyword(name) if name.eq_ignore_ascii_case("utilities"))
            {
                continue;
            }
            let Some(open) = tokens.get(container.tokens.end) else {
                continue;
            };
            let Some(close) = open.close.and_then(|index| tokens.get(index)) else {
                continue;
            };
            let mut definitions: Vec<(String, String, usize)> = Vec::new();
            let mut notes = Vec::new();
            for child in statements
                .iter()
                .filter(|statement| statement.parent == Some(index))
            {
                let first = &tokens[child.tokens.start];
                let open = &tokens[child.tokens.end];
                let Some(close) = open.close.and_then(|index| tokens.get(index)) else {
                    notes.push(
                        "Utility container contains a statement requiring manual migration".into(),
                    );
                    continue;
                };
                let name = source[first.bytes.start..open.bytes.start].trim();
                if matches!(first.kind, Kind::AtKeyword(_)) {
                    notes.push(
                        "Move native condition wrappers inside each @mixin definition".into(),
                    );
                    continue;
                }
                let body = &source[open.bytes.end..close.bytes.start];
                if let Some(previous) = definitions.last_mut().filter(|(previous, _, end)| {
                    previous == name
                        && !name.contains('<')
                        && source[*end..first.bytes.start].trim().is_empty()
                }) {
                    previous.1.push('\n');
                    previous.1.push_str(body);
                    previous.2 = close.bytes.end;
                } else if definitions.iter().any(|(previous, _, _)| {
                    previous == name
                        || name.contains(":<")
                            && previous.split(":<").next() == name.split(":<").next()
                }) {
                    notes.push(format!("Repeated or overloaded utility {name} requires a source-order review before whole-definition replacement"));
                } else {
                    definitions.push((name.into(), body.into(), close.bytes.end));
                }
            }
            let mut output = Vec::new();
            for (name, body, _) in definitions {
                match definition(&name, &body) {
                    Ok(css) => output.push(css),
                    Err(note) => notes.push(note),
                }
            }
            if notes.is_empty() {
                let output = output.join("\n");
                match crate::compile_css_directives(&output, &Default::default()) {
                    Ok(_) => add_edit(result, source, first.bytes.start, close.bytes.end, output),
                    Err(error) => notes.push(error.to_string()),
                }
            }
            result.notes.extend(notes);
        }
    }
}

/// Audit old containers before allowing whole-definition edits across files.
pub(super) fn legacy_definitions(source: &str) -> Vec<(String, String)> {
    let tokens = tokenize_css_syntax(source);
    let statements = collect_css_syntax_statements(&tokens);
    statements.iter().filter_map(|statement| {
        let parent = statement.parent.and_then(|index| statements.get(index))?;
        if !matches!(&tokens[parent.tokens.start].kind, Kind::AtKeyword(name) if name.eq_ignore_ascii_case("utilities")) || !statement.has_block { return None; }
        let name = source[tokens[statement.tokens.start].bytes.start..tokens[statement.tokens.end].bytes.start].trim().to_owned();
        let identity = name.split('<').next().unwrap_or(&name).to_owned();
        Some((identity, name))
    }).collect()
}
