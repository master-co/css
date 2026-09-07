#![forbid(unsafe_code)]

use mastercss_compiler::{
    CompileDefaultPresetRequest, CompileManifestOptions, CompileNativeCssOptions, CompilerError,
    CssImportGraphRequest, LowerCssDirectivesOptions, LowerCssDirectivesRequest,
};
use serde::Serialize;
use wasm_bindgen::prelude::*;

fn compiler_error(error: CompilerError) -> JsValue {
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

fn engine_error(error: mastercss_engine::EngineError) -> JsValue {
    JsValue::from_str(
        &serde_json::to_string(&error.diagnostic()).unwrap_or_else(|_| error.to_string()),
    )
}

#[wasm_bindgen]
pub struct CompilerRenderSession {
    inner: mastercss_render::RenderSession,
}

#[wasm_bindgen]
impl CompilerRenderSession {
    #[wasm_bindgen(constructor)]
    pub fn new(
        manifest_json: &str,
        emitted_globals_json: Option<String>,
    ) -> Result<CompilerRenderSession, JsValue> {
        Ok(Self {
            inner: mastercss_render::RenderSession::create(
                manifest_json,
                emitted_globals_json.as_deref(),
            )
            .map_err(engine_error)?,
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
            .map_err(engine_error)?;
        render_value(&candidates)
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
            .map_err(engine_error)
    }

    #[wasm_bindgen(js_name = ensureStylesheetResources)]
    pub fn ensure_stylesheet_resources(&mut self, native_css: &str) -> Result<(), JsValue> {
        self.inner
            .ensure_stylesheet_resources(native_css)
            .map_err(engine_error)
    }

    #[wasm_bindgen(js_name = emittedGlobals)]
    pub fn emitted_globals(&self) -> Result<JsValue, JsValue> {
        let emitted_globals = self.inner.emitted_globals().map_err(engine_error)?;
        render_value(&emitted_globals)
    }

    pub fn snapshot(&self) -> Result<JsValue, JsValue> {
        let snapshot = self.inner.snapshot().map_err(engine_error)?;
        render_value(&snapshot)
    }

    pub fn dispose(&mut self) {
        self.inner.dispose();
    }
}

#[wasm_bindgen(js_name = inspectCSS)]
pub fn inspect_css(source: &str) -> Result<JsValue, JsValue> {
    render_value(&mastercss_compiler::inspect_css(source))
}

#[wasm_bindgen(js_name = compileNativeCSS)]
pub fn compile_native_css(source: &str, options: JsValue) -> Result<JsValue, JsValue> {
    let options = if options.is_null() || options.is_undefined() {
        CompileNativeCssOptions::default()
    } else {
        serde_wasm_bindgen::from_value(options).map_err(serialization_error)?
    };
    let result =
        mastercss_compiler::compile_native_css(source, &options).map_err(compiler_error)?;
    render_value(&result)
}

#[wasm_bindgen(js_name = analyzeCSSDependencies)]
pub fn analyze_css_dependencies(source: &str) -> Result<JsValue, JsValue> {
    render_value(&mastercss_compiler::analyze_css_dependencies(source))
}

#[wasm_bindgen(js_name = analyzeStandaloneDirectives)]
pub fn analyze_standalone_directives(source: &str) -> Result<JsValue, JsValue> {
    render_value(&mastercss_compiler::analyze_standalone_directives(source))
}

#[wasm_bindgen(js_name = mergeCSSExtractionPolicies)]
pub fn merge_css_extraction_policies(policies: JsValue) -> Result<JsValue, JsValue> {
    let policies = serde_wasm_bindgen::from_value::<
        Vec<mastercss_schema::CssDirectiveExtractionPolicy>,
    >(policies)
    .map_err(serialization_error)?;
    render_value(&mastercss_compiler::merge_extraction_policies(&policies))
}

#[wasm_bindgen(js_name = filterCSSExtractionCandidates)]
pub fn filter_css_extraction_candidates(
    candidates: Vec<String>,
    blocklist: JsValue,
) -> Result<Vec<String>, JsValue> {
    let blocklist = serde_wasm_bindgen::from_value::<
        Vec<mastercss_schema::CssDirectiveBlocklistEntry>,
    >(blocklist)
    .map_err(serialization_error)?;
    Ok(mastercss_schema::filter_css_extraction_candidates(
        candidates, &blocklist,
    ))
}

#[wasm_bindgen(js_name = compileCSSDirectives)]
pub fn compile_css_directives(source: &str, options: JsValue) -> Result<JsValue, JsValue> {
    let options = if options.is_null() || options.is_undefined() {
        CompileNativeCssOptions::default()
    } else {
        serde_wasm_bindgen::from_value(options).map_err(serialization_error)?
    };
    let result =
        mastercss_compiler::compile_css_directives(source, &options).map_err(compiler_error)?;
    render_value(&result)
}

#[wasm_bindgen(js_name = compileManifestInput)]
pub fn compile_manifest_input(input: JsValue, options: JsValue) -> Result<JsValue, JsValue> {
    let input =
        serde_wasm_bindgen::from_value::<mastercss_schema::CssDirectiveManifestInput>(input)
            .map_err(serialization_error)?;
    let options = if options.is_null() || options.is_undefined() {
        CompileManifestOptions::default()
    } else {
        serde_wasm_bindgen::from_value(options).map_err(serialization_error)?
    };
    let result =
        mastercss_compiler::compile_manifest_input(&input, &options).map_err(compiler_error)?;
    render_value(&result)
}

#[wasm_bindgen(js_name = lowerCSSDirectives)]
pub fn lower_css_directives(request: JsValue, options: JsValue) -> Result<JsValue, JsValue> {
    let request = serde_wasm_bindgen::from_value::<LowerCssDirectivesRequest>(request)
        .map_err(serialization_error)?;
    let options = if options.is_null() || options.is_undefined() {
        LowerCssDirectivesOptions::default()
    } else {
        serde_wasm_bindgen::from_value(options).map_err(serialization_error)?
    };
    let result = mastercss_compiler::lower_css_directives_request(&request, &options)
        .map_err(compiler_error)?;
    render_value(&result)
}

#[wasm_bindgen(js_name = normalizeManifestForJSON)]
pub fn normalize_manifest_for_json(manifest: JsValue) -> Result<JsValue, JsValue> {
    let manifest = serde_wasm_bindgen::from_value::<serde_json::Value>(manifest)
        .map_err(serialization_error)?;
    let normalized =
        mastercss_compiler::normalize_manifest_for_json(&manifest).map_err(compiler_error)?;
    render_value(&normalized)
}

#[wasm_bindgen(js_name = normalizeDefaultManifestForJSON)]
pub fn normalize_default_manifest_for_json(manifest: JsValue) -> Result<JsValue, JsValue> {
    let manifest = serde_wasm_bindgen::from_value::<serde_json::Value>(manifest)
        .map_err(serialization_error)?;
    let normalized = mastercss_compiler::normalize_default_manifest_for_json(&manifest)
        .map_err(compiler_error)?;
    render_value(&normalized)
}

#[wasm_bindgen(js_name = compileDefaultPresetManifest)]
pub fn compile_default_preset_manifest(request: JsValue) -> Result<JsValue, JsValue> {
    let request = serde_wasm_bindgen::from_value::<CompileDefaultPresetRequest>(request)
        .map_err(serialization_error)?;
    let result =
        mastercss_compiler::compile_default_preset_manifest(&request).map_err(compiler_error)?;
    render_value(&result)
}

#[wasm_bindgen(js_name = resolveCSSImportGraph)]
pub fn resolve_css_import_graph(request: JsValue) -> Result<JsValue, JsValue> {
    let request = serde_wasm_bindgen::from_value::<CssImportGraphRequest>(request)
        .map_err(serialization_error)?;
    let result =
        mastercss_compiler::resolve_prepared_css_import_graph(&request).map_err(compiler_error)?;
    render_value(&result)
}

#[wasm_bindgen(js_name = bindingInfo)]
pub fn binding_info() -> Result<JsValue, JsValue> {
    serde_wasm_bindgen::to_value(&mastercss_schema::BindingInfo::new(
        env!("CARGO_PKG_VERSION"),
        "wasm32-unknown-unknown",
        "compiler",
        &["compiler", "render"],
    ))
    .map_err(serialization_error)
}
