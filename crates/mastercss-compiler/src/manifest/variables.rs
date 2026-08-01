use super::*;

pub(super) fn manifest_error(message: impl Into<String>) -> CompilerError {
    CompilerError::Directive {
        message: message.into(),
        filename: "manifest.json".into(),
        range: None,
    }
}

pub(super) fn object(value: &Value) -> Result<&Map<String, Value>, CompilerError> {
    value
        .as_object()
        .ok_or_else(|| manifest_error("CSS directive manifest definition must be an object"))
}

pub(super) fn string_array(value: Option<&Value>) -> Vec<String> {
    value
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(Value::as_str)
        .map(str::to_owned)
        .collect()
}

pub(super) fn push_unique(target: &mut Vec<String>, value: impl Into<String>) {
    let value = value.into();
    if !target.contains(&value) {
        target.push(value);
    }
}

pub(super) fn collect_namespaces(
    input: &CssDirectiveManifestInput,
    base: Option<&Value>,
) -> Vec<String> {
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

pub(super) fn resolved_variable_name(
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

pub(super) fn skip_quoted_value(source: &str, start: usize, quote: char) -> usize {
    let mut index = start + quote.len_utf8();
    while index < source.len() {
        let character = source[index..].chars().next().unwrap_or_default();
        index += character.len_utf8();
        if character == '\\' {
            if let Some(escaped) = source[index..].chars().next() {
                index += escaped.len_utf8();
            }
        } else if character == quote {
            break;
        }
    }
    index
}

pub(super) fn skip_value_comment(source: &str, start: usize) -> usize {
    source[start + 2..]
        .find("*/")
        .map(|offset| start + 2 + offset + 2)
        .unwrap_or(source.len())
}

pub(super) fn variable_dependencies(value: &str) -> Vec<String> {
    let mut dependencies = Vec::new();
    let mut index = 0;
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
        if !value[index..].starts_with("var(--") {
            index += character.len_utf8();
            continue;
        }
        let after = &value[index + "var(--".len()..];
        let end = after
            .find(|character: char| {
                !(character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
            })
            .unwrap_or(after.len());
        if end > 0 {
            push_unique(&mut dependencies, after[..end].to_owned());
        }
        index += "var(--".len() + end;
    }
    dependencies
}

pub(super) fn unquoted_dollar_alias(value: &str) -> Option<&str> {
    let mut index = 0;
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
        if character == '$' {
            let alias = value[index + 1..]
                .split(|character: char| {
                    !(character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
                })
                .next()
                .unwrap_or_default();
            return (!alias.is_empty()).then_some(alias);
        }
        index += character.len_utf8();
    }
    None
}

pub(super) fn replace_unquoted_pipes(value: &str) -> String {
    let mut output = String::with_capacity(value.len());
    let mut index = 0;
    while index < value.len() {
        let character = value[index..].chars().next().unwrap_or_default();
        let end = if matches!(character, '\'' | '"') {
            skip_quoted_value(value, index, character)
        } else if value[index..].starts_with("/*") {
            skip_value_comment(value, index)
        } else {
            index + character.len_utf8()
        };
        if end > index + character.len_utf8() {
            output.push_str(&value[index..end]);
        } else if character == '|' {
            output.push(' ');
        } else {
            output.push(character);
        }
        index = end;
    }
    output
}

pub(super) fn normalize_variable_value(
    value: &Value,
) -> Result<(Value, Vec<String>), CompilerError> {
    let Value::String(value) = value else {
        return Ok((value.clone(), Vec::new()));
    };
    if let Some(alias) = unquoted_dollar_alias(value) {
        return Err(manifest_error(format!(
            "Stylesheet values use native CSS variable references. Replace \"${alias}\" with \"var(--{alias})\"."
        )));
    }
    Ok((
        Value::String(replace_unquoted_pipes(value)),
        variable_dependencies(value),
    ))
}

pub(super) fn parse_numeric_value(
    value: &Value,
    namespace: Option<&str>,
) -> Option<(f64, Option<String>)> {
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

pub(super) fn number_value(value: f64) -> Value {
    let value = if value == 0.0 { 0.0 } else { value };
    if value.fract() == 0.0 && value >= i64::MIN as f64 && value <= i64::MAX as f64 {
        return Value::Number((value as i64).into());
    }
    Number::from_f64(value)
        .map(Value::Number)
        .unwrap_or(Value::Null)
}

pub(super) fn variable_slot(variable: &Map<String, Value>) -> String {
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

pub(super) fn push_variable(target: &mut Vec<Map<String, Value>>, variable: Map<String, Value>) {
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

pub(super) fn compile_variables(
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

pub(super) fn group_variables(variables: Vec<Map<String, Value>>) -> Option<Value> {
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

pub(super) fn condition_for_variable(
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

pub(super) fn compile_variable_conditions(
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

pub(super) fn compile_condition(source: &str) -> Value {
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

pub(super) fn compile_selector(source: &str) -> Vec<Value> {
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
