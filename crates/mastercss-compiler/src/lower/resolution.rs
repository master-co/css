use super::{
    CompileManifestOptions, CompilerError, CssDirectiveConditionPathEntry,
    CssDirectiveManifestInput, EngineCompositionRuleIr, EngineSession, ResolvedStyleBranch,
    UtilityLayerName, Value,
};

pub(super) fn directive_error(message: impl Into<String>) -> CompilerError {
    CompilerError::Directive {
        message: message.into(),
        filename: "manifest.css".into(),
        range: None,
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
    crate::manifest::compile_manifest_fragment(input, &CompileManifestOptions { base_manifest })
        .map(|result| result.manifest)
}

pub(super) fn delivered_mixins(
    input: &CssDirectiveManifestInput,
    resolution: &Value,
) -> Result<Option<Vec<mastercss_schema::MixinDefinition>>, CompilerError> {
    use mastercss_schema::{MixinDefinition, MixinNode};
    let Some(local) = &input.mixins else {
        return Ok(None);
    };
    let definitions: Vec<MixinDefinition> = serde_json::from_value(
        resolution
            .get("mixins")
            .cloned()
            .unwrap_or_else(|| serde_json::json!([])),
    )
    .map_err(|error| directive_error(error.to_string()))?;
    let mut needed: std::collections::HashSet<String> =
        local.iter().map(|item| item.name.clone()).collect();
    fn dependencies(nodes: &[MixinNode], needed: &mut std::collections::HashSet<String>) {
        for node in nodes {
            match node {
                MixinNode::Apply { name, .. } => {
                    needed.insert(name.clone());
                }
                MixinNode::Rule { body, .. } | MixinNode::Condition { body, .. } => {
                    dependencies(body, needed)
                }
                _ => {}
            }
        }
    }
    loop {
        let before = needed.len();
        for definition in &definitions {
            if needed.contains(&definition.name) {
                dependencies(&definition.body, &mut needed);
            }
        }
        if needed.len() == before {
            break;
        }
    }
    Ok(Some(
        definitions
            .into_iter()
            .filter(|item| needed.contains(&item.name))
            .collect(),
    ))
}

pub(super) fn combine_selector_wrapper(selector: &str, wrapper: &str) -> String {
    mastercss_lexer::replace_nesting_selector(wrapper, selector).unwrap_or_else(|| wrapper.into())
}

pub(super) fn composition_rules(
    engine: &mut EngineSession,
    class_name: &str,
) -> Result<Vec<EngineCompositionRuleIr>, CompilerError> {
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
                    if engine
                        .has_named_condition(token.trim_start_matches('@'))
                        .map_err(|error| directive_error(error.to_string()))?
                    {
                        return Ok(Vec::new());
                    }
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
