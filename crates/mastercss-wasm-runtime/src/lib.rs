#![forbid(unsafe_code)]

use mastercss_engine::{EngineError, EngineSession as RustEngineSession};
use serde::Serialize;
use wasm_bindgen::prelude::*;

fn js_error(error: EngineError) -> JsValue {
    JsValue::from_str(
        &serde_json::to_string(&error.diagnostic()).unwrap_or_else(|_| error.to_string()),
    )
}

fn serialization_error(error: impl ToString) -> JsValue {
    JsValue::from_str(&error.to_string())
}

fn render_value<T: Serialize>(value: &T) -> Result<JsValue, JsValue> {
    value
        .serialize(
            &serde_wasm_bindgen::Serializer::new()
                .serialize_maps_as_objects(true)
                .serialize_missing_as_null(true),
        )
        .map_err(serialization_error)
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

    #[wasm_bindgen(js_name = manifestJSON)]
    pub fn manifest_json(&self) -> Result<String, JsValue> {
        self.inner.manifest_json().map_err(js_error)
    }

    #[wasm_bindgen(js_name = ensureClassRules)]
    pub fn ensure_class_rules(&mut self, class_names: Vec<String>) -> Result<JsValue, JsValue> {
        let transition = self
            .inner
            .ensure_class_rules(class_names)
            .map_err(js_error)?;
        serde_wasm_bindgen::to_value(&transition).map_err(serialization_error)
    }

    #[wasm_bindgen(js_name = deleteClassRules)]
    pub fn delete_class_rules(&mut self, class_names: Vec<String>) -> Result<JsValue, JsValue> {
        let transition = self
            .inner
            .delete_class_rules(class_names)
            .map_err(js_error)?;
        serde_wasm_bindgen::to_value(&transition).map_err(serialization_error)
    }

    #[wasm_bindgen(js_name = nativeDeclarationCandidates)]
    pub fn native_declaration_candidates(
        &self,
        class_names: Vec<String>,
    ) -> Result<JsValue, JsValue> {
        let candidates = self
            .inner
            .native_declaration_candidates(class_names)
            .map_err(js_error)?;
        serde_wasm_bindgen::to_value(&candidates).map_err(serialization_error)
    }

    #[wasm_bindgen(js_name = ensureClassRulesWithNativeSupport)]
    pub fn ensure_class_rules_with_native_support(
        &mut self,
        class_names: Vec<String>,
        supported: Vec<u8>,
    ) -> Result<JsValue, JsValue> {
        let supported = supported
            .into_iter()
            .map(|value| value != 0)
            .collect::<Vec<_>>();
        let transition = self
            .inner
            .ensure_class_rules_with_native_support(class_names, &supported)
            .map_err(js_error)?;
        serde_wasm_bindgen::to_value(&transition).map_err(serialization_error)
    }

    pub fn refresh(&mut self, manifest_json: &str) -> Result<JsValue, JsValue> {
        let transition = self.inner.refresh(manifest_json).map_err(js_error)?;
        serde_wasm_bindgen::to_value(&transition).map_err(serialization_error)
    }

    pub fn snapshot(&self) -> Result<JsValue, JsValue> {
        let snapshot = self.inner.snapshot().map_err(js_error)?;
        serde_wasm_bindgen::to_value(&snapshot).map_err(serialization_error)
    }

    pub fn inspect(&self, class_name: &str) -> Result<JsValue, JsValue> {
        let inspection = self.inner.inspect(class_name).map_err(js_error)?;
        serde_wasm_bindgen::to_value(&inspection).map_err(serialization_error)
    }

    pub fn dispose(&mut self) {
        self.inner.dispose();
    }
}

#[wasm_bindgen(js_name = RenderSession)]
pub struct WasmRenderSession {
    inner: mastercss_render::RenderSession,
}

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
    ) -> Result<JsValue, JsValue> {
        render_value(
            &self
                .inner
                .native_declaration_candidates(class_names)
                .map_err(js_error)?,
        )
    }

    #[wasm_bindgen(js_name = ensureClasses)]
    pub fn ensure_classes(
        &mut self,
        class_names: Vec<String>,
        native_support: JsValue,
    ) -> Result<(), JsValue> {
        let native_support = if native_support.is_null() || native_support.is_undefined() {
            None
        } else {
            Some(
                serde_wasm_bindgen::from_value::<Vec<bool>>(native_support)
                    .map_err(serialization_error)?,
            )
        };
        self.inner
            .ensure_classes(class_names, native_support.as_deref())
            .map_err(js_error)
    }

    #[wasm_bindgen(js_name = ensureStylesheetResources)]
    pub fn ensure_stylesheet_resources(&mut self, native_css: &str) -> Result<(), JsValue> {
        self.inner
            .ensure_stylesheet_resources(native_css)
            .map_err(js_error)
    }

    #[wasm_bindgen(js_name = emittedGlobals)]
    pub fn emitted_globals(&self) -> Result<JsValue, JsValue> {
        render_value(&self.inner.emitted_globals().map_err(js_error)?)
    }

    pub fn snapshot(&self) -> Result<JsValue, JsValue> {
        render_value(&self.inner.snapshot().map_err(js_error)?)
    }

    #[wasm_bindgen(js_name = snapshotForClasses)]
    pub fn snapshot_for_classes(&self, class_names: Vec<String>) -> Result<JsValue, JsValue> {
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
pub fn binding_info() -> JsValue {
    let value = mastercss_schema::BindingInfo::new(
        env!("CARGO_PKG_VERSION"),
        "wasm32-unknown-unknown",
        "runtime",
        &["engine", "render"],
    );
    serde_wasm_bindgen::to_value(&value).expect("binding info is serializable")
}
