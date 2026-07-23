use std::cmp::Ordering;
use std::collections::{HashMap, HashSet};

use lightningcss::declaration::DeclarationBlock;
use lightningcss::properties::Property;
use lightningcss::stylesheet::ParserOptions;
use lightningcss::traits::Parse;
use lightningcss::values::length::{Length, LengthPercentageOrAuto};
use mastercss_engine::{EngineCompositionRuleIr, EngineSession, natural_compare};
use mastercss_schema::{
    CssDirectiveConditionPathEntry, CssDirectiveManifestInput, CssDirectiveSourceReference,
    CssDirectiveStyleDefinition, ErrorCode, RulePriorityIr, UtilityLayerName,
};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value, json};

use crate::{CompileManifestOptions, CompilerError, compile_manifest_input};

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LowerCssDirectivesOptions {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_manifest: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution_manifest: Option<Value>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LowerCssDirectivesRequest {
    #[serde(default)]
    pub manifest_input: CssDirectiveManifestInput,
    #[serde(default)]
    pub style_definitions: Vec<CssDirectiveStyleDefinition>,
    #[serde(default)]
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LowerCssDirectivesResult {
    pub input: CssDirectiveManifestInput,
    pub manifest: Value,
    pub resolution_manifest: Value,
    pub warnings: Vec<String>,
    #[serde(rename = "generatedCSS")]
    pub generated_css: String,
    pub diagnostic_counts: HashMap<String, u64>,
}

#[derive(Debug, Clone)]
struct ResolvedStyleBranch {
    selector: String,
    conditions: Vec<String>,
    layer: Option<UtilityLayerName>,
}

#[derive(Debug, Clone)]
struct MergedStyleDefinition {
    selector: String,
    declarations: Map<String, Value>,
    conditions: Vec<String>,
}

#[derive(Debug, Clone)]
enum StyleMergeEvent {
    Compose {
        order: u32,
        rule: EngineCompositionRuleIr,
    },
    Native {
        order: u32,
        declarations: Map<String, Value>,
    },
}

impl StyleMergeEvent {
    fn order(&self) -> u32 {
        match self {
            Self::Compose { order, .. } | Self::Native { order, .. } => *order,
        }
    }
}

#[derive(Debug, Clone)]
struct StyleMergeBucket {
    selector: String,
    conditions: Vec<String>,
    layer: Option<UtilityLayerName>,
    order: u32,
    events: Vec<StyleMergeEvent>,
}

type StyleConditionFeature = (String, f64, f64);

fn directive_error(message: impl Into<String>) -> CompilerError {
    CompilerError::Directive {
        message: message.into(),
        filename: "manifest.css".into(),
        range: None,
    }
}

fn directive_diagnostic(
    code: ErrorCode,
    message: impl Into<String>,
    source: Option<&CssDirectiveSourceReference>,
) -> CompilerError {
    CompilerError::DirectiveDiagnostic {
        code,
        message: message.into(),
        filename: source
            .and_then(|source| source.file.clone())
            .unwrap_or_else(|| "manifest.css".into()),
        range: source.map(|source| source.range.clone()),
    }
}

fn engine_for_manifest(manifest: &Value) -> Result<EngineSession, CompilerError> {
    let json = serde_json::to_string(manifest)
        .map_err(|error| directive_error(format!("Cannot serialize compiler manifest: {error}")))?;
    EngineSession::create(&json).map_err(|error| directive_error(error.to_string()))
}

fn compile_with_base(
    input: &CssDirectiveManifestInput,
    base_manifest: Option<Value>,
) -> Result<Value, CompilerError> {
    compile_manifest_input(input, &CompileManifestOptions { base_manifest })
        .map(|result| result.manifest)
}

fn condition_path(
    value: &Map<String, Value>,
) -> Result<Vec<CssDirectiveConditionPathEntry>, CompilerError> {
    if let Some(path) = value.get("conditionPath") {
        return serde_json::from_value(path.clone()).map_err(|error| {
            directive_error(format!("Invalid directive condition path: {error}"))
        });
    }
    Ok(value
        .get("conditions")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(Value::as_str)
        .map(|value| CssDirectiveConditionPathEntry::Condition {
            value: value.into(),
        })
        .collect())
}

fn combine_selector_wrapper(selector: &str, wrapper: &str) -> String {
    wrapper.replace('&', selector)
}

fn split_selector_list(selector: &str) -> Vec<String> {
    let mut selectors = Vec::new();
    let mut start = 0;
    let mut quote = None;
    let mut escaped = false;
    let mut depth = 0_u32;
    for (index, character) in selector.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if character == '\\' {
            escaped = true;
            continue;
        }
        if let Some(current_quote) = quote {
            if character == current_quote {
                quote = None;
            }
            continue;
        }
        if matches!(character, '\'' | '"') {
            quote = Some(character);
        } else if matches!(character, '(' | '[') {
            depth += 1;
        } else if matches!(character, ')' | ']') {
            depth = depth.saturating_sub(1);
        } else if character == ',' && depth == 0 {
            let value = selector[start..index].trim();
            if !value.is_empty() {
                selectors.push(value.into());
            }
            start = index + 1;
        }
    }
    let value = selector[start..].trim();
    if !value.is_empty() {
        selectors.push(value.into());
    }
    selectors
}

fn combine_style_selectors(parent: &str, child: &str) -> String {
    let parents = split_selector_list(parent);
    let children = split_selector_list(child);
    let mut selectors = Vec::new();
    for child in children {
        for parent in &parents {
            selectors.push(if child.contains('&') {
                child.replace('&', parent)
            } else {
                format!("{parent} {child}")
            });
        }
    }
    selectors.join(",")
}

fn composition_rules(
    engine: &mut EngineSession,
    class_name: &str,
) -> Result<Vec<EngineCompositionRuleIr>, CompilerError> {
    let candidates = engine
        .native_declaration_candidates([class_name])
        .map_err(|error| directive_error(error.to_string()))?;
    if !candidates.is_empty() {
        let supported = candidates
            .iter()
            .map(|candidate| {
                if candidate.property.starts_with("--") {
                    return true;
                }
                let accepts_unparsed = || {
                    let value = candidate.value.trim();
                    matches!(
                        value,
                        "initial" | "inherit" | "unset" | "revert" | "revert-layer"
                    ) || ["var(", "env(", "attr("]
                        .iter()
                        .any(|function| value.contains(function))
                        || ((value.starts_with('\'') && value.ends_with('\''))
                            || (value.starts_with('"') && value.ends_with('"')))
                        || (candidate.property == "content" && matches!(value, "normal" | "none"))
                        || (candidate.property == "text-underline-offset"
                            && LengthPercentageOrAuto::parse_string(value).is_ok())
                        || (candidate.property == "outline-offset"
                            && Length::parse_string(value).is_ok())
                        || (candidate.property == "contain"
                            && value.split_whitespace().all(|keyword| {
                                matches!(
                                    keyword,
                                    "none"
                                        | "strict"
                                        | "content"
                                        | "size"
                                        | "inline-size"
                                        | "layout"
                                        | "style"
                                        | "paint"
                                )
                            }))
                };
                let declaration_source = format!("{}:{}", candidate.property, candidate.value);
                let Ok(block) =
                    DeclarationBlock::parse_string(&declaration_source, ParserOptions::default())
                else {
                    return accepts_unparsed();
                };
                block.declarations.len() == 1
                    && block
                        .declarations
                        .iter()
                        .all(|declaration| match declaration {
                            Property::Unparsed(_) => accepts_unparsed(),
                            Property::Custom(_) => accepts_unparsed(),
                            _ => true,
                        })
            })
            .collect::<Vec<_>>();
        engine
            .ensure_class_rules_with_native_support([class_name], &supported)
            .map_err(|error| directive_error(error.to_string()))?;
    }
    engine
        .composition_rules(class_name)
        .map_err(|error| directive_error(error.to_string()))
}

fn resolve_configured_branches(
    path: &[CssDirectiveConditionPathEntry],
    engine: &mut EngineSession,
    selector: &str,
    layer: Option<UtilityLayerName>,
) -> Result<Vec<ResolvedStyleBranch>, CompilerError> {
    let mut branches = vec![ResolvedStyleBranch {
        selector: selector.into(),
        conditions: Vec::new(),
        layer,
    }];
    for entry in path {
        match entry {
            CssDirectiveConditionPathEntry::Condition { value } => {
                for branch in &mut branches {
                    branch.conditions.push(value.clone());
                }
            }
            CssDirectiveConditionPathEntry::Variant { token } => {
                if !token.starts_with(':') && !token.starts_with('@') {
                    return Err(directive_error(format!(
                        "@variant requires a full variant token: {token}"
                    )));
                }
                let resolved = composition_rules(engine, &format!("display:block{token}"))?;
                if resolved.is_empty() {
                    return Err(directive_error(format!("Unknown @variant token: {token}")));
                }
                branches = branches
                    .into_iter()
                    .flat_map(|branch| {
                        resolved.iter().filter_map(move |resolved| {
                            let resolved_layer = resolved.explicit_layer;
                            if branch.layer.is_some()
                                && resolved_layer.is_some()
                                && branch.layer != resolved_layer
                            {
                                return None;
                            }
                            let mut conditions = branch.conditions.clone();
                            conditions.extend(resolved.conditions.clone());
                            Some(ResolvedStyleBranch {
                                selector: combine_selector_wrapper(
                                    &branch.selector,
                                    &resolved.selector,
                                ),
                                conditions,
                                layer: resolved_layer.or(branch.layer),
                            })
                        })
                    })
                    .collect();
                if branches.is_empty() {
                    return Err(directive_error(format!(
                        "@variant {token} cannot assign multiple layers"
                    )));
                }
            }
        }
    }
    for branch in &mut branches {
        branch.selector = engine
            .resolve_style_selector(&branch.selector)
            .map_err(|error| directive_error(error.to_string()))?;
    }
    Ok(branches)
}

fn value_object(value: &Value) -> Result<&Map<String, Value>, CompilerError> {
    value
        .as_object()
        .ok_or_else(|| directive_error("CSS directive utility definition must be an object"))
}

fn finalize_utility_definitions(
    input: &mut CssDirectiveManifestInput,
    engine: &mut EngineSession,
) -> Result<(), CompilerError> {
    let Some(utilities) = input.utilities.as_mut() else {
        return Ok(());
    };
    for utility in utilities {
        let definition = utility
            .as_object_mut()
            .ok_or_else(|| directive_error("CSS directive utility definition must be an object"))?;
        let definition_path = condition_path(definition)?;
        let definition_has_variants = definition_path
            .iter()
            .any(|entry| matches!(entry, CssDirectiveConditionPathEntry::Variant { .. }));
        if definition_has_variants {
            if let Some(declarations) = definition.shift_remove("declarations") {
                let rules = definition
                    .entry("rules")
                    .or_insert_with(|| Value::Array(Vec::new()))
                    .as_array_mut()
                    .ok_or_else(|| directive_error("Managed utility rules must be an array"))?;
                rules.push(json!({
                    "declarations": declarations,
                    "conditionPath": definition_path
                }));
            }
            definition.shift_remove("conditions");
            definition.shift_remove("conditionPath");
        }
        let Some(rules) = definition.shift_remove("rules") else {
            continue;
        };
        let mut resolved_rules = Vec::new();
        for rule in rules
            .as_array()
            .ok_or_else(|| directive_error("Managed utility rules must be an array"))?
        {
            let rule = value_object(rule)?;
            let declarations = rule
                .get("declarations")
                .and_then(Value::as_object)
                .cloned()
                .ok_or_else(|| directive_error("Managed utility rule requires declarations"))?;
            let selector = rule.get("selector").and_then(Value::as_str).unwrap_or("&");
            for branch in
                resolve_configured_branches(&condition_path(rule)?, engine, selector, None)?
            {
                let mut output = Map::new();
                output.insert("declarations".into(), Value::Object(declarations.clone()));
                if branch.selector != "&" {
                    output.insert("selector".into(), Value::String(branch.selector));
                }
                if !branch.conditions.is_empty() {
                    output.insert(
                        "conditions".into(),
                        Value::Array(branch.conditions.into_iter().map(Value::String).collect()),
                    );
                }
                resolved_rules.push(Value::Object(output));
            }
        }
        if !resolved_rules.is_empty() {
            definition.insert("rules".into(), Value::Array(resolved_rules));
        }
    }
    Ok(())
}

fn bucket_key(selector: &str, conditions: &[String], layer: Option<UtilityLayerName>) -> String {
    serde_json::to_string(&(layer, selector, conditions)).expect("style bucket key serializes")
}

fn push_style_event(
    buckets: &mut Vec<(String, StyleMergeBucket)>,
    branch: ResolvedStyleBranch,
    event: StyleMergeEvent,
) {
    let key = bucket_key(&branch.selector, &branch.conditions, branch.layer);
    if let Some((_, bucket)) = buckets.iter_mut().find(|(current, _)| *current == key) {
        bucket.order = bucket.order.min(event.order());
        bucket.events.push(event);
        return;
    }
    buckets.push((
        key,
        StyleMergeBucket {
            selector: branch.selector,
            conditions: branch.conditions,
            layer: branch.layer,
            order: event.order(),
            events: vec![event],
        },
    ));
}

fn is_important(value: &Value) -> bool {
    value
        .as_str()
        .is_some_and(|value| value.trim().ends_with("!important"))
}

fn apply_declarations(target: &mut Map<String, Value>, incoming: &Map<String, Value>) {
    for (property, value) in incoming {
        if target.get(property).is_some_and(is_important) && !is_important(value) {
            continue;
        }
        target.shift_remove(property);
        target.insert(property.clone(), value.clone());
    }
}

fn compare_rule_priority(
    left: &EngineCompositionRuleIr,
    right: &EngineCompositionRuleIr,
) -> Ordering {
    left.sort_tier
        .cmp(&right.sort_tier)
        .then_with(|| compare_features(&left.priority, &right.priority))
        .then_with(|| left.priority.selector.cmp(&right.priority.selector))
        .then_with(|| left.utility_type.cmp(&right.utility_type))
        .then_with(|| natural_compare(&left.key, &right.key))
}

fn compare_features(left: &RulePriorityIr, right: &RulePriorityIr) -> Ordering {
    for index in 0..left.features.len().max(right.features.len()) {
        let Some(left) = left.features.get(index) else {
            return Ordering::Less;
        };
        let Some(right) = right.features.get(index) else {
            return Ordering::Greater;
        };
        let order = natural_compare(&left.0, &right.0)
            .then_with(|| {
                (right.2 - right.1)
                    .partial_cmp(&(left.2 - left.1))
                    .unwrap_or(Ordering::Equal)
            })
            .then_with(|| right.1.partial_cmp(&left.1).unwrap_or(Ordering::Equal))
            .then_with(|| right.2.partial_cmp(&left.2).unwrap_or(Ordering::Equal));
        if order != Ordering::Equal {
            return order;
        }
    }
    Ordering::Equal
}

fn style_condition_features(conditions: &[String], root_size: f64) -> Vec<StyleConditionFeature> {
    let mut features: HashMap<String, (Option<f64>, Option<f64>)> = HashMap::new();
    for condition in conditions {
        for (name, operator, mut value, unit) in parse_style_condition_features(condition) {
            if unit == "px" {
                value /= root_size;
            }
            let entry = features.entry(name.to_owned()).or_default();
            match operator {
                ">" => entry.0 = Some(value + 0.02),
                ">=" => entry.0 = Some(value),
                "<" => entry.1 = Some(value - 0.02),
                "<=" => entry.1 = Some(value),
                _ => {}
            }
        }
    }
    let mut features = features
        .into_iter()
        .map(|(name, (min, max))| {
            (
                name,
                min.unwrap_or(0.0),
                max.unwrap_or(9_007_199_254_740_991.0),
            )
        })
        .collect::<Vec<_>>();
    features.sort_by(|left, right| natural_compare(&left.0, &right.0));
    features
}

fn parse_style_condition_features(condition: &str) -> Vec<(&str, &str, f64, &str)> {
    let bytes = condition.as_bytes();
    let mut features = Vec::new();
    let mut search_start = 0;
    while let Some(relative_start) = condition[search_start..].find('(') {
        let start = search_start + relative_start;
        let mut index = start + 1;
        skip_ascii_whitespace(bytes, &mut index);
        let Some(name) = ["width", "height", "resolution"]
            .into_iter()
            .find(|name| condition[index..].starts_with(name))
        else {
            search_start = start + 1;
            continue;
        };
        index += name.len();
        skip_ascii_whitespace(bytes, &mut index);
        let Some(operator) = [">=", "<=", ">", "<"]
            .into_iter()
            .find(|operator| condition[index..].starts_with(operator))
        else {
            search_start = start + 1;
            continue;
        };
        index += operator.len();
        skip_ascii_whitespace(bytes, &mut index);
        let number_start = index;
        if bytes.get(index) == Some(&b'-') {
            index += 1;
        }
        let integer_start = index;
        while bytes.get(index).is_some_and(u8::is_ascii_digit) {
            index += 1;
        }
        let integer_digits = index - integer_start;
        let mut fraction_digits = 0;
        if bytes.get(index) == Some(&b'.') {
            index += 1;
            let fraction_start = index;
            while bytes.get(index).is_some_and(u8::is_ascii_digit) {
                index += 1;
            }
            fraction_digits = index - fraction_start;
        }
        if integer_digits == 0 && fraction_digits == 0 {
            search_start = start + 1;
            continue;
        }
        let Ok(value) = condition[number_start..index].parse::<f64>() else {
            search_start = start + 1;
            continue;
        };
        let unit_start = index;
        while bytes
            .get(index)
            .is_some_and(|byte| byte.is_ascii_lowercase() || *byte == b'%')
        {
            index += 1;
        }
        let unit = &condition[unit_start..index];
        skip_ascii_whitespace(bytes, &mut index);
        if bytes.get(index) != Some(&b')') {
            search_start = start + 1;
            continue;
        }
        features.push((name, operator, value, unit));
        search_start = index + 1;
    }
    features
}

fn skip_ascii_whitespace(bytes: &[u8], index: &mut usize) {
    while bytes.get(*index).is_some_and(u8::is_ascii_whitespace) {
        *index += 1;
    }
}

fn compare_style_condition_features(
    left: &[StyleConditionFeature],
    right: &[StyleConditionFeature],
) -> Ordering {
    for index in 0..left.len().max(right.len()) {
        let Some(left) = left.get(index) else {
            return Ordering::Less;
        };
        let Some(right) = right.get(index) else {
            return Ordering::Greater;
        };
        let order = natural_compare(&left.0, &right.0)
            .then_with(|| {
                (right.2 - right.1)
                    .partial_cmp(&(left.2 - left.1))
                    .unwrap_or(Ordering::Equal)
            })
            .then_with(|| right.1.partial_cmp(&left.1).unwrap_or(Ordering::Equal))
            .then_with(|| right.2.partial_cmp(&left.2).unwrap_or(Ordering::Equal));
        if order != Ordering::Equal {
            return order;
        }
    }
    Ordering::Equal
}

fn compare_style_merge_buckets(
    left: &StyleMergeBucket,
    right: &StyleMergeBucket,
    root_size: f64,
) -> Ordering {
    let left_layer = left.layer.unwrap_or(UtilityLayerName::Components);
    let right_layer = right.layer.unwrap_or(UtilityLayerName::Components);
    if left_layer == right_layer && left.selector == right.selector {
        let left_conditioned = !left.conditions.is_empty();
        let right_conditioned = !right.conditions.is_empty();
        if left_conditioned != right_conditioned {
            return left_conditioned.cmp(&right_conditioned);
        }
        if left_conditioned {
            let left_features = style_condition_features(&left.conditions, root_size);
            let right_features = style_condition_features(&right.conditions, root_size);
            if !left_features.is_empty() && !right_features.is_empty() {
                let order = compare_style_condition_features(&left_features, &right_features);
                if order != Ordering::Equal {
                    return order;
                }
            }
        }
    }
    left.order.cmp(&right.order)
}

fn merged_bucket(bucket: StyleMergeBucket) -> Option<MergedStyleDefinition> {
    let mut declarations = Map::new();
    let mut compose_batch: Vec<(u32, EngineCompositionRuleIr)> = Vec::new();
    let flush = |batch: &mut Vec<(u32, EngineCompositionRuleIr)>,
                 declarations: &mut Map<String, Value>| {
        batch.sort_by(|(left_order, left), (right_order, right)| {
            compare_rule_priority(left, right).then_with(|| left_order.cmp(right_order))
        });
        for (_, rule) in batch.drain(..) {
            apply_declarations(declarations, &rule.declarations);
        }
    };
    let mut events = bucket.events;
    events.sort_by_key(StyleMergeEvent::order);
    for event in events {
        match event {
            StyleMergeEvent::Compose { order, rule } => compose_batch.push((order, rule)),
            StyleMergeEvent::Native {
                declarations: incoming,
                ..
            } => {
                flush(&mut compose_batch, &mut declarations);
                apply_declarations(&mut declarations, &incoming);
            }
        }
    }
    flush(&mut compose_batch, &mut declarations);
    (!declarations.is_empty()).then_some(MergedStyleDefinition {
        selector: bucket.selector,
        declarations,
        conditions: bucket.conditions,
    })
}

fn create_merged_style_definitions(
    definitions: &[CssDirectiveStyleDefinition],
    engine: &mut EngineSession,
    target_layer: Option<UtilityLayerName>,
    root_size: f64,
) -> Result<Vec<MergedStyleDefinition>, CompilerError> {
    let mut buckets = Vec::new();
    for definition in definitions {
        match definition {
            CssDirectiveStyleDefinition::Compose {
                order,
                class_name,
                selector,
                conditions,
                condition_path,
                layer,
                source,
                ..
            } => {
                let rules = composition_rules(engine, class_name)?;
                if rules.is_empty() {
                    return Err(directive_diagnostic(
                        ErrorCode::InvalidComposeClass,
                        format!("Invalid @compose class: {class_name}"),
                        source.as_ref(),
                    ));
                }
                for rule in rules {
                    let mut path = condition_path.clone().unwrap_or_else(|| {
                        conditions
                            .clone()
                            .unwrap_or_default()
                            .into_iter()
                            .map(|value| CssDirectiveConditionPathEntry::Condition { value })
                            .collect()
                    });
                    path.extend(
                        rule.conditions
                            .iter()
                            .cloned()
                            .map(|value| CssDirectiveConditionPathEntry::Condition { value }),
                    );
                    let combined_selector = combine_style_selectors(selector, &rule.selector);
                    for branch in resolve_configured_branches(
                        &path,
                        engine,
                        &combined_selector,
                        target_layer.or(*layer).or(rule.explicit_layer),
                    )? {
                        push_style_event(
                            &mut buckets,
                            branch,
                            StyleMergeEvent::Compose {
                                order: *order,
                                rule: rule.clone(),
                            },
                        );
                    }
                }
            }
            CssDirectiveStyleDefinition::Native {
                order,
                selector,
                declarations,
                conditions,
                condition_path,
                layer,
                ..
            } => {
                let path = condition_path.clone().unwrap_or_else(|| {
                    conditions
                        .clone()
                        .unwrap_or_default()
                        .into_iter()
                        .map(|value| CssDirectiveConditionPathEntry::Condition { value })
                        .collect()
                });
                for branch in
                    resolve_configured_branches(&path, engine, selector, target_layer.or(*layer))?
                {
                    push_style_event(
                        &mut buckets,
                        branch,
                        StyleMergeEvent::Native {
                            order: *order,
                            declarations: declarations.clone(),
                        },
                    );
                }
            }
        }
    }
    buckets.sort_by(|(_, left), (_, right)| compare_style_merge_buckets(left, right, root_size));
    Ok(buckets
        .into_iter()
        .filter_map(|(_, bucket)| merged_bucket(bucket))
        .collect())
}

fn layer_name(layer: UtilityLayerName) -> &'static str {
    match layer {
        UtilityLayerName::Base => "base",
        UtilityLayerName::Defaults => "defaults",
        UtilityLayerName::Components => "components",
        UtilityLayerName::Utilities => "utilities",
    }
}

fn push_static_utility_rule(
    input: &mut CssDirectiveManifestInput,
    name: &str,
    layer: UtilityLayerName,
    style: MergedStyleDefinition,
) -> Result<(), CompilerError> {
    let utilities = input.utilities.get_or_insert_default();
    let layer_value = layer_name(layer);
    let index = utilities.iter().position(|utility| {
        utility.get("name").and_then(Value::as_str) == Some(name)
            && utility
                .get("layer")
                .and_then(Value::as_str)
                .unwrap_or("utilities")
                == layer_value
    });
    if index.is_none() {
        utilities.push(json!({ "name": name, "type": "static", "layer": layer_value }));
    }
    let utility_index = index.unwrap_or_else(|| utilities.len() - 1);
    let utility = utilities[utility_index]
        .as_object_mut()
        .ok_or_else(|| directive_error("Managed utility definition must be an object"))?;
    utility.insert("type".into(), Value::String("static".into()));
    utility.insert("layer".into(), Value::String(layer_value.into()));
    let mut rule = Map::new();
    rule.insert("declarations".into(), Value::Object(style.declarations));
    if style.selector != "&" {
        rule.insert("selector".into(), Value::String(style.selector));
    }
    if !style.conditions.is_empty() {
        rule.insert(
            "conditions".into(),
            Value::Array(style.conditions.into_iter().map(Value::String).collect()),
        );
    }
    if !utility.contains_key("declarations")
        && !utility.contains_key("rules")
        && !rule.contains_key("selector")
        && !rule.contains_key("conditions")
    {
        utility.insert(
            "declarations".into(),
            rule.shift_remove("declarations")
                .expect("declarations exist"),
        );
        return Ok(());
    }
    if let Some(previous) = utility.shift_remove("declarations") {
        utility
            .entry("rules")
            .or_insert_with(|| Value::Array(Vec::new()))
            .as_array_mut()
            .ok_or_else(|| directive_error("Managed utility rules must be an array"))?
            .push(json!({ "declarations": previous }));
    }
    utility
        .entry("rules")
        .or_insert_with(|| Value::Array(Vec::new()))
        .as_array_mut()
        .ok_or_else(|| directive_error("Managed utility rules must be an array"))?
        .push(Value::Object(rule));
    Ok(())
}

fn managed_style_groups(
    definitions: &[CssDirectiveStyleDefinition],
) -> Vec<((String, UtilityLayerName), Vec<CssDirectiveStyleDefinition>)> {
    let mut groups: Vec<((String, UtilityLayerName), Vec<CssDirectiveStyleDefinition>)> =
        Vec::new();
    for definition in definitions {
        let (name, layer) = match definition {
            CssDirectiveStyleDefinition::Native { name, layer, .. }
            | CssDirectiveStyleDefinition::Compose { name, layer, .. } => {
                let Some(name) = name else { continue };
                (name.clone(), layer.unwrap_or(UtilityLayerName::Components))
            }
        };
        if let Some((_, definitions)) =
            groups
                .iter_mut()
                .find(|((current_name, current_layer), _)| {
                    *current_name == name && *current_layer == layer
                })
        {
            definitions.push(definition.clone());
        } else {
            groups.push(((name, layer), vec![definition.clone()]));
        }
    }
    groups
}

fn managed_dependencies(
    groups: &[((String, UtilityLayerName), Vec<CssDirectiveStyleDefinition>)],
) -> Vec<Vec<usize>> {
    let mut keys_by_name: HashMap<&str, Vec<usize>> = HashMap::new();
    for (index, ((name, _), _)) in groups.iter().enumerate() {
        keys_by_name.entry(name).or_default().push(index);
    }
    let mut names = keys_by_name.keys().copied().collect::<Vec<_>>();
    names.sort_by_key(|name| std::cmp::Reverse(name.len()));
    let mut dependencies = vec![Vec::new(); groups.len()];
    for (index, (_, definitions)) in groups.iter().enumerate() {
        for definition in definitions {
            let CssDirectiveStyleDefinition::Compose { class_name, .. } = definition else {
                continue;
            };
            let dependency_name = names.iter().find(|name| {
                class_name.as_str() == **name
                    || class_name
                        .strip_prefix(**name)
                        .and_then(|rest| rest.chars().next())
                        .is_some_and(|next| matches!(next, ':' | '@' | '!'))
            });
            if let Some(dependency_name) = dependency_name {
                for dependency in &keys_by_name[*dependency_name] {
                    if !dependencies[index].contains(dependency) {
                        dependencies[index].push(*dependency);
                    }
                }
            }
        }
    }
    dependencies
}

fn managed_dependency_order(
    groups: &[((String, UtilityLayerName), Vec<CssDirectiveStyleDefinition>)],
    dependencies: &[Vec<usize>],
) -> Result<Vec<usize>, CompilerError> {
    fn visit(
        index: usize,
        groups: &[((String, UtilityLayerName), Vec<CssDirectiveStyleDefinition>)],
        dependencies: &[Vec<usize>],
        seen: &mut HashSet<usize>,
        visiting: &mut Vec<usize>,
        output: &mut Vec<usize>,
    ) -> Result<(), CompilerError> {
        if seen.contains(&index) {
            return Ok(());
        }
        if let Some(start) = visiting.iter().position(|current| *current == index) {
            let mut cycle = visiting[start..]
                .iter()
                .map(|current| groups[*current].0.0.as_str())
                .collect::<Vec<_>>();
            cycle.push(groups[index].0.0.as_str());
            return Err(directive_error(format!(
                "Circular @compose dependency detected: {}",
                cycle.join(" -> ")
            )));
        }
        visiting.push(index);
        for dependency in &dependencies[index] {
            visit(*dependency, groups, dependencies, seen, visiting, output)?;
        }
        visiting.pop();
        seen.insert(index);
        output.push(index);
        Ok(())
    }
    let mut seen = HashSet::new();
    let mut visiting = Vec::new();
    let mut output = Vec::new();
    for index in 0..groups.len() {
        visit(
            index,
            groups,
            dependencies,
            &mut seen,
            &mut visiting,
            &mut output,
        )?;
    }
    Ok(output)
}

fn managed_refresh_count(
    order: &[usize],
    dependencies: &[Vec<usize>],
    has_native_definitions: bool,
) -> u64 {
    let mut count = 0;
    let mut unrefreshed = HashSet::new();
    for index in order {
        if dependencies[*index]
            .iter()
            .any(|dependency| unrefreshed.contains(dependency))
        {
            count += 1;
            unrefreshed.clear();
        }
        unrefreshed.insert(*index);
    }
    if has_native_definitions && !unrefreshed.is_empty() {
        count += 1;
    }
    count
}

fn render_style_definitions(definitions: Vec<MergedStyleDefinition>) -> String {
    definitions
        .into_iter()
        .map(|definition| {
            let declarations = definition
                .declarations
                .into_iter()
                .map(|(property, value)| {
                    format!("{property}:{}", value.as_str().unwrap_or_default())
                })
                .collect::<Vec<_>>()
                .join(";");
            let mut text = format!("{}{{{declarations}}}", definition.selector);
            for condition in definition.conditions.iter().rev() {
                let condition = condition.trim();
                if !condition.is_empty() {
                    text = format!("{condition}{{{text}}}");
                }
            }
            text
        })
        .collect()
}

fn media_mode_warnings(input: &CssDirectiveManifestInput) -> Vec<String> {
    if input.mode_trigger.as_deref() != Some("media") {
        return Vec::new();
    }
    let mut modes = input
        .modes
        .clone()
        .unwrap_or_default()
        .into_iter()
        .filter(|mode| !matches!(mode.as_str(), "light" | "dark"))
        .collect::<Vec<_>>();
    if let Some(default_mode) = input.default_mode.as_ref()
        && default_mode != "none"
        && !matches!(default_mode.as_str(), "light" | "dark")
        && !modes.contains(default_mode)
    {
        modes.push(default_mode.clone());
    }
    if modes.is_empty() {
        return Vec::new();
    }
    let list = modes
        .iter()
        .map(|mode| format!("\"{mode}\""))
        .collect::<Vec<_>>()
        .join(", ");
    let subject = if modes.len() == 1 { "mode" } else { "modes" };
    vec![format!(
        "Custom {subject} {list} will not work with mode-trigger: media. Browsers only support light and dark prefers-color-scheme values; use mode-trigger: class or host for custom modes."
    )]
}

pub fn lower_css_directives(
    input: &CssDirectiveManifestInput,
    style_definitions: &[CssDirectiveStyleDefinition],
    initial_warnings: &[String],
    options: &LowerCssDirectivesOptions,
) -> Result<LowerCssDirectivesResult, CompilerError> {
    let mut input = input.clone();
    let resolution_base = options
        .resolution_manifest
        .clone()
        .or_else(|| options.base_manifest.clone());
    if input.utilities.as_ref().is_none_or(Vec::is_empty) && style_definitions.is_empty() {
        let resolution_manifest = compile_with_base(&input, resolution_base)?;
        let manifest = compile_with_base(&input, options.base_manifest.clone())?;
        let mut warnings = initial_warnings.to_vec();
        for warning in media_mode_warnings(&input) {
            if !warnings.contains(&warning) {
                warnings.push(warning);
            }
        }
        return Ok(LowerCssDirectivesResult {
            input,
            manifest,
            resolution_manifest,
            warnings,
            generated_css: String::new(),
            diagnostic_counts: HashMap::from([("lower-managed-style-refresh-count".into(), 0)]),
        });
    }
    let initial_manifest = compile_with_base(&input, resolution_base.clone())?;
    let root_size = initial_manifest
        .get("settings")
        .and_then(|settings| settings.get("rootSize"))
        .and_then(Value::as_f64)
        .unwrap_or(16.0);
    let mut engine = engine_for_manifest(&initial_manifest)?;
    let unfinalized_input = input.clone();
    finalize_utility_definitions(&mut input, &mut engine)?;
    let resolution_manifest = compile_with_base(&input, resolution_base)?;
    if input != unfinalized_input {
        engine = engine_for_manifest(&resolution_manifest)?;
    }

    let groups = managed_style_groups(style_definitions);
    let dependencies = managed_dependencies(&groups);
    let managed_order = managed_dependency_order(&groups, &dependencies)?;
    let mut unrefreshed = HashSet::new();
    for index in &managed_order {
        if dependencies[*index]
            .iter()
            .any(|dependency| unrefreshed.contains(dependency))
        {
            let current_manifest = compile_with_base(
                &input,
                options
                    .resolution_manifest
                    .clone()
                    .or_else(|| options.base_manifest.clone()),
            )?;
            engine = engine_for_manifest(&current_manifest)?;
            unrefreshed.clear();
        }
        let ((name, layer), definitions) = &groups[*index];
        for definition in
            create_merged_style_definitions(definitions, &mut engine, Some(*layer), root_size)?
        {
            push_static_utility_rule(&mut input, name, *layer, definition)?;
        }
        unrefreshed.insert(*index);
    }

    let native_definitions = style_definitions
        .iter()
        .filter(|definition| match definition {
            CssDirectiveStyleDefinition::Native { name, .. }
            | CssDirectiveStyleDefinition::Compose { name, .. } => name.is_none(),
        })
        .cloned()
        .collect::<Vec<_>>();
    let generated_css = if native_definitions.is_empty() {
        String::new()
    } else {
        if !unrefreshed.is_empty() {
            let current_manifest = compile_with_base(
                &input,
                options
                    .resolution_manifest
                    .clone()
                    .or_else(|| options.base_manifest.clone()),
            )?;
            engine = engine_for_manifest(&current_manifest)?;
        }
        render_style_definitions(create_merged_style_definitions(
            &native_definitions,
            &mut engine,
            None,
            root_size,
        )?)
    };
    let manifest = compile_with_base(&input, options.base_manifest.clone())?;
    let mut warnings = initial_warnings.to_vec();
    for warning in media_mode_warnings(&input) {
        if !warnings.contains(&warning) {
            warnings.push(warning);
        }
    }
    let diagnostic_counts = HashMap::from([(
        "lower-managed-style-refresh-count".into(),
        managed_refresh_count(
            &managed_order,
            &dependencies,
            !native_definitions.is_empty(),
        ),
    )]);
    Ok(LowerCssDirectivesResult {
        input,
        manifest,
        resolution_manifest,
        warnings,
        generated_css,
        diagnostic_counts,
    })
}

pub fn lower_css_directives_request(
    request: &LowerCssDirectivesRequest,
    options: &LowerCssDirectivesOptions,
) -> Result<LowerCssDirectivesResult, CompilerError> {
    lower_css_directives(
        &request.manifest_input,
        &request.style_definitions,
        &request.warnings,
        options,
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn lower_for_test(
        manifest_input: CssDirectiveManifestInput,
        definitions: Value,
    ) -> LowerCssDirectivesResult {
        let definitions: Vec<CssDirectiveStyleDefinition> =
            serde_json::from_value(definitions).unwrap();
        lower_css_directives(
            &manifest_input,
            &definitions,
            &[],
            &LowerCssDirectivesOptions {
                base_manifest: Some(json!({ "version": 1, "utilities": [] })),
                resolution_manifest: None,
            },
        )
        .unwrap()
    }

    #[test]
    fn rejects_invalid_native_declarations_in_compose() {
        let definition: CssDirectiveStyleDefinition = serde_json::from_value(json!({
            "type": "compose",
            "order": 1,
            "className": "background:neutral-120",
            "selector": ".card"
        }))
        .unwrap();
        let error = lower_css_directives(
            &CssDirectiveManifestInput::default(),
            &[definition],
            &[],
            &LowerCssDirectivesOptions {
                base_manifest: Some(json!({ "version": 1, "utilities": [] })),
                resolution_manifest: None,
            },
        )
        .unwrap_err();
        assert_eq!(
            error.to_string(),
            "Invalid @compose class: background:neutral-120"
        );
    }

    #[test]
    fn accepts_valid_unparsed_native_declarations_in_compose() {
        let definitions: Vec<CssDirectiveStyleDefinition> = serde_json::from_value(json!([
            {
                "type": "compose",
                "order": 1,
                "className": "contain:content",
                "selector": ".card"
            },
            {
                "type": "compose",
                "order": 2,
                "className": "content:'stripe'",
                "selector": ".card"
            },
            {
                "type": "compose",
                "order": 3,
                "className": "fg:inherit!",
                "selector": ".card"
            },
            {
                "type": "compose",
                "order": 4,
                "className": "content:none",
                "selector": ".card::before"
            },
            {
                "type": "compose",
                "order": 5,
                "className": "text-underline-offset:2px",
                "selector": ".card"
            },
            {
                "type": "compose",
                "order": 6,
                "className": "outline-offset:0",
                "selector": ".card"
            }
        ]))
        .unwrap();
        let result = lower_css_directives(
            &CssDirectiveManifestInput::default(),
            &definitions,
            &[],
            &LowerCssDirectivesOptions {
                base_manifest: Some(json!({ "version": 1, "utilities": [] })),
                resolution_manifest: None,
            },
        )
        .unwrap();
        assert!(result.generated_css.contains("contain:content"));
        assert!(result.generated_css.contains("content:'stripe'"));
        assert!(result.generated_css.contains("color:inherit!important"));
        assert!(result.generated_css.contains("content:none"));
        assert!(result.generated_css.contains("text-underline-offset:2px"));
        assert!(result.generated_css.contains("outline-offset:0"));
    }

    #[test]
    fn orders_unconditioned_native_styles_before_matching_responsive_styles() {
        let result = lower_for_test(
            CssDirectiveManifestInput::default(),
            json!([
                {
                    "type": "native",
                    "order": 1,
                    "selector": ".prose :is(h1,h2,h3,h4,h5,h6)",
                    "declarations": {
                        "margin-top": "var(--spacing-2xl)",
                        "scroll-margin-top": "100px"
                    },
                    "conditions": ["@media (width>=52.125rem)"]
                },
                {
                    "type": "native",
                    "order": 2,
                    "selector": ".prose :is(h1,h2,h3,h4,h5,h6)",
                    "declarations": {
                        "margin-top": "var(--spacing-lg)",
                        "scroll-margin-top": "60px"
                    }
                }
            ]),
        );
        assert_eq!(
            result.generated_css,
            ".prose :is(h1,h2,h3,h4,h5,h6){margin-top:var(--spacing-lg);scroll-margin-top:60px}@media (width>=52.125rem){.prose :is(h1,h2,h3,h4,h5,h6){margin-top:var(--spacing-2xl);scroll-margin-top:100px}}"
        );
    }

    #[test]
    fn orders_unconditioned_compositions_before_matching_responsive_compositions() {
        let result = lower_for_test(
            CssDirectiveManifestInput::default(),
            json!([
                {
                    "type": "compose",
                    "order": 1,
                    "className": "display:grid",
                    "selector": ".card",
                    "conditions": ["@media (width>=48rem)"]
                },
                {
                    "type": "compose",
                    "order": 2,
                    "className": "display:block",
                    "selector": ".card"
                }
            ]),
        );
        assert_eq!(
            result.generated_css,
            ".card{display:block}@media (width>=48rem){.card{display:grid}}"
        );
    }

    #[test]
    fn normalizes_root_size_when_ordering_numeric_conditions() {
        let result = lower_for_test(
            CssDirectiveManifestInput {
                root_size: Some(20.0),
                ..Default::default()
            },
            json!([
                {
                    "type": "native",
                    "order": 1,
                    "selector": ".card",
                    "declarations": { "color": "red" },
                    "conditions": ["@media (width>=42rem)"]
                },
                {
                    "type": "native",
                    "order": 2,
                    "selector": ".card",
                    "declarations": { "color": "blue" },
                    "conditions": ["@media (width>=800px)"]
                }
            ]),
        );
        assert_eq!(
            result.generated_css,
            "@media (width>=800px){.card{color:blue}}@media (width>=42rem){.card{color:red}}"
        );
    }

    #[test]
    fn keeps_source_order_for_non_numeric_conditions_and_distinct_targets() {
        let result = lower_for_test(
            CssDirectiveManifestInput::default(),
            json!([
                {
                    "type": "native",
                    "order": 1,
                    "selector": ".same",
                    "declarations": { "opacity": "0" },
                    "conditions": ["@starting-style"]
                },
                {
                    "type": "native",
                    "order": 2,
                    "selector": ".same",
                    "declarations": { "opacity": "1" },
                    "conditions": ["@container card (inline-size>30rem)"]
                },
                {
                    "type": "native",
                    "order": 3,
                    "selector": ".other",
                    "declarations": { "color": "red" },
                    "conditions": ["@media (prefers-color-scheme:dark)"]
                },
                {
                    "type": "native",
                    "order": 4,
                    "selector": ".base-layer",
                    "layer": "base",
                    "declarations": { "display": "grid" },
                    "conditions": ["@media (width>=40rem)"]
                },
                {
                    "type": "native",
                    "order": 5,
                    "selector": ".base-layer",
                    "layer": "components",
                    "declarations": { "display": "block" }
                }
            ]),
        );
        assert_eq!(
            result.generated_css,
            "@starting-style{.same{opacity:0}}@container card (inline-size>30rem){.same{opacity:1}}@media (prefers-color-scheme:dark){.other{color:red}}@media (width>=40rem){.base-layer{display:grid}}.base-layer{display:block}"
        );
    }

    #[test]
    fn orders_matching_managed_utility_rules_without_moving_layers() {
        let result = lower_for_test(
            CssDirectiveManifestInput::default(),
            json!([
                {
                    "type": "native",
                    "order": 1,
                    "name": "prose",
                    "layer": "defaults",
                    "selector": "& :is(h1,h2)",
                    "declarations": { "margin-top": "2rem" },
                    "conditions": ["@media (width>=52rem)"]
                },
                {
                    "type": "native",
                    "order": 2,
                    "name": "prose",
                    "layer": "defaults",
                    "selector": "& :is(h1,h2)",
                    "declarations": { "margin-top": "1rem" }
                }
            ]),
        );
        let utility = &result.input.utilities.unwrap()[0];
        assert_eq!(
            utility,
            &json!({
                "name": "prose",
                "type": "static",
                "layer": "defaults",
                "rules": [
                    {
                        "declarations": { "margin-top": "1rem" },
                        "selector": "& :is(h1,h2)"
                    },
                    {
                        "declarations": { "margin-top": "2rem" },
                        "selector": "& :is(h1,h2)",
                        "conditions": ["@media (width>=52rem)"]
                    }
                ]
            })
        );
    }
}
