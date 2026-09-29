//! One canonical entry per built-in token property. Native declarations are separate.
macro_rules! token_families {
    ($(($prefix:literal, $property:literal, $namespace:literal)),* $(,)?) => {
        const TOKEN_FAMILIES: &[(&str, &str, &[&str])] = &[$(($prefix, $property, &[$namespace])),*];
        pub(crate) const BUILTIN_TOKEN_NAMESPACES: &[(&[&str], &[&str])] = &[$((&[$property], &[$namespace])),*];
    };
}

token_families! {
    ("background-position", "background-position", "~spacing"),
    ("bottom", "bottom", "~spacing"),
    ("border-spacing", "border-spacing", "~spacing"),
    ("gap-x", "column-gap", "~spacing"),
    ("gap", "gap", "~spacing"),
    ("inset", "inset", "~spacing"),
    ("iy", "inset-block", "~spacing"),
    ("iye", "inset-block-end", "~spacing"),
    ("iys", "inset-block-start", "~spacing"),
    ("ix", "inset-inline", "~spacing"),
    ("ixe", "inset-inline-end", "~spacing"),
    ("ixs", "inset-inline-start", "~spacing"),
    ("left", "left", "~spacing"),
    ("m", "margin", "~spacing"),
    ("my", "margin-block", "~spacing"),
    ("mye", "margin-block-end", "~spacing"),
    ("mys", "margin-block-start", "~spacing"),
    ("mb", "margin-bottom", "~spacing"),
    ("mx", "margin-inline", "~spacing"),
    ("mxe", "margin-inline-end", "~spacing"),
    ("mxs", "margin-inline-start", "~spacing"),
    ("ml", "margin-left", "~spacing"),
    ("mr", "margin-right", "~spacing"),
    ("mt", "margin-top", "~spacing"),
    ("mask-position", "mask-position", "~spacing"),
    ("object-position", "object-position", "~spacing"),
    ("outline-offset", "outline-offset", "~spacing"),
    ("p", "padding", "~spacing"),
    ("py", "padding-block", "~spacing"),
    ("pye", "padding-block-end", "~spacing"),
    ("pys", "padding-block-start", "~spacing"),
    ("pb", "padding-bottom", "~spacing"),
    ("px", "padding-inline", "~spacing"),
    ("pxe", "padding-inline-end", "~spacing"),
    ("pxs", "padding-inline-start", "~spacing"),
    ("pl", "padding-left", "~spacing"),
    ("pr", "padding-right", "~spacing"),
    ("pt", "padding-top", "~spacing"),
    ("perspective", "perspective", "~spacing"),
    ("perspective-origin", "perspective-origin", "~spacing"),
    ("right", "right", "~spacing"),
    ("gap-y", "row-gap", "~spacing"),
    ("scroll-m", "scroll-margin", "~spacing"),
    ("scroll-my", "scroll-margin-block", "~spacing"),
    ("scroll-mye", "scroll-margin-block-end", "~spacing"),
    ("scroll-mys", "scroll-margin-block-start", "~spacing"),
    ("scroll-mb", "scroll-margin-bottom", "~spacing"),
    ("scroll-mx", "scroll-margin-inline", "~spacing"),
    ("scroll-mxe", "scroll-margin-inline-end", "~spacing"),
    ("scroll-mxs", "scroll-margin-inline-start", "~spacing"),
    ("scroll-ml", "scroll-margin-left", "~spacing"),
    ("scroll-mr", "scroll-margin-right", "~spacing"),
    ("scroll-mt", "scroll-margin-top", "~spacing"),
    ("scroll-p", "scroll-padding", "~spacing"),
    ("scroll-py", "scroll-padding-block", "~spacing"),
    ("scroll-pye", "scroll-padding-block-end", "~spacing"),
    ("scroll-pys", "scroll-padding-block-start", "~spacing"),
    ("scroll-pb", "scroll-padding-bottom", "~spacing"),
    ("scroll-px", "scroll-padding-inline", "~spacing"),
    ("scroll-pxe", "scroll-padding-inline-end", "~spacing"),
    ("scroll-pxs", "scroll-padding-inline-start", "~spacing"),
    ("scroll-pl", "scroll-padding-left", "~spacing"),
    ("scroll-pr", "scroll-padding-right", "~spacing"),
    ("scroll-pt", "scroll-padding-top", "~spacing"),
    ("shape-margin", "shape-margin", "~spacing"),
    ("text-indent", "text-indent", "~spacing"),
    ("text-underline", "text-underline-offset", "~spacing"),
    ("top", "top", "~spacing"),
    ("translate", "translate", "~spacing"),
    ("transform-origin", "transform-origin", "~spacing"),
    ("word-spacing", "word-spacing", "~spacing"),
    ("cx", "cx", "~spacing"),
    ("cy", "cy", "~spacing"),
    ("stroke-dashoffset", "stroke-dashoffset", "~spacing"),
    ("x", "x", "~spacing"),
    ("y", "y", "~spacing"),
    ("background-size", "background-size", "~container"),
    ("size-y", "block-size", "~container"),
    ("contain-intrinsic-block-size", "contain-intrinsic-block-size", "~container"),
    ("contain-intrinsic-inline-size", "contain-intrinsic-inline-size", "~container"),
    ("flex-basis", "flex-basis", "~container"),
    ("h", "height", "~container"),
    ("size-x", "inline-size", "~container"),
    ("max-size-y", "max-block-size", "~container"),
    ("max-h", "max-height", "~container"),
    ("max-size-x", "max-inline-size", "~container"),
    ("max-w", "max-width", "~container"),
    ("min-size-y", "min-block-size", "~container"),
    ("min-h", "min-height", "~container"),
    ("min-size-x", "min-inline-size", "~container"),
    ("min-w", "min-width", "~container"),
    ("mask-size", "mask-size", "~container"),
    ("w", "width", "~container"),
    ("rbl", "border-bottom-left-radius", "~radius"),
    ("rbr", "border-bottom-right-radius", "~radius"),
    ("border-end-end-radius", "border-end-end-radius", "~radius"),
    ("border-end-start-radius", "border-end-start-radius", "~radius"),
    ("r", "border-radius", "~radius"),
    ("border-start-end-radius", "border-start-end-radius", "~radius"),
    ("border-start-start-radius", "border-start-start-radius", "~radius"),
    ("rtl", "border-top-left-radius", "~radius"),
    ("rtr", "border-top-right-radius", "~radius"),
    ("by", "border-block-color", "~color"),
    ("border-block-end-color", "border-block-end-color", "~color"),
    ("border-block-start-color", "border-block-start-color", "~color"),
    ("bb", "border-bottom-color", "~color"),
    ("b", "border-color", "~color"),
    ("bx", "border-inline-color", "~color"),
    ("border-inline-end-color", "border-inline-end-color", "~color"),
    ("border-inline-start-color", "border-inline-start-color", "~color"),
    ("bl", "border-left-color", "~color"),
    ("br", "border-right-color", "~color"),
    ("bt", "border-top-color", "~color"),
    ("outline", "outline-color", "~color"),
    ("accent-color", "accent-color", "~color"),
    ("bg", "background-color", "~color"),
    ("fill", "fill", "~color"),
    ("caret-color", "caret-color", "~color"),
    ("stroke", "stroke", "~color"),
    ("fg", "color", "~color"),
    ("text-fill-color", "-webkit-text-fill-color", "~color"),
    ("text-decoration", "text-decoration-color", "~color"),
    ("text-stroke", "-webkit-text-stroke-color", "~color"),
    ("shadow", "box-shadow", "~shadow"),
    ("animation-delay", "animation-delay", "~duration"),
    ("animation-duration", "animation-duration", "~duration"),
    ("transition-delay", "transition-delay", "~duration"),
    ("transition-duration", "transition-duration", "~duration"),
    ("animation-timing-function", "animation-timing-function", "~easing"),
    ("transition-timing-function", "transition-timing-function", "~easing"),
    ("content", "content", "~content"),
    ("font-feature-settings", "font-feature-settings", "~font-feature"),
    ("font-family", "font-family", "~font-family"),
    ("font-size", "font-size", "~font-size"),
    ("font-weight", "font-weight", "~font-weight"),
    ("tracking", "letter-spacing", "~tracking"),
    ("leading", "line-height", "~leading"),
    ("order", "order", "~order"),
}

/// Read-only projection of the engine's unique named-token entrypoints.
pub fn builtin_token_families()
-> impl Iterator<Item = (&'static str, &'static str, &'static [&'static str])> {
    TOKEN_FAMILIES.iter().copied()
}

/// Namespace consumers, derived from the same canonical registry.
pub fn builtin_token_namespaces() -> &'static [(&'static [&'static str], &'static [&'static str])] {
    BUILTIN_TOKEN_NAMESPACES
}

/// Diagnostics only: these names never participate in declaration matching.
pub(crate) fn removed_raw_alias(property: &str) -> Option<&'static str> {
    if mastercss_schema::is_native_css_property(property) {
        return None;
    }
    builtin_token_families()
        .find_map(|(prefix, target, _)| (prefix == property && prefix != target).then_some(target))
        .or(match property {
            "grid-col" => Some("grid-column"),
            "grid-col-start" => Some("grid-column-start"),
            "grid-col-end" => Some("grid-column-end"),
            "text-stroke-color" => Some("-webkit-text-stroke-color"),
            "text-stroke-width" => Some("-webkit-text-stroke-width"),
            "z" => Some("z-index"),
            _ => None,
        })
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
