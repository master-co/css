use super::merge::create_merged_style_definitions;
use super::render::{managed_style_groups, push_static_utility_rule, render_style_definitions};
use super::resolution::{compile_with_base, engine_for_manifest, finalize_utility_definitions};
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
    let mut input = input.clone();
    let resolution_base = options
        .resolution_manifest
        .clone()
        .or_else(|| options.base_manifest.clone());
    if input.utilities.as_ref().is_none_or(Vec::is_empty) && style_definitions.is_empty() {
        let resolution_manifest = compile_with_base(&input, resolution_base)?;
        let manifest = compile_with_base(&input, options.base_manifest.clone())?;
        let warnings = initial_warnings.to_vec();
        return Ok(LowerCssDirectivesResult {
            utility_sources: Vec::new(),
            css: None,
            output_mappings: Vec::new(),
            input,
            manifest,
            resolution_manifest,
            warnings,
            generated_css: String::new(),
            generated_mappings: Vec::new(),
            diagnostic_counts: HashMap::from([("lower-managed-style-refresh-count".into(), 0)]),
        });
    }
    let (mut engine, mut resolution_manifest, body_refresh_count) =
        super::definitions::resolve_bodies(&mut input, resolution_base.clone())?;
    let unfinalized_input = input.clone();
    finalize_utility_definitions(&mut input, &mut engine)?;
    if input != unfinalized_input {
        resolution_manifest = compile_with_base(&input, resolution_base.clone())?;
        engine = engine_for_manifest(&resolution_manifest)?;
    }

    let groups = managed_style_groups(style_definitions);
    for ((name, layer), definitions) in &groups {
        for definition in create_merged_style_definitions(definitions, &mut engine, Some(*layer))? {
            push_static_utility_rule(&mut input, name, *layer, definition)?;
        }
    }

    let native_definitions = style_definitions
        .iter()
        .filter(|definition| match definition {
            CssDirectiveStyleDefinition::Native { name, .. } => name.is_none(),
        })
        .cloned()
        .collect::<Vec<_>>();
    let (generated_css, generated_mappings) = if native_definitions.is_empty() {
        (String::new(), Vec::new())
    } else {
        if !groups.is_empty() {
            let current_manifest = compile_with_base(
                &input,
                options
                    .resolution_manifest
                    .clone()
                    .or_else(|| options.base_manifest.clone()),
            )?;
            engine = engine_for_manifest(&current_manifest)?;
        }
        render_style_definitions(create_merged_style_definitions(
            &native_definitions,
            &mut engine,
            None,
        )?)
    };
    // Body lowering already compiled this exact effective definition set. Reuse
    // it when legacy fragments and a distinct reference context cannot change it.
    let manifest = if groups.is_empty() && resolution_base == options.base_manifest {
        resolution_manifest.clone()
    } else {
        compile_with_base(&input, options.base_manifest.clone())?
    };
    let warnings = initial_warnings.to_vec();
    let diagnostic_counts = HashMap::from([(
        "lower-managed-style-refresh-count".into(),
        body_refresh_count + u64::from(!groups.is_empty() && !native_definitions.is_empty()),
    )]);
    Ok(LowerCssDirectivesResult {
        utility_sources: Vec::new(),
        css: None,
        output_mappings: Vec::new(),
        input,
        manifest,
        resolution_manifest,
        warnings,
        generated_css,
        generated_mappings,
        diagnostic_counts,
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
    result.utility_sources = request.utility_sources.clone();
    crate::utility_sources::resolve(&mut result.utility_sources);
    if let Some(output) = &request.native_output {
        super::output::assemble_native_output(output, options, &mut result)?;
    }
    Ok(result)
}
