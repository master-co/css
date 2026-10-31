use super::{
    CompilerError, CssDeclaration, CssDirectiveSourceReference, CssDirectiveStyleDefinition,
    EngineSession, MergedStyleDefinition,
};

fn append_style(output: &mut Vec<MergedStyleDefinition>, mut next: MergedStyleDefinition) {
    if next.declarations.is_empty() {
        return;
    }
    // Only adjacent rules with the same context may share a declaration block.
    // Keep *all* declarations: browser support and importance decide the winner.
    if let Some(previous) = output.last_mut()
        && previous.selector == next.selector
        && previous.conditions == next.conditions
    {
        previous.declarations.append(&mut next.declarations);
    } else {
        output.push(next);
    }
}

fn sourced_declarations(
    declarations: &[CssDeclaration],
    source: Option<&CssDirectiveSourceReference>,
) -> Vec<CssDeclaration> {
    declarations
        .iter()
        .cloned()
        .map(|mut declaration| {
            if declaration.source.is_none() {
                declaration.source = source.cloned();
            }
            declaration
        })
        .collect()
}

fn resolve_selector(engine: &EngineSession, selector: &str) -> Result<String, CompilerError> {
    engine
        .resolve_style_selector(selector)
        .map_err(|error| super::resolution::directive_error(error.to_string()))
}

/// Native style definitions in authored order with their `@apply` applications
/// expanded, adjacent rules of one selector and context sharing a block.
pub(super) fn create_merged_style_definitions(
    definitions: &[CssDirectiveStyleDefinition],
    engine: &EngineSession,
) -> Result<Vec<MergedStyleDefinition>, CompilerError> {
    let mut definitions = definitions.iter().collect::<Vec<_>>();
    definitions.sort_by_key(|definition| match definition {
        CssDirectiveStyleDefinition::Native { order, .. }
        | CssDirectiveStyleDefinition::Apply { order, .. } => *order,
    });
    let mut output = Vec::new();
    for definition in definitions {
        match definition {
            CssDirectiveStyleDefinition::Apply {
                selector,
                name,
                arguments,
                contents,
                selector_source,
                source,
                conditions,
                ..
            } => {
                let fail = |message: String| CompilerError::Directive {
                    message,
                    filename: source
                        .as_ref()
                        .and_then(|source| source.file.clone())
                        .unwrap_or_else(|| "stylesheet.css".into()),
                    range: source.as_ref().map(|source| source.range.clone()),
                };
                let arguments = arguments
                    .iter()
                    .map(mastercss_engine::evaluate_mixin_value)
                    .collect::<Result<Vec<_>, _>>()
                    .map_err(fail)?;
                let rules = engine
                    .expand_mixin_with_contents(name, &arguments, contents.as_deref())
                    .map_err(fail)?;
                for rule in rules {
                    let selector =
                        mastercss_lexer::replace_nesting_selector(&rule.selector, selector)
                            .unwrap_or_else(|| rule.selector.clone());
                    append_style(
                        &mut output,
                        MergedStyleDefinition {
                            selector_source: selector_source.clone().or_else(|| source.clone()),
                            selector: resolve_selector(engine, &selector)?,
                            conditions: conditions.iter().cloned().chain(rule.conditions).collect(),
                            declarations: rule
                                .declarations
                                .iter()
                                .map(|declaration| CssDeclaration {
                                    property: declaration.property.clone(),
                                    value: declaration.value.clone().into(),
                                    source: declaration.source.clone().or_else(|| source.clone()),
                                })
                                .collect(),
                        },
                    );
                }
            }
            CssDirectiveStyleDefinition::Native {
                selector,
                declarations,
                conditions,
                source,
                selector_source,
                ..
            } => append_style(
                &mut output,
                MergedStyleDefinition {
                    selector_source: selector_source.clone().or_else(|| source.clone()),
                    selector: resolve_selector(engine, selector)?,
                    conditions: conditions.clone(),
                    declarations: sourced_declarations(declarations, source.as_ref()),
                },
            ),
        }
    }
    Ok(output)
}
