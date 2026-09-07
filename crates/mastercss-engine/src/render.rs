use super::{
    ManifestProjection, Map, StateBranch, UtilityDefinition, UtilityEmit, Value, css_escape,
    is_css_identifier_character, split_top_level,
};

pub(crate) fn create_selector_text(
    class_name: &str,
    declaration_selector: Option<&str>,
    branch: &StateBranch,
    manifest: &ManifestProjection,
) -> String {
    let mut body = format!(".{}", css_escape(class_name));
    let mut prefix = String::new();
    if let Some(scope) = &manifest.settings.scope {
        prefix.push_str(scope);
        prefix.push(' ');
    }
    if let Some(mode) = &branch.mode {
        match manifest.settings.mode_trigger.as_str() {
            "class" => prefix = format!(".{mode} {prefix}"),
            "host" => prefix = format!(":host(.{mode}) {prefix}"),
            _ => {}
        }
    }
    body.insert_str(0, &prefix);
    let mut selector = branch
        .selector_template
        .as_deref()
        .map(|template| template.replace('&', &body))
        .unwrap_or(body);
    if let Some(template) = declaration_selector {
        selector = template.replace('&', &selector);
    }
    selector
}

pub(crate) fn composition_selector(branch: &StateBranch, manifest: &ManifestProjection) -> String {
    let mut selector = branch
        .selector_template
        .clone()
        .unwrap_or_else(|| "&".into());
    if let Some(mode) = &branch.mode {
        selector = match manifest.settings.mode_trigger.as_str() {
            "class" => format!(".{mode} {selector}"),
            "host" => format!(":host(.{mode}) {selector}"),
            _ => selector,
        };
    }
    selector
}

pub(crate) fn composition_conditions(branch: &StateBranch) -> Vec<String> {
    ["container", "starting-style", "supports", "media", "layer"]
        .into_iter()
        .filter_map(|id| {
            if id == "layer" && branch.layer.is_some() {
                return None;
            }
            branch
                .condition_wrappers
                .iter()
                .find(|(current_id, _)| current_id == id)
                .map(|(_, wrapper)| wrapper.clone())
        })
        .collect()
}

pub(crate) fn parse_serialized_declarations(source: &str) -> Map<String, Value> {
    let mut declarations = Map::new();
    for declaration in split_top_level(source, ';') {
        let mut quote = None;
        let mut escaped = false;
        let mut depth = 0_u32;
        let mut separator = None;
        for (index, character) in declaration.char_indices() {
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
            } else if matches!(character, '(' | '[' | '{') {
                depth += 1;
            } else if matches!(character, ')' | ']' | '}') {
                depth = depth.saturating_sub(1);
            } else if character == ':' && depth == 0 {
                separator = Some(index);
                break;
            }
        }
        let Some(separator) = separator else {
            continue;
        };
        let property = declaration[..separator].trim();
        let value = declaration[separator + 1..].trim();
        if !property.is_empty() {
            declarations.insert(property.into(), Value::String(value.into()));
        }
    }
    declarations
}

pub(crate) fn wrap_raw_conditions(mut text: String, conditions: &[String]) -> String {
    for condition in conditions.iter().rev() {
        let condition = condition.trim();
        if !condition.is_empty() {
            text = format!("{condition}{{{text}}}");
        }
    }
    text
}

pub(crate) fn wrap_state_conditions(mut text: String, wrappers: &[(String, String)]) -> String {
    for id in ["container", "starting-style", "supports", "media", "layer"] {
        if let Some((_, wrapper)) = wrappers.iter().find(|(current_id, _)| current_id == id) {
            text = format!("{wrapper}{{{text}}}");
        }
    }
    text
}

pub(crate) fn selector_priority(selector: Option<&str>) -> i32 {
    let Some(selector) = selector else {
        return 0;
    };
    let priority = |token: &str| match token {
        "hover" => 1,
        "focus" | "focus-visible" => 2,
        "active" => 3,
        "disabled" => 4,
        _ => 0,
    };
    let mut total = 0;
    let mut index = 0;
    let mut quote = None;
    while index < selector.len() {
        let character = selector[index..].chars().next().unwrap_or_default();
        if let Some(current_quote) = quote {
            index += character.len_utf8();
            if character == '\\' {
                if let Some(escaped) = selector[index..].chars().next() {
                    index += escaped.len_utf8();
                }
            } else if character == current_quote {
                quote = None;
            }
            continue;
        }
        if matches!(character, '\'' | '"') {
            quote = Some(character);
            index += character.len_utf8();
            continue;
        }
        if character == '['
            && let Some(close) = selector[index + 1..].find(']')
        {
            total += priority(selector[index + 1..index + 1 + close].trim());
            index += close + 2;
            continue;
        }
        if character.is_ascii_alphanumeric() || character == '-' || character == '_' {
            let start = index;
            index += character.len_utf8();
            while selector[index..]
                .chars()
                .next()
                .is_some_and(is_css_identifier_character)
            {
                index += selector[index..]
                    .chars()
                    .next()
                    .unwrap_or_default()
                    .len_utf8();
            }
            total += priority(&selector[start..index]);
            continue;
        }
        index += character.len_utf8();
    }
    total
}

pub(crate) fn emit_declarations(
    utility: &UtilityDefinition,
    matched_value: Option<&str>,
    important: bool,
) -> Vec<(usize, String, Option<String>, Vec<String>)> {
    match &utility.emit {
        UtilityEmit::Static { rules } => rules
            .iter()
            .enumerate()
            .filter_map(|(index, rule)| {
                serialize_declarations(&rule.declarations, matched_value, important).map(
                    |declarations| {
                        (
                            index,
                            declarations,
                            rule.selector.clone(),
                            rule.conditions.clone(),
                        )
                    },
                )
            })
            .collect(),
        UtilityEmit::Property { property } => matched_value
            .filter(|value| !value.is_empty())
            .map(|value| {
                vec![(
                    0,
                    format_declaration(property, value, important),
                    None,
                    Vec::new(),
                )]
            })
            .unwrap_or_default(),
        UtilityEmit::Template { declarations } => {
            serialize_declarations(declarations, matched_value, important)
                .map(|declarations| vec![(0, declarations, None, Vec::new())])
                .unwrap_or_default()
        }
        UtilityEmit::Declarations { declarations } => {
            let text = declarations
                .iter()
                .map(|declaration| {
                    let declaration = matched_value
                        .map(|value| declaration.replace("$value", value))
                        .unwrap_or_else(|| declaration.clone());
                    if important && !declaration.ends_with("!important") {
                        format!("{declaration}!important")
                    } else {
                        declaration
                    }
                })
                .collect::<Vec<_>>()
                .join(";");
            (!text.is_empty())
                .then_some(vec![(0, text, None, Vec::new())])
                .unwrap_or_default()
        }
    }
}

pub(crate) fn serialize_declarations(
    declarations: &Map<String, Value>,
    matched_value: Option<&str>,
    important: bool,
) -> Option<String> {
    let mut output = Vec::new();
    for (property, raw_value) in declarations {
        let value = serialize_declaration_value(raw_value, matched_value)?;
        output.push(format_declaration(property, &value, important));
    }
    (!output.is_empty()).then(|| output.join(";"))
}

pub(crate) fn serialize_declaration_value(
    value: &Value,
    matched_value: Option<&str>,
) -> Option<String> {
    match value {
        Value::Null => Some(matched_value?.to_owned()),
        Value::String(value) => Some(
            matched_value
                .map(|matched| value.replace("$value", matched))
                .unwrap_or_else(|| value.clone()),
        ),
        Value::Number(value) => Some(value.to_string()),
        Value::Bool(value) => Some(value.to_string()),
        Value::Array(segments) => segments
            .iter()
            .map(|segment| serialize_declaration_value(segment, matched_value))
            .collect::<Option<Vec<_>>>()
            .map(|segments| segments.join("")),
        _ => None,
    }
}

pub(crate) fn format_declaration(property: &str, value: &str, important: bool) -> String {
    if important && !value.ends_with("!important") {
        format!("{property}:{value}!important")
    } else {
        format!("{property}:{value}")
    }
}
