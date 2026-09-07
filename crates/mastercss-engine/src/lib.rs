#![forbid(unsafe_code)]

use std::cmp::Ordering;
use std::collections::{HashMap, HashSet};

use mastercss_lexer::{
    collect_css_variable_references as collect_css_variable_names, css_escape,
    transform_css_variable_references, utf16_len,
};
use mastercss_schema::{
    Diagnostic, EmittedGlobals, EngineAnimationResourceIr, EngineInspectionIr, EngineResourcesIr,
    EngineSnapshotIr, EngineTransitionIr, EngineVariableResourceIr, ErrorCode, GeneratedRuleIr,
    GeneratedRuleNodeIr, MasterCssManifest, NativeDeclarationCandidateIr, RuleMutationIr,
    RulePriorityIr, RuleTarget, UtilityLayerName,
};
use serde::Deserialize;
use serde::Serialize;
use serde_json::{Map, Value, json};
use thiserror::Error;

const LAYER_COUNT: usize = 4;
const JS_MAX_SAFE_INTEGER: f64 = 9_007_199_254_740_991.0;
type ConditionFeature = (String, f64, f64);

fn is_false(value: &bool) -> bool {
    !value
}

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
    version: u32,
    #[serde(default)]
    settings: EngineSettings,
    #[serde(default)]
    utilities: Vec<UtilityDefinition>,
    #[serde(default)]
    variants: Vec<ManifestVariant>,
    #[serde(default)]
    conditions: HashMap<String, ManifestCondition>,
    #[serde(default, rename = "breakpointConditions")]
    breakpoint_conditions: HashMap<String, ManifestCondition>,
    #[serde(default, rename = "containerConditions")]
    container_conditions: HashMap<String, ManifestCondition>,
    #[serde(default)]
    selectors: HashMap<String, Vec<ManifestSelectorNode>>,
    #[serde(default)]
    variables: Map<String, Value>,
    #[serde(default)]
    animations: Map<String, Value>,
    #[serde(default, rename = "animationOptions")]
    animation_options: HashMap<String, AnimationOptions>,
    #[serde(skip)]
    compiled_variables: HashMap<String, CompiledVariable>,
    #[serde(skip)]
    compiled_variable_order: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct EngineSettings {
    #[serde(default = "default_root_size")]
    root_size: f64,
    #[serde(default = "default_base_unit")]
    base_unit: f64,
    #[serde(default)]
    scope: Option<String>,
    #[serde(default)]
    important: bool,
    #[serde(default = "default_mode", rename = "defaultMode")]
    default_mode: String,
    #[serde(default = "default_mode_trigger")]
    mode_trigger: String,
    #[serde(default = "default_modes")]
    modes: Vec<String>,
}

impl Default for EngineSettings {
    fn default() -> Self {
        Self {
            root_size: default_root_size(),
            base_unit: default_base_unit(),
            scope: None,
            important: false,
            default_mode: default_mode(),
            mode_trigger: default_mode_trigger(),
            modes: default_modes(),
        }
    }
}

fn default_root_size() -> f64 {
    16.0
}

fn default_base_unit() -> f64 {
    4.0
}

fn default_mode() -> String {
    "light".into()
}

fn default_mode_trigger() -> String {
    "media".into()
}

fn default_modes() -> Vec<String> {
    vec!["light".into(), "dark".into()]
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

#[derive(Debug, Clone, Default, Deserialize)]
struct AnimationOptions {
    #[serde(default, rename = "static")]
    static_resource: bool,
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
    kind: Option<String>,
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
    emit: UtilityEmit,
    #[serde(default)]
    matchers: Vec<UtilityMatcher>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
enum UtilityMatcher {
    Static {
        name: String,
    },
    Pattern {
        prefix: String,
        values: Vec<String>,
        #[serde(default, rename = "valueMap")]
        value_map: HashMap<String, String>,
    },
    Key {
        keys: Vec<String>,
    },
    Variable {
        keys: Vec<String>,
        #[serde(default)]
        segments: Option<String>,
    },
    Value {
        keys: Vec<String>,
        #[serde(default)]
        segments: Option<String>,
    },
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
enum UtilityEmit {
    Static { rules: Vec<StaticUtilityRule> },
    Property { property: String },
    Template { declarations: Map<String, Value> },
    Declarations { declarations: Vec<String> },
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StaticUtilityRule {
    declarations: Map<String, Value>,
    #[serde(default)]
    selector: Option<String>,
    #[serde(default)]
    conditions: Vec<String>,
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
    Component,
    Semantic,
    Pattern,
    Declaration,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum UtilityMatcherType {
    Static,
    Pattern,
    Key,
    Variable,
    Value,
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
    value: Option<String>,
    source_value: Option<Value>,
    numeric: Option<Value>,
    modes: Vec<CompiledVariableMode>,
    source_modes: Map<String, Value>,
    variable_type: String,
    dependencies: Vec<String>,
    inline: bool,
    static_resource: bool,
}

#[derive(Debug, Clone)]
struct CompiledVariableMode {
    name: String,
    value: String,
}

#[derive(Debug, Clone, Default)]
struct StateBranch {
    key: String,
    selector_template: Option<String>,
    condition_wrappers: Vec<(String, String)>,
    layer: Option<UtilityLayerName>,
    mode: Option<String>,
    important: bool,
    features: Vec<ConditionFeature>,
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

#[derive(Debug)]
struct ThemeBucket {
    media_text: String,
    selector_text: String,
    mode: Option<String>,
    order: usize,
    declarations: Vec<String>,
}

struct NativeDeclarationCandidate {
    ir: NativeDeclarationCandidateIr,
    match_name: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EngineClassCompletionKind {
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
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub numeric: Option<Value>,
    #[serde(default, skip_serializing_if = "Map::is_empty")]
    pub modes: Map<String, Value>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub dependencies: Vec<String>,
    #[serde(default, skip_serializing_if = "is_false")]
    pub inline: bool,
    #[serde(default, rename = "static", skip_serializing_if = "is_false")]
    pub static_resource: bool,
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
    pub key: String,
    pub layer: UtilityLayerName,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub explicit_layer: Option<UtilityLayerName>,
    #[serde(rename = "type")]
    pub utility_type: i32,
    pub sort_tier: i32,
    pub priority: RulePriorityIr,
    pub selector: String,
    pub declarations: Map<String, Value>,
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
    theme_variable_names: Vec<String>,
    animation_counts: HashMap<String, u32>,
    animation_names: Vec<String>,
    native_declaration_support: HashMap<String, HashMap<(String, String), bool>>,
    disposed: bool,
}

const UTILITY_LAYERS: [UtilityLayerName; LAYER_COUNT] = [
    UtilityLayerName::Base,
    UtilityLayerName::Defaults,
    UtilityLayerName::Components,
    UtilityLayerName::Utilities,
];

mod completion;
mod condition;
mod generation;
mod manifest;
mod render;
mod resources;
mod session;
mod state;
mod stylesheet_resources;
mod utility;
mod value_syntax;

pub(crate) use completion::{collect_class_completion_candidates, collect_engine_color_tokens};
pub(crate) use condition::{
    add_condition_features, add_condition_wrapper, format_standard_number,
    merge_condition_features, normalize_dynamic_value, parse_raw_condition_wrapper,
    render_condition_token, render_manifest_condition, resolve_layer_condition,
};
pub(crate) use manifest::{
    BUILTIN_KEY_ALIASES, BUILTIN_NATIVE_DECLARATION_PROPERTIES, BUILTIN_NATIVE_VALUE_NAMESPACES,
    add_unique_string, compile_manifest, engine_variable_ir, layer_name, push_theme_declaration,
    serialize_literal_value, single_native_declaration, theme_bucket_rank,
};
pub(crate) use render::{
    composition_conditions, composition_selector, create_selector_text, emit_declarations,
    parse_serialized_declarations, selector_priority, wrap_raw_conditions, wrap_state_conditions,
};
pub(crate) use state::{
    apply_forced_mode, find_group_close, resolve_state_branches, resolve_style_selector_aliases,
    selector_token_to_template, split_top_level,
};
pub(crate) use stylesheet_resources::{
    collect_animation_names, collect_stylesheet_animation_declarations,
    collect_stylesheet_animation_names, collect_stylesheet_keyframe_names,
    collect_stylesheet_variable_names, is_css_identifier_character,
};
pub(crate) use utility::{
    append_builtin_native_declaration_utilities, append_builtin_native_value_utilities,
    builtin_key_alias, canonicalize_class_name, compare_stored_rules, compile_utility_variables,
    layer_index, match_utility, resolve_value_components, split_dynamic_value_state,
};
pub(crate) use value_syntax::{
    find_matching_parenthesis, is_native_shorthand_property, is_valid_native_property,
    normalize_css_math_functions,
};

pub use manifest::{
    builtin_key_aliases, builtin_native_value_namespaces, builtin_native_value_properties,
};
pub use utility::natural_compare;

#[cfg(test)]
mod tests;
