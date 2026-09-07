use super::CssVariableReference;

/// Collects syntactically active CSS custom-property references in source order.
///
/// References inside strings and comments are ignored. Nested fallback references
/// are collected independently from their containing `var()` function.
pub fn collect_css_variable_references(source: &str) -> Vec<String> {
    let mut references = Vec::new();
    let mut index = 0;
    while index < source.len() {
        if let Some(end) = skip_css_string_or_comment(source, index) {
            index = end;
            continue;
        }
        if let Some(reference) = read_css_variable_reference(source, index)
            && !references.iter().any(|existing| existing == reference.name)
        {
            references.push(reference.name.to_owned());
        }
        index += source[index..].chars().next().map_or(1, char::len_utf8);
    }
    references
}

/// Replaces syntactically active CSS custom-property references.
///
/// The replacer receives the custom-property name without `--` and the complete
/// `var()` text, including any fallback. Returning `None` preserves the original
/// reference and skips replacements inside its fallback.
pub fn transform_css_variable_references<E>(
    source: &str,
    mut replacer: impl FnMut(&str, &str) -> Result<Option<String>, E>,
) -> Result<String, E> {
    let mut output = String::with_capacity(source.len());
    let mut index = 0;
    let mut copied_until = 0;
    while index < source.len() {
        if let Some(end) = skip_css_string_or_comment(source, index) {
            index = end;
            continue;
        }
        if let Some(reference) = read_css_variable_reference(source, index) {
            output.push_str(&source[copied_until..index]);
            output.push_str(
                replacer(reference.name, reference.text)?
                    .as_deref()
                    .unwrap_or(reference.text),
            );
            index = reference.end;
            copied_until = index;
            continue;
        }
        index += source[index..].chars().next().map_or(1, char::len_utf8);
    }
    output.push_str(&source[copied_until..]);
    Ok(output)
}

pub(crate) fn read_css_variable_reference(
    source: &str,
    start: usize,
) -> Option<CssVariableReference<'_>> {
    let prefix = source.get(start..start + 4)?;
    if !prefix.eq_ignore_ascii_case("var(")
        || source[..start]
            .chars()
            .next_back()
            .is_some_and(is_css_identifier_character)
    {
        return None;
    }
    let mut cursor = start + 4;
    while source[cursor..]
        .chars()
        .next()
        .is_some_and(|character| character.is_ascii_whitespace())
    {
        cursor += 1;
    }
    if source.get(cursor..cursor + 2)? != "--" {
        return None;
    }
    cursor += 2;
    let name_start = cursor;
    while source[cursor..]
        .chars()
        .next()
        .is_some_and(is_css_variable_name_character)
    {
        cursor += 1;
    }
    if cursor == name_start {
        return None;
    }
    let mut index = cursor;
    let mut depth = 1_u32;
    while index < source.len() {
        if let Some(end) = skip_css_string_or_comment(source, index) {
            index = end;
            continue;
        }
        let character = source[index..].chars().next()?;
        index += character.len_utf8();
        if character == '(' {
            depth += 1;
        } else if character == ')' {
            depth -= 1;
            if depth == 0 {
                return Some(CssVariableReference {
                    name: &source[name_start..cursor],
                    text: &source[start..index],
                    end: index,
                });
            }
        }
    }
    None
}

pub(crate) fn skip_css_string_or_comment(source: &str, start: usize) -> Option<usize> {
    let character = source[start..].chars().next()?;
    if matches!(character, '"' | '\'') {
        let mut escaped = false;
        for (offset, next) in source[start + character.len_utf8()..].char_indices() {
            if escaped {
                escaped = false;
            } else if next == '\\' {
                escaped = true;
            } else if next == character {
                return Some(start + character.len_utf8() + offset + next.len_utf8());
            }
        }
        return Some(source.len());
    }
    if source[start..].starts_with("/*") {
        return Some(
            source[start + 2..]
                .find("*/")
                .map_or(source.len(), |offset| start + 2 + offset + 2),
        );
    }
    None
}

pub(crate) fn is_css_identifier_character(character: char) -> bool {
    character == '-'
        || character == '_'
        || character.is_ascii_alphanumeric()
        || !character.is_ascii()
}

pub(crate) fn is_css_variable_name_character(character: char) -> bool {
    character == '-' || character == '_' || character.is_ascii_alphanumeric()
}
