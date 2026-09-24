//! Historical RC query decoding, isolated from the execution engine.
//! This preserves the saved RC output, including its root-size conversion.
use serde::Deserialize;
use serde_json::{Value, json};
use std::collections::HashMap;

#[derive(Clone, Deserialize)]
struct ManifestCondition {
    id: String,
    #[serde(default)]
    nodes: Vec<Value>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Settings {
    #[serde(default = "root_size")]
    root_size: f64,
}
fn root_size() -> f64 {
    16.0
}
impl Default for Settings {
    fn default() -> Self {
        Self {
            root_size: root_size(),
        }
    }
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ManifestProjection {
    #[serde(default)]
    settings: Settings,
    #[serde(default)]
    conditions: HashMap<String, ManifestCondition>,
    #[serde(default)]
    breakpoint_conditions: HashMap<String, ManifestCondition>,
    #[serde(default)]
    container_conditions: HashMap<String, ManifestCondition>,
}

fn find_matching_parenthesis(source: &str, open: usize) -> Option<usize> {
    let mut depth = 0;
    for (index, character) in source.char_indices().skip_while(|(index, _)| *index < open) {
        if character == '(' {
            depth += 1;
        }
        if character == ')' {
            depth -= 1;
            if depth == 0 {
                return Some(index);
            }
        }
    }
    None
}

pub(super) fn decode(manifest: &Value, token: &str) -> Result<String, String> {
    let manifest: ManifestProjection =
        serde_json::from_value(manifest.clone()).map_err(|error| error.to_string())?;
    let mut parser = ConditionTokenParser::new(&manifest);
    let nodes = parser.parse(token);
    let kind = parser.id.as_deref().unwrap_or("media");
    if !matches!(kind, "media" | "supports" | "container") {
        return Ok(token.into());
    }
    let prelude = render_condition_nodes_body(kind, &nodes, None);
    let source = format!("@{kind} {prelude}{{}}");
    let sheet = lightningcss::stylesheet::StyleSheet::parse(&source, Default::default())
        .map_err(|_| format!("RC condition @{token} generated invalid CSS ({source}); correcting it would change browser behavior"))?;
    if sheet.rules.0.is_empty() {
        return Err(format!("Cannot verify RC condition @{token}"));
    }
    Ok(format!("{kind}({})", prelude.replace(' ', "|")))
}

/// Byte ranges of top-level suffix conditions, retaining quotes and escapes.
pub(super) fn suffixes(source: &str) -> Vec<(usize, usize)> {
    let mut starts = Vec::new();
    let mut depth = 0u32;
    let mut quote = None;
    let mut escaped = false;
    for (index, character) in source.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if character == '\\' {
            escaped = true;
            continue;
        }
        if let Some(current) = quote {
            if character == current {
                quote = None;
            }
            continue;
        }
        match character {
            '\'' | '"' => quote = Some(character),
            '(' | '[' | '{' => depth += 1,
            ')' | ']' | '}' => depth = depth.saturating_sub(1),
            '@' if depth == 0 => starts.push(index),
            _ => {}
        }
    }
    starts
        .iter()
        .enumerate()
        .map(|(index, start)| {
            (
                *start,
                starts.get(index + 1).copied().unwrap_or(source.len()),
            )
        })
        .collect()
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
        if character.is_ascii_alphanumeric() || matches!(character, '-' | '.' | ':' | '%' | '|') {
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

pub(crate) fn format_standard_number(value: f64) -> String {
    if value == 0.0 {
        "0".into()
    } else {
        value.to_string()
    }
}
