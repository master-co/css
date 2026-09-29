use super::variables::{compile_condition, compile_selector, manifest_error, object, string_array};
use super::{CompilerError, Map, Value, json};

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
    let last = input
        .iter()
        .enumerate()
        .filter_map(|(index, variant)| {
            variant
                .get("token")
                .and_then(Value::as_str)
                .map(|token| (token, index))
        })
        .collect::<std::collections::HashMap<_, _>>();
    for (index, variant) in input.iter().enumerate() {
        if variant
            .get("token")
            .and_then(Value::as_str)
            .is_some_and(|token| last.get(token) != Some(&index))
        {
            continue;
        }
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
