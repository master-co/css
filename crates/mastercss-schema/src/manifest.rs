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
    #[error("Unsupported MasterCSSManifest version. Expected version 4.")]
    UnsupportedManifestVersion,
    #[error(
        "Unsupported Master CSS languageVersion. Expected 7; recompile the manifest and hydration data with matching packages."
    )]
    UnsupportedLanguageVersion,
    #[error("Manifest field {0} was removed; recompile with the current directive syntax.")]
    RemovedField(String),
    #[error("Custom media --starting-style conflicts with the native @starting-style suffix.")]
    ReservedCustomMediaName,
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
            Self::UnsupportedManifestVersion | Self::UnsupportedLanguageVersion => {
                ErrorCode::UnsupportedManifestVersion
            }
            Self::UnsupportedVariablesFormat
            | Self::UnsupportedUtilityBuckets
            | Self::InvalidJson(_)
            | Self::InvalidManifest
            | Self::ReservedCustomMediaName
            | Self::RemovedField(_) => ErrorCode::InvalidManifest,
        }
    }
}

/// Validated, order-preserving representation of the public Manifest v4 wire format.
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
        for field in [
            "utilities",
            "variants",
            "conditions",
            "selectors",
            "containerConditions",
            "settings",
            "modes",
            "animations",
            "animationOptions",
            "breakpointConditions",
        ] {
            if object.contains_key(field) {
                return Err(SchemaError::RemovedField(field.into()));
            }
        }
        if let Some(keyframes) = object.get("keyframes") {
            serde_json::from_value::<Vec<KeyframeDefinition>>(keyframes.clone())?;
        }
        if let Some(mixins) = object.get("mixins") {
            serde_json::from_value::<Vec<MixinDefinition>>(mixins.clone())?;
        }
        if let Some(theme) = object.get("theme") {
            serde_json::from_value::<Vec<ThemeNode>>(theme.clone())?;
        }
        if let Some(media) = object.get("customMedia") {
            let media = serde_json::from_value::<BTreeMap<String, MediaQueryExpr>>(media.clone())?;
            if media.contains_key("--starting-style") {
                return Err(SchemaError::ReservedCustomMediaName);
            }
        }
        if let Some(variables) = object.get("variables") {
            let groups = variables
                .as_object()
                .ok_or(SchemaError::UnsupportedVariablesFormat)?;
            for definitions in groups.values() {
                for variable in definitions
                    .as_array()
                    .ok_or(SchemaError::UnsupportedVariablesFormat)?
                {
                    let fields = variable
                        .as_object()
                        .ok_or(SchemaError::UnsupportedVariablesFormat)?;
                    for field in ["value", "modes", "mode", "inline", "static"] {
                        if fields.contains_key(field) {
                            return Err(SchemaError::RemovedField(format!("variables.*.{field}")));
                        }
                    }
                    let values = fields
                        .get("values")
                        .ok_or(SchemaError::UnsupportedVariablesFormat)?;
                    serde_json::from_value::<Vec<ScopedThemeValue>>(values.clone())?;
                }
            }
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

/// Compiled native keyframes. Source metadata is compiler/tooling provenance;
/// execution needs only ordered CSS and its custom-property dependencies.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct KeyframeDefinition {
    pub name: String,
    pub text: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub dependencies: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source: Option<CssDirectiveSourceReference>,
}
