use super::{
    ManifestProjection, StateBranch, UtilityDefinition, UtilityEmit, Value, css_escape,
    is_css_identifier_character, split_top_level,
};

pub(crate) fn create_selector_text(
    class_name: &str,
    declaration_selector: Option<&str>,
    branch: &StateBranch,
    _manifest: &ManifestProjection,
) -> String {
    let body = format!(".{}", css_escape(class_name));
    let mut selector = branch
        .selector_template
        .as_deref()
        .map(|template| {
            mastercss_lexer::replace_nesting_selector(template, &body)
                .unwrap_or_else(|| template.to_owned())
        })
        .unwrap_or(body);
    if let Some(template) = declaration_selector {
        selector = mastercss_lexer::replace_nesting_selector(template, &selector)
            .unwrap_or_else(|| template.to_owned());
    }
    selector
}

pub(crate) fn composition_selector(branch: &StateBranch, _manifest: &ManifestProjection) -> String {
    let anchor = "&".to_owned();
    branch
        .selector_template
        .as_deref()
        .map(|template| {
            mastercss_lexer::replace_nesting_selector(template, &anchor)
                .unwrap_or_else(|| template.to_owned())
        })
        .unwrap_or(anchor)
}

pub(crate) fn composition_conditions(branch: &StateBranch) -> Vec<String> {
    branch
        .condition_wrappers
        .iter()
        .filter(|(id, _)| id != "layer" || branch.layer.is_none())
        .map(|(_, wrapper)| wrapper.clone())
        .collect()
}

pub(crate) fn parse_serialized_declarations(source: &str) -> Vec<super::CssDeclaration> {
    let mut declarations = Vec::new();
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
            declarations.push(super::CssDeclaration {
                property: property.into(),
                value: Value::String(value.into()),
                source: None,
            });
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
    for (_, wrapper) in wrappers.iter().rev() {
        text = format!("{wrapper}{{{text}}}");
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
    manifest: &super::ManifestProjection,
) -> Vec<(usize, String, Option<String>, Vec<String>)> {
    match &utility.emit {
        UtilityEmit::Mixin { name } => {
            super::mixin_matching::emit(manifest, name, matched_value, important)
        }
        UtilityEmit::Property { property } => matched_value
            .filter(|value| !value.is_empty())
            .map(|value| {
                vec![(
                    0,
                    format_native_declaration(property, value, important),
                    None,
                    Vec::new(),
                )]
            })
            .unwrap_or_default(),
    }
}

pub(crate) fn format_declaration(property: &str, value: &str, important: bool) -> String {
    if important && !value.ends_with("!important") {
        format!("{property}:{value}!important")
    } else {
        format!("{property}:{value}")
    }
}

/// Compatibility declarations are an engine output policy, not preset recipes.
fn format_native_declaration(property: &str, value: &str, important: bool) -> String {
    let standard = format_declaration(property, value, important);
    if matches!(
        property,
        "text-decoration"
            | "backdrop-filter"
            | "box-decoration-break"
            | "mask-image"
            | "user-drag"
            | "user-select"
    ) {
        format!(
            "{};{standard}",
            format_declaration(&format!("-webkit-{property}"), value, important)
        )
    } else {
        standard
    }
}
