/// Replace CSS nesting selectors without changing strings, attribute values or
/// escaped ampersands. Returns None when there is no nesting selector.
pub fn replace_nesting_selector(source: &str, parent: &str) -> Option<String> {
    let mut result = String::with_capacity(source.len());
    let mut quote = None;
    let mut escaped = false;
    let mut attributes = 0_u32;
    let mut replaced = false;
    for character in source.chars() {
        if escaped {
            escaped = false;
        } else if character == '\\' {
            escaped = true;
        } else if let Some(delimiter) = quote {
            if character == delimiter {
                quote = None;
            }
        } else {
            match character {
                '\'' | '"' => quote = Some(character),
                '[' => attributes += 1,
                ']' => attributes = attributes.saturating_sub(1),
                '&' if attributes == 0 => {
                    result.push_str(parent);
                    replaced = true;
                    continue;
                }
                _ => {}
            }
        }
        result.push(character);
    }
    replaced.then_some(result)
}

/// Shared compiler/manifest boundary check. CSS support is intentionally not tested.
pub fn valid_mode_selector(selector: &str) -> bool {
    use crate::CssSyntaxKind;
    let tokens = crate::tokenize_css_syntax(selector);
    if tokens.is_empty() || crate::decode_native_content(selector).is_none() {
        return false;
    }
    let mut attributes = 0_u32;
    for (index, token) in tokens.iter().enumerate() {
        match &token.kind {
            CssSyntaxKind::Function(_) | CssSyntaxKind::Delim('(' | '[')
                if token.close.is_none() =>
            {
                return false;
            }
            CssSyntaxKind::Delim('[') => attributes += 1,
            CssSyntaxKind::Delim(']') => attributes = attributes.saturating_sub(1),
            CssSyntaxKind::Delim('{' | '}' | ';' | '@') => return false,
            CssSyntaxKind::Delim(':') if attributes == 0 => {
                match tokens.get(index + 1).map(|token| &token.kind) {
                    Some(CssSyntaxKind::Delim(':')) => return false,
                    Some(CssSyntaxKind::Ident(name))
                        if ["before", "after", "first-line", "first-letter"]
                            .iter()
                            .any(|item| name.eq_ignore_ascii_case(item)) =>
                    {
                        return false;
                    }
                    _ => {}
                }
            }
            _ => {}
        }
    }
    true
}

pub fn valid_mode_name(name: &str) -> bool {
    !name.is_empty()
        && name != "-"
        && !name.starts_with(|c: char| c.is_ascii_digit())
        && !name
            .strip_prefix('-')
            .is_some_and(|s| s.starts_with(|c: char| c.is_ascii_digit()))
        && name
            .chars()
            .all(|c| c.is_alphanumeric() || matches!(c, '-' | '_'))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn nesting_preserves_literal_ampersands() {
        assert_eq!(
            replace_nesting_selector(r#"&[data-label="&"] .a\&b"#, ".parent").as_deref(),
            Some(r#".parent[data-label="&"] .a\&b"#)
        );
        assert_eq!(
            replace_nesting_selector(r#"[data-label="&"]"#, ".parent"),
            None
        );
    }
}
