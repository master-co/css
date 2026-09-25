/// Replace actual CSS nesting tokens. The CSS lexer preserves strings, comments,
/// escapes and attribute contents; byte ranges always refer to the authored input.
pub fn replace_nesting_selector(source: &str, parent: &str) -> Option<String> {
    use crate::CssSyntaxKind;
    let mut result = String::with_capacity(source.len());
    let mut attributes = 0_u32;
    let mut cursor = 0;
    let parent = if split_selector_list(parent).len() > 1 {
        format!(":is({parent})")
    } else {
        parent.to_owned()
    };
    for token in crate::tokenize_css_syntax(source) {
        match token.kind {
            CssSyntaxKind::Delim('[') => attributes += 1,
            CssSyntaxKind::Delim(']') => attributes = attributes.saturating_sub(1),
            CssSyntaxKind::Delim('&') if attributes == 0 => {
                result.push_str(&source[cursor..token.bytes.start]);
                result.push_str(&parent);
                cursor = token.bytes.end;
            }
            _ => {}
        }
    }
    if cursor == 0 {
        return None;
    }
    result.push_str(&source[cursor..]);
    Some(result)
}

/// Split only top-level selector commas, retaining each branch's authored CSS.
pub fn split_selector_list(source: &str) -> Vec<&str> {
    use crate::CssSyntaxKind;
    let tokens = crate::tokenize_css_syntax(source);
    let mut branches = Vec::new();
    let mut cursor = 0;
    let mut index = 0;
    while let Some(token) = tokens.get(index) {
        if let Some(close) = token.close {
            index = close + 1;
            continue;
        }
        if matches!(token.kind, CssSyntaxKind::Delim(',')) {
            branches.push(source[cursor..token.bytes.start].trim());
            cursor = token.bytes.end;
        }
        index += 1;
    }
    branches.push(source[cursor..].trim());
    branches
}

/// Reject definite token-structure errors without a browser capability allowlist.
pub fn valid_selector_structure(source: &str) -> bool {
    use crate::CssSyntaxKind;
    if crate::native_content(source).is_none() || split_selector_list(source).contains(&"") {
        return false;
    }
    let tokens = crate::tokenize_css_syntax(source);
    let mut index = 0;
    while let Some(token) = tokens.get(index) {
        if matches!(token.kind, CssSyntaxKind::Delim('[')) {
            let Some(close) = token.close else {
                return false;
            };
            index = close + 1;
            continue;
        }
        match &token.kind {
            CssSyntaxKind::Delim('.' | '#')
                if !matches!(
                    tokens.get(index + 1).map(|token| &token.kind),
                    Some(CssSyntaxKind::Ident(_))
                ) =>
            {
                return false;
            }
            CssSyntaxKind::Delim('<' | ';' | '{' | '}' | '@') => return false,
            _ => {}
        }
        index += 1;
    }
    true
}

/// Shared compiler/manifest boundary check. CSS support is intentionally not tested.
pub fn valid_mode_selector(selector: &str) -> bool {
    use crate::CssSyntaxKind;
    let tokens = crate::tokenize_css_syntax(selector);
    if tokens.is_empty() || !valid_selector_structure(selector) {
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

/// Rename one actual class selector, without touching attributes or CSS strings.
pub fn replace_class_selector(source: &str, from: &str, to: &str) -> String {
    use crate::CssSyntaxKind;
    let tokens = crate::tokenize_css_syntax(source);
    let mut edits = Vec::new();
    let mut index = 0;
    while let Some(token) = tokens.get(index) {
        if token.kind == CssSyntaxKind::Delim('[') {
            index = token.close.map_or(index + 1, |close| close + 1);
            continue;
        }
        if token.kind == CssSyntaxKind::Delim('.')
            && let Some(next) = tokens.get(index + 1)
            && matches!(next.kind, CssSyntaxKind::Ident(_))
            && &source[token.bytes.start..next.bytes.end] == from
        {
            edits.push(token.bytes.start..next.bytes.end);
        }
        index += 1;
    }
    let mut output = source.to_owned();
    for range in edits.into_iter().rev() {
        output.replace_range(range, to);
    }
    output
}

/// Generated CSS can contain the same bytes in values. Limit renaming to rule
/// preludes instead of replacing substrings throughout a stylesheet.
pub fn replace_rule_class_selector(source: &str, from: &str, to: &str) -> String {
    let tokens = crate::tokenize_css_syntax(source);
    let statements = crate::collect_css_syntax_statements(&tokens);
    let mut edits = Vec::new();
    for statement in statements {
        if !statement.has_block {
            continue;
        }
        let Some(first) = tokens.get(statement.tokens.start) else {
            continue;
        };
        if matches!(first.kind, crate::CssSyntaxKind::AtKeyword(_)) {
            continue;
        }
        let end = tokens[statement.tokens.end].bytes.start;
        let selector = &source[first.bytes.start..end];
        let replacement = replace_class_selector(selector, from, to);
        if replacement != selector {
            edits.push((first.bytes.start..end, replacement));
        }
    }
    let mut output = source.to_owned();
    edits.sort_by_key(|(range, _)| range.start);
    for (range, replacement) in edits.into_iter().rev() {
        output.replace_range(range, &replacement);
    }
    output
}

#[cfg(test)]
mod rule_tests {
    use super::*;
    #[test]
    fn nested_rule_renaming_preserves_values_and_offsets() {
        let css = r#"@media print{.old{content:'.old'}}.old[data-x='.old']{color:red}@supports(display:grid){.old{display:grid}}"#;
        assert_eq!(
            replace_rule_class_selector(css, ".old", ".longer-name"),
            r#"@media print{.longer-name{content:'.old'}}.longer-name[data-x='.old']{color:red}@supports(display:grid){.longer-name{display:grid}}"#
        );
    }
}
