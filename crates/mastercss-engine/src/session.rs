use super::{
    ClassSemanticInspection, ClassSemanticKind, EmittedGlobals, EngineClassCompletionCandidate,
    EngineClassVariableIr, EngineColorToken, EngineCompositionRuleIr, EngineError,
    EngineInspectionIr, EngineSession, EngineSnapshotIr, EngineTransitionIr, HashMap, HashSet,
    ManifestProjection, MasterCssManifest, NativeDeclarationCandidateIr, RuleMutationIr,
    RuleTarget, StoredRule, UTILITY_LAYERS, UtilityLayerName, UtilityMatcherType,
    canonicalize_class_name, collect_class_completion_candidates, collect_engine_color_tokens,
    collect_stylesheet_animation_declarations, collect_stylesheet_animation_names,
    collect_stylesheet_keyframe_names, collect_stylesheet_variable_names, compare_stored_rules,
    compile_manifest, emit_declarations, engine_variable_ir, layer_index, layer_name,
    match_utility, normalize_dynamic_value, resolve_state_branches, resolve_style_selector_aliases,
};

impl EngineSession {
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
            theme_variable_names: Vec::new(),
            animation_counts: HashMap::new(),
            animation_names: Vec::new(),
            native_declaration_support: HashMap::new(),
            disposed: false,
        };
        session.initialize_variable_resources();
        session.initialize_animation_resources();
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
        self.ensure_class_rules_for_mode(class_names, None)
    }

    pub(crate) fn ensure_class_rules_for_mode<I, S>(
        &mut self,
        class_names: I,
        mode: Option<&str>,
    ) -> Result<EngineTransitionIr, EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        self.ensure_active()?;
        let mut mutations = Vec::new();
        for class_name in class_names {
            let class_name = class_name.as_ref();
            if class_name.is_empty() || self.class_rules.contains_key(class_name) {
                continue;
            }
            let generated = self.generate_class_rules_with_mode(class_name, mode);
            self.insert_generated_class_rules(class_name, generated, &mut mutations);
        }
        Ok(EngineTransitionIr::new(mutations))
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
            self.register_rule_variables(&rule.ir.variable_names, mutations);
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
            let animation_names = layer_rules[index].ir.animation_names.clone();
            self.register_rule_animations(&animation_names, mutations);
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
        self.ensure_active()?;
        let mut mutations = Vec::new();
        for class_name in class_names {
            let class_name = class_name.as_ref();
            let Some(keys) = self.class_rules.remove(class_name) else {
                continue;
            };
            for (layer, key) in keys.into_iter().rev() {
                let reference = (layer, key.clone());
                let should_remove = match self.rule_counts.get_mut(&reference) {
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
                self.rule_counts.remove(&reference);
                let rules = &mut self.layers[layer_index(layer)];
                let Some(index) = rules.iter().position(|rule| rule.ir.key == key) else {
                    continue;
                };
                let rule = rules.remove(index);
                mutations.push(RuleMutationIr::Delete {
                    target: RuleTarget::from(layer),
                    index: index as u32,
                    key,
                });
                self.unregister_rule_variables(&rule.ir.variable_names, &mut mutations);
                self.unregister_rule_animations(&rule.ir.animation_names, &mut mutations);
            }
            self.class_order
                .retain(|connected_class_name| connected_class_name != class_name);
        }
        Ok(EngineTransitionIr::new(mutations))
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

    pub fn ensure_class_rules_with_native_support<I, S>(
        &mut self,
        class_names: I,
        supported: &[bool],
    ) -> Result<EngineTransitionIr, EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        self.ensure_active()?;
        let class_names = class_names
            .into_iter()
            .map(|class_name| class_name.as_ref().to_owned())
            .collect::<Vec<_>>();
        let candidates = class_names
            .iter()
            .flat_map(|class_name| self.native_declaration_candidates_for_class(class_name))
            .collect::<Vec<_>>();
        for (candidate, supported) in candidates.into_iter().zip(supported.iter().copied()) {
            self.register_native_declaration_candidate(candidate, supported);
        }
        self.ensure_class_rules(class_names)
    }

    pub fn ensure_stylesheet_resources(
        &mut self,
        native_css: &str,
    ) -> Result<EngineTransitionIr, EngineError> {
        self.ensure_active()?;
        let mut mutations = Vec::new();
        let native_animation_names = collect_stylesheet_keyframe_names(native_css);
        for name in &native_animation_names {
            let count = self.emitted_globals.animation_count(name);
            self.emitted_globals
                .animations
                .insert(name.clone(), count.saturating_add(1));
            if let Some(index) = self
                .animation_names
                .iter()
                .position(|animation_name| animation_name == name)
            {
                self.animation_names.remove(index);
                mutations.push(RuleMutationIr::Delete {
                    target: RuleTarget::Keyframes,
                    index: index as u32,
                    key: name.clone(),
                });
            }
        }

        let variable_names = collect_stylesheet_variable_names(native_css)
            .into_iter()
            .filter(|name| self.compiled.compiled_variables.contains_key(name))
            .collect::<Vec<_>>();
        for variable_name in &variable_names {
            self.register_variable(variable_name, &mut mutations, &mut HashSet::new());
        }

        let animation_declarations = collect_stylesheet_animation_declarations(native_css);
        let animation_names = collect_stylesheet_animation_names(
            &animation_declarations,
            &variable_names,
            &self.compiled,
        )
        .into_iter()
        .filter(|name| !native_animation_names.contains(name))
        .collect::<Vec<_>>();
        self.register_rule_animations(&animation_names, &mut mutations);
        Ok(EngineTransitionIr::new(mutations))
    }

    pub fn emitted_globals_snapshot(&self) -> Result<EmittedGlobals, EngineError> {
        self.ensure_active()?;
        let mut emitted_globals = self.emitted_globals.clone();
        for name in &self.theme_variable_names {
            emitted_globals.variables.entry(name.clone()).or_insert(1);
        }
        for name in &self.animation_names {
            emitted_globals.animations.entry(name.clone()).or_insert(1);
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
        for (name, count) in emitted_globals.animations {
            if count == 0 {
                continue;
            }
            let current = merged.animation_count(&name);
            let next = current.saturating_add(count);
            if next != current {
                merged.animations.insert(name, next);
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
        let connected_classes = self.class_order.clone();
        let mut mutations = Vec::new();
        for layer in UTILITY_LAYERS.into_iter().rev() {
            let rules = &mut self.layers[layer_index(layer)];
            for index in (0..rules.len()).rev() {
                let rule = rules.remove(index);
                mutations.push(RuleMutationIr::Delete {
                    target: layer.into(),
                    index: index as u32,
                    key: rule.ir.key,
                });
            }
        }
        for index in (0..self.animation_names.len()).rev() {
            let name = self.animation_names[index].clone();
            mutations.push(RuleMutationIr::Delete {
                target: RuleTarget::Keyframes,
                index: index as u32,
                key: name,
            });
        }
        let previous_theme_text = self.theme_rule_text();
        self.variable_counts.clear();
        self.theme_variable_names.clear();
        self.animation_counts.clear();
        self.animation_names.clear();
        if previous_theme_text.is_some() {
            mutations.push(RuleMutationIr::Delete {
                target: RuleTarget::Theme,
                index: 0,
                key: "theme:root".into(),
            });
        }
        self.compiled = compiled;
        self.manifest = manifest;
        self.emitted_globals = emitted_globals;
        self.class_rules.clear();
        self.class_order.clear();
        self.rule_counts.clear();
        self.initialize_variable_resources();
        self.initialize_animation_resources();
        if let Some(text) = self.theme_rule_text() {
            mutations.push(RuleMutationIr::Insert {
                target: RuleTarget::Theme,
                index: 0,
                key: "theme:root".into(),
                text,
                rule: None,
            });
        }
        for (index, name) in self.animation_names.iter().enumerate() {
            if let Some(text) = self.keyframe_text(name) {
                mutations.push(RuleMutationIr::Insert {
                    target: RuleTarget::Keyframes,
                    index: index as u32,
                    key: name.clone(),
                    text,
                    rule: None,
                });
            }
        }
        mutations.extend(self.ensure_class_rules(connected_classes)?.mutations);
        Ok(EngineTransitionIr::new(mutations))
    }

    pub fn snapshot(&self) -> Result<EngineSnapshotIr, EngineError> {
        self.ensure_active()?;
        let rules = UTILITY_LAYERS
            .iter()
            .flat_map(|layer| self.layers[layer_index(*layer)].iter())
            .map(|rule| rule.ir.clone())
            .collect();
        Ok(EngineSnapshotIr {
            version: 1,
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
        let mut mutations = Vec::new();
        for (class_name, generated) in cached_classes {
            subset.insert_generated_class_rules(&class_name, generated, &mut mutations);
        }
        subset.snapshot()
    }

    pub fn inspect(&self, class_name: &str) -> Result<EngineInspectionIr, EngineError> {
        self.inspect_with_mode(class_name, None)
    }

    pub fn composition_rules(
        &self,
        class_name: &str,
    ) -> Result<Vec<EngineCompositionRuleIr>, EngineError> {
        self.ensure_active()?;
        Ok(self.generate_composition_rules(class_name))
    }

    pub fn resolve_style_selector(&self, selector: &str) -> Result<String, EngineError> {
        self.ensure_active()?;
        Ok(resolve_style_selector_aliases(selector, &self.compiled))
    }

    pub fn inspect_with_mode(
        &self,
        class_name: &str,
        mode: Option<&str>,
    ) -> Result<EngineInspectionIr, EngineError> {
        self.ensure_active()?;
        let rules = self
            .generate_class_rules_with_mode(class_name, mode)
            .into_iter()
            .map(|rule| rule.ir)
            .collect::<Vec<_>>();
        Ok(EngineInspectionIr {
            version: 1,
            class_name: class_name.to_owned(),
            valid: !rules.is_empty(),
            rules,
        })
    }

    pub fn inspect_class_semantics(
        &self,
        class_name: &str,
    ) -> Result<ClassSemanticInspection, EngineError> {
        self.inspect_class_semantics_with_mode(class_name, None)
    }

    pub fn inspect_class_semantics_with_mode(
        &self,
        class_name: &str,
        mode: Option<&str>,
    ) -> Result<ClassSemanticInspection, EngineError> {
        self.ensure_active()?;
        let rules = self.generate_class_rules_with_mode(class_name, mode);
        if rules.is_empty() {
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

        let component = rules.iter().any(|rule| {
            rule.ir.utility_type == -2 && rule.ir.layer == UtilityLayerName::Components
        });
        let kind = if component {
            ClassSemanticKind::Component
        } else if rules[0].ir.utility_type == -2 {
            ClassSemanticKind::Semantic
        } else if matcher_types.contains(&UtilityMatcherType::Pattern) {
            ClassSemanticKind::Pattern
        } else {
            ClassSemanticKind::Declaration
        };

        let raw_state_token = state_token.unwrap_or_default();
        let (state_token, state_important) = raw_state_token
            .strip_prefix('!')
            .map_or((raw_state_token.as_str(), false), |state| (state, true));
        let important = trailing_important || state_important;
        let state_token = (!state_token.is_empty()).then(|| state_token.to_owned());
        let (key_token, value_token) = if kind == ClassSemanticKind::Declaration {
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
        let mut matching_class_names = vec![semantic_class_name.to_owned()];
        if let Some(canonical) = canonicalize_class_name(semantic_class_name) {
            matching_class_names.push(canonical);
        }
        let mut variable_aliases = Vec::new();
        let mut seen_aliases = HashSet::new();
        let mut seen = HashSet::new();
        for matching_class_name in matching_class_names {
            let mut generated = false;
            for utility in &self.compiled.utilities {
                if utility.native_fallback && generated {
                    break;
                }
                let Some(matched) = match_utility(&matching_class_name, utility, &self.compiled)
                else {
                    continue;
                };
                let resolved_value = matched.value.as_deref().map(|value| {
                    if matched.value_normalized {
                        value.to_owned()
                    } else {
                        normalize_dynamic_value(value, &self.compiled.settings)
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
                        branch.important || self.compiled.settings.important,
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

    pub fn render_class_name_isolated_with_mode(
        &self,
        class_name: &str,
        mode: Option<&str>,
    ) -> Result<String, EngineError> {
        self.ensure_active()?;
        let mut isolated = self.fork_empty();
        isolated.ensure_class_rules_for_mode([class_name], mode)?;
        Ok(isolated.snapshot()?.text)
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
        for name in &self.animation_names {
            if let Some(keyframes) = self.keyframe_text(name) {
                output.push_str(&keyframes);
            }
        }
        output
    }

    pub fn dispose(&mut self) {
        self.layers.iter_mut().for_each(Vec::clear);
        self.class_rules.clear();
        self.class_order.clear();
        self.rule_counts.clear();
        self.variable_counts.clear();
        self.theme_variable_names.clear();
        self.animation_counts.clear();
        self.animation_names.clear();
        self.native_declaration_support.clear();
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
            theme_variable_names: Vec::new(),
            animation_counts: HashMap::new(),
            animation_names: Vec::new(),
            native_declaration_support: self.native_declaration_support.clone(),
            disposed: false,
        };
        session.initialize_variable_resources();
        session.initialize_animation_resources();
        session
    }

    pub(crate) fn fork_empty(&self) -> Self {
        self.fork_empty_with_emitted_globals(EmittedGlobals::default())
    }
}
