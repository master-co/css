use super::{
    EngineCompositionRuleIr, EngineSession, GeneratedRuleIr, GeneratedRuleNodeIr, HashSet,
    RulePriorityIr, StoredRule, apply_forced_mode, canonicalize_class_name,
    collect_animation_names, collect_css_variable_names, composition_conditions,
    composition_selector, create_selector_text, emit_declarations, find_group_close,
    normalize_dynamic_value, parse_serialized_declarations, resolve_state_branches,
    selector_priority, split_top_level, wrap_raw_conditions, wrap_state_conditions,
};

impl EngineSession {
    pub(crate) fn generate_class_rules(&self, class_name: &str) -> Vec<StoredRule> {
        self.generate_class_rules_with_mode(class_name, None)
    }

    pub(crate) fn generate_composition_rules(
        &self,
        class_name: &str,
    ) -> Vec<EngineCompositionRuleIr> {
        if let Some((items, state)) = group_items(class_name) {
            if !super::named::diagnostics(class_name, &self.compiled).is_empty() {
                return Vec::new();
            }
            return items
                .iter()
                .enumerate()
                .flat_map(|(index, item)| {
                    let nested = format!("{item}{state}");
                    self.generate_composition_rules(&nested)
                        .into_iter()
                        .map(move |mut rule| {
                            rule.key = format!("{class_name}\0group:{index}\0{}", rule.key);
                            rule.class_name = class_name.into();
                            rule
                        })
                })
                .collect();
        }
        if mastercss_lexer::decode_native_content(class_name).is_none() {
            return Vec::new();
        }
        let mut generated = Vec::new();
        let mut seen = HashSet::new();
        let (semantic_class_name, important) = class_name
            .strip_suffix('!')
            .map_or((class_name, false), |name| (name, true));
        let matching_class_names = [canonicalize_class_name(semantic_class_name)
            .unwrap_or_else(|| semantic_class_name.to_owned())];
        for matching_class_name in matching_class_names {
            let generated_before_candidate = generated.len();
            let matches = super::named::matching_utilities(&matching_class_name, &self.compiled);
            let fallback = matches
                .is_empty()
                .then(|| self.native_declaration_fallback(&matching_class_name))
                .flatten();
            for (utility, matched) in matches
                .into_iter()
                .map(|(index, matched)| (&self.compiled.utilities[index], matched))
                .chain(
                    fallback
                        .as_ref()
                        .map(|(utility, matched)| (utility, matched.clone())),
                )
            {
                if utility.native_fallback && generated.len() > generated_before_candidate {
                    break;
                }
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
                    let emitted_rules = emit_declarations(
                        utility,
                        resolved_value.as_deref(),
                        branch.important || self.compiled.settings.important,
                    );
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
                        value_priority: if matched.matcher_type == super::UtilityMatcherType::Token
                        {
                            -1
                        } else {
                            0
                        },
                        sort_key: super::named::sort_key(utility, &matched),
                        features: branch.features.clone(),
                        conditions: branch
                            .condition_wrappers
                            .iter()
                            .map(|(_, value)| mastercss_lexer::canonical_native_content(value))
                            .collect(),
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
        if mastercss_lexer::decode_native_content(class_name).is_none() {
            return Vec::new();
        }
        let mut generated = Vec::new();
        let mut seen = HashSet::new();
        let (semantic_class_name, important) = class_name
            .strip_suffix('!')
            .map_or((class_name, false), |name| (name, true));
        let matching_class_names = [canonicalize_class_name(semantic_class_name)
            .unwrap_or_else(|| semantic_class_name.to_owned())];
        for matching_class_name in matching_class_names {
            let generated_before_candidate = generated.len();
            let matches = super::named::matching_utilities(&matching_class_name, &self.compiled);
            let fallback = matches
                .is_empty()
                .then(|| self.native_declaration_fallback(&matching_class_name))
                .flatten();
            for (utility, matched) in matches
                .into_iter()
                .map(|(index, matched)| (&self.compiled.utilities[index], matched))
                .chain(
                    fallback
                        .as_ref()
                        .map(|(utility, matched)| (utility, matched.clone())),
                )
            {
                if utility.native_fallback && generated.len() > generated_before_candidate {
                    break;
                }
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
                    let emitted_rules = emit_declarations(
                        utility,
                        resolved_value.as_deref(),
                        branch.important || self.compiled.settings.important,
                    );
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
                                value_priority: if matched.matcher_type
                                    == super::UtilityMatcherType::Token
                                {
                                    -1
                                } else {
                                    0
                                },
                                sort_key: super::named::sort_key(utility, &matched),
                                features: branch.features.clone(),
                                conditions: branch
                                    .condition_wrappers
                                    .iter()
                                    .map(|(_, value)| {
                                        mastercss_lexer::canonical_native_content(value)
                                    })
                                    .collect(),
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
        let (items, state) = group_items(class_name)?;
        if !super::named::diagnostics(class_name, &self.compiled).is_empty() {
            return Some(Vec::new());
        }
        let group_selector = format!(".{}", super::css_escape(class_name));
        let mut generated = Vec::new();
        for (index, item) in items.iter().enumerate() {
            let nested = format!("{item}{state}");
            let nested_selector = format!(".{}", super::css_escape(&nested));
            for mut rule in self.generate_class_rules_with_mode(&nested, mode) {
                rule.ir.class_name = class_name.into();
                rule.ir.key = format!("{class_name}\0group:{index}\0{}", rule.ir.key);
                rule.ir.text = rule.ir.text.replace(&nested_selector, &group_selector);
                rule.ir.selector_text = rule
                    .ir
                    .selector_text
                    .map(|selector| selector.replace(&nested_selector, &group_selector));
                for node in &mut rule.ir.nodes {
                    node.text = node.text.replace(&nested_selector, &group_selector);
                }
                generated.push(rule);
            }
        }
        Some(generated)
    }
}

fn group_items(class_name: &str) -> Option<(Vec<String>, &str)> {
    let body = class_name.strip_prefix('{')?;
    let close = find_group_close(body)?;
    let items = split_top_level(&body[..close], ';')
        .into_iter()
        .filter(|item| !item.is_empty())
        .collect();
    Some((items, &body[close + 1..]))
}
