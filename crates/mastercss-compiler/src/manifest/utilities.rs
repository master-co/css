use super::*;

pub(super) type CompiledVariants = (Option<Value>, Map<String, Value>, Map<String, Value>);

pub(super) fn compile_variants(
    input: Option<&Vec<Value>>,
) -> Result<CompiledVariants, CompilerError> {
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

pub(super) fn value_placeholder_parts(value: &str) -> Result<Value, CompilerError> {
    if !value.contains("--value") {
        return Ok(Value::String(value.into()));
    }
    if value == "--value()" {
        return Ok(Value::Null);
    }
    let mut parts = Vec::new();
    let mut index = 0;
    let mut last_index = 0;
    let mut matched = false;
    while index < value.len() {
        let character = value[index..].chars().next().unwrap_or_default();
        if matches!(character, '\'' | '"') {
            index = skip_quoted_value(value, index, character);
            continue;
        }
        if value[index..].starts_with("/*") {
            index = skip_value_comment(value, index);
            continue;
        }
        if !value[index..].starts_with("--value") {
            index += character.len_utf8();
            continue;
        }
        if value[..index].chars().next_back().is_some_and(|character| {
            character.is_ascii_alphanumeric() || matches!(character, '-' | '_')
        }) {
            return Err(manifest_error(
                "--value() must be a standalone CSS value placeholder",
            ));
        }
        let open = index + "--value".len();
        if value.as_bytes().get(open) != Some(&b'(') {
            return Err(manifest_error("--value() must be called as --value()"));
        }
        let Some(close_offset) = value[open + 1..].find(')') else {
            return Err(manifest_error("--value() must be called as --value()"));
        };
        let close = open + 1 + close_offset;
        if !value[open + 1..close].trim().is_empty() {
            return Err(manifest_error("--value() does not accept arguments"));
        }
        let end = close + 1;
        if value[end..].chars().next().is_some_and(|character| {
            character.is_ascii_alphanumeric() || matches!(character, '-' | '_')
        }) {
            return Err(manifest_error(
                "--value() must be a standalone CSS value placeholder",
            ));
        }
        if index > last_index {
            parts.push(Value::String(value[last_index..index].into()));
        }
        parts.push(Value::Null);
        matched = true;
        index = end;
        last_index = index;
    }
    if !matched {
        return Ok(Value::String(value.into()));
    }
    if last_index < value.len() {
        parts.push(Value::String(value[last_index..].into()));
    }
    Ok(Value::Array(parts))
}

pub(super) fn compile_declarations(
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

pub(super) fn compile_utility_rule(rule: &Value, pattern: bool) -> Result<Value, CompilerError> {
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

pub(super) fn utility_rules(
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

pub(super) fn placeholder_property_count(rules: &[Value]) -> usize {
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

pub(super) fn utility_type_from_rules(rules: &[Value]) -> i64 {
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

pub(super) fn compile_utility(definition: &Value, order: usize) -> Result<Value, CompilerError> {
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

pub(super) fn compile_utilities(
    input: Option<&Vec<Value>>,
) -> Result<Option<Value>, CompilerError> {
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
