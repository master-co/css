//! Native query boundaries. CSS grammar/support validation belongs to tooling;
//! this lexer only decodes Master whitespace outside strings and escapes.

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NativeQuery {
    pub kind: String,
    pub prelude: String,
}

pub fn native_content(source: &str) -> Option<String> {
    content(source, false)
}

pub fn decode_native_content(source: &str) -> Option<String> {
    content(source, true)
}

fn content(source: &str, decode: bool) -> Option<String> {
    let mut result = String::with_capacity(source.len());
    let mut stack = Vec::new();
    let mut quote = None;
    let mut escaped = false;
    let mut comment = false;
    let mut characters = source.chars().peekable();
    while let Some(character) = characters.next() {
        if comment {
            result.push(character);
            if character == '*' && characters.peek() == Some(&'/') {
                result.push(characters.next()?);
                comment = false;
            }
            continue;
        }
        if escaped {
            result.push(character);
            escaped = false;
            continue;
        }
        if character == '\\' {
            result.push(character);
            escaped = true;
            continue;
        }
        if let Some(delimiter) = quote {
            result.push(character);
            if delimiter == character {
                quote = None;
            }
            continue;
        }
        if character == '/' && characters.peek() == Some(&'*') {
            result.push(character);
            result.push(characters.next()?);
            comment = true;
            continue;
        }
        match character {
            '\'' | '"' => quote = Some(character),
            '(' | '[' => stack.push(character),
            ')' if stack.pop() != Some('(') => return None,
            ']' if stack.pop() != Some('[') => return None,
            '{' | '}' | ';' if stack.is_empty() => return None,
            _ => {}
        }
        result.push(if decode && character == '|' {
            ' '
        } else {
            character
        });
    }
    (stack.is_empty() && quote.is_none() && !escaped && !comment).then_some(result)
}

/// Native preludes keep their token spelling, while rejecting definite top-level
/// feature operators (which require a parenthesized feature).
pub fn native_query_structure(source: &str) -> bool {
    use crate::CssSyntaxKind as Kind;
    if source.trim().is_empty() || native_content(source).is_none() {
        return false;
    }
    let tokens = crate::tokenize_css_syntax(source);
    let mut index = 0;
    while index < tokens.len() {
        let token = &tokens[index];
        if matches!(
            token.kind,
            Kind::Delim('>' | '<' | '=' | ':' | ';' | '{' | '}')
        ) {
            return false;
        }
        index = token.close.map_or(index + 1, |close| close + 1);
    }
    true
}

pub fn parse_native_query(token: &str) -> Option<NativeQuery> {
    let (kind, body) = token.split_once('(')?;
    if !matches!(kind, "media" | "supports" | "container") {
        return None;
    }
    let prelude = decode_native_content(body.strip_suffix(')')?)?;
    if prelude.trim().is_empty() {
        return None;
    }
    if !simple_query(kind, &prelude) {
        return None;
    }
    Some(NativeQuery {
        kind: kind.into(),
        prelude,
    })
}

/// A balanced recognized query which exceeds the class grammar needs CSS.
pub fn query_requires_css(token: &str) -> bool {
    let Some((kind, body)) = token.split_once('(') else {
        return false;
    };
    if !matches!(kind, "media" | "supports" | "container") {
        return false;
    }
    body.strip_suffix(')')
        .and_then(decode_native_content)
        .is_some_and(|prelude| !simple_query(kind, &prelude))
}

fn simple_query(kind: &str, prelude: &str) -> bool {
    use crate::CssSyntaxKind as Kind;
    let tokens = crate::tokenize_css_syntax(prelude);
    if tokens.is_empty() {
        return false;
    }
    let keyword = |name: &str| {
        ["and", "or", "not", "only"]
            .iter()
            .any(|item| name.eq_ignore_ascii_case(item))
    };
    if kind == "media" && tokens.len() == 1 {
        return matches!(&tokens[0].kind, Kind::Ident(name) if !keyword(name));
    }
    let start = usize::from(
        kind == "container" && matches!(&tokens[0].kind, Kind::Ident(name) if !keyword(name)),
    );
    let Some(group) = tokens.get(start) else {
        return false;
    };
    let style = kind == "container"
        && matches!(&group.kind, Kind::Function(name) if name.eq_ignore_ascii_case("style"));
    if (!style && !matches!(group.kind, Kind::Delim('('))) || group.close != Some(tokens.len() - 1)
    {
        return false;
    }
    let inner = &tokens[start + 1..tokens.len() - 1];
    let Some(first) = inner.first() else {
        return false;
    };
    let ident = matches!(&first.kind, Kind::Ident(name) if !keyword(name) && (!style || name.starts_with("--")));
    if style || kind == "supports" {
        return ident
            && ((style && inner.len() == 1)
                || (inner.len() > 2
                    && matches!(inner[1].kind, Kind::Delim(':'))
                    && simple_value(&tokens, start + 3, tokens.len() - 1)));
    }
    if ident && inner.len() == 1 {
        return true;
    }
    if ident && inner.len() > 2 && matches!(inner[1].kind, Kind::Delim(':')) {
        return simple_value(&tokens, start + 3, tokens.len() - 1);
    }
    // Feature ranges permit one or two comparisons. Each operand is a single
    // CSS token/function, or a numeric ratio, never a nested query condition.
    let mut operands = Vec::new();
    let mut comparisons = Vec::new();
    let mut index = start + 1;
    let end = tokens.len() - 1;
    while index < end {
        let token = &tokens[index];
        let is_name = matches!(&token.kind, Kind::Ident(name) if !keyword(name));
        if !(is_name
            || matches!(
                token.kind,
                Kind::Number(_) | Kind::Dimension(..) | Kind::Percentage(_) | Kind::Function(_)
            ))
        {
            return false;
        }
        operands.push(is_name);
        index = token.close.map_or(index + 1, |close| close + 1);
        if index + 1 < end
            && matches!(tokens[index].kind, Kind::Delim('/'))
            && matches!(tokens[index + 1].kind, Kind::Number(_))
        {
            index += 2;
        }
        if index == end {
            break;
        }
        let Kind::Delim(operator @ ('<' | '>' | '=')) = tokens[index].kind else {
            return false;
        };
        index += 1;
        if operator != '=' && index < end && matches!(tokens[index].kind, Kind::Delim('=')) {
            index += 1;
        }
        comparisons.push(operator);
        if index == end {
            return false;
        }
    }
    match comparisons.as_slice() {
        [_] => operands.len() == 2 && operands.iter().filter(|name| **name).count() == 1,
        [a, b] => a == b && *a != '=' && operands == [false, true, false],
        _ => false,
    }
}

fn simple_value(tokens: &[crate::CssSyntaxToken<'_>], mut index: usize, end: usize) -> bool {
    use crate::CssSyntaxKind as Kind;
    while index < end {
        let token = &tokens[index];
        if matches!(token.kind, Kind::Delim('|' | ';' | '{' | '}')) {
            return false;
        }
        if let Some(close) = token.close {
            // Functions belong to the value grammar; bare groups introduce
            // query conditions and therefore belong in CSS.
            if !matches!(token.kind, Kind::Function(_)) {
                return false;
            }
            index = close + 1;
        } else {
            index += 1;
        }
    }
    true
}

/// Conservative fallback ordering. Whitespace can be a selector combinator or
/// separate CSS tokens, so never erase it to manufacture semantic equivalence.
pub fn canonical_native_content(source: &str) -> String {
    source.trim().to_owned()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn simple_queries_preserve_native_values() {
        for source in [
            "media(print)",
            "media((hover))",
            "media((orientation:landscape))",
            "media((40rem<=width<64rem))",
            "media((resolution>=2x))",
            "media((future-feature:calc(1px+2px)))",
            "supports((display:grid))",
            "container(card|(width>=40rem))",
            "container(style(--density:compact))",
            "container(card|style(--density))",
        ] {
            assert!(parse_native_query(source).is_some(), "{source}");
        }
        assert_eq!(
            parse_native_query("container(card|(width>=40rem))")
                .unwrap()
                .prelude,
            "card (width>=40rem)"
        );
    }

    #[test]
    fn complex_queries_require_css() {
        for source in [
            "media(screen|and|(width>=50rem))",
            "media(not|(hover))",
            "media(print,screen)",
            "supports(selector([lang|=en]))",
            "container(style((--a:b)|or|(--c:d)))",
            "media('(width>=50rem)')",
            "media(width>=800px)",
            "supports(display:grid)",
        ] {
            assert!(query_requires_css(source), "{source}");
            assert!(parse_native_query(source).is_none(), "{source}");
        }
    }

    #[test]
    fn encoding_and_native_content_are_separate() {
        let css = r#"selector([lang|=en][data-x="a|b"] .a\|b/*|*/)"#;
        assert_eq!(native_content(css).as_deref(), Some(css));
        assert_eq!(
            decode_native_content(r#"a|"b|c"|d\|e/*|*/"#).as_deref(),
            Some(r#"a "b|c" d\|e/*|*/"#)
        );
        assert_ne!(
            canonical_native_content(".a .b"),
            canonical_native_content(".a.b")
        );
    }
}
