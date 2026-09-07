use super::*;

pub(crate) fn find_language_group_close(token: &str) -> Option<usize> {
    let mut quote = None;
    let mut depth = 0_u32;
    let mut escaped = false;
    for (index, character) in token.char_indices().skip(1) {
        if escaped {
            escaped = false;
            continue;
        }
        if let Some(current_quote) = quote {
            if character == '\\' {
                escaped = true;
            } else if character == current_quote {
                quote = None;
            }
            continue;
        }
        if matches!(character, '\'' | '"') {
            quote = Some(character);
        } else if matches!(character, '(' | '[' | '{') {
            depth += 1;
        } else if matches!(character, ')' | ']') {
            depth = depth.saturating_sub(1);
        } else if character == '}' {
            if depth == 0 {
                return Some(index);
            }
            depth -= 1;
        }
    }
    None
}

pub(crate) fn top_level_semicolons(source: &str) -> Vec<usize> {
    let mut semicolons = Vec::new();
    let mut quote = None;
    let mut depth = 0_u32;
    let mut escaped = false;
    for (index, character) in source.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if let Some(current_quote) = quote {
            if character == '\\' {
                escaped = true;
            } else if character == current_quote {
                quote = None;
            }
            continue;
        }
        if matches!(character, '\'' | '"') {
            quote = Some(character);
        } else if matches!(character, '(' | '[' | '{') {
            depth += 1;
        } else if matches!(character, ')' | ']' | '}') {
            depth = depth.saturating_sub(1);
        } else if character == ';' && depth == 0 {
            semicolons.push(index);
        }
    }
    semicolons
}

pub(crate) fn range_within(range: &SourceRange, parent: Option<&SourceRange>) -> bool {
    parent.is_none_or(|parent| range.start >= parent.start && range.end <= parent.end)
}

pub(crate) fn ranges_equal(left: &SourceRange, right: Option<&SourceRange>) -> bool {
    right.is_some_and(|right| left.start == right.start && left.end == right.end)
}

pub(crate) fn format_class_list(class_list: &str) -> String {
    let mut formatted: Vec<String> = Vec::new();
    for token in class_list.split_whitespace() {
        let suffix = token.strip_prefix('!').is_some_and(|suffix| {
            suffix.is_empty()
                || suffix
                    .chars()
                    .next()
                    .is_some_and(|character| matches!(character, ':' | '@' | '_' | '>' | '+' | '~'))
        });
        if suffix && let Some(previous) = formatted.last_mut() {
            previous.push_str(token);
        } else {
            formatted.push(token.to_owned());
        }
    }
    formatted.join(" ")
}

pub(crate) fn source_slice<'a>(source: &'a str, range: &SourceRange) -> Option<&'a str> {
    let start = utf16_to_byte_offset(source, range.start)?;
    let end = utf16_to_byte_offset(source, range.end)?;
    (start <= end).then_some(&source[start..end])
}

pub(crate) fn apply_relative_edits(source: &str, edits: &[LanguageFormatEditIr]) -> Option<String> {
    let mut result = source.to_owned();
    let mut edits = edits.to_vec();
    edits.sort_by(|left, right| {
        right
            .range
            .start
            .cmp(&left.range.start)
            .then_with(|| right.range.end.cmp(&left.range.end))
    });
    for edit in edits {
        let start = utf16_to_byte_offset(&result, edit.range.start)?;
        let end = utf16_to_byte_offset(&result, edit.range.end)?;
        result.replace_range(start..end, &edit.text);
    }
    Some(result)
}

pub(crate) fn formatted_directive_prelude(
    source: &str,
    directive: &CssDirectiveRange,
) -> Option<String> {
    let prelude = source_slice(source, &directive.prelude_range)?;
    if directive.name == "compose" {
        if directive.block_range.is_some() || !directive.quoted_string_ranges.is_empty() {
            return None;
        }
        let formatted = format_class_list(prelude);
        return Some(if formatted.is_empty() {
            String::new()
        } else {
            format!(" {formatted}")
        });
    }
    if directive.name == "safelist" {
        let mut edits = Vec::new();
        for quoted in &directive.quoted_string_ranges {
            let content = source_slice(source, &quoted.content_range)?;
            let text = format_class_list(content);
            if text != content {
                edits.push(LanguageFormatEditIr {
                    range: SourceRange {
                        start: quoted.content_range.start - directive.prelude_range.start,
                        end: quoted.content_range.end - directive.prelude_range.start,
                    },
                    text,
                });
            }
        }
        let formatted = apply_relative_edits(prelude, &edits)?.trim().to_owned();
        return Some(if formatted.is_empty() {
            String::new()
        } else {
            format!(" {formatted}")
        });
    }
    let formatted = prelude.trim();
    Some(if directive.block_range.is_some() {
        if formatted.is_empty() {
            " ".to_owned()
        } else {
            format!(" {formatted} ")
        }
    } else if formatted.is_empty() {
        String::new()
    } else {
        format!(" {formatted}")
    })
}
