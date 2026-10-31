use super::{CompilerError, CssDirectiveManifestInput, EngineSession};
use mastercss_schema::{EmittedGlobals, MasterCssManifest, MixinDefinition, MixinNode};

pub(crate) fn directive_error(message: impl Into<String>) -> CompilerError {
    CompilerError::Directive {
        message: message.into(),
        filename: "manifest.css".into(),
        range: None,
    }
}

pub(crate) fn engine_for_manifest(
    manifest: &MasterCssManifest,
) -> Result<EngineSession, CompilerError> {
    EngineSession::from_parsed_manifest(manifest, EmittedGlobals::default())
        .map_err(|error| directive_error(error.to_string()))
}

/// The resolution mixins that `input` delivers: its own, and those its mixins and
/// utilities apply, transitively; `None` when there are none.
pub(super) fn delivered_mixins(
    input: &CssDirectiveManifestInput,
    resolution: &MasterCssManifest,
) -> Option<Vec<MixinDefinition>> {
    let local = input.mixins.as_deref().unwrap_or_default();
    let definitions = resolution.mixins.as_deref().unwrap_or_default();
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
        return None;
    }
    loop {
        let before = needed.len();
        for definition in definitions {
            if needed.contains(&definition.name) {
                dependencies(&definition.body, &mut needed);
            }
        }
        if needed.len() == before {
            break;
        }
    }
    Some(
        definitions
            .iter()
            .filter(|item| needed.contains(&item.name))
            .cloned()
            .collect(),
    )
}
