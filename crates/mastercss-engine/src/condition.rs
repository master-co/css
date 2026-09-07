use super::{
    ConditionFeature, EngineSettings, JS_MAX_SAFE_INTEGER, ManifestCondition, ManifestProjection,
    UtilityLayerName, Value, find_matching_parenthesis, json, natural_compare,
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
    let mut parser = ConditionTokenParser::new(manifest);
    let nodes = parser.parse(token);
    let id = parser.id.unwrap_or_else(|| "media".into());
    let body = render_condition_nodes_body(&id, &nodes, None);
    let mut features = Vec::new();
    add_condition_features(&mut features, &nodes, None);
    let wrapper = if body.is_empty() {
        format!("@{id}")
    } else {
        format!("@{id} {body}")
    };
    features.sort_by(|left, right| natural_compare(&left.0, &right.0));
    Some((id, wrapper, features))
}

struct ConditionTokenParser<'a> {
    manifest: &'a ManifestProjection,
    id: Option<String>,
    first_token: Option<String>,
}

impl<'a> ConditionTokenParser<'a> {
    fn new(manifest: &'a ManifestProjection) -> Self {
        Self {
            manifest,
            id: None,
            first_token: None,
        }
    }

    fn parse(&mut self, token: &str) -> Vec<Value> {
        let Some(open) = token.find('(') else {
            return self.resolve(token);
        };
        let Some(close) = find_matching_parenthesis(token, open) else {
            return self.resolve(token);
        };

        let mut nodes = self.parse(&token[..open]);
        let body = &token[open + 1..close];
        if !body.is_empty() {
            if self.id.as_deref() == Some("supports") {
                nodes.push(json!({
                    "type": "group",
                    "children": [{ "type": "string", "value": body.replace('|', " ") }]
                }));
            } else {
                let children = self.parse(body);
                if children.len() > 1 {
                    nodes.push(json!({ "type": "group", "children": children }));
                } else {
                    nodes.extend(children);
                }
            }
        }
        nodes.extend(self.parse(&token[close + 1..]));
        nodes
    }

    fn resolve(&mut self, token: &str) -> Vec<Value> {
        let raw_tokens = tokenize_condition(token);
        let mut nodes = Vec::new();
        for (index, raw) in raw_tokens.iter().enumerate() {
            if matches!(raw.as_str(), ">=" | "<=" | ">" | "<" | "=") {
                nodes.push(json!({ "type": "comparison", "value": raw }));
                continue;
            }
            if let Some(operator) = logical_condition_operator(raw) {
                nodes.push(json!({ "type": "logical", "value": operator }));
                continue;
            }

            let defined = self.defined_condition(raw).cloned();
            if self.id.is_none() && self.first_token.is_none() {
                self.first_token = Some(raw.clone());
                self.id =
                    if is_condition_identifier(raw) {
                        Some(raw.clone())
                    } else if let Some(condition) = &defined {
                        Some(condition.id.clone())
                    } else if is_comparable_condition_feature(raw) {
                        Some("media".into())
                    } else if raw.chars().next().is_some_and(|character| {
                        character.is_ascii_alphabetic() || character == '-'
                    }) {
                        Some("container".into())
                    } else {
                        Some("media".into())
                    };
                if is_condition_identifier(raw) {
                    continue;
                }
            }

            if let Some(condition) = &defined {
                if condition.nodes.len() == 1 {
                    add_parsed_condition_node(&mut nodes, condition.nodes[0].clone());
                } else if !condition.nodes.is_empty() {
                    add_parsed_condition_node(
                        &mut nodes,
                        json!({ "children": condition.nodes.clone() }),
                    );
                }
                continue;
            }

            let (name, value) = raw
                .split_once(':')
                .filter(|(_, value)| !value.is_empty())
                .map_or((None, raw.as_str()), |(name, value)| {
                    (Some(condition_feature_name(name)), value)
                });
            let resolved_value = condition_feature_name(value);
            let media_like = matches!(self.id.as_deref(), Some("media" | "container"));
            if media_like && name.is_none() && is_comparable_condition_feature(&resolved_value) {
                let followed_by_comparison = raw_tokens
                    .get(index + 1)
                    .is_some_and(|token| matches!(token.as_str(), ">=" | "<=" | ">" | "<" | "="));
                if followed_by_comparison {
                    add_parsed_condition_node(
                        &mut nodes,
                        json!({ "type": "string", "value": resolved_value }),
                    );
                } else {
                    add_parsed_condition_node(
                        &mut nodes,
                        json!({ "type": "boolean", "name": resolved_value }),
                    );
                }
                continue;
            }

            let mut node = if media_like {
                if let Ok(number) = value.parse::<f64>() {
                    json!({
                        "type": "number",
                        "value": number / self.manifest.settings.root_size,
                        "unit": "rem"
                    })
                } else {
                    json!({ "type": "string", "value": resolved_value })
                }
            } else {
                json!({ "type": "string", "value": resolved_value })
            };
            if let Some(name) = name {
                node.as_object_mut()
                    .expect("condition node is an object")
                    .insert("name".into(), Value::String(name));
            }
            add_parsed_condition_node(&mut nodes, node);
        }
        nodes
    }

    fn defined_condition(&self, token: &str) -> Option<&'a ManifestCondition> {
        if self.id.as_deref() == Some("container") {
            self.manifest.container_conditions.get(token).or_else(|| {
                (!self.manifest.breakpoint_conditions.contains_key(token))
                    .then(|| self.manifest.conditions.get(token))
                    .flatten()
            })
        } else {
            self.manifest.conditions.get(token)
        }
    }
}

pub(crate) fn tokenize_condition(token: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut current = String::new();
    let mut characters = token.chars().peekable();
    while let Some(character) = characters.next() {
        if character.is_ascii_alphanumeric() || matches!(character, '-' | ':' | '%' | '|') {
            current.push(character);
            continue;
        }
        if !current.is_empty() {
            tokens.push(std::mem::take(&mut current));
        }
        if matches!(character, '&' | '!' | ',' | '>' | '<' | '=') {
            let mut operator = character.to_string();
            if matches!(character, '>' | '<') && characters.peek() == Some(&'=') {
                operator.push(characters.next().expect("peeked comparison suffix"));
            }
            tokens.push(operator);
        }
    }
    if !current.is_empty() {
        tokens.push(current);
    }
    tokens
}

pub(crate) fn logical_condition_operator(token: &str) -> Option<&'static str> {
    match token {
        "&" | "and" => Some("and"),
        "!" | "not" => Some("not"),
        "," | "or" => Some("or"),
        "only" => Some("only"),
        _ => None,
    }
}

pub(crate) fn is_condition_identifier(token: &str) -> bool {
    matches!(
        token,
        "container" | "starting-style" | "supports" | "media" | "layer"
    )
}

pub(crate) fn condition_feature_name(token: &str) -> String {
    match token {
        "w" => "width".into(),
        "h" => "height".into(),
        _ => token.to_owned(),
    }
}

pub(crate) fn is_comparable_condition_feature(token: &str) -> bool {
    matches!(
        condition_feature_name(token).as_str(),
        "width" | "height" | "resolution"
    )
}

pub(crate) fn add_parsed_condition_node(nodes: &mut Vec<Value>, mut node: Value) {
    let is_unnamed_number = node.as_object().is_some_and(|object| {
        object.get("type").and_then(Value::as_str) == Some("number") && !object.contains_key("name")
    });
    if !is_unnamed_number {
        nodes.push(node);
        return;
    }

    let object = node
        .as_object_mut()
        .expect("unnamed numeric condition node is an object");
    let comparison = nodes.last().and_then(|previous| {
        (previous.get("type").and_then(Value::as_str) == Some("comparison"))
            .then(|| previous.get("value").and_then(Value::as_str))
            .flatten()
            .map(str::to_owned)
    });
    if let Some(comparison) = comparison {
        nodes.pop();
        object.insert("operator".into(), Value::String(comparison));
        let feature = nodes.last().and_then(|previous| {
            (previous.get("type").and_then(Value::as_str) == Some("string"))
                .then(|| previous.get("value").and_then(Value::as_str))
                .flatten()
                .map(condition_feature_name)
        });
        if let Some(feature) = feature {
            nodes.pop();
            object.insert("name".into(), Value::String(feature));
        } else {
            object.insert("name".into(), Value::String("width".into()));
        }
    } else {
        object.insert("name".into(), Value::String("width".into()));
        object.insert("operator".into(), Value::String(">=".into()));
    }
    nodes.push(node);
}

pub(crate) fn add_condition_features(
    features: &mut Vec<ConditionFeature>,
    nodes: &[Value],
    override_operator: Option<&str>,
) {
    add_condition_features_inner(features, nodes, override_operator, false);
    features.sort_by(|left, right| natural_compare(&left.0, &right.0));
}

pub(crate) fn add_condition_features_inner(
    features: &mut Vec<ConditionFeature>,
    nodes: &[Value],
    override_operator: Option<&str>,
    outside_not: bool,
) {
    for (index, node) in nodes.iter().enumerate() {
        let Some(object) = node.as_object() else {
            continue;
        };
        let previous_is_not = index.checked_sub(1).is_some_and(|previous| {
            nodes[previous].as_object().is_some_and(|previous| {
                previous.get("type").and_then(Value::as_str) == Some("logical")
                    && previous.get("value").and_then(Value::as_str) == Some("not")
            })
        });
        if let Some(children) = object.get("children").and_then(Value::as_array) {
            add_condition_features_inner(
                features,
                children,
                override_operator,
                outside_not || previous_is_not,
            );
            continue;
        }
        if object.get("type").and_then(Value::as_str) != Some("number") {
            continue;
        }
        let Some(value) = object.get("value").and_then(Value::as_f64) else {
            continue;
        };
        let name = object
            .get("name")
            .and_then(Value::as_str)
            .unwrap_or("width");
        let Some(mut operator) = override_operator
            .or_else(|| object.get("operator").and_then(Value::as_str))
            .or_else(|| object.get("name").is_none().then_some(">="))
        else {
            continue;
        };
        if outside_not || previous_is_not {
            operator = invert_comparison_operator(operator);
        }
        add_condition_feature(features, name, operator, value);
    }
}

pub(crate) fn invert_comparison_operator(operator: &str) -> &str {
    match operator {
        ">=" => "<",
        "<=" => ">",
        ">" => "<=",
        "<" => ">=",
        _ => operator,
    }
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
        ">" => feature.1 = value + 0.02,
        ">=" => feature.1 = value,
        "<" => feature.2 = value - 0.02,
        "<=" => feature.2 = value,
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

pub(crate) fn normalize_dynamic_value(value: &str, settings: &EngineSettings) -> String {
    if value.as_bytes().first() == Some(&b'.')
        && value.as_bytes().get(1).is_some_and(u8::is_ascii_digit)
    {
        return format!("0{value}");
    }
    if value.as_bytes().starts_with(b"-.")
        && value.as_bytes().get(2).is_some_and(u8::is_ascii_digit)
    {
        return format!("-0{}", &value[1..]);
    }
    let Some(number) = value.strip_suffix('x') else {
        return value.to_owned();
    };
    if number.is_empty()
        || !number
            .chars()
            .all(|character| character.is_ascii_digit() || matches!(character, '+' | '-' | '.'))
    {
        return value.to_owned();
    }
    number
        .parse::<f64>()
        .map(|number| {
            let value = format_standard_number(number * settings.base_unit / settings.root_size);
            format!(
                "{}rem",
                value
                    .strip_prefix("-0.")
                    .map_or(value.clone(), |fraction| { format!("-.{fraction}") })
            )
        })
        .unwrap_or_else(|_| value.to_owned())
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
    if let Some((_, current)) = wrappers.iter_mut().find(|(current_id, _)| current_id == id) {
        let prefix = format!("@{id}");
        let current_body = current.strip_prefix(&prefix).unwrap_or(current).trim();
        let next_body = wrapper.strip_prefix(&prefix).unwrap_or(&wrapper).trim();
        *current = if current_body.is_empty() {
            wrapper
        } else if next_body.is_empty() {
            current.clone()
        } else {
            format!("{prefix} {current_body} and {next_body}")
        };
    } else {
        wrappers.push((id.to_owned(), wrapper));
    }
}
