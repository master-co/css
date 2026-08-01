use super::*;

#[napi]
pub fn binding_info_json() -> Result<String> {
    to_json(&mastercss_schema::BindingInfo::new(
        env!("CARGO_PKG_VERSION"),
        env!("MASTER_CSS_TARGET"),
        "native",
        NATIVE_FEATURES,
    ))
}

#[napi]
pub fn extract_class_candidates(content: String) -> Vec<String> {
    mastercss_source::extract_class_candidates(&content)
}

#[napi]
pub fn extract_oxc_classes(source: String, content: String) -> Vec<String> {
    mastercss_source::extract_oxc_classes(&source, &content)
}

#[napi]
pub fn extract_html_classes(source: String, content: String) -> Vec<String> {
    mastercss_source::extract_html_classes(&source, &content)
}

#[napi]
pub fn extract_astro_classes(source: String, content: String) -> Vec<String> {
    mastercss_source::extract_astro_classes(&source, &content)
}

#[napi]
pub fn find_css_manifest_entries(project_dir: String) -> Vec<String> {
    mastercss_project::find_css_manifest_entries(std::path::Path::new(&project_dir))
        .into_iter()
        .map(|path| path.to_string_lossy().replace('\\', "/"))
        .collect()
}

#[napi]
pub fn load_project_manifest_json(
    project_dir: String,
    base_manifest_json: String,
    entries: Option<Vec<String>>,
) -> Result<String> {
    let base_manifest = serde_json::from_str(&base_manifest_json)
        .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
    let result = if let Some(entries) = entries {
        let entries = entries.into_iter().map(PathBuf::from).collect::<Vec<_>>();
        mastercss_project::load_project_manifest_entries_with_root(
            Path::new(&project_dir),
            &entries,
            base_manifest,
        )
    } else {
        mastercss_project::load_project_manifest(Path::new(&project_dir), base_manifest)
    }
    .map_err(|error| Error::new(Status::GenericFailure, error.to_string()))?;
    to_json(&result)
}

#[napi]
pub fn load_project_manifest_prepared_json(
    project_dir: String,
    base_manifest_json: String,
    graphs_json: String,
) -> Result<String> {
    let base_manifest = serde_json::from_str(&base_manifest_json)
        .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
    let graphs = serde_json::from_str::<Vec<mastercss_project::ProjectEntryGraphIr>>(&graphs_json)
        .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
    let result = mastercss_project::load_project_manifest_graphs_with_root(
        Path::new(&project_dir),
        graphs,
        base_manifest,
    )
    .map_err(|error| Error::new(Status::GenericFailure, error.to_string()))?;
    to_json(&result)
}

#[napi]
pub fn inspect_css_json(source: String) -> Result<String> {
    to_json(&mastercss_compiler::inspect_css(&source))
}

#[napi]
pub fn create_inspection_report_json(input_json: String) -> Result<String> {
    mastercss_diagnostics::create_inspection_report_json(&input_json).map_err(|error| {
        Error::new(
            Status::InvalidArg,
            serde_json::to_string(&error.diagnostic()).unwrap_or_else(|_| error.to_string()),
        )
    })
}

#[napi(js_name = "LanguageSession")]
pub struct NodeLanguageSession {
    inner: RustLanguageSession,
}

#[napi]
impl NodeLanguageSession {
    #[napi(constructor)]
    pub fn new(manifest_json: String) -> Result<Self> {
        Ok(Self {
            inner: RustLanguageSession::create(&manifest_json)
                .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?,
        })
    }

    #[napi]
    pub fn native_declaration_candidates(&self, class_names: Vec<String>) -> Result<String> {
        to_json(
            &self
                .inner
                .native_declaration_candidates(class_names)
                .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?,
        )
    }

    #[napi]
    pub fn analyze_document(&self, request_json: String) -> Result<String> {
        let request =
            serde_json::from_str::<mastercss_language::AnalyzeDocumentRequestIr>(&request_json)
                .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
        to_json(
            &self
                .inner
                .analyze_document(&request)
                .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?,
        )
    }

    #[napi]
    pub fn format_directives(&self, request_json: String) -> Result<String> {
        let request =
            serde_json::from_str::<mastercss_language::FormatDirectivesRequestIr>(&request_json)
                .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
        to_json(
            &self
                .inner
                .format_directives(&request)
                .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?,
        )
    }

    #[napi]
    pub fn classify_class_names(
        &mut self,
        class_names: Vec<String>,
        native_support: Option<Vec<bool>>,
    ) -> Result<String> {
        to_json(
            &self
                .inner
                .classify_class_names(class_names, native_support.as_deref())
                .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?,
        )
    }

    #[napi]
    pub fn inspect_class_name(
        &self,
        class_name: String,
        native_support: Option<Vec<bool>>,
        mode: Option<String>,
    ) -> Result<String> {
        to_json(
            &self
                .inner
                .inspect_class_name(&class_name, native_support.as_deref(), mode.as_deref())
                .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?,
        )
    }

    #[napi]
    pub fn completion_index(&self) -> Result<String> {
        to_json(
            &self
                .inner
                .completion_index()
                .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?,
        )
    }

    #[napi]
    pub fn color_presentation(&self, color_token: String) -> Result<String> {
        to_json(
            &self
                .inner
                .color_presentation(&color_token)
                .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?,
        )
    }

    #[napi]
    pub fn color_tokens(&self, candidates_json: String) -> Result<String> {
        let candidates = serde_json::from_str::<
            Vec<mastercss_language::LanguageColorCandidateInputIr>,
        >(&candidates_json)
        .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
        to_json(
            &self
                .inner
                .color_tokens(&candidates)
                .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?,
        )
    }

    #[napi]
    pub fn dispose(&mut self) {
        self.inner.dispose();
    }
}

#[napi]
pub fn compile_native_css_json(source: String, options_json: Option<String>) -> Result<String> {
    let options = options_json
        .as_deref()
        .map(serde_json::from_str::<CompileNativeCssOptions>)
        .transpose()
        .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?
        .unwrap_or_default();
    to_json(
        &mastercss_compiler::compile_native_css(&source, &options)
            .map_err(compiler_to_napi_error)?,
    )
}

#[napi]
pub fn compile_css_directives_json(source: String, options_json: Option<String>) -> Result<String> {
    let options = options_json
        .as_deref()
        .map(serde_json::from_str::<CompileNativeCssOptions>)
        .transpose()
        .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?
        .unwrap_or_default();
    to_json(
        &mastercss_compiler::compile_css_directives(&source, &options)
            .map_err(compiler_to_napi_error)?,
    )
}

#[napi]
pub fn compile_theme_css_json(source: String, options_json: Option<String>) -> Result<String> {
    compile_css_directives_json(source, options_json)
}

#[napi]
pub fn analyze_css_dependencies_json(source: String) -> Result<String> {
    to_json(&mastercss_compiler::analyze_css_dependencies(&source))
}

#[napi]
pub fn analyze_standalone_directives_json(source: String) -> Result<String> {
    to_json(&mastercss_compiler::analyze_standalone_directives(&source))
}

#[napi]
pub fn merge_css_extraction_policies_json(policies_json: String) -> Result<String> {
    let policies =
        serde_json::from_str::<Vec<mastercss_schema::CssDirectiveExtractionPolicy>>(&policies_json)
            .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
    to_json(&mastercss_compiler::merge_extraction_policies(&policies))
}

#[napi]
pub fn filter_css_extraction_candidates(
    candidates: Vec<String>,
    blocklist_json: String,
) -> Result<Vec<String>> {
    let blocklist =
        serde_json::from_str::<Vec<mastercss_schema::CssDirectiveBlocklistEntry>>(&blocklist_json)
            .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
    Ok(mastercss_schema::filter_css_extraction_candidates(
        candidates, &blocklist,
    ))
}

#[napi]
pub fn compile_manifest_input_json(
    input_json: String,
    options_json: Option<String>,
) -> Result<String> {
    let input = serde_json::from_str::<mastercss_schema::CssDirectiveManifestInput>(&input_json)
        .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
    let options = options_json
        .as_deref()
        .map(serde_json::from_str::<CompileManifestOptions>)
        .transpose()
        .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?
        .unwrap_or_default();
    to_json(
        &mastercss_compiler::compile_manifest_input(&input, &options)
            .map_err(compiler_to_napi_error)?,
    )
}

#[napi]
pub fn lower_css_directives_json(
    request_json: String,
    options_json: Option<String>,
) -> Result<String> {
    let request =
        serde_json::from_str::<mastercss_compiler::LowerCssDirectivesRequest>(&request_json)
            .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
    let options = options_json
        .as_deref()
        .map(serde_json::from_str::<mastercss_compiler::LowerCssDirectivesOptions>)
        .transpose()
        .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?
        .unwrap_or_default();
    to_json(
        &mastercss_compiler::lower_css_directives_request(&request, &options)
            .map_err(compiler_to_napi_error)?,
    )
}

#[napi]
pub fn normalize_manifest_json(manifest_json: String) -> Result<String> {
    let manifest = serde_json::from_str::<serde_json::Value>(&manifest_json)
        .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
    let normalized = mastercss_compiler::normalize_manifest_for_json(&manifest)
        .map_err(compiler_to_napi_error)?;
    to_json(&normalized)
}

#[napi]
pub fn normalize_default_manifest_json(manifest_json: String) -> Result<String> {
    let manifest = serde_json::from_str::<serde_json::Value>(&manifest_json)
        .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
    let normalized = mastercss_compiler::normalize_default_manifest_for_json(&manifest)
        .map_err(compiler_to_napi_error)?;
    to_json(&normalized)
}

#[napi]
pub fn compile_default_preset_manifest_json(request_json: String) -> Result<String> {
    let request = serde_json::from_str::<CompileDefaultPresetRequest>(&request_json)
        .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
    to_json(
        &mastercss_compiler::compile_default_preset_manifest(&request)
            .map_err(compiler_to_napi_error)?,
    )
}

#[napi]
pub fn render_classes_json(
    manifest_json: String,
    class_names: Vec<String>,
    native_support: Option<Vec<bool>>,
) -> Result<String> {
    to_json(
        &mastercss_render::render_classes(&manifest_json, &class_names, native_support.as_deref())
            .map_err(to_napi_error)?,
    )
}

#[napi]
pub fn resolve_css_import_graph_json(request_json: String) -> Result<String> {
    let request = serde_json::from_str::<CssImportGraphRequest>(&request_json)
        .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
    to_json(
        &mastercss_compiler::resolve_prepared_css_import_graph(&request)
            .map_err(compiler_to_napi_error)?,
    )
}
