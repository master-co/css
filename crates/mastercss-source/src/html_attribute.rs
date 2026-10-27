use std::borrow::Cow;

use crate::html_entities::NAMED;
use mastercss_schema::SourceRange;
use serde::Serialize;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HTMLAttributeSpan {
    pub range: SourceRange,
    pub source_range: SourceRange,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DecodedHTMLAttribute {
    pub value: String,
    pub spans: Vec<HTMLAttributeSpan>,
}

/// Decode an attribute after its delimiters have been removed. Both coordinate
/// systems use UTF-16, and an expanded reference is one indivisible source span.
pub fn decode_with_spans(source: &str) -> DecodedHTMLAttribute {
    let mut result = DecodedHTMLAttribute {
        value: String::new(),
        spans: Vec::new(),
    };
    let mut cursor = 0;
    let mut source_offset = 0;
    let mut offset = 0;
    while cursor < source.len() {
        let rest = &source[cursor..];
        let first = rest.chars().next().unwrap();
        let (length, value) = if let Some(reference) = rest.strip_prefix('&') {
            if let Some((length, character)) = numeric(reference) {
                (length + 1, Cow::Owned(character.to_string()))
            } else if let Some((length, characters)) = named(reference) {
                (length + 1, Cow::Borrowed(characters))
            } else {
                (1, Cow::Borrowed("&"))
            }
        } else if first == '\r' {
            // HTML input preprocessing happens before character references, so
            // a numeric reference to CR is deliberately not normalized here.
            (
                if rest.starts_with("\r\n") { 2 } else { 1 },
                Cow::Borrowed("\n"),
            )
        } else if first == '\0' {
            (1, Cow::Borrowed("\u{fffd}"))
        } else {
            (first.len_utf8(), Cow::Borrowed(&rest[..first.len_utf8()]))
        };
        let source_end =
            source_offset + source[cursor..cursor + length].encode_utf16().count() as u32;
        let end = offset + value.encode_utf16().count() as u32;
        result.spans.push(HTMLAttributeSpan {
            range: SourceRange { start: offset, end },
            source_range: SourceRange {
                start: source_offset,
                end: source_end,
            },
        });
        result.value.push_str(&value);
        cursor += length;
        source_offset = source_end;
        offset = end;
    }
    result
}

// HTML tokenization, attribute return states (not XML or JavaScript strings).
// https://html.spec.whatwg.org/multipage/parsing.html#character-reference-state
pub(super) fn decode(value: &str) -> Cow<'_, str> {
    if !value.contains(['&', '\0']) {
        return Cow::Borrowed(value);
    }
    let mut output = String::with_capacity(value.len());
    let mut cursor = 0;
    while let Some(offset) = value[cursor..].find('&') {
        let start = cursor + offset;
        output.push_str(&value[cursor..start]);
        let rest = &value[start + 1..];
        if let Some((length, character)) = numeric(rest) {
            output.push(character);
            cursor = start + 1 + length;
        } else if let Some((length, characters)) = named(rest) {
            output.push_str(characters);
            cursor = start + 1 + length;
        } else {
            output.push('&');
            cursor = start + 1;
        }
    }
    output.push_str(&value[cursor..]);
    // A literal null in an attribute is replaced during HTML tokenization too.
    Cow::Owned(output.replace('\0', "\u{fffd}"))
}

fn named(value: &str) -> Option<(usize, &'static str)> {
    // The longest WHATWG name is 32 ASCII bytes (without the leading '&').
    let mut end = value
        .bytes()
        .take(32)
        .take_while(u8::is_ascii_alphanumeric)
        .count();
    if value.as_bytes().get(end) == Some(&b';') && end < 32 {
        end += 1;
    }
    for length in (1..=end).rev() {
        let name = &value[..length];
        if let Ok(index) = NAMED.binary_search_by_key(&name, |(key, _)| key) {
            if !name.ends_with(';')
                && value
                    .as_bytes()
                    .get(length)
                    .is_some_and(|next| next.is_ascii_alphanumeric() || *next == b'=')
            {
                return None;
            }
            return Some((length, NAMED[index].1));
        }
    }
    None
}

fn numeric(value: &str) -> Option<(usize, char)> {
    let rest = value.strip_prefix('#')?;
    let hexadecimal = rest.starts_with(['x', 'X']);
    let radix = if hexadecimal { 16 } else { 10 };
    let start = if hexadecimal { 2 } else { 1 };
    let mut end = start;
    let mut code = 0u32;
    for byte in value.as_bytes()[start..].iter().copied() {
        let Some(digit) = char::from(byte).to_digit(radix) else {
            break;
        };
        code = code.saturating_mul(radix).saturating_add(digit);
        end += 1;
    }
    if end == start {
        return None;
    }
    if value.as_bytes().get(end) == Some(&b';') {
        end += 1;
    }
    // HTML's Windows-1252 remapping retains the unmapped C1 controls.
    const C1: [u32; 32] = [
        0x20ac, 0x81, 0x201a, 0x192, 0x201e, 0x2026, 0x2020, 0x2021, 0x2c6, 0x2030, 0x160, 0x2039,
        0x152, 0x8d, 0x17d, 0x8f, 0x90, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014,
        0x2dc, 0x2122, 0x161, 0x203a, 0x153, 0x9d, 0x17e, 0x178,
    ];
    if (0x80..=0x9f).contains(&code) {
        code = C1[(code - 0x80) as usize];
    }
    let character = char::from_u32(code)
        .filter(|c| *c != '\0')
        .unwrap_or('\u{fffd}');
    Some((end, character))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_named_reference_matches_the_existing_decoder_and_maps_its_source() {
        for (name, _) in NAMED {
            for suffix in ["", "x", "=", "-"] {
                let raw = format!("&{name}{suffix}");
                let mapped = decode_with_spans(&raw);
                assert_eq!(mapped.value, decode(&raw), "{raw}");
                assert_eq!(
                    mapped.spans.last().unwrap().source_range.end,
                    raw.len() as u32
                );
            }
        }
    }
}
