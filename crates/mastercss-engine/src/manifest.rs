use super::{
    CompiledVariable, EngineVariableIr, Program, UtilityLayerName, UtilityMatcher,
    append_builtin_native_declaration_utilities, compile_utility_variables, split_top_level,
};
#[cfg(feature = "manifest")]
use super::{EngineError, HashMap, Map, MasterCssManifest, Value};

pub(crate) fn layer_name(layer: UtilityLayerName) -> &'static str {
    match layer {
        UtilityLayerName::Base => "base",
        UtilityLayerName::Defaults => "defaults",
        UtilityLayerName::Components => "components",
        UtilityLayerName::Utilities => "utilities",
    }
}

/// The engine fields of a Manifest v6 document.
#[cfg(feature = "manifest")]
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ManifestInput {
    #[serde(default)]
    theme: Vec<mastercss_schema::ThemeNode>,
    #[serde(default)]
    keyframes: Vec<mastercss_schema::KeyframeDefinition>,
    #[serde(default)]
    animation_variables: HashMap<String, Vec<String>>,
    #[serde(default)]
    custom_media: HashMap<String, mastercss_schema::MediaQueryExpr>,
    version: u32,
    #[serde(default)]
    mixins: Vec<mastercss_schema::MixinDefinition>,
    #[serde(default, rename = "utilities")]
    utility_definitions: Vec<mastercss_schema::UtilityDefinition>,
    #[serde(default)]
    variables: Map<String, Value>,
}

/// Validates a manifest and compiles it into the encoded part of a program; decoding
/// derives the rest with [`finish_program`].
#[cfg(feature = "manifest")]
pub(crate) fn compile_manifest(manifest: &MasterCssManifest) -> Result<Program, EngineError> {
    let mut input: ManifestInput = serde_json::from_value(manifest.as_value().clone())
        .map_err(|error| EngineError::InvalidManifest(error.to_string()))?;
    let mut seen = std::collections::HashSet::new();
    input.keyframes.reverse();
    input
        .keyframes
        .retain(|definition| seen.insert(definition.id.clone()));
    input.keyframes.reverse();
    seen.clear();
    input.mixins.reverse();
    input
        .mixins
        .retain(|definition| seen.insert(definition.name.clone()));
    input.mixins.reverse();
    super::validate_mixins(&input.mixins).map_err(EngineError::InvalidManifest)?;
    seen.clear();
    input.utility_definitions.reverse();
    input
        .utility_definitions
        .retain(|definition| seen.insert(super::utility_matching::identity(definition)));
    input.utility_definitions.reverse();
    super::validate_utilities(&input.mixins, &input.utility_definitions)
        .map_err(EngineError::InvalidManifest)?;
    if input.version != mastercss_schema::MANIFEST_VERSION {
        return Err(EngineError::InvalidManifest(
            "unsupported projection version".into(),
        ));
    }
    let (compiled_variables, compiled_variable_order) = compile_variables(&input.variables)?;
    for name in input.custom_media.keys() {
        if !name.starts_with("--") || name.len() == 2 || name == "--starting-style" {
            return Err(EngineError::InvalidManifest(format!(
                "Invalid or reserved custom media name {name}"
            )));
        }
    }
    let mut program = Program {
        theme: input.theme,
        keyframes: input.keyframes,
        animation_variables: input.animation_variables,
        custom_media: input.custom_media,
        mixins: input.mixins,
        utility_definitions: input.utility_definitions,
        compiled_variables,
        compiled_variable_order,
        ..Program::default()
    };
    super::utility_matching::register(&mut program);
    for query in program.custom_media.values() {
        crate::custom_media_branches(query).map_err(EngineError::InvalidManifest)?;
    }
    Ok(program)
}

/// Static utilities match before the others; the sort is stable.
pub(crate) fn static_last(utility: &super::UtilityDefinition) -> u8 {
    (!utility
        .matchers
        .iter()
        .any(|matcher| matches!(matcher, UtilityMatcher::Static { .. }))) as u8
}

/// Derives the lookup state of a program from its registered utilities, compiled
/// variables and custom media. Compiling and decoding share it, so neither stores
/// what this computes.
pub(crate) fn finish_program(program: &mut Program) -> Result<(), String> {
    program.has_inline_tokens = program
        .compiled_variables
        .values()
        .any(|variable| variable.inline_value.is_some());
    for (name, query) in &program.custom_media {
        let paths = crate::custom_media_branches(query)?;
        program.custom_media_paths.insert(name.clone(), paths);
    }
    append_builtin_native_declaration_utilities(&mut program.utilities);
    let count = program.utilities.len() as i32;
    for (index, utility) in program.utilities.iter_mut().enumerate() {
        if utility.name.is_none() {
            utility.name = Some(utility.id.clone());
        }
        if utility.order.is_none() {
            utility.order = Some(count - index as i32 - 1);
        }
        compile_utility_variables(
            utility,
            &program.compiled_variables,
            &program.compiled_variable_order,
        );
    }
    program.utilities.sort_by_key(static_last);
    for (index, utility) in program.utilities.iter().enumerate() {
        for matcher in &utility.matchers {
            match matcher {
                UtilityMatcher::Token { prefix } => {
                    program
                        .token_utilities
                        .entry(prefix.clone())
                        .or_default()
                        .push(index);
                }
                UtilityMatcher::Key { keys } => {
                    for key in keys {
                        program
                            .raw_utilities
                            .entry(key.clone())
                            .or_default()
                            .push(index);
                    }
                }
                UtilityMatcher::Function { name } => {
                    program.function_utilities.insert(name.clone(), index);
                }
                UtilityMatcher::Static { name } => {
                    program
                        .static_utilities
                        .entry(name.clone())
                        .or_default()
                        .push(index);
                }
            }
        }
    }
    Ok(())
}

#[cfg(feature = "manifest")]
pub(crate) fn compile_variables(
    groups: &Map<String, Value>,
) -> Result<(HashMap<String, CompiledVariable>, Vec<String>), EngineError> {
    let mut variables = HashMap::new();
    let mut order = Vec::new();
    for (namespace, definitions) in groups {
        let Some(definitions) = definitions.as_array() else {
            return Err(EngineError::InvalidManifest(format!(
                "variables.{namespace} must be an array"
            )));
        };
        for definition in definitions {
            let Some(object) = definition.as_object() else {
                return Err(EngineError::InvalidManifest(format!(
                    "variables.{namespace} entries must be objects"
                )));
            };
            if object.get("value") == Some(&Value::Bool(false)) {
                continue;
            }
            let key = object
                .get("key")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_owned();
            let name = object
                .get("name")
                .and_then(Value::as_str)
                .map(str::to_owned)
                .unwrap_or_else(|| default_variable_name(namespace, &key));
            if name.is_empty() {
                continue;
            }
            let values: Vec<mastercss_schema::ScopedThemeValue> =
                serde_json::from_value(object.get("values").cloned().unwrap_or_default())
                    .map_err(|error| EngineError::InvalidManifest(error.to_string()))?;
            let variable_type = object
                .get("type")
                .and_then(Value::as_str)
                .unwrap_or("string")
                .to_owned();
            let dependencies = object
                .get("dependencies")
                .and_then(Value::as_array)
                .map(|values| {
                    values
                        .iter()
                        .filter_map(Value::as_str)
                        .map(str::to_owned)
                        .collect()
                })
                .unwrap_or_default();
            if !variables.contains_key(&name) {
                order.push(name.clone());
            }
            variables.insert(
                name.clone(),
                CompiledVariable {
                    name,
                    key,
                    namespace: namespace.clone(),
                    inline_value: super::inline_theme::selected_value(&values),
                    is_static: values.iter().any(|value| value.is_static),
                    values,
                    numeric: object.get("numeric").and_then(|numeric| {
                        Some(super::VariableNumeric {
                            value: numeric.get("value")?.as_f64()?,
                            unit: numeric
                                .get("unit")
                                .and_then(Value::as_str)
                                .unwrap_or_default()
                                .to_owned(),
                        })
                    }),
                    variable_type,
                    dependencies,
                },
            );
        }
    }
    Ok((variables, order))
}

/// The name of a variable that does not declare one.
pub(crate) fn default_variable_name(namespace: &str, key: &str) -> String {
    if namespace.is_empty() {
        key.to_owned()
    } else if key.is_empty() {
        namespace.to_owned()
    } else {
        format!("{namespace}-{key}")
    }
}

pub(crate) fn engine_variable_ir(variable: &CompiledVariable) -> EngineVariableIr {
    EngineVariableIr {
        namespace: variable.namespace.clone(),
        name: variable.name.clone(),
        key: variable.key.clone(),
        variable_type: variable.variable_type.clone(),
        values: variable.values.clone(),
        dependencies: variable.dependencies.clone(),
    }
}

pub(crate) fn single_native_declaration(declarations: &str) -> Option<(String, String)> {
    let declarations = split_top_level(declarations, ';')
        .into_iter()
        .filter(|declaration| !declaration.is_empty())
        .collect::<Vec<_>>();
    let [declaration] = declarations.as_slice() else {
        return None;
    };
    let (colon, _) = super::native_declaration_head(declaration)?;
    let (property, value) = (&declaration[..colon], &declaration[colon + 1..]);
    let value = value
        .trim_end()
        .strip_suffix("!important")
        .map(str::trim_end)
        .unwrap_or(value);
    Some((property.to_owned(), value.to_owned()))
}

pub(crate) fn add_unique_string(target: &mut Vec<String>, value: &str) {
    if !target.iter().any(|existing| existing == value) {
        target.push(value.to_owned());
    }
}
