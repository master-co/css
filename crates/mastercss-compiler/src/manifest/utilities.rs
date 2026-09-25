use super::variables::{compile_condition, compile_selector, manifest_error, object, string_array};
use super::{CompilerError, Map, NATIVE_CSS_SHORTHANDS, Value, json};

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
                let bodyless = mastercss_lexer::replace_nesting_selector(selector, "")
                    .unwrap_or_else(|| selector.to_owned());
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

pub(crate) fn value_placeholder_parts(value: &str) -> Result<Value, CompilerError> {
    let tokens = mastercss_lexer::tokenize_css_syntax(value);
    let mut parts = Vec::new();
    let mut end = 0;
    for token in &tokens {
        if let mastercss_lexer::CssSyntaxKind::Function(name) = &token.kind
            && name == "--value"
        {
            let close = token
                .close
                .and_then(|close| tokens.get(close))
                .ok_or_else(|| manifest_error("Unclosed --value() placeholder"))?;
            if !mastercss_lexer::tokenize_css_syntax(&value[token.bytes.end..close.bytes.start])
                .is_empty()
            {
                return Err(manifest_error("--value() does not accept arguments"));
            }
            if value[close.bytes.end..]
                .chars()
                .next()
                .is_some_and(|c| c.is_alphanumeric() || matches!(c, '-' | '_' | '\\' | '('))
            {
                return Err(manifest_error(
                    "--value() is a complete CSS value; separate adjacent tokens instead of joining an identifier or function name",
                ));
            }
            if token.bytes.start > end {
                parts.push(Value::String(value[end..token.bytes.start].into()));
            }
            parts.push(Value::Null);
            end = close.bytes.end;
        }
    }
    if parts.is_empty() {
        return Ok(Value::String(value.into()));
    }
    if end < value.len() {
        parts.push(Value::String(value[end..].into()));
    }
    if parts == [Value::Null] {
        Ok(Value::Null)
    } else {
        Ok(Value::Array(parts))
    }
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
    if let Some(rules) = definition.get("compiledBody").and_then(Value::as_array) {
        return Ok(rules.clone());
    }
    if definition.contains_key("body") {
        return crate::utility_definitions::seed_rules(definition);
    }
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
        .map(|(property, _)| property)
        .collect::<std::collections::HashSet<_>>()
        .len()
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

/// A CSS property keeps its native declaration semantics even when a managed
/// definition supplies vendor compatibility declarations.
fn validate_native_pattern(key: &str, rules: &[Value]) -> Result<(), CompilerError> {
    use lightningcss::properties::PropertyId;
    let key = mastercss_engine::builtin_key_aliases()
        .iter()
        .find_map(|(alias, property)| (*alias == key).then_some(*property))
        .unwrap_or(key);
    let native = mastercss_schema::is_native_css_property(key)
        || !matches!(PropertyId::from(key), PropertyId::Custom(_))
        || NATIVE_CSS_SHORTHANDS.contains(&key);
    if !native {
        return Ok(());
    }
    let valid = rules.is_empty()
        || rules.len() == 1
            && rules.iter().all(|rule| {
                !rule.as_object().is_some_and(|rule| {
                    rule.contains_key("selector") || rule.contains_key("conditions")
                }) && rule
                    .get("declarations")
                    .and_then(Value::as_object)
                    .is_some_and(|declarations| {
                        declarations.get(key).is_some_and(Value::is_null)
                            && declarations.iter().all(|(property, value)| {
                                let unprefixed = ["-webkit-", "-moz-", "-ms-", "-o-"]
                                    .iter()
                                    .find_map(|prefix| property.strip_prefix(prefix))
                                    .unwrap_or(property);
                                value.is_null() && (property == key || unprefixed == key)
                            })
                    })
            });
    if !valid {
        return Err(manifest_error(format!(
            "Native property {key}: must emit {key}: --value() without changing its intent; use a distinct utility name for subproperties or combined styles"
        )));
    }
    Ok(())
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
    if definition_type == "token" {
        let token = definition
            .get("token")
            .and_then(Value::as_object)
            .ok_or_else(|| manifest_error("Named token definition requires a token pattern"))?;
        let prefix = token
            .get("prefix")
            .and_then(Value::as_str)
            .filter(|prefix| prefix.ends_with('-') && prefix.len() > 1)
            .ok_or_else(|| manifest_error("Named token prefix must end with a hyphen"))?;
        let references = string_array(token.get("variableAliasRefs"));
        if references.is_empty() {
            return Err(manifest_error(
                "Named token definition requires namespace references",
            ));
        }
        let rules = utility_rules(definition, true)?;
        return Ok(json!({
            "id": source_name, "name": source_name,
            "type": utility_type_from_rules(&rules), "order": order, "layer": layer,
            "variableAliasRefs": references,
            "emit": { "type": "static", "rules": rules },
            "matchers": [{ "type": "token", "prefix": prefix }]
        }));
    }
    if definition_type == "pattern" {
        let pattern = definition
            .get("pattern")
            .and_then(Value::as_object)
            .ok_or_else(|| {
                manifest_error("Managed enum pattern definition is missing a pattern")
            })?;
        let rules = utility_rules(definition, true)?;
        if let Some(key) = pattern
            .get("prefix")
            .and_then(Value::as_str)
            .and_then(|prefix| prefix.strip_suffix(':'))
        {
            validate_native_pattern(key, &rules)?;
            let property = mastercss_engine::builtin_key_aliases()
                .iter()
                .find_map(|(alias, property)| (*alias == key).then_some(*property))
                .unwrap_or(key);
            if mastercss_schema::is_native_css_property(property)
                && pattern
                    .get("valueMap")
                    .and_then(Value::as_object)
                    .is_some_and(|values| {
                        values
                            .iter()
                            .any(|(key, value)| value.as_str() != Some(key))
                    })
            {
                return Err(manifest_error(format!(
                    "Native property {property}: cannot remap raw enum values"
                )));
            }
        }
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
        validate_native_pattern(key, &rules)?;
        if [
            "kind",
            "values",
            "arbitrary",
            "variableAliasRefs",
            "segments",
        ]
        .iter()
        .any(|field| dynamic.contains_key(*field))
        {
            return Err(manifest_error(
                "Raw utilities accept only a fixed key; rebuild with key:<*>",
            ));
        }
        let matchers = vec![json!({ "type": "key", "keys": [key] })];
        let mut utility = Map::new();
        utility.insert("id".into(), Value::String(source_name.into()));
        utility.insert("name".into(), Value::String(source_name.into()));
        utility.insert(
            "type".into(),
            Value::Number(utility_type_from_rules(&rules).into()),
        );
        utility.insert("order".into(), Value::Number(order.into()));
        utility.insert("layer".into(), Value::String(layer.into()));
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
        crate::utility_definitions::effective(input)
            .iter()
            .enumerate()
            .map(|(order, definition)| compile_utility(definition, order))
            .collect::<Result<_, _>>()?,
    )))
}
