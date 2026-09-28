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
    let mut value = manifest.as_value().clone();
    if let Some(utilities) = value.get_mut("utilities").and_then(Value::as_array_mut) {
        *utilities = super::effective_utilities(utilities);
    }
    let mut projection: ManifestProjection = serde_json::from_value(value)
        .map_err(|error| EngineError::InvalidManifest(error.to_string()))?;
    if projection.version != mastercss_schema::MANIFEST_VERSION {
        return Err(EngineError::InvalidManifest(
            "unsupported projection version".into(),
        ));
    }
    for utility in &projection.utilities {
        validate_native_utility(utility)?;
        for matcher in &utility.matchers {
            let valid = match matcher {
                UtilityMatcher::Static { name } => mastercss_lexer::valid_utility_name(name),
                UtilityMatcher::Key { keys } => {
                    !keys.is_empty()
                        && keys
                            .iter()
                            .all(|key| mastercss_lexer::valid_utility_name(key))
                }
                UtilityMatcher::Token { prefix } => prefix
                    .strip_suffix('-')
                    .is_some_and(mastercss_lexer::valid_utility_name),
            };
            if !valid {
                return Err(EngineError::InvalidManifest(format!(
                    "Invalid decoded utility name in {}; recompile CSS identifiers without Master class delimiters",
                    utility.id
                )));
            }
        }
    }
    let (compiled_variables, compiled_variable_order) = compile_variables(&projection.variables)?;
    projection.compiled_variables = compiled_variables;
    projection.compiled_variable_order = compiled_variable_order;
    let mut names = HashMap::new();
    for name in projection.conditions.keys() {
        names.insert(name.as_str(), "condition");
    }
    for (name, query) in &projection.custom_media {
        let Some(name) = name.strip_prefix("--").filter(|name| !name.is_empty()) else {
            return Err(EngineError::InvalidManifest(
                "Custom media names must begin with --".into(),
            ));
        };
        if names.insert(name, "custom media").is_some() {
            return Err(EngineError::InvalidManifest(format!(
                "Condition name {name} is defined more than once"
            )));
        }
        crate::custom_media_branches(query).map_err(EngineError::InvalidManifest)?;
    }
    for variant in &projection.variants {
        let Some(name) = variant.token.strip_prefix('@') else {
            continue;
        };
        // A variant may project its first condition into the completion index.
        // That projection must agree with the branch, never hide a second definition.
        let is_projection = projection.conditions.get(name).is_some_and(|condition| {
            let indexed = super::condition::render_manifest_condition(condition, None);
            variant.branches.iter().any(|branch| {
                branch.conditions.first().is_some_and(|query| {
                    mastercss_lexer::canonical_native_content(query)
                        == mastercss_lexer::canonical_native_content(&indexed)
                }) || branch
                    .layer
                    .is_some_and(|layer| indexed == format!("@layer {}", layer_name(layer)))
            })
        });
        if let Some(kind) = names.insert(name, "variant")
            && (kind != "condition" || !is_projection)
        {
            return Err(EngineError::InvalidManifest(format!(
                "Condition name {name} is defined more than once"
            )));
        }
    }
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

fn validate_native_utility(utility: &super::UtilityDefinition) -> Result<(), EngineError> {
    for matcher in &utility.matchers {
        if let UtilityMatcher::Static { name } = matcher
            && let Some((key, _)) = name.split_once(':')
            && mastercss_schema::is_native_css_property(
                super::builtin_key_alias(key).unwrap_or(key),
            )
        {
            return Err(EngineError::InvalidManifest(format!(
                "Native property {key}: cannot be reserved by a static class; use a distinct named utility"
            )));
        }
        let keys: Vec<&str> = match matcher {
            UtilityMatcher::Key { keys } => keys.iter().map(String::as_str).collect(),
            _ => Vec::new(),
        };
        for key in keys {
            let property = super::builtin_key_alias(key).unwrap_or(key);
            if !mastercss_schema::is_native_css_property(property) {
                continue;
            }
            let rules = super::emit_declarations(utility, Some("var(--migration-value)"), false);
            let valid = rules.is_empty()
                || rules.len() == 1
                    && rules.iter().all(|(_, declarations, selector, conditions)| {
                        selector.is_none()
                            && conditions.is_empty()
                            && declarations.split(';').any(|declaration| {
                                declaration == format!("{property}:var(--migration-value)")
                            })
                            && declarations.split(';').all(|declaration| {
                                declaration.split_once(':').is_some_and(|(key, value)| {
                                    let unprefixed = ["-webkit-", "-moz-", "-ms-", "-o-"]
                                        .iter()
                                        .find_map(|prefix| key.strip_prefix(prefix))
                                        .unwrap_or(key);
                                    value == "var(--migration-value)"
                                        && (key == property || unprefixed == property)
                                })
                            })
                    });
            if !valid {
                return Err(EngineError::InvalidManifest(format!(
                    "Native property {property}: must preserve its property and value; rename managed utility {} to express another intent",
                    utility.id
                )));
            }
        }
    }
    Ok(())
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

pub(crate) const BUILTIN_TOKEN_NAMESPACES: &[(&[&str], &[&str])] = &[
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
    (&["color"], &["~color", "~color-text"]),
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
    (&["content"], &["~content"]),
    (&["font-feature-settings"], &["~font-feature"]),
    (&["font-family"], &["~font-family"]),
    (&["font-size"], &["~font-size"]),
    (&["font-weight"], &["~font-weight"]),
    (&["letter-spacing"], &["~tracking"]),
    (&["line-height"], &["~leading"]),
    (&["order"], &["~order"]),
];

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
    ("max-h", "max-height"),
    ("max-size-x", "max-inline-size"),
    ("max-size-y", "max-block-size"),
    ("max-w", "max-width"),
    ("mb", "margin-bottom"),
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
    ("text-fill-color", "-webkit-text-fill-color"),
    ("text-stroke", "-webkit-text-stroke"),
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

/// Returns the canonical built-in named-token namespace registry.
///
/// Build tooling uses this read-only projection to generate TypeScript tooling data
/// without introducing a second semantic source of truth.
pub fn builtin_token_namespaces() -> &'static [(&'static [&'static str], &'static [&'static str])] {
    BUILTIN_TOKEN_NAMESPACES
}

pub(crate) fn add_unique_string(target: &mut Vec<String>, value: &str) {
    if !target.iter().any(|existing| existing == value) {
        target.push(value.to_owned());
    }
}
