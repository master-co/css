use super::{
    CompilerError, DeclarationBlock, ErrorCode, PrinterError, PrinterOptions, Property,
    SourceRange, ToCss, Value, byte_to_utf16_offset,
};

pub(crate) fn directive_range(source: &str, byte_offset: usize) -> Option<SourceRange> {
    let token = mastercss_lexer::tokenize_css_syntax(source)
        .into_iter()
        .filter(|token| matches!(token.kind, mastercss_lexer::CssSyntaxKind::AtKeyword(_)))
        .min_by_key(|token| token.bytes.start.abs_diff(byte_offset))?;
    Some(SourceRange {
        start: byte_to_utf16_offset(source, token.bytes.start)?,
        end: byte_to_utf16_offset(source, token.bytes.end)?,
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
