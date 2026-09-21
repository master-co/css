use super::*;

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

    #[wasm_bindgen(js_name = prepareDocument)]
    pub fn prepare_document(&mut self, request: JsValue) -> Result<JsValue, JsValue> {
        self.inner.discard_prepared_document();
        let request =
            serde_wasm_bindgen::from_value::<mastercss_language::AnalyzeDocumentRequestIr>(request)
                .map_err(|error| JsValue::from_str(&error.to_string()))?;
        self.inner
            .prepare_document(&request)
            .map_err(|error| JsValue::from_str(&error.to_string()))?
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    #[wasm_bindgen(js_name = finishDocument)]
    pub fn finish_document(
        &mut self,
        id: u32,
        native_support: JsValue,
    ) -> Result<JsValue, JsValue> {
        let support =
            serde_wasm_bindgen::from_value::<Vec<bool>>(native_support).map_err(|error| {
                self.inner.cancel_document(id);
                JsValue::from_str(&error.to_string())
            })?;
        self.inner
            .finish_document(id, &support)
            .map_err(|error| JsValue::from_str(&error.to_string()))?
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .map_err(|error| JsValue::from_str(&error.to_string()))
    }

    #[wasm_bindgen(js_name = cancelDocument)]
    pub fn cancel_document(&mut self, id: u32) {
        self.inner.cancel_document(id);
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
