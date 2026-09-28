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
        CssDirectiveStyleDefinition::Native { order, .. } => *order,
    });
    let mut output = Vec::new();
    let mut index = 0;
    while index < definitions.len() {
        match definitions[index] {
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
