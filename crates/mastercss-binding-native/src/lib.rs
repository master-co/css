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

mod compiler;
mod engine;
mod render_scanner;
mod tooling;

pub use compiler::*;
pub use engine::*;
pub use render_scanner::*;
pub use tooling::*;
