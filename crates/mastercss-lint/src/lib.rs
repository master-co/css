#![forbid(unsafe_code)]

mod class_list;

use mastercss_engine::{EngineError, EngineSession};
use mastercss_schema::{
    GeneratedRuleIr, LINT_BATCH_VERSION, NativeDeclarationCandidateIr, SourceRange,
    UtilityLayerName,
};
use serde::Serialize;
use serde_json::Value;
use std::cmp::Ordering;
use std::collections::{HashMap, HashSet};

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
pub struct PartialClassConflictIr {
    pub class_name: String,
    pub replacement: String,
    pub conflict: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LintEditIr {
    pub range: SourceRange,
    pub text: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LintDiagnosticIr {
    pub rule_id: String,
    pub code: String,
    pub message: String,
    pub range: SourceRange,
    #[serde(default, skip_serializing_if = "serde_json::Map::is_empty")]
    pub data: serde_json::Map<String, Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fix: Option<LintEditIr>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LintClassListIr {
    pub version: u32,
    pub analysis: LintBatchIr,
    pub diagnostics: Vec<LintDiagnosticIr>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sort_edit: Option<LintEditIr>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conflict_edit: Option<LintEditIr>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conflict_range: Option<SourceRange>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LintBatchIr {
    pub version: u32,
    pub sorted_class_names: Vec<String>,
    pub conflicts: Vec<ClassConflictIr>,
    pub partial_conflicts: Vec<PartialClassConflictIr>,
}

#[derive(Debug)]
pub struct LintSession {
    engine: EngineSession,
    variable_keys: Vec<String>,
    variable_values: HashMap<String, String>,
}

#[derive(Debug, Clone)]
struct ClassDescriptor {
    class_name: String,
    matched: bool,
    rule: Option<GeneratedRuleIr>,
    rule_count: usize,
    valid_for_conflicts: bool,
    properties: Vec<String>,
    declarations: Vec<(String, String)>,
    group: u8,
    property_order: u8,
    type_order: u8,
}

impl LintSession {
    pub fn create(manifest_json: &str) -> Result<Self, EngineError> {
        let (variable_keys, variable_values) = collect_manifest_variables(manifest_json);
        Ok(Self {
            engine: EngineSession::create(manifest_json)?,
            variable_keys,
            variable_values,
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
        self.analyze_with_matches(class_names, native_support, invalid_generated_classes)
            .map(|(analysis, _)| analysis)
    }

    fn analyze_with_matches(
        &mut self,
        class_names: Vec<String>,
        native_support: Option<&[bool]>,
        invalid_generated_classes: &HashSet<String>,
    ) -> Result<(LintBatchIr, Vec<bool>), EngineError> {
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
                let rule_count = inspection.rules.len();
                Ok(ClassDescriptor::new(
                    class_name,
                    inspection.rules.first().cloned(),
                    rule_count,
                    !invalid_generated_classes.contains(class_name),
                ))
            })
            .collect::<Result<Vec<_>, EngineError>>()?;
        let sorted_class_names = sort_descriptors(&descriptors);
        let conflicts = find_conflicts(&descriptors);
        let partial_conflicts = find_partial_conflicts(
            &descriptors,
            &self.engine,
            &self.variable_keys,
            &self.variable_values,
        )?;
        let matches = descriptors
            .iter()
            .map(|descriptor| descriptor.matched)
            .collect();
        self.engine.delete_class_rules(&class_names)?;
        Ok((
            LintBatchIr {
                version: LINT_BATCH_VERSION,
                sorted_class_names,
                conflicts,
                partial_conflicts,
            },
            matches,
        ))
    }

    pub fn analyze_class_list(
        &mut self,
        class_list: &str,
        class_names: &[String],
        native_support: Option<&[bool]>,
        invalid_generated_classes: &HashSet<String>,
        validation_errors: &[Vec<String>],
        disallow_unknown_class: bool,
    ) -> Result<LintClassListIr, EngineError> {
        let (analysis, matches) = self.analyze_with_matches(
            class_names.to_vec(),
            native_support,
            invalid_generated_classes,
        )?;
        Ok(class_list::create_class_list_ir(
            class_list,
            class_names,
            analysis,
            &matches,
            validation_errors,
            disallow_unknown_class,
        ))
    }

    pub fn dispose(&mut self) {
        self.engine.dispose();
    }
}

impl ClassDescriptor {
    fn unknown(class_name: &str) -> Self {
        Self {
            class_name: class_name.to_owned(),
            matched: false,
            rule: None,
            rule_count: 0,
            valid_for_conflicts: false,
            properties: Vec::new(),
            declarations: Vec::new(),
            group: UNKNOWN_PROPERTY_GROUP_ORDER,
            property_order: UNKNOWN_PROPERTY_ORDER,
            type_order: 0,
        }
    }

    fn new(
        class_name: &str,
        rule: Option<GeneratedRuleIr>,
        rule_count: usize,
        valid_for_conflicts: bool,
    ) -> Self {
        let Some(rule) = rule else {
            return Self::unknown(class_name);
        };
        let declarations = collect_rule_declarations(&rule.text);
        let mut properties = declarations
            .iter()
            .map(|(property, _)| property.clone())
            .collect::<Vec<_>>();
        properties.sort();
        properties.dedup();
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
            matched: true,
            rule: Some(rule),
            rule_count,
            valid_for_conflicts,
            properties,
            declarations,
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

fn collect_rule_declarations(text: &str) -> Vec<(String, String)> {
    let mut declarations = Vec::new();
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
                let Some((property, value)) = declaration.split_once(':') else {
                    continue;
                };
                let property = property.trim();
                let value = value
                    .trim()
                    .strip_suffix("!important")
                    .unwrap_or(value.trim());
                if !property.is_empty()
                    && !declarations
                        .iter()
                        .any(|entry: &(String, String)| entry.0 == property && entry.1 == value)
                {
                    declarations.push((property.to_owned(), value.to_owned()));
                }
            }
        }
    }
    declarations.sort();
    declarations
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum PartialConflictFamily {
    Margin,
    Padding,
    Inset,
    Radius,
    BorderWidth,
    BorderColor,
    BorderStyle,
}

const PARTIAL_CONFLICT_FAMILIES: [PartialConflictFamily; 7] = [
    PartialConflictFamily::Margin,
    PartialConflictFamily::Padding,
    PartialConflictFamily::Inset,
    PartialConflictFamily::Radius,
    PartialConflictFamily::BorderWidth,
    PartialConflictFamily::BorderColor,
    PartialConflictFamily::BorderStyle,
];
const PHYSICAL_SIDES: [&str; 4] = ["top", "right", "bottom", "left"];
const RADIUS_CORNERS: [&str; 4] = ["top-left", "top-right", "bottom-right", "bottom-left"];

#[derive(Debug, Clone)]
struct ParsedClassParts {
    key: Option<String>,
    value: Option<String>,
    suffix: String,
}

#[derive(Debug, Clone)]
struct PartialConflictEntry {
    class_name: String,
    value: String,
    suffix: String,
    family: PartialConflictFamily,
    parts: Vec<&'static str>,
    rule: GeneratedRuleIr,
    declarations: Vec<(String, String)>,
}

impl PartialConflictFamily {
    fn name(self) -> &'static str {
        match self {
            Self::Margin => "margin",
            Self::Padding => "padding",
            Self::Inset => "inset",
            Self::Radius => "radius",
            Self::BorderWidth => "border-width",
            Self::BorderColor => "border-color",
            Self::BorderStyle => "border-style",
        }
    }

    fn part_order(self) -> &'static [&'static str] {
        match self {
            Self::Radius => &RADIUS_CORNERS,
            _ => &PHYSICAL_SIDES,
        }
    }

    fn requires_property_match(self) -> bool {
        !matches!(self, Self::Margin | Self::Padding)
    }

    fn disallows_multi_value(self) -> bool {
        self.requires_property_match()
    }

    fn key_parts(self, key: &str) -> Option<&'static [&'static str]> {
        match self {
            Self::Margin => match key {
                "m" | "margin" => Some(&PHYSICAL_SIDES),
                "mx" => Some(&["right", "left"]),
                "my" => Some(&["top", "bottom"]),
                "mt" | "margin-top" => Some(&["top"]),
                "mr" | "margin-right" => Some(&["right"]),
                "mb" | "margin-bottom" => Some(&["bottom"]),
                "ml" | "margin-left" => Some(&["left"]),
                _ => None,
            },
            Self::Padding => match key {
                "p" | "padding" => Some(&PHYSICAL_SIDES),
                "px" => Some(&["right", "left"]),
                "py" => Some(&["top", "bottom"]),
                "pt" | "padding-top" => Some(&["top"]),
                "pr" | "padding-right" => Some(&["right"]),
                "pb" | "padding-bottom" => Some(&["bottom"]),
                "pl" | "padding-left" => Some(&["left"]),
                _ => None,
            },
            Self::Inset => match key {
                "inset" => Some(&PHYSICAL_SIDES),
                "top" => Some(&["top"]),
                "right" => Some(&["right"]),
                "bottom" => Some(&["bottom"]),
                "left" => Some(&["left"]),
                _ => None,
            },
            Self::Radius => match key {
                "r" | "border-radius" => Some(&RADIUS_CORNERS),
                "rtl" | "border-top-left-radius" => Some(&["top-left"]),
                "rtr" | "border-top-right-radius" => Some(&["top-right"]),
                "rbr" | "border-bottom-right-radius" => Some(&["bottom-right"]),
                "rbl" | "border-bottom-left-radius" => Some(&["bottom-left"]),
                _ => None,
            },
            Self::BorderWidth => match key {
                "b" | "border-width" => Some(&PHYSICAL_SIDES),
                "bt" | "border-top-width" => Some(&["top"]),
                "br" | "border-right-width" => Some(&["right"]),
                "bb" | "border-bottom-width" => Some(&["bottom"]),
                "bl" | "border-left-width" => Some(&["left"]),
                _ => None,
            },
            Self::BorderColor => match key {
                "b" | "border-color" => Some(&PHYSICAL_SIDES),
                "bt" | "border-top-color" => Some(&["top"]),
                "br" | "border-right-color" => Some(&["right"]),
                "bb" | "border-bottom-color" => Some(&["bottom"]),
                "bl" | "border-left-color" => Some(&["left"]),
                _ => None,
            },
            Self::BorderStyle => match key {
                "b" | "border-style" => Some(&PHYSICAL_SIDES),
                "bt" | "border-top-style" => Some(&["top"]),
                "br" | "border-right-style" => Some(&["right"]),
                "bb" | "border-bottom-style" => Some(&["bottom"]),
                "bl" | "border-left-style" => Some(&["left"]),
                _ => None,
            },
        }
    }

    fn property_parts(self, property: &str) -> Option<&'static [&'static str]> {
        match self {
            Self::Inset => match property {
                "inset" => Some(&PHYSICAL_SIDES),
                "top" => Some(&["top"]),
                "right" => Some(&["right"]),
                "bottom" => Some(&["bottom"]),
                "left" => Some(&["left"]),
                _ => None,
            },
            Self::Radius => match property {
                "border-radius" => Some(&RADIUS_CORNERS),
                "border-top-left-radius" => Some(&["top-left"]),
                "border-top-right-radius" => Some(&["top-right"]),
                "border-bottom-right-radius" => Some(&["bottom-right"]),
                "border-bottom-left-radius" => Some(&["bottom-left"]),
                _ => None,
            },
            Self::BorderWidth => border_property_parts(property, "width"),
            Self::BorderColor => border_property_parts(property, "color"),
            Self::BorderStyle => border_property_parts(property, "style"),
            Self::Margin | Self::Padding => None,
        }
    }

    fn replacement_key(self, parts: &[&str]) -> Option<&'static str> {
        let key = ordered_part_key(self, parts);
        match self {
            Self::Margin => match key.as_str() {
                "top|right|bottom|left" => Some("m"),
                "right|left" => Some("mx"),
                "top|bottom" => Some("my"),
                "top" => Some("mt"),
                "right" => Some("mr"),
                "bottom" => Some("mb"),
                "left" => Some("ml"),
                _ => None,
            },
            Self::Padding => match key.as_str() {
                "top|right|bottom|left" => Some("p"),
                "right|left" => Some("px"),
                "top|bottom" => Some("py"),
                "top" => Some("pt"),
                "right" => Some("pr"),
                "bottom" => Some("pb"),
                "left" => Some("pl"),
                _ => None,
            },
            Self::Inset => match key.as_str() {
                "top|right|bottom|left" => Some("inset"),
                "top" => Some("top"),
                "right" => Some("right"),
                "bottom" => Some("bottom"),
                "left" => Some("left"),
                _ => None,
            },
            Self::Radius => match key.as_str() {
                "top-left|top-right|bottom-right|bottom-left" => Some("r"),
                "top-left" => Some("rtl"),
                "top-right" => Some("rtr"),
                "bottom-right" => Some("rbr"),
                "bottom-left" => Some("rbl"),
                _ => None,
            },
            Self::BorderWidth | Self::BorderColor | Self::BorderStyle => match key.as_str() {
                "top|right|bottom|left" => Some("b"),
                "top" => Some("bt"),
                "right" => Some("br"),
                "bottom" => Some("bb"),
                "left" => Some("bl"),
                _ => None,
            },
        }
    }

    fn is_preferred_key(self, key: Option<&str>) -> bool {
        key.is_some_and(|key| match self {
            Self::Margin => matches!(key, "m" | "mx" | "my" | "mt" | "mr" | "mb" | "ml"),
            Self::Padding => matches!(key, "p" | "px" | "py" | "pt" | "pr" | "pb" | "pl"),
            Self::Inset => matches!(key, "inset" | "top" | "right" | "bottom" | "left"),
            Self::Radius => matches!(key, "r" | "rtl" | "rtr" | "rbr" | "rbl"),
            Self::BorderWidth | Self::BorderColor => matches!(key, "b" | "bt" | "br" | "bb" | "bl"),
            Self::BorderStyle => matches!(key, "b" | "bt" | "br" | "bb" | "bl"),
        })
    }

    fn format_replacement(self, key: &str, value: &str, suffix: &str) -> String {
        if self == Self::BorderStyle {
            format!("{key}-{value}{suffix}")
        } else {
            format!("{key}:{value}{suffix}")
        }
    }
}

fn border_property_parts(property: &str, kind: &str) -> Option<&'static [&'static str]> {
    if property == format!("border-{kind}") {
        return Some(&PHYSICAL_SIDES);
    }
    match property {
        value if value == format!("border-top-{kind}") => Some(&["top"]),
        value if value == format!("border-right-{kind}") => Some(&["right"]),
        value if value == format!("border-bottom-{kind}") => Some(&["bottom"]),
        value if value == format!("border-left-{kind}") => Some(&["left"]),
        _ => None,
    }
}

fn collect_manifest_variables(manifest_json: &str) -> (Vec<String>, HashMap<String, String>) {
    let Ok(manifest) = serde_json::from_str::<Value>(manifest_json) else {
        return (Vec::new(), HashMap::new());
    };
    let mut keys = Vec::new();
    let mut seen = HashSet::new();
    let mut values = HashMap::new();
    let Some(variables) = manifest.get("variables").and_then(Value::as_object) else {
        return (keys, values);
    };
    for (namespace, entries) in variables {
        let Some(entries) = entries.as_array() else {
            continue;
        };
        for entry in entries {
            let Some(entry) = entry.as_object() else {
                continue;
            };
            let Some(key) = entry.get("key").and_then(Value::as_str) else {
                continue;
            };
            if seen.insert(key.to_owned()) {
                keys.push(key.to_owned());
            }
            let Some(value) = entry.get("value").and_then(|value| match value {
                Value::String(value) => Some(value.clone()),
                Value::Number(value) => Some(value.to_string()),
                _ => None,
            }) else {
                continue;
            };
            let name = entry
                .get("name")
                .and_then(Value::as_str)
                .map(str::to_owned)
                .unwrap_or_else(|| format!("{namespace}-{key}"));
            values.insert(name, value);
        }
    }
    (keys, values)
}

fn ordered_part_key(family: PartialConflictFamily, parts: &[&str]) -> String {
    family
        .part_order()
        .iter()
        .filter(|part| parts.contains(part))
        .copied()
        .collect::<Vec<_>>()
        .join("|")
}

fn parts_equal(family: PartialConflictFamily, left: &[&str], right: &[&str]) -> bool {
    ordered_part_key(family, left) == ordered_part_key(family, right)
}

fn split_dynamic_value_state(value: &str) -> (String, String) {
    let mut quote = None;
    let mut escaped = false;
    let mut depth = 0_u32;
    for (index, character) in value.char_indices() {
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
        } else if matches!(character, '(' | '[' | '{') {
            depth += 1;
        } else if matches!(character, ')' | ']' | '}') {
            depth = depth.saturating_sub(1);
        } else if depth == 0 && matches!(character, ':' | '@' | '!' | '>') {
            return (value[..index].to_owned(), value[index..].to_owned());
        }
    }
    (value.to_owned(), String::new())
}

fn find_top_level_state_start(value: &str) -> Option<usize> {
    let mut quote = None;
    let mut escaped = false;
    let mut depth = 0_u32;
    for (index, character) in value.char_indices() {
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
        } else if matches!(character, '(' | '[' | '{') {
            depth += 1;
        } else if matches!(character, ')' | ']' | '}') {
            depth = depth.saturating_sub(1);
        } else if depth == 0 && matches!(character, ':' | '@' | '!' | '>') {
            return Some(index);
        }
    }
    None
}

fn parse_class_parts(class_name: &str) -> ParsedClassParts {
    let (semantic, important) = class_name
        .strip_suffix('!')
        .map_or((class_name, ""), |value| (value, "!"));
    if let Some(colon) = find_top_level_state_start(semantic)
        && semantic.as_bytes().get(colon) == Some(&b':')
    {
        let key = &semantic[..colon];
        if PARTIAL_CONFLICT_FAMILIES
            .iter()
            .any(|family| family.key_parts(key).is_some())
        {
            let (value, suffix) = split_dynamic_value_state(&semantic[colon + 1..]);
            return ParsedClassParts {
                key: Some(key.to_owned()),
                value: Some(value),
                suffix: format!("{suffix}{important}"),
            };
        }
    }
    let state_start = find_top_level_state_start(semantic).unwrap_or(semantic.len());
    ParsedClassParts {
        key: None,
        value: None,
        suffix: format!("{}{important}", &semantic[state_start..]),
    }
}

fn has_top_level_multi_value(value: &str) -> bool {
    split_top_level(value, '|').len() > 1
}

fn create_partial_entry(descriptor: &ClassDescriptor) -> Option<PartialConflictEntry> {
    let rule = descriptor.rule.as_ref()?;
    if descriptor.rule_count != 1 || rule.layer != UtilityLayerName::Utilities {
        return None;
    }
    let parsed = parse_class_parts(&descriptor.class_name);
    let declaration = (descriptor.declarations.len() == 1).then(|| &descriptor.declarations[0]);
    for family in PARTIAL_CONFLICT_FAMILIES {
        let property_parts = declaration.and_then(|(property, _)| family.property_parts(property));
        let key_parts = parsed.key.as_deref().and_then(|key| family.key_parts(key));
        if family.requires_property_match() && property_parts.is_none() {
            continue;
        }
        let parts = if let Some(key_parts) = key_parts
            && property_parts
                .is_none_or(|property_parts| parts_equal(family, key_parts, property_parts))
        {
            key_parts
        } else if let Some(property_parts) = property_parts {
            property_parts
        } else {
            continue;
        };
        let value = if key_parts.is_some() {
            parsed.value.as_deref()
        } else {
            declaration.map(|(_, value)| value.as_str())
        }?;
        if family.disallows_multi_value() && has_top_level_multi_value(value) {
            continue;
        }
        return Some(PartialConflictEntry {
            class_name: descriptor.class_name.clone(),
            value: value.to_owned(),
            suffix: parsed.suffix,
            family,
            parts: parts.to_vec(),
            rule: rule.clone(),
            declarations: descriptor.declarations.clone(),
        });
    }
    None
}

fn canonicalize_partial_value(
    entry: &mut PartialConflictEntry,
    parsed: &ParsedClassParts,
    engine: &EngineSession,
    variable_keys: &[String],
    variable_values: &HashMap<String, String>,
) -> Result<(), EngineError> {
    if entry.family.is_preferred_key(parsed.key.as_deref())
        || (parsed.key.is_none() && entry.family == PartialConflictFamily::BorderStyle)
    {
        return Ok(());
    }
    let Some(key) = entry.family.replacement_key(entry.family.part_order()) else {
        return Ok(());
    };
    for value in variable_keys {
        let candidate = entry.family.format_replacement(key, value, &entry.suffix);
        let inspection = engine.inspect(&candidate)?;
        if inspection.rules.len() != 1 {
            continue;
        }
        let candidate_rule = &inspection.rules[0];
        if candidate_rule.layer == UtilityLayerName::Utilities
            && equal_variant_scope(&entry.rule, candidate_rule)
            && (collect_rule_declarations(&candidate_rule.text) == entry.declarations
                || candidate_resolves_to_declarations(
                    candidate_rule,
                    &entry.declarations,
                    variable_values,
                ))
        {
            entry.value = value.clone();
            return Ok(());
        }
    }
    Ok(())
}

fn normalize_css_variable_value(value: &str) -> String {
    if let Some(value) = value.strip_prefix("-.") {
        format!("-0.{value}")
    } else if let Some(value) = value.strip_prefix('.') {
        format!("0.{value}")
    } else {
        value.to_owned()
    }
}

fn candidate_resolves_to_declarations(
    candidate_rule: &GeneratedRuleIr,
    source_declarations: &[(String, String)],
    variable_values: &HashMap<String, String>,
) -> bool {
    let candidate_declarations = collect_rule_declarations(&candidate_rule.text);
    if candidate_declarations.len() != source_declarations.len()
        || candidate_declarations
            .iter()
            .map(|(property, _)| property)
            .ne(source_declarations.iter().map(|(property, _)| property))
    {
        return false;
    }
    let Some(variable_name) = candidate_rule.variable_names.first() else {
        return false;
    };
    let Some(variable_value) = variable_values.get(variable_name) else {
        return false;
    };
    let variable_value = normalize_css_variable_value(variable_value);
    source_declarations
        .iter()
        .all(|(_, value)| normalize_css_variable_value(value) == variable_value)
}

fn get_replacement_class_names(entry: &PartialConflictEntry, parts: &[&str]) -> Vec<String> {
    if let Some(key) = entry.family.replacement_key(parts) {
        return vec![
            entry
                .family
                .format_replacement(key, &entry.value, &entry.suffix),
        ];
    }
    let mut remaining = parts.iter().copied().collect::<HashSet<_>>();
    let mut replacements = Vec::new();
    if matches!(
        entry.family,
        PartialConflictFamily::Margin | PartialConflictFamily::Padding
    ) {
        for grouped in [["right", "left"], ["top", "bottom"]] {
            if !grouped.iter().all(|part| remaining.contains(part)) {
                continue;
            }
            if let Some(key) = entry.family.replacement_key(&grouped) {
                replacements.push(entry.family.format_replacement(
                    key,
                    &entry.value,
                    &entry.suffix,
                ));
                for part in grouped {
                    remaining.remove(part);
                }
            }
        }
    }
    for part in entry.family.part_order() {
        if !remaining.contains(part) {
            continue;
        }
        if let Some(key) = entry.family.replacement_key(&[*part]) {
            replacements.push(
                entry
                    .family
                    .format_replacement(key, &entry.value, &entry.suffix),
            );
        }
    }
    replacements
}

fn validate_partial_replacement(
    class_names: &[String],
    source: &PartialConflictEntry,
    engine: &EngineSession,
) -> Result<bool, EngineError> {
    for class_name in class_names {
        let inspection = engine.inspect(class_name)?;
        if inspection.rules.len() != 1
            || inspection.rules[0].layer != UtilityLayerName::Utilities
            || !equal_variant_scope(&source.rule, &inspection.rules[0])
        {
            return Ok(false);
        }
    }
    Ok(true)
}

fn partial_conflict_replacement(
    source: &PartialConflictEntry,
    conflict: &PartialConflictEntry,
    engine: &EngineSession,
) -> Result<Option<String>, EngineError> {
    if source.family.name() != conflict.family.name()
        || source.suffix != conflict.suffix
        || !equal_variant_scope(&source.rule, &conflict.rule)
        || conflict.parts.len() >= source.parts.len()
        || !conflict
            .parts
            .iter()
            .all(|part| source.parts.contains(part))
    {
        return Ok(None);
    }
    let remaining = source
        .parts
        .iter()
        .copied()
        .filter(|part| !conflict.parts.contains(part))
        .collect::<Vec<_>>();
    let replacements = get_replacement_class_names(source, &remaining);
    if replacements.is_empty() || !validate_partial_replacement(&replacements, source, engine)? {
        return Ok(None);
    }
    Ok(Some(replacements.join(" ")))
}

fn find_partial_conflicts(
    descriptors: &[ClassDescriptor],
    engine: &EngineSession,
    variable_keys: &[String],
    variable_values: &HashMap<String, String>,
) -> Result<Vec<PartialClassConflictIr>, EngineError> {
    let mut entries = Vec::new();
    for descriptor in descriptors {
        let Some(mut entry) = create_partial_entry(descriptor) else {
            continue;
        };
        let parsed = parse_class_parts(&descriptor.class_name);
        canonicalize_partial_value(&mut entry, &parsed, engine, variable_keys, variable_values)?;
        entries.push(entry);
    }
    let mut conflicts = Vec::new();
    for (index, entry) in entries.iter().enumerate() {
        for compare in &entries[index + 1..] {
            let Some(replacement) = partial_conflict_replacement(entry, compare, engine)? else {
                continue;
            };
            conflicts.push(PartialClassConflictIr {
                class_name: entry.class_name.clone(),
                replacement,
                conflict: compare.class_name.clone(),
            });
            break;
        }
    }
    Ok(conflicts)
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
        {"id":"mx","name":"mx:","type":-1,"emit":{"type":"template","declarations":{"margin-right":null,"margin-left":null}},"matchers":[{"type":"key","keys":["mx"]}]},
        {"id":"ml","name":"ml:","type":-1,"emit":{"type":"property","property":"margin-left"},"matchers":[{"type":"key","keys":["ml"]}]},
        {"id":"mr","name":"mr:","type":-1,"emit":{"type":"property","property":"margin-right"},"matchers":[{"type":"key","keys":["mr"]}]},
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

        let partial = session
            .analyze(["mx:2px", "ml:3px"], None, &HashSet::new())
            .unwrap();
        assert_eq!(
            partial.partial_conflicts,
            [PartialClassConflictIr {
                class_name: "mx:2px".into(),
                replacement: "mr:2px".into(),
                conflict: "ml:3px".into(),
            }]
        );
    }
}
