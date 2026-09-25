use super::{
    EngineAnimationResourceIr, EngineError, EngineResourcesIr, EngineSession,
    EngineVariableResourceIr, HashMap, HashSet, NativeDeclarationCandidate,
    NativeDeclarationCandidateIr, RuleMutationIr, RuleTarget, UtilityDefinition, UtilityEmit,
    UtilityLayerName, Value, builtin_key_alias, collect_css_variable_names, find_group_close,
    is_valid_native_property, resolve_value_components, serialize_literal_value,
    single_native_declaration, split_dynamic_value_state, split_top_level,
};

impl EngineSession {
    pub(crate) fn ensure_active(&self) -> Result<(), EngineError> {
        if self.disposed {
            Err(EngineError::SessionDisposed)
        } else {
            Ok(())
        }
    }

    pub(crate) fn render_theme_rule_text(&self) -> Option<String> {
        let declarations = |mode: Option<&str>| {
            self.theme_variable_names
                .iter()
                .filter_map(|name| {
                    let variable = self.compiled.compiled_variables.get(name)?;
                    let value = match mode {
                        None => variable.value.as_ref(),
                        Some(mode) => variable
                            .modes
                            .iter()
                            .find(|value| value.name == mode)
                            .map(|value| &value.value),
                    }?;
                    Some(format!("--{name}:{value}"))
                })
                .collect::<Vec<_>>()
                .join(";")
        };
        let mut text = String::new();
        let base = declarations(None);
        if !base.is_empty() {
            text.push_str(&format!(":root,:host{{{base}}}"));
        }
        for mode in &self.compiled.modes {
            let values = declarations(Some(&mode.name));
            if values.is_empty() {
                continue;
            }
            for branch in &mode.branches {
                let rule = format!("{}{{{values}}}", branch.selector);
                text.push_str(&super::wrap_raw_conditions(rule, &branch.conditions));
            }
        }
        (!text.is_empty()).then_some(text)
    }

    pub(crate) fn resource_snapshot(&self) -> EngineResourcesIr {
        let variables = self
            .theme_variable_names
            .iter()
            .filter_map(|name| {
                let variable = self.compiled.compiled_variables.get(name)?;
                Some(EngineVariableResourceIr {
                    name: name.clone(),
                    ref_count: self.variable_counts.get(name).copied().unwrap_or_default(),
                    dependencies: variable.dependencies.clone(),
                    static_resource: variable.static_resource,
                })
            })
            .collect();
        let animations = self
            .animation_names
            .iter()
            .enumerate()
            .filter_map(|(index, name)| {
                Some(EngineAnimationResourceIr {
                    name: name.clone(),
                    index: index as u32,
                    ref_count: self.animation_counts.get(name).copied().unwrap_or_default(),
                    text: self.keyframe_text(name)?,
                })
            })
            .collect();
        EngineResourcesIr {
            theme_text: self.theme_rule_text(),
            variables,
            animations,
        }
    }

    pub(crate) fn initialize_variable_resources(&mut self) {
        for (name, count) in &self.emitted_globals.variables {
            if *count > 0 {
                self.variable_counts.insert(name.clone(), *count);
            }
        }
        let static_variables = self
            .compiled
            .compiled_variable_order
            .iter()
            .filter(|name| {
                self.compiled
                    .compiled_variables
                    .get(*name)
                    .is_some_and(|variable| variable.static_resource && !variable.inline)
            })
            .cloned()
            .collect::<Vec<_>>();
        for variable_name in static_variables {
            // A static root owns a permanent reference to its dependency graph,
            // including when another stylesheet already supplies the root.
            self.retain_variable_graph(&variable_name, &mut HashSet::new());
        }
    }

    pub(crate) fn initialize_animation_resources(&mut self) {
        for (name, count) in &self.emitted_globals.animations {
            if *count > 0 {
                self.animation_counts.insert(name.clone(), *count);
            }
        }
        let static_animations = self
            .compiled
            .animations
            .keys()
            .filter(|name| {
                self.compiled
                    .animation_options
                    .get(*name)
                    .is_some_and(|options| options.static_resource)
            })
            .cloned()
            .collect::<Vec<_>>();
        for name in static_animations {
            if self.emitted_globals.animation_count(&name) == 0 {
                let count = self.animation_counts.entry(name.clone()).or_default();
                *count = count.saturating_add(1);
                self.animation_names.push(name.clone());
            }
            for variable_name in self.keyframe_variable_names(&name) {
                self.register_variable(&variable_name, &mut HashSet::new());
            }
        }
    }

    pub(crate) fn keyframe_text(&self, name: &str) -> Option<String> {
        let frames = self.compiled.animations.get(name)?.as_object()?;
        let mut text = format!("@keyframes {name}{{");
        for (selector, declarations) in frames {
            let declarations = declarations.as_object()?;
            text.push_str(selector);
            text.push('{');
            for (index, (property, value)) in declarations.iter().enumerate() {
                if index > 0 {
                    text.push(';');
                }
                text.push_str(property);
                text.push(':');
                text.push_str(&serialize_literal_value(value)?);
            }
            text.push('}');
        }
        text.push('}');
        Some(text)
    }

    pub(crate) fn parse_native_declaration_candidate(
        &self,
        class_name: &str,
    ) -> Option<NativeDeclarationCandidate> {
        let semantic_class_name = class_name.strip_suffix('!').unwrap_or(class_name);
        if super::named::token_prefix(semantic_class_name, &self.compiled).is_some_and(|prefix| {
            !super::named::token_candidates(semantic_class_name, prefix, &self.compiled).is_empty()
        }) {
            return None;
        }
        let colon = semantic_class_name.find(':')?;
        let source_property = &semantic_class_name[..colon];
        if !is_valid_native_property(source_property) {
            return None;
        }
        let property = builtin_key_alias(source_property).unwrap_or(source_property);
        if !is_valid_native_property(property) {
            return None;
        }
        let (raw_value, _) = split_dynamic_value_state(&semantic_class_name[colon + 1..]);
        if raw_value.is_empty() {
            return None;
        }
        let (value, _) = resolve_value_components(&raw_value, None, &self.compiled);
        Some(NativeDeclarationCandidate {
            ir: NativeDeclarationCandidateIr {
                class_name: class_name.to_owned(),
                property: property.to_owned(),
                value,
            },
        })
    }

    // Called only after registered utility matching returned no candidates.
    pub(crate) fn native_declaration_fallback(
        &self,
        class_name: &str,
    ) -> Option<(UtilityDefinition, super::UtilityMatch)> {
        let candidate = self.parse_native_declaration_candidate(class_name)?;
        let (_, state) = split_dynamic_value_state(class_name.split_once(':')?.1);
        let value = candidate.ir.value;
        if !candidate.ir.property.starts_with("--")
            && super::utility::contains_legacy_variable_reference(&value)
        {
            return None;
        }
        mastercss_lexer::decode_native_content(&value)?;
        let utility = UtilityDefinition {
            id: format!("native:{}", candidate.ir.property),
            name: None,
            utility_type: if super::is_native_shorthand_property(&candidate.ir.property) {
                -1
            } else {
                0
            },
            order: Some(0),
            layer: UtilityLayerName::Utilities,
            kind: None,
            keys: Vec::new(),
            alias_groups: Vec::new(),
            variable_aliases: Vec::new(),
            variable_alias_refs: Vec::new(),
            variables: HashMap::new(),
            variable_entries: Vec::new(),
            native_fallback: true,
            builtin_token: false,
            emit: UtilityEmit::Property {
                property: candidate.ir.property,
            },
            matchers: Vec::new(),
        };
        Some((
            utility,
            super::UtilityMatch {
                value: Some(value),
                value_normalized: true,
                state_token: state,
                variable_names: Vec::new(),
                matcher_type: super::UtilityMatcherType::Key,
            },
        ))
    }

    pub(crate) fn native_declaration_candidates_for_class(
        &self,
        class_name: &str,
    ) -> Vec<NativeDeclarationCandidate> {
        if self.class_rules.contains_key(class_name) {
            return Vec::new();
        }
        if let Some(body) = class_name.strip_prefix('{')
            && let Some(close) = find_group_close(body)
        {
            return split_top_level(&body[..close], ';')
                .into_iter()
                .filter(|nested_class| !nested_class.is_empty())
                .flat_map(|nested_class| {
                    self.native_declaration_candidates_for_class(&nested_class)
                })
                .collect();
        }
        let source_candidate = self.parse_native_declaration_candidate(class_name);
        let generated = self.generate_class_rules(class_name);
        if generated.is_empty() {
            return source_candidate.into_iter().collect();
        }
        if generated.iter().any(|rule| !rule.native_fallback) {
            return Vec::new();
        }
        let Some(_source_candidate) = source_candidate else {
            return Vec::new();
        };
        let mut seen = HashSet::new();
        generated
            .into_iter()
            .filter_map(|rule| single_native_declaration(&rule.declarations))
            .filter(|declaration| seen.insert(declaration.clone()))
            .map(|(property, value)| NativeDeclarationCandidate {
                ir: NativeDeclarationCandidateIr {
                    class_name: class_name.to_owned(),
                    property,
                    value,
                },
            })
            .collect()
    }

    pub(crate) fn keyframe_variable_names(&self, name: &str) -> Vec<String> {
        let Some(frames) = self
            .compiled
            .animations
            .get(name)
            .and_then(Value::as_object)
        else {
            return Vec::new();
        };
        let mut names = Vec::new();
        for declarations in frames.values().filter_map(Value::as_object) {
            for value in declarations.values().filter_map(serialize_literal_value) {
                for variable_name in collect_css_variable_names(&value) {
                    if self
                        .compiled
                        .compiled_variables
                        .contains_key(&variable_name)
                        && !names.contains(&variable_name)
                    {
                        names.push(variable_name);
                    }
                }
            }
        }
        names
    }

    pub(crate) fn register_rule_animations(
        &mut self,
        animation_names: &[String],
        mutations: &mut Vec<RuleMutationIr>,
    ) {
        for name in animation_names {
            if !self.compiled.animations.contains_key(name) {
                continue;
            }
            let count = self.animation_counts.entry(name.clone()).or_default();
            *count = count.saturating_add(1);
            if *count != 1 || self.emitted_globals.animation_count(name) > 0 {
                continue;
            }
            let index = self.animation_names.len();
            self.animation_names.push(name.clone());
            if let Some(text) = self.keyframe_text(name) {
                mutations.push(RuleMutationIr::Insert {
                    target: RuleTarget::Keyframes,
                    index: index as u32,
                    key: name.clone(),
                    text,
                    rule: None,
                });
            }
            for variable_name in self.keyframe_variable_names(name) {
                self.register_variable(&variable_name, &mut HashSet::new());
            }
        }
    }

    pub(crate) fn unregister_rule_animations(
        &mut self,
        animation_names: &[String],
        mutations: &mut Vec<RuleMutationIr>,
    ) {
        for name in animation_names {
            let host_count = self.emitted_globals.animation_count(name);
            let remove = match self.animation_counts.get_mut(name) {
                Some(count) if *count > host_count => {
                    if host_count == 0 && *count == 1 {
                        true
                    } else {
                        *count -= 1;
                        false
                    }
                }
                Some(_) => false,
                None => false,
            };
            if !remove {
                continue;
            }
            self.animation_counts.remove(name);
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
                for variable_name in self.keyframe_variable_names(name) {
                    self.unregister_variable(&variable_name, &mut HashSet::new());
                }
            }
        }
    }

    pub(crate) fn register_rule_variables(&mut self, variable_names: &[String]) {
        for variable_name in variable_names {
            self.register_variable(variable_name, &mut HashSet::new());
        }
    }

    pub(crate) fn register_variable(&mut self, variable_name: &str, visited: &mut HashSet<String>) {
        self.retain_variable_graph(variable_name, visited);
    }

    fn retain_variable_graph(&mut self, variable_name: &str, visited: &mut HashSet<String>) {
        let mut pending = vec![variable_name.to_owned()];
        while let Some(name) = pending.pop() {
            if !visited.insert(name.clone()) {
                continue;
            }
            let Some(variable) = self.compiled.compiled_variables.get(&name) else {
                continue;
            };
            // Inline nodes do not emit declarations, but their substituted values
            // can still reference non-inline resources.
            pending.extend(variable.dependencies.iter().rev().cloned());
            if variable.inline {
                continue;
            }
            let count = self.variable_counts.entry(name.clone()).or_default();
            *count = count.saturating_add(1);
            if *count == 1 {
                self.theme_variable_names.push(name);
                self.theme_dirty = true;
            }
        }
    }

    pub(crate) fn unregister_rule_variables(&mut self, variable_names: &[String]) {
        for variable_name in variable_names {
            self.unregister_variable(variable_name, &mut HashSet::new());
        }
    }

    pub(crate) fn unregister_variable(
        &mut self,
        variable_name: &str,
        visited: &mut HashSet<String>,
    ) {
        let mut pending = vec![variable_name.to_owned()];
        while let Some(name) = pending.pop() {
            if !visited.insert(name.clone()) {
                continue;
            }
            let Some(variable) = self.compiled.compiled_variables.get(&name) else {
                continue;
            };
            pending.extend(variable.dependencies.iter().rev().cloned());
            if variable.inline {
                continue;
            }
            let host_count = self.emitted_globals.variable_count(&name);
            let remove = match self.variable_counts.get_mut(&name) {
                Some(count) if *count > host_count => {
                    if host_count == 0 && *count == 1 {
                        true
                    } else {
                        *count -= 1;
                        false
                    }
                }
                Some(_) => false,
                None => false,
            };
            if remove {
                self.variable_counts.remove(&name);
                self.theme_variable_names
                    .retain(|variable| variable != &name);
                self.theme_dirty = true;
            }
        }
    }
}
