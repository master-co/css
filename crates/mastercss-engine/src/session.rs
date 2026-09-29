use super::{
    ClassSemanticInspection, ClassSemanticKind, EmittedGlobals, EngineClassCompletionCandidate,
    EngineClassVariableIr, EngineColorToken, EngineCompositionRuleIr, EngineError,
    EngineInspectionIr, EngineSession, EngineSnapshotIr, EngineTransitionIr, HashMap, HashSet,
    ManifestProjection, MasterCssManifest, NativeDeclarationCandidateIr, RuleMutationIr,
    RuleTarget, StoredRule, UTILITY_LAYERS, UtilityLayerName, UtilityMatcherType,
    collect_class_completion_candidates, collect_engine_color_tokens, compare_stored_rules,
    compile_manifest, emit_declarations, engine_variable_ir, layer_index, layer_name,
    normalize_dynamic_value, resolve_state_branches, resolve_style_selector_aliases,
};

impl EngineSession {
    /// Shared compiler/native-CSS expansion; does not register a class or resources.
    pub fn expand_mixin(
        &self,
        name: &str,
        arguments: &[String],
    ) -> Result<Vec<crate::ExpandedMixinRule>, String> {
        crate::expand_mixin(&self.compiled.mixins, name, arguments)
    }

    pub fn expand_mixin_with_contents(
        &self,
        name: &str,
        arguments: &[String],
        contents: Option<&[mastercss_schema::MixinNode]>,
    ) -> Result<Vec<crate::ExpandedMixinRule>, String> {
        crate::expand_mixin_with_contents(&self.compiled.mixins, name, arguments, contents)
    }

    pub fn create(manifest_json: &str) -> Result<Self, EngineError> {
        Self::create_with_emitted_globals(manifest_json, None)
    }

    pub fn create_with_emitted_globals(
        manifest_json: &str,
        emitted_globals_json: Option<&str>,
    ) -> Result<Self, EngineError> {
        let manifest = MasterCssManifest::parse(manifest_json)?;
        let compiled = compile_manifest(&manifest)?;
        let emitted_globals = emitted_globals_json
            .map(EmittedGlobals::parse)
            .transpose()
            .map_err(|error| EngineError::InvalidEmittedGlobals(error.to_string()))?
            .unwrap_or_default();
        let mut session = Self {
            manifest,
            compiled,
            layers: std::array::from_fn(|_| Vec::new()),
            class_rules: HashMap::new(),
            class_order: Vec::new(),
            rule_counts: HashMap::new(),
            emitted_globals,
            variable_counts: HashMap::new(),
            keyframe_counts: HashMap::new(),
            keyframe_texts: Vec::new(),
            stylesheet_sources: Vec::new(),
            theme_variable_names: Vec::new(),
            theme_text: None,
            theme_dirty: false,
            theme_batch_depth: 0,
            disposed: false,
        };
        session.initialize_variable_resources();
        session.sync_theme_text();
        Ok(session)
    }

    pub fn manifest_json(&self) -> Result<String, EngineError> {
        self.ensure_active()?;
        Ok(self.manifest.to_json()?)
    }

    pub fn ensure_class_rules<I, S>(
        &mut self,
        class_names: I,
    ) -> Result<EngineTransitionIr, EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        self.with_theme_batch(|session| {
            let mut mutations = Vec::new();
            for class_name in class_names {
                let class_name = class_name.as_ref();
                if class_name.is_empty() || session.class_rules.contains_key(class_name) {
                    continue;
                }
                let generated = session.generate_class_rules(class_name);
                session.insert_generated_class_rules(class_name, generated, &mut mutations);
            }
            Ok(EngineTransitionIr::new(mutations))
        })
    }

    pub(crate) fn insert_generated_class_rules(
        &mut self,
        class_name: &str,
        generated: Vec<StoredRule>,
        mutations: &mut Vec<RuleMutationIr>,
    ) {
        if generated.is_empty() {
            return;
        }
        let mut class_rule_keys = Vec::with_capacity(generated.len());
        for rule in generated {
            let layer = rule.ir.layer;
            let reference = (layer, rule.ir.key.clone());
            if let Some(count) = self.rule_counts.get_mut(&reference) {
                *count += 1;
                class_rule_keys.push(reference);
                continue;
            }
            self.register_rule_variables(&rule.ir.variable_names);
            self.register_keyframes(&rule.ir.keyframe_names, rule.ir.retain_all_keyframes);
            let layer_rules = &mut self.layers[layer_index(layer)];
            let index = layer_rules
                .binary_search_by(|existing| compare_stored_rules(existing, &rule))
                .unwrap_or_else(|index| index);
            layer_rules.insert(index, rule.clone());
            class_rule_keys.push(reference.clone());
            self.rule_counts.insert(reference, 1);
            mutations.push(RuleMutationIr::Insert {
                target: layer.into(),
                index: index as u32,
                key: rule.ir.key.clone(),
                text: rule.ir.text.clone(),
                rule: Some(Box::new(rule.ir)),
            });
        }
        if !class_rule_keys.is_empty() {
            self.class_order.push(class_name.to_owned());
            self.class_rules
                .insert(class_name.to_owned(), class_rule_keys);
        }
    }

    pub fn delete_class_rules<I, S>(
        &mut self,
        class_names: I,
    ) -> Result<EngineTransitionIr, EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        self.with_theme_batch(|session| {
            let mut mutations = Vec::new();
            for class_name in class_names {
                let class_name = class_name.as_ref();
                let Some(keys) = session.class_rules.remove(class_name) else {
                    continue;
                };
                for (layer, key) in keys.into_iter().rev() {
                    let reference = (layer, key.clone());
                    let should_remove = match session.rule_counts.get_mut(&reference) {
                        Some(count) if *count > 1 => {
                            *count -= 1;
                            false
                        }
                        Some(_) => true,
                        None => false,
                    };
                    if !should_remove {
                        continue;
                    }
                    session.rule_counts.remove(&reference);
                    let rules = &mut session.layers[layer_index(layer)];
                    let Some(index) = rules.iter().position(|rule| rule.ir.key == key) else {
                        continue;
                    };
                    let rule = rules.remove(index);
                    mutations.push(RuleMutationIr::Delete {
                        target: RuleTarget::from(layer),
                        index: index as u32,
                        key,
                    });
                    session.unregister_rule_variables(&rule.ir.variable_names);
                    session.unregister_keyframes(
                        &rule.ir.keyframe_names,
                        rule.ir.retain_all_keyframes,
                    );
                }
                session
                    .class_order
                    .retain(|connected_class_name| connected_class_name != class_name);
            }
            Ok(EngineTransitionIr::new(mutations))
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
        self.ensure_active()?;
        Ok(class_names
            .into_iter()
            .flat_map(|class_name| {
                self.native_declaration_candidates_for_class(class_name.as_ref())
                    .into_iter()
                    .map(|candidate| candidate.ir)
            })
            .collect())
    }

    pub fn ensure_stylesheet_resources(
        &mut self,
        native_css: &str,
    ) -> Result<EngineTransitionIr, EngineError> {
        self.ensure_active()?;
        if native_css.is_empty() {
            return Ok(EngineTransitionIr::empty());
        }
        let changes_variables =
            crate::stylesheet_declarations(native_css)
                .iter()
                .any(|(name, value)| {
                    name.strip_prefix("--").is_some_and(|name| {
                        !self
                            .compiled
                            .animation_variables
                            .get(name)
                            .is_some_and(|values| values.contains(value))
                    })
                });
        self.stylesheet_sources.push(native_css.into());
        if changes_variables {
            self.rebuild(
                self.manifest.clone(),
                self.compiled.clone(),
                self.emitted_globals.clone(),
            )
        } else {
            self.register_stylesheet_resources(native_css)
        }
    }

    fn register_stylesheet_resources(
        &mut self,
        native_css: &str,
    ) -> Result<EngineTransitionIr, EngineError> {
        self.with_theme_batch(|session| {
            let animation = session.animation_references(native_css)?;
            session.register_keyframes(&animation.names, animation.retain_all);
            let stylesheet_variables = mastercss_lexer::collect_css_variable_references(native_css);
            let variable_names = stylesheet_variables
                .into_iter()
                .filter(|name| session.compiled.compiled_variables.contains_key(name))
                .collect::<Vec<_>>();
            for variable_name in &variable_names {
                session.register_variable(variable_name, &mut HashSet::new());
            }

            Ok(EngineTransitionIr::empty())
        })
    }

    pub fn emitted_globals_snapshot(&self) -> Result<EmittedGlobals, EngineError> {
        self.ensure_active()?;
        let mut emitted_globals = self.emitted_globals.clone();
        for name in &self.theme_variable_names {
            emitted_globals.variables.entry(name.clone()).or_insert(1);
        }
        for definition in self.keyframe_snapshot() {
            emitted_globals
                .keyframes
                .entry(definition.name)
                .or_insert(1);
        }
        Ok(emitted_globals)
    }

    pub fn register_emitted_globals(
        &mut self,
        emitted_globals_json: &str,
    ) -> Result<EngineTransitionIr, EngineError> {
        self.ensure_active()?;
        let emitted_globals = EmittedGlobals::parse(emitted_globals_json)
            .map_err(|error| EngineError::InvalidEmittedGlobals(error.to_string()))?;
        let mut merged = self.emitted_globals.clone();
        let mut changed = false;
        for (name, count) in emitted_globals.variables {
            if count == 0 {
                continue;
            }
            let current = merged.variable_count(&name);
            let next = current.saturating_add(count);
            if next != current {
                merged.variables.insert(name, next);
                changed = true;
            }
        }
        for (name, count) in emitted_globals.keyframes {
            if count > 0 {
                let previous = merged.keyframes.get(&name).copied().unwrap_or_default();
                merged
                    .keyframes
                    .insert(name, previous.saturating_add(count));
                changed = true;
            }
        }
        if !changed {
            return Ok(EngineTransitionIr::new(Vec::new()));
        }
        self.rebuild(self.manifest.clone(), self.compiled.clone(), merged)
    }

    pub fn refresh(&mut self, manifest_json: &str) -> Result<EngineTransitionIr, EngineError> {
        self.ensure_active()?;
        let manifest = MasterCssManifest::parse(manifest_json)?;
        let compiled = compile_manifest(&manifest)?;
        self.rebuild(manifest, compiled, self.emitted_globals.clone())
    }

    pub(crate) fn rebuild(
        &mut self,
        manifest: MasterCssManifest,
        compiled: ManifestProjection,
        emitted_globals: EmittedGlobals,
    ) -> Result<EngineTransitionIr, EngineError> {
        self.with_theme_batch(|session| {
            let connected_classes = session.class_order.clone();
            let mut mutations = Vec::new();
            for layer in UTILITY_LAYERS.into_iter().rev() {
                let rules = &mut session.layers[layer_index(layer)];
                for index in (0..rules.len()).rev() {
                    let rule = rules.remove(index);
                    mutations.push(RuleMutationIr::Delete {
                        target: layer.into(),
                        index: index as u32,
                        key: rule.ir.key,
                    });
                }
            }
            session.theme_dirty = true;
            session.variable_counts.clear();
            session.keyframe_counts.clear();
            session.theme_variable_names.clear();
            session.compiled = compiled;
            for source in &session.stylesheet_sources {
                for (name, value) in crate::stylesheet_declarations(source) {
                    if let Some(name) = name.strip_prefix("--") {
                        let values = session
                            .compiled
                            .animation_variables
                            .entry(name.into())
                            .or_default();
                        if !values.contains(&value) {
                            values.push(value);
                        }
                    }
                }
            }
            session.manifest = manifest;
            session.emitted_globals = emitted_globals;
            session.class_rules.clear();
            session.class_order.clear();
            session.rule_counts.clear();
            session.initialize_variable_resources();
            let native_sources = session.stylesheet_sources.clone();
            for source in native_sources {
                session.register_stylesheet_resources(&source)?;
            }
            mutations.extend(session.ensure_class_rules(connected_classes)?.mutations);
            Ok(EngineTransitionIr::new(mutations))
        })
    }

    pub fn snapshot(&self) -> Result<EngineSnapshotIr, EngineError> {
        self.ensure_active()?;
        let rules = UTILITY_LAYERS
            .iter()
            .flat_map(|layer| self.layers[layer_index(*layer)].iter())
            .map(|rule| rule.ir.clone())
            .collect();
        Ok(EngineSnapshotIr {
            version: 3,
            rules,
            resources: self.resource_snapshot(),
            text: self.css_text(),
        })
    }

    pub fn snapshot_for_classes<I, S>(
        &self,
        class_names: I,
    ) -> Result<EngineSnapshotIr, EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        self.ensure_active()?;
        let mut seen = HashSet::new();
        let mut cached_classes = Vec::new();
        for class_name in class_names {
            let class_name = class_name.as_ref();
            if class_name.is_empty() || !seen.insert(class_name.to_owned()) {
                continue;
            }
            let Some(references) = self.class_rules.get(class_name) else {
                continue;
            };
            let generated = references
                .iter()
                .filter_map(|(layer, key)| {
                    self.layers[layer_index(*layer)]
                        .iter()
                        .find(|rule| rule.ir.key == *key)
                        .cloned()
                })
                .collect::<Vec<_>>();
            cached_classes.push((class_name.to_owned(), generated));
        }

        let mut subset = self.fork_empty_with_emitted_globals(self.emitted_globals.clone());
        for source in &self.stylesheet_sources {
            subset.register_stylesheet_resources(source)?;
        }
        let mut mutations = Vec::new();
        for (class_name, generated) in cached_classes {
            subset.insert_generated_class_rules(&class_name, generated, &mut mutations);
        }
        subset.sync_theme_text();
        subset.snapshot()
    }

    /// Resolve registered definitions independently of emitted rule count.
    pub fn matched_utility_names(&self, class_name: &str) -> Result<Vec<String>, EngineError> {
        self.ensure_active()?;
        let class_name = class_name.to_owned();
        if !super::named::diagnostics(&class_name, &self.compiled).is_empty() {
            return Ok(Vec::new());
        }
        if let Some(body) = class_name.strip_prefix('{')
            && let Some(close) = super::find_group_close(body)
        {
            let mut names = Vec::new();
            for member in super::split_top_level(&body[..close], ';') {
                for name in
                    self.matched_utility_names(&format!("{member}{}", &body[close + 1..]))?
                {
                    if !names.contains(&name) {
                        names.push(name);
                    }
                }
            }
            return Ok(names);
        }
        Ok(
            super::named::matching_utilities(&class_name, &self.compiled)
                .into_iter()
                .filter_map(|(index, _)| self.compiled.utilities[index].name.clone())
                .collect(),
        )
    }

    pub fn composition_rules(
        &self,
        class_name: &str,
    ) -> Result<Vec<EngineCompositionRuleIr>, EngineError> {
        self.ensure_active()?;
        Ok(self.generate_composition_rules(class_name))
    }

    /// Distinguish a known false condition from an unknown name during stylesheet lowering.
    pub fn has_named_condition(&self, name: &str) -> Result<bool, EngineError> {
        self.ensure_active()?;
        Ok(self
            .compiled
            .custom_media
            .contains_key(&format!("--{name}")))
    }

    pub fn resolve_style_selector(&self, selector: &str) -> Result<String, EngineError> {
        self.ensure_active()?;
        Ok(resolve_style_selector_aliases(selector, &self.compiled))
    }

    pub fn inspect(&self, class_name: &str) -> Result<EngineInspectionIr, EngineError> {
        self.ensure_active()?;
        let rules = self
            .generate_class_rules(class_name)
            .into_iter()
            .map(|rule| rule.ir)
            .collect::<Vec<_>>();
        let mut diagnostics = super::named::diagnostics(class_name, &self.compiled);
        if diagnostics.is_empty()
            && let Some(Err(message)) = self.application_rules(class_name)
        {
            diagnostics.push(mastercss_schema::Diagnostic {
                code: mastercss_schema::ErrorCode::ClassSyntaxError,
                phase: mastercss_schema::DiagnosticPhase::Match,
                severity: mastercss_schema::DiagnosticSeverity::Error,
                message,
                source: Some(class_name.into()),
                range: None,
                notes: Vec::new(),
            });
        }
        if rules.iter().any(|rule| rule.retain_all_keyframes) && !self.compiled.keyframes.is_empty()
        {
            diagnostics.push(mastercss_schema::Diagnostic {
                code: mastercss_schema::ErrorCode::DynamicAnimationNames,
                phase: mastercss_schema::DiagnosticPhase::Match,
                severity: mastercss_schema::DiagnosticSeverity::Info,
                message: "Dynamic animation names retain all managed keyframes while this usage root is active".into(),
                source: Some(class_name.into()), range: None, notes: Vec::new(),
            });
        }
        let has_errors = diagnostics
            .iter()
            .any(|diagnostic| diagnostic.severity == mastercss_schema::DiagnosticSeverity::Error);
        Ok(EngineInspectionIr {
            version: 2,
            class_name: class_name.to_owned(),
            match_status: if !has_errors
                && (!rules.is_empty() || !self.matched_utility_names(class_name)?.is_empty())
            {
                mastercss_schema::MatchStatus::Matched
            } else if diagnostics
                .iter()
                .any(|diagnostic| diagnostic.code == mastercss_schema::ErrorCode::AmbiguousToken)
            {
                mastercss_schema::MatchStatus::Ambiguous
            } else if has_errors {
                mastercss_schema::MatchStatus::SyntaxError
            } else {
                mastercss_schema::MatchStatus::Unmatched
            },
            css_syntax_status: if diagnostics
                .iter()
                .any(|diagnostic| diagnostic.code == mastercss_schema::ErrorCode::ClassSyntaxError)
            {
                mastercss_schema::CssSyntaxStatus::Invalid
            } else if rules.is_empty() {
                mastercss_schema::CssSyntaxStatus::NotChecked
            } else {
                mastercss_schema::CssSyntaxStatus::Valid
            },
            css_value_status: mastercss_schema::CssValueStatus::NotChecked,
            browser_support: mastercss_schema::BrowserSupport::NotChecked,
            rules,
            diagnostics,
        })
    }

    /// Tooling metadata for the selected explicit mixin. Native declarations and
    /// built-in tokens have no mixin source; no semantic matching is duplicated by hosts.
    pub fn class_mixin_definition(
        &self,
        class_name: &str,
    ) -> Result<Option<mastercss_schema::MixinDefinition>, EngineError> {
        self.ensure_active()?;
        let source = class_name.strip_suffix('!').unwrap_or(class_name);
        if let Some(Ok(head)) = mastercss_lexer::parse_functional_class(source) {
            return Ok(self
                .compiled
                .mixins
                .iter()
                .find(|definition| definition.name == format!("--{}", head.name))
                .cloned());
        }
        Ok(super::named::matching_utilities(source, &self.compiled)
            .iter()
            .find_map(|(index, _)| {
                let super::UtilityEmit::Mixin { name } = &self.compiled.utilities[*index].emit
                else {
                    return None;
                };
                self.compiled
                    .mixins
                    .iter()
                    .find(|definition| &definition.name == name)
                    .cloned()
            }))
    }

    pub fn inspect_class_semantics(
        &self,
        class_name: &str,
    ) -> Result<ClassSemanticInspection, EngineError> {
        self.ensure_active()?;
        let rules = self.generate_class_rules(class_name);
        let canonical = class_name.to_owned();
        let empty_matches = if rules.is_empty()
            && super::named::diagnostics(&canonical, &self.compiled).is_empty()
        {
            super::named::matching_utilities(&canonical, &self.compiled)
        } else {
            Vec::new()
        };
        if rules.is_empty() && empty_matches.is_empty() {
            return Ok(ClassSemanticInspection {
                class_name: class_name.to_owned(),
                kind: ClassSemanticKind::Unknown,
                matcher_types: Vec::new(),
                key_token: None,
                value_token: None,
                state_token: None,
                important: false,
            });
        }

        let (semantic_class_name, trailing_important) = class_name
            .strip_suffix('!')
            .map_or((class_name, false), |name| (name, true));
        let mut matcher_types = Vec::new();
        let mut state_token = None;
        for rule in &rules {
            if let Some(matcher_type) = rule.matcher_type
                && !matcher_types.contains(&matcher_type)
            {
                matcher_types.push(matcher_type);
            }
            state_token.get_or_insert_with(|| rule.state_token.clone());
        }

        for (_, matched) in &empty_matches {
            if !matcher_types.contains(&matched.matcher_type) {
                matcher_types.push(matched.matcher_type);
            }
            state_token.get_or_insert_with(|| matched.state_token.clone());
        }
        let first_type = rules.first().map(|rule| rule.ir.utility_type).or_else(|| {
            empty_matches
                .first()
                .map(|(index, _)| self.compiled.utilities[*index].utility_type)
        });
        let component = rules.iter().any(|rule| {
            rule.ir.utility_type == -2 && rule.ir.layer == UtilityLayerName::Components
        });
        let kind = if component {
            ClassSemanticKind::Component
        } else if matcher_types.contains(&UtilityMatcherType::Function) {
            ClassSemanticKind::Mixin
        } else if matcher_types.contains(&UtilityMatcherType::Token) {
            ClassSemanticKind::Token
        } else if first_type == Some(-2) {
            ClassSemanticKind::Semantic
        } else {
            ClassSemanticKind::Declaration
        };

        let raw_state_token = state_token.unwrap_or_default();
        let (state_token, state_important) = raw_state_token
            .strip_prefix('!')
            .map_or((raw_state_token.as_str(), false), |state| (state, true));
        let important = trailing_important || state_important;
        let state_token = (!state_token.is_empty()).then(|| state_token.to_owned());
        let (key_token, value_token) = if kind == ClassSemanticKind::Token {
            let prefix =
                super::named::token_prefix(semantic_class_name, &self.compiled).unwrap_or_default();
            let prefix_length =
                prefix.len() + usize::from(!semantic_class_name.starts_with(prefix));
            let value_end = semantic_class_name
                .len()
                .saturating_sub(raw_state_token.len());
            (
                Some(semantic_class_name[..prefix_length].to_owned()),
                Some(semantic_class_name[prefix_length..value_end].to_owned()),
            )
        } else if kind == ClassSemanticKind::Mixin {
            let end = semantic_class_name
                .len()
                .saturating_sub(raw_state_token.len());
            semantic_class_name[..end]
                .find('(')
                .map_or((None, None), |open| {
                    (
                        Some(semantic_class_name[..open].into()),
                        Some(semantic_class_name[open + 1..end - 1].into()),
                    )
                })
        } else if kind == ClassSemanticKind::Declaration {
            let value_end = semantic_class_name
                .len()
                .saturating_sub(raw_state_token.len());
            semantic_class_name[..value_end]
                .find(':')
                .map_or((None, None), |colon| {
                    (
                        Some(semantic_class_name[..=colon].to_owned()),
                        Some(semantic_class_name[colon + 1..value_end].to_owned()),
                    )
                })
        } else {
            (None, None)
        };

        Ok(ClassSemanticInspection {
            class_name: class_name.to_owned(),
            kind,
            matcher_types,
            key_token,
            value_token,
            state_token,
            important,
        })
    }

    /// Whether a declaration key has a registered named-token counterpart.
    pub fn has_named_tokens_for_key(&self, key: &str) -> bool {
        let prefix = format!("{key}-");
        self.compiled
            .token_utilities
            .get(&prefix)
            .is_some_and(|indexes| {
                indexes
                    .iter()
                    .any(|index| !self.compiled.utilities[*index].variable_entries.is_empty())
            })
    }

    pub fn class_variable_keys(&self, class_name: &str) -> Result<Vec<String>, EngineError> {
        let mut keys = self
            .class_variable_aliases(class_name)?
            .into_iter()
            .map(|(key, _)| key)
            .collect::<Vec<_>>();
        keys.sort();
        keys.dedup();
        Ok(keys)
    }

    pub fn variable_names(&self) -> Result<Vec<String>, EngineError> {
        self.ensure_active()?;
        let mut names = self
            .compiled
            .compiled_variables
            .keys()
            .cloned()
            .collect::<Vec<_>>();
        names.sort();
        Ok(names)
    }

    pub fn class_variable_entries(
        &self,
        class_name: &str,
    ) -> Result<Vec<EngineClassVariableIr>, EngineError> {
        Ok(self
            .class_variable_aliases(class_name)?
            .into_iter()
            .filter_map(|(key, name)| {
                self.compiled
                    .compiled_variables
                    .get(&name)
                    .map(|variable| EngineClassVariableIr {
                        key,
                        variable: engine_variable_ir(variable),
                    })
            })
            .collect())
    }

    pub(crate) fn class_variable_aliases(
        &self,
        class_name: &str,
    ) -> Result<Vec<(String, String)>, EngineError> {
        self.ensure_active()?;
        let (semantic_class_name, important) = class_name
            .strip_suffix('!')
            .map_or((class_name, false), |name| (name, true));
        let matching_class_names = [semantic_class_name.to_owned()];
        let mut variable_aliases = Vec::new();
        let mut seen_aliases = HashSet::new();
        let mut seen = HashSet::new();
        for matching_class_name in matching_class_names {
            let mut generated = false;
            for (utility_index, matched) in
                super::named::matching_utilities(&matching_class_name, &self.compiled)
            {
                let utility = &self.compiled.utilities[utility_index];
                if utility.native_fallback && generated {
                    break;
                }
                let resolved_value = matched.value.as_deref().map(|value| {
                    if matched.value_normalized {
                        value.to_owned()
                    } else {
                        normalize_dynamic_value(value)
                    }
                });
                let mut emitted = false;
                for (branch_index, branch) in
                    resolve_state_branches(&matched.state_token, important, &self.compiled)
                        .into_iter()
                        .enumerate()
                {
                    if emit_declarations(
                        utility,
                        resolved_value.as_deref(),
                        branch.important,
                        &self.compiled,
                    )
                    .is_empty()
                    {
                        continue;
                    }
                    let key = if branch_index == 0 && branch.key.is_empty() {
                        class_name.to_owned()
                    } else {
                        format!("{class_name}\0{}", branch.key)
                    };
                    emitted |= seen.insert((key, branch.layer.unwrap_or(utility.layer)));
                }
                if !emitted {
                    continue;
                }
                generated = true;
                for (key, name) in &utility.variable_entries {
                    if seen_aliases.insert(key.clone()) {
                        variable_aliases.push((key.clone(), name.clone()));
                    }
                }
            }
            if generated {
                break;
            }
        }
        Ok(variable_aliases)
    }

    pub fn class_completion_candidates(
        &self,
    ) -> Result<Vec<EngineClassCompletionCandidate>, EngineError> {
        self.ensure_active()?;
        Ok(collect_class_completion_candidates(&self.compiled))
    }

    pub fn render_class_names_isolated<I, S>(
        &self,
        class_names: I,
    ) -> Result<Vec<String>, EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        self.ensure_active()?;
        let mut isolated = self.fork_empty();
        let mut rendered = Vec::new();
        for class_name in class_names {
            let class_name = class_name.as_ref();
            isolated.ensure_class_rules([class_name])?;
            rendered.push(isolated.snapshot()?.text);
            isolated.delete_class_rules([class_name])?;
        }
        Ok(rendered)
    }

    pub fn color_tokens(&self, class_name: &str) -> Result<Vec<EngineColorToken>, EngineError> {
        self.ensure_active()?;
        let generated = self.generate_class_rules(class_name);
        if generated.is_empty() || generated.iter().all(|rule| rule.ir.utility_type == -2) {
            return Ok(Vec::new());
        }
        Ok(collect_engine_color_tokens(class_name, &self.compiled))
    }

    pub fn css_text(&self) -> String {
        let mut output = String::new();
        if let Some(theme) = self.theme_rule_text() {
            output.push_str("@layer theme{");
            output.push_str(&theme);
            output.push('}');
        }
        for layer in UTILITY_LAYERS {
            let rules = &self.layers[layer_index(layer)];
            if rules.is_empty() {
                continue;
            }
            output.push_str("@layer ");
            output.push_str(layer_name(layer));
            output.push('{');
            for rule in rules {
                output.push_str(&rule.ir.text);
            }
            output.push('}');
        }
        for definition in self.keyframe_snapshot() {
            output.push_str(&definition.text);
        }
        output
    }

    pub fn dispose(&mut self) {
        self.layers.iter_mut().for_each(Vec::clear);
        self.class_rules.clear();
        self.class_order.clear();
        self.rule_counts.clear();
        self.variable_counts.clear();
        self.keyframe_counts.clear();
        self.keyframe_texts.clear();
        self.stylesheet_sources.clear();
        self.theme_variable_names.clear();
        self.theme_text = None;
        self.theme_dirty = false;
        self.disposed = true;
    }

    pub(crate) fn fork_empty_with_emitted_globals(&self, emitted_globals: EmittedGlobals) -> Self {
        let mut session = Self {
            manifest: self.manifest.clone(),
            compiled: self.compiled.clone(),
            layers: std::array::from_fn(|_| Vec::new()),
            class_rules: HashMap::new(),
            class_order: Vec::new(),
            rule_counts: HashMap::new(),
            emitted_globals,
            variable_counts: HashMap::new(),
            keyframe_counts: HashMap::new(),
            keyframe_texts: Vec::new(),
            stylesheet_sources: Vec::new(),
            theme_variable_names: Vec::new(),
            theme_text: None,
            theme_dirty: false,
            theme_batch_depth: 0,
            disposed: false,
        };
        session.initialize_variable_resources();
        session.sync_theme_text();
        session
    }

    pub(crate) fn fork_empty(&self) -> Self {
        self.fork_empty_with_emitted_globals(EmittedGlobals::default())
    }
}
