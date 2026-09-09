use std::{borrow::Cow, ops::Range};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CssSyntaxKind<'a> {
    Ident(Cow<'a, str>),
    String(Cow<'a, str>),
    AtKeyword(Cow<'a, str>),
    Function(Cow<'a, str>),
    Number(&'a str),
    Dimension(&'a str, Cow<'a, str>),
    Percentage(&'a str),
    Other,
    Delim(char),
}

#[derive(Debug, Clone)]
pub struct CssSyntaxToken<'a> {
    pub kind: CssSyntaxKind<'a>,
    pub bytes: Range<usize>,
    pub close: Option<usize>,
}

#[derive(Debug)]
pub struct CssSyntaxStatement {
    pub tokens: Range<usize>,
    pub parent: Option<usize>,
    pub has_block: bool,
    pub declaration: bool,
}

fn whitespace(c: char) -> bool {
    matches!(c, ' ' | '\t' | '\n' | '\r' | '\x0c')
}

fn name_character(c: char) -> bool {
    c.is_ascii_alphanumeric() || c == '-' || c == '_' || !c.is_ascii()
}

fn starts_identifier(source: &str) -> bool {
    let mut chars = source.chars();
    let Some(first) = chars.next() else {
        return false;
    };
    let escape = |next: Option<char>| next.is_some_and(|c| !matches!(c, '\r' | '\n' | '\x0c'));
    let start = |c: char| c.is_ascii_alphabetic() || c == '_' || !c.is_ascii();
    match first {
        '-' => match chars.next() {
            Some('\\') => escape(chars.next()),
            Some(c) => start(c) || c == '-',
            None => false,
        },
        '\\' => escape(chars.next()),
        c => start(c),
    }
}

/// CSS numbers include a sign, fractional part and optional decimal exponent.
/// Units are consumed separately so `1e2ms` cannot be mistaken for an identifier.
fn number_end(source: &str) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut cursor = usize::from(matches!(bytes.first(), Some(b'+' | b'-')));
    let start = cursor;
    while bytes.get(cursor).is_some_and(u8::is_ascii_digit) {
        cursor += 1;
    }
    let digits = cursor > start;
    if bytes.get(cursor) == Some(&b'.') && bytes.get(cursor + 1).is_some_and(u8::is_ascii_digit) {
        cursor += 2;
        while bytes.get(cursor).is_some_and(u8::is_ascii_digit) {
            cursor += 1;
        }
    } else if !digits {
        return None;
    }
    if matches!(bytes.get(cursor), Some(b'e' | b'E')) {
        let mut exponent = cursor + 1;
        if matches!(bytes.get(exponent), Some(b'+' | b'-')) {
            exponent += 1;
        }
        if bytes.get(exponent).is_some_and(u8::is_ascii_digit) {
            cursor = exponent + 1;
            while bytes.get(cursor).is_some_and(u8::is_ascii_digit) {
                cursor += 1;
            }
        }
    }
    Some(cursor)
}

fn escape(source: &str, cursor: &mut usize) -> Option<char> {
    *cursor += 1;
    let first = source[*cursor..].chars().next()?;
    if matches!(first, '\r' | '\n' | '\x0c') {
        *cursor += first.len_utf8();
        if first == '\r' && source[*cursor..].starts_with('\n') {
            *cursor += 1;
        }
        return None;
    }
    if first.is_ascii_hexdigit() {
        let start = *cursor;
        while *cursor - start < 6
            && source
                .as_bytes()
                .get(*cursor)
                .is_some_and(u8::is_ascii_hexdigit)
        {
            *cursor += 1;
        }
        let value = u32::from_str_radix(&source[start..*cursor], 16).unwrap_or_default();
        if let Some(c) = source[*cursor..].chars().next().filter(|c| whitespace(*c)) {
            *cursor += c.len_utf8();
            if c == '\r' && source[*cursor..].starts_with('\n') {
                *cursor += 1;
            }
        }
        Some(
            char::from_u32(value)
                .filter(|c| *c != '\0')
                .unwrap_or('\u{fffd}'),
        )
    } else {
        *cursor += first.len_utf8();
        Some(first)
    }
}

fn name<'a>(source: &'a str, cursor: &mut usize) -> Cow<'a, str> {
    let start = *cursor;
    let mut decoded: Option<String> = None;
    while let Some(c) = source[*cursor..].chars().next() {
        if c == '\\'
            && source[*cursor + 1..]
                .chars()
                .next()
                .is_some_and(|c| !matches!(c, '\r' | '\n' | '\x0c'))
        {
            let output = decoded.get_or_insert_with(|| source[start..*cursor].to_owned());
            if let Some(c) = escape(source, cursor) {
                output.push(c);
            }
        } else if name_character(c) {
            *cursor += c.len_utf8();
            if let Some(output) = &mut decoded {
                output.push(c);
            }
        } else {
            break;
        }
    }
    decoded.map_or_else(|| Cow::Borrowed(&source[start..*cursor]), Cow::Owned)
}

/// Component tokens with decoded CSS names, byte ranges and matched block ends.
/// This is lexical structure, not validation of property or at-rule grammars.
pub fn tokenize_css_syntax(source: &str) -> Vec<CssSyntaxToken<'_>> {
    let mut tokens: Vec<CssSyntaxToken<'_>> = Vec::new();
    let mut opens: Vec<(char, usize)> = Vec::new();
    let mut cursor = 0;
    while cursor < source.len() {
        let start = cursor;
        let c = source[cursor..].chars().next().unwrap();
        if whitespace(c) {
            cursor += c.len_utf8();
            continue;
        }
        if source[cursor..].starts_with("/*") {
            cursor = super::skip_css_string_or_comment(source, cursor).unwrap();
            continue;
        }
        let kind = if matches!(c, '\'' | '"') {
            cursor += 1;
            let content_start = cursor;
            let mut decoded: Option<String> = None;
            let mut valid = true;
            while let Some(next) = source[cursor..].chars().next() {
                if next == c {
                    break;
                }
                if matches!(next, '\r' | '\n' | '\x0c') {
                    valid = false;
                    break;
                }
                if next == '\\' {
                    let output =
                        decoded.get_or_insert_with(|| source[content_start..cursor].to_owned());
                    if let Some(value) = escape(source, &mut cursor) {
                        output.push(value);
                    }
                } else {
                    cursor += next.len_utf8();
                    if let Some(output) = &mut decoded {
                        output.push(next);
                    }
                }
            }
            let value =
                decoded.map_or_else(|| Cow::Borrowed(&source[content_start..cursor]), Cow::Owned);
            if source[cursor..].starts_with(c) {
                cursor += 1;
            }
            if valid {
                CssSyntaxKind::String(value)
            } else {
                CssSyntaxKind::Other
            }
        } else if let Some(end) = number_end(&source[cursor..]) {
            cursor += end;
            let number = &source[start..cursor];
            if starts_identifier(&source[cursor..]) {
                CssSyntaxKind::Dimension(number, name(source, &mut cursor))
            } else if source[cursor..].starts_with('%') {
                cursor += 1;
                CssSyntaxKind::Percentage(number)
            } else {
                CssSyntaxKind::Number(number)
            }
        } else if c == '@' && starts_identifier(&source[cursor + 1..]) {
            cursor += 1;
            let value = name(source, &mut cursor);
            if value.is_empty() {
                CssSyntaxKind::Delim('@')
            } else {
                CssSyntaxKind::AtKeyword(value)
            }
        } else if starts_identifier(&source[cursor..]) {
            let value = name(source, &mut cursor);
            if cursor == start {
                cursor += c.len_utf8();
                CssSyntaxKind::Other
            } else if source[cursor..].starts_with('(') {
                cursor += 1;
                CssSyntaxKind::Function(value)
            } else {
                CssSyntaxKind::Ident(value)
            }
        } else {
            cursor += c.len_utf8();
            CssSyntaxKind::Delim(c)
        };
        let index = tokens.len();
        match &kind {
            CssSyntaxKind::Function(_) | CssSyntaxKind::Delim('(') => opens.push((')', index)),
            CssSyntaxKind::Delim('[') => opens.push((']', index)),
            CssSyntaxKind::Delim('{') => opens.push(('}', index)),
            CssSyntaxKind::Delim(c) if opens.last().is_some_and(|(close, _)| close == c) => {
                let (_, open) = opens.pop().unwrap();
                tokens[open].close = Some(index);
            }
            _ => {}
        }
        tokens.push(CssSyntaxToken {
            kind,
            bytes: start..cursor,
            close: None,
        });
    }
    tokens
}

/// Walk statement/block structure, retaining parent indices for domain policy.
/// Custom-property blocks stay within their declaration value. Selectors and
/// at-rule preludes are never split at nested function/bracket delimiters.
pub fn collect_css_syntax_statements(tokens: &[CssSyntaxToken<'_>]) -> Vec<CssSyntaxStatement> {
    let mut result = Vec::new();
    let mut blocks = vec![(0, tokens.len(), None)];
    while let Some((mut start, end, parent)) = blocks.pop() {
        while start < end {
            if matches!(tokens[start].kind, CssSyntaxKind::Delim(';' | '}')) {
                start += 1;
                continue;
            }
            let declaration = parent.is_some()
                && matches!(tokens[start].kind, CssSyntaxKind::Ident(_))
                && tokens
                    .get(start + 1)
                    .is_some_and(|t| t.kind == CssSyntaxKind::Delim(':'));
            let custom = declaration
                && matches!(&tokens[start].kind, CssSyntaxKind::Ident(name) if name.starts_with("--"));
            let mut cursor = start;
            while cursor < end {
                match tokens[cursor].kind {
                    CssSyntaxKind::Delim(';') => break,
                    CssSyntaxKind::Delim('{') if !custom => break,
                    CssSyntaxKind::Function(_) | CssSyntaxKind::Delim('(' | '[' | '{') => {
                        cursor = tokens[cursor].close.map_or(end, |close| close + 1);
                    }
                    _ => cursor += 1,
                }
            }
            let has_block = cursor < end && tokens[cursor].kind == CssSyntaxKind::Delim('{');
            let index = result.len();
            result.push(CssSyntaxStatement {
                tokens: start..cursor,
                parent,
                has_block,
                declaration: declaration && !has_block,
            });
            start = if has_block {
                let close = tokens[cursor].close.unwrap_or(end).min(end);
                blocks.push((cursor + 1, close, Some(index)));
                close + 1
            } else {
                cursor + 1
            };
        }
    }
    result
}
