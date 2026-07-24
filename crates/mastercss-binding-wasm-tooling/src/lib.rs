#![forbid(unsafe_code)]

use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use wasm_bindgen::prelude::*;

fn scanner_error(error: mastercss_engine::EngineError) -> JsValue {
    JsValue::from_str(
        &serde_json::to_string(&error.diagnostic()).unwrap_or_else(|_| error.to_string()),
    )
}

fn invalid_lint_request(message: impl Into<String>) -> JsValue {
    JsValue::from_str(
        &serde_json::json!({
            "code": "INVALID_LINT_REQUEST",
            "message": message.into(),
        })
        .to_string(),
    )
}

fn serialize_classes(classes: &[String]) -> Result<JsValue, JsValue> {
    serde_wasm_bindgen::to_value(classes).map_err(|error| JsValue::from_str(&error.to_string()))
}

#[wasm_bindgen]
pub struct ToolingLexerSession {
    disposed: bool,
}

impl Default for ToolingLexerSession {
    fn default() -> Self {
        Self::new()
    }
}

#[wasm_bindgen]
impl ToolingLexerSession {
    #[wasm_bindgen(constructor)]
    pub fn new() -> ToolingLexerSession {
        Self { disposed: false }
    }

    pub fn analyze(&self, request: JsValue) -> Result<JsValue, JsValue> {
        if self.disposed {
            return Err(JsValue::from_str(
                "Master CSS lexer session has been disposed.",
            ));
        }
        let request =
            serde_wasm_bindgen::from_value::<mastercss_lexer::LexerBatchRequestIr>(request)
                .map_err(|error| JsValue::from_str(&error.to_string()))?;
        mastercss_lexer::analyze_lexer_batch(&request)
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    pub fn dispose(&mut self) {
        self.disposed = true;
    }
}

#[wasm_bindgen]
pub struct ToolingSourceSession {
    disposed: bool,
}

impl Default for ToolingSourceSession {
    fn default() -> Self {
        Self::new()
    }
}

#[wasm_bindgen]
impl ToolingSourceSession {
    #[wasm_bindgen(constructor)]
    pub fn new() -> ToolingSourceSession {
        Self { disposed: false }
    }

    pub fn extract(&self, request: JsValue) -> Result<JsValue, JsValue> {
        if self.disposed {
            return Err(JsValue::from_str(
                "Master CSS source session has been disposed.",
            ));
        }
        let request =
            serde_wasm_bindgen::from_value::<mastercss_source::SourceBatchRequestIr>(request)
                .map_err(|error| JsValue::from_str(&error.to_string()))?;
        mastercss_source::extract_source_batch(&request)
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

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
    canonical_options: Option<mastercss_lint::CanonicalClassNameOptions>,
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

#[wasm_bindgen(js_name = extractClassCandidates)]
pub fn extract_class_candidates(content: &str) -> Result<JsValue, JsValue> {
    serialize_classes(&mastercss_source::extract_class_candidates(content))
}

#[wasm_bindgen(js_name = extractOxcClasses)]
pub fn extract_oxc_classes(source: &str, content: &str) -> Result<JsValue, JsValue> {
    serialize_classes(&mastercss_source::extract_oxc_classes(source, content))
}

#[wasm_bindgen(js_name = extractHTMLClasses)]
pub fn extract_html_classes(source: &str, content: &str) -> Result<JsValue, JsValue> {
    serialize_classes(&mastercss_source::extract_html_classes(source, content))
}

#[wasm_bindgen(js_name = extractAstroClasses)]
pub fn extract_astro_classes(source: &str, content: &str) -> Result<JsValue, JsValue> {
    serialize_classes(&mastercss_source::extract_astro_classes(source, content))
}

#[wasm_bindgen(js_name = createInspectionReport)]
pub fn create_inspection_report(input: JsValue) -> Result<JsValue, JsValue> {
    let input = serde_wasm_bindgen::from_value(input)
        .map_err(|error| JsValue::from_str(&error.to_string()))?;
    let report = mastercss_diagnostics::create_inspection_report(input).map_err(|error| {
        error
            .diagnostic()
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .unwrap_or_else(|_| JsValue::from_str(&error.to_string()))
    })?;
    report
        .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
        .map_err(|error| JsValue::from_str(&error.to_string()))
}

#[wasm_bindgen]
pub struct ToolingLanguageSession {
    inner: mastercss_language::LanguageSession,
}

#[wasm_bindgen]
impl ToolingLanguageSession {
    #[wasm_bindgen(constructor)]
    pub fn new(manifest_json: &str) -> Result<ToolingLanguageSession, JsValue> {
        Ok(Self {
            inner: mastercss_language::LanguageSession::create(manifest_json)
                .map_err(|error| JsValue::from_str(&error.to_string()))?,
        })
    }

    #[wasm_bindgen(js_name = nativeDeclarationCandidates)]
    pub fn native_declaration_candidates(
        &self,
        class_names: Vec<String>,
    ) -> Result<JsValue, JsValue> {
        let candidates = self
            .inner
            .native_declaration_candidates(class_names)
            .map_err(|error| JsValue::from_str(&error.to_string()))?;
        candidates
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    #[wasm_bindgen(js_name = analyzeDocument)]
    pub fn analyze_document(&self, request: JsValue) -> Result<JsValue, JsValue> {
        let request =
            serde_wasm_bindgen::from_value::<mastercss_language::AnalyzeDocumentRequestIr>(request)
                .map_err(|error| JsValue::from_str(&error.to_string()))?;
        self.inner
            .analyze_document(&request)
            .map_err(|error| JsValue::from_str(&error.to_string()))?
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    #[wasm_bindgen(js_name = formatDirectives)]
    pub fn format_directives(&self, request: JsValue) -> Result<JsValue, JsValue> {
        let request =
            serde_wasm_bindgen::from_value::<mastercss_language::FormatDirectivesRequestIr>(
                request,
            )
            .map_err(|error| JsValue::from_str(&error.to_string()))?;
        self.inner
            .format_directives(&request)
            .map_err(|error| JsValue::from_str(&error.to_string()))?
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    #[wasm_bindgen(js_name = classifyClassNames)]
    pub fn classify_class_names(
        &mut self,
        class_names: Vec<String>,
        native_support: JsValue,
    ) -> Result<JsValue, JsValue> {
        let native_support = serde_wasm_bindgen::from_value::<Vec<bool>>(native_support)
            .map_err(|error| JsValue::from_str(&error.to_string()))?;
        let batch = self
            .inner
            .classify_class_names(
                class_names,
                (!native_support.is_empty()).then_some(native_support.as_slice()),
            )
            .map_err(|error| JsValue::from_str(&error.to_string()))?;
        batch
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    #[wasm_bindgen(js_name = inspectClassName)]
    pub fn inspect_class_name(
        &self,
        class_name: &str,
        native_support: JsValue,
        mode: Option<String>,
    ) -> Result<JsValue, JsValue> {
        let native_support = serde_wasm_bindgen::from_value::<Vec<bool>>(native_support)
            .map_err(|error| JsValue::from_str(&error.to_string()))?;
        let inspection = self
            .inner
            .inspect_class_name(
                class_name,
                (!native_support.is_empty()).then_some(native_support.as_slice()),
                mode.as_deref(),
            )
            .map_err(|error| JsValue::from_str(&error.to_string()))?;
        inspection
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    #[wasm_bindgen(js_name = completionIndex)]
    pub fn completion_index(&self) -> Result<JsValue, JsValue> {
        self.inner
            .completion_index()
            .map_err(|error| JsValue::from_str(&error.to_string()))?
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    #[wasm_bindgen(js_name = colorPresentation)]
    pub fn color_presentation(&self, color_token: &str) -> Result<JsValue, JsValue> {
        self.inner
            .color_presentation(color_token)
            .map_err(|error| JsValue::from_str(&error.to_string()))?
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    #[wasm_bindgen(js_name = colorTokens)]
    pub fn color_tokens(&self, candidates: JsValue) -> Result<JsValue, JsValue> {
        let candidates = serde_wasm_bindgen::from_value::<
            Vec<mastercss_language::LanguageColorCandidateInputIr>,
        >(candidates)
        .map_err(|error| JsValue::from_str(&error.to_string()))?;
        self.inner
            .color_tokens(&candidates)
            .map_err(|error| JsValue::from_str(&error.to_string()))?
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    pub fn dispose(&mut self) {
        self.inner.dispose();
    }
}

#[wasm_bindgen]
pub struct ToolingScannerSession {
    inner: mastercss_scanner::ScannerSession,
}

#[wasm_bindgen]
pub struct ToolingValidatorSession {
    inner: mastercss_validator::ValidatorSession,
}

#[wasm_bindgen]
pub struct ToolingLintSession {
    inner: mastercss_lint::LintSession,
}

#[wasm_bindgen]
impl ToolingLintSession {
    #[wasm_bindgen(constructor)]
    pub fn new(manifest_json: &str) -> Result<ToolingLintSession, JsValue> {
        Ok(Self {
            inner: mastercss_lint::LintSession::create(manifest_json).map_err(scanner_error)?,
        })
    }

    #[wasm_bindgen(js_name = nativeDeclarationCandidates)]
    pub fn native_declaration_candidates(
        &self,
        class_names: Vec<String>,
    ) -> Result<JsValue, JsValue> {
        let candidates = self
            .inner
            .native_declaration_candidates(class_names)
            .map_err(scanner_error)?;
        serde_wasm_bindgen::to_value(&candidates)
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    #[wasm_bindgen(js_name = resolveValidation)]
    pub fn resolve_validation(
        &self,
        batch: JsValue,
        rule_errors: JsValue,
    ) -> Result<JsValue, JsValue> {
        let batch = serde_wasm_bindgen::from_value::<mastercss_schema::ValidatorBatchIr>(batch)
            .map_err(|error| invalid_lint_request(error.to_string()))?;
        let rule_errors = serde_wasm_bindgen::from_value::<Vec<Vec<Vec<String>>>>(rule_errors)
            .map_err(|error| invalid_lint_request(error.to_string()))?;
        mastercss_lint::classify_host_rule_validation(&batch, &rule_errors)
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    pub fn analyze(
        &mut self,
        class_names: Vec<String>,
        native_support: JsValue,
        invalid_generated_classes: Vec<String>,
    ) -> Result<JsValue, JsValue> {
        let native_support = if native_support.is_null() || native_support.is_undefined() {
            None
        } else {
            Some(
                serde_wasm_bindgen::from_value::<Vec<bool>>(native_support)
                    .map_err(|error| JsValue::from_str(&error.to_string()))?,
            )
        };
        let batch = self
            .inner
            .analyze(
                class_names,
                native_support.as_deref(),
                &invalid_generated_classes
                    .into_iter()
                    .collect::<HashSet<_>>(),
            )
            .map_err(scanner_error)?;
        batch
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    #[wasm_bindgen(js_name = analyzeClassList)]
    pub fn analyze_class_list(
        &mut self,
        class_list: &str,
        class_names: Vec<String>,
        native_support: JsValue,
        invalid_generated_classes: Vec<String>,
    ) -> Result<JsValue, JsValue> {
        let native_support = if native_support.is_null() || native_support.is_undefined() {
            None
        } else {
            Some(
                serde_wasm_bindgen::from_value::<Vec<bool>>(native_support)
                    .map_err(|error| JsValue::from_str(&error.to_string()))?,
            )
        };
        let batch = self
            .inner
            .analyze_class_list(
                class_list,
                &class_names,
                native_support.as_deref(),
                &invalid_generated_classes
                    .into_iter()
                    .collect::<HashSet<_>>(),
                mastercss_lint::LintClassListPolicy::default(),
            )
            .map_err(scanner_error)?;
        batch
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    #[wasm_bindgen(js_name = analyzeClassListPolicy)]
    pub fn analyze_class_list_policy(&mut self, request_json: &str) -> Result<JsValue, JsValue> {
        let request = serde_json::from_str::<LintClassListRequest>(request_json)
            .map_err(|error| invalid_lint_request(error.to_string()))?;
        if request.version != mastercss_schema::LINT_BATCH_VERSION {
            return Err(invalid_lint_request(
                "Unsupported lint class-list request version",
            ));
        }
        let raw_value_policy = request
            .raw_value_policy
            .map(|policy| {
                mastercss_lint::RawValuePolicy::new(
                    policy.allow_raw_values,
                    policy.allow_properties,
                    policy.allowed_patterns,
                )
            })
            .transpose()
            .map_err(invalid_lint_request)?;
        let batch = self
            .inner
            .analyze_class_list(
                &request.class_list,
                &request.class_names,
                request.native_support.as_deref(),
                &request
                    .invalid_generated_classes
                    .into_iter()
                    .collect::<HashSet<_>>(),
                mastercss_lint::LintClassListPolicy {
                    validation_errors: &request.validation_errors,
                    disallow_unknown_class: request.disallow_unknown_class,
                    raw_value_policy: raw_value_policy.as_ref(),
                    canonical_options: request.canonical_options.as_ref(),
                    compose_directive: request.compose_directive,
                },
            )
            .map_err(scanner_error)?;
        batch
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    #[wasm_bindgen(js_name = rawValueCandidates)]
    pub fn raw_value_candidates(
        &mut self,
        class_names: Vec<String>,
        native_support: JsValue,
        invalid_generated_classes: Vec<String>,
    ) -> Result<JsValue, JsValue> {
        let native_support = if native_support.is_null() || native_support.is_undefined() {
            None
        } else {
            Some(
                serde_wasm_bindgen::from_value::<Vec<bool>>(native_support)
                    .map_err(|error| JsValue::from_str(&error.to_string()))?,
            )
        };
        let candidates = self
            .inner
            .raw_value_candidates(
                &class_names,
                native_support.as_deref(),
                &invalid_generated_classes
                    .into_iter()
                    .collect::<HashSet<_>>(),
            )
            .map_err(scanner_error)?;
        candidates
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    #[wasm_bindgen(js_name = canonicalClassNames)]
    pub fn canonical_class_names(
        &mut self,
        class_names: Vec<String>,
        native_support: JsValue,
        options: JsValue,
    ) -> Result<JsValue, JsValue> {
        let native_support = if native_support.is_null() || native_support.is_undefined() {
            None
        } else {
            Some(
                serde_wasm_bindgen::from_value::<Vec<bool>>(native_support)
                    .map_err(|error| JsValue::from_str(&error.to_string()))?,
            )
        };
        let options = if options.is_null() || options.is_undefined() {
            mastercss_lint::CanonicalClassNameOptions::default()
        } else {
            serde_wasm_bindgen::from_value(options)
                .map_err(|error| JsValue::from_str(&error.to_string()))?
        };
        self.inner
            .canonical_class_names(&class_names, native_support.as_deref(), &options)
            .map_err(scanner_error)?
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    #[wasm_bindgen(js_name = canonicalClassGroups)]
    pub fn canonical_class_groups(
        &mut self,
        class_names: Vec<String>,
        native_support: JsValue,
        options: JsValue,
    ) -> Result<JsValue, JsValue> {
        let native_support = if native_support.is_null() || native_support.is_undefined() {
            None
        } else {
            Some(
                serde_wasm_bindgen::from_value::<Vec<bool>>(native_support)
                    .map_err(|error| JsValue::from_str(&error.to_string()))?,
            )
        };
        let options = if options.is_null() || options.is_undefined() {
            mastercss_lint::CanonicalClassNameOptions::default()
        } else {
            serde_wasm_bindgen::from_value(options)
                .map_err(|error| JsValue::from_str(&error.to_string()))?
        };
        self.inner
            .canonical_class_groups(&class_names, native_support.as_deref(), &options)
            .map_err(scanner_error)?
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    #[wasm_bindgen(js_name = canonicalComposeDirective)]
    pub fn canonical_compose_directive(
        &mut self,
        class_names: Vec<String>,
        native_support: JsValue,
        options: JsValue,
    ) -> Result<JsValue, JsValue> {
        let native_support = if native_support.is_null() || native_support.is_undefined() {
            None
        } else {
            Some(
                serde_wasm_bindgen::from_value::<Vec<bool>>(native_support)
                    .map_err(|error| JsValue::from_str(&error.to_string()))?,
            )
        };
        let options = if options.is_null() || options.is_undefined() {
            mastercss_lint::CanonicalClassNameOptions::default()
        } else {
            serde_wasm_bindgen::from_value(options)
                .map_err(|error| JsValue::from_str(&error.to_string()))?
        };
        self.inner
            .canonical_compose_directive(&class_names, native_support.as_deref(), &options)
            .map_err(scanner_error)?
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    pub fn dispose(&mut self) {
        self.inner.dispose();
    }
}

#[wasm_bindgen]
impl ToolingValidatorSession {
    #[wasm_bindgen(constructor)]
    pub fn new(manifest_json: &str) -> Result<ToolingValidatorSession, JsValue> {
        Ok(Self {
            inner: mastercss_validator::ValidatorSession::create(manifest_json)
                .map_err(scanner_error)?,
        })
    }

    #[wasm_bindgen(js_name = nativeDeclarationCandidates)]
    pub fn native_declaration_candidates(
        &self,
        class_names: Vec<String>,
    ) -> Result<JsValue, JsValue> {
        let candidates = self
            .inner
            .native_declaration_candidates(class_names)
            .map_err(scanner_error)?;
        serde_wasm_bindgen::to_value(&candidates)
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    #[wasm_bindgen(js_name = generateClasses)]
    pub fn generate_classes(
        &mut self,
        class_names: Vec<String>,
        native_support: JsValue,
    ) -> Result<JsValue, JsValue> {
        let native_support = if native_support.is_null() || native_support.is_undefined() {
            None
        } else {
            Some(
                serde_wasm_bindgen::from_value::<Vec<bool>>(native_support)
                    .map_err(|error| JsValue::from_str(&error.to_string()))?,
            )
        };
        let result = self
            .inner
            .generate_classes(class_names, native_support.as_deref())
            .map_err(scanner_error)?;
        serde_wasm_bindgen::to_value(&result).map_err(|error| JsValue::from_str(&error.to_string()))
    }

    pub fn dispose(&mut self) {
        self.inner.dispose();
    }
}

#[wasm_bindgen]
impl ToolingScannerSession {
    #[wasm_bindgen(constructor)]
    pub fn new(manifest_json: &str) -> Result<ToolingScannerSession, JsValue> {
        Ok(Self {
            inner: mastercss_scanner::ScannerSession::create(manifest_json)
                .map_err(scanner_error)?,
        })
    }

    pub fn scan(&mut self, source: &str, content: &str) -> Result<JsValue, JsValue> {
        let update = self.inner.scan(source, content).map_err(scanner_error)?;
        serde_wasm_bindgen::to_value(&update).map_err(|error| JsValue::from_str(&error.to_string()))
    }

    #[wasm_bindgen(js_name = extractCandidates)]
    pub fn extract_candidates(&self, source: &str, content: &str) -> Vec<String> {
        mastercss_scanner::extract_source_candidates(source, content)
    }

    #[wasm_bindgen(js_name = nativeDeclarationCandidates)]
    pub fn native_declaration_candidates(
        &self,
        candidates: Vec<String>,
    ) -> Result<JsValue, JsValue> {
        let candidates = self
            .inner
            .native_declaration_candidates(candidates)
            .map_err(scanner_error)?;
        serde_wasm_bindgen::to_value(&candidates)
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    #[wasm_bindgen(js_name = collectCandidates)]
    pub fn collect_candidates(&mut self, candidates: Vec<String>) -> Vec<String> {
        self.inner.collect_candidates(candidates)
    }

    #[wasm_bindgen(js_name = filterCandidates)]
    pub fn filter_candidates(
        &self,
        candidates: Vec<String>,
        blocklist: JsValue,
    ) -> Result<Vec<String>, JsValue> {
        let blocklist = serde_wasm_bindgen::from_value::<
            Vec<mastercss_schema::CssDirectiveBlocklistEntry>,
        >(blocklist)
        .map_err(|error| JsValue::from_str(&error.to_string()))?;
        Ok(mastercss_scanner::filter_blocklisted_candidates(
            candidates, &blocklist,
        ))
    }

    #[wasm_bindgen(js_name = invalidGeneratedClasses)]
    pub fn invalid_generated_classes(
        &self,
        batch: JsValue,
        rule_support: JsValue,
    ) -> Result<Vec<String>, JsValue> {
        let batch = serde_wasm_bindgen::from_value::<mastercss_schema::ValidatorBatchIr>(batch)
            .map_err(|error| JsValue::from_str(&error.to_string()))?;
        let rule_support = serde_wasm_bindgen::from_value::<Vec<Vec<bool>>>(rule_support)
            .map_err(|error| JsValue::from_str(&error.to_string()))?;
        Ok(mastercss_scanner::invalid_generated_classes(
            &batch,
            &rule_support,
        ))
    }

    #[wasm_bindgen(js_name = scanCandidates)]
    pub fn scan_candidates(
        &mut self,
        source: &str,
        content: &str,
        candidates: Vec<String>,
        blocklist: JsValue,
        native_support: JsValue,
        invalid_generated_classes: Vec<String>,
    ) -> Result<JsValue, JsValue> {
        let blocklist = serde_wasm_bindgen::from_value::<
            Vec<mastercss_schema::CssDirectiveBlocklistEntry>,
        >(blocklist)
        .map_err(|error| JsValue::from_str(&error.to_string()))?;
        let native_support = if native_support.is_null() || native_support.is_undefined() {
            Vec::new()
        } else {
            serde_wasm_bindgen::from_value::<Vec<bool>>(native_support)
                .map_err(|error| JsValue::from_str(&error.to_string()))?
        };
        let update = self
            .inner
            .scan_candidates(
                source,
                content,
                candidates,
                &blocklist,
                &native_support,
                &invalid_generated_classes
                    .into_iter()
                    .collect::<HashSet<_>>(),
            )
            .map_err(scanner_error)?;
        serde_wasm_bindgen::to_value(&update).map_err(|error| JsValue::from_str(&error.to_string()))
    }

    #[wasm_bindgen(js_name = ensureClasses)]
    pub fn ensure_classes(&mut self, class_names: Vec<String>) -> Result<JsValue, JsValue> {
        let transition = self
            .inner
            .ensure_classes(class_names)
            .map_err(scanner_error)?;
        serde_wasm_bindgen::to_value(&transition)
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    #[wasm_bindgen(js_name = registerNativeClasses)]
    pub fn register_native_classes(&mut self, class_names: Vec<String>) -> bool {
        self.inner.register_native_classes(class_names)
    }

    pub fn reset(&mut self) -> Result<(), JsValue> {
        self.inner.reset().map_err(scanner_error)
    }

    pub fn state(&self) -> Result<JsValue, JsValue> {
        let state = self.inner.state().map_err(scanner_error)?;
        serde_wasm_bindgen::to_value(&state).map_err(|error| JsValue::from_str(&error.to_string()))
    }

    pub fn dispose(&mut self) {
        self.inner.dispose();
    }
}

#[wasm_bindgen(js_name = bindingInfo)]
pub fn binding_info() -> Result<JsValue, JsValue> {
    serde_wasm_bindgen::to_value(&mastercss_schema::BindingInfo::new(
        env!("CARGO_PKG_VERSION"),
        "wasm32-unknown-unknown",
        "tooling",
        &[
            "diagnostics",
            "language",
            "lexer",
            "lint",
            "scanner",
            "source",
            "validator",
        ],
    ))
    .map_err(|error| JsValue::from_str(&error.to_string()))
}
