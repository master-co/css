//! Port of css-tree's `<an-plus-b>` generic type (`lib/lexer/generic-an-plus-b.js`).
//!
//! @see <https://drafts.csswg.org/css-syntax/#anb-microsyntax>

use super::super::tokenizer::{Token, TokenType, is_digit};
use super::generic::Cursor;

const PLUSSIGN: u32 = 0x2B;
const HYPHENMINUS: u32 = 0x2D;
const N: u32 = 0x6E;

/// `token.value.charCodeAt(index)`; past the end, `u32::MAX` (JS `NaN`, which equals nothing).
pub(super) fn code_at(value: &str, index: usize) -> u32 {
    value.encode_utf16().nth(index).map_or(u32::MAX, u32::from)
}

pub(super) fn len16(value: &str) -> usize {
    value.encode_utf16().count()
}

/// css-tree `cmpChar`: the code unit at `offset`, with A-Z folded, is `code`.
pub(super) fn cmp_char(value: &str, offset: usize, code: u32) -> bool {
    let mut c = code_at(value, offset);
    if (0x41..=0x5A).contains(&c) {
        c |= 32;
    }
    c == code
}

fn is_delim(token: Option<&Token>, code: u32) -> bool {
    token.is_some_and(|t| t.ty == TokenType::Delim && code_at(&t.value, 0) == code)
}

fn skip_sc<'t>(cursor: &Cursor<'t>, mut token: Option<&'t Token>, mut offset: usize) -> usize {
    while token.is_some_and(|t| matches!(t.ty, TokenType::WhiteSpace | TokenType::Comment)) {
        offset += 1;
        token = cursor.next(offset);
    }
    offset
}

fn check_integer(
    token: Option<&Token>,
    mut value_offset: usize,
    disallow_sign: bool,
    offset: usize,
) -> usize {
    let Some(token) = token else {
        return 0;
    };
    let code = code_at(&token.value, value_offset);
    if code == PLUSSIGN || code == HYPHENMINUS {
        if disallow_sign {
            return 0;
        }
        value_offset += 1;
    }
    let len = len16(&token.value);
    while value_offset < len {
        if !is_digit(code_at(&token.value, value_offset)) {
            return 0;
        }
        value_offset += 1;
    }
    offset + 1
}

fn consume_b(cursor: &Cursor<'_>, token: Option<&Token>, offset_: usize) -> usize {
    let mut sign = false;
    let mut offset = skip_sc(cursor, token, offset_);
    let Some(mut token) = cursor.next(offset) else {
        return offset_;
    };
    if token.ty != TokenType::Number {
        if is_delim(Some(token), PLUSSIGN) || is_delim(Some(token), HYPHENMINUS) {
            sign = true;
            offset += 1;
            offset = skip_sc(cursor, cursor.next(offset), offset);
            match cursor.next(offset) {
                Some(t) if t.ty == TokenType::Number => token = t,
                _ => return 0,
            }
        } else {
            return offset_;
        }
    }
    if !sign {
        let code = code_at(&token.value, 0);
        if code != PLUSSIGN && code != HYPHENMINUS {
            return 0;
        }
    }
    check_integer(Some(token), usize::from(!sign), sign, offset)
}

/// css-tree `anPlusB`.
pub fn an_plus_b(cursor: &Cursor<'_>) -> usize {
    let mut offset = 0;
    let Some(mut token) = cursor.token() else {
        return 0;
    };
    if token.ty == TokenType::Number {
        return check_integer(Some(token), 0, false, offset);
    }
    if token.ty == TokenType::Ident && code_at(&token.value, 0) == HYPHENMINUS {
        if !cmp_char(&token.value, 1, N) {
            return 0;
        }
        return match len16(&token.value) {
            2 => {
                offset += 1;
                consume_b(cursor, cursor.next(offset), offset)
            }
            3 => {
                if code_at(&token.value, 2) != HYPHENMINUS {
                    return 0;
                }
                offset += 1;
                offset = skip_sc(cursor, cursor.next(offset), offset);
                check_integer(cursor.next(offset), 0, true, offset)
            }
            _ => {
                if code_at(&token.value, 2) != HYPHENMINUS {
                    return 0;
                }
                check_integer(Some(token), 3, true, offset)
            }
        };
    }
    // css-tree reads `getNextToken(offset + 1).type` without a null check, which throws for a
    // `+` at the end; here that `+` is not an `<an-plus-b>`.
    if token.ty == TokenType::Ident
        || (is_delim(Some(token), PLUSSIGN)
            && cursor
                .next(offset + 1)
                .is_some_and(|t| t.ty == TokenType::Ident))
    {
        if token.ty != TokenType::Ident {
            offset += 1;
            match cursor.next(offset) {
                Some(t) => token = t,
                None => return 0,
            }
        }
        if !cmp_char(&token.value, 0, N) {
            return 0;
        }
        return match len16(&token.value) {
            1 => {
                offset += 1;
                consume_b(cursor, cursor.next(offset), offset)
            }
            2 => {
                if code_at(&token.value, 1) != HYPHENMINUS {
                    return 0;
                }
                offset += 1;
                offset = skip_sc(cursor, cursor.next(offset), offset);
                check_integer(cursor.next(offset), 0, true, offset)
            }
            _ => {
                if code_at(&token.value, 1) != HYPHENMINUS {
                    return 0;
                }
                check_integer(Some(token), 2, true, offset)
            }
        };
    }
    if token.ty == TokenType::Dimension {
        let code = code_at(&token.value, 0);
        let sign = usize::from(code == PLUSSIGN || code == HYPHENMINUS);
        let len = len16(&token.value);
        let mut i = sign;
        while i < len {
            if !is_digit(code_at(&token.value, i)) {
                break;
            }
            i += 1;
        }
        if i == sign {
            return 0;
        }
        if !cmp_char(&token.value, i, N) {
            return 0;
        }
        if i + 1 == len {
            offset += 1;
            return consume_b(cursor, cursor.next(offset), offset);
        }
        if code_at(&token.value, i + 1) != HYPHENMINUS {
            return 0;
        }
        if i + 2 == len {
            offset += 1;
            offset = skip_sc(cursor, cursor.next(offset), offset);
            return check_integer(cursor.next(offset), 0, true, offset);
        }
        return check_integer(Some(token), i + 2, true, offset);
    }
    0
}
