use super::*;

/// Extracts matching top-level at-rule blocks and replaces them with whitespace.
/// Newlines are retained so a subsequent domain parser keeps useful line locations.
pub fn extract_top_level_at_rule_blocks(
    source: &str,
    names: &[&str],
) -> (String, Vec<CssAtRuleBlock>) {
    let mut blocks = Vec::new();
    scan_top_level_at_rules(source, |start, name| {
        if !names
            .iter()
            .any(|candidate| name.eq_ignore_ascii_case(candidate))
        {
            return None;
        }
        let statement_end = find_css_statement_end(source, start);
        if statement_end.reason != CssStatementEndReason::Block {
            return None;
        }
        let end = find_css_block_end(source, statement_end.end)?;
        blocks.push(CssAtRuleBlock {
            start: byte_to_utf16_offset(source, start).unwrap_or_default(),
            end: byte_to_utf16_offset(source, end).unwrap_or_default(),
            name: name.to_owned(),
            source: source[start..end].to_owned(),
        });
        Some(end)
    });
    if blocks.is_empty() {
        return (source.to_owned(), blocks);
    }

    let mut output = String::with_capacity(source.len());
    let mut byte_index = 0;
    for block in &blocks {
        let Some(start) = utf16_to_byte_offset(source, block.start) else {
            continue;
        };
        let Some(end) = utf16_to_byte_offset(source, block.end) else {
            continue;
        };
        output.push_str(&source[byte_index..start]);
        for character in source[start..end].chars() {
            output.push(if character == '\n' { '\n' } else { ' ' });
        }
        byte_index = end;
    }
    output.push_str(&source[byte_index..]);
    (output, blocks)
}

pub(crate) fn scan_top_level_at_rules(
    source: &str,
    mut visitor: impl FnMut(usize, &str) -> Option<usize>,
) {
    let mut index = 0;
    let mut depth = 0_u32;
    let mut quote = None;
    let mut comment = false;
    while index < source.len() {
        let Some(character) = source[index..].chars().next() else {
            break;
        };
        let next_index = index + character.len_utf8();
        let next = source[next_index..].chars().next();
        if comment {
            if character == '*' && next == Some('/') {
                comment = false;
                index = next_index + 1;
            } else {
                index = next_index;
            }
            continue;
        }
        if let Some(current_quote) = quote {
            if character == '\\' {
                index = next.map_or(next_index, |next| next_index + next.len_utf8());
            } else {
                if character == current_quote {
                    quote = None;
                }
                index = next_index;
            }
            continue;
        }
        if character == '/' && next == Some('*') {
            comment = true;
            index = next_index + 1;
            continue;
        }
        if matches!(character, '\'' | '"') {
            quote = Some(character);
            index = next_index;
            continue;
        }
        if character == '{' {
            depth += 1;
        } else if character == '}' {
            depth = depth.saturating_sub(1);
        } else if depth == 0 && character == '@' {
            let name_start = next_index;
            let mut name_end = name_start;
            for (offset, character) in source[name_start..].char_indices() {
                if !(character.is_ascii_alphanumeric() || matches!(character, '-' | '_')) {
                    break;
                }
                name_end = name_start + offset + character.len_utf8();
            }
            if name_end > name_start
                && let Some(end) = visitor(index, &source[name_start..name_end])
            {
                index = end;
                continue;
            }
        }
        index = next_index;
    }
}

pub(crate) fn find_css_statement_end(source: &str, start: usize) -> CssStatementEnd {
    let mut index = start;
    let mut depth = 0_u32;
    let mut quote = None;
    let mut comment = false;
    while index < source.len() {
        let Some(character) = source[index..].chars().next() else {
            break;
        };
        let next_index = index + character.len_utf8();
        let next = source[next_index..].chars().next();
        if comment {
            if character == '*' && next == Some('/') {
                comment = false;
                index = next_index + 1;
            } else {
                index = next_index;
            }
            continue;
        }
        if let Some(current_quote) = quote {
            if character == '\\' {
                index = next.map_or(next_index, |next| next_index + next.len_utf8());
            } else {
                if character == current_quote {
                    quote = None;
                }
                index = next_index;
            }
            continue;
        }
        if character == '/' && next == Some('*') {
            comment = true;
            index = next_index + 1;
            continue;
        }
        if matches!(character, '\'' | '"') {
            quote = Some(character);
        } else if matches!(character, '(' | '[') {
            depth += 1;
        } else if matches!(character, ')' | ']') {
            depth = depth.saturating_sub(1);
        } else if depth == 0 && character == ';' {
            return CssStatementEnd {
                end: next_index,
                reason: CssStatementEndReason::Semicolon,
            };
        } else if depth == 0 && character == '{' {
            return CssStatementEnd {
                end: index,
                reason: CssStatementEndReason::Block,
            };
        }
        index = next_index;
    }
    CssStatementEnd {
        end: source.len(),
        reason: CssStatementEndReason::Eof,
    }
}

pub(crate) fn find_css_block_end(source: &str, block_start: usize) -> Option<usize> {
    let mut index = block_start;
    let mut depth = 0_u32;
    let mut quote = None;
    let mut comment = false;
    while index < source.len() {
        let character = source[index..].chars().next()?;
        let next_index = index + character.len_utf8();
        let next = source[next_index..].chars().next();
        if comment {
            if character == '*' && next == Some('/') {
                comment = false;
                index = next_index + 1;
            } else {
                index = next_index;
            }
            continue;
        }
        if let Some(current_quote) = quote {
            if character == '\\' {
                index = next.map_or(next_index, |next| next_index + next.len_utf8());
            } else {
                if character == current_quote {
                    quote = None;
                }
                index = next_index;
            }
            continue;
        }
        if character == '/' && next == Some('*') {
            comment = true;
            index = next_index + 1;
            continue;
        }
        if matches!(character, '\'' | '"') {
            quote = Some(character);
        } else if character == '{' {
            depth += 1;
        } else if character == '}' {
            depth = depth.checked_sub(1)?;
            if depth == 0 {
                return Some(next_index);
            }
        }
        index = next_index;
    }
    None
}

pub(crate) fn read_quoted(source: &str, quote: char) -> Option<&str> {
    let mut escaped = false;
    for (index, character) in source.char_indices() {
        if escaped {
            escaped = false;
        } else if character == '\\' {
            escaped = true;
        } else if character == quote {
            return Some(&source[..index]);
        }
    }
    None
}
