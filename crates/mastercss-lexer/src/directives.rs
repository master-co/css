use super::{CssDirectiveRange, CssQuotedStringRange, SourceRange, byte_to_utf16_offset};

pub fn is_keyframe_safelist(source: &str) -> bool {
    let tokens = super::tokenize_css_syntax(source);
    matches!(tokens.first().map(|token| &token.kind), Some(super::CssSyntaxKind::AtKeyword(name)) if name == "safelist")
        && matches!(tokens.get(1).map(|token| &token.kind), Some(super::CssSyntaxKind::Ident(name)) if name == "keyframes")
}

pub fn find_css_directive_ranges(source: &str) -> Vec<CssDirectiveRange> {
    use super::{CssSyntaxKind as Kind, collect_css_syntax_statements, tokenize_css_syntax};
    const NAMES: &[&str] = &[
        "source",
        "safelist",
        "blocklist",
        "preserve",
        "prune",
        "reference",
        "theme",
        "mixin",
        "apply",
        "custom-media",
        "contents",
    ];
    let tokens = tokenize_css_syntax(source);
    let units = |byte| byte_to_utf16_offset(source, byte).unwrap_or_default();
    let mut ranges: Vec<_> = collect_css_syntax_statements(&tokens)
        .into_iter()
        .filter_map(|statement| {
            let first = tokens.get(statement.tokens.start)?;
            let Kind::AtKeyword(name) = &first.kind else {
                return None;
            };
            let name = name.to_ascii_lowercase();
            if !NAMES.contains(&name.as_str()) {
                return None;
            }
            let delimiter = tokens.get(statement.tokens.end);
            let prelude_end = delimiter.map_or(source.len(), |token| token.bytes.start);
            let end = delimiter.map_or(source.len(), |token| {
                token
                    .close
                    .map_or(token.bytes.end, |close| tokens[close].bytes.end)
            });
            Some(CssDirectiveRange {
                name,
                range: SourceRange {
                    start: units(first.bytes.start),
                    end: units(end),
                },
                prelude_range: SourceRange {
                    start: units(first.bytes.end),
                    end: units(prelude_end),
                },
                block_range: statement.has_block.then(|| SourceRange {
                    start: units(prelude_end),
                    end: units(end),
                }),
                quoted_string_ranges: find_css_quoted_string_ranges(
                    source,
                    first.bytes.end,
                    prelude_end,
                ),
            })
        })
        .collect();
    ranges.sort_by_key(|range| range.range.start);
    ranges
}

pub(crate) fn find_css_quoted_string_ranges(
    source: &str,
    start: usize,
    end: usize,
) -> Vec<CssQuotedStringRange> {
    let mut ranges = Vec::new();
    let mut index = start;
    let mut comment = false;
    while index < end {
        let character = source[index..].chars().next().unwrap_or_default();
        let next_index = index + character.len_utf8();
        let next = source[next_index..].chars().next();
        if comment {
            if character == '*' && next == Some('/') {
                comment = false;
                index = next_index + 1;
            } else {
                index = next_index;
            }
            continue;
        }
        if character == '/' && next == Some('*') {
            comment = true;
            index = next_index + 1;
            continue;
        }
        if !matches!(character, '\'' | '"') {
            index = next_index;
            continue;
        }
        let quote = character;
        let content_start = next_index;
        let mut close = content_start;
        while close < end {
            let value = source[close..].chars().next().unwrap_or_default();
            let value_end = close + value.len_utf8();
            if value == '\\' {
                close = source[value_end..]
                    .chars()
                    .next()
                    .map_or(value_end, |escaped| value_end + escaped.len_utf8());
            } else if value == quote {
                break;
            } else {
                close = value_end;
            }
        }
        let range_end = if close < end {
            close + quote.len_utf8()
        } else {
            end
        };
        ranges.push(CssQuotedStringRange {
            range: SourceRange {
                start: byte_to_utf16_offset(source, index).unwrap_or_default(),
                end: byte_to_utf16_offset(source, range_end).unwrap_or_default(),
            },
            content_range: SourceRange {
                start: byte_to_utf16_offset(source, content_start).unwrap_or_default(),
                end: byte_to_utf16_offset(source, close.min(end)).unwrap_or_default(),
            },
        });
        index = range_end;
    }
    ranges
}

/// The typed safelist has name semantics and must never enter a class parser.
pub fn keyframe_safelist_diagnostics(source: &str) -> Vec<mastercss_schema::Diagnostic> {
    use crate::{CssSyntaxKind as Kind, collect_css_syntax_statements, tokenize_css_syntax};
    let tokens = tokenize_css_syntax(source);
    let mut diagnostics = Vec::new();
    for statement in collect_css_syntax_statements(&tokens) {
        let slice = &tokens[statement.tokens.clone()];
        if !matches!(slice.first().map(|token| &token.kind), Some(Kind::AtKeyword(name)) if name == "safelist")
            || !matches!(slice.get(1).map(|token| &token.kind), Some(Kind::Ident(_)))
        {
            continue;
        }
        let valid = statement.parent.is_none()
            && !statement.has_block
            && matches!(&slice[1].kind, Kind::Ident(name) if name == "keyframes")
            && slice.len() > 2
            && slice[2..]
                .iter()
                .all(|token| matches!(&token.kind, Kind::String(value) if !value.is_empty()))
            && tokens
                .get(statement.tokens.end)
                .is_some_and(|token| token.kind == Kind::Delim(';'));
        if !valid {
            diagnostics.push(mastercss_schema::Diagnostic {
                code: mastercss_schema::ErrorCode::CssDirectiveError,
                phase: mastercss_schema::DiagnosticPhase::Compiler,
                severity: mastercss_schema::DiagnosticSeverity::Error,
                message: "Use a top-level @safelist keyframes followed by one or more quoted complete names and a semicolon".into(),
                source: None,
                range: Some(SourceRange { start: byte_to_utf16_offset(source, slice[0].bytes.start).unwrap(), end: byte_to_utf16_offset(source, slice.last().unwrap().bytes.end).unwrap() }),
                notes: Vec::new(),
            });
        }
    }
    diagnostics
}
