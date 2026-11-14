//! Port of css-tree's token stream (`lib/tokenizer/TokenStream.js`) and the
//! cursor primitives of its parser (`lib/parser/create.js`).
//!
//! Offsets are UTF-16 code units, as css-tree counts them.
//!
//! css-tree copyright: Copyright (C) 2016-2026 by Roman Dvornov, MIT License.

use crate::tokenizer::{Source, TokenType, is_white_space, tokenize_units};

/// A css-tree parse error (`SyntaxError`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParseError {
    pub message: String,
    pub offset: usize,
}

pub type PResult<T> = Result<T, ParseError>;

fn pair(ty: Option<TokenType>) -> Option<TokenType> {
    match ty? {
        TokenType::Function | TokenType::LeftParenthesis => Some(TokenType::RightParenthesis),
        TokenType::LeftSquareBracket => Some(TokenType::RightSquareBracket),
        TokenType::LeftCurlyBracket => Some(TokenType::RightCurlyBracket),
        _ => None,
    }
}

pub(crate) fn is_block_opener(ty: TokenType) -> bool {
    matches!(
        ty,
        TokenType::Function
            | TokenType::LeftParenthesis
            | TokenType::LeftSquareBracket
            | TokenType::LeftCurlyBracket
    )
}

/// css-tree `tokenNames`, without the `-token` suffix.
fn token_name(ty: TokenType) -> &'static str {
    match ty {
        TokenType::Ident => "ident",
        TokenType::Function => "function",
        TokenType::AtKeyword => "at-keyword",
        TokenType::Hash => "hash",
        TokenType::String => "string",
        TokenType::BadString => "bad-string",
        TokenType::Url => "url",
        TokenType::BadUrl => "bad-url",
        TokenType::Delim => "delim",
        TokenType::Number => "number",
        TokenType::Percentage => "percentage",
        TokenType::Dimension => "dimension",
        TokenType::WhiteSpace => "whitespace",
        TokenType::Cdo => "CDO",
        TokenType::Cdc => "CDC",
        TokenType::Colon => "colon",
        TokenType::Semicolon => "semicolon",
        TokenType::Comma => "comma",
        TokenType::LeftSquareBracket => "[",
        TokenType::RightSquareBracket => "]",
        TokenType::LeftParenthesis => "(",
        TokenType::RightParenthesis => ")",
        TokenType::LeftCurlyBracket => "{",
        TokenType::RightCurlyBracket => "}",
        TokenType::Comment => "comment",
    }
}

pub struct Stream {
    pub source: Vec<u16>,
    types: Vec<TokenType>,
    ends: Vec<usize>,
    balance: Vec<usize>,
    pub count: usize,
    first: usize,
    pub eof: bool,
    pub index: usize,
    /// `None` is css-tree's `EOF`.
    pub ty: Option<TokenType>,
    pub start: usize,
    pub end: usize,
}

impl Stream {
    pub fn new(source: &str) -> Self {
        let units: Vec<u16> = source.encode_utf16().collect();
        let len = units.len();
        let tokens = tokenize_units(&units);
        let count = tokens.len();
        let mut types = Vec::with_capacity(count);
        let mut ends = Vec::with_capacity(count);
        let mut balance = vec![0usize; len.max(count) + 1];
        let mut close: Option<TokenType> = None;
        let mut balance_start = len;
        let mut first = None;
        for (index, &(ty, start, end)) in tokens.iter().enumerate() {
            types.push(ty);
            ends.push(end.min(len));
            first.get_or_insert(start);
            balance[index] = balance_start;
            if Some(ty) == close {
                let previous = balance[balance_start];
                balance[balance_start] = index;
                balance_start = previous;
                close = pair(types.get(previous).copied());
            } else if is_block_opener(ty) {
                balance_start = index;
                close = pair(Some(ty));
            }
        }
        balance[count] = count;
        for i in 0..count {
            let start = balance[i];
            if start <= i {
                let end = balance[start];
                if end != i {
                    balance[i] = end;
                }
            } else if start > count {
                balance[i] = count;
            }
        }
        balance.truncate(count + 1);
        let mut stream = Self {
            source: units,
            types,
            ends,
            balance,
            count,
            first: first.unwrap_or(0),
            eof: false,
            index: 0,
            ty: None,
            start: 0,
            end: 0,
        };
        stream.reset();
        stream
    }

    fn reset(&mut self) {
        self.eof = false;
        self.index = usize::MAX;
        self.ty = None;
        self.start = self.first;
        self.end = self.first;
        self.next();
    }

    pub fn len(&self) -> usize {
        self.source.len()
    }

    pub fn char_code_at(&self, offset: usize) -> u32 {
        self.source.get(offset).map_or(0, |&unit| u32::from(unit))
    }

    pub fn substring(&self, start: usize, end: usize) -> String {
        let end = end.min(self.len());
        String::from_utf16_lossy(&self.source[start.min(end)..end])
    }

    pub fn substr_to_cursor(&self, start: usize) -> String {
        self.substring(start, self.start)
    }

    pub fn cmp_str(&self, start: usize, end: usize, reference: &str) -> bool {
        Source {
            units: &self.source,
        }
        .cmp_str(start, end, reference)
    }

    pub fn type_at(&self, index: usize) -> Option<TokenType> {
        (index < self.count).then(|| self.types[index])
    }

    pub fn lookup_type(&self, offset: isize) -> Option<TokenType> {
        let index = self.index.wrapping_add_signed(offset);
        self.type_at(index)
    }

    pub fn lookup_type_non_sc(&self, mut idx: usize) -> Option<TokenType> {
        for index in self.index..self.count {
            let ty = self.types[index];
            if !matches!(ty, TokenType::WhiteSpace | TokenType::Comment) {
                if idx == 0 {
                    return Some(ty);
                }
                idx -= 1;
            }
        }
        None
    }

    pub fn lookup_value(&self, offset: isize, reference: &str) -> bool {
        let index = self.index.wrapping_add_signed(offset);
        if index < self.count {
            let start = if index == 0 { 0 } else { self.ends[index - 1] };
            return self.cmp_str(start, self.ends[index], reference);
        }
        false
    }

    pub fn token_start(&self, index: usize) -> usize {
        if index == self.index {
            return self.start;
        }
        if index > 0 {
            return if index < self.count {
                self.ends[index - 1]
            } else {
                self.len()
            };
        }
        self.first
    }

    pub fn is_balance_edge(&self, index: usize) -> bool {
        self.balance[self.index.min(self.count)] < index
    }

    pub fn is_delim(&self, code: u32) -> bool {
        self.ty == Some(TokenType::Delim) && self.char_code_at(self.start) == code
    }

    pub fn next(&mut self) {
        let next = self.index.wrapping_add(1);
        if next < self.count {
            self.index = next;
            self.start = self.end;
            self.ty = Some(self.types[next]);
            self.end = self.ends[next];
        } else {
            self.eof = true;
            self.index = self.count;
            self.ty = None;
            self.start = self.len();
            self.end = self.len();
        }
    }

    /// css-tree `skip(next - tokenIndex)`: moves to the token `next`.
    pub fn seek(&mut self, next: usize) {
        if next < self.count {
            self.index = next;
            self.start = if next == 0 { 0 } else { self.ends[next - 1] };
            self.ty = Some(self.types[next]);
            self.end = self.ends[next];
        } else {
            self.index = self.count;
            self.next();
        }
    }

    pub fn skip_sc(&mut self) {
        while matches!(self.ty, Some(TokenType::WhiteSpace | TokenType::Comment)) {
            self.next();
        }
    }

    /// css-tree `skipUntilBalanced(startToken, stopConsume)`: `stop` returns 1 to stop
    /// before a token and 2 to stop after it.
    pub fn skip_until_balanced(&mut self, start_token: usize, stop: impl Fn(u32) -> u8) {
        let mut cursor = start_token;
        while cursor < self.count {
            let balance_end = self.balance[cursor];
            if balance_end < start_token {
                break;
            }
            let offset = if cursor > 0 {
                self.ends[cursor - 1]
            } else {
                self.first
            };
            match stop(self.char_code_at(offset)) {
                1 => break,
                2 => {
                    cursor += 1;
                    break;
                }
                _ => {
                    if is_block_opener(self.types[cursor]) {
                        cursor = balance_end;
                    }
                }
            }
            cursor += 1;
        }
        self.seek(cursor);
    }

    /// css-tree `error(message, offset)`.
    pub fn error<T>(&self, message: Option<String>, offset: Option<usize>) -> PResult<T> {
        let offset = match offset {
            Some(offset) if offset < self.len() => offset,
            _ if self.eof => {
                let mut offset = self.len();
                while offset > 0 && is_white_space(self.char_code_at(offset - 1)) {
                    offset -= 1;
                }
                offset
            }
            _ => self.start,
        };
        Err(ParseError {
            message: message.unwrap_or_else(|| "Unexpected input".into()),
            offset,
        })
    }

    /// css-tree `eat(tokenType)`.
    pub fn eat(&mut self, ty: TokenType) -> PResult<()> {
        if self.ty != Some(ty) {
            let name = token_name(ty).replace('-', " ");
            let name = match name.chars().next() {
                Some(first) => first.to_uppercase().collect::<String>() + &name[first.len_utf8()..],
                None => name,
            };
            let mut message = if name.chars().any(|c| "[](){}".contains(c)) {
                format!("\"{name}\" is expected")
            } else {
                format!("{name} is expected")
            };
            let mut offset = self.start;
            match ty {
                TokenType::Ident => {
                    if matches!(self.ty, Some(TokenType::Function | TokenType::Url)) {
                        offset = self.end - 1;
                        message = "Identifier is expected but function found".into();
                    } else {
                        message = "Identifier is expected".into();
                    }
                }
                TokenType::Hash => {
                    if self.is_delim(0x23) {
                        self.next();
                        offset += 1;
                        message = "Name is expected".into();
                    }
                }
                TokenType::Percentage if self.ty == Some(TokenType::Number) => {
                    offset = self.end;
                    message = "Percent sign is expected".into();
                }
                _ => {}
            }
            return self.error(Some(message), Some(offset));
        }
        self.next();
        Ok(())
    }

    /// css-tree `consume(tokenType)`.
    pub fn consume(&mut self, ty: TokenType) -> PResult<String> {
        let start = self.start;
        self.eat(ty)?;
        Ok(self.substr_to_cursor(start))
    }

    pub fn eat_ident(&mut self, name: &str) -> PResult<()> {
        if self.ty != Some(TokenType::Ident) || !self.lookup_value(0, name) {
            return self.error(Some(format!("Identifier \"{name}\" is expected")), None);
        }
        self.next();
        Ok(())
    }

    pub fn eat_delim(&mut self, code: u32) -> PResult<()> {
        if !self.is_delim(code) {
            let delim = char::from_u32(code).unwrap_or('?');
            return self.error(Some(format!("Delim \"{delim}\" is expected")), None);
        }
        self.next();
        Ok(())
    }

    /// css-tree `consumeNumber(type)`.
    pub fn consume_number(&mut self, ty: TokenType) -> PResult<String> {
        let end = Source {
            units: &self.source,
        }
        .consume_number(self.start);
        let number = self.substring(self.start, end);
        self.eat(ty)?;
        Ok(number)
    }

    pub fn consume_function_name(&mut self) -> PResult<String> {
        let name = self.substring(self.start, self.end - 1);
        self.eat(TokenType::Function)?;
        Ok(name)
    }
}
