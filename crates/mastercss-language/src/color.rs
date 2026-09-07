use mastercss_engine::{EngineError, EngineSession};

use crate::{LanguageColorExpressionIr, LanguageColorFormatIr};

const COLOR_SPACES: &[&str] = &[
    "srgb",
    "srgb-linear",
    "display-p3",
    "a98-rgb",
    "prophoto-rgb",
    "rec2020",
    "lab",
    "oklab",
    "xyz",
    "xyz-d50",
    "xyz-d65",
    "hsl",
    "hwb",
    "lch",
    "oklch",
];

const POLAR_COLOR_SPACES: &[&str] = &["hsl", "hwb", "lch", "oklch"];
const HUE_METHODS: &[&str] = &["shorter", "longer", "increasing", "decreasing"];
const DYNAMIC_COLOR_FUNCTIONS: &[&str] = &["var", "env", "light-dark"];
const SYSTEM_COLORS: &[&str] = &[
    "accentcolor",
    "accentcolortext",
    "activetext",
    "buttonborder",
    "buttonface",
    "buttontext",
    "canvas",
    "canvastext",
    "field",
    "fieldtext",
    "graytext",
    "highlight",
    "highlighttext",
    "linktext",
    "mark",
    "marktext",
    "selecteditem",
    "selecteditemtext",
    "visitedtext",
];

fn function_body<'a>(value: &'a str, expected_name: &str) -> Option<&'a str> {
    let value = value.trim();
    let opening = value.find('(')?;
    if !value[..opening].eq_ignore_ascii_case(expected_name) || !value.ends_with(')') {
        return None;
    }
    let mut depth = 0_u32;
    for (index, character) in value.char_indices().skip(opening) {
        match character {
            '(' => depth += 1,
            ')' => {
                depth = depth.checked_sub(1)?;
                if depth == 0 && index + character.len_utf8() != value.len() {
                    return None;
                }
            }
            _ => {}
        }
    }
    (depth == 0).then(|| &value[opening + 1..value.len() - 1])
}

fn function_name(value: &str) -> Option<&str> {
    let opening = value.find('(')?;
    let name = value[..opening].trim();
    (!name.is_empty()).then_some(name)
}

fn split_top_level(value: &str, delimiter: char) -> Option<Vec<&str>> {
    let mut depth = 0_u32;
    let mut start = 0;
    let mut parts = Vec::new();
    for (index, character) in value.char_indices() {
        match character {
            '(' => depth += 1,
            ')' => depth = depth.checked_sub(1)?,
            _ if character == delimiter && depth == 0 => {
                parts.push(value[start..index].trim());
                start = index + character.len_utf8();
            }
            _ => {}
        }
    }
    if depth != 0 {
        return None;
    }
    parts.push(value[start..].trim());
    parts.iter().all(|part| !part.is_empty()).then_some(parts)
}

fn split_master_alpha(value: &str) -> Option<(&str, Option<f64>)> {
    let mut depth = 0_u32;
    let mut slash = None;
    for (index, character) in value.char_indices() {
        match character {
            '(' => depth += 1,
            ')' => depth = depth.checked_sub(1)?,
            '/' if depth == 0 => slash = Some(index),
            _ => {}
        }
    }
    let Some(slash) = slash else {
        return Some((value.trim(), None));
    };
    let alpha = value[slash + 1..].trim().parse::<f64>().ok()?;
    alpha
        .is_finite()
        .then_some((value[..slash].trim(), Some(alpha)))
}

fn trailing_percentage(value: &str) -> Option<(&str, Option<f64>)> {
    let mut depth = 0_u32;
    let mut boundary = None;
    for (index, character) in value.char_indices() {
        match character {
            '(' => depth += 1,
            ')' => depth = depth.checked_sub(1)?,
            _ if depth == 0 && character.is_ascii_whitespace() => boundary = Some(index),
            _ => {}
        }
    }
    let Some(boundary) = boundary else {
        return Some((value.trim(), None));
    };
    let candidate = value[boundary..].trim();
    let Some(number) = candidate.strip_suffix('%') else {
        return Some((value.trim(), None));
    };
    let percentage = number.trim().parse::<f64>().ok()?;
    (percentage.is_finite() && (0.0..=100.0).contains(&percentage))
        .then_some((value[..boundary].trim(), Some(percentage)))
}

fn interpolation_method(value: &str) -> Option<(String, Option<String>)> {
    let tokens = value
        .split_ascii_whitespace()
        .map(str::to_ascii_lowercase)
        .collect::<Vec<_>>();
    let space = tokens.first()?.clone();
    if !COLOR_SPACES.contains(&space.as_str()) {
        return None;
    }
    match tokens.as_slice() {
        [_] => Some((space, None)),
        [_, method, hue]
            if hue == "hue"
                && POLAR_COLOR_SPACES.contains(&space.as_str())
                && HUE_METHODS.contains(&method.as_str()) =>
        {
            Some((space, Some(method.clone())))
        }
        _ => None,
    }
}

fn strip_interpolation_prefix(value: &str) -> Option<&str> {
    let value = value.trim();
    value
        .get(..3)
        .filter(|prefix| prefix.eq_ignore_ascii_case("in "))?;
    Some(&value[3..])
}

fn is_dynamic_color(value: &str) -> bool {
    let lower = value.trim().to_ascii_lowercase();
    lower == "currentcolor"
        || SYSTEM_COLORS.contains(&lower.as_str())
        || function_name(&lower).is_some_and(|name| DYNAMIC_COLOR_FUNCTIONS.contains(&name))
}

fn merge_alpha(alpha: Option<f64>, inherited_alpha: Option<f64>) -> Option<f64> {
    match (alpha, inherited_alpha) {
        (Some(alpha), Some(inherited)) => Some(alpha * inherited),
        (Some(alpha), None) | (None, Some(alpha)) => Some(alpha),
        (None, None) => None,
    }
}

fn parse_expression(
    engine: &EngineSession,
    class_name: Option<&str>,
    value: &str,
    inherited_alpha: Option<f64>,
    depth: u8,
) -> Result<Option<LanguageColorExpressionIr>, EngineError> {
    if depth > 8 {
        return Ok(None);
    }
    let Some((value, alpha)) = split_master_alpha(value) else {
        return Ok(None);
    };
    let alpha = merge_alpha(alpha, inherited_alpha);
    let resolved = engine.resolve_color_token(value, class_name)?;
    if let Some(resolved) = resolved.as_deref()
        && resolved.trim() != value
    {
        return parse_expression(engine, class_name, resolved, alpha, depth + 1);
    }
    if is_dynamic_color(value) {
        return Ok(None);
    }
    if let Some(body) = function_body(value, "color-mix") {
        if alpha.is_some() {
            return Ok(None);
        }
        let Some(parts) = split_top_level(body, ',') else {
            return Ok(None);
        };
        let [method, left, right] = parts.as_slice() else {
            return Ok(None);
        };
        let Some(method) = strip_interpolation_prefix(method) else {
            return Ok(None);
        };
        let Some((space, hue)) = interpolation_method(method.trim()) else {
            return Ok(None);
        };
        let Some((left, left_percentage)) = trailing_percentage(left) else {
            return Ok(None);
        };
        let Some((right, right_percentage)) = trailing_percentage(right) else {
            return Ok(None);
        };
        let (left_weight, right_weight) = match (left_percentage, right_percentage) {
            (None, None) => (50.0, 50.0),
            (Some(left), None) => (left, 100.0 - left),
            (None, Some(right)) => (100.0 - right, right),
            (Some(left), Some(right)) => (left, right),
        };
        if left_weight < 0.0 || right_weight < 0.0 {
            return Ok(None);
        }
        let total = left_weight + right_weight;
        if !total.is_finite() || total <= 0.0 {
            return Ok(None);
        }
        let Some(left) = parse_expression(engine, class_name, left, None, depth + 1)? else {
            return Ok(None);
        };
        let Some(right) = parse_expression(engine, class_name, right, None, depth + 1)? else {
            return Ok(None);
        };
        return Ok(Some(LanguageColorExpressionIr::Mix {
            space,
            hue,
            left: Box::new(left),
            right: Box::new(right),
            progress: right_weight / total,
            alpha_multiplier: total.min(100.0) / 100.0,
        }));
    }
    Ok(Some(LanguageColorExpressionIr::Literal {
        value: value.replace('|', " "),
        alpha,
    }))
}

pub(crate) fn color_expression(
    engine: &EngineSession,
    class_name: &str,
    value: &str,
    alpha: Option<f64>,
) -> Result<Option<LanguageColorExpressionIr>, EngineError> {
    parse_expression(engine, Some(class_name), value, alpha, 0)
}

fn format_for_space(space: &str) -> LanguageColorFormatIr {
    match space {
        "srgb" | "srgb-linear" => LanguageColorFormatIr {
            syntax: "rgb".into(),
            space: None,
        },
        "hsl" | "hwb" | "lab" | "lch" | "oklab" | "oklch" => LanguageColorFormatIr {
            syntax: space.into(),
            space: None,
        },
        space => LanguageColorFormatIr {
            syntax: "color".into(),
            space: Some(space.into()),
        },
    }
}

pub(crate) fn color_source_format(
    engine: &EngineSession,
    color_token: &str,
) -> Result<Option<LanguageColorFormatIr>, EngineError> {
    let Some((token, _)) = split_master_alpha(color_token) else {
        return Ok(None);
    };
    let resolved = engine.resolve_color_token(token, None)?;
    let normalized = resolved.as_deref().unwrap_or(token).replace('|', " ");
    let token = normalized.trim();
    if is_dynamic_color(token) {
        return Ok(None);
    }
    if token.starts_with('#') {
        return Ok(Some(LanguageColorFormatIr {
            syntax: "hex".into(),
            space: None,
        }));
    }
    if let Some(body) = function_body(token, "color-mix") {
        let Some(parts) = split_top_level(body, ',') else {
            return Ok(None);
        };
        let Some(method) = parts
            .first()
            .and_then(|part| strip_interpolation_prefix(part))
        else {
            return Ok(None);
        };
        return Ok(interpolation_method(method.trim()).map(|(space, _)| format_for_space(&space)));
    }
    let Some(name) = function_name(token).map(str::to_ascii_lowercase) else {
        return Ok(Some(LanguageColorFormatIr {
            syntax: "rgb".into(),
            space: None,
        }));
    };
    if name == "color" {
        let Some(body) = function_body(token, "color") else {
            return Ok(None);
        };
        let Some(space) = body.split_ascii_whitespace().next() else {
            return Ok(None);
        };
        let space = space.to_ascii_lowercase();
        return Ok(COLOR_SPACES
            .contains(&space.as_str())
            .then(|| LanguageColorFormatIr {
                syntax: "color".into(),
                space: Some(space),
            }));
    }
    let syntax = match name.as_str() {
        "rgb" | "rgba" => "rgb",
        "hsl" | "hsla" => "hsl",
        "hwb" | "lab" | "lch" | "oklab" | "oklch" => name.as_str(),
        _ => return Ok(None),
    };
    Ok(Some(LanguageColorFormatIr {
        syntax: syntax.into(),
        space: None,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn session() -> EngineSession {
        EngineSession::create(r#"{"version":1,"utilities":[]}"#).unwrap()
    }

    #[test]
    fn parses_static_color_mix_weights_and_hue() {
        let session = session();
        let expression = color_expression(
            &session,
            "fg:color-mix(in|oklch|longer|hue,red|20%,blue|40%)",
            "color-mix(in oklch longer hue,red 20%,blue 40%)",
            None,
        )
        .unwrap()
        .unwrap();
        let LanguageColorExpressionIr::Mix {
            space,
            hue,
            progress,
            alpha_multiplier,
            ..
        } = expression
        else {
            panic!("expected a mix expression")
        };
        assert_eq!(space, "oklch");
        assert_eq!(hue.as_deref(), Some("longer"));
        assert!((progress - (2.0 / 3.0)).abs() < f64::EPSILON);
        assert!((alpha_multiplier - 0.6).abs() < f64::EPSILON);

        assert!(matches!(
            color_expression(
                &session,
                "fg:COLOR-MIX(IN|OKLCH|LONGER|HUE,red,blue)",
                "COLOR-MIX(IN OKLCH LONGER HUE,red,blue)",
                None,
            )
            .unwrap(),
            Some(LanguageColorExpressionIr::Mix { .. })
        ));
    }

    #[test]
    fn rejects_dynamic_or_invalid_color_mix() {
        let session = session();
        for value in [
            "color-mix(in srgb,var(--brand),blue)",
            "color-mix(in srgb,currentColor,blue)",
            "color-mix(in srgb,red 0%,blue 0%)",
            "color-mix(in unknown,red,blue)",
        ] {
            assert_eq!(
                color_expression(&session, "fg:test", value, None).unwrap(),
                None
            );
        }
    }
}
