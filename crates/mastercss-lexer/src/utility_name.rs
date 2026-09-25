use crate::{CssSyntaxKind, tokenize_css_syntax};

/// Manifest names are already decoded. CSS identifiers may contain escapes,
/// Unicode and uppercase letters, but class delimiters cannot be name content.
pub fn valid_utility_name(name: &str) -> bool {
    !name.is_empty()
        && !name.chars().any(|c| {
            c.is_ascii_control()
                || c.is_ascii_whitespace()
                || ":@!|/.,#[](){}<>&*+~='\"\\".contains(c)
        })
}

pub fn decode_utility_name(source: &str) -> Option<String> {
    let tokens = tokenize_css_syntax(source);
    if let [token] = tokens.as_slice()
        && token.bytes.start == 0
        && token.bytes.end == source.len()
        && let CssSyntaxKind::Ident(name) = &token.kind
        && valid_utility_name(name)
    {
        Some(name.to_string())
    } else {
        None
    }
}
