use super::*;

#[napi(js_name = "ValidatorSession")]
pub struct NodeValidatorSession {
    inner: RustValidatorSession,
}

#[napi(js_name = "LintSession")]
pub struct NodeLintSession {
    inner: RustLintSession,
}

#[napi]
impl NodeLintSession {
    #[napi(constructor)]
    pub fn new(manifest_json: String) -> Result<Self> {
        Ok(Self {
            inner: RustLintSession::create(&manifest_json).map_err(to_napi_error)?,
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
    pub fn resolve_validation(
        &self,
        batch_json: String,
        rule_errors_json: String,
    ) -> Result<String> {
        let batch = serde_json::from_str::<mastercss_schema::ValidatorBatchIr>(&batch_json)
            .map_err(|error| invalid_lint_request(error.to_string()))?;
        let rule_errors = serde_json::from_str::<Vec<Vec<Vec<String>>>>(&rule_errors_json)
            .map_err(|error| invalid_lint_request(error.to_string()))?;
        to_json(&mastercss_lint::classify_host_rule_validation(
            &batch,
            &rule_errors,
        ))
    }

    #[napi]
    pub fn analyze(
        &mut self,
        class_names: Vec<String>,
        native_support: Option<Vec<bool>>,
        invalid_generated_classes: Vec<String>,
    ) -> Result<String> {
        to_json(
            &self
                .inner
                .analyze(
                    class_names,
                    native_support.as_deref(),
                    &invalid_generated_classes
                        .into_iter()
                        .collect::<HashSet<_>>(),
                )
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn analyze_class_list(
        &mut self,
        class_list: String,
        class_names: Vec<String>,
        native_support: Option<Vec<bool>>,
        invalid_generated_classes: Vec<String>,
    ) -> Result<String> {
        to_json(
            &self
                .inner
                .analyze_class_list(
                    &class_list,
                    &class_names,
                    native_support.as_deref(),
                    &invalid_generated_classes
                        .into_iter()
                        .collect::<HashSet<_>>(),
                    LintClassListPolicy::default(),
                )
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn analyze_class_list_policy(&mut self, request_json: String) -> Result<String> {
        let request = serde_json::from_str::<LintClassListRequest>(&request_json)
            .map_err(|error| invalid_lint_request(error.to_string()))?;
        if request.version != mastercss_schema::LINT_BATCH_VERSION {
            return Err(invalid_lint_request(
                "Unsupported lint class-list request version",
            ));
        }
        let raw_value_policy = request
            .raw_value_policy
            .map(|policy| {
                RawValuePolicy::new(
                    policy.allow_raw_values,
                    policy.allow_properties,
                    policy.allowed_patterns,
                )
            })
            .transpose()
            .map_err(invalid_lint_request)?;
        to_json(
            &self
                .inner
                .analyze_class_list(
                    &request.class_list,
                    &request.class_names,
                    request.native_support.as_deref(),
                    &request
                        .invalid_generated_classes
                        .into_iter()
                        .collect::<HashSet<_>>(),
                    LintClassListPolicy {
                        validation_errors: &request.validation_errors,
                        disallow_unknown_class: request.disallow_unknown_class,
                        raw_value_policy: raw_value_policy.as_ref(),
                        canonical_options: request.canonical_options.as_ref(),
                        compose_directive: request.compose_directive,
                    },
                )
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn raw_value_candidates(
        &mut self,
        class_names: Vec<String>,
        native_support: Option<Vec<bool>>,
        invalid_generated_classes: Vec<String>,
    ) -> Result<String> {
        to_json(
            &self
                .inner
                .raw_value_candidates(
                    &class_names,
                    native_support.as_deref(),
                    &invalid_generated_classes
                        .into_iter()
                        .collect::<HashSet<_>>(),
                )
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn canonical_class_names(
        &mut self,
        class_names: Vec<String>,
        native_support: Option<Vec<bool>>,
        options_json: Option<String>,
    ) -> Result<String> {
        let options = options_json
            .as_deref()
            .map(serde_json::from_str::<CanonicalClassNameOptions>)
            .transpose()
            .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?
            .unwrap_or_default();
        to_json(
            &self
                .inner
                .canonical_class_names(&class_names, native_support.as_deref(), &options)
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn canonical_class_groups(
        &mut self,
        class_names: Vec<String>,
        native_support: Option<Vec<bool>>,
        options_json: Option<String>,
    ) -> Result<String> {
        let options = options_json
            .as_deref()
            .map(serde_json::from_str::<CanonicalClassNameOptions>)
            .transpose()
            .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?
            .unwrap_or_default();
        to_json(
            &self
                .inner
                .canonical_class_groups(&class_names, native_support.as_deref(), &options)
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn canonical_compose_directive(
        &mut self,
        class_names: Vec<String>,
        native_support: Option<Vec<bool>>,
        options_json: Option<String>,
    ) -> Result<String> {
        let options = options_json
            .as_deref()
            .map(serde_json::from_str::<CanonicalClassNameOptions>)
            .transpose()
            .map_err(|error| Error::new(Status::InvalidArg, error.to_string()))?
            .unwrap_or_default();
        to_json(
            &self
                .inner
                .canonical_compose_directive(&class_names, native_support.as_deref(), &options)
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn dispose(&mut self) {
        self.inner.dispose();
    }
}

#[napi]
impl NodeValidatorSession {
    #[napi(constructor)]
    pub fn new(manifest_json: String) -> Result<Self> {
        Ok(Self {
            inner: RustValidatorSession::create(&manifest_json).map_err(to_napi_error)?,
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
    pub fn generate_classes(
        &mut self,
        class_names: Vec<String>,
        native_support: Option<Vec<bool>>,
    ) -> Result<String> {
        to_json(
            &self
                .inner
                .generate_classes(class_names, native_support.as_deref())
                .map_err(to_napi_error)?,
        )
    }

    #[napi]
    pub fn dispose(&mut self) {
        self.inner.dispose();
    }
}
