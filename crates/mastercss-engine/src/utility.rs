use super::*;

pub(crate) fn append_builtin_native_value_utilities(utilities: &mut Vec<UtilityDefinition>) {
    for (properties, variable_alias_refs) in BUILTIN_NATIVE_VALUE_NAMESPACES {
        for property in *properties {
            if utilities.iter().any(|utility| utility.id == *property) {
                continue;
            }
            utilities.push(UtilityDefinition {
                id: (*property).into(),
                name: Some((*property).into()),
                utility_type: if is_native_shorthand_property(property) {
                    -1
                } else {
                    0
                },
                order: Some(0),
                layer: UtilityLayerName::Utilities,
                kind: None,
                keys: Vec::new(),
                alias_groups: Vec::new(),
                variable_aliases: Vec::new(),
                variable_alias_refs: variable_alias_refs
                    .iter()
                    .map(|reference| (*reference).to_owned())
                    .collect(),
                variables: HashMap::new(),
                variable_entries: Vec::new(),
                native_fallback: true,
                emit: UtilityEmit::Property {
                    property: (*property).into(),
                },
                matchers: vec![UtilityMatcher::Key {
                    keys: vec![(*property).into()],
                }],
            });
        }
    }
}

pub(crate) fn append_builtin_native_declaration_utilities(utilities: &mut Vec<UtilityDefinition>) {
    for property in BUILTIN_NATIVE_DECLARATION_PROPERTIES {
        if utilities.iter().any(|utility| utility.id == *property) {
            continue;
        }
        utilities.push(UtilityDefinition {
            id: (*property).into(),
            name: Some((*property).into()),
            utility_type: if is_native_shorthand_property(property) {
                -1
            } else {
                0
            },
            order: Some(0),
            layer: UtilityLayerName::Utilities,
            kind: None,
            keys: Vec::new(),
            alias_groups: Vec::new(),
            variable_aliases: Vec::new(),
            variable_alias_refs: Vec::new(),
            variables: HashMap::new(),
            variable_entries: Vec::new(),
            native_fallback: true,
            emit: UtilityEmit::Property {
                property: (*property).into(),
            },
            matchers: vec![UtilityMatcher::Key {
                keys: vec![(*property).into()],
            }],
        });
    }
}

pub(crate) fn compile_utility_variables(
    utility: &mut UtilityDefinition,
    variables: &HashMap<String, CompiledVariable>,
    variable_order: &[String],
) {
    for (key, name) in &utility.variable_aliases {
        if variables.contains_key(name) && !utility.variables.contains_key(key) {
            utility.variables.insert(key.clone(), name.clone());
            utility.variable_entries.push((key.clone(), name.clone()));
        }
    }
    for reference in &utility.variable_alias_refs {
        let namespace = reference
            .strip_prefix('=')
            .or_else(|| reference.strip_prefix('~'))
            .unwrap_or(reference.as_str());
        for variable_name in variable_order {
            let Some(variable) = variables.get(variable_name) else {
                continue;
            };
            if let Some(key) = get_variable_key_by_namespace(&variable.name, namespace)
                && !utility.variables.contains_key(&key)
            {
                utility.variables.insert(key.clone(), variable.name.clone());
                utility.variable_entries.push((key, variable.name.clone()));
            }
        }
    }
}

pub(crate) fn get_variable_key_by_namespace(
    variable_name: &str,
    namespace: &str,
) -> Option<String> {
    let (negative, positive_name) = variable_name
        .strip_prefix('-')
        .map_or((false, variable_name), |name| (true, name));
    if positive_name != namespace && !positive_name.starts_with(&format!("{namespace}-")) {
        return None;
    }
    let key = positive_name
        .strip_prefix(namespace)
        .and_then(|name| name.strip_prefix('-'))
        .unwrap_or_default();
    Some(if negative {
        format!("-{key}")
    } else {
        key.to_owned()
    })
}

pub(crate) fn layer_index(layer: UtilityLayerName) -> usize {
    match layer {
        UtilityLayerName::Base => 0,
        UtilityLayerName::Defaults => 1,
        UtilityLayerName::Components => 2,
        UtilityLayerName::Utilities => 3,
    }
}

pub(crate) fn compare_stored_rules(left: &StoredRule, right: &StoredRule) -> Ordering {
    left.ir
        .sort_tier
        .cmp(&right.ir.sort_tier)
        .then_with(|| {
            compare_condition_features(&left.ir.priority.features, &right.ir.priority.features)
        })
        .then_with(|| left.ir.priority.selector.cmp(&right.ir.priority.selector))
        .then_with(|| left.ir.utility_type.cmp(&right.ir.utility_type))
        .then_with(|| natural_compare(&left.ir.key, &right.ir.key))
        .then_with(|| left.manifest_order.cmp(&right.manifest_order))
}

pub(crate) fn compare_condition_features(
    left: &[ConditionFeature],
    right: &[ConditionFeature],
) -> Ordering {
    for index in 0..left.len().max(right.len()) {
        let Some(left) = left.get(index) else {
            return Ordering::Less;
        };
        let Some(right) = right.get(index) else {
            return Ordering::Greater;
        };
        let name_order = natural_compare(&left.0, &right.0);
        if name_order != Ordering::Equal {
            return name_order;
        }
        let left_range = left.2 - left.1;
        let right_range = right.2 - right.1;
        let range_order = right_range
            .partial_cmp(&left_range)
            .unwrap_or(Ordering::Equal);
        if range_order != Ordering::Equal {
            return range_order;
        }
        let min_order = right.1.partial_cmp(&left.1).unwrap_or(Ordering::Equal);
        if min_order != Ordering::Equal {
            return min_order;
        }
        let max_order = right.2.partial_cmp(&left.2).unwrap_or(Ordering::Equal);
        if max_order != Ordering::Equal {
            return max_order;
        }
    }
    Ordering::Equal
}

pub fn natural_compare(left: &str, right: &str) -> Ordering {
    let mut left_chars = left.chars().peekable();
    let mut right_chars = right.chars().peekable();
    loop {
        match (left_chars.peek(), right_chars.peek()) {
            (None, None) => return Ordering::Equal,
            (None, Some(_)) => return Ordering::Less,
            (Some(_), None) => return Ordering::Greater,
            (Some(left_char), Some(right_char))
                if left_char.is_ascii_digit() && right_char.is_ascii_digit() =>
            {
                let left_digits: String =
                    std::iter::from_fn(|| left_chars.next_if(|value| value.is_ascii_digit()))
                        .collect();
                let right_digits: String =
                    std::iter::from_fn(|| right_chars.next_if(|value| value.is_ascii_digit()))
                        .collect();
                let number_order = left_digits
                    .trim_start_matches('0')
                    .len()
                    .cmp(&right_digits.trim_start_matches('0').len())
                    .then_with(|| left_digits.cmp(&right_digits));
                if number_order != Ordering::Equal {
                    return number_order;
                }
            }
            _ => {
                let left_char = left_chars.next().unwrap();
                let right_char = right_chars.next().unwrap();
                let order = left_char.cmp(&right_char);
                if order != Ordering::Equal {
                    return order;
                }
            }
        }
    }
}

pub(crate) fn match_utility(
    class_name: &str,
    utility: &UtilityDefinition,
    manifest: &ManifestProjection,
) -> Option<UtilityMatch> {
    for matcher in &utility.matchers {
        match matcher {
            UtilityMatcher::Static { name }
                if class_name.strip_prefix(name).is_some_and(|rest| {
                    is_match_state_boundary(rest)
                        && (!rest.starts_with(':') || is_selector_state_start(rest))
                }) =>
            {
                return Some(UtilityMatch {
                    value: None,
                    value_normalized: true,
                    state_token: class_name[name.len()..].to_owned(),
                    variable_names: Vec::new(),
                    matcher_type: UtilityMatcherType::Static,
                });
            }
            UtilityMatcher::Pattern {
                prefix,
                values,
                value_map,
            } => {
                let Some(value) = class_name.strip_prefix(prefix) else {
                    continue;
                };
                let Some(candidate) = values.iter().find(|candidate| {
                    value
                        .strip_prefix(candidate.as_str())
                        .is_some_and(is_match_state_boundary)
                }) else {
                    continue;
                };
                let state_token = &value[candidate.len()..];
                return Some(UtilityMatch {
                    value: Some(
                        value_map
                            .get(candidate)
                            .cloned()
                            .unwrap_or_else(|| candidate.to_string()),
                    ),
                    value_normalized: false,
                    state_token: state_token.to_owned(),
                    variable_names: Vec::new(),
                    matcher_type: UtilityMatcherType::Pattern,
                });
            }
            UtilityMatcher::Key { keys } => {
                for key in keys {
                    let Some(raw_value) = class_name
                        .strip_prefix(key)
                        .and_then(|rest| rest.strip_prefix(':'))
                    else {
                        continue;
                    };
                    let (value, state_token) = split_dynamic_value_state(raw_value);
                    if !value.is_empty() && !contains_legacy_variable_function(&value) {
                        let (value, variable_names) =
                            resolve_value_components(&value, Some(utility), manifest);
                        return Some(UtilityMatch {
                            value: Some(value),
                            value_normalized: true,
                            state_token,
                            variable_names,
                            matcher_type: UtilityMatcherType::Key,
                        });
                    }
                }
            }
            UtilityMatcher::Variable { keys, segments } => {
                for key in keys {
                    let Some(raw_value) = class_name
                        .strip_prefix(key)
                        .and_then(|rest| rest.strip_prefix(':'))
                    else {
                        continue;
                    };
                    let (value, state_token) = split_dynamic_value_state(raw_value);
                    if value.is_empty()
                        || contains_legacy_variable_function(&value)
                        || (segments.as_deref() != Some("multiple")
                            && has_top_level_value_separator(&value))
                    {
                        continue;
                    }
                    let Some((value, variable_names)) =
                        resolve_utility_alias_value(&value, utility, manifest)
                    else {
                        continue;
                    };
                    return Some(UtilityMatch {
                        value: Some(value),
                        value_normalized: false,
                        state_token,
                        variable_names,
                        matcher_type: UtilityMatcherType::Variable,
                    });
                }
            }
            UtilityMatcher::Value { keys, segments } => {
                for key in keys {
                    let Some(raw_value) = class_name
                        .strip_prefix(key)
                        .and_then(|rest| rest.strip_prefix(':'))
                    else {
                        continue;
                    };
                    let (value, state_token) = split_dynamic_value_state(raw_value);
                    if value.is_empty()
                        || contains_legacy_variable_function(&value)
                        || (segments.as_deref() != Some("multiple")
                            && has_top_level_value_separator(&value))
                        || !matches_utility_kind(&value, utility.kind.as_deref())
                    {
                        continue;
                    }
                    let (value, variable_names) =
                        resolve_value_components(&value, Some(utility), manifest);
                    return Some(UtilityMatch {
                        value: Some(value),
                        value_normalized: true,
                        state_token,
                        variable_names,
                        matcher_type: UtilityMatcherType::Value,
                    });
                }
            }
            _ => {}
        }
    }
    None
}

pub(crate) fn canonicalize_class_name(class_name: &str) -> Option<String> {
    let colon = class_name.find(':')?;
    let key = &class_name[..colon];
    let canonical = builtin_key_alias(key)?;
    Some(format!("{canonical}{}", &class_name[colon..]))
}

pub(crate) fn builtin_key_alias(key: &str) -> Option<&'static str> {
    BUILTIN_KEY_ALIASES
        .iter()
        .find_map(|(alias, canonical)| (*alias == key).then_some(*canonical))
}

pub(crate) fn contains_legacy_variable_function(value: &str) -> bool {
    value.contains("$(")
}

pub(crate) fn resolve_inline_variable_value(variable: &CompiledVariable) -> Option<String> {
    variable.value.clone()
}

pub(crate) fn resolve_utility_value(
    value: &str,
    utility: &UtilityDefinition,
    manifest: &ManifestProjection,
) -> Option<(String, Vec<String>)> {
    resolve_value(value, Some(utility), manifest)
}

pub(crate) fn resolve_value(
    value: &str,
    utility: Option<&UtilityDefinition>,
    manifest: &ManifestProjection,
) -> Option<(String, Vec<String>)> {
    if let Some((key, alpha)) = value.split_once('/') {
        let variable_name = key
            .strip_prefix('$')
            .filter(|name| manifest.compiled_variables.contains_key(*name))
            .map(str::to_owned)
            .or_else(|| utility.and_then(|utility| utility.variables.get(key).cloned()))
            .or_else(|| {
                manifest
                    .compiled_variables
                    .contains_key(key)
                    .then(|| key.to_owned())
            })?;
        let variable = manifest.compiled_variables.get(&variable_name)?;
        if !variable.namespace.starts_with("color") {
            return None;
        }
        let alpha = alpha.parse::<f64>().ok()?;
        if !(0.0..=1.0).contains(&alpha) {
            return None;
        }
        let color = if variable.inline {
            resolve_inline_variable_value(variable)?
        } else {
            format!("var(--{})", variable.name)
        };
        return Some((
            format!(
                "color-mix(in oklab,{color} {}%,transparent)",
                format_standard_number(alpha * 100.0)
            ),
            if variable.inline {
                Vec::new()
            } else {
                vec![variable.name.clone()]
            },
        ));
    }
    let (negative, key) = value
        .strip_prefix('-')
        .map_or((false, value), |key| (true, key));
    let variable_name = key
        .strip_prefix('$')
        .filter(|name| manifest.compiled_variables.contains_key(*name))
        .or_else(|| utility.and_then(|utility| utility.variables.get(key).map(String::as_str)))
        .or_else(|| manifest.compiled_variables.contains_key(key).then_some(key))?;
    let variable = manifest.compiled_variables.get(variable_name)?;
    if negative && variable.variable_type != "number" {
        return None;
    }
    if variable.inline {
        let value = resolve_inline_variable_value(variable)?;
        return Some((
            if negative {
                format!("calc({value} * -1)")
            } else {
                value
            },
            Vec::new(),
        ));
    }
    let reference = format!("var(--{})", variable.name);
    Some((
        if negative {
            format!("calc({reference} * -1)")
        } else {
            reference
        },
        vec![variable.name.clone()],
    ))
}

pub(crate) fn resolve_utility_alias_value(
    value: &str,
    utility: &UtilityDefinition,
    manifest: &ManifestProjection,
) -> Option<(String, Vec<String>)> {
    let key = value.split_once('/').map_or(value, |(key, _)| key);
    let key = key.strip_prefix('-').unwrap_or(key);
    utility.variables.contains_key(key).then_some(())?;
    resolve_utility_value(value, utility, manifest)
}

pub(crate) fn resolve_value_components(
    value: &str,
    utility: Option<&UtilityDefinition>,
    manifest: &ManifestProjection,
) -> (String, Vec<String>) {
    let mut output = String::with_capacity(value.len());
    let mut token = String::new();
    let mut quote = None;
    let mut escaped = false;
    let mut variable_names = Vec::new();
    let flush = |token: &mut String, output: &mut String, variable_names: &mut Vec<String>| {
        if token.is_empty() {
            return;
        }
        if let Some((resolved, names)) = resolve_value(token, utility, manifest) {
            output.push_str(&resolved);
            for name in names {
                if !variable_names.contains(&name) {
                    variable_names.push(name);
                }
            }
        } else {
            output.push_str(&normalize_dynamic_value(token, &manifest.settings));
        }
        token.clear();
    };
    for character in value.chars() {
        if escaped {
            if quote.is_some() {
                output.push(character);
            } else {
                token.push(character);
            }
            escaped = false;
            continue;
        }
        if character == '\\' {
            if quote.is_some() {
                output.push(character);
            } else {
                token.push(character);
            }
            escaped = true;
            continue;
        }
        if let Some(current_quote) = quote {
            output.push(character);
            if character == current_quote {
                quote = None;
            }
            continue;
        }
        if matches!(character, '\'' | '"') {
            flush(&mut token, &mut output, &mut variable_names);
            quote = Some(character);
            output.push(character);
        } else if character == '(' {
            // A token immediately followed by `(` is a CSS function name, not a
            // variable key. In particular, the inline `min`/`max` variables
            // must not rewrite the standard min()/max() math functions.
            output.push_str(&token);
            token.clear();
            output.push(character);
        } else if character == '|' {
            flush(&mut token, &mut output, &mut variable_names);
            output.push(' ');
        } else if character == '/' && !token.is_empty() {
            token.push(character);
        } else if character.is_ascii_whitespace() || matches!(character, ')' | ',' | '/') {
            flush(&mut token, &mut output, &mut variable_names);
            output.push(character);
        } else {
            token.push(character);
        }
    }
    flush(&mut token, &mut output, &mut variable_names);
    for name in collect_css_variable_names(&output) {
        if manifest.compiled_variables.contains_key(&name) && !variable_names.contains(&name) {
            variable_names.push(name);
        }
    }
    (
        normalize_css_math_functions(&output, &manifest.settings),
        variable_names,
    )
}

pub(crate) fn matches_utility_kind(value: &str, kind: Option<&str>) -> bool {
    let function_name = value
        .trim_start_matches('-')
        .split_once('(')
        .filter(|(_, rest)| rest.ends_with(')'))
        .map(|(name, _)| name);
    match kind {
        Some("number") => {
            value
                .chars()
                .next()
                .is_some_and(|character| character.is_ascii_digit() || character == '.')
                || matches!(function_name, Some("calc" | "clamp" | "min" | "max"))
        }
        Some("color") => {
            value.starts_with('#')
                || value.starts_with("currentColor")
                || value.starts_with("transparent")
                || function_name.is_some_and(|name| {
                    !matches!(name, "calc" | "clamp" | "min" | "max" | "url" | "image")
                        && !name.ends_with("gradient")
                })
        }
        Some("image") => function_name.is_some_and(|name| {
            name == "url"
                || name == "element"
                || name == "paint"
                || name == "cross-fade"
                || name.ends_with("gradient")
                || name.contains("image")
        }),
        _ => false,
    }
}

pub(crate) fn is_match_state_boundary(rest: &str) -> bool {
    rest.is_empty()
        || rest.chars().next().is_some_and(|character| {
            matches!(
                character,
                '!' | '*' | '>' | '+' | '~' | ':' | '[' | '@' | '_' | '.'
            )
        })
}

pub(crate) fn is_selector_state_start(rest: &str) -> bool {
    if rest.starts_with("::") {
        return true;
    }
    let Some(rest) = rest.strip_prefix(':') else {
        return false;
    };
    let name = rest
        .split(|character: char| !character.is_ascii_alphanumeric() && character != '-')
        .next()
        .unwrap_or_default();
    matches!(
        name,
        "active"
            | "any-link"
            | "after"
            | "autofill"
            | "before"
            | "blank"
            | "checked"
            | "current"
            | "default"
            | "defined"
            | "disabled"
            | "empty"
            | "enabled"
            | "first"
            | "first-child"
            | "first-letter"
            | "first-line"
            | "first-of-type"
            | "focus"
            | "focus-visible"
            | "focus-within"
            | "fullscreen"
            | "future"
            | "has"
            | "host"
            | "host-context"
            | "hover"
            | "in-range"
            | "indeterminate"
            | "invalid"
            | "is"
            | "lang"
            | "last"
            | "last-child"
            | "last-of-type"
            | "left"
            | "link"
            | "local-link"
            | "modal"
            | "not"
            | "nth-child"
            | "nth-col"
            | "nth-last-child"
            | "nth-last-col"
            | "nth-last-of-type"
            | "nth-of-type"
            | "only"
            | "only-child"
            | "only-of-type"
            | "of"
            | "optional"
            | "out-of-range"
            | "past"
            | "paused"
            | "picture-in-picture"
            | "placeholder-shown"
            | "playing"
            | "read-only"
            | "read-write"
            | "required"
            | "right"
            | "root"
            | "scope"
            | "seeking"
            | "stalled"
            | "target"
            | "target-within"
            | "user-invalid"
            | "user-valid"
            | "valid"
            | "visited"
            | "volume-locked"
            | "where"
    )
}

pub(crate) fn split_dynamic_value_state(value: &str) -> (String, String) {
    let mut quote = None;
    let mut escaped = false;
    let mut depth = 0_u32;
    for (index, character) in value.char_indices() {
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
        if character == '\'' || character == '"' {
            quote = Some(character);
            continue;
        }
        if character == '[' && depth == 0 {
            return (value[..index].to_owned(), value[index..].to_owned());
        }
        if matches!(character, '(' | '[' | '{') {
            depth += 1;
            continue;
        }
        if matches!(character, ')' | ']' | '}') {
            depth = depth.saturating_sub(1);
            continue;
        }
        if depth == 0 {
            let next = value[index + character.len_utf8()..].chars().next();
            let previous = value[..index].chars().next_back();
            let starts_state = matches!(
                character,
                '!' | '*' | '>' | '+' | '~' | ':' | '[' | '@' | '_'
            ) || character == '.'
                && next.is_none_or(|next| !next.is_ascii_digit())
                || character == '#'
                    && index > 0
                    && previous.is_some_and(|previous| !matches!(previous, '|' | ' '));
            if starts_state {
                return (value[..index].to_owned(), value[index..].to_owned());
            }
        }
    }
    (value.to_owned(), String::new())
}

pub(crate) fn has_top_level_value_separator(value: &str) -> bool {
    let mut quote = None;
    let mut escaped = false;
    let mut depth = 0_u32;
    for character in value.chars() {
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
        if character == '\'' || character == '"' {
            quote = Some(character);
        } else if matches!(character, '(' | '[' | '{') {
            depth += 1;
        } else if matches!(character, ')' | ']' | '}') {
            depth = depth.saturating_sub(1);
        } else if character == '|' && depth == 0 {
            return true;
        }
    }
    false
}
