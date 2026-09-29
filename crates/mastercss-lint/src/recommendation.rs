use super::{
    CanonicalCandidate, CanonicalClassParts, CanonicalRecommendationIndex, ClassSemanticInspection,
    EngineError, EngineSession, GeneratedRuleIr, UtilityLayerName, Value, builtin_token_aliases,
    collect_rule_declarations, push_index_value,
};

pub(crate) fn build_canonical_recommendation_index(
    manifest: &Value,
    engine: &EngineSession,
) -> Result<CanonicalRecommendationIndex, EngineError> {
    let mut index = CanonicalRecommendationIndex::default();
    for (alias, property) in builtin_token_aliases() {
        push_index_value(&mut index.preferred_aliases_by_property, property, alias);
    }
    for aliases in index.preferred_aliases_by_property.values_mut() {
        aliases.sort_by(|left, right| left.len().cmp(&right.len()).then_with(|| left.cmp(right)));
    }
    for mixin in manifest
        .get("mixins")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
    {
        if mixin
            .get("parameters")
            .and_then(Value::as_array)
            .is_some_and(|parameters| !parameters.is_empty())
        {
            continue;
        }
        let Some(name) = mixin
            .get("name")
            .and_then(Value::as_str)
            .and_then(|name| name.strip_prefix("--"))
        else {
            continue;
        };
        let rules = engine.inspect(name)?.rules;
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
            name,
        );
    }
    for values in index.static_candidates_by_signature.values_mut() {
        values.sort_by(|left, right| left.len().cmp(&right.len()).then_with(|| left.cmp(right)));
    }
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
    let key = semantics.key_token.as_deref().map(|key| {
        if semantics.kind == mastercss_engine::ClassSemanticKind::Token {
            key.trim_end_matches('-').trim_start_matches('-').to_owned()
        } else {
            key.trim_end_matches(':').to_owned()
        }
    });
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
    // A reordered condition suffix can change wrapper order or priority. Keep
    // the original suffix as a candidate so a safe property alias survives
    // even when the reordered candidate fails semantic equivalence.
    if suffix != parts.suffix {
        push_canonical_candidate(candidates, candidate_base, parts, &parts.suffix, order);
    }
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
                && candidate_rule.utility_type == source_rule.utility_type
                && candidate_rule.sort_tier == source_rule.sort_tier
                && candidate_rule.variable_names == source_rule.variable_names
                && collect_rule_declarations(&candidate_rule.text)
                    == collect_rule_declarations(&source_rule.text)
                && candidate_rule.priority == source_rule.priority
                && declaration_property_signature(candidate_rule) == source_signature
        }) else {
            return false;
        };
        remaining.remove(index);
    }
    true
}
