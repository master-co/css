use super::{
    CompilerError, CssDirectiveSourceReference, ErrorCode, PrinterOptions, Selector,
    SourceLocation, SourceLocationRange, SourceRange, ToCss, byte_to_utf16_offset, css_comment_end,
    css_quote_end, next_char_end, ranged_directive_diagnostic,
};

pub(crate) fn source_location(source: &str, byte_offset: usize) -> Option<SourceLocation> {
    let prefix = source.get(..byte_offset)?;
    let line = prefix.bytes().filter(|byte| *byte == b'\n').count() as u32 + 1;
    let line_start = prefix.rfind('\n').map_or(0, |index| index + 1);
    let column = source[line_start..byte_offset].encode_utf16().count() as u32 + 1;
    Some(SourceLocation { line, column })
}

pub(crate) fn selector_end_byte(source: &str, start: usize) -> Option<usize> {
    let mut index = start;
    let mut square_depth = 0_u32;
    let mut parenthesis_depth = 0_u32;
    while index < source.len() {
        let character = source[index..].chars().next()?;
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

pub(crate) fn combine_managed_selectors(parent: &[String], child: &[String]) -> Vec<String> {
    let mut selectors = Vec::with_capacity(parent.len() * child.len());
    for child in child {
        for parent in parent {
            selectors.push(
                mastercss_lexer::replace_nesting_selector(child, parent)
                    .unwrap_or_else(|| format!("{parent} {child}")),
            );
        }
    }
    selectors
}

pub(crate) fn reject_removed_directives(source: &str, filename: &str) -> Result<(), CompilerError> {
    use mastercss_lexer::{CssSyntaxKind, collect_css_syntax_statements, tokenize_css_syntax};
    let tokens = tokenize_css_syntax(source);
    let statements = collect_css_syntax_statements(&tokens);
    for statement in &statements {
        let Some(token) = tokens.get(statement.tokens.start) else {
            continue;
        };
        if let CssSyntaxKind::AtKeyword(name) = &token.kind {
            let mut ancestor = statement.parent;
            let mut in_mixin = false;
            while let Some(index) = ancestor {
                let parent = &statements[index];
                in_mixin |= matches!(&tokens[parent.tokens.start].kind, CssSyntaxKind::AtKeyword(name) if name.eq_ignore_ascii_case("mixin"));
                ancestor = parent.parent;
            }
            let message = match name.to_ascii_lowercase().as_str() {
                "contents" if !in_mixin => Some("@contents is only valid inside @mixin"),
                "custom-variant" | "variant" | "slot" => Some(
                    "Variants were removed; use @custom-media, native conditions, or @mixin with @apply and @contents. Move layer selection to the call site.",
                ),
                "master" => Some(
                    "@master entry has been removed; use @import \"@master/css\" for a project entry",
                ),
                "settings" => Some(
                    "@settings has been removed; use per-class ! for important and native selectors for scope",
                ),
                "mode" => Some(
                    "@mode has been removed; author explicit native selectors and conditions outside @theme and use @custom-media or @mixin for reuse",
                ),
                "utilities" => Some("@utilities has been removed; use @mixin --name { ... }"),
                "dark" | "light" => Some(
                    "@dark and @light blocks have been removed; use native @media (--dark) or @media (--light)",
                ),
                _ => None,
            };
            if let Some(message) = message {
                return Err(ranged_directive_diagnostic(
                    source,
                    filename,
                    token.bytes.start,
                    token.bytes.end,
                    ErrorCode::CssDirectiveError,
                    message,
                ));
            }
        }
        if matches!(&token.kind, CssSyntaxKind::AtKeyword(name) if name.eq_ignore_ascii_case("compose"))
        {
            return Err(ranged_directive_diagnostic(
                source,
                filename,
                token.bytes.start,
                token.bytes.end,
                ErrorCode::RemovedComposeDirective,
                "@compose has been removed; use native CSS declarations and selectors, or use utilities directly in markup",
            ));
        }
    }
    Ok(())
}
