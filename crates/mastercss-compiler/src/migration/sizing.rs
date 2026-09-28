//! Removed preset sizes are decoded only during explicit RC migration. These
//! temporary definitions never escape the migration session or enter runtime.
use super::{Migration, utilities::current_helper, values::split_rc_value_state};
use mastercss_engine::EngineSession;
use serde_json::{Value, json};

fn has_entry(manifest: &Value, key: &str) -> bool {
    manifest["utilities"]
        .as_array()
        .into_iter()
        .flatten()
        .any(|u| {
            u["matchers"].as_array().into_iter().flatten().any(|m| {
                (m["type"] == "static" && m["name"] == key)
                    || (matches!(m["type"].as_str(), Some("key" | "value" | "variable"))
                        && m["keys"]
                            .as_array()
                            .is_some_and(|keys| keys.iter().any(|k| k == key)))
            })
        })
}

pub(super) fn add_helpers(original: &Value, target: &mut Value) -> Vec<String> {
    let mut helpers = Vec::new();
    for (key, width, height) in [
        ("size", "width", "height"),
        ("min-size", "min-width", "min-height"),
        ("max-size", "max-width", "max-height"),
    ] {
        for token in [false, true] {
            let prefix = format!("{key}-");
            let owns = |u: &Value| {
                u["matchers"].as_array().into_iter().flatten().any(|m| {
                    if token {
                        (m["type"] == "token" && m["prefix"] == prefix)
                            || (m["type"] == "variable"
                                && m["keys"]
                                    .as_array()
                                    .is_some_and(|keys| keys.iter().any(|k| k == key)))
                    } else {
                        matches!(m["type"].as_str(), Some("key" | "value" | "variable"))
                            && m["keys"]
                                .as_array()
                                .is_some_and(|keys| keys.iter().any(|k| k == key))
                    }
                })
            };
            let saved: Vec<_> = original["utilities"]
                .as_array()
                .into_iter()
                .flatten()
                .filter(|u| owns(u))
                .collect();
            let emit = json!({"type":"static","rules":[{"declarations":{width:null,height:null}}]});
            if saved.len() != 1
                || saved[0]["emit"] != emit
                || saved[0]["type"] != -1
                || saved[0]
                    .get("layer")
                    .is_some_and(|layer| layer != "utilities")
                || (token && saved[0]["variableAliasRefs"] != json!(["~container"]))
                || !saved[0]["id"].as_str().is_some_and(|id| {
                    id == key
                        || id == format!("{key}:<*>")
                        || id == format!("{key}:<number|*>")
                        || id == format!("{key}:<~container|number|*>")
                        || id == format!("{key}-<~container>")
                })
                || target["utilities"]
                    .as_array()
                    .into_iter()
                    .flatten()
                    .any(owns)
            {
                continue;
            }
            let id = format!(
                "migration-sizing-{key}-{}",
                if token { "token" } else { "raw" }
            );
            let alias = key.trim_end_matches("-size");
            let include_alias =
                !token && key != "size" && !has_entry(original, alias) && !has_entry(target, alias);
            let mut utility = json!({"id":id,"type":-1,"emit":emit,"matchers":[if token {json!({"type":"token","prefix":prefix})} else {json!({"type":"key","keys":if include_alias {vec![key, alias]} else {vec![key]}})}]});
            if token {
                utility["variableAliasRefs"] = json!(["~container"]);
            }
            target["utilities"].as_array_mut().unwrap().push(utility);
            if include_alias {
                helpers.push(format!("{alias}:"));
            }
            helpers.push(if token { prefix } else { format!("{key}:") });
        }
    }
    helpers
}

impl Migration {
    pub(super) fn sizing_class(&self, source: String) -> Result<String, String> {
        let Some(prefix) = self
            .sizing_helpers
            .iter()
            .find(|prefix| source.starts_with(prefix.as_str()))
        else {
            // Matching and ambiguity must not depend on current token values.
            let inspection = self
                .target
                .borrow()
                .inspect(&source)
                .map_err(|e| e.to_string())?;
            if let Some(diagnostic) = inspection.diagnostics.first() {
                return Err(diagnostic.message.clone());
            }
            return Ok(source);
        };
        let token = prefix.ends_with('-');
        let key = &prefix[..prefix.len() - 1];
        let (value, suffix) = split_rc_value_state(&source[prefix.len()..]);
        let stem = match key {
            "min" => "min-",
            "max" => "max-",
            _ => key.strip_suffix("size").unwrap(),
        };
        let separator = if token { '-' } else { ':' };
        let candidate =
            format!("{{{stem}width{separator}{value};{stem}height{separator}{value}}}{suffix}");
        let old = self.rules(&self.target, &source);
        // A size rule becomes two independently sorted declarations. Compare
        // each property with its complete selector/condition/layer context;
        // width and height commute, but competition in the class list is still
        // rejected by the shared overlap review.
        let actual = self.rules(&self.target, &candidate);
        let flatten = |rules: &[mastercss_engine::EngineCompositionRuleIr]| {
            let mut entries = rules
                .iter()
                .flat_map(|r| {
                    r.declarations
                        .iter()
                        .map(move |d| json!([r.layer, r.selector, r.conditions, d]).to_string())
                })
                .collect::<Vec<_>>();
            entries.sort();
            entries
        };
        if old.is_empty() || flatten(&old) != flatten(&actual) {
            return Err(format!(
                "Cannot prove saved sizing declarations, token identity and conditions equivalent for {candidate}"
            ));
        }
        for r in &old {
            for d in &r.declarations {
                if !d
                    .value
                    .as_str()
                    .is_some_and(|v| super::valid_saved_declaration(&d.property, v))
                {
                    return Err("Saved sizing value requires a CSS validity review".into());
                }
            }
        }
        let manifest = self
            .target
            .borrow()
            .manifest_json()
            .map_err(|e| e.to_string())?;
        let mut saved: Value = serde_json::from_str(&manifest).map_err(|e| e.to_string())?;
        current_helper(&mut saved);
        let engine = EngineSession::create(&saved.to_string()).map_err(|e| e.to_string())?;
        let resources = |class: &str| -> Result<Value, String> {
            let mut probe =
                EngineSession::create(&engine.manifest_json().map_err(|e| e.to_string())?)
                    .map_err(|e| e.to_string())?;
            probe
                .ensure_class_rules([class])
                .map_err(|e| e.to_string())?;
            let mut resources = probe.snapshot().map_err(|e| e.to_string())?.resources;
            // Splitting a declaration changes ownership counts, never resource
            // identity, dependencies, cascade order or emitted theme values.
            for variable in &mut resources.variables {
                variable.ref_count = 1;
            }
            for animation in &mut resources.animations {
                animation.ref_count = 1;
            }
            serde_json::to_value(resources).map_err(|e| e.to_string())
        };
        if resources(&source)? != resources(&candidate)? {
            return Err("Sizing migration changes token or animation resources".into());
        }
        Ok(candidate)
    }
}
