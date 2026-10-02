use super::{
    CompileManifestOptions, CompilerError, CssDirectiveConditionPathEntry,
    CssDirectiveManifestInput, EngineSession, ResolvedStyleBranch, UtilityLayerName, Value,
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
    let local = input.mixins.as_deref().unwrap_or_default();
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
                MixinNode::Apply { name, contents, .. } => {
                    needed.insert(name.clone());
                    if let Some(body) = contents {
                        dependencies(body, needed);
                    }
                }
                MixinNode::Rule { body, .. }
                | MixinNode::Condition { body, .. }
                | MixinNode::Contents { fallback: body } => dependencies(body, needed),
                _ => {}
            }
        }
    }
    for utility in input.utilities.iter().flatten() {
        dependencies(&utility.recipe.body, &mut needed);
    }
    if needed.is_empty() {
        return Ok(None);
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

pub(super) fn resolve_configured_branches(
    path: &[CssDirectiveConditionPathEntry],
    engine: &mut EngineSession,
    selector: &str,
    _layer: Option<UtilityLayerName>,
) -> Result<Vec<ResolvedStyleBranch>, CompilerError> {
    let mut branches = vec![ResolvedStyleBranch {
        selector: selector.into(),
        conditions: Vec::new(),
    }];
    for entry in path {
        match entry {
            CssDirectiveConditionPathEntry::Condition { value } => {
                for branch in &mut branches {
                    branch.conditions.push(value.clone());
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
