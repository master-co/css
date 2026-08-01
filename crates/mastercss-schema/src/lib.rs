#![forbid(unsafe_code)]

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use thiserror::Error;

pub const MANIFEST_VERSION: u32 = 1;
pub const HYDRATION_MANIFEST_VERSION: u32 = 1;
pub const BINDING_ABI_VERSION: u32 = 6;
pub const ENGINE_TRANSITION_VERSION: u32 = 1;
pub const VALIDATOR_BATCH_VERSION: u32 = 1;
pub const DIAGNOSTICS_REPORT_VERSION: u32 = 1;
pub const LINT_BATCH_VERSION: u32 = 1;
pub const LANGUAGE_BATCH_VERSION: u32 = 1;
pub const LEXER_BATCH_VERSION: u32 = 1;
pub const SOURCE_BATCH_VERSION: u32 = 1;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BindingInfo<'a> {
    pub binding_abi_version: u32,
    pub package_version: &'a str,
    pub manifest_version: u32,
    pub hydration_manifest_version: u32,
    pub engine_transition_version: u32,
    pub validator_batch_version: u32,
    pub diagnostics_report_version: u32,
    pub lint_batch_version: u32,
    pub language_batch_version: u32,
    pub lexer_batch_version: u32,
    pub source_batch_version: u32,
    pub target: &'a str,
    pub surface: &'a str,
    pub features: &'a [&'a str],
}

impl<'a> BindingInfo<'a> {
    pub const fn new(
        package_version: &'a str,
        target: &'a str,
        surface: &'a str,
        features: &'a [&'a str],
    ) -> Self {
        Self {
            binding_abi_version: BINDING_ABI_VERSION,
            package_version,
            manifest_version: MANIFEST_VERSION,
            hydration_manifest_version: HYDRATION_MANIFEST_VERSION,
            engine_transition_version: ENGINE_TRANSITION_VERSION,
            validator_batch_version: VALIDATOR_BATCH_VERSION,
            diagnostics_report_version: DIAGNOSTICS_REPORT_VERSION,
            lint_batch_version: LINT_BATCH_VERSION,
            language_batch_version: LANGUAGE_BATCH_VERSION,
            lexer_batch_version: LEXER_BATCH_VERSION,
            source_batch_version: SOURCE_BATCH_VERSION,
            target,
            surface,
            features,
        }
    }
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmittedGlobals {
    #[serde(default)]
    pub variables: BTreeMap<String, u32>,
    #[serde(default)]
    pub animations: BTreeMap<String, u32>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidatorClassIr {
    pub class_name: String,
    pub matched: bool,
    pub rules: Vec<GeneratedRuleIr>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidatorBatchIr {
    pub version: u32,
    pub classes: Vec<ValidatorClassIr>,
}

impl EmittedGlobals {
    pub fn parse(source: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(source)
    }

    pub fn variable_count(&self, name: &str) -> u32 {
        self.variables.get(name).copied().unwrap_or_default()
    }

    pub fn animation_count(&self, name: &str) -> u32 {
        self.animations.get(name).copied().unwrap_or_default()
    }
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum UtilityLayerName {
    Base,
    Defaults,
    Components,
    #[default]
    Utilities,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RuleTarget {
    Theme,
    Base,
    Defaults,
    Components,
    Utilities,
    Keyframes,
}

impl From<UtilityLayerName> for RuleTarget {
    fn from(value: UtilityLayerName) -> Self {
        match value {
            UtilityLayerName::Base => Self::Base,
            UtilityLayerName::Defaults => Self::Defaults,
            UtilityLayerName::Components => Self::Components,
            UtilityLayerName::Utilities => Self::Utilities,
        }
    }
}

mod directives;
mod engine;
mod manifest;

pub use directives::*;
pub use engine::*;
pub use manifest::*;

#[cfg(test)]
mod tests;
