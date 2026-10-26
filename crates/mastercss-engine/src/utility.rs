use super::{
    ConditionFeature, GeneratedRuleIr, HashSet, Ordering, Program, StoredRule, UtilityDefinition,
    UtilityEmit, UtilityLayerName, UtilityMatch, UtilityMatcher, UtilityMatcherType,
    collect_css_variable_names, normalize_css_math_functions,
};
use mastercss_lexer::concat_text;

pub(crate) fn append_builtin_native_declaration_utilities(utilities: &mut Vec<UtilityDefinition>) {
    let mut ids = utilities
        .iter()
        .map(|utility| utility.id.clone())
        .collect::<super::HashSet<_>>();
    for property in mastercss_schema::native_css_properties() {
        let id = concat_text!("native:", property);
        if !ids.insert(id.clone()) {
            continue;
        }
        utilities.push(UtilityDefinition {
            id,
            name: Some(property.into()),
            utility_type: 0,
            order: Some(0),
            layer: UtilityLayerName::Utilities,
            keys: Vec::new(),
            alias_groups: Vec::new(),
            variable_aliases: Vec::new(),
            variable_alias_refs: Vec::new(),
            native_fallback: true,
            emit: UtilityEmit::Property {
                property: property.into(),
            },
            matchers: vec![UtilityMatcher::Key {
                keys: vec![property.into()],
            }],
        });
    }
}

/// The variable a utility's token `key` names: an explicit alias first, then the
/// first `~namespace` reference with a variable whose namespace key is `key`, the
/// earliest in variable order. Resolving on demand spares session creation from
/// mapping every token of every utility.
pub(crate) fn utility_variable<'a>(
    utility: &'a UtilityDefinition,
    key: &str,
    manifest: &'a Program,
) -> Option<&'a str> {
    let variables = &manifest.compiled_variables;
    if let Some((_, name)) = utility
        .variable_aliases
        .iter()
        .find(|(alias, name)| alias == key && variables.contains_key(name))
    {
        return Some(name);
    }
    if excludes_key(utility, key) {
        return None;
    }
    for reference in &utility.variable_alias_refs {
        let namespace = reference.strip_prefix('~').unwrap_or(reference.as_str());
        let found = namespace_variable_names(namespace, key)
            .iter()
            .filter_map(|name| variables.get_key_value(name))
            .filter(|(name, _)| {
                get_variable_key_by_namespace(name, namespace).as_deref() == Some(key)
            })
            .min_by_key(|(_, variable)| variable.order);
        if let Some((name, _)) = found {
            return Some(name);
        }
    }
    None
}

/// Every token key of a utility with the variable it names, in the order and with
/// the precedence of `utility_variable`.
pub(crate) fn utility_variable_entries(
    utility: &UtilityDefinition,
    manifest: &Program,
) -> Vec<(String, String)> {
    let mut entries = Vec::new();
    let mut seen = HashSet::default();
    for (key, name) in &utility.variable_aliases {
        if manifest.compiled_variables.contains_key(name) && seen.insert(key.clone()) {
            entries.push((key.clone(), name.clone()));
        }
    }
    for reference in &utility.variable_alias_refs {
        let namespace = reference.strip_prefix('~').unwrap_or(reference.as_str());
        for name in &manifest.compiled_variable_order {
            if let Some(key) = get_variable_key_by_namespace(name, namespace)
                && !excludes_key(utility, &key)
                && seen.insert(key.clone())
            {
                entries.push((key, name.clone()));
            }
        }
    }
    entries
}

/// Recipe keys that are CSS strings never take a custom property as their key.
fn excludes_key(utility: &UtilityDefinition, key: &str) -> bool {
    matches!(utility.emit, UtilityEmit::Recipe { key: true, .. }) && key.contains("--")
}

/// The variable names whose key in `namespace` can be `key`, the inverse of
/// `get_variable_key_by_namespace`: `namespace-key`, or `namespace` and
/// `namespace-` for an empty key, and the negative `-namespace…` forms of a key
/// starting with `-`.
fn namespace_variable_names(namespace: &str, key: &str) -> Vec<String> {
    let mut names = Vec::with_capacity(2);
    if key.is_empty() {
        names.push(namespace.to_owned());
        names.push(concat_text!(namespace, "-"));
    } else {
        names.push(concat_text!(namespace, "-", key));
    }
    if let Some(positive) = key.strip_prefix('-') {
        if positive.is_empty() {
            names.push(concat_text!("-", namespace));
            names.push(concat_text!("-", namespace, "-"));
        } else {
            names.push(concat_text!("-", namespace, "-", positive));
        }
    }
    names
}

pub(crate) fn get_variable_key_by_namespace(
    variable_name: &str,
    namespace: &str,
) -> Option<String> {
    let (negative, positive_name) = variable_name
        .strip_prefix('-')
        .map_or((false, variable_name), |name| (true, name));
    let rest = positive_name.strip_prefix(namespace)?;
    let key = match rest.strip_prefix('-') {
        Some(key) => key,
        None if rest.is_empty() => "",
        None => return None,
    };
    Some(if negative {
        concat_text!("-", key)
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
    compare_rule_priority(&left.ir, &right.ir)
        .then_with(|| left.manifest_order.cmp(&right.manifest_order))
}

/// Compare generated rule order within one CSS layer. Hosts that reason about
/// conflicts must use the same value-source and declaration ordering as rendering.
pub fn compare_rule_priority(left: &GeneratedRuleIr, right: &GeneratedRuleIr) -> Ordering {
    left.sort_tier
        .cmp(&right.sort_tier)
        .then_with(|| compare_condition_features(&left.priority.features, &right.priority.features))
        .then_with(|| left.priority.conditions.cmp(&right.priority.conditions))
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

pub fn compare_condition_features(
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
        let identity = natural_compare(&left.domain, &right.domain)
            .then_with(|| natural_compare(&left.feature, &right.feature))
            .then_with(|| natural_compare(&left.unit, &right.unit));
        if identity != Ordering::Equal {
            return identity;
        }
        let lower = |range: &ConditionFeature| {
            range
                .lower
                .as_ref()
                .map_or(f64::NEG_INFINITY, |bound| bound.value)
        };
        let upper = |range: &ConditionFeature| {
            range
                .upper
                .as_ref()
                .map_or(f64::INFINITY, |bound| bound.value)
        };
        let width = |range: &ConditionFeature| upper(range) - lower(range);
        let unbounded_order = if left.upper.is_none() && right.upper.is_none() {
            lower(left).total_cmp(&lower(right))
        } else if left.lower.is_none() && right.lower.is_none() {
            upper(right).total_cmp(&upper(left))
        } else {
            Ordering::Equal
        };
        let order = unbounded_order
            .then_with(|| width(right).total_cmp(&width(left)))
            .then_with(|| lower(right).total_cmp(&lower(left)))
            .then_with(|| upper(right).total_cmp(&upper(left)))
            .then_with(|| {
                right
                    .lower
                    .as_ref()
                    .map(|bound| bound.inclusive)
                    .cmp(&left.lower.as_ref().map(|bound| bound.inclusive))
            })
            .then_with(|| {
                right
                    .upper
                    .as_ref()
                    .map(|bound| bound.inclusive)
                    .cmp(&left.upper.as_ref().map(|bound| bound.inclusive))
            });
        if order != Ordering::Equal {
            return order;
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

pub(crate) fn match_utility_filtered(
    class_name: &str,
    utility: &UtilityDefinition,
    manifest: &Program,
    accepts: impl Fn(&UtilityMatcher) -> bool,
) -> Option<UtilityMatch> {
    for matcher in utility.matchers.iter().filter(|matcher| accepts(matcher)) {
        match matcher {
            UtilityMatcher::Static { name }
                if class_name
                    .strip_prefix(name)
                    .is_some_and(is_match_state_boundary) =>
            {
                return Some(UtilityMatch {
                    value: None,
                    arguments: Vec::new(),
                    expansion: Default::default(),
                    state_token: class_name[name.len()..].to_owned(),
                    variable_names: Vec::new(),
                    matcher_type: UtilityMatcherType::Static,
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
                    if !value.is_empty() {
                        let (value, variable_names) =
                            resolve_value_components(&value, Some(utility), manifest);
                        return Some(UtilityMatch {
                            value: Some(value),
                            arguments: Vec::new(),
                            expansion: Default::default(),
                            state_token,
                            variable_names,
                            matcher_type: UtilityMatcherType::Key,
                        });
                    }
                }
            }
            UtilityMatcher::Token { prefix } => {
                let (negative, raw_value) = if let Some(value) = class_name.strip_prefix(prefix) {
                    (false, value)
                } else if let Some(value) = class_name
                    .strip_prefix('-')
                    .and_then(|name| name.strip_prefix(prefix))
                {
                    (true, value)
                } else {
                    continue;
                };
                let (value, state_token) = split_dynamic_value_state(raw_value);
                if value.is_empty() || has_top_level_value_separator(&value) {
                    continue;
                }
                if value.starts_with('-') {
                    continue;
                }
                if negative && !super::named::allows_negative_token(utility) {
                    continue;
                }
                let token = if negative {
                    concat_text!("-", value)
                } else {
                    value
                };
                let resolved = if matches!(utility.emit, UtilityEmit::Recipe { .. }) {
                    super::utility_matching::named_arguments(&token, utility, manifest)
                        .map(|(arguments, variable_names)| (None, arguments, variable_names))
                } else {
                    resolve_utility_alias_value(&token, utility, manifest)
                        .map(|(value, variable_names)| (Some(value), Vec::new(), variable_names))
                };
                let Some((value, arguments, variable_names)) = resolved else {
                    continue;
                };
                return Some(UtilityMatch {
                    value,
                    arguments,
                    expansion: Default::default(),
                    state_token,
                    variable_names,
                    matcher_type: UtilityMatcherType::Token,
                });
            }
            _ => {}
        }
    }
    None
}

/// An opacity modifier from 0 to 1 as a percentage, computed on its decimal digits so
/// `.07` becomes `7` rather than the binary float product `7.000000000000001`. It
/// accepts the decimal forms `f64::from_str` accepts, including an exponent.
pub(crate) fn alpha_percentage(alpha: &str) -> Option<String> {
    let crate::decimal::Decimal {
        negative,
        digits,
        point,
    } = crate::decimal::Decimal::parse(alpha)?;
    if digits.is_empty() {
        return Some("0".into());
    }
    if negative || point > 1 || point == 1 && digits != "1" {
        return None;
    }
    let point = point + 2;
    Some(if point <= 0 {
        concat_text!("0.", "0".repeat((-point) as usize), digits)
    } else if point as usize >= digits.len() {
        concat_text!(digits, "0".repeat(point as usize - digits.len()))
    } else {
        concat_text!(&digits[..point as usize], ".", &digits[point as usize..])
    })
}

pub(crate) fn resolve_utility_value(
    value: &str,
    utility: &UtilityDefinition,
    manifest: &Program,
) -> Option<(String, Vec<String>)> {
    if let Some((key, alpha)) = value.split_once('/') {
        let variable_name = utility_variable(utility, key, manifest)?;
        let variable = manifest.compiled_variables.get(variable_name)?;
        if !variable.namespace.starts_with("color") {
            return None;
        }
        let percentage = alpha_percentage(alpha)?;
        let color = concat_text!(
            "var(",
            mastercss_lexer::css_escape(&concat_text!("--", variable.name)),
            ")"
        );
        return Some((
            concat_text!(
                "color-mix(in oklab,",
                color,
                " ",
                percentage,
                "%,transparent)"
            ),
            vec![variable.name.clone()],
        ));
    }
    let (negative, key) = value
        .strip_prefix('-')
        .map_or((false, value), |key| (true, key));
    let variable_name = utility_variable(utility, key, manifest)?;
    let variable = manifest.compiled_variables.get(variable_name)?;
    if negative && variable.variable_type != "number" {
        return None;
    }
    let reference = concat_text!(
        "var(",
        mastercss_lexer::css_escape(&concat_text!("--", variable.name)),
        ")"
    );
    Some((
        if negative {
            concat_text!("calc(", reference, " * -1)")
        } else {
            reference
        },
        vec![variable.name.clone()],
    ))
}

pub(crate) fn resolve_utility_alias_value(
    value: &str,
    utility: &UtilityDefinition,
    manifest: &Program,
) -> Option<(String, Vec<String>)> {
    let key = value.split_once('/').map_or(value, |(key, _)| key);
    let key = key.strip_prefix('-').unwrap_or(key);
    utility_variable(utility, key, manifest)?;
    resolve_utility_value(value, utility, manifest)
}

pub(crate) fn resolve_value_components(
    value: &str,
    _utility: Option<&UtilityDefinition>,
    manifest: &Program,
) -> (String, Vec<String>) {
    let output = mastercss_lexer::decode_native_content(value).unwrap_or_else(|| value.to_owned());
    let mut variable_names = Vec::new();
    for name in collect_css_variable_names(&output) {
        if manifest.compiled_variables.contains_key(&name) && !variable_names.contains(&name) {
            variable_names.push(name);
        }
    }
    (normalize_css_math_functions(&output), variable_names)
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
