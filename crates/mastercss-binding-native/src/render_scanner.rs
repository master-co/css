use super::*;

#[napi(js_name = "RenderSession")]
pub struct NodeRenderSession {
    inner: RustRenderSession,
}

#[napi]
impl NodeRenderSession {
    #[napi(constructor)]
    pub fn new(manifest_json: String, emitted_globals_json: Option<String>) -> Result<Self> {
        Ok(Self {
            inner: RustRenderSession::create(&manifest_json, emitted_globals_json.as_deref())
                .map_err(to_napi_error)?,
        })
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
    pub fn ensure_classes(
        &mut self,
        class_names: Vec<String>,
        native_support: Option<Vec<bool>>,
    ) -> Result<()> {
        self.inner
            .ensure_classes(class_names, native_support.as_deref())
            .map_err(to_napi_error)
    }

    #[napi]
    pub fn ensure_stylesheet_resources(&mut self, native_css: String) -> Result<()> {
        self.inner
            .ensure_stylesheet_resources(&native_css)
            .map_err(to_napi_error)
    }

    #[napi]
    pub fn emitted_globals(&self) -> Result<String> {
        to_json(&self.inner.emitted_globals().map_err(to_napi_error)?)
    }

    #[napi]
    pub fn snapshot(&self) -> Result<String> {
        to_json(&self.inner.snapshot().map_err(to_napi_error)?)
    }

    #[napi]
    pub fn snapshot_for_classes(&self, class_names: Vec<String>) -> Result<String> {
        to_json(
            &self
                .inner
                .snapshot_for_classes(class_names)
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn dispose(&mut self) {
        self.inner.dispose();
    }
}

#[napi(js_name = "ScannerSession")]
pub struct NodeScannerSession {
    inner: RustScannerSession,
}

#[napi]
impl NodeScannerSession {
    #[napi(constructor)]
    pub fn new(manifest_json: String) -> Result<Self> {
        Ok(Self {
            inner: RustScannerSession::create(&manifest_json).map_err(to_napi_error)?,
        })
    }

    #[napi]
    pub fn scan(&mut self, source: String, content: String) -> Result<String> {
        to_json(&self.inner.scan(&source, &content).map_err(to_napi_error)?)
    }

    #[napi]
    pub fn extract_candidates(&self, source: String, content: String) -> Vec<String> {
        mastercss_scanner::extract_source_candidates(&source, &content)
    }

    #[napi]
    pub fn native_declaration_candidates(&self, candidates: Vec<String>) -> Result<String> {
        to_json(
            &self
                .inner
                .native_declaration_candidates(candidates)
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn collect_candidates(&mut self, candidates: Vec<String>) -> Vec<String> {
        self.inner.collect_candidates(candidates)
    }

    #[napi]
    pub fn filter_candidates(
        &self,
        candidates: Vec<String>,
        blocklist_json: String,
    ) -> Result<Vec<String>> {
        let blocklist = serde_json::from_str::<Vec<mastercss_schema::CssDirectiveBlocklistEntry>>(
            &blocklist_json,
        )
        .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
        Ok(mastercss_scanner::filter_blocklisted_candidates(
            candidates, &blocklist,
        ))
    }

    #[napi]
    pub fn invalid_generated_classes(
        &self,
        batch_json: String,
        rule_support: Vec<Vec<bool>>,
    ) -> Result<Vec<String>> {
        let batch = serde_json::from_str::<mastercss_schema::ValidatorBatchIr>(&batch_json)
            .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
        Ok(mastercss_scanner::invalid_generated_classes(
            &batch,
            &rule_support,
        ))
    }

    #[napi]
    pub fn scan_candidates(
        &mut self,
        source: String,
        content: String,
        candidates: Vec<String>,
        blocklist_json: String,
        native_support: Vec<bool>,
        invalid_generated_classes: Vec<String>,
    ) -> Result<String> {
        let blocklist = serde_json::from_str::<Vec<mastercss_schema::CssDirectiveBlocklistEntry>>(
            &blocklist_json,
        )
        .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
        to_json(
            &self
                .inner
                .scan_candidates(
                    &source,
                    &content,
                    candidates,
                    &blocklist,
                    &native_support,
                    &invalid_generated_classes
                        .into_iter()
                        .collect::<HashSet<_>>(),
                )
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn ensure_classes(&mut self, class_names: Vec<String>) -> Result<String> {
        to_json(
            &self
                .inner
                .ensure_classes(class_names)
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn register_native_classes(&mut self, class_names: Vec<String>) -> bool {
        self.inner.register_native_classes(class_names)
    }

    #[napi]
    pub fn reset(&mut self) -> Result<()> {
        self.inner.reset().map_err(to_napi_error)
    }

    #[napi]
    pub fn state(&self) -> Result<String> {
        to_json(&self.inner.state().map_err(to_napi_error)?)
    }

    #[napi]
    pub fn dispose(&mut self) {
        self.inner.dispose();
    }
}
