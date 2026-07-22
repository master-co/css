use mastercss_compiler::{
    CompileDefaultPresetRequest, CompileManifestOptions, CompileNativeCssOptions, CompilerError,
    CssImportGraphRequest,
};
use mastercss_engine::{EngineError, EngineSession as RustEngineSession};
use mastercss_language::LanguageSession as RustLanguageSession;
use mastercss_lint::LintSession as RustLintSession;
use mastercss_render::RenderSession as RustRenderSession;
use mastercss_scanner::ScannerSession as RustScannerSession;
use mastercss_validator::ValidatorSession as RustValidatorSession;
use napi::{Error, Result, Status};
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

const BINDING_ABI_VERSION: u32 = 1;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct BindingInfo<'a> {
    binding_abi_version: u32,
    package_version: &'a str,
    manifest_version: u32,
    hydration_manifest_version: u32,
    target: &'a str,
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
    to_json(&BindingInfo {
        binding_abi_version: BINDING_ABI_VERSION,
        package_version: env!("CARGO_PKG_VERSION"),
        manifest_version: mastercss_schema::MANIFEST_VERSION,
        hydration_manifest_version: mastercss_schema::HYDRATION_MANIFEST_VERSION,
        target: env!("MASTER_CSS_TARGET"),
    })
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

#[napi]
pub fn analyze_language_json(
    source: String,
    contexts_json: String,
    semantic_tokens_json: String,
) -> Result<String> {
    mastercss_language::analyze_language_json(&source, &contexts_json, &semantic_tokens_json)
        .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))
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
    ) -> Result<String> {
        to_json(
            &self
                .inner
                .inspect_class_name(&class_name, native_support.as_deref())
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
                    &[],
                    false,
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
                    &request.validation_errors,
                    request.disallow_unknown_class,
                )
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
    pub fn scan_candidates(
        &mut self,
        source: String,
        content: String,
        candidates: Vec<String>,
        excluded_classes: Vec<String>,
        native_support: Vec<bool>,
        invalid_generated_classes: Vec<String>,
    ) -> Result<String> {
        to_json(
            &self
                .inner
                .scan_candidates(
                    &source,
                    &content,
                    candidates,
                    &excluded_classes.into_iter().collect::<HashSet<_>>(),
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
