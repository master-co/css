use super::*;

pub(super) fn merge_array_by(
    base: Option<&Value>,
    next: Option<&Value>,
    key: impl Fn(&Value) -> Option<String>,
) -> Option<Value> {
    let mut merged = base.and_then(Value::as_array).cloned().unwrap_or_default();
    for value in next.and_then(Value::as_array).into_iter().flatten() {
        let value_key = key(value);
        if let Some(index) = value_key.as_ref().and_then(|value_key| {
            merged
                .iter()
                .position(|existing| key(existing).as_ref() == Some(value_key))
        }) {
            merged[index] = value.clone();
        } else {
            merged.push(value.clone());
        }
    }
    (!merged.is_empty()).then_some(Value::Array(merged))
}

pub(super) fn merge_records(base: Option<&Value>, next: Option<&Value>) -> Option<Value> {
    let mut merged = base.and_then(Value::as_object).cloned().unwrap_or_default();
    if let Some(next) = next.and_then(Value::as_object) {
        merged.extend(next.clone());
    }
    (!merged.is_empty()).then_some(Value::Object(merged))
}

pub(super) fn flatten_variables(value: Option<&Value>) -> Vec<Value> {
    let mut flattened = Vec::new();
    for (namespace, definitions) in value
        .and_then(Value::as_object)
        .into_iter()
        .flat_map(Map::iter)
    {
        for definition in definitions.as_array().into_iter().flatten() {
            let Some(mut definition) = definition.as_object().cloned() else {
                continue;
            };
            let key = definition
                .get("key")
                .and_then(Value::as_str)
                .unwrap_or_default();
            let name = definition
                .get("name")
                .and_then(Value::as_str)
                .map(str::to_owned)
                .unwrap_or_else(|| {
                    if namespace.is_empty() {
                        key.into()
                    } else if key.is_empty() {
                        namespace.into()
                    } else {
                        format!("{namespace}-{key}")
                    }
                });
            definition.insert("name".into(), Value::String(name));
            if !namespace.is_empty() {
                definition.insert("namespace".into(), Value::String(namespace.clone()));
            }
            if !definition.contains_key("type") {
                definition.insert(
                    "type".into(),
                    Value::String(
                        if definition.get("value").is_some_and(Value::is_number) {
                            "number"
                        } else {
                            "string"
                        }
                        .into(),
                    ),
                );
            }
            flattened.push(Value::Object(definition));
        }
    }
    flattened
}

pub(super) fn merge_variables(base: Option<&Value>, next: Option<&Value>) -> Option<Value> {
    let base = Value::Array(flatten_variables(base));
    let next = Value::Array(flatten_variables(next));
    let merged = merge_array_by(Some(&base), Some(&next), |variable| {
        variable
            .get("name")
            .and_then(Value::as_str)
            .map(str::to_owned)
    })?;
    group_variables(
        merged
            .as_array()
            .into_iter()
            .flatten()
            .filter_map(Value::as_object)
            .cloned()
            .collect(),
    )
}

pub(super) fn merge_manifest(base: Option<&Value>, fragment: &Value) -> Value {
    let Some(base) = base.and_then(Value::as_object) else {
        return fragment.clone();
    };
    let fragment = fragment
        .as_object()
        .expect("manifest fragment is an object");
    let mut manifest = Map::new();
    manifest.insert("version".into(), Value::Number(MANIFEST_VERSION.into()));
    let settings = merge_records(base.get("settings"), fragment.get("settings"));
    let variables = merge_variables(base.get("variables"), fragment.get("variables"));
    let animations = merge_records(base.get("animations"), fragment.get("animations"));
    let animation_options = merge_records(
        base.get("animationOptions"),
        fragment.get("animationOptions"),
    );
    let variants = merge_array_by(base.get("variants"), fragment.get("variants"), |variant| {
        variant
            .get("token")
            .and_then(Value::as_str)
            .map(str::to_owned)
    });
    let utilities = merge_array_by(
        base.get("utilities"),
        fragment.get("utilities"),
        |utility| {
            let id = utility.get("id").and_then(Value::as_str)?;
            let layer = utility
                .get("layer")
                .and_then(Value::as_str)
                .unwrap_or_default();
            Some(format!("{id}\0{layer}"))
        },
    );
    for (key, value) in [
        ("settings", settings),
        ("variables", variables),
        ("animations", animations),
        ("animationOptions", animation_options),
        ("variants", variants),
        (
            "conditions",
            merge_records(base.get("conditions"), fragment.get("conditions")),
        ),
        (
            "breakpointConditions",
            merge_records(
                base.get("breakpointConditions"),
                fragment.get("breakpointConditions"),
            ),
        ),
        (
            "containerConditions",
            merge_records(
                base.get("containerConditions"),
                fragment.get("containerConditions"),
            ),
        ),
        (
            "selectors",
            merge_records(base.get("selectors"), fragment.get("selectors")),
        ),
        ("utilities", utilities),
        (
            "debug",
            merge_records(base.get("debug"), fragment.get("debug")),
        ),
    ] {
        if let Some(value) = value {
            manifest.insert(key.into(), value);
        }
    }
    Value::Object(manifest)
}

pub fn compile_manifest_input(
    input: &CssDirectiveManifestInput,
    options: &CompileManifestOptions,
) -> Result<CompileManifestResult, CompilerError> {
    if let Some(base_manifest) = &options.base_manifest {
        MasterCssManifest::new(base_manifest.clone())
            .map_err(|error| manifest_error(error.to_string()))?;
    }
    let root_size = input
        .root_size
        .or_else(|| {
            options
                .base_manifest
                .as_ref()
                .and_then(|base| base.get("settings"))
                .and_then(|settings| settings.get("rootSize"))
                .and_then(Value::as_f64)
        })
        .unwrap_or(16.0);
    let variables = compile_variables(input, options.base_manifest.as_ref())?;
    let (mut conditions, breakpoint_conditions, container_conditions) =
        compile_variable_conditions(&variables, root_size);
    let grouped_variables = group_variables(variables);
    let mut settings = Map::new();
    for (key, value) in [
        ("rootSize", input.root_size.map(number_value)),
        ("baseUnit", input.base_unit.map(number_value)),
        ("defaultMode", input.default_mode.clone().map(Value::String)),
        ("scope", input.scope.clone().map(Value::String)),
        ("important", input.important.map(Value::Bool)),
        ("modeTrigger", input.mode_trigger.clone().map(Value::String)),
        (
            "modes",
            input
                .modes
                .clone()
                .filter(|modes| !modes.is_empty())
                .map(|modes| Value::Array(modes.into_iter().map(Value::String).collect())),
        ),
    ] {
        if let Some(value) = value {
            settings.insert(key.into(), value);
        }
    }
    let (variants, selectors, variant_conditions) = compile_variants(input.variants.as_ref())?;
    conditions.extend(variant_conditions);
    let utilities = compile_utilities(input.utilities.as_ref())?;
    let mut fragment = Map::new();
    fragment.insert("version".into(), Value::Number(MANIFEST_VERSION.into()));
    if !settings.is_empty() {
        fragment.insert("settings".into(), Value::Object(settings));
    }
    if let Some(variables) = grouped_variables {
        fragment.insert("variables".into(), variables);
    }
    if let Some(animations) = &input.animations {
        fragment.insert("animations".into(), Value::Object(animations.clone()));
    }
    if let Some(animation_options) = &input.animation_options {
        fragment.insert(
            "animationOptions".into(),
            Value::Object(animation_options.clone()),
        );
    }
    if let Some(variants) = variants {
        fragment.insert("variants".into(), variants);
    }
    if !conditions.is_empty() {
        fragment.insert("conditions".into(), Value::Object(conditions));
    }
    if !breakpoint_conditions.is_empty() {
        fragment.insert(
            "breakpointConditions".into(),
            Value::Object(breakpoint_conditions),
        );
    }
    if !container_conditions.is_empty() {
        fragment.insert(
            "containerConditions".into(),
            Value::Object(container_conditions),
        );
    }
    if !selectors.is_empty() {
        fragment.insert("selectors".into(), Value::Object(selectors));
    }
    if let Some(utilities) = utilities {
        fragment.insert("utilities".into(), utilities);
    }
    let manifest = merge_manifest(options.base_manifest.as_ref(), &Value::Object(fragment));
    MasterCssManifest::new(manifest.clone()).map_err(|error| manifest_error(error.to_string()))?;
    Ok(CompileManifestResult { manifest })
}

pub fn normalize_manifest_for_json(manifest: &Value) -> Result<Value, CompilerError> {
    let mut manifest = object(manifest)?.clone();
    if let Some(variables) = manifest.get("variables").and_then(Value::as_object) {
        let mut normalized_groups = Map::new();
        for (namespace, definitions) in variables {
            let mut normalized = Vec::new();
            for definition in definitions.as_array().into_iter().flatten() {
                let mut definition = object(definition)?.clone();
                let key = definition
                    .get("key")
                    .and_then(Value::as_str)
                    .unwrap_or_default();
                let expected_name = if namespace.is_empty() {
                    key.to_owned()
                } else if key.is_empty() {
                    namespace.clone()
                } else {
                    format!("{namespace}-{key}")
                };
                if definition.get("name").and_then(Value::as_str) == Some(&expected_name) {
                    definition.shift_remove("name");
                }
                if definition.get("type").and_then(Value::as_str) == Some("string") {
                    definition.shift_remove("type");
                }
                definition.shift_remove("namespace");
                normalized.push(Value::Object(definition));
            }
            if !normalized.is_empty() {
                normalized_groups.insert(namespace.clone(), Value::Array(normalized));
            }
        }
        manifest.insert("variables".into(), Value::Object(normalized_groups));
    }
    if let Some(utilities) = manifest.get("utilities").and_then(Value::as_array) {
        let mut normalized = Vec::new();
        for utility in utilities {
            let mut utility = object(utility)?.clone();
            if utility.get("name") == utility.get("id") {
                utility.shift_remove("name");
            }
            if utility.get("layer").and_then(Value::as_str) == Some("utilities") {
                utility.shift_remove("layer");
            }
            utility.shift_remove("order");
            normalized.push(Value::Object(utility));
        }
        manifest.insert("utilities".into(), Value::Array(normalized));
    }
    Ok(Value::Object(manifest))
}

pub(super) fn is_default_setting(key: &str, value: &Value) -> bool {
    match key {
        "rootSize" => value.as_f64() == Some(16.0),
        "baseUnit" => value.as_f64() == Some(4.0),
        "defaultMode" => value.as_str() == Some("light"),
        "important" => value.as_bool() == Some(false),
        "modeTrigger" => value.as_str() == Some("media"),
        "modes" => value.as_array().is_some_and(|modes| {
            modes.len() == 2
                && modes[0].as_str() == Some("light")
                && modes[1].as_str() == Some("dark")
        }),
        _ => false,
    }
}

/// Produces the public default-preset artifact shape. Engine registry data and
/// settings that equal the engine defaults are intentionally excluded.
pub fn normalize_default_manifest_for_json(manifest: &Value) -> Result<Value, CompilerError> {
    let manifest = object(manifest)?;
    let mut preset = Map::new();
    preset.insert("version".into(), Value::Number(MANIFEST_VERSION.into()));
    if let Some(settings) = manifest.get("settings").and_then(Value::as_object) {
        let settings = settings
            .iter()
            .filter(|(key, value)| !is_default_setting(key, value))
            .map(|(key, value)| (key.clone(), value.clone()))
            .collect::<Map<_, _>>();
        if !settings.is_empty() {
            preset.insert("settings".into(), Value::Object(settings));
        }
    }
    for key in [
        "variables",
        "animations",
        "variants",
        "conditions",
        "breakpointConditions",
        "containerConditions",
        "selectors",
        "utilities",
    ] {
        if let Some(value) = manifest.get(key) {
            preset.insert(key.into(), value.clone());
        }
    }
    normalize_manifest_for_json(&Value::Object(preset))
}
