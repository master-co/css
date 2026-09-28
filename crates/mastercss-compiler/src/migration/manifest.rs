//! Upgrade saved wire data only inside the explicit RC migration workflow.
//! This is never used by ordinary compiler input or runtime loading.
use serde_json::{Value, json};

fn text(value: &Value) -> String {
    match value {
        Value::String(value) => value.clone(),
        Value::Array(values) => values.iter().map(text).collect(),
        Value::Object(value) => value.get("value").map(text).unwrap_or_default(),
        _ => value.to_string(),
    }
}

pub(super) fn upgrade(manifest: &mut Value) {
    let modes = manifest
        .get("modes")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let mut theme = manifest
        .get("theme")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let mut variants = manifest
        .get("variants")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    for mode in &modes {
        let Some(name) = mode["name"].as_str() else {
            continue;
        };
        let branches = mode["branches"]
            .as_array()
            .into_iter()
            .flatten()
            .map(|branch| {
                let selector = branch["selector"].as_str().unwrap_or(":root,:host");
                let selector = if selector == ":root,:host" {
                    "&".into()
                } else {
                    format!(
                        "&:where({})",
                        mastercss_lexer::split_selector_list(selector)
                            .into_iter()
                            .flat_map(|selector| [
                                selector.trim().to_owned(),
                                format!("{} *", selector.trim())
                            ])
                            .collect::<Vec<_>>()
                            .join(",")
                    )
                };
                let mut branch = branch.clone();
                branch["selector"] = json!(selector);
                branch
            })
            .collect::<Vec<_>>();
        let token = format!("@{name}");
        variants.retain(|variant| variant["token"] != token);
        variants.push(json!({"token":token, "branches":branches}));
        if let Some(conditions) = manifest
            .get_mut("conditions")
            .and_then(Value::as_object_mut)
        {
            conditions.remove(name);
        }
    }
    for (namespace, variables) in manifest
        .get_mut("variables")
        .and_then(Value::as_object_mut)
        .into_iter()
        .flatten()
    {
        for variable in variables.as_array_mut().into_iter().flatten() {
            if variable.get("values").is_some() {
                continue;
            }
            let key = variable["key"].as_str().unwrap_or_default();
            let name = variable["name"]
                .as_str()
                .map(str::to_owned)
                .unwrap_or_else(|| {
                    [namespace.as_str(), key]
                        .into_iter()
                        .filter(|s| !s.is_empty())
                        .collect::<Vec<_>>()
                        .join("-")
                });
            let mut values = Vec::new();
            let mut add = |value: &Value, path: Vec<String>| {
                let value = text(value);
                values.push(json!({"value":value,"path":path}));
                let mut node = json!({"type":"declaration","name":name,"value":value});
                for prelude in path.into_iter().rev() {
                    node = json!({"type":"rule","prelude":prelude,"children":[node]});
                }
                theme.push(node);
            };
            if let Some(value) = variable.get("value") {
                add(value, vec![":root,:host".into()]);
            }
            for (mode, value) in variable
                .get("modes")
                .and_then(Value::as_object)
                .into_iter()
                .flatten()
            {
                if let Some(definition) =
                    modes.iter().find(|definition| definition["name"] == *mode)
                {
                    for branch in definition["branches"].as_array().into_iter().flatten() {
                        let mut path = branch["conditions"]
                            .as_array()
                            .into_iter()
                            .flatten()
                            .filter_map(Value::as_str)
                            .map(str::to_owned)
                            .collect::<Vec<_>>();
                        path.push(branch["selector"].as_str().unwrap_or(":root,:host").into());
                        add(value, path);
                    }
                } else {
                    add(
                        value,
                        vec![
                            format!("@media (prefers-color-scheme:{mode})"),
                            ":root,:host".into(),
                        ],
                    );
                }
            }
            let object = variable.as_object_mut().expect("saved variable");
            for field in ["value", "modes", "mode", "inline", "static"] {
                object.remove(field);
            }
            object.insert("values".into(), json!(values));
        }
    }
    manifest["theme"] = json!(theme);
    manifest["variants"] = json!(variants);
    let mut utilities = Vec::new();
    for utility in manifest["utilities"].as_array().into_iter().flatten() {
        let mut rest = Vec::new();
        for matcher in utility["matchers"].as_array().into_iter().flatten() {
            if matcher["type"] != "pattern" {
                rest.push(matcher.clone());
                continue;
            }
            for value in matcher["values"]
                .as_array()
                .into_iter()
                .flatten()
                .filter_map(Value::as_str)
            {
                let name = format!("{}{value}", matcher["prefix"].as_str().unwrap_or_default());
                let replacement = matcher
                    .get("valueMap")
                    .and_then(|map| map.get(value))
                    .cloned()
                    .unwrap_or_else(|| json!(value));
                fn substitute(value: &mut Value, replacement: &Value) {
                    match value {
                        Value::Null => *value = replacement.clone(),
                        Value::Array(values) => values
                            .iter_mut()
                            .for_each(|value| substitute(value, replacement)),
                        Value::Object(values) => values
                            .values_mut()
                            .for_each(|value| substitute(value, replacement)),
                        _ => {}
                    }
                }
                let mut fixed = utility.clone();
                fixed["id"] = json!(name);
                fixed["name"] = json!(name);
                fixed["matchers"] = json!([{"type":"static","name":name}]);
                substitute(&mut fixed["emit"], &replacement);
                utilities.push(fixed);
            }
        }
        if !rest.is_empty() {
            let mut utility = utility.clone();
            utility["matchers"] = json!(rest);
            utilities.push(utility);
        }
    }
    manifest["utilities"] = json!(utilities);
    let breakpoints = manifest
        .get("breakpointConditions")
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    for (name, condition) in breakpoints {
        let nodes = condition["nodes"].as_array().cloned().unwrap_or_default();
        if let Some(node) = nodes.first().filter(|node| node["type"] == "number") {
            let query = format!(
                "(width>={}{} )",
                text(&node["value"]),
                node["unit"].as_str().unwrap_or_default()
            )
            .replace(" )", ")");
            manifest
                .as_object_mut()
                .unwrap()
                .entry("customMedia")
                .or_insert_with(|| json!({}))[format!("--{name}")] =
                json!({"type":"feature","value":query});
            if let Some(conditions) = manifest
                .get_mut("conditions")
                .and_then(Value::as_object_mut)
            {
                conditions.remove(&name);
            }
        }
    }
    let object = manifest.as_object_mut().expect("saved manifest");
    for field in [
        "settings",
        "modes",
        "animations",
        "animationOptions",
        "breakpointConditions",
    ] {
        object.remove(field);
    }
    manifest["version"] = json!(mastercss_schema::MANIFEST_VERSION);
    manifest["languageVersion"] = json!(mastercss_schema::LANGUAGE_VERSION);
}

pub(super) fn css(manifest: &Value, original: &Value) -> String {
    fn nodes(nodes: &Value) -> String {
        nodes
            .as_array()
            .into_iter()
            .flatten()
            .map(|node| {
                if node["type"] == "declaration" {
                    format!(
                        "--{}:{};",
                        mastercss_lexer::css_escape(node["name"].as_str().unwrap_or_default()),
                        text(&node["value"])
                    )
                } else {
                    format!(
                        "{}{{{}}}",
                        node["prelude"].as_str().unwrap_or_default(),
                        nodes_string(&node["children"])
                    )
                }
            })
            .collect()
    }
    fn nodes_string(value: &Value) -> String {
        nodes(value)
    }
    let theme = nodes(&manifest["theme"]);
    let mut output = if theme.is_empty() {
        String::new()
    } else {
        format!("@theme{{{theme}}}\n")
    };
    for (name, query) in manifest
        .get("customMedia")
        .and_then(Value::as_object)
        .into_iter()
        .flatten()
    {
        if let Some(value) = query.get("value").and_then(Value::as_str) {
            output.push_str(&format!(
                "@custom-media {} {value};\n",
                mastercss_lexer::css_escape(name)
            ));
        }
    }
    for variant in manifest["variants"].as_array().into_iter().flatten() {
        let Some(name) = variant["token"]
            .as_str()
            .and_then(|token| token.strip_prefix('@'))
        else {
            continue;
        };
        // The saved mode table is the only legacy activation ownership to emit here.
        if !original["modes"]
            .as_array()
            .into_iter()
            .flatten()
            .any(|mode| mode["name"] == name)
        {
            continue;
        }
        output.push_str(&format!(
            "@custom-variant {}{{",
            mastercss_lexer::css_escape(name)
        ));
        for branch in variant["branches"].as_array().into_iter().flatten() {
            let mut body = "@slot;".to_owned();
            if let Some(selector) = branch["selector"]
                .as_str()
                .filter(|selector| *selector != "&")
            {
                body = format!("{selector}{{{body}}}");
            }
            for condition in branch["conditions"]
                .as_array()
                .into_iter()
                .flatten()
                .filter_map(Value::as_str)
                .collect::<Vec<_>>()
                .into_iter()
                .rev()
            {
                body = format!("{condition}{{{body}}}");
            }
            output.push_str(&body);
        }
        output.push_str("}\n");
    }
    for (name, frames) in original
        .get("animations")
        .and_then(Value::as_object)
        .into_iter()
        .flatten()
    {
        output.push_str(&format!(
            "@keyframes {}{{",
            mastercss_lexer::css_escape(name)
        ));
        for (selector, declarations) in frames.as_object().into_iter().flatten() {
            output.push_str(&format!("{selector}{{"));
            for (property, value) in declarations.as_object().into_iter().flatten() {
                output.push_str(&format!("{property}:{};", text(value)));
            }
            output.push('}');
        }
        output.push_str("}\n");
    }
    output
}
