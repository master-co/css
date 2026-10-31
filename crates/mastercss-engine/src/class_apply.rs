//! Ordered class wrappers execute the same contents IR as native @apply.
use super::{
    EngineCompositionRuleIr, EngineSession, GeneratedRuleIr, GeneratedRuleNodeIr, RulePriorityIr,
    StoredRule,
};
use mastercss_lexer::concat_text;
use mastercss_lexer::text::decimal;
use mastercss_schema::{CssDeclaration, MixinNode, MixinValuePart, UtilityLayerName};

pub(crate) fn invocation(token: &str) -> Option<Result<(String, Vec<String>), String>> {
    let body = token.strip_prefix("apply(")?;
    Some(
        body.strip_suffix(')')
            .ok_or_else(|| "Unclosed @apply suffix".to_owned())
            .and_then(|body| {
                let body = mastercss_lexer::decode_native_content(body)
                    .ok_or("Invalid @apply arguments")?;
                mastercss_lexer::parse_mixin_call(&body)
            }),
    )
}

/// One outer state branch of an `@apply` class: the head's selector and the
/// branch's condition suffixes order it; the expanded rules keep authored order.
pub(crate) struct ApplicationGroup {
    key: String,
    sort_tier: i32,
    priority: RulePriorityIr,
    rules: Vec<EngineCompositionRuleIr>,
}

impl EngineSession {
    pub(crate) fn application_rules(
        &self,
        class: &str,
    ) -> Option<Result<Vec<EngineCompositionRuleIr>, String>> {
        self.application_groups(class).map(|result| {
            result.map(|groups| groups.into_iter().flat_map(|group| group.rules).collect())
        })
    }

    pub(crate) fn application_groups(
        &self,
        class: &str,
    ) -> Option<Result<Vec<ApplicationGroup>, String>> {
        if !class.contains("@apply(") {
            return None;
        }
        let source = class.strip_suffix('!').unwrap_or(class);
        // A declaration head is opaque: only the text after it holds conditions.
        let (head, suffixes) = match mastercss_lexer::parse_native_declaration(source) {
            Some(Ok(declaration)) => {
                let (selector, conditions) =
                    super::state::split_state_token(&source[declaration.suffix_start..]);
                (
                    concat_text!(&source[..declaration.suffix_start], selector),
                    conditions,
                )
            }
            _ => super::state::split_state_token(source),
        };
        if !suffixes.iter().any(|suffix| suffix.starts_with("apply(")) {
            return None;
        }
        Some(self.expand_application(class, &head, &suffixes))
    }

    fn expand_application(
        &self,
        class: &str,
        head: &str,
        suffixes: &[String],
    ) -> Result<Vec<ApplicationGroup>, String> {
        if let Some(diagnostic) = super::named::diagnostics(class, &self.compiled).first() {
            return Err(diagnostic.message.clone());
        }
        let important = class.ends_with('!');
        let native = matches!(mastercss_lexer::parse_native_declaration(head), Some(Ok(_)));
        let state = super::named::matching_utilities(head, &self.compiled)
            .first()
            .map(|(_, matched)| matched.state_token.clone())
            .or_else(|| {
                self.native_declaration(head)
                    .map(|(_, matched, _)| matched.state_token)
            })
            .unwrap_or_default();
        let base = head.strip_suffix(&state).unwrap_or(head);
        let diagnostics = super::named::diagnostics(base, &self.compiled);
        if let Some(diagnostic) = diagnostics.first() {
            return Err(diagnostic.message.clone());
        }
        let originals = self.generate_composition_rules_raw(base);
        if originals.is_empty() {
            return Err(format!("Unknown class body {base}"));
        }
        let mut layer = None;
        let mut body = Vec::new();
        for rule in &originals {
            if let Some(explicit) = rule.explicit_layer {
                set_layer(&mut layer, explicit)?;
            }
            let mut nodes = rule
                .declarations
                .iter()
                .map(|declaration| MixinNode::Declaration {
                    property: declaration.property.clone(),
                    value: vec![MixinValuePart::Text {
                        value: declaration.value.as_str().unwrap_or_default().into(),
                    }],
                    source: declaration.source.clone(),
                })
                .collect::<Vec<_>>();
            if rule.selector != "&" {
                nodes = vec![MixinNode::Rule {
                    selector: rule.selector.clone(),
                    body: nodes,
                }];
            }
            for condition in rule.conditions.iter().rev() {
                nodes = vec![MixinNode::Condition {
                    condition: condition.clone(),
                    body: nodes,
                }];
            }
            body.extend(nodes);
        }
        // Each condition suffix contributes one of its branches to every outer branch.
        let mut options = Vec::with_capacity(suffixes.len());
        for suffix in suffixes {
            if suffix.starts_with("apply(") {
                options.push(None);
            } else if let Some(next) = super::resolve_layer_condition(suffix, &self.compiled) {
                set_layer(&mut layer, next)?;
                options.push(None);
            } else {
                let branches = super::resolve_state_branches(
                    &concat_text!("@", suffix),
                    false,
                    &self.compiled,
                );
                if branches.is_empty()
                    && !self
                        .compiled
                        .custom_media
                        .contains_key(&concat_text!("--", suffix))
                {
                    return Err(format!("Unknown condition @{suffix}"));
                }
                options.push(Some(branches));
            }
        }
        let template = super::state::selector_token_to_template(&state, &self.compiled);
        let primary = &originals[0];
        let mut groups = Vec::new();
        let mut choice = vec![0_usize; suffixes.len()];
        'branches: loop {
            if options
                .iter()
                .any(|option| option.as_ref().is_some_and(Vec::is_empty))
            {
                break;
            }
            let mut nodes = body.clone();
            let mut outer = Vec::new();
            for (index, suffix) in suffixes.iter().enumerate().rev() {
                if let Some(branches) = &options[index] {
                    let branch = &branches[choice[index]];
                    for (_, condition) in branch.condition_wrappers.iter().rev() {
                        nodes = vec![MixinNode::Condition {
                            condition: condition.clone(),
                            body: nodes,
                        }];
                    }
                    outer.splice(0..0, branch.condition_wrappers.iter().cloned());
                } else if let Some(call) = invocation(suffix) {
                    let (name, arguments) = call?;
                    nodes = vec![MixinNode::Apply {
                        name,
                        arguments: arguments
                            .into_iter()
                            .map(|value| vec![MixinValuePart::Text { value }])
                            .collect(),
                        contents: Some(nodes),
                        source: None,
                    }];
                }
            }
            if let Some(selector) = &template {
                nodes = vec![MixinNode::Rule {
                    selector: selector.clone(),
                    body: nodes,
                }];
            }
            let expanded = super::mixin::expand_body(&self.compiled.mixins, &nodes)?;
            groups.push(self.application_group(
                class,
                groups.len(),
                expanded,
                &outer,
                template.as_deref(),
                (native, important, layer),
                primary,
            ));
            // Advance to the next combination of condition branches.
            for index in (0..suffixes.len()).rev() {
                let Some(branches) = &options[index] else {
                    continue;
                };
                choice[index] += 1;
                if choice[index] < branches.len() {
                    continue 'branches;
                }
                choice[index] = 0;
            }
            break;
        }
        Ok(groups)
    }

    #[allow(clippy::too_many_arguments)]
    fn application_group(
        &self,
        class: &str,
        index: usize,
        expanded: Vec<super::ExpandedMixinRule>,
        outer: &[(String, String)],
        template: Option<&str>,
        (native, important, layer): (bool, bool, Option<UtilityLayerName>),
        primary: &EngineCompositionRuleIr,
    ) -> ApplicationGroup {
        let key = if index == 0 {
            class.to_owned()
        } else {
            concat_text!(class, "\0", decimal(index))
        };
        let sort_tier = if !outer.is_empty() {
            3
        } else if template.is_some() {
            1
        } else {
            0
        };
        // Atomic only when the expansion adds no selector, condition or declaration.
        let shape = match expanded.as_slice() {
            [rule]
                if rule.selector == template.unwrap_or("&")
                    && rule.conditions.len() == outer.len() =>
            {
                match rule.declarations.as_slice() {
                    [_] if native => super::ordering::RuleShape::native(),
                    [declaration] => super::ordering::RuleShape::atomic(
                        &declaration.property,
                        &declaration.value,
                    ),
                    _ => super::ordering::RuleShape::recipe(),
                }
            }
            _ => super::ordering::RuleShape::recipe(),
        };
        let mut rules: Vec<EngineCompositionRuleIr> = expanded
            .into_iter()
            .enumerate()
            .map(|(rule_index, rule)| EngineCompositionRuleIr {
                class_name: class.into(),
                utility_name: primary.utility_name.clone(),
                key: concat_text!(key, "\0apply:", decimal(rule_index)),
                layer: layer.unwrap_or(primary.layer),
                explicit_layer: layer,
                utility_type: primary.utility_type,
                sort_tier,
                priority: RulePriorityIr::default(),
                selector: rule.selector,
                conditions: rule.conditions,
                declarations: rule
                    .declarations
                    .into_iter()
                    .map(|mut declaration| {
                        declaration.value =
                            super::inline_theme::substitute(&declaration.value, &self.compiled);
                        CssDeclaration {
                            property: declaration.property.clone(),
                            value: if important {
                                super::render::format_declaration(
                                    &declaration.property,
                                    &declaration.value,
                                    true,
                                )
                                .split_once(':')
                                .expect("declaration")
                                .1
                                .to_owned()
                                .into()
                            } else {
                                declaration.value.into()
                            },
                            source: declaration.source,
                        }
                    })
                    .collect(),
            })
            .collect();
        let (features, conditions) = super::condition::condition_priority(outer);
        let priority = RulePriorityIr {
            features,
            conditions,
            selector: super::selector_priority(template),
            value_priority: primary.priority.value_priority,
            sort_key: rules
                .iter()
                .flat_map(|rule| &rule.declarations)
                .map(|declaration| {
                    concat_text!(
                        declaration.property,
                        ":",
                        declaration.value.as_str().unwrap_or_default()
                    )
                })
                .collect::<Vec<_>>()
                .join(";"),
            category: shape.category,
            family: shape.family,
            coverage: shape.coverage,
            property: shape.property,
        };
        for rule in &mut rules {
            rule.priority = priority.clone();
        }
        ApplicationGroup {
            key,
            sort_tier,
            priority,
            rules,
        }
    }

    /// One stored rule per outer branch. Each keeps its expansion atomic: sorting its
    /// fragments would change authored order.
    pub(crate) fn store_application(
        &self,
        class: &str,
        groups: Vec<ApplicationGroup>,
    ) -> Vec<StoredRule> {
        let anchor = concat_text!(".", super::css_escape(class));
        groups
            .into_iter()
            .filter_map(|group| {
                let primary = group.rules.first()?;
                let mut declarations = Vec::new();
                let mut nodes = Vec::new();
                let mut selectors = Vec::new();
                for rule in &group.rules {
                    let selector =
                        mastercss_lexer::replace_nesting_selector(&rule.selector, &anchor)
                            .unwrap_or_else(|| rule.selector.clone());
                    let declaration = rule
                        .declarations
                        .iter()
                        .map(|d| {
                            concat_text!(d.property, ":", d.value.as_str().unwrap_or_default())
                        })
                        .collect::<Vec<_>>()
                        .join(";");
                    nodes.push(GeneratedRuleNodeIr {
                        text: super::wrap_raw_conditions(
                            concat_text!(selector, "{", declaration, "}"),
                            &rule.conditions,
                        ),
                    });
                    declarations.push(declaration);
                    selectors.push(selector);
                }
                let declarations = declarations.join(";");
                let variable_names = super::collect_css_variable_names(&declarations)
                    .into_iter()
                    .filter(|name| self.compiled.compiled_variables.contains_key(name))
                    .collect();
                let animation = self.declaration_animation_references(&declarations);
                Some(StoredRule {
                    ir: GeneratedRuleIr {
                        class_name: class.into(),
                        key: group.key,
                        layer: primary.layer,
                        utility_type: primary.utility_type,
                        sort_tier: group.sort_tier,
                        priority: group.priority,
                        text: nodes.iter().map(|node| node.text.as_str()).collect(),
                        nodes: if nodes.len() > 1 { nodes } else { Vec::new() },
                        selector_text: (selectors.len() == 1).then(|| selectors[0].clone()),
                        variable_names,
                        keyframe_names: animation.names,
                        retain_all_keyframes: animation.retain_all,
                    },
                    matcher_type: None,
                    state_token: String::new(),
                })
            })
            .collect()
    }
}

fn set_layer(current: &mut Option<UtilityLayerName>, next: UtilityLayerName) -> Result<(), String> {
    if current.is_some_and(|current| current != next) {
        return Err("A class cannot select multiple layers".into());
    }
    *current = Some(next);
    Ok(())
}
