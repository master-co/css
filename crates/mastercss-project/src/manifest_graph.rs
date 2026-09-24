use std::collections::HashMap;
use std::path::{Path, PathBuf};

use mastercss_compiler::{
    CompileCssStylesheetGraphInput, CompileCssStylesheetGraphRequest, CompileNativeCssOptions,
    CompiledCssStylesheetGraph, CompilerError, CssImportGraphRequest, LowerCssDirectivesOptions,
    analyze_standalone_directives, compile_css_stylesheet_graph_input, lower_css_directives,
    resolve_prepared_css_stylesheet_graph,
};
use mastercss_schema::{CssDirectiveManifestInput, CssDirectiveStyleDefinition};
use serde_json::Value;

use super::{push_unique, resolve_source_pattern};

fn error(file: &str, message: impl Into<String>) -> CompilerError {
    CompilerError::Import {
        filename: file.into(),
        message: message.into(),
    }
}

/// Manifest-only project loading preserves source boundaries. The caller supplies
/// resolved import/reference edges; CSS semantics and manifest merging stay here.
pub(super) fn compile_manifest_graph(
    request: &CssImportGraphRequest,
    base_manifest: Value,
    project_dir: &Path,
    stack: &[String],
) -> Result<CompiledCssStylesheetGraph, CompilerError> {
    compile_manifest_graph_with_output(request, base_manifest, project_dir, stack, false)
}

pub(super) fn compile_manifest_graph_with_output(
    request: &CssImportGraphRequest,
    base_manifest: Value,
    project_dir: &Path,
    stack: &[String],
    emit_native_compose: bool,
) -> Result<CompiledCssStylesheetGraph, CompilerError> {
    let graph = resolve_prepared_css_stylesheet_graph(request)?;
    let mut stack = stack.to_vec();
    stack.push(request.entry.clone());
    let mut reference_manifest = None;
    let mut reference_dependencies = Vec::new();
    let mut reference_warnings = Vec::new();
    for reference in &graph.references {
        let from = reference.file.as_deref().unwrap_or(&request.entry);
        let target = request
            .edges
            .iter()
            .find(|edge| edge.from == from && edge.specifier == reference.source)
            .ok_or_else(|| {
                error(
                    from,
                    format!("Unresolved CSS reference: {}", reference.source),
                )
            })?;
        if stack.contains(&target.resolved) || target.resolved == from {
            return Err(error(
                from,
                format!("Circular CSS reference: {}", target.resolved),
            ));
        }
        let mut referenced = request.clone();
        referenced.entry = target.resolved.clone();
        let mut chain = stack.clone();
        if !chain.iter().any(|item| item == from) {
            chain.push(from.into());
        }
        let result = compile_manifest_graph(
            &referenced,
            reference_manifest
                .take()
                .unwrap_or_else(|| base_manifest.clone()),
            project_dir,
            &chain,
        )?;
        reference_manifest = Some(result.manifest);
        push_unique(&mut reference_dependencies, result.directives.dependencies);
        push_unique(&mut reference_warnings, result.directives.warnings);
    }
    // No stylesheet assets are delivered by the manifest-only API. Internal
    // URLs satisfy the shared graph renderer without fetching external CSS.
    let urls = graph
        .stylesheets
        .iter()
        .enumerate()
        .map(|(index, node)| (node.id.clone(), format!("./manifest-{index}.css")))
        .collect::<HashMap<_, _>>();
    let mut result = compile_css_stylesheet_graph_input(&CompileCssStylesheetGraphInput {
        host_imports: Default::default(),
        inline_imports: emit_native_compose,
        request: CompileCssStylesheetGraphRequest {
            graph: request.clone(),
            urls,
            resource_urls: None,
            relative_resource_urls: false,
            prune_native_stylesheets: None,
            classes_by_stylesheet: HashMap::new(),
            native_stylesheets: (!emit_native_compose).then(Vec::new),
            options: CompileNativeCssOptions {
                prune_native_css: false,
                from: request.entry.clone(),
                preserve_native_css: false,
                preserve_native_source: false,
                classes: None,
            },
            base_manifest: Some(base_manifest),
            resolution_manifest: reference_manifest,
        },
    })?;
    if emit_native_compose {
        // `css` is positioned delivery output. Preserve the separate legacy
        // generatedCSS metadata view, whose definitions retain individual
        // containers rather than merging anonymous-layer identity.
        let native = result
            .directives
            .style_definitions
            .as_deref()
            .unwrap_or_default()
            .iter()
            .filter(|definition| {
                matches!(
                    definition,
                    CssDirectiveStyleDefinition::Native { name: None, .. }
                        | CssDirectiveStyleDefinition::Compose { name: None, .. }
                )
            })
            .cloned()
            .collect::<Vec<_>>();
        result.directives.generated_css = lower_css_directives(
            &CssDirectiveManifestInput::default(),
            &native,
            &[],
            &LowerCssDirectivesOptions {
                base_manifest: Some(result.manifest.clone()),
                resolution_manifest: Some(result.resolution_manifest.clone()),
            },
        )?
        .generated_css;
        result.directives.native_css.clear();
    }
    push_unique(&mut result.directives.dependencies, reference_dependencies);
    push_unique(&mut result.directives.warnings, reference_warnings);
    // Source patterns belong to their authoring files, including imported files.
    // Reference-only policies must not become the consuming project's sources.
    let mut include = Vec::new();
    let mut exclude = Vec::new();
    for node in graph.stylesheets {
        let owner = Path::new(&node.id)
            .canonicalize()
            .unwrap_or_else(|_| PathBuf::from(&node.id));
        let policy = analyze_standalone_directives(&node.source).extraction_policy;
        push_unique(
            &mut include,
            policy
                .include
                .iter()
                .map(|pattern| resolve_source_pattern(project_dir, &owner, pattern)),
        );
        push_unique(
            &mut exclude,
            policy
                .exclude
                .iter()
                .map(|pattern| resolve_source_pattern(project_dir, &owner, pattern)),
        );
    }
    result.directives.extraction_policy.include = include;
    result.directives.extraction_policy.exclude = exclude;
    Ok(result)
}
