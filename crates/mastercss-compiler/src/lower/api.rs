use super::merge::create_merged_style_definitions;
use super::render::{
    managed_dependencies, managed_dependency_order, managed_refresh_count, managed_style_groups,
    push_static_utility_rule, render_style_definitions,
};
use super::resolution::{compile_with_base, engine_for_manifest, finalize_utility_definitions};
use super::{
    CompilerError, CssDirectiveManifestInput, CssDirectiveStyleDefinition, HashMap, HashSet,
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
            css: None,
            compositions: Vec::new(),
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
    let initial_manifest = compile_with_base(&input, resolution_base.clone())?;
    let mut engine = engine_for_manifest(&initial_manifest)?;
    let unfinalized_input = input.clone();
    finalize_utility_definitions(&mut input, &mut engine)?;
    let resolution_manifest = compile_with_base(&input, resolution_base)?;
    if input != unfinalized_input {
        engine = engine_for_manifest(&resolution_manifest)?;
    }

    let groups = managed_style_groups(style_definitions);
    let dependencies = managed_dependencies(&groups);
    let managed_order = managed_dependency_order(&groups, &dependencies)?;
    let mut unrefreshed = HashSet::new();
    for index in &managed_order {
        if dependencies[*index]
            .iter()
            .any(|dependency| unrefreshed.contains(dependency))
        {
            let current_manifest = compile_with_base(
                &input,
                options
                    .resolution_manifest
                    .clone()
                    .or_else(|| options.base_manifest.clone()),
            )?;
            engine = engine_for_manifest(&current_manifest)?;
            unrefreshed.clear();
        }
        let ((name, layer), definitions) = &groups[*index];
        for definition in create_merged_style_definitions(definitions, &mut engine, Some(*layer))? {
            push_static_utility_rule(&mut input, name, *layer, definition)?;
        }
        unrefreshed.insert(*index);
    }

    let native_definitions = style_definitions
        .iter()
        .filter(|definition| match definition {
            CssDirectiveStyleDefinition::Native { name, .. }
            | CssDirectiveStyleDefinition::Compose { name, .. } => name.is_none(),
        })
        .cloned()
        .collect::<Vec<_>>();
    let (generated_css, generated_mappings) = if native_definitions.is_empty() {
        (String::new(), Vec::new())
    } else {
        if !unrefreshed.is_empty() {
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
    let manifest = compile_with_base(&input, options.base_manifest.clone())?;
    let warnings = initial_warnings.to_vec();
    let diagnostic_counts = HashMap::from([(
        "lower-managed-style-refresh-count".into(),
        managed_refresh_count(
            &managed_order,
            &dependencies,
            !native_definitions.is_empty(),
        ),
    )]);
    let compositions = if style_definitions
        .iter()
        .any(|definition| matches!(definition, CssDirectiveStyleDefinition::Compose { .. }))
    {
        let final_manifest = compile_with_base(
            &input,
            options
                .resolution_manifest
                .clone()
                .or_else(|| options.base_manifest.clone()),
        )?;
        super::inspection::inspect_compositions(
            style_definitions,
            &mut engine_for_manifest(&final_manifest)?,
        )?
    } else {
        Vec::new()
    };
    Ok(LowerCssDirectivesResult {
        css: None,
        compositions,
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
    for trace in &mut result.compositions {
        crate::utility_sources::attach(trace, &request.utility_sources);
    }
    if let Some(output) = &request.native_output {
        super::output::assemble_native_output(output, options, &mut result)?;
    }
    Ok(result)
}
