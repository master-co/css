use super::variables::{compile_variables, manifest_error, push_unique};
use super::{
    CompileManifestOptions, CompileManifestResult, CompilerError, CssDirectiveManifestInput,
    MasterCssManifest, Value,
};
use mastercss_schema::{
    ManifestVariable, Record, flatten_variables, group_variables, variable_name,
};
use std::collections::hash_map::Entry;
use std::collections::{HashMap, HashSet};

/// Parses and validates a manifest a request supplies.
pub(crate) fn parse_manifest(manifest: &Value) -> Result<MasterCssManifest, CompilerError> {
    MasterCssManifest::new(manifest.clone()).map_err(|error| manifest_error(error.to_string()))
}

/// Base definitions followed by `next`, where a definition replaces the last base
/// one with its key in place; `None` when there are none.
fn merge_by<T: Clone>(
    base: Option<&[T]>,
    next: Option<Vec<T>>,
    key: impl Fn(&T) -> String,
) -> Option<Vec<T>> {
    let mut merged = base.map(<[T]>::to_vec).unwrap_or_default();
    // Replace the last effective base definition, including manifests containing
    // repeated registrations. Final normalization removes shadowed entries.
    let mut slots = HashMap::new();
    for (index, existing) in merged.iter().enumerate() {
        slots.insert(key(existing), index);
    }
    for value in next.into_iter().flatten() {
        match slots.entry(key(&value)) {
            Entry::Occupied(slot) => merged[*slot.get()] = value,
            Entry::Vacant(slot) => {
                slot.insert(merged.len());
                merged.push(value);
            }
        }
    }
    (!merged.is_empty()).then_some(merged)
}

/// Base entries, each replaced in place by the entry of `next` with its name,
/// followed by the other entries of `next`; `None` when there are none.
fn merge_records<R: Clone + Default + IntoIterator + Extend<R::Item>>(
    base: Option<&R>,
    next: Option<R>,
    is_empty: impl Fn(&R) -> bool,
) -> Option<R> {
    let mut merged = base.cloned().unwrap_or_default();
    merged.extend(next.into_iter().flatten());
    (!is_empty(&merged)).then_some(merged)
}

fn merge_variables(
    base: Option<&Record<Vec<ManifestVariable>>>,
    next: Option<Record<Vec<ManifestVariable>>>,
) -> Option<Record<Vec<ManifestVariable>>> {
    let mut merged = flatten_variables(base.cloned().unwrap_or_default());
    let mut slots = merged
        .iter()
        .enumerate()
        .filter_map(|(index, variable)| Some((variable.name.clone()?, index)))
        .collect::<HashMap<_, _>>();
    for variable in flatten_variables(next.unwrap_or_default()) {
        let name = variable.name.clone().unwrap_or_default();
        let Some(&index) = slots.get(&name) else {
            slots.insert(name, merged.len());
            merged.push(variable);
            continue;
        };
        let previous = &mut merged[index];
        // Re-declared values replace identical base values, matching theme rules.
        previous
            .values
            .retain(|value| !variable.values.contains(value));
        previous.values.extend(variable.values);
        let dependencies = previous.dependencies.get_or_insert_default();
        for dependency in variable.dependencies.into_iter().flatten() {
            push_unique(dependencies, dependency);
        }
        if previous.numeric != variable.numeric {
            previous.numeric = None;
        }
        if previous.variable_type != variable.variable_type {
            previous.variable_type = Some("string".into());
        }
    }
    group_variables(merged)
}

fn merge_manifest(
    base: Option<&MasterCssManifest>,
    fragment: MasterCssManifest,
) -> MasterCssManifest {
    let Some(base) = base else {
        return fragment;
    };
    // A fragment may re-declare base theme rules, such as a project entry importing
    // the preset already supplied as the default build manifest. An earlier
    // identical rule never wins the cascade, so the later declaration replaces it.
    let fragment_theme = fragment.theme.unwrap_or_default();
    let mut theme = base
        .theme
        .iter()
        .flatten()
        .filter(|node| !fragment_theme.contains(node))
        .cloned()
        .collect::<Vec<_>>();
    theme.extend(fragment_theme);
    // This compilation delivers only its own native keyframes. Base definitions are
    // available on demand; emitted globals tell which ones another output delivers.
    // Frames with relative URLs only resolve beside their own stylesheet.
    let mut keyframes = base
        .keyframes
        .iter()
        .flatten()
        .cloned()
        .map(|mut definition| {
            if definition.native && crate::native_keyframes::has_portable_urls(&definition.text) {
                definition.native = false;
            }
            definition
        })
        .chain(fragment.keyframes.into_iter().flatten())
        .collect::<Vec<_>>();
    let mut seen_keyframes = HashSet::new();
    keyframes.reverse();
    keyframes.retain(|definition| seen_keyframes.insert(definition.id.clone()));
    keyframes.reverse();
    let mut animation_variables = base.animation_variables.clone().unwrap_or_default();
    for (name, values) in fragment.animation_variables.into_iter().flatten() {
        animation_variables
            .get_or_insert_default(name)
            .extend(values);
    }
    MasterCssManifest {
        theme: (!theme.is_empty()).then_some(theme),
        animation_variables: (!animation_variables.is_empty()).then_some(animation_variables),
        keyframes: (!keyframes.is_empty()).then_some(keyframes),
        custom_media: merge_records(
            base.custom_media.as_ref(),
            fragment.custom_media,
            Record::is_empty,
        ),
        variables: merge_variables(base.variables.as_ref(), fragment.variables),
        mixins: merge_by(base.mixins.as_deref(), fragment.mixins, |definition| {
            definition.name.clone()
        }),
        utilities: merge_by(
            base.utilities.as_deref(),
            fragment.utilities,
            mastercss_schema::UtilityDefinition::identity,
        ),
        debug: merge_records(
            base.debug.as_ref(),
            fragment.debug,
            serde_json::Map::is_empty,
        ),
    }
}

pub fn compile_manifest_input(
    input: &CssDirectiveManifestInput,
    options: &CompileManifestOptions,
) -> Result<CompileManifestResult, CompilerError> {
    let base = options
        .base_manifest
        .as_ref()
        .map(parse_manifest)
        .transpose()?;
    Ok(CompileManifestResult {
        manifest: compile_manifest(input, base.as_ref())?.to_value(),
    })
}

/// Compiles `input` onto `base`, which supplies the definitions it may use.
pub(crate) fn compile_manifest(
    input: &CssDirectiveManifestInput,
    base: Option<&MasterCssManifest>,
) -> Result<MasterCssManifest, CompilerError> {
    let registry = crate::custom_media::resolve(input, base)?;
    let fragment = MasterCssManifest {
        theme: input
            .theme
            .as_deref()
            .map(|theme| crate::custom_media::lower_theme(theme, &registry))
            .transpose()?,
        animation_variables: input.animation_variables.as_ref().map(|variables| {
            variables
                .iter()
                .map(|(name, values)| (name.clone(), values.clone()))
                .collect()
        }),
        keyframes: input.keyframes.clone(),
        custom_media: (!registry.is_empty()).then(|| {
            registry
                .iter()
                .map(|(name, query)| (name.clone(), query.clone()))
                .collect()
        }),
        variables: group_variables(compile_variables(input, base)),
        mixins: input.mixins.clone(),
        utilities: input.utilities.clone(),
        debug: None,
    };
    let mut manifest = merge_manifest(base, fragment);
    if let Some(names) = &input.keyframe_safelist {
        for definition in manifest.keyframes.iter_mut().flatten() {
            if names.contains(&definition.name) {
                definition.safelisted = true;
            }
        }
    }
    crate::mixins::resolve_definitions(&mut manifest, &registry)?;
    Ok(manifest)
}

/// Omits the variable names that follow from their namespace and key, the
/// default `string` type, and empty namespace groups.
fn normalize_variables(manifest: &mut MasterCssManifest) {
    let Some(groups) = manifest.variables.take() else {
        return;
    };
    manifest.variables = Some(
        groups
            .into_iter()
            .filter(|(_, variables)| !variables.is_empty())
            .map(|(namespace, mut variables)| {
                for variable in &mut variables {
                    if variable.name.as_deref()
                        == Some(variable_name(&namespace, &variable.key).as_str())
                    {
                        variable.name = None;
                    }
                    if variable.variable_type.as_deref() == Some("string") {
                        variable.variable_type = None;
                    }
                    variable.namespace = None;
                }
                (namespace, variables)
            })
            .collect(),
    );
}

pub fn normalize_manifest_for_json(manifest: &Value) -> Result<Value, CompilerError> {
    let mut manifest = parse_manifest(manifest)?;
    normalize_variables(&mut manifest);
    Ok(manifest.to_value())
}

/// Produces the public default-preset artifact shape.
pub fn normalize_default_manifest_for_json(manifest: &Value) -> Result<Value, CompilerError> {
    let mut manifest = parse_manifest(manifest)?;
    manifest.debug = None;
    for definition in manifest.keyframes.iter_mut().flatten() {
        definition.source = None;
    }
    let utilities = manifest.utilities.iter_mut().flatten();
    for definition in manifest
        .mixins
        .iter_mut()
        .flatten()
        .chain(utilities.map(|definition| &mut definition.recipe))
    {
        crate::mixins::visit_sources(definition, &mut |source| *source = None);
    }
    normalize_variables(&mut manifest);
    Ok(manifest.to_value())
}

/// Reference context supplies definitions, never additional unconditional roots.
/// Local definitions are merged after this view; delivered base roots remain live.
pub(crate) fn reference_context(
    mut resolution: MasterCssManifest,
    base: Option<&MasterCssManifest>,
) -> MasterCssManifest {
    // A referenced stylesheet's safelists are not roots of this stylesheet.
    let base_ids = base
        .and_then(|base| base.keyframes.as_ref())
        .into_iter()
        .flatten()
        .map(|definition| definition.id.as_str())
        .collect::<HashSet<_>>();
    for definition in resolution.keyframes.iter_mut().flatten() {
        if !base_ids.contains(definition.id.as_str()) {
            definition.safelisted = false;
        }
    }
    let mut roots = HashSet::new();
    for (namespace, variables) in base
        .and_then(|base| base.variables.as_ref())
        .into_iter()
        .flatten()
    {
        for variable in variables {
            if variable.values.iter().any(|value| value.is_static) {
                roots.insert(variable.name_in(namespace));
            }
        }
    }
    for (namespace, variables) in resolution.variables.iter_mut().flatten() {
        for variable in variables {
            if !roots.contains(&variable.name_in(namespace)) {
                for value in &mut variable.values {
                    value.is_static = false;
                }
            }
        }
    }
    fn strip(nodes: &mut [mastercss_schema::ThemeNode], roots: &HashSet<String>) {
        for node in nodes {
            match node {
                mastercss_schema::ThemeNode::Rule { children, .. } => strip(children, roots),
                mastercss_schema::ThemeNode::Declaration {
                    name, is_static, ..
                } => {
                    if !roots.contains(name) {
                        *is_static = false;
                    }
                }
            }
        }
    }
    strip(resolution.theme.as_deref_mut().unwrap_or_default(), &roots);
    resolution
}
