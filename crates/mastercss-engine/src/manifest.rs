use super::{
    CompiledVariable, CompiledVariableMode, EngineError, EngineVariableIr, HashMap,
    ManifestProjection, Map, MasterCssManifest, ThemeBucket, UtilityLayerName, UtilityMatcher,
    Value, append_builtin_native_declaration_utilities, append_builtin_native_value_utilities,
    compile_utility_variables, split_top_level, transform_css_variable_references,
};

pub(crate) fn push_theme_declaration(
    buckets: &mut Vec<ThemeBucket>,
    media_text: &str,
    selector_text: &str,
    mode: Option<&str>,
    declaration: String,
) {
    if let Some(bucket) = buckets
        .iter_mut()
        .find(|bucket| bucket.media_text == media_text && bucket.selector_text == selector_text)
    {
        bucket.declarations.push(declaration);
        return;
    }
    buckets.push(ThemeBucket {
        media_text: media_text.to_owned(),
        selector_text: selector_text.to_owned(),
        mode: mode.map(str::to_owned),
        order: buckets.len(),
        declarations: vec![declaration],
    });
}

pub(crate) fn theme_bucket_rank(bucket: &ThemeBucket) -> u8 {
    if !bucket.media_text.is_empty() {
        2
    } else if bucket
        .selector_text
        .split(',')
        .map(str::trim)
        .any(|selector| matches!(selector, ":root" | ":host"))
    {
        0
    } else {
        1
    }
}

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
    if projection.version != 1 {
        return Err(EngineError::InvalidManifest(
            "unsupported projection version".into(),
        ));
    }
    let (compiled_variables, compiled_variable_order) = compile_variables(&projection.variables)?;
    projection.compiled_variables = compiled_variables;
    projection.compiled_variable_order = compiled_variable_order;
    resolve_compiled_inline_variable_references(
        &mut projection.compiled_variables,
        &projection.compiled_variable_order,
    )?;
    append_builtin_native_value_utilities(&mut projection.utilities);
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
            let value = object.get("value").and_then(normalize_variable_value);
            let source_value = object
                .get("value")
                .and_then(normalize_variable_source_value);
            let source_modes = object
                .get("modes")
                .and_then(Value::as_object)
                .cloned()
                .unwrap_or_default();
            let modes = if source_modes.is_empty() {
                Vec::new()
            } else {
                source_modes
                    .iter()
                    .filter_map(|(mode, value)| {
                        let value = value
                            .as_object()?
                            .get("value")
                            .and_then(normalize_variable_value)?;
                        Some(CompiledVariableMode {
                            name: mode.clone(),
                            value,
                        })
                    })
                    .collect()
            };
            let variable_type = object
                .get("type")
                .and_then(Value::as_str)
                .unwrap_or_else(|| {
                    if object.get("value").is_some_and(Value::is_number) {
                        "number"
                    } else {
                        "string"
                    }
                })
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
                    value,
                    source_value,
                    numeric: object.get("numeric").cloned(),
                    modes,
                    source_modes,
                    variable_type,
                    dependencies,
                    inline: object.get("inline").and_then(Value::as_bool) == Some(true),
                    static_resource: object.get("static").and_then(Value::as_bool) == Some(true),
                },
            );
        }
    }
    Ok((variables, order))
}

pub(crate) fn normalize_variable_source_value(value: &Value) -> Option<Value> {
    match value {
        Value::String(_) | Value::Number(_) => Some(value.clone()),
        Value::Array(values) => values
            .iter()
            .map(normalize_variable_value)
            .collect::<Option<Vec<_>>>()
            .map(|values| Value::String(values.join(","))),
        _ => None,
    }
}

pub(crate) fn normalize_variable_value(value: &Value) -> Option<String> {
    match value {
        Value::String(value) => Some(value.clone()),
        Value::Number(value) => Some(value.to_string()),
        Value::Array(values) => values
            .iter()
            .map(normalize_variable_value)
            .collect::<Option<Vec<_>>>()
            .map(|values| values.join(",")),
        _ => None,
    }
}

pub(crate) fn resolve_compiled_inline_variable_references(
    variables: &mut HashMap<String, CompiledVariable>,
    variable_order: &[String],
) -> Result<(), EngineError> {
    let inline_reference_needles = variables
        .values()
        .filter(|variable| variable.inline && variable.value.is_some())
        .map(|variable| format!("--{}", variable.name))
        .collect::<Vec<_>>();
    let mut resolved_variables = Vec::new();
    for name in variable_order {
        let Some(variable) = variables.get(name) else {
            continue;
        };
        let mut stack = vec![variable.name.clone()];
        let value = variable
            .value
            .as_deref()
            .filter(|value| contains_inline_variable_reference(value, &inline_reference_needles))
            .map(|value| resolve_inline_references_in_value(value, variables, &mut stack))
            .transpose()?;
        let mut modes = Vec::new();
        for (index, mode) in variable.modes.iter().enumerate() {
            if contains_inline_variable_reference(&mode.value, &inline_reference_needles) {
                modes.push((
                    index,
                    resolve_inline_references_in_value(&mode.value, variables, &mut stack)?,
                ));
            }
        }
        if value.is_some() || !modes.is_empty() {
            resolved_variables.push((name.clone(), value, modes));
        }
    }
    for (name, value, modes) in resolved_variables {
        let Some(variable) = variables.get_mut(&name) else {
            continue;
        };
        if let Some(value) = value {
            variable.value = Some(value);
        }
        for (index, value) in modes {
            variable.modes[index].value = value;
        }
    }
    Ok(())
}

pub(crate) fn contains_inline_variable_reference(value: &str, needles: &[String]) -> bool {
    needles.iter().any(|needle| value.contains(needle))
}

pub(crate) fn resolve_inline_references_in_value(
    value: &str,
    variables: &HashMap<String, CompiledVariable>,
    stack: &mut Vec<String>,
) -> Result<String, EngineError> {
    transform_css_variable_references(value, |name, _text| {
        let Some(variable) = variables
            .get(name)
            .filter(|variable| variable.inline && variable.value.is_some())
        else {
            return Ok(None);
        };
        if let Some(index) = stack.iter().position(|resolving| resolving == name) {
            let mut cycle = stack[index..].to_vec();
            cycle.push(name.to_owned());
            return Err(EngineError::InvalidManifest(format!(
                "Circular inline variable reference: {}",
                cycle.join(" -> ")
            )));
        }
        stack.push(name.to_owned());
        let resolved = resolve_inline_references_in_value(
            variable.value.as_deref().unwrap_or_default(),
            variables,
            stack,
        );
        stack.pop();
        resolved.map(Some)
    })
}

pub(crate) fn engine_variable_ir(variable: &CompiledVariable) -> EngineVariableIr {
    EngineVariableIr {
        namespace: variable.namespace.clone(),
        name: variable.name.clone(),
        key: variable.key.clone(),
        variable_type: variable.variable_type.clone(),
        value: variable.source_value.clone(),
        numeric: variable.numeric.clone(),
        modes: variable.source_modes.clone(),
        dependencies: variable.dependencies.clone(),
        inline: variable.inline,
        static_resource: variable.static_resource,
    }
}

pub(crate) fn serialize_literal_value(value: &Value) -> Option<String> {
    match value {
        Value::String(value) => Some(value.clone()),
        Value::Number(value) => Some(value.to_string()),
        Value::Bool(value) => Some(value.to_string()),
        Value::Array(values) => values
            .iter()
            .map(serialize_literal_value)
            .collect::<Option<Vec<_>>>()
            .map(|values| values.join("")),
        _ => None,
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
    let (property, value) = declaration.split_once(':')?;
    let value = value
        .trim_end()
        .strip_suffix("!important")
        .map(str::trim_end)
        .unwrap_or(value);
    Some((property.to_owned(), value.to_owned()))
}

pub(crate) const SPACING_PROPERTIES: &[&str] = &[
    "background-position",
    "bottom",
    "border-spacing",
    "column-gap",
    "gap",
    "inset",
    "inset-block",
    "inset-block-end",
    "inset-block-start",
    "inset-inline",
    "inset-inline-end",
    "inset-inline-start",
    "left",
    "margin",
    "margin-block",
    "margin-block-end",
    "margin-block-start",
    "margin-bottom",
    "margin-inline",
    "margin-inline-end",
    "margin-inline-start",
    "margin-left",
    "margin-right",
    "margin-top",
    "mask-position",
    "object-position",
    "outline-offset",
    "padding",
    "padding-block",
    "padding-block-end",
    "padding-block-start",
    "padding-bottom",
    "padding-inline",
    "padding-inline-end",
    "padding-inline-start",
    "padding-left",
    "padding-right",
    "padding-top",
    "perspective",
    "perspective-origin",
    "right",
    "row-gap",
    "scroll-margin",
    "scroll-margin-block",
    "scroll-margin-block-end",
    "scroll-margin-block-start",
    "scroll-margin-bottom",
    "scroll-margin-inline",
    "scroll-margin-inline-end",
    "scroll-margin-inline-start",
    "scroll-margin-left",
    "scroll-margin-right",
    "scroll-margin-top",
    "scroll-padding",
    "scroll-padding-block",
    "scroll-padding-block-end",
    "scroll-padding-block-start",
    "scroll-padding-bottom",
    "scroll-padding-inline",
    "scroll-padding-inline-end",
    "scroll-padding-inline-start",
    "scroll-padding-left",
    "scroll-padding-right",
    "scroll-padding-top",
    "shape-margin",
    "text-indent",
    "text-underline-offset",
    "top",
    "translate",
    "transform-origin",
    "word-spacing",
];

pub(crate) const SPACING_UNITLESS_PROPERTIES: &[&str] =
    &["cx", "cy", "stroke-dashoffset", "x", "y"];

pub(crate) const CONTAINER_PROPERTIES: &[&str] = &[
    "background-size",
    "block-size",
    "contain-intrinsic-block-size",
    "contain-intrinsic-inline-size",
    "flex-basis",
    "height",
    "inline-size",
    "max-block-size",
    "max-height",
    "max-inline-size",
    "max-width",
    "min-block-size",
    "min-height",
    "min-inline-size",
    "min-width",
    "mask-size",
    "width",
];

pub(crate) const RADIUS_PROPERTIES: &[&str] = &[
    "border-bottom-left-radius",
    "border-bottom-right-radius",
    "border-end-end-radius",
    "border-end-start-radius",
    "border-radius",
    "border-start-end-radius",
    "border-start-start-radius",
    "border-top-left-radius",
    "border-top-right-radius",
];

pub(crate) const BORDER_COLOR_PROPERTIES: &[&str] = &[
    "border",
    "border-block",
    "border-block-color",
    "border-block-end",
    "border-block-end-color",
    "border-block-start",
    "border-block-start-color",
    "border-bottom",
    "border-bottom-color",
    "border-color",
    "border-inline",
    "border-inline-color",
    "border-inline-end",
    "border-inline-end-color",
    "border-inline-start",
    "border-inline-start-color",
    "border-left",
    "border-left-color",
    "border-right",
    "border-right-color",
    "border-top",
    "border-top-color",
    "outline",
    "outline-color",
];

pub(crate) const BUILTIN_NATIVE_VALUE_NAMESPACES: &[(&[&str], &[&str])] = &[
    (SPACING_PROPERTIES, &["~spacing"]),
    (SPACING_UNITLESS_PROPERTIES, &["~spacing"]),
    (CONTAINER_PROPERTIES, &["~container"]),
    (RADIUS_PROPERTIES, &["~radius"]),
    (BORDER_COLOR_PROPERTIES, &["~color-line", "~color"]),
    (
        &["accent-color", "background-color", "fill", "filter"],
        &["~color"],
    ),
    (&["caret-color"], &["~color-text", "~color"]),
    (&["stroke"], &["~color-line", "~color"]),
    (&["color"], &["=color", "~color-text", "~color"]),
    (
        &["-webkit-text-fill-color", "text-decoration-color"],
        &["~color-text", "~color"],
    ),
    (&["-webkit-text-stroke-color"], &["~color"]),
    (&["text-shadow"], &["~color"]),
    (&["box-shadow"], &["~shadow", "~color"]),
    (
        &[
            "animation-delay",
            "animation-duration",
            "transition-delay",
            "transition-duration",
        ],
        &["~duration"],
    ),
    (
        &["animation-timing-function", "transition-timing-function"],
        &["~easing"],
    ),
    (&["animation", "transition"], &["~duration", "~easing"]),
    (&["content"], &["=content"]),
    (&["font-feature-settings"], &["=font-feature"]),
    (&["font-family"], &["=font-family"]),
    (&["font-size"], &["=font-size"]),
    (&["font-weight"], &["=font-weight"]),
    (&["letter-spacing"], &["~tracking"]),
    (&["line-height"], &["~leading"]),
    (&["order"], &["=order"]),
];

pub(crate) const BUILTIN_NATIVE_DECLARATION_PROPERTIES: &[&str] = &[
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

pub(crate) const BUILTIN_KEY_ALIASES: &[(&str, &str)] = &[
    ("fg", "color"),
    ("bg", "background"),
    ("gap-x", "column-gap"),
    ("gap-y", "row-gap"),
    ("grid-col", "grid-column"),
    ("grid-col-end", "grid-column-end"),
    ("grid-col-start", "grid-column-start"),
    ("b", "border"),
    ("bb", "border-bottom"),
    ("bl", "border-left"),
    ("br", "border-right"),
    ("bt", "border-top"),
    ("bx", "border-inline"),
    ("by", "border-block"),
    ("h", "height"),
    ("ix", "inset-inline"),
    ("ixe", "inset-inline-end"),
    ("ixs", "inset-inline-start"),
    ("iy", "inset-block"),
    ("iye", "inset-block-end"),
    ("iys", "inset-block-start"),
    ("leading", "line-height"),
    ("m", "margin"),
    ("max", "max-size"),
    ("max-h", "max-height"),
    ("max-size-x", "max-inline-size"),
    ("max-size-y", "max-block-size"),
    ("max-w", "max-width"),
    ("mb", "margin-bottom"),
    ("min", "min-size"),
    ("min-h", "min-height"),
    ("min-size-x", "min-inline-size"),
    ("min-size-y", "min-block-size"),
    ("min-w", "min-width"),
    ("ml", "margin-left"),
    ("mr", "margin-right"),
    ("mt", "margin-top"),
    ("mx", "margin-inline"),
    ("mxe", "margin-inline-end"),
    ("mxs", "margin-inline-start"),
    ("my", "margin-block"),
    ("mye", "margin-block-end"),
    ("mys", "margin-block-start"),
    ("p", "padding"),
    ("pb", "padding-bottom"),
    ("pl", "padding-left"),
    ("pr", "padding-right"),
    ("pt", "padding-top"),
    ("px", "padding-inline"),
    ("pxe", "padding-inline-end"),
    ("pxs", "padding-inline-start"),
    ("py", "padding-block"),
    ("pye", "padding-block-end"),
    ("pys", "padding-block-start"),
    ("r", "border-radius"),
    ("rbl", "border-bottom-left-radius"),
    ("rbr", "border-bottom-right-radius"),
    ("rtl", "border-top-left-radius"),
    ("rtr", "border-top-right-radius"),
    ("scroll-m", "scroll-margin"),
    ("scroll-mb", "scroll-margin-bottom"),
    ("scroll-ml", "scroll-margin-left"),
    ("scroll-mr", "scroll-margin-right"),
    ("scroll-mt", "scroll-margin-top"),
    ("scroll-mx", "scroll-margin-inline"),
    ("scroll-mxe", "scroll-margin-inline-end"),
    ("scroll-mxs", "scroll-margin-inline-start"),
    ("scroll-my", "scroll-margin-block"),
    ("scroll-mye", "scroll-margin-block-end"),
    ("scroll-mys", "scroll-margin-block-start"),
    ("scroll-p", "scroll-padding"),
    ("scroll-pb", "scroll-padding-bottom"),
    ("scroll-pl", "scroll-padding-left"),
    ("scroll-pr", "scroll-padding-right"),
    ("scroll-pt", "scroll-padding-top"),
    ("scroll-px", "scroll-padding-inline"),
    ("scroll-pxe", "scroll-padding-inline-end"),
    ("scroll-pxs", "scroll-padding-inline-start"),
    ("scroll-py", "scroll-padding-block"),
    ("scroll-pye", "scroll-padding-block-end"),
    ("scroll-pys", "scroll-padding-block-start"),
    ("shadow", "box-shadow"),
    ("size-x", "inline-size"),
    ("size-y", "block-size"),
    ("line-clamp", "-webkit-line-clamp"),
    ("text-fill-color", "-webkit-text-fill-color"),
    ("text-stroke-color", "-webkit-text-stroke-color"),
    ("text-stroke-width", "-webkit-text-stroke-width"),
    ("tracking", "letter-spacing"),
    ("w", "width"),
    ("z", "z-index"),
];

/// Returns the canonical built-in key alias registry for Rust tooling policy.
/// Manifest-carried registry fields are intentionally not consulted.
pub fn builtin_key_aliases() -> &'static [(&'static str, &'static str)] {
    BUILTIN_KEY_ALIASES
}

/// Returns the canonical built-in native-value namespace registry.
///
/// Build tooling uses this read-only projection to generate TypeScript tooling data
/// without introducing a second semantic source of truth.
pub fn builtin_native_value_namespaces()
-> &'static [(&'static [&'static str], &'static [&'static str])] {
    BUILTIN_NATIVE_VALUE_NAMESPACES
}

/// Returns the built-in properties that accept manifest variable values.
pub fn builtin_native_value_properties() -> Vec<&'static str> {
    let mut properties = Vec::new();
    for (namespace_properties, _) in BUILTIN_NATIVE_VALUE_NAMESPACES {
        for property in *namespace_properties {
            if !properties.contains(property) {
                properties.push(*property);
            }
        }
    }
    properties
}

pub(crate) fn add_unique_string(target: &mut Vec<String>, value: &str) {
    if !target.iter().any(|existing| existing == value) {
        target.push(value.to_owned());
    }
}
