use super::{
    EngineCompositionRuleIr, EngineSession, GeneratedRuleIr, GeneratedRuleNodeIr, HashSet, Map,
    RulePriorityIr, StoredRule, Value, apply_forced_mode, canonicalize_class_name,
    collect_animation_names, collect_css_variable_names, composition_conditions,
    composition_selector, create_selector_text, emit_declarations, find_group_close, match_utility,
    normalize_dynamic_value, parse_serialized_declarations, resolve_state_branches,
    selector_priority, single_native_declaration, split_top_level, wrap_raw_conditions,
    wrap_state_conditions,
};

impl EngineSession {
    pub(crate) fn generate_class_rules(&self, class_name: &str) -> Vec<StoredRule> {
        self.generate_class_rules_with_mode(class_name, None)
    }

    pub(crate) fn generate_composition_rules(
        &self,
        class_name: &str,
    ) -> Vec<EngineCompositionRuleIr> {
        let mut generated = Vec::new();
        let mut seen = HashSet::new();
        let (semantic_class_name, important) = class_name
            .strip_suffix('!')
            .map_or((class_name, false), |name| (name, true));
        let mut matching_class_names = vec![semantic_class_name.to_owned()];
        if let Some(canonical) = canonicalize_class_name(semantic_class_name) {
            matching_class_names.push(canonical);
        }
        for matching_class_name in matching_class_names {
            let generated_before_candidate = generated.len();
            for utility in &self.compiled.utilities {
                if utility.native_fallback && generated.len() > generated_before_candidate {
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
                for (branch_index, branch) in
                    resolve_state_branches(&matched.state_token, important, &self.compiled)
                        .into_iter()
                        .enumerate()
                {
                    let mut emitted_rules = emit_declarations(
                        utility,
                        resolved_value.as_deref(),
                        branch.important || self.compiled.settings.important,
                    );
                    if utility.native_fallback
                        && let Some(support) = self.native_declaration_support.get(class_name)
                    {
                        emitted_rules.retain(|(_, declarations, _, _)| {
                            single_native_declaration(declarations).is_none_or(|declaration| {
                                support.get(&declaration).copied() != Some(false)
                            })
                        });
                    }
                    if emitted_rules.is_empty() {
                        continue;
                    }
                    let key = if branch_index == 0 && branch.key.is_empty() {
                        class_name.to_owned()
                    } else {
                        format!("{class_name}\0{}", branch.key)
                    };
                    let layer = branch.layer.unwrap_or(utility.layer);
                    if !seen.insert((key.clone(), layer)) {
                        continue;
                    }
                    let sort_tier = if !branch.condition_wrappers.is_empty() {
                        3
                    } else if branch.mode.is_some() {
                        2
                    } else if branch.selector_template.is_some() {
                        1
                    } else {
                        0
                    };
                    let priority = RulePriorityIr {
                        features: branch.features.clone(),
                        selector: selector_priority(branch.selector_template.as_deref()),
                    };
                    let base_selector = composition_selector(&branch, &self.compiled);
                    let branch_conditions = composition_conditions(&branch);
                    for (_, declarations, rule_selector, rule_conditions) in emitted_rules {
                        let selector = rule_selector
                            .as_deref()
                            .map(|template| template.replace('&', &base_selector))
                            .unwrap_or_else(|| base_selector.clone());
                        let mut conditions = branch_conditions.clone();
                        conditions.extend(rule_conditions);
                        generated.push(EngineCompositionRuleIr {
                            class_name: class_name.to_owned(),
                            key: key.clone(),
                            layer,
                            explicit_layer: branch.layer,
                            utility_type: utility.utility_type,
                            sort_tier,
                            priority: priority.clone(),
                            selector,
                            declarations: parse_serialized_declarations(&declarations),
                            conditions,
                        });
                    }
                }
            }
            if generated.len() > generated_before_candidate {
                break;
            }
        }
        generated
    }

    pub(crate) fn generate_class_rules_with_mode(
        &self,
        class_name: &str,
        mode: Option<&str>,
    ) -> Vec<StoredRule> {
        if let Some(rules) = self.generate_group_rules(class_name, mode) {
            return rules;
        }
        let mut generated = Vec::new();
        let mut seen = HashSet::new();
        let (semantic_class_name, important) = class_name
            .strip_suffix('!')
            .map_or((class_name, false), |name| (name, true));
        let mut matching_class_names = vec![semantic_class_name.to_owned()];
        if let Some(canonical) = canonicalize_class_name(semantic_class_name) {
            matching_class_names.push(canonical);
        }
        for matching_class_name in matching_class_names {
            let generated_before_candidate = generated.len();
            for utility in &self.compiled.utilities {
                if utility.native_fallback && generated.len() > generated_before_candidate {
                    break;
                }
                let Some(matched) = match_utility(&matching_class_name, utility, &self.compiled)
                else {
                    continue;
                };
                let mut state_branches =
                    resolve_state_branches(&matched.state_token, important, &self.compiled);
                apply_forced_mode(&mut state_branches, mode, &self.compiled);
                let resolved_value = matched.value.as_deref().map(|value| {
                    if matched.value_normalized {
                        value.to_owned()
                    } else {
                        normalize_dynamic_value(value, &self.compiled.settings)
                    }
                });
                for (branch_index, branch) in state_branches.into_iter().enumerate() {
                    let mut emitted_rules = emit_declarations(
                        utility,
                        resolved_value.as_deref(),
                        branch.important || self.compiled.settings.important,
                    );
                    if utility.native_fallback
                        && let Some(support) = self.native_declaration_support.get(class_name)
                    {
                        emitted_rules.retain(|(_, declarations, _, _)| {
                            single_native_declaration(declarations).is_none_or(|declaration| {
                                support.get(&declaration).copied() != Some(false)
                            })
                        });
                    }
                    if emitted_rules.is_empty() {
                        continue;
                    }
                    let key = if branch_index == 0 && branch.key.is_empty() {
                        class_name.to_owned()
                    } else {
                        format!("{class_name}\0{}", branch.key)
                    };
                    let layer = branch.layer.unwrap_or(utility.layer);
                    if !seen.insert((key.clone(), layer)) {
                        continue;
                    }
                    let selector_text =
                        create_selector_text(class_name, None, &branch, &self.compiled);
                    let mut node_texts = Vec::with_capacity(emitted_rules.len());
                    let mut declaration_texts = Vec::with_capacity(emitted_rules.len());
                    for (_, declarations, selector, rule_conditions) in emitted_rules {
                        let selector_text = create_selector_text(
                            class_name,
                            selector.as_deref(),
                            &branch,
                            &self.compiled,
                        );
                        let mut text = format!("{selector_text}{{{declarations}}}");
                        text = wrap_raw_conditions(text, &rule_conditions);
                        text = wrap_state_conditions(text, &branch.condition_wrappers);
                        node_texts.push(text);
                        declaration_texts.push(declarations);
                    }
                    let text = node_texts.concat();
                    let declarations = declaration_texts.join(";");
                    let mut variable_names = matched.variable_names.clone();
                    for name in collect_css_variable_names(&declarations) {
                        if self.compiled.compiled_variables.contains_key(&name)
                            && !variable_names.contains(&name)
                        {
                            variable_names.push(name);
                        }
                    }
                    let sort_tier = if !branch.condition_wrappers.is_empty() {
                        3
                    } else if branch.mode.is_some() {
                        2
                    } else if branch.selector_template.is_some() {
                        1
                    } else {
                        0
                    };
                    let animation_names =
                        collect_animation_names(&declarations, &variable_names, &self.compiled);
                    generated.push(StoredRule {
                        ir: GeneratedRuleIr {
                            class_name: class_name.to_owned(),
                            key,
                            layer,
                            utility_type: utility.utility_type,
                            sort_tier,
                            priority: RulePriorityIr {
                                features: branch.features.clone(),
                                selector: selector_priority(branch.selector_template.as_deref()),
                            },
                            text,
                            nodes: if node_texts.len() > 1 {
                                node_texts
                                    .into_iter()
                                    .map(|text| GeneratedRuleNodeIr { text })
                                    .collect()
                            } else {
                                Vec::new()
                            },
                            selector_text: Some(selector_text),
                            variable_names,
                            animation_names,
                        },
                        manifest_order: utility.order.unwrap_or_default(),
                        declarations,
                        native_fallback: utility.native_fallback,
                        matcher_type: Some(matched.matcher_type),
                        state_token: matched.state_token.clone(),
                    });
                }
            }
            if generated.len() > generated_before_candidate {
                break;
            }
        }
        generated
    }

    pub(crate) fn generate_group_rules(
        &self,
        class_name: &str,
        mode: Option<&str>,
    ) -> Option<Vec<StoredRule>> {
        let body = class_name.strip_prefix('{')?;
        let close = find_group_close(body)?;
        let declarations_source = &body[..close];
        let state_token = &body[close + 1..];
        let mut declarations = Map::<String, Value>::new();
        let mut variable_names = Vec::new();
        let mut animation_names = Vec::new();
        for nested_class in split_top_level(declarations_source, ';') {
            if nested_class.is_empty() {
                continue;
            }
            for nested_rule in self.generate_class_rules_with_mode(&nested_class, mode) {
                for declaration in split_top_level(&nested_rule.declarations, ';') {
                    let Some((property, value)) = declaration.split_once(':') else {
                        continue;
                    };
                    declarations.insert(property.to_owned(), Value::String(value.to_owned()));
                }
                for name in nested_rule.ir.variable_names {
                    if !variable_names.contains(&name) {
                        variable_names.push(name);
                    }
                }
                for name in nested_rule.ir.animation_names {
                    if !animation_names.contains(&name) {
                        animation_names.push(name);
                    }
                }
            }
        }
        if declarations.is_empty() {
            return Some(Vec::new());
        }
        let declarations = declarations
            .iter()
            .map(|(property, value)| format!("{property}:{}", value.as_str().unwrap_or_default()))
            .collect::<Vec<_>>()
            .join(";");
        let mut branches = resolve_state_branches(state_token, false, &self.compiled);
        apply_forced_mode(&mut branches, mode, &self.compiled);
        Some(
            branches
                .into_iter()
                .enumerate()
                .map(|(branch_index, branch)| {
                    let selector_text =
                        create_selector_text(class_name, None, &branch, &self.compiled);
                    let mut text = format!("{selector_text}{{{declarations}}}");
                    text = wrap_state_conditions(text, &branch.condition_wrappers);
                    let layer = branch.layer.unwrap_or_default();
                    StoredRule {
                        ir: GeneratedRuleIr {
                            class_name: class_name.to_owned(),
                            key: if branch_index == 0 && branch.key.is_empty() {
                                class_name.to_owned()
                            } else {
                                format!("{class_name}\0{}", branch.key)
                            },
                            layer,
                            utility_type: -1,
                            sort_tier: if !branch.condition_wrappers.is_empty() {
                                3
                            } else if branch.mode.is_some() {
                                2
                            } else if branch.selector_template.is_some() {
                                1
                            } else {
                                0
                            },
                            priority: RulePriorityIr {
                                features: branch.features.clone(),
                                selector: selector_priority(branch.selector_template.as_deref()),
                            },
                            text,
                            nodes: Vec::new(),
                            selector_text: Some(selector_text),
                            variable_names: variable_names.clone(),
                            animation_names: animation_names.clone(),
                        },
                        manifest_order: 0,
                        declarations: declarations.clone(),
                        native_fallback: false,
                        matcher_type: None,
                        state_token: state_token.to_owned(),
                    }
                })
                .collect(),
        )
    }
}
