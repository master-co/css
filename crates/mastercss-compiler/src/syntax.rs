use super::{
    CompilerError, CssDirectiveManifestInput, CssDirectiveVariableDefinition, DeclarationBlock,
    ErrorCode, PrinterError, PrinterOptions, Property, SourceRange, ThemeAtRule, ToCss, Value,
    byte_to_utf16_offset,
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

pub(crate) fn is_alias_character(byte: u8) -> bool {
    byte.is_ascii_alphanumeric() || matches!(byte, b'_' | b'-')
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
