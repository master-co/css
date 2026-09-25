//! Complete authoring definitions survive parsing until overrides and dependencies
//! have been resolved. Bodies and source references never enter runtime manifests.
use crate::CompilerError;
use mastercss_schema::{CssDirectiveStyleDefinition, UtilityLayerName};
use serde_json::{Map, Value, json};

pub(crate) fn identity(definition: &Value) -> String {
    let layer = definition
        .get("layer")
        .and_then(Value::as_str)
        .unwrap_or("utilities");
    let kind = definition
        .get("type")
        .and_then(Value::as_str)
        .unwrap_or("static");
    let key = match kind {
        "dynamic" => json!([kind, definition["dynamic"]["key"]]),
        "token" => json!([
            kind,
            definition["token"]["prefix"],
            definition["token"]["variableAliasRefs"]
        ]),
        "pattern" => {
            let mut keys = definition["pattern"]["values"]
                .as_array()
                .cloned()
                .unwrap_or_default();
            keys.sort_by(|a, b| a.as_str().cmp(&b.as_str()));
            json!([kind, definition["pattern"]["prefix"], keys])
        }
        _ => json!(["static", definition["name"]]),
    };
    format!("{layer}:{key}")
}

pub(crate) fn effective(definitions: &[Value]) -> Vec<Value> {
    let mut seen = std::collections::HashSet::new();
    let mut output = definitions
        .iter()
        .rev()
        .filter(|definition| seen.insert(identity(definition)))
        .cloned()
        .collect::<Vec<_>>();
    output.reverse();
    output
}

pub(crate) fn body(
    definition: &Map<String, Value>,
) -> Result<Vec<CssDirectiveStyleDefinition>, CompilerError> {
    let Some(body) = definition.get("body") else {
        return Ok(Vec::new());
    };
    let mut body: Vec<CssDirectiveStyleDefinition> = serde_json::from_value(body.clone())
        .map_err(|error| crate::manifest::definition_error(error.to_string()))?;
    let parameterized = definition.get("type").and_then(Value::as_str) != Some("static");
    if parameterized {
        for fragment in &mut body {
            let (selector, conditions, path) = match fragment {
                CssDirectiveStyleDefinition::Native {
                    selector,
                    conditions,
                    condition_path,
                    ..
                }
                | CssDirectiveStyleDefinition::Compose {
                    selector,
                    conditions,
                    condition_path,
                    ..
                } => (selector, conditions, condition_path),
            };
            if placeholder(selector)
                || conditions.iter().flatten().any(|value| placeholder(value))
                || path.iter().flatten().any(|entry| match entry {
                    mastercss_schema::CssDirectiveConditionPathEntry::Condition { value } => {
                        placeholder(value)
                    }
                    mastercss_schema::CssDirectiveConditionPathEntry::Variant { token } => {
                        placeholder(token)
                    }
                })
            {
                return Err(crate::manifest::definition_error(
                    "--value() is only allowed in parameterized declaration values",
                ));
            }
            match fragment {
                CssDirectiveStyleDefinition::Native { declarations, .. } => {
                    for declaration in declarations {
                        if placeholder(&declaration.property) {
                            return Err(crate::manifest::definition_error(
                                "--value() cannot be used in a property name",
                            ));
                        }
                        if let Some(value) = declaration.value.as_str() {
                            declaration.value = crate::manifest::compile_value_template(value)?;
                        }
                    }
                }
                CssDirectiveStyleDefinition::Compose { class_name, .. }
                    if placeholder(class_name) =>
                {
                    return Err(crate::manifest::definition_error(
                        "@compose targets must be fixed classes; write width:--value() as a declaration instead",
                    ));
                }
                _ => {}
            }
        }
    }
    Ok(body)
}

fn placeholder(source: &str) -> bool {
    mastercss_lexer::tokenize_css_syntax(source).iter().any(|token| matches!(&token.kind, mastercss_lexer::CssSyntaxKind::Function(name) if name == "--value"))
}

pub(crate) fn seed_rules(definition: &Map<String, Value>) -> Result<Vec<Value>, CompilerError> {
    let mut rules = Vec::new();
    for fragment in body(definition)? {
        if let CssDirectiveStyleDefinition::Native {
            declarations,
            selector,
            conditions,
            ..
        } = fragment
        {
            append_rules(
                &mut rules,
                declarations,
                &selector,
                conditions.as_deref().unwrap_or_default(),
            );
        }
    }
    Ok(rules)
}

pub(crate) fn append_rules(
    rules: &mut Vec<Value>,
    declarations: Vec<mastercss_schema::CssDeclaration>,
    selector: &str,
    conditions: &[String],
) {
    for declarations in crate::declaration_runs(declarations) {
        let mut rule = json!({ "declarations": declarations });
        if selector != "&" {
            rule["selector"] = selector.into();
        }
        if !conditions.is_empty() {
            rule["conditions"] = json!(conditions);
        }
        rules.push(rule);
    }
}

pub(crate) fn layer(definition: &Value) -> UtilityLayerName {
    definition
        .get("layer")
        .and_then(|value| serde_json::from_value(value.clone()).ok())
        .unwrap_or(UtilityLayerName::Utilities)
}

pub(crate) fn validate_names(definitions: &[Value]) -> Result<(), CompilerError> {
    let mut enums = std::collections::HashMap::new();
    let mut fixed = std::collections::HashMap::new();
    let mut raw = std::collections::HashMap::new();
    for definition in definitions {
        match definition["type"].as_str().unwrap_or("static") {
            "dynamic" => {
                if let Some(key) = definition["dynamic"]["key"].as_str() {
                    raw.insert(key.to_owned(), definition);
                }
            }
            "pattern" => {
                let prefix = definition["pattern"]["prefix"].as_str().unwrap_or_default();
                for key in definition["pattern"]["values"]
                    .as_array()
                    .into_iter()
                    .flatten()
                    .filter_map(Value::as_str)
                {
                    let name = format!("{prefix}{key}");
                    if let Some(previous) = enums.insert(name.clone(), definition) {
                        let previous_identity = identity(previous);
                        let current_identity = identity(definition);
                        if layer(previous) == layer(definition)
                            || previous_identity.split_once(':').map(|(_, key)| key)
                                != current_identity.split_once(':').map(|(_, key)| key)
                        {
                            return Err(name_conflict(&name, previous, definition));
                        }
                    }
                    fixed.insert(name, definition);
                }
            }
            "static" => {
                if let Some(name) = definition["name"].as_str() {
                    fixed.insert(name.to_owned(), definition);
                }
            }
            _ => {}
        }
    }
    for (name, definition) in raw {
        if let Some(previous) = fixed.get(&name) {
            return Err(name_conflict(&name, previous, definition));
        }
    }
    Ok(())
}

fn name_conflict(name: &str, previous: &Value, definition: &Value) -> CompilerError {
    let source = |definition: &Value| {
        serde_json::from_value::<mastercss_schema::CssDirectiveSourceReference>(
            definition["source"].clone(),
        )
        .ok()
    };
    let location = |definition: &Value| {
        source(definition)
            .map(|source| {
                format!(
                    "{}:{}..{}",
                    source.file.as_deref().unwrap_or("manifest.css"),
                    source.range.start,
                    source.range.end
                )
            })
            .unwrap_or_else(|| {
                definition["name"]
                    .as_str()
                    .unwrap_or("manifest utility")
                    .to_owned()
            })
    };
    let current = source(definition);
    CompilerError::DirectiveDiagnostic {
        code: mastercss_schema::ErrorCode::UtilityNameConflict,
        message: format!(
            "Conflicting utility entry {name}: {} and {}; choose distinct entry names",
            location(previous),
            location(definition)
        ),
        filename: current
            .as_ref()
            .and_then(|source| source.file.clone())
            .unwrap_or_else(|| "manifest.css".into()),
        range: current.map(|source| source.range),
    }
}
