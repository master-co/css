use std::collections::HashMap;

use mastercss_engine::{EngineCompositionRuleIr, EngineSession};
use mastercss_schema::{
    CssDeclaration, CssDirectiveConditionPathEntry, CssDirectiveManifestInput,
    CssDirectiveSourceReference, CssDirectiveStyleDefinition, CssOutputMapping, UtilityLayerName,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::{CompileManifestOptions, CompilerError};

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
    pub mixin_sources: Vec<mastercss_schema::CssMixinSource>,
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
    pub mixin_sources: Vec<mastercss_schema::CssMixinSource>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub css: Option<String>,
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
mod merge;
mod output;
mod render;
mod resolution;

pub use api::{lower_css_directives, lower_css_directives_request};

#[cfg(test)]
mod tests;
