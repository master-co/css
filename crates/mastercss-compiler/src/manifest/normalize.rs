use super::utilities::{compile_utilities, compile_variants};
use super::variables::{
    compile_variable_conditions, compile_variables, group_variables, manifest_error, object,
};
use super::{
    CompileManifestOptions, CompileManifestResult, CompilerError, CssDirectiveManifestInput,
    MANIFEST_VERSION, Map, MasterCssManifest, Value,
};
use std::collections::HashMap;
use std::collections::hash_map::Entry;

pub(super) fn merge_array_by(
    base: Option<&Value>,
    next: Option<&Value>,
    key: impl Fn(&Value) -> Option<String>,
) -> Option<Value> {
    let mut merged = base.and_then(Value::as_array).cloned().unwrap_or_default();
    // Index keys once: the first entry with a key owns its slot, as the linear
    // search did, and later definitions replace it in place.
    let mut slots = HashMap::new();
    for (index, existing) in merged.iter().enumerate() {
        if let Some(existing_key) = key(existing) {
            slots.entry(existing_key).or_insert(index);
        }
    }
    for value in next.and_then(Value::as_array).into_iter().flatten() {
        match key(value) {
            Some(value_key) => match slots.entry(value_key) {
                Entry::Occupied(slot) => merged[*slot.get()] = value.clone(),
                Entry::Vacant(slot) => {
                    slot.insert(merged.len());
                    merged.push(value.clone());
                }
            },
            None => merged.push(value.clone()),
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
    manifest.insert(
        "languageVersion".into(),
        Value::from(mastercss_schema::LANGUAGE_VERSION),
    );
    let mut modes = base
        .get("modes")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    for mode in fragment
        .get("modes")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
    {
        modes.retain(|previous| previous.get("name") != mode.get("name"));
        modes.push(mode.clone());
    }
    if !modes.is_empty() {
        manifest.insert("modes".into(), Value::Array(modes));
    }
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
    let variables = compile_variables(input, options.base_manifest.as_ref())?;
    let (mut conditions, breakpoint_conditions, container_conditions) =
        compile_variable_conditions(&variables);
    let grouped_variables = group_variables(variables);
    let mut settings = Map::new();
    for (key, value) in [
        ("scope", input.scope.clone().map(Value::String)),
        ("important", input.important.map(Value::Bool)),
    ] {
        if let Some(value) = value {
            settings.insert(key.into(), value);
        }
    }
    let (variants, selectors, variant_conditions) = compile_variants(input.variants.as_ref())?;
    for variant in input.variants.iter().flatten() {
        if let Some(name) = variant
            .get("token")
            .and_then(Value::as_str)
            .and_then(|token| token.strip_prefix('@'))
            && breakpoint_conditions.contains_key(name)
        {
            return Err(manifest_error(format!(
                "Condition name {name} conflicts between breakpoint and custom variant"
            )));
        }
    }
    conditions.extend(variant_conditions);
    let utilities = compile_utilities(input.utilities.as_ref())?;
    let mut fragment = Map::new();
    fragment.insert("version".into(), Value::Number(MANIFEST_VERSION.into()));
    fragment.insert(
        "languageVersion".into(),
        Value::from(mastercss_schema::LANGUAGE_VERSION),
    );
    if let Some(modes) = &input.modes {
        let mut effective = Vec::<&mastercss_schema::ModeDefinition>::new();
        for mode in modes {
            effective.retain(|previous| previous.name != mode.name);
            effective.push(mode);
        }
        fragment.insert(
            "modes".into(),
            serde_json::to_value(effective).map_err(|error| manifest_error(error.to_string()))?,
        );
    }
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
    key == "important" && value.as_bool() == Some(false)
}

/// Produces the public default-preset artifact shape. Engine registry data and
/// settings that equal the engine defaults are intentionally excluded.
pub fn normalize_default_manifest_for_json(manifest: &Value) -> Result<Value, CompilerError> {
    let manifest = object(manifest)?;
    let mut preset = Map::new();
    preset.insert("version".into(), Value::Number(MANIFEST_VERSION.into()));
    preset.insert(
        "languageVersion".into(),
        Value::from(mastercss_schema::LANGUAGE_VERSION),
    );
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
        "modes",
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
