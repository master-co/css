use super::{
    ConditionFeature, EngineSettings, JS_MAX_SAFE_INTEGER, ManifestCondition, ManifestProjection,
    UtilityLayerName, Value, natural_compare,
};

pub(crate) fn resolve_layer_condition(
    token: &str,
    manifest: &ManifestProjection,
) -> Option<UtilityLayerName> {
    let condition = manifest.conditions.get(token)?;
    if condition.id != "layer" || condition.nodes.len() != 1 {
        return None;
    }
    let value = condition.nodes[0].get("value")?.as_str()?;
    match value {
        "base" => Some(UtilityLayerName::Base),
        "defaults" => Some(UtilityLayerName::Defaults),
        "components" => Some(UtilityLayerName::Components),
        "utilities" => Some(UtilityLayerName::Utilities),
        _ => None,
    }
}

pub(crate) fn render_condition_token(
    token: &str,
    manifest: &ManifestProjection,
) -> Option<(String, String, Vec<ConditionFeature>)> {
    if let Some(condition) = manifest.conditions.get(token) {
        let wrapper = render_manifest_condition(condition, None);
        let features = native_query_features(&wrapper);
        return Some((condition.id.clone(), wrapper, features));
    }
    let query = mastercss_lexer::parse_native_query(token)?;
    let wrapper = format!("@{} {}", query.kind, query.prelude);
    let features = native_query_features(&wrapper);
    Some((query.kind, wrapper, features))
}

/// Only simple ranges with identical units are compared numerically. The unit is
/// part of the feature identity; rem/em/px never share an assumed root size.
pub fn native_query_features(query: &str) -> Vec<ConditionFeature> {
    let mut features = Vec::new();
    let body = if let Some(body) = query.strip_prefix("@media ") {
        body.trim()
    } else if let Some(body) = query.strip_prefix("@container ") {
        let body = body.trim();
        if body.starts_with('(') {
            body
        } else {
            let Some((name, body)) = body.split_once(char::is_whitespace) else {
                return features;
            };
            if !name
                .chars()
                .all(|c| c.is_alphanumeric() || matches!(c, '-' | '_'))
            {
                return features;
            }
            body.trim()
        }
    } else {
        return features;
    };
    // Numeric ordering is only justified for a conjunction of simple ranges.
    // Negation, disjunction, functions and nested expressions use stable syntax.
    for part in body.split(" and ") {
        let Some(body) = part
            .trim()
            .strip_prefix('(')
            .and_then(|s| s.strip_suffix(')'))
        else {
            return Vec::new();
        };
        if body.contains(['(', ')', '\'', '"']) {
            return Vec::new();
        }
        if !add_native_range_features(&mut features, body.trim()) {
            return Vec::new();
        }
    }
    features.sort_by(|left, right| natural_compare(&left.0, &right.0));
    features
}

fn range_dimension(value: &str) -> Option<(f64, String)> {
    let number_end = value
        .find(|c: char| !(c.is_ascii_digit() || matches!(c, '.' | '-' | '+')))
        .unwrap_or(value.len());
    let number = value[..number_end].parse::<f64>().ok()?;
    let unit = &value[number_end..];
    (number.is_finite() && unit.chars().all(|c| c.is_ascii_alphabetic() || c == '%'))
        .then(|| (number, unit.to_ascii_lowercase()))
}

fn range_feature(value: &str) -> bool {
    matches!(value, "width" | "height" | "resolution" | "aspect-ratio")
}

fn add_native_range_features(features: &mut Vec<ConditionFeature>, body: &str) -> bool {
    if let Some((name, dimension)) = body.split_once(':') {
        let name = name.trim();
        let (name, operator) = if let Some(name) = name.strip_prefix("min-") {
            (name, ">=")
        } else if let Some(name) = name.strip_prefix("max-") {
            (name, "<=")
        } else {
            (name, "=")
        };
        let Some((number, unit)) = range_dimension(dimension.trim()) else {
            return false;
        };
        if !range_feature(name) {
            return false;
        }
        add_condition_feature(features, &format!("{name}:{unit}"), operator, number);
        return true;
    }
    let mut operands = Vec::new();
    let mut operators = Vec::new();
    let mut remaining = body;
    while let Some(index) = remaining.find(['>', '<', '=']) {
        operands.push(remaining[..index].trim());
        remaining = &remaining[index..];
        let end = remaining
            .find(|c: char| !matches!(c, '>' | '<' | '='))
            .unwrap_or(remaining.len());
        operators.push(&remaining[..end]);
        remaining = &remaining[end..];
    }
    operands.push(remaining.trim());
    if operators.is_empty() || operators.len() > 2 {
        return false;
    }
    if operators.len() == 2
        && (!range_feature(operands[1])
            || operators[0].starts_with('=')
            || operators[0].chars().next() != operators[1].chars().next())
    {
        return false;
    }
    for (index, operator) in operators.iter().enumerate() {
        let (left, right) = (operands[index], operands[index + 1]);
        let (name, dimension, operator) = if range_feature(left) {
            (left, right, *operator)
        } else if range_feature(right) {
            let reversed = match *operator {
                ">" => "<",
                ">=" => "<=",
                "<" => ">",
                "<=" => ">=",
                "=" => "=",
                _ => return false,
            };
            (right, left, reversed)
        } else {
            return false;
        };
        if !matches!(operator, ">" | ">=" | "<" | "<=" | "=") {
            return false;
        }
        let Some((number, unit)) = range_dimension(dimension) else {
            return false;
        };
        add_condition_feature(features, &format!("{name}:{unit}"), operator, number);
    }
    true
}

pub(crate) fn add_condition_feature(
    features: &mut Vec<ConditionFeature>,
    name: &str,
    operator: &str,
    value: f64,
) {
    let feature = if let Some(feature) = features.iter_mut().find(|feature| feature.0 == name) {
        feature
    } else {
        features.push((name.to_owned(), 0.0, JS_MAX_SAFE_INTEGER));
        features.last_mut().expect("inserted condition feature")
    };
    match operator {
        ">" | ">=" => feature.1 = feature.1.max(value),
        "<" | "<=" => feature.2 = feature.2.min(value),
        "=" => {
            feature.1 = value;
            feature.2 = value;
        }
        _ => {}
    }
}

pub(crate) fn merge_condition_features(
    target: &mut Vec<ConditionFeature>,
    source: &[ConditionFeature],
) {
    for (name, min, max) in source {
        if let Some(feature) = target.iter_mut().find(|feature| feature.0 == *name) {
            if *min != 0.0 {
                feature.1 = *min;
            }
            if *max != JS_MAX_SAFE_INTEGER {
                feature.2 = *max;
            }
        } else {
            target.push((name.clone(), *min, *max));
        }
    }
    target.sort_by(|left, right| natural_compare(&left.0, &right.0));
}

pub(crate) fn render_manifest_condition(
    condition: &ManifestCondition,
    operator: Option<&str>,
) -> String {
    let body = render_condition_nodes_body(&condition.id, &condition.nodes, operator);
    if body.is_empty() {
        format!("@{}", condition.id)
    } else {
        format!("@{} {body}", condition.id)
    }
}

pub(crate) fn render_condition_nodes_body(
    id: &str,
    nodes: &[Value],
    operator: Option<&str>,
) -> String {
    nodes
        .iter()
        .map(|node| render_condition_node(id, node, operator))
        .filter(|node| !node.is_empty())
        .collect::<Vec<_>>()
        .join(if id == "layer" { "." } else { " " })
}

pub(crate) fn render_condition_node(id: &str, node: &Value, operator: Option<&str>) -> String {
    let Some(object) = node.as_object() else {
        return String::new();
    };
    if let Some(children) = object.get("children").and_then(Value::as_array) {
        let body = render_condition_nodes_body(id, children, operator);
        return if object.get("type").and_then(Value::as_str) == Some("group") {
            format!("({body})")
        } else {
            body
        };
    }
    let node_type = object
        .get("type")
        .and_then(Value::as_str)
        .unwrap_or_default();
    if node_type == "boolean" {
        return object
            .get("name")
            .and_then(Value::as_str)
            .map(|name| format!("({name})"))
            .unwrap_or_default();
    }
    if node_type == "logical" || node_type == "comparison" {
        return object
            .get("value")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_owned();
    }
    let value = match object.get("value") {
        Some(Value::Number(number)) => {
            let mut value = number
                .as_f64()
                .map(format_standard_number)
                .unwrap_or_else(|| number.to_string());
            value.push_str(
                object
                    .get("unit")
                    .and_then(Value::as_str)
                    .unwrap_or_default(),
            );
            value
        }
        Some(Value::String(value)) => value.clone(),
        _ => String::new(),
    };
    let name = object.get("name").and_then(Value::as_str);
    if node_type == "number" && name.is_none() {
        return format!("(width{}{value})", operator.unwrap_or(">="));
    }
    if let Some(name) = name {
        if node_type == "number" {
            let operator = operator
                .or_else(|| object.get("operator").and_then(Value::as_str))
                .unwrap_or(":");
            return format!("({name}{operator}{value})");
        }
        return format!("({name}:{value})");
    }
    value
}

pub(crate) fn normalize_dynamic_value(value: &str, _settings: &EngineSettings) -> String {
    // CSS owns dimensions, including the native resolution unit `x`.
    value.to_owned()
}

pub(crate) fn format_standard_number(value: f64) -> String {
    if value == 0.0 {
        "0".into()
    } else {
        value.to_string()
    }
}

pub(crate) fn parse_raw_condition_wrapper(raw: &str) -> Option<(String, String)> {
    let raw = raw.trim();
    let id = raw.strip_prefix('@')?.split_whitespace().next()?.to_owned();
    Some((id, raw.to_owned()))
}

pub(crate) fn add_condition_wrapper(
    wrappers: &mut Vec<(String, String)>,
    id: &str,
    wrapper: String,
) {
    wrappers.push((id.to_owned(), wrapper));
}
