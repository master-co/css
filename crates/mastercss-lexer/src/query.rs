//! Native query boundaries. CSS grammar/support validation belongs to tooling;
//! this lexer only decodes Master spaces (`_`, and the deprecated `|`) outside strings,
//! comments, escapes, URL tokens and `--name`s.

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NativeQuery {
    pub kind: String,
    pub prelude: String,
}

pub fn native_content(source: &str) -> Option<String> {
    content(source)
}

pub fn decode_native_content(source: &str) -> Option<String> {
    native_content(source)
        .map(|content| crate::spaces::decode(&content, crate::spaces::DashedNames::All))
}

fn content(source: &str) -> Option<String> {
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
            '(' | '[' => {
                stack.push(character);
                if stack.len() > crate::MAX_CLASS_NESTING {
                    return None;
                }
            }
            ')' if stack.pop() != Some('(') => return None,
            ']' if stack.pop() != Some('[') => return None,
            '{' | '}' | ';' if stack.is_empty() => return None,
            _ => {}
        }
        result.push(character);
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

/// A class query names one condition without the native group parentheses: `media(width>=50rem)`,
/// `media(print)`, `supports(display:grid)`, `container(card_width>=40rem)`. The prelude is the
/// native query the engine emits, with those parentheses restored.
pub fn parse_native_query(token: &str) -> Option<NativeQuery> {
    let (kind, body) = query_parts(token)?;
    let prelude = decode_native_content(body)?;
    Some(NativeQuery {
        prelude: native_prelude(kind, &prelude)?,
        kind: kind.into(),
    })
}

/// A balanced recognized query which exceeds the class grammar needs CSS.
pub fn query_requires_css(token: &str) -> bool {
    query_parts(token)
        .and_then(|(kind, body)| Some((kind, decode_native_content(body)?)))
        .is_some_and(|(kind, prelude)| {
            native_prelude(kind, &prelude).is_none() && legacy_query(token).is_none()
        })
}

/// The class form of a query written with its native group parentheses, such as
/// `media((width>=50rem))` → `media(width>=50rem)`. Only these single wrapped
/// conditions qualify; compound queries still belong in CSS.
pub fn legacy_query(token: &str) -> Option<String> {
    let (kind, body) = query_parts(token)?;
    let open = body.find('(')?;
    if !(open == 0 || body[..open].ends_with(['_', '|'])) || !body.ends_with(')') {
        return None;
    }
    let mut depth = 0_usize;
    for (index, character) in body[open..].char_indices() {
        match character {
            '(' => depth += 1,
            ')' => {
                depth -= 1;
                if depth == 0 && open + index != body.len() - 1 {
                    return None;
                }
            }
            _ => {}
        }
    }
    let candidate = format!(
        "{kind}({}{})",
        &body[..open],
        &body[open + 1..body.len() - 1]
    );
    parse_native_query(&candidate).map(|_| candidate)
}

fn query_parts(token: &str) -> Option<(&str, &str)> {
    let (kind, body) = token.split_once('(')?;
    matches!(kind, "media" | "supports" | "container")
        .then_some(())
        .and(body.strip_suffix(')'))
        .filter(|body| !body.trim().is_empty())
        .map(|body| (kind, body))
}

/// Media Queries Level 4 media types, including the deprecated ones that match nothing.
const MEDIA_TYPES: [&str; 11] = [
    "all",
    "print",
    "screen",
    "tty",
    "tv",
    "projection",
    "handheld",
    "braille",
    "embossed",
    "aural",
    "speech",
];

fn native_prelude(kind: &str, prelude: &str) -> Option<String> {
    use crate::CssSyntaxKind as Kind;
    let tokens = crate::tokenize_css_syntax(prelude);
    let name = |token: Option<&crate::CssSyntaxToken<'_>>| matches!(token.map(|token| &token.kind), Some(Kind::Ident(name)) if !query_keyword(name));
    match tokens.first().map(|token| &token.kind) {
        None => return None,
        Some(Kind::Ident(first)) if query_keyword(first) => return None,
        _ => {}
    }
    let start = usize::from(
        kind == "container"
            && name(tokens.first())
            && tokens
                .get(1)
                .is_some_and(|token| !matches!(token.kind, Kind::Delim(_))),
    );
    let condition = prelude[tokens[start].bytes.start..].trim();
    let container_name = prelude[..tokens[start].bytes.start].trim();
    let wrap = |condition: String| {
        if container_name.is_empty() {
            condition
        } else {
            format!("{container_name} {condition}")
        }
    };
    if kind == "container"
        && let Kind::Function(function) = &tokens[start].kind
        && function.eq_ignore_ascii_case("style")
    {
        let inner = &tokens[start + 1..tokens.len() - 1];
        let simple = tokens[start].close == Some(tokens.len() - 1)
            && matches!(inner.first().map(|token| &token.kind), Some(Kind::Ident(name)) if name.starts_with("--"))
            && (inner.len() == 1
                || (inner.len() > 2
                    && matches!(inner[1].kind, Kind::Delim(':'))
                    && simple_value(&tokens, start + 3, tokens.len() - 1)));
        return simple.then(|| wrap(condition.into()));
    }
    if kind == "media" && tokens.len() == 1 {
        let Kind::Ident(media) = &tokens[0].kind else {
            return None;
        };
        return Some(
            if MEDIA_TYPES
                .iter()
                .any(|item| media.eq_ignore_ascii_case(item))
            {
                condition.into()
            } else {
                format!("({condition})")
            },
        );
    }
    simple_condition(kind, &tokens, start).then(|| wrap(format!("({condition})")))
}

fn query_keyword(name: &str) -> bool {
    ["and", "or", "not", "only"]
        .iter()
        .any(|item| name.eq_ignore_ascii_case(item))
}

/// One feature, declaration or range from `start` to the end, without its group parentheses.
fn simple_condition(kind: &str, tokens: &[crate::CssSyntaxToken<'_>], start: usize) -> bool {
    use crate::CssSyntaxKind as Kind;
    let end = tokens.len();
    let inner = &tokens[start..];
    let Some(first) = inner.first() else {
        return false;
    };
    let ident = matches!(&first.kind, Kind::Ident(name) if !query_keyword(name));
    let declaration = ident
        && inner.len() > 2
        && matches!(inner[1].kind, Kind::Delim(':'))
        && simple_value(tokens, start + 2, end);
    if kind == "supports" {
        return declaration;
    }
    if ident && inner.len() == 1 {
        return true;
    }
    if ident && inner.len() > 2 && matches!(inner[1].kind, Kind::Delim(':')) {
        return declaration;
    }
    // Feature ranges permit one or two comparisons. Each operand is a single
    // CSS token/function, or a numeric ratio, never a nested query condition.
    let mut operands = Vec::new();
    let mut comparisons = Vec::new();
    let mut index = start;
    while index < end {
        let token = &tokens[index];
        let is_name = matches!(&token.kind, Kind::Ident(name) if !query_keyword(name));
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
    fn simple_queries_restore_their_native_group() {
        for (source, prelude) in [
            ("media(print)", "print"),
            ("media(screen)", "screen"),
            ("media(hover)", "(hover)"),
            ("media(orientation:landscape)", "(orientation:landscape)"),
            ("media(pointer:coarse)", "(pointer:coarse)"),
            ("media(width>=50rem)", "(width>=50rem)"),
            ("media(40rem<=width<64rem)", "(40rem<=width<64rem)"),
            ("media(resolution>=2x)", "(resolution>=2x)"),
            ("media(aspect-ratio>16/9)", "(aspect-ratio>16/9)"),
            (
                "media(future-feature:calc(1px+2px))",
                "(future-feature:calc(1px+2px))",
            ),
            ("supports(display:grid)", "(display:grid)"),
            ("container(width>=40rem)", "(width>=40rem)"),
            ("container(orientation:portrait)", "(orientation:portrait)"),
            ("container(card|width>=40rem)", "card (width>=40rem)"),
            ("container(card|40rem<=width)", "card (40rem<=width)"),
            (
                "container(style(--density:compact))",
                "style(--density:compact)",
            ),
            ("container(card|style(--density))", "card style(--density)"),
            ("container(card_width>=40rem)", "card (width>=40rem)"),
            ("container(card_style(--density))", "card style(--density)"),
            (
                "container(my\\_card_width>=40rem)",
                "my\\_card (width>=40rem)",
            ),
            (
                "container(style(--density_mode:compact))",
                "style(--density_mode:compact)",
            ),
        ] {
            assert_eq!(
                parse_native_query(source)
                    .map(|query| query.prelude)
                    .as_deref(),
                Some(prelude),
                "{source}"
            );
            assert!(!query_requires_css(source), "{source}");
            assert_eq!(legacy_query(source), None, "{source}");
        }
    }

    #[test]
    fn wrapped_conditions_report_their_class_form() {
        for (source, expected) in [
            ("media((width>=50rem))", "media(width>=50rem)"),
            ("media((hover))", "media(hover)"),
            ("supports((display:grid))", "supports(display:grid)"),
            ("container((width>=40rem))", "container(width>=40rem)"),
            (
                "container(card|(width>=40rem))",
                "container(card|width>=40rem)",
            ),
            (
                "container(card_(width>=40rem))",
                "container(card_width>=40rem)",
            ),
        ] {
            assert!(parse_native_query(source).is_none(), "{source}");
            assert!(!query_requires_css(source), "{source}");
            assert_eq!(legacy_query(source).as_deref(), Some(expected), "{source}");
        }
    }

    #[test]
    fn complex_queries_require_css() {
        for source in [
            "media(screen|and|width>=50rem)",
            "media(screen_and_width>=50rem)",
            "media(not_hover)",
            "media(screen|and|(width>=50rem))",
            "media(not|hover)",
            "media(print,screen)",
            "media((width>=50rem)|and|(hover))",
            "supports(selector([lang|=en]))",
            "supports(display)",
            "container(style((--a:b)|or|(--c:d)))",
            "media('(width>=50rem)')",
            "media(width>=)",
        ] {
            assert!(query_requires_css(source), "{source}");
            assert!(parse_native_query(source).is_none(), "{source}");
            assert_eq!(legacy_query(source), None, "{source}");
        }
    }

    #[test]
    fn rejects_content_nested_beyond_the_limit() {
        let nested = |depth: usize| format!("{}.a{}", "(".repeat(depth), ")".repeat(depth));
        assert!(decode_native_content(&nested(crate::MAX_CLASS_NESTING)).is_some());
        assert!(decode_native_content(&nested(crate::MAX_CLASS_NESTING + 1)).is_none());
    }

    #[test]
    fn encoding_and_native_content_are_separate() {
        let css = r#"selector([lang|=en][data-x="a|b"] .a\|b/*|*/)"#;
        assert_eq!(native_content(css).as_deref(), Some(css));
        assert_eq!(
            decode_native_content(r#"a|"b|c"|d\|e/*|*/"#).as_deref(),
            Some(r#"a "b|c" d\|e/*|*/"#)
        );
        assert_eq!(
            decode_native_content(r#"a_"b_c"_d\_e/*_*/_--x_y"#).as_deref(),
            Some(r#"a "b_c" d\_e/*_*/ --x_y"#)
        );
        assert_ne!(
            canonical_native_content(".a .b"),
            canonical_native_content(".a.b")
        );
    }
}
