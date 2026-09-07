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
use std::sync::OnceLock;

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

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LanguageCompletionKind {
    Property,
    Value,
    Function,
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

#[derive(Debug, Deserialize)]
struct MdnCompletionRegistry {
    pseudos: Vec<String>,
    properties: HashMap<String, Vec<MdnCompletionValue>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MdnCompletionValue {
    label: String,
    kind: LanguageCompletionKind,
}

fn mdn_completion_registry() -> &'static MdnCompletionRegistry {
    static REGISTRY: OnceLock<MdnCompletionRegistry> = OnceLock::new();
    REGISTRY.get_or_init(|| {
        serde_json::from_str(include_str!("mdn-completion-registry.json"))
            .expect("generated MDN completion registry must be valid JSON")
    })
}

fn pseudo_completion_sort_text(label: &str) -> String {
    if label.starts_with("::") {
        let mut sort_text = if let Some(name) = label.strip_prefix("::-") {
            format!("zzzz{name}")
        } else {
            format!("zz{}", label.strip_prefix("::").unwrap_or(label))
        };
        if sort_text.ends_with("()") {
            sort_text.insert(0, 'z');
        }
        return sort_text;
    }
    let mut sort_text = if let Some(name) = label.strip_prefix(":-") {
        format!("yyyy{name}")
    } else {
        format!("yy{}", label.strip_prefix(':').unwrap_or(label))
    };
    if sort_text.ends_with("()") {
        sort_text.insert(0, 'y');
    }
    sort_text
}

fn canonical_mdn_property(name: &str) -> &str {
    for prefix in ["-webkit-", "-moz-", "-ms-"] {
        if let Some(unprefixed) = name.strip_prefix(prefix) {
            return unprefixed;
        }
    }
    name
}

fn augment_completion_entries(entries: &mut Vec<LanguageCompletionEntryIr>) {
    let registry = mdn_completion_registry();
    let pseudo_labels = registry.pseudos.iter().collect::<HashSet<_>>();
    for entry in entries
        .iter_mut()
        .filter(|entry| entry.label.starts_with(':'))
    {
        let functional_label = format!("{}()", entry.label);
        if pseudo_labels.contains(&functional_label) {
            entry.label = functional_label;
        }
        entry.sort_text = Some(pseudo_completion_sort_text(&entry.label));
    }
    let mut by_label = entries
        .iter()
        .enumerate()
        .map(|(index, entry)| (entry.label.clone(), index))
        .collect::<HashMap<_, _>>();

    for label in &registry.pseudos {
        let sort_text = pseudo_completion_sort_text(label);
        if let Some(index) = by_label.get(label).copied() {
            entries[index].sort_text = Some(sort_text);
        } else {
            by_label.insert(label.clone(), entries.len());
            entries.push(LanguageCompletionEntryIr {
                label: label.clone(),
                kind: LanguageCompletionKind::Value,
                detail: None,
                documentation_text: None,
                sort_text: Some(sort_text),
                trigger_suggest: false,
            });
        }
    }

    let mut properties = entries
        .iter()
        .filter(|entry| entry.kind == LanguageCompletionKind::Property)
        .filter_map(|entry| {
            let key = entry.label.strip_suffix(':')?;
            let property = entry
                .detail
                .as_deref()
                .filter(|detail| *detail != "ambiguous key")
                .unwrap_or(key);
            Some((key.to_owned(), property.to_owned()))
        })
        .collect::<Vec<_>>();
    properties.extend([
        ("display".into(), "display".into()),
        ("font-style".into(), "font-style".into()),
        ("line-clamp".into(), "line-clamp".into()),
        ("text-align".into(), "text-align".into()),
        ("user-select".into(), "user-select".into()),
        ("-webkit-text-size-adjust".into(), "text-size-adjust".into()),
        ("-moz-text-size-adjust".into(), "text-size-adjust".into()),
        ("-ms-text-size-adjust".into(), "text-size-adjust".into()),
    ]);

    for (key, property) in properties {
        let property_values = registry
            .properties
            .get(&property)
            .or_else(|| registry.properties.get(canonical_mdn_property(&property)));
        let Some(property_values) = property_values else {
            continue;
        };
        for value in property_values {
            let label = format!("{key}:{}", value.label);
            let detail = format!("{property}: {}", value.label);
            let sort_text = format!("ccccc{}", value.label);
            if let Some(index) = by_label.get(&label).copied() {
                entries[index].detail.get_or_insert(detail);
                entries[index].sort_text = Some(sort_text);
                if value.kind == LanguageCompletionKind::Function {
                    entries[index].kind = LanguageCompletionKind::Function;
                }
            } else {
                by_label.insert(label.clone(), entries.len());
                entries.push(LanguageCompletionEntryIr {
                    label,
                    kind: value.kind,
                    detail: Some(detail),
                    documentation_text: None,
                    sort_text: Some(sort_text),
                    trigger_suggest: false,
                });
            }
        }
    }

    let positive_entries = entries.clone();
    for entry in positive_entries {
        if !matches!(
            entry.kind,
            LanguageCompletionKind::Value | LanguageCompletionKind::Function
        ) || !entry.sort_text.as_deref().is_some_and(|sort_text| {
            sort_text.starts_with("aaaa-") && !sort_text.starts_with("aaaa-color-")
        }) {
            continue;
        }
        let Some((key, value)) = entry.label.split_once(':') else {
            continue;
        };
        if value.starts_with('-') {
            continue;
        }
        let label = format!("{key}:-{value}");
        if by_label.contains_key(&label) {
            continue;
        }
        by_label.insert(label.clone(), entries.len());
        entries.push(LanguageCompletionEntryIr { label, ..entry });
    }

    entries.retain(|entry| !matches!(entry.label.as_str(), "text:capitalize" | "text:center"));
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanguageColorPresentationIr {
    pub version: u32,
    pub color_token: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_format: Option<LanguageColorFormatIr>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanguageColorFormatIr {
    pub syntax: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub space: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum LanguageColorExpressionIr {
    Literal {
        value: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        alpha: Option<f64>,
    },
    Mix {
        space: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        hue: Option<String>,
        left: Box<LanguageColorExpressionIr>,
        right: Box<LanguageColorExpressionIr>,
        progress: f64,
        #[serde(rename = "alphaMultiplier")]
        alpha_multiplier: f64,
    },
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
    pub expression: LanguageColorExpressionIr,
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

mod color;
mod document;
mod formatting;
mod positions;
mod semantic_tokens;
mod session;

pub(crate) use document::*;
pub(crate) use formatting::*;
pub use positions::{LanguageError, collect_class_positions, encode_semantic_tokens};
pub(crate) use semantic_tokens::*;

#[cfg(test)]
#[path = "tests.rs"]
mod tests;
