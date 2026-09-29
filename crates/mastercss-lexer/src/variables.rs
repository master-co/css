/// Collects syntactically active CSS custom-property references in source order.
///
/// References inside strings and comments are ignored. Nested fallback references
/// are collected independently from their containing `var()` function.
pub fn collect_css_variable_references(source: &str) -> Vec<String> {
    let tokens = crate::tokenize_css_syntax(source);
    use crate::CssSyntaxKind as Kind;
    let mut names = Vec::new();
    let mut index = 0;
    while index < tokens.len() {
        let token = &tokens[index];
        let end = token.close.unwrap_or(tokens.len());
        if matches!(&token.kind, Kind::Function(name) if name.eq_ignore_ascii_case("url")) {
            // Unquoted URL content is not a nested CSS component-value stream.
            index = (end + 1).min(tokens.len());
            continue;
        }
        if matches!(&token.kind, Kind::Function(name) if name.eq_ignore_ascii_case("var"))
            && let Some(Kind::Ident(name)) = tokens.get(index + 1).map(|token| &token.kind)
            && let Some(name) = name.strip_prefix("--").filter(|name| !name.is_empty())
            && (index + 2 == end
                || tokens
                    .get(index + 2)
                    .is_some_and(|token| token.kind == Kind::Delim(',')))
            && !names.iter().any(|existing| existing == name)
        {
            names.push(name.to_owned());
        }
        // Visit nested fallback functions too; strings/comments stay opaque.
        index += 1;
    }
    names
}

/// Replaces syntactically active CSS custom-property references.
///
/// The replacer receives the custom-property name without `--` and the complete
/// `var()` text, including any fallback. Returning `None` preserves the original
/// reference and skips replacements inside its fallback.
pub fn transform_css_variable_references<E>(
    source: &str,
    mut replacer: impl FnMut(&str, &str) -> Result<Option<String>, E>,
) -> Result<String, E> {
    use crate::{CssSyntaxKind as Kind, tokenize_css_syntax};
    let tokens = tokenize_css_syntax(source);
    let mut output = String::with_capacity(source.len());
    let mut index = 0;
    let mut copied = 0;
    while let Some(token) = tokens.get(index) {
        if let Kind::Function(function) = &token.kind
            && let Some(close) = token.close
        {
            if function.eq_ignore_ascii_case("url") {
                index = close + 1;
                continue;
            }
            if function.eq_ignore_ascii_case("var")
                && let Some(Kind::Ident(name)) = tokens.get(index + 1).map(|token| &token.kind)
                && let Some(name) = name.strip_prefix("--").filter(|name| !name.is_empty())
                && (index + 2 == close
                    || tokens
                        .get(index + 2)
                        .is_some_and(|token| token.kind == Kind::Delim(',')))
            {
                let end = tokens[close].bytes.end;
                let raw = &source[token.bytes.start..end];
                output.push_str(&source[copied..token.bytes.start]);
                output.push_str(replacer(name, raw)?.as_deref().unwrap_or(raw));
                copied = end;
                index = close + 1;
                continue;
            }
        }
        index += 1;
    }
    output.push_str(&source[copied..]);
    Ok(output)
}

pub(crate) fn skip_css_string_or_comment(source: &str, start: usize) -> Option<usize> {
    let character = source[start..].chars().next()?;
    if matches!(character, '"' | '\'') {
        let mut escaped = false;
        for (offset, next) in source[start + character.len_utf8()..].char_indices() {
            if escaped {
                escaped = false;
            } else if next == '\\' {
                escaped = true;
            } else if next == character {
                return Some(start + character.len_utf8() + offset + next.len_utf8());
            }
        }
        return Some(source.len());
    }
    if source[start..].starts_with("/*") {
        return Some(
            source[start + 2..]
                .find("*/")
                .map_or(source.len(), |offset| start + 2 + offset + 2),
        );
    }
    None
}
