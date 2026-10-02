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
        .map(|manifest| {
            crate::manifest::reference_context(manifest, options.base_manifest.as_ref())
        })
        .or_else(|| options.base_manifest.clone());
    let resolution_manifest = compile_with_base(input, resolution_base.clone())?;
    let mut manifest = if resolution_base == options.base_manifest {
        resolution_manifest.clone()
    } else {
        // Resolve local bodies against reference definitions before removing
        // reference-only registrations from the delivered manifest.
        let mut delivered = input.clone();
        delivered.mixins = super::resolution::delivered_mixins(input, &resolution_manifest)?;
        compile_with_base(&delivered, options.base_manifest.clone())?
    };
    if resolution_base != options.base_manifest
        && let Some(keyframes) = resolution_manifest.get("keyframes")
    {
        manifest["keyframes"] = keyframes.clone();
    }
    let mut warnings = initial_warnings.to_vec();
    for name in input.keyframe_safelist.iter().flatten() {
        if !resolution_manifest
            .get("keyframes")
            .and_then(serde_json::Value::as_array)
            .into_iter()
            .flatten()
            .any(|definition| definition["name"].as_str() == Some(name.as_str()))
        {
            warnings.push(format!(
                "Unknown keyframes name in @safelist keyframes: {name}"
            ));
        }
    }
    let mut engine = engine_for_manifest(&resolution_manifest)?;
    let (generated_css, generated_mappings) = render_style_definitions(
        create_merged_style_definitions(style_definitions, &mut engine, None)?,
    );
    crate::keyframes::include_native_variables(&mut manifest, &generated_css);
    Ok(LowerCssDirectivesResult {
        notices: crate::keyframes::native_notices(
            &generated_css,
            "stylesheet.css",
            &manifest,
            &generated_mappings,
        )?,
        definition_sources: Vec::new(),
        css: None,
        output_mappings: Vec::new(),
        input: input.clone(),
        manifest,
        resolution_manifest,
        warnings,
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
    result.definition_sources = request.definition_sources.clone();
    crate::definition_sources::resolve(&mut result.definition_sources);
    if let Some(output) = &request.native_output {
        super::output::assemble_native_output(output, options, &mut result)?;
    }
    Ok(result)
}
