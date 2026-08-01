use super::*;

pub(crate) fn build_canonical_recommendation_index(
    manifest: &Value,
    engine: &EngineSession,
) -> Result<CanonicalRecommendationIndex, EngineError> {
    let mut index = CanonicalRecommendationIndex::default();
    for (alias, property) in builtin_key_aliases() {
        push_index_value(&mut index.preferred_aliases_by_property, property, alias);
    }
    for aliases in index.preferred_aliases_by_property.values_mut() {
        aliases.sort_by(|left, right| left.len().cmp(&right.len()).then_with(|| left.cmp(right)));
    }
    for property in builtin_native_value_properties() {
        for alias in index
            .preferred_aliases_by_property
            .get(property)
            .cloned()
            .unwrap_or_default()
        {
            push_index_value(
                &mut index.variable_keys_by_property_signature,
                property,
                &alias,
            );
        }
        push_index_value(
            &mut index.variable_keys_by_property_signature,
            property,
            property,
        );
    }

    for utility in manifest
        .get("utilities")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(Value::as_object)
    {
        let property_signatures = manifest_utility_property_signatures(utility);
        for matcher in utility
            .get("matchers")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .filter_map(Value::as_object)
        {
            let matcher_type = matcher.get("type").and_then(Value::as_str);
            if matcher_type == Some("variable") {
                for key in matcher
                    .get("keys")
                    .and_then(Value::as_array)
                    .into_iter()
                    .flatten()
                    .filter_map(Value::as_str)
                {
                    for signature in &property_signatures {
                        push_index_value(
                            &mut index.variable_keys_by_property_signature,
                            signature,
                            key,
                        );
                    }
                }
            }

            if utility.get("type").and_then(Value::as_i64) != Some(-2)
                || utility
                    .get("layer")
                    .and_then(Value::as_str)
                    .is_some_and(|layer| layer != "utilities")
            {
                continue;
            }
            let mut names = Vec::new();
            match matcher_type {
                Some("static") => {
                    if let Some(name) = matcher.get("name").and_then(Value::as_str) {
                        names.push(name.to_owned());
                    }
                }
                Some("pattern") => {
                    let prefix = matcher
                        .get("prefix")
                        .and_then(Value::as_str)
                        .unwrap_or_default();
                    names.extend(
                        matcher
                            .get("values")
                            .and_then(Value::as_array)
                            .into_iter()
                            .flatten()
                            .filter_map(Value::as_str)
                            .map(|value| format!("{prefix}{value}")),
                    );
                }
                _ => {}
            }
            for name in names {
                if name.contains(':') {
                    continue;
                }
                let rules = engine.inspect(&name)?.rules;
                if rules.is_empty()
                    || rules
                        .iter()
                        .any(|rule| rule.layer != UtilityLayerName::Utilities)
                {
                    continue;
                }
                push_index_value(
                    &mut index.static_candidates_by_signature,
                    &rules_declaration_signature(&rules),
                    &name,
                );
            }
        }
    }
    for values in index.static_candidates_by_signature.values_mut() {
        values.sort_by(|left, right| left.len().cmp(&right.len()).then_with(|| left.cmp(right)));
    }
    for values in index.variable_keys_by_property_signature.values_mut() {
        values.sort_by(|left, right| left.len().cmp(&right.len()).then_with(|| left.cmp(right)));
    }

    index.root_size = manifest
        .get("settings")
        .and_then(|settings| settings.get("rootSize"))
        .and_then(Value::as_f64)
        .unwrap_or(16.0);
    index.base_unit = manifest
        .get("settings")
        .and_then(|settings| settings.get("baseUnit"))
        .and_then(Value::as_f64)
        .unwrap_or(4.0);

    index.modes.extend(
        manifest
            .get("settings")
            .and_then(|settings| settings.get("modes"))
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .filter_map(Value::as_str)
            .map(str::to_owned),
    );
    if index.modes.is_empty() {
        index.modes.extend(["light".into(), "dark".into()]);
    }
    index.breakpoints.extend(
        manifest
            .get("breakpointConditions")
            .and_then(Value::as_object)
            .into_iter()
            .flat_map(|conditions| conditions.keys().cloned()),
    );
    Ok(index)
}

pub(crate) fn rules_declaration_signature(rules: &[GeneratedRuleIr]) -> String {
    let mut signatures = rules
        .iter()
        .map(|rule| {
            serde_json::to_string(&collect_rule_declarations(&rule.text)).unwrap_or_default()
        })
        .collect::<Vec<_>>();
    signatures.sort();
    signatures.join("\0")
}

pub(crate) fn declaration_property_signature(rule: &GeneratedRuleIr) -> String {
    let mut properties = collect_rule_declarations(&rule.text)
        .into_iter()
        .map(|(property, _)| property)
        .collect::<Vec<_>>();
    properties.sort();
    properties.dedup();
    properties.join("\0")
}

pub(crate) fn canonical_class_parts(
    class_name: &str,
    semantics: &ClassSemanticInspection,
) -> CanonicalClassParts {
    let key = semantics
        .key_token
        .as_deref()
        .map(|key| key.trim_end_matches(':').to_owned());
    let value = semantics.value_token.clone();
    let base_end = if let (Some(key_token), Some(value_token)) =
        (&semantics.key_token, &semantics.value_token)
    {
        (key_token.len() + value_token.len()).min(class_name.len())
    } else {
        let semantic = class_name.strip_suffix('!').unwrap_or(class_name);
        let mut end = semantics
            .state_token
            .as_deref()
            .filter(|state| semantic.ends_with(*state))
            .map_or(semantic.len(), |state| semantic.len() - state.len());
        if semantic.as_bytes().get(end.wrapping_sub(1)) == Some(&b'!') {
            end = end.saturating_sub(1);
        }
        end
    };
    CanonicalClassParts {
        base: class_name[..base_end].to_owned(),
        suffix: class_name[base_end..].to_owned(),
        key,
        value,
    }
}

pub(crate) fn safe_breakpoint_name<'a>(
    token: &'a str,
    breakpoints: &HashSet<String>,
) -> Option<&'a str> {
    let name = token
        .strip_prefix(">=")
        .or_else(|| token.strip_prefix("<="))
        .or_else(|| token.strip_prefix('>'))
        .or_else(|| token.strip_prefix('<'))
        .unwrap_or(token);
    (!name.is_empty()
        && name
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '_' | '-'))
        && breakpoints.contains(name))
    .then_some(name)
}

pub(crate) fn canonical_condition_suffix(
    parts: &CanonicalClassParts,
    semantics: &ClassSemanticInspection,
    rules: &[GeneratedRuleIr],
    index: &CanonicalRecommendationIndex,
    options: &CanonicalClassNameOptions,
) -> String {
    if !options.prefer_condition_order
        || rules
            .iter()
            .any(|rule| rule.layer != UtilityLayerName::Utilities)
    {
        return parts.suffix.clone();
    }
    let Some(state_token) = semantics.state_token.as_deref() else {
        return parts.suffix.clone();
    };
    if !state_token.contains('@') {
        return parts.suffix.clone();
    }
    let state_parts = split_top_level(state_token, '@');
    if state_parts.len() <= 2 || state_parts.iter().skip(1).any(|part| part.is_empty()) {
        return parts.suffix.clone();
    }
    let selector_prefix = state_parts[0];
    let mut mode = None;
    let mut breakpoints = Vec::new();
    for condition in state_parts.into_iter().skip(1) {
        let is_mode = index.modes.contains(condition);
        let is_breakpoint = safe_breakpoint_name(condition, &index.breakpoints).is_some();
        if is_mode && is_breakpoint {
            return parts.suffix.clone();
        }
        if is_mode {
            if mode.is_some() {
                return parts.suffix.clone();
            }
            mode = Some(condition);
        } else if is_breakpoint {
            breakpoints.push(condition);
        } else {
            return parts.suffix.clone();
        }
    }
    let Some(mode) = mode else {
        return parts.suffix.clone();
    };
    if breakpoints.is_empty() {
        return parts.suffix.clone();
    }
    let canonical_state = format!(
        "{selector_prefix}{}@{mode}",
        breakpoints
            .iter()
            .map(|condition| format!("@{condition}"))
            .collect::<String>()
    );
    if canonical_state == state_token {
        return parts.suffix.clone();
    }
    format!(
        "{}{canonical_state}",
        if semantics.important { "!" } else { "" }
    )
}

pub(crate) fn push_canonical_candidate(
    candidates: &mut Vec<CanonicalCandidate>,
    candidate_base: &str,
    parts: &CanonicalClassParts,
    suffix: &str,
    order: u8,
) {
    if candidate_base.is_empty() || (candidate_base == parts.base && suffix == parts.suffix) {
        return;
    }
    let class_name = format!("{candidate_base}{suffix}");
    if candidates
        .iter()
        .any(|candidate| candidate.class_name == class_name)
    {
        return;
    }
    candidates.push(CanonicalCandidate { class_name, order });
}

pub(crate) fn canonical_variable_candidate_keys(
    index: &CanonicalRecommendationIndex,
    signature: &str,
    source_key: &str,
    matched: &MatchingVariableKeys,
    prefer_property_aliases: bool,
) -> Vec<String> {
    let mut keys = vec![source_key.to_owned()];
    for key in index
        .variable_keys_by_property_signature
        .get(signature)
        .into_iter()
        .flatten()
    {
        if !keys.contains(key) {
            keys.push(key.clone());
        }
    }
    if !prefer_property_aliases {
        let aliases = index
            .preferred_aliases_by_property
            .get(signature)
            .cloned()
            .unwrap_or_default();
        keys.retain(|key| key == source_key || !aliases.contains(key));
    }
    if !matched.numeric {
        keys.retain(|key| key == source_key || signature == source_key);
    }
    keys
}

pub(crate) fn css_variable_reference_name(value: &str) -> Option<&str> {
    value
        .strip_prefix("var(--")
        .and_then(|value| value.strip_suffix(')'))
        .filter(|name| {
            !name.is_empty()
                && name.chars().all(|character| {
                    character.is_ascii_alphanumeric() || matches!(character, '_' | '-')
                })
        })
}

pub(crate) fn normalized_numeric_value(
    value: &str,
    root_size: f64,
    base_unit: f64,
) -> Option<(bool, f64)> {
    let split = value
        .char_indices()
        .find(|(_, character)| character.is_ascii_alphabetic() || *character == '%')
        .map_or(value.len(), |(index, _)| index);
    let number = value[..split].parse::<f64>().ok()?;
    match value[split..].to_ascii_lowercase().as_str() {
        "" => Some((false, number)),
        "rem" => Some((true, number)),
        "px" if root_size != 0.0 => Some((true, number / root_size)),
        "x" if root_size != 0.0 => Some((true, number * base_unit / root_size)),
        _ => None,
    }
}

pub(crate) fn numeric_values_match(
    left: &str,
    right: &str,
    root_size: f64,
    base_unit: f64,
) -> bool {
    let (Some(left), Some(right)) = (
        normalized_numeric_value(left, root_size, base_unit),
        normalized_numeric_value(right, root_size, base_unit),
    ) else {
        return false;
    };
    left.0 == right.0 && (left.1 - right.1).abs() < 0.000001
}

pub(crate) fn resolved_rule_declarations(
    rule: &GeneratedRuleIr,
    variable_values: &HashMap<String, String>,
) -> Vec<(String, String)> {
    collect_rule_declarations(&rule.text)
        .into_iter()
        .map(|(property, mut value)| {
            for variable_name in &rule.variable_names {
                if let Some(variable_value) = variable_values.get(variable_name) {
                    value = value.replace(
                        &format!("var(--{variable_name})"),
                        &normalize_css_variable_value(variable_value),
                    );
                }
            }
            (property, normalize_css_variable_value(&value))
        })
        .collect()
}

pub(crate) fn declarations_match_after_variable_resolution(
    source: &[GeneratedRuleIr],
    candidate: &[GeneratedRuleIr],
    variable_values: &HashMap<String, String>,
) -> bool {
    if source.len() != candidate.len() {
        return false;
    }
    let mut source = source
        .iter()
        .map(|rule| resolved_rule_declarations(rule, variable_values))
        .collect::<Vec<_>>();
    let mut candidate = candidate
        .iter()
        .map(|rule| resolved_rule_declarations(rule, variable_values))
        .collect::<Vec<_>>();
    source.sort();
    candidate.sort();
    source == candidate
}

pub(crate) fn has_same_canonical_rule_shape(
    source: &[GeneratedRuleIr],
    candidate: &[GeneratedRuleIr],
) -> bool {
    if source.len() != candidate.len() {
        return false;
    }
    let mut remaining = candidate.iter().collect::<Vec<_>>();
    for source_rule in source {
        let source_signature = declaration_property_signature(source_rule);
        let Some(index) = remaining.iter().position(|candidate_rule| {
            candidate_rule.layer == source_rule.layer
                && candidate_rule.priority == source_rule.priority
                && declaration_property_signature(candidate_rule) == source_signature
        }) else {
            return false;
        };
        remaining.remove(index);
    }
    true
}
