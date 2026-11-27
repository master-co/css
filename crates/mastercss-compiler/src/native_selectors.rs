use super::{
    CompilerError, CssDirectiveSourceReference, ErrorCode, PrinterOptions, Selector,
    SourceLocation, SourceLocationRange, SourceRange, ToCss, byte_to_utf16_offset, css_comment_end,
    css_escape_end, css_quote_end, next_char_end, ranged_directive_diagnostic,
};

pub(crate) fn source_location(source: &str, byte_offset: usize) -> Option<SourceLocation> {
    let prefix = source.get(..byte_offset)?;
    let breaks = prefix
        .char_indices()
        .filter(|(byte, character)| {
            crate::source_index::is_css_line_break(source, *byte, *character)
        })
        .map(|(byte, _)| byte + 1);
    let (line, line_start) = breaks.fold((1_u32, 0), |(line, _), start| (line + 1, start));
    let column = source[line_start..byte_offset].encode_utf16().count() as u32 + 1;
    Some(SourceLocation { line, column })
}

pub(crate) fn selector_end_byte(source: &str, start: usize) -> Option<usize> {
    let mut index = start;
    let mut square_depth = 0_u32;
    let mut parenthesis_depth = 0_u32;
    while index < source.len() {
        let character = source[index..].chars().next()?;
        if character == '\\' {
            index = css_escape_end(source, index);
            continue;
        }
        if matches!(character, '\'' | '"') {
            index = css_quote_end(source, index, character);
            continue;
        }
        if source[index..].starts_with("/*") {
            index = css_comment_end(source, index);
            continue;
        }
        match character {
            '[' => square_depth += 1,
            ']' => square_depth = square_depth.saturating_sub(1),
            '(' => parenthesis_depth += 1,
            ')' => parenthesis_depth = parenthesis_depth.saturating_sub(1),
            '{' if square_depth == 0 && parenthesis_depth == 0 => {
                let mut end = index;
                while end > start
                    && source[..end]
                        .chars()
                        .next_back()
                        .is_some_and(char::is_whitespace)
                {
                    end -= source[..end]
                        .chars()
                        .next_back()
                        .map(char::len_utf8)
                        .unwrap_or_default();
                }
                return Some(end);
            }
            _ => {}
        }
        index = next_char_end(source, index);
    }
    None
}

pub(crate) fn source_reference_from_bytes(
    source: &str,
    filename: &str,
    start: usize,
    end: usize,
) -> Option<CssDirectiveSourceReference> {
    Some(CssDirectiveSourceReference {
        file: Some(filename.to_owned()),
        range: SourceRange {
            start: byte_to_utf16_offset(source, start)?,
            end: byte_to_utf16_offset(source, end)?,
        },
        loc: Some(SourceLocationRange {
            start: source_location(source, start)?,
            end: source_location(source, end)?,
        }),
    })
}

pub(crate) fn printed_selectors(
    selectors: &[Selector<'_>],
    filename: &str,
) -> Result<Vec<String>, CompilerError> {
    selectors
        .iter()
        .map(|selector| {
            selector
                .to_css_string(PrinterOptions {
                    minify: true,
                    ..PrinterOptions::default()
                })
                .map_err(|error| CompilerError::Print {
                    message: error.to_string(),
                    filename: filename.to_owned(),
                })
        })
        .collect()
}

/// Flatten nested selectors into their parents' branches. Each `&` takes every
/// parent branch in turn, so a list is not put in `:is()`, where a
/// pseudo-element is invalid and each branch would take the highest
/// specificity. A selector without `&` is a descendant of each branch. A `&`
/// inside a function, such as `:not(&)`, does not distribute: the list stays
/// in `:is()` there.
pub(crate) fn combine_managed_selectors(parent: &[String], child: &[String]) -> Vec<String> {
    if parent.is_empty() {
        return Vec::new();
    }
    let parents = parent.iter().map(String::as_str).collect::<Vec<_>>();
    let mut selectors = Vec::with_capacity(parent.len() * child.len());
    for child in child {
        if mastercss_lexer::nesting_selector_ranges(child).is_empty() {
            selectors.extend(parent.iter().map(|parent| format!("{parent} {child}")));
        } else if let Some(distributed) =
            mastercss_lexer::distribute_nesting_selector(child, &parents)
        {
            selectors.extend(distributed);
        } else {
            let list = parent.join(",");
            selectors.extend(mastercss_lexer::replace_nesting_selector(child, &list));
        }
    }
    selectors
}

/// Place a selector from an expanded mixin into the rule that applies it.
pub(crate) fn nest_applied_selector(parent: &str, child: &str) -> String {
    let parent = mastercss_lexer::split_selector_list(parent)
        .into_iter()
        .map(str::to_owned)
        .collect::<Vec<_>>();
    let child = mastercss_lexer::split_selector_list(child)
        .into_iter()
        .map(str::to_owned)
        .collect::<Vec<_>>();
    combine_managed_selectors(&parent, &child).join(",")
}

/// `@contents` marks where a mixin call's block goes, so it is only valid inside
/// `@mixin` and `@utility`. `@apply` expands into the style rule, mixin or
/// utility around it, so a descriptor block such as `@font-face` or `@page`
/// cannot hold one.
pub(crate) fn validate_contents_placement(
    source: &str,
    filename: &str,
) -> Result<(), CompilerError> {
    use mastercss_lexer::{CssSyntaxKind, collect_css_syntax_statements, tokenize_css_syntax};
    let tokens = tokenize_css_syntax(source);
    let statements = collect_css_syntax_statements(&tokens);
    for statement in &statements {
        let Some(token) = tokens.get(statement.tokens.start) else {
            continue;
        };
        let CssSyntaxKind::AtKeyword(name) = &token.kind else {
            continue;
        };
        let contents = name.eq_ignore_ascii_case("contents");
        if !contents && !name.eq_ignore_ascii_case("apply") {
            continue;
        }
        let mut ancestor = statement.parent;
        let mut in_mixin = false;
        let mut in_style = false;
        let mut descriptor = None;
        while let Some(index) = ancestor {
            let parent = &statements[index];
            match &tokens[parent.tokens.start].kind {
                CssSyntaxKind::AtKeyword(name) => {
                    in_mixin |=
                        name.eq_ignore_ascii_case("mixin") || name.eq_ignore_ascii_case("utility");
                    if !in_style
                        && !in_mixin
                        && descriptor.is_none()
                        && !CONDITIONAL_AT_RULES
                            .iter()
                            .any(|rule| name.eq_ignore_ascii_case(rule))
                    {
                        descriptor = Some(name.to_string());
                    }
                }
                _ => in_style = true,
            }
            ancestor = parent.parent;
        }
        let message = if contents {
            (!in_mixin).then(|| "@contents is only valid inside @mixin".to_owned())
        } else if let Some(descriptor) = descriptor {
            Some(format!("@apply cannot be used inside @{descriptor}"))
        } else {
            (!in_mixin && !in_style).then(|| "@apply requires a style rule".to_owned())
        };
        if let Some(message) = message {
            return Err(ranged_directive_diagnostic(
                source,
                filename,
                token.bytes.start,
                token.bytes.end,
                ErrorCode::CssDirectiveError,
                &message,
            ));
        }
    }
    Ok(())
}

/// At-rules whose blocks hold style rules and declarations as their parent
/// does: group rules, and the content blocks of `@apply` and `@contents`.
const CONDITIONAL_AT_RULES: [&str; 9] = [
    "apply",
    "contents",
    "media",
    "supports",
    "container",
    "layer",
    "scope",
    "starting-style",
    "nest",
];
