use super::{
    CompileManifestOptions, CompilerError, CssDirectiveConditionPathEntry,
    CssDirectiveManifestInput, CssDirectiveSourceReference, DeclarationBlock,
    EngineCompositionRuleIr, EngineSession, ErrorCode, Length, LengthPercentageOrAuto, Map, Parse,
    ParserOptions, Property, ResolvedStyleBranch, UtilityLayerName, Value, compile_manifest_input,
    json,
};

pub(super) fn directive_error(message: impl Into<String>) -> CompilerError {
    CompilerError::Directive {
        message: message.into(),
        filename: "manifest.css".into(),
        range: None,
    }
}

pub(super) fn directive_diagnostic(
    code: ErrorCode,
    message: impl Into<String>,
    source: Option<&CssDirectiveSourceReference>,
) -> CompilerError {
    CompilerError::DirectiveDiagnostic {
        code,
        message: message.into(),
        filename: source
            .and_then(|source| source.file.clone())
            .unwrap_or_else(|| "manifest.css".into()),
        range: source.map(|source| source.range.clone()),
    }
}

pub(super) fn engine_for_manifest(manifest: &Value) -> Result<EngineSession, CompilerError> {
    let json = serde_json::to_string(manifest)
        .map_err(|error| directive_error(format!("Cannot serialize compiler manifest: {error}")))?;
    EngineSession::create(&json).map_err(|error| directive_error(error.to_string()))
}

pub(super) fn compile_with_base(
    input: &CssDirectiveManifestInput,
    base_manifest: Option<Value>,
) -> Result<Value, CompilerError> {
    compile_manifest_input(input, &CompileManifestOptions { base_manifest })
        .map(|result| result.manifest)
}

pub(super) fn condition_path(
    value: &Map<String, Value>,
) -> Result<Vec<CssDirectiveConditionPathEntry>, CompilerError> {
    if let Some(path) = value.get("conditionPath") {
        return serde_json::from_value(path.clone()).map_err(|error| {
            directive_error(format!("Invalid directive condition path: {error}"))
        });
    }
    Ok(value
        .get("conditions")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(Value::as_str)
        .map(|value| CssDirectiveConditionPathEntry::Condition {
            value: value.into(),
        })
        .collect())
}

pub(super) fn combine_selector_wrapper(selector: &str, wrapper: &str) -> String {
    wrapper.replace('&', selector)
}

pub(super) fn split_selector_list(selector: &str) -> Vec<String> {
    let mut selectors = Vec::new();
    let mut start = 0;
    let mut quote = None;
    let mut escaped = false;
    let mut depth = 0_u32;
    for (index, character) in selector.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if character == '\\' {
            escaped = true;
            continue;
        }
        if let Some(current_quote) = quote {
            if character == current_quote {
                quote = None;
            }
            continue;
        }
        if matches!(character, '\'' | '"') {
            quote = Some(character);
        } else if matches!(character, '(' | '[') {
            depth += 1;
        } else if matches!(character, ')' | ']') {
            depth = depth.saturating_sub(1);
        } else if character == ',' && depth == 0 {
            let value = selector[start..index].trim();
            if !value.is_empty() {
                selectors.push(value.into());
            }
            start = index + 1;
        }
    }
    let value = selector[start..].trim();
    if !value.is_empty() {
        selectors.push(value.into());
    }
    selectors
}

pub(super) fn combine_style_selectors(parent: &str, child: &str) -> String {
    let parents = split_selector_list(parent);
    let children = split_selector_list(child);
    let mut selectors = Vec::new();
    for child in children {
        for parent in &parents {
            selectors.push(if child.contains('&') {
                child.replace('&', parent)
            } else {
                format!("{parent} {child}")
            });
        }
    }
    selectors.join(",")
}

pub(super) fn composition_rules(
    engine: &mut EngineSession,
    class_name: &str,
) -> Result<Vec<EngineCompositionRuleIr>, CompilerError> {
    let candidates = engine
        .native_declaration_candidates([class_name])
        .map_err(|error| directive_error(error.to_string()))?;
    if !candidates.is_empty() {
        let supported = candidates
            .iter()
            .map(|candidate| {
                if candidate.property.starts_with("--") {
                    return true;
                }
                let accepts_unparsed = || {
                    let value = candidate.value.trim();
                    matches!(
                        value,
                        "initial" | "inherit" | "unset" | "revert" | "revert-layer"
                    ) || ["var(", "env(", "attr("]
                        .iter()
                        .any(|function| value.contains(function))
                        || ((value.starts_with('\'') && value.ends_with('\''))
                            || (value.starts_with('"') && value.ends_with('"')))
                        || (candidate.property == "content" && matches!(value, "normal" | "none"))
                        || (candidate.property == "text-underline-offset"
                            && LengthPercentageOrAuto::parse_string(value).is_ok())
                        || (candidate.property == "outline-offset"
                            && Length::parse_string(value).is_ok())
                        || (candidate.property == "contain"
                            && value.split_whitespace().all(|keyword| {
                                matches!(
                                    keyword,
                                    "none"
                                        | "strict"
                                        | "content"
                                        | "size"
                                        | "inline-size"
                                        | "layout"
                                        | "style"
                                        | "paint"
                                )
                            }))
                };
                let declaration_source = format!("{}:{}", candidate.property, candidate.value);
                let Ok(block) =
                    DeclarationBlock::parse_string(&declaration_source, ParserOptions::default())
                else {
                    return accepts_unparsed();
                };
                block.declarations.len() == 1
                    && block
                        .declarations
                        .iter()
                        .all(|declaration| match declaration {
                            Property::Unparsed(_) => accepts_unparsed(),
                            Property::Custom(_) => accepts_unparsed(),
                            _ => true,
                        })
            })
            .collect::<Vec<_>>();
        engine
            .ensure_class_rules_with_native_support([class_name], &supported)
            .map_err(|error| directive_error(error.to_string()))?;
    }
    engine
        .composition_rules(class_name)
        .map_err(|error| directive_error(error.to_string()))
}

pub(super) fn resolve_configured_branches(
    path: &[CssDirectiveConditionPathEntry],
    engine: &mut EngineSession,
    selector: &str,
    layer: Option<UtilityLayerName>,
) -> Result<Vec<ResolvedStyleBranch>, CompilerError> {
    let mut branches = vec![ResolvedStyleBranch {
        selector: selector.into(),
        conditions: Vec::new(),
        layer,
    }];
    for entry in path {
        match entry {
            CssDirectiveConditionPathEntry::Condition { value } => {
                for branch in &mut branches {
                    branch.conditions.push(value.clone());
                }
            }
            CssDirectiveConditionPathEntry::Variant { token } => {
                if !token.starts_with(':') && !token.starts_with('@') {
                    return Err(directive_error(format!(
                        "@variant requires a full variant token: {token}"
                    )));
                }
                let resolved = composition_rules(engine, &format!("display:block{token}"))?;
                if resolved.is_empty() {
                    return Err(directive_error(format!("Unknown @variant token: {token}")));
                }
                branches = branches
                    .into_iter()
                    .flat_map(|branch| {
                        resolved.iter().filter_map(move |resolved| {
                            let resolved_layer = resolved.explicit_layer;
                            if branch.layer.is_some()
                                && resolved_layer.is_some()
                                && branch.layer != resolved_layer
                            {
                                return None;
                            }
                            let mut conditions = branch.conditions.clone();
                            conditions.extend(resolved.conditions.clone());
                            Some(ResolvedStyleBranch {
                                selector: combine_selector_wrapper(
                                    &branch.selector,
                                    &resolved.selector,
                                ),
                                conditions,
                                layer: resolved_layer.or(branch.layer),
                            })
                        })
                    })
                    .collect();
                if branches.is_empty() {
                    return Err(directive_error(format!(
                        "@variant {token} cannot assign multiple layers"
                    )));
                }
            }
        }
    }
    for branch in &mut branches {
        branch.selector = engine
            .resolve_style_selector(&branch.selector)
            .map_err(|error| directive_error(error.to_string()))?;
    }
    Ok(branches)
}

pub(super) fn value_object(value: &Value) -> Result<&Map<String, Value>, CompilerError> {
    value
        .as_object()
        .ok_or_else(|| directive_error("CSS directive utility definition must be an object"))
}

pub(super) fn finalize_utility_definitions(
    input: &mut CssDirectiveManifestInput,
    engine: &mut EngineSession,
) -> Result<(), CompilerError> {
    let Some(utilities) = input.utilities.as_mut() else {
        return Ok(());
    };
    for utility in utilities {
        let definition = utility
            .as_object_mut()
            .ok_or_else(|| directive_error("CSS directive utility definition must be an object"))?;
        let definition_path = condition_path(definition)?;
        let definition_has_variants = definition_path
            .iter()
            .any(|entry| matches!(entry, CssDirectiveConditionPathEntry::Variant { .. }));
        if definition_has_variants {
            if let Some(declarations) = definition.shift_remove("declarations") {
                let rules = definition
                    .entry("rules")
                    .or_insert_with(|| Value::Array(Vec::new()))
                    .as_array_mut()
                    .ok_or_else(|| directive_error("Managed utility rules must be an array"))?;
                rules.push(json!({
                    "declarations": declarations,
                    "conditionPath": definition_path
                }));
            }
            definition.shift_remove("conditions");
            definition.shift_remove("conditionPath");
        }
        let Some(rules) = definition.shift_remove("rules") else {
            continue;
        };
        let mut resolved_rules = Vec::new();
        for rule in rules
            .as_array()
            .ok_or_else(|| directive_error("Managed utility rules must be an array"))?
        {
            let rule = value_object(rule)?;
            let declarations = rule
                .get("declarations")
                .and_then(Value::as_object)
                .cloned()
                .ok_or_else(|| directive_error("Managed utility rule requires declarations"))?;
            let selector = rule.get("selector").and_then(Value::as_str).unwrap_or("&");
            for branch in
                resolve_configured_branches(&condition_path(rule)?, engine, selector, None)?
            {
                let mut output = Map::new();
                output.insert("declarations".into(), Value::Object(declarations.clone()));
                if branch.selector != "&" {
                    output.insert("selector".into(), Value::String(branch.selector));
                }
                if !branch.conditions.is_empty() {
                    output.insert(
                        "conditions".into(),
                        Value::Array(branch.conditions.into_iter().map(Value::String).collect()),
                    );
                }
                resolved_rules.push(Value::Object(output));
            }
        }
        if !resolved_rules.is_empty() {
            definition.insert("rules".into(), Value::Array(resolved_rules));
        }
    }
    Ok(())
}
