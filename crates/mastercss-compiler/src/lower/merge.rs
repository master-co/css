use super::resolution::{
    combine_style_selectors, composition_rules, directive_diagnostic, resolve_configured_branches,
};
use super::{
    CompilerError, CssDirectiveConditionPathEntry, CssDirectiveStyleDefinition,
    EngineCompositionRuleIr, EngineSession, ErrorCode, HashMap, Map, MergedStyleDefinition,
    Ordering, ResolvedStyleBranch, RulePriorityIr, StyleConditionFeature, StyleMergeBucket,
    StyleMergeEvent, UtilityLayerName, Value, natural_compare,
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
) {
    let key = bucket_key(&branch.selector, &branch.conditions, branch.layer);
    if let Some((_, bucket)) = buckets.iter_mut().find(|(current, _)| *current == key) {
        bucket.order = bucket.order.min(event.order());
        bucket.events.push(event);
        return;
    }
    buckets.push((
        key,
        StyleMergeBucket {
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
        .then_with(|| natural_compare(&left.key, &right.key))
}

pub(super) fn compare_features(left: &RulePriorityIr, right: &RulePriorityIr) -> Ordering {
    for index in 0..left.features.len().max(right.features.len()) {
        let Some(left) = left.features.get(index) else {
            return Ordering::Less;
        };
        let Some(right) = right.features.get(index) else {
            return Ordering::Greater;
        };
        let order = natural_compare(&left.0, &right.0)
            .then_with(|| {
                (right.2 - right.1)
                    .partial_cmp(&(left.2 - left.1))
                    .unwrap_or(Ordering::Equal)
            })
            .then_with(|| right.1.partial_cmp(&left.1).unwrap_or(Ordering::Equal))
            .then_with(|| right.2.partial_cmp(&left.2).unwrap_or(Ordering::Equal));
        if order != Ordering::Equal {
            return order;
        }
    }
    Ordering::Equal
}

pub(super) fn style_condition_features(
    conditions: &[String],
    root_size: f64,
) -> Vec<StyleConditionFeature> {
    let mut features: HashMap<String, (Option<f64>, Option<f64>)> = HashMap::new();
    for condition in conditions {
        for (name, operator, mut value, unit) in parse_style_condition_features(condition) {
            if unit == "px" {
                value /= root_size;
            }
            let entry = features.entry(name.to_owned()).or_default();
            match operator {
                ">" => entry.0 = Some(value + 0.02),
                ">=" => entry.0 = Some(value),
                "<" => entry.1 = Some(value - 0.02),
                "<=" => entry.1 = Some(value),
                _ => {}
            }
        }
    }
    let mut features = features
        .into_iter()
        .map(|(name, (min, max))| {
            (
                name,
                min.unwrap_or(0.0),
                max.unwrap_or(9_007_199_254_740_991.0),
            )
        })
        .collect::<Vec<_>>();
    features.sort_by(|left, right| natural_compare(&left.0, &right.0));
    features
}

pub(super) fn parse_style_condition_features(condition: &str) -> Vec<(&str, &str, f64, &str)> {
    let bytes = condition.as_bytes();
    let mut features = Vec::new();
    let mut search_start = 0;
    while let Some(relative_start) = condition[search_start..].find('(') {
        let start = search_start + relative_start;
        let mut index = start + 1;
        skip_ascii_whitespace(bytes, &mut index);
        let Some(name) = ["width", "height", "resolution"]
            .into_iter()
            .find(|name| condition[index..].starts_with(name))
        else {
            search_start = start + 1;
            continue;
        };
        index += name.len();
        skip_ascii_whitespace(bytes, &mut index);
        let Some(operator) = [">=", "<=", ">", "<"]
            .into_iter()
            .find(|operator| condition[index..].starts_with(operator))
        else {
            search_start = start + 1;
            continue;
        };
        index += operator.len();
        skip_ascii_whitespace(bytes, &mut index);
        let number_start = index;
        if bytes.get(index) == Some(&b'-') {
            index += 1;
        }
        let integer_start = index;
        while bytes.get(index).is_some_and(u8::is_ascii_digit) {
            index += 1;
        }
        let integer_digits = index - integer_start;
        let mut fraction_digits = 0;
        if bytes.get(index) == Some(&b'.') {
            index += 1;
            let fraction_start = index;
            while bytes.get(index).is_some_and(u8::is_ascii_digit) {
                index += 1;
            }
            fraction_digits = index - fraction_start;
        }
        if integer_digits == 0 && fraction_digits == 0 {
            search_start = start + 1;
            continue;
        }
        let Ok(value) = condition[number_start..index].parse::<f64>() else {
            search_start = start + 1;
            continue;
        };
        let unit_start = index;
        while bytes
            .get(index)
            .is_some_and(|byte| byte.is_ascii_lowercase() || *byte == b'%')
        {
            index += 1;
        }
        let unit = &condition[unit_start..index];
        skip_ascii_whitespace(bytes, &mut index);
        if bytes.get(index) != Some(&b')') {
            search_start = start + 1;
            continue;
        }
        features.push((name, operator, value, unit));
        search_start = index + 1;
    }
    features
}

pub(super) fn skip_ascii_whitespace(bytes: &[u8], index: &mut usize) {
    while bytes.get(*index).is_some_and(u8::is_ascii_whitespace) {
        *index += 1;
    }
}

pub(super) fn compare_style_condition_features(
    left: &[StyleConditionFeature],
    right: &[StyleConditionFeature],
) -> Ordering {
    for index in 0..left.len().max(right.len()) {
        let Some(left) = left.get(index) else {
            return Ordering::Less;
        };
        let Some(right) = right.get(index) else {
            return Ordering::Greater;
        };
        let order = natural_compare(&left.0, &right.0)
            .then_with(|| {
                (right.2 - right.1)
                    .partial_cmp(&(left.2 - left.1))
                    .unwrap_or(Ordering::Equal)
            })
            .then_with(|| right.1.partial_cmp(&left.1).unwrap_or(Ordering::Equal))
            .then_with(|| right.2.partial_cmp(&left.2).unwrap_or(Ordering::Equal));
        if order != Ordering::Equal {
            return order;
        }
    }
    Ordering::Equal
}

pub(super) fn compare_style_merge_buckets(
    left: &StyleMergeBucket,
    right: &StyleMergeBucket,
    root_size: f64,
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
            let left_features = style_condition_features(&left.conditions, root_size);
            let right_features = style_condition_features(&right.conditions, root_size);
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

pub(super) fn merged_bucket(bucket: StyleMergeBucket) -> Option<MergedStyleDefinition> {
    let mut declarations = Map::new();
    let mut compose_batch: Vec<(u32, EngineCompositionRuleIr)> = Vec::new();
    let flush = |batch: &mut Vec<(u32, EngineCompositionRuleIr)>,
                 declarations: &mut Map<String, Value>| {
        batch.sort_by(|(left_order, left), (right_order, right)| {
            compare_rule_priority(left, right).then_with(|| left_order.cmp(right_order))
        });
        for (_, rule) in batch.drain(..) {
            apply_declarations(declarations, &rule.declarations);
        }
    };
    let mut events = bucket.events;
    events.sort_by_key(StyleMergeEvent::order);
    for event in events {
        match event {
            StyleMergeEvent::Compose { order, rule } => compose_batch.push((order, rule)),
            StyleMergeEvent::Native {
                declarations: incoming,
                ..
            } => {
                flush(&mut compose_batch, &mut declarations);
                apply_declarations(&mut declarations, &incoming);
            }
        }
    }
    flush(&mut compose_batch, &mut declarations);
    (!declarations.is_empty()).then_some(MergedStyleDefinition {
        selector: bucket.selector,
        declarations,
        conditions: bucket.conditions,
    })
}

pub(super) fn create_merged_style_definitions(
    definitions: &[CssDirectiveStyleDefinition],
    engine: &mut EngineSession,
    target_layer: Option<UtilityLayerName>,
    root_size: f64,
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
                                order: *order,
                                rule: rule.clone(),
                            },
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
                            order: *order,
                            declarations: declarations.clone(),
                        },
                    );
                }
            }
        }
    }
    buckets.sort_by(|(_, left), (_, right)| compare_style_merge_buckets(left, right, root_size));
    Ok(buckets
        .into_iter()
        .filter_map(|(_, bucket)| merged_bucket(bucket))
        .collect())
}
