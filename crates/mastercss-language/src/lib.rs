#![forbid(unsafe_code)]

use mastercss_engine::{
    ClassSemanticInspection, ClassSemanticKind, EngineClassCompletionKind, EngineClassVariableIr,
    EngineError, EngineSession, UtilityMatcherType,
};
use mastercss_lexer::{collect_class_list_token_ranges, utf16_len, utf16_to_byte_offset};
use mastercss_schema::{
    GeneratedRuleIr, LANGUAGE_BATCH_VERSION, NativeDeclarationCandidateIr, SourceRange,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
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

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SemanticTokenInputIr {
    pub start: u32,
    pub end: u32,
    #[serde(rename = "type")]
    pub token_type: String,
    #[serde(default)]
    pub modifiers: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanguageBatchIr {
    pub version: u32,
    pub class_positions: Vec<ClassPositionIr>,
    pub semantic_token_data: Vec<u32>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanguageClassificationsIr {
    pub version: u32,
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

impl LanguageSession {
    pub fn create(manifest_json: &str) -> Result<Self, LanguageError> {
        Ok(Self {
            engine: EngineSession::create(manifest_json)?,
            manifest_json: manifest_json.to_owned(),
            native_support_by_class: HashMap::new(),
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

#[derive(Debug, thiserror::Error)]
pub enum LanguageError {
    #[error(transparent)]
    Engine(#[from] EngineError),
    #[error("Language input contains a range outside the UTF-16 document boundary.")]
    InvalidRange,
    #[error("Invalid language batch JSON: {0}")]
    InvalidJson(#[from] serde_json::Error),
}

pub fn analyze_language_json(
    source: &str,
    contexts_json: &str,
    semantic_tokens_json: &str,
) -> Result<String, LanguageError> {
    let contexts: Vec<ClassListContextIr> = serde_json::from_str(contexts_json)?;
    let semantic_tokens: Vec<SemanticTokenInputIr> = serde_json::from_str(semantic_tokens_json)?;
    Ok(serde_json::to_string(&analyze_language(
        source,
        &contexts,
        &semantic_tokens,
    )?)?)
}

pub fn analyze_language(
    source: &str,
    contexts: &[ClassListContextIr],
    semantic_tokens: &[SemanticTokenInputIr],
) -> Result<LanguageBatchIr, LanguageError> {
    Ok(LanguageBatchIr {
        version: LANGUAGE_BATCH_VERSION,
        class_positions: collect_class_positions(source, contexts)?,
        semantic_token_data: encode_semantic_tokens(source, semantic_tokens),
    })
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

    #[test]
    fn keeps_class_positions_and_semantic_tokens_in_utf16() {
        let source = "😀 <div class=\"fg:red  m:1x\">\r\nnext</div>";
        let class_start = source
            .encode_utf16()
            .position(|unit| unit == 'f' as u16)
            .unwrap() as u32;
        let class_end = class_start + "fg:red  m:1x".encode_utf16().count() as u32;
        let batch = analyze_language(
            source,
            &[ClassListContextIr {
                start: class_start,
                end: class_end,
                unescape: Vec::new(),
            }],
            &[
                SemanticTokenInputIr {
                    start: class_start,
                    end: class_start + 6,
                    token_type: "property".into(),
                    modifiers: vec!["declaration".into()],
                },
                SemanticTokenInputIr {
                    start: class_start + 8,
                    end: class_end,
                    token_type: "variable".into(),
                    modifiers: Vec::new(),
                },
            ],
        )
        .unwrap();
        assert_eq!(batch.version, 1);
        assert_eq!(batch.class_positions[0].token, "fg:red");
        assert_eq!(batch.class_positions[1].token, "m:1x");
        assert_eq!(
            batch.semantic_token_data,
            [0, class_start, 6, 2, 1, 0, 8, 4, 3, 0]
        );
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
                    },
                    SemanticTokenInputIr {
                        start: 0,
                        end: 2,
                        token_type: "enumMember".into(),
                        modifiers: Vec::new(),
                    },
                    SemanticTokenInputIr {
                        start: 2,
                        end: 3,
                        token_type: "property".into(),
                        modifiers: Vec::new(),
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
                  "emit":{"type":"property","property":"width"},
                  "matchers":[{"type":"key","keys":["w"]}]
                }
              ]
            }"#,
        )
        .unwrap();
        let batch = session
            .classify_class_names(["card:hover", "w:10px", "unknown"], None)
            .unwrap();
        assert_eq!(batch.version, LANGUAGE_BATCH_VERSION);
        assert_eq!(
            batch.classes[0].kind,
            mastercss_engine::ClassSemanticKind::Component
        );
        assert_eq!(batch.classes[0].state_token.as_deref(), Some(":hover"));
        assert_eq!(batch.classes[1].key_token.as_deref(), Some("w:"));
        assert_eq!(batch.classes[1].value_token.as_deref(), Some("10px"));
        assert_eq!(
            batch.classes[2].kind,
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
