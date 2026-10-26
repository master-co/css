#![forbid(unsafe_code)]

mod json;

use json::WriteJson;
use mastercss_engine::{EngineError, EngineSession as RustEngineSession};
use mastercss_schema::EmittedGlobals;
use wasm_bindgen::prelude::*;

// Results cross the boundary as JSON text that the JavaScript provider parses.
// Sessions execute encoded programs, and emitted globals arrive as two arrays so the
// runtime parses no JSON. Only `full` builds compile manifests; those entry points
// take JSON like the native binding.

fn js_error(error: EngineError) -> JsValue {
    JsValue::from_str(&error.diagnostic().to_json())
}

/// Decodes emitted globals from `names`, the variables, keyframes, keyframe slots and
/// suppressed keyframes in that order, and `counts`: how many variables, keyframes
/// and slots there are, then each variable's count and each keyframe's count.
fn emitted_globals(names: Vec<String>, counts: Vec<u32>) -> Result<EmittedGlobals, JsValue> {
    let invalid = || {
        js_error(EngineError::InvalidEmittedGlobals(
            "malformed arrays".into(),
        ))
    };
    let &[variables, keyframes, slots, ref values @ ..] = counts.as_slice() else {
        return Err(invalid());
    };
    let (variables, keyframes, slots) = (variables as usize, keyframes as usize, slots as usize);
    let counted = variables.saturating_add(keyframes);
    if values.len() != counted || names.len() < counted.saturating_add(slots) {
        return Err(invalid());
    }
    let (variable_counts, keyframe_counts) = values.split_at(variables);
    let mut names = names.into_iter();
    let mut globals = EmittedGlobals::default();
    // Inserting needs no sort, unlike collecting into the maps. The counts lead each
    // zip, so ending one consumes no extra name.
    for (&count, name) in variable_counts.iter().zip(names.by_ref()) {
        globals.variables.insert(name, count);
    }
    for (&count, id) in keyframe_counts.iter().zip(names.by_ref()) {
        globals.keyframes.insert(id, count);
    }
    globals.keyframe_slots = names.by_ref().take(slots).collect();
    globals.suppressed_keyframes = names.collect();
    Ok(globals)
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
        program: &[u8],
        names: Vec<String>,
        counts: Vec<u32>,
    ) -> Result<WasmEngineSession, JsValue> {
        let globals = emitted_globals(names, counts)?;
        Ok(Self {
            inner: RustEngineSession::from_program(program, globals).map_err(js_error)?,
        })
    }

    #[cfg(feature = "full")]
    #[wasm_bindgen(js_name = fromManifest)]
    pub fn from_manifest(
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
        names: Vec<String>,
        counts: Vec<u32>,
    ) -> Result<String, JsValue> {
        let globals = emitted_globals(names, counts)?;
        let transition = self
            .inner
            .register_emitted_globals(globals)
            .map_err(js_error)?;
        Ok(transition.to_json())
    }

    #[wasm_bindgen(js_name = replaceEmittedGlobals)]
    pub fn replace_emitted_globals(
        &mut self,
        names: Vec<String>,
        counts: Vec<u32>,
    ) -> Result<String, JsValue> {
        let globals = emitted_globals(names, counts)?;
        let transition = self
            .inner
            .replace_emitted_globals(globals)
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

    /// Executes another program, with new emitted globals when both arrays are given.
    pub fn refresh(
        &mut self,
        program: &[u8],
        names: Option<Vec<String>>,
        counts: Option<Vec<u32>>,
    ) -> Result<String, JsValue> {
        let globals = match (names, counts) {
            (Some(names), Some(counts)) => Some(emitted_globals(names, counts)?),
            _ => None,
        };
        let transition = self
            .inner
            .refresh_program(program, globals)
            .map_err(js_error)?;
        Ok(transition.to_json())
    }

    #[cfg(feature = "full")]
    #[wasm_bindgen(js_name = refreshManifest)]
    pub fn refresh_manifest(
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

    /// The program's keyframe definitions in program order, which the host uses to
    /// place keyframe rules.
    #[wasm_bindgen(js_name = keyframeDefinitions)]
    pub fn keyframe_definitions(&self) -> Result<String, JsValue> {
        let definitions = self.inner.keyframe_definitions().map_err(js_error)?;
        Ok(definitions.to_json())
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

/// Compiles a manifest into the program that engine sessions execute.
#[cfg(feature = "full")]
#[wasm_bindgen(js_name = compileRuntimeProgram)]
pub fn compile_runtime_program(manifest_json: &str) -> Result<Vec<u8>, JsValue> {
    mastercss_engine::compile_program(manifest_json).map_err(js_error)
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

#[cfg(test)]
mod tests {
    #[test]
    fn decodes_emitted_globals_from_names_and_counts() {
        let names = ["a", "b", "fade", "slot", "hidden"]
            .map(String::from)
            .to_vec();
        let globals = super::emitted_globals(names, vec![2, 1, 1, 3, 4, 5]).unwrap();
        assert_eq!(
            serde_json::to_value(&globals).unwrap(),
            serde_json::json!({
                "variables": { "a": 3, "b": 4 },
                "keyframes": { "fade": 5 },
                "keyframeSlots": ["slot"],
                "suppressedKeyframes": ["hidden"]
            })
        );
    }
}
