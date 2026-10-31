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

/// The fields a manifest may have; any other is rejected.
const MANIFEST_FIELDS: [&str; 10] = [
    "version",
    "languageVersion",
    "keyframes",
    "animationVariables",
    "theme",
    "customMedia",
    "variables",
    "mixins",
    "utilities",
    "debug",
];

/// The fields a manifest variable may have.
const VARIABLE_FIELDS: [&str; 7] = [
    "name",
    "key",
    "namespace",
    "type",
    "values",
    "numeric",
    "dependencies",
];

#[derive(Debug, Error)]
pub enum SchemaError {
    #[error("Unsupported MasterCSSManifest version. Expected version 6.")]
    UnsupportedManifestVersion,
    #[error(
        "Unsupported Master CSS languageVersion. Expected 17; recompile the manifest and hydration data with matching packages."
    )]
    UnsupportedLanguageVersion,
    #[error("Unknown MasterCSSManifest field {0}.")]
    UnknownField(String),
    #[error("Custom media --starting-style conflicts with the native @starting-style suffix.")]
    ReservedCustomMediaName,
    #[error(
        "Unsupported MasterCSSManifest variables format. Expected namespace-grouped variables."
    )]
    UnsupportedVariablesFormat,
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
            | Self::InvalidJson(_)
            | Self::InvalidManifest
            | Self::ReservedCustomMediaName
            | Self::UnknownField(_) => ErrorCode::InvalidManifest,
        }
    }
}

/// Validated, order-preserving representation of the public Manifest v6 wire format.
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
        if let Some(field) = object
            .keys()
            .find(|field| !MANIFEST_FIELDS.contains(&field.as_str()))
        {
            return Err(SchemaError::UnknownField(field.clone()));
        }
        if let Some(keyframes) = object.get("keyframes") {
            serde_json::from_value::<Vec<KeyframeDefinition>>(keyframes.clone())?;
        }
        if let Some(utilities) = object.get("utilities") {
            serde_json::from_value::<Vec<UtilityDefinition>>(utilities.clone())?;
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
                    if let Some(field) = fields
                        .keys()
                        .find(|field| !VARIABLE_FIELDS.contains(&field.as_str()))
                    {
                        return Err(SchemaError::UnknownField(format!("variables.*.{field}")));
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

/// A native `@keyframes` rule of Master-compiled CSS.
///
/// A `native` definition is delivered in place by the stylesheet that declares it,
/// or by the host; engines never emit it, and it stays in the manifest only so
/// `@reference` and tooling can see it. Every other definition comes from a
/// `@prune native` stylesheet and is emitted on demand, like a token, by the engine
/// whose output references it.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct KeyframeDefinition {
    pub id: String,
    pub name: String,
    pub text: String,
    /// The enclosing conditional and layer rules an emitted definition is wrapped in.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub containers: Vec<KeyframeContainer>,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub native: bool,
    /// `@safelist keyframes` emits the definition without a reference.
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub safelisted: bool,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub dependencies: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source: Option<CssDirectiveSourceReference>,
}

/// Identity, rather than the prelude, distinguishes separate containers, so the
/// definitions of one authored container share one emitted wrapper.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct KeyframeContainer {
    pub id: String,
    pub prelude: String,
}
