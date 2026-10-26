#![forbid(unsafe_code)]

mod json;

use json::WriteJson;
use mastercss_engine::{EngineError, EngineSession as RustEngineSession};
use wasm_bindgen::prelude::*;

// Results cross the boundary as JSON text that the JavaScript provider parses.

fn js_error(error: EngineError) -> JsValue {
    JsValue::from_str(&error.diagnostic().to_json())
}

/// Results of `full`-only APIs, which the browser runtime never calls.
#[cfg(feature = "full")]
fn render_value<T: serde::Serialize>(value: &T) -> Result<String, JsValue> {
    serde_json::to_string(value).map_err(|error| JsValue::from_str(&error.to_string()))
}

#[wasm_bindgen(js_name = EngineSession)]
pub struct WasmEngineSession {
    inner: RustEngineSession,
}

#[wasm_bindgen(js_class = EngineSession)]
impl WasmEngineSession {
    #[wasm_bindgen(constructor)]
    pub fn new(
        manifest_json: &str,
        emitted_globals_json: Option<String>,
    ) -> Result<WasmEngineSession, JsValue> {
        Ok(Self {
            inner: RustEngineSession::create_with_emitted_globals(
                manifest_json,
                emitted_globals_json.as_deref(),
            )
            .map_err(js_error)?,
        })
    }

    #[cfg(feature = "full")]
    #[wasm_bindgen(js_name = manifestJSON)]
    pub fn manifest_json(&self) -> Result<String, JsValue> {
        self.inner.manifest_json().map_err(js_error)
    }

    #[wasm_bindgen(js_name = ensureClassRules)]
    pub fn ensure_class_rules(&mut self, class_names: Vec<String>) -> Result<String, JsValue> {
        let transition = self
            .inner
            .ensure_class_rules(class_names)
            .map_err(js_error)?;
        Ok(transition.to_json())
    }

    #[wasm_bindgen(js_name = deleteClassRules)]
    pub fn delete_class_rules(&mut self, class_names: Vec<String>) -> Result<String, JsValue> {
        let transition = self
            .inner
            .delete_class_rules(class_names)
            .map_err(js_error)?;
        Ok(transition.to_json())
    }

    #[wasm_bindgen(js_name = registerEmittedGlobals)]
    pub fn register_emitted_globals(
        &mut self,
        emitted_globals_json: &str,
    ) -> Result<String, JsValue> {
        let transition = self
            .inner
            .register_emitted_globals(emitted_globals_json)
            .map_err(js_error)?;
        Ok(transition.to_json())
    }

    #[wasm_bindgen(js_name = replaceEmittedGlobals)]
    pub fn replace_emitted_globals(
        &mut self,
        emitted_globals_json: &str,
    ) -> Result<String, JsValue> {
        let transition = self
            .inner
            .replace_emitted_globals(emitted_globals_json)
            .map_err(js_error)?;
        Ok(transition.to_json())
    }

    #[cfg(feature = "full")]
    #[wasm_bindgen(js_name = nativeDeclarationCandidates)]
    pub fn native_declaration_candidates(
        &self,
        class_names: Vec<String>,
    ) -> Result<String, JsValue> {
        let candidates = self
            .inner
            .native_declaration_candidates(class_names)
            .map_err(js_error)?;
        render_value(&candidates)
    }

    pub fn refresh(
        &mut self,
        manifest_json: &str,
        emitted_globals_json: Option<String>,
    ) -> Result<String, JsValue> {
        let transition = self
            .inner
            .refresh_with_emitted_globals(manifest_json, emitted_globals_json.as_deref())
            .map_err(js_error)?;
        Ok(transition.to_json())
    }

    #[wasm_bindgen(js_name = executionState)]
    pub fn execution_state(&self, class_names: Vec<String>) -> Result<String, JsValue> {
        let state = self.inner.execution_state(class_names).map_err(js_error)?;
        Ok(state.to_json())
    }

    pub fn snapshot(&self) -> Result<String, JsValue> {
        let snapshot = self.inner.snapshot().map_err(js_error)?;
        Ok(snapshot.to_json())
    }

    #[cfg(feature = "full")]
    pub fn inspect(&self, class_name: &str) -> Result<String, JsValue> {
        let inspection = self.inner.inspect(class_name).map_err(js_error)?;
        render_value(&inspection)
    }

    pub fn dispose(&mut self) {
        self.inner.dispose();
    }
}

#[cfg(feature = "full")]
#[wasm_bindgen(js_name = RenderSession)]
pub struct WasmRenderSession {
    inner: mastercss_render::RenderSession,
}

#[cfg(feature = "full")]
#[wasm_bindgen(js_class = RenderSession)]
impl WasmRenderSession {
    #[wasm_bindgen(constructor)]
    pub fn new(
        manifest_json: &str,
        emitted_globals_json: Option<String>,
    ) -> Result<WasmRenderSession, JsValue> {
        Ok(Self {
            inner: mastercss_render::RenderSession::create(
                manifest_json,
                emitted_globals_json.as_deref(),
            )
            .map_err(js_error)?,
        })
    }

    #[wasm_bindgen(js_name = nativeDeclarationCandidates)]
    pub fn native_declaration_candidates(
        &self,
        class_names: Vec<String>,
    ) -> Result<String, JsValue> {
        render_value(
            &self
                .inner
                .native_declaration_candidates(class_names)
                .map_err(js_error)?,
        )
    }

    #[wasm_bindgen(js_name = ensureClasses)]
    pub fn ensure_classes(&mut self, class_names: Vec<String>) -> Result<(), JsValue> {
        self.inner.ensure_classes(class_names).map_err(js_error)
    }

    #[wasm_bindgen(js_name = ensureStylesheetResources)]
    pub fn ensure_stylesheet_resources(&mut self, native_css: &str) -> Result<(), JsValue> {
        self.inner
            .ensure_stylesheet_resources(native_css)
            .map_err(js_error)
    }

    #[wasm_bindgen(js_name = emittedGlobals)]
    pub fn emitted_globals(&self) -> Result<String, JsValue> {
        render_value(&self.inner.emitted_globals().map_err(js_error)?)
    }

    pub fn snapshot(&self) -> Result<String, JsValue> {
        render_value(&self.inner.snapshot().map_err(js_error)?)
    }

    #[wasm_bindgen(js_name = snapshotForClasses)]
    pub fn snapshot_for_classes(&self, class_names: Vec<String>) -> Result<String, JsValue> {
        render_value(
            &self
                .inner
                .snapshot_for_classes(class_names)
                .map_err(js_error)?,
        )
    }

    pub fn dispose(&mut self) {
        self.inner.dispose();
    }
}

#[wasm_bindgen(js_name = bindingInfo)]
pub fn binding_info() -> String {
    mastercss_schema::BindingInfo::new(
        env!("CARGO_PKG_VERSION"),
        "wasm32-unknown-unknown",
        "runtime",
        if cfg!(feature = "full") {
            &["engine", "render"]
        } else {
            &["engine"]
        },
    )
    .to_json()
}
