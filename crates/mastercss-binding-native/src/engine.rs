use super::*;
use mastercss_engine::{compile_program, parse_emitted_globals};
use napi::bindgen_prelude::{Buffer, Uint8Array};

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

    /// Executes a program that `compileRuntimeProgram` encoded.
    #[napi(factory)]
    pub fn from_program(program: Uint8Array, emitted_globals_json: Option<String>) -> Result<Self> {
        let globals = emitted_globals_json
            .as_deref()
            .map(parse_emitted_globals)
            .transpose()
            .map_err(to_napi_error)?
            .unwrap_or_default();
        Ok(Self {
            inner: RustEngineSession::from_program(&program, globals).map_err(to_napi_error)?,
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
                .register_emitted_globals(
                    parse_emitted_globals(&emitted_globals_json).map_err(to_napi_error)?,
                )
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn replace_emitted_globals(&mut self, emitted_globals_json: String) -> Result<String> {
        to_json(
            &self
                .inner
                .replace_emitted_globals(
                    parse_emitted_globals(&emitted_globals_json).map_err(to_napi_error)?,
                )
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
    pub fn refresh(
        &mut self,
        manifest_json: String,
        emitted_globals_json: Option<String>,
    ) -> Result<String> {
        to_json(
            &self
                .inner
                .refresh_with_emitted_globals(&manifest_json, emitted_globals_json.as_deref())
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn refresh_program(
        &mut self,
        program: Uint8Array,
        emitted_globals_json: Option<String>,
    ) -> Result<String> {
        let globals = emitted_globals_json
            .as_deref()
            .map(parse_emitted_globals)
            .transpose()
            .map_err(to_napi_error)?;
        to_json(
            &self
                .inner
                .refresh_program(&program, globals)
                .map_err(to_napi_error)?,
        )
    }

    /// The program's keyframe definitions in program order.
    #[napi]
    pub fn keyframe_definitions(&self) -> Result<String> {
        to_json(&self.inner.keyframe_definitions().map_err(to_napi_error)?)
    }

    #[napi]
    pub fn execution_state(&self, class_names: Vec<String>) -> Result<String> {
        to_json(
            &self
                .inner
                .execution_state(class_names)
                .map_err(to_napi_error)?,
        )
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

/// Compiles a manifest into the program that engine sessions execute.
#[napi]
pub fn compile_runtime_program(manifest_json: String) -> Result<Buffer> {
    Ok(compile_program(&manifest_json)
        .map_err(to_napi_error)?
        .into())
}
