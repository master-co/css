//! Frozen pre-language-10 registry for explicit historical RC migration only.
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
    "border-block-color",
    "border-block-end-color",
    "border-block-start-color",
    "border-bottom-color",
    "border-color",
    "border-inline-color",
    "border-inline-end-color",
    "border-inline-start-color",
    "border-left-color",
    "border-right-color",
    "border-top-color",
    "outline-color",
];

pub(crate) const BUILTIN_TOKEN_NAMESPACES: &[(&[&str], &[&str])] = &[
    (SPACING_PROPERTIES, &["~spacing"]),
    (SPACING_UNITLESS_PROPERTIES, &["~spacing"]),
    (CONTAINER_PROPERTIES, &["~container"]),
    (RADIUS_PROPERTIES, &["~radius"]),
    (BORDER_COLOR_PROPERTIES, &["~color"]),
    (
        &["accent-color", "background-color", "fill", "filter"],
        &["~color"],
    ),
    (&["caret-color"], &["~color"]),
    (&["stroke"], &["~color"]),
    (&["color"], &["~color"]),
    (
        &["-webkit-text-fill-color", "text-decoration-color"],
        &["~color"],
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
    (&["content"], &["~content"]),
    (&["font-feature-settings"], &["~font-feature"]),
    (&["font-family"], &["~font-family"]),
    (&["font-size"], &["~font-size"]),
    (&["font-weight"], &["~font-weight"]),
    (&["letter-spacing"], &["~tracking"]),
    (&["line-height"], &["~leading"]),
    (&["order"], &["~order"]),
];

pub(crate) const BUILTIN_TOKEN_ALIASES: &[(&str, &str)] = &[
    ("fg", "color"),
    ("bg", "background-color"),
    ("gap-x", "column-gap"),
    ("gap-y", "row-gap"),
    ("grid-col", "grid-column"),
    ("grid-col-end", "grid-column-end"),
    ("grid-col-start", "grid-column-start"),
    ("b", "border-color"),
    ("bb", "border-bottom-color"),
    ("bl", "border-left-color"),
    ("br", "border-right-color"),
    ("bt", "border-top-color"),
    ("bx", "border-inline-color"),
    ("by", "border-block-color"),
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
    ("text-stroke", "-webkit-text-stroke-color"),
    ("text-stroke-color", "-webkit-text-stroke-color"),
    ("text-stroke-width", "-webkit-text-stroke-width"),
    ("tracking", "letter-spacing"),
    ("w", "width"),
    ("z", "z-index"),
];

/// Returns the canonical built-in key alias registry for Rust tooling policy.
/// Manifest-carried registry fields are intentionally not consulted.
pub fn builtin_token_aliases() -> &'static [(&'static str, &'static str)] {
    BUILTIN_TOKEN_ALIASES
}

/// Returns the canonical built-in named-token namespace registry.
///
/// Build tooling uses this read-only projection to generate TypeScript tooling data
/// without introducing a second semantic source of truth.
pub fn builtin_token_namespaces() -> &'static [(&'static [&'static str], &'static [&'static str])] {
    BUILTIN_TOKEN_NAMESPACES
}

pub(crate) const TOKEN_FAMILIES: &[(&str, &str, &[&str])] = &[
    ("font", "font-size", &["~font-size"]),
    ("font", "font-family", &["~font-family"]),
    ("font", "font-weight", &["~font-weight"]),
    ("bg", "background-color", &["~color"]),
    ("b", "border-color", &["~color"]),
    ("bt", "border-top-color", &["~color"]),
    ("br", "border-right-color", &["~color"]),
    ("bb", "border-bottom-color", &["~color"]),
    ("bl", "border-left-color", &["~color"]),
    ("bx", "border-inline-color", &["~color"]),
    ("by", "border-block-color", &["~color"]),
    ("outline", "outline-color", &["~color"]),
    ("text-decoration", "text-decoration-color", &["~color"]),
    ("text-underline", "text-underline-offset", &["~spacing"]),
    ("text-stroke", "-webkit-text-stroke-color", &["~color"]),
    ("backdrop-filter", "backdrop-filter", &["~color"]),
];

pub fn builtin_token_families()
-> impl Iterator<Item = (&'static str, &'static str, &'static [&'static str])> {
    BUILTIN_TOKEN_NAMESPACES
        .iter()
        .flat_map(|(properties, namespaces)| {
            properties.iter().flat_map(move |property| {
                std::iter::once(*property)
                    .chain(
                        BUILTIN_TOKEN_ALIASES
                            .iter()
                            .filter_map(move |(alias, target)| {
                                (*target == *property).then_some(*alias)
                            }),
                    )
                    .filter(|key| !TOKEN_FAMILIES.iter().any(|(prefix, _, _)| prefix == key))
                    .map(move |key| (key, *property, *namespaces))
            })
        })
        .chain(TOKEN_FAMILIES.iter().copied())
}
