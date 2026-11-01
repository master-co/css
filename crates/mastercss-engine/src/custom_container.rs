//! Custom container conditions substitute query text. Container conditions
//! accept `not`, `and` and `or` at any depth and have no media types, so every
//! expansion fits one prelude and never branches like custom media does.
use mastercss_lexer::concat_text;
use mastercss_lexer::{CssSyntaxKind as Kind, CssSyntaxToken, tokenize_css_syntax};

/// Replaces each `(--name)` group of a container prelude with the condition
/// `resolve` returns, keeping an optional leading container name. A reference
/// that is the whole condition takes the condition as is; any other reference
/// takes it as one parenthesized group.
pub fn expand_custom_container_query(
    source: &str,
    resolve: &mut dyn FnMut(&str) -> Result<String, String>,
) -> Result<String, String> {
    let tokens = tokenize_css_syntax(source);
    let start = usize::from(container_name(&tokens));
    let whole = tokens.len() == start + 3 && reference(&tokens, start).is_some();
    let mut result = String::with_capacity(source.len());
    let mut copied = 0;
    let mut index = 0;
    while index < tokens.len() {
        let Some(name) = reference(&tokens, index) else {
            index += 1;
            continue;
        };
        let condition = resolve(name)?;
        result.push_str(&source[copied..tokens[index].bytes.start]);
        if whole || group(&condition) {
            result.push_str(&condition);
        } else {
            result.push_str(&concat_text!("(", condition, ")"));
        }
        copied = tokens[index + 2].bytes.end;
        index += 3;
    }
    result.push_str(&source[copied..]);
    Ok(result)
}

/// The names a container prelude references, in source order.
pub fn custom_container_references(source: &str) -> Vec<String> {
    let tokens = tokenize_css_syntax(source);
    (0..tokens.len())
        .filter_map(|index| reference(&tokens, index).map(str::to_owned))
        .collect()
}

/// Whether a prelude starts with a container name rather than its condition.
pub fn container_name(tokens: &[CssSyntaxToken<'_>]) -> bool {
    matches!(tokens.first().map(|token| &token.kind), Some(Kind::Ident(name)) if !name.eq_ignore_ascii_case("not"))
}

fn reference<'a>(tokens: &'a [CssSyntaxToken<'_>], index: usize) -> Option<&'a str> {
    let open = tokens.get(index)?;
    if open.kind != Kind::Delim('(') || open.close != Some(index + 2) {
        return None;
    }
    match &tokens[index + 1].kind {
        Kind::Ident(name) if name.starts_with("--") && name.len() > 2 => Some(name),
        _ => None,
    }
}

/// Whether a condition is a single parenthesized group or function.
fn group(condition: &str) -> bool {
    let tokens = tokenize_css_syntax(condition);
    tokens.first().is_some_and(|first| {
        matches!(first.kind, Kind::Delim('(') | Kind::Function(_))
            && first.close == Some(tokens.len() - 1)
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn expand(source: &str) -> Result<String, String> {
        expand_custom_container_query(source, &mut |name| match name {
            "--md" => Ok("(width >= 28rem)".into()),
            "--both" => Ok("(width >= 28rem) and style(--density: compact)".into()),
            _ => Err(concat_text!("Undefined custom container ", name)),
        })
    }

    #[test]
    fn substitutes_references() {
        assert_eq!(expand("(--md)").unwrap(), "(width >= 28rem)");
        assert_eq!(expand("card (--md)").unwrap(), "card (width >= 28rem)");
        assert_eq!(expand("not (--md)").unwrap(), "not (width >= 28rem)");
        assert_eq!(
            expand("(--both)").unwrap(),
            "(width >= 28rem) and style(--density: compact)"
        );
        assert_eq!(
            expand("card (--both)").unwrap(),
            "card (width >= 28rem) and style(--density: compact)"
        );
        assert_eq!(
            expand("not (--both)").unwrap(),
            "not ((width >= 28rem) and style(--density: compact))"
        );
        assert_eq!(
            expand("(--md) or ((--both))").unwrap(),
            "(width >= 28rem) or (((width >= 28rem) and style(--density: compact)))"
        );
    }

    #[test]
    fn leaves_other_dashed_names() {
        assert_eq!(expand("--card style(--md)").unwrap(), "--card style(--md)");
        assert_eq!(expand("(width >= 1px)").unwrap(), "(width >= 1px)");
        assert_eq!(
            expand("(--x)").unwrap_err(),
            "Undefined custom container --x"
        );
        assert_eq!(
            custom_container_references("card (--md) and ((--x))"),
            ["--md", "--x"]
        );
    }
}
