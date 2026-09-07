use std::cmp::Ordering;
use std::collections::{HashMap, HashSet};

use lightningcss::declaration::DeclarationBlock;
use lightningcss::properties::Property;
use lightningcss::stylesheet::ParserOptions;
use lightningcss::traits::Parse;
use lightningcss::values::length::{Length, LengthPercentageOrAuto};
use mastercss_engine::{EngineCompositionRuleIr, EngineSession, natural_compare};
use mastercss_schema::{
    CssDirectiveConditionPathEntry, CssDirectiveManifestInput, CssDirectiveSourceReference,
    CssDirectiveStyleDefinition, ErrorCode, RulePriorityIr, UtilityLayerName,
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
    pub manifest_input: CssDirectiveManifestInput,
    #[serde(default)]
    pub style_definitions: Vec<CssDirectiveStyleDefinition>,
    #[serde(default)]
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LowerCssDirectivesResult {
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
    selector: String,
    declarations: Map<String, Value>,
    conditions: Vec<String>,
}

#[derive(Debug, Clone)]
enum StyleMergeEvent {
    Compose {
        order: u32,
        rule: EngineCompositionRuleIr,
    },
    Native {
        order: u32,
        declarations: Map<String, Value>,
    },
}

impl StyleMergeEvent {
    fn order(&self) -> u32 {
        match self {
            Self::Compose { order, .. } | Self::Native { order, .. } => *order,
        }
    }
}

#[derive(Debug, Clone)]
struct StyleMergeBucket {
    selector: String,
    conditions: Vec<String>,
    layer: Option<UtilityLayerName>,
    order: u32,
    events: Vec<StyleMergeEvent>,
}

type StyleConditionFeature = (String, f64, f64);

mod api;
mod merge;
mod render;
mod resolution;

pub use api::{lower_css_directives, lower_css_directives_request};

#[cfg(test)]
mod tests;
