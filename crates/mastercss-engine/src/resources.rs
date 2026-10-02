use super::{
    EngineError, EngineResourcesIr, EngineSession, EngineVariableResourceIr, HashMap, HashSet,
    NativeDeclarationCandidate, NativeDeclarationCandidateIr, UtilityDefinition, UtilityEmit,
    UtilityLayerName, native_declaration_head, resolve_value_components, single_native_declaration,
    split_dynamic_value_state,
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
        fn render(nodes: &[mastercss_schema::ThemeNode], active: &HashSet<&str>) -> String {
            let mut text = String::new();
            for node in nodes {
                match node {
                    mastercss_schema::ThemeNode::Declaration { name, value, .. }
                        if active.contains(name.as_str()) =>
                    {
                        text.push_str(&format!(
                            "{}:{value};",
                            mastercss_lexer::css_escape(&format!("--{name}"))
                        ));
                    }
                    mastercss_schema::ThemeNode::Rule { prelude, children } => {
                        let body = render(children, active);
                        if !body.is_empty() {
                            text.push_str(&format!("{prelude}{{{body}}}"));
                        }
                    }
                    _ => {}
                }
            }
            if text.ends_with(';') {
                text.pop();
            }
            text
        }
        let active = self
            .theme_variable_names
            .iter()
            .map(String::as_str)
            .collect();
        let text = render(&self.compiled.theme, &active);
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
                })
            })
            .collect();
        EngineResourcesIr {
            theme_text: self.theme_rule_text(),
            variables,
            keyframes: self.keyframe_snapshot(),
        }
    }

    pub(crate) fn initialize_variable_resources(&mut self) {
        for (name, count) in &self.emitted_globals.variables {
            if *count > 0 {
                self.variable_counts.insert(name.clone(), *count);
            }
        }
        for (name, count) in self.emitted_globals.keyframes.clone() {
            if count > 0 && !self.emitted_globals.suppressed_keyframes.contains(&name) {
                self.keyframe_counts.insert(name.clone(), count);
                if let Some(definition) = self
                    .compiled
                    .keyframes
                    .iter()
                    .find(|definition| definition.id == name)
                {
                    let dependencies = definition.dependencies.clone();
                    self.register_rule_variables(&dependencies);
                }
            }
        }
        for definition in self.compiled.keyframes.clone() {
            if self
                .emitted_globals
                .suppressed_keyframes
                .contains(&definition.id)
            {
                continue;
            }
            if definition.retained && !self.keyframe_counts.contains_key(&definition.id) {
                self.keyframe_counts.insert(definition.id, 1);
                self.register_rule_variables(&definition.dependencies);
            }
        }
        let roots = self
            .compiled
            .compiled_variable_order
            .iter()
            .filter(|name| self.compiled.compiled_variables[*name].is_static)
            .cloned()
            .collect::<Vec<_>>();
        for name in roots {
            self.register_variable(&name, &mut HashSet::new());
            if self.compiled.compiled_variables[&name].namespace == "animate" {
                let animation =
                    self.declaration_animation_references(&format!("animation:var(--{name})"));
                self.register_keyframes(&animation.names, animation.retain_all);
            }
        }
        self.variable_floors = self.variable_counts.clone();
        self.keyframe_floors = self.keyframe_counts.clone();
    }

    pub(crate) fn parse_native_declaration_candidate(
        &self,
        class_name: &str,
    ) -> Option<NativeDeclarationCandidate> {
        mastercss_lexer::decode_native_content(class_name)?;
        let semantic_class_name = class_name.strip_suffix('!').unwrap_or(class_name);
        if super::named::retired_token_message(semantic_class_name, &self.compiled).is_some() {
            return None;
        }
        if super::named::token_prefix(semantic_class_name, &self.compiled).is_some_and(|prefix| {
            !super::named::token_candidates(semantic_class_name, prefix, &self.compiled).is_empty()
        }) {
            return None;
        }
        let (colon, decoded) = native_declaration_head(semantic_class_name)?;
        let property = &semantic_class_name[..colon];
        if super::removed_syntax::removed_raw_alias(&decoded).is_some()
            || super::removed_syntax::removed_recipe(&decoded).is_some()
        {
            return None;
        }
        let (raw_value, state) = split_dynamic_value_state(&semantic_class_name[colon + 1..]);
        if !super::state::valid_class_selector(&super::state::split_state_token(&state).0) {
            return None;
        }
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
        let (colon, _) = native_declaration_head(class_name)?;
        let (_, state) = split_dynamic_value_state(&class_name[colon + 1..]);
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
            utility_type: 0,
            order: Some(0),
            layer: UtilityLayerName::Utilities,
            keys: Vec::new(),
            alias_groups: Vec::new(),
            variable_aliases: Vec::new(),
            variable_alias_refs: Vec::new(),
            variables: HashMap::new(),
            variable_entries: Vec::new(),
            native_fallback: true,
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
        if self.class_rules.contains_key(class_name)
            || !super::named::diagnostics(class_name, &self.compiled).is_empty()
        {
            return Vec::new();
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
            pending.extend(variable.dependencies.iter().rev().cloned());
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
            let host_count = self.variable_floors.get(&name).copied().unwrap_or_default();
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
