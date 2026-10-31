use super::merge::create_merged_style_definitions;
use super::render::render_style_definitions;
use super::resolution::engine_for_manifest;
use super::{
    CompilerError, CssDirectiveManifestInput, CssDirectiveStyleDefinition, EngineSession,
    LowerCssDirectivesOptions, LowerCssDirectivesRequest, LowerCssDirectivesResult,
};
use crate::manifest::{compile_manifest, parse_manifest, reference_context};
use mastercss_schema::MasterCssManifest;

/// The delivered and resolution manifests a compilation lowers to, before any CSS
/// renders, with its warnings.
pub(crate) struct LoweredManifests {
    pub manifest: MasterCssManifest,
    pub resolution_manifest: MasterCssManifest,
    pub warnings: Vec<String>,
}

pub(crate) fn lower_manifests(
    input: &CssDirectiveManifestInput,
    initial_warnings: &[String],
    options: &LowerCssDirectivesOptions,
) -> Result<LoweredManifests, CompilerError> {
    let base = options
        .base_manifest
        .as_ref()
        .map(parse_manifest)
        .transpose()?;
    let reference = options
        .resolution_manifest
        .as_ref()
        .map(|manifest| Ok(reference_context(parse_manifest(manifest)?, base.as_ref())))
        .transpose()?;
    let resolution_manifest = compile_manifest(input, reference.as_ref().or(base.as_ref()))?;
    let manifest = match reference {
        Some(reference) if Some(&reference) != base.as_ref() => {
            // Resolve local bodies against reference definitions before removing
            // reference-only registrations from the delivered manifest.
            let mut delivered = input.clone();
            delivered.mixins = super::resolution::delivered_mixins(input, &resolution_manifest);
            let mut manifest = compile_manifest(&delivered, base.as_ref())?;
            if let Some(keyframes) = &resolution_manifest.keyframes {
                manifest.keyframes = Some(keyframes.clone());
            }
            manifest
        }
        _ => resolution_manifest.clone(),
    };
    let mut warnings = initial_warnings.to_vec();
    for name in input.keyframe_safelist.iter().flatten() {
        if !resolution_manifest
            .keyframes
            .iter()
            .flatten()
            .any(|definition| definition.name == *name)
        {
            warnings.push(format!(
                "Unknown keyframes name in @safelist keyframes: {name}"
            ));
        }
    }
    Ok(LoweredManifests {
        manifest,
        resolution_manifest,
        warnings,
    })
}

/// Renders native style definitions, expanding their `@apply` applications with
/// `engine`, which executes the resolution manifest.
pub(crate) fn render_definitions(
    definitions: &[CssDirectiveStyleDefinition],
    engine: &EngineSession,
) -> Result<(String, Vec<crate::CssOutputMapping>), CompilerError> {
    Ok(render_style_definitions(create_merged_style_definitions(
        definitions,
        engine,
    )?))
}

pub fn lower_css_directives(
    input: &CssDirectiveManifestInput,
    style_definitions: &[CssDirectiveStyleDefinition],
    initial_warnings: &[String],
    options: &LowerCssDirectivesOptions,
) -> Result<LowerCssDirectivesResult, CompilerError> {
    lower(
        input,
        style_definitions,
        initial_warnings,
        None,
        Vec::new(),
        options,
    )
}

pub fn lower_css_directives_request(
    request: &LowerCssDirectivesRequest,
    options: &LowerCssDirectivesOptions,
) -> Result<LowerCssDirectivesResult, CompilerError> {
    let mut definition_sources = request.definition_sources.clone();
    crate::definition_sources::resolve(&mut definition_sources);
    lower(
        &request.manifest_input,
        &request.style_definitions,
        &request.warnings,
        request.native_output.as_ref(),
        definition_sources,
        options,
    )
}

/// Lowers a compilation and renders its style definitions, and its native output
/// when it has one, with one engine, which executes the resolution manifest.
fn lower(
    input: &CssDirectiveManifestInput,
    style_definitions: &[CssDirectiveStyleDefinition],
    initial_warnings: &[String],
    native_output: Option<&crate::NativeCssOutput>,
    definition_sources: Vec<mastercss_schema::CssDefinitionSource>,
    options: &LowerCssDirectivesOptions,
) -> Result<LowerCssDirectivesResult, CompilerError> {
    let LoweredManifests {
        mut manifest,
        mut resolution_manifest,
        warnings,
    } = lower_manifests(input, initial_warnings, options)?;
    let engine = engine_for_manifest(&resolution_manifest)?;
    let (generated_css, generated_mappings) = render_definitions(style_definitions, &engine)?;
    crate::keyframes::include_native_variables(&mut manifest, &generated_css);
    let (css, output_mappings) = match native_output {
        Some(output) => {
            let (css, mappings) =
                super::output::assemble_native_output(output, &engine, &resolution_manifest)?;
            crate::keyframes::include_native_variables(&mut manifest, &css);
            crate::keyframes::include_native_variables(&mut resolution_manifest, &css);
            (Some(css), mappings)
        }
        None => (None, Vec::new()),
    };
    let notices = match &css {
        Some(css) => {
            crate::keyframes::native_notices(css, "stylesheet.css", &engine, &output_mappings)
        }
        None => crate::keyframes::native_notices(
            &generated_css,
            "stylesheet.css",
            &engine,
            &generated_mappings,
        ),
    };
    Ok(LowerCssDirectivesResult {
        notices,
        definition_sources,
        css,
        output_mappings,
        input: input.clone(),
        manifest: manifest.to_value(),
        resolution_manifest: resolution_manifest.to_value(),
        warnings,
        generated_css,
        generated_mappings,
    })
}
