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

mod at_rules;
mod class_list;
mod directives;
mod escape;
mod functions;
mod statements;
mod variables;

pub(crate) use at_rules::{
    find_css_block_end, find_css_statement_end, read_quoted, scan_top_level_at_rules,
};
pub(crate) use variables::skip_css_string_or_comment;

pub use at_rules::extract_top_level_at_rule_blocks;
pub use class_list::{collect_class_list_cursor_ranges, collect_class_list_token_ranges};
pub use directives::find_css_directive_ranges;
pub use escape::{css_escape, escape_regexp};
pub use functions::{collect_css_declaration_ranges, read_css_function};
pub use statements::{
    find_css_import_statements, find_css_reference_statements, find_master_directive_statements,
    find_standalone_css_directive_statements, has_master_css_manifest_entrypoint,
    parse_css_import_source, remove_css_reference_statements, remove_master_directive_statements,
    remove_standalone_css_directives,
};
pub use variables::{collect_css_variable_references, transform_css_variable_references};

#[cfg(test)]
mod tests;
