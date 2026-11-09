//! Structural class heads. A class is a native declaration `(property:value)`, a
//! functional utility `name(...)` or a named utility. A declaration head ends at its
//! closing parenthesis, found with CSS component-value rules before any manifest,
//! property, selector or utility lookup.
use crate::css_syntax::{name, starts_identifier};
use std::ops::Range;

/// The characters that may begin a class suffix after a complete head: importance,
/// selector combinators, pseudo-classes, attributes, ids, `_` descendants and conditions.
pub fn is_class_suffix_start(character: char) -> bool {
    matches!(
        character,
        '!' | '*' | '>' | '+' | '~' | ':' | '[' | '@' | '_' | '.' | '#'
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
    /// Whether the decoded property is a custom property, so `\\2d\\2dx` is `--x`.
    pub fn custom_property(&self, source: &str) -> bool {
        let mut cursor = self.property.start;
        name(source, &mut cursor).starts_with("--")
    }
}

/// The property of a `(property:` prefix, and the value start once its colon exists.
/// Editors use it for incomplete declarations; it never makes a class complete.
pub fn native_declaration_prefix(source: &str) -> Option<(Range<usize>, Option<usize>)> {
    declaration_prefix(source).map(|(property, colon, _)| (property, colon))
}

/// The prefix with whether its decoded property is a custom property.
fn declaration_prefix(source: &str) -> Option<(Range<usize>, Option<usize>, bool)> {
    let rest = source.strip_prefix('(')?;
    if !starts_identifier(rest) {
        return None;
    }
    let mut cursor = 1;
    let property = name(source, &mut cursor);
    if property == "--" {
        return None;
    }
    let custom = property.starts_with("--");
    let colon = source[cursor..].starts_with(':').then_some(cursor + 1);
    Some((1..cursor, colon, custom))
}

/// Parses a class that starts with `(` as exactly one native declaration. Other
/// classes return `None`; a malformed declaration never becomes another head.
pub fn parse_native_declaration(
    source: &str,
) -> Option<Result<NativeDeclarationHead, &'static str>> {
    source.starts_with('(').then(|| declaration(source))
}

fn declaration(source: &str) -> Result<NativeDeclarationHead, &'static str> {
    let (property, colon, custom) = declaration_prefix(source)
        .ok_or("Native declarations start with a CSS property, for example (display:block)")?;
    let start = colon.ok_or("Native declarations require a colon after the property")?;
    let scan = scan_value(source, start, custom)?;
    let close = scan.close;
    let (value_end, important) = match scan.important {
        Some(value_end) => (value_end.max(start), true),
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
    /// The value end before a trailing native `!important`: the end of the last
    /// component before its `!`, so separators and escapes stay where they belong.
    important: Option<usize>,
    /// Top-level component values before any trailing `!important`.
    significant: usize,
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum Item {
    /// A top-level `!` and the end of the last component before it.
    Bang(usize),
    Important,
    Other,
}

fn scan_value(source: &str, start: usize, custom: bool) -> Result<ValueScan, &'static str> {
    let mut stack: Vec<char> = Vec::new();
    let mut items: Vec<Item> = Vec::new();
    // The end of the last component, so a trailing `!important` never trims into an
    // escape such as `\|`.
    let mut component_end = start;
    let mut cursor = start;
    while let Some(character) = source[cursor..].chars().next() {
        let top = stack.is_empty();
        match character {
            '"' | '\'' => {
                cursor = skip_string(source, cursor)?;
                component_end = cursor;
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
                component_end = cursor;
                continue;
            }
            '\\' if !starts_identifier(&source[cursor..]) => {
                return Err("Invalid escape in a native declaration");
            }
            _ if starts_identifier(&source[cursor..]) => {
                let ident_start = cursor;
                let ident = name(source, &mut cursor);
                let raw = &source[ident_start..cursor];
                // A lone `_` is an encoded space, like `|` and whitespace.
                if raw == "_" {
                    continue;
                }
                if source[cursor..].starts_with('(') {
                    cursor += 1;
                    if ident.eq_ignore_ascii_case("url")
                        && !source[cursor..].starts_with(['"', '\''])
                    {
                        cursor = skip_url(source, cursor)?;
                    } else {
                        stack.push(')');
                        if stack.len() > crate::MAX_CLASS_NESTING {
                            return Err("Native declaration nesting is too deep");
                        }
                    }
                    if top {
                        items.push(Item::Other);
                    }
                } else if top {
                    // `red_!_important` spells the spaces around `!` as `_`.
                    let word = if crate::spaces::single_underscore(source, ident_start) {
                        &ident[1..]
                    } else {
                        ident.as_ref()
                    };
                    items.push(if word.eq_ignore_ascii_case("important") {
                        Item::Important
                    } else {
                        Item::Other
                    });
                }
                // An encoded space never ends a component: `red_!important` is `red`.
                component_end = if crate::spaces::single_underscore(source, cursor - 1) {
                    cursor - 1
                } else {
                    cursor
                };
                continue;
            }
            // A block is a component of its own: `a!important{}` is not important.
            '(' | '[' | '{' => {
                if character == '{' && top && !custom {
                    return Err("Blocks belong only in custom property values");
                }
                stack.push(match character {
                    '(' => ')',
                    '[' => ']',
                    _ => '}',
                });
                if stack.len() > crate::MAX_CLASS_NESTING {
                    return Err("Native declaration nesting is too deep");
                }
                if top {
                    items.push(Item::Other);
                }
            }
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
            '!' if top => items.push(Item::Bang(component_end)),
            '|' => {
                cursor += 1;
                continue;
            }
            _ if character.is_ascii_whitespace() => {
                cursor += 1;
                continue;
            }
            _ if top => items.push(Item::Other),
            _ => {}
        }
        cursor += character.len_utf8();
        component_end = cursor;
    }
    Err("Unclosed native declaration")
}

fn finish(close: usize, items: &[Item]) -> ValueScan {
    let important = match items {
        [.., Item::Bang(value_end), Item::Important] => Some(*value_end),
        _ => None,
    };
    ValueScan {
        close,
        important,
        significant: items.len() - if important.is_some() { 2 } else { 0 },
    }
}

pub(crate) fn skip_string(source: &str, start: usize) -> Result<usize, &'static str> {
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
/// It follows the CSS URL token: only CSS whitespace before `)` and non-printable code
/// points end it badly; other Unicode, including U+00A0 and U+0085, is URL text.
pub(crate) fn skip_url(source: &str, start: usize) -> Result<usize, &'static str> {
    let mut cursor = start;
    while let Some(character) = source[cursor..].chars().next() {
        match character {
            ')' => return Ok(cursor + 1),
            '\\' if starts_identifier(&source[cursor..]) => {
                cursor += 1;
                cursor += source[cursor..].chars().next().map_or(0, char::len_utf8);
            }
            ' ' | '\t' | '\n' | '\r' | '\x0c' => {
                cursor += source[cursor..]
                    .find(|c: char| !matches!(c, ' ' | '\t' | '\n' | '\r' | '\x0c'))
                    .unwrap_or(source.len() - cursor);
                return if source[cursor..].starts_with(')') {
                    Ok(cursor + 1)
                } else {
                    Err("Invalid url() in a native declaration")
                };
            }
            '"' | '\'' | '(' | '\\' => return Err("Invalid url() in a native declaration"),
            '\0'..='\x08' | '\x0b' | '\x0e'..='\x1f' | '\x7f' => {
                return Err("Invalid url() in a native declaration");
            }
            _ => cursor += character.len_utf8(),
        }
    }
    Err("Unclosed url() in a native declaration")
}

/// Where an editor cursor sits inside a `(property:value)` head. Byte ranges index the
/// class; incomplete heads are accepted, so `(display:bl` reports its value component.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum NativeHeadCursor {
    /// In the property name: the name and its colon, when present.
    Property { range: Range<usize> },
    /// In a top-level value component, which extends past the cursor to its end.
    Value {
        property: Range<usize>,
        component: Range<usize>,
        /// Whether a top-level `)` already closes the head.
        closed: bool,
    },
    /// Inside a string, comment, URL or nested function or block.
    Protected,
}

/// Separators end a value component; everything else continues it.
fn component_character(character: char) -> bool {
    !matches!(
        character,
        '|' | ',' | '/' | '!' | ';' | ':' | '(' | ')' | '[' | ']' | '{' | '}' | '"' | '\''
    ) && !character.is_ascii_whitespace()
}

/// The cursor context of a class that starts with `(`, or `None` outside a head: in
/// another class, before the parenthesis, or after the head closes.
pub fn native_head_cursor(source: &str, cursor: usize) -> Option<NativeHeadCursor> {
    if !source.starts_with('(') || cursor == 0 || !source.is_char_boundary(cursor) {
        return None;
    }
    let mut property_end = 1;
    name(source, &mut property_end);
    let colon = source[property_end..].starts_with(':');
    if cursor <= property_end {
        return Some(NativeHeadCursor::Property {
            range: 1..property_end + usize::from(colon),
        });
    }
    if !colon {
        return None;
    }
    let mut stack = Vec::new();
    let mut component = property_end + 1;
    let mut index = component;
    while index < cursor {
        let character = source[index..].chars().next()?;
        if stack.is_empty() && character == ')' {
            return None;
        }
        if starts_identifier(&source[index..]) {
            let mut end = index;
            let ident = name(source, &mut end);
            if end >= cursor {
                // An encoded `_` space inside the name run starts the next component.
                if let Some(space) = (index..cursor)
                    .rev()
                    .find(|position| crate::spaces::single_underscore(source, *position))
                {
                    component = space + 1;
                }
                break;
            }
            if !source[end..].starts_with('(') {
                index = end;
                continue;
            }
            if ident.eq_ignore_ascii_case("url") && !source[end + 1..].starts_with(['"', '\'']) {
                index = skip_url(source, end + 1).unwrap_or(source.len());
                if index > cursor {
                    return Some(NativeHeadCursor::Protected);
                }
                component = index;
                continue;
            }
            index = end;
        }
        let next = match step(source, index, &mut stack) {
            Some(next) if next <= cursor => next,
            _ => return Some(NativeHeadCursor::Protected),
        };
        if !component_character(character) {
            component = next;
        }
        index = next;
    }
    if !stack.is_empty() {
        return Some(NativeHeadCursor::Protected);
    }
    let mut end = cursor;
    while let Some(character) = source[end..].chars().next() {
        if character == '\\' && starts_identifier(&source[end..]) {
            name(source, &mut end);
        } else if crate::spaces::single_underscore(source, end) {
            break;
        } else if component_character(character) {
            end += character.len_utf8();
        } else {
            break;
        }
    }
    let mut closed = false;
    let mut index = end;
    while let Some(character) = source[index..].chars().next() {
        if stack.is_empty() && character == ')' {
            closed = true;
            break;
        }
        if starts_identifier(&source[index..]) {
            let mut after = index;
            let ident = name(source, &mut after);
            if source[after..].starts_with('(')
                && ident.eq_ignore_ascii_case("url")
                && !source[after + 1..].starts_with(['"', '\''])
            {
                let Ok(next) = skip_url(source, after + 1) else {
                    break;
                };
                index = next;
            } else {
                index = after;
            }
            continue;
        }
        let Some(next) = step(source, index, &mut stack) else {
            break;
        };
        index = next;
    }
    Some(NativeHeadCursor::Value {
        property: 1..property_end,
        component: component..end,
        closed,
    })
}

/// Advances past one character, string, comment or escape, tracking open brackets.
fn step(source: &str, index: usize, stack: &mut Vec<char>) -> Option<usize> {
    let character = source[index..].chars().next()?;
    Some(match character {
        '"' | '\'' => skip_string(source, index).ok()?,
        '/' if source[index..].starts_with("/*") => index + 2 + source[index + 2..].find("*/")? + 2,
        '\\' => {
            let mut end = index;
            name(source, &mut end);
            end.max(index + 1)
        }
        '(' | '[' | '{' => {
            stack.push(match character {
                '(' => ')',
                '[' => ']',
                _ => '}',
            });
            index + 1
        }
        ')' | ']' | '}' => {
            if stack.pop() != Some(character) {
                return None;
            }
            index + 1
        }
        _ => index + character.len_utf8(),
    })
}

/// Decodes Master's value spaces, `_` and the deprecated `|`, outside strings,
/// comments, escapes, URL tokens and the `--name` that opens a `var()`.
pub fn decode_native_value(value: &str) -> String {
    crate::spaces::decode(value, crate::spaces::DashedNames::Variables)
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
    fn rejects_values_nested_beyond_the_limit() {
        for open in ["calc(", "(", "[", "var(--x,"] {
            let nested = |depth: usize| {
                let close = if open == "[" { "]" } else { ")" };
                format!("(width:{}1px{})", open.repeat(depth), close.repeat(depth))
            };
            assert!(
                parse_native_declaration(&nested(crate::MAX_CLASS_NESTING))
                    .unwrap()
                    .is_ok(),
                "{open}"
            );
            assert!(
                parse_native_declaration(&nested(crate::MAX_CLASS_NESTING + 1))
                    .unwrap()
                    .is_err(),
                "{open}"
            );
        }
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
            ("(color:red_!important)", ("color", "red", true, "")),
            ("(color:red_!_IMPORTANT)!", ("color", "red", true, "!")),
            (
                "(color:red!\\_important)",
                ("color", "red!\\_important", false, ""),
            ),
            (
                "(flex:1_1_auto):hover",
                ("flex", "1_1_auto", false, ":hover"),
            ),
            (
                "(font-family:foo\\_!important)",
                ("font-family", "foo\\_", true, ""),
            ),
            ("(--x:a__!important)", ("--x", "a__", true, "")),
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
            (
                "(font-family:foo\\|!important)",
                ("font-family", "foo\\|", true, ""),
            ),
            (
                "(font-family:foo\\||!important)",
                ("font-family", "foo\\|", true, ""),
            ),
            ("(--x:a!important{})", ("--x", "a!important{}", false, "")),
            ("(--x:a!{}important)", ("--x", "a!{}important", false, "")),
            ("(--x:a!important[b])", ("--x", "a!important[b]", false, "")),
            ("(--x:a!important(b))", ("--x", "a!important(b)", false, "")),
            (
                "(color:red/*keep*/!important)",
                ("color", "red/*keep*/", true, ""),
            ),
            ("(\\2d\\2dx:)", ("\\2d\\2dx", "", false, "")),
            ("(\\2d\\2dx:{a:b})", ("\\2d\\2dx", "{a:b}", false, "")),
            (
                "(background:url(/a\u{a0}b\u{2003}c\u{85}d.png))",
                (
                    "background",
                    "url(/a\u{a0}b\u{2003}c\u{85}d.png)",
                    false,
                    "",
                ),
            ),
            ("(color:red)#target", ("color", "red", false, "#target")),
            (
                "(color:red!important):hover",
                ("color", "red", true, ":hover"),
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
            "(width:_)",
            "(width:_|_)",
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
            "(background:url(a\tb))",
            "(background:url(a\u{7f}b))",
            "(background:url(a\u{1}b))",
            "(color:red)hover#x",
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
        assert_eq!(decode_native_value("1_1_auto"), "1 1 auto");
        assert_eq!(
            decode_native_value(r#"a_"b_c"_d\_e/*_*/_url(x_y)_var(--a_b)"#),
            r#"a "b_c" d\_e/*_*/ url(x_y) var(--a_b)"#
        );
        assert_eq!(
            decode_native_value(r#"a|"b|c"|d\|e/*|*/|url(x|y)|url('p|q')"#),
            r#"a "b|c" d\|e/*|*/ url(x|y) url('p|q')"#
        );
    }

    #[test]
    fn reports_cursor_contexts_for_editors() {
        use NativeHeadCursor::{Property, Protected, Value};
        let at = |source: &str| {
            let cursor = source.find('¦').unwrap();
            native_head_cursor(&source.replace('¦', ""), cursor)
        };
        assert_eq!(at("(disp¦"), Some(Property { range: 1..5 }));
        assert_eq!(at("(disp¦lay:block)"), Some(Property { range: 1..9 }));
        assert_eq!(
            at("(display:bl¦ock):hover"),
            Some(Value {
                property: 1..8,
                component: 9..14,
                closed: true
            })
        );
        assert_eq!(
            at("(display:bl¦"),
            Some(Value {
                property: 1..8,
                component: 9..11,
                closed: false
            })
        );
        assert_eq!(
            at("(flex:1|1|au¦to)"),
            Some(Value {
                property: 1..5,
                component: 10..14,
                closed: true
            })
        );
        assert_eq!(
            at("(flex:1_1_au¦to)"),
            Some(Value {
                property: 1..5,
                component: 10..14,
                closed: true
            })
        );
        assert_eq!(
            at("(border:1px_so¦"),
            Some(Value {
                property: 1..7,
                component: 12..14,
                closed: false
            })
        );
        assert_eq!(
            at("(border:1px_¦"),
            Some(Value {
                property: 1..7,
                component: 12..12,
                closed: false
            })
        );
        assert_eq!(
            at("(border:so¦lid_red)"),
            Some(Value {
                property: 1..7,
                component: 8..13,
                closed: true
            })
        );
        assert_eq!(
            at("(color:rg¦b(0|0|0))"),
            Some(Value {
                property: 1..6,
                component: 7..10,
                closed: true
            })
        );
        assert_eq!(
            at("(grid-template-columns:[a]|1f¦"),
            Some(Value {
                property: 1..22,
                component: 27..29,
                closed: false
            })
        );
        assert_eq!(at("(content:'a)b¦c'):hover"), Some(Protected));
        assert_eq!(at("(width:calc(1px+¦2px))"), Some(Protected));
        assert_eq!(at("(color:red/*no¦pe*/)"), Some(Protected));
        assert_eq!(at("(background:url(a¦b.png))"), Some(Protected));
        assert_eq!(
            at("(background:url(a.png)|re¦"),
            Some(Value {
                property: 1..11,
                component: 23..25,
                closed: false
            })
        );
        assert_eq!(at("(display:block)¦:hover"), None);
        assert_eq!(at("(display:block):ho¦ver"), None);
        assert_eq!(at("flex:ho¦ver"), None);
        assert_eq!(at("(display¦)"), Some(Property { range: 1..8 }));
        assert_eq!(at("(display)¦"), None);
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
