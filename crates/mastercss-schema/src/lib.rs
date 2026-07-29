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

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceRange {
    pub start: u32,
    pub end: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceLocation {
    pub line: u32,
    pub column: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceLocationRange {
    pub start: SourceLocation,
    pub end: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssDirectiveSourceReference {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file: Option<String>,
    pub range: SourceRange,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub loc: Option<SourceLocationRange>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssDirectiveReferenceStatement {
    pub start: u32,
    pub end: u32,
    pub statement: String,
    pub source: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum CssDirectiveConditionPathEntry {
    Condition { value: String },
    Variant { token: String },
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(
    tag = "type",
    rename_all = "lowercase",
    rename_all_fields = "camelCase"
)]
pub enum CssDirectiveStyleDefinition {
    Native {
        order: u32,
        selector: String,
        declarations: Map<String, Value>,
        #[serde(skip_serializing_if = "Option::is_none")]
        source: Option<CssDirectiveSourceReference>,
        #[serde(skip_serializing_if = "Option::is_none")]
        selector_source: Option<CssDirectiveSourceReference>,
        #[serde(skip_serializing_if = "Option::is_none")]
        conditions: Option<Vec<String>>,
        #[serde(skip_serializing_if = "Option::is_none")]
        condition_path: Option<Vec<CssDirectiveConditionPathEntry>>,
        #[serde(skip_serializing_if = "Option::is_none")]
        layer: Option<UtilityLayerName>,
        #[serde(skip_serializing_if = "Option::is_none")]
        name: Option<String>,
    },
    Compose {
        order: u32,
        class_name: String,
        selector: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        source: Option<CssDirectiveSourceReference>,
        #[serde(skip_serializing_if = "Option::is_none")]
        directive_source: Option<CssDirectiveSourceReference>,
        #[serde(skip_serializing_if = "Option::is_none")]
        selector_source: Option<CssDirectiveSourceReference>,
        #[serde(skip_serializing_if = "Option::is_none")]
        conditions: Option<Vec<String>>,
        #[serde(skip_serializing_if = "Option::is_none")]
        condition_path: Option<Vec<CssDirectiveConditionPathEntry>>,
        #[serde(skip_serializing_if = "Option::is_none")]
        layer: Option<UtilityLayerName>,
        #[serde(skip_serializing_if = "Option::is_none")]
        name: Option<String>,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorCode {
    InvalidManifest,
    UnsupportedManifestVersion,
    InvalidHydrationManifest,
    NativeUnavailable,
    NativeLoadFailed,
    WasmLoadFailed,
    RuntimeStartupTimeout,
    CssParseError,
    CssPrintError,
    CssDirectiveError,
    #[serde(rename = "invalid-compose-class")]
    InvalidComposeClass,
    #[serde(rename = "compose-quoted-syntax")]
    ComposeQuotedSyntax,
    #[serde(rename = "compose-group-syntax")]
    ComposeGroupSyntax,
    CssImportError,
    SessionDisposed,
    InvalidInput,
    Internal,
}

impl ErrorCode {
    pub const ALL: [Self; 17] = [
        Self::InvalidManifest,
        Self::UnsupportedManifestVersion,
        Self::InvalidHydrationManifest,
        Self::NativeUnavailable,
        Self::NativeLoadFailed,
        Self::WasmLoadFailed,
        Self::RuntimeStartupTimeout,
        Self::CssParseError,
        Self::CssPrintError,
        Self::CssDirectiveError,
        Self::InvalidComposeClass,
        Self::ComposeQuotedSyntax,
        Self::ComposeGroupSyntax,
        Self::CssImportError,
        Self::SessionDisposed,
        Self::InvalidInput,
        Self::Internal,
    ];

    pub const fn as_wire_code(self) -> &'static str {
        match self {
            Self::InvalidManifest => "INVALID_MANIFEST",
            Self::UnsupportedManifestVersion => "UNSUPPORTED_MANIFEST_VERSION",
            Self::InvalidHydrationManifest => "INVALID_HYDRATION_MANIFEST",
            Self::NativeUnavailable => "NATIVE_UNAVAILABLE",
            Self::NativeLoadFailed => "NATIVE_LOAD_FAILED",
            Self::WasmLoadFailed => "WASM_LOAD_FAILED",
            Self::RuntimeStartupTimeout => "RUNTIME_STARTUP_TIMEOUT",
            Self::CssParseError => "CSS_PARSE_ERROR",
            Self::CssPrintError => "CSS_PRINT_ERROR",
            Self::CssDirectiveError => "CSS_DIRECTIVE_ERROR",
            Self::InvalidComposeClass => "invalid-compose-class",
            Self::ComposeQuotedSyntax => "compose-quoted-syntax",
            Self::ComposeGroupSyntax => "compose-group-syntax",
            Self::CssImportError => "CSS_IMPORT_ERROR",
            Self::SessionDisposed => "SESSION_DISPOSED",
            Self::InvalidInput => "INVALID_INPUT",
            Self::Internal => "INTERNAL",
        }
    }
}

/// Canonical Rust representation of the CSS-directive manifest input wire shape.
///
/// Fields that have not moved into a domain crate yet stay as order-preserving JSON
/// values. This lets schema/codegen stabilize the cross-language contract without
/// coupling the directive parser to engine implementation details.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssDirectiveManifestInput {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variants: Option<Vec<Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variables: Option<Vec<CssDirectiveVariableDefinition>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub utilities: Option<Vec<Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub root_size: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_unit: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_mode: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scope: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub important: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub animations: Option<Map<String, Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub animation_options: Option<Map<String, Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub modes: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mode_trigger: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssDirectiveVariableDefinition {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    pub value: Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mode: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inline: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub r#static: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub namespace: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssDirectiveExtractionPolicy {
    pub include: Vec<String>,
    pub exclude: Vec<String>,
    pub safelist: Vec<String>,
    pub blocklist: Vec<CssDirectiveBlocklistEntry>,
    pub preserve_native: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum CssDirectiveBlocklistEntry {
    Exact(String),
    Pattern {
        source: String,
        #[serde(default)]
        flags: String,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum CssBlocklistPatternToken {
    Literal(u16),
    Any,
    Many,
}

/// Applies the dependency-free extraction-policy pattern contract used by all
/// native and Wasm semantic surfaces.
pub fn is_css_class_blocklisted(
    class_name: &str,
    blocklist: &[CssDirectiveBlocklistEntry],
) -> bool {
    blocklist.iter().any(|entry| match entry {
        CssDirectiveBlocklistEntry::Exact(value) => value == class_name,
        CssDirectiveBlocklistEntry::Pattern { source, flags } => {
            if !flags
                .chars()
                .all(|flag| matches!(flag, 'g' | 'i' | 'm' | 's' | 'u' | 'y'))
            {
                return false;
            }
            if flags.contains('i') {
                css_blocklist_pattern_matches(&source.to_lowercase(), &class_name.to_lowercase())
            } else {
                css_blocklist_pattern_matches(source, class_name)
            }
        }
    })
}

pub fn filter_css_extraction_candidates<I, S>(
    candidates: I,
    blocklist: &[CssDirectiveBlocklistEntry],
) -> Vec<String>
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
{
    candidates
        .into_iter()
        .filter_map(|candidate| {
            let candidate = candidate.as_ref();
            (!is_css_class_blocklisted(candidate, blocklist)).then(|| candidate.to_owned())
        })
        .collect()
}

fn css_blocklist_pattern_matches(source: &str, value: &str) -> bool {
    let anchored_start = source.starts_with('^');
    let anchored_end = source.ends_with('$') && !source.ends_with("\\$");
    let source = source.strip_prefix('^').unwrap_or(source);
    let source = source.strip_suffix('$').unwrap_or(source);
    let mut tokens = Vec::new();
    let mut characters = source.chars().peekable();
    while let Some(character) = characters.next() {
        if character == '\\' {
            let Some(literal) = characters.next() else {
                return false;
            };
            tokens.extend(
                literal
                    .encode_utf16(&mut [0; 2])
                    .iter()
                    .copied()
                    .map(CssBlocklistPatternToken::Literal),
            );
        } else if character == '.' && characters.peek() == Some(&'*') {
            characters.next();
            tokens.push(CssBlocklistPatternToken::Many);
        } else if character == '.' {
            tokens.push(CssBlocklistPatternToken::Any);
        } else {
            tokens.extend(
                character
                    .encode_utf16(&mut [0; 2])
                    .iter()
                    .copied()
                    .map(CssBlocklistPatternToken::Literal),
            );
        }
    }
    let value = value.encode_utf16().collect::<Vec<_>>();
    fn matches(
        tokens: &[CssBlocklistPatternToken],
        value: &[u16],
        token_index: usize,
        value_index: usize,
        anchored_end: bool,
        matched: &mut [Vec<Option<bool>>],
    ) -> bool {
        if let Some(result) = matched[token_index][value_index] {
            return result;
        }
        let result = match tokens.get(token_index) {
            None => !anchored_end || value_index == value.len(),
            Some(CssBlocklistPatternToken::Literal(expected)) => {
                value
                    .get(value_index)
                    .is_some_and(|actual| actual == expected)
                    && matches(
                        tokens,
                        value,
                        token_index + 1,
                        value_index + 1,
                        anchored_end,
                        matched,
                    )
            }
            Some(CssBlocklistPatternToken::Any) => {
                value_index < value.len()
                    && matches(
                        tokens,
                        value,
                        token_index + 1,
                        value_index + 1,
                        anchored_end,
                        matched,
                    )
            }
            Some(CssBlocklistPatternToken::Many) => {
                matches(
                    tokens,
                    value,
                    token_index + 1,
                    value_index,
                    anchored_end,
                    matched,
                ) || (value_index < value.len()
                    && matches(
                        tokens,
                        value,
                        token_index,
                        value_index + 1,
                        anchored_end,
                        matched,
                    ))
            }
        };
        matched[token_index][value_index] = Some(result);
        result
    }
    if anchored_start {
        let mut matched = vec![vec![None; value.len() + 1]; tokens.len() + 1];
        matches(&tokens, &value, 0, 0, anchored_end, &mut matched)
    } else {
        (0..=value.len()).any(|value_index| {
            let mut matched = vec![vec![None; value.len() + 1]; tokens.len() + 1];
            matches(&tokens, &value, 0, value_index, anchored_end, &mut matched)
        })
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Diagnostic {
    pub code: ErrorCode,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub range: Option<SourceRange>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub notes: Vec<String>,
}

#[derive(Debug, Error)]
pub enum SchemaError {
    #[error("Unsupported MasterCSSManifest version. Expected version 1.")]
    UnsupportedManifestVersion,
    #[error(
        "Unsupported MasterCSSManifest variables format. Expected namespace-grouped variables."
    )]
    UnsupportedVariablesFormat,
    #[error(
        "Unsupported MasterCSSManifest utilityBuckets field. Matcher indexes are engine-derived."
    )]
    UnsupportedUtilityBuckets,
    #[error("Invalid MasterCSSManifest JSON: {0}")]
    InvalidJson(#[from] serde_json::Error),
    #[error("Invalid MasterCSSManifest. Expected an object.")]
    InvalidManifest,
}

impl SchemaError {
    pub fn code(&self) -> ErrorCode {
        match self {
            Self::UnsupportedManifestVersion => ErrorCode::UnsupportedManifestVersion,
            Self::UnsupportedVariablesFormat
            | Self::UnsupportedUtilityBuckets
            | Self::InvalidJson(_)
            | Self::InvalidManifest => ErrorCode::InvalidManifest,
        }
    }
}

/// Validated, order-preserving representation of the public Manifest v1 wire format.
///
/// The domain crates deliberately keep the original JSON object intact while individual
/// subsystems progressively replace `Value` access with strongly typed projections. This
/// prevents an early Rust cutover from dropping fields it does not yet execute.
#[derive(Debug, Clone, PartialEq)]
pub struct MasterCssManifest(Value);

impl MasterCssManifest {
    pub fn parse(source: &str) -> Result<Self, SchemaError> {
        let value: Value = serde_json::from_str(source)?;
        Self::new(value)
    }

    pub fn new(value: Value) -> Result<Self, SchemaError> {
        let object = value.as_object().ok_or(SchemaError::InvalidManifest)?;
        if object.get("version").and_then(Value::as_u64) != Some(MANIFEST_VERSION.into()) {
            return Err(SchemaError::UnsupportedManifestVersion);
        }
        if object.get("variables").is_some_and(Value::is_array) {
            return Err(SchemaError::UnsupportedVariablesFormat);
        }
        if object.contains_key("utilityBuckets") {
            return Err(SchemaError::UnsupportedUtilityBuckets);
        }
        Ok(Self(value))
    }

    pub fn as_value(&self) -> &Value {
        &self.0
    }

    pub fn into_value(self) -> Value {
        self.0
    }

    pub fn to_json(&self) -> Result<String, SchemaError> {
        Ok(serde_json::to_string(&self.0)?)
    }
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RulePriorityIr {
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub features: Vec<(String, f64, f64)>,
    pub selector: i32,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GeneratedRuleNodeIr {
    pub text: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GeneratedRuleIr {
    pub class_name: String,
    pub key: String,
    pub layer: UtilityLayerName,
    #[serde(rename = "type")]
    pub utility_type: i32,
    pub sort_tier: i32,
    pub priority: RulePriorityIr,
    pub text: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub nodes: Vec<GeneratedRuleNodeIr>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selector_text: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub variable_names: Vec<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub animation_names: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HydrationManifest {
    pub version: u32,
    pub rules: Vec<GeneratedRuleIr>,
    pub resource_order: Vec<String>,
}

impl HydrationManifest {
    pub fn new(rules: Vec<GeneratedRuleIr>, resource_order: Vec<String>) -> Self {
        Self {
            version: HYDRATION_MANIFEST_VERSION,
            rules,
            resource_order,
        }
    }

    pub fn from_snapshot(snapshot: &EngineSnapshotIr) -> Self {
        let resource_order = snapshot
            .resources
            .variables
            .iter()
            .map(|resource| resource.name.clone())
            .chain(
                snapshot
                    .resources
                    .animations
                    .iter()
                    .map(|resource| resource.name.clone()),
            )
            .collect();
        Self::new(snapshot.rules.clone(), resource_order)
    }

    pub fn to_script_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string(self).map(|json| json.replace('<', "\\u003c"))
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "op", rename_all = "lowercase", rename_all_fields = "camelCase")]
pub enum RuleMutationIr {
    Insert {
        target: RuleTarget,
        index: u32,
        key: String,
        text: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        rule: Option<Box<GeneratedRuleIr>>,
    },
    Delete {
        target: RuleTarget,
        index: u32,
        key: String,
    },
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineTransitionIr {
    pub version: u32,
    pub mutations: Vec<RuleMutationIr>,
}

impl EngineTransitionIr {
    pub fn new(mutations: Vec<RuleMutationIr>) -> Self {
        Self {
            version: ENGINE_TRANSITION_VERSION,
            mutations,
        }
    }

    pub fn empty() -> Self {
        Self::new(Vec::new())
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineSnapshotIr {
    pub version: u32,
    pub rules: Vec<GeneratedRuleIr>,
    pub resources: EngineResourcesIr,
    pub text: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineVariableResourceIr {
    pub name: String,
    pub ref_count: u32,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub dependencies: Vec<String>,
    #[serde(rename = "static")]
    pub static_resource: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineAnimationResourceIr {
    pub name: String,
    pub index: u32,
    pub ref_count: u32,
    pub text: String,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineResourcesIr {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub theme_text: Option<String>,
    pub variables: Vec<EngineVariableResourceIr>,
    pub animations: Vec<EngineAnimationResourceIr>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineInspectionIr {
    pub version: u32,
    pub class_name: String,
    pub valid: bool,
    pub rules: Vec<GeneratedRuleIr>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeDeclarationCandidateIr {
    pub class_name: String,
    pub property: String,
    pub value: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validates_manifest_v1_without_dropping_unknown_fields() {
        let source = r#"{"version":1,"future":{"value":true},"utilities":[]}"#;
        let manifest = MasterCssManifest::parse(source).unwrap();
        assert_eq!(manifest.to_json().unwrap(), source);
    }

    #[test]
    fn rejects_legacy_manifest_shapes() {
        assert!(matches!(
            MasterCssManifest::parse(r#"{"version":0}"#),
            Err(SchemaError::UnsupportedManifestVersion)
        ));
        assert!(matches!(
            MasterCssManifest::parse(r#"{"version":1,"variables":[]}"#),
            Err(SchemaError::UnsupportedVariablesFormat)
        ));
        assert!(matches!(
            MasterCssManifest::parse(r#"{"version":1,"utilityBuckets":{}}"#),
            Err(SchemaError::UnsupportedUtilityBuckets)
        ));
    }

    #[test]
    fn hydration_json_is_script_safe() {
        let manifest = HydrationManifest::new(
            vec![GeneratedRuleIr {
                class_name: "content:<".into(),
                key: "content:<".into(),
                layer: UtilityLayerName::Utilities,
                utility_type: 0,
                sort_tier: 0,
                priority: RulePriorityIr::default(),
                text: ".content\\:\\<{content:\"<\"}".into(),
                nodes: Vec::new(),
                selector_text: None,
                variable_names: Vec::new(),
                animation_names: Vec::new(),
            }],
            Vec::new(),
        );
        let json = manifest.to_script_json().unwrap();
        assert!(!json.contains('<'));
        assert!(json.contains("\\u003c"));
    }
}
