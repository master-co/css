//! Pre-2.0 `property:value` classes such as `p:8px` or `align-items:center`.
//! In 2.0 a bare `name:suffix` is always a registered name plus a selector, so
//! these classes silently stop generating CSS. The replacement is the class
//! `suggest_classes` maps the same declaration to, verified by the engine.

use super::{EngineError, HashSet, LintSession};

/// Pre-2.0 declaration key aliases, taken from the last release candidate's
/// built-in key aliases. Entries whose target is not a native property, such as
/// `max` (`max-size`), have no 2.0 declaration to map to.
const KEY_ALIASES: &[(&str, &str)] = &[
    ("b", "border"),
    ("bb", "border-bottom"),
    ("bg", "background"),
    ("bl", "border-left"),
    ("br", "border-right"),
    ("bt", "border-top"),
    ("bx", "border-inline"),
    ("by", "border-block"),
    ("fg", "color"),
    ("gap-x", "column-gap"),
    ("gap-y", "row-gap"),
    ("grid-col", "grid-column"),
    ("grid-col-end", "grid-column-end"),
    ("grid-col-start", "grid-column-start"),
    ("h", "height"),
    ("ix", "inset-inline"),
    ("ixe", "inset-inline-end"),
    ("ixs", "inset-inline-start"),
    ("iy", "inset-block"),
    ("iye", "inset-block-end"),
    ("iys", "inset-block-start"),
    ("leading", "line-height"),
    ("line-clamp", "-webkit-line-clamp"),
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
    ("text-stroke-color", "-webkit-text-stroke-color"),
    ("text-stroke-width", "-webkit-text-stroke-width"),
    ("tracking", "letter-spacing"),
    ("w", "width"),
    ("z", "z-index"),
];

/// Pre-2.0 sizing keywords and the CSS values they emitted.
const SIZE_KEYWORDS: &[(&str, &str)] = &[
    ("full", "100%"),
    ("fit", "fit-content"),
    ("max", "max-content"),
    ("min", "min-content"),
];

/// A pre-2.0 class and, when one is verified, its 2.0 spelling.
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct LegacyClass {
    pub class_name: String,
    pub property: String,
    pub replacement: Option<String>,
}

struct LegacyParts<'a> {
    property: &'a str,
    value: &'a str,
    suffix: &'a str,
    important: bool,
}

fn legacy_parts(class_name: &str) -> Option<LegacyParts<'_>> {
    let (source, important) = class_name
        .strip_suffix('!')
        .map_or((class_name, false), |source| (source, true));
    let (head, rest) = source.split_once(':')?;
    if rest.is_empty() || rest.starts_with(':') {
        return None;
    }
    let property = KEY_ALIASES
        .iter()
        .find_map(|(alias, property)| (*alias == head).then_some(*property))
        .or_else(|| mastercss_schema::is_listed_native_css_property(head).then_some(head))?;
    let end = top_level_suffix_start(rest);
    (end > 0).then(|| LegacyParts {
        property,
        value: &rest[..end],
        suffix: &rest[end..],
        important,
    })
}

/// The first `:` or `@` outside parentheses, brackets and quotes.
fn top_level_suffix_start(value: &str) -> usize {
    let mut depth = 0_usize;
    let mut quote = None;
    for (index, character) in value.char_indices() {
        match (quote, character) {
            (Some(open), _) if character == open => quote = None,
            (Some(_), _) => {}
            (None, '\'' | '"') => quote = Some(character),
            (None, '(' | '[') => depth += 1,
            (None, ')' | ']') => depth = depth.saturating_sub(1),
            (None, ':' | '@') if depth == 0 => return index,
            _ => {}
        }
    }
    value.len()
}

fn sizing_property(property: &str) -> bool {
    matches!(
        property,
        "width"
            | "height"
            | "min-width"
            | "min-height"
            | "max-width"
            | "max-height"
            | "inline-size"
            | "block-size"
            | "min-inline-size"
            | "min-block-size"
            | "max-inline-size"
            | "max-block-size"
            | "flex-basis"
    )
}

impl LintSession {
    /// Pre-2.0 classes among `class_names` that generate nothing in 2.0.
    /// Replacements in `invalid_generated_classes` failed host value checks.
    pub(crate) fn legacy_classes(
        &self,
        class_names: &[String],
        invalid_generated_classes: &HashSet<String>,
    ) -> Result<Vec<LegacyClass>, EngineError> {
        let mut seen = HashSet::new();
        let mut legacy = Vec::new();
        for class_name in class_names {
            if !seen.insert(class_name) {
                continue;
            }
            let Some(parts) = legacy_parts(class_name) else {
                continue;
            };
            if self.generates(class_name, invalid_generated_classes)? {
                continue;
            }
            let replacement = self
                .legacy_base(&parts)?
                .map(|base| {
                    format!(
                        "{base}{}{}",
                        parts.suffix,
                        if parts.important { "!" } else { "" }
                    )
                })
                .map(|candidate| {
                    self.generates(&candidate, invalid_generated_classes)
                        .map(|valid| valid.then_some(candidate))
                })
                .transpose()?
                .flatten();
            legacy.push(LegacyClass {
                class_name: class_name.clone(),
                property: parts.property.to_owned(),
                replacement,
            });
        }
        Ok(legacy)
    }

    fn generates(
        &self,
        class_name: &str,
        invalid_generated_classes: &HashSet<String>,
    ) -> Result<bool, EngineError> {
        if invalid_generated_classes.contains(class_name) {
            return Ok(false);
        }
        let inspection = self.engine.inspect(class_name)?;
        Ok(!inspection.rules.is_empty()
            && !inspection.diagnostics.iter().any(|diagnostic| {
                diagnostic.severity == mastercss_schema::DiagnosticSeverity::Error
            }))
    }

    /// The 2.0 class for the declaration, without suffixes.
    fn legacy_base(&self, parts: &LegacyParts<'_>) -> Result<Option<String>, EngineError> {
        let value = parts.value.replace('|', " ");
        let value = if sizing_property(parts.property) {
            SIZE_KEYWORDS
                .iter()
                .find_map(|(keyword, css)| (*keyword == value).then(|| (*css).to_owned()))
                .unwrap_or(value)
        } else {
            value
        };
        let suggested = self.suggest_single(&format!("{}: {value}", parts.property))?;
        if suggested
            .as_ref()
            .is_some_and(|class| !class.starts_with('('))
        {
            return Ok(suggested);
        }
        // Token keys such as `fg:blue-60` read the theme variable of a token utility.
        if value
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || character == '-')
        {
            for namespace in self.token_namespaces(parts.property)? {
                let token =
                    self.suggest_single(&format!("{}: var({namespace}-{value})", parts.property))?;
                if token.as_ref().is_some_and(|class| !class.starts_with('(')) {
                    return Ok(token);
                }
            }
        }
        Ok(suggested)
    }

    fn suggest_single(&self, declaration: &str) -> Result<Option<String>, EngineError> {
        let suggestion = self.suggest_classes(declaration)?;
        Ok(match suggestion.classes.as_slice() {
            [class] if suggestion.status == "suggested" => Some(class.clone()),
            _ => None,
        })
    }

    /// Variable namespaces of token utilities that emit only `property`.
    fn token_namespaces(&self, property: &str) -> Result<Vec<String>, EngineError> {
        let manifest: serde_json::Value =
            serde_json::from_str(&self.engine.manifest_json()?).unwrap_or(serde_json::Value::Null);
        let utilities: Vec<mastercss_schema::UtilityDefinition> = serde_json::from_value(
            manifest
                .get("utilities")
                .cloned()
                .unwrap_or_else(|| serde_json::json!([])),
        )
        .unwrap_or_default();
        let mut namespaces = Vec::new();
        for utility in utilities {
            if utility.kind != mastercss_schema::UtilityKind::Token {
                continue;
            }
            if !matches!(utility.recipe.body.as_slice(), [mastercss_schema::MixinNode::Declaration { property: emitted, .. }] if emitted == property)
            {
                continue;
            }
            if let Some(parameter) = utility.recipe.parameters.first()
                && !namespaces.contains(&parameter.name)
            {
                namespaces.push(parameter.name.clone());
            }
        }
        Ok(namespaces)
    }
}
