use mastercss_schema::{
    CssDirectiveManifestInput, CssDirectiveStyleDefinition, MANIFEST_VERSION, MasterCssManifest,
};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Number, Value, json};

use crate::CompilerError;

const BUILTIN_NAMESPACES: &[&str] = &[
    "animate",
    "breakpoint",
    "color",
    "color-line",
    "color-surface",
    "color-text",
    "container",
    "content",
    "duration",
    "easing",
    "font",
    "font-family",
    "font-feature",
    "font-size",
    "font-weight",
    "leading",
    "order",
    "radius",
    "shadow",
    "spacing",
    "tracking",
];

const NUMERIC_THEME_NAMESPACES: &[&str] =
    &["font-size", "radius", "spacing", "breakpoint", "container"];

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileManifestOptions {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_manifest: Option<Value>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileManifestResult {
    pub manifest: Value,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileDefaultPresetRequest {
    pub manifest_input: CssDirectiveManifestInput,
    #[serde(default)]
    pub style_definitions: Vec<CssDirectiveStyleDefinition>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileDefaultPresetResult {
    pub manifest: Value,
    pub json: String,
}

mod normalize;
mod preset;
mod variables;

pub use normalize::{
    compile_manifest_input, normalize_default_manifest_for_json, normalize_manifest_for_json,
};
pub use preset::{compile_default_preset_manifest, compile_manifest_input_with_styles};

#[cfg(test)]
mod tests;

pub(crate) use normalize::{compile_manifest_fragment, flatten_variables, reference_context};
pub(crate) use variables::manifest_error as definition_error;
