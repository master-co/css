#![forbid(unsafe_code)]

use mastercss_engine::{ClassSemanticInspection, EngineError, EngineSession};
use mastercss_lexer::{collect_class_list_token_ranges, utf16_len, utf16_to_byte_offset};
use mastercss_schema::{LANGUAGE_BATCH_VERSION, NativeDeclarationCandidateIr, SourceRange};
use serde::{Deserialize, Serialize};

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

#[derive(Debug)]
pub struct LanguageSession {
    engine: EngineSession,
}

impl LanguageSession {
    pub fn create(manifest_json: &str) -> Result<Self, LanguageError> {
        Ok(Self {
            engine: EngineSession::create(manifest_json)?,
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
    }
}
