use super::variables::manifest_error;
use super::{
    CompileDefaultPresetRequest, CompileDefaultPresetResult, CompileManifestOptions,
    CompileManifestResult, CompilerError, CssDirectiveManifestInput, CssDirectiveStyleDefinition,
    normalize_default_manifest_for_json,
};

pub fn compile_manifest_input_with_styles(
    input: &CssDirectiveManifestInput,
    definitions: &[CssDirectiveStyleDefinition],
    options: &CompileManifestOptions,
) -> Result<CompileManifestResult, CompilerError> {
    let result = crate::lower_css_directives(
        input,
        definitions,
        &[],
        &crate::LowerCssDirectivesOptions {
            base_manifest: options.base_manifest.clone(),
            resolution_manifest: None,
        },
    )?;
    Ok(CompileManifestResult {
        manifest: result.manifest,
    })
}

pub fn compile_default_preset_manifest(
    request: &CompileDefaultPresetRequest,
) -> Result<CompileDefaultPresetResult, CompilerError> {
    let manifest = compile_manifest_input_with_styles(
        &request.manifest_input,
        &request.style_definitions,
        &CompileManifestOptions::default(),
    )?
    .manifest;
    let manifest = normalize_default_manifest_for_json(&manifest)?;
    let json = serde_json::to_string(&manifest)
        .map_err(|error| manifest_error(format!("Cannot serialize default manifest: {error}")))?;
    Ok(CompileDefaultPresetResult { manifest, json })
}
