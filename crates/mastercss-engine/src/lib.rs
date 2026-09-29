#![forbid(unsafe_code)]

use std::cmp::Ordering;
use std::collections::{HashMap, HashSet};

use mastercss_lexer::{
    collect_css_variable_references as collect_css_variable_names, css_escape, utf16_len,
};
use mastercss_schema::{
    CssDeclaration, Diagnostic, EmittedGlobals, EngineInspectionIr, EngineResourcesIr,
    EngineSnapshotIr, EngineTransitionIr, EngineVariableResourceIr, ErrorCode, GeneratedRuleIr,
    GeneratedRuleNodeIr, MasterCssManifest, NativeDeclarationCandidateIr, RuleMutationIr,
    RulePriorityIr, RuleTarget, UtilityLayerName,
};
use serde::Deserialize;
use serde::Serialize;
use serde_json::{Map, Value};
use thiserror::Error;

const LAYER_COUNT: usize = 4;
type ConditionFeature = mastercss_schema::ConditionRangeIr;

#[derive(Debug, Error)]
pub enum EngineError {
    #[error(transparent)]
    Schema(#[from] mastercss_schema::SchemaError),
    #[error("Invalid MasterCSSManifest engine field: {0}")]
    InvalidManifest(String),
    #[error("Invalid Master CSS emitted globals JSON: {0}")]
    InvalidEmittedGlobals(String),
    #[error("Master CSS engine session has been disposed.")]
    SessionDisposed,
}

impl EngineError {
    pub fn diagnostic(&self) -> Diagnostic {
        let code = match self {
            Self::Schema(error) => error.code(),
            Self::InvalidManifest(_) => ErrorCode::InvalidManifest,
            Self::InvalidEmittedGlobals(_) => ErrorCode::InvalidInput,
            Self::SessionDisposed => ErrorCode::SessionDisposed,
        };
        Diagnostic {
            phase: mastercss_schema::DiagnosticPhase::Match,
            severity: mastercss_schema::DiagnosticSeverity::Error,
            code,
            message: self.to_string(),
            source: None,
            range: None,
            notes: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ManifestProjection {
    #[serde(default)]
    theme: Vec<mastercss_schema::ThemeNode>,
    #[serde(default)]
    keyframes: Vec<mastercss_schema::KeyframeDefinition>,
    #[serde(default)]
    animation_variables: HashMap<String, Vec<String>>,
    #[serde(default)]
    custom_media: HashMap<String, mastercss_schema::MediaQueryExpr>,
    version: u32,
    #[serde(skip)]
    utilities: Vec<UtilityDefinition>,
    #[serde(default)]
    mixins: Vec<mastercss_schema::MixinDefinition>,
    #[serde(skip)]
    function_utilities: HashMap<String, usize>,
    #[serde(default)]
    variants: Vec<ManifestVariant>,
    #[serde(default)]
    conditions: HashMap<String, ManifestCondition>,
    #[serde(default)]
    selectors: HashMap<String, Vec<ManifestSelectorNode>>,
    #[serde(default)]
    variables: Map<String, Value>,
    #[serde(skip)]
    compiled_variables: HashMap<String, CompiledVariable>,
    #[serde(skip)]
    compiled_variable_order: Vec<String>,
    #[serde(skip)]
    token_utilities: HashMap<String, Vec<usize>>,
    #[serde(skip)]
    static_utilities: HashMap<String, Vec<usize>>,
    #[serde(skip)]
    raw_utilities: HashMap<String, Vec<usize>>,
    #[serde(skip)]
    declaration_keys: HashSet<String>,
}

#[derive(Debug, Clone, Deserialize)]
struct ManifestCondition {
    id: String,
    #[serde(default)]
    nodes: Vec<Value>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ManifestSelectorNode {
    #[serde(default, rename = "type")]
    node_type: Option<String>,
    #[serde(default)]
    value: Option<String>,
    #[serde(default)]
    children: Vec<ManifestSelectorNode>,
}

#[derive(Debug, Clone, Deserialize)]
struct ManifestVariant {
    token: String,
    #[serde(default)]
    branches: Vec<ManifestVariantBranch>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ManifestVariantBranch {
    #[serde(default)]
    selector: Option<String>,
    #[serde(default)]
    selector_nodes: Vec<ManifestSelectorNode>,
    #[serde(default)]
    conditions: Vec<String>,
    #[serde(default)]
    condition_nodes: Vec<ManifestCondition>,
    #[serde(default)]
    layer: Option<UtilityLayerName>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UtilityDefinition {
    id: String,
    #[serde(default)]
    name: Option<String>,
    #[serde(rename = "type")]
    utility_type: i32,
    #[serde(default)]
    order: Option<i32>,
    #[serde(default)]
    layer: UtilityLayerName,
    #[serde(default)]
    keys: Vec<String>,
    #[serde(default, rename = "aliasGroups")]
    alias_groups: Vec<String>,
    #[serde(default, rename = "variableAliases")]
    variable_aliases: Vec<(String, String)>,
    #[serde(default, rename = "variableAliasRefs")]
    variable_alias_refs: Vec<String>,
    #[serde(skip)]
    variables: HashMap<String, String>,
    #[serde(skip)]
    variable_entries: Vec<(String, String)>,
    #[serde(skip)]
    native_fallback: bool,
    #[serde(skip)]
    builtin_token: bool,
    emit: UtilityEmit,
    #[serde(default)]
    matchers: Vec<UtilityMatcher>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
enum UtilityMatcher {
    Static { name: String },
    Key { keys: Vec<String> },
    Token { prefix: String },
    Function { name: String },
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
enum UtilityEmit {
    Mixin { name: String },
    Property { property: String },
}

#[derive(Debug, Clone)]
struct UtilityMatch {
    value: Option<String>,
    value_normalized: bool,
    state_token: String,
    variable_names: Vec<String>,
    matcher_type: UtilityMatcherType,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ClassSemanticKind {
    Unknown,
    Mixin,
    Component,
    Semantic,
    Token,
    Declaration,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum UtilityMatcherType {
    Function,
    Static,
    Key,
    Token,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClassSemanticInspection {
    pub class_name: String,
    pub kind: ClassSemanticKind,
    pub matcher_types: Vec<UtilityMatcherType>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key_token: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value_token: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub state_token: Option<String>,
    pub important: bool,
}

#[derive(Debug, Clone)]
struct CompiledVariable {
    name: String,
    key: String,
    namespace: String,
    values: Vec<mastercss_schema::ScopedThemeValue>,
    numeric: Option<Value>,
    variable_type: String,
    dependencies: Vec<String>,
}

#[derive(Debug, Clone, Default)]
struct StateBranch {
    key: String,
    selector_template: Option<String>,
    condition_wrappers: Vec<(String, String)>,
    layer: Option<UtilityLayerName>,
    important: bool,
}

#[derive(Debug, Clone)]
struct StoredRule {
    ir: GeneratedRuleIr,
    manifest_order: i32,
    declarations: String,
    native_fallback: bool,
    matcher_type: Option<UtilityMatcherType>,
    state_token: String,
}

struct NativeDeclarationCandidate {
    ir: NativeDeclarationCandidateIr,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EngineClassCompletionKind {
    Function,
    Property,
    Value,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EngineClassCompletionCandidate {
    pub label: String,
    pub kind: EngineClassCompletionKind,
    pub detail: Option<String>,
    pub documentation_class_name: Option<String>,
    pub sort_text: Option<String>,
    pub trigger_suggest: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct EngineColorToken {
    pub start: u32,
    pub end: u32,
    pub value: String,
    pub alpha: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineVariableIr {
    #[serde(skip_serializing_if = "String::is_empty")]
    pub namespace: String,
    pub name: String,
    pub key: String,
    #[serde(rename = "type")]
    pub variable_type: String,
    pub values: Vec<mastercss_schema::ScopedThemeValue>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub dependencies: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineClassVariableIr {
    pub key: String,
    pub variable: EngineVariableIr,
}

/// Compiler-facing projection of a generated class rule.
///
/// This deliberately exposes composition semantics without exposing the engine's
/// mutable object model. Compiler and tooling surfaces consume the projection in
/// batches; runtime surfaces never need to instantiate it.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineCompositionRuleIr {
    pub class_name: String,
    /// Exact matched definition, retained only for compiler provenance.
    #[serde(skip)]
    pub utility_name: Option<String>,
    pub key: String,
    pub layer: UtilityLayerName,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub explicit_layer: Option<UtilityLayerName>,
    #[serde(rename = "type")]
    pub utility_type: i32,
    pub sort_tier: i32,
    pub priority: RulePriorityIr,
    pub selector: String,
    pub declarations: Vec<CssDeclaration>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub conditions: Vec<String>,
}

#[derive(Debug)]
pub struct EngineSession {
    manifest: MasterCssManifest,
    compiled: ManifestProjection,
    layers: [Vec<StoredRule>; LAYER_COUNT],
    class_rules: HashMap<String, Vec<(UtilityLayerName, String)>>,
    class_order: Vec<String>,
    rule_counts: HashMap<(UtilityLayerName, String), u32>,
    emitted_globals: EmittedGlobals,
    variable_counts: HashMap<String, u32>,
    keyframe_counts: HashMap<String, u32>,
    keyframe_texts: Vec<(String, String)>,
    stylesheet_sources: Vec<String>,
    theme_variable_names: Vec<String>,
    theme_text: Option<String>,
    theme_dirty: bool,
    theme_batch_depth: usize,
    disposed: bool,
}

const UTILITY_LAYERS: [UtilityLayerName; LAYER_COUNT] = [
    UtilityLayerName::Base,
    UtilityLayerName::Defaults,
    UtilityLayerName::Components,
    UtilityLayerName::Utilities,
];

mod animation;
pub use animation::{AnimationReferences, stylesheet_declarations};
mod completion;
mod condition;
mod custom_media;
mod keyframes;
pub use custom_media::{custom_media_branches, parse_custom_media_query};
mod execution_state;
mod generation;
mod manifest;
mod mixin;
pub use mixin::{
    ExpandedMixinRule, evaluate_mixin_value, expand_mixin, validate_mixin_argument, validate_mixins,
};
mod mixin_matching;
mod named;
mod render;
mod resources;
mod session;
mod state;
mod stylesheet_resources;
mod theme_batch;
mod token_registry;
mod utility;
mod value_syntax;

pub(crate) use completion::{collect_class_completion_candidates, collect_engine_color_tokens};
pub(crate) use condition::{
    add_condition_wrapper, format_standard_number, normalize_dynamic_value,
    parse_raw_condition_wrapper, render_condition_token, render_manifest_condition,
    resolve_layer_condition,
};
pub(crate) use manifest::{
    BUILTIN_NATIVE_DECLARATION_PROPERTIES, BUILTIN_TOKEN_ALIASES, BUILTIN_TOKEN_NAMESPACES,
    add_unique_string, compile_manifest, engine_variable_ir, layer_name, single_native_declaration,
};
pub(crate) use render::{
    composition_conditions, composition_selector, create_selector_text, emit_declarations,
    parse_serialized_declarations, selector_priority, wrap_raw_conditions, wrap_state_conditions,
};
pub(crate) use state::{
    find_group_close, resolve_state_branches, resolve_style_selector_aliases,
    selector_token_to_template, split_top_level,
};
pub(crate) use stylesheet_resources::is_css_identifier_character;
pub(crate) use utility::{
    append_builtin_native_declaration_utilities, append_builtin_token_utilities,
    compare_stored_rules, compile_utility_variables, layer_index, resolve_value_components,
    split_dynamic_value_state,
};
pub(crate) use value_syntax::{
    find_matching_parenthesis, is_native_shorthand_property, is_valid_native_property,
    normalize_css_math_functions,
};

pub use condition::{condition_priority, native_query_features};
pub use manifest::{builtin_token_aliases, builtin_token_namespaces};
pub use token_registry::builtin_token_families;
pub use utility::compare_condition_features;
pub use utility::{compare_rule_priority, natural_compare};

#[cfg(test)]
mod tests;
