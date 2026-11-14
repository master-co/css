//! Port of css-tree's generator (`lib/generator/create.js`, `token-before.js` in its default
//! `safe` mode) for value nodes: the text `generate(node)` returns and the tokens the lexer
//! matches (`prepare-tokens.js` for an AST).
//!
//! css-tree copyright: Copyright (C) 2016-2026 by Roman Dvornov, MIT License.

use std::collections::HashSet;
use std::sync::LazyLock;

use crate::parser::Node;
use crate::strings::{encode_string, encode_url};
use crate::tokenizer::{Token, TokenType as T, tokenize};

/// css-tree's numeric token types (`lib/tokenizer/types.js`).
fn type_id(ty: T) -> u32 {
    match ty {
        T::Ident => 1,
        T::Function => 2,
        T::AtKeyword => 3,
        T::Hash => 4,
        T::String => 5,
        T::BadString => 6,
        T::Url => 7,
        T::BadUrl => 8,
        T::Delim => 9,
        T::Number => 10,
        T::Percentage => 11,
        T::Dimension => 12,
        T::WhiteSpace => 13,
        T::Cdo => 14,
        T::Cdc => 15,
        T::Colon => 16,
        T::Semicolon => 17,
        T::Comma => 18,
        T::LeftSquareBracket => 19,
        T::RightSquareBracket => 20,
        T::LeftParenthesis => 21,
        T::RightParenthesis => 22,
        T::LeftCurlyBracket => 23,
        T::RightCurlyBracket => 24,
        T::Comment => 25,
    }
}

enum Code {
    Type(T),
    Char(char),
}

fn code_of(code: &Code) -> u32 {
    match code {
        Code::Type(ty) => type_id(*ty) << 1,
        Code::Char(c) => (u32::from(*c).min(0x80) << 6) << 1,
    }
}

fn token_code(ty: T, value: &str) -> u32 {
    if ty == T::Delim {
        let first = value.encode_utf16().next().map_or(0, u32::from);
        return (first.min(0x80) << 6) << 1;
    }
    type_id(ty) << 1
}

static SAFE_PAIRS: LazyLock<HashSet<u32>> = LazyLock::new(|| {
    use Code::{Char as C, Type as Ty};
    let spec: Vec<(Code, Code)> = vec![
        (Ty(T::Ident), Ty(T::Ident)),
        (Ty(T::Ident), Ty(T::Function)),
        (Ty(T::Ident), Ty(T::Url)),
        (Ty(T::Ident), Ty(T::BadUrl)),
        (Ty(T::Ident), C('-')),
        (Ty(T::Ident), Ty(T::Number)),
        (Ty(T::Ident), Ty(T::Percentage)),
        (Ty(T::Ident), Ty(T::Dimension)),
        (Ty(T::Ident), Ty(T::Cdc)),
        (Ty(T::Ident), Ty(T::LeftParenthesis)),
        (Ty(T::AtKeyword), Ty(T::Ident)),
        (Ty(T::AtKeyword), Ty(T::Function)),
        (Ty(T::AtKeyword), Ty(T::Url)),
        (Ty(T::AtKeyword), Ty(T::BadUrl)),
        (Ty(T::AtKeyword), C('-')),
        (Ty(T::AtKeyword), Ty(T::Number)),
        (Ty(T::AtKeyword), Ty(T::Percentage)),
        (Ty(T::AtKeyword), Ty(T::Dimension)),
        (Ty(T::AtKeyword), Ty(T::Cdc)),
        (Ty(T::Hash), Ty(T::Ident)),
        (Ty(T::Hash), Ty(T::Function)),
        (Ty(T::Hash), Ty(T::Url)),
        (Ty(T::Hash), Ty(T::BadUrl)),
        (Ty(T::Hash), C('-')),
        (Ty(T::Hash), Ty(T::Number)),
        (Ty(T::Hash), Ty(T::Percentage)),
        (Ty(T::Hash), Ty(T::Dimension)),
        (Ty(T::Hash), Ty(T::Cdc)),
        (Ty(T::Dimension), Ty(T::Ident)),
        (Ty(T::Dimension), Ty(T::Function)),
        (Ty(T::Dimension), Ty(T::Url)),
        (Ty(T::Dimension), Ty(T::BadUrl)),
        (Ty(T::Dimension), C('-')),
        (Ty(T::Dimension), Ty(T::Number)),
        (Ty(T::Dimension), Ty(T::Percentage)),
        (Ty(T::Dimension), Ty(T::Dimension)),
        (Ty(T::Dimension), Ty(T::Cdc)),
        (C('#'), Ty(T::Ident)),
        (C('#'), Ty(T::Function)),
        (C('#'), Ty(T::Url)),
        (C('#'), Ty(T::BadUrl)),
        (C('#'), C('-')),
        (C('#'), Ty(T::Number)),
        (C('#'), Ty(T::Percentage)),
        (C('#'), Ty(T::Dimension)),
        (C('#'), Ty(T::Cdc)),
        (C('-'), Ty(T::Ident)),
        (C('-'), Ty(T::Function)),
        (C('-'), Ty(T::Url)),
        (C('-'), Ty(T::BadUrl)),
        (C('-'), C('-')),
        (C('-'), Ty(T::Number)),
        (C('-'), Ty(T::Percentage)),
        (C('-'), Ty(T::Dimension)),
        (C('-'), Ty(T::Cdc)),
        (Ty(T::Number), Ty(T::Ident)),
        (Ty(T::Number), Ty(T::Function)),
        (Ty(T::Number), Ty(T::Url)),
        (Ty(T::Number), Ty(T::BadUrl)),
        (Ty(T::Number), Ty(T::Number)),
        (Ty(T::Number), Ty(T::Percentage)),
        (Ty(T::Number), Ty(T::Dimension)),
        (Ty(T::Number), C('%')),
        (Ty(T::Number), Ty(T::Cdc)),
        (C('@'), Ty(T::Ident)),
        (C('@'), Ty(T::Function)),
        (C('@'), Ty(T::Url)),
        (C('@'), Ty(T::BadUrl)),
        (C('@'), C('-')),
        (C('@'), Ty(T::Cdc)),
        (C('.'), Ty(T::Number)),
        (C('.'), Ty(T::Percentage)),
        (C('.'), Ty(T::Dimension)),
        (C('+'), Ty(T::Number)),
        (C('+'), Ty(T::Percentage)),
        (C('+'), Ty(T::Dimension)),
        (C('/'), C('*')),
        (Ty(T::Ident), Ty(T::Hash)),
        (Ty(T::Dimension), Ty(T::Hash)),
        (Ty(T::Hash), Ty(T::Hash)),
        (Ty(T::AtKeyword), Ty(T::LeftParenthesis)),
        (Ty(T::AtKeyword), Ty(T::String)),
        (Ty(T::AtKeyword), Ty(T::Colon)),
        (Ty(T::Percentage), Ty(T::Percentage)),
        (Ty(T::Percentage), Ty(T::Dimension)),
        (Ty(T::Percentage), Ty(T::Function)),
        (Ty(T::Percentage), C('-')),
        (Ty(T::RightParenthesis), Ty(T::Ident)),
        (Ty(T::RightParenthesis), Ty(T::Function)),
        (Ty(T::RightParenthesis), Ty(T::Percentage)),
        (Ty(T::RightParenthesis), Ty(T::Dimension)),
        (Ty(T::RightParenthesis), Ty(T::Hash)),
        (Ty(T::RightParenthesis), C('-')),
    ];
    spec.iter()
        .map(|(previous, next)| (code_of(previous) << 16) | code_of(next))
        .collect()
});

/// css-tree `tokenBefore.safe(prevCode, type, value)`.
fn token_before(previous: u32, ty: T, value: &str) -> u32 {
    let next = token_code(ty, value);
    let first = value.encode_utf16().next().map_or(0, u32::from);
    let lookup =
        if (first == 0x2d && !matches!(ty, T::Ident | T::Function | T::Cdc)) || first == 0x2b {
            ((previous & 0xFFFE) << 16) | (first << 7)
        } else {
            ((previous & 0xFFFE) << 16) | next
        };
    next | u32::from(SAFE_PAIRS.contains(&lookup))
}

/// A generated token; `auto` marks the whitespace the generator inserts.
pub struct Emitted {
    pub ty: T,
    pub value: String,
}

#[derive(Default)]
pub struct Generator {
    previous: u32,
    pub tokens: Vec<Emitted>,
}

impl Generator {
    fn emit(&mut self, ty: T, value: String) {
        self.tokens.push(Emitted { ty, value });
    }

    fn token(&mut self, ty: T, value: &str, suppress_auto_white_space: bool) {
        self.previous = token_before(self.previous, ty, value);
        if !suppress_auto_white_space && self.previous & 1 == 1 {
            self.emit(T::WhiteSpace, " ".into());
        }
        self.emit(ty, value.to_owned());
        if ty == T::Delim && value.starts_with('\\') {
            self.emit(T::WhiteSpace, "\n".into());
        }
    }

    fn tokenize(&mut self, chunk: &str) {
        for (index, token) in tokenize(chunk).iter().enumerate() {
            self.token(token.ty, &token.value, index != 0);
        }
    }

    pub fn node(&mut self, node: &Node) {
        match node {
            Node::Value(children) => self.children(children),
            Node::Identifier(name) => self.token(T::Ident, name, false),
            Node::Number(value) => self.token(T::Number, value, false),
            Node::Dimension { value, unit } => {
                self.token(T::Dimension, &format!("{value}{unit}"), false)
            }
            Node::Percentage(value) => self.token(T::Percentage, &format!("{value}%"), false),
            Node::Hash(value) => self.token(T::Hash, &format!("#{value}"), false),
            Node::Str(value) => self.token(
                T::String,
                &String::from_utf16_lossy(&encode_string(value)),
                false,
            ),
            Node::Url(value) => {
                self.token(T::Url, &String::from_utf16_lossy(&encode_url(value)), false)
            }
            Node::Function { name, children } => {
                self.token(T::Function, &format!("{name}("), false);
                self.children(children);
                self.token(T::RightParenthesis, ")", false);
            }
            Node::Operator(value) | Node::UnicodeRange(value) => self.tokenize(value),
            Node::Raw { value, .. } => self.tokenize(value),
            Node::Parentheses(children) => {
                self.token(T::LeftParenthesis, "(", false);
                self.children(children);
                self.token(T::RightParenthesis, ")", false);
            }
            Node::Brackets(children) => {
                self.token(T::Delim, "[", false);
                self.children(children);
                self.token(T::Delim, "]", false);
            }
            Node::WhiteSpace(value) => self.token(T::WhiteSpace, value, false),
            Node::Comment(value) => self.token(T::Comment, &format!("/*{value}*/"), false),
            _ => {}
        }
    }

    fn children(&mut self, children: &[Node]) {
        for child in children {
            self.node(child);
        }
    }

    pub fn text(&self) -> String {
        self.tokens
            .iter()
            .map(|token| token.value.as_str())
            .collect()
    }

    /// The tokens as the lexer reads them, with their offsets in the generated text.
    pub fn lexer_tokens(&self) -> Vec<Token> {
        let mut start = 0;
        let mut start16 = 0;
        self.tokens
            .iter()
            .map(|token| {
                let end = start + token.value.len();
                let end16 = start16 + token.value.encode_utf16().count();
                let lexer_token = Token {
                    ty: token.ty,
                    value: token.value.clone(),
                    start16,
                    end16,
                    start,
                    end,
                };
                start = end;
                start16 = end16;
                lexer_token
            })
            .collect()
    }
}

/// css-tree `generate(node)`.
pub fn generate(node: &Node) -> String {
    let mut generator = Generator::default();
    generator.node(node);
    generator.text()
}

/// The text and lexer tokens of `generate(node)`.
pub fn generate_tokens(node: &Node) -> (String, Vec<Token>) {
    let mut generator = Generator::default();
    generator.node(node);
    (generator.text(), generator.lexer_tokens())
}
