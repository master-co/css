use super::*;

pub(crate) fn utility_completion_metadata(
    utility: &UtilityDefinition,
) -> (Vec<String>, Vec<String>) {
    let mut keys = utility.keys.clone();
    let mut alias_groups = utility.alias_groups.clone();
    for matcher in &utility.matchers {
        match matcher {
            UtilityMatcher::Key { keys: matcher_keys } => {
                for key in matcher_keys {
                    add_unique_string(&mut keys, key);
                }
            }
            UtilityMatcher::Variable {
                keys: matcher_keys, ..
            }
            | UtilityMatcher::Value {
                keys: matcher_keys, ..
            } => {
                for key in matcher_keys {
                    add_unique_string(&mut alias_groups, key);
                }
            }
            UtilityMatcher::Static { .. } | UtilityMatcher::Pattern { .. } => {}
        }
    }
    (keys, alias_groups)
}

pub(crate) fn javascript_string(value: &Value) -> String {
    match value {
        Value::Null => "null".into(),
        Value::Bool(value) => value.to_string(),
        Value::Number(value) => value.to_string(),
        Value::String(value) => value.clone(),
        Value::Array(values) => values
            .iter()
            .map(javascript_string)
            .collect::<Vec<_>>()
            .join(","),
        Value::Object(_) => "[object Object]".into(),
    }
}

pub(crate) fn static_utility_detail(utility: &UtilityDefinition) -> Option<String> {
    let declarations = match &utility.emit {
        UtilityEmit::Static { rules } => rules.first().map(|rule| &rule.declarations),
        UtilityEmit::Template { declarations } => Some(declarations),
        UtilityEmit::Property { .. } | UtilityEmit::Declarations { .. } => None,
    }?;
    if declarations.len() != 1 {
        return None;
    }
    let (property, value) = declarations.iter().next()?;
    Some(format!("{property}: {}", javascript_string(value)))
}

pub(crate) fn push_class_completion_candidate(
    candidates: &mut Vec<EngineClassCompletionCandidate>,
    labels: &mut HashSet<String>,
    candidate: EngineClassCompletionCandidate,
) {
    if labels.insert(candidate.label.clone()) {
        candidates.push(candidate);
    }
}

pub(crate) fn push_property_completion_candidate(
    candidates: &mut Vec<EngineClassCompletionCandidate>,
    labels: &mut HashSet<String>,
    key: &str,
    detail: Option<String>,
) {
    push_class_completion_candidate(
        candidates,
        labels,
        EngineClassCompletionCandidate {
            label: format!("{key}:"),
            kind: EngineClassCompletionKind::Property,
            detail,
            documentation_class_name: None,
            sort_text: Some(key.to_owned()),
            trigger_suggest: true,
        },
    );
}

pub(crate) fn push_value_completion_candidate(
    candidates: &mut Vec<EngineClassCompletionCandidate>,
    labels: &mut HashSet<String>,
    label: String,
    detail: Option<String>,
) {
    push_class_completion_candidate(
        candidates,
        labels,
        EngineClassCompletionCandidate {
            documentation_class_name: Some(label.clone()),
            label,
            kind: EngineClassCompletionKind::Value,
            detail,
            sort_text: None,
            trigger_suggest: false,
        },
    );
}

pub(crate) fn completion_numeric_value(variable: &CompiledVariable, root_size: f64) -> Option<f64> {
    let numeric = variable.numeric.as_ref()?.as_object()?;
    let value = numeric.get("value")?.as_f64()?;
    match numeric.get("unit").and_then(Value::as_str) {
        Some("rem") => Some(value * root_size),
        Some("") | Some("px") | None => Some(value),
        _ => None,
    }
}

pub(crate) fn variable_completion_sort_text(
    variable: &CompiledVariable,
    label: &str,
    root_size: f64,
) -> String {
    if variable.namespace.starts_with("color") {
        let (prefix, shade) = label
            .rsplit_once('-')
            .filter(|(_, shade)| shade.chars().all(|character| character.is_ascii_digit()))
            .unwrap_or((label, ""));
        return if shade.is_empty() {
            format!("aaaa-color-{prefix}-zzzz")
        } else {
            format!("aaaa-color-{prefix}-{:0>10}", shade)
        };
    }
    if let Some(value) = completion_numeric_value(variable, root_size) {
        return format!("aaaa-{}-{value:020.8}", variable.namespace);
    }
    format!("aaaa{label}")
}

pub(crate) fn push_utility_value_completion_candidates(
    candidates: &mut Vec<EngineClassCompletionCandidate>,
    labels: &mut HashSet<String>,
    manifest: &ManifestProjection,
    utility: &UtilityDefinition,
    keys: &[String],
) {
    for (value_key, variable_name) in &utility.variable_entries {
        let Some(variable) = manifest.compiled_variables.get(variable_name) else {
            continue;
        };
        for key in keys {
            let label = format!("{key}:{value_key}");
            push_class_completion_candidate(
                candidates,
                labels,
                EngineClassCompletionCandidate {
                    label: label.clone(),
                    kind: EngineClassCompletionKind::Value,
                    detail: Some(format!(
                        "(scope) {}",
                        variable.value.as_deref().unwrap_or(variable.name.as_str())
                    )),
                    documentation_class_name: Some(label),
                    sort_text: Some(variable_completion_sort_text(
                        variable,
                        value_key,
                        manifest.settings.root_size,
                    )),
                    trigger_suggest: false,
                },
            );
        }
    }
    let animation_property = match &utility.emit {
        UtilityEmit::Property { property } => {
            matches!(property.as_str(), "animation" | "animation-name")
        }
        UtilityEmit::Declarations { declarations } => declarations
            .iter()
            .any(|property| matches!(property.as_str(), "animation" | "animation-name")),
        UtilityEmit::Template { declarations } => declarations
            .keys()
            .any(|property| matches!(property.as_str(), "animation" | "animation-name")),
        UtilityEmit::Static { rules } => rules.iter().any(|rule| {
            rule.declarations
                .keys()
                .any(|property| matches!(property.as_str(), "animation" | "animation-name"))
        }),
    };
    if animation_property {
        for animation_name in manifest.animations.keys() {
            for key in keys {
                let label = format!("{key}:{animation_name}");
                push_class_completion_candidate(
                    candidates,
                    labels,
                    EngineClassCompletionCandidate {
                        label: label.clone(),
                        kind: EngineClassCompletionKind::Value,
                        detail: Some(format!("{key}: {animation_name}")),
                        documentation_class_name: Some(label),
                        sort_text: None,
                        trigger_suggest: false,
                    },
                );
            }
        }
    }
}

pub(crate) fn collect_class_completion_candidates(
    manifest: &ManifestProjection,
) -> Vec<EngineClassCompletionCandidate> {
    let mut candidates = Vec::new();
    let mut labels = HashSet::new();
    let mut ambiguous_keys = Vec::new();

    for utility in &manifest.utilities {
        if utility.utility_type == -2 {
            let is_component = utility.layer == UtilityLayerName::Components;
            let static_detail = static_utility_detail(utility);
            for matcher in &utility.matchers {
                match matcher {
                    UtilityMatcher::Static { name } => push_value_completion_candidate(
                        &mut candidates,
                        &mut labels,
                        name.clone(),
                        if is_component {
                            Some("component".into())
                        } else {
                            static_detail.clone()
                        },
                    ),
                    UtilityMatcher::Pattern { prefix, values, .. } => {
                        for value in values {
                            push_value_completion_candidate(
                                &mut candidates,
                                &mut labels,
                                format!("{prefix}{value}"),
                                is_component.then(|| "component".into()),
                            );
                        }
                    }
                    UtilityMatcher::Key { .. }
                    | UtilityMatcher::Variable { .. }
                    | UtilityMatcher::Value { .. } => {}
                }
            }
            continue;
        }

        for matcher in &utility.matchers {
            if let UtilityMatcher::Pattern { prefix, values, .. } = matcher {
                for value in values {
                    push_value_completion_candidate(
                        &mut candidates,
                        &mut labels,
                        format!("{prefix}{value}"),
                        None,
                    );
                }
            }
        }

        let (keys, alias_groups) = utility_completion_metadata(utility);
        let mut value_keys = keys.clone();
        for alias_group in &alias_groups {
            add_unique_string(&mut value_keys, alias_group);
        }
        push_utility_value_completion_candidates(
            &mut candidates,
            &mut labels,
            manifest,
            utility,
            &value_keys,
        );
        for key in keys {
            ambiguous_keys.retain(|ambiguous| ambiguous != &key);
            push_property_completion_candidate(&mut candidates, &mut labels, &key, None);
        }
        for alias_group in alias_groups {
            add_unique_string(&mut ambiguous_keys, &alias_group);
        }
    }

    let canonical_value_candidates = candidates.clone();
    for (key, canonical_key) in BUILTIN_KEY_ALIASES {
        let prefix = format!("{canonical_key}:");
        for candidate in canonical_value_candidates.iter().filter(|candidate| {
            candidate.kind == EngineClassCompletionKind::Value
                && candidate.label.starts_with(&prefix)
        }) {
            let label = format!("{key}:{}", &candidate.label[prefix.len()..]);
            let mut alias_candidate = candidate.clone();
            alias_candidate.label = label.clone();
            alias_candidate.documentation_class_name = Some(label);
            push_class_completion_candidate(&mut candidates, &mut labels, alias_candidate);
        }
    }

    for (key, canonical_key) in BUILTIN_KEY_ALIASES {
        push_property_completion_candidate(
            &mut candidates,
            &mut labels,
            key,
            Some((*canonical_key).to_owned()),
        );
    }
    for (properties, _) in BUILTIN_NATIVE_VALUE_NAMESPACES {
        for property in *properties {
            push_property_completion_candidate(&mut candidates, &mut labels, property, None);
        }
    }
    for key in ambiguous_keys {
        push_property_completion_candidate(
            &mut candidates,
            &mut labels,
            &key,
            Some("ambiguous key".into()),
        );
    }
    for (token, detail) in [(":first", ":first-child"), (":of", ":of")] {
        push_class_completion_candidate(
            &mut candidates,
            &mut labels,
            EngineClassCompletionCandidate {
                label: token.to_owned(),
                kind: EngineClassCompletionKind::Value,
                detail: Some(detail.to_owned()),
                documentation_class_name: None,
                sort_text: None,
                trigger_suggest: false,
            },
        );
    }
    for token in manifest.selectors.keys() {
        if !token.starts_with(':') {
            continue;
        }
        push_class_completion_candidate(
            &mut candidates,
            &mut labels,
            EngineClassCompletionCandidate {
                label: token.clone(),
                kind: EngineClassCompletionKind::Value,
                detail: selector_token_to_template(token, manifest)
                    .map(|selector| selector.replace('&', "")),
                documentation_class_name: None,
                sort_text: None,
                trigger_suggest: false,
            },
        );
    }
    for token in manifest.conditions.keys() {
        push_class_completion_candidate(
            &mut candidates,
            &mut labels,
            EngineClassCompletionCandidate {
                label: format!("@{token}"),
                kind: EngineClassCompletionKind::Value,
                detail: None,
                documentation_class_name: None,
                sort_text: manifest
                    .compiled_variables
                    .get(&format!("breakpoint-{token}"))
                    .and_then(|variable| {
                        completion_numeric_value(variable, manifest.settings.root_size)
                    })
                    .map(|value| format!("0000-{value:020.8}"))
                    .or_else(|| Some(format!("1000-{token}"))),
                trigger_suggest: false,
            },
        );
    }
    for animation_name in manifest.animations.keys() {
        for key in ["animate", "animation", "animation-name"] {
            let label = format!("{key}:{animation_name}");
            push_class_completion_candidate(
                &mut candidates,
                &mut labels,
                EngineClassCompletionCandidate {
                    label: label.clone(),
                    kind: EngineClassCompletionKind::Value,
                    detail: Some(format!("{key}: {animation_name}")),
                    documentation_class_name: Some(label),
                    sort_text: None,
                    trigger_suggest: false,
                },
            );
        }
    }
    candidates
}

pub(crate) fn color_function_name(value: &str) -> Option<&str> {
    let (name, _) = value.split_once('(')?;
    (!name.is_empty()
        && name
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '.')))
    .then_some(name)
}

pub(crate) fn normalize_color_presentation_space(function_name: &str) -> Option<String> {
    Some(
        match function_name {
            "rgb" | "rgba" => "srgb",
            "hsla" => "hsl",
            "display-p3" | "p3" => "p3",
            "rec2020" | "rec.2020" => "rec2020",
            "color" => return None,
            function_name => function_name,
        }
        .to_owned(),
    )
}

pub(crate) fn color_presentation_space(
    color_token: &str,
    manifest: &ManifestProjection,
) -> Option<String> {
    if let Some(function_name) = color_function_name(color_token) {
        return normalize_color_presentation_space(function_name);
    }
    let variable_token = color_token
        .split_once('/')
        .map_or(color_token, |(key, _)| key);
    let variable_key = variable_token.strip_prefix('$').unwrap_or(variable_token);
    let variable_name = manifest
        .utilities
        .iter()
        .filter(|utility| {
            utility.matchers.iter().any(|matcher| {
                matches!(matcher, UtilityMatcher::Key { keys } if keys.iter().any(|key| key == "color"))
            })
        })
        .find_map(|utility| utility.variables.get(variable_key))
        .map(String::as_str)
        .or_else(|| {
            manifest
                .compiled_variables
                .contains_key(variable_key)
                .then_some(variable_key)
        });
    if let Some(variable) = variable_name.and_then(|name| manifest.compiled_variables.get(name))
        && let Some(function_name) = variable.value.as_deref().and_then(color_function_name)
    {
        return normalize_color_presentation_space(function_name);
    }
    Some("srgb".into())
}

pub(crate) fn color_function_name_is_supported(name: &str) -> bool {
    matches!(
        name,
        "rgb" | "rgba" | "hsl" | "hsla" | "hwb" | "lab" | "lch" | "oklab" | "oklch" | "color"
    )
}

pub(crate) fn is_color_identifier_character(character: char) -> bool {
    character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | '$')
}

pub(crate) fn resolve_color_variable_value(
    token: &str,
    class_name: &str,
    manifest: &ManifestProjection,
) -> Option<String> {
    let canonical_class_name = canonicalize_class_name(class_name);
    let variable_name = manifest
        .utilities
        .iter()
        .filter(|utility| {
            match_utility(class_name, utility, manifest).is_some()
                || canonical_class_name.as_deref().is_some_and(|class_name| {
                    match_utility(class_name, utility, manifest).is_some()
                })
        })
        .find_map(|utility| utility.variables.get(token))?;
    let mut variable = manifest.compiled_variables.get(variable_name)?;
    if !variable.namespace.starts_with("color") {
        return None;
    }
    for _ in 0..8 {
        let value = variable.value.as_deref()?;
        let alias_name = value
            .strip_prefix('$')
            .map(|value| value.split_once('/').map_or(value, |(name, _)| name))
            .or_else(|| {
                value
                    .strip_prefix("var(--")
                    .and_then(|value| value.strip_suffix(')'))
            });
        let Some(alias_name) = alias_name else {
            return Some(value.to_owned());
        };
        variable = manifest.compiled_variables.get(alias_name)?;
    }
    None
}

pub(crate) fn scan_color_value(
    value: &str,
    value_offset: usize,
    class_name: &str,
    manifest: &ManifestProjection,
    tokens: &mut Vec<EngineColorToken>,
) {
    let mut cursor = 0;
    while cursor < value.len() {
        let character = value[cursor..].chars().next().unwrap_or_default();
        if matches!(character, '\'' | '"') {
            let quote = character;
            cursor += character.len_utf8();
            let mut escaped = false;
            while cursor < value.len() {
                let character = value[cursor..].chars().next().unwrap_or_default();
                cursor += character.len_utf8();
                if escaped {
                    escaped = false;
                } else if character == '\\' {
                    escaped = true;
                } else if character == quote {
                    break;
                }
            }
            continue;
        }
        if character == '#' {
            let start = cursor;
            cursor += 1;
            while cursor < value.len()
                && value[cursor..]
                    .chars()
                    .next()
                    .is_some_and(|character| character.is_ascii_hexdigit())
            {
                cursor += 1;
            }
            if cursor > start + 1 {
                tokens.push(EngineColorToken {
                    start: utf16_len(&class_name[..value_offset + start]),
                    end: utf16_len(&class_name[..value_offset + cursor]),
                    value: value[start..cursor].to_owned(),
                    alpha: None,
                });
            }
            continue;
        }
        if character.is_ascii_alphabetic() || matches!(character, '-' | '_' | '$') {
            let start = cursor;
            cursor += character.len_utf8();
            while cursor < value.len()
                && value[cursor..]
                    .chars()
                    .next()
                    .is_some_and(is_color_identifier_character)
            {
                cursor += value[cursor..]
                    .chars()
                    .next()
                    .unwrap_or_default()
                    .len_utf8();
            }
            let identifier = &value[start..cursor];
            if value[cursor..].starts_with('(') {
                let opening = cursor;
                let Some(closing) = find_matching_parenthesis(value, opening) else {
                    return;
                };
                if color_function_name_is_supported(identifier) {
                    let end = closing + 1;
                    tokens.push(EngineColorToken {
                        start: utf16_len(&class_name[..value_offset + start]),
                        end: utf16_len(&class_name[..value_offset + end]),
                        value: value[start..end].replace('|', " "),
                        alpha: None,
                    });
                } else {
                    scan_color_value(
                        &value[opening + 1..closing],
                        value_offset + opening + 1,
                        class_name,
                        manifest,
                        tokens,
                    );
                }
                cursor = closing + 1;
                continue;
            }

            let variable_token = identifier.strip_prefix('$').unwrap_or(identifier);
            let mut end = cursor;
            let mut alpha = None;
            if value[cursor..].starts_with('/') {
                let alpha_start = cursor + 1;
                let mut alpha_end = alpha_start;
                while alpha_end < value.len()
                    && value[alpha_end..]
                        .chars()
                        .next()
                        .is_some_and(|character| character.is_ascii_digit() || character == '.')
                {
                    alpha_end += 1;
                }
                if alpha_end > alpha_start {
                    alpha = value[alpha_start..alpha_end].parse::<f64>().ok();
                    end = alpha_end;
                }
            }
            if let Some(resolved) =
                resolve_color_variable_value(variable_token, class_name, manifest)
            {
                tokens.push(EngineColorToken {
                    start: utf16_len(&class_name[..value_offset + start]),
                    end: utf16_len(&class_name[..value_offset + end]),
                    value: resolved,
                    alpha,
                });
            }
            cursor = end;
            continue;
        }
        cursor += character.len_utf8();
    }
}

pub(crate) fn collect_engine_color_tokens(
    class_name: &str,
    manifest: &ManifestProjection,
) -> Vec<EngineColorToken> {
    let semantic_class_name = class_name.strip_suffix('!').unwrap_or(class_name);
    let Some(colon) = semantic_class_name.find(':') else {
        return Vec::new();
    };
    let raw_value = &semantic_class_name[colon + 1..];
    let (value, _) = split_dynamic_value_state(raw_value);
    let value_offset = colon + 1;
    let mut tokens = Vec::new();
    scan_color_value(
        &value,
        value_offset,
        semantic_class_name,
        manifest,
        &mut tokens,
    );
    tokens
}
