//! Ordered class wrappers execute the same contents IR as native @apply.
use super::{
    EngineCompositionRuleIr, EngineSession, GeneratedRuleIr, GeneratedRuleNodeIr, RulePriorityIr,
    StoredRule,
};
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

impl EngineSession {
    pub(crate) fn application_rules(
        &self,
        class: &str,
    ) -> Option<Result<Vec<EngineCompositionRuleIr>, String>> {
        if !class.contains("@apply(") {
            return None;
        }
        let source = class.strip_suffix('!').unwrap_or(class);
        let (head, suffixes) = super::state::split_state_token(source);
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
    ) -> Result<Vec<EngineCompositionRuleIr>, String> {
        if let Some(diagnostic) = super::named::diagnostics(class, &self.compiled).first() {
            return Err(diagnostic.message.clone());
        }
        let important = class.ends_with('!');
        let state = super::named::matching_utilities(head, &self.compiled)
            .first()
            .map(|(_, matched)| matched.state_token.clone())
            .or_else(|| {
                self.native_declaration_fallback(head)
                    .map(|(_, matched)| matched.state_token)
            })
            .unwrap_or_default();
        let base = head.strip_suffix(&state).unwrap_or(head);
        let diagnostics = super::named::diagnostics(base, &self.compiled);
        if let Some(diagnostic) = diagnostics.first() {
            return Err(diagnostic.message.clone());
        }
        let originals = self.generate_composition_rules(base);
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
        for suffix in suffixes.iter().rev() {
            if let Some(call) = invocation(suffix) {
                let (name, arguments) = call?;
                body = vec![MixinNode::Apply {
                    name,
                    arguments: arguments
                        .into_iter()
                        .map(|value| vec![MixinValuePart::Text { value }])
                        .collect(),
                    contents: Some(body),
                    source: None,
                }];
            } else if let Some(next) = super::resolve_layer_condition(suffix, &self.compiled) {
                set_layer(&mut layer, next)?;
            } else {
                let branches =
                    super::resolve_state_branches(&format!("@{suffix}"), false, &self.compiled);
                if branches.is_empty()
                    && !self
                        .compiled
                        .custom_media
                        .contains_key(&format!("--{suffix}"))
                {
                    return Err(format!("Unknown condition @{suffix}"));
                }
                let mut expanded = Vec::new();
                for branch in branches {
                    let mut nodes = body.clone();
                    for (_, condition) in branch.condition_wrappers.into_iter().rev() {
                        nodes = vec![MixinNode::Condition {
                            condition,
                            body: nodes,
                        }];
                    }
                    expanded.extend(nodes);
                }
                body = expanded;
            }
        }
        if let Some(selector) = super::state::selector_token_to_template(&state, &self.compiled) {
            body = vec![MixinNode::Rule { selector, body }];
        }
        let expanded = super::mixin::expand_body(&self.compiled.mixins, &body)?;
        let primary = &originals[0];
        Ok(expanded
            .into_iter()
            .enumerate()
            .map(|(index, rule)| {
                let wrappers = rule
                    .conditions
                    .iter()
                    .filter_map(|condition| super::parse_raw_condition_wrapper(condition))
                    .collect::<Vec<_>>();
                let (features, conditions) = super::condition::condition_priority(&wrappers);
                EngineCompositionRuleIr {
                    class_name: class.into(),
                    utility_name: primary.utility_name.clone(),
                    key: format!("{class}\0apply:{index}"),
                    layer: layer.unwrap_or(primary.layer),
                    explicit_layer: layer,
                    utility_type: primary.utility_type,
                    sort_tier: if !wrappers.is_empty() {
                        3
                    } else if rule.selector != "&" {
                        1
                    } else {
                        0
                    },
                    priority: RulePriorityIr {
                        features,
                        conditions,
                        selector: super::selector_priority(Some(&rule.selector)),
                        sort_key: rule
                            .declarations
                            .iter()
                            .map(|declaration| {
                                format!("{}:{}", declaration.property, declaration.value)
                            })
                            .collect::<Vec<_>>()
                            .join(";"),
                        ..primary.priority.clone()
                    },
                    selector: rule.selector,
                    conditions: rule.conditions,
                    declarations: rule
                        .declarations
                        .into_iter()
                        .map(|declaration| CssDeclaration {
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
                        })
                        .collect(),
                }
            })
            .collect())
    }

    pub(crate) fn store_application(
        &self,
        class: &str,
        rules: Vec<EngineCompositionRuleIr>,
    ) -> Vec<StoredRule> {
        let Some(primary) = rules.first() else {
            return Vec::new();
        };
        // Keep the expansion atomic: sorting its fragments would change authored order.
        let anchor = format!(".{}", super::css_escape(class));
        let mut declarations = Vec::new();
        let mut nodes = Vec::new();
        let mut selectors = Vec::new();
        let mut wrappers = Vec::new();
        for rule in &rules {
            let selector = mastercss_lexer::replace_nesting_selector(&rule.selector, &anchor)
                .unwrap_or_else(|| rule.selector.clone());
            let declaration = rule
                .declarations
                .iter()
                .map(|d| format!("{}:{}", d.property, d.value.as_str().unwrap_or_default()))
                .collect::<Vec<_>>()
                .join(";");
            nodes.push(GeneratedRuleNodeIr {
                text: super::wrap_raw_conditions(
                    format!("{selector}{{{declaration}}}"),
                    &rule.conditions,
                ),
            });
            declarations.push(declaration);
            selectors.push(selector);
            wrappers.extend(
                rule.conditions
                    .iter()
                    .filter_map(|condition| super::parse_raw_condition_wrapper(condition)),
            );
        }
        let declarations = declarations.join(";");
        let variable_names = super::collect_css_variable_names(&declarations)
            .into_iter()
            .filter(|name| self.compiled.compiled_variables.contains_key(name))
            .collect();
        let animation = self.declaration_animation_references(&declarations);
        let (features, conditions) = super::condition::condition_priority(&wrappers);
        vec![StoredRule {
            ir: GeneratedRuleIr {
                class_name: class.into(),
                key: class.into(),
                layer: primary.layer,
                utility_type: primary.utility_type,
                sort_tier: rules
                    .iter()
                    .map(|rule| rule.sort_tier)
                    .max()
                    .unwrap_or_default(),
                priority: RulePriorityIr {
                    features,
                    conditions,
                    sort_key: declarations.clone(),
                    selector: rules
                        .iter()
                        .map(|rule| rule.priority.selector)
                        .max()
                        .unwrap_or_default(),
                    ..primary.priority.clone()
                },
                text: nodes.iter().map(|node| node.text.as_str()).collect(),
                nodes: if nodes.len() > 1 { nodes } else { Vec::new() },
                selector_text: (selectors.len() == 1).then(|| selectors[0].clone()),
                variable_names,
                keyframe_names: animation.names,
                retain_all_keyframes: animation.retain_all,
            },
            manifest_order: 0,
            declarations,
            native_fallback: false,
            matcher_type: None,
            state_token: String::new(),
        }]
    }
}

fn set_layer(current: &mut Option<UtilityLayerName>, next: UtilityLayerName) -> Result<(), String> {
    if current.is_some_and(|current| current != next) {
        return Err("A class cannot select multiple layers".into());
    }
    *current = Some(next);
    Ok(())
}
