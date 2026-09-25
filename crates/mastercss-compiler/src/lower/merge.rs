use super::resolution::{
    combine_style_selectors, composition_rules, directive_diagnostic, resolve_configured_branches,
};
use super::{
    CompilerError, CssDeclaration, CssDirectiveConditionPathEntry, CssDirectiveSourceReference,
    CssDirectiveStyleDefinition, EngineCompositionRuleIr, EngineSession, ErrorCode,
    MergedStyleDefinition, Ordering, RulePriorityIr, UtilityLayerName, natural_compare,
};

fn compare_rule_priority(
    left: &EngineCompositionRuleIr,
    right: &EngineCompositionRuleIr,
) -> Ordering {
    left.sort_tier
        .cmp(&right.sort_tier)
        .then_with(|| compare_features(&left.priority, &right.priority))
        .then_with(|| left.priority.selector.cmp(&right.priority.selector))
        .then_with(|| left.utility_type.cmp(&right.utility_type))
        .then_with(|| {
            left.priority
                .value_priority
                .cmp(&right.priority.value_priority)
        })
        .then_with(|| natural_compare(&left.priority.sort_key, &right.priority.sort_key))
        .then_with(|| natural_compare(&left.key, &right.key))
}

fn compare_features(left: &RulePriorityIr, right: &RulePriorityIr) -> Ordering {
    mastercss_engine::compare_condition_features(&left.features, &right.features)
        .then_with(|| left.conditions.cmp(&right.conditions))
}

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
        | CssDirectiveStyleDefinition::Compose { order, .. } => *order,
    });
    let mut output = Vec::new();
    let mut index = 0;
    while index < definitions.len() {
        match definitions[index] {
            CssDirectiveStyleDefinition::Compose { order, .. } => {
                let statement_order = *order;
                let mut expanded = Vec::new();
                while let Some(CssDirectiveStyleDefinition::Compose {
                    order,
                    class_name,
                    selector,
                    conditions,
                    condition_path,
                    layer,
                    source,
                    selector_source,
                    ..
                }) = definitions.get(index).copied()
                {
                    if *order != statement_order {
                        break;
                    }
                    let rules = composition_rules(engine, class_name)?;
                    if rules.is_empty() {
                        return Err(directive_diagnostic(
                            ErrorCode::InvalidComposeClass,
                            format!(
                                "Invalid @compose utility: {class_name}. Native CSS classes are not utility definitions"
                            ),
                            source.as_ref(),
                        ));
                    }
                    for rule in rules {
                        if rule.explicit_layer.is_some() {
                            return Err(directive_diagnostic(
                                ErrorCode::InvalidComposeLayer,
                                "@compose cannot change layers; use native @layer around the destination rule",
                                source.as_ref(),
                            ));
                        }
                        let mut path = condition_path.clone().unwrap_or_else(|| {
                            conditions
                                .clone()
                                .unwrap_or_default()
                                .into_iter()
                                .map(|value| CssDirectiveConditionPathEntry::Condition { value })
                                .collect()
                        });
                        path.extend(
                            rule.conditions
                                .iter()
                                .cloned()
                                .map(|value| CssDirectiveConditionPathEntry::Condition { value }),
                        );
                        let combined = combine_style_selectors(selector, &rule.selector);
                        let destination_layer = target_layer.or(*layer);
                        for branch in resolve_configured_branches(
                            &path,
                            engine,
                            &combined,
                            destination_layer,
                        )? {
                            if branch.layer != destination_layer {
                                return Err(directive_diagnostic(
                                    ErrorCode::InvalidComposeLayer,
                                    "@compose cannot change layers; use native @layer around the destination rule",
                                    source.as_ref(),
                                ));
                            }
                            expanded.push((
                                rule.clone(),
                                MergedStyleDefinition {
                                    selector_source: selector_source
                                        .clone()
                                        .or_else(|| source.clone()),
                                    selector: branch.selector,
                                    conditions: branch.conditions,
                                    declarations: sourced_declarations(
                                        &rule.declarations,
                                        source.as_ref(),
                                    ),
                                },
                            ));
                        }
                    }
                    index += 1;
                }
                expanded.sort_by(|(left, _), (right, _)| compare_rule_priority(left, right));
                for (_, style) in expanded {
                    append_style(&mut output, style);
                }
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
