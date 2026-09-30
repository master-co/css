use super::{
    CompiledVariable, EngineError, EngineVariableIr, HashMap, ManifestProjection, Map,
    MasterCssManifest, UtilityLayerName, UtilityMatcher, Value,
    append_builtin_native_declaration_utilities, append_builtin_token_utilities,
    compile_utility_variables, split_top_level,
};

pub(crate) fn layer_name(layer: UtilityLayerName) -> &'static str {
    match layer {
        UtilityLayerName::Base => "base",
        UtilityLayerName::Defaults => "defaults",
        UtilityLayerName::Components => "components",
        UtilityLayerName::Utilities => "utilities",
    }
}

pub(crate) fn compile_manifest(
    manifest: &MasterCssManifest,
) -> Result<ManifestProjection, EngineError> {
    let mut projection: ManifestProjection = serde_json::from_value(manifest.as_value().clone())
        .map_err(|error| EngineError::InvalidManifest(error.to_string()))?;
    let mut seen = std::collections::HashSet::new();
    projection.keyframes.reverse();
    projection
        .keyframes
        .retain(|definition| seen.insert(definition.name.clone()));
    projection.keyframes.reverse();
    seen.clear();
    projection.mixins.reverse();
    projection
        .mixins
        .retain(|definition| seen.insert(definition.name.clone()));
    projection.mixins.reverse();
    super::validate_mixins(&projection.mixins).map_err(EngineError::InvalidManifest)?;
    if projection.version != mastercss_schema::MANIFEST_VERSION {
        return Err(EngineError::InvalidManifest(
            "unsupported projection version".into(),
        ));
    }
    let (compiled_variables, compiled_variable_order) = compile_variables(&projection.variables)?;
    projection.has_inline_tokens = compiled_variables
        .values()
        .any(|variable| variable.inline_value.is_some());
    projection.compiled_variables = compiled_variables;
    projection.compiled_variable_order = compiled_variable_order;
    for (name, query) in &projection.custom_media {
        if !name.starts_with("--") || name.len() == 2 || name == "--starting-style" {
            return Err(EngineError::InvalidManifest(format!(
                "Invalid or reserved custom media name {name}"
            )));
        }
        crate::custom_media_branches(query).map_err(EngineError::InvalidManifest)?;
    }
    super::mixin_matching::register(&mut projection);
    append_builtin_token_utilities(&mut projection.utilities);
    append_builtin_native_declaration_utilities(&mut projection.utilities);
    let count = projection.utilities.len() as i32;
    projection.utilities = projection
        .utilities
        .into_iter()
        .enumerate()
        .map(|(index, mut utility)| {
            if utility.name.is_none() {
                utility.name = Some(utility.id.clone());
            }
            if utility.order.is_none() {
                utility.order = Some(count - index as i32 - 1);
            }
            compile_utility_variables(
                &mut utility,
                &projection.compiled_variables,
                &projection.compiled_variable_order,
            );
            utility
        })
        .collect();
    projection.utilities.sort_by_key(|utility| {
        (!utility
            .matchers
            .iter()
            .any(|matcher| matches!(matcher, UtilityMatcher::Static { .. }))) as u8
    });
    for (index, utility) in projection.utilities.iter().enumerate() {
        for matcher in &utility.matchers {
            match matcher {
                UtilityMatcher::Token { prefix } => {
                    projection
                        .token_utilities
                        .entry(prefix.clone())
                        .or_default()
                        .push(index);
                }
                UtilityMatcher::Key { keys } => {
                    projection.declaration_keys.extend(keys.iter().cloned());
                    for key in keys {
                        projection
                            .raw_utilities
                            .entry(key.clone())
                            .or_default()
                            .push(index);
                    }
                }
                UtilityMatcher::Function { name } => {
                    projection.function_utilities.insert(name.clone(), index);
                }
                UtilityMatcher::Static { name } => {
                    projection
                        .static_utilities
                        .entry(name.clone())
                        .or_default()
                        .push(index);
                }
            }
        }
    }
    for name in projection.static_utilities.keys() {
        if projection.raw_utilities.get(name).is_some_and(|indexes| {
            indexes
                .iter()
                .any(|index| !projection.utilities[*index].native_fallback)
        }) {
            return Err(EngineError::InvalidManifest(format!(
                "Utility entry {name} is both a fixed name and a raw key; use distinct names to distinguish :value from :pseudo-class"
            )));
        }
    }
    Ok(projection)
}

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
                .unwrap_or_else(|| {
                    if namespace.is_empty() {
                        key.clone()
                    } else if key.is_empty() {
                        namespace.clone()
                    } else {
                        format!("{namespace}-{key}")
                    }
                });
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
                    numeric: object.get("numeric").cloned(),
                    variable_type,
                    dependencies,
                },
            );
        }
    }
    Ok((variables, order))
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

pub(crate) const BUILTIN_NATIVE_DECLARATION_PROPERTIES: &[&str] = &[
    "background",
    "background-image",
    "font",
    "line-clamp",
    "outline-width",
    "stroke-width",
    "border-block-end-style",
    "border-block-end-width",
    "border-block-start-style",
    "border-block-start-width",
    "border-block-style",
    "border-block-width",
    "border-bottom-style",
    "border-bottom-width",
    "border-inline-end-style",
    "border-inline-end-width",
    "border-inline-start-style",
    "border-inline-style",
    "border-inline-width",
    "border-left-style",
    "border-left-width",
    "border-right-style",
    "border-right-width",
    "border-style",
    "border-top-style",
    "border-top-width",
    "border-width",
    "overflow",
    "scroll-snap-type",
    "text-overflow",
];

pub(crate) fn add_unique_string(target: &mut Vec<String>, value: &str) {
    if !target.iter().any(|existing| existing == value) {
        target.push(value.to_owned());
    }
}
