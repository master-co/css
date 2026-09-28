use serde_json::{Value, json};

/// Semantic identity of a compiled utility. Definition names describe
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
                _ => matcher.clone(),
            },
        )
        .collect::<Vec<_>>();
    format!("{layer}:{}", json!(matchers))
}

pub fn effective_utilities(utilities: &[Value]) -> Vec<Value> {
    let mut seen = std::collections::HashSet::new();
    let mut output = Vec::new();
    for utility in utilities.iter().rev() {
        // An alias is an entry point, not part of another alias's identity.
        // Keep invalid/empty matchers intact so manifest validation can reject
        // them instead of silently dropping a malformed definition.
        let Some(matchers) = utility
            .get("matchers")
            .and_then(Value::as_array)
            .filter(|matchers| !matchers.is_empty())
        else {
            if seen.insert(utility_identity(utility)) {
                output.push(utility.clone());
            }
            continue;
        };
        for matcher in matchers.iter().rev() {
            let entries = if matcher.get("type").and_then(Value::as_str) == Some("key") {
                matcher
                    .get("keys")
                    .and_then(Value::as_array)
                    .filter(|keys| !keys.is_empty())
                    .map(|keys| {
                        keys.iter()
                            .map(|key| {
                                let mut entry = matcher.clone();
                                entry["keys"] = json!([key]);
                                entry
                            })
                            .collect()
                    })
                    .unwrap_or_else(|| vec![matcher.clone()])
            } else {
                vec![matcher.clone()]
            };
            for matcher in entries.into_iter().rev() {
                let mut entry = utility.clone();
                entry["matchers"] = json!([matcher]);
                if matcher["type"] == "key" && entry.get("keys").is_some() {
                    entry["keys"] = matcher["keys"].clone();
                }
                if seen.insert(utility_identity(&entry)) {
                    output.push(entry);
                }
            }
        }
    }
    output.reverse();
    output
}
