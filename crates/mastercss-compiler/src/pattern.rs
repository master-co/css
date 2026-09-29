use super::{
    CompilerError, CssDirectiveConditionPathEntry, PrinterOptions, ToCss, css_comment_end,
    css_quote_end, next_char_end,
};

pub(crate) fn css_block_end(source: &str, open: usize, limit: usize) -> Option<usize> {
    let mut index = open + 1;
    let mut depth = 1_u32;
    while index < limit {
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
            '{' => depth += 1,
            '}' => {
                depth -= 1;
                if depth == 0 {
                    return Some(index);
                }
            }
            _ => {}
        }
        index = next_char_end(source, index);
    }
    None
}

pub(crate) fn css_statement_delimiter(
    source: &str,
    start: usize,
    limit: usize,
) -> Option<(usize, char)> {
    let mut index = start;
    let mut parentheses = 0_u32;
    let mut square = 0_u32;
    while index < limit {
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
            '(' => parentheses += 1,
            ')' => parentheses = parentheses.saturating_sub(1),
            '[' => square += 1,
            ']' => square = square.saturating_sub(1),
            ';' | '{' if parentheses == 0 && square == 0 => return Some((index, character)),
            _ => {}
        }
        index = next_char_end(source, index);
    }
    None
}

pub(crate) fn minified_css<T: ToCss>(value: &T, filename: &str) -> Result<String, CompilerError> {
    value
        .to_css_string(PrinterOptions {
            minify: true,
            ..PrinterOptions::default()
        })
        .map_err(|error| CompilerError::Print {
            message: error.to_string(),
            filename: filename.to_owned(),
        })
}

pub(crate) fn condition_properties(
    path: &[CssDirectiveConditionPathEntry],
) -> (
    Option<Vec<String>>,
    Option<Vec<CssDirectiveConditionPathEntry>>,
) {
    if path.is_empty() {
        return (None, None);
    }
    let conditions = path
        .iter()
        .map(|entry| match entry {
            CssDirectiveConditionPathEntry::Condition { value } => Some(value.clone()),
        })
        .collect::<Option<Vec<_>>>();
    (conditions, Some(path.to_vec()))
}
