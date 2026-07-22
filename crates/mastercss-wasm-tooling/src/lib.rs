#![forbid(unsafe_code)]

use wasm_bindgen::prelude::*;

fn scanner_error(error: mastercss_engine::EngineError) -> JsValue {
    JsValue::from_str(
        &serde_json::to_string(&error.diagnostic()).unwrap_or_else(|_| error.to_string()),
    )
}

fn serialize_classes(classes: &[String]) -> Result<JsValue, JsValue> {
    serde_wasm_bindgen::to_value(classes).map_err(|error| JsValue::from_str(&error.to_string()))
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

#[wasm_bindgen]
pub struct ToolingScannerSession {
    inner: mastercss_scanner::ScannerSession,
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
