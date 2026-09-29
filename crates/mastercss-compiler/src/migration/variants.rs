//! Saved variant decoding is confined to the explicit migration workflow.
use serde_json::{Value, json};

pub(super) fn media_definition(branches: &[Value]) -> Option<String> {
    if branches.is_empty() {
        return None;
    }
    let queries = branches
        .iter()
        .map(|branch| {
            if branch["selector"]
                .as_str()
                .is_some_and(|selector| selector != "&")
            {
                return None;
            }
            let conditions = branch["conditions"].as_array()?;
            if conditions.len() != 1 {
                return None;
            }
            conditions[0].as_str()?.strip_prefix("@media ")
        })
        .collect::<Option<Vec<_>>>()?;
    Some(queries.join(", "))
}

pub(super) fn lower(manifest: &mut Value) {
    let mut replacements = serde_json::Map::new();
    let variants = manifest["variants"].as_array().cloned().unwrap_or_default();
    for variant in variants {
        let Some(token) = variant["token"].as_str() else {
            continue;
        };
        let Some(name) = token.strip_prefix('@') else {
            continue;
        };
        let branches = variant["branches"].as_array().cloned().unwrap_or_default();
        if branches.iter().any(|branch| branch.get("layer").is_some()) {
            replacements.insert(token.into(), json!({"error":"Move variant layer branches to explicit @layer(...) class call sites or outer stylesheet @layer blocks; automatic wrapping could change the cascade"}));
            continue;
        }
        if let Some(query) = media_definition(&branches)
            .filter(|_| name != "starting-style")
            .and_then(|query| {
                mastercss_engine::parse_custom_media_query(&query, &mut |alias| {
                    Err(format!("Unresolved saved custom media {alias}"))
                })
                .ok()
            })
        {
            if !manifest["customMedia"].is_object() {
                manifest["customMedia"] = json!({});
            }
            manifest["customMedia"][format!("--{name}")] = json!(query);
            replacements.insert(token.into(), json!({"suffix":name}));
            continue;
        }
        let mut body = Vec::new();
        for branch in branches {
            let mut nodes = vec![json!({"type":"contents","fallback":[]})];
            if let Some(selector) = branch["selector"].as_str().filter(|value| *value != "&") {
                nodes = vec![json!({"type":"rule","selector":selector,"body":nodes})];
            }
            for condition in branch["conditions"].as_array().into_iter().flatten().rev() {
                nodes = vec![json!({"type":"condition","condition":condition,"body":nodes})];
            }
            body.extend(nodes);
        }
        if !manifest["mixins"].is_array() {
            manifest["mixins"] = json!([]);
        }
        let mixins = manifest["mixins"].as_array_mut().unwrap();
        let dashed = format!("--{name}");
        mixins.retain(|mixin| mixin["name"] != dashed);
        mixins.push(json!({"name":dashed,"body":body}));
        replacements.insert(token.into(), json!({"suffix":format!("apply(--{name})")}));
    }
    let conditions = manifest["conditions"]
        .as_object()
        .cloned()
        .unwrap_or_default();
    for (name, condition) in conditions {
        let token = format!("@{name}");
        if replacements.contains_key(&token) {
            continue;
        }
        if condition["id"] == "layer" {
            let layer = match name.as_str() {
                "base" => "base",
                "default" => "defaults",
                "component" => "components",
                "utility" => "utilities",
                _ => continue,
            };
            replacements.insert(token, json!({"suffix":format!("layer({layer})")}));
        } else if let Ok(query) = super::conditions::decode(manifest, &name) {
            replacements.insert(token, json!({"suffix":query}));
        }
    }
    for field in ["variants", "conditions", "selectors", "containerConditions"] {
        manifest.as_object_mut().unwrap().remove(field);
    }
    if !replacements.is_empty() {
        if !manifest["debug"].is_object() {
            manifest["debug"] = json!({});
        }
        manifest["debug"]["migrationWrappers"] = json!(replacements);
    }
}

pub(super) fn class(manifest: &Value, source: &str) -> Result<String, String> {
    let important = source.ends_with('!');
    let mut result = source.strip_suffix('!').unwrap_or(source).to_owned();
    for (start, end) in super::conditions::suffixes(&result).into_iter().rev() {
        let token = &result[start..end];
        let entry = &manifest["debug"]["migrationWrappers"][token];
        if let Some(error) = entry["error"].as_str() {
            return Err(error.into());
        }
        if let Some(suffix) = entry["suffix"].as_str() {
            result.replace_range(start + 1..end, suffix);
        }
    }
    if important {
        result.push('!');
    }
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn media_uses_its_own_namespace_and_layer_branches_require_review() {
        let mut manifest = json!({"variants":[
            {"token":"@wide","branches":[{"conditions":["@media (width>40rem)"]}]},
            {"token":"@hocus","branches":[{"selector":"&:hover"}]},
            {"token":"@placed","branches":[{"layer":"components"}]}
        ]});
        lower(&mut manifest);
        assert!(manifest["customMedia"]["--wide"].is_object());
        assert_eq!(
            class(&manifest, "color:red@wide").unwrap(),
            "color:red@wide"
        );
        assert_eq!(
            class(&manifest, "color:red@hocus").unwrap(),
            "color:red@apply(--hocus)"
        );
        assert!(
            class(&manifest, "color:red@placed")
                .unwrap_err()
                .contains("explicit @layer")
        );
        assert!(manifest.get("variants").is_none());
        assert_eq!(manifest["mixins"].as_array().unwrap().len(), 1);
    }
}
