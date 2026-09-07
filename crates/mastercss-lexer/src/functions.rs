use super::{
    CssDeclarationRange, CssFunction, SourceRange, byte_to_utf16_offset,
    skip_css_string_or_comment, utf16_to_byte_offset,
};

pub fn read_css_function(source: &str, start: u32, name: &str) -> Option<CssFunction> {
    let start = utf16_to_byte_offset(source, start)?;
    let open = start.checked_add(name.len())?;
    if source.get(start..open)? != name || source.get(open..open + 1)? != "(" {
        return None;
    }
    let mut index = open + 1;
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
                return Some(CssFunction {
                    body: source[open + 1..index - 1].to_owned(),
                    end: byte_to_utf16_offset(source, index)?,
                    text: source[start..index].to_owned(),
                });
            }
        }
    }
    None
}

pub(crate) fn trim_byte_range(source: &str, mut start: usize, mut end: usize) -> (usize, usize) {
    while start < end
        && source[start..]
            .chars()
            .next()
            .is_some_and(char::is_whitespace)
    {
        start += source[start..].chars().next().map_or(1, char::len_utf8);
    }
    while start < end
        && source[..end]
            .chars()
            .next_back()
            .is_some_and(char::is_whitespace)
    {
        end -= source[..end].chars().next_back().map_or(1, char::len_utf8);
    }
    (start, end)
}

pub(crate) fn declaration_from_segment(
    source: &str,
    start: usize,
    end: usize,
    terminator: Option<usize>,
) -> Option<CssDeclarationRange> {
    let (start, end) = trim_byte_range(source, start, end);
    if start == end || source[start..].starts_with('@') {
        return None;
    }
    let mut index = start;
    let mut colon = None;
    while index < end {
        if let Some(skip) = skip_css_string_or_comment(source, index) {
            index = skip.min(end);
            continue;
        }
        let character = source[index..].chars().next()?;
        if character == ':' {
            colon = Some(index);
            break;
        }
        index += character.len_utf8();
    }
    let colon = colon?;
    let (property_start, property_end) = trim_byte_range(source, start, colon);
    let (value_start, value_end) = trim_byte_range(source, colon + 1, end);
    if property_start == property_end || value_start == value_end {
        return None;
    }
    Some(CssDeclarationRange {
        property_range: SourceRange {
            start: byte_to_utf16_offset(source, property_start)?,
            end: byte_to_utf16_offset(source, property_end)?,
        },
        value_range: SourceRange {
            start: byte_to_utf16_offset(source, value_start)?,
            end: byte_to_utf16_offset(source, value_end)?,
        },
        terminator_range: terminator.map(|offset| SourceRange {
            start: byte_to_utf16_offset(source, offset).unwrap_or_default(),
            end: byte_to_utf16_offset(source, offset + 1).unwrap_or_default(),
        }),
    })
}

pub fn collect_css_declaration_ranges(
    source: &str,
    block_start: u32,
    block_end: u32,
) -> Vec<CssDeclarationRange> {
    let Some(start) = utf16_to_byte_offset(source, block_start) else {
        return Vec::new();
    };
    let Some(end) = utf16_to_byte_offset(source, block_end) else {
        return Vec::new();
    };
    let mut declarations = Vec::new();
    let mut segment_start = start;
    let mut index = start;
    let mut depth = 0_u32;
    while index < end {
        if let Some(skip) = skip_css_string_or_comment(source, index) {
            index = skip.min(end);
            continue;
        }
        let Some(character) = source[index..].chars().next() else {
            break;
        };
        let next = index + character.len_utf8();
        if character == '{' {
            depth += 1;
        } else if character == '}' && depth > 0 {
            depth -= 1;
            if depth == 0 {
                segment_start = next;
            }
        } else if character == ';' && depth == 0 {
            if let Some(declaration) =
                declaration_from_segment(source, segment_start, index, Some(index))
            {
                declarations.push(declaration);
            }
            segment_start = next;
        }
        index = next;
    }
    if let Some(declaration) = declaration_from_segment(source, segment_start, end, None) {
        declarations.push(declaration);
    }
    declarations
}
