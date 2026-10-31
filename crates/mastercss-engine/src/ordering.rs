//! Rule shape and the order of named atomic utilities within one layer tier.
//!
//! Recipes (several declarations, or an inner selector or condition) precede named
//! atomic utilities (exactly one declaration, whichever form registered it), which
//! precede native declarations. Atomics order by property family, then coverage
//! (whole, axis, side or corner), so a later side or axis overrides its whole family
//! regardless of whether a token, static or function utility set it.
use super::{Program, UtilityDefinition, UtilityEmit, UtilityMatch};

/// Several declarations, or an inner selector or condition.
pub(crate) const RECIPE: u8 = 0;
/// One declaration of a named static, token or function utility.
pub(crate) const ATOMIC: u8 = 1;
/// A `(property:value)` head.
pub(crate) const NATIVE: u8 = 2;

/// The shape a rule sorts by: its category and, for atomics, family placement.
pub(crate) struct RuleShape {
    pub category: u8,
    pub family: String,
    pub coverage: u8,
    pub property: String,
    /// The declaration content atomics sort by after the property.
    pub content: Option<String>,
}

impl RuleShape {
    pub(crate) fn native() -> Self {
        Self {
            category: NATIVE,
            family: String::new(),
            coverage: 0,
            property: String::new(),
            content: None,
        }
    }

    pub(crate) fn recipe() -> Self {
        Self {
            category: RECIPE,
            ..Self::native()
        }
    }

    pub(crate) fn atomic(property: &str, value: &str) -> Self {
        let (family, coverage) = property_family(property);
        Self {
            category: ATOMIC,
            family,
            coverage,
            property: property.to_owned(),
            content: Some(mastercss_lexer::concat_text!(property, ":", value)),
        }
    }
}

/// The shape of a named utility match, read from its expanded structure before
/// compatibility declarations: duplicates still count, so `margin:0;margin:0` is a recipe.
pub(crate) fn utility_shape(
    utility: &UtilityDefinition,
    matched: &UtilityMatch,
    manifest: &Program,
) -> RuleShape {
    match &utility.emit {
        UtilityEmit::Property { property } => matched
            .value
            .as_deref()
            .map_or_else(RuleShape::recipe, |value| {
                RuleShape::atomic(property, value)
            }),
        UtilityEmit::Recipe { definition, .. } => {
            let Some(rules) = super::utility_matching::expansion(manifest, *definition, matched)
            else {
                return RuleShape::recipe();
            };
            match rules {
                [rule] if rule.selector == "&" && rule.conditions.is_empty() => {
                    match rule.declarations.as_slice() {
                        [declaration] => {
                            RuleShape::atomic(&declaration.property, &declaration.value)
                        }
                        _ => RuleShape::recipe(),
                    }
                }
                _ => RuleShape::recipe(),
            }
        }
    }
}

/// The family a property belongs to and its coverage in it: 0 sets the whole family,
/// 1 an axis and 2 one side or corner. Logical and physical members of one coverage
/// share it; their relative order is the stable property order, never a guessed
/// writing mode. Custom properties are case-sensitive families of their own; other
/// unlisted properties, shorthands such as `border` included, are their own family.
pub(crate) fn property_family(property: &str) -> (String, u8) {
    if property.starts_with("--") {
        return (property.to_owned(), 0);
    }
    let property = property.to_ascii_lowercase();
    for family in ["margin", "padding", "scroll-margin", "scroll-padding"] {
        if let Some(coverage) = property.strip_prefix(family).and_then(box_coverage) {
            return (family.to_owned(), coverage);
        }
    }
    if let Some(coverage) = property.strip_prefix("inset").and_then(box_coverage) {
        return ("inset".to_owned(), coverage);
    }
    if matches!(property.as_str(), "top" | "right" | "bottom" | "left") {
        return ("inset".to_owned(), 2);
    }
    for kind in ["width", "style", "color"] {
        if let Some(coverage) = property
            .strip_prefix("border")
            .and_then(|rest| rest.strip_suffix(kind))
            .and_then(|rest| rest.strip_suffix('-'))
            .and_then(box_coverage)
        {
            return (mastercss_lexer::concat_text!("border-", kind), coverage);
        }
    }
    let coverage = match property.as_str() {
        "border-radius" | "gap" | "overflow" => Some(0),
        "row-gap" | "column-gap" | "overflow-x" | "overflow-y" | "overflow-inline"
        | "overflow-block" => Some(1),
        "border-top-left-radius"
        | "border-top-right-radius"
        | "border-bottom-right-radius"
        | "border-bottom-left-radius"
        | "border-start-start-radius"
        | "border-start-end-radius"
        | "border-end-start-radius"
        | "border-end-end-radius" => Some(2),
        _ => None,
    };
    match coverage {
        Some(coverage) => (
            match property.as_str() {
                "row-gap" | "column-gap" => "gap".to_owned(),
                _ if property.starts_with("overflow") => "overflow".to_owned(),
                _ if property.starts_with("border") => "border-radius".to_owned(),
                _ => property,
            },
            coverage,
        ),
        None => (property, 0),
    }
}

/// The coverage of a box family member after its family name.
fn box_coverage(rest: &str) -> Option<u8> {
    match rest {
        "" => Some(0),
        "-inline" | "-block" => Some(1),
        "-top" | "-right" | "-bottom" | "-left" | "-inline-start" | "-inline-end"
        | "-block-start" | "-block-end" => Some(2),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::property_family;

    #[test]
    fn families_and_coverage() {
        for (property, family, coverage) in [
            ("margin", "margin", 0),
            ("margin-inline", "margin", 1),
            ("margin-block-end", "margin", 2),
            ("margin-left", "margin", 2),
            ("margin-trim", "margin-trim", 0),
            ("scroll-padding-inline", "scroll-padding", 1),
            ("inset", "inset", 0),
            ("inset-block", "inset", 1),
            ("top", "inset", 2),
            ("inset-inline-start", "inset", 2),
            ("border-width", "border-width", 0),
            ("border-inline-width", "border-width", 1),
            ("border-inline-start-width", "border-width", 2),
            ("border-top-style", "border-style", 2),
            ("border-block-color", "border-color", 1),
            ("border", "border", 0),
            ("border-top", "border-top", 0),
            ("border-radius", "border-radius", 0),
            ("border-start-end-radius", "border-radius", 2),
            ("border-top-left-radius", "border-radius", 2),
            ("gap", "gap", 0),
            ("column-gap", "gap", 1),
            ("overflow-y", "overflow", 1),
            ("Margin-Top", "margin", 2),
            ("--Gap", "--Gap", 0),
            ("--gap", "--gap", 0),
            ("text-align", "text-align", 0),
        ] {
            assert_eq!(
                property_family(property),
                (family.to_owned(), coverage),
                "{property}"
            );
        }
    }
}
