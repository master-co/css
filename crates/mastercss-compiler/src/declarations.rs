use super::{CompilerError, CssDeclaration, DeclarationBlock, PrinterOptions, Value};
use serde_json::Map;

/// CSS declarations are a sequence, not a property-to-value dictionary. In
/// particular, an unrecognized later value must not erase an earlier fallback.
pub(crate) fn collect_ordered_declarations(
    block: &DeclarationBlock<'_>,
    filename: &str,
) -> Result<Vec<CssDeclaration>, CompilerError> {
    let mut output = Vec::new();
    for (declarations, important) in [
        (&block.declarations, false),
        (&block.important_declarations, true),
    ] {
        for declaration in declarations {
            let print_error = |error: super::PrinterError| CompilerError::Print {
                message: error.to_string(),
                filename: filename.to_owned(),
            };
            let property = super::declaration_name(declaration).map_err(print_error)?;
            let mut value = declaration
                .value_to_css_string(PrinterOptions::default())
                .map_err(print_error)?;
            if important {
                value.push_str(" !important");
            }
            output.push(CssDeclaration {
                property,
                value: Value::String(value),
                source: None,
            });
        }
    }
    Ok(output)
}

/// Manifest v1 already has ordered rules. Start another rule at a repeated
/// property instead of changing its map-based declaration representation.
pub(crate) fn declaration_runs(declarations: Vec<CssDeclaration>) -> Vec<Map<String, Value>> {
    let mut runs = Vec::new();
    let mut run = Map::new();
    for declaration in declarations {
        if run.contains_key(&declaration.property) {
            runs.push(std::mem::take(&mut run));
        }
        run.insert(declaration.property, declaration.value);
    }
    if !run.is_empty() {
        runs.push(run);
    }
    runs
}

pub(crate) fn preserve_ordered_literal_spelling(
    source: &str,
    start: usize,
    declarations: &mut [CssDeclaration],
) {
    let Some(open) = source[start..].find('{').map(|offset| start + offset) else {
        return;
    };
    let Some(end) = super::css_block_end(source, open, source.len()) else {
        return;
    };
    preserve_raw_declarations(&source[open + 1..end], declarations);
}

pub(crate) fn preserve_ordered_declaration_sequence(
    source: &str,
    start: usize,
    declarations: &mut [CssDeclaration],
) {
    use mastercss_lexer::{CssSyntaxKind, collect_css_syntax_statements, tokenize_css_syntax};
    let tokens = tokenize_css_syntax(source);
    let statements = collect_css_syntax_statements(&tokens);
    let start = statements
        .iter()
        .find(|statement| {
            statement.declaration
                && tokens[statement.tokens.start].bytes.start <= start
                && tokens[statement.tokens.end - 1].bytes.end >= start
        })
        .map_or(start, |statement| {
            tokens[statement.tokens.start].bytes.start
        });
    let remaining = &source[start..];
    let tokens = tokenize_css_syntax(remaining);
    let mut depth = 0usize;
    let mut end = remaining.len();
    for token in tokens {
        match token.kind {
            CssSyntaxKind::Delim('{') => depth += 1,
            CssSyntaxKind::Delim('}') if depth == 0 => {
                end = token.bytes.start;
                break;
            }
            CssSyntaxKind::Delim('}') => depth -= 1,
            _ => {}
        }
    }
    preserve_raw_declarations(&remaining[..end], declarations);
}

fn preserve_raw_declarations(source: &str, declarations: &mut [CssDeclaration]) {
    use mastercss_lexer::{CssSyntaxKind, collect_css_syntax_statements, tokenize_css_syntax};
    // Declarations require a rule body in the CSS lexer.
    let wrapped = format!("x{{{source}}}");
    let source = wrapped.as_str();
    let tokens = tokenize_css_syntax(source);
    let statements = collect_css_syntax_statements(&tokens);
    let raw = statements.iter().filter(|statement| statement.declaration && statement.parent == Some(0))
        .filter_map(|statement| {
            let CssSyntaxKind::Ident(property) = &tokens[statement.tokens.start].kind else { return None };
            let last = &tokens[statement.tokens.end - 1];
            let important = matches!(&last.kind, CssSyntaxKind::Ident(value) if value.eq_ignore_ascii_case("important"))
                && statement.tokens.len() >= 3
                && tokens[statement.tokens.end - 2].kind == CssSyntaxKind::Delim('!');
            let start = tokens[statement.tokens.start + 1].bytes.end;
            let end = if important { tokens[statement.tokens.end - 2].bytes.start } else { last.bytes.end };
            Some((property.as_ref(), source[start..end].trim(), important))
        }).collect::<Vec<_>>();
    let mut used = std::collections::HashSet::new();
    let mut ranks = Vec::new();
    for declaration in declarations.iter_mut() {
        let important = declaration
            .value
            .as_str()
            .is_some_and(|value| value.ends_with("!important"));
        let Some((index, (_, value, _))) =
            raw.iter()
                .enumerate()
                .find(|(index, (property, _, raw_important))| {
                    !used.contains(index)
                        && (if property.starts_with("--") {
                            *property == declaration.property
                        } else {
                            property.eq_ignore_ascii_case(&declaration.property)
                        })
                        && *raw_important == important
                })
        else {
            return;
        };
        used.insert(index);
        ranks.push(index);
        if crate::syntax::simple_ratio_literal(value)
            || crate::syntax::scientific_dimension_literal(value)
        {
            let mut value: String = value.split_whitespace().collect();
            if important {
                value.push_str(" !important");
            }
            declaration.value = Value::String(value);
        }
    }
    let mut ordered = ranks
        .into_iter()
        .zip(declarations.iter().cloned())
        .collect::<Vec<_>>();
    ordered.sort_by_key(|(rank, _)| *rank);
    for (target, (_, declaration)) in declarations.iter_mut().zip(ordered) {
        *target = declaration;
    }
}
