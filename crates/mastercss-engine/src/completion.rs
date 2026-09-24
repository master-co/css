use super::{
    BUILTIN_KEY_ALIASES, BUILTIN_TOKEN_NAMESPACES, CompiledVariable,
    EngineClassCompletionCandidate, EngineClassCompletionKind, EngineColorToken, EngineError,
    EngineSession, HashSet, ManifestProjection, UtilityDefinition, UtilityEmit, UtilityLayerName,
    UtilityMatcher, Value, add_unique_string, find_matching_parenthesis,
    selector_token_to_template, split_dynamic_value_state, utf16_len,
};

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
            UtilityMatcher::Value {
                keys: matcher_keys, ..
            } => {
                for key in matcher_keys {
                    add_unique_string(&mut alias_groups, key);
                }
            }
            UtilityMatcher::Static { .. }
            | UtilityMatcher::Pattern { .. }
            | UtilityMatcher::Token { .. } => {}
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

pub(crate) fn completion_numeric_value(variable: &CompiledVariable) -> Option<f64> {
    let numeric = variable.numeric.as_ref()?.as_object()?;
    let value = numeric.get("value")?.as_f64()?;
    Some(value)
}

pub(crate) fn variable_completion_sort_text(variable: &CompiledVariable, label: &str) -> String {
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
    if let Some(value) = completion_numeric_value(variable) {
        return format!(
            "aaaa-{}-{}-{value:020.8}",
            variable.namespace,
            variable
                .numeric
                .as_ref()
                .and_then(|v| v.get("unit"))
                .and_then(Value::as_str)
                .unwrap_or("")
        );
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
    let prefixes = utility
        .matchers
        .iter()
        .filter_map(|matcher| match matcher {
            UtilityMatcher::Token { prefix } => Some(prefix.as_str()),
            _ => None,
        })
        .collect::<Vec<_>>();
    for (value_key, variable_name) in &utility.variable_entries {
        let Some(variable) = manifest.compiled_variables.get(variable_name) else {
            continue;
        };
        for prefix in &prefixes {
            let positive = format!("{prefix}{value_key}");
            let mut named_labels = vec![positive.clone()];
            if variable.variable_type == "number" && super::named::allows_negative_token(utility) {
                named_labels.push(format!("-{positive}"));
            }
            for label in named_labels {
                if super::named::matching_utilities(&label, manifest).is_empty() {
                    continue;
                }
                push_class_completion_candidate(
                    candidates,
                    labels,
                    EngineClassCompletionCandidate {
                        label: label.clone(),
                        kind: EngineClassCompletionKind::Value,
                        detail: Some(format!(
                            "(token --{}) {}",
                            variable.name,
                            variable.value.as_deref().unwrap_or(variable.name.as_str())
                        )),
                        documentation_class_name: Some(label),
                        // Keep static names and property entrypoints discoverable
                        // before the much larger named-token catalog.
                        sort_text: Some(format!(
                            "zzzz-token-{}",
                            variable_completion_sort_text(variable, value_key,)
                        )),
                        trigger_suggest: false,
                    },
                );
            }
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
                    | UtilityMatcher::Token { .. }
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
    for (properties, _) in BUILTIN_TOKEN_NAMESPACES {
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
    for token in manifest
        .conditions
        .keys()
        .map(String::as_str)
        .chain(manifest.modes.iter().map(|mode| mode.name.as_str()))
        .chain(
            manifest
                .variants
                .iter()
                .filter_map(|variant| variant.token.strip_prefix('@')),
        )
    {
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
                    .map(|variable| {
                        format!("0000-{}", variable_completion_sort_text(variable, token))
                    })
                    .or_else(|| Some(format!("1000-{token}"))),
                trigger_suggest: false,
            },
        );
    }
    for animation_name in manifest.animations.keys() {
        for key in ["animation", "animation-name"] {
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

pub(crate) fn resolve_color_token_value(
    color_token: &str,
    class_name: Option<&str>,
    manifest: &ManifestProjection,
) -> Option<String> {
    if class_name.is_none()
        && let Some(prefix) = super::named::token_prefix(color_token, manifest)
    {
        let raw = color_token.strip_prefix(prefix)?;
        let (value, _) = split_dynamic_value_state(raw);
        return resolve_color_variable_value(&value, color_token, manifest);
    }
    if let Some(class_name) = class_name
        && let Some(value) = resolve_color_variable_value(color_token, class_name, manifest)
    {
        return Some(value);
    }
    let name = color_token.strip_prefix("var(--")?.strip_suffix(')')?;
    resolved_color_variable(name, manifest)
}

impl EngineSession {
    pub fn resolve_color_token(
        &self,
        color_token: &str,
        class_name: Option<&str>,
    ) -> Result<Option<String>, EngineError> {
        self.ensure_active()?;
        Ok(resolve_color_token_value(
            color_token,
            class_name,
            &self.compiled,
        ))
    }
}

pub(crate) fn color_function_name_is_supported(name: &str) -> bool {
    [
        "rgb",
        "rgba",
        "hsl",
        "hsla",
        "hwb",
        "lab",
        "lch",
        "oklab",
        "oklch",
        "color",
        "color-mix",
    ]
    .iter()
    .any(|supported| name.eq_ignore_ascii_case(supported))
}

pub(crate) fn is_color_identifier_character(character: char) -> bool {
    character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | '$')
}

pub(crate) fn resolve_color_variable_value(
    token: &str,
    class_name: &str,
    manifest: &ManifestProjection,
) -> Option<String> {
    if let Some(name) = token
        .strip_prefix("var(--")
        .and_then(|name| name.strip_suffix(')'))
    {
        return resolved_color_variable(name, manifest);
    }
    let source = class_name.strip_suffix('!').unwrap_or(class_name);
    let token = token.split_once('/').map_or(token, |(name, _)| name);
    let matches = super::named::matching_utilities(source, manifest);
    let (index, matched) = matches.first()?;
    if matched.matcher_type != super::UtilityMatcherType::Token {
        return None;
    }
    let variable_name = manifest.utilities[*index].variables.get(token)?;
    resolved_color_variable(variable_name, manifest)
}

fn resolved_color_variable(name: &str, manifest: &ManifestProjection) -> Option<String> {
    let mut variable = manifest.compiled_variables.get(name)?;
    if !variable.namespace.starts_with("color") {
        return None;
    }
    for _ in 0..8 {
        let value = variable.value.as_deref()?;
        let alias = value
            .strip_prefix("var(--")
            .and_then(|value| value.strip_suffix(')'));
        let Some(alias) = alias else {
            return Some(value.to_owned());
        };
        variable = manifest.compiled_variables.get(alias)?;
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
                } else if identifier == "var" {
                    if let Some(resolved) = resolve_color_token_value(
                        &value[start..=closing],
                        Some(class_name),
                        manifest,
                    ) {
                        tokens.push(EngineColorToken {
                            start: utf16_len(&class_name[..value_offset + start]),
                            end: utf16_len(&class_name[..value_offset + closing + 1]),
                            value: resolved,
                            alpha: None,
                        });
                    }
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

            // Native identifiers are color candidates, never theme aliases.
            // The host color parser decides whether an identifier is a CSS color.
            tokens.push(EngineColorToken {
                start: utf16_len(&class_name[..value_offset + start]),
                end: utf16_len(&class_name[..value_offset + cursor]),
                value: identifier.to_owned(),
                alpha: None,
            });
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
    if let Some(prefix) = super::named::token_prefix(semantic_class_name, manifest) {
        let Some(raw) = semantic_class_name.strip_prefix(prefix) else {
            return Vec::new();
        };
        let (value, _) = split_dynamic_value_state(raw);
        let Some(resolved) = resolve_color_variable_value(&value, semantic_class_name, manifest)
        else {
            return Vec::new();
        };
        let alpha = value
            .split_once('/')
            .and_then(|(_, alpha)| alpha.parse().ok());
        return vec![EngineColorToken {
            // A color edit replaces the named class base with an explicit
            // property:value. Keep selectors/conditions outside the edit range.
            start: 0,
            end: utf16_len(prefix) + utf16_len(&value),
            value: resolved,
            alpha,
        }];
    }
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
