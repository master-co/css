use super::*;

impl EngineSession {
    pub(crate) fn ensure_active(&self) -> Result<(), EngineError> {
        if self.disposed {
            Err(EngineError::SessionDisposed)
        } else {
            Ok(())
        }
    }

    pub(crate) fn theme_rule_text(&self) -> Option<String> {
        let mut buckets = Vec::<ThemeBucket>::new();
        for name in &self.theme_variable_names {
            let Some(variable) = self.compiled.compiled_variables.get(name) else {
                continue;
            };
            if let Some(value) = &variable.value {
                push_theme_declaration(
                    &mut buckets,
                    "",
                    ":root",
                    None,
                    format!("--{name}:{value}"),
                );
            }
            if self.compiled.settings.mode_trigger.is_empty() {
                continue;
            }
            for mode in &variable.modes {
                let is_default_mode = variable.value.is_none()
                    && self.compiled.settings.default_mode != "none"
                    && self.compiled.settings.default_mode == mode.name;
                let (media_text, selector_text) = match self.compiled.settings.mode_trigger.as_str()
                {
                    "class" => (
                        "".to_owned(),
                        format!(
                            ".{}{}",
                            mode.name,
                            if is_default_mode { ",:root" } else { "" }
                        ),
                    ),
                    "host" => (
                        "".to_owned(),
                        format!(
                            ":host(.{}){}",
                            mode.name,
                            if is_default_mode { ",:host" } else { "" }
                        ),
                    ),
                    _ => (
                        format!("@media (prefers-color-scheme:{})", mode.name),
                        ":root".to_owned(),
                    ),
                };
                push_theme_declaration(
                    &mut buckets,
                    &media_text,
                    &selector_text,
                    Some(&mode.name),
                    format!("--{name}:{}", mode.value),
                );
            }
        }
        buckets.sort_by(|left, right| {
            theme_bucket_rank(left)
                .cmp(&theme_bucket_rank(right))
                .then_with(|| left.order.cmp(&right.order))
        });
        let text = buckets
            .into_iter()
            .map(|bucket| {
                let mut declarations = Vec::new();
                if matches!(
                    self.compiled.settings.mode_trigger.as_str(),
                    "class" | "host"
                ) && bucket.media_text.is_empty()
                    && matches!(bucket.mode.as_deref(), Some("light" | "dark"))
                {
                    declarations.push(format!(
                        "color-scheme:{}",
                        bucket.mode.as_deref().unwrap_or_default()
                    ));
                }
                declarations.extend(bucket.declarations);
                let rule = format!("{}{{{}}}", bucket.selector_text, declarations.join(";"));
                if bucket.media_text.is_empty() {
                    rule
                } else {
                    format!("{}{{{rule}}}", bucket.media_text)
                }
            })
            .collect::<String>();
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
                    && self.emitted_globals.variable_count(name) == 0
            })
            .cloned()
            .collect::<Vec<_>>();
        for variable_name in static_variables {
            let count = self
                .variable_counts
                .entry(variable_name.clone())
                .or_default();
            *count = count.saturating_add(1);
            self.theme_variable_names.push(variable_name);
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
            let mut ignored = Vec::new();
            for variable_name in self.keyframe_variable_names(&name) {
                self.register_variable(&variable_name, &mut ignored, &mut HashSet::new());
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
            match_name: format!("{property}:{raw_value}"),
        })
    }

    pub(crate) fn register_native_declaration_candidate(
        &mut self,
        candidate: NativeDeclarationCandidate,
        supported: bool,
    ) {
        self.native_declaration_support
            .entry(candidate.ir.class_name.clone())
            .or_default()
            .insert(
                (candidate.ir.property.clone(), candidate.ir.value.clone()),
                supported,
            );
        if !supported {
            return;
        }
        let id = format!("native:{}\0{}", candidate.ir.property, candidate.ir.value);
        if let Some(utility) = self
            .compiled
            .utilities
            .iter_mut()
            .find(|utility| utility.id == id)
        {
            if !utility.matchers.iter().any(
                |matcher| matches!(matcher, UtilityMatcher::Static { name } if name == &candidate.match_name),
            ) {
                utility.matchers.push(UtilityMatcher::Static {
                    name: candidate.match_name,
                });
            }
            return;
        }
        let mut declarations = Map::new();
        declarations.insert(
            candidate.ir.property.clone(),
            Value::String(candidate.ir.value),
        );
        self.compiled.utilities.push(UtilityDefinition {
            id,
            name: Some(candidate.match_name.clone()),
            utility_type: if is_native_shorthand_property(&candidate.ir.property) {
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
            emit: UtilityEmit::Static {
                rules: vec![StaticUtilityRule {
                    declarations,
                    selector: None,
                    conditions: Vec::new(),
                }],
            },
            matchers: vec![UtilityMatcher::Static {
                name: candidate.match_name,
            }],
        });
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
        let Some(source_candidate) = source_candidate else {
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
                match_name: source_candidate.match_name.clone(),
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
                self.register_variable(&variable_name, mutations, &mut HashSet::new());
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
                    self.unregister_variable(&variable_name, mutations, &mut HashSet::new());
                }
            }
        }
    }

    pub(crate) fn register_rule_variables(
        &mut self,
        variable_names: &[String],
        mutations: &mut Vec<RuleMutationIr>,
    ) {
        for variable_name in variable_names {
            self.register_variable(variable_name, mutations, &mut HashSet::new());
        }
    }

    pub(crate) fn register_variable(
        &mut self,
        variable_name: &str,
        mutations: &mut Vec<RuleMutationIr>,
        visited: &mut HashSet<String>,
    ) {
        if !visited.insert(variable_name.to_owned()) {
            return;
        }
        let Some(variable) = self.compiled.compiled_variables.get(variable_name).cloned() else {
            return;
        };
        if variable.inline {
            return;
        }
        let count = self
            .variable_counts
            .entry(variable_name.to_owned())
            .or_default();
        *count = count.saturating_add(1);
        if *count == 1 {
            let previous = self.theme_rule_text();
            self.theme_variable_names.push(variable_name.to_owned());
            self.push_theme_rule_change(previous, mutations);
        }
        for dependency in variable.dependencies {
            self.register_variable(&dependency, mutations, visited);
        }
    }

    pub(crate) fn unregister_rule_variables(
        &mut self,
        variable_names: &[String],
        mutations: &mut Vec<RuleMutationIr>,
    ) {
        for variable_name in variable_names {
            self.unregister_variable(variable_name, mutations, &mut HashSet::new());
        }
    }

    pub(crate) fn unregister_variable(
        &mut self,
        variable_name: &str,
        mutations: &mut Vec<RuleMutationIr>,
        visited: &mut HashSet<String>,
    ) {
        if !visited.insert(variable_name.to_owned()) {
            return;
        }
        let Some(variable) = self.compiled.compiled_variables.get(variable_name).cloned() else {
            return;
        };
        if variable.inline {
            return;
        }
        let previous = self.theme_rule_text();
        let host_count = self.emitted_globals.variable_count(variable_name);
        let remove = match self.variable_counts.get_mut(variable_name) {
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
            self.variable_counts.remove(variable_name);
            self.theme_variable_names
                .retain(|name| name != variable_name);
            self.push_theme_rule_change(previous, mutations);
        }
        for dependency in variable.dependencies {
            self.unregister_variable(&dependency, mutations, visited);
        }
    }

    pub(crate) fn push_theme_rule_change(
        &self,
        previous: Option<String>,
        mutations: &mut Vec<RuleMutationIr>,
    ) {
        let next = self.theme_rule_text();
        if previous == next {
            return;
        }
        if previous.is_some() {
            mutations.push(RuleMutationIr::Delete {
                target: RuleTarget::Theme,
                index: 0,
                key: "theme:root".into(),
            });
        }
        if let Some(text) = next {
            mutations.push(RuleMutationIr::Insert {
                target: RuleTarget::Theme,
                index: 0,
                key: "theme:root".into(),
                text,
                rule: None,
            });
        }
    }
}
