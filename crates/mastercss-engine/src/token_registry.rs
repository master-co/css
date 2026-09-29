//! Built-in named token families formerly authored as preset utilities.
pub(crate) const TOKEN_FAMILIES: &[(&str, &str, &[&str])] = &[
    ("animate", "animation", &["~animate"]),
    ("font", "font-size", &["~font-size"]),
    ("font", "font-family", &["~font-family"]),
    ("font", "font-weight", &["~font-weight"]),
    ("bg", "background-color", &["~color"]),
    ("surface", "background-color", &["~color-surface"]),
    ("b", "border-color", &["~color-line", "~color"]),
    ("bt", "border-top-color", &["~color-line", "~color"]),
    ("br", "border-right-color", &["~color-line", "~color"]),
    ("bb", "border-bottom-color", &["~color-line", "~color"]),
    ("bl", "border-left-color", &["~color-line", "~color"]),
    ("bx", "border-inline-color", &["~color-line", "~color"]),
    ("by", "border-block-color", &["~color-line", "~color"]),
    ("outline", "outline-color", &["~color-line", "~color"]),
    (
        "text-decoration",
        "text-decoration-color",
        &["~color-text", "~color"],
    ),
    ("text-underline", "text-underline-offset", &["~spacing"]),
    ("text-stroke", "-webkit-text-stroke-color", &["~color"]),
    ("backdrop-filter", "backdrop-filter", &["~color"]),
];

/// Token aliases deliberately do not participate in native property parsing.
pub(crate) fn removed_raw_alias(property: &str) -> Option<&'static str> {
    if mastercss_schema::is_native_css_property(property) {
        return None;
    }
    super::BUILTIN_TOKEN_ALIASES
        .iter()
        .find(|(alias, _)| *alias == property)
        .map(|(_, target)| *target)
}

/// Complete, ordered projection of the same registry used by the engine.
/// A prefix may have several properties (for example `font`); lookup is based
/// on token existence and reports ambiguity instead of inspecting token values.
pub fn builtin_token_families()
-> impl Iterator<Item = (&'static str, &'static str, &'static [&'static str])> {
    super::BUILTIN_TOKEN_NAMESPACES
        .iter()
        .flat_map(|(properties, namespaces)| {
            properties.iter().flat_map(move |property| {
                std::iter::once(*property)
                    .chain(super::BUILTIN_TOKEN_ALIASES.iter().filter_map(
                        move |(alias, target)| (*target == *property).then_some(*alias),
                    ))
                    .filter(|key| !TOKEN_FAMILIES.iter().any(|(prefix, _, _)| prefix == key))
                    .map(move |key| (key, *property, *namespaces))
            })
        })
        .chain(TOKEN_FAMILIES.iter().copied())
}

/// Retired preset parameter heads must not silently become unknown CSS properties.
pub(crate) fn removed_recipe(property: &str) -> Option<String> {
    match property {
        "grid-cols" | "grid-rows" | "grid-col-span" | "grid-row-span" | "clamp-lines" => Some(
            format!("{property}:value was removed; use {property}(value) with a positive integer"),
        ),
        "text" => {
            Some("text:value was removed; use font-size:value or a named text-token recipe".into())
        }
        _ => None,
    }
}
