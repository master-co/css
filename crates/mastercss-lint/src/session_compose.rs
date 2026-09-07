use super::{
    CanonicalClassNameOptions, CanonicalComposeDirectiveIr, CanonicalComposeSuggestionIr,
    CanonicalComposeSuggestionKind, ComposeBucket, ComposeNativeDeclaration, EngineError, HashMap,
    HashSet, LINT_BATCH_VERSION, LintSession, NativeDeclarationCandidateIr, UtilityLayerName,
    canonical_class_parts, collect_rule_declarations, compose_variant_block_text,
    has_duplicate_compose_declaration_properties, is_safe_compose_variant_token,
    process_compose_leaf, replace_compose_class_group, replace_first_compose_class,
    serialize_compose_bucket,
};

impl LintSession {
    pub(crate) fn ensure_class_rules(
        &mut self,
        class_names: &[String],
        native_support: Option<&[bool]>,
    ) -> Result<Vec<NativeDeclarationCandidateIr>, EngineError> {
        let Some(native_support) = native_support else {
            self.engine.ensure_class_rules(class_names)?;
            return Ok(Vec::new());
        };
        let native_candidates = self.engine.native_declaration_candidates(class_names)?;
        for (index, candidate) in native_candidates.iter().enumerate() {
            if native_support.get(index).copied().unwrap_or(false) {
                self.supported_native_declarations
                    .insert((candidate.property.clone(), candidate.value.clone()));
            }
        }
        self.engine
            .ensure_class_rules_with_native_support(class_names, native_support)?;
        Ok(native_candidates)
    }

    pub(crate) fn known_native_declaration(
        &self,
        class_name: &str,
    ) -> Result<Option<NativeDeclarationCandidateIr>, EngineError> {
        let Some(candidate) = self.compose_native_declaration(class_name)? else {
            return Ok(None);
        };
        if !self
            .supported_native_declarations
            .contains(&(candidate.property.clone(), candidate.value.clone()))
        {
            return Ok(None);
        }
        Ok(Some(candidate))
    }

    pub(crate) fn is_compose_native_declaration(
        &self,
        candidate: &NativeDeclarationCandidateIr,
    ) -> Result<bool, EngineError> {
        Ok(self
            .compose_native_declaration(&candidate.class_name)?
            .is_some_and(|declaration| {
                declaration.property == candidate.property && declaration.value == candidate.value
            }))
    }

    pub(crate) fn compose_native_declaration(
        &self,
        class_name: &str,
    ) -> Result<Option<NativeDeclarationCandidateIr>, EngineError> {
        let semantics = self.engine.inspect_class_semantics(class_name)?;
        if semantics.kind != mastercss_engine::ClassSemanticKind::Declaration
            || semantics.state_token.is_some()
            || !self.engine.class_variable_keys(class_name)?.is_empty()
        {
            return Ok(None);
        }
        let parts = canonical_class_parts(class_name, &semantics);
        let Some(source_key) = parts.key else {
            return Ok(None);
        };
        let inspection = self.engine.inspect(class_name)?;
        if inspection.rules.len() != 1 {
            return Ok(None);
        }
        let rule = &inspection.rules[0];
        if rule.utility_type != 0
            || rule.layer != UtilityLayerName::Utilities
            || !rule.nodes.is_empty()
            || !rule.variable_names.is_empty()
        {
            return Ok(None);
        }
        let declarations = collect_rule_declarations(&rule.text);
        let [(property, value)] = declarations.as_slice() else {
            return Ok(None);
        };
        if source_key != *property {
            return Ok(None);
        }
        Ok(Some(NativeDeclarationCandidateIr {
            class_name: class_name.to_owned(),
            property: property.clone(),
            value: value.clone(),
        }))
    }

    pub(crate) fn suggest_canonical_compose_directive(
        &self,
        class_names: &[String],
        options: &CanonicalClassNameOptions,
        mut native_declarations: HashMap<String, NativeDeclarationCandidateIr>,
    ) -> Result<CanonicalComposeDirectiveIr, EngineError> {
        let group_suggestions = self.suggest_canonical_class_groups(class_names, options)?;
        let covered_class_names = group_suggestions
            .iter()
            .flat_map(|suggestion| suggestion.class_names.iter().cloned())
            .collect::<HashSet<_>>();
        let mut canonical_class_names = class_names.to_vec();
        let mut suggestions = Vec::new();

        for suggestion in group_suggestions {
            replace_compose_class_group(
                &mut canonical_class_names,
                &suggestion.class_names,
                &suggestion.recommended,
            );
            suggestions.push(CanonicalComposeSuggestionIr {
                actual: suggestion.class_names.join(" "),
                recommended: suggestion.recommended,
                class_names: suggestion.class_names,
                kind: CanonicalComposeSuggestionKind::Class,
            });
        }

        for class_name in class_names {
            if covered_class_names.contains(class_name) {
                continue;
            }
            let Some(recommended) = self.suggest_canonical_class_name(class_name, options)? else {
                continue;
            };
            replace_first_compose_class(&mut canonical_class_names, class_name, &recommended);
            if let Some(declaration) = native_declarations.get(class_name).cloned() {
                let source_semantics = self.engine.inspect_class_semantics(class_name)?;
                let recommended_semantics = self.engine.inspect_class_semantics(&recommended)?;
                let source_parts = canonical_class_parts(class_name, &source_semantics);
                let recommended_parts = canonical_class_parts(&recommended, &recommended_semantics);
                if source_parts.base == recommended_parts.base {
                    native_declarations.insert(recommended.clone(), declaration);
                }
            }
            suggestions.push(CanonicalComposeSuggestionIr {
                actual: class_name.clone(),
                recommended,
                class_names: vec![class_name.clone()],
                kind: CanonicalComposeSuggestionKind::Class,
            });
        }

        let canonical_recommendations = suggestions
            .iter()
            .map(|suggestion| suggestion.recommended.clone())
            .collect::<HashSet<_>>();
        let mut bucket = ComposeBucket::default();
        let mut structural_change = false;
        for class_name in canonical_class_names {
            structural_change |= self.process_compose_class(
                &mut bucket,
                &class_name,
                options,
                &native_declarations,
                &canonical_recommendations,
                &mut suggestions,
            )?;
        }

        let replacement = serialize_compose_bucket(&bucket, "");
        Ok(CanonicalComposeDirectiveIr {
            version: LINT_BATCH_VERSION,
            suggestions,
            structural_change: structural_change.then_some(true),
            replacement: (structural_change
                && !replacement.is_empty()
                && !has_duplicate_compose_declaration_properties(&bucket))
            .then_some(replacement),
        })
    }

    pub(crate) fn process_compose_class(
        &self,
        bucket: &mut ComposeBucket,
        class_name: &str,
        options: &CanonicalClassNameOptions,
        native_declarations: &HashMap<String, NativeDeclarationCandidateIr>,
        canonical_recommendations: &HashSet<String>,
        suggestions: &mut Vec<CanonicalComposeSuggestionIr>,
    ) -> Result<bool, EngineError> {
        let semantics = self.engine.inspect_class_semantics(class_name)?;
        if options.prefer_variant_blocks_in_compose
            && let Some(state_token) = semantics.state_token.as_deref()
            && is_safe_compose_variant_token(state_token)
        {
            let parts = canonical_class_parts(class_name, &semantics);
            let base_class_name = format!(
                "{}{}",
                parts.base,
                if semantics.important { "!" } else { "" }
            );
            let variant_index = bucket
                .variants
                .iter()
                .position(|(token, _)| token == state_token)
                .unwrap_or_else(|| {
                    bucket
                        .variants
                        .push((state_token.to_owned(), ComposeBucket::default()));
                    bucket.variants.len() - 1
                });
            let native_declaration =
                native_declarations
                    .get(class_name)
                    .map(|candidate| ComposeNativeDeclaration {
                        property: candidate.property.clone(),
                        value: candidate.value.clone(),
                        important: semantics.important,
                    });
            process_compose_leaf(
                &mut bucket.variants[variant_index].1,
                &base_class_name,
                native_declaration,
                false,
                suggestions,
            );
            if !canonical_recommendations.contains(class_name) {
                suggestions.push(CanonicalComposeSuggestionIr {
                    actual: class_name.to_owned(),
                    recommended: compose_variant_block_text(
                        state_token,
                        &bucket.variants[variant_index].1,
                        "",
                    ),
                    class_names: vec![class_name.to_owned()],
                    kind: CanonicalComposeSuggestionKind::VariantBlock,
                });
            }
            return Ok(true);
        }

        let native_declaration =
            if options.prefer_native_declarations_in_compose && semantics.state_token.is_none() {
                native_declarations
                    .get(class_name)
                    .map(|candidate| ComposeNativeDeclaration {
                        property: candidate.property.clone(),
                        value: candidate.value.clone(),
                        important: semantics.important,
                    })
            } else {
                None
            };
        Ok(process_compose_leaf(
            bucket,
            class_name,
            native_declaration,
            true,
            suggestions,
        ))
    }
}
