//! Port of css-tree's generic types (`lib/lexer/generic.js`, `units.js`, `generic-const.js`).
//!
//! A generic type is a function of the current token (and the tokens after it) that returns how
//! many tokens it consumes; `0` is a mismatch.
//!
//! `<an-plus-b>` and `<urange>` are in [`super::an_plus_b`] and [`super::urange`].

use crate::definition::ast::TypeRange;

use super::super::tokenizer::{
    Token, TokenType, consume_number_str, is_digit, is_hex_digit, is_identifier_start,
};

/// css-tree `cssWideKeywords`.
pub const CSS_WIDE_KEYWORDS: &[&str] = &["initial", "inherit", "unset", "revert", "revert-layer"];

const LENGTH_UNITS: &[&str] = &[
    "cm", "mm", "q", "in", "pt", "pc", "px", "em", "rem", "ex", "rex", "cap", "rcap", "ch", "rch",
    "ic", "ric", "lh", "rlh", "vw", "svw", "lvw", "dvw", "vh", "svh", "lvh", "dvh", "vi", "svi",
    "lvi", "dvi", "vb", "svb", "lvb", "dvb", "vmin", "svmin", "lvmin", "dvmin", "vmax", "svmax",
    "lvmax", "dvmax", "cqw", "cqh", "cqi", "cqb", "cqmin", "cqmax",
];
const ANGLE_UNITS: &[&str] = &["deg", "grad", "rad", "turn"];
const TIME_UNITS: &[&str] = &["s", "ms"];
const FREQUENCY_UNITS: &[&str] = &["hz", "khz"];
const RESOLUTION_UNITS: &[&str] = &["dpi", "dpcm", "dppx", "x"];
const FLEX_UNITS: &[&str] = &["fr"];
const DECIBEL_UNITS: &[&str] = &["db"];
const SEMITONES_UNITS: &[&str] = &["st"];

const CALC: &[&str] = &["calc(", "-moz-calc(", "-webkit-calc("];
const COMPARISON: &[&str] = &["min(", "max(", "clamp("];
const STEPPED: &[&str] = &["round(", "mod(", "rem("];
const TRIG_NUMBER: &[&str] = &["sin(", "cos(", "tan("];
const TRIG_ANGLE: &[&str] = &["asin(", "acos(", "atan(", "atan2("];
const OTHER_NUMBER: &[&str] = &["pow(", "sqrt(", "log(", "exp(", "sign("];
const HYPOT: &[&str] = &["hypot("];
const ABS: &[&str] = &["abs("];

/// Which function names `math()` accepts in place of the type.
#[derive(Clone, Copy)]
enum MathSet {
    Number,
    Percentage,
    Dimension,
}

fn math_function_names(set: MathSet) -> Vec<&'static str> {
    let groups: &[&[&str]] = match set {
        MathSet::Number => &[
            CALC,
            COMPARISON,
            STEPPED,
            TRIG_NUMBER,
            OTHER_NUMBER,
            HYPOT,
            ABS,
        ],
        MathSet::Percentage => &[CALC, COMPARISON, STEPPED, HYPOT, ABS],
        MathSet::Dimension => &[CALC, COMPARISON, STEPPED, TRIG_ANGLE, HYPOT, ABS],
    };
    groups.iter().flat_map(|g| g.iter().copied()).collect()
}

/// A generic type of the lexer.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Generic {
    TokenType(TokenType),
    String,
    Ident,
    Percentage,
    Zero,
    Number,
    Integer,
    CustomIdent,
    DashedIdent,
    CustomPropertyName,
    HexColor,
    IdSelector,
    AnPlusB,
    Urange,
    DeclarationValue,
    AnyValue,
    Dimension(Option<&'static [&'static str]>),
    Length,
    AttrUnit,
}

/// The generic type named `name` (css-tree `createGenericTypes`).
pub fn lookup(name: &str) -> Option<Generic> {
    use TokenType as T;
    Some(match name {
        "ident-token" => Generic::TokenType(T::Ident),
        "function-token" => Generic::TokenType(T::Function),
        "at-keyword-token" => Generic::TokenType(T::AtKeyword),
        "hash-token" => Generic::TokenType(T::Hash),
        "string-token" => Generic::TokenType(T::String),
        "bad-string-token" => Generic::TokenType(T::BadString),
        "url-token" => Generic::TokenType(T::Url),
        "bad-url-token" => Generic::TokenType(T::BadUrl),
        "delim-token" => Generic::TokenType(T::Delim),
        "number-token" => Generic::TokenType(T::Number),
        "percentage-token" => Generic::TokenType(T::Percentage),
        "dimension-token" => Generic::TokenType(T::Dimension),
        "whitespace-token" => Generic::TokenType(T::WhiteSpace),
        "CDO-token" => Generic::TokenType(T::Cdo),
        "CDC-token" => Generic::TokenType(T::Cdc),
        "colon-token" => Generic::TokenType(T::Colon),
        "semicolon-token" => Generic::TokenType(T::Semicolon),
        "comma-token" => Generic::TokenType(T::Comma),
        "[-token" => Generic::TokenType(T::LeftSquareBracket),
        "]-token" => Generic::TokenType(T::RightSquareBracket),
        "(-token" => Generic::TokenType(T::LeftParenthesis),
        ")-token" => Generic::TokenType(T::RightParenthesis),
        "{-token" => Generic::TokenType(T::LeftCurlyBracket),
        "}-token" => Generic::TokenType(T::RightCurlyBracket),
        "string" => Generic::String,
        "ident" => Generic::Ident,
        "percentage" => Generic::Percentage,
        "zero" => Generic::Zero,
        "number" => Generic::Number,
        "integer" => Generic::Integer,
        "custom-ident" => Generic::CustomIdent,
        "dashed-ident" => Generic::DashedIdent,
        "custom-property-name" => Generic::CustomPropertyName,
        "hex-color" => Generic::HexColor,
        "id-selector" => Generic::IdSelector,
        "an-plus-b" => Generic::AnPlusB,
        "urange" => Generic::Urange,
        "declaration-value" => Generic::DeclarationValue,
        "any-value" => Generic::AnyValue,
        "dimension" => Generic::Dimension(None),
        "angle" => Generic::Dimension(Some(ANGLE_UNITS)),
        "decibel" => Generic::Dimension(Some(DECIBEL_UNITS)),
        "frequency" => Generic::Dimension(Some(FREQUENCY_UNITS)),
        "flex" => Generic::Dimension(Some(FLEX_UNITS)),
        "length" => Generic::Length,
        "resolution" => Generic::Dimension(Some(RESOLUTION_UNITS)),
        "semitones" => Generic::Dimension(Some(SEMITONES_UNITS)),
        "time" => Generic::Dimension(Some(TIME_UNITS)),
        "attr-unit" => Generic::AttrUnit,
        _ => return None,
    })
}

/// The tokens a generic type sees: the current token and `getNextToken(offset)`.
pub struct Cursor<'a> {
    pub tokens: &'a [Token],
    pub index: usize,
}

impl<'a> Cursor<'a> {
    pub fn token(&self) -> Option<&'a Token> {
        self.tokens.get(self.index)
    }

    /// css-tree `getNextToken(offset)`: whitespace and comments included.
    pub fn next(&self, offset: usize) -> Option<&'a Token> {
        self.tokens.get(self.index + offset)
    }
}

impl Generic {
    /// The number of tokens the type consumes at `cursor` (css-tree's generic function).
    pub fn consume(self, cursor: &Cursor<'_>, opts: Option<&TypeRange>) -> usize {
        let Some(token) = cursor.token() else {
            return 0;
        };
        match self {
            Self::TokenType(ty) => usize::from(token.ty == ty),
            Self::String => usize::from(token.ty == TokenType::String),
            Self::Ident => usize::from(token.ty == TokenType::Ident),
            Self::Percentage => {
                math(cursor, MathSet::Percentage).unwrap_or_else(|| percentage(token, opts))
            }
            Self::Zero => zero(token),
            Self::Number => math(cursor, MathSet::Number).unwrap_or_else(|| number(token, opts)),
            Self::Integer => math(cursor, MathSet::Number).unwrap_or_else(|| integer(token, opts)),
            Self::CustomIdent => custom_ident(token),
            Self::DashedIdent => dashed_ident(token),
            Self::CustomPropertyName => {
                usize::from(dashed_ident(token) == 1 && token.value != "--")
            }
            Self::HexColor => hex_color(token),
            Self::IdSelector => id_selector(token),
            Self::AnPlusB => super::an_plus_b::an_plus_b(cursor),
            Self::Urange => super::urange::urange(cursor),
            Self::DeclarationValue => balanced_value(cursor, true),
            Self::AnyValue => balanced_value(cursor, false),
            Self::Dimension(units) => {
                math(cursor, MathSet::Dimension).unwrap_or_else(|| dimension(token, units, opts))
            }
            Self::Length => math(cursor, MathSet::Dimension).unwrap_or_else(|| {
                let z = zero(token);
                if z > 0 {
                    z
                } else {
                    dimension(token, Some(LENGTH_UNITS), opts)
                }
            }),
            Self::AttrUnit => attr_unit(token),
        }
    }
}

fn eq_ignore_case(actual: &str, expected: &str) -> bool {
    // css-tree `cmpStr`: only A-Z is folded.
    actual.len() == expected.len()
        && actual
            .bytes()
            .zip(expected.bytes())
            .all(|(a, e)| (if a.is_ascii_uppercase() { a | 32 } else { a }) == e)
}

fn math(cursor: &Cursor<'_>, set: MathSet) -> Option<usize> {
    let token = cursor.token()?;
    if token.ty == TokenType::Function
        && math_function_names(set)
            .iter()
            .any(|n| eq_ignore_case(&token.value, n))
    {
        return Some(consume_function(cursor));
    }
    None
}

fn close_of(ty: TokenType) -> Option<TokenType> {
    match ty {
        TokenType::Function | TokenType::LeftParenthesis => Some(TokenType::RightParenthesis),
        TokenType::LeftSquareBracket => Some(TokenType::RightSquareBracket),
        TokenType::LeftCurlyBracket => Some(TokenType::RightCurlyBracket),
        _ => None,
    }
}

fn is_closing(ty: TokenType) -> bool {
    matches!(
        ty,
        TokenType::RightCurlyBracket | TokenType::RightParenthesis | TokenType::RightSquareBracket
    )
}

/// css-tree `consumeFunction`.
fn consume_function(cursor: &Cursor<'_>) -> usize {
    let mut close: Option<TokenType> = None;
    let mut stash: Vec<Option<TokenType>> = Vec::new();
    let mut length = 0;
    let mut token = cursor.token();
    while let Some(t) = token {
        if is_closing(t.ty) {
            if Some(t.ty) != close {
                break;
            }
            close = stash.pop().flatten();
            if stash.is_empty() {
                length += 1;
                break;
            }
        } else if let Some(c) = close_of(t.ty) {
            stash.push(close);
            close = Some(c);
        }
        length += 1;
        token = cursor.next(length);
    }
    length
}

/// css-tree `declarationValue` (`declaration`) and `anyValue`.
fn balanced_value(cursor: &Cursor<'_>, declaration: bool) -> usize {
    let mut close: Option<TokenType> = None;
    let mut stash: Vec<Option<TokenType>> = Vec::new();
    let mut length = 0;
    let mut token = cursor.token();
    while let Some(t) = token {
        match t.ty {
            TokenType::BadString | TokenType::BadUrl => break,
            ty if is_closing(ty) => {
                if Some(ty) != close {
                    break;
                }
                close = stash.pop().flatten();
            }
            TokenType::Semicolon if declaration && close.is_none() => break,
            TokenType::Delim if declaration && close.is_none() && t.value == "!" => break,
            ty => {
                if let Some(c) = close_of(ty) {
                    stash.push(close);
                    close = Some(c);
                }
            }
        }
        length += 1;
        token = cursor.next(length);
    }
    length
}

/// JS `Number(string)` for the strings the generic types pass it.
pub(crate) fn js_number(s: &str) -> f64 {
    let s = s.trim();
    if s.is_empty() {
        return 0.0;
    }
    let valid = s
        .bytes()
        .all(|b| b.is_ascii_digit() || matches!(b, b'+' | b'-' | b'.' | b'e' | b'E'));
    if !valid {
        return f64::NAN;
    }
    s.parse::<f64>().unwrap_or(f64::NAN)
}

/// A range bound: a number, or a string (a bound with a unit, which css-tree does not check).
fn range_bound(raw: Option<&String>) -> Option<f64> {
    let raw = raw?;
    let n = js_number(raw);
    if n.is_nan() { None } else { Some(n) }
}

/// css-tree `outOfRange`.
fn out_of_range(opts: Option<&TypeRange>, value: &str, num_end: usize) -> bool {
    let Some(range) = opts else {
        return false;
    };
    let units: Vec<u16> = value.encode_utf16().collect();
    let num_str = if num_end == units.len() {
        value.to_owned()
    } else {
        String::from_utf16_lossy(&units[..num_end.min(units.len())])
    };
    let num = js_number(&num_str);
    if num.is_nan() {
        return true;
    }
    if let Some(min) = range_bound(range.min.as_ref())
        && num < min
    {
        return true;
    }
    if let Some(max) = range_bound(range.max.as_ref())
        && num > max
    {
        return true;
    }
    false
}

fn char_at(value: &str, index: usize) -> u32 {
    value.encode_utf16().nth(index).map_or(0, u32::from)
}

fn utf16_len(value: &str) -> usize {
    value.encode_utf16().count()
}

/// css-tree `isPostfixIeHack`.
fn is_postfix_ie_hack(value: &str, offset: usize) -> bool {
    offset + 2 == utf16_len(value)
        && char_at(value, offset) == 0x5C
        && is_digit(char_at(value, offset + 1))
}

fn percentage(token: &Token, opts: Option<&TypeRange>) -> usize {
    if token.ty != TokenType::Percentage {
        return 0;
    }
    usize::from(!out_of_range(
        opts,
        &token.value,
        utf16_len(&token.value) - 1,
    ))
}

fn zero(token: &Token) -> usize {
    usize::from(token.ty == TokenType::Number && js_number(&token.value) == 0.0)
}

fn number(token: &Token, opts: Option<&TypeRange>) -> usize {
    let number_end = consume_number_str(&token.value);
    let is_number = number_end == utf16_len(&token.value);
    if !is_number && !is_postfix_ie_hack(&token.value, number_end) {
        return 0;
    }
    usize::from(!out_of_range(opts, &token.value, number_end))
}

fn integer(token: &Token, opts: Option<&TypeRange>) -> usize {
    if token.ty != TokenType::Number {
        return 0;
    }
    let units: Vec<u16> = token.value.encode_utf16().collect();
    let mut i = usize::from(matches!(units.first(), Some(0x2B | 0x2D)));
    while i < units.len() {
        if !is_digit(u32::from(units[i])) {
            return 0;
        }
        i += 1;
    }
    usize::from(!out_of_range(opts, &token.value, i))
}

fn dimension(token: &Token, units: Option<&[&str]>, opts: Option<&TypeRange>) -> usize {
    if token.ty != TokenType::Dimension {
        return 0;
    }
    let value: Vec<u16> = token.value.encode_utf16().collect();
    let number_end = consume_number_str(&token.value);
    if let Some(units) = units {
        let backslash = value[number_end..]
            .iter()
            .position(|&c| c == 0x5C)
            .map(|p| p + number_end);
        let unit_end = match backslash {
            Some(b) if is_postfix_ie_hack(&token.value, b) => b,
            _ => value.len(),
        };
        let unit = String::from_utf16_lossy(&value[number_end..unit_end]).to_lowercase();
        if !units.contains(&unit.as_str()) {
            return 0;
        }
    }
    usize::from(!out_of_range(opts, &token.value, number_end))
}

fn custom_ident(token: &Token) -> usize {
    if token.ty != TokenType::Ident {
        return 0;
    }
    let name = token.value.to_lowercase();
    if CSS_WIDE_KEYWORDS.iter().any(|k| eq_ignore_case(&name, k))
        || eq_ignore_case(&name, "default")
    {
        return 0;
    }
    1
}

fn dashed_ident(token: &Token) -> usize {
    usize::from(token.ty == TokenType::Ident && token.value.starts_with("--"))
}

fn hex_color(token: &Token) -> usize {
    if token.ty != TokenType::Hash {
        return 0;
    }
    let units: Vec<u16> = token.value.encode_utf16().collect();
    if !matches!(units.len(), 4 | 5 | 7 | 9) {
        return 0;
    }
    usize::from(units[1..].iter().all(|&c| is_hex_digit(u32::from(c))))
}

fn id_selector(token: &Token) -> usize {
    if token.ty != TokenType::Hash {
        return 0;
    }
    let v = &token.value;
    usize::from(is_identifier_start(
        char_at(v, 1),
        char_at(v, 2),
        char_at(v, 3),
    ))
}

fn attr_unit(token: &Token) -> usize {
    if token.ty == TokenType::Delim && token.value == "%" {
        return 1;
    }
    if token.ty == TokenType::Ident {
        let lower = token.value.to_lowercase();
        let groups: [&[&str]; 8] = [
            LENGTH_UNITS,
            ANGLE_UNITS,
            TIME_UNITS,
            FREQUENCY_UNITS,
            RESOLUTION_UNITS,
            FLEX_UNITS,
            DECIBEL_UNITS,
            SEMITONES_UNITS,
        ];
        return usize::from(groups.iter().any(|g| g.contains(&lower.as_str())));
    }
    0
}
