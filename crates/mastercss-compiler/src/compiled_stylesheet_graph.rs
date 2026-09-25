use std::collections::{HashMap, HashSet};

use mastercss_schema::{CssDirectiveManifestInput, CssDirectiveStyleDefinition};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use crate::{
    CompileCssDirectivesResult, CompileManifestOptions, CompileNativeCssOptions, CompilerError,
    CssImportGraphRequest, CssStylesheetGraph, CssStylesheetNode, LowerCssDirectivesOptions,
    compile_css_directives, compile_manifest_input, lower_css_directives,
    merge_extraction_policies, resolve_prepared_css_stylesheet_graph,
};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileCssStylesheetGraphRequest {
    pub graph: CssImportGraphRequest,
    #[serde(default)]
    pub utility_sources: Vec<mastercss_schema::CssUtilitySource>,
    /// Final URLs chosen by the host, keyed by source file ID.
    pub urls: HashMap<String, String>,
    /// Supplying this enables strict relocation of every relative resource URL.
    #[serde(default, rename = "resourceURLs")]
    pub resource_urls: Option<HashMap<String, HashMap<String, String>>>,
    /// Standalone assets delivered together in one directory; not inline CSS.
    #[serde(default, rename = "relativeResourceURLs")]
    pub relative_resource_urls: bool,
    #[serde(default)]
    pub classes_by_stylesheet: HashMap<String, Option<Vec<String>>>,
    #[serde(default)]
    pub prune_native_stylesheets: Option<Vec<String>>,
    /// Only these files emit native rules/compose and unresolved external imports.
    /// Local links from suppressed files only retain selected output descendants.
    #[serde(default)]
    pub native_stylesheets: Option<Vec<String>>,
    #[serde(default)]
    pub options: CompileNativeCssOptions,
    #[serde(default)]
    pub base_manifest: Option<Value>,
    #[serde(default)]
    pub resolution_manifest: Option<Value>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompiledCssStylesheet {
    pub id: String,
    pub href: String,
    pub css: String,
    pub output_mappings: Vec<crate::CssOutputMapping>,
    #[serde(rename = "nativeCSS")]
    pub native_css: String,
    #[serde(rename = "generatedCSS")]
    pub generated_css: String,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompiledCssStylesheetGraph {
    pub entry: String,
    pub stylesheets: Vec<CompiledCssStylesheet>,
    pub manifest: Value,
    pub resolution_manifest: Value,
    pub directives: CompileCssDirectivesResult,
}

fn graph_error(filename: &str, message: impl Into<String>) -> CompilerError {
    CompilerError::Import {
        filename: filename.into(),
        message: message.into(),
    }
}

// Concatenated authoring declarations append ordered definitions, merge named
// records, and let the latest settings override earlier settings. Manifest
// normalization and managed dependency resolution still happen in the existing
// compiler, once all imported definitions are available.
fn merge_input(target: &mut Map<String, Value>, next: &CssDirectiveManifestInput) {
    let Value::Object(next) = serde_json::to_value(next).expect("directive input is serializable")
    else {
        unreachable!("directive input is an object")
    };
    for (key, value) in next {
        match (target.get_mut(&key), value) {
            (Some(Value::Array(target)), Value::Array(next)) => target.extend(next),
            (Some(Value::Object(target)), Value::Object(next)) => target.extend(next),
            (_, value) => {
                target.insert(key, value);
            }
        }
    }
}

fn is_managed(definition: &CssDirectiveStyleDefinition) -> bool {
    match definition {
        CssDirectiveStyleDefinition::Native { name, .. }
        | CssDirectiveStyleDefinition::Compose { name, .. } => name.is_some(),
    }
}

fn append_unique(target: &mut Vec<String>, values: &[String]) {
    for value in values {
        if !target.contains(value) {
            target.push(value.clone());
        }
    }
}

/// Compile the whole manifest while retaining native CSS and native @compose
/// output in their original stylesheet scopes. Import conditions belong to those
/// stylesheets; authoring definitions form the graph's shared manifest.
pub fn compile_css_stylesheet_graph(
    request: &CompileCssStylesheetGraphRequest,
) -> Result<CompiledCssStylesheetGraph, CompilerError> {
    let graph = resolve_prepared_css_stylesheet_graph(&request.graph)?;
    if request.relative_resource_urls
        && request
            .urls
            .values()
            .any(|url| !crate::stylesheet_resources::sibling_url(url))
    {
        return Err(graph_error(
            &graph.entry,
            "Relative resources require sibling stylesheet URLs",
        ));
    }
    if !graph.references.is_empty() && request.resolution_manifest.is_none() {
        return Err(graph_error(
            &graph.entry,
            "CSS references require a prepared resolution manifest",
        ));
    }
    let indexes: HashMap<&str, usize> = graph
        .stylesheets
        .iter()
        .enumerate()
        .map(|(index, node)| (node.id.as_str(), index))
        .collect();
    if let Some(selected) = &request.native_stylesheets {
        for id in selected {
            if !indexes.contains_key(id.as_str()) {
                return Err(graph_error(
                    &graph.entry,
                    format!("Unknown native stylesheet: {id}"),
                ));
            }
        }
    }
    let native_stylesheets = request
        .native_stylesheets
        .as_ref()
        .map(|selected| selected.iter().map(String::as_str).collect::<HashSet<_>>());
    for node in &graph.stylesheets {
        for import in &node.imports {
            if let Some(id) = &import.resolved {
                // This graph retains native import topology instead of inlining it.
                // Check all reachable definitions without treating nested native
                // imports as unresolved inline CSS.
                let mut pending = vec![id.as_str()];
                let mut visited = HashSet::new();
                while let Some(child) = pending.pop() {
                    if !visited.insert(child) {
                        continue;
                    }
                    let (_, definitions) = mastercss_lexer::extract_top_level_at_rule_blocks(
                        &request.graph.files[child],
                        &crate::imports::IMPORTED_DEFINITION_DIRECTIVES,
                    );
                    let definitions = definitions
                        .iter()
                        .map(|definition| definition.source.as_str())
                        .collect::<Vec<_>>()
                        .join("\n");
                    crate::imports::imported_css_wrappers(&import.statement, &definitions, child)?;
                    if let Some(index) = indexes.get(child) {
                        pending.extend(
                            graph.stylesheets[*index]
                                .imports
                                .iter()
                                .filter_map(|edge| edge.resolved.as_deref()),
                        );
                    }
                }
            }
        }
    }
    let mut parsed = Vec::with_capacity(graph.stylesheets.len());
    let mut native_slots = Vec::with_capacity(graph.stylesheets.len());
    for node in &graph.stylesheets {
        // Graph discovery removes references, but diagnostics and definition
        // ranges belong to the authored input, before any such removal.
        let original_source = &request.graph.files[&node.id];
        let relocated = request
            .resource_urls
            .as_ref()
            .map(|files| {
                crate::stylesheet_resources::rewrite_css_resources(
                    original_source,
                    &node.id,
                    files.get(&node.id).unwrap_or(&HashMap::new()),
                    request.relative_resource_urls,
                )
            })
            .transpose()?;
        let (mut result, mut slots) = crate::directives::compile_css_directives_with_slots(
            relocated
                .as_ref()
                .map_or(original_source.as_str(), |css| css.source.as_str()),
            &CompileNativeCssOptions {
                from: node.id.clone(),
                preserve_native_css: request.options.preserve_native_css,
                prune_native_css: request
                    .prune_native_stylesheets
                    .as_ref()
                    .map_or(request.options.prune_native_css, |files| {
                        files.contains(&node.id)
                    }),
                preserve_native_source: request.options.preserve_native_source,
                classes: request
                    .classes_by_stylesheet
                    .get(&node.id)
                    .cloned()
                    .unwrap_or_else(|| request.options.classes.clone()),
            },
        )
        .map_err(|error| match &relocated {
            Some(css) => css.restore_error(error),
            None => error,
        })?;
        let mut refined = slots
            .iter()
            .flat_map(|slot| slot.definitions.clone())
            .collect::<Vec<_>>();
        crate::output_mappings::refine_native_declaration_sources(
            relocated
                .as_ref()
                .map_or(original_source.as_str(), |css| css.source.as_str()),
            &mut refined,
        );
        let mut refined = refined.into_iter();
        for definition in slots.iter_mut().flat_map(|slot| &mut slot.definitions) {
            *definition = refined.next().expect("one refined slot definition");
        }
        if let Some(css) = &relocated {
            for definition in &mut result.utility_sources {
                css.restore_reference(original_source, &mut definition.source);
            }
            for mapping in &mut result.native_mappings {
                css.restore_reference(original_source, &mut mapping.source);
            }
            for definition in result.style_definitions.iter_mut().flatten().chain(
                slots
                    .iter_mut()
                    .flat_map(|slot| slot.definitions.iter_mut()),
            ) {
                css.restore_definition(original_source, definition);
            }
        }
        parsed.push(result);
        native_slots.push(slots);
    }

    let mut combined = compile_css_directives("", &request.options)?;
    let mut input = Map::new();
    let mut definitions = Vec::new();
    let mut all_definitions = Vec::new();
    let mut policies = Vec::new();
    // CSS imports precede file declarations. Visit each occurrence in postorder,
    // including repeated imports, rather than using unique-file discovery order.
    let mut work = vec![(indexes[graph.entry.as_str()], false)];
    while let Some((index, exit)) = work.pop() {
        if !exit {
            work.push((index, true));
            work.extend(
                graph.stylesheets[index]
                    .imports
                    .iter()
                    .rev()
                    .filter_map(|edge| edge.resolved.as_deref())
                    .map(|id| (indexes[id], false)),
            );
            continue;
        }
        let result = &parsed[index];
        combined
            .utility_sources
            .extend(result.utility_sources.clone());
        merge_input(&mut input, &result.manifest_input);
        append_unique(&mut combined.class_names, &result.class_names);
        append_unique(&mut combined.native_class_names, &result.native_class_names);
        append_unique(&mut combined.warnings, &result.warnings);
        policies.push(result.extraction_policy.clone());
        let order_offset = all_definitions
            .last()
            .map_or(0, |definition| match definition {
                CssDirectiveStyleDefinition::Native { order, .. }
                | CssDirectiveStyleDefinition::Compose { order, .. } => *order,
            });
        for definition in result.style_definitions.as_deref().unwrap_or_default() {
            let mut definition = definition.clone();
            match &mut definition {
                CssDirectiveStyleDefinition::Native { order, .. }
                | CssDirectiveStyleDefinition::Compose { order, .. } => {
                    *order = order
                        .checked_add(order_offset)
                        .ok_or_else(|| graph_error(&graph.entry, "Too many style definitions"))?
                }
            }
            all_definitions.push(definition.clone());
            if is_managed(&definition) {
                definitions.push(definition);
            }
        }
    }
    combined.manifest_input = serde_json::from_value(Value::Object(input))
        .map_err(|error| graph_error(&graph.entry, error.to_string()))?;
    combined.extraction_policy = merge_extraction_policies(&policies);
    combined.dependencies = graph
        .stylesheets
        .iter()
        .map(|node| node.id.clone())
        .collect();
    combined.references = (!graph.references.is_empty()).then(|| graph.references.clone());
    combined.style_definitions = (!all_definitions.is_empty()).then_some(all_definitions);
    let lowered = lower_css_directives(
        &combined.manifest_input,
        &definitions,
        &combined.warnings,
        &LowerCssDirectivesOptions {
            base_manifest: request.base_manifest.clone(),
            resolution_manifest: request.resolution_manifest.clone(),
        },
    )?;
    combined.compositions = lowered.compositions;
    combined.warnings = lowered.warnings;
    // lower_css_directives resolves its own native rules after finalizing managed
    // definitions, but its resolution_manifest field predates that finalization.
    // The next per-file lowering pass needs all finalized managed definitions.
    let resolution_manifest = compile_manifest_input(
        &lowered.input,
        &CompileManifestOptions {
            base_manifest: request
                .resolution_manifest
                .clone()
                .or_else(|| request.base_manifest.clone()),
        },
    )?
    .manifest;

    let mut generated = Vec::new();
    let mut raw_sources = Vec::new();
    let mut provenance_engine = None;
    for ((node, result), slots) in graph.stylesheets.iter().zip(&parsed).zip(&native_slots) {
        let emit_native = native_stylesheets
            .as_ref()
            .is_none_or(|selected| selected.contains(node.id.as_str()));
        let mut replacements = Vec::new();
        for slot in slots {
            let native_lowered = lower_css_directives(
                &CssDirectiveManifestInput::default(),
                &slot.definitions,
                &[],
                &LowerCssDirectivesOptions {
                    base_manifest: Some(lowered.manifest.clone()),
                    resolution_manifest: Some(resolution_manifest.clone()),
                },
            )?;
            for mut trace in native_lowered.compositions {
                if provenance_engine.is_none() {
                    provenance_engine = Some(
                        mastercss_engine::EngineSession::create(&resolution_manifest.to_string())
                            .map_err(|error| graph_error(&node.id, error.to_string()))?,
                    );
                }
                crate::lower::inspection::attach_definition_sources(
                    &mut trace,
                    combined.style_definitions.as_deref().unwrap_or_default(),
                    provenance_engine.as_ref().unwrap(),
                )?;
                combined.compositions.push(trace);
            }
            append_unique(&mut combined.warnings, &native_lowered.warnings);
            if emit_native {
                replacements.push((
                    slot.name.clone(),
                    native_lowered.generated_css,
                    native_lowered.generated_mappings,
                ));
            }
        }
        raw_sources.push(
            (emit_native && request.options.preserve_native_css).then_some(&result.native_css),
        );
        generated.push(replacements);
    }
    // An empty import still declares its layer. Suppressed native CSS must not
    // retain that observable effect unless the edge reaches selected output.
    // Propagate actual output to ancestors once; preserve all authored imports
    // for files whose raw native CSS was explicitly selected.
    let mut needed = vec![false; graph.stylesheets.len()];
    let mut parents = vec![Vec::new(); graph.stylesheets.len()];
    let mut pending = Vec::new();
    for (index, node) in graph.stylesheets.iter().enumerate() {
        needed[index] = raw_sources[index].is_some_and(|css| !css.is_empty())
            || generated[index].iter().any(|(_, css, _)| !css.is_empty());
        if needed[index] {
            pending.push(index);
        }
        for target in node
            .imports
            .iter()
            .filter_map(|edge| edge.resolved.as_deref())
        {
            parents[indexes[target]].push(index);
        }
    }
    while let Some(index) = pending.pop() {
        for &parent in &parents[index] {
            if !needed[parent] {
                needed[parent] = true;
                pending.push(parent);
            }
        }
    }
    let mut output_graph = CssStylesheetGraph {
        stylesheets: Vec::new(),
        ..graph.clone()
    };
    let mut native_mappings = HashMap::new();
    for (index, node) in graph.stylesheets.iter().enumerate() {
        let source = if let Some(raw) = raw_sources[index] {
            native_mappings.insert(node.id.clone(), parsed[index].native_mappings.clone());
            raw.clone()
        } else {
            let imports = node
                .imports
                .iter()
                .filter(|edge| {
                    edge.resolved
                        .as_deref()
                        .is_some_and(|id| needed[indexes[id]])
                })
                .map(|edge| edge.statement.as_str())
                .collect::<Vec<_>>()
                .join("\n");
            // The parser retains the actual enclosing containers when native
            // CSS is disabled. Rebuilding only bare markers loses conditions
            // and anonymous-layer identity.
            let template = if generated[index].is_empty() {
                ""
            } else {
                &parsed[index].native_css
            };
            let shift = imports.encode_utf16().count() as u32;
            if !template.is_empty() {
                native_mappings.insert(
                    node.id.clone(),
                    parsed[index]
                        .native_mappings
                        .iter()
                        .cloned()
                        .map(|mut mapping| {
                            mapping.generated_start += shift;
                            mapping.generated_end = mapping.generated_end.map(|end| end + shift);
                            mapping
                        })
                        .collect(),
                );
            }
            format!("{imports}{template}")
        };
        let mut imports = crate::stylesheet_graph::source_imports(&source, &node.id)?;
        for edge in &mut imports {
            edge.resolved = node
                .imports
                .iter()
                .find(|authored| authored.specifier == edge.specifier)
                .and_then(|authored| authored.resolved.clone());
        }
        output_graph.stylesheets.push(CssStylesheetNode {
            id: node.id.clone(),
            source,
            imports,
        });
    }
    let mut reachable = HashSet::new();
    let mut pending = vec![graph.entry.as_str()];
    while let Some(id) = pending.pop() {
        if reachable.insert(id) {
            pending.extend(
                output_graph.stylesheets[indexes[id]]
                    .imports
                    .iter()
                    .filter_map(|edge| edge.resolved.as_deref()),
            );
        }
    }
    let assets = crate::stylesheet_graph::render_css_stylesheet_graph_mapped(
        &output_graph,
        &request.urls,
        &native_mappings,
    )?;
    let mut stylesheets = assets
        .into_iter()
        .zip(generated)
        .map(|((asset, mappings), replacements)| {
            let by_name = replacements
                .iter()
                .map(|(name, text, maps)| (name.as_str(), (text, maps)))
                .collect::<HashMap<_, _>>();
            let mut edits = Vec::new();
            let mut empty_edits = Vec::new();
            let mut previous_byte = 0;
            let mut previous_offset = 0;
            for token in mastercss_lexer::tokenize_css_syntax(&asset.css) {
                let mastercss_lexer::CssSyntaxKind::AtKeyword(name) = token.kind else {
                    continue;
                };
                let Some((text, maps)) = by_name.get(name.as_ref()) else {
                    continue;
                };
                let marker = format!("@{name};");
                let start_byte = token.bytes.start;
                let end_byte = start_byte + marker.len();
                if asset.css.get(start_byte..end_byte) != Some(marker.as_str()) {
                    return Err(graph_error(&asset.id, "Compiled compose slot was altered"));
                }
                let start = previous_offset
                    + asset.css[previous_byte..start_byte].encode_utf16().count() as u32;
                let end = start + marker.encode_utf16().count() as u32;
                previous_byte = end_byte;
                previous_offset = end;
                edits.push(crate::output_edits::OutputEdit {
                    start,
                    end,
                    text: (*text).clone(),
                    mappings: (*maps).clone(),
                });
                empty_edits.push(crate::output_edits::OutputEdit {
                    start,
                    end,
                    text: String::new(),
                    mappings: Vec::new(),
                });
            }
            if edits.len() != replacements.len() {
                return Err(graph_error(&asset.id, "Compiled compose slots were lost"));
            }
            let (css, output_mappings) =
                crate::output_edits::apply_output_edits(&asset.css, &mappings, edits, &asset.id)?;
            let (native_css, _) =
                crate::output_edits::apply_output_edits(&asset.css, &[], empty_edits, &asset.id)?;
            Ok(CompiledCssStylesheet {
                id: asset.id,
                href: asset.href,
                css,
                output_mappings,
                native_css,
                generated_css: replacements
                    .into_iter()
                    .map(|(_, text, _)| text)
                    .filter(|text| !text.is_empty())
                    .collect::<Vec<_>>()
                    .join("\n"),
            })
        })
        .collect::<Result<Vec<_>, CompilerError>>()?;
    let entry = &stylesheets[indexes[graph.entry.as_str()]];
    combined
        .utility_sources
        .splice(0..0, request.utility_sources.clone());
    for trace in &mut combined.compositions {
        crate::utility_sources::attach(trace, &combined.utility_sources);
    }
    combined.css = entry.css.clone();
    combined.native_css = entry.native_css.clone();
    combined.generated_css = entry.generated_css.clone();
    stylesheets.retain(|sheet| reachable.contains(sheet.id.as_str()));
    Ok(CompiledCssStylesheetGraph {
        entry: graph.entry,
        stylesheets,
        manifest: lowered.manifest,
        resolution_manifest,
        directives: combined,
    })
}
