#![forbid(unsafe_code)]

use mastercss_schema::{LEXER_BATCH_VERSION, SourceRange};
use serde::{Deserialize, Serialize};

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

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CssQuotedStringRange {
    pub range: SourceRange,
    pub content_range: SourceRange,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CssDirectiveRange {
    pub range: SourceRange,
    pub name: String,
    pub prelude_range: SourceRange,
    pub block_range: Option<SourceRange>,
    pub quoted_string_ranges: Vec<CssQuotedStringRange>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CssFunction {
    pub body: String,
    pub end: u32,
    pub text: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CssDeclarationRange {
    pub property_range: SourceRange,
    pub value_range: SourceRange,
    pub terminator_range: Option<SourceRange>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LexerClassListInputIr {
    pub source: String,
    #[serde(default)]
    pub unescape: Vec<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LexerBatchRequestIr {
    #[serde(default)]
    pub class_lists: Vec<LexerClassListInputIr>,
    #[serde(default)]
    pub css_sources: Vec<String>,
    #[serde(default)]
    pub escape_identifiers: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LexerClassListItemIr {
    pub range: SourceRange,
    pub raw: String,
    pub token: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LexerCssDirectiveIr {
    pub name: String,
    pub range: SourceRange,
    pub prelude_range: SourceRange,
    pub has_block: bool,
    pub quoted_strings: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LexerCssImportIr {
    pub range: SourceRange,
    pub statement: String,
    pub source: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LexerCssAnalysisIr {
    pub directives: Vec<LexerCssDirectiveIr>,
    pub imports: Vec<LexerCssImportIr>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LexerBatchIr {
    pub version: u32,
    pub class_lists: Vec<Vec<LexerClassListItemIr>>,
    pub css_sources: Vec<LexerCssAnalysisIr>,
    pub escaped_identifiers: Vec<String>,
}

pub fn analyze_lexer_batch(request: &LexerBatchRequestIr) -> LexerBatchIr {
    LexerBatchIr {
        version: LEXER_BATCH_VERSION,
        class_lists: request
            .class_lists
            .iter()
            .map(|input| {
                collect_class_list_token_ranges(&input.source)
                    .into_iter()
                    .map(|item| LexerClassListItemIr {
                        range: item.range,
                        token: input
                            .unescape
                            .iter()
                            .fold(item.token.clone(), |token, character| {
                                token.replace(&format!("\\{character}"), character)
                            }),
                        raw: item.token,
                    })
                    .collect()
            })
            .collect(),
        css_sources: request
            .css_sources
            .iter()
            .map(|source| LexerCssAnalysisIr {
                directives: find_css_directive_ranges(source)
                    .into_iter()
                    .map(|directive| LexerCssDirectiveIr {
                        name: directive.name,
                        range: directive.range,
                        prelude_range: directive.prelude_range,
                        has_block: directive.block_range.is_some(),
                        quoted_strings: directive.quoted_string_ranges.len() as u32,
                    })
                    .collect(),
                imports: find_css_import_statements(source)
                    .into_iter()
                    .map(|statement| LexerCssImportIr {
                        range: SourceRange {
                            start: statement.start,
                            end: statement.end,
                        },
                        source: parse_css_import_source(&statement.statement),
                        statement: statement.statement,
                    })
                    .collect(),
            })
            .collect(),
        escaped_identifiers: request
            .escape_identifiers
            .iter()
            .map(|identifier| css_escape(identifier))
            .collect(),
    }
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

#[derive(Debug, Clone, Copy)]
struct CssVariableReference<'a> {
    name: &'a str,
    text: &'a str,
    end: usize,
}

/// Collects syntactically active CSS custom-property references in source order.
///
/// References inside strings and comments are ignored. Nested fallback references
/// are collected independently from their containing `var()` function.
pub fn collect_css_variable_references(source: &str) -> Vec<String> {
    let mut references = Vec::new();
    let mut index = 0;
    while index < source.len() {
        if let Some(end) = skip_css_string_or_comment(source, index) {
            index = end;
            continue;
        }
        if let Some(reference) = read_css_variable_reference(source, index)
            && !references.iter().any(|existing| existing == reference.name)
        {
            references.push(reference.name.to_owned());
        }
        index += source[index..].chars().next().map_or(1, char::len_utf8);
    }
    references
}

/// Replaces syntactically active CSS custom-property references.
///
/// The replacer receives the custom-property name without `--` and the complete
/// `var()` text, including any fallback. Returning `None` preserves the original
/// reference and skips replacements inside its fallback.
pub fn transform_css_variable_references<E>(
    source: &str,
    mut replacer: impl FnMut(&str, &str) -> Result<Option<String>, E>,
) -> Result<String, E> {
    let mut output = String::with_capacity(source.len());
    let mut index = 0;
    let mut copied_until = 0;
    while index < source.len() {
        if let Some(end) = skip_css_string_or_comment(source, index) {
            index = end;
            continue;
        }
        if let Some(reference) = read_css_variable_reference(source, index) {
            output.push_str(&source[copied_until..index]);
            output.push_str(
                replacer(reference.name, reference.text)?
                    .as_deref()
                    .unwrap_or(reference.text),
            );
            index = reference.end;
            copied_until = index;
            continue;
        }
        index += source[index..].chars().next().map_or(1, char::len_utf8);
    }
    output.push_str(&source[copied_until..]);
    Ok(output)
}

fn read_css_variable_reference(source: &str, start: usize) -> Option<CssVariableReference<'_>> {
    let prefix = source.get(start..start + 4)?;
    if !prefix.eq_ignore_ascii_case("var(")
        || source[..start]
            .chars()
            .next_back()
            .is_some_and(is_css_identifier_character)
    {
        return None;
    }
    let mut cursor = start + 4;
    while source[cursor..]
        .chars()
        .next()
        .is_some_and(|character| character.is_ascii_whitespace())
    {
        cursor += 1;
    }
    if source.get(cursor..cursor + 2)? != "--" {
        return None;
    }
    cursor += 2;
    let name_start = cursor;
    while source[cursor..]
        .chars()
        .next()
        .is_some_and(is_css_variable_name_character)
    {
        cursor += 1;
    }
    if cursor == name_start {
        return None;
    }
    let mut index = cursor;
    let mut depth = 1_u32;
    while index < source.len() {
        if let Some(end) = skip_css_string_or_comment(source, index) {
            index = end;
            continue;
        }
        let character = source[index..].chars().next()?;
        index += character.len_utf8();
        if character == '(' {
            depth += 1;
        } else if character == ')' {
            depth -= 1;
            if depth == 0 {
                return Some(CssVariableReference {
                    name: &source[name_start..cursor],
                    text: &source[start..index],
                    end: index,
                });
            }
        }
    }
    None
}

fn skip_css_string_or_comment(source: &str, start: usize) -> Option<usize> {
    let character = source[start..].chars().next()?;
    if matches!(character, '"' | '\'') {
        let mut escaped = false;
        for (offset, next) in source[start + character.len_utf8()..].char_indices() {
            if escaped {
                escaped = false;
            } else if next == '\\' {
                escaped = true;
            } else if next == character {
                return Some(start + character.len_utf8() + offset + next.len_utf8());
            }
        }
        return Some(source.len());
    }
    if source[start..].starts_with("/*") {
        return Some(
            source[start + 2..]
                .find("*/")
                .map_or(source.len(), |offset| start + 2 + offset + 2),
        );
    }
    None
}

fn is_css_identifier_character(character: char) -> bool {
    character == '-'
        || character == '_'
        || character.is_ascii_alphanumeric()
        || !character.is_ascii()
}

fn is_css_variable_name_character(character: char) -> bool {
    character == '-' || character == '_' || character.is_ascii_alphanumeric()
}

pub fn read_css_function(source: &str, start: u32, name: &str) -> Option<CssFunction> {
    let start = utf16_to_byte_offset(source, start)?;
    let open = start.checked_add(name.len())?;
    if source.get(start..open)? != name || source.get(open..open + 1)? != "(" {
        return None;
    }
    let mut index = open + 1;
    let mut depth = 1_u32;
    while index < source.len() {
        if let Some(end) = skip_css_string_or_comment(source, index) {
            index = end;
            continue;
        }
        let character = source[index..].chars().next()?;
        index += character.len_utf8();
        if character == '(' {
            depth += 1;
        } else if character == ')' {
            depth -= 1;
            if depth == 0 {
                return Some(CssFunction {
                    body: source[open + 1..index - 1].to_owned(),
                    end: byte_to_utf16_offset(source, index)?,
                    text: source[start..index].to_owned(),
                });
            }
        }
    }
    None
}

fn trim_byte_range(source: &str, mut start: usize, mut end: usize) -> (usize, usize) {
    while start < end
        && source[start..]
            .chars()
            .next()
            .is_some_and(char::is_whitespace)
    {
        start += source[start..].chars().next().map_or(1, char::len_utf8);
    }
    while start < end
        && source[..end]
            .chars()
            .next_back()
            .is_some_and(char::is_whitespace)
    {
        end -= source[..end].chars().next_back().map_or(1, char::len_utf8);
    }
    (start, end)
}

fn declaration_from_segment(
    source: &str,
    start: usize,
    end: usize,
    terminator: Option<usize>,
) -> Option<CssDeclarationRange> {
    let (start, end) = trim_byte_range(source, start, end);
    if start == end || source[start..].starts_with('@') {
        return None;
    }
    let mut index = start;
    let mut colon = None;
    while index < end {
        if let Some(skip) = skip_css_string_or_comment(source, index) {
            index = skip.min(end);
            continue;
        }
        let character = source[index..].chars().next()?;
        if character == ':' {
            colon = Some(index);
            break;
        }
        index += character.len_utf8();
    }
    let colon = colon?;
    let (property_start, property_end) = trim_byte_range(source, start, colon);
    let (value_start, value_end) = trim_byte_range(source, colon + 1, end);
    if property_start == property_end || value_start == value_end {
        return None;
    }
    Some(CssDeclarationRange {
        property_range: SourceRange {
            start: byte_to_utf16_offset(source, property_start)?,
            end: byte_to_utf16_offset(source, property_end)?,
        },
        value_range: SourceRange {
            start: byte_to_utf16_offset(source, value_start)?,
            end: byte_to_utf16_offset(source, value_end)?,
        },
        terminator_range: terminator.map(|offset| SourceRange {
            start: byte_to_utf16_offset(source, offset).unwrap_or_default(),
            end: byte_to_utf16_offset(source, offset + 1).unwrap_or_default(),
        }),
    })
}

pub fn collect_css_declaration_ranges(
    source: &str,
    block_start: u32,
    block_end: u32,
) -> Vec<CssDeclarationRange> {
    let Some(start) = utf16_to_byte_offset(source, block_start) else {
        return Vec::new();
    };
    let Some(end) = utf16_to_byte_offset(source, block_end) else {
        return Vec::new();
    };
    let mut declarations = Vec::new();
    let mut segment_start = start;
    let mut index = start;
    let mut depth = 0_u32;
    while index < end {
        if let Some(skip) = skip_css_string_or_comment(source, index) {
            index = skip.min(end);
            continue;
        }
        let Some(character) = source[index..].chars().next() else {
            break;
        };
        let next = index + character.len_utf8();
        if character == '{' {
            depth += 1;
        } else if character == '}' && depth > 0 {
            depth -= 1;
            if depth == 0 {
                segment_start = next;
            }
        } else if character == ';' && depth == 0 {
            if let Some(declaration) =
                declaration_from_segment(source, segment_start, index, Some(index))
            {
                declarations.push(declaration);
            }
            segment_start = next;
        }
        index = next;
    }
    if let Some(declaration) = declaration_from_segment(source, segment_start, end, None) {
        declarations.push(declaration);
    }
    declarations
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

pub fn collect_class_list_cursor_ranges(class_list: &str) -> Vec<SourceRange> {
    let units: Vec<u16> = class_list.encode_utf16().collect();
    let mut ranges = collect_class_list_token_ranges(class_list)
        .into_iter()
        .map(|item| item.range)
        .collect::<Vec<_>>();
    ranges.extend(
        units
            .iter()
            .enumerate()
            .filter(|(_, unit)| ASCII_WHITESPACE.contains(unit))
            .map(|(index, _)| SourceRange {
                start: index as u32,
                end: index as u32,
            }),
    );
    if units
        .last()
        .is_some_and(|unit| ASCII_WHITESPACE.contains(unit))
    {
        ranges.push(SourceRange {
            start: units.len() as u32,
            end: units.len() as u32,
        });
    }
    ranges.sort_by_key(|range| (range.start, u32::from(range.start == range.end)));
    ranges
}

pub fn find_css_directive_ranges(source: &str) -> Vec<CssDirectiveRange> {
    const NAMES: [&str; 17] = [
        "master",
        "settings",
        "source",
        "safelist",
        "blocklist",
        "preserve",
        "reference",
        "theme",
        "defaults",
        "components",
        "utilities",
        "custom-variant",
        "compose",
        "variant",
        "slot",
        "dark",
        "light",
    ];

    let mut ranges = Vec::new();
    let mut index = 0;
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
        if character != '@' {
            index = next_index;
            continue;
        }

        let name_start = next_index;
        let mut name_end = name_start;
        for (offset, name_character) in source[name_start..].char_indices() {
            if !(name_character.is_ascii_alphanumeric() || matches!(name_character, '-' | '_')) {
                break;
            }
            name_end = name_start + offset + name_character.len_utf8();
        }
        let raw_name = &source[name_start..name_end];
        if !NAMES.contains(&raw_name) {
            index = next_index;
            continue;
        }

        let statement_end = find_css_statement_end(source, name_end);
        let prelude_end = match statement_end.reason {
            CssStatementEndReason::Semicolon => statement_end.end.saturating_sub(1),
            CssStatementEndReason::Block | CssStatementEndReason::Eof => statement_end.end,
        };
        if raw_name == "master" && source[name_end..prelude_end].trim() != "entry" {
            index = next_index;
            continue;
        }
        let end = if statement_end.reason == CssStatementEndReason::Block {
            find_css_block_end(source, statement_end.end).unwrap_or(source.len())
        } else {
            statement_end.end
        };
        let block_range =
            (statement_end.reason == CssStatementEndReason::Block).then(|| SourceRange {
                start: byte_to_utf16_offset(source, statement_end.end).unwrap_or_default(),
                end: byte_to_utf16_offset(source, end).unwrap_or_default(),
            });
        ranges.push(CssDirectiveRange {
            range: SourceRange {
                start: byte_to_utf16_offset(source, index).unwrap_or_default(),
                end: byte_to_utf16_offset(source, end).unwrap_or_default(),
            },
            name: if matches!(raw_name, "dark" | "light") {
                "variant".to_owned()
            } else {
                raw_name.to_owned()
            },
            prelude_range: SourceRange {
                start: byte_to_utf16_offset(source, name_end).unwrap_or_default(),
                end: byte_to_utf16_offset(source, prelude_end).unwrap_or_default(),
            },
            block_range,
            quoted_string_ranges: find_css_quoted_string_ranges(source, name_end, prelude_end),
        });
        if statement_end.reason == CssStatementEndReason::Semicolon {
            index = statement_end.end;
        } else {
            index = next_index;
        }
    }
    ranges
}

fn find_css_quoted_string_ranges(
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

pub fn escape_regexp(value: &str) -> String {
    let mut output = String::with_capacity(value.len());
    for character in value.chars() {
        if matches!(
            character,
            '\\' | '^' | '$' | '.' | '*' | '+' | '?' | '(' | ')' | '[' | ']' | '{' | '}' | '|'
        ) {
            output.push('\\');
        }
        output.push(character);
    }
    output
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

    struct LexerParityCorpus {
        parser_cases: Vec<LexerParityCase>,
    }

    struct LexerParityCase {
        source_id: String,
        input: String,
        expected_canonical: String,
    }

    fn lexer_parity_case(
        source_id: &str,
        input: &str,
        expected_canonical: &str,
    ) -> LexerParityCase {
        LexerParityCase {
            source_id: source_id.into(),
            input: input.into(),
            expected_canonical: expected_canonical.into(),
        }
    }

    fn slice_utf16<'a>(source: &'a str, range: &SourceRange) -> &'a str {
        let start = utf16_to_byte_offset(source, range.start).unwrap();
        let end = utf16_to_byte_offset(source, range.end).unwrap();
        &source[start..end]
    }

    fn directive_depth(source: &str, range: &SourceRange) -> u32 {
        let end = utf16_to_byte_offset(source, range.start).unwrap();
        let mut depth = 0_u32;
        let mut index = 0;
        while index < end {
            if let Some(skip) = skip_css_string_or_comment(source, index) {
                index = skip.min(end);
                continue;
            }
            let character = source[index..].chars().next().unwrap();
            if character == '{' {
                depth += 1;
            } else if character == '}' {
                depth = depth.saturating_sub(1);
            }
            index += character.len_utf8();
        }
        depth
    }

    #[test]
    fn executes_rc87_lexer_parity_corpus() {
        let corpus_source = include_str!("../../../parity/rust-semantic-corpus.json");
        let corpus = LexerParityCorpus {
            parser_cases: vec![
                lexer_parity_case("rc87-f388e6c161004b97", "  block\tfg:red\nm:1x ", "ranges"),
                lexer_parity_case("rc87-6d5d386f580d29af", "block\u{3000}fg:red", "one token"),
                lexer_parity_case(
                    "rc87-167ae2709f22cd6d",
                    "content:\\'\\' block|content:\\`\\`",
                    "unescaped",
                ),
                lexer_parity_case(
                    "rc87-9548ae64df5ed481",
                    " block  fg:red\u{3000}m:1x ",
                    "ranges",
                ),
                lexer_parity_case(
                    "rc87-7de028667721a877",
                    "@import url(\"@master/css\") layer(theme);\n.x { content: \"@import url(\\\"ignored\\\");\" }\n@import \"./a;b.css\";",
                    "imports",
                ),
                lexer_parity_case("rc87-80cea11f6437844e", "manifest entrypoints", "booleans"),
                lexer_parity_case(
                    "rc87-c338962e34e07c1c",
                    "@master entry;\n@source \"./x.css\";\n.a{}",
                    "\n@source \"./x.css\";\n.a{}",
                ),
                lexer_parity_case(
                    "rc87-85fe07eee3ea650e",
                    "@master;\n@master global;\n@master shake;\n@master no-shake;\n.a{}",
                    "unchanged",
                ),
                lexer_parity_case(
                    "rc87-a99556d32ad12a9b",
                    ".quoted { content: \"var(--color-blue-60)\"; }\n/* var(--color-red-60) */\n.real { color: var(--color-green-60); }\n.fallback { color: var(--color-brand, var(--color-green-60)); }",
                    "references",
                ),
                lexer_parity_case(
                    "rc87-4d294d715eb82c2d",
                    "--alpha(var(--color-brand, \"a)b\") / calc(100% - 20% /* ) */))",
                    "balanced",
                ),
                lexer_parity_case(
                    "rc87-9ccb1609c26acb3a",
                    ".quoted { content: \"var(--color-blue-60)\"; }\n/* var(--color-red-60) */\n.real { color: var(--color-green-60); }",
                    "replaced",
                ),
                lexer_parity_case(
                    "rc87-c853daf53b370443",
                    "@source \"a;b.css\";\n@theme { --color-primary: red; @keyframes fade { to { opacity: 1; } } }",
                    "ranges",
                ),
                lexer_parity_case(
                    "rc87-9e23b9ca5eba0b7f",
                    "@reference \"./a;b.css\";\n@layer components { .btn { @reference \"./nested.css\"; } }",
                    "ranges",
                ),
                lexer_parity_case(
                    "rc87-cd1d137ee89e9efb",
                    "@layer components { .btn { @compose block; @variant <sm { @compose hidden; } } }",
                    "directives",
                ),
                lexer_parity_case(
                    "rc87-0ecc38899002a5db",
                    ".card { @dark { @compose fg:white; } @light { color: black; } }",
                    "variants",
                ),
                lexer_parity_case(
                    "rc87-bf007c1edf054a11",
                    "@custom-variant motion-safe { @media (prefers-reduced-motion: no-preference) { @slot; } }",
                    "directives",
                ),
                lexer_parity_case(
                    "rc87-8b8911fa6dc3e148",
                    "@components { btn { @compose block; } }",
                    "directives",
                ),
                lexer_parity_case(
                    "rc87-2f3cc1f8149e5aac",
                    "@utility text-<left|center|right> { text-align: --value(); }",
                    "none",
                ),
                lexer_parity_case(
                    "rc87-0200c9f8cb24fb9e",
                    "@theme { --content: \"a;b\"; --root-size: 16 }",
                    "declarations",
                ),
                lexer_parity_case(
                    "rc87-9e290a26e4a4bcd2",
                    "@theme { --color-primary: red; @keyframes fade { to { opacity: 1; } } --duration-fast: 150ms }",
                    "declarations",
                ),
                lexer_parity_case("rc87-8825de071b213b2d", "@theme dark", "eof"),
                lexer_parity_case(
                    "rc87-a16dfb59baf769b1",
                    "font:48px|1col|-1col|-|a b",
                    "escaped",
                ),
                lexer_parity_case("rc87-e84fc87f66b88072", "a.b[c]", "a\\.b\\[c\\]"),
            ],
        };
        let mut executed = 0;
        for case in corpus.parser_cases {
            assert!(corpus_source.contains(&format!("\"sourceId\": \"{}\"", case.source_id)));
            assert!(!case.input.is_empty());
            assert!(!case.expected_canonical.is_empty());
            executed += 1;
            match case.source_id.as_str() {
                "rc87-f388e6c161004b97" => {
                    let ranges = collect_class_list_token_ranges(&case.input);
                    assert_eq!(
                        ranges,
                        [
                            ClassListTokenRange {
                                range: SourceRange { start: 2, end: 7 },
                                token: "block".into()
                            },
                            ClassListTokenRange {
                                range: SourceRange { start: 8, end: 14 },
                                token: "fg:red".into()
                            },
                            ClassListTokenRange {
                                range: SourceRange { start: 15, end: 19 },
                                token: "m:1x".into()
                            },
                        ]
                    );
                }
                "rc87-6d5d386f580d29af" => {
                    let ranges = collect_class_list_token_ranges(&case.input);
                    assert_eq!(ranges.len(), 1);
                    assert_eq!(ranges[0].token, "block\u{3000}fg:red");
                    assert_eq!(ranges[0].range, SourceRange { start: 0, end: 12 });
                }
                "rc87-167ae2709f22cd6d" => {
                    let result = analyze_lexer_batch(&LexerBatchRequestIr {
                        class_lists: vec![
                            LexerClassListInputIr {
                                source: "content:\\'\\' block".into(),
                                unescape: vec!["'".into()],
                            },
                            LexerClassListInputIr {
                                source: "content:\\`\\`".into(),
                                unescape: vec!["`".into()],
                            },
                        ],
                        ..LexerBatchRequestIr::default()
                    });
                    assert_eq!(result.class_lists[0][0].raw, "content:\\'\\'");
                    assert_eq!(result.class_lists[0][0].token, "content:''");
                    assert_eq!(result.class_lists[1][0].token, "content:``");
                }
                "rc87-9548ae64df5ed481" => {
                    let ranges = collect_class_list_token_ranges(&case.input);
                    assert_eq!(ranges[0].range, SourceRange { start: 1, end: 6 });
                    assert_eq!(ranges[1].range, SourceRange { start: 8, end: 19 });
                    assert_eq!(ranges[1].token, "fg:red\u{3000}m:1x");
                }
                "rc87-7de028667721a877" => {
                    let imports = find_css_import_statements(&case.input);
                    assert_eq!(imports.len(), 2);
                    assert_eq!(
                        imports[0].statement,
                        "@import url(\"@master/css\") layer(theme);"
                    );
                    assert_eq!(imports[1].statement, "@import \"./a;b.css\";");
                    assert_eq!(
                        parse_css_import_source(&imports[0].statement).as_deref(),
                        Some("@master/css")
                    );
                    assert_eq!(
                        parse_css_import_source(&imports[1].statement).as_deref(),
                        Some("./a;b.css")
                    );
                }
                "rc87-80cea11f6437844e" => {
                    assert!(has_master_css_manifest_entrypoint("@master entry;"));
                    assert!(has_master_css_manifest_entrypoint(
                        "@import \"@master/css\";"
                    ));
                    assert!(!has_master_css_manifest_entrypoint("@master;"));
                    assert!(!has_master_css_manifest_entrypoint("@master global;"));
                }
                "rc87-c338962e34e07c1c" => {
                    let source = &case.input;
                    assert!(has_master_css_manifest_entrypoint(source));
                    assert_eq!(find_master_directive_statements(source)[0].name, "entry");
                    assert_eq!(
                        remove_master_directive_statements(source),
                        (case.expected_canonical, true)
                    );
                }
                "rc87-85fe07eee3ea650e" => {
                    assert!(!has_master_css_manifest_entrypoint(&case.input));
                    assert!(find_master_directive_statements(&case.input).is_empty());
                    assert_eq!(
                        remove_master_directive_statements(&case.input),
                        (case.input, false)
                    );
                }
                "rc87-a99556d32ad12a9b" => {
                    assert_eq!(
                        collect_css_variable_references(&case.input),
                        ["color-green-60", "color-brand"]
                    );
                }
                "rc87-4d294d715eb82c2d" => {
                    let function = read_css_function(&case.input, 0, "--alpha").unwrap();
                    assert_eq!(
                        function.body,
                        "var(--color-brand, \"a)b\") / calc(100% - 20% /* ) */)"
                    );
                    assert_eq!(function.end, 61);
                    assert_eq!(function.text, case.input);
                }
                "rc87-9ccb1609c26acb3a" => {
                    let output = transform_css_variable_references(&case.input, |name, _| {
                        Ok::<_, ()>(Some(format!("token({name})")))
                    })
                    .unwrap();
                    assert_eq!(
                        output,
                        [
                            ".quoted { content: \"var(--color-blue-60)\"; }",
                            "/* var(--color-red-60) */",
                            ".real { color: token(color-green-60); }",
                        ]
                        .join("\n")
                    );
                }
                "rc87-c853daf53b370443" => {
                    let ranges = find_css_directive_ranges(&case.input);
                    assert_eq!(
                        ranges
                            .iter()
                            .map(|range| range.name.as_str())
                            .collect::<Vec<_>>(),
                        ["source", "theme"]
                    );
                    assert_eq!(
                        slice_utf16(
                            &case.input,
                            &ranges[0].quoted_string_ranges[0].content_range
                        ),
                        "a;b.css"
                    );
                    assert!(ranges[1].block_range.is_some());
                    assert_eq!(
                        slice_utf16(
                            &case.input,
                            &SourceRange {
                                start: ranges[1].block_range.as_ref().unwrap().start,
                                end: ranges[1].block_range.as_ref().unwrap().start + 1
                            }
                        ),
                        "{"
                    );
                    assert_eq!(
                        slice_utf16(
                            &case.input,
                            &SourceRange {
                                start: ranges[1].block_range.as_ref().unwrap().end - 1,
                                end: ranges[1].block_range.as_ref().unwrap().end
                            }
                        ),
                        "}"
                    );
                }
                "rc87-9e23b9ca5eba0b7f" => {
                    let ranges = find_css_directive_ranges(&case.input);
                    assert_eq!(
                        ranges
                            .iter()
                            .map(|range| range.name.as_str())
                            .collect::<Vec<_>>(),
                        ["reference", "reference"]
                    );
                    assert_eq!(directive_depth(&case.input, &ranges[0].range), 0);
                    assert_eq!(directive_depth(&case.input, &ranges[1].range), 2);
                    assert_eq!(
                        slice_utf16(
                            &case.input,
                            &ranges[0].quoted_string_ranges[0].content_range
                        ),
                        "./a;b.css"
                    );
                }
                "rc87-cd1d137ee89e9efb" => {
                    let ranges = find_css_directive_ranges(&case.input);
                    assert_eq!(
                        ranges
                            .iter()
                            .map(|range| range.name.as_str())
                            .collect::<Vec<_>>(),
                        ["compose", "variant", "compose"]
                    );
                    assert_eq!(
                        slice_utf16(&case.input, &ranges[1].prelude_range).trim(),
                        "<sm"
                    );
                    assert_eq!(
                        slice_utf16(&case.input, &ranges[2].prelude_range).trim(),
                        "hidden"
                    );
                }
                "rc87-0ecc38899002a5db" => {
                    let ranges = find_css_directive_ranges(&case.input);
                    assert_eq!(
                        ranges
                            .iter()
                            .map(|range| range.name.as_str())
                            .collect::<Vec<_>>(),
                        ["variant", "compose", "variant"]
                    );
                    assert!(slice_utf16(&case.input, &ranges[0].range).starts_with("@dark"));
                    assert!(slice_utf16(&case.input, &ranges[2].range).starts_with("@light"));
                }
                "rc87-bf007c1edf054a11" => {
                    let ranges = find_css_directive_ranges(&case.input);
                    assert_eq!(
                        ranges
                            .iter()
                            .map(|range| range.name.as_str())
                            .collect::<Vec<_>>(),
                        ["custom-variant", "slot"]
                    );
                    assert_eq!(slice_utf16(&case.input, &ranges[1].range), "@slot;");
                }
                "rc87-8b8911fa6dc3e148" => {
                    let ranges = find_css_directive_ranges(&case.input);
                    assert_eq!(
                        ranges
                            .iter()
                            .map(|range| range.name.as_str())
                            .collect::<Vec<_>>(),
                        ["components", "compose"]
                    );
                    assert_eq!(
                        slice_utf16(&case.input, &ranges[1].prelude_range).trim(),
                        "block"
                    );
                }
                "rc87-2f3cc1f8149e5aac" => {
                    assert!(find_css_directive_ranges(&case.input).is_empty())
                }
                "rc87-0200c9f8cb24fb9e" => {
                    let start = utf16_len(&case.input[..case.input.find('{').unwrap() + 1]);
                    let end = utf16_len(&case.input[..case.input.rfind('}').unwrap()]);
                    let ranges = collect_css_declaration_ranges(&case.input, start, end);
                    assert_eq!(
                        ranges
                            .iter()
                            .map(|range| slice_utf16(&case.input, &range.property_range))
                            .collect::<Vec<_>>(),
                        ["--content", "--root-size"]
                    );
                    assert_eq!(slice_utf16(&case.input, &ranges[0].value_range), "\"a;b\"");
                    assert!(ranges[0].terminator_range.is_some());
                }
                "rc87-9e290a26e4a4bcd2" => {
                    let start = utf16_len(&case.input[..case.input.find('{').unwrap() + 1]);
                    let end = utf16_len(&case.input[..case.input.rfind('}').unwrap()]);
                    let ranges = collect_css_declaration_ranges(&case.input, start, end);
                    assert_eq!(
                        ranges
                            .iter()
                            .map(|range| slice_utf16(&case.input, &range.property_range))
                            .collect::<Vec<_>>(),
                        ["--color-primary", "--duration-fast"]
                    );
                }
                "rc87-8825de071b213b2d" => {
                    let end = find_css_statement_end(&case.input, "@theme".len());
                    assert_eq!(end.end, case.input.len());
                    assert_eq!(end.reason, CssStatementEndReason::Eof);
                }
                "rc87-a16dfb59baf769b1" => {
                    assert_eq!(
                        ["font:48px", "1col", "-1col", "-", "a b"].map(css_escape),
                        ["font\\:48px", "\\31 col", "-\\31 col", "\\-", "a\\ b"]
                    );
                }
                "rc87-e84fc87f66b88072" => {
                    assert_eq!(escape_regexp(&case.input), case.expected_canonical)
                }
                source_id => panic!("unhandled rc.87 lexer parity source {source_id}"),
            }
        }
        assert_eq!(executed, 23);
    }

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
    fn collects_only_active_css_variable_references() {
        let references = collect_css_variable_references(
            r#"var(--real) "var(--quoted)" /* var(--commented) */ VAR( --brand, var(--fallback)) xvar(--ignored)"#,
        );
        assert_eq!(references, ["real", "brand", "fallback"]);
    }

    #[test]
    fn transforms_balanced_css_variable_references_without_touching_literals() {
        let source =
            r#"var(--real) "var(--quoted)" /* var(--commented) */ VAR( --brand, var(--fallback))"#;
        let output = transform_css_variable_references(source, |name, text| {
            Ok::<_, ()>((name == "brand").then(|| format!("token({name}:{text})")))
        })
        .unwrap();
        assert_eq!(
            output,
            r#"var(--real) "var(--quoted)" /* var(--commented) */ token(brand:VAR( --brand, var(--fallback)))"#
        );
    }

    #[test]
    fn preserves_unclosed_css_variable_references() {
        let source = "color:var(--brand, calc(1px + 2px)";
        assert_eq!(
            transform_css_variable_references(source, |_name, _text| {
                Ok::<_, ()>(Some("replaced".into()))
            })
            .unwrap(),
            source
        );
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
