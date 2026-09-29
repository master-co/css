use super::merge::create_merged_style_definitions;
use super::render::render_style_definitions;
use super::resolution::{compile_with_base, engine_for_manifest};
use super::{
    CompilerError, CssDirectiveManifestInput, CssDirectiveStyleDefinition, HashMap,
    LowerCssDirectivesOptions, LowerCssDirectivesRequest, LowerCssDirectivesResult,
};

pub fn lower_css_directives(
    input: &CssDirectiveManifestInput,
    style_definitions: &[CssDirectiveStyleDefinition],
    initial_warnings: &[String],
    options: &LowerCssDirectivesOptions,
) -> Result<LowerCssDirectivesResult, CompilerError> {
    let resolution_base = options
        .resolution_manifest
        .clone()
        .or_else(|| options.base_manifest.clone());
    let resolution_manifest = compile_with_base(input, resolution_base.clone())?;
    let manifest = if resolution_base == options.base_manifest {
        resolution_manifest.clone()
    } else {
        // Resolve local bodies against reference definitions before removing
        // reference-only registrations from the delivered manifest.
        let mut delivered = input.clone();
        delivered.mixins = super::resolution::delivered_mixins(input, &resolution_manifest)?;
        compile_with_base(&delivered, options.base_manifest.clone())?
    };
    let mut engine = engine_for_manifest(&resolution_manifest)?;
    let (generated_css, generated_mappings) = render_style_definitions(
        create_merged_style_definitions(style_definitions, &mut engine, None)?,
    );
    Ok(LowerCssDirectivesResult {
        mixin_sources: Vec::new(),
        css: None,
        output_mappings: Vec::new(),
        input: input.clone(),
        manifest,
        resolution_manifest,
        warnings: initial_warnings.to_vec(),
        generated_css,
        generated_mappings,
        diagnostic_counts: HashMap::from([("lower-managed-style-refresh-count".into(), 0)]),
    })
}

pub fn lower_css_directives_request(
    request: &LowerCssDirectivesRequest,
    options: &LowerCssDirectivesOptions,
) -> Result<LowerCssDirectivesResult, CompilerError> {
    let mut result = lower_css_directives(
        &request.manifest_input,
        &request.style_definitions,
        &request.warnings,
        options,
    )?;
    result.mixin_sources = request.mixin_sources.clone();
    crate::mixin_sources::resolve(&mut result.mixin_sources);
    if let Some(output) = &request.native_output {
        super::output::assemble_native_output(output, options, &mut result)?;
    }
    Ok(result)
}
