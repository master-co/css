//! Native query boundaries. CSS grammar/support validation belongs to tooling;
//! this lexer only decodes Master whitespace outside strings and escapes.

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NativeQuery {
    pub kind: String,
    pub prelude: String,
}

pub fn decode_native_content(source: &str) -> Option<String> {
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
        result.push(if character == '|' { ' ' } else { character });
    }
    (stack.is_empty() && quote.is_none() && !escaped && !comment).then_some(result)
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
    // A declaration/range at the outer level is the removed RC shorthand.
    // Preserve CSS's own grouping instead of inferring parentheses around it.
    let mut depth = 0_u32;
    for token in crate::tokenize_css_syntax(&prelude) {
        match token.kind {
            crate::CssSyntaxKind::Function(_) | crate::CssSyntaxKind::Delim('(' | '[') => {
                depth += 1
            }
            crate::CssSyntaxKind::Delim(')' | ']') => depth = depth.saturating_sub(1),
            crate::CssSyntaxKind::Delim(':' | '<' | '>' | '=') if depth == 0 => return None,
            _ => {}
        }
    }
    Some(NativeQuery {
        kind: kind.into(),
        prelude,
    })
}

/// Stable spelling for ordering only; emission retains the authored CSS prelude.
pub fn canonical_native_content(source: &str) -> String {
    let mut result = String::new();
    let mut quote = None;
    let mut escaped = false;
    let mut characters = source.chars().peekable();
    while let Some(character) = characters.next() {
        if escaped {
            result.push(character);
            escaped = false;
            continue;
        }
        if character == '\\' {
            escaped = true;
        } else if let Some(delimiter) = quote {
            if delimiter == character {
                quote = None;
            }
        } else if matches!(character, '\'' | '"') {
            quote = Some(character);
        } else if character.is_whitespace() {
            while characters.peek().is_some_and(|c| c.is_whitespace()) {
                characters.next();
            }
            let word = |c: char| c.is_alphanumeric() || matches!(c, '-' | '_');
            if result.chars().last().is_some_and(word)
                && characters.peek().copied().is_some_and(word)
            {
                result.push(' ');
            }
            continue;
        }
        result.push(character);
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn native_boundaries_preserve_css_and_decode_only_master_whitespace() {
        for (source, expected) in [
            ("media((width>=800px))", "(width>=800px)"),
            (
                "media(screen|and|(aspect-ratio>=1.5))",
                "screen and (aspect-ratio>=1.5)",
            ),
            (
                "supports(selector(:has([data-x='a|b'])))",
                "selector(:has([data-x='a|b']))",
            ),
            ("container(card|(width>=40rem))", "card (width>=40rem)"),
            (
                "container(style(--density:compact))",
                "style(--density:compact)",
            ),
            (r"supports(selector(.a\|b))", r"selector(.a\|b)"),
            (
                "media(screen/*:>=|*/|and|(width>1px))",
                "screen/*:>=|*/ and (width>1px)",
            ),
        ] {
            assert_eq!(parse_native_query(source).unwrap().prelude, expected);
        }
        for source in [
            ">=800",
            "media((width>=800px)",
            "media(foo)(bar)",
            "media('bad)",
            "supports((a:b);x)",
            "media(width>=800px)",
            "supports(display:grid)",
            "media(/*bad)",
        ] {
            assert!(parse_native_query(source).is_none(), "{source}");
        }
    }
}
