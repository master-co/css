use crate::source_index::SourceIndex;
use mastercss_lexer::{CssSyntaxKind, collect_css_syntax_statements, tokenize_css_syntax};
use mastercss_schema::{CssCompositionTrace, CssUtilitySource};

pub(crate) fn collect(source: &str, filename: &str) -> Vec<CssUtilitySource> {
    let index = SourceIndex::new(source);
    let tokens = tokenize_css_syntax(source);
    let statements = collect_css_syntax_statements(&tokens);
    statements
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
                        return Some(CssUtilitySource {
                            name,
                            source: index.reference(filename, first.bytes.start, end)?,
                        });
                    }
                    CssSyntaxKind::AtKeyword(_) => parent = statements[p].parent,
                    _ => return None,
                }
            }
            None
        })
        .collect()
}

pub(crate) fn attach(trace: &mut CssCompositionTrace, definitions: &[CssUtilitySource]) {
    for name in &trace.resolved_utilities {
        for definition in definitions {
            if *name == definition.name && !trace.definition_sources.contains(&definition.source) {
                trace.definition_sources.push(definition.source.clone());
            }
        }
    }
}
