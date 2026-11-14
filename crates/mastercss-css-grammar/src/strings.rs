//! css-tree's string and url codecs (`lib/utils/string.js`, `lib/utils/url.js`),
//! over UTF-16 code units as css-tree reads them.

use crate::tokenizer::{Source, is_hex_digit, is_valid_escape, is_white_space};

const REVERSE_SOLIDUS: u32 = 0x5c;
const QUOTATION_MARK: u32 = 0x22;
const APOSTROPHE: u32 = 0x27;
const SPACE: u32 = 0x20;
const LEFT_PARENTHESIS: u32 = 0x28;
const RIGHT_PARENTHESIS: u32 = 0x29;

/// css-tree `decodeEscaped`: the code point of an escape without its backslash.
fn decode_escaped(escaped: &[u16], out: &mut Vec<u16>) {
    if escaped.len() == 1 && !is_hex_digit(u32::from(escaped[0])) {
        out.push(escaped[0]);
        return;
    }
    let hex: String = escaped
        .iter()
        .map(|&unit| char::from_u32(u32::from(unit)).unwrap_or('\u{fffd}'))
        .take_while(char::is_ascii_hexdigit)
        .collect();
    let mut code = u32::from_str_radix(&hex, 16).unwrap_or(0);
    if code == 0 || (0xD800..=0xDFFF).contains(&code) || code > 0x10FFFF {
        code = 0xFFFD;
    }
    let mut buffer = [0u16; 2];
    out.extend_from_slice(
        char::from_u32(code)
            .unwrap_or('\u{fffd}')
            .encode_utf16(&mut buffer),
    );
}

/// The shared escape handling of `string.decode` and `url.decode`.
fn decode_range(str: &[u16], start: usize, end: isize) -> Vec<u16> {
    let source = Source { units: str };
    let len = str.len();
    let mut decoded = Vec::new();
    let mut i = start as isize;
    while i <= end {
        let index = i as usize;
        let mut code = u32::from(str[index]);
        if code == REVERSE_SOLIDUS {
            if i == end {
                if index != len - 1 {
                    decoded = str[index + 1..].to_vec();
                }
                break;
            }
            i += 1;
            code = u32::from(str[i as usize]);
            if is_valid_escape(REVERSE_SOLIDUS, code) {
                let escape_start = i as usize - 1;
                let escape_end = source.consume_escaped(escape_start);
                i = escape_end as isize - 1;
                decode_escaped(&str[escape_start + 1..escape_end.min(len)], &mut decoded);
            } else if code == 0x0d && str.get(i as usize + 1) == Some(&0x0a) {
                i += 1;
            }
        } else {
            decoded.push(str[index]);
        }
        i += 1;
    }
    decoded
}

/// css-tree `string.decode`.
pub fn decode_string(str: &[u16]) -> Vec<u16> {
    let len = str.len();
    let first = str.first().map_or(0, |&c| u32::from(c));
    let start = usize::from(first == QUOTATION_MARK || first == APOSTROPHE);
    let end = if start == 1 && len > 1 && u32::from(str[len - 1]) == first {
        len as isize - 2
    } else {
        len as isize - 1
    };
    decode_range(str, start, end)
}

/// css-tree `string.encode(value)` with double quotes.
pub fn encode_string(str: &[u16]) -> Vec<u16> {
    let mut encoded = vec![QUOTATION_MARK as u16];
    let mut ws_before_hex = false;
    for &unit in str {
        let code = u32::from(unit);
        if code == 0 {
            encoded.push(0xFFFD);
            continue;
        }
        if code <= 0x1f || code == 0x7f {
            encoded.push(REVERSE_SOLIDUS as u16);
            encoded.extend(format!("{code:x}").encode_utf16());
            ws_before_hex = true;
            continue;
        }
        if code == QUOTATION_MARK || code == REVERSE_SOLIDUS {
            encoded.push(REVERSE_SOLIDUS as u16);
            encoded.push(unit);
            ws_before_hex = false;
        } else {
            if ws_before_hex && (is_hex_digit(code) || is_white_space(code)) {
                encoded.push(SPACE as u16);
            }
            encoded.push(unit);
            ws_before_hex = false;
        }
    }
    encoded.push(QUOTATION_MARK as u16);
    encoded
}

/// css-tree `url.decode` of a `url(` token.
pub fn decode_url(str: &[u16]) -> Vec<u16> {
    let len = str.len();
    let mut start = 4usize;
    let mut end = if str.last() == Some(&(RIGHT_PARENTHESIS as u16)) {
        len as isize - 2
    } else {
        len as isize - 1
    };
    while (start as isize) < end && is_white_space(u32::from(str[start])) {
        start += 1;
    }
    while (start as isize) < end && is_white_space(u32::from(str[end as usize])) {
        end -= 1;
    }
    decode_range(str, start, end)
}

/// css-tree `url.encode`.
pub fn encode_url(str: &[u16]) -> Vec<u16> {
    let mut encoded: Vec<u16> = "url(".encode_utf16().collect();
    let mut ws_before_hex = false;
    for &unit in str {
        let code = u32::from(unit);
        if code == 0 {
            encoded.push(0xFFFD);
            continue;
        }
        if code <= 0x1f || code == 0x7f {
            encoded.push(REVERSE_SOLIDUS as u16);
            encoded.extend(format!("{code:x}").encode_utf16());
            ws_before_hex = true;
            continue;
        }
        if matches!(
            code,
            SPACE
                | REVERSE_SOLIDUS
                | QUOTATION_MARK
                | APOSTROPHE
                | LEFT_PARENTHESIS
                | RIGHT_PARENTHESIS
        ) {
            encoded.push(REVERSE_SOLIDUS as u16);
            encoded.push(unit);
            ws_before_hex = false;
        } else {
            if ws_before_hex && is_hex_digit(code) {
                encoded.push(SPACE as u16);
            }
            encoded.push(unit);
            ws_before_hex = false;
        }
    }
    encoded.push(RIGHT_PARENTHESIS as u16);
    encoded
}
