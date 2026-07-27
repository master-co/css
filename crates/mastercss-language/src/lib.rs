#![forbid(unsafe_code)]

use mastercss_engine::{
    ClassSemanticInspection, ClassSemanticKind, EngineClassCompletionKind, EngineClassVariableIr,
    EngineError, EngineSession, UtilityMatcherType,
};
use mastercss_lexer::{
    CssDirectiveRange, byte_to_utf16_offset, collect_class_list_token_ranges,
    find_css_directive_ranges, utf16_len, utf16_to_byte_offset,
};
use mastercss_schema::{
    GeneratedRuleIr, LANGUAGE_BATCH_VERSION, NativeDeclarationCandidateIr, SourceRange,
};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClassListContextIr {
    pub start: u32,
    pub end: u32,
    #[serde(default)]
    pub unescape: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClassPositionIr {
    pub range: SourceRange,
    pub context_range: SourceRange,
    pub raw: String,
    pub token: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SemanticTokenInputIr {
    pub start: u32,
    pub end: u32,
    #[serde(rename = "type")]
    pub token_type: String,
    #[serde(default)]
    pub modifiers: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub role: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyzeDocumentRequestIr {
    pub source: String,
    pub language_id: String,
    #[serde(default)]
    pub host_ranges: Vec<ClassListContextIr>,
    #[serde(default)]
    pub settings: LanguageDocumentSettingsIr,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LanguageDocumentSettingsIr {
    #[serde(default)]
    pub class_attributes: Vec<String>,
    #[serde(default)]
    pub class_functions: Vec<String>,
    #[serde(default)]
    pub class_declarations: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanguageDocumentIr {
    pub version: u32,
    pub class_positions: Vec<ClassPositionIr>,
    pub semantic_tokens: Vec<SemanticTokenInputIr>,
    pub semantic_token_data: Vec<u32>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormatDirectivesRequestIr {
    pub source: String,
    #[serde(default)]
    pub range: Option<SourceRange>,
    #[serde(default)]
    pub style_ranges: Vec<SourceRange>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanguageFormatEditIr {
    pub range: SourceRange,
    pub text: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanguageFormatEditsIr {
    pub version: u32,
    pub edits: Vec<LanguageFormatEditIr>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanguageClassificationsIr {
    pub version: u32,
    pub variable_names: Vec<String>,
    pub classes: Vec<ClassSemanticInspection>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanguageInspectionIr {
    pub version: u32,
    pub class_name: String,
    pub valid: bool,
    pub kind: ClassSemanticKind,
    pub base: String,
    pub suffix: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key_token: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value_token: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub state_token: Option<String>,
    pub important: bool,
    pub matcher_types: Vec<UtilityMatcherType>,
    pub variables: Vec<EngineClassVariableIr>,
    pub rules: Vec<GeneratedRuleIr>,
    pub text: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum LanguageCompletionKind {
    Property,
    Value,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanguageCompletionEntryIr {
    pub label: String,
    pub kind: LanguageCompletionKind,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub documentation_text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sort_text: Option<String>,
    pub trigger_suggest: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanguageCompletionIndexIr {
    pub version: u32,
    pub class_entries: Vec<LanguageCompletionEntryIr>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanguageColorPresentationIr {
    pub version: u32,
    pub color_token: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub space: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LanguageColorCandidateInputIr {
    pub class_name: String,
    pub start: u32,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanguageColorTokenIr {
    pub range: SourceRange,
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub alpha: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanguageColorTokensIr {
    pub version: u32,
    pub tokens: Vec<LanguageColorTokenIr>,
}

#[derive(Debug)]
pub struct LanguageSession {
    engine: EngineSession,
    manifest_json: String,
    native_support_by_class: HashMap<String, bool>,
    variable_names: HashSet<String>,
}

fn inspect_class_name_parts(class_name: &str) -> (String, String, Option<String>, Option<String>) {
    if let Some(colon) = class_name.find(':').filter(|colon| *colon > 0) {
        let end = find_class_modifier_index(class_name, colon + 1);
        return (
            class_name[..end].to_owned(),
            class_name[end..].to_owned(),
            Some(class_name[..colon].to_owned()),
            Some(class_name[colon + 1..end].to_owned()),
        );
    }
    let end = find_class_modifier_index(class_name, 0);
    (
        class_name[..end].to_owned(),
        class_name[end..].to_owned(),
        None,
        None,
    )
}

fn find_class_modifier_index(class_name: &str, start: usize) -> usize {
    let mut quote = None;
    let mut depth = 0_u32;
    let mut escaped = false;
    for (index, character) in class_name
        .char_indices()
        .filter(|(index, _)| *index >= start)
    {
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
        if matches!(character, '"' | '\'') {
            quote = Some(character);
            continue;
        }
        if matches!(character, '(' | '[' | '{') {
            depth += 1;
            continue;
        }
        if matches!(character, ')' | ']' | '}') {
            depth = depth.saturating_sub(1);
            continue;
        }
        if depth == 0
            && matches!(
                character,
                '!' | '*' | '>' | '+' | '~' | ':' | '[' | '@' | '_'
            )
        {
            return index;
        }
    }
    class_name.len()
}

fn push_semantic_token(
    tokens: &mut Vec<SemanticTokenInputIr>,
    start: u32,
    end: u32,
    token_type: &str,
    modifiers: &[&str],
) {
    push_semantic_token_with_role(tokens, start, end, token_type, modifiers, None);
}

fn push_semantic_token_with_role(
    tokens: &mut Vec<SemanticTokenInputIr>,
    start: u32,
    end: u32,
    token_type: &str,
    modifiers: &[&str],
    role: Option<&str>,
) {
    if end <= start {
        return;
    }
    tokens.push(SemanticTokenInputIr {
        start,
        end,
        token_type: token_type.to_owned(),
        modifiers: modifiers
            .iter()
            .map(|modifier| (*modifier).to_owned())
            .collect(),
        role: role.map(str::to_owned),
    });
}

fn value_identifier_end(value: &str, start: usize) -> usize {
    let mut end = start;
    for character in value[start..].chars() {
        if character.is_alphanumeric() || matches!(character, '_' | '-' | '.') {
            end += character.len_utf8();
        } else {
            break;
        }
    }
    end
}

fn push_value_semantic_tokens(
    tokens: &mut Vec<SemanticTokenInputIr>,
    value: &str,
    offset: u32,
    variable_names: &HashSet<String>,
) {
    let mut byte_index = 0;
    while byte_index < value.len() {
        let suffix = &value[byte_index..];
        let character = suffix.chars().next().unwrap_or_default();
        let start = offset + utf16_len(&value[..byte_index]);
        if character.is_whitespace() {
            byte_index += character.len_utf8();
            continue;
        }
        if matches!(character, '\'' | '"') {
            let quote = character;
            let quote_length = quote.len_utf8();
            push_semantic_token(tokens, start, start + 1, "string", &["quoted"]);
            let content_start = byte_index + quote_length;
            let mut content_end = content_start;
            let mut escaped = false;
            for next in value[content_start..].chars() {
                if escaped {
                    escaped = false;
                } else if next == '\\' {
                    escaped = true;
                } else if next == quote {
                    break;
                }
                content_end += next.len_utf8();
            }
            push_semantic_token(
                tokens,
                offset + utf16_len(&value[..content_start]),
                offset + utf16_len(&value[..content_end]),
                "string",
                &["quoted"],
            );
            if content_end < value.len() {
                let close = offset + utf16_len(&value[..content_end]);
                push_semantic_token(tokens, close, close + 1, "string", &["quoted"]);
                byte_index = content_end + quote_length;
            } else {
                byte_index = content_end;
            }
            continue;
        }
        if character == '$' {
            let end = value_identifier_end(value, byte_index + 1);
            push_semantic_token(
                tokens,
                start,
                offset + utf16_len(&value[..end]),
                "variable",
                &[],
            );
            byte_index = end;
            continue;
        }
        let number_start = character.is_ascii_digit()
            || (character == '.'
                && suffix
                    .chars()
                    .nth(1)
                    .is_some_and(|next| next.is_ascii_digit()));
        if number_start {
            let mut end = byte_index + character.len_utf8();
            for next in value[end..].chars() {
                if next.is_ascii_digit() || next == '.' {
                    end += next.len_utf8();
                } else {
                    break;
                }
            }
            push_semantic_token(
                tokens,
                start,
                offset + utf16_len(&value[..end]),
                "number",
                &[],
            );
            let unit_end = value_identifier_end(value, end);
            if unit_end > end {
                push_semantic_token(
                    tokens,
                    offset + utf16_len(&value[..end]),
                    offset + utf16_len(&value[..unit_end]),
                    "enumMember",
                    &["unit"],
                );
            }
            byte_index = unit_end;
            continue;
        }
        if character.is_alphabetic()
            || character == '_'
            || (character == '-'
                && !suffix
                    .chars()
                    .nth(1)
                    .is_some_and(|next| next.is_ascii_digit()))
        {
            let end = value_identifier_end(value, byte_index);
            let name = &value[byte_index..end];
            if value[end..].starts_with('(') {
                push_semantic_token(
                    tokens,
                    start,
                    offset + utf16_len(&value[..end]),
                    "function",
                    &[],
                );
                let open = offset + utf16_len(&value[..end]);
                push_semantic_token(tokens, open, open + 1, "operator", &["functionPunctuation"]);
                if name == "url" {
                    let content_start = end + 1;
                    let content_end = value[content_start..]
                        .find(')')
                        .map_or(value.len(), |close| content_start + close);
                    let content = &value[content_start..content_end];
                    if content.starts_with(['\'', '"']) {
                        push_value_semantic_tokens(
                            tokens,
                            content,
                            offset + utf16_len(&value[..content_start]),
                            variable_names,
                        );
                    } else {
                        push_semantic_token(
                            tokens,
                            offset + utf16_len(&value[..content_start]),
                            offset + utf16_len(&value[..content_end]),
                            "string",
                            &[],
                        );
                    }
                    if content_end < value.len() {
                        let close = offset + utf16_len(&value[..content_end]);
                        push_semantic_token(
                            tokens,
                            close,
                            close + 1,
                            "operator",
                            &["functionPunctuation"],
                        );
                        byte_index = content_end + 1;
                    } else {
                        byte_index = content_end;
                    }
                } else {
                    byte_index = end + 1;
                }
            } else {
                push_semantic_token(
                    tokens,
                    start,
                    offset + utf16_len(&value[..end]),
                    if variable_names.contains(name) {
                        "variable"
                    } else {
                        "enumMember"
                    },
                    &[],
                );
                byte_index = end;
            }
            continue;
        }
        if matches!(character, '|' | '/' | ',') {
            push_semantic_token(tokens, start, start + 1, "operator", &["valueSeparator"]);
        } else if character == '!' {
            push_semantic_token(tokens, start, start + 1, "operator", &["important"]);
        } else if matches!(character, '*' | '-') {
            push_semantic_token(tokens, start, start + 1, "operator", &["valueOperator"]);
        } else if matches!(character, '(' | ')') {
            push_semantic_token(
                tokens,
                start,
                start + 1,
                "operator",
                &["functionPunctuation"],
            );
        }
        byte_index += character.len_utf8();
    }
}

fn push_query_value_token(
    tokens: &mut Vec<SemanticTokenInputIr>,
    query: &str,
    offset: u32,
    start: usize,
    end: usize,
    property: bool,
) {
    if start >= end {
        return;
    }
    let text = &query[start..end];
    let number_end = text
        .char_indices()
        .take_while(|(_, character)| character.is_ascii_digit() || *character == '.')
        .map(|(index, character)| index + character.len_utf8())
        .last()
        .unwrap_or_default();
    if number_end > 0 {
        push_semantic_token(
            tokens,
            offset + utf16_len(&query[..start]),
            offset + utf16_len(&query[..start + number_end]),
            "number",
            &["query"],
        );
        if start + number_end < end {
            push_semantic_token(
                tokens,
                offset + utf16_len(&query[..start + number_end]),
                offset + utf16_len(&query[..end]),
                "enumMember",
                &["query", "unit"],
            );
        }
    } else {
        push_semantic_token(
            tokens,
            offset + utf16_len(&query[..start]),
            offset + utf16_len(&query[..end]),
            if property { "property" } else { "enumMember" },
            &["query"],
        );
    }
}

fn push_query_semantic_tokens(tokens: &mut Vec<SemanticTokenInputIr>, query: &str, offset: u32) {
    let keyword_end = query[1..]
        .char_indices()
        .take_while(|(_, character)| character.is_alphanumeric() || matches!(character, '-' | '_'))
        .map(|(index, character)| 1 + index + character.len_utf8())
        .last()
        .unwrap_or(1);
    let has_structure = query[keyword_end..]
        .chars()
        .any(|character| matches!(character, '(' | '>' | '<' | '=' | '&'));
    if !has_structure {
        push_semantic_token(
            tokens,
            offset,
            offset + utf16_len(query),
            "keyword",
            &["query"],
        );
        return;
    }
    if query[keyword_end..].starts_with('&') {
        push_semantic_token(tokens, offset, offset + 1, "keyword", &["query"]);
        push_semantic_token(
            tokens,
            offset + 1,
            offset + utf16_len(&query[..keyword_end]),
            "enumMember",
            &["query"],
        );
    } else {
        push_semantic_token(
            tokens,
            offset,
            offset + utf16_len(&query[..keyword_end]),
            "keyword",
            &["query"],
        );
    }
    let mut byte_index = keyword_end;
    let mut expect_property = false;
    while byte_index < query.len() {
        let suffix = &query[byte_index..];
        let character = suffix.chars().next().unwrap_or_default();
        let start = offset + utf16_len(&query[..byte_index]);
        if matches!(character, '(' | ')' | ':' | ',') {
            push_semantic_token(
                tokens,
                start,
                start + 1,
                "operator",
                &["query", "queryPunctuation"],
            );
            expect_property = character == '(' && &query[..keyword_end] == "@media";
            byte_index += 1;
        } else if matches!(character, '&' | '>' | '<' | '=') {
            let mut end = byte_index + 1;
            if matches!(character, '>' | '<') && query[end..].starts_with('=') {
                end += 1;
            }
            push_semantic_token(
                tokens,
                start,
                offset + utf16_len(&query[..end]),
                "operator",
                &["query", "queryOperator"],
            );
            expect_property = character == '&';
            byte_index = end;
        } else if character.is_alphanumeric() || matches!(character, '-' | '.') {
            let end = value_identifier_end(query, byte_index);
            push_query_value_token(tokens, query, offset, byte_index, end, expect_property);
            expect_property = false;
            byte_index = end;
        } else {
            byte_index += character.len_utf8();
        }
    }
}

fn state_identifier_end(state: &str, start: usize, allow_star: bool) -> usize {
    let mut end = start;
    if allow_star && state[end..].starts_with('*') {
        end += 1;
    }
    for (relative, character) in state[end..].char_indices() {
        if character.is_alphanumeric() || matches!(character, '_' | '-') {
            end += character.len_utf8();
        } else {
            let _ = relative;
            break;
        }
    }
    end
}

fn push_state_semantic_tokens(tokens: &mut Vec<SemanticTokenInputIr>, state: &str, offset: u32) {
    let mut byte_index = 0;
    while byte_index < state.len() {
        let suffix = &state[byte_index..];
        let start = offset + utf16_len(&state[..byte_index]);
        let character = suffix.chars().next().unwrap_or_default();
        let character_length = character.len_utf8();
        if character == '!' {
            push_semantic_token(tokens, start, start + 1, "operator", &["important"]);
            byte_index += 1;
        } else if matches!(character, '_' | '>' | '+' | '~') {
            push_semantic_token(
                tokens,
                start,
                start + 1,
                "operator",
                &["selector", "selectorCombinator"],
            );
            let name_start = byte_index + character_length;
            let name_end = state_identifier_end(state, name_start, true);
            push_semantic_token(
                tokens,
                offset + utf16_len(&state[..name_start]),
                offset + utf16_len(&state[..name_end]),
                "type",
                &["selector"],
            );
            byte_index = name_end;
        } else if matches!(character, '.' | '#') {
            push_semantic_token(
                tokens,
                start,
                start + 1,
                "operator",
                &["selector", "selectorPunctuation"],
            );
            let name_start = byte_index + character_length;
            let name_end = state_identifier_end(state, name_start, false);
            push_semantic_token(
                tokens,
                offset + utf16_len(&state[..name_start]),
                offset + utf16_len(&state[..name_end]),
                if character == '.' {
                    "class"
                } else {
                    "variable"
                },
                &["selector"],
            );
            byte_index = name_end;
        } else if matches!(character, '(' | ',') {
            push_semantic_token(
                tokens,
                start,
                start + 1,
                "operator",
                &["selector", "selectorPunctuation"],
            );
            let name_start = byte_index + character_length;
            let name_end = state_identifier_end(state, name_start, true);
            push_semantic_token(
                tokens,
                offset + utf16_len(&state[..name_start]),
                offset + utf16_len(&state[..name_end]),
                "type",
                &["selector"],
            );
            byte_index = name_end;
        } else if matches!(character, ')' | '[' | ']') {
            push_semantic_token(
                tokens,
                start,
                start + 1,
                "operator",
                &["selector", "selectorPunctuation"],
            );
            byte_index += character_length;
        } else if character == '@' {
            let end = state.len();
            push_query_semantic_tokens(tokens, &state[byte_index..end], start);
            byte_index = end;
        } else if character == ':' {
            let delimiter_length = if suffix.starts_with("::") { 2 } else { 1 };
            let (kind, delimiter) = if delimiter_length == 2 {
                ("pseudoElement", "pseudoElementDelimiter")
            } else {
                ("pseudoClass", "pseudoClassDelimiter")
            };
            push_semantic_token(
                tokens,
                start,
                start + delimiter_length,
                "operator",
                &["selector", kind, delimiter],
            );
            let name_start = byte_index + delimiter_length as usize;
            let name_end = state_identifier_end(state, name_start, false);
            push_semantic_token(
                tokens,
                offset + utf16_len(&state[..name_start]),
                offset + utf16_len(&state[..name_end]),
                "modifier",
                &[kind],
            );
            byte_index = name_end;
        } else {
            byte_index += character_length;
        }
    }
}

fn find_language_group_close(token: &str) -> Option<usize> {
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

fn top_level_semicolons(source: &str) -> Vec<usize> {
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

fn range_within(range: &SourceRange, parent: Option<&SourceRange>) -> bool {
    parent.is_none_or(|parent| range.start >= parent.start && range.end <= parent.end)
}

fn ranges_equal(left: &SourceRange, right: Option<&SourceRange>) -> bool {
    right.is_some_and(|right| left.start == right.start && left.end == right.end)
}

fn format_class_list(class_list: &str) -> String {
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

fn source_slice<'a>(source: &'a str, range: &SourceRange) -> Option<&'a str> {
    let start = utf16_to_byte_offset(source, range.start)?;
    let end = utf16_to_byte_offset(source, range.end)?;
    (start <= end).then_some(&source[start..end])
}

fn apply_relative_edits(source: &str, edits: &[LanguageFormatEditIr]) -> Option<String> {
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

fn formatted_directive_prelude(source: &str, directive: &CssDirectiveRange) -> Option<String> {
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

impl LanguageSession {
    pub fn create(manifest_json: &str) -> Result<Self, LanguageError> {
        let engine = EngineSession::create(manifest_json)?;
        let variable_names = engine.variable_names()?.into_iter().collect();
        Ok(Self {
            engine,
            manifest_json: manifest_json.to_owned(),
            native_support_by_class: HashMap::new(),
            variable_names,
        })
    }

    pub fn native_declaration_candidates<I, S>(
        &self,
        class_names: I,
    ) -> Result<Vec<NativeDeclarationCandidateIr>, LanguageError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        Ok(self.engine.native_declaration_candidates(class_names)?)
    }

    pub fn analyze_document(
        &self,
        request: &AnalyzeDocumentRequestIr,
    ) -> Result<LanguageDocumentIr, LanguageError> {
        let mut contexts =
            collect_document_contexts(&request.source, &request.language_id, &request.settings);
        contexts.extend(request.host_ranges.iter().cloned());
        contexts.sort_by_key(|range| (range.start, range.end));
        contexts.dedup_by(|left, right| left.start == right.start && left.end == right.end);
        let class_positions = collect_class_positions(&request.source, &contexts)?;
        let semantic_tokens = self.semantic_tokens_for_positions(&class_positions)?;
        Ok(LanguageDocumentIr {
            version: LANGUAGE_BATCH_VERSION,
            class_positions,
            semantic_token_data: encode_semantic_tokens(&request.source, &semantic_tokens),
            semantic_tokens,
        })
    }

    pub fn format_directives(
        &self,
        request: &FormatDirectivesRequestIr,
    ) -> Result<LanguageFormatEditsIr, LanguageError> {
        let source_length = utf16_len(&request.source);
        let regions = if request.style_ranges.is_empty() {
            vec![SourceRange {
                start: 0,
                end: source_length,
            }]
        } else {
            request.style_ranges.clone()
        };
        let mut edits = Vec::new();
        for region in regions {
            let region_source =
                source_slice(&request.source, &region).ok_or(LanguageError::InvalidRange)?;
            for directive in find_css_directive_ranges(region_source) {
                let directive_range = SourceRange {
                    start: region.start + directive.range.start,
                    end: region.start + directive.range.end,
                };
                let prelude_range = SourceRange {
                    start: region.start + directive.prelude_range.start,
                    end: region.start + directive.prelude_range.end,
                };
                if !range_within(&directive_range, request.range.as_ref())
                    && !ranges_equal(&prelude_range, request.range.as_ref())
                {
                    continue;
                }
                let Some(text) = formatted_directive_prelude(region_source, &directive) else {
                    continue;
                };
                if !range_within(&prelude_range, request.range.as_ref()) {
                    continue;
                }
                let current = source_slice(&request.source, &prelude_range)
                    .ok_or(LanguageError::InvalidRange)?;
                if current != text {
                    edits.push(LanguageFormatEditIr {
                        range: prelude_range,
                        text,
                    });
                }
            }
        }
        edits.sort_by_key(|edit| (edit.range.start, edit.range.end));
        edits.dedup_by(|left, right| left.range == right.range && left.text == right.text);
        Ok(LanguageFormatEditsIr {
            version: LANGUAGE_BATCH_VERSION,
            edits,
        })
    }

    fn push_class_semantic_tokens(
        &self,
        class_name: &str,
        token_start: u32,
        tokens: &mut Vec<SemanticTokenInputIr>,
    ) -> Result<(), LanguageError> {
        let starts_with_group = class_name.starts_with('{');
        let group_close = starts_with_group
            .then(|| find_language_group_close(class_name))
            .flatten();
        let body_start = usize::from(starts_with_group);
        let body_end = group_close.unwrap_or(class_name.len());
        let body = &class_name[body_start..body_end];
        let semicolons = top_level_semicolons(body);
        if starts_with_group || !semicolons.is_empty() {
            if starts_with_group {
                push_semantic_token(
                    tokens,
                    token_start,
                    token_start + 1,
                    "operator",
                    &["blockBrace"],
                );
            }
            let mut part_start = 0;
            for part_end in semicolons
                .iter()
                .copied()
                .chain(std::iter::once(body.len()))
            {
                let part = &body[part_start..part_end];
                let trimmed = part.trim();
                if !trimmed.is_empty() {
                    let leading_bytes = part.len() - part.trim_start().len();
                    self.push_class_semantic_tokens(
                        trimmed,
                        token_start
                            + utf16_len(&class_name[..body_start])
                            + utf16_len(&body[..part_start + leading_bytes]),
                        tokens,
                    )?;
                }
                if part_end < body.len() {
                    let semicolon_start = token_start
                        + utf16_len(&class_name[..body_start])
                        + utf16_len(&body[..part_end]);
                    push_semantic_token(
                        tokens,
                        semicolon_start,
                        semicolon_start + 1,
                        "operator",
                        &["declarationTerminator"],
                    );
                }
                part_start = part_end.saturating_add(1);
            }
            if let Some(close) = group_close {
                let close_start = token_start + utf16_len(&class_name[..close]);
                push_semantic_token(
                    tokens,
                    close_start,
                    close_start + 1,
                    "operator",
                    &["blockBrace"],
                );
                let suffix_start = close + 1;
                push_state_semantic_tokens(
                    tokens,
                    &class_name[suffix_start..],
                    token_start + utf16_len(&class_name[..suffix_start]),
                );
            }
            return Ok(());
        }

        let semantics = self.engine.inspect_class_semantics(class_name)?;
        if semantics.kind == ClassSemanticKind::Unknown {
            for (index, character) in class_name.char_indices() {
                if !matches!(character, ':' | '_' | '>' | '+' | '~' | '@') || index == 0 {
                    continue;
                }
                let base = &class_name[..index];
                if self.engine.inspect_class_semantics(base)?.kind == ClassSemanticKind::Unknown {
                    continue;
                }
                self.push_class_semantic_tokens(base, token_start, tokens)?;
                push_state_semantic_tokens(
                    tokens,
                    &class_name[index..],
                    token_start + utf16_len(base),
                );
                return Ok(());
            }
            return Ok(());
        }
        let state_length = semantics
            .state_token
            .as_deref()
            .map(utf16_len)
            .unwrap_or_default();
        let important_length = u32::from(semantics.important);
        let base_end = token_start
            .saturating_add(utf16_len(class_name))
            .saturating_sub(state_length + important_length);
        match semantics.kind {
            ClassSemanticKind::Component => push_semantic_token(
                tokens,
                token_start,
                base_end,
                "class",
                &["declaration", "component"],
            ),
            ClassSemanticKind::Semantic | ClassSemanticKind::Pattern => {
                push_semantic_token_with_role(
                    tokens,
                    token_start,
                    base_end,
                    "enumMember",
                    &[],
                    Some("utility.semantic"),
                )
            }
            ClassSemanticKind::Declaration => {
                if let Some(key) = semantics.key_token.as_deref() {
                    let key_length = utf16_len(key.trim_end_matches(':'));
                    push_semantic_token(
                        tokens,
                        token_start,
                        token_start + key_length,
                        "property",
                        &[],
                    );
                    if key.ends_with(':') {
                        push_semantic_token(
                            tokens,
                            token_start + key_length,
                            token_start + key_length + 1,
                            "operator",
                            &["declarationSeparator"],
                        );
                    }
                    if let Some(value) = semantics.value_token.as_deref() {
                        let value_start = token_start + utf16_len(key);
                        push_value_semantic_tokens(
                            tokens,
                            value,
                            value_start,
                            &self.variable_names,
                        );
                    }
                }
            }
            ClassSemanticKind::Unknown => {}
        }
        if semantics.important {
            push_semantic_token(tokens, base_end, base_end + 1, "operator", &["important"]);
        }
        if let Some(state) = semantics.state_token.as_deref() {
            push_state_semantic_tokens(
                tokens,
                state,
                token_start + utf16_len(class_name) - state_length,
            );
        }
        Ok(())
    }

    fn semantic_tokens_for_positions(
        &self,
        positions: &[ClassPositionIr],
    ) -> Result<Vec<SemanticTokenInputIr>, LanguageError> {
        let mut tokens = Vec::new();
        for position in positions {
            self.push_class_semantic_tokens(&position.token, position.range.start, &mut tokens)?;
        }
        Ok(tokens)
    }

    pub fn classify_class_names<I, S>(
        &mut self,
        class_names: I,
        native_support: Option<&[bool]>,
    ) -> Result<LanguageClassificationsIr, LanguageError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        let class_names = class_names
            .into_iter()
            .map(|class_name| class_name.as_ref().to_owned())
            .collect::<Vec<_>>();
        if let Some(native_support) = native_support {
            for (candidate, supported) in self
                .engine
                .native_declaration_candidates(&class_names)?
                .into_iter()
                .zip(native_support.iter().copied())
            {
                self.native_support_by_class
                    .insert(candidate.class_name, supported);
            }
            self.engine
                .ensure_class_rules_with_native_support(&class_names, native_support)?;
        }
        let classes = class_names
            .iter()
            .map(|class_name| self.engine.inspect_class_semantics(class_name))
            .collect::<Result<Vec<_>, _>>()?;
        Ok(LanguageClassificationsIr {
            version: LANGUAGE_BATCH_VERSION,
            variable_names: self.engine.variable_names()?,
            classes,
        })
    }

    pub fn inspect_class_name(
        &self,
        class_name: &str,
        native_support: Option<&[bool]>,
        mode: Option<&str>,
    ) -> Result<LanguageInspectionIr, LanguageError> {
        let mut engine = EngineSession::create(&self.manifest_json)?;
        let cached_native_support = self
            .native_support_by_class
            .get(class_name)
            .copied()
            .map(|supported| [supported]);
        let native_support = native_support.or(cached_native_support
            .as_ref()
            .map(|support| support.as_slice()));
        if let Some(native_support) = native_support {
            engine.ensure_class_rules_with_native_support([class_name], native_support)?;
        } else {
            engine.ensure_class_rules([class_name])?;
        }
        let semantics = engine.inspect_class_semantics_with_mode(class_name, mode)?;
        let inspection = engine.inspect_with_mode(class_name, mode)?;
        let (fallback_base, fallback_suffix, fallback_key, fallback_value) =
            inspect_class_name_parts(class_name);
        let (base, suffix, key, value) = if inspection.valid {
            let suffix = format!(
                "{}{}",
                if semantics.important { "!" } else { "" },
                semantics.state_token.as_deref().unwrap_or_default()
            );
            let base = if suffix.is_empty() {
                class_name.to_owned()
            } else {
                class_name
                    .strip_suffix(&suffix)
                    .unwrap_or(class_name)
                    .to_owned()
            };
            let key_value = semantics
                .key_token
                .as_deref()
                .and_then(|key| key.strip_suffix(':'))
                .zip(semantics.value_token.as_deref());
            let (key, value) = key_value
                .map(|(key, value)| (Some(key.to_owned()), Some(value.to_owned())))
                .unwrap_or_default();
            (base, suffix, key, value)
        } else {
            (fallback_base, fallback_suffix, fallback_key, fallback_value)
        };
        let text = engine.render_class_name_isolated_with_mode(class_name, mode)?;
        Ok(LanguageInspectionIr {
            version: LANGUAGE_BATCH_VERSION,
            class_name: class_name.to_owned(),
            valid: inspection.valid,
            kind: semantics.kind,
            base,
            suffix,
            key,
            value,
            key_token: semantics.key_token,
            value_token: semantics.value_token,
            state_token: semantics.state_token,
            important: semantics.important,
            matcher_types: semantics.matcher_types,
            variables: engine.class_variable_entries(class_name)?,
            rules: inspection.rules,
            text,
        })
    }

    pub fn completion_index(&self) -> Result<LanguageCompletionIndexIr, LanguageError> {
        let candidates = self.engine.class_completion_candidates()?;
        let documentation_class_names = candidates
            .iter()
            .filter_map(|candidate| candidate.documentation_class_name.clone())
            .collect::<Vec<_>>();
        let documentation_texts = self
            .engine
            .render_class_names_isolated(&documentation_class_names)?;
        let documentation_by_class = documentation_class_names
            .into_iter()
            .zip(documentation_texts)
            .collect::<HashMap<_, _>>();
        let class_entries = candidates
            .into_iter()
            .map(|candidate| LanguageCompletionEntryIr {
                label: candidate.label,
                kind: match candidate.kind {
                    EngineClassCompletionKind::Property => LanguageCompletionKind::Property,
                    EngineClassCompletionKind::Value => LanguageCompletionKind::Value,
                },
                detail: candidate.detail,
                documentation_text: candidate
                    .documentation_class_name
                    .as_deref()
                    .and_then(|class_name| documentation_by_class.get(class_name))
                    .cloned(),
                sort_text: candidate.sort_text,
                trigger_suggest: candidate.trigger_suggest,
            })
            .collect();
        Ok(LanguageCompletionIndexIr {
            version: LANGUAGE_BATCH_VERSION,
            class_entries,
        })
    }

    pub fn color_presentation(
        &self,
        color_token: &str,
    ) -> Result<LanguageColorPresentationIr, LanguageError> {
        Ok(LanguageColorPresentationIr {
            version: LANGUAGE_BATCH_VERSION,
            color_token: color_token.to_owned(),
            space: self.engine.color_presentation_space(color_token)?,
        })
    }

    pub fn color_tokens(
        &self,
        candidates: &[LanguageColorCandidateInputIr],
    ) -> Result<LanguageColorTokensIr, LanguageError> {
        let mut tokens = Vec::new();
        for candidate in candidates {
            for token in self.engine.color_tokens(&candidate.class_name)? {
                let start = candidate
                    .start
                    .checked_add(token.start)
                    .ok_or(LanguageError::InvalidRange)?;
                let end = candidate
                    .start
                    .checked_add(token.end)
                    .ok_or(LanguageError::InvalidRange)?;
                tokens.push(LanguageColorTokenIr {
                    range: SourceRange { start, end },
                    value: token.value,
                    alpha: token.alpha,
                });
            }
        }
        Ok(LanguageColorTokensIr {
            version: LANGUAGE_BATCH_VERSION,
            tokens,
        })
    }

    pub fn dispose(&mut self) {
        self.engine.dispose();
    }
}

fn collect_document_contexts(
    source: &str,
    language_id: &str,
    settings: &LanguageDocumentSettingsIr,
) -> Vec<ClassListContextIr> {
    let language_id = language_id.to_ascii_lowercase();
    if matches!(
        language_id.as_str(),
        "master-css" | "mcss" | "text" | "plaintext"
    ) {
        return vec![ClassListContextIr {
            start: 0,
            end: utf16_len(source),
            unescape: Vec::new(),
        }];
    }
    let mut contexts = Vec::new();
    if matches!(language_id.as_str(), "css" | "scss" | "less") {
        collect_css_directive_contexts(source, 0, &mut contexts);
    } else if matches!(language_id.as_str(), "vue" | "svelte" | "astro") {
        collect_sfc_style_contexts(source, &mut contexts);
    }
    if matches!(
        language_id.as_str(),
        "html" | "angular-html" | "vue" | "svelte" | "astro" | "markdown" | "mdx"
    ) {
        collect_markup_attribute_contexts(source, &mut contexts, settings);
    }
    if matches!(
        language_id.as_str(),
        "javascript"
            | "typescript"
            | "javascriptreact"
            | "typescriptreact"
            | "html"
            | "vue"
            | "svelte"
            | "astro"
    ) {
        collect_script_string_contexts(source, &mut contexts, settings);
        collect_braced_class_bindings(source, &mut contexts);
    }
    contexts
}

fn push_byte_context(
    source: &str,
    contexts: &mut Vec<ClassListContextIr>,
    start: usize,
    end: usize,
    unescape: Vec<String>,
) {
    if start > end || end > source.len() {
        return;
    }
    let (Some(start), Some(end)) = (
        byte_to_utf16_offset(source, start),
        byte_to_utf16_offset(source, end),
    ) else {
        return;
    };
    contexts.push(ClassListContextIr {
        start,
        end,
        unescape,
    });
}

fn collect_markup_attribute_contexts(
    source: &str,
    contexts: &mut Vec<ClassListContextIr>,
    settings: &LanguageDocumentSettingsIr,
) {
    let bytes = source.as_bytes();
    let mut names = vec![
        "class".to_owned(),
        "classname".to_owned(),
        "class:list".to_owned(),
        ":class".to_owned(),
        "v-bind:class".to_owned(),
        "[class]".to_owned(),
        "[classname]".to_owned(),
        "[ngclass]".to_owned(),
    ];
    for name in &settings.class_attributes {
        let name = name.to_ascii_lowercase();
        if !names.contains(&name) {
            names.push(name);
        }
    }
    let mut index = 0;
    while index < bytes.len() {
        if bytes[index..].starts_with(b"<!--") {
            index = source[index + "<!--".len()..]
                .find("-->")
                .map_or(source.len(), |end| index + "<!--".len() + end + "-->".len());
            continue;
        }
        if !matches!(bytes[index], b'\'' | b'"') {
            index += 1;
            continue;
        }
        let quote = bytes[index];
        let mut cursor = index;
        while cursor > 0 && bytes[cursor - 1].is_ascii_whitespace() {
            cursor -= 1;
        }
        if cursor == 0 || bytes[cursor - 1] != b'=' {
            index += 1;
            continue;
        }
        cursor -= 1;
        while cursor > 0 && bytes[cursor - 1].is_ascii_whitespace() {
            cursor -= 1;
        }
        let name_end = cursor;
        while cursor > 0
            && !bytes[cursor - 1].is_ascii_whitespace()
            && !matches!(bytes[cursor - 1], b'<' | b'>' | b'/' | b'{' | b'}')
        {
            cursor -= 1;
        }
        let name = source[cursor..name_end].to_ascii_lowercase();
        let mut end = index + 1;
        let mut escaped = false;
        while end < bytes.len() {
            if escaped {
                escaped = false;
            } else if bytes[end] == b'\\' {
                escaped = true;
            } else if bytes[end] == quote {
                break;
            }
            end += 1;
        }
        if names.contains(&name) && end < bytes.len() {
            if matches!(
                name.as_str(),
                ":class" | "v-bind:class" | "[class]" | "[classname]" | "[ngclass]"
            ) {
                collect_nested_string_contexts(source, index + 1, end, contexts);
            } else {
                push_byte_context(
                    source,
                    contexts,
                    index + 1,
                    end,
                    vec![(quote as char).to_string()],
                );
            }
        }
        index = end.saturating_add(1);
    }
}

fn collect_script_string_contexts(
    source: &str,
    contexts: &mut Vec<ClassListContextIr>,
    settings: &LanguageDocumentSettingsIr,
) {
    let bytes = source.as_bytes();
    let mut patterns = vec![
        "class=".to_owned(),
        "classname=".to_owned(),
        "class:list=".to_owned(),
        "clsx(".to_owned(),
        "classnames(".to_owned(),
        "cva(".to_owned(),
        "ctl(".to_owned(),
        "classlist.add(".to_owned(),
        "classlist.remove(".to_owned(),
        "classlist.toggle(".to_owned(),
    ];
    for function in &settings.class_functions {
        let function = function.to_ascii_lowercase();
        if function.chars().all(|character| {
            character.is_ascii_alphanumeric() || matches!(character, '_' | '$' | '.')
        }) {
            let pattern = format!("{function}(");
            if !patterns.contains(&pattern) {
                patterns.push(pattern);
            }
        }
    }
    for declaration in &settings.class_declarations {
        let declaration = declaration.trim().to_ascii_lowercase();
        if !declaration.is_empty() {
            patterns.push(format!("{declaration}="));
            patterns.push(format!("{declaration} ="));
            patterns.push(format!("{declaration}:"));
        }
    }
    let mut index = 0;
    while index < bytes.len() {
        let quote = bytes[index];
        if !matches!(quote, b'\'' | b'"' | b'`') {
            index += 1;
            continue;
        }
        let inside_html_comment = source[..index].rfind("<!--").is_some_and(|comment_start| {
            source[..index]
                .rfind("-->")
                .is_none_or(|comment_end| comment_end < comment_start)
        });
        if inside_html_comment {
            index += 1;
            continue;
        }
        let line_start = source[..index]
            .rfind(['\n', '\r'])
            .map_or(0, |line| line + 1);
        if source[line_start..index].trim_start().starts_with("//") {
            index += 1;
            continue;
        }
        let prefix_start = index.saturating_sub(512);
        let prefix = source[prefix_start..index].to_ascii_lowercase();
        let compact_prefix = prefix
            .chars()
            .filter(|character| !character.is_ascii_whitespace())
            .collect::<String>();
        let binding_expression = compact_prefix.ends_with(":class=")
            || compact_prefix.ends_with("v-bind:class=")
            || compact_prefix.ends_with("class:list=");
        let direct_class = !binding_expression
            && patterns.iter().any(|pattern| {
                let compact_pattern = pattern
                    .chars()
                    .filter(|character| !character.is_ascii_whitespace())
                    .collect::<String>();
                compact_prefix
                    .trim_end_matches('{')
                    .ends_with(&compact_pattern)
            });
        let in_class_call = patterns.iter().any(|pattern| {
            let compact_pattern = pattern
                .chars()
                .filter(|character| !character.is_ascii_whitespace())
                .collect::<String>();
            let Some(call) = compact_pattern.strip_suffix('(') else {
                return false;
            };
            let Some(start) = compact_prefix.rfind(&format!("{call}(")) else {
                return false;
            };
            let suffix = &compact_prefix[start + call.len()..];
            suffix
                .chars()
                .fold(0_i32, |depth, character| match character {
                    '(' => depth + 1,
                    ')' => depth - 1,
                    _ => depth,
                })
                > 0
        });
        let styled_template = quote == b'`'
            && compact_prefix.rfind("styled").is_some_and(|start| {
                compact_prefix[start + "styled".len()..]
                    .chars()
                    .all(|character| {
                        character.is_ascii_alphanumeric() || matches!(character, '_' | '$' | '.')
                    })
            });
        let styled_call = compact_prefix.rfind("styled").is_some_and(|start| {
            let suffix = &compact_prefix[start + "styled".len()..];
            let Some(open) = suffix.find('(') else {
                return false;
            };
            suffix[..open].chars().all(|character| {
                character.is_ascii_alphanumeric() || matches!(character, '_' | '$' | '.')
            }) && suffix[open..]
                .chars()
                .fold(0_i32, |depth, character| match character {
                    '(' => depth + 1,
                    ')' => depth - 1,
                    _ => depth,
                })
                > 0
        });
        let likely_class = direct_class || in_class_call || styled_call || styled_template;
        let mut end = index + 1;
        let mut escaped = false;
        let mut interpolation = false;
        while end < bytes.len() {
            if escaped {
                escaped = false;
            } else if bytes[end] == b'\\' {
                escaped = true;
            } else if quote == b'`' && bytes[end] == b'$' && bytes.get(end + 1) == Some(&b'{') {
                interpolation = true;
            } else if bytes[end] == quote {
                break;
            }
            end += 1;
        }
        if likely_class && !interpolation && end < bytes.len() {
            push_byte_context(
                source,
                contexts,
                index + 1,
                end,
                vec![(quote as char).to_string()],
            );
        }
        index = end.saturating_add(1);
    }
}

fn collect_nested_string_contexts(
    source: &str,
    start: usize,
    end: usize,
    contexts: &mut Vec<ClassListContextIr>,
) {
    let bytes = source.as_bytes();
    let mut index = start;
    while index < end {
        let quote = bytes[index];
        if !matches!(quote, b'\'' | b'"' | b'`') {
            index += 1;
            continue;
        }
        let mut cursor = index + 1;
        let mut escaped = false;
        let mut segment_start = cursor;
        while cursor < end {
            if escaped {
                escaped = false;
                cursor += 1;
                continue;
            }
            if bytes[cursor] == b'\\' {
                escaped = true;
                cursor += 1;
                continue;
            }
            if quote == b'`' && bytes[cursor] == b'$' && bytes.get(cursor + 1) == Some(&b'{') {
                if segment_start < cursor {
                    push_byte_context(
                        source,
                        contexts,
                        segment_start,
                        cursor,
                        vec!["`".to_owned()],
                    );
                }
                let expression_start = cursor + 2;
                let mut expression_end = expression_start;
                let mut depth = 1_u32;
                while expression_end < end && depth > 0 {
                    match bytes[expression_end] {
                        b'{' => depth += 1,
                        b'}' => depth -= 1,
                        _ => {}
                    }
                    expression_end += 1;
                }
                let inner_end = expression_end.saturating_sub(1);
                collect_nested_string_contexts(source, expression_start, inner_end, contexts);
                cursor = expression_end;
                segment_start = cursor;
                continue;
            }
            if bytes[cursor] == quote {
                if segment_start <= cursor {
                    push_byte_context(
                        source,
                        contexts,
                        segment_start,
                        cursor,
                        vec![(quote as char).to_string()],
                    );
                }
                cursor += 1;
                break;
            }
            cursor += 1;
        }
        index = cursor.max(index + 1);
    }
}

fn collect_braced_class_bindings(source: &str, contexts: &mut Vec<ClassListContextIr>) {
    let lower = source.to_ascii_lowercase();
    for name in ["class", "classname", "class:list"] {
        let mut cursor = 0;
        while let Some(relative) = lower[cursor..].find(name) {
            let name_start = cursor + relative;
            let mut expression = name_start + name.len();
            while source
                .as_bytes()
                .get(expression)
                .is_some_and(u8::is_ascii_whitespace)
            {
                expression += 1;
            }
            if source.as_bytes().get(expression) != Some(&b'=') {
                cursor = name_start + name.len();
                continue;
            }
            expression += 1;
            while source
                .as_bytes()
                .get(expression)
                .is_some_and(u8::is_ascii_whitespace)
            {
                expression += 1;
            }
            if source.as_bytes().get(expression) != Some(&b'{') {
                cursor = expression;
                continue;
            }
            let mut end = expression + 1;
            let mut depth = 1_u32;
            while end < source.len() && depth > 0 {
                match source.as_bytes()[end] {
                    b'{' => depth += 1,
                    b'}' => depth -= 1,
                    _ => {}
                }
                end += 1;
            }
            collect_nested_string_contexts(source, expression + 1, end.saturating_sub(1), contexts);
            cursor = end;
        }
    }
}

fn collect_css_directive_contexts(
    source: &str,
    offset: u32,
    contexts: &mut Vec<ClassListContextIr>,
) {
    for directive in find_css_directive_ranges(source) {
        if directive.name == "compose" {
            if directive.block_range.is_some() || !directive.quoted_string_ranges.is_empty() {
                continue;
            }
            let Some(mut start) = utf16_to_byte_offset(source, directive.prelude_range.start)
            else {
                continue;
            };
            let Some(mut end) = utf16_to_byte_offset(source, directive.prelude_range.end) else {
                continue;
            };
            while start < end && source.as_bytes()[start].is_ascii_whitespace() {
                start += 1;
            }
            while end > start && source.as_bytes()[end - 1].is_ascii_whitespace() {
                end -= 1;
            }
            let Some(start) = byte_to_utf16_offset(source, start) else {
                continue;
            };
            let Some(end) = byte_to_utf16_offset(source, end) else {
                continue;
            };
            contexts.push(ClassListContextIr {
                start: offset + start,
                end: offset + end,
                unescape: Vec::new(),
            });
        } else if directive.name == "safelist" {
            for quoted in directive.quoted_string_ranges {
                contexts.push(ClassListContextIr {
                    start: offset + quoted.content_range.start,
                    end: offset + quoted.content_range.end,
                    unescape: Vec::new(),
                });
            }
        }
    }
}

fn collect_sfc_style_contexts(source: &str, contexts: &mut Vec<ClassListContextIr>) {
    let lower = source.to_ascii_lowercase();
    let mut cursor = 0;
    while let Some(relative_open) = lower[cursor..].find("<style") {
        let open = cursor + relative_open;
        let Some(relative_body) = source[open..].find('>') else {
            break;
        };
        let body_start = open + relative_body + 1;
        let Some(relative_close) = lower[body_start..].find("</style>") else {
            break;
        };
        let body_end = body_start + relative_close;
        let Some(offset) = byte_to_utf16_offset(source, body_start) else {
            break;
        };
        collect_css_directive_contexts(&source[body_start..body_end], offset, contexts);
        cursor = body_end + "</style>".len();
    }
}

#[derive(Debug, thiserror::Error)]
pub enum LanguageError {
    #[error(transparent)]
    Engine(#[from] EngineError),
    #[error("Language input contains a range outside the UTF-16 document boundary.")]
    InvalidRange,
}

pub fn collect_class_positions(
    source: &str,
    contexts: &[ClassListContextIr],
) -> Result<Vec<ClassPositionIr>, LanguageError> {
    let mut positions = Vec::new();
    for context in contexts {
        let start =
            utf16_to_byte_offset(source, context.start).ok_or(LanguageError::InvalidRange)?;
        let end = utf16_to_byte_offset(source, context.end).ok_or(LanguageError::InvalidRange)?;
        if start > end {
            return Err(LanguageError::InvalidRange);
        }
        let class_list = &source[start..end];
        if class_list.is_empty() {
            positions.push(ClassPositionIr {
                range: SourceRange {
                    start: context.start,
                    end: context.start,
                },
                context_range: SourceRange {
                    start: context.start,
                    end: context.end,
                },
                token: String::new(),
                raw: String::new(),
            });
            continue;
        }
        for range in collect_class_list_token_ranges(class_list) {
            let raw_start = utf16_to_byte_offset(class_list, range.range.start)
                .ok_or(LanguageError::InvalidRange)?;
            let raw_end = utf16_to_byte_offset(class_list, range.range.end)
                .ok_or(LanguageError::InvalidRange)?;
            let raw = class_list[raw_start..raw_end].to_owned();
            positions.push(ClassPositionIr {
                range: SourceRange {
                    start: context.start + range.range.start,
                    end: context.start + range.range.end,
                },
                context_range: SourceRange {
                    start: context.start,
                    end: context.end,
                },
                token: unescape_token(&raw, &context.unescape),
                raw,
            });
        }
    }
    positions.sort_by_key(|position| (position.range.start, position.range.end));
    positions.dedup_by(|left, right| left.range == right.range);
    Ok(positions)
}

pub fn encode_semantic_tokens(source: &str, tokens: &[SemanticTokenInputIr]) -> Vec<u32> {
    let mut tokens = tokens
        .iter()
        .filter(|token| token.end > token.start)
        .cloned()
        .collect::<Vec<_>>();
    tokens.sort_by_key(|token| (token.start, token.end));

    let mut data = Vec::new();
    let mut previous_line = 0;
    let mut previous_character = 0;
    let mut previous_end = None;
    for token in tokens {
        if previous_end.is_some_and(|end| token.start < end) {
            continue;
        }
        let Some((start_line, start_character)) = position_at(source, token.start) else {
            continue;
        };
        let Some((end_line, end_character)) = position_at(source, token.end) else {
            continue;
        };
        if start_line != end_line {
            continue;
        }
        let Some(type_index) = SEMANTIC_TOKEN_TYPES
            .iter()
            .position(|token_type| *token_type == token.token_type)
        else {
            continue;
        };
        data.extend([
            start_line - previous_line,
            if start_line == previous_line {
                start_character - previous_character
            } else {
                start_character
            },
            end_character - start_character,
            type_index as u32,
            modifier_bits(&token.modifiers),
        ]);
        previous_line = start_line;
        previous_character = start_character;
        previous_end = Some(token.end);
    }
    data
}

const SEMANTIC_TOKEN_TYPES: [&str; 11] = [
    "class",
    "enumMember",
    "property",
    "variable",
    "function",
    "number",
    "string",
    "keyword",
    "modifier",
    "operator",
    "type",
];

const SEMANTIC_TOKEN_MODIFIERS: [&str; 24] = [
    "declaration",
    "defaultLibrary",
    "component",
    "directive",
    "important",
    "pseudoClass",
    "pseudoElement",
    "query",
    "quoted",
    "selector",
    "unit",
    "blockBrace",
    "declarationSeparator",
    "declarationTerminator",
    "directiveTerminator",
    "functionPunctuation",
    "valueSeparator",
    "valueOperator",
    "queryOperator",
    "queryPunctuation",
    "selectorCombinator",
    "selectorPunctuation",
    "pseudoClassDelimiter",
    "pseudoElementDelimiter",
];

fn modifier_bits(modifiers: &[String]) -> u32 {
    modifiers.iter().fold(0, |bits, modifier| {
        SEMANTIC_TOKEN_MODIFIERS
            .iter()
            .position(|candidate| *candidate == modifier)
            .map_or(bits, |index| bits | (1 << index))
    })
}

fn unescape_token(raw: &str, characters: &[String]) -> String {
    characters.iter().fold(raw.to_owned(), |token, character| {
        token.replace(&format!("\\{character}"), character)
    })
}

fn position_at(source: &str, offset: u32) -> Option<(u32, u32)> {
    if offset > utf16_len(source) {
        return None;
    }
    let mut line = 0;
    let mut character = 0;
    let mut utf16_offset = 0;
    let mut chars = source.chars().peekable();
    while let Some(value) = chars.next() {
        if utf16_offset == offset {
            return Some((line, character));
        }
        let length = value.len_utf16() as u32;
        if utf16_offset + length > offset {
            return None;
        }
        utf16_offset += length;
        if value == '\r' {
            if chars.peek() == Some(&'\n') {
                chars.next();
                utf16_offset += 1;
            }
            line += 1;
            character = 0;
        } else if value == '\n' {
            line += 1;
            character = 0;
        } else {
            character += length;
        }
    }
    (utf16_offset == offset).then_some((line, character))
}

#[cfg(test)]
mod tests {
    use super::*;
    use mastercss_lexer::collect_class_list_cursor_ranges;

    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct LexerParityCorpus {
        parser_cases: Vec<LexerParityCase>,
    }

    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct LexerParityCase {
        source_id: String,
        kind: String,
        input: String,
    }

    fn token_views(
        source: &str,
        tokens: &[SemanticTokenInputIr],
    ) -> Vec<(String, String, Vec<String>)> {
        tokens
            .iter()
            .map(|token| {
                (
                    source_slice(
                        source,
                        &SourceRange {
                            start: token.start,
                            end: token.end,
                        },
                    )
                    .unwrap()
                    .to_owned(),
                    token.token_type.clone(),
                    token.modifiers.clone(),
                )
            })
            .collect()
    }

    #[test]
    fn executes_rc87_language_lexer_parity_corpus() {
        let corpus: LexerParityCorpus =
            serde_json::from_str(include_str!("../../../parity/rust-semantic-corpus.json"))
                .unwrap();
        let source_ids = [
            "rc87-56bd470c266dafff",
            "rc87-51f771f5b7ef1697",
            "rc87-1e55f6831835ae55",
            "rc87-3b3607e8b4b583a3",
            "rc87-58dfe44e344938aa",
            "rc87-116f378a8315c994",
            "rc87-377b579d44d48303",
            "rc87-26f2db55b217f0d5",
            "rc87-bcbede53a81f0bc5",
            "rc87-eb118a232c54e6de",
            "rc87-af4d2924300d54db",
        ];
        let session = LanguageSession::create(include_str!(
            "../../../packages/preset/src/default-manifest.json"
        ))
        .unwrap();
        let mut executed = 0;
        for case in corpus
            .parser_cases
            .into_iter()
            .filter(|case| case.kind == "lexer" && source_ids.contains(&case.source_id.as_str()))
        {
            executed += 1;
            match case.source_id.as_str() {
                "rc87-56bd470c266dafff" => assert_eq!(
                    collect_class_list_cursor_ranges(&case.input),
                    [
                        SourceRange { start: 0, end: 1 },
                        SourceRange { start: 1, end: 1 },
                        SourceRange { start: 2, end: 2 },
                        SourceRange { start: 3, end: 4 },
                        SourceRange { start: 4, end: 4 },
                        SourceRange { start: 5, end: 5 },
                    ]
                ),
                "rc87-51f771f5b7ef1697" => {
                    let mut tokens = Vec::new();
                    push_value_semantic_tokens(&mut tokens, &case.input, 0, &HashSet::new());
                    assert_eq!(
                        token_views(&case.input, &tokens)
                            .into_iter()
                            .map(|(text, token_type, _)| (text, token_type))
                            .collect::<Vec<_>>(),
                        [
                            ("12".into(), "number".into()),
                            ("px".into(), "enumMember".into()),
                            ("/".into(), "operator".into()),
                            ("$space".into(), "variable".into()),
                            ("url".into(), "function".into()),
                            ("(".into(), "operator".into()),
                            ("\"".into(), "string".into()),
                            ("/a;b.png".into(), "string".into()),
                            ("\"".into(), "string".into()),
                            (")".into(), "operator".into()),
                            ("!".into(), "operator".into()),
                        ]
                    );
                    assert!(
                        tokens
                            .last()
                            .unwrap()
                            .modifiers
                            .contains(&"important".into())
                    );
                }
                "rc87-1e55f6831835ae55" => {
                    let mut tokens = Vec::new();
                    push_value_semantic_tokens(&mut tokens, &case.input, 0, &HashSet::new());
                    assert_eq!(
                        token_views(&case.input, &tokens)
                            .into_iter()
                            .map(|(text, _, _)| text)
                            .collect::<Vec<_>>(),
                        [
                            "--value", "(", ")", "calc", "(", "--value", "(", ")", "*", "-", "1",
                            ")"
                        ]
                    );
                }
                "rc87-3b3607e8b4b583a3" => {
                    let mut tokens = Vec::new();
                    push_query_semantic_tokens(&mut tokens, &case.input[..8], 0);
                    push_state_semantic_tokens(&mut tokens, &case.input[8..], 8);
                    assert_eq!(
                        token_views(&case.input, &tokens)
                            .into_iter()
                            .map(|(text, _, _)| text)
                            .collect::<Vec<_>>(),
                        ["@sm", ">=", "640", ":", "hover", ">", ".", "item"]
                    );
                }
                "rc87-58dfe44e344938aa" => {
                    let state_start = case.input.find('_').unwrap();
                    let mut tokens = Vec::new();
                    push_query_semantic_tokens(&mut tokens, &case.input[..state_start], 0);
                    push_state_semantic_tokens(
                        &mut tokens,
                        &case.input[state_start..],
                        state_start as u32,
                    );
                    assert_eq!(
                        token_views(&case.input, &tokens)
                            .into_iter()
                            .map(|(text, _, _)| text)
                            .collect::<Vec<_>>(),
                        [
                            "@media", "(", "pointer", ":", "coarse", ")", ",", "screen", "_", ":",
                            "is", "(", ".", "active", ",", "#", "target", ",", "button", ")"
                        ]
                    );
                }
                "rc87-116f378a8315c994" => {
                    let mut tokens = Vec::new();
                    push_query_semantic_tokens(&mut tokens, &case.input, 0);
                    assert_eq!(
                        token_views(&case.input, &tokens)
                            .into_iter()
                            .map(|(text, _, _)| text)
                            .collect::<Vec<_>>(),
                        ["@", "sm", "&", "<=", "md"]
                    );
                }
                "rc87-377b579d44d48303" => {
                    let mut tokens = Vec::new();
                    session
                        .push_class_semantic_tokens(&case.input, 0, &mut tokens)
                        .unwrap();
                    assert_eq!(
                        token_views(&case.input, &tokens)
                            .into_iter()
                            .map(|(text, _, _)| text)
                            .collect::<Vec<_>>(),
                        ["{", "fg", ":", "red", ";", "bg", ":", "blue", "}"]
                    );
                }
                "rc87-26f2db55b217f0d5" => {
                    let mut tokens = Vec::new();
                    session
                        .push_class_semantic_tokens(&case.input, 0, &mut tokens)
                        .unwrap();
                    let views = token_views(&case.input, &tokens);
                    assert_eq!(
                        views
                            .iter()
                            .map(|(text, _, _)| text.as_str())
                            .collect::<Vec<_>>(),
                        [
                            "{", "fg", ":", "red", ";", "block", "}", ">", "li", ":", "hover",
                            "@sm"
                        ]
                    );
                    assert!(
                        views
                            .iter()
                            .any(|(_, _, modifiers)| modifiers
                                .contains(&"selectorCombinator".into()))
                    );
                }
                "rc87-bcbede53a81f0bc5" => {
                    let mut tokens = Vec::new();
                    session
                        .push_class_semantic_tokens(&case.input, 0, &mut tokens)
                        .unwrap();
                    assert_eq!(
                        token_views(&case.input, &tokens)
                            .iter()
                            .map(|(text, _, _)| text.as_str())
                            .collect::<Vec<_>>(),
                        ["{", "block", "}", "@sm"]
                    );
                }
                "rc87-eb118a232c54e6de" => {
                    let mut tokens = Vec::new();
                    session
                        .push_class_semantic_tokens(&case.input, 0, &mut tokens)
                        .unwrap();
                    assert_eq!(
                        token_views(&case.input, &tokens)
                            .iter()
                            .map(|(text, _, _)| text.as_str())
                            .collect::<Vec<_>>(),
                        ["{", "fg", ":", "red", ";", "bg", ":", "blue"]
                    );
                }
                "rc87-af4d2924300d54db" => {
                    let mut tokens = Vec::new();
                    session
                        .push_class_semantic_tokens(&case.input, 0, &mut tokens)
                        .unwrap();
                    assert_eq!(
                        token_views(&case.input, &tokens)
                            .iter()
                            .map(|(text, _, _)| text.as_str())
                            .collect::<Vec<_>>(),
                        ["fg", ":", "red", ";", "bg", ":", "blue"]
                    );
                }
                source_id => panic!("unhandled language-owned lexer case {source_id}"),
            }
        }
        assert_eq!(executed, 11);
    }

    #[test]
    fn keeps_class_positions_and_semantic_tokens_in_utf16() {
        let source = "😀 <div class=\"fg:red  m:1x\">\r\nnext</div>";
        let class_start = source
            .encode_utf16()
            .position(|unit| unit == 'f' as u16)
            .unwrap() as u32;
        let class_end = class_start + "fg:red  m:1x".encode_utf16().count() as u32;
        let class_positions = collect_class_positions(
            source,
            &[ClassListContextIr {
                start: class_start,
                end: class_end,
                unescape: Vec::new(),
            }],
        )
        .unwrap();
        let semantic_token_data = encode_semantic_tokens(
            source,
            &[
                SemanticTokenInputIr {
                    start: class_start,
                    end: class_start + 6,
                    token_type: "property".into(),
                    modifiers: vec!["declaration".into()],
                    role: None,
                },
                SemanticTokenInputIr {
                    start: class_start + 8,
                    end: class_end,
                    token_type: "variable".into(),
                    modifiers: Vec::new(),
                    role: None,
                },
            ],
        );
        assert_eq!(class_positions[0].token, "fg:red");
        assert_eq!(class_positions[1].token, "m:1x");
        assert_eq!(
            semantic_token_data,
            [0, class_start, 6, 2, 1, 0, 8, 4, 3, 0]
        );
    }

    #[test]
    fn treats_plaintext_as_a_class_list_and_skips_markup_comments() {
        let class_list = "fg:brand:hover@sm {bg:blue;fg:white}";
        let contexts = collect_document_contexts(
            class_list,
            "plaintext",
            &LanguageDocumentSettingsIr::default(),
        );
        assert_eq!(
            collect_class_positions(class_list, &contexts)
                .unwrap()
                .iter()
                .map(|position| position.token.as_str())
                .collect::<Vec<_>>(),
            ["fg:brand:hover@sm", "{bg:blue;fg:white}"]
        );

        let html = "<!-- <div class=\"fg:red\"></div> --><div class=\"fg:blue\"></div>";
        let contexts =
            collect_document_contexts(html, "html", &LanguageDocumentSettingsIr::default());
        assert_eq!(
            collect_class_positions(html, &contexts)
                .unwrap()
                .iter()
                .map(|position| position.token.as_str())
                .collect::<Vec<_>>(),
            ["fg:blue"]
        );
    }

    #[test]
    fn applies_document_context_settings_in_rust() {
        let markup = r#"<div data-class="fg:red"></div>"#;
        let contexts = collect_document_contexts(
            markup,
            "html",
            &LanguageDocumentSettingsIr {
                class_attributes: vec!["data-class".into()],
                ..LanguageDocumentSettingsIr::default()
            },
        );
        assert_eq!(
            collect_class_positions(markup, &contexts)
                .unwrap()
                .iter()
                .map(|position| position.token.as_str())
                .collect::<Vec<_>>(),
            ["fg:red"]
        );

        let script = r#"twMerge("fg:blue"); const styles = "block";"#;
        let contexts = collect_document_contexts(
            script,
            "typescript",
            &LanguageDocumentSettingsIr {
                class_functions: vec!["twMerge".into()],
                class_declarations: vec!["const styles".into()],
                ..LanguageDocumentSettingsIr::default()
            },
        );
        assert_eq!(
            collect_class_positions(script, &contexts)
                .unwrap()
                .iter()
                .map(|position| position.token.as_str())
                .collect::<Vec<_>>(),
            ["fg:blue", "block"]
        );
    }

    #[test]
    fn tokenizes_group_terminators_and_selector_combinators_in_rust() {
        let session = LanguageSession::create(
            r#"{
              "version":1,
              "utilities":[
                {
                  "id":"block",
                  "type":-1,
                  "emit":{"type":"static","rules":[{"declarations":{"display":"block"}}]},
                  "matchers":[{"type":"static","name":"block"}]
                },
                {
                  "id":"foreground-color",
                  "type":0,
                  "emit":{"type":"property","property":"color"},
                  "matchers":[{"type":"key","keys":["fg"]}]
                }
              ]
            }"#,
        )
        .unwrap();
        let source = "<div class=\"{fg:red;block}>li:hover@sm\"></div>";
        let result = session
            .analyze_document(&AnalyzeDocumentRequestIr {
                source: source.into(),
                language_id: "html".into(),
                host_ranges: Vec::new(),
                settings: LanguageDocumentSettingsIr::default(),
            })
            .unwrap();
        assert!(result.semantic_tokens.iter().any(|token| {
            token
                .modifiers
                .iter()
                .any(|modifier| modifier == "declarationTerminator")
        }));
        assert!(result.semantic_tokens.iter().any(|token| {
            token
                .modifiers
                .iter()
                .any(|modifier| modifier == "selectorCombinator")
        }));
        assert!(result.semantic_tokens.iter().any(|token| {
            token.token_type == "property"
                && token.modifiers.is_empty()
                && source_slice(
                    source,
                    &SourceRange {
                        start: token.start,
                        end: token.end,
                    },
                ) == Some("fg")
        }));
    }

    #[test]
    fn skips_overlapping_and_multiline_tokens() {
        let source = "a\nb";
        assert_eq!(
            encode_semantic_tokens(
                source,
                &[
                    SemanticTokenInputIr {
                        start: 0,
                        end: 1,
                        token_type: "class".into(),
                        modifiers: Vec::new(),
                        role: None,
                    },
                    SemanticTokenInputIr {
                        start: 0,
                        end: 2,
                        token_type: "enumMember".into(),
                        modifiers: Vec::new(),
                        role: None,
                    },
                    SemanticTokenInputIr {
                        start: 2,
                        end: 3,
                        token_type: "property".into(),
                        modifiers: Vec::new(),
                        role: None,
                    },
                ]
            ),
            [0, 0, 1, 0, 0, 1, 0, 1, 2, 0]
        );
    }

    #[test]
    fn batches_manifest_driven_class_semantics() {
        let mut session = LanguageSession::create(
            r#"{
              "version":1,
              "variables":{"spacing":[{"key":"md","type":"number","value":"1rem"}]},
              "utilities":[
                {
                  "id":"card",
                  "name":"card",
                  "type":-2,
                  "layer":"components",
                  "emit":{"type":"static","rules":[{"declarations":{"display":"block"}}]},
                  "matchers":[{"type":"static","name":"card"}]
                },
                {
                  "id":"width",
                  "type":0,
                  "variableAliasRefs":["~spacing"],
                  "emit":{"type":"property","property":"width"},
                  "matchers":[{"type":"key","keys":["w"]}]
                }
              ]
            }"#,
        )
        .unwrap();
        let batch = session
            .classify_class_names(["card:hover", "w:10px", "w:md", "unknown"], None)
            .unwrap();
        assert_eq!(batch.version, LANGUAGE_BATCH_VERSION);
        assert_eq!(
            batch.classes[0].kind,
            mastercss_engine::ClassSemanticKind::Component
        );
        assert_eq!(batch.classes[0].state_token.as_deref(), Some(":hover"));
        assert_eq!(batch.classes[1].key_token.as_deref(), Some("w:"));
        assert_eq!(batch.classes[1].value_token.as_deref(), Some("10px"));
        assert_eq!(batch.variable_names, ["spacing-md"]);
        assert_eq!(
            batch.classes[3].kind,
            mastercss_engine::ClassSemanticKind::Unknown
        );
    }

    #[test]
    fn commits_only_host_supported_native_class_semantics() {
        let mut session = LanguageSession::create(r#"{"version":1,"utilities":[]}"#).unwrap();
        let class_names = ["display:block", "made-up:nope"];
        let candidates = session.native_declaration_candidates(class_names).unwrap();
        assert_eq!(candidates.len(), 2);
        let batch = session
            .classify_class_names(class_names, Some(&[true, false]))
            .unwrap();
        assert_eq!(
            batch.classes[0].kind,
            mastercss_engine::ClassSemanticKind::Declaration
        );
        assert_eq!(
            batch.classes[1].kind,
            mastercss_engine::ClassSemanticKind::Unknown
        );
        assert_eq!(
            session
                .inspect_class_name("display:block", None, None)
                .unwrap()
                .kind,
            ClassSemanticKind::Declaration
        );
        assert_eq!(
            session
                .inspect_class_name("made-up:nope", None, None)
                .unwrap()
                .kind,
            ClassSemanticKind::Unknown
        );
    }

    #[test]
    fn renders_isolated_hover_inspection_css() {
        let session = LanguageSession::create(
            r#"{
              "version":1,
              "settings":{"modeTrigger":"class"},
              "variables":{"color":[{"key":"brand","value":"oklch(50% .1 20)"}]},
              "utilities":[
                {
                  "id":"card",
                  "name":"card",
                  "type":-2,
                  "layer":"components",
                  "emit":{"type":"static","rules":[{"declarations":{"display":"block"}}]},
                  "matchers":[{"type":"static","name":"card"}]
                },
                {
                  "id":"foreground-color",
                  "type":0,
                  "variableAliases":[["brand","color-brand"]],
                  "emit":{"type":"property","property":"color"},
                  "matchers":[{"type":"variable","keys":["fg"]}]
                }
              ]
            }"#,
        )
        .unwrap();
        let inspection = session
            .inspect_class_name("card:hover", None, None)
            .unwrap();
        assert_eq!(inspection.version, LANGUAGE_BATCH_VERSION);
        assert!(inspection.valid);
        assert_eq!(inspection.kind, ClassSemanticKind::Component);
        assert_eq!(inspection.base, "card");
        assert_eq!(inspection.suffix, ":hover");
        assert_eq!(inspection.state_token.as_deref(), Some(":hover"));
        assert_eq!(inspection.rules.len(), 1);
        assert_eq!(
            inspection.text,
            "@layer components{.card\\:hover:hover{display:block}}"
        );
        let forced_mode = session
            .inspect_class_name("card", None, Some("dark"))
            .unwrap();
        assert_eq!(
            forced_mode.text,
            "@layer components{.dark .card{display:block}}"
        );
        let variable = session
            .inspect_class_name("fg:brand:hover", None, None)
            .unwrap();
        assert_eq!(variable.base, "fg:brand");
        assert_eq!(variable.suffix, ":hover");
        assert_eq!(variable.key.as_deref(), Some("fg"));
        assert_eq!(variable.value.as_deref(), Some("brand"));
        assert_eq!(variable.variables.len(), 1);
        assert_eq!(variable.variables[0].key, "brand");
        assert_eq!(variable.variables[0].variable.name, "color-brand");
        assert_eq!(
            variable.variables[0].variable.value,
            Some(serde_json::Value::String("oklch(50% .1 20)".into()))
        );
        let completion_index = session.completion_index().unwrap();
        assert_eq!(completion_index.version, LANGUAGE_BATCH_VERSION);
        assert!(completion_index.class_entries.iter().any(|entry| {
            entry.label == "card"
                && entry.kind == LanguageCompletionKind::Value
                && entry.detail.as_deref() == Some("component")
                && entry.documentation_text.as_deref()
                    == Some("@layer components{.card{display:block}}")
        }));
        assert_eq!(
            session.color_presentation("rgb(0|0|0)").unwrap().space,
            Some("srgb".into())
        );
        assert_eq!(
            session.color_presentation("brand/.5").unwrap().space,
            Some("oklch".into())
        );
        let color_tokens = session
            .color_tokens(&[
                LanguageColorCandidateInputIr {
                    class_name: "fg:brand/.5".into(),
                    start: 2,
                },
                LanguageColorCandidateInputIr {
                    class_name: "fg:linear-gradient(#000,brand)".into(),
                    start: 20,
                },
            ])
            .unwrap();
        assert_eq!(color_tokens.version, LANGUAGE_BATCH_VERSION);
        assert_eq!(
            color_tokens.tokens,
            vec![
                LanguageColorTokenIr {
                    range: SourceRange { start: 5, end: 13 },
                    value: "oklch(50% .1 20)".into(),
                    alpha: Some(0.5),
                },
                LanguageColorTokenIr {
                    range: SourceRange { start: 39, end: 43 },
                    value: "#000".into(),
                    alpha: None,
                },
                LanguageColorTokenIr {
                    range: SourceRange { start: 44, end: 49 },
                    value: "oklch(50% .1 20)".into(),
                    alpha: None,
                },
            ]
        );
        assert!(completion_index.class_entries.iter().any(|entry| {
            entry.label == "fg:"
                && entry.kind == LanguageCompletionKind::Property
                && entry.detail.as_deref() == Some("color")
                && entry.trigger_suggest
        }));
    }
}
