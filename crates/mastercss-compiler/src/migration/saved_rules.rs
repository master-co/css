//! Frozen saved-utility evaluation for explicit migration evidence only. Each
//! probe is lowered to one zero-parameter v3 mixin before entering the engine.
use mastercss_engine::{EngineCompositionRuleIr, EngineSession};
use serde_json::{Value, json};

pub(super) fn freeze(manifest: &mut Value) {
    if let Some(utilities) = manifest
        .as_object_mut()
        .and_then(|object| object.remove("utilities"))
    {
        if !manifest["debug"].is_object() {
            manifest["debug"] = json!({});
        }
        manifest["debug"]["migrationUtilities"] = utilities;
    }
}

fn declaration_value(value: &Value, matched: Option<&str>) -> Option<String> {
    match value {
        Value::Null => matched.map(str::to_owned),
        Value::String(value) => {
            Some(matched.map_or_else(|| value.clone(), |matched| value.replace("$value", matched)))
        }
        Value::Array(values) => values
            .iter()
            .map(|value| declaration_value(value, matched))
            .collect::<Option<Vec<_>>>()
            .map(|parts| parts.join("")),
        Value::Number(_) | Value::Bool(_) => Some(value.to_string()),
        _ => None,
    }
}

fn token_value(manifest: &Value, utility: &Value, key: &str) -> Option<String> {
    let (key, alpha) = key
        .split_once('/')
        .map_or((key, None), |(key, alpha)| (key, alpha.parse::<f64>().ok()));
    let (negative, key) = key
        .strip_prefix('-')
        .map_or((false, key), |key| (true, key));
    let mut name = utility["variableAliases"]
        .as_array()
        .into_iter()
        .flatten()
        .find_map(|alias| (alias[0] == key).then(|| alias[1].as_str()).flatten())
        .map(str::to_owned);
    for reference in utility["variableAliasRefs"]
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(Value::as_str)
    {
        if name.is_some() {
            break;
        }
        let namespace = reference.trim_start_matches(['~', '=']);
        let candidate = format!("{namespace}{}{key}", if key.is_empty() { "" } else { "-" });
        for (group, variables) in manifest["variables"].as_object().into_iter().flatten() {
            if variables.as_array().into_iter().flatten().any(|variable| {
                let default_name = format!(
                    "{group}{}{}",
                    if group.is_empty() { "" } else { "-" },
                    variable["key"].as_str().unwrap_or_default()
                );
                variable["name"].as_str().unwrap_or(&default_name) == candidate
            }) {
                name = Some(candidate.clone());
                break;
            }
        }
    }
    let name = name?;
    let value = format!("var(--{name})");
    Some(if let Some(alpha) = alpha {
        format!("color-mix(in oklab,{value} {}%,transparent)", alpha * 100.0)
    } else if negative {
        format!("calc({value} * -1)")
    } else {
        value
    })
}

fn matches(manifest: &Value, utility: &Value, class: &str) -> Option<(Option<String>, String)> {
    for matcher in utility["matchers"].as_array().into_iter().flatten() {
        let found = match matcher["type"].as_str()? {
            "static" => class
                .strip_prefix(matcher["name"].as_str()?)
                .filter(|suffix| {
                    suffix.is_empty()
                        || suffix.starts_with([':', '@', '!', '>', '_', '[', '+', '~', '.'])
                })
                .map(|suffix| (None, suffix.to_owned())),
            "key" | "value" => matcher["keys"]
                .as_array()
                .into_iter()
                .flatten()
                .filter_map(Value::as_str)
                .find_map(|key| {
                    let rest = class.strip_prefix(key)?.strip_prefix(':')?;
                    let (value, suffix) = super::values::split_rc_value_state(rest);
                    (!value.is_empty()).then_some((Some(value.replace('|', " ")), suffix))
                }),
            "token" => {
                let prefix = matcher["prefix"].as_str()?;
                let (negative, positive) = class
                    .strip_prefix('-')
                    .map_or((false, class), |value| (true, value));
                let (key, suffix) =
                    super::values::split_rc_value_state(positive.strip_prefix(prefix)?);
                token_value(
                    manifest,
                    utility,
                    &format!("{}{key}", if negative { "-" } else { "" }),
                )
                .map(|value| (Some(value), suffix))
            }
            _ => None,
        };
        if found.is_some() {
            return found;
        }
    }
    None
}

fn body(utility: &Value, matched: Option<&str>) -> Result<Vec<Value>, String> {
    let emit = &utility["emit"];
    let rules = match emit["type"].as_str() {
        Some("static") => emit["rules"].as_array().cloned().unwrap_or_default(),
        Some("template") => vec![json!({"declarations":emit["declarations"]})],
        Some("property") => vec![
            json!({"declarations":{emit["property"].as_str().ok_or("Missing saved property")?: matched.ok_or("Missing saved value")?}}),
        ],
        Some("declarations") => {
            let mut nodes = Vec::new();
            for declaration in emit["declarations"]
                .as_array()
                .into_iter()
                .flatten()
                .filter_map(Value::as_str)
            {
                let declaration = matched.map_or_else(
                    || declaration.to_owned(),
                    |value| declaration.replace("$value", value),
                );
                let (property, value) = declaration
                    .split_once(':')
                    .ok_or("Invalid saved declaration")?;
                nodes.push(json!({"type":"declaration","property":property,"value":crate::mixins::value(value)?}));
            }
            return Ok(nodes);
        }
        _ => return Err("Unsupported saved utility output".into()),
    };
    let mut output = Vec::new();
    for rule in rules {
        let mut nodes = Vec::new();
        for (property, raw) in rule["declarations"].as_object().into_iter().flatten() {
            let value = declaration_value(raw, matched).ok_or("Unresolved saved utility value")?;
            nodes.push(json!({"type":"declaration","property":property,"value":crate::mixins::value(&value)?}));
        }
        if let Some(selector) = rule["selector"]
            .as_str()
            .filter(|selector| *selector != "&")
        {
            nodes = vec![json!({"type":"rule","selector":selector,"body":nodes})];
        }
        for condition in rule["conditions"]
            .as_array()
            .into_iter()
            .flatten()
            .filter_map(Value::as_str)
            .rev()
        {
            nodes = vec![json!({"type":"condition","condition":condition,"body":nodes})];
        }
        output.extend(nodes);
    }
    Ok(output)
}

pub(super) fn prepare(
    engine: &EngineSession,
    class: &str,
) -> Result<
    (
        EngineSession,
        String,
        Option<mastercss_schema::UtilityLayerName>,
    ),
    String,
> {
    let mut manifest: Value =
        serde_json::from_str(&engine.manifest_json().map_err(|error| error.to_string())?)
            .map_err(|error| error.to_string())?;
    let utilities = manifest["debug"]["migrationUtilities"].as_array().cloned();
    let mut invocation = class.to_owned();
    let mut layer = None;
    if let Some(utilities) = utilities {
        for utility in &utilities {
            let Some((value, suffix)) = matches(&manifest, utility, class) else {
                continue;
            };
            let body = body(utility, value.as_deref())?;
            let definition = json!({"name":"--migration-result","body":body});
            if !manifest["mixins"].is_array() {
                manifest["mixins"] = json!([]);
            }
            manifest["mixins"]
                .as_array_mut()
                .expect("array")
                .push(definition);
            invocation = format!("migration-result{suffix}");
            layer = utility
                .get("layer")
                .cloned()
                .map(serde_json::from_value)
                .transpose()
                .map_err(|error| error.to_string())?;
            break;
        }
        if invocation == class {
            let migrated_keys = manifest["mixins"]
                .as_array()
                .into_iter()
                .flatten()
                .filter(|definition| {
                    definition["parameters"]
                        .as_array()
                        .is_some_and(|parameters| !parameters.is_empty())
                })
                .filter_map(|definition| {
                    definition["name"]
                        .as_str()
                        .and_then(|name| name.strip_prefix("--"))
                })
                .map(|key| json!({"matchers":[{"type":"key","keys":[key]}]}))
                .collect::<Vec<_>>();
            invocation = super::mixins::class(class, &json!({"utilities":migrated_keys}))
                .unwrap_or_else(|_| class.into());
        }
        if let Some(debug) = manifest["debug"].as_object_mut() {
            debug.remove("migrationUtilities");
        }
    }
    Ok((
        EngineSession::create(&manifest.to_string()).map_err(|error| error.to_string())?,
        invocation,
        layer,
    ))
}

pub(super) fn rules(
    engine: &EngineSession,
    class: &str,
) -> Result<Vec<EngineCompositionRuleIr>, String> {
    let (engine, class, layer) = prepare(engine, class)?;
    let mut rules = engine
        .composition_rules(&class)
        .map_err(|error| error.to_string())?;
    if let Some(layer) = layer {
        for rule in &mut rules {
            rule.layer = layer;
        }
    }
    Ok(rules)
}
