use super::{
    ConditionFeature, EngineSettings, ManifestCondition, ManifestProjection, UtilityLayerName,
    Value, natural_compare,
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
) -> Option<(String, String)> {
    if let Some(condition) = manifest.conditions.get(token) {
        let wrapper = render_manifest_condition(condition, None);
        return Some((condition.id.clone(), wrapper));
    }
    let query = mastercss_lexer::parse_native_query(token)?;
    let wrapper = format!("@{} {}", query.kind, query.prelude);
    Some((query.kind, wrapper))
}

/// Only simple ranges with identical units are compared numerically. The unit is
/// part of the feature identity; rem/em/px never share an assumed root size.
pub fn native_query_features(query: &str) -> Vec<ConditionFeature> {
    let mut features = Vec::new();
    let (domain, body) = if let Some(body) = query.strip_prefix("@media ") {
        ("media".to_owned(), body.trim())
    } else if let Some(body) = query.strip_prefix("@container ") {
        let body = body.trim();
        if body.starts_with('(') {
            ("container:".to_owned(), body)
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
            (format!("container:{name}"), body.trim())
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
    for feature in &mut features {
        feature.domain = domain.clone();
    }
    features.sort_by(|left, right| {
        natural_compare(&left.feature, &right.feature)
            .then_with(|| natural_compare(&left.unit, &right.unit))
    });
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
    use mastercss_schema::{ConditionBoundIr, ConditionRangeIr};
    let (name, unit) = name.split_once(':').unwrap_or((name, ""));
    let mut source = ConditionRangeIr {
        domain: String::new(),
        feature: name.into(),
        unit: unit.into(),
        lower: None,
        upper: None,
    };
    let bound = ConditionBoundIr {
        value,
        inclusive: operator.contains('='),
    };
    match operator {
        ">" | ">=" => source.lower = Some(bound),
        "<" | "<=" => source.upper = Some(bound),
        "=" => {
            source.lower = Some(bound.clone());
            source.upper = Some(bound);
        }
        _ => return,
    }
    if let Some(target) = features
        .iter_mut()
        .find(|feature| feature.feature == name && feature.unit == unit)
    {
        intersect_range(target, &source);
    } else {
        features.push(source);
    }
}

fn intersect_range(target: &mut ConditionFeature, source: &ConditionFeature) {
    if let Some(bound) = &source.lower {
        match &mut target.lower {
            Some(current) if current.value == bound.value => current.inclusive &= bound.inclusive,
            Some(current) if current.value > bound.value => {}
            _ => target.lower = Some(bound.clone()),
        }
    }
    if let Some(bound) = &source.upper {
        match &mut target.upper {
            Some(current) if current.value == bound.value => current.inclusive &= bound.inclusive,
            Some(current) if current.value < bound.value => {}
            _ => target.upper = Some(bound.clone()),
        }
    }
}

pub(crate) fn merge_condition_features(
    target: &mut Vec<ConditionFeature>,
    source: &[ConditionFeature],
) {
    for source in source {
        if let Some(target) = target.iter_mut().find(|target| {
            target.domain == "media"
                && target.domain == source.domain
                && target.feature == source.feature
                && target.unit == source.unit
        }) {
            intersect_range(target, source);
        } else {
            target.push(source.clone());
        }
    }
    target.sort_by(|left, right| {
        natural_compare(&left.domain, &right.domain)
            .then_with(|| natural_compare(&left.feature, &right.feature))
            .then_with(|| natural_compare(&left.unit, &right.unit))
    });
}

/// Ordering evidence is independent of emission. Only a wholly numeric media
/// conjunction can be intersected across wrappers; container ancestry stays ordered.
pub fn condition_priority(wrappers: &[(String, String)]) -> (Vec<ConditionFeature>, Vec<String>) {
    let parsed = wrappers
        .iter()
        .map(|(_, wrapper)| native_query_features(wrapper))
        .collect::<Vec<_>>();
    let media_conjunction = wrappers
        .iter()
        .zip(&parsed)
        .all(|((kind, _), features)| kind == "media" && !features.is_empty());
    let mut features = Vec::new();
    let mut conditions = Vec::new();
    for (index, ((_, wrapper), ranges)) in wrappers.iter().zip(parsed).enumerate() {
        if ranges.is_empty() {
            conditions.push(format!(
                "{index}:{}",
                mastercss_lexer::canonical_native_content(wrapper)
            ));
        } else if media_conjunction {
            merge_condition_features(&mut features, &ranges);
        } else {
            for mut range in ranges {
                range.domain = format!("{index}:{}", range.domain);
                features.push(range);
            }
        }
    }
    (features, conditions)
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
