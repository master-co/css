use super::{
    CompilerError, CssDirectiveManifestInput, CssDirectiveVariableDefinition, DeclarationBlock,
    ErrorCode, PrinterError, PrinterOptions, Property, SourceRange, ThemeAtRule, ToCss, Value,
    byte_to_utf16_offset, css_block_end,
};

pub(crate) fn directive_range(source: &str, byte_offset: usize) -> Option<SourceRange> {
    let directives = [
        "@theme",
        "@settings",
        "@defaults",
        "@components",
        "@utilities",
        "@custom-variant",
    ];
    let (start, keyword) = directives
        .into_iter()
        .flat_map(|keyword| {
            source
                .match_indices(keyword)
                .map(move |(start, _)| (start, keyword))
        })
        .min_by_key(|(start, _)| start.abs_diff(byte_offset))?;
    let end = (start + keyword.len()).min(source.len());
    Some(SourceRange {
        start: byte_to_utf16_offset(source, start)?,
        end: byte_to_utf16_offset(source, end)?,
    })
}

pub(crate) fn directive_error(
    source: &str,
    filename: &str,
    start_byte: usize,
    message: impl Into<String>,
) -> CompilerError {
    CompilerError::Directive {
        message: message.into(),
        filename: filename.to_owned(),
        range: directive_range(source, start_byte),
    }
}

pub(crate) fn ranged_directive_diagnostic(
    source: &str,
    filename: &str,
    start_byte: usize,
    end_byte: usize,
    code: ErrorCode,
    message: impl Into<String>,
) -> CompilerError {
    CompilerError::DirectiveDiagnostic {
        code,
        message: message.into(),
        filename: filename.to_owned(),
        range: byte_to_utf16_offset(source, start_byte).and_then(|start| {
            byte_to_utf16_offset(source, end_byte).map(|end| SourceRange { start, end })
        }),
    }
}

pub(crate) fn parse_theme_prelude(
    source: &str,
    filename: &str,
    rule: &ThemeAtRule,
) -> Result<(Option<String>, bool, bool), CompilerError> {
    let mut mode = None;
    let mut inline = false;
    let mut is_static = false;
    for part in &rule.prelude.parts {
        match part.as_str() {
            "inline" => {
                if inline {
                    return Err(directive_error(
                        source,
                        filename,
                        rule.start_byte,
                        "@theme inline modifier cannot be repeated",
                    ));
                }
                inline = true;
            }
            "static" => {
                if is_static {
                    return Err(directive_error(
                        source,
                        filename,
                        rule.start_byte,
                        "@theme static modifier cannot be repeated",
                    ));
                }
                is_static = true;
            }
            _ => {
                if mode.is_some() {
                    return Err(directive_error(
                        source,
                        filename,
                        rule.start_byte,
                        "@theme mode must be a single token",
                    ));
                }
                mode = Some(part.clone());
            }
        }
    }
    if inline && is_static {
        return Err(directive_error(
            source,
            filename,
            rule.start_byte,
            "@theme inline and static cannot be combined",
        ));
    }
    if inline && mode.is_some() {
        return Err(directive_error(
            source,
            filename,
            rule.start_byte,
            "@theme inline cannot be mode-specific",
        ));
    }
    Ok((mode, inline, is_static))
}

#[allow(clippy::cmp_owned)] // Exact JSON number text is part of the JavaScript parity contract.
pub(crate) fn theme_value(value: String) -> Value {
    let value = value.trim().to_owned();
    serde_json::from_str::<Value>(&value)
        .ok()
        .filter(Value::is_number)
        .filter(|number| number.to_string() == value)
        .unwrap_or(Value::String(value))
}

pub(crate) fn next_char_end(value: &str, index: usize) -> usize {
    index
        + value[index..]
            .chars()
            .next()
            .map(char::len_utf8)
            .unwrap_or_default()
}

pub(crate) fn css_quote_end(value: &str, start: usize, quote: char) -> usize {
    let mut index = start + quote.len_utf8();
    while index < value.len() {
        let character = value[index..].chars().next().unwrap_or_default();
        let next = next_char_end(value, index);
        if character == '\\' {
            index = if next < value.len() {
                next_char_end(value, next)
            } else {
                next
            };
            continue;
        }
        index = next;
        if character == quote {
            return index;
        }
    }
    value.len()
}

pub(crate) fn css_comment_end(value: &str, start: usize) -> usize {
    value[start + 2..]
        .find("*/")
        .map(|offset| start + 2 + offset + 2)
        .unwrap_or(value.len())
}

pub(crate) fn css_function_end(value: &str, start: usize, name: &str) -> Option<usize> {
    let open = format!("{name}(");
    if !value[start..].starts_with(&open) {
        return None;
    }
    let mut index = start + open.len();
    let mut depth = 1_u32;
    while index < value.len() {
        let character = value[index..].chars().next()?;
        if matches!(character, '\'' | '"') {
            index = css_quote_end(value, index, character);
            continue;
        }
        if value[index..].starts_with("/*") {
            index = css_comment_end(value, index);
            continue;
        }
        index = next_char_end(value, index);
        match character {
            '(' => depth += 1,
            ')' => {
                depth = depth.checked_sub(1)?;
                if depth == 0 {
                    return Some(index);
                }
            }
            _ => {}
        }
    }
    None
}

pub(crate) fn is_css_number(value: &str) -> bool {
    let value = value
        .strip_prefix('+')
        .or_else(|| value.strip_prefix('-'))
        .unwrap_or(value);
    if value.is_empty() {
        return false;
    }
    if let Some(fraction) = value.strip_prefix('.') {
        return !fraction.is_empty() && fraction.bytes().all(|byte| byte.is_ascii_digit());
    }
    let mut parts = value.split('.');
    let integer = parts.next().unwrap_or_default();
    let fraction = parts.next();
    !integer.is_empty()
        && integer.bytes().all(|byte| byte.is_ascii_digit())
        && fraction.is_none_or(|fraction| {
            !fraction.is_empty() && fraction.bytes().all(|byte| byte.is_ascii_digit())
        })
        && parts.next().is_none()
}

pub(crate) fn format_alpha_percentage(value: f64) -> String {
    let value = if value == 0.0 {
        "0".to_owned()
    } else {
        value.to_string()
    };
    let value = value
        .strip_prefix("0.")
        .map(|fraction| format!(".{fraction}"))
        .or_else(|| {
            value
                .strip_prefix("-0.")
                .map(|fraction| format!("-.{fraction}"))
        })
        .unwrap_or(value);
    format!("{value}%")
}

pub(crate) fn is_whole_css_function(value: &str, name: &str) -> bool {
    let value = value.trim();
    css_function_end(value, 0, name) == Some(value.len())
}

pub(crate) fn normalize_alpha_value(value: &str) -> Result<String, String> {
    let value = value.trim();
    if value.is_empty() {
        return Err("Invalid --alpha() function: alpha value cannot be empty".into());
    }
    if is_css_number(value) {
        let alpha = value.parse::<f64>().unwrap_or(f64::NAN);
        if !(0.0..=1.0).contains(&alpha) {
            return Err(format!(
                "Invalid --alpha() function: numeric alpha must be between 0 and 1: {value}"
            ));
        }
        return Ok(format_alpha_percentage(alpha * 100.0));
    }
    if let Some(number) = value
        .strip_suffix('%')
        .filter(|number| is_css_number(number))
    {
        let percentage = number.parse::<f64>().unwrap_or(f64::NAN);
        if !(0.0..=100.0).contains(&percentage) {
            return Err(format!(
                "Invalid --alpha() function: percentage alpha must be between 0% and 100%: {value}"
            ));
        }
        return Ok(format_alpha_percentage(percentage));
    }
    if is_whole_css_function(value, "var") || is_whole_css_function(value, "calc") {
        return Ok(value.to_owned());
    }
    Err(format!(
        "Invalid --alpha() function: unsupported alpha value \"{value}\""
    ))
}

pub(crate) fn normalize_alpha_function(body: &str) -> Result<String, String> {
    let mut separator = None;
    let mut depth = 0_u32;
    let mut index = 0;
    while index < body.len() {
        let character = body[index..].chars().next().unwrap_or_default();
        if matches!(character, '\'' | '"') {
            index = css_quote_end(body, index, character);
            continue;
        }
        if body[index..].starts_with("/*") {
            index = css_comment_end(body, index);
            continue;
        }
        match character {
            '(' => depth += 1,
            ')' => depth = depth.saturating_sub(1),
            '/' if depth == 0 => {
                if separator.is_some() {
                    return Err("Invalid --alpha() function: expected \"<color> / <alpha>\"".into());
                }
                separator = Some(index);
            }
            _ => {}
        }
        index = next_char_end(body, index);
    }
    let separator = separator
        .ok_or_else(|| "Invalid --alpha() function: expected \"<color> / <alpha>\"".to_owned())?;
    let color = body[..separator].trim();
    if color.is_empty() {
        return Err("Invalid --alpha() function: color value cannot be empty".into());
    }
    let alpha = normalize_alpha_value(&body[separator + 1..])?;
    Ok(format!("color-mix(in oklab,{color} {alpha},transparent)"))
}

pub(crate) fn is_alias_character(byte: u8) -> bool {
    byte.is_ascii_alphanumeric() || matches!(byte, b'_' | b'-')
}

pub(crate) fn normalize_stylesheet_value(
    value: &str,
    replace_pipes: bool,
) -> Result<String, String> {
    let mut result = String::with_capacity(value.len());
    let mut index = 0;
    while index < value.len() {
        let character = value[index..].chars().next().unwrap_or_default();
        if matches!(character, '\'' | '"') {
            let end = css_quote_end(value, index, character);
            result.push_str(&value[index..end]);
            index = end;
            continue;
        }
        if value[index..].starts_with("/*") {
            let end = css_comment_end(value, index);
            result.push_str(&value[index..end]);
            index = end;
            continue;
        }
        if character == '$' && !value[..index].ends_with('\\') {
            let mut end = index + 1;
            if value.as_bytes().get(end) == Some(&b'-') {
                end += 1;
            }
            while value
                .as_bytes()
                .get(end)
                .is_some_and(|byte| is_alias_character(*byte))
            {
                end += 1;
            }
            if end > index + 1 {
                let alias = &value[index + 1..end];
                return Err(format!(
                    "Stylesheet values use native CSS variable references. Replace \"${alias}\" with \"var(--{alias})\"."
                ));
            }
        }
        if value[index..].starts_with("--alpha(")
            && let Some(end) = css_function_end(value, index, "--alpha")
        {
            let body_start = index + "--alpha(".len();
            result.push_str(&normalize_alpha_function(&value[body_start..end - 1])?);
            index = end;
            continue;
        }
        if replace_pipes && character == '|' {
            result.push(' ');
        } else {
            result.push(character);
        }
        index = next_char_end(value, index);
    }
    Ok(result)
}

pub(crate) fn normalize_theme_stylesheet_value(value: &str) -> Result<String, String> {
    normalize_stylesheet_value(value, true)
}

pub(crate) fn define_theme_variable(
    manifest_input: &mut CssDirectiveManifestInput,
    definition: CssDirectiveVariableDefinition,
) {
    let variables = manifest_input.variables.get_or_insert_default();
    if let Some(index) = variables
        .iter()
        .position(|existing| existing.name == definition.name && existing.mode == definition.mode)
    {
        variables.remove(index);
    }
    variables.push(definition);
}

pub(crate) fn declaration_name(declaration: &Property<'_>) -> Result<String, PrinterError> {
    declaration
        .property_id()
        .to_css_string(PrinterOptions::default())
}

pub(crate) fn collect_declarations(
    declarations: &DeclarationBlock<'_>,
    filename: &str,
) -> Result<serde_json::Map<String, Value>, CompilerError> {
    let mut result = serde_json::Map::new();
    for declaration in &declarations.declarations {
        let name = declaration_name(declaration).map_err(|error| CompilerError::Print {
            message: error.to_string(),
            filename: filename.to_owned(),
        })?;
        let value = declaration
            .value_to_css_string(PrinterOptions::default())
            .map_err(|error| CompilerError::Print {
                message: error.to_string(),
                filename: filename.to_owned(),
            })?;
        let value = normalize_stylesheet_value(&value, true).map_err(|message| {
            CompilerError::Directive {
                message,
                filename: filename.to_owned(),
                range: None,
            }
        })?;
        result.insert(name, Value::String(value));
    }
    for declaration in &declarations.important_declarations {
        let name = declaration_name(declaration).map_err(|error| CompilerError::Print {
            message: error.to_string(),
            filename: filename.to_owned(),
        })?;
        let value = declaration
            .value_to_css_string(PrinterOptions::default())
            .map_err(|error| CompilerError::Print {
                message: error.to_string(),
                filename: filename.to_owned(),
            })?;
        let value = normalize_stylesheet_value(&value, true).map_err(|message| {
            CompilerError::Directive {
                message,
                filename: filename.to_owned(),
                range: None,
            }
        })?;
        result.insert(name, Value::String(format!("{value} !important")));
    }
    Ok(result)
}

pub(crate) fn simple_ratio_literal(value: &str) -> bool {
    let Some((left, right)) = value.split_once('/') else {
        return false;
    };
    !left.trim().is_empty()
        && !right.trim().is_empty()
        && left
            .trim()
            .chars()
            .all(|character| character.is_ascii_digit() || matches!(character, '+' | '-' | '.'))
        && right
            .trim()
            .chars()
            .all(|character| character.is_ascii_digit() || matches!(character, '+' | '-' | '.'))
}

pub(crate) fn scientific_dimension_literal(value: &str) -> bool {
    let value = value.trim();
    let Some(exponent) = value.find(['e', 'E']) else {
        return false;
    };
    let mut unit_start = exponent + 1;
    if value
        .as_bytes()
        .get(unit_start)
        .is_some_and(|byte| matches!(byte, b'+' | b'-'))
    {
        unit_start += 1;
    }
    while value
        .as_bytes()
        .get(unit_start)
        .is_some_and(u8::is_ascii_digit)
    {
        unit_start += 1;
    }
    unit_start > exponent + 1
        && value[..unit_start].parse::<f64>().is_ok()
        && value[unit_start..]
            .chars()
            .all(|character| character.is_ascii_alphabetic() || character == '%')
}

pub(crate) fn raw_top_level_declarations(source: &str) -> Vec<(&str, &str)> {
    let mut declarations = Vec::new();
    let mut statement_start = 0;
    let mut index = 0;
    let mut parenthesis_depth = 0_u32;
    let mut bracket_depth = 0_u32;
    while index < source.len() {
        let character = source[index..].chars().next().unwrap_or_default();
        if matches!(character, '\'' | '"') {
            index = css_quote_end(source, index, character);
            continue;
        }
        if source[index..].starts_with("/*") {
            index = css_comment_end(source, index);
            continue;
        }
        match character {
            '(' => parenthesis_depth += 1,
            ')' => parenthesis_depth = parenthesis_depth.saturating_sub(1),
            '[' => bracket_depth += 1,
            ']' => bracket_depth = bracket_depth.saturating_sub(1),
            '{' if parenthesis_depth == 0 && bracket_depth == 0 => {
                index = css_block_end(source, index, source.len()).unwrap_or(source.len());
                statement_start = index;
                continue;
            }
            ';' if parenthesis_depth == 0 && bracket_depth == 0 => {
                let statement = source[statement_start..index].trim();
                if let Some((property, value)) = statement.split_once(':') {
                    declarations.push((property.trim(), value.trim()));
                }
                statement_start = index + 1;
            }
            _ => {}
        }
        index = next_char_end(source, index);
    }
    let statement = source[statement_start..].trim();
    if let Some((property, value)) = statement.split_once(':') {
        declarations.push((property.trim(), value.trim()));
    }
    declarations
}

pub(crate) fn preserve_compatible_literal_spelling(
    source: &str,
    start: usize,
    declarations: &mut serde_json::Map<String, Value>,
) {
    let Some(open) = source[start..].find('{').map(|offset| start + offset) else {
        return;
    };
    let Some(end) = css_block_end(source, open, source.len()) else {
        return;
    };
    for (property, raw_value) in raw_top_level_declarations(&source[open + 1..end - 1]) {
        let raw_value = raw_value
            .strip_suffix("!important")
            .map(str::trim_end)
            .unwrap_or(raw_value);
        if simple_ratio_literal(raw_value) {
            declarations.insert(
                property.into(),
                Value::String(raw_value.split_whitespace().collect()),
            );
        } else if scientific_dimension_literal(raw_value) {
            declarations.insert(property.into(), Value::String(raw_value.into()));
        }
    }
}
