#![forbid(unsafe_code)]

mod class_list;

use mastercss_engine::{
    ClassSemanticInspection, EngineError, EngineSession, builtin_key_aliases,
    builtin_native_value_properties, natural_compare,
};
use mastercss_schema::{
    GeneratedRuleIr, LINT_BATCH_VERSION, NativeDeclarationCandidateIr, SourceRange,
    UtilityLayerName, ValidatorBatchIr,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::cmp::Ordering;
use std::collections::{HashMap, HashSet};

const UNKNOWN_PROPERTY_GROUP_ORDER: u8 = 99;
const UNKNOWN_PROPERTY_ORDER: u8 = 99;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClassConflictIr {
    pub class_name: String,
    pub conflicts: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PartialClassConflictIr {
    pub class_name: String,
    pub replacement: String,
    pub conflict: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LintEditIr {
    pub range: SourceRange,
    pub text: String,
    pub scope: LintEditScope,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum LintEditScope {
    ClassList,
    Directive,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LintDiagnosticIr {
    pub rule_id: String,
    pub code: String,
    pub message: String,
    pub range: SourceRange,
    #[serde(default, skip_serializing_if = "serde_json::Map::is_empty")]
    pub data: serde_json::Map<String, Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fix: Option<LintEditIr>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LintClassListIr {
    pub version: u32,
    pub analysis: LintBatchIr,
    pub diagnostics: Vec<LintDiagnosticIr>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sort_edit: Option<LintEditIr>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conflict_edit: Option<LintEditIr>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conflict_range: Option<SourceRange>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RawValueCandidateIr {
    pub class_name: String,
    pub key: String,
    pub segments: Vec<String>,
    pub properties: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RawValueCandidatesIr {
    pub version: u32,
    pub candidates: Vec<RawValueCandidateIr>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LintHostValidationIr {
    pub invalid_generated_classes: Vec<String>,
    pub validation_errors: Vec<Vec<String>>,
}

pub fn classify_host_rule_validation(
    batch: &ValidatorBatchIr,
    rule_errors: &[Vec<Vec<String>>],
) -> LintHostValidationIr {
    let validation_errors = batch
        .classes
        .iter()
        .enumerate()
        .map(|(class_index, class_result)| {
            if !class_result.matched {
                return Vec::new();
            }
            class_result
                .rules
                .iter()
                .enumerate()
                .flat_map(|(rule_index, _)| {
                    rule_errors
                        .get(class_index)
                        .and_then(|errors| errors.get(rule_index))
                        .cloned()
                        .unwrap_or_else(|| vec!["Host CSS validation result is missing.".into()])
                })
                .collect()
        })
        .collect::<Vec<Vec<String>>>();
    let invalid_generated_classes = batch
        .classes
        .iter()
        .enumerate()
        .filter(|(index, class_result)| {
            class_result.matched && !validation_errors[*index].is_empty()
        })
        .map(|(_, class_result)| class_result.class_name.clone())
        .collect();
    LintHostValidationIr {
        invalid_generated_classes,
        validation_errors,
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CanonicalClassNameOptions {
    #[serde(default = "default_true")]
    pub prefer_static_utilities: bool,
    #[serde(default = "default_true")]
    pub prefer_theme_tokens: bool,
    #[serde(default = "default_true")]
    pub prefer_property_aliases: bool,
    #[serde(default = "default_true")]
    pub prefer_variable_references: bool,
    #[serde(default = "default_true")]
    pub prefer_multi_value_tokens: bool,
    #[serde(default = "default_true")]
    pub prefer_composition_utilities: bool,
    #[serde(default = "default_true")]
    pub prefer_condition_order: bool,
    #[serde(default = "default_true")]
    pub prefer_native_declarations_in_compose: bool,
    #[serde(default = "default_true")]
    pub prefer_variant_blocks_in_compose: bool,
}

impl Default for CanonicalClassNameOptions {
    fn default() -> Self {
        Self {
            prefer_static_utilities: true,
            prefer_theme_tokens: true,
            prefer_property_aliases: true,
            prefer_variable_references: true,
            prefer_multi_value_tokens: true,
            prefer_composition_utilities: true,
            prefer_condition_order: true,
            prefer_native_declarations_in_compose: true,
            prefer_variant_blocks_in_compose: true,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CanonicalClassSuggestionIr {
    pub class_name: String,
    pub recommended: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CanonicalClassSuggestionsIr {
    pub version: u32,
    pub suggestions: Vec<CanonicalClassSuggestionIr>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CanonicalClassGroupSuggestionIr {
    pub class_names: Vec<String>,
    pub recommended: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CanonicalClassGroupSuggestionsIr {
    pub version: u32,
    pub suggestions: Vec<CanonicalClassGroupSuggestionIr>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum CanonicalComposeSuggestionKind {
    Class,
    NativeDeclaration,
    VariantBlock,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CanonicalComposeSuggestionIr {
    pub actual: String,
    pub recommended: String,
    pub class_names: Vec<String>,
    pub kind: CanonicalComposeSuggestionKind,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CanonicalComposeDirectiveIr {
    pub version: u32,
    pub suggestions: Vec<CanonicalComposeSuggestionIr>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub structural_change: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub replacement: Option<String>,
}

#[derive(Debug, Clone, Default)]
pub struct RawValuePolicy {
    pub allow_raw_values: bool,
    pub allow_properties: Vec<String>,
    pub allowed_patterns: Vec<regex::Regex>,
}

impl RawValuePolicy {
    pub fn new(
        allow_raw_values: bool,
        allow_properties: Vec<String>,
        allowed_patterns: Vec<String>,
    ) -> Result<Self, String> {
        let allowed_patterns = allowed_patterns
            .into_iter()
            .map(|pattern| {
                regex::Regex::new(&pattern)
                    .map_err(|error| format!("Invalid lint allowed pattern {pattern:?}: {error}"))
            })
            .collect::<Result<Vec<_>, _>>()?;
        Ok(Self {
            allow_raw_values,
            allow_properties,
            allowed_patterns,
        })
    }
}

#[derive(Debug, Clone, Copy, Default)]
pub struct LintClassListPolicy<'a> {
    pub validation_errors: &'a [Vec<String>],
    pub disallow_unknown_class: bool,
    pub raw_value_policy: Option<&'a RawValuePolicy>,
    pub canonical_options: Option<&'a CanonicalClassNameOptions>,
    pub compose_directive: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LintBatchIr {
    pub version: u32,
    pub sorted_class_names: Vec<String>,
    pub conflicts: Vec<ClassConflictIr>,
    pub partial_conflicts: Vec<PartialClassConflictIr>,
}

#[derive(Debug)]
pub struct LintSession {
    engine: EngineSession,
    variable_keys: Vec<String>,
    variable_values: HashMap<String, String>,
    canonical_index: CanonicalRecommendationIndex,
    supported_native_declarations: HashSet<(String, String)>,
}

#[derive(Debug, Default)]
struct CanonicalRecommendationIndex {
    static_candidates_by_signature: HashMap<String, Vec<String>>,
    preferred_aliases_by_property: HashMap<String, Vec<String>>,
    variable_keys_by_property_signature: HashMap<String, Vec<String>>,
    modes: HashSet<String>,
    breakpoints: HashSet<String>,
    root_size: f64,
    base_unit: f64,
}

#[derive(Debug)]
struct CanonicalClassParts {
    base: String,
    suffix: String,
    key: Option<String>,
    value: Option<String>,
}

#[derive(Debug)]
struct CanonicalCandidate {
    class_name: String,
    order: u8,
}

#[derive(Debug)]
struct MatchingVariableKeys {
    keys: Vec<String>,
    numeric: bool,
}

#[derive(Debug)]
struct CanonicalGroupEntry {
    index: usize,
    class_name: String,
    canonical_class_name: String,
    value: String,
    suffix: String,
    property: String,
    declarations: Vec<(String, String)>,
    rule: GeneratedRuleIr,
}

#[derive(Debug, Clone, Copy)]
struct CompositionRecipe {
    properties: [&'static str; 2],
    target_key: &'static str,
    equivalent_property: Option<(&'static str, [&'static str; 2])>,
}

const COMPOSITION_RECIPES: [CompositionRecipe; 7] = [
    CompositionRecipe {
        properties: ["width", "height"],
        target_key: "size",
        equivalent_property: None,
    },
    CompositionRecipe {
        properties: ["min-width", "min-height"],
        target_key: "min-size",
        equivalent_property: None,
    },
    CompositionRecipe {
        properties: ["max-width", "max-height"],
        target_key: "max-size",
        equivalent_property: None,
    },
    CompositionRecipe {
        properties: ["margin-top", "margin-bottom"],
        target_key: "my",
        equivalent_property: Some(("margin-block", ["margin-top", "margin-bottom"])),
    },
    CompositionRecipe {
        properties: ["margin-left", "margin-right"],
        target_key: "mx",
        equivalent_property: Some(("margin-inline", ["margin-left", "margin-right"])),
    },
    CompositionRecipe {
        properties: ["padding-top", "padding-bottom"],
        target_key: "py",
        equivalent_property: Some(("padding-block", ["padding-top", "padding-bottom"])),
    },
    CompositionRecipe {
        properties: ["padding-left", "padding-right"],
        target_key: "px",
        equivalent_property: Some(("padding-inline", ["padding-left", "padding-right"])),
    },
];

#[derive(Debug, Clone)]
struct ComposeNativeDeclaration {
    property: String,
    value: String,
    important: bool,
}

#[derive(Debug, Default)]
struct ComposeBucket {
    classes: Vec<String>,
    declarations: Vec<ComposeNativeDeclaration>,
    variants: Vec<(String, ComposeBucket)>,
}

const fn default_true() -> bool {
    true
}

#[derive(Debug, Clone)]
struct ClassDescriptor {
    class_name: String,
    matched: bool,
    rule: Option<GeneratedRuleIr>,
    rule_count: usize,
    valid_for_conflicts: bool,
    properties: Vec<String>,
    declarations: Vec<(String, String)>,
    group: u8,
    property_order: u8,
    type_order: u8,
}

mod compose;
mod conflicts;
mod order;
mod partial_conflicts;
mod recommendation;
mod session;
mod session_canonical;
mod session_compose;

#[allow(unused_imports)]
pub(crate) use compose::*;
#[allow(unused_imports)]
pub(crate) use conflicts::*;
#[allow(unused_imports)]
pub(crate) use order::*;
#[allow(unused_imports)]
pub(crate) use partial_conflicts::*;
#[allow(unused_imports)]
pub(crate) use recommendation::*;

#[cfg(test)]
mod tests;
