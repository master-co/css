use super::*;

impl ClassDescriptor {
    pub(crate) fn unknown(class_name: &str) -> Self {
        Self {
            class_name: class_name.to_owned(),
            matched: false,
            rule: None,
            rule_count: 0,
            valid_for_conflicts: false,
            properties: Vec::new(),
            declarations: Vec::new(),
            group: UNKNOWN_PROPERTY_GROUP_ORDER,
            property_order: UNKNOWN_PROPERTY_ORDER,
            type_order: 0,
        }
    }

    pub(crate) fn new(
        class_name: &str,
        rule: Option<GeneratedRuleIr>,
        rule_count: usize,
        valid_for_conflicts: bool,
    ) -> Self {
        let Some(rule) = rule else {
            return Self::unknown(class_name);
        };
        let declarations = collect_rule_declarations(&rule.text);
        let mut properties = declarations
            .iter()
            .map(|(property, _)| property.clone())
            .collect::<Vec<_>>();
        properties.sort();
        properties.dedup();
        let (group, property_order) = properties
            .iter()
            .map(|property| get_property_order(property))
            .min()
            .unwrap_or((UNKNOWN_PROPERTY_GROUP_ORDER, UNKNOWN_PROPERTY_ORDER));
        let type_order = if rule.utility_type == -2 && !has_dynamic_value(class_name) {
            0
        } else if rule.utility_type == -2 {
            1
        } else {
            2
        };
        Self {
            class_name: class_name.to_owned(),
            matched: true,
            rule: Some(rule),
            rule_count,
            valid_for_conflicts,
            properties,
            declarations,
            group,
            property_order,
            type_order,
        }
    }
}

pub(crate) fn sort_descriptors(descriptors: &[ClassDescriptor]) -> Vec<String> {
    let mut seen = HashSet::new();
    let mut descriptors = descriptors
        .iter()
        .filter(|descriptor| seen.insert(descriptor.class_name.clone()))
        .cloned()
        .collect::<Vec<_>>();
    descriptors.sort_by(compare_descriptors);
    descriptors
        .into_iter()
        .map(|descriptor| descriptor.class_name)
        .collect()
}

pub(crate) fn compare_descriptors(left: &ClassDescriptor, right: &ClassDescriptor) -> Ordering {
    match (&left.rule, &right.rule) {
        (None, None) => return left.class_name.cmp(&right.class_name),
        (None, Some(_)) => return Ordering::Greater,
        (Some(_), None) => return Ordering::Less,
        _ => {}
    }
    let left_rule = left.rule.as_ref().expect("known descriptor has a rule");
    let right_rule = right.rule.as_ref().expect("known descriptor has a rule");
    layer_order(left_rule.layer)
        .cmp(&layer_order(right_rule.layer))
        .then_with(|| left_rule.sort_tier.cmp(&right_rule.sort_tier))
        .then_with(|| {
            compare_condition_features(&left_rule.priority.features, &right_rule.priority.features)
        })
        .then_with(|| {
            left_rule
                .priority
                .selector
                .cmp(&right_rule.priority.selector)
        })
        .then_with(|| (left.group, left.property_order).cmp(&(right.group, right.property_order)))
        .then_with(|| left.type_order.cmp(&right.type_order))
        .then_with(|| left_rule.utility_type.cmp(&right_rule.utility_type))
        .then_with(|| natural_compare(&left_rule.key, &right_rule.key))
        .then_with(|| left.class_name.cmp(&right.class_name))
}

pub(crate) fn find_conflicts(descriptors: &[ClassDescriptor]) -> Vec<ClassConflictIr> {
    let mut conflicts = Vec::new();
    for (index, descriptor) in descriptors.iter().enumerate() {
        if !descriptor.valid_for_conflicts {
            continue;
        }
        let Some(rule) = descriptor.rule.as_ref() else {
            continue;
        };
        let mut last_conflict = None;
        for compare in &descriptors[index + 1..] {
            if !compare.valid_for_conflicts {
                continue;
            }
            let Some(compare_rule) = compare.rule.as_ref() else {
                continue;
            };
            if descriptor.properties == compare.properties
                && equal_variant_scope(rule, compare_rule)
            {
                last_conflict = Some(compare.class_name.clone());
            }
        }
        if let Some(conflict) = last_conflict {
            conflicts.push(ClassConflictIr {
                class_name: descriptor.class_name.clone(),
                conflicts: vec![conflict],
            });
        }
    }
    conflicts
}

pub(crate) fn equal_variant_scope(left: &GeneratedRuleIr, right: &GeneratedRuleIr) -> bool {
    left.layer == right.layer
        && branch_key(&left.key) == branch_key(&right.key)
        && left.sort_tier == right.sort_tier
        && left.priority == right.priority
}

pub(crate) fn branch_key(key: &str) -> &str {
    key.split_once('\0').map_or("", |(_, branch)| branch)
}

pub(crate) fn has_dynamic_value(class_name: &str) -> bool {
    let mut depth = 0_u32;
    for character in class_name.chars() {
        match character {
            '{' | '[' | '(' => depth += 1,
            '}' | ']' | ')' => depth = depth.saturating_sub(1),
            ':' if depth == 0 => return true,
            _ => {}
        }
    }
    false
}

pub(crate) fn layer_order(layer: UtilityLayerName) -> u8 {
    match layer {
        UtilityLayerName::Base => 1,
        UtilityLayerName::Defaults => 2,
        UtilityLayerName::Components => 3,
        UtilityLayerName::Utilities => 4,
    }
}

pub(crate) fn collect_rule_declarations(text: &str) -> Vec<(String, String)> {
    let mut declarations = Vec::new();
    let mut stack = Vec::new();
    let mut quote = None;
    let mut escaped = false;
    for (index, character) in text.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if character == '\\' {
            escaped = true;
            continue;
        }
        if let Some(current_quote) = quote {
            if character == current_quote {
                quote = None;
            }
            continue;
        }
        if matches!(character, '\'' | '"') {
            quote = Some(character);
            continue;
        }
        if character == '{' {
            stack.push(index + 1);
        } else if character == '}'
            && let Some(start) = stack.pop()
            && !text[start..index].contains('{')
        {
            for declaration in split_top_level(&text[start..index], ';') {
                let Some((property, value)) = declaration.split_once(':') else {
                    continue;
                };
                let property = property.trim();
                let value = value
                    .trim()
                    .strip_suffix("!important")
                    .unwrap_or(value.trim());
                if !property.is_empty()
                    && !declarations
                        .iter()
                        .any(|entry: &(String, String)| entry.0 == property && entry.1 == value)
                {
                    declarations.push((property.to_owned(), value.to_owned()));
                }
            }
        }
    }
    declarations.sort();
    declarations
}

pub(crate) fn split_top_level(source: &str, separator: char) -> Vec<&str> {
    let mut values = Vec::new();
    let mut start = 0;
    let mut depth = 0_u32;
    let mut quote = None;
    let mut escaped = false;
    for (index, character) in source.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if character == '\\' {
            escaped = true;
            continue;
        }
        if let Some(current_quote) = quote {
            if character == current_quote {
                quote = None;
            }
            continue;
        }
        if matches!(character, '\'' | '"') {
            quote = Some(character);
        } else if matches!(character, '(' | '[') {
            depth += 1;
        } else if matches!(character, ')' | ']') {
            depth = depth.saturating_sub(1);
        } else if depth == 0 && character == separator {
            values.push(&source[start..index]);
            start = index + character.len_utf8();
        }
    }
    values.push(&source[start..]);
    values
}
