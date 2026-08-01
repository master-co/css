use super::*;

impl LintSession {
    pub fn create(manifest_json: &str) -> Result<Self, EngineError> {
        let (variable_keys, variable_values) = collect_manifest_variables(manifest_json);
        let engine = EngineSession::create(manifest_json)?;
        let manifest = serde_json::from_str::<Value>(manifest_json).unwrap_or(Value::Null);
        let canonical_index = build_canonical_recommendation_index(&manifest, &engine)?;
        Ok(Self {
            engine,
            variable_keys,
            variable_values,
            canonical_index,
            supported_native_declarations: HashSet::new(),
        })
    }

    pub fn native_declaration_candidates<I, S>(
        &self,
        class_names: I,
    ) -> Result<Vec<NativeDeclarationCandidateIr>, EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        self.engine.native_declaration_candidates(class_names)
    }

    pub fn analyze<I, S>(
        &mut self,
        class_names: I,
        native_support: Option<&[bool]>,
        invalid_generated_classes: &HashSet<String>,
    ) -> Result<LintBatchIr, EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        let class_names = class_names
            .into_iter()
            .map(|class_name| class_name.as_ref().to_owned())
            .collect::<Vec<_>>();
        self.analyze_with_matches(class_names, native_support, invalid_generated_classes)
            .map(|(analysis, _)| analysis)
    }

    pub(crate) fn analyze_with_matches(
        &mut self,
        class_names: Vec<String>,
        native_support: Option<&[bool]>,
        invalid_generated_classes: &HashSet<String>,
    ) -> Result<(LintBatchIr, Vec<bool>), EngineError> {
        self.ensure_class_rules(&class_names, native_support)?;
        let descriptors = class_names
            .iter()
            .map(|class_name| {
                let inspection = self.engine.inspect(class_name)?;
                let rule_count = inspection.rules.len();
                Ok(ClassDescriptor::new(
                    class_name,
                    inspection.rules.first().cloned(),
                    rule_count,
                    !invalid_generated_classes.contains(class_name),
                ))
            })
            .collect::<Result<Vec<_>, EngineError>>()?;
        let sorted_class_names = sort_descriptors(&descriptors);
        let conflicts = find_conflicts(&descriptors);
        let partial_conflicts = find_partial_conflicts(
            &descriptors,
            &self.engine,
            &self.variable_keys,
            &self.variable_values,
        )?;
        let matches = descriptors
            .iter()
            .map(|descriptor| descriptor.matched)
            .collect();
        self.engine.delete_class_rules(&class_names)?;
        Ok((
            LintBatchIr {
                version: LINT_BATCH_VERSION,
                sorted_class_names,
                conflicts,
                partial_conflicts,
            },
            matches,
        ))
    }

    pub fn analyze_class_list(
        &mut self,
        class_list: &str,
        class_names: &[String],
        native_support: Option<&[bool]>,
        invalid_generated_classes: &HashSet<String>,
        policy: LintClassListPolicy<'_>,
    ) -> Result<LintClassListIr, EngineError> {
        let (analysis, matches) = self.analyze_with_matches(
            class_names.to_vec(),
            native_support,
            invalid_generated_classes,
        )?;
        let raw_value_candidates = if policy
            .raw_value_policy
            .is_some_and(|policy| !policy.allow_raw_values)
        {
            self.collect_raw_value_candidates(class_names, invalid_generated_classes)?
        } else {
            Vec::new()
        };
        let mut result = class_list::create_class_list_ir(
            class_list,
            class_names,
            analysis,
            class_list::ClassListPolicy {
                matches: &matches,
                validation_errors: policy.validation_errors,
                disallow_unknown_class: policy.disallow_unknown_class,
                raw_value_candidates: &raw_value_candidates,
                raw_value_policy: policy.raw_value_policy,
            },
        );
        if let Some(options) = policy.canonical_options {
            if policy.compose_directive {
                let compose =
                    self.canonical_compose_directive(class_names, native_support, options)?;
                if compose.structural_change == Some(true) {
                    class_list::add_canonical_compose_diagnostics(
                        &mut result,
                        class_list,
                        class_names,
                        &compose,
                    );
                } else {
                    let groups =
                        self.canonical_class_groups(class_names, native_support, options)?;
                    let names = self.canonical_class_names(class_names, native_support, options)?;
                    class_list::add_canonical_class_diagnostics(
                        &mut result,
                        class_list,
                        class_names,
                        &groups.suggestions,
                        &names.suggestions,
                    );
                }
            } else {
                let groups = self.canonical_class_groups(class_names, native_support, options)?;
                let names = self.canonical_class_names(class_names, native_support, options)?;
                class_list::add_canonical_class_diagnostics(
                    &mut result,
                    class_list,
                    class_names,
                    &groups.suggestions,
                    &names.suggestions,
                );
            }
        }
        Ok(result)
    }

    pub fn raw_value_candidates(
        &mut self,
        class_names: &[String],
        native_support: Option<&[bool]>,
        invalid_generated_classes: &HashSet<String>,
    ) -> Result<RawValueCandidatesIr, EngineError> {
        self.ensure_class_rules(class_names, native_support)?;
        let candidates =
            self.collect_raw_value_candidates(class_names, invalid_generated_classes)?;
        self.engine.delete_class_rules(class_names)?;
        Ok(RawValueCandidatesIr {
            version: LINT_BATCH_VERSION,
            candidates,
        })
    }

    pub fn canonical_class_names(
        &mut self,
        class_names: &[String],
        native_support: Option<&[bool]>,
        options: &CanonicalClassNameOptions,
    ) -> Result<CanonicalClassSuggestionsIr, EngineError> {
        self.ensure_class_rules(class_names, native_support)?;
        let result = (|| {
            let mut suggestions = Vec::new();
            for class_name in class_names {
                if let Some(recommended) = self.suggest_canonical_class_name(class_name, options)? {
                    suggestions.push(CanonicalClassSuggestionIr {
                        class_name: class_name.clone(),
                        recommended,
                    });
                }
            }
            Ok(CanonicalClassSuggestionsIr {
                version: LINT_BATCH_VERSION,
                suggestions,
            })
        })();
        let cleanup = self.engine.delete_class_rules(class_names);
        match result {
            Ok(result) => {
                cleanup?;
                Ok(result)
            }
            Err(error) => {
                let _ = cleanup;
                Err(error)
            }
        }
    }

    pub fn canonical_class_groups(
        &mut self,
        class_names: &[String],
        native_support: Option<&[bool]>,
        options: &CanonicalClassNameOptions,
    ) -> Result<CanonicalClassGroupSuggestionsIr, EngineError> {
        if !options.prefer_composition_utilities {
            return Ok(CanonicalClassGroupSuggestionsIr {
                version: LINT_BATCH_VERSION,
                suggestions: Vec::new(),
            });
        }
        self.ensure_class_rules(class_names, native_support)?;
        let result = self.suggest_canonical_class_groups(class_names, options);
        let cleanup = self.engine.delete_class_rules(class_names);
        match result {
            Ok(suggestions) => {
                cleanup?;
                Ok(CanonicalClassGroupSuggestionsIr {
                    version: LINT_BATCH_VERSION,
                    suggestions,
                })
            }
            Err(error) => {
                let _ = cleanup;
                Err(error)
            }
        }
    }

    pub fn canonical_compose_directive(
        &mut self,
        class_names: &[String],
        native_support: Option<&[bool]>,
        options: &CanonicalClassNameOptions,
    ) -> Result<CanonicalComposeDirectiveIr, EngineError> {
        let native_candidates = self.ensure_class_rules(class_names, native_support)?;
        let mut native_declarations = HashMap::new();
        for (index, candidate) in native_candidates.into_iter().enumerate() {
            if native_support
                .and_then(|support| support.get(index))
                .copied()
                .unwrap_or(false)
                && self.is_compose_native_declaration(&candidate)?
            {
                native_declarations.insert(candidate.class_name.clone(), candidate);
            }
        }
        for class_name in class_names {
            if !native_declarations.contains_key(class_name)
                && let Some(candidate) = self.known_native_declaration(class_name)?
            {
                native_declarations.insert(class_name.clone(), candidate);
            }
        }
        let result =
            self.suggest_canonical_compose_directive(class_names, options, native_declarations);
        let cleanup = self.engine.delete_class_rules(class_names);
        match result {
            Ok(result) => {
                cleanup?;
                Ok(result)
            }
            Err(error) => {
                let _ = cleanup;
                Err(error)
            }
        }
    }
}
