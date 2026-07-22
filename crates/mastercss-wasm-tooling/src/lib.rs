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
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LintRawValuePolicyRequest {
    #[serde(default)]
    allow_raw_values: bool,
    #[serde(default)]
    allow_properties: Vec<String>,
    #[serde(default)]
    approved_segments: Vec<Vec<bool>>,
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

#[wasm_bindgen(js_name = analyzeLanguage)]
pub fn analyze_language(
    source: &str,
    contexts: JsValue,
    semantic_tokens: JsValue,
) -> Result<JsValue, JsValue> {
    let contexts =
        serde_wasm_bindgen::from_value::<Vec<mastercss_language::ClassListContextIr>>(contexts)
            .map_err(|error| JsValue::from_str(&error.to_string()))?;
    let semantic_tokens = serde_wasm_bindgen::from_value::<
        Vec<mastercss_language::SemanticTokenInputIr>,
    >(semantic_tokens)
    .map_err(|error| JsValue::from_str(&error.to_string()))?;
    let batch = mastercss_language::analyze_language(source, &contexts, &semantic_tokens)
        .map_err(|error| JsValue::from_str(&error.to_string()))?;
    batch
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
    ) -> Result<JsValue, JsValue> {
        let native_support = serde_wasm_bindgen::from_value::<Vec<bool>>(native_support)
            .map_err(|error| JsValue::from_str(&error.to_string()))?;
        let inspection = self
            .inner
            .inspect_class_name(
                class_name,
                (!native_support.is_empty()).then_some(native_support.as_slice()),
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
        let raw_value_policy =
            request
                .raw_value_policy
                .map(|policy| mastercss_lint::RawValuePolicy {
                    allow_raw_values: policy.allow_raw_values,
                    allow_properties: policy.allow_properties,
                    approved_segments: policy.approved_segments,
                });
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

    #[wasm_bindgen(js_name = scanCandidates)]
    pub fn scan_candidates(
        &mut self,
        source: &str,
        content: &str,
        candidates: Vec<String>,
        excluded_classes: Vec<String>,
        native_support: JsValue,
        invalid_generated_classes: Vec<String>,
    ) -> Result<JsValue, JsValue> {
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
                &excluded_classes.into_iter().collect::<HashSet<_>>(),
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
    serde_wasm_bindgen::to_value(&serde_json::json!({
        "bindingAbiVersion": 1,
        "packageVersion": env!("CARGO_PKG_VERSION"),
        "manifestVersion": mastercss_schema::MANIFEST_VERSION,
        "hydrationManifestVersion": mastercss_schema::HYDRATION_MANIFEST_VERSION,
        "target": "wasm32-unknown-unknown",
        "surface": "tooling"
    }))
    .map_err(|error| JsValue::from_str(&error.to_string()))
}
