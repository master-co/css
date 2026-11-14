//! Port of the parts of css-tree's parser (`lib/syntax/node/`, `lib/syntax/scope/`) the
//! checks read: stylesheets, rules, at-rules, blocks and declarations with positions, and
//! values. Rule and at-rule preludes are always read as `Raw`, as with css-tree's
//! `parseRulePrelude: false` and `parseAtrulePrelude: false`.
//!
//! css-tree copyright: Copyright (C) 2016-2026 by Roman Dvornov, MIT License.

use crate::stream::{PResult, ParseError, Stream};
use crate::strings::{decode_string, decode_url};
use crate::tokenizer::{TokenType as T, is_hex_digit};

/// An `!important` flag: css-tree keeps a non-standard name as a string.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Important {
    No,
    Yes,
    Other(String),
}

#[derive(Debug, Clone, PartialEq)]
pub enum Node {
    StyleSheet(Vec<Node>),
    Comment(String),
    Cdo,
    Cdc,
    Atrule {
        name: String,
        prelude: Option<Box<Node>>,
        block: Option<Box<Node>>,
        start: usize,
        end: usize,
    },
    Rule {
        prelude: Box<Node>,
        block: Box<Node>,
        start: usize,
        end: usize,
    },
    Block {
        children: Vec<Node>,
        start: usize,
        end: usize,
    },
    Declaration {
        property: String,
        important: Important,
        value: Box<Node>,
        /// The UTF-16 range of the value as written.
        value_start: usize,
        value_end: usize,
        start: usize,
        end: usize,
    },
    Value(Vec<Node>),
    Raw {
        value: String,
        start: usize,
        end: usize,
    },
    Identifier(String),
    Number(String),
    Dimension {
        value: String,
        unit: String,
    },
    Percentage(String),
    Hash(String),
    Str(Vec<u16>),
    Url(Vec<u16>),
    Function {
        name: String,
        children: Vec<Node>,
    },
    Operator(String),
    Parentheses(Vec<Node>),
    Brackets(Vec<Node>),
    UnicodeRange(String),
    WhiteSpace(String),
}

#[derive(Clone, Copy)]
enum Until {
    BalanceEnd,
    LeftCurlyBracket,
    LeftCurlyBracketOrSemicolon,
    ExclamationMarkOrSemicolon,
    SemicolonIncluded,
}

impl Until {
    fn stop(self, code: u32) -> u8 {
        match self {
            Self::BalanceEnd => 0,
            Self::LeftCurlyBracket => u8::from(code == 0x7b),
            Self::LeftCurlyBracketOrSemicolon => u8::from(code == 0x7b || code == 0x3b),
            Self::ExclamationMarkOrSemicolon => u8::from(code == 0x21 || code == 0x3b),
            Self::SemicolonIncluded => {
                if code == 0x3b {
                    2
                } else {
                    0
                }
            }
        }
    }
}

const PLUS: u32 = 0x2b;
const MINUS: u32 = 0x2d;
const QUESTION: u32 = 0x3f;

pub struct Parser {
    pub s: Stream,
    pub parse_value: bool,
    pub errors: Vec<ParseError>,
}

impl Parser {
    pub fn new(source: &str, parse_value: bool) -> Self {
        Self {
            s: Stream::new(source),
            parse_value,
            errors: Vec::new(),
        }
    }

    /// css-tree `parseWithFallback(consumer, fallback)`, recording the error as `onParseError`.
    fn with_fallback(
        &mut self,
        consumer: impl FnOnce(&mut Self) -> PResult<Node>,
        fallback: impl FnOnce(&mut Self) -> Node,
    ) -> Node {
        let start = self.s.index;
        match consumer(self) {
            Ok(node) => node,
            Err(error) => {
                self.s.seek(start);
                let node = fallback(self);
                self.errors.push(error);
                node
            }
        }
    }

    // ---- StyleSheet / Rule / Atrule / Block / Declaration ----

    /// `parse(source)` with the default `stylesheet` context.
    pub fn stylesheet(&mut self) -> Node {
        let mut children = Vec::new();
        while !self.s.eof {
            let child = match self.s.ty {
                Some(T::WhiteSpace) => {
                    self.s.next();
                    continue;
                }
                Some(T::Comment) => {
                    if self.s.char_code_at(self.s.start + 2) != 0x21 {
                        self.s.next();
                        continue;
                    }
                    let start = self.s.start;
                    let end = self.s.end;
                    self.s.next();
                    let terminated = self.s.cmp_str(end.saturating_sub(2), end, "*/");
                    Node::Comment(
                        self.s
                            .substring(start + 2, if terminated { end - 2 } else { end }),
                    )
                }
                Some(T::Cdo) => {
                    self.s.next();
                    Node::Cdo
                }
                Some(T::Cdc) => {
                    self.s.next();
                    Node::Cdc
                }
                Some(T::AtKeyword) => {
                    self.with_fallback(|p| p.atrule(false, false), |p| p.raw(None, false))
                }
                _ => self.with_fallback(Self::rule, |p| p.raw(None, false)),
            };
            children.push(child);
        }
        Node::StyleSheet(children)
    }

    fn rule(&mut self) -> PResult<Node> {
        let start_token = self.s.index;
        let start = self.s.start;
        self.s.seek(start_token);
        let prelude = self.raw(Some(Until::LeftCurlyBracket), true);
        let block = self.block(true, true)?;
        Ok(Node::Rule {
            prelude: Box::new(prelude),
            block: Box::new(block),
            start,
            end: self.s.start,
        })
    }

    fn is_declaration_block_atrule(&self) -> bool {
        let mut offset = 1;
        while let Some(ty) = self.s.lookup_type(offset) {
            if ty == T::RightCurlyBracket {
                return true;
            }
            if matches!(ty, T::LeftCurlyBracket | T::AtKeyword) {
                return false;
            }
            offset += 1;
        }
        false
    }

    fn atrule(&mut self, is_declaration: bool, allow_nested_rules: bool) -> PResult<Node> {
        let start = self.s.start;
        self.s.eat(T::AtKeyword)?;
        let name = self.s.substr_to_cursor(start + 1);
        let lower = name.to_lowercase();
        self.s.skip_sc();
        let mut prelude = None;
        if !self.s.eof && !matches!(self.s.ty, Some(T::LeftCurlyBracket | T::Semicolon)) {
            prelude = Some(Box::new(
                self.raw(Some(Until::LeftCurlyBracketOrSemicolon), true),
            ));
            self.s.skip_sc();
        }
        let mut block = None;
        match self.s.ty {
            Some(T::Semicolon) => self.s.next(),
            Some(T::LeftCurlyBracket) => {
                block = Some(Box::new(match lower.as_str() {
                    "font-face" | "page" | "nest" => self.block(true, false)?,
                    "media" | "layer" => self.block(is_declaration, allow_nested_rules)?,
                    "container" | "supports" | "scope" | "starting-style" => {
                        self.block(is_declaration, false)?
                    }
                    _ => {
                        let style = is_declaration || self.is_declaration_block_atrule();
                        self.block(style, allow_nested_rules)?
                    }
                }));
            }
            _ => {}
        }
        Ok(Node::Atrule {
            name,
            prelude,
            block,
            start,
            end: self.s.start,
        })
    }

    fn is_element_selector_start(&self) -> bool {
        if self.s.ty != Some(T::Ident) {
            return false;
        }
        let next = self.s.lookup_type_non_sc(1);
        if !matches!(next, Some(T::Colon | T::Semicolon | T::RightCurlyBracket)) {
            return true;
        }
        if next == Some(T::Colon) {
            let after = self.s.lookup_type_non_sc(2);
            if matches!(after, Some(T::Ident | T::Function)) {
                let mut offset = 3;
                while offset <= 15 {
                    match self.s.lookup_type(offset) {
                        Some(T::LeftCurlyBracket) => return true,
                        Some(T::Semicolon | T::RightCurlyBracket) => return false,
                        _ => offset += 1,
                    }
                }
            }
            return false;
        }
        false
    }

    fn is_selector_start(&self) -> bool {
        if self.s.ty == Some(T::Delim) {
            let code = self.s.char_code_at(self.s.start);
            if [0x26, 0x2e, 0x2a, 0x2b, 0x3e, 0x7e].contains(&code) {
                if [0x2a, 0x2b, 0x26].contains(&code)
                    && self.s.lookup_type(1) == Some(T::Ident)
                    && self.s.lookup_type_non_sc(1) == Some(T::Ident)
                {
                    return false;
                }
                return true;
            }
        }
        if self.s.ty == Some(T::Hash) {
            return true;
        }
        matches!(self.s.ty, Some(T::LeftSquareBracket | T::Colon))
            || self.is_element_selector_start()
    }

    fn consume_declaration(&mut self) -> Node {
        if self.s.ty == Some(T::Semicolon) {
            return self.raw(Some(Until::SemicolonIncluded), true);
        }
        let node = self.with_fallback(Self::declaration, |p| {
            p.raw(Some(Until::SemicolonIncluded), true)
        });
        if self.s.ty == Some(T::Semicolon) {
            self.s.next();
        }
        node
    }

    fn block(&mut self, is_style_block: bool, allow_nested_rules: bool) -> PResult<Node> {
        let start = self.s.start;
        let mut children = Vec::new();
        self.s.eat(T::LeftCurlyBracket)?;
        while !self.s.eof {
            match self.s.ty {
                Some(T::RightCurlyBracket) => break,
                Some(T::WhiteSpace | T::Comment) => self.s.next(),
                Some(T::AtKeyword) => {
                    let node = self.with_fallback(
                        |p| p.atrule(is_style_block, allow_nested_rules),
                        |p| p.raw(None, true),
                    );
                    children.push(node);
                }
                _ => {
                    let node =
                        if is_style_block && !(allow_nested_rules && self.is_selector_start()) {
                            self.consume_declaration()
                        } else {
                            self.with_fallback(Self::rule, |p| p.raw(None, true))
                        };
                    children.push(node);
                }
            }
        }
        if !self.s.eof {
            self.s.eat(T::RightCurlyBracket)?;
        }
        Ok(Node::Block {
            children,
            start,
            end: self.s.start,
        })
    }

    fn read_property(&mut self) -> PResult<String> {
        let start = self.s.start;
        if self.s.ty == Some(T::Delim) {
            match self.s.char_code_at(self.s.start) {
                0x2a | 0x24 | 0x2b | 0x23 | 0x26 => self.s.next(),
                0x2f => {
                    self.s.next();
                    if self.s.is_delim(0x2f) {
                        self.s.next();
                    }
                }
                _ => {}
            }
        }
        if self.s.ty == Some(T::Hash) {
            self.s.eat(T::Hash)?;
        } else {
            self.s.eat(T::Ident)?;
        }
        Ok(self.s.substr_to_cursor(start))
    }

    fn declaration(&mut self) -> PResult<Node> {
        let start = self.s.start;
        let start_token = self.s.index;
        let property = self.read_property()?;
        let custom = is_custom_property(&property);
        self.s.skip_sc();
        self.s.eat(T::Colon)?;
        let value_start = self.s.index;
        if !custom {
            self.s.skip_sc();
        }
        let value_offset = self.s.start;
        let mut value = if custom {
            self.raw(Some(Until::ExclamationMarkOrSemicolon), false)
        } else if self.parse_value {
            self.with_fallback(Self::consume_value, |p| {
                p.raw(Some(Until::ExclamationMarkOrSemicolon), true)
            })
        } else {
            self.raw(Some(Until::ExclamationMarkOrSemicolon), true)
        };
        if custom
            && let Node::Value(children) = &mut value
            && children.is_empty()
        {
            let mut index = value_start;
            while index <= self.s.index {
                if self.s.type_at(index) == Some(T::WhiteSpace) {
                    children.push(Node::WhiteSpace(" ".into()));
                    break;
                }
                index += 1;
            }
        }
        let (value_start, value_end) = match &value {
            Node::Raw { start, end, .. } => (*start, *end),
            _ => (value_offset, self.s.start),
        };
        let mut important = Important::No;
        if self.s.is_delim(0x21) {
            self.s.eat(T::Delim)?;
            self.s.skip_sc();
            let is_important = self.s.cmp_str(self.s.start, self.s.end, "important");
            let name = self.s.consume(T::Ident)?;
            important = if is_important {
                Important::Yes
            } else {
                Important::Other(name)
            };
            self.s.skip_sc();
        }
        if !self.s.eof && self.s.ty != Some(T::Semicolon) && !self.s.is_balance_edge(start_token) {
            return self.s.error(None, None);
        }
        Ok(Node::Declaration {
            property,
            important,
            value: Box::new(value),
            value_start,
            value_end,
            start,
            end: self.s.start,
        })
    }

    fn consume_value(&mut self) -> PResult<Node> {
        let start_token = self.s.index;
        let value = self.value()?;
        if !self.s.eof
            && self.s.ty != Some(T::Semicolon)
            && !self.s.is_delim(0x21)
            && !self.s.is_balance_edge(start_token)
        {
            return self.s.error(None, None);
        }
        Ok(value)
    }

    /// css-tree `Raw(consumeUntil, excludeWhiteSpace)`.
    fn raw(&mut self, until: Option<Until>, exclude_white_space: bool) -> Node {
        let start = self.s.token_start(self.s.index);
        let until = until.unwrap_or(Until::BalanceEnd);
        self.s
            .skip_until_balanced(self.s.index, move |code| until.stop(code));
        let end = if exclude_white_space && self.s.start > start {
            self.offset_exclude_ws()
        } else {
            self.s.start
        };
        Node::Raw {
            value: self.s.substring(start, end),
            start,
            end,
        }
    }

    fn offset_exclude_ws(&self) -> usize {
        if self.s.index > 0 && self.s.lookup_type(-1) == Some(T::WhiteSpace) {
            return if self.s.index > 1 {
                self.s.token_start(self.s.index - 1)
            } else {
                self.s.token_start(0)
            };
        }
        self.s.start
    }

    // ---- Value ----

    /// `parse(value, { context: 'value' })`.
    pub fn value_context(&mut self) -> PResult<Node> {
        let value = self.value()?;
        if !self.s.eof {
            return self.s.error(None, None);
        }
        Ok(value)
    }

    pub fn value(&mut self) -> PResult<Node> {
        Ok(Node::Value(self.read_sequence()?))
    }

    /// css-tree `readSequence(scope.Value)`.
    fn read_sequence(&mut self) -> PResult<Vec<Node>> {
        let mut children: Vec<Node> = Vec::new();
        let mut space = false;
        while !self.s.eof {
            match self.s.ty {
                Some(T::Comment) => {
                    self.s.next();
                    continue;
                }
                Some(T::WhiteSpace) => {
                    space = true;
                    self.s.next();
                    continue;
                }
                _ => {}
            }
            let Some(mut child) = self.value_node()? else {
                break;
            };
            if space {
                on_white_space(Some(&mut child), &mut children);
                space = false;
            }
            children.push(child);
        }
        if space {
            on_white_space(None, &mut children);
        }
        Ok(children)
    }

    /// The default recognizer (`scope/default.js`) with the `var` and `expression` functions.
    fn value_node(&mut self) -> PResult<Option<Node>> {
        let Some(ty) = self.s.ty else { return Ok(None) };
        Ok(Some(match ty {
            T::Hash => {
                let start = self.s.start;
                self.s.eat(T::Hash)?;
                Node::Hash(self.s.substr_to_cursor(start + 1))
            }
            T::Comma => self.operator(),
            T::LeftParenthesis => {
                self.s.eat(T::LeftParenthesis)?;
                let children = self.read_sequence()?;
                if !self.s.eof {
                    self.s.eat(T::RightParenthesis)?;
                }
                Node::Parentheses(children)
            }
            T::LeftSquareBracket => {
                self.s.eat(T::LeftSquareBracket)?;
                let children = self.read_sequence()?;
                if !self.s.eof {
                    self.s.eat(T::RightSquareBracket)?;
                }
                Node::Brackets(children)
            }
            T::String => {
                let value = self.s.consume(T::String)?;
                Node::Str(decode_string(&value.encode_utf16().collect::<Vec<_>>()))
            }
            T::Dimension => {
                let start = self.s.start;
                let value = self.s.consume_number(T::Dimension)?;
                let unit = self
                    .s
                    .substring(start + value.encode_utf16().count(), self.s.start);
                Node::Dimension { value, unit }
            }
            T::Percentage => Node::Percentage(self.s.consume_number(T::Percentage)?),
            T::Number => Node::Number(self.s.consume(T::Number)?),
            T::Function => {
                if self.s.cmp_str(self.s.start, self.s.end, "url(") {
                    self.url()?
                } else {
                    self.function()?
                }
            }
            T::Url => self.url()?,
            T::Ident => {
                if (self.s.char_code_at(self.s.start) | 0x20) == u32::from(b'u')
                    && self.s.char_code_at(self.s.start + 1) == PLUS
                {
                    self.unicode_range()?
                } else {
                    Node::Identifier(self.s.consume(T::Ident)?)
                }
            }
            T::Delim => {
                let code = self.s.char_code_at(self.s.start);
                if [0x2f, 0x2a, PLUS, MINUS].contains(&code) {
                    self.operator()
                } else if code == 0x23 {
                    return self.s.error(
                        Some("Hex or identifier is expected".into()),
                        Some(self.s.start + 1),
                    );
                } else {
                    return Ok(None);
                }
            }
            _ => return Ok(None),
        }))
    }

    fn operator(&mut self) -> Node {
        let start = self.s.start;
        self.s.next();
        Node::Operator(self.s.substr_to_cursor(start))
    }

    fn url(&mut self) -> PResult<Node> {
        let value = match self.s.ty {
            Some(T::Url) => {
                let token = self.s.consume(T::Url)?;
                decode_url(&token.encode_utf16().collect::<Vec<_>>())
            }
            Some(T::Function) => {
                if !self.s.cmp_str(self.s.start, self.s.end, "url(") {
                    return self
                        .s
                        .error(Some("Function name must be `url`".into()), None);
                }
                self.s.eat(T::Function)?;
                self.s.skip_sc();
                let token = self.s.consume(T::String)?;
                let value = decode_string(&token.encode_utf16().collect::<Vec<_>>());
                self.s.skip_sc();
                if !self.s.eof {
                    self.s.eat(T::RightParenthesis)?;
                }
                value
            }
            _ => {
                return self
                    .s
                    .error(Some("Url or Function is expected".into()), None);
            }
        };
        Ok(Node::Url(value))
    }

    fn function(&mut self) -> PResult<Node> {
        let name = self.s.consume_function_name()?;
        let lower = name.to_lowercase();
        let children = match lower.as_str() {
            "expression" => vec![self.raw(None, false)],
            "var" => self.var_function()?,
            _ => self.read_sequence()?,
        };
        if !self.s.eof {
            self.s.eat(T::RightParenthesis)?;
        }
        Ok(Node::Function { name, children })
    }

    fn var_function(&mut self) -> PResult<Vec<Node>> {
        let mut children = Vec::new();
        self.s.skip_sc();
        children.push(Node::Identifier(self.s.consume(T::Ident)?));
        self.s.skip_sc();
        if self.s.ty == Some(T::Comma) {
            children.push(self.operator());
            children.push(self.raw(Some(Until::ExclamationMarkOrSemicolon), false));
        }
        Ok(children)
    }

    fn unicode_range(&mut self) -> PResult<Node> {
        let start = self.s.start;
        self.s.eat_ident("u")?;
        self.scan_unicode_range()?;
        Ok(Node::UnicodeRange(self.s.substr_to_cursor(start)))
    }

    fn eat_hex_sequence(&mut self, offset: usize, allow_dash: bool) -> PResult<isize> {
        let mut len = 0usize;
        let mut pos = self.s.start + offset;
        while pos < self.s.end {
            let code = self.s.char_code_at(pos);
            if code == MINUS && allow_dash && len != 0 {
                self.eat_hex_sequence(offset + len + 1, false)?;
                return Ok(-1);
            }
            if !is_hex_digit(code) {
                let message = if allow_dash && len != 0 {
                    format!(
                        "Hyphen minus{} is expected",
                        if len < 6 { " or hex digit" } else { "" }
                    )
                } else if len < 6 {
                    "Hex digit is expected".into()
                } else {
                    "Unexpected input".into()
                };
                return self.s.error(Some(message), Some(pos));
            }
            len += 1;
            if len > 6 {
                return self.s.error(Some("Too many hex digits".into()), Some(pos));
            }
            pos += 1;
        }
        self.s.next();
        Ok(len as isize)
    }

    fn eat_question_mark_sequence(&mut self, max: isize) -> PResult<()> {
        let mut count = 0;
        while self.s.is_delim(QUESTION) {
            count += 1;
            if count > max {
                return self.s.error(Some("Too many question marks".into()), None);
            }
            self.s.next();
        }
        Ok(())
    }

    fn starts_with(&self, code: u32) -> PResult<()> {
        if self.s.char_code_at(self.s.start) != code {
            let name = if code == PLUS {
                "Plus sign"
            } else {
                "Hyphen minus"
            };
            return self.s.error(Some(format!("{name} is expected")), None);
        }
        Ok(())
    }

    fn scan_unicode_range(&mut self) -> PResult<()> {
        match self.s.ty {
            Some(T::Number) => {
                let hex = self.eat_hex_sequence(1, true)?;
                if self.s.is_delim(QUESTION) {
                    return self.eat_question_mark_sequence(6 - hex);
                }
                if matches!(self.s.ty, Some(T::Dimension | T::Number)) {
                    self.starts_with(MINUS)?;
                    self.eat_hex_sequence(1, false)?;
                }
            }
            Some(T::Dimension) => {
                let hex = self.eat_hex_sequence(1, true)?;
                if hex > 0 {
                    self.eat_question_mark_sequence(6 - hex)?;
                }
            }
            _ => {
                self.s.eat_delim(PLUS)?;
                if self.s.ty == Some(T::Ident) {
                    let hex = self.eat_hex_sequence(0, true)?;
                    if hex > 0 {
                        self.eat_question_mark_sequence(6 - hex)?;
                    }
                    return Ok(());
                }
                if self.s.is_delim(QUESTION) {
                    self.s.next();
                    return self.eat_question_mark_sequence(5);
                }
                return self
                    .s
                    .error(Some("Hex digit or question mark is expected".into()), None);
            }
        }
        Ok(())
    }
}

fn is_custom_property(name: &str) -> bool {
    name.starts_with("--")
}

fn is_plus_minus_operator(node: &Node) -> bool {
    matches!(node, Node::Operator(value) if value.ends_with(['+', '-']))
}

/// `scope/value.js` `onWhiteSpace`: whitespace around `+` and `-` operators is significant.
fn on_white_space(next: Option<&mut Node>, children: &mut [Node]) {
    if let Some(next) = next
        && is_plus_minus_operator(next)
        && let Node::Operator(value) = next
    {
        value.insert(0, ' ');
    }
    if let Some(last) = children.last_mut()
        && is_plus_minus_operator(last)
        && let Node::Operator(value) = last
    {
        value.push(' ');
    }
}
