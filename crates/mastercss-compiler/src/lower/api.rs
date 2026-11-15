use super::memo::Lowering;
use super::merge::create_merged_style_definitions;
use super::render::render_style_definitions;
use super::{
    CompilerError, CssDirectiveManifestInput, CssDirectiveStyleDefinition, EngineSession,
    LowerCssDirectivesOptions, LowerCssDirectivesRequest, LowerCssDirectivesResult,
};
use crate::manifest::{compile_manifest, reference_context};
use crate::manifest_store::reference_value;
use mastercss_schema::MasterCssManifest;
use std::borrow::Cow;

/// The delivered and resolution manifests a compilation lowers to, before any CSS
/// renders, with its warnings.
pub(crate) struct LoweredManifests {
    pub manifest: MasterCssManifest,
    pub resolution_manifest: MasterCssManifest,
    pub warnings: Vec<String>,
}

/// Lowers onto manifests already parsed and validated.
pub(crate) fn lower_parsed_manifests(
    input: &CssDirectiveManifestInput,
    initial_warnings: &[String],
    base: Option<&MasterCssManifest>,
    resolution: Option<MasterCssManifest>,
) -> Result<LoweredManifests, CompilerError> {
    let reference = resolution.map(|manifest| reference_context(manifest, base));
    let resolution_manifest = compile_manifest(input, reference.as_ref().or(base))?;
    let manifest = match reference {
        Some(reference) if Some(&reference) != base => {
            // Resolve local bodies against reference definitions before removing
            // reference-only registrations from the delivered manifest.
            let mut delivered = input.clone();
            delivered.mixins = super::resolution::delivered_mixins(input, &resolution_manifest);
            let mut manifest = compile_manifest(&delivered, base)?;
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
        false,
    )
}

pub fn lower_css_directives_request(
    request: &LowerCssDirectivesRequest,
    options: &LowerCssDirectivesOptions,
) -> Result<LowerCssDirectivesResult, CompilerError> {
    lower_request(request, options, false)
}

/// [`lower_css_directives_request`] whose manifests may be `{"$ref": key}` references
/// to stored manifests, returning both lowered manifests as references: hosts
/// pass them on to render sessions without serializing them.
pub fn lower_css_directives_request_with_refs(
    request: &LowerCssDirectivesRequest,
    options: &LowerCssDirectivesOptions,
) -> Result<LowerCssDirectivesResult, CompilerError> {
    lower_request(request, options, true)
}

fn lower_request(
    request: &LowerCssDirectivesRequest,
    options: &LowerCssDirectivesOptions,
    manifest_refs: bool,
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
        manifest_refs,
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
    manifest_refs: bool,
) -> Result<LowerCssDirectivesResult, CompilerError> {
    let lowering = Lowering::lower(
        input,
        initial_warnings,
        options.base_manifest.as_ref(),
        options.resolution_manifest.as_ref(),
    )?;
    let engine = lowering.engine();
    let lowered = lowering.lowered();
    // Borrowed until native animation variables extend them.
    let mut manifest = Cow::Borrowed(&lowered.manifest);
    let mut resolution_manifest = Cow::Borrowed(&lowered.resolution_manifest);
    let (generated_css, generated_mappings) = render_definitions(style_definitions, engine)?;
    if crate::keyframes::has_native_variables(&generated_css) {
        crate::keyframes::include_native_variables(manifest.to_mut(), &generated_css);
    }
    let (css, output_mappings) = match native_output {
        Some(output) => {
            let (css, mappings) =
                super::output::assemble_native_output(output, engine, &resolution_manifest)?;
            if crate::keyframes::has_native_variables(&css) {
                crate::keyframes::include_native_variables(manifest.to_mut(), &css);
                crate::keyframes::include_native_variables(resolution_manifest.to_mut(), &css);
            }
            (Some(css), mappings)
        }
        None => (None, Vec::new()),
    };
    let notices = match &css {
        Some(css) => {
            crate::keyframes::native_notices(css, "stylesheet.css", engine, &output_mappings)
        }
        None => crate::keyframes::native_notices(
            &generated_css,
            "stylesheet.css",
            engine,
            &generated_mappings,
        ),
    };
    let (manifest, resolution_manifest) = if manifest_refs {
        let (manifest, resolution_manifest) = lowering.store_both(&manifest, &resolution_manifest);
        (
            reference_value(&manifest),
            reference_value(&resolution_manifest),
        )
    } else {
        (manifest.to_value(), resolution_manifest.to_value())
    };
    Ok(LowerCssDirectivesResult {
        notices,
        definition_sources,
        css,
        output_mappings,
        input: input.clone(),
        manifest,
        resolution_manifest,
        warnings: lowered.warnings.clone(),
        generated_css,
        generated_mappings,
    })
}
