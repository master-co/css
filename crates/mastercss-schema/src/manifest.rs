use super::*;
use serde::Serializer;
use serde::ser::SerializeStruct;
use serde_json::Map;

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
const MANIFEST_FIELDS: [&str; 11] = [
    "version",
    "languageVersion",
    "keyframes",
    "animationVariables",
    "theme",
    "customMedia",
    "customContainers",
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

/// A Manifest v6 document, field for field the TypeScript `MasterCSSManifest`.
///
/// Sections stay optional as on the wire: an absent section is not written back,
/// and a present one is, even when it is empty. [`MasterCssManifest::new`] and
/// [`MasterCssManifest::parse`] validate a document and parse it once.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct MasterCssManifest {
    pub theme: Option<Vec<ThemeNode>>,
    pub animation_variables: Option<Record<Vec<String>>>,
    pub keyframes: Option<Vec<KeyframeDefinition>>,
    pub custom_media: Option<Record<MediaQueryExpr>>,
    /// The expanded condition of each custom container, without references.
    pub custom_containers: Option<Record<String>>,
    /// Variables grouped by namespace; the empty namespace holds the others.
    pub variables: Option<Record<Vec<ManifestVariable>>>,
    pub mixins: Option<Vec<MixinDefinition>>,
    pub utilities: Option<Vec<UtilityDefinition>>,
    pub debug: Option<Map<String, Value>>,
}

impl MasterCssManifest {
    pub fn parse(source: &str) -> Result<Self, SchemaError> {
        Self::new(serde_json::from_str(source)?)
    }

    pub fn new(value: Value) -> Result<Self, SchemaError> {
        let Value::Object(mut object) = value else {
            return Err(SchemaError::InvalidManifest);
        };
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
        let keyframes = section(&mut object, "keyframes")?;
        let utilities = section(&mut object, "utilities")?;
        let mixins = section(&mut object, "mixins")?;
        let theme = section(&mut object, "theme")?;
        let custom_media: Option<Record<MediaQueryExpr>> = section(&mut object, "customMedia")?;
        if custom_media
            .as_ref()
            .is_some_and(|media| media.contains_key("--starting-style"))
        {
            return Err(SchemaError::ReservedCustomMediaName);
        }
        let variables = object.remove("variables").map(variables).transpose()?;
        Ok(Self {
            theme,
            animation_variables: section(&mut object, "animationVariables")?,
            keyframes,
            custom_media,
            custom_containers: section(&mut object, "customContainers")?,
            variables,
            mixins,
            utilities,
            debug: section(&mut object, "debug")?,
        })
    }

    pub fn to_json(&self) -> Result<String, SchemaError> {
        Ok(serde_json::to_string(self)?)
    }

    /// The JSON value of the manifest.
    pub fn to_value(&self) -> Value {
        serde_json::to_value(self).expect("a manifest serializes to JSON")
    }
}

fn section<T: serde::de::DeserializeOwned>(
    object: &mut Map<String, Value>,
    name: &str,
) -> Result<Option<T>, SchemaError> {
    Ok(object
        .remove(name)
        .map(serde_json::from_value)
        .transpose()?)
}

fn variables(groups: Value) -> Result<Record<Vec<ManifestVariable>>, SchemaError> {
    let Value::Object(groups) = groups else {
        return Err(SchemaError::UnsupportedVariablesFormat);
    };
    groups
        .into_iter()
        .map(|(namespace, definitions)| {
            let Value::Array(definitions) = definitions else {
                return Err(SchemaError::UnsupportedVariablesFormat);
            };
            let definitions = definitions
                .into_iter()
                .map(|definition| {
                    let fields = definition
                        .as_object()
                        .ok_or(SchemaError::UnsupportedVariablesFormat)?;
                    if let Some(field) = fields
                        .keys()
                        .find(|field| !VARIABLE_FIELDS.contains(&field.as_str()))
                    {
                        return Err(SchemaError::UnknownField(format!("variables.*.{field}")));
                    }
                    if !fields.contains_key("values") {
                        return Err(SchemaError::UnsupportedVariablesFormat);
                    }
                    Ok(serde_json::from_value(definition)?)
                })
                .collect::<Result<_, _>>()?;
            Ok((namespace, definitions))
        })
        .collect()
}

impl Serialize for MasterCssManifest {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        fn field<S: SerializeStruct, T: Serialize>(
            manifest: &mut S,
            name: &'static str,
            value: &Option<T>,
        ) -> Result<(), S::Error> {
            match value {
                Some(value) => manifest.serialize_field(name, value),
                None => manifest.skip_field(name),
            }
        }
        let mut manifest = serializer.serialize_struct("MasterCssManifest", 11)?;
        manifest.serialize_field("version", &MANIFEST_VERSION)?;
        manifest.serialize_field("languageVersion", &LANGUAGE_VERSION)?;
        field(&mut manifest, "theme", &self.theme)?;
        field(
            &mut manifest,
            "animationVariables",
            &self.animation_variables,
        )?;
        field(&mut manifest, "keyframes", &self.keyframes)?;
        field(&mut manifest, "customMedia", &self.custom_media)?;
        field(&mut manifest, "customContainers", &self.custom_containers)?;
        field(&mut manifest, "variables", &self.variables)?;
        field(&mut manifest, "mixins", &self.mixins)?;
        field(&mut manifest, "utilities", &self.utilities)?;
        field(&mut manifest, "debug", &self.debug)?;
        manifest.end()
    }
}

/// A variable of a namespace group, field for field the TypeScript
/// `MasterCSSManifestVariable`.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManifestVariable {
    /// Absent when it is the [`variable_name`] of its namespace and key.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(default)]
    pub key: String,
    /// Carried only while variables are flattened; a group gives its namespace.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub namespace: Option<String>,
    pub values: Vec<ScopedThemeValue>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub dependencies: Option<Vec<String>>,
    /// `string` when absent.
    #[serde(default, rename = "type", skip_serializing_if = "Option::is_none")]
    pub variable_type: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub numeric: Option<VariableNumeric>,
}

/// The number and unit that every value of a numeric variable declares.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct VariableNumeric {
    /// `null` when the declared number is not finite.
    pub value: Option<serde_json::Number>,
    #[serde(default)]
    pub unit: String,
}

/// The name of a variable that declares none: `namespace-key`, or whichever of
/// the two is not empty.
pub fn variable_name(namespace: &str, key: &str) -> String {
    if namespace.is_empty() {
        key.to_owned()
    } else if key.is_empty() {
        namespace.to_owned()
    } else {
        let mut name = String::with_capacity(namespace.len() + 1 + key.len());
        name.push_str(namespace);
        name.push('-');
        name.push_str(key);
        name
    }
}

impl ManifestVariable {
    /// The declared name, or the [`variable_name`] in `namespace`.
    pub fn name_in(&self, namespace: &str) -> String {
        self.name
            .clone()
            .unwrap_or_else(|| variable_name(namespace, &self.key))
    }
}

/// The variables of every group in order, each with its name, its type, and its
/// namespace when it has one.
pub fn flatten_variables(groups: Record<Vec<ManifestVariable>>) -> Vec<ManifestVariable> {
    let mut flattened = Vec::new();
    for (namespace, variables) in groups {
        for mut variable in variables {
            variable.name = Some(variable.name_in(&namespace));
            if !namespace.is_empty() {
                variable.namespace = Some(namespace.clone());
            }
            variable
                .variable_type
                .get_or_insert_with(|| "string".into());
            flattened.push(variable);
        }
    }
    flattened
}

/// Groups flattened variables by the namespace each carries, in first-seen order,
/// removing it from the variable; `None` when there are no variables.
pub fn group_variables(variables: Vec<ManifestVariable>) -> Option<Record<Vec<ManifestVariable>>> {
    if variables.is_empty() {
        return None;
    }
    let mut groups = Record::<Vec<ManifestVariable>>::default();
    for mut variable in variables {
        let namespace = variable.namespace.take().unwrap_or_default();
        groups.get_or_insert_default(namespace).push(variable);
    }
    Some(groups)
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
