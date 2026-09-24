use super::{
    CanonicalClassGroupSuggestionIr, CanonicalClassNameOptions, CanonicalGroupEntry,
    CompositionRecipe, EngineError, HashSet, LintSession, RawValueCandidateIr, UtilityLayerName,
    canonical_class_parts, canonical_condition_suffix, collect_rule_declarations,
    has_same_canonical_rule_shape, matching_composition_recipe, merge_group_declarations,
    normalize_composition_declarations, push_canonical_candidate, rules_declaration_signature,
    split_top_level,
};

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
                // Static rules retain spelling-based ordering. Equal declarations
                // alone cannot prove that renaming preserves surrounding winners.
                if candidate_base != &parts.base {
                    continue;
                }
                push_canonical_candidate(
                    &mut candidates,
                    candidate_base,
                    &parts,
                    &canonical_suffix,
                    0,
                );
            }
        }

        if let (Some(source_key), Some(source_value)) = (&parts.key, &parts.value)
            && options.prefer_property_aliases
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
                        &if semantics.kind == mastercss_engine::ClassSemanticKind::Token {
                            format!(
                                "{}{alias}-{source_value}",
                                if parts.base.starts_with('-') { "-" } else { "" }
                            )
                        } else {
                            format!("{alias}:{source_value}")
                        },
                        &parts,
                        &canonical_suffix,
                        2,
                    );
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
            if semantics.kind != mastercss_engine::ClassSemanticKind::Declaration {
                continue;
            }
            let (Some(key_token), Some(value)) = (semantics.key_token, semantics.value_token)
            else {
                continue;
            };
            if !self
                .engine
                .has_named_tokens_for_key(key_token.trim_end_matches(':'))
            {
                continue;
            }
            let segments = split_top_level(&value, '|')
                .into_iter()
                .filter(|segment| !(segment.starts_with("var(--") && segment.ends_with(')')))
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
