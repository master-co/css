#![forbid(unsafe_code)]

use mastercss_schema::SourceRange;

const ASCII_WHITESPACE: [u16; 5] = [0x0009, 0x000a, 0x000c, 0x000d, 0x0020];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ClassListTokenRange {
    pub range: SourceRange,
    pub token: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CssImportStatement {
    pub start: u32,
    pub end: u32,
    pub statement: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CssReferenceStatement {
    pub start: u32,
    pub end: u32,
    pub statement: String,
    pub source: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MasterDirectiveStatement {
    pub start: u32,
    pub end: u32,
    pub name: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StandaloneCssDirectiveStatement {
    pub start: u32,
    pub end: u32,
    pub at_rule_name: String,
    pub name: String,
    pub statement: String,
    pub args: Vec<String>,
    pub modifiers: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CssAtRuleBlock {
    pub start: u32,
    pub end: u32,
    pub name: String,
    pub source: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum CssStatementEndReason {
    Semicolon,
    Block,
    Eof,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct CssStatementEnd {
    end: usize,
    reason: CssStatementEndReason,
}

pub fn utf16_len(value: &str) -> u32 {
    value.encode_utf16().count() as u32
}

pub fn byte_to_utf16_offset(value: &str, byte_offset: usize) -> Option<u32> {
    if byte_offset > value.len() || !value.is_char_boundary(byte_offset) {
        return None;
    }
    Some(utf16_len(&value[..byte_offset]))
}

pub fn utf16_to_byte_offset(value: &str, utf16_offset: u32) -> Option<usize> {
    if utf16_offset == 0 {
        return Some(0);
    }
    let mut current = 0_u32;
    for (byte_offset, character) in value.char_indices() {
        let next = current + character.len_utf16() as u32;
        if next == utf16_offset {
            return Some(byte_offset + character.len_utf8());
        }
        if next > utf16_offset {
            return None;
        }
        current = next;
    }
    (current == utf16_offset).then_some(value.len())
}

pub fn collect_class_list_token_ranges(class_list: &str) -> Vec<ClassListTokenRange> {
    let units: Vec<u16> = class_list.encode_utf16().collect();
    let mut ranges = Vec::new();
    let mut index = 0_usize;
    while index < units.len() {
        while index < units.len() && ASCII_WHITESPACE.contains(&units[index]) {
            index += 1;
        }
        if index == units.len() {
            break;
        }
        let start = index;
        while index < units.len() && !ASCII_WHITESPACE.contains(&units[index]) {
            index += 1;
        }
        let token = String::from_utf16_lossy(&units[start..index]);
        ranges.push(ClassListTokenRange {
            range: SourceRange {
                start: start as u32,
                end: index as u32,
            },
            token,
        });
    }
    ranges
}

pub fn find_css_import_statements(source: &str) -> Vec<CssImportStatement> {
    let mut imports = Vec::new();
    scan_top_level_at_rules(source, |start, name| {
        if name != "import" {
            return None;
        }
        let statement_end = find_css_statement_end(source, start);
        if statement_end.reason != CssStatementEndReason::Semicolon {
            return None;
        }
        imports.push(CssImportStatement {
            start: byte_to_utf16_offset(source, start).unwrap_or_default(),
            end: byte_to_utf16_offset(source, statement_end.end).unwrap_or_default(),
            statement: source[start..statement_end.end].to_owned(),
        });
        Some(statement_end.end)
    });
    imports
}

pub fn parse_css_import_source(statement: &str) -> Option<String> {
    let statement = statement.trim();
    let mut rest = statement.strip_prefix("@import")?;
    if rest
        .chars()
        .next()
        .is_none_or(|character| !character.is_whitespace())
    {
        return None;
    }
    rest = rest.trim_start();
    if let Some(url) = rest.strip_prefix("url(") {
        rest = url.trim_start();
        if let Some(quote) = rest
            .chars()
            .next()
            .filter(|quote| matches!(quote, '\'' | '"'))
        {
            let body = &rest[quote.len_utf8()..];
            return read_quoted(body, quote).map(str::to_owned);
        }
        let end = rest.find(|character: char| character == ')' || character.is_whitespace())?;
        return Some(rest[..end].to_owned());
    }
    let quote = rest
        .chars()
        .next()
        .filter(|quote| matches!(quote, '\'' | '"'))?;
    read_quoted(&rest[quote.len_utf8()..], quote).map(str::to_owned)
}

pub fn find_css_reference_statements(source: &str) -> Vec<CssReferenceStatement> {
    let mut references = Vec::new();
    scan_top_level_at_rules(source, |start, name| {
        if name != "reference" {
            return None;
        }
        let statement_end = find_css_statement_end(source, start);
        if statement_end.reason != CssStatementEndReason::Semicolon {
            return None;
        }
        let statement = &source[start..statement_end.end];
        let prelude = statement
            .strip_prefix("@reference")
            .and_then(|value| value.strip_suffix(';'))
            .map(str::trim)
            .unwrap_or_default();
        let Some(quote) = prelude
            .chars()
            .next()
            .filter(|quote| matches!(quote, '\'' | '"'))
        else {
            return Some(statement_end.end);
        };
        let body = &prelude[quote.len_utf8()..];
        let Some(value) = read_quoted(body, quote) else {
            return Some(statement_end.end);
        };
        let quoted_length = quote.len_utf8() + value.len() + quote.len_utf8();
        if !prelude[quoted_length..].trim().is_empty() {
            return Some(statement_end.end);
        }
        references.push(CssReferenceStatement {
            start: byte_to_utf16_offset(source, start).unwrap_or_default(),
            end: byte_to_utf16_offset(source, statement_end.end).unwrap_or_default(),
            statement: statement.to_owned(),
            source: value.to_owned(),
        });
        Some(statement_end.end)
    });
    references
}

pub fn remove_css_reference_statements(source: &str) -> (String, Vec<CssReferenceStatement>) {
    let references = find_css_reference_statements(source);
    if references.is_empty() {
        return (source.to_owned(), references);
    }
    let mut output = String::with_capacity(source.len());
    let mut byte_index = 0;
    for reference in &references {
        let Some(start) = utf16_to_byte_offset(source, reference.start) else {
            continue;
        };
        let Some(end) = utf16_to_byte_offset(source, reference.end) else {
            continue;
        };
        output.push_str(&source[byte_index..start]);
        byte_index = end;
    }
    output.push_str(&source[byte_index..]);
    (output, references)
}

pub fn find_master_directive_statements(source: &str) -> Vec<MasterDirectiveStatement> {
    let mut statements = Vec::new();
    scan_top_level_at_rules(source, |start, name| {
        if name != "master" {
            return None;
        }
        let statement_end = find_css_statement_end(source, start);
        if statement_end.reason != CssStatementEndReason::Semicolon {
            return None;
        }
        let statement = &source[start..statement_end.end];
        let prelude = statement
            .strip_prefix("@master")
            .and_then(|value| value.strip_suffix(';'))
            .map(str::trim);
        if prelude == Some("entry") {
            statements.push(MasterDirectiveStatement {
                start: byte_to_utf16_offset(source, start).unwrap_or_default(),
                end: byte_to_utf16_offset(source, statement_end.end).unwrap_or_default(),
                name: "entry".into(),
            });
        }
        Some(statement_end.end)
    });
    statements
}

fn parse_quoted_strings(source: &str) -> Vec<String> {
    let mut values = Vec::new();
    let mut index = 0;
    while index < source.len() {
        let character = source[index..].chars().next().unwrap_or_default();
        if !matches!(character, '\'' | '"') {
            index += character.len_utf8();
            continue;
        }
        let quote = character;
        index += quote.len_utf8();
        let mut value = String::new();
        while index < source.len() {
            let character = source[index..].chars().next().unwrap_or_default();
            index += character.len_utf8();
            if character == '\\' {
                if let Some(escaped) = source[index..].chars().next() {
                    value.push(escaped);
                    index += escaped.len_utf8();
                }
            } else if character == quote {
                values.push(value);
                break;
            } else {
                value.push(character);
            }
        }
    }
    values
}

fn parse_unquoted_words(source: &str) -> Vec<String> {
    let mut words = Vec::new();
    let mut word = String::new();
    let mut index = 0;
    while index < source.len() {
        let character = source[index..].chars().next().unwrap_or_default();
        if matches!(character, '\'' | '"') {
            if !word.is_empty() {
                words.push(std::mem::take(&mut word));
            }
            let quote = character;
            index += quote.len_utf8();
            while index < source.len() {
                let character = source[index..].chars().next().unwrap_or_default();
                index += character.len_utf8();
                if character == '\\' {
                    index += source[index..]
                        .chars()
                        .next()
                        .map(char::len_utf8)
                        .unwrap_or_default();
                } else if character == quote {
                    break;
                }
            }
            continue;
        }
        if source[index..].starts_with("/*") {
            if !word.is_empty() {
                words.push(std::mem::take(&mut word));
            }
            index = source[index + 2..]
                .find("*/")
                .map(|offset| index + 2 + offset + 2)
                .unwrap_or(source.len());
            continue;
        }
        if character.is_ascii_alphanumeric() || matches!(character, '-' | '_') {
            word.push(character);
        } else if !word.is_empty() {
            words.push(std::mem::take(&mut word));
        }
        index += character.len_utf8();
    }
    if !word.is_empty() {
        words.push(word);
    }
    words
}

pub fn find_standalone_css_directive_statements(
    source: &str,
) -> Vec<StandaloneCssDirectiveStatement> {
    let mut statements = Vec::new();
    scan_top_level_at_rules(source, |start, name| {
        if !matches!(
            name,
            "master" | "source" | "safelist" | "blocklist" | "preserve"
        ) {
            return None;
        }
        let statement_end = find_css_statement_end(source, start);
        if statement_end.reason != CssStatementEndReason::Semicolon {
            return None;
        }
        let statement = &source[start..statement_end.end];
        let prelude = statement
            .strip_prefix(&format!("@{name}"))
            .and_then(|value| value.strip_suffix(';'))
            .unwrap_or_default();
        if name == "master" && prelude.trim() != "entry" {
            return Some(statement_end.end);
        }
        statements.push(StandaloneCssDirectiveStatement {
            start: byte_to_utf16_offset(source, start).unwrap_or_default(),
            end: byte_to_utf16_offset(source, statement_end.end).unwrap_or_default(),
            at_rule_name: name.to_owned(),
            name: if name == "master" { "entry" } else { name }.to_owned(),
            statement: statement.to_owned(),
            args: parse_quoted_strings(prelude),
            modifiers: parse_unquoted_words(prelude),
        });
        Some(statement_end.end)
    });
    statements
}

pub fn remove_standalone_css_directives(
    source: &str,
) -> (String, Vec<StandaloneCssDirectiveStatement>) {
    let statements = find_standalone_css_directive_statements(source);
    if statements.is_empty() {
        return (source.to_owned(), statements);
    }
    let mut output = String::with_capacity(source.len());
    let mut byte_index = 0;
    for statement in &statements {
        let Some(start) = utf16_to_byte_offset(source, statement.start) else {
            continue;
        };
        let Some(end) = utf16_to_byte_offset(source, statement.end) else {
            continue;
        };
        output.push_str(&source[byte_index..start]);
        byte_index = end;
    }
    output.push_str(&source[byte_index..]);
    (output, statements)
}

pub fn has_master_css_manifest_entrypoint(source: &str) -> bool {
    !find_master_directive_statements(source).is_empty()
        || find_css_import_statements(source).iter().any(|statement| {
            parse_css_import_source(&statement.statement).as_deref() == Some("@master/css")
        })
}

pub fn remove_master_directive_statements(source: &str) -> (String, bool) {
    let statements = find_master_directive_statements(source);
    if statements.is_empty() {
        return (source.to_owned(), false);
    }
    let mut output = String::with_capacity(source.len());
    let mut byte_index = 0;
    for statement in statements {
        let Some(start) = utf16_to_byte_offset(source, statement.start) else {
            continue;
        };
        let Some(end) = utf16_to_byte_offset(source, statement.end) else {
            continue;
        };
        output.push_str(&source[byte_index..start]);
        byte_index = end;
    }
    output.push_str(&source[byte_index..]);
    (output, true)
}

/// Extracts matching top-level at-rule blocks and replaces them with whitespace.
/// Newlines are retained so a subsequent domain parser keeps useful line locations.
pub fn extract_top_level_at_rule_blocks(
    source: &str,
    names: &[&str],
) -> (String, Vec<CssAtRuleBlock>) {
    let mut blocks = Vec::new();
    scan_top_level_at_rules(source, |start, name| {
        if !names
            .iter()
            .any(|candidate| name.eq_ignore_ascii_case(candidate))
        {
            return None;
        }
        let statement_end = find_css_statement_end(source, start);
        if statement_end.reason != CssStatementEndReason::Block {
            return None;
        }
        let end = find_css_block_end(source, statement_end.end)?;
        blocks.push(CssAtRuleBlock {
            start: byte_to_utf16_offset(source, start).unwrap_or_default(),
            end: byte_to_utf16_offset(source, end).unwrap_or_default(),
            name: name.to_owned(),
            source: source[start..end].to_owned(),
        });
        Some(end)
    });
    if blocks.is_empty() {
        return (source.to_owned(), blocks);
    }

    let mut output = String::with_capacity(source.len());
    let mut byte_index = 0;
    for block in &blocks {
        let Some(start) = utf16_to_byte_offset(source, block.start) else {
            continue;
        };
        let Some(end) = utf16_to_byte_offset(source, block.end) else {
            continue;
        };
        output.push_str(&source[byte_index..start]);
        for character in source[start..end].chars() {
            output.push(if character == '\n' { '\n' } else { ' ' });
        }
        byte_index = end;
    }
    output.push_str(&source[byte_index..]);
    (output, blocks)
}

fn scan_top_level_at_rules(source: &str, mut visitor: impl FnMut(usize, &str) -> Option<usize>) {
    let mut index = 0;
    let mut depth = 0_u32;
    let mut quote = None;
    let mut comment = false;
    while index < source.len() {
        let Some(character) = source[index..].chars().next() else {
            break;
        };
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
        if let Some(current_quote) = quote {
            if character == '\\' {
                index = next.map_or(next_index, |next| next_index + next.len_utf8());
            } else {
                if character == current_quote {
                    quote = None;
                }
                index = next_index;
            }
            continue;
        }
        if character == '/' && next == Some('*') {
            comment = true;
            index = next_index + 1;
            continue;
        }
        if matches!(character, '\'' | '"') {
            quote = Some(character);
            index = next_index;
            continue;
        }
        if character == '{' {
            depth += 1;
        } else if character == '}' {
            depth = depth.saturating_sub(1);
        } else if depth == 0 && character == '@' {
            let name_start = next_index;
            let mut name_end = name_start;
            for (offset, character) in source[name_start..].char_indices() {
                if !(character.is_ascii_alphanumeric() || matches!(character, '-' | '_')) {
                    break;
                }
                name_end = name_start + offset + character.len_utf8();
            }
            if name_end > name_start
                && let Some(end) = visitor(index, &source[name_start..name_end])
            {
                index = end;
                continue;
            }
        }
        index = next_index;
    }
}

fn find_css_statement_end(source: &str, start: usize) -> CssStatementEnd {
    let mut index = start;
    let mut depth = 0_u32;
    let mut quote = None;
    let mut comment = false;
    while index < source.len() {
        let Some(character) = source[index..].chars().next() else {
            break;
        };
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
        if let Some(current_quote) = quote {
            if character == '\\' {
                index = next.map_or(next_index, |next| next_index + next.len_utf8());
            } else {
                if character == current_quote {
                    quote = None;
                }
                index = next_index;
            }
            continue;
        }
        if character == '/' && next == Some('*') {
            comment = true;
            index = next_index + 1;
            continue;
        }
        if matches!(character, '\'' | '"') {
            quote = Some(character);
        } else if matches!(character, '(' | '[') {
            depth += 1;
        } else if matches!(character, ')' | ']') {
            depth = depth.saturating_sub(1);
        } else if depth == 0 && character == ';' {
            return CssStatementEnd {
                end: next_index,
                reason: CssStatementEndReason::Semicolon,
            };
        } else if depth == 0 && character == '{' {
            return CssStatementEnd {
                end: index,
                reason: CssStatementEndReason::Block,
            };
        }
        index = next_index;
    }
    CssStatementEnd {
        end: source.len(),
        reason: CssStatementEndReason::Eof,
    }
}

fn find_css_block_end(source: &str, block_start: usize) -> Option<usize> {
    let mut index = block_start;
    let mut depth = 0_u32;
    let mut quote = None;
    let mut comment = false;
    while index < source.len() {
        let character = source[index..].chars().next()?;
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
        if let Some(current_quote) = quote {
            if character == '\\' {
                index = next.map_or(next_index, |next| next_index + next.len_utf8());
            } else {
                if character == current_quote {
                    quote = None;
                }
                index = next_index;
            }
            continue;
        }
        if character == '/' && next == Some('*') {
            comment = true;
            index = next_index + 1;
            continue;
        }
        if matches!(character, '\'' | '"') {
            quote = Some(character);
        } else if character == '{' {
            depth += 1;
        } else if character == '}' {
            depth = depth.checked_sub(1)?;
            if depth == 0 {
                return Some(next_index);
            }
        }
        index = next_index;
    }
    None
}

fn read_quoted(source: &str, quote: char) -> Option<&str> {
    let mut escaped = false;
    for (index, character) in source.char_indices() {
        if escaped {
            escaped = false;
        } else if character == '\\' {
            escaped = true;
        } else if character == quote {
            return Some(&source[..index]);
        }
    }
    None
}

/// CSSOM-compatible identifier escaping, implemented over UTF-16 code units to match
/// `CSS.escape` and the existing JavaScript fallback exactly.
pub fn css_escape(value: &str) -> String {
    let units: Vec<u16> = value.encode_utf16().collect();
    if units.len() == 1 && units[0] == 0x002d {
        return "\\-".into();
    }

    let first = units.first().copied().unwrap_or_default();
    let mut result = String::new();
    for (index, unit) in units.iter().copied().enumerate() {
        if unit == 0 {
            result.push('\u{fffd}');
            continue;
        }
        if (0x0001..=0x001f).contains(&unit)
            || unit == 0x007f
            || (index == 0 && is_ascii_digit_unit(unit))
            || (index == 1 && is_ascii_digit_unit(unit) && first == 0x002d)
        {
            result.push('\\');
            result.push_str(&format!("{unit:x}"));
            result.push(' ');
            continue;
        }
        if unit >= 0x0080
            || unit == 0x002d
            || unit == 0x005f
            || is_ascii_digit_unit(unit)
            || is_ascii_uppercase_unit(unit)
            || is_ascii_lowercase_unit(unit)
        {
            result.push_str(&String::from_utf16_lossy(&[unit]));
            continue;
        }
        result.push('\\');
        result.push_str(&String::from_utf16_lossy(&[unit]));
    }
    result
}

fn is_ascii_digit_unit(value: u16) -> bool {
    (0x0030..=0x0039).contains(&value)
}

fn is_ascii_uppercase_unit(value: u16) -> bool {
    (0x0041..=0x005a).contains(&value)
}

fn is_ascii_lowercase_unit(value: u16) -> bool {
    (0x0061..=0x007a).contains(&value)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matches_existing_css_escape_examples() {
        assert_eq!(css_escape("font:48px"), "font\\:48px");
        assert_eq!(css_escape("1col"), "\\31 col");
        assert_eq!(css_escape("-1col"), "-\\31 col");
        assert_eq!(css_escape("-"), "\\-");
        assert_eq!(css_escape("a b"), "a\\ b");
    }

    #[test]
    fn class_ranges_use_javascript_utf16_offsets() {
        let ranges = collect_class_list_token_ranges("😀a fg:red\u{3000}m:1x");
        assert_eq!(ranges.len(), 2);
        assert_eq!(ranges[0].range, SourceRange { start: 0, end: 3 });
        assert_eq!(ranges[0].token, "😀a");
        assert_eq!(ranges[1].range, SourceRange { start: 4, end: 15 });
        assert_eq!(ranges[1].token, "fg:red\u{3000}m:1x");
    }

    #[test]
    fn converts_only_valid_utf16_boundaries() {
        let value = "a😀b";
        assert_eq!(byte_to_utf16_offset(value, 1), Some(1));
        assert_eq!(byte_to_utf16_offset(value, 5), Some(3));
        assert_eq!(utf16_to_byte_offset(value, 1), Some(1));
        assert_eq!(utf16_to_byte_offset(value, 2), None);
        assert_eq!(utf16_to_byte_offset(value, 3), Some(5));
    }

    #[test]
    fn finds_top_level_imports_and_parses_quoted_semicolons() {
        let source = [
            "@import url(\"@master/css\") layer(theme);",
            ".x { content: \"@import url(\\\"ignored\\\");\" }",
            "@import \"./a;b.css\";",
        ]
        .join("\n");
        let imports = find_css_import_statements(&source);
        assert_eq!(imports.len(), 2);
        assert_eq!(
            imports
                .iter()
                .map(|item| parse_css_import_source(&item.statement))
                .collect::<Vec<_>>(),
            vec![Some("@master/css".into()), Some("./a;b.css".into())]
        );
    }

    #[test]
    fn finds_removes_and_ranges_master_entry_directives_in_utf16() {
        let source = "😀\n@master entry;\n@source \"./x.css\";\n.a{}";
        let statements = find_master_directive_statements(source);
        assert_eq!(statements.len(), 1);
        assert_eq!(statements[0].start, 3);
        assert_eq!(statements[0].end, 17);
        assert!(has_master_css_manifest_entrypoint(source));
        assert_eq!(
            remove_master_directive_statements(source),
            ("😀\n\n@source \"./x.css\";\n.a{}".into(), true)
        );
    }

    #[test]
    fn parses_and_removes_top_level_extraction_policy_directives() {
        let source = "/*😀*/ @source not \"vendor/**\"; @safelist \"flex fg:red\"; .x{@source \"nested\";} @preserve native;";
        let statements = find_standalone_css_directive_statements(source);
        assert_eq!(
            statements
                .iter()
                .map(|statement| statement.at_rule_name.as_str())
                .collect::<Vec<_>>(),
            ["source", "safelist", "preserve"]
        );
        assert_eq!(statements[0].args, ["vendor/**"]);
        assert_eq!(statements[0].modifiers, ["not"]);
        let (remaining, _) = remove_standalone_css_directives(source);
        assert_eq!(remaining, "/*😀*/   .x{@source \"nested\";} ");
    }

    #[test]
    fn ignores_non_entry_and_nested_master_syntax() {
        let source = "@master;\n@master global;\n.x{@master entry;}\n/* @master entry; */";
        assert!(find_master_directive_statements(source).is_empty());
        assert!(!has_master_css_manifest_entrypoint(source));
    }

    #[test]
    fn extracts_only_top_level_keyframe_blocks_without_losing_lines() {
        let source = "--color: red;\n@keyframes fade {\n  from { content: '}'; }\n  to { opacity: 1; }\n}\n--spacing: 1rem;";
        let (declarations, blocks) =
            extract_top_level_at_rule_blocks(source, &["keyframes", "-webkit-keyframes"]);
        assert_eq!(blocks.len(), 1);
        assert_eq!(blocks[0].name, "keyframes");
        assert!(blocks[0].source.starts_with("@keyframes fade"));
        assert_eq!(declarations.lines().count(), source.lines().count());
        assert!(declarations.contains("--color: red;"));
        assert!(declarations.contains("--spacing: 1rem;"));
        assert!(!declarations.contains("@keyframes"));
    }
}
