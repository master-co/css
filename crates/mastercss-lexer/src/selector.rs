/// Replace actual CSS nesting tokens. The CSS lexer preserves strings, comments,
/// escapes and attribute contents; byte ranges always refer to the authored input.
///
/// A parent list goes in `:is()`, unless one of its branches names a
/// pseudo-element, which `:is()` cannot hold: then each top-level `&` takes
/// every branch in turn, written out as the branch's text. Engine templates
/// are compound selectors there; the compiler flattens arbitrary nesting with
/// [`distribute_nesting_selector`].
pub fn replace_nesting_selector(source: &str, parent: &str) -> Option<String> {
    use crate::CssSyntaxKind;
    let mut result = String::with_capacity(source.len());
    let mut attributes = 0_u32;
    let mut cursor = 0;
    let branches = split_selector_list(parent);
    if branches.len() > 1 && branches.iter().any(|branch| has_pseudo_element(branch)) {
        let distributed = split_selector_list(source)
            .into_iter()
            .map(|branch| substitute_nesting_branches(branch, &branches))
            .collect::<Option<Vec<_>>>();
        if let Some(distributed) = distributed {
            return Some(distributed.concat().join(","));
        }
    }
    let parent = if branches.len() > 1 {
        crate::concat_text!(":is(", parent, ")")
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

/// Byte ranges of the actual CSS nesting tokens in `source`, in order, each with
/// whether a function or parentheses hold it (`:is(&)`, `:not(&)`). Strings,
/// comments, escapes and attribute contents never hold one.
pub fn nesting_selector_ranges(source: &str) -> Vec<(std::ops::Range<usize>, bool)> {
    use crate::CssSyntaxKind;
    let tokens = crate::tokenize_css_syntax(source);
    let mut ranges = Vec::new();
    let mut open = Vec::<usize>::new();
    let mut index = 0;
    while let Some(token) = tokens.get(index) {
        while open.last().is_some_and(|close| *close <= index) {
            open.pop();
        }
        match (&token.kind, token.close) {
            (CssSyntaxKind::Delim('['), Some(close)) => {
                index = close + 1;
                continue;
            }
            (CssSyntaxKind::Delim('&'), _) => ranges.push((token.bytes.clone(), !open.is_empty())),
            (_, Some(close)) => open.push(close),
            _ => {}
        }
        index += 1;
    }
    ranges
}

/// A nested selector list placed in its parent, as CSS nesting reads it: each
/// branch without `&` is relative to the parent (`h1, h2` is `& h1, & h2`).
pub fn nest_selector(source: &str, parent: &str) -> String {
    let branches = split_selector_list(source);
    if branches
        .iter()
        .all(|branch| !nesting_selector_ranges(branch).is_empty())
    {
        return replace_nesting_selector(source, parent).unwrap_or_else(|| source.to_owned());
    }
    let relative = branches
        .into_iter()
        .map(|branch| {
            if nesting_selector_ranges(branch).is_empty() {
                crate::concat_text!("& ", branch)
            } else {
                branch.to_owned()
            }
        })
        .collect::<Vec<_>>()
        .join(",");
    replace_nesting_selector(&relative, parent).unwrap_or(relative)
}

/// The most selectors one nested selector distributes into before its parent
/// branches are kept together in `:is()`.
pub const DISTRIBUTED_SELECTOR_LIMIT: usize = 64;

/// `source` with each top-level `&` taking every parent branch in turn, the
/// first `&` varying slowest, so branches keep their authored order and their
/// own specificity. None when it has no `&`, when one sits in a function or
/// parentheses (`:not(&)` does not distribute) or when the branches would
/// exceed [`DISTRIBUTED_SELECTOR_LIMIT`].
///
/// Each branch stands where CSS nesting puts `:is(branch)`: written out where
/// that means the same, kept in `:is()` where a complex branch follows another
/// compound (`& + &`, `.x &`) or a type selector would not lead its compound
/// (`.x&` under `div`). A type selector after `&` (`&div`) moves before it.
pub fn distribute_nesting_selector(source: &str, parents: &[&str]) -> Option<Vec<String>> {
    use crate::CssSyntaxKind;
    let ranges = nesting_selector_ranges(source);
    if ranges.is_empty() || ranges.iter().any(|(_, nested)| *nested) {
        return None;
    }
    let combinations = u32::try_from(ranges.len())
        .ok()
        .and_then(|count| parents.len().checked_pow(count))
        .filter(|count| (1..=DISTRIBUTED_SELECTOR_LIMIT).contains(count))?;
    let tokens = crate::tokenize_css_syntax(source);
    let leading = source.len() - source.trim_start().len();
    // How each `&` meets its neighbours: whether it leads the selector, whether
    // a compound part touches it before, and the type selector after it.
    let places = ranges
        .iter()
        .map(|(range, _)| {
            let index = tokens.iter().position(|token| token.bytes == *range);
            let before = index
                .and_then(|index| index.checked_sub(1))
                .map(|index| &tokens[index])
                .filter(|token| token.bytes.end == range.start)
                .is_some_and(|token| {
                    !matches!(token.kind, CssSyntaxKind::Delim('>' | '+' | '~' | ','))
                });
            let after = index
                .and_then(|index| tokens.get(index + 1))
                .filter(|token| token.bytes.start == range.end)
                .filter(|token| {
                    matches!(
                        token.kind,
                        CssSyntaxKind::Ident(_) | CssSyntaxKind::Delim('*')
                    )
                })
                .map(|token| token.bytes.clone());
            (range.start == leading, before, after)
        })
        .collect::<Vec<_>>();
    let parents = parents
        .iter()
        .map(|parent| {
            (
                *parent,
                is_compound_selector(parent),
                starts_with_type_selector(parent),
            )
        })
        .collect::<Vec<_>>();
    let mut selectors = Vec::with_capacity(combinations);
    for combination in 0..combinations {
        let mut selector = String::with_capacity(source.len() + parents.len() * 8);
        let mut cursor = 0;
        let mut index = combination;
        let mut divisor = combinations;
        for ((range, _), (first, before, after)) in ranges.iter().zip(&places) {
            divisor /= parents.len();
            let (parent, compound, typed) = parents[index / divisor];
            index %= divisor;
            selector.push_str(&source[cursor..range.start]);
            cursor = range.end;
            if let Some(after) = after {
                selector.push_str(&source[after.clone()]);
                cursor = after.end;
            }
            let written = compound && !(typed && (*before || after.is_some()))
                || !compound && *first && after.is_none();
            if written {
                selector.push_str(parent);
            } else {
                selector.push_str(":is(");
                selector.push_str(parent);
                selector.push(')');
            }
        }
        selector.push_str(&source[cursor..]);
        selectors.push(selector);
    }
    Some(selectors)
}

/// `source` with each top-level `&` replaced by every branch in turn as text,
/// the first `&` varying slowest. None as [`distribute_nesting_selector`] is.
fn substitute_nesting_branches(source: &str, parents: &[&str]) -> Option<Vec<String>> {
    let ranges = nesting_selector_ranges(source);
    let count = u32::try_from(ranges.len())
        .ok()
        .and_then(|count| parents.len().checked_pow(count))?;
    if ranges.is_empty()
        || ranges.iter().any(|(_, nested)| *nested)
        || !(1..=DISTRIBUTED_SELECTOR_LIMIT).contains(&count)
    {
        return None;
    }
    let mut selectors = vec![String::new()];
    let mut cursor = 0;
    for (range, _) in &ranges {
        let text = &source[cursor..range.start];
        selectors = selectors
            .iter()
            .flat_map(|prefix| {
                parents
                    .iter()
                    .map(move |parent| crate::concat_text!(prefix, text, parent))
            })
            .collect();
        cursor = range.end;
    }
    Some(
        selectors
            .into_iter()
            .map(|selector| selector + &source[cursor..])
            .collect(),
    )
}

/// Whether a selector is one compound: no combinator or descendant space outside
/// functions and attribute selectors.
fn is_compound_selector(selector: &str) -> bool {
    use crate::CssSyntaxKind;
    let selector = selector.trim();
    let tokens = crate::tokenize_css_syntax(selector);
    let mut index = 0;
    let mut previous_end = None;
    while let Some(token) = tokens.get(index) {
        if previous_end.is_some_and(|end| token.bytes.start > end)
            || matches!(token.kind, CssSyntaxKind::Delim('>' | '+' | '~'))
        {
            return false;
        }
        let last = token.close.unwrap_or(index);
        previous_end = Some(
            tokens
                .get(last)
                .map_or(token.bytes.end, |last| last.bytes.end),
        );
        index = last + 1;
    }
    true
}

/// Whether a selector begins with a type or universal selector, which must lead
/// its compound.
fn starts_with_type_selector(selector: &str) -> bool {
    use crate::CssSyntaxKind;
    crate::tokenize_css_syntax(selector.trim())
        .first()
        .is_some_and(|token| {
            matches!(
                token.kind,
                CssSyntaxKind::Ident(_) | CssSyntaxKind::Delim('*' | '|')
            )
        })
}

/// Whether a selector names a pseudo-element: `::name`, or one of the four
/// that CSS 2 spells with one colon.
pub fn has_pseudo_element(selector: &str) -> bool {
    use crate::CssSyntaxKind;
    let tokens = crate::tokenize_css_syntax(selector);
    let mut index = 0;
    while let Some(token) = tokens.get(index) {
        match (&token.kind, token.close) {
            (CssSyntaxKind::Delim('['), Some(close)) => {
                index = close + 1;
                continue;
            }
            (CssSyntaxKind::Delim(':'), _) => {
                let next = tokens
                    .get(index + 1)
                    .filter(|next| next.bytes.start == token.bytes.end);
                match next.map(|next| &next.kind) {
                    Some(CssSyntaxKind::Delim(':')) => return true,
                    Some(CssSyntaxKind::Ident(name))
                        if ["before", "after", "first-line", "first-letter"]
                            .iter()
                            .any(|legacy| name.eq_ignore_ascii_case(legacy)) =>
                    {
                        return true;
                    }
                    _ => {}
                }
            }
            _ => {}
        }
        index += 1;
    }
    false
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
    // A number outside any function's arguments is never part of a selector:
    // `&.5` lexes as a number, and `[open]1` leaves one after the attribute.
    let mut open = Vec::<usize>::new();
    for (index, token) in tokens.iter().enumerate() {
        while open.last().is_some_and(|close| *close <= index) {
            open.pop();
        }
        if open.is_empty()
            && matches!(
                token.kind,
                CssSyntaxKind::Number(_)
                    | CssSyntaxKind::Dimension(_, _)
                    | CssSyntaxKind::Percentage(_)
            )
        {
            return false;
        }
        if let Some(close) = token.close {
            open.push(close);
        }
    }
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
            // `!` and `/` never belong to a selector: `:hover!`, `:hover/2`.
            CssSyntaxKind::Delim('<' | ';' | '{' | '}' | '@' | '!' | '/') => return false,
            // A combinator joins two compounds, so one must follow it: `&+` and
            // `&>` are never selectors (`a.b+c` in code reads as a class).
            CssSyntaxKind::Delim('>' | '+' | '~')
                if matches!(
                    tokens.get(index + 1).map(|token| &token.kind),
                    None | Some(CssSyntaxKind::Delim(',' | ')' | '>' | '+' | '~'))
                ) =>
            {
                return false;
            }
            // The universal selector starts a compound: `&*` is not one.
            CssSyntaxKind::Delim('*')
                if index > 0
                    && tokens[index - 1].bytes.end == token.bytes.start
                    && !matches!(
                        tokens[index - 1].kind,
                        CssSyntaxKind::Function(_)
                            | CssSyntaxKind::Delim('(' | ',' | '>' | '+' | '~' | '|')
                    ) =>
            {
                return false;
            }
            // A pseudo-class or pseudo-element names an identifier or function, so
            // `:1|1|auto` is never a selector (it was a declaration value).
            CssSyntaxKind::Delim(':') => {
                let element = index > 0
                    && tokens[index - 1].kind == CssSyntaxKind::Delim(':')
                    && tokens[index - 1].bytes.end == token.bytes.start;
                let named = tokens.get(index + 1).is_some_and(|next| {
                    next.bytes.start == token.bytes.end
                        && match &next.kind {
                            CssSyntaxKind::Ident(_) | CssSyntaxKind::Function(_) => true,
                            CssSyntaxKind::Delim(':') => !element,
                            _ => false,
                        }
                });
                if !named {
                    return false;
                }
            }
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
        && name.chars().all(crate::is_name_code_point)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn mode_names_are_css_names() {
        for name in ["dark", "high-contrast", "暗色", "dark·mode", "☃"] {
            assert!(valid_mode_name(name), "{name}");
        }
        for name in ["", "-", "1dark", "-1dark", "dark mode", "dark!"] {
            assert!(!valid_mode_name(name), "{name}");
        }
    }

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

/// Decoded class names an actual selector references, skipping attribute contents
/// and CSS strings, in source order.
pub fn selector_class_names(source: &str) -> Vec<String> {
    use crate::CssSyntaxKind;
    let tokens = crate::tokenize_css_syntax(source);
    let mut names = Vec::new();
    let mut index = 0;
    while let Some(token) = tokens.get(index) {
        if token.kind == CssSyntaxKind::Delim('[') {
            index = token.close.map_or(index + 1, |close| close + 1);
            continue;
        }
        if token.kind == CssSyntaxKind::Delim('.')
            && let Some(next) = tokens.get(index + 1)
            && next.bytes.start == token.bytes.end
            && let CssSyntaxKind::Ident(name) = &next.kind
        {
            names.push(name.to_string());
        }
        index += 1;
    }
    names
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

    #[test]
    fn selector_class_names_skip_attributes_and_decode_escapes() {
        assert_eq!(
            selector_class_names("&:where(.light, .light *)"),
            ["light", "light"]
        );
        assert_eq!(
            selector_class_names(r#".group[data-label=".peer"] > .a\:b :is(. c)"#),
            ["group", "a:b"]
        );
    }
}

#[cfg(test)]
mod structure_tests {
    use super::valid_selector_structure;

    #[test]
    fn pseudo_selectors_name_an_identifier_or_function() {
        for selector in [
            "&:hover",
            "&::before",
            "&::part(label)",
            "&:is(.a,:focus)",
            "&:has(>img)",
            "&[data-x=':1']",
            r"&.a\:1",
            "&:-webkit-autofill",
        ] {
            assert!(valid_selector_structure(selector), "{selector}");
        }
        for selector in ["&:1|1|auto", "&:", "&:::before", "&:'a'", "&:(x)"] {
            assert!(!valid_selector_structure(selector), "{selector}");
        }
    }

    #[test]
    fn combinators_join_compounds_and_universal_starts_one() {
        for selector in [
            "&>*",
            "& *",
            "&+div",
            "&~.a",
            "&:has(>img)",
            "&:has(+ .a)",
            "&:nth-child(2n + 1)",
            "&:is(*)",
            "&,*",
            "& *|a",
            "&[a~=b]",
            "&[a*=b]",
        ] {
            assert!(valid_selector_structure(selector), "{selector}");
        }
        for selector in [
            "&+",
            "&>",
            "& ~",
            "&*",
            ".a*",
            "&>,&",
            "&:has(a>)",
            "&>+a",
            "&.a,",
        ] {
            assert!(!valid_selector_structure(selector), "{selector}");
        }
    }
}
