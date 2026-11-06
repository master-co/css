//! Groups the class lists one markup element receives from its static `class`
//! and its class binding, so lint can compare classes across them.

use super::*;
use crate::document::collect_nested_string_contexts;

/// A class list of an element, as the same range `classPositions` report.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GroupedClassListIr {
    pub range: SourceRange,
    /// Whether the list only applies under a condition of the binding, such as
    /// an object key, a ternary branch or a `cond && '…'` array entry.
    pub conditional: bool,
}

/// The class lists of one element that has a class binding.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClassListGroupIr {
    pub lists: Vec<GroupedClassListIr>,
}

const BOUND_CLASS_ATTRIBUTES: [&str; 4] = [":class", "v-bind:class", "[class]", "[ngclass]"];

pub(crate) fn collect_class_list_groups(
    source: &str,
    positions: &DocumentIndex,
    language_id: &str,
) -> Vec<ClassListGroupIr> {
    if !matches!(language_id, "vue" | "html" | "angular-html") {
        return Vec::new();
    }
    let bytes = source.as_bytes();
    let lower = source.to_ascii_lowercase();
    let mut groups = Vec::new();
    let mut index = 0;
    while index < bytes.len() {
        if bytes[index..].starts_with(b"<!--") {
            index = lower[index..]
                .find("-->")
                .map_or(source.len(), |end| index + end + "-->".len());
            continue;
        }
        if bytes[index] != b'<' || !bytes.get(index + 1).is_some_and(u8::is_ascii_alphabetic) {
            index += 1;
            continue;
        }
        let name_start = index + 1;
        let mut cursor = name_start;
        while cursor < bytes.len()
            && !bytes[cursor].is_ascii_whitespace()
            && !matches!(bytes[cursor], b'>' | b'/')
        {
            cursor += 1;
        }
        let tag = &lower[name_start..cursor];
        let raw_text = matches!(tag, "script" | "style");
        let mut lists = Vec::new();
        let mut bound = false;
        while cursor < bytes.len() && bytes[cursor] != b'>' {
            if bytes[cursor].is_ascii_whitespace() || bytes[cursor] == b'/' {
                cursor += 1;
                continue;
            }
            let attribute_start = cursor;
            while cursor < bytes.len()
                && !bytes[cursor].is_ascii_whitespace()
                && !matches!(bytes[cursor], b'=' | b'>')
            {
                cursor += 1;
            }
            let attribute = &lower[attribute_start..cursor];
            while cursor < bytes.len() && bytes[cursor].is_ascii_whitespace() {
                cursor += 1;
            }
            if bytes.get(cursor) != Some(&b'=') {
                continue;
            }
            cursor += 1;
            while cursor < bytes.len() && bytes[cursor].is_ascii_whitespace() {
                cursor += 1;
            }
            let Some(&quote) = bytes
                .get(cursor)
                .filter(|byte| matches!(byte, b'"' | b'\''))
            else {
                while cursor < bytes.len()
                    && !bytes[cursor].is_ascii_whitespace()
                    && bytes[cursor] != b'>'
                {
                    cursor += 1;
                }
                continue;
            };
            let value_start = cursor + 1;
            let value_end = source[value_start..]
                .find(quote as char)
                .map_or(source.len(), |end| value_start + end);
            cursor = (value_end + 1).min(source.len());
            if attribute == "class" {
                if let (Some(start), Some(end)) = (
                    positions.byte_to_utf16(value_start),
                    positions.byte_to_utf16(value_end),
                ) {
                    lists.push(GroupedClassListIr {
                        range: SourceRange { start, end },
                        conditional: false,
                    });
                }
            } else if BOUND_CLASS_ATTRIBUTES.contains(&attribute) {
                bound = true;
                let mut contexts = Vec::new();
                collect_nested_string_contexts(
                    source,
                    positions,
                    value_start,
                    value_end,
                    &mut contexts,
                );
                for context in contexts
                    .into_iter()
                    .filter(|context| context.start < context.end)
                {
                    let (Some(start), Some(end)) = (
                        positions.utf16_to_byte(context.start),
                        positions.utf16_to_byte(context.end),
                    ) else {
                        continue;
                    };
                    lists.push(GroupedClassListIr {
                        range: SourceRange {
                            start: context.start,
                            end: context.end,
                        },
                        conditional: !unconditional_literal(
                            source,
                            value_start..value_end,
                            start,
                            end,
                        ),
                    });
                }
            }
        }
        index = (cursor + 1).min(source.len());
        if bound && lists.len() > 1 {
            groups.push(ClassListGroupIr { lists });
        }
        if raw_text {
            index = lower[index..]
                .find(&format!("</{tag}"))
                .map_or(source.len(), |end| index + end);
        }
    }
    groups
}

/// Whether the string literal holding `start..end` always applies: it is the
/// whole binding expression or a plain entry of a top-level array.
fn unconditional_literal(
    source: &str,
    expression: std::ops::Range<usize>,
    start: usize,
    end: usize,
) -> bool {
    let bytes = source.as_bytes();
    let Some(open) = start.checked_sub(1) else {
        return false;
    };
    let quote = bytes[open];
    // Template segments next to `${…}` are part of a dynamic string.
    if !matches!(quote, b'\'' | b'"' | b'`') || bytes.get(end) != Some(&quote) {
        return false;
    }
    let literal_end = end + 1;
    let trimmed = source[expression.clone()].trim();
    let trimmed_start = expression.start
        + (source[expression.clone()].len() - source[expression.clone()].trim_start().len());
    let trimmed_end = trimmed_start + trimmed.len();
    if open == trimmed_start && literal_end == trimmed_end {
        return true;
    }
    if !trimmed.starts_with('[') || !trimmed.ends_with(']') {
        return false;
    }
    let before = source[trimmed_start + 1..open].trim_end();
    let after = source[literal_end..trimmed_end].trim_start();
    (before.is_empty() || before.ends_with(','))
        && (after.starts_with(',') || after.starts_with(']'))
        && depth_before(&source[trimmed_start..open]) == 1
}

/// Bracket depth at the end of `source`, skipping quoted strings.
fn depth_before(source: &str) -> i32 {
    let mut depth = 0;
    let mut quote = None;
    let mut escaped = false;
    for byte in source.bytes() {
        if let Some(current) = quote {
            if escaped {
                escaped = false;
            } else if byte == b'\\' {
                escaped = true;
            } else if byte == current {
                quote = None;
            }
            continue;
        }
        match byte {
            b'\'' | b'"' | b'`' => quote = Some(byte),
            b'[' | b'(' | b'{' => depth += 1,
            b']' | b')' | b'}' => depth -= 1,
            _ => {}
        }
    }
    depth
}
