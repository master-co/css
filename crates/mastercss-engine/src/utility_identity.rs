use serde_json::{Value, json};

/// Semantic identity of a compiled utility. Names and enum mapping values describe
/// content; they do not distinguish two definitions of the same entry point.
pub fn utility_identity(utility: &Value) -> String {
    let layer = utility
        .get("layer")
        .and_then(Value::as_str)
        .unwrap_or("utilities");
    let matchers = utility
        .get("matchers")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(
            |matcher| match matcher.get("type").and_then(Value::as_str) {
                Some("static") => json!(["static", matcher["name"]]),
                Some("key") => json!(["key", matcher["keys"]]),
                Some("token") => json!([
                    "token",
                    matcher["prefix"],
                    utility
                        .get("variableAliasRefs")
                        .cloned()
                        .unwrap_or(json!([]))
                ]),
                Some("pattern") => {
                    let mut values = matcher["values"].as_array().cloned().unwrap_or_default();
                    values.sort_by(|a, b| a.as_str().cmp(&b.as_str()));
                    json!(["pattern", matcher["prefix"], values])
                }
                _ => matcher.clone(),
            },
        )
        .collect::<Vec<_>>();
    format!("{layer}:{}", json!(matchers))
}

pub fn effective_utilities(utilities: &[Value]) -> Vec<Value> {
    let mut seen = std::collections::HashSet::new();
    let mut output = utilities
        .iter()
        .rev()
        .filter(|utility| seen.insert(utility_identity(utility)))
        .cloned()
        .collect::<Vec<_>>();
    output.reverse();
    output
}
