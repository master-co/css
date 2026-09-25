use super::*;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Diagnostic {
    pub code: ErrorCode,
    pub phase: DiagnosticPhase,
    pub severity: DiagnosticSeverity,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub range: Option<SourceRange>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub notes: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum DiagnosticPhase {
    Match,
    CssValue,
    CssSyntax,
    BrowserSupport,
    Compiler,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DiagnosticSeverity {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Error)]
pub enum SchemaError {
    #[error("Unsupported MasterCSSManifest version. Expected version 1.")]
    UnsupportedManifestVersion,
    #[error(
        "Unsupported Master CSS languageVersion. Expected 3; recompile the manifest and hydration data with matching packages."
    )]
    UnsupportedLanguageVersion,
    #[error("settings.{0} was removed; migrate to explicit native queries and @mode definitions.")]
    RemovedSetting(String),
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
    #[error(
        "Master length x units and settings.baseUnit were removed; migrate to CSS units or named tokens."
    )]
    RemovedBaseUnit,
    #[error(
        "The variable matcher was removed; migrate colon token patterns to a token matcher with a hyphen prefix."
    )]
    RemovedVariableMatcher,
    #[error(
        "Typed raw utility matchers, kinds, segments and =namespace were removed; recompile using key:<*> and prefix-<~namespace>."
    )]
    RemovedUtilityMatcher,
}

impl SchemaError {
    pub fn code(&self) -> ErrorCode {
        match self {
            Self::UnsupportedManifestVersion | Self::UnsupportedLanguageVersion => {
                ErrorCode::UnsupportedManifestVersion
            }
            Self::UnsupportedVariablesFormat
            | Self::UnsupportedUtilityBuckets
            | Self::InvalidJson(_)
            | Self::InvalidManifest
            | Self::RemovedSetting(_)
            | Self::RemovedBaseUnit
            | Self::RemovedVariableMatcher
            | Self::RemovedUtilityMatcher => ErrorCode::InvalidManifest,
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
        if object.get("languageVersion").and_then(Value::as_u64) != Some(LANGUAGE_VERSION.into()) {
            return Err(SchemaError::UnsupportedLanguageVersion);
        }
        if let Some(settings) = object.get("settings").and_then(Value::as_object) {
            for key in ["rootSize", "defaultMode", "modeTrigger", "modes"] {
                if settings.contains_key(key) {
                    return Err(SchemaError::RemovedSetting(key.into()));
                }
            }
        }
        if object.get("variables").is_some_and(Value::is_array) {
            return Err(SchemaError::UnsupportedVariablesFormat);
        }
        if object.contains_key("utilityBuckets") {
            return Err(SchemaError::UnsupportedUtilityBuckets);
        }
        if object
            .get("settings")
            .and_then(Value::as_object)
            .is_some_and(|settings| settings.contains_key("baseUnit"))
        {
            return Err(SchemaError::RemovedBaseUnit);
        }
        if object
            .get("utilities")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .flat_map(|utility| {
                utility
                    .get("matchers")
                    .and_then(Value::as_array)
                    .into_iter()
                    .flatten()
            })
            .any(|matcher| matcher.get("type").and_then(Value::as_str) == Some("variable"))
        {
            return Err(SchemaError::RemovedVariableMatcher);
        }
        for utility in object
            .get("utilities")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
        {
            if utility.get("kind").is_some()
                || utility.get("segments").is_some()
                || utility
                    .get("variableAliasRefs")
                    .and_then(Value::as_array)
                    .into_iter()
                    .flatten()
                    .any(|reference| {
                        reference
                            .as_str()
                            .is_some_and(|reference| reference.starts_with('='))
                    })
                || utility
                    .get("matchers")
                    .and_then(Value::as_array)
                    .into_iter()
                    .flatten()
                    .any(|matcher| {
                        matcher.get("type").and_then(Value::as_str) == Some("value")
                            || matcher.get("segments").is_some()
                            || (matcher.get("type").and_then(Value::as_str) == Some("pattern")
                                && matcher
                                    .get("prefix")
                                    .and_then(Value::as_str)
                                    .is_some_and(|prefix| prefix.ends_with(':')))
                    })
            {
                return Err(SchemaError::RemovedUtilityMatcher);
            }
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

/// Source order is cascade order; replacing a mode moves it to the last definition.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ModeDefinition {
    pub name: String,
    pub branches: Vec<ModeBranch>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ModeBranch {
    pub selector: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub conditions: Vec<String>,
}
