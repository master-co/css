use super::{
    EngineError, EngineResourcesIr, EngineSession, EngineVariableResourceIr, HashSet,
    NativeDeclarationCandidate, NativeDeclarationCandidateIr, UtilityDefinition, UtilityEmit,
    UtilityLayerName,
};
use mastercss_lexer::concat_text;

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
                        text.push_str(&concat_text!(
                            mastercss_lexer::css_escape(&concat_text!("--", name)),
                            ":",
                            value,
                            ";"
                        ));
                    }
                    mastercss_schema::ThemeNode::Rule { prelude, children } => {
                        let body = render(children, active);
                        if !body.is_empty() {
                            text.push_str(&concat_text!(prelude, "{", body, "}"));
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
            self.register_variable(&name, &mut HashSet::default());
            if self.compiled.compiled_variables[&name].namespace == "animate" {
                let animation = self.declaration_animation_references(&concat_text!(
                    "animation:var(--",
                    name,
                    ")"
                ));
                self.register_keyframes(&animation.names, animation.retain_all);
            }
        }
        self.variable_floors = self.variable_counts.clone();
        self.keyframe_floors = self.keyframe_counts.clone();
    }

    /// The native declaration of a `(property:value)` head, or `None` for other heads
    /// and malformed declarations. Values decode Master spaces and normalize math.
    pub(crate) fn parse_native_declaration_candidate(
        &self,
        class_name: &str,
    ) -> Option<NativeDeclarationCandidate> {
        let semantic_class_name = class_name.strip_suffix('!').unwrap_or(class_name);
        let head = mastercss_lexer::parse_native_declaration(semantic_class_name)?.ok()?;
        let value = native_value(&semantic_class_name[head.value.clone()]);
        Some(NativeDeclarationCandidate {
            ir: NativeDeclarationCandidateIr {
                class_name: class_name.to_owned(),
                property: semantic_class_name[head.property].to_owned(),
                value,
            },
        })
    }

    /// The declaration of a `(property:value)` head as a property utility, its match
    /// and whether the value ends with a native `!important`.
    pub(crate) fn native_declaration(
        &self,
        class_name: &str,
    ) -> Option<(UtilityDefinition, super::UtilityMatch, bool)> {
        let head = mastercss_lexer::parse_native_declaration(class_name)?.ok()?;
        let value = native_value(&class_name[head.value.clone()]);
        let property = class_name[head.property.clone()].to_owned();
        let utility = UtilityDefinition {
            id: concat_text!("native:", property),
            name: None,
            utility_type: 0,
            order: Some(0),
            layer: UtilityLayerName::Utilities,
            keys: Vec::new(),
            alias_groups: Vec::new(),
            variable_aliases: Vec::new(),
            variable_alias_refs: Vec::new(),
            native_fallback: true,
            emit: UtilityEmit::Property { property },
            matchers: Vec::new(),
        };
        Some((
            utility,
            super::UtilityMatch {
                value: Some(value),
                arguments: Vec::new(),
                expansion: Default::default(),
                state_token: class_name[head.suffix_start..].to_owned(),
                variable_names: Vec::new(),
                matcher_type: super::UtilityMatcherType::Key,
            },
            head.important,
        ))
    }

    pub(crate) fn native_declaration_candidates_for_class(
        &self,
        class_name: &str,
    ) -> Vec<NativeDeclarationCandidate> {
        if self
            .class_rules
            .get(class_name)
            .is_some_and(|rules| !rules.is_empty())
            || !super::named::diagnostics(class_name, &self.compiled).is_empty()
        {
            return Vec::new();
        }
        self.parse_native_declaration_candidate(class_name)
            .into_iter()
            .collect()
    }

    pub(crate) fn register_rule_variables(&mut self, variable_names: &[String]) {
        for variable_name in variable_names {
            self.register_variable(variable_name, &mut HashSet::default());
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
            self.unregister_variable(variable_name, &mut HashSet::default());
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

/// A declaration value with Master spaces decoded outside protected text and math
/// normalized. Generation collects its variable references from the declaration.
fn native_value(value: &str) -> String {
    super::normalize_css_math_functions(&mastercss_lexer::decode_native_value(value))
}
