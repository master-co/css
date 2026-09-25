//! Final migration stage shared by every RC profile. This is the only authoring
//! path that still accepts managed defaults/components definitions.
use super::{
    Migration,
    stylesheets::{RcStylesheetMigration, add_edit},
};
use mastercss_lexer::{
    CssSyntaxKind, collect_css_syntax_statements, css_escape, tokenize_css_syntax,
};

pub(super) fn names(sources: &[String], manifest: &serde_json::Value) -> Vec<String> {
    let mut names = Vec::new();
    for utility in manifest["utilities"].as_array().into_iter().flatten() {
        if !matches!(utility["layer"].as_str(), Some("defaults" | "components")) {
            continue;
        }
        for matcher in utility["matchers"].as_array().into_iter().flatten() {
            if let Some(name) = matcher["name"].as_str().or(matcher["prefix"].as_str()) {
                names.push(name.to_owned());
            }
        }
    }
    for source in sources {
        let tokens = tokenize_css_syntax(source);
        let statements = collect_css_syntax_statements(&tokens);
        for statement in &statements {
            if !statement.has_block || statement.tokens.is_empty() {
                continue;
            }
            let mut parent = statement.parent;
            while let Some(index) = parent {
                match &tokens[statements[index].tokens.start].kind {
                    CssSyntaxKind::AtKeyword(name)
                        if matches!(name.as_ref(), "defaults" | "components") =>
                    {
                        if let CssSyntaxKind::Ident(name) = &tokens[statement.tokens.start].kind {
                            names.push(name.to_string());
                        }
                        break;
                    }
                    CssSyntaxKind::AtKeyword(_) => parent = statements[index].parent,
                    _ => break,
                }
            }
        }
    }
    names.sort();
    names.dedup();
    names
}

pub(super) type PreviousStyles = Vec<(String, String, Vec<String>, String)>;

impl Migration {
    pub(super) fn managed_reference(&self, class: &str) -> Option<&str> {
        self.managed_names
            .iter()
            .find(|name| {
                class == name.as_str()
                    || class
                        .strip_prefix(name.as_str())
                        .is_some_and(|tail| tail.starts_with([':', '@', '!', '>', '_', '[']))
            })
            .map(String::as_str)
    }

    pub(super) fn managed_stylesheet(
        &self,
        source: &str,
        result: &mut RcStylesheetMigration,
        file_index: usize,
        previous: &mut PreviousStyles,
    ) {
        let tokens = tokenize_css_syntax(source);
        let statements = collect_css_syntax_statements(&tokens);
        let position = |start: usize| {
            let prefix = &source[..start];
            format!(
                "{}:{}",
                prefix.bytes().filter(|byte| *byte == b'\n').count() + 1,
                prefix
                    .rsplit('\n')
                    .next()
                    .unwrap_or_default()
                    .encode_utf16()
                    .count()
                    + 1
            )
        };
        for (index, statement) in statements.iter().enumerate() {
            let first = &tokens[statement.tokens.start];
            if let CssSyntaxKind::AtKeyword(name) = &first.kind
                && matches!(name.as_ref(), "defaults" | "components")
            {
                if statement.has_block {
                    add_edit(
                        result,
                        source,
                        first.bytes.start,
                        first.bytes.end,
                        format!("@layer {name}"),
                    );
                } else {
                    result.notes.push(format!(
                        "{}: @{name} requires manual migration to native @layer",
                        position(first.bytes.start)
                    ));
                }
                continue;
            }
            // Find a managed ancestor, but stop once inside a named style rule.
            let mut parent = statement.parent;
            let mut layer = None;
            while let Some(index) = parent {
                let ancestor = &statements[index];
                match &tokens[ancestor.tokens.start].kind {
                    CssSyntaxKind::AtKeyword(name)
                        if matches!(name.as_ref(), "defaults" | "components") =>
                    {
                        layer = Some(name.to_string());
                        break;
                    }
                    CssSyntaxKind::AtKeyword(_) => parent = ancestor.parent,
                    _ => break,
                }
            }
            let Some(layer) = layer else { continue };
            if matches!(&first.kind, CssSyntaxKind::AtKeyword(_)) {
                continue;
            }
            let end = tokens
                .get(statement.tokens.end)
                .map_or(source.len(), |token| token.bytes.start);
            let prelude = source[first.bytes.start..end].trim();
            if !statement.has_block || statement.tokens.len() != 1 {
                result.notes.push(format!("{}: managed pattern or selector `{prelude}` needs explicit native selectors and variants; retain reusable behavior in @utilities only after reviewing its layer", position(first.bytes.start)));
                continue;
            }
            let CssSyntaxKind::Ident(name) = &first.kind else {
                result.notes.push(format!(
                    "{}: review managed name `{prelude}` manually",
                    position(first.bytes.start)
                ));
                continue;
            };
            add_edit(
                result,
                source,
                first.bytes.start,
                first.bytes.end,
                format!(".{}", css_escape(name)),
            );
            let properties = statements
                .iter()
                .filter(|child| {
                    let mut parent = child.parent;
                    while let Some(ancestor) = parent {
                        if ancestor == index {
                            return true;
                        }
                        parent = statements[ancestor].parent;
                    }
                    false
                })
                .filter_map(|child| match &tokens[child.tokens.start].kind {
                    CssSyntaxKind::Ident(name) if child.declaration => Some(name.to_string()),
                    CssSyntaxKind::AtKeyword(name) if name == "compose" => Some("all".into()),
                    _ => None,
                })
                .collect::<Vec<_>>();
            for (other_layer, other_name, other_properties, location) in previous.iter() {
                if other_layer == &layer
                    && (other_name == name.as_ref()
                        || properties.iter().any(|property| {
                            other_properties
                                .iter()
                                .any(|other| super::properties_overlap(property, other))
                        }))
                {
                    result.notes.push(format!("{}: `{name}` overlaps `{other_name}` at {}; native @layer {layer} uses source order. Review elements using both classes and shorthand/longhand conflicts against the saved CSS", position(first.bytes.start), location));
                }
            }
            previous.push((
                layer,
                name.to_string(),
                properties,
                format!(
                    "stylesheet {}, {}",
                    file_index + 1,
                    position(first.bytes.start)
                ),
            ));
        }
    }
}
