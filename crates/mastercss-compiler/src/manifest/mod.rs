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

const NATIVE_CSS_SHORTHANDS: &[&str] = &[
    "all",
    "animation",
    "animation-range",
    "background",
    "background-position",
    "background-repeat",
    "border",
    "border-block",
    "border-block-color",
    "border-block-end",
    "border-block-start",
    "border-block-style",
    "border-block-width",
    "border-bottom",
    "border-color",
    "border-image",
    "border-inline",
    "border-inline-color",
    "border-inline-end",
    "border-inline-start",
    "border-inline-style",
    "border-inline-width",
    "border-left",
    "border-radius",
    "border-right",
    "border-style",
    "border-top",
    "border-width",
    "column-rule",
    "columns",
    "contain-intrinsic-size",
    "container",
    "flex",
    "flex-flow",
    "font",
    "font-synthesis",
    "font-variant",
    "gap",
    "grid",
    "grid-area",
    "grid-column",
    "grid-row",
    "grid-template",
    "inset",
    "inset-block",
    "inset-inline",
    "line-clamp",
    "list-style",
    "margin",
    "margin-block",
    "margin-inline",
    "mask",
    "mask-border",
    "mask-position",
    "mask-repeat",
    "offset",
    "outline",
    "overflow",
    "overscroll-behavior",
    "padding",
    "padding-block",
    "padding-inline",
    "place-content",
    "place-items",
    "place-self",
    "scroll-margin",
    "scroll-margin-block",
    "scroll-margin-inline",
    "scroll-padding",
    "scroll-padding-block",
    "scroll-padding-inline",
    "scroll-timeline",
    "text-decoration",
    "text-emphasis",
    "text-wrap",
    "transition",
    "view-timeline",
    "white-space",
];

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
mod utilities;
mod variables;

#[allow(unused_imports)]
pub(super) use normalize::*;
#[allow(unused_imports)]
pub(super) use preset::*;
#[allow(unused_imports)]
pub(super) use utilities::*;
#[allow(unused_imports)]
pub(super) use variables::*;

pub use normalize::{
    compile_manifest_input, normalize_default_manifest_for_json, normalize_manifest_for_json,
};
pub use preset::{compile_default_preset_manifest, compile_manifest_input_with_styles};

#[cfg(test)]
mod tests;
