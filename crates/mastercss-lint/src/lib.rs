#![forbid(unsafe_code)]

use mastercss_engine::{EngineError, EngineSession};
use mastercss_schema::{
    GeneratedRuleIr, LINT_BATCH_VERSION, NativeDeclarationCandidateIr, UtilityLayerName,
};
use serde::Serialize;
use std::cmp::Ordering;
use std::collections::HashSet;

const UNKNOWN_PROPERTY_GROUP_ORDER: u8 = 99;
const UNKNOWN_PROPERTY_ORDER: u8 = 99;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClassConflictIr {
    pub class_name: String,
    pub conflicts: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LintBatchIr {
    pub version: u32,
    pub sorted_class_names: Vec<String>,
    pub conflicts: Vec<ClassConflictIr>,
}

#[derive(Debug)]
pub struct LintSession {
    engine: EngineSession,
}

#[derive(Debug, Clone)]
struct ClassDescriptor {
    class_name: String,
    rule: Option<GeneratedRuleIr>,
    valid_for_conflicts: bool,
    properties: Vec<String>,
    group: u8,
    property_order: u8,
    type_order: u8,
}

impl LintSession {
    pub fn create(manifest_json: &str) -> Result<Self, EngineError> {
        Ok(Self {
            engine: EngineSession::create(manifest_json)?,
        })
    }

    pub fn native_declaration_candidates<I, S>(
        &self,
        class_names: I,
    ) -> Result<Vec<NativeDeclarationCandidateIr>, EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        self.engine.native_declaration_candidates(class_names)
    }

    pub fn analyze<I, S>(
        &mut self,
        class_names: I,
        native_support: Option<&[bool]>,
        invalid_generated_classes: &HashSet<String>,
    ) -> Result<LintBatchIr, EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        let class_names = class_names
            .into_iter()
            .map(|class_name| class_name.as_ref().to_owned())
            .collect::<Vec<_>>();
        if let Some(native_support) = native_support {
            self.engine
                .ensure_class_rules_with_native_support(&class_names, native_support)?;
        } else {
            self.engine.ensure_class_rules(&class_names)?;
        }
        let descriptors = class_names
            .iter()
            .map(|class_name| {
                let inspection = self.engine.inspect(class_name)?;
                Ok(ClassDescriptor::new(
                    class_name,
                    inspection.rules.first().cloned(),
                    !invalid_generated_classes.contains(class_name),
                ))
            })
            .collect::<Result<Vec<_>, EngineError>>()?;
        let sorted_class_names = sort_descriptors(&descriptors);
        let conflicts = find_conflicts(&descriptors);
        self.engine.delete_class_rules(&class_names)?;
        Ok(LintBatchIr {
            version: LINT_BATCH_VERSION,
            sorted_class_names,
            conflicts,
        })
    }

    pub fn dispose(&mut self) {
        self.engine.dispose();
    }
}

impl ClassDescriptor {
    fn unknown(class_name: &str) -> Self {
        Self {
            class_name: class_name.to_owned(),
            rule: None,
            valid_for_conflicts: false,
            properties: Vec::new(),
            group: UNKNOWN_PROPERTY_GROUP_ORDER,
            property_order: UNKNOWN_PROPERTY_ORDER,
            type_order: 0,
        }
    }

    fn new(class_name: &str, rule: Option<GeneratedRuleIr>, valid_for_conflicts: bool) -> Self {
        let Some(rule) = rule else {
            return Self::unknown(class_name);
        };
        let properties = collect_rule_properties(&rule.text);
        let (group, property_order) = properties
            .iter()
            .map(|property| get_property_order(property))
            .min()
            .unwrap_or((UNKNOWN_PROPERTY_GROUP_ORDER, UNKNOWN_PROPERTY_ORDER));
        let type_order = if rule.utility_type == -2 && !has_dynamic_value(class_name) {
            0
        } else if rule.utility_type == -2 {
            1
        } else {
            2
        };
        Self {
            class_name: class_name.to_owned(),
            rule: Some(rule),
            valid_for_conflicts,
            properties,
            group,
            property_order,
            type_order,
        }
    }
}

fn sort_descriptors(descriptors: &[ClassDescriptor]) -> Vec<String> {
    let mut seen = HashSet::new();
    let mut descriptors = descriptors
        .iter()
        .filter(|descriptor| seen.insert(descriptor.class_name.clone()))
        .cloned()
        .collect::<Vec<_>>();
    descriptors.sort_by(compare_descriptors);
    descriptors
        .into_iter()
        .map(|descriptor| descriptor.class_name)
        .collect()
}

fn compare_descriptors(left: &ClassDescriptor, right: &ClassDescriptor) -> Ordering {
    match (&left.rule, &right.rule) {
        (None, None) => return left.class_name.cmp(&right.class_name),
        (None, Some(_)) => return Ordering::Greater,
        (Some(_), None) => return Ordering::Less,
        _ => {}
    }
    let left_rule = left.rule.as_ref().expect("known descriptor has a rule");
    let right_rule = right.rule.as_ref().expect("known descriptor has a rule");
    layer_order(left_rule.layer)
        .cmp(&layer_order(right_rule.layer))
        .then_with(|| left_rule.sort_tier.cmp(&right_rule.sort_tier))
        .then_with(|| {
            compare_condition_features(&left_rule.priority.features, &right_rule.priority.features)
        })
        .then_with(|| {
            left_rule
                .priority
                .selector
                .cmp(&right_rule.priority.selector)
        })
        .then_with(|| (left.group, left.property_order).cmp(&(right.group, right.property_order)))
        .then_with(|| left.type_order.cmp(&right.type_order))
        .then_with(|| left_rule.utility_type.cmp(&right_rule.utility_type))
        .then_with(|| natural_compare(&left_rule.key, &right_rule.key))
        .then_with(|| left.class_name.cmp(&right.class_name))
}

fn find_conflicts(descriptors: &[ClassDescriptor]) -> Vec<ClassConflictIr> {
    let mut conflicts = Vec::new();
    for (index, descriptor) in descriptors.iter().enumerate() {
        if !descriptor.valid_for_conflicts {
            continue;
        }
        let Some(rule) = descriptor.rule.as_ref() else {
            continue;
        };
        let mut last_conflict = None;
        for compare in &descriptors[index + 1..] {
            if !compare.valid_for_conflicts {
                continue;
            }
            let Some(compare_rule) = compare.rule.as_ref() else {
                continue;
            };
            if descriptor.properties == compare.properties
                && equal_variant_scope(rule, compare_rule)
            {
                last_conflict = Some(compare.class_name.clone());
            }
        }
        if let Some(conflict) = last_conflict {
            conflicts.push(ClassConflictIr {
                class_name: descriptor.class_name.clone(),
                conflicts: vec![conflict],
            });
        }
    }
    conflicts
}

fn equal_variant_scope(left: &GeneratedRuleIr, right: &GeneratedRuleIr) -> bool {
    left.layer == right.layer
        && branch_key(&left.key) == branch_key(&right.key)
        && left.sort_tier == right.sort_tier
        && left.priority == right.priority
}

fn branch_key(key: &str) -> &str {
    key.split_once('\0').map_or("", |(_, branch)| branch)
}

fn has_dynamic_value(class_name: &str) -> bool {
    let mut depth = 0_u32;
    for character in class_name.chars() {
        match character {
            '{' | '[' | '(' => depth += 1,
            '}' | ']' | ')' => depth = depth.saturating_sub(1),
            ':' if depth == 0 => return true,
            _ => {}
        }
    }
    false
}

fn layer_order(layer: UtilityLayerName) -> u8 {
    match layer {
        UtilityLayerName::Base => 1,
        UtilityLayerName::Defaults => 2,
        UtilityLayerName::Components => 3,
        UtilityLayerName::Utilities => 4,
    }
}

fn collect_rule_properties(text: &str) -> Vec<String> {
    let mut properties = Vec::new();
    let mut stack = Vec::new();
    let mut quote = None;
    let mut escaped = false;
    for (index, character) in text.char_indices() {
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
            continue;
        }
        if character == '{' {
            stack.push(index + 1);
        } else if character == '}'
            && let Some(start) = stack.pop()
            && !text[start..index].contains('{')
        {
            for declaration in split_top_level(&text[start..index], ';') {
                let Some((property, _)) = declaration.split_once(':') else {
                    continue;
                };
                let property = property.trim();
                if !property.is_empty() && !properties.iter().any(|value| value == property) {
                    properties.push(property.to_owned());
                }
            }
        }
    }
    properties.sort();
    properties
}

fn split_top_level(source: &str, separator: char) -> Vec<&str> {
    let mut values = Vec::new();
    let mut start = 0;
    let mut depth = 0_u32;
    let mut quote = None;
    let mut escaped = false;
    for (index, character) in source.char_indices() {
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
        } else if depth == 0 && character == separator {
            values.push(&source[start..index]);
            start = index + character.len_utf8();
        }
    }
    values.push(&source[start..]);
    values
}

fn get_property_order(property: &str) -> (u8, u8) {
    if property == "position" {
        return (0, 0);
    }
    if matches!(property, "top" | "right" | "bottom" | "left") || property_prefix(property, "inset")
    {
        return (0, 1);
    }
    if property == "z-index" {
        return (0, 2);
    }
    if property == "display" {
        return (0, 3);
    }
    if property == "visibility" {
        return (0, 4);
    }
    if property_prefix(property, "overflow") {
        return (0, 5);
    }
    if property_prefix(property, "container") {
        return (0, 6);
    }
    if property == "isolation" {
        return (0, 7);
    }
    if property == "float" {
        return (0, 8);
    }
    if property == "clear" {
        return (0, 9);
    }
    if property_prefix(property, "flex") {
        return (1, 0);
    }
    if property_prefix(property, "grid") {
        return (1, 1);
    }
    if property_prefix(property, "place") {
        return (1, 2);
    }
    if property_prefix(property, "align") {
        return (1, 3);
    }
    if property_prefix(property, "justify") {
        return (1, 4);
    }
    if property_prefix(property, "gap") {
        return (1, 5);
    }
    if property == "order" {
        return (1, 6);
    }
    if property_prefix(property, "columns") {
        return (1, 7);
    }
    if property == "height" {
        return (2, 0);
    }
    if property == "width" {
        return (2, 1);
    }
    if property_prefix(property, "min") {
        return (2, 2);
    }
    if property_prefix(property, "max") {
        return (2, 3);
    }
    if property == "size" {
        return (2, 4);
    }
    if property == "aspect-ratio" {
        return (2, 5);
    }
    if property_prefix(property, "margin") {
        return (3, 0);
    }
    if property_prefix(property, "padding") {
        return (3, 1);
    }
    if property_prefix(property, "scroll-margin") {
        return (3, 2);
    }
    if property_prefix(property, "scroll-padding") {
        return (3, 3);
    }
    if property_prefix(property, "border") {
        return (4, 0);
    }
    if property_prefix(property, "outline") {
        return (4, 1);
    }
    if property_prefix(property, "font") {
        return (5, 0);
    }
    if property == "line-height" {
        return (5, 1);
    }
    if property == "letter-spacing" {
        return (5, 2);
    }
    if property_prefix(property, "text") {
        return (5, 3);
    }
    if property == "white-space" {
        return (5, 4);
    }
    if property_prefix(property, "word") {
        return (5, 5);
    }
    if property_prefix(property, "list-style") {
        return (5, 6);
    }
    if property_prefix(property, "background") {
        return (6, 0);
    }
    if property == "color" {
        return (6, 1);
    }
    if property == "fill" {
        return (6, 2);
    }
    if property == "stroke" {
        return (6, 3);
    }
    if property == "accent-color" {
        return (6, 4);
    }
    if property == "caret-color" {
        return (6, 5);
    }
    if property_prefix(property, "mask") {
        return (6, 6);
    }
    if property == "opacity" {
        return (7, 0);
    }
    if property == "box-shadow" {
        return (7, 1);
    }
    if property == "filter" {
        return (7, 2);
    }
    if property == "backdrop-filter" {
        return (7, 3);
    }
    if property == "mix-blend-mode" {
        return (7, 4);
    }
    if property == "transform" {
        return (7, 5);
    }
    if property == "translate" {
        return (7, 6);
    }
    if property == "scale" {
        return (7, 7);
    }
    if property == "rotate" {
        return (7, 8);
    }
    if property_prefix(property, "transition") {
        return (7, 9);
    }
    if property_prefix(property, "animation") {
        return (7, 10);
    }
    if property == "cursor" {
        return (8, 0);
    }
    if property == "pointer-events" {
        return (8, 1);
    }
    if property == "user-select" {
        return (8, 2);
    }
    if property == "touch-action" {
        return (8, 3);
    }
    if property == "resize" {
        return (8, 4);
    }
    if property_prefix(property, "scroll") {
        return (8, 5);
    }
    if property_prefix(property, "overscroll") {
        return (8, 6);
    }
    if property == "appearance" {
        return (8, 7);
    }
    (UNKNOWN_PROPERTY_GROUP_ORDER, UNKNOWN_PROPERTY_ORDER)
}

fn property_prefix(property: &str, prefix: &str) -> bool {
    property == prefix || property.starts_with(&format!("{prefix}-"))
}

fn compare_condition_features(
    left: &[(String, f64, f64)],
    right: &[(String, f64, f64)],
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

fn natural_compare(left: &str, right: &str) -> Ordering {
    left.cmp(right)
}

#[cfg(test)]
mod tests {
    use super::*;

    const MANIFEST: &str = r#"{
      "version":1,
      "utilities":[
        {"id":"block","name":"block","type":-2,"emit":{"type":"static","rules":[{"declarations":{"display":"block"}}]},"matchers":[{"type":"static","name":"block"}]},
        {"id":"m","name":"m:","type":-1,"emit":{"type":"property","property":"margin"},"matchers":[{"type":"key","keys":["m"]}]},
        {"id":"fg","name":"fg:","type":0,"emit":{"type":"property","property":"color"},"matchers":[{"type":"key","keys":["fg"]}]}
      ]
    }"#;

    #[test]
    fn sorts_and_finds_full_conflicts_without_retaining_rules() {
        let mut session = LintSession::create(MANIFEST).unwrap();
        let batch = session
            .analyze(
                ["fg:white", "m:2px", "m:3px", "unknown"],
                None,
                &HashSet::new(),
            )
            .unwrap();
        assert_eq!(batch.version, 1);
        assert_eq!(
            batch.sorted_class_names,
            ["m:2px", "m:3px", "fg:white", "unknown"]
        );
        assert_eq!(batch.conflicts[0].class_name, "m:2px");
        assert_eq!(batch.conflicts[0].conflicts, ["m:3px"]);
    }
}
