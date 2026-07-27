use mastercss_compiler::{
    CompileDefaultPresetRequest, CompileManifestOptions, CompileNativeCssOptions, CompilerError,
    CssImportGraphRequest,
};
use mastercss_engine::{EngineError, EngineSession as RustEngineSession};
use mastercss_language::LanguageSession as RustLanguageSession;
use mastercss_lint::{
    CanonicalClassNameOptions, LintClassListPolicy, LintSession as RustLintSession, RawValuePolicy,
};
use mastercss_render::RenderSession as RustRenderSession;
use mastercss_scanner::ScannerSession as RustScannerSession;
use mastercss_validator::ValidatorSession as RustValidatorSession;
use napi::{Error, Result, Status};
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::{Path, PathBuf};

const NATIVE_FEATURES: &[&str] = &[
    "compiler",
    "diagnostics",
    "engine",
    "language",
    "lexer",
    "lint",
    "project",
    "render",
    "scanner",
    "source",
    "validator",
];

#[napi(js_name = "LexerSession")]
pub struct NodeLexerSession {
    disposed: bool,
}

impl Default for NodeLexerSession {
    fn default() -> Self {
        Self::new()
    }
}

#[napi]
impl NodeLexerSession {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self { disposed: false }
    }

    #[napi]
    pub fn analyze(&self, request_json: String) -> Result<String> {
        if self.disposed {
            return Err(Error::new(
                Status::InvalidArg,
                "Master CSS lexer session has been disposed.",
            ));
        }
        let request = serde_json::from_str::<mastercss_lexer::LexerBatchRequestIr>(&request_json)
            .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
        to_json(&mastercss_lexer::analyze_lexer_batch(&request))
    }

    #[napi]
    pub fn dispose(&mut self) {
        self.disposed = true;
    }
}

#[napi(js_name = "SourceSession")]
pub struct NodeSourceSession {
    disposed: bool,
}

impl Default for NodeSourceSession {
    fn default() -> Self {
        Self::new()
    }
}

#[napi]
impl NodeSourceSession {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self { disposed: false }
    }

    #[napi]
    pub fn extract(&self, request_json: String) -> Result<String> {
        if self.disposed {
            return Err(Error::new(
                Status::InvalidArg,
                "Master CSS source session has been disposed.",
            ));
        }
        let request = serde_json::from_str::<mastercss_source::SourceBatchRequestIr>(&request_json)
            .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
        to_json(&mastercss_source::extract_source_batch(&request))
    }

    #[napi]
    pub fn dispose(&mut self) {
        self.disposed = true;
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LintClassListRequest {
    version: u32,
    class_list: String,
    class_names: Vec<String>,
    native_support: Option<Vec<bool>>,
    #[serde(default)]
    invalid_generated_classes: Vec<String>,
    #[serde(default)]
    validation_errors: Vec<Vec<String>>,
    #[serde(default)]
    disallow_unknown_class: bool,
    raw_value_policy: Option<LintRawValuePolicyRequest>,
    canonical_options: Option<CanonicalClassNameOptions>,
    #[serde(default)]
    compose_directive: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LintRawValuePolicyRequest {
    #[serde(default)]
    allow_raw_values: bool,
    #[serde(default)]
    allow_properties: Vec<String>,
    #[serde(default)]
    allowed_patterns: Vec<String>,
}

fn to_napi_error(error: EngineError) -> Error {
    let reason = serde_json::to_string(&error.diagnostic()).unwrap_or_else(|_| error.to_string());
    Error::new(Status::GenericFailure, reason)
}

fn compiler_to_napi_error(error: CompilerError) -> Error {
    let reason = serde_json::to_string(&error.diagnostic()).unwrap_or_else(|_| error.to_string());
    Error::new(Status::GenericFailure, reason)
}

fn invalid_lint_request(message: impl Into<String>) -> Error {
    Error::new(
        Status::InvalidArg,
        serde_json::json!({
            "code": "INVALID_LINT_REQUEST",
            "message": message.into(),
        })
        .to_string(),
    )
}

fn to_json<T: Serialize>(value: &T) -> Result<String> {
    serde_json::to_string(value)
        .map_err(|error| Error::new(Status::GenericFailure, error.to_string()))
}

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

#[napi(js_name = "ValidatorSession")]
pub struct NodeValidatorSession {
    inner: RustValidatorSession,
}

#[napi(js_name = "LintSession")]
pub struct NodeLintSession {
    inner: RustLintSession,
}

#[napi]
impl NodeLintSession {
    #[napi(constructor)]
    pub fn new(manifest_json: String) -> Result<Self> {
        Ok(Self {
            inner: RustLintSession::create(&manifest_json).map_err(to_napi_error)?,
        })
    }

    #[napi]
    pub fn native_declaration_candidates(&self, class_names: Vec<String>) -> Result<String> {
        to_json(
            &self
                .inner
                .native_declaration_candidates(class_names)
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn resolve_validation(
        &self,
        batch_json: String,
        rule_errors_json: String,
    ) -> Result<String> {
        let batch = serde_json::from_str::<mastercss_schema::ValidatorBatchIr>(&batch_json)
            .map_err(|error| invalid_lint_request(error.to_string()))?;
        let rule_errors = serde_json::from_str::<Vec<Vec<Vec<String>>>>(&rule_errors_json)
            .map_err(|error| invalid_lint_request(error.to_string()))?;
        to_json(&mastercss_lint::classify_host_rule_validation(
            &batch,
            &rule_errors,
        ))
    }

    #[napi]
    pub fn analyze(
        &mut self,
        class_names: Vec<String>,
        native_support: Option<Vec<bool>>,
        invalid_generated_classes: Vec<String>,
    ) -> Result<String> {
        to_json(
            &self
                .inner
                .analyze(
                    class_names,
                    native_support.as_deref(),
                    &invalid_generated_classes
                        .into_iter()
                        .collect::<HashSet<_>>(),
                )
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn analyze_class_list(
        &mut self,
        class_list: String,
        class_names: Vec<String>,
        native_support: Option<Vec<bool>>,
        invalid_generated_classes: Vec<String>,
    ) -> Result<String> {
        to_json(
            &self
                .inner
                .analyze_class_list(
                    &class_list,
                    &class_names,
                    native_support.as_deref(),
                    &invalid_generated_classes
                        .into_iter()
                        .collect::<HashSet<_>>(),
                    LintClassListPolicy::default(),
                )
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn analyze_class_list_policy(&mut self, request_json: String) -> Result<String> {
        let request = serde_json::from_str::<LintClassListRequest>(&request_json)
            .map_err(|error| invalid_lint_request(error.to_string()))?;
        if request.version != mastercss_schema::LINT_BATCH_VERSION {
            return Err(invalid_lint_request(
                "Unsupported lint class-list request version",
            ));
        }
        let raw_value_policy = request
            .raw_value_policy
            .map(|policy| {
                RawValuePolicy::new(
                    policy.allow_raw_values,
                    policy.allow_properties,
                    policy.allowed_patterns,
                )
            })
            .transpose()
            .map_err(invalid_lint_request)?;
        to_json(
            &self
                .inner
                .analyze_class_list(
                    &request.class_list,
                    &request.class_names,
                    request.native_support.as_deref(),
                    &request
                        .invalid_generated_classes
                        .into_iter()
                        .collect::<HashSet<_>>(),
                    LintClassListPolicy {
                        validation_errors: &request.validation_errors,
                        disallow_unknown_class: request.disallow_unknown_class,
                        raw_value_policy: raw_value_policy.as_ref(),
                        canonical_options: request.canonical_options.as_ref(),
                        compose_directive: request.compose_directive,
                    },
                )
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn raw_value_candidates(
        &mut self,
        class_names: Vec<String>,
        native_support: Option<Vec<bool>>,
        invalid_generated_classes: Vec<String>,
    ) -> Result<String> {
        to_json(
            &self
                .inner
                .raw_value_candidates(
                    &class_names,
                    native_support.as_deref(),
                    &invalid_generated_classes
                        .into_iter()
                        .collect::<HashSet<_>>(),
                )
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn canonical_class_names(
        &mut self,
        class_names: Vec<String>,
        native_support: Option<Vec<bool>>,
        options_json: Option<String>,
    ) -> Result<String> {
        let options = options_json
            .as_deref()
            .map(serde_json::from_str::<CanonicalClassNameOptions>)
            .transpose()
            .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?
            .unwrap_or_default();
        to_json(
            &self
                .inner
                .canonical_class_names(&class_names, native_support.as_deref(), &options)
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn canonical_class_groups(
        &mut self,
        class_names: Vec<String>,
        native_support: Option<Vec<bool>>,
        options_json: Option<String>,
    ) -> Result<String> {
        let options = options_json
            .as_deref()
            .map(serde_json::from_str::<CanonicalClassNameOptions>)
            .transpose()
            .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?
            .unwrap_or_default();
        to_json(
            &self
                .inner
                .canonical_class_groups(&class_names, native_support.as_deref(), &options)
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn canonical_compose_directive(
        &mut self,
        class_names: Vec<String>,
        native_support: Option<Vec<bool>>,
        options_json: Option<String>,
    ) -> Result<String> {
        let options = options_json
            .as_deref()
            .map(serde_json::from_str::<CanonicalClassNameOptions>)
            .transpose()
            .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?
            .unwrap_or_default();
        to_json(
            &self
                .inner
                .canonical_compose_directive(&class_names, native_support.as_deref(), &options)
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn dispose(&mut self) {
        self.inner.dispose();
    }
}

#[napi]
impl NodeValidatorSession {
    #[napi(constructor)]
    pub fn new(manifest_json: String) -> Result<Self> {
        Ok(Self {
            inner: RustValidatorSession::create(&manifest_json).map_err(to_napi_error)?,
        })
    }

    #[napi]
    pub fn native_declaration_candidates(&self, class_names: Vec<String>) -> Result<String> {
        to_json(
            &self
                .inner
                .native_declaration_candidates(class_names)
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn generate_classes(
        &mut self,
        class_names: Vec<String>,
        native_support: Option<Vec<bool>>,
    ) -> Result<String> {
        to_json(
            &self
                .inner
                .generate_classes(class_names, native_support.as_deref())
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn dispose(&mut self) {
        self.inner.dispose();
    }
}

#[napi(js_name = "RenderSession")]
pub struct NodeRenderSession {
    inner: RustRenderSession,
}

#[napi]
impl NodeRenderSession {
    #[napi(constructor)]
    pub fn new(manifest_json: String, emitted_globals_json: Option<String>) -> Result<Self> {
        Ok(Self {
            inner: RustRenderSession::create(&manifest_json, emitted_globals_json.as_deref())
                .map_err(to_napi_error)?,
        })
    }

    #[napi]
    pub fn native_declaration_candidates(&self, class_names: Vec<String>) -> Result<String> {
        to_json(
            &self
                .inner
                .native_declaration_candidates(class_names)
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn ensure_classes(
        &mut self,
        class_names: Vec<String>,
        native_support: Option<Vec<bool>>,
    ) -> Result<()> {
        self.inner
            .ensure_classes(class_names, native_support.as_deref())
            .map_err(to_napi_error)
    }

    #[napi]
    pub fn ensure_stylesheet_resources(&mut self, native_css: String) -> Result<()> {
        self.inner
            .ensure_stylesheet_resources(&native_css)
            .map_err(to_napi_error)
    }

    #[napi]
    pub fn emitted_globals(&self) -> Result<String> {
        to_json(&self.inner.emitted_globals().map_err(to_napi_error)?)
    }

    #[napi]
    pub fn snapshot(&self) -> Result<String> {
        to_json(&self.inner.snapshot().map_err(to_napi_error)?)
    }

    #[napi]
    pub fn snapshot_for_classes(&self, class_names: Vec<String>) -> Result<String> {
        to_json(
            &self
                .inner
                .snapshot_for_classes(class_names)
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn dispose(&mut self) {
        self.inner.dispose();
    }
}

#[napi(js_name = "ScannerSession")]
pub struct NodeScannerSession {
    inner: RustScannerSession,
}

#[napi]
impl NodeScannerSession {
    #[napi(constructor)]
    pub fn new(manifest_json: String) -> Result<Self> {
        Ok(Self {
            inner: RustScannerSession::create(&manifest_json).map_err(to_napi_error)?,
        })
    }

    #[napi]
    pub fn scan(&mut self, source: String, content: String) -> Result<String> {
        to_json(&self.inner.scan(&source, &content).map_err(to_napi_error)?)
    }

    #[napi]
    pub fn extract_candidates(&self, source: String, content: String) -> Vec<String> {
        mastercss_scanner::extract_source_candidates(&source, &content)
    }

    #[napi]
    pub fn native_declaration_candidates(&self, candidates: Vec<String>) -> Result<String> {
        to_json(
            &self
                .inner
                .native_declaration_candidates(candidates)
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn collect_candidates(&mut self, candidates: Vec<String>) -> Vec<String> {
        self.inner.collect_candidates(candidates)
    }

    #[napi]
    pub fn filter_candidates(
        &self,
        candidates: Vec<String>,
        blocklist_json: String,
    ) -> Result<Vec<String>> {
        let blocklist = serde_json::from_str::<Vec<mastercss_schema::CssDirectiveBlocklistEntry>>(
            &blocklist_json,
        )
        .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
        Ok(mastercss_scanner::filter_blocklisted_candidates(
            candidates, &blocklist,
        ))
    }

    #[napi]
    pub fn invalid_generated_classes(
        &self,
        batch_json: String,
        rule_support: Vec<Vec<bool>>,
    ) -> Result<Vec<String>> {
        let batch = serde_json::from_str::<mastercss_schema::ValidatorBatchIr>(&batch_json)
            .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
        Ok(mastercss_scanner::invalid_generated_classes(
            &batch,
            &rule_support,
        ))
    }

    #[napi]
    pub fn scan_candidates(
        &mut self,
        source: String,
        content: String,
        candidates: Vec<String>,
        blocklist_json: String,
        native_support: Vec<bool>,
        invalid_generated_classes: Vec<String>,
    ) -> Result<String> {
        let blocklist = serde_json::from_str::<Vec<mastercss_schema::CssDirectiveBlocklistEntry>>(
            &blocklist_json,
        )
        .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
        to_json(
            &self
                .inner
                .scan_candidates(
                    &source,
                    &content,
                    candidates,
                    &blocklist,
                    &native_support,
                    &invalid_generated_classes
                        .into_iter()
                        .collect::<HashSet<_>>(),
                )
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn ensure_classes(&mut self, class_names: Vec<String>) -> Result<String> {
        to_json(
            &self
                .inner
                .ensure_classes(class_names)
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn register_native_classes(&mut self, class_names: Vec<String>) -> bool {
        self.inner.register_native_classes(class_names)
    }

    #[napi]
    pub fn reset(&mut self) -> Result<()> {
        self.inner.reset().map_err(to_napi_error)
    }

    #[napi]
    pub fn state(&self) -> Result<String> {
        to_json(&self.inner.state().map_err(to_napi_error)?)
    }

    #[napi]
    pub fn dispose(&mut self) {
        self.inner.dispose();
    }
}

#[napi(js_name = "EngineSession")]
pub struct NodeEngineSession {
    inner: RustEngineSession,
}

#[napi]
impl NodeEngineSession {
    #[napi(constructor)]
    pub fn new(manifest_json: String, emitted_globals_json: Option<String>) -> Result<Self> {
        Ok(Self {
            inner: RustEngineSession::create_with_emitted_globals(
                &manifest_json,
                emitted_globals_json.as_deref(),
            )
            .map_err(to_napi_error)?,
        })
    }

    #[napi]
    pub fn manifest_json(&self) -> Result<String> {
        self.inner.manifest_json().map_err(to_napi_error)
    }

    #[napi]
    pub fn ensure_class_rules(&mut self, class_names: Vec<String>) -> Result<String> {
        to_json(
            &self
                .inner
                .ensure_class_rules(class_names)
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn delete_class_rules(&mut self, class_names: Vec<String>) -> Result<String> {
        to_json(
            &self
                .inner
                .delete_class_rules(class_names)
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn native_declaration_candidates(&self, class_names: Vec<String>) -> Result<String> {
        to_json(
            &self
                .inner
                .native_declaration_candidates(class_names)
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn ensure_class_rules_with_native_support(
        &mut self,
        class_names: Vec<String>,
        supported: Vec<bool>,
    ) -> Result<String> {
        to_json(
            &self
                .inner
                .ensure_class_rules_with_native_support(class_names, &supported)
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn refresh(&mut self, manifest_json: String) -> Result<String> {
        to_json(&self.inner.refresh(&manifest_json).map_err(to_napi_error)?)
    }

    #[napi]
    pub fn snapshot(&self) -> Result<String> {
        to_json(&self.inner.snapshot().map_err(to_napi_error)?)
    }

    #[napi]
    pub fn inspect(&self, class_name: String) -> Result<String> {
        to_json(&self.inner.inspect(&class_name).map_err(to_napi_error)?)
    }

    #[napi]
    pub fn dispose(&mut self) {
        self.inner.dispose();
    }
}
