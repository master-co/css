use std::cmp::Ordering;
use std::collections::{HashMap, HashSet};

use mastercss_engine::{EngineCompositionRuleIr, EngineSession, natural_compare};
use mastercss_schema::{
    CssDeclaration, CssDirectiveConditionPathEntry, CssDirectiveManifestInput,
    CssDirectiveSourceReference, CssDirectiveStyleDefinition, CssOutputMapping, ErrorCode,
    RulePriorityIr, UtilityLayerName,
};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value, json};

use crate::{CompileManifestOptions, CompilerError, compile_manifest_input};

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LowerCssDirectivesOptions {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_manifest: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution_manifest: Option<Value>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LowerCssDirectivesRequest {
    #[serde(default)]
    pub utility_sources: Vec<mastercss_schema::CssUtilitySource>,
    #[serde(default)]
    pub native_output: Option<crate::NativeCssOutput>,
    #[serde(default)]
    pub manifest_input: CssDirectiveManifestInput,
    #[serde(default)]
    pub style_definitions: Vec<CssDirectiveStyleDefinition>,
    #[serde(default)]
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LowerCssDirectivesResult {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub css: Option<String>,
    pub compositions: Vec<mastercss_schema::CssCompositionTrace>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub output_mappings: Vec<CssOutputMapping>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub generated_mappings: Vec<CssOutputMapping>,
    pub input: CssDirectiveManifestInput,
    pub manifest: Value,
    pub resolution_manifest: Value,
    pub warnings: Vec<String>,
    #[serde(rename = "generatedCSS")]
    pub generated_css: String,
    pub diagnostic_counts: HashMap<String, u64>,
}

#[derive(Debug, Clone)]
struct ResolvedStyleBranch {
    selector: String,
    conditions: Vec<String>,
    layer: Option<UtilityLayerName>,
}

#[derive(Debug, Clone)]
struct MergedStyleDefinition {
    selector_source: Option<CssDirectiveSourceReference>,
    selector: String,
    declarations: Vec<CssDeclaration>,
    conditions: Vec<String>,
}

mod api;
pub(crate) mod inspection;
mod merge;
mod output;
mod render;
mod resolution;

pub use api::{lower_css_directives, lower_css_directives_request};

#[cfg(test)]
mod tests;
