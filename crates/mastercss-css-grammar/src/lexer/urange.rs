//! Port of css-tree's `<urange>` generic type (`lib/lexer/generic-urange.js`).
//!
//! @see <https://drafts.csswg.org/css-syntax/#urange>

use super::super::tokenizer::{Token, TokenType, is_hex_digit};
use super::an_plus_b::{cmp_char, code_at, len16};
use super::generic::Cursor;

const PLUSSIGN: u32 = 0x2B;
const HYPHENMINUS: u32 = 0x2D;
const QUESTIONMARK: u32 = 0x3F;
const U: u32 = 0x75;

fn is_delim(token: Option<&Token>, code: u32) -> bool {
    token.is_some_and(|t| t.ty == TokenType::Delim && code_at(&t.value, 0) == code)
}

fn hex_sequence(token: &Token, offset: usize, allow_dash: bool) -> usize {
    let mut hexlen = 0;
    let len = len16(&token.value);
    let mut pos = offset;
    while pos < len {
        let code = code_at(&token.value, pos);
        if code == HYPHENMINUS && allow_dash && hexlen != 0 {
            hex_sequence(token, offset + hexlen + 1, false);
            // disallow following question marks
            return 6;
        }
        if !is_hex_digit(code) {
            return 0;
        }
        hexlen += 1;
        if hexlen > 6 {
            return 0;
        }
        pos += 1;
    }
    hexlen
}

fn with_question_mark_sequence(
    mut consumed: usize,
    mut length: usize,
    cursor: &Cursor<'_>,
) -> usize {
    if consumed == 0 {
        return 0;
    }
    while is_delim(cursor.next(length), QUESTIONMARK) {
        consumed += 1;
        if consumed > 6 {
            return 0;
        }
        length += 1;
    }
    length
}

/// css-tree `urange`.
pub fn urange(cursor: &Cursor<'_>) -> usize {
    let mut length = 0;
    match cursor.token() {
        Some(token) if token.ty == TokenType::Ident && cmp_char(&token.value, 0, U) => {}
        _ => return 0,
    }
    length += 1;
    let Some(token) = cursor.next(length) else {
        return 0;
    };
    if is_delim(Some(token), PLUSSIGN) {
        length += 1;
        let Some(token) = cursor.next(length) else {
            return 0;
        };
        if token.ty == TokenType::Ident {
            length += 1;
            return with_question_mark_sequence(hex_sequence(token, 0, true), length, cursor);
        }
        if is_delim(Some(token), QUESTIONMARK) {
            length += 1;
            return with_question_mark_sequence(1, length, cursor);
        }
        return 0;
    }
    if token.ty == TokenType::Number {
        let consumed_hex_length = hex_sequence(token, 1, true);
        if consumed_hex_length == 0 {
            return 0;
        }
        length += 1;
        let Some(token) = cursor.next(length) else {
            return length;
        };
        if token.ty == TokenType::Dimension || token.ty == TokenType::Number {
            if code_at(&token.value, 0) != HYPHENMINUS || hex_sequence(token, 1, false) == 0 {
                return 0;
            }
            return length + 1;
        }
        return with_question_mark_sequence(consumed_hex_length, length, cursor);
    }
    if token.ty == TokenType::Dimension {
        length += 1;
        return with_question_mark_sequence(hex_sequence(token, 1, true), length, cursor);
    }
    0
}
