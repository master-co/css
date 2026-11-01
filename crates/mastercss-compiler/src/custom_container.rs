use crate::{CompilerError, CssDirectiveManifestInput};
use mastercss_lexer::tokenize_css_syntax;
use mastercss_schema::{CustomContainerDefinition, MasterCssManifest};
use std::collections::{BTreeMap, HashMap};

/// Expanded container conditions by name; values never reference another name.
pub(crate) type Registry = BTreeMap<String, String>;

pub(crate) fn collect(
    source: &str,
    filename: &str,
) -> Result<(Vec<CustomContainerDefinition>, Vec<std::ops::Range<usize>>), CompilerError> {
    let (definitions, ranges) = crate::custom_media::collect_named(
        source,
        filename,
        "custom-container",
        "container query",
    )?;
    Ok((
        definitions
            .into_iter()
            .map(|(name, query, source)| CustomContainerDefinition {
                name,
                query,
                source,
            })
            .collect(),
        ranges,
    ))
}

pub(crate) fn registry(manifest: Option<&MasterCssManifest>) -> Registry {
    manifest
        .and_then(|manifest| manifest.custom_containers.as_ref())
        .into_iter()
        .flatten()
        .map(|(name, condition)| (name.clone(), condition.clone()))
        .collect()
}

pub(crate) fn resolve(
    input: &CssDirectiveManifestInput,
    base: Option<&MasterCssManifest>,
) -> Result<Registry, CompilerError> {
    let mut resolved = registry(base);
    let mut definitions = HashMap::new();
    for definition in input.custom_containers.iter().flatten() {
        definitions.insert(definition.name.clone(), definition);
    }
    for name in definitions.keys() {
        resolved.remove(name);
    }
    fn visit(
        name: &str,
        definitions: &HashMap<String, &CustomContainerDefinition>,
        resolved: &mut Registry,
        stack: &mut Vec<String>,
    ) -> Result<String, String> {
        if let Some(condition) = resolved.get(name) {
            return Ok(condition.clone());
        }
        if stack.iter().any(|entry| entry == name) {
            return Err(format!(
                "Circular custom container reference: {} -> {name}",
                stack.join(" -> ")
            ));
        }
        let definition = definitions
            .get(name)
            .ok_or_else(|| format!("Undefined custom container {name}"))?;
        if stack.len() >= 128 {
            return Err("Custom container alias chain exceeds 128 levels".into());
        }
        let query = normalize(&definition.query);
        if mastercss_engine::container_name(&tokenize_css_syntax(&query)) {
            return Err(format!(
                "@custom-container {name} defines a condition without a container name; name the container where it is used, such as @container card ({name})"
            ));
        }
        stack.push(name.into());
        let result = mastercss_engine::expand_custom_container_query(&query, &mut |alias| {
            visit(alias, definitions, resolved, stack)
        });
        stack.pop();
        let condition = result?;
        resolved.insert(name.into(), condition.clone());
        Ok(condition)
    }
    // Iterate source order for deterministic diagnostics, skipping superseded definitions.
    for definition in input.custom_containers.iter().flatten() {
        if definitions
            .get(&definition.name)
            .is_some_and(|last| !std::ptr::eq(*last, definition))
        {
            continue;
        }
        visit(
            &definition.name,
            &definitions,
            &mut resolved,
            &mut Vec::new(),
        )
        .map_err(|message| CompilerError::Directive {
            message,
            filename: definition
                .source
                .as_ref()
                .and_then(|source| source.file.clone())
                .unwrap_or_else(|| "manifest.css".into()),
            range: definition
                .source
                .as_ref()
                .map(|source| source.range.clone()),
        })?;
    }
    Ok(resolved)
}

/// A container prelude with its references expanded, or `None` when it has none.
pub(crate) fn lower_prelude(prelude: &str, registry: &Registry) -> Result<Option<String>, String> {
    if mastercss_engine::custom_container_references(prelude).is_empty() {
        return Ok(None);
    }
    mastercss_engine::expand_custom_container_query(prelude, &mut |name| {
        registry
            .get(name)
            .cloned()
            .ok_or_else(|| format!("Undefined custom container {name}"))
    })
    .map(Some)
}

/// Collapses whitespace and comments between tokens into one space, so the
/// stored condition does not depend on how its definition was formatted.
fn normalize(query: &str) -> String {
    let tokens = tokenize_css_syntax(query);
    let mut result = String::with_capacity(query.len());
    let mut previous = None;
    for token in &tokens {
        if let Some(end) = previous
            && end < token.bytes.start
        {
            result.push(' ');
        }
        result.push_str(&query[token.bytes.clone()]);
        previous = Some(token.bytes.end);
    }
    result
}
