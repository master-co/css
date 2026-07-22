use mastercss_schema::{
    CssDirectiveManifestInput, CssDirectiveStyleDefinition, MANIFEST_VERSION, MasterCssManifest,
};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Number, Value, json};

use crate::CompilerError;

const BUILTIN_NAMESPACES: &[&str] = &[
    "animate",
    "breakpoint",
    "color",
    "color-line",
    "color-surface",
    "color-text",
    "container",
    "content",
    "duration",
    "easing",
    "font",
    "font-family",
    "font-feature",
    "font-size",
    "font-weight",
    "leading",
    "order",
    "radius",
    "shadow",
    "spacing",
    "tracking",
];

const NUMERIC_THEME_NAMESPACES: &[&str] =
    &["font-size", "radius", "spacing", "breakpoint", "container"];

const NATIVE_CSS_SHORTHANDS: &[&str] = &[
    "all",
    "animation",
    "animation-range",
    "background",
    "background-position",
    "background-repeat",
    "border",
    "border-block",
    "border-block-color",
    "border-block-end",
    "border-block-start",
    "border-block-style",
    "border-block-width",
    "border-bottom",
    "border-color",
    "border-image",
    "border-inline",
    "border-inline-color",
    "border-inline-end",
    "border-inline-start",
    "border-inline-style",
    "border-inline-width",
    "border-left",
    "border-radius",
    "border-right",
    "border-style",
    "border-top",
    "border-width",
    "column-rule",
    "columns",
    "contain-intrinsic-size",
    "container",
    "flex",
    "flex-flow",
    "font",
    "font-synthesis",
    "font-variant",
    "gap",
    "grid",
    "grid-area",
    "grid-column",
    "grid-row",
    "grid-template",
    "inset",
    "inset-block",
    "inset-inline",
    "line-clamp",
    "list-style",
    "margin",
    "margin-block",
    "margin-inline",
    "mask",
    "mask-border",
    "mask-position",
    "mask-repeat",
    "offset",
    "outline",
    "overflow",
    "overscroll-behavior",
    "padding",
    "padding-block",
    "padding-inline",
    "place-content",
    "place-items",
    "place-self",
    "scroll-margin",
    "scroll-margin-block",
    "scroll-margin-inline",
    "scroll-padding",
    "scroll-padding-block",
    "scroll-padding-inline",
    "scroll-timeline",
    "text-decoration",
    "text-emphasis",
    "text-wrap",
    "transition",
    "view-timeline",
    "white-space",
];

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileManifestOptions {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_manifest: Option<Value>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileManifestResult {
    pub manifest: Value,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileDefaultPresetRequest {
    pub manifest_input: CssDirectiveManifestInput,
    #[serde(default)]
    pub style_definitions: Vec<CssDirectiveStyleDefinition>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileDefaultPresetResult {
    pub manifest: Value,
    pub json: String,
}

fn manifest_error(message: impl Into<String>) -> CompilerError {
    CompilerError::Directive {
        message: message.into(),
        filename: "manifest.json".into(),
        range: None,
    }
}

fn object(value: &Value) -> Result<&Map<String, Value>, CompilerError> {
    value
        .as_object()
        .ok_or_else(|| manifest_error("CSS directive manifest definition must be an object"))
}

fn string_array(value: Option<&Value>) -> Vec<String> {
    value
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(Value::as_str)
        .map(str::to_owned)
        .collect()
}

fn push_unique(target: &mut Vec<String>, value: impl Into<String>) {
    let value = value.into();
    if !target.contains(&value) {
        target.push(value);
    }
}

fn collect_namespaces(input: &CssDirectiveManifestInput, base: Option<&Value>) -> Vec<String> {
    let mut namespaces = BUILTIN_NAMESPACES
        .iter()
        .map(|value| (*value).to_owned())
        .collect::<Vec<_>>();
    if let Some(variables) = base
        .and_then(Value::as_object)
        .and_then(|base| base.get("variables"))
        .and_then(Value::as_object)
    {
        for namespace in variables.keys() {
            if !namespace.is_empty() {
                push_unique(&mut namespaces, namespace.clone());
            }
        }
    }
    for variable in input.variables.as_deref().unwrap_or_default() {
        if let Some(namespace) = &variable.namespace {
            push_unique(&mut namespaces, namespace.clone());
        }
    }
    for utility in input.utilities.as_deref().unwrap_or_default() {
        let Some(utility) = utility.as_object() else {
            continue;
        };
        for reference in utility
            .get("dynamic")
            .and_then(Value::as_object)
            .and_then(|dynamic| dynamic.get("variableAliasRefs"))
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .filter_map(Value::as_str)
        {
            if matches!(reference.as_bytes().first(), Some(b'~' | b'=')) {
                push_unique(&mut namespaces, reference[1..].to_owned());
            }
        }
    }
    namespaces.sort_by(|left, right| right.len().cmp(&left.len()).then_with(|| left.cmp(right)));
    namespaces
}

fn resolved_variable_name(
    name: Option<&str>,
    namespace: Option<&str>,
    key: Option<&str>,
    namespaces: &[String],
) -> (String, String, Option<String>) {
    let explicit_name = name.unwrap_or_default().trim_start_matches("--");
    if namespace.is_some() || key.is_some() {
        let key = key.unwrap_or(explicit_name).to_owned();
        let name = namespace
            .map(|namespace| {
                if key.is_empty() {
                    namespace.to_owned()
                } else {
                    format!("{namespace}-{key}")
                }
            })
            .unwrap_or_else(|| key.clone());
        return (name, key, namespace.map(str::to_owned));
    }
    let namespace = namespaces
        .iter()
        .find(|namespace| explicit_name.starts_with(&format!("{namespace}-")))
        .cloned();
    let key = namespace
        .as_deref()
        .map(|namespace| explicit_name[namespace.len() + 1..].to_owned())
        .unwrap_or_else(|| explicit_name.to_owned());
    (explicit_name.to_owned(), key, namespace)
}

fn variable_dependencies(value: &str) -> Vec<String> {
    let mut dependencies = Vec::new();
    let mut remainder = value;
    while let Some(start) = remainder.find("var(--") {
        let after = &remainder[start + "var(--".len()..];
        let end = after
            .find(|character: char| {
                !(character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
            })
            .unwrap_or(after.len());
        if end > 0 {
            push_unique(&mut dependencies, after[..end].to_owned());
        }
        remainder = &after[end..];
    }
    dependencies
}

fn normalize_variable_value(value: &Value) -> Result<(Value, Vec<String>), CompilerError> {
    let Value::String(value) = value else {
        return Ok((value.clone(), Vec::new()));
    };
    if let Some(start) = value.find('$') {
        let alias = value[start + 1..]
            .split(|character: char| {
                !(character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
            })
            .next()
            .unwrap_or_default();
        if !alias.is_empty() {
            return Err(manifest_error(format!(
                "Stylesheet values use native CSS variable references. Replace \"${alias}\" with \"var(--{alias})\"."
            )));
        }
    }
    Ok((
        Value::String(value.replace('|', " ")),
        variable_dependencies(value),
    ))
}

fn parse_numeric_value(value: &Value, namespace: Option<&str>) -> Option<(f64, Option<String>)> {
    if !namespace.is_some_and(|namespace| NUMERIC_THEME_NAMESPACES.contains(&namespace)) {
        return None;
    }
    if let Some(number) = value.as_f64() {
        return Some((number, None));
    }
    let source = value.as_str()?.trim();
    let (number, unit) = if let Some(number) = source.strip_suffix("rem") {
        (number, Some("rem"))
    } else if let Some(number) = source.strip_suffix("px") {
        (number, Some("px"))
    } else {
        (source, None)
    };
    let number = number.parse::<f64>().ok()?;
    Some((number, unit.map(str::to_owned)))
}

fn number_value(value: f64) -> Value {
    let value = if value == 0.0 { 0.0 } else { value };
    if value.fract() == 0.0 && value >= i64::MIN as f64 && value <= i64::MAX as f64 {
        return Value::Number((value as i64).into());
    }
    Number::from_f64(value)
        .map(Value::Number)
        .unwrap_or(Value::Null)
}

fn variable_slot(variable: &Map<String, Value>) -> String {
    variable
        .get("name")
        .and_then(Value::as_str)
        .map(str::to_owned)
        .unwrap_or_else(|| {
            format!(
                "{}\0{}",
                variable
                    .get("namespace")
                    .and_then(Value::as_str)
                    .unwrap_or_default(),
                variable
                    .get("key")
                    .and_then(Value::as_str)
                    .unwrap_or_default()
            )
        })
}

fn push_variable(target: &mut Vec<Map<String, Value>>, variable: Map<String, Value>) {
    let slot = variable_slot(&variable);
    if let Some(existing) = target
        .iter_mut()
        .find(|existing| variable_slot(existing) == slot)
    {
        existing.extend(variable);
    } else {
        target.push(variable);
    }
}

fn compile_variables(
    input: &CssDirectiveManifestInput,
    base: Option<&Value>,
) -> Result<Vec<Map<String, Value>>, CompilerError> {
    let namespaces = collect_namespaces(input, base);
    let mut variables = Vec::<Map<String, Value>>::new();
    for definition in input.variables.as_deref().unwrap_or_default() {
        let (name, key, namespace) = resolved_variable_name(
            definition.name.as_deref(),
            definition.namespace.as_deref(),
            definition.key.as_deref(),
            &namespaces,
        );
        if name.is_empty() {
            continue;
        }
        let (value, dependencies) = normalize_variable_value(&definition.value)?;
        let numeric = parse_numeric_value(&value, namespace.as_deref());
        let variable_type = if numeric.is_some() || value.is_number() {
            "number"
        } else {
            "string"
        };
        if let Some(mode) = &definition.mode {
            let index = variables
                .iter()
                .position(|variable| variable.get("name").and_then(Value::as_str) == Some(&name));
            let target = if let Some(index) = index {
                &mut variables[index]
            } else {
                let mut variable = Map::new();
                variable.insert("name".into(), Value::String(name.clone()));
                variable.insert("key".into(), Value::String(key.clone()));
                if let Some(namespace) = &namespace {
                    variable.insert("namespace".into(), Value::String(namespace.clone()));
                }
                variable.insert("type".into(), Value::String(variable_type.into()));
                variable.insert("modes".into(), Value::Object(Map::new()));
                if definition.r#static == Some(true) {
                    variable.insert("static".into(), Value::Bool(true));
                }
                variables.push(variable);
                variables.last_mut().expect("variable was inserted")
            };
            if definition.r#static == Some(true) {
                target.insert("static".into(), Value::Bool(true));
            }
            let mut mode_value = Map::new();
            mode_value.insert("type".into(), Value::String(variable_type.into()));
            mode_value.insert("value".into(), value);
            if let Some((number, unit)) = numeric {
                let mut numeric = Map::new();
                numeric.insert("value".into(), number_value(number));
                if let Some(unit) = unit {
                    numeric.insert("unit".into(), Value::String(unit));
                }
                mode_value.insert("numeric".into(), Value::Object(numeric));
            }
            target
                .entry("modes")
                .or_insert_with(|| Value::Object(Map::new()))
                .as_object_mut()
                .expect("modes are an object")
                .insert(mode.clone(), Value::Object(mode_value));
            if !dependencies.is_empty() {
                let mut merged = string_array(target.get("dependencies"));
                for dependency in dependencies {
                    push_unique(&mut merged, dependency);
                }
                target.insert(
                    "dependencies".into(),
                    Value::Array(merged.into_iter().map(Value::String).collect()),
                );
            }
            continue;
        }

        let mut variable = Map::new();
        variable.insert("name".into(), Value::String(name));
        variable.insert("key".into(), Value::String(key));
        if let Some(namespace) = namespace {
            variable.insert("namespace".into(), Value::String(namespace));
        }
        variable.insert("type".into(), Value::String(variable_type.into()));
        variable.insert("value".into(), value);
        if let Some((number, unit)) = numeric {
            let mut numeric = Map::new();
            numeric.insert("value".into(), number_value(number));
            if let Some(unit) = unit {
                numeric.insert("unit".into(), Value::String(unit));
            }
            variable.insert("numeric".into(), Value::Object(numeric));
        }
        if !dependencies.is_empty() {
            variable.insert(
                "dependencies".into(),
                Value::Array(dependencies.into_iter().map(Value::String).collect()),
            );
        }
        if definition.inline == Some(true) {
            variable.insert("inline".into(), Value::Bool(true));
        }
        if definition.r#static == Some(true) {
            variable.insert("static".into(), Value::Bool(true));
        }
        push_variable(&mut variables, variable);
    }
    Ok(variables)
}

fn group_variables(variables: Vec<Map<String, Value>>) -> Option<Value> {
    if variables.is_empty() {
        return None;
    }
    let mut grouped = Map::new();
    for mut variable in variables {
        let namespace = variable
            .shift_remove("namespace")
            .and_then(|value| value.as_str().map(str::to_owned))
            .unwrap_or_default();
        grouped
            .entry(namespace)
            .or_insert_with(|| Value::Array(Vec::new()))
            .as_array_mut()
            .expect("variable group is an array")
            .push(Value::Object(variable));
    }
    Some(Value::Object(grouped))
}

fn condition_for_variable(
    variable: &Map<String, Value>,
    id: &str,
    root_size: f64,
) -> Option<Value> {
    let key = variable.get("key")?.as_str()?;
    if key.starts_with('-') {
        return None;
    }
    let numeric = variable.get("numeric").and_then(Value::as_object);
    let mut value = numeric
        .and_then(|numeric| numeric.get("value"))
        .and_then(Value::as_f64)
        .or_else(|| variable.get("value").and_then(Value::as_f64))?;
    let unit = numeric
        .and_then(|numeric| numeric.get("unit"))
        .and_then(Value::as_str);
    match unit {
        None | Some("") | Some("px") => value /= root_size,
        Some("rem") => {}
        Some(_) => return None,
    }
    Some(json!({
        "id": id,
        "nodes": [{ "type": "number", "value": number_value(value), "unit": "rem" }]
    }))
}

fn compile_variable_conditions(
    variables: &[Map<String, Value>],
    root_size: f64,
) -> (Map<String, Value>, Map<String, Value>, Map<String, Value>) {
    let mut conditions = Map::new();
    let mut breakpoint_conditions = Map::new();
    let mut container_conditions = Map::new();
    for variable in variables {
        let namespace = variable.get("namespace").and_then(Value::as_str);
        let key = variable
            .get("key")
            .and_then(Value::as_str)
            .unwrap_or_default();
        if namespace == Some("breakpoint") {
            if let Some(condition) = condition_for_variable(variable, "media", root_size) {
                conditions.insert(key.into(), condition.clone());
                breakpoint_conditions.insert(key.into(), condition);
            }
        } else if namespace == Some("container")
            && let Some(condition) = condition_for_variable(variable, "container", root_size)
        {
            container_conditions.insert(key.into(), condition);
        }
    }
    (conditions, breakpoint_conditions, container_conditions)
}

fn compile_condition(source: &str) -> Value {
    let source = source.trim();
    let (id, body) = source
        .strip_prefix('@')
        .and_then(|source| source.split_once(char::is_whitespace))
        .map(|(id, body)| (id, body.trim()))
        .unwrap_or_else(|| (source.trim_start_matches('@'), ""));
    let mut nodes = Vec::new();
    if !body.is_empty() {
        let value = body.trim();
        if value.starts_with('(') && value.ends_with(')') {
            let inner = value[1..value.len() - 1].trim();
            if let Some((name, value)) = inner.split_once(':') {
                nodes.push(json!({
                    "type": "string",
                    "name": name.trim(),
                    "value": value.trim()
                }));
            } else {
                nodes.push(json!({ "type": "boolean", "name": inner }));
            }
        } else {
            nodes.push(json!({ "type": "string", "value": value }));
        }
    }
    json!({ "id": id, "nodes": nodes })
}

fn compile_selector(source: &str) -> Vec<Value> {
    let source = source.replace('&', "");
    let bytes = source.as_bytes();
    let mut nodes = Vec::new();
    let mut index = 0;
    while index < bytes.len() {
        match bytes[index] {
            b',' => {
                nodes.push(json!({ "value": ",", "type": "separator" }));
                index += 1;
            }
            b':' => {
                let pseudo_element = bytes.get(index + 1) == Some(&b':');
                index += if pseudo_element { 2 } else { 1 };
                let start = index;
                while bytes
                    .get(index)
                    .is_some_and(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_'))
                {
                    index += 1;
                }
                if index > start {
                    nodes.push(json!({
                        "value": &source[start..index],
                        "type": if pseudo_element { "pseudo-element" } else { "pseudo-class" }
                    }));
                }
            }
            b'.' | b'#' => {
                let node_type = if bytes[index] == b'.' { "class" } else { "id" };
                index += 1;
                let start = index;
                while bytes
                    .get(index)
                    .is_some_and(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_'))
                {
                    index += 1;
                }
                if index > start {
                    nodes.push(json!({ "value": &source[start..index], "type": node_type }));
                }
            }
            b'>' | b'+' | b'~' => {
                nodes.push(json!({
                    "value": String::from_utf8_lossy(&bytes[index..index + 1]),
                    "type": "combinator"
                }));
                index += 1;
            }
            byte if byte.is_ascii_whitespace() => {
                while bytes.get(index).is_some_and(u8::is_ascii_whitespace) {
                    index += 1;
                }
                nodes.push(json!({ "value": " ", "type": "combinator" }));
            }
            _ => index += 1,
        }
    }
    nodes
}

type CompiledVariants = (Option<Value>, Map<String, Value>, Map<String, Value>);

fn compile_variants(input: Option<&Vec<Value>>) -> Result<CompiledVariants, CompilerError> {
    let Some(input) = input.filter(|input| !input.is_empty()) else {
        return Ok((None, Map::new(), Map::new()));
    };
    let mut variants = Vec::new();
    let mut selectors = Map::new();
    let mut conditions = Map::new();
    for variant in input {
        let variant = object(variant)?;
        let token = variant
            .get("token")
            .and_then(Value::as_str)
            .ok_or_else(|| manifest_error("CSS directive variant requires a token"))?;
        let mut compiled_branches = Vec::new();
        for branch in variant
            .get("branches")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
        {
            let mut branch = object(branch)?.clone();
            if let Some(selector) = branch.get("selector").and_then(Value::as_str) {
                let bodyless = selector.replace('&', "");
                let nodes = compile_selector(&bodyless);
                if !nodes.is_empty() {
                    branch.insert("selectorNodes".into(), Value::Array(nodes));
                }
            }
            let raw_conditions = string_array(branch.get("conditions"));
            if !raw_conditions.is_empty() {
                branch.insert(
                    "conditions".into(),
                    Value::Array(raw_conditions.iter().cloned().map(Value::String).collect()),
                );
                branch.insert(
                    "conditionNodes".into(),
                    Value::Array(
                        raw_conditions
                            .iter()
                            .map(|condition| compile_condition(condition))
                            .collect(),
                    ),
                );
            }
            compiled_branches.push(Value::Object(branch));
        }
        if token.starts_with(':')
            && let Some(nodes) = compiled_branches.iter().find_map(|branch| {
                branch
                    .get("selectorNodes")
                    .and_then(Value::as_array)
                    .filter(|nodes| !nodes.is_empty())
            })
        {
            selectors.insert(token.into(), Value::Array(nodes.clone()));
        }
        if let Some(name) = token.strip_prefix('@') {
            if let Some(condition) = compiled_branches.iter().find_map(|branch| {
                branch
                    .get("conditionNodes")
                    .and_then(Value::as_array)
                    .and_then(|nodes| nodes.first())
            }) {
                conditions.insert(name.into(), condition.clone());
            } else if let Some(layer) = compiled_branches
                .iter()
                .find_map(|branch| branch.get("layer").and_then(Value::as_str))
            {
                conditions.insert(
                    name.into(),
                    json!({ "id": "layer", "nodes": [{ "type": "string", "value": layer }] }),
                );
            }
        }
        variants.push(json!({ "token": token, "branches": compiled_branches }));
    }
    Ok((Some(Value::Array(variants)), selectors, conditions))
}

fn value_placeholder_parts(value: &str) -> Result<Value, CompilerError> {
    if !value.contains("--value") {
        return Ok(Value::String(value.into()));
    }
    if value == "--value()" {
        return Ok(Value::Null);
    }
    let mut parts = Vec::new();
    let mut remainder = value;
    while let Some(index) = remainder.find("--value") {
        if !remainder[index..].starts_with("--value()") {
            return Err(manifest_error("--value() must be called as --value()"));
        }
        if index > 0 {
            parts.push(Value::String(remainder[..index].into()));
        }
        parts.push(Value::Null);
        remainder = &remainder[index + "--value()".len()..];
    }
    if !remainder.is_empty() {
        parts.push(Value::String(remainder.into()));
    }
    Ok(Value::Array(parts))
}

fn compile_declarations(
    declarations: &Map<String, Value>,
    pattern: bool,
) -> Result<Map<String, Value>, CompilerError> {
    let mut compiled = Map::new();
    for (property, value) in declarations {
        let value = value
            .as_str()
            .ok_or_else(|| manifest_error("Managed utility declaration values must be strings"))?;
        if pattern {
            compiled.insert(property.clone(), value_placeholder_parts(value)?);
        } else {
            if value.contains("--value") {
                return Err(manifest_error(
                    "--value() is only supported inside managed pattern declarations",
                ));
            }
            compiled.insert(property.clone(), Value::String(value.into()));
        }
    }
    Ok(compiled)
}

fn compile_utility_rule(rule: &Value, pattern: bool) -> Result<Value, CompilerError> {
    let rule = object(rule)?;
    let declarations = rule
        .get("declarations")
        .and_then(Value::as_object)
        .ok_or_else(|| manifest_error("Managed utility rule requires declarations"))?;
    let mut compiled = Map::new();
    compiled.insert(
        "declarations".into(),
        Value::Object(compile_declarations(declarations, pattern)?),
    );
    let conditions = string_array(rule.get("conditions"));
    if !conditions.is_empty() {
        compiled.insert(
            "conditions".into(),
            Value::Array(conditions.into_iter().map(Value::String).collect()),
        );
    }
    if let Some(selector) = rule
        .get("selector")
        .and_then(Value::as_str)
        .filter(|selector| *selector != "&")
    {
        compiled.insert("selector".into(), Value::String(selector.into()));
    }
    Ok(Value::Object(compiled))
}

fn utility_rules(
    definition: &Map<String, Value>,
    pattern: bool,
) -> Result<Vec<Value>, CompilerError> {
    let mut rules = Vec::new();
    if let Some(declarations) = definition.get("declarations").and_then(Value::as_object) {
        let mut rule = Map::new();
        rule.insert(
            "declarations".into(),
            Value::Object(compile_declarations(declarations, pattern)?),
        );
        let conditions = string_array(definition.get("conditions"));
        if !conditions.is_empty() {
            rule.insert(
                "conditions".into(),
                Value::Array(conditions.into_iter().map(Value::String).collect()),
            );
        }
        rules.push(Value::Object(rule));
    }
    for rule in definition
        .get("rules")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
    {
        rules.push(compile_utility_rule(rule, pattern)?);
    }
    Ok(rules)
}

fn placeholder_property_count(rules: &[Value]) -> usize {
    rules
        .iter()
        .filter_map(|rule| rule.get("declarations").and_then(Value::as_object))
        .flat_map(Map::iter)
        .filter(|(_, value)| {
            value.is_null()
                || value
                    .as_array()
                    .is_some_and(|parts| parts.contains(&Value::Null))
        })
        .count()
}

fn utility_type_from_rules(rules: &[Value]) -> i64 {
    let shorthand = rules
        .iter()
        .filter_map(|rule| rule.get("declarations").and_then(Value::as_object))
        .flat_map(Map::keys)
        .any(|property| NATIVE_CSS_SHORTHANDS.contains(&property.as_str()));
    if shorthand || placeholder_property_count(rules) > 1 {
        -1
    } else {
        0
    }
}

fn compile_utility(definition: &Value, order: usize) -> Result<Value, CompilerError> {
    let definition = object(definition)?;
    let source_name = definition
        .get("name")
        .and_then(Value::as_str)
        .ok_or_else(|| manifest_error("Managed utility definition requires a name"))?;
    let definition_type = definition
        .get("type")
        .and_then(Value::as_str)
        .unwrap_or("static");
    let layer = definition
        .get("layer")
        .and_then(Value::as_str)
        .unwrap_or("utilities");
    if definition_type == "pattern" {
        let pattern = definition
            .get("pattern")
            .and_then(Value::as_object)
            .ok_or_else(|| {
                manifest_error("Managed enum pattern definition is missing a pattern")
            })?;
        let rules = utility_rules(definition, true)?;
        let mut matcher = Map::new();
        matcher.insert("type".into(), Value::String("pattern".into()));
        matcher.insert(
            "prefix".into(),
            pattern
                .get("prefix")
                .cloned()
                .unwrap_or(Value::String(String::new())),
        );
        matcher.insert(
            "values".into(),
            pattern
                .get("values")
                .cloned()
                .unwrap_or(Value::Array(Vec::new())),
        );
        if let Some(value_map) = pattern.get("valueMap") {
            matcher.insert("valueMap".into(), value_map.clone());
        }
        return Ok(json!({
            "id": source_name,
            "name": source_name,
            "type": -2,
            "order": order,
            "layer": layer,
            "emit": { "type": "static", "rules": rules },
            "matchers": [Value::Object(matcher)]
        }));
    }
    if definition_type == "dynamic" {
        let dynamic = definition
            .get("dynamic")
            .and_then(Value::as_object)
            .ok_or_else(|| {
                manifest_error("Managed dynamic utility definition is missing a dynamic source")
            })?;
        let key = dynamic
            .get("key")
            .and_then(Value::as_str)
            .ok_or_else(|| manifest_error("Managed dynamic utility requires a key"))?;
        let rules = utility_rules(definition, true)?;
        let references = string_array(dynamic.get("variableAliasRefs"));
        let values = string_array(dynamic.get("values"));
        let kind = dynamic.get("kind").and_then(Value::as_str);
        let arbitrary = dynamic.get("arbitrary").and_then(Value::as_bool) == Some(true);
        let mut matchers = Vec::new();
        if !references.is_empty() {
            matchers.push(json!({ "type": "variable", "keys": [key] }));
        }
        if kind.is_some() {
            matchers.push(json!({ "type": "value", "keys": [key] }));
        }
        if arbitrary {
            matchers.push(json!({ "type": "key", "keys": [key] }));
        }
        if !values.is_empty() {
            matchers.push(json!({
                "type": "pattern",
                "prefix": format!("{key}:"),
                "values": values
            }));
        }
        if matchers.is_empty() {
            return Err(manifest_error(
                "Managed dynamic utility definition must include at least one value source",
            ));
        }
        let mut utility = Map::new();
        utility.insert("id".into(), Value::String(source_name.into()));
        utility.insert("name".into(), Value::String(source_name.into()));
        utility.insert(
            "type".into(),
            Value::Number(utility_type_from_rules(&rules).into()),
        );
        utility.insert("order".into(), Value::Number(order.into()));
        utility.insert("layer".into(), Value::String(layer.into()));
        if let Some(kind) = kind {
            utility.insert("kind".into(), Value::String(kind.into()));
        }
        if !references.is_empty() {
            utility.insert(
                "variableAliasRefs".into(),
                Value::Array(references.into_iter().map(Value::String).collect()),
            );
        }
        utility.insert("emit".into(), json!({ "type": "static", "rules": rules }));
        utility.insert("matchers".into(), Value::Array(matchers));
        return Ok(Value::Object(utility));
    }

    let name = source_name.strip_prefix('.').unwrap_or(source_name);
    let rules = utility_rules(definition, false)?;
    Ok(json!({
        "id": format!(".{name}"),
        "name": name,
        "type": -2,
        "order": order,
        "layer": layer,
        "emit": { "type": "static", "rules": rules },
        "matchers": [{ "type": "static", "name": name }]
    }))
}

fn compile_utilities(input: Option<&Vec<Value>>) -> Result<Option<Value>, CompilerError> {
    let Some(input) = input.filter(|input| !input.is_empty()) else {
        return Ok(None);
    };
    Ok(Some(Value::Array(
        input
            .iter()
            .enumerate()
            .map(|(order, definition)| compile_utility(definition, order))
            .collect::<Result<_, _>>()?,
    )))
}

fn merge_array_by(
    base: Option<&Value>,
    next: Option<&Value>,
    key: impl Fn(&Value) -> Option<String>,
) -> Option<Value> {
    let mut merged = base.and_then(Value::as_array).cloned().unwrap_or_default();
    for value in next.and_then(Value::as_array).into_iter().flatten() {
        let value_key = key(value);
        if let Some(index) = value_key.as_ref().and_then(|value_key| {
            merged
                .iter()
                .position(|existing| key(existing).as_ref() == Some(value_key))
        }) {
            merged[index] = value.clone();
        } else {
            merged.push(value.clone());
        }
    }
    (!merged.is_empty()).then_some(Value::Array(merged))
}

fn merge_records(base: Option<&Value>, next: Option<&Value>) -> Option<Value> {
    let mut merged = base.and_then(Value::as_object).cloned().unwrap_or_default();
    if let Some(next) = next.and_then(Value::as_object) {
        merged.extend(next.clone());
    }
    (!merged.is_empty()).then_some(Value::Object(merged))
}

fn flatten_variables(value: Option<&Value>) -> Vec<Value> {
    let mut flattened = Vec::new();
    for (namespace, definitions) in value
        .and_then(Value::as_object)
        .into_iter()
        .flat_map(Map::iter)
    {
        for definition in definitions.as_array().into_iter().flatten() {
            let Some(mut definition) = definition.as_object().cloned() else {
                continue;
            };
            let key = definition
                .get("key")
                .and_then(Value::as_str)
                .unwrap_or_default();
            let name = definition
                .get("name")
                .and_then(Value::as_str)
                .map(str::to_owned)
                .unwrap_or_else(|| {
                    if namespace.is_empty() {
                        key.into()
                    } else if key.is_empty() {
                        namespace.into()
                    } else {
                        format!("{namespace}-{key}")
                    }
                });
            definition.insert("name".into(), Value::String(name));
            if !namespace.is_empty() {
                definition.insert("namespace".into(), Value::String(namespace.clone()));
            }
            if !definition.contains_key("type") {
                definition.insert(
                    "type".into(),
                    Value::String(
                        if definition.get("value").is_some_and(Value::is_number) {
                            "number"
                        } else {
                            "string"
                        }
                        .into(),
                    ),
                );
            }
            flattened.push(Value::Object(definition));
        }
    }
    flattened
}

fn merge_variables(base: Option<&Value>, next: Option<&Value>) -> Option<Value> {
    let base = Value::Array(flatten_variables(base));
    let next = Value::Array(flatten_variables(next));
    let merged = merge_array_by(Some(&base), Some(&next), |variable| {
        variable
            .get("name")
            .and_then(Value::as_str)
            .map(str::to_owned)
    })?;
    group_variables(
        merged
            .as_array()
            .into_iter()
            .flatten()
            .filter_map(Value::as_object)
            .cloned()
            .collect(),
    )
}

fn merge_manifest(base: Option<&Value>, fragment: &Value) -> Value {
    let Some(base) = base.and_then(Value::as_object) else {
        return fragment.clone();
    };
    let fragment = fragment
        .as_object()
        .expect("manifest fragment is an object");
    let mut manifest = Map::new();
    manifest.insert("version".into(), Value::Number(MANIFEST_VERSION.into()));
    let settings = merge_records(base.get("settings"), fragment.get("settings"));
    let variables = merge_variables(base.get("variables"), fragment.get("variables"));
    let animations = merge_records(base.get("animations"), fragment.get("animations"));
    let animation_options = merge_records(
        base.get("animationOptions"),
        fragment.get("animationOptions"),
    );
    let variants = merge_array_by(base.get("variants"), fragment.get("variants"), |variant| {
        variant
            .get("token")
            .and_then(Value::as_str)
            .map(str::to_owned)
    });
    let utilities = merge_array_by(
        base.get("utilities"),
        fragment.get("utilities"),
        |utility| {
            let id = utility.get("id").and_then(Value::as_str)?;
            let layer = utility
                .get("layer")
                .and_then(Value::as_str)
                .unwrap_or_default();
            Some(format!("{id}\0{layer}"))
        },
    );
    for (key, value) in [
        ("settings", settings),
        ("variables", variables),
        ("animations", animations),
        ("animationOptions", animation_options),
        ("variants", variants),
        (
            "conditions",
            merge_records(base.get("conditions"), fragment.get("conditions")),
        ),
        (
            "breakpointConditions",
            merge_records(
                base.get("breakpointConditions"),
                fragment.get("breakpointConditions"),
            ),
        ),
        (
            "containerConditions",
            merge_records(
                base.get("containerConditions"),
                fragment.get("containerConditions"),
            ),
        ),
        (
            "selectors",
            merge_records(base.get("selectors"), fragment.get("selectors")),
        ),
        ("utilities", utilities),
        (
            "debug",
            merge_records(base.get("debug"), fragment.get("debug")),
        ),
    ] {
        if let Some(value) = value {
            manifest.insert(key.into(), value);
        }
    }
    Value::Object(manifest)
}

pub fn compile_manifest_input(
    input: &CssDirectiveManifestInput,
    options: &CompileManifestOptions,
) -> Result<CompileManifestResult, CompilerError> {
    if let Some(base_manifest) = &options.base_manifest {
        MasterCssManifest::new(base_manifest.clone())
            .map_err(|error| manifest_error(error.to_string()))?;
    }
    let root_size = input
        .root_size
        .or_else(|| {
            options
                .base_manifest
                .as_ref()
                .and_then(|base| base.get("settings"))
                .and_then(|settings| settings.get("rootSize"))
                .and_then(Value::as_f64)
        })
        .unwrap_or(16.0);
    let variables = compile_variables(input, options.base_manifest.as_ref())?;
    let (mut conditions, breakpoint_conditions, container_conditions) =
        compile_variable_conditions(&variables, root_size);
    let grouped_variables = group_variables(variables);
    let mut settings = Map::new();
    for (key, value) in [
        ("rootSize", input.root_size.map(number_value)),
        ("baseUnit", input.base_unit.map(number_value)),
        ("defaultMode", input.default_mode.clone().map(Value::String)),
        ("scope", input.scope.clone().map(Value::String)),
        ("important", input.important.map(Value::Bool)),
        ("modeTrigger", input.mode_trigger.clone().map(Value::String)),
        (
            "modes",
            input
                .modes
                .clone()
                .filter(|modes| !modes.is_empty())
                .map(|modes| Value::Array(modes.into_iter().map(Value::String).collect())),
        ),
    ] {
        if let Some(value) = value {
            settings.insert(key.into(), value);
        }
    }
    let (variants, selectors, variant_conditions) = compile_variants(input.variants.as_ref())?;
    conditions.extend(variant_conditions);
    let utilities = compile_utilities(input.utilities.as_ref())?;
    let mut fragment = Map::new();
    fragment.insert("version".into(), Value::Number(MANIFEST_VERSION.into()));
    if !settings.is_empty() {
        fragment.insert("settings".into(), Value::Object(settings));
    }
    if let Some(variables) = grouped_variables {
        fragment.insert("variables".into(), variables);
    }
    if let Some(animations) = &input.animations {
        fragment.insert("animations".into(), Value::Object(animations.clone()));
    }
    if let Some(animation_options) = &input.animation_options {
        fragment.insert(
            "animationOptions".into(),
            Value::Object(animation_options.clone()),
        );
    }
    if let Some(variants) = variants {
        fragment.insert("variants".into(), variants);
    }
    if !conditions.is_empty() {
        fragment.insert("conditions".into(), Value::Object(conditions));
    }
    if !breakpoint_conditions.is_empty() {
        fragment.insert(
            "breakpointConditions".into(),
            Value::Object(breakpoint_conditions),
        );
    }
    if !container_conditions.is_empty() {
        fragment.insert(
            "containerConditions".into(),
            Value::Object(container_conditions),
        );
    }
    if !selectors.is_empty() {
        fragment.insert("selectors".into(), Value::Object(selectors));
    }
    if let Some(utilities) = utilities {
        fragment.insert("utilities".into(), utilities);
    }
    let manifest = merge_manifest(options.base_manifest.as_ref(), &Value::Object(fragment));
    MasterCssManifest::new(manifest.clone()).map_err(|error| manifest_error(error.to_string()))?;
    Ok(CompileManifestResult { manifest })
}

pub fn normalize_manifest_for_json(manifest: &Value) -> Result<Value, CompilerError> {
    let mut manifest = object(manifest)?.clone();
    if let Some(variables) = manifest.get("variables").and_then(Value::as_object) {
        let mut normalized_groups = Map::new();
        for (namespace, definitions) in variables {
            let mut normalized = Vec::new();
            for definition in definitions.as_array().into_iter().flatten() {
                let mut definition = object(definition)?.clone();
                let key = definition
                    .get("key")
                    .and_then(Value::as_str)
                    .unwrap_or_default();
                let expected_name = if namespace.is_empty() {
                    key.to_owned()
                } else if key.is_empty() {
                    namespace.clone()
                } else {
                    format!("{namespace}-{key}")
                };
                if definition.get("name").and_then(Value::as_str) == Some(&expected_name) {
                    definition.shift_remove("name");
                }
                if definition.get("type").and_then(Value::as_str) == Some("string") {
                    definition.shift_remove("type");
                }
                definition.shift_remove("namespace");
                normalized.push(Value::Object(definition));
            }
            if !normalized.is_empty() {
                normalized_groups.insert(namespace.clone(), Value::Array(normalized));
            }
        }
        manifest.insert("variables".into(), Value::Object(normalized_groups));
    }
    if let Some(utilities) = manifest.get("utilities").and_then(Value::as_array) {
        let mut normalized = Vec::new();
        for utility in utilities {
            let mut utility = object(utility)?.clone();
            if utility.get("name") == utility.get("id") {
                utility.shift_remove("name");
            }
            if utility.get("layer").and_then(Value::as_str) == Some("utilities") {
                utility.shift_remove("layer");
            }
            utility.shift_remove("order");
            normalized.push(Value::Object(utility));
        }
        manifest.insert("utilities".into(), Value::Array(normalized));
    }
    Ok(Value::Object(manifest))
}

fn is_default_setting(key: &str, value: &Value) -> bool {
    match key {
        "rootSize" => value.as_f64() == Some(16.0),
        "baseUnit" => value.as_f64() == Some(4.0),
        "defaultMode" => value.as_str() == Some("light"),
        "important" => value.as_bool() == Some(false),
        "modeTrigger" => value.as_str() == Some("media"),
        "modes" => value.as_array().is_some_and(|modes| {
            modes.len() == 2
                && modes[0].as_str() == Some("light")
                && modes[1].as_str() == Some("dark")
        }),
        _ => false,
    }
}

/// Produces the public default-preset artifact shape. Engine registry data and
/// settings that equal the engine defaults are intentionally excluded.
pub fn normalize_default_manifest_for_json(manifest: &Value) -> Result<Value, CompilerError> {
    let manifest = object(manifest)?;
    let mut preset = Map::new();
    preset.insert("version".into(), Value::Number(MANIFEST_VERSION.into()));
    if let Some(settings) = manifest.get("settings").and_then(Value::as_object) {
        let settings = settings
            .iter()
            .filter(|(key, value)| !is_default_setting(key, value))
            .map(|(key, value)| (key.clone(), value.clone()))
            .collect::<Map<_, _>>();
        if !settings.is_empty() {
            preset.insert("settings".into(), Value::Object(settings));
        }
    }
    for key in [
        "variables",
        "animations",
        "variants",
        "conditions",
        "breakpointConditions",
        "containerConditions",
        "selectors",
        "utilities",
    ] {
        if let Some(value) = manifest.get(key) {
            preset.insert(key.into(), value.clone());
        }
    }
    normalize_manifest_for_json(&Value::Object(preset))
}

fn append_default_preset_styles(
    input: &mut CssDirectiveManifestInput,
    definitions: &[CssDirectiveStyleDefinition],
) -> Result<(), CompilerError> {
    let utilities = input.utilities.get_or_insert_default();
    for definition in definitions {
        let CssDirectiveStyleDefinition::Native {
            selector,
            declarations,
            conditions,
            condition_path,
            layer,
            name,
            ..
        } = definition
        else {
            return Err(manifest_error(
                "Default preset generation cannot contain @compose definitions",
            ));
        };
        let name = name.as_deref().ok_or_else(|| {
            manifest_error("Default preset managed style definition requires a name")
        })?;
        if condition_path.as_ref().is_some_and(|path| {
            path.iter().any(|entry| {
                matches!(
                    entry,
                    mastercss_schema::CssDirectiveConditionPathEntry::Variant { .. }
                )
            })
        }) {
            return Err(manifest_error(
                "Default preset managed style definitions cannot depend on named variants",
            ));
        }
        let layer = layer
            .map(|layer| serde_json::to_value(layer).expect("utility layer serializes"))
            .unwrap_or_else(|| Value::String("utilities".into()));
        let layer_name = layer.as_str().unwrap_or("utilities");
        let existing = utilities.iter_mut().find(|utility| {
            utility.get("name").and_then(Value::as_str) == Some(name)
                && utility
                    .get("layer")
                    .and_then(Value::as_str)
                    .unwrap_or("utilities")
                    == layer_name
                && utility
                    .get("type")
                    .and_then(Value::as_str)
                    .unwrap_or("static")
                    == "static"
        });
        let utility = if let Some(existing) = existing {
            existing
                .as_object_mut()
                .expect("managed utility definitions are objects")
        } else {
            utilities.push(json!({ "name": name, "type": "static", "layer": layer }));
            utilities
                .last_mut()
                .and_then(Value::as_object_mut)
                .expect("managed utility definition was inserted")
        };
        let can_inline = selector == "&"
            && conditions.as_ref().is_none_or(Vec::is_empty)
            && !utility.contains_key("declarations")
            && !utility.contains_key("rules");
        if can_inline {
            utility.insert("declarations".into(), Value::Object(declarations.clone()));
            continue;
        }
        if let Some(previous) = utility.shift_remove("declarations") {
            utility
                .entry("rules")
                .or_insert_with(|| Value::Array(Vec::new()))
                .as_array_mut()
                .expect("managed utility rules are an array")
                .push(json!({ "declarations": previous }));
        }
        let mut rule = Map::new();
        rule.insert("declarations".into(), Value::Object(declarations.clone()));
        if selector != "&" {
            rule.insert("selector".into(), Value::String(selector.clone()));
        }
        if let Some(conditions) = conditions
            .as_ref()
            .filter(|conditions| !conditions.is_empty())
        {
            rule.insert(
                "conditions".into(),
                Value::Array(conditions.iter().cloned().map(Value::String).collect()),
            );
        }
        utility
            .entry("rules")
            .or_insert_with(|| Value::Array(Vec::new()))
            .as_array_mut()
            .expect("managed utility rules are an array")
            .push(Value::Object(rule));
    }
    Ok(())
}

pub fn compile_default_preset_manifest(
    request: &CompileDefaultPresetRequest,
) -> Result<CompileDefaultPresetResult, CompilerError> {
    let mut input = request.manifest_input.clone();
    append_default_preset_styles(&mut input, &request.style_definitions)?;
    let manifest = compile_manifest_input(&input, &CompileManifestOptions::default())?.manifest;
    let manifest = normalize_default_manifest_for_json(&manifest)?;
    let json = serde_json::to_string(&manifest)
        .map_err(|error| manifest_error(format!("Cannot serialize default manifest: {error}")))?;
    Ok(CompileDefaultPresetResult { manifest, json })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn compiles_variables_conditions_and_utilities() {
        let input: CssDirectiveManifestInput = serde_json::from_value(json!({
            "variables": [
                { "namespace": "spacing", "key": "card", "value": 12, "static": true },
                { "namespace": "color", "key": "brand", "value": "var(--color-blue-50)" },
                { "namespace": "color", "key": "brand", "value": "#123", "mode": "dark", "static": true },
                { "namespace": "breakpoint", "key": "card", "value": "48rem" }
            ],
            "utilities": [{
                "name": "card",
                "layer": "components",
                "declarations": { "display": "grid", "color": "var(--color-primary)" }
            }]
        }))
        .unwrap();
        let manifest = compile_manifest_input(&input, &CompileManifestOptions::default())
            .unwrap()
            .manifest;
        assert_eq!(manifest["variables"]["spacing"][0]["key"], "card");
        assert_eq!(
            manifest["variables"]["color"][0]["modes"]["dark"]["value"],
            "#123"
        );
        assert_eq!(
            manifest["conditions"]["card"]["nodes"][0]["value"].as_f64(),
            Some(48.0)
        );
        assert_eq!(manifest["utilities"][0]["matchers"][0]["name"], "card");
    }

    #[test]
    fn compiles_variant_nodes() {
        let input: CssDirectiveManifestInput = serde_json::from_value(json!({
            "variants": [
                { "token": ":hocus", "branches": [{ "selector": "&:hover,&:focus" }] },
                { "token": "@motion-safe", "branches": [{ "conditions": ["@media (prefers-reduced-motion:no-preference)"] }] }
            ]
        }))
        .unwrap();
        let manifest = compile_manifest_input(&input, &CompileManifestOptions::default())
            .unwrap()
            .manifest;
        assert_eq!(manifest["selectors"][":hocus"][0]["value"], "hover");
        assert_eq!(
            manifest["conditions"]["motion-safe"]["nodes"][0]["name"],
            "prefers-reduced-motion"
        );
    }
}
