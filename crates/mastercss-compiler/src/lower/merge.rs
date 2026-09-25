use super::resolution::{
    combine_style_selectors, composition_rules, directive_diagnostic, resolve_configured_branches,
};
use super::{
    CompilerError, CssDirectiveConditionPathEntry, CssDirectiveSourceReference,
    CssDirectiveStyleDefinition, EngineCompositionRuleIr, EngineSession, ErrorCode, HashMap, Map,
    MergedStyleDefinition, Ordering, ResolvedStyleBranch, RulePriorityIr, StyleConditionFeature,
    StyleMergeBucket, StyleMergeEvent, UtilityLayerName, Value, natural_compare,
};

pub(super) fn bucket_key(
    selector: &str,
    conditions: &[String],
    layer: Option<UtilityLayerName>,
) -> String {
    serde_json::to_string(&(layer, selector, conditions)).expect("style bucket key serializes")
}

pub(super) fn push_style_event(
    buckets: &mut Vec<(String, StyleMergeBucket)>,
    branch: ResolvedStyleBranch,
    event: StyleMergeEvent,
    selector_source: Option<CssDirectiveSourceReference>,
) {
    let key = bucket_key(&branch.selector, &branch.conditions, branch.layer);
    if let Some((_, bucket)) = buckets.iter_mut().find(|(current, _)| *current == key) {
        if event.order() < bucket.order || bucket.selector_source.is_none() {
            bucket.selector_source = selector_source;
        }
        bucket.order = bucket.order.min(event.order());
        bucket.events.push(event);
        return;
    }
    buckets.push((
        key,
        StyleMergeBucket {
            selector_source,
            selector: branch.selector,
            conditions: branch.conditions,
            layer: branch.layer,
            order: event.order(),
            events: vec![event],
        },
    ));
}

pub(super) fn is_important(value: &Value) -> bool {
    value
        .as_str()
        .is_some_and(|value| value.trim().ends_with("!important"))
}

pub(super) fn apply_declarations(target: &mut Map<String, Value>, incoming: &Map<String, Value>) {
    for (property, value) in incoming {
        if target.get(property).is_some_and(is_important) && !is_important(value) {
            continue;
        }
        target.shift_remove(property);
        target.insert(property.clone(), value.clone());
    }
}

pub(super) fn compare_rule_priority(
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

pub(super) fn compare_features(left: &RulePriorityIr, right: &RulePriorityIr) -> Ordering {
    mastercss_engine::compare_condition_features(&left.features, &right.features)
        .then_with(|| left.conditions.cmp(&right.conditions))
}

pub(super) fn style_condition_features(conditions: &[String]) -> Vec<StyleConditionFeature> {
    mastercss_engine::condition_priority(
        &conditions
            .iter()
            .map(|condition| {
                let kind = condition
                    .trim_start_matches('@')
                    .split_whitespace()
                    .next()
                    .unwrap_or_default();
                (kind.to_owned(), condition.clone())
            })
            .collect::<Vec<_>>(),
    )
    .0
}

pub(super) fn compare_style_condition_features(
    left: &[StyleConditionFeature],
    right: &[StyleConditionFeature],
) -> Ordering {
    mastercss_engine::compare_condition_features(left, right)
}

pub(super) fn compare_style_merge_buckets(
    left: &StyleMergeBucket,
    right: &StyleMergeBucket,
) -> Ordering {
    let left_layer = left.layer.unwrap_or(UtilityLayerName::Components);
    let right_layer = right.layer.unwrap_or(UtilityLayerName::Components);
    if left_layer == right_layer && left.selector == right.selector {
        let left_conditioned = !left.conditions.is_empty();
        let right_conditioned = !right.conditions.is_empty();
        if left_conditioned != right_conditioned {
            return left_conditioned.cmp(&right_conditioned);
        }
        if left_conditioned {
            let left_features = style_condition_features(&left.conditions);
            let right_features = style_condition_features(&right.conditions);
            if !left_features.is_empty() && !right_features.is_empty() {
                let order = compare_style_condition_features(&left_features, &right_features);
                if order != Ordering::Equal {
                    return order;
                }
            }
        }
    }
    left.order.cmp(&right.order)
}

fn apply_declarations_with_sources(
    target: &mut Map<String, Value>,
    sources: &mut HashMap<String, CssDirectiveSourceReference>,
    incoming: &Map<String, Value>,
    source: Option<&CssDirectiveSourceReference>,
) {
    for (property, value) in incoming {
        if target.get(property).is_some_and(is_important) && !is_important(value) {
            continue;
        }
        if let Some(source) = source {
            sources.insert(property.clone(), source.clone());
        } else {
            sources.remove(property);
        }
    }
    apply_declarations(target, incoming);
}

pub(super) fn merged_bucket(bucket: StyleMergeBucket) -> Option<MergedStyleDefinition> {
    let mut declarations = Map::new();
    let mut declaration_sources = HashMap::new();
    let mut compose_batch: Vec<(
        u32,
        EngineCompositionRuleIr,
        Option<CssDirectiveSourceReference>,
    )> = Vec::new();
    let flush = |batch: &mut Vec<(
        u32,
        EngineCompositionRuleIr,
        Option<CssDirectiveSourceReference>,
    )>,
                 declarations: &mut Map<String, Value>,
                 sources: &mut HashMap<String, CssDirectiveSourceReference>| {
        batch.sort_by(|(left_order, left, _), (right_order, right, _)| {
            compare_rule_priority(left, right).then_with(|| left_order.cmp(right_order))
        });
        for (_, rule, source) in batch.drain(..) {
            apply_declarations_with_sources(
                declarations,
                sources,
                &rule.declarations,
                source.as_ref(),
            );
        }
    };
    let mut events = bucket.events;
    events.sort_by_key(StyleMergeEvent::order);
    for event in events {
        match event {
            StyleMergeEvent::Compose {
                order,
                rule,
                source,
            } => compose_batch.push((order, rule, source)),
            StyleMergeEvent::Native {
                declarations: incoming,
                source,
                ..
            } => {
                flush(
                    &mut compose_batch,
                    &mut declarations,
                    &mut declaration_sources,
                );
                apply_declarations_with_sources(
                    &mut declarations,
                    &mut declaration_sources,
                    &incoming,
                    source.as_ref(),
                );
            }
        }
    }
    flush(
        &mut compose_batch,
        &mut declarations,
        &mut declaration_sources,
    );
    (!declarations.is_empty()).then_some(MergedStyleDefinition {
        selector_source: bucket.selector_source,
        declaration_sources,
        selector: bucket.selector,
        declarations,
        conditions: bucket.conditions,
    })
}

pub(super) fn create_merged_style_definitions(
    definitions: &[CssDirectiveStyleDefinition],
    engine: &mut EngineSession,
    target_layer: Option<UtilityLayerName>,
) -> Result<Vec<MergedStyleDefinition>, CompilerError> {
    let mut buckets = Vec::new();
    for definition in definitions {
        match definition {
            CssDirectiveStyleDefinition::Compose {
                order,
                class_name,
                selector,
                conditions,
                condition_path,
                layer,
                source,
                selector_source,
                ..
            } => {
                let rules = composition_rules(engine, class_name)?;
                if rules.is_empty() {
                    return Err(directive_diagnostic(
                        ErrorCode::InvalidComposeClass,
                        format!("Invalid @compose class: {class_name}"),
                        source.as_ref(),
                    ));
                }
                for rule in rules {
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
                    let combined_selector = combine_style_selectors(selector, &rule.selector);
                    for branch in resolve_configured_branches(
                        &path,
                        engine,
                        &combined_selector,
                        target_layer.or(*layer).or(rule.explicit_layer),
                    )? {
                        push_style_event(
                            &mut buckets,
                            branch,
                            StyleMergeEvent::Compose {
                                source: source.clone(),
                                order: *order,
                                rule: rule.clone(),
                            },
                            selector_source.clone().or_else(|| source.clone()),
                        );
                    }
                }
            }
            CssDirectiveStyleDefinition::Native {
                order,
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
                    push_style_event(
                        &mut buckets,
                        branch,
                        StyleMergeEvent::Native {
                            source: source.clone(),
                            order: *order,
                            declarations: declarations.clone(),
                        },
                        selector_source.clone().or_else(|| source.clone()),
                    );
                }
            }
        }
    }
    buckets.sort_by(|(_, left), (_, right)| compare_style_merge_buckets(left, right));
    Ok(buckets
        .into_iter()
        .filter_map(|(_, bucket)| merged_bucket(bucket))
        .collect())
}
