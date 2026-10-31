//! Structural class heads. A class is a native declaration `(property:value)`, a
//! functional utility `name(...)` or a named utility. A declaration head ends at its
//! closing parenthesis, found with CSS component-value rules before any manifest,
//! property, selector or utility lookup.
use crate::css_syntax::{name, starts_identifier};
use std::ops::Range;

/// The characters that may begin a class suffix after a complete head: importance,
/// selector combinators, pseudo-classes, attributes, `_` descendants and conditions.
pub fn is_class_suffix_start(character: char) -> bool {
    matches!(
        character,
        '!' | '*' | '>' | '+' | '~' | ':' | '[' | '@' | '_' | '.'
    )
}

/// One `(property:value)` head. Ranges are byte offsets into the class.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NativeDeclarationHead {
    /// The authored property name.
    pub property: Range<usize>,
    /// The authored value, without a trailing native `!important`.
    pub value: Range<usize>,
    /// Everything between the colon and the closing parenthesis.
    pub body: Range<usize>,
    /// Whether the value ends with a native `!important`.
    pub important: bool,
    /// The byte after the closing parenthesis.
    pub suffix_start: usize,
}

impl NativeDeclarationHead {
    pub fn custom_property(&self, source: &str) -> bool {
        source[self.property.clone()].starts_with("--")
    }
}

/// The property of a `(property:` prefix, and the value start once its colon exists.
/// Editors use it for incomplete declarations; it never makes a class complete.
pub fn native_declaration_prefix(source: &str) -> Option<(Range<usize>, Option<usize>)> {
    let rest = source.strip_prefix('(')?;
    if !starts_identifier(rest) {
        return None;
    }
    let mut cursor = 1;
    let property = name(source, &mut cursor);
    if property == "--" {
        return None;
    }
    let colon = source[cursor..].starts_with(':').then_some(cursor + 1);
    Some((1..cursor, colon))
}

/// Parses a class that starts with `(` as exactly one native declaration. Other
/// classes return `None`; a malformed declaration never becomes another head.
pub fn parse_native_declaration(
    source: &str,
) -> Option<Result<NativeDeclarationHead, &'static str>> {
    source.starts_with('(').then(|| declaration(source))
}

fn declaration(source: &str) -> Result<NativeDeclarationHead, &'static str> {
    let (property, colon) = native_declaration_prefix(source)
        .ok_or("Native declarations start with a CSS property, for example (display:block)")?;
    let start = colon.ok_or("Native declarations require a colon after the property")?;
    let custom = source[property.clone()].starts_with("--");
    let scan = scan_value(source, start, custom)?;
    let close = scan.close;
    let (value_end, important) = match scan.important {
        Some(bang) => (
            bang - source[start..bang]
                .bytes()
                .rev()
                .take_while(|byte| *byte == b'|' || byte.is_ascii_whitespace())
                .count(),
            true,
        ),
        None => (close, false),
    };
    if !custom && scan.significant == 0 {
        return Err("Native declarations require a value; only custom properties may be empty");
    }
    let suffix_start = close + 1;
    if source[suffix_start..]
        .chars()
        .next()
        .is_some_and(|character| !is_class_suffix_start(character))
    {
        return Err(
            "A native declaration head contains one declaration; selectors and conditions follow it",
        );
    }
    Ok(NativeDeclarationHead {
        property,
        value: start..value_end,
        body: start..close,
        important,
        suffix_start,
    })
}

struct ValueScan {
    close: usize,
    /// The `!` of a trailing native `!important`.
    important: Option<usize>,
    /// Top-level component values before any trailing `!important`.
    significant: usize,
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum Item {
    Bang(usize),
    Important,
    Other,
}

fn scan_value(source: &str, start: usize, custom: bool) -> Result<ValueScan, &'static str> {
    let mut stack: Vec<char> = Vec::new();
    let mut items: Vec<Item> = Vec::new();
    let mut cursor = start;
    while let Some(character) = source[cursor..].chars().next() {
        let top = stack.is_empty();
        let at = cursor;
        match character {
            '"' | '\'' => {
                cursor = skip_string(source, cursor)?;
                if top {
                    items.push(Item::Other);
                }
                continue;
            }
            '/' if source[cursor..].starts_with("/*") => {
                cursor = source[cursor + 2..]
                    .find("*/")
                    .map(|offset| cursor + 2 + offset + 2)
                    .ok_or("Unclosed comment in a native declaration")?;
                continue;
            }
            '\\' if !starts_identifier(&source[cursor..]) => {
                return Err("Invalid escape in a native declaration");
            }
            _ if starts_identifier(&source[cursor..]) => {
                let ident = name(source, &mut cursor);
                if source[cursor..].starts_with('(') {
                    cursor += 1;
                    if ident.eq_ignore_ascii_case("url")
                        && !source[cursor..].starts_with(['"', '\''])
                    {
                        cursor = skip_url(source, cursor)?;
                    } else {
                        stack.push(')');
                    }
                    if top {
                        items.push(Item::Other);
                    }
                } else if top {
                    items.push(if ident.eq_ignore_ascii_case("important") {
                        Item::Important
                    } else {
                        Item::Other
                    });
                }
                continue;
            }
            '(' => stack.push(')'),
            '[' => stack.push(']'),
            '{' if top && !custom => {
                return Err("Blocks belong only in custom property values");
            }
            '{' => stack.push('}'),
            ')' if top => {
                return Ok(finish(cursor, &items));
            }
            ')' | ']' | '}' => {
                if stack.pop() != Some(character) {
                    return Err("Mismatched closing bracket in a native declaration");
                }
            }
            ';' if top => {
                return Err("A native declaration head contains exactly one declaration");
            }
            '!' if top => items.push(Item::Bang(at)),
            '|' => {}
            _ if character.is_ascii_whitespace() => {}
            _ if top => items.push(Item::Other),
            _ => {}
        }
        cursor += character.len_utf8();
    }
    Err("Unclosed native declaration")
}

fn finish(close: usize, items: &[Item]) -> ValueScan {
    let important = match items {
        [.., Item::Bang(bang), Item::Important] => Some(*bang),
        _ => None,
    };
    ValueScan {
        close,
        important,
        significant: items.len() - if important.is_some() { 2 } else { 0 },
    }
}

fn skip_string(source: &str, start: usize) -> Result<usize, &'static str> {
    let quote = source.as_bytes()[start];
    let mut cursor = start + 1;
    while let Some(character) = source[cursor..].chars().next() {
        match character {
            '\\' => {
                cursor += 1;
                let next = source[cursor..]
                    .chars()
                    .next()
                    .ok_or("Unclosed string in a native declaration")?;
                cursor += next.len_utf8();
            }
            '\n' | '\r' | '\x0c' => return Err("Invalid string in a native declaration"),
            _ if character as u32 == u32::from(quote) => return Ok(cursor + 1),
            _ => cursor += character.len_utf8(),
        }
    }
    Err("Unclosed string in a native declaration")
}

/// An unquoted `url(` token is opaque: brackets, braces, slashes and pipes are URL text.
fn skip_url(source: &str, start: usize) -> Result<usize, &'static str> {
    let mut cursor = start;
    while let Some(character) = source[cursor..].chars().next() {
        match character {
            ')' => return Ok(cursor + 1),
            '\\' if starts_identifier(&source[cursor..]) => {
                cursor += 1;
                cursor += source[cursor..].chars().next().map_or(0, char::len_utf8);
            }
            '"' | '\'' | '(' | '\\' => return Err("Invalid url() in a native declaration"),
            _ if character.is_whitespace() || character.is_control() => {
                return Err("Invalid url() in a native declaration");
            }
            _ => cursor += character.len_utf8(),
        }
    }
    Err("Unclosed url() in a native declaration")
}

/// Decodes Master's `|` value spaces outside strings, comments, escapes and URL tokens.
pub fn decode_native_value(value: &str) -> String {
    let mut output = String::with_capacity(value.len());
    let mut cursor = 0;
    while let Some(character) = value[cursor..].chars().next() {
        let start = cursor;
        match character {
            '"' | '\'' => cursor = skip_string(value, cursor).unwrap_or(value.len()),
            '/' if value[cursor..].starts_with("/*") => {
                cursor = value[cursor + 2..]
                    .find("*/")
                    .map_or(value.len(), |offset| cursor + 2 + offset + 2);
            }
            _ if starts_identifier(&value[cursor..]) => {
                let ident = name(value, &mut cursor);
                if ident.eq_ignore_ascii_case("url")
                    && value[cursor..].starts_with('(')
                    && !value[cursor + 1..].starts_with(['"', '\''])
                {
                    cursor = skip_url(value, cursor + 1).unwrap_or(value.len());
                }
            }
            '|' => {
                output.push(' ');
                cursor += 1;
                continue;
            }
            _ => cursor += character.len_utf8(),
        }
        output.push_str(&value[start..cursor]);
    }
    output
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parts(source: &str) -> (&str, &str, bool, &str) {
        let head = parse_native_declaration(source).unwrap().unwrap();
        (
            &source[head.property.clone()],
            &source[head.value.clone()],
            head.important,
            &source[head.suffix_start..],
        )
    }

    #[test]
    fn separates_values_from_suffixes_structurally() {
        for (source, expected) in [
            (
                "(flex:1|1|auto):hover",
                ("flex", "1|1|auto", false, ":hover"),
            ),
            (
                "(display:block):hover",
                ("display", "block", false, ":hover"),
            ),
            (
                "(display:block)[aria-expanded=true]:hover@sm",
                ("display", "block", false, "[aria-expanded=true]:hover@sm"),
            ),
            ("(color:red)::before", ("color", "red", false, "::before")),
            (
                "(color:red):has(>img)",
                ("color", "red", false, ":has(>img)"),
            ),
            (
                "(grid-template-columns:[start]|1fr|[end])",
                ("grid-template-columns", "[start]|1fr|[end]", false, ""),
            ),
            (
                "(animation-name:slide_in)",
                ("animation-name", "slide_in", false, ""),
            ),
            (
                "(content:')')::before",
                ("content", "')'", false, "::before"),
            ),
            (
                "(--payload:a:b@c_foo)",
                ("--payload", "a:b@c_foo", false, ""),
            ),
            (
                "(background-image:url(/a{b.svg))",
                ("background-image", "url(/a{b.svg)", false, ""),
            ),
            (
                "(background:url(/a]b/*c|d.png))_div",
                ("background", "url(/a]b/*c|d.png)", false, "_div"),
            ),
            ("(--x:{a;b})", ("--x", "{a;b}", false, "")),
            ("(--x:)", ("--x", "", false, "")),
            (
                "(unknown-prop:1):unknown",
                ("unknown-prop", "1", false, ":unknown"),
            ),
            ("(color:red!important)", ("color", "red", true, "")),
            ("(color:red|!|IMPORTANT)!", ("color", "red", true, "!")),
            ("(color:red!/**/\\69mportant)", ("color", "red", true, "")),
            (
                "(content:'!important')",
                ("content", "'!important'", false, ""),
            ),
            (
                "(--x:var(--y,!important))",
                ("--x", "var(--y,!important)", false, ""),
            ),
            ("(--x:!important)", ("--x", "", true, "")),
            ("(content:'\\'')", ("content", "'\\''", false, "")),
            (
                "(width:calc(1px+(2px*3)))",
                ("width", "calc(1px+(2px*3))", false, ""),
            ),
        ] {
            assert_eq!(parts(source), expected, "{source}");
        }
    }

    #[test]
    fn rejects_malformed_declarations_without_another_head() {
        for source in [
            "(display:block",
            "(display:block;)",
            "(display:block;color:red)",
            "(color:red)(display:block)",
            "(color:red)hover",
            "(display)",
            "(:block)",
            "(--:block)",
            "(width:)",
            "(width:|)",
            "(width:/**/)",
            "(width:!important)",
            "(color:{red})",
            "(width:calc(1px])",
            "(content:'a)",
            "(content:'a\nb')",
            "(width:1px/*)",
            "(background:url(a(b))",
            "(background:url(a'b))",
            "(width:1px\\",
            "(a:b])",
        ] {
            assert!(
                parse_native_declaration(source).unwrap().is_err(),
                "{source}"
            );
        }
        assert!(parse_native_declaration("flex:hover").is_none());
        assert!(parse_native_declaration("display:block").is_none());
    }

    #[test]
    fn decodes_value_spaces_outside_protected_text() {
        assert_eq!(decode_native_value("1|1|auto"), "1 1 auto");
        assert_eq!(
            decode_native_value(r#"a|"b|c"|d\|e/*|*/|url(x|y)|url('p|q')"#),
            r#"a "b|c" d\|e/*|*/ url(x|y) url('p|q')"#
        );
    }

    #[test]
    fn reports_incomplete_prefixes_for_editors() {
        assert_eq!(native_declaration_prefix("(disp"), Some((1..5, None)));
        assert_eq!(
            native_declaration_prefix("(display:bl"),
            Some((1..8, Some(9)))
        );
        assert_eq!(native_declaration_prefix("display:block"), None);
        assert_eq!(native_declaration_prefix("(--"), None);
    }
}
