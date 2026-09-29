use super::resolution::resolve_configured_branches;
use super::{
    CompilerError, CssDeclaration, CssDirectiveConditionPathEntry, CssDirectiveSourceReference,
    CssDirectiveStyleDefinition, EngineSession, MergedStyleDefinition, UtilityLayerName,
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

pub(super) fn create_merged_style_definitions(
    definitions: &[CssDirectiveStyleDefinition],
    engine: &mut EngineSession,
    target_layer: Option<UtilityLayerName>,
) -> Result<Vec<MergedStyleDefinition>, CompilerError> {
    let mut definitions = definitions.iter().collect::<Vec<_>>();
    definitions.sort_by_key(|definition| match definition {
        CssDirectiveStyleDefinition::Native { order, .. }
        | CssDirectiveStyleDefinition::Apply { order, .. } => *order,
    });
    let mut output = Vec::new();
    let mut index = 0;
    while index < definitions.len() {
        match definitions[index] {
            CssDirectiveStyleDefinition::Apply {
                selector,
                name,
                arguments,
                contents,
                selector_source,
                source,
                condition_path,
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
                    .map(|value| mastercss_engine::evaluate_mixin_value(value, &Default::default()))
                    .collect::<Result<Vec<_>, _>>()
                    .map_err(fail)?;
                let rules = engine
                    .expand_mixin_with_contents(name, &arguments, contents.as_deref())
                    .map_err(fail)?;
                for rule in rules {
                    let selector =
                        mastercss_lexer::replace_nesting_selector(&rule.selector, selector)
                            .unwrap_or_else(|| rule.selector.clone());
                    let mut path = condition_path.clone().unwrap_or_default();
                    path.extend(rule.conditions.into_iter().map(|condition| {
                        CssDirectiveConditionPathEntry::Condition { value: condition }
                    }));
                    for branch in
                        resolve_configured_branches(&path, engine, &selector, target_layer)?
                    {
                        append_style(
                            &mut output,
                            MergedStyleDefinition {
                                selector_source: selector_source.clone().or_else(|| source.clone()),
                                selector: branch.selector,
                                conditions: branch.conditions,
                                declarations: rule
                                    .declarations
                                    .iter()
                                    .map(|declaration| CssDeclaration {
                                        property: declaration.property.clone(),
                                        value: declaration.value.clone().into(),
                                        source: declaration
                                            .source
                                            .clone()
                                            .or_else(|| source.clone()),
                                    })
                                    .collect(),
                            },
                        );
                    }
                }
                index += 1;
            }
            CssDirectiveStyleDefinition::Native {
                selector,
                declarations,
                conditions,
                condition_path,
                layer,
                source,
                selector_source,
                ..
            } => {
                let path = condition_path.clone().unwrap_or_else(|| {
                    conditions
                        .clone()
                        .unwrap_or_default()
                        .into_iter()
                        .map(|value| CssDirectiveConditionPathEntry::Condition { value })
                        .collect()
                });
                for branch in
                    resolve_configured_branches(&path, engine, selector, target_layer.or(*layer))?
                {
                    append_style(
                        &mut output,
                        MergedStyleDefinition {
                            selector_source: selector_source.clone().or_else(|| source.clone()),
                            selector: branch.selector,
                            conditions: branch.conditions,
                            declarations: sourced_declarations(declarations, source.as_ref()),
                        },
                    );
                }
                index += 1;
            }
        }
    }
    Ok(output)
}
