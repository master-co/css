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
    pub fn ensure_classes(&mut self, class_names: Vec<String>) -> Result<()> {
        self.inner
            .ensure_classes(class_names)
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

fn scanner_error(error: mastercss_scanner::ScannerError) -> Error {
    Error::new(
        Status::GenericFailure,
        serde_json::to_string(&error.diagnostic()).unwrap_or_else(|_| error.to_string()),
    )
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
            inner: RustScannerSession::create(&manifest_json).map_err(scanner_error)?,
        })
    }

    #[napi]
    pub fn scan(&mut self, source: String, content: String) -> Result<String> {
        to_json(&self.inner.scan(&source, &content).map_err(scanner_error)?)
    }

    #[napi]
    pub fn extract_candidates(
        &self,
        source: String,
        content: String,
        options_json: String,
    ) -> Result<Vec<String>> {
        let options = serde_json::from_str(&options_json)
            .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
        mastercss_scanner::extract(&source, &content, &options).map_err(scanner_error)
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
            &candidates,
            &blocklist,
        ))
    }

    #[napi]
    pub fn scan_candidates(
        &mut self,
        source: String,
        content: String,
        candidates: Vec<String>,
        blocklist_json: String,
        options_json: String,
    ) -> Result<String> {
        let blocklist: Vec<mastercss_schema::CssDirectiveBlocklistEntry> =
            serde_json::from_str(&blocklist_json)
                .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
        let options = serde_json::from_str(&options_json)
            .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
        to_json(
            &self
                .inner
                .scan_candidates(&source, &content, candidates, &blocklist, &options)
                .map_err(scanner_error)?,
        )
    }

    #[napi]
    pub fn remove_source(&mut self, source: String, options_json: String) -> Result<String> {
        let options = serde_json::from_str(&options_json)
            .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
        to_json(
            &self
                .inner
                .remove_source(&source, &options)
                .map_err(scanner_error)?,
        )
    }

    #[napi]
    pub fn reconcile_sources(&mut self, owner: String, inputs_json: String) -> Result<String> {
        let inputs = serde_json::from_str(&inputs_json)
            .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?;
        to_json(
            &self
                .inner
                .reconcile_sources(&owner, inputs)
                .map_err(scanner_error)?,
        )
    }

    #[napi]
    pub fn remove_owner(&mut self, owner: String) -> Result<String> {
        to_json(&self.inner.remove_owner(&owner).map_err(scanner_error)?)
    }

    #[napi]
    pub fn ensure_classes(&mut self, class_names: Vec<String>) -> Result<String> {
        to_json(
            &self
                .inner
                .ensure_classes(class_names)
                .map_err(scanner_error)?,
        )
    }

    #[napi]
    pub fn register_native_classes(&mut self, owner: String, class_names: Vec<String>) -> bool {
        self.inner.register_native_classes(&owner, class_names)
    }

    #[napi]
    pub fn reset(&mut self) -> Result<()> {
        self.inner.reset().map_err(scanner_error)
    }

    #[napi]
    pub fn state(&self) -> Result<String> {
        to_json(&self.inner.state().map_err(scanner_error)?)
    }

    #[napi]
    pub fn dispose(&mut self) {
        self.inner.dispose();
    }
}
