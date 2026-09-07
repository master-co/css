use super::{
    CssDirectiveRange, CssQuotedStringRange, CssStatementEndReason, SourceRange,
    byte_to_utf16_offset, find_css_block_end, find_css_statement_end,
};

pub fn find_css_directive_ranges(source: &str) -> Vec<CssDirectiveRange> {
    const NAMES: [&str; 17] = [
        "master",
        "settings",
        "source",
        "safelist",
        "blocklist",
        "preserve",
        "reference",
        "theme",
        "defaults",
        "components",
        "utilities",
        "custom-variant",
        "compose",
        "variant",
        "slot",
        "dark",
        "light",
    ];

    let mut ranges = Vec::new();
    let mut index = 0;
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
        if character != '@' {
            index = next_index;
            continue;
        }

        let name_start = next_index;
        let mut name_end = name_start;
        for (offset, name_character) in source[name_start..].char_indices() {
            if !(name_character.is_ascii_alphanumeric() || matches!(name_character, '-' | '_')) {
                break;
            }
            name_end = name_start + offset + name_character.len_utf8();
        }
        let raw_name = &source[name_start..name_end];
        if !NAMES.contains(&raw_name) {
            index = next_index;
            continue;
        }

        let statement_end = find_css_statement_end(source, name_end);
        let prelude_end = match statement_end.reason {
            CssStatementEndReason::Semicolon => statement_end.end.saturating_sub(1),
            CssStatementEndReason::Block | CssStatementEndReason::Eof => statement_end.end,
        };
        if raw_name == "master" && source[name_end..prelude_end].trim() != "entry" {
            index = next_index;
            continue;
        }
        let end = if statement_end.reason == CssStatementEndReason::Block {
            find_css_block_end(source, statement_end.end).unwrap_or(source.len())
        } else {
            statement_end.end
        };
        let block_range =
            (statement_end.reason == CssStatementEndReason::Block).then(|| SourceRange {
                start: byte_to_utf16_offset(source, statement_end.end).unwrap_or_default(),
                end: byte_to_utf16_offset(source, end).unwrap_or_default(),
            });
        ranges.push(CssDirectiveRange {
            range: SourceRange {
                start: byte_to_utf16_offset(source, index).unwrap_or_default(),
                end: byte_to_utf16_offset(source, end).unwrap_or_default(),
            },
            name: if matches!(raw_name, "dark" | "light") {
                "variant".to_owned()
            } else {
                raw_name.to_owned()
            },
            prelude_range: SourceRange {
                start: byte_to_utf16_offset(source, name_end).unwrap_or_default(),
                end: byte_to_utf16_offset(source, prelude_end).unwrap_or_default(),
            },
            block_range,
            quoted_string_ranges: find_css_quoted_string_ranges(source, name_end, prelude_end),
        });
        if statement_end.reason == CssStatementEndReason::Semicolon {
            index = statement_end.end;
        } else {
            index = next_index;
        }
    }
    ranges
}

pub(crate) fn find_css_quoted_string_ranges(
    source: &str,
    start: usize,
    end: usize,
) -> Vec<CssQuotedStringRange> {
    let mut ranges = Vec::new();
    let mut index = start;
    let mut comment = false;
    while index < end {
        let character = source[index..].chars().next().unwrap_or_default();
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
        if character == '/' && next == Some('*') {
            comment = true;
            index = next_index + 1;
            continue;
        }
        if !matches!(character, '\'' | '"') {
            index = next_index;
            continue;
        }
        let quote = character;
        let content_start = next_index;
        let mut close = content_start;
        while close < end {
            let value = source[close..].chars().next().unwrap_or_default();
            let value_end = close + value.len_utf8();
            if value == '\\' {
                close = source[value_end..]
                    .chars()
                    .next()
                    .map_or(value_end, |escaped| value_end + escaped.len_utf8());
            } else if value == quote {
                break;
            } else {
                close = value_end;
            }
        }
        let range_end = if close < end {
            close + quote.len_utf8()
        } else {
            end
        };
        ranges.push(CssQuotedStringRange {
            range: SourceRange {
                start: byte_to_utf16_offset(source, index).unwrap_or_default(),
                end: byte_to_utf16_offset(source, range_end).unwrap_or_default(),
            },
            content_range: SourceRange {
                start: byte_to_utf16_offset(source, content_start).unwrap_or_default(),
                end: byte_to_utf16_offset(source, close.min(end)).unwrap_or_default(),
            },
        });
        index = range_end;
    }
    ranges
}
