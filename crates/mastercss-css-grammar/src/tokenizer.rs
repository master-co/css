//! Port of css-tree's tokenizer (`lib/tokenizer/index.js`, `utils.js`, `char-code-definitions.js`).
//!
//! css-tree reads the source as UTF-16 code units, so this port does too: the offsets a mismatch
//! reports are UTF-16 offsets, as in TS. Each token also carries its byte range in the source.
//!
//! css-tree copyright: Copyright (C) 2016-2026 by Roman Dvornov, MIT License.

/// A css-tree token type (`lib/tokenizer/types.js`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TokenType {
    Ident,
    Function,
    AtKeyword,
    Hash,
    String,
    BadString,
    Url,
    BadUrl,
    Delim,
    Number,
    Percentage,
    Dimension,
    WhiteSpace,
    Cdo,
    Cdc,
    Colon,
    Semicolon,
    Comma,
    LeftSquareBracket,
    RightSquareBracket,
    LeftParenthesis,
    RightParenthesis,
    LeftCurlyBracket,
    RightCurlyBracket,
    Comment,
}

/// A token: its type and the source text it covers.
#[derive(Debug, Clone)]
pub struct Token {
    pub ty: TokenType,
    pub value: String,
    /// UTF-16 offset of the token in the source.
    pub start16: usize,
    /// UTF-16 offset of the end of the token.
    pub end16: usize,
    /// Byte offset of the token in the source.
    pub start: usize,
    /// Byte offset of the end of the token.
    pub end: usize,
}

const EOF: u32 = 0;

pub(crate) fn is_digit(code: u32) -> bool {
    (0x30..=0x39).contains(&code)
}

pub(crate) fn is_hex_digit(code: u32) -> bool {
    is_digit(code) || (0x41..=0x46).contains(&code) || (0x61..=0x66).contains(&code)
}

pub(crate) fn is_uppercase_letter(code: u32) -> bool {
    (0x41..=0x5A).contains(&code)
}

fn is_letter(code: u32) -> bool {
    is_uppercase_letter(code) || (0x61..=0x7A).contains(&code)
}

pub(crate) fn is_name_start(code: u32) -> bool {
    is_letter(code) || code >= 0x80 || code == 0x5F
}

pub(crate) fn is_name(code: u32) -> bool {
    is_name_start(code) || is_digit(code) || code == 0x2D
}

fn is_non_printable(code: u32) -> bool {
    code <= 0x08 || code == 0x0B || (0x0E..=0x1F).contains(&code) || code == 0x7F
}

fn is_newline(code: u32) -> bool {
    code == 0x0A || code == 0x0D || code == 0x0C
}

pub(crate) fn is_white_space(code: u32) -> bool {
    is_newline(code) || code == 0x20 || code == 0x09
}

pub(crate) fn is_valid_escape(first: u32, second: u32) -> bool {
    first == 0x5C && !is_newline(second) && second != EOF
}

pub(crate) fn is_identifier_start(first: u32, second: u32, third: u32) -> bool {
    if first == 0x2D {
        return is_name_start(second) || second == 0x2D || is_valid_escape(second, third);
    }
    if is_name_start(first) {
        return true;
    }
    if first == 0x5C {
        return is_valid_escape(first, second);
    }
    false
}

fn is_number_start(first: u32, second: u32, third: u32) -> bool {
    if first == 0x2B || first == 0x2D {
        return is_digit(second) || (second == 0x2E && is_digit(third));
    }
    if first == 0x2E {
        return is_digit(second);
    }
    is_digit(first)
}

#[derive(PartialEq, Eq)]
enum Category {
    WhiteSpace,
    Digit,
    NameStart,
    NonPrintable,
    Char(u32),
}

fn category(code: u32) -> Category {
    if code >= 0x80 {
        return Category::NameStart;
    }
    if is_white_space(code) {
        Category::WhiteSpace
    } else if is_digit(code) {
        Category::Digit
    } else if is_name_start(code) {
        Category::NameStart
    } else if is_non_printable(code) {
        Category::NonPrintable
    } else {
        Category::Char(code)
    }
}

/// A source as UTF-16 code units. A position past the end reads as `0` (css-tree's `EOF`).
pub struct Source<'a> {
    pub units: &'a [u16],
}

impl Source<'_> {
    pub fn at(&self, offset: usize) -> u32 {
        self.units.get(offset).map_or(EOF, |&c| u32::from(c))
    }

    pub fn len(&self) -> usize {
        self.units.len()
    }

    pub fn is_empty(&self) -> bool {
        self.units.is_empty()
    }

    fn newline_length(&self, offset: usize, code: u32) -> usize {
        if code == 13 && self.at(offset + 1) == 10 {
            2
        } else {
            1
        }
    }

    pub fn cmp_str(&self, start: usize, end: usize, reference: &str) -> bool {
        if end < start || end - start != reference.len() || end > self.len() {
            return false;
        }
        reference.bytes().enumerate().all(|(i, r)| {
            let mut code = self.at(start + i);
            if is_uppercase_letter(code) {
                code |= 32;
            }
            code == u32::from(r)
        })
    }

    fn find_white_space_end(&self, mut offset: usize) -> usize {
        while offset < self.len() && is_white_space(self.at(offset)) {
            offset += 1;
        }
        offset
    }

    fn find_decimal_number_end(&self, mut offset: usize) -> usize {
        while offset < self.len() && is_digit(self.at(offset)) {
            offset += 1;
        }
        offset
    }

    pub fn consume_escaped(&self, mut offset: usize) -> usize {
        offset += 2;
        if is_hex_digit(self.at(offset - 1)) {
            let max = self.len().min(offset + 5);
            while offset < max && is_hex_digit(self.at(offset)) {
                offset += 1;
            }
            let code = self.at(offset);
            if is_white_space(code) {
                offset += self.newline_length(offset, code);
            }
        }
        offset
    }

    fn consume_name(&self, mut offset: usize) -> usize {
        while offset < self.len() {
            let code = self.at(offset);
            if is_name(code) {
                offset += 1;
                continue;
            }
            if is_valid_escape(code, self.at(offset + 1)) {
                offset = self.consume_escaped(offset);
                continue;
            }
            break;
        }
        offset
    }

    /// css-tree `consumeNumber`.
    pub fn consume_number(&self, mut offset: usize) -> usize {
        let mut code = self.at(offset);
        if code == 0x2B || code == 0x2D {
            offset += 1;
            code = self.at(offset);
        }
        if is_digit(code) {
            offset = self.find_decimal_number_end(offset + 1);
            code = self.at(offset);
        }
        if code == 0x2E && is_digit(self.at(offset + 1)) {
            offset = self.find_decimal_number_end(offset + 2);
        }
        let e = self.at(offset);
        if e == u32::from(b'e') || e == u32::from(b'E') {
            let mut sign = 0;
            code = self.at(offset + 1);
            if code == 0x2D || code == 0x2B {
                sign = 1;
                code = self.at(offset + 2);
            }
            if is_digit(code) {
                offset = self.find_decimal_number_end(offset + 1 + sign + 1);
            }
        }
        offset
    }

    fn consume_bad_url_remnants(&self, mut offset: usize) -> usize {
        while offset < self.len() {
            let code = self.at(offset);
            if code == 0x29 {
                offset += 1;
                break;
            }
            if is_valid_escape(code, self.at(offset + 1)) {
                offset = self.consume_escaped(offset);
            }
            offset += 1;
        }
        offset
    }
}

/// css-tree `consumeNumber` over a string (as the generic types call it on a token value).
pub(crate) fn consume_number_str(value: &str) -> usize {
    let units: Vec<u16> = value.encode_utf16().collect();
    Source { units: &units }.consume_number(0)
}

struct Tokenizer<'a> {
    src: Source<'a>,
    offset: usize,
    ty: TokenType,
}

impl Tokenizer<'_> {
    fn consume_numeric_token(&mut self) {
        self.offset = self.src.consume_number(self.offset);
        let o = self.offset;
        if is_identifier_start(self.src.at(o), self.src.at(o + 1), self.src.at(o + 2)) {
            self.ty = TokenType::Dimension;
            self.offset = self.src.consume_name(o);
            return;
        }
        if self.src.at(o) == 0x25 {
            self.ty = TokenType::Percentage;
            self.offset += 1;
            return;
        }
        self.ty = TokenType::Number;
    }

    fn consume_ident_like_token(&mut self) {
        let name_start = self.offset;
        self.offset = self.src.consume_name(self.offset);
        if self.src.cmp_str(name_start, self.offset, "url") && self.src.at(self.offset) == 0x28 {
            self.offset = self.src.find_white_space_end(self.offset + 1);
            let c = self.src.at(self.offset);
            if c == 0x22 || c == 0x27 {
                self.ty = TokenType::Function;
                self.offset = name_start + 4;
                return;
            }
            self.consume_url_token();
            return;
        }
        if self.src.at(self.offset) == 0x28 {
            self.ty = TokenType::Function;
            self.offset += 1;
            return;
        }
        self.ty = TokenType::Ident;
    }

    fn consume_string_token(&mut self) {
        let ending = self.src.at(self.offset);
        self.offset += 1;
        self.ty = TokenType::String;
        while self.offset < self.src.len() {
            let code = self.src.at(self.offset);
            if code == ending {
                self.offset += 1;
                return;
            }
            if is_newline(code) {
                self.offset += self.src.newline_length(self.offset, code);
                self.ty = TokenType::BadString;
                return;
            }
            if code == 0x5C && self.offset != self.src.len() - 1 {
                let next = self.src.at(self.offset + 1);
                if is_newline(next) {
                    self.offset += self.src.newline_length(self.offset + 1, next);
                } else if is_valid_escape(code, next) {
                    self.offset = self.src.consume_escaped(self.offset) - 1;
                }
            }
            self.offset += 1;
        }
    }

    fn consume_url_token(&mut self) {
        self.ty = TokenType::Url;
        self.offset = self.src.find_white_space_end(self.offset);
        while self.offset < self.src.len() {
            let code = self.src.at(self.offset);
            match category(code) {
                Category::Char(0x29) => {
                    self.offset += 1;
                    return;
                }
                Category::WhiteSpace => {
                    self.offset = self.src.find_white_space_end(self.offset);
                    if self.src.at(self.offset) == 0x29 || self.offset >= self.src.len() {
                        if self.offset < self.src.len() {
                            self.offset += 1;
                        }
                        return;
                    }
                    self.offset = self.src.consume_bad_url_remnants(self.offset);
                    self.ty = TokenType::BadUrl;
                    return;
                }
                Category::Char(0x22 | 0x27 | 0x28) | Category::NonPrintable => {
                    self.offset = self.src.consume_bad_url_remnants(self.offset);
                    self.ty = TokenType::BadUrl;
                    return;
                }
                Category::Char(0x5C) => {
                    if is_valid_escape(code, self.src.at(self.offset + 1)) {
                        self.offset = self.src.consume_escaped(self.offset) - 1;
                    } else {
                        self.offset = self.src.consume_bad_url_remnants(self.offset);
                        self.ty = TokenType::BadUrl;
                        return;
                    }
                }
                _ => {}
            }
            self.offset += 1;
        }
    }

    #[allow(clippy::too_many_lines)]
    fn next(&mut self) {
        let o = self.offset;
        let code = self.src.at(o);
        let (c1, c2, c3) = (self.src.at(o + 1), self.src.at(o + 2), self.src.at(o + 3));
        match category(code) {
            Category::WhiteSpace => {
                self.ty = TokenType::WhiteSpace;
                self.offset = self.src.find_white_space_end(o + 1);
            }
            Category::Char(0x22 | 0x27) => self.consume_string_token(),
            Category::Char(0x23) => {
                if is_name(c1) || is_valid_escape(c1, c2) {
                    self.ty = TokenType::Hash;
                    self.offset = self.src.consume_name(o + 1);
                } else {
                    self.delim();
                }
            }
            Category::Char(0x28) => self.single(TokenType::LeftParenthesis),
            Category::Char(0x29) => self.single(TokenType::RightParenthesis),
            Category::Char(0x2B | 0x2E) => {
                if is_number_start(code, c1, c2) {
                    self.consume_numeric_token();
                } else {
                    self.delim();
                }
            }
            Category::Char(0x2C) => self.single(TokenType::Comma),
            Category::Char(0x2D) => {
                if is_number_start(code, c1, c2) {
                    self.consume_numeric_token();
                } else if c1 == 0x2D && c2 == 0x3E {
                    self.ty = TokenType::Cdc;
                    self.offset = o + 3;
                } else if is_identifier_start(code, c1, c2) {
                    self.consume_ident_like_token();
                } else {
                    self.delim();
                }
            }
            Category::Char(0x2F) => {
                if c1 == 0x2A {
                    self.ty = TokenType::Comment;
                    let mut end = None;
                    let mut i = o + 2;
                    while i + 1 < self.src.len() {
                        if self.src.at(i) == 0x2A && self.src.at(i + 1) == 0x2F {
                            end = Some(i + 2);
                            break;
                        }
                        i += 1;
                    }
                    self.offset = end.unwrap_or(self.src.len());
                } else {
                    self.delim();
                }
            }
            Category::Char(0x3A) => self.single(TokenType::Colon),
            Category::Char(0x3B) => self.single(TokenType::Semicolon),
            Category::Char(0x3C) => {
                if c1 == 0x21 && c2 == 0x2D && c3 == 0x2D {
                    self.ty = TokenType::Cdo;
                    self.offset = o + 4;
                } else {
                    self.delim();
                }
            }
            Category::Char(0x40) => {
                if is_identifier_start(c1, c2, c3) {
                    self.ty = TokenType::AtKeyword;
                    self.offset = self.src.consume_name(o + 1);
                } else {
                    self.delim();
                }
            }
            Category::Char(0x5B) => self.single(TokenType::LeftSquareBracket),
            Category::Char(0x5C) => {
                if is_valid_escape(code, c1) {
                    self.consume_ident_like_token();
                } else {
                    self.delim();
                }
            }
            Category::Char(0x5D) => self.single(TokenType::RightSquareBracket),
            Category::Char(0x7B) => self.single(TokenType::LeftCurlyBracket),
            Category::Char(0x7D) => self.single(TokenType::RightCurlyBracket),
            Category::Digit => self.consume_numeric_token(),
            Category::NameStart => self.consume_ident_like_token(),
            _ => self.delim(),
        }
    }

    fn single(&mut self, ty: TokenType) {
        self.ty = ty;
        self.offset += 1;
    }

    fn delim(&mut self) {
        self.single(TokenType::Delim);
    }
}

/// The source as UTF-16 code units, with the byte offset of each unit (and of the end).
///
/// The second unit of a surrogate pair maps to the byte offset of its character, so every mapped
/// offset is a character boundary.
pub(crate) struct Utf16Map {
    pub units: Vec<u16>,
    pub byte_at: Vec<usize>,
}

impl Utf16Map {
    pub fn new(source: &str) -> Self {
        let mut units = Vec::with_capacity(source.len());
        let mut byte_at = Vec::with_capacity(source.len() + 1);
        for (b, ch) in source.char_indices() {
            let mut buf = [0u16; 2];
            for u in ch.encode_utf16(&mut buf).iter() {
                units.push(*u);
                byte_at.push(b);
            }
        }
        byte_at.push(source.len());
        Self { units, byte_at }
    }

    /// The byte offset of the UTF-16 offset `offset` (clamped to the end).
    pub fn byte(&self, offset: usize) -> usize {
        self.byte_at[offset.min(self.units.len())]
    }
}

/// css-tree `tokenize` over UTF-16 code units: the type and the `[start, end)` range of each token.
/// An `end` can pass the end of the source, as in css-tree (an escape at the very end).
pub(crate) fn tokenize_units(units: &[u16]) -> Vec<(TokenType, usize, usize)> {
    let mut tokenizer = Tokenizer {
        src: Source { units },
        offset: 0,
        ty: TokenType::Delim,
    };
    // A leading BOM is not part of any token.
    let first = tokenizer.src.at(0);
    let mut start = usize::from(first == 0xFEFF || first == 0xFFFE);
    tokenizer.offset = start;
    let mut tokens = Vec::new();
    while tokenizer.offset < units.len() {
        tokenizer.next();
        tokens.push((tokenizer.ty, start, tokenizer.offset));
        start = tokenizer.offset;
    }
    tokens
}

/// css-tree `tokenize`: every token, whitespace and comments included.
pub fn tokenize(source: &str) -> Vec<Token> {
    let map = Utf16Map::new(source);
    let len = map.units.len();
    tokenize_units(&map.units)
        .into_iter()
        .map(|(ty, start, end)| {
            let end = end.min(len);
            Token {
                ty,
                value: String::from_utf16_lossy(&map.units[start..end]),
                start16: start,
                end16: end,
                start: map.byte(start),
                end: map.byte(end),
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn types(source: &str) -> Vec<(TokenType, String)> {
        tokenize(source)
            .into_iter()
            .map(|t| (t.ty, t.value))
            .collect()
    }

    #[test]
    fn numeric_tokens() {
        assert_eq!(
            types("1px 10% -.5 1e3"),
            vec![
                (TokenType::Dimension, "1px".into()),
                (TokenType::WhiteSpace, " ".into()),
                (TokenType::Percentage, "10%".into()),
                (TokenType::WhiteSpace, " ".into()),
                (TokenType::Number, "-.5".into()),
                (TokenType::WhiteSpace, " ".into()),
                (TokenType::Number, "1e3".into()),
            ]
        );
    }

    #[test]
    fn url_and_functions() {
        assert_eq!(
            types("url(a.svg)"),
            vec![(TokenType::Url, "url(a.svg)".into())]
        );
        assert_eq!(
            types("url(\"a\")"),
            vec![
                (TokenType::Function, "url(".into()),
                (TokenType::String, "\"a\"".into()),
                (TokenType::RightParenthesis, ")".into()),
            ]
        );
    }

    #[test]
    fn offsets_are_utf16_and_bytes() {
        let tokens = tokenize("ä 1");
        assert_eq!(tokens[2].start16, 2);
        assert_eq!(tokens[2].start, 3);
    }
}
