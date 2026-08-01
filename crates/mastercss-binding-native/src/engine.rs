use super::*;

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
    pub fn register_emitted_globals(&mut self, emitted_globals_json: String) -> Result<String> {
        to_json(
            &self
                .inner
                .register_emitted_globals(&emitted_globals_json)
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
