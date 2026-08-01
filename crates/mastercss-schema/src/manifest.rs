use super::*;

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
