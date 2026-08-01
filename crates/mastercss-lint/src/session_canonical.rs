use super::*;

impl LintSession {
    pub(crate) fn suggest_canonical_class_groups(
        &self,
        class_names: &[String],
        options: &CanonicalClassNameOptions,
    ) -> Result<Vec<CanonicalClassGroupSuggestionIr>, EngineError> {
        let mut entries = Vec::new();
        for (index, class_name) in class_names.iter().enumerate() {
            let canonical_class_name = self
                .suggest_canonical_class_name(class_name, options)?
                .unwrap_or_else(|| class_name.clone());
            let inspection = self.engine.inspect(&canonical_class_name)?;
            if inspection.rules.len() != 1 {
                continue;
            }
            let semantics = self.engine.inspect_class_semantics(&canonical_class_name)?;
            let parts = canonical_class_parts(&canonical_class_name, &semantics);
            let Some(value) = parts.value else {
                continue;
            };
            let declarations = collect_rule_declarations(&inspection.rules[0].text);
            if declarations.len() != 1 {
                continue;
            }
            entries.push(CanonicalGroupEntry {
                index,
                class_name: class_name.clone(),
                canonical_class_name,
                value,
                suffix: parts.suffix,
                property: declarations[0].0.clone(),
                declarations,
                rule: inspection.rules[0].clone(),
            });
        }

        let mut suggestions = Vec::new();
        let mut used_indexes = HashSet::new();
        for left_index in 0..entries.len() {
            let left = &entries[left_index];
            if used_indexes.contains(&left.index) {
                continue;
            }
            for right in entries.iter().skip(left_index + 1) {
                if used_indexes.contains(&right.index) {
                    continue;
                }
                let Some(recipe) = matching_composition_recipe(left, right) else {
                    continue;
                };
                let Some(recommended) =
                    self.composition_recommendation(left, right, recipe, options)?
                else {
                    continue;
                };
                suggestions.push(CanonicalClassGroupSuggestionIr {
                    class_names: vec![left.class_name.clone(), right.class_name.clone()],
                    recommended,
                });
                used_indexes.insert(left.index);
                used_indexes.insert(right.index);
                break;
            }
        }
        Ok(suggestions)
    }

    pub(crate) fn composition_recommendation(
        &self,
        left: &CanonicalGroupEntry,
        right: &CanonicalGroupEntry,
        recipe: CompositionRecipe,
        options: &CanonicalClassNameOptions,
    ) -> Result<Option<String>, EngineError> {
        if left.suffix != right.suffix || left.rule.priority != right.rule.priority {
            return Ok(None);
        }
        let Some(merged_declarations) = merge_group_declarations(left, right) else {
            return Ok(None);
        };
        let expected = normalize_composition_declarations(&merged_declarations, recipe);
        let mut candidates = Vec::new();
        for entry in [left, right] {
            let candidate = format!("{}:{}{}", recipe.target_key, entry.value, entry.suffix);
            let candidate = self
                .suggest_canonical_class_name(&candidate, options)?
                .unwrap_or(candidate);
            if !candidates.contains(&candidate) {
                candidates.push(candidate);
            }
        }
        candidates
            .sort_by(|left, right| left.len().cmp(&right.len()).then_with(|| left.cmp(right)));

        for candidate in candidates {
            if candidate == left.canonical_class_name || candidate == right.canonical_class_name {
                continue;
            }
            let inspection = self.engine.inspect(&candidate)?;
            if inspection.rules.len() != 1 {
                continue;
            }
            let rule = &inspection.rules[0];
            if rule.layer != UtilityLayerName::Utilities || rule.priority != left.rule.priority {
                continue;
            }
            let declarations =
                normalize_composition_declarations(&collect_rule_declarations(&rule.text), recipe);
            if declarations == expected {
                return Ok(Some(candidate));
            }
        }
        Ok(None)
    }

    pub(crate) fn suggest_canonical_class_name(
        &self,
        class_name: &str,
        options: &CanonicalClassNameOptions,
    ) -> Result<Option<String>, EngineError> {
        let source = self.engine.inspect(class_name)?;
        if source.rules.is_empty() {
            return Ok(None);
        }
        let semantics = self.engine.inspect_class_semantics(class_name)?;
        let parts = canonical_class_parts(class_name, &semantics);
        let canonical_suffix = canonical_condition_suffix(
            &parts,
            &semantics,
            &source.rules,
            &self.canonical_index,
            options,
        );
        let mut candidates = Vec::new();

        if options.prefer_static_utilities {
            let signature = rules_declaration_signature(&source.rules);
            for candidate_base in self
                .canonical_index
                .static_candidates_by_signature
                .get(&signature)
                .into_iter()
                .flatten()
            {
                push_canonical_candidate(
                    &mut candidates,
                    candidate_base,
                    &parts,
                    &canonical_suffix,
                    0,
                );
            }
        }

        if let (Some(source_key), Some(source_value)) = (&parts.key, &parts.value) {
            if options.prefer_theme_tokens {
                let variable_match =
                    self.matching_multi_value_keys(source_key, source_value, options)?;
                if let Some(variable_match) = variable_match {
                    for source_rule in &source.rules {
                        let signature = declaration_property_signature(source_rule);
                        let candidate_keys = canonical_variable_candidate_keys(
                            &self.canonical_index,
                            &signature,
                            source_key,
                            &variable_match,
                            options.prefer_property_aliases,
                        );
                        for candidate_key in candidate_keys {
                            for variable_key in &variable_match.keys {
                                push_canonical_candidate(
                                    &mut candidates,
                                    &format!("{candidate_key}:{variable_key}"),
                                    &parts,
                                    &canonical_suffix,
                                    1,
                                );
                            }
                        }
                    }
                }
            }

            if options.prefer_property_aliases
                && let Some(source_rule) = source.rules.first()
            {
                for (property, _) in collect_rule_declarations(&source_rule.text) {
                    if source_key != &property {
                        continue;
                    }
                    for alias in self
                        .canonical_index
                        .preferred_aliases_by_property
                        .get(&property)
                        .into_iter()
                        .flatten()
                    {
                        push_canonical_candidate(
                            &mut candidates,
                            &format!("{alias}:{source_value}"),
                            &parts,
                            &canonical_suffix,
                            2,
                        );
                    }
                }
            }
        }

        push_canonical_candidate(&mut candidates, &parts.base, &parts, &canonical_suffix, 3);
        candidates.sort_by(|left, right| {
            left.order
                .cmp(&right.order)
                .then_with(|| left.class_name.len().cmp(&right.class_name.len()))
                .then_with(|| left.class_name.cmp(&right.class_name))
        });
        candidates.dedup_by(|left, right| left.class_name == right.class_name);

        for candidate in candidates {
            if candidate.class_name == class_name {
                continue;
            }
            let candidate_rules = self.engine.inspect(&candidate.class_name)?.rules;
            if !candidate_rules.is_empty()
                && has_same_canonical_rule_shape(&source.rules, &candidate_rules)
            {
                return Ok(Some(candidate.class_name));
            }
        }
        Ok(None)
    }

    pub(crate) fn matching_multi_value_keys(
        &self,
        source_key: &str,
        source_value: &str,
        options: &CanonicalClassNameOptions,
    ) -> Result<Option<MatchingVariableKeys>, EngineError> {
        let segments = split_top_level(source_value, '|');
        if segments.len() <= 1 {
            return self.matching_variable_keys(source_key, source_value, options);
        }
        if !options.prefer_multi_value_tokens || segments.iter().any(|segment| segment.is_empty()) {
            return Ok(None);
        }
        let mut keys = Vec::new();
        let mut numeric = false;
        for segment in segments {
            let Some(matched) = self.matching_variable_keys(source_key, segment, options)? else {
                return Ok(None);
            };
            let Some(key) = matched.keys.first() else {
                return Ok(None);
            };
            keys.push(key.clone());
            numeric |= matched.numeric;
        }
        Ok(Some(MatchingVariableKeys {
            keys: vec![keys.join("|")],
            numeric,
        }))
    }

    pub(crate) fn matching_variable_keys(
        &self,
        source_key: &str,
        source_value: &str,
        options: &CanonicalClassNameOptions,
    ) -> Result<Option<MatchingVariableKeys>, EngineError> {
        let variable_reference = css_variable_reference_name(source_value);
        if variable_reference.is_some() && !options.prefer_variable_references {
            return Ok(None);
        }
        let source_class = format!("{source_key}:{source_value}");
        let source_rules = self.engine.inspect(&source_class)?.rules;
        if source_rules.is_empty() {
            return Ok(None);
        }
        let mut variable_keys = self.engine.class_variable_keys(&source_class)?;
        variable_keys
            .sort_by(|left, right| left.len().cmp(&right.len()).then_with(|| left.cmp(right)));
        variable_keys.dedup();
        let mut token_keys = Vec::new();
        let mut numeric_keys = Vec::new();
        for variable_key in variable_keys {
            let candidate = self
                .engine
                .inspect(&format!("{source_key}:{variable_key}"))?;
            if candidate.rules.is_empty() {
                continue;
            }
            if variable_key == source_value
                || variable_reference.is_some_and(|name| {
                    candidate
                        .rules
                        .iter()
                        .any(|rule| rule.variable_names.iter().any(|variable| variable == name))
                })
            {
                token_keys.push(variable_key);
            } else if candidate.rules.iter().any(|rule| {
                rule.variable_names.iter().any(|variable_name| {
                    self.variable_values
                        .get(variable_name)
                        .is_some_and(|value| {
                            numeric_values_match(
                                source_value,
                                value,
                                self.canonical_index.root_size,
                                self.canonical_index.base_unit,
                            )
                        })
                })
            }) || declarations_match_after_variable_resolution(
                &source_rules,
                &candidate.rules,
                &self.variable_values,
            ) {
                numeric_keys.push(variable_key);
            }
        }
        let (keys, numeric) = if token_keys.is_empty() {
            (numeric_keys, true)
        } else {
            (token_keys, false)
        };
        Ok((!keys.is_empty()).then_some(MatchingVariableKeys { keys, numeric }))
    }

    pub(crate) fn collect_raw_value_candidates(
        &self,
        class_names: &[String],
        invalid_generated_classes: &HashSet<String>,
    ) -> Result<Vec<RawValueCandidateIr>, EngineError> {
        let mut candidates = Vec::new();
        for class_name in class_names {
            if invalid_generated_classes.contains(class_name) {
                continue;
            }
            let semantics = self.engine.inspect_class_semantics(class_name)?;
            let (Some(key_token), Some(value)) = (semantics.key_token, semantics.value_token)
            else {
                continue;
            };
            let variable_keys = self.engine.class_variable_keys(class_name)?;
            if variable_keys.is_empty() {
                continue;
            }
            let segments = split_top_level(&value, '|')
                .into_iter()
                .filter(|segment| !variable_keys.iter().any(|key| key == segment))
                .map(str::to_owned)
                .collect::<Vec<_>>();
            if segments.is_empty() {
                continue;
            }
            let inspection = self.engine.inspect(class_name)?;
            let mut properties = inspection
                .rules
                .iter()
                .flat_map(|rule| collect_rule_declarations(&rule.text))
                .map(|(property, _)| property)
                .collect::<Vec<_>>();
            properties.sort();
            properties.dedup();
            candidates.push(RawValueCandidateIr {
                class_name: class_name.clone(),
                key: key_token.trim_end_matches(':').to_owned(),
                segments,
                properties,
            });
        }
        Ok(candidates)
    }

    pub fn dispose(&mut self) {
        self.engine.dispose();
    }
}
