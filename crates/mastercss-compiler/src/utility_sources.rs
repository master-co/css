use crate::source_index::SourceIndex;
use mastercss_lexer::{CssSyntaxKind, collect_css_syntax_statements, tokenize_css_syntax};
use mastercss_schema::{CssCompositionTrace, CssUtilitySource};

pub(crate) fn collect(source: &str, filename: &str) -> Vec<CssUtilitySource> {
    let index = SourceIndex::new(source);
    let tokens = tokenize_css_syntax(source);
    let statements = collect_css_syntax_statements(&tokens);
    let mut definitions = statements
        .iter()
        .filter_map(|statement| {
            if !statement.has_block || statement.tokens.is_empty() {
                return None;
            }
            let first = &tokens[statement.tokens.start];
            if matches!(first.kind, CssSyntaxKind::AtKeyword(_)) {
                return None;
            }
            let mut parent = statement.parent;
            while let Some(p) = parent {
                match &tokens[statements[p].tokens.start].kind {
                    CssSyntaxKind::AtKeyword(name) if name == "utilities" => {
                        let end = tokens[statement.tokens.end - 1].bytes.end;
                        let name = if statement.tokens.len() == 1 {
                            if let CssSyntaxKind::Ident(name) = &first.kind {
                                name.to_string()
                            } else {
                                return None;
                            }
                        } else {
                            source[first.bytes.start..end].to_owned()
                        };
                        let mut ancestor = statement.parent;
                        let mut layer = mastercss_schema::UtilityLayerName::Utilities;
                        while let Some(a) = ancestor {
                            let ancestor_statement = &statements[a];
                            if matches!(&tokens[ancestor_statement.tokens.start].kind, CssSyntaxKind::AtKeyword(name) if name == "layer") {
                                let layer_token = tokens[ancestor_statement.tokens.clone()].iter().find_map(|token| if let CssSyntaxKind::Ident(name) = &token.kind { Some(name.as_ref()) } else { None });
                                if let Some(name) = layer_token { layer = serde_json::from_value(serde_json::json!(name)).unwrap_or(layer); }
                            }
                            ancestor = ancestor_statement.parent;
                        }
                        let definition = crate::pattern::parse_managed_pattern(&name).ok()
                            .map(|pattern| serde_json::Value::Object(pattern.definition(layer)))
                            .unwrap_or_else(|| serde_json::json!({"type":"static", "name":name, "layer":layer}));
                        let canonical_name = definition["name"].as_str().unwrap_or(&name).to_owned();
                        return Some(CssUtilitySource {
                            name: canonical_name,
                            identity: crate::utility_definitions::identity(&definition),
                            replaced_by: None,
                            source: index.reference(filename, first.bytes.start, end)?,
                        });
                    }
                    CssSyntaxKind::AtKeyword(_) => parent = statements[p].parent,
                    _ => return None,
                }
            }
            None
        })
        .collect::<Vec<_>>();
    resolve(&mut definitions);
    definitions
}

pub(crate) fn resolve(definitions: &mut [CssUtilitySource]) {
    let mut latest = std::collections::HashMap::new();
    for definition in definitions.iter_mut().rev() {
        let identity = if definition.identity.is_empty() {
            &definition.name
        } else {
            &definition.identity
        };
        definition.replaced_by = latest.get(identity).cloned();
        latest
            .entry(identity.clone())
            .or_insert_with(|| definition.source.clone());
    }
}

pub(crate) fn attach(trace: &mut CssCompositionTrace, definitions: &[CssUtilitySource]) {
    trace.definition_sources.clear();
    for name in &trace.resolved_utilities {
        for definition in definitions {
            if definition.replaced_by.is_none()
                && *name == definition.name
                && !trace.definition_sources.contains(&definition.source)
            {
                trace.definition_sources.push(definition.source.clone());
            }
        }
    }
}
