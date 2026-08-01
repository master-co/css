use super::*;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum PartialConflictFamily {
    Margin,
    Padding,
    Inset,
    Radius,
    BorderWidth,
    BorderColor,
    BorderStyle,
}

pub(crate) const PARTIAL_CONFLICT_FAMILIES: [PartialConflictFamily; 7] = [
    PartialConflictFamily::Margin,
    PartialConflictFamily::Padding,
    PartialConflictFamily::Inset,
    PartialConflictFamily::Radius,
    PartialConflictFamily::BorderWidth,
    PartialConflictFamily::BorderColor,
    PartialConflictFamily::BorderStyle,
];
pub(crate) const PHYSICAL_SIDES: [&str; 4] = ["top", "right", "bottom", "left"];
pub(crate) const RADIUS_CORNERS: [&str; 4] =
    ["top-left", "top-right", "bottom-right", "bottom-left"];

#[derive(Debug, Clone)]
pub(crate) struct ParsedClassParts {
    key: Option<String>,
    value: Option<String>,
    suffix: String,
}

#[derive(Debug, Clone)]
pub(crate) struct PartialConflictEntry {
    class_name: String,
    value: String,
    suffix: String,
    family: PartialConflictFamily,
    parts: Vec<&'static str>,
    rule: GeneratedRuleIr,
    declarations: Vec<(String, String)>,
}

impl PartialConflictFamily {
    pub(crate) fn name(self) -> &'static str {
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

    pub(crate) fn part_order(self) -> &'static [&'static str] {
        match self {
            Self::Radius => &RADIUS_CORNERS,
            _ => &PHYSICAL_SIDES,
        }
    }

    pub(crate) fn requires_property_match(self) -> bool {
        !matches!(self, Self::Margin | Self::Padding)
    }

    pub(crate) fn disallows_multi_value(self) -> bool {
        self.requires_property_match()
    }

    pub(crate) fn key_parts(self, key: &str) -> Option<&'static [&'static str]> {
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

    pub(crate) fn property_parts(self, property: &str) -> Option<&'static [&'static str]> {
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

    pub(crate) fn replacement_key(self, parts: &[&str]) -> Option<&'static str> {
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

    pub(crate) fn is_preferred_key(self, key: Option<&str>) -> bool {
        key.is_some_and(|key| match self {
            Self::Margin => matches!(key, "m" | "mx" | "my" | "mt" | "mr" | "mb" | "ml"),
            Self::Padding => matches!(key, "p" | "px" | "py" | "pt" | "pr" | "pb" | "pl"),
            Self::Inset => matches!(key, "inset" | "top" | "right" | "bottom" | "left"),
            Self::Radius => matches!(key, "r" | "rtl" | "rtr" | "rbr" | "rbl"),
            Self::BorderWidth | Self::BorderColor => matches!(key, "b" | "bt" | "br" | "bb" | "bl"),
            Self::BorderStyle => matches!(key, "b" | "bt" | "br" | "bb" | "bl"),
        })
    }

    pub(crate) fn format_replacement(self, key: &str, value: &str, suffix: &str) -> String {
        if self == Self::BorderStyle {
            format!("{key}-{value}{suffix}")
        } else {
            format!("{key}:{value}{suffix}")
        }
    }
}

pub(crate) fn border_property_parts(property: &str, kind: &str) -> Option<&'static [&'static str]> {
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

pub(crate) fn collect_manifest_variables(
    manifest_json: &str,
) -> (Vec<String>, HashMap<String, String>) {
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

pub(crate) fn ordered_part_key(family: PartialConflictFamily, parts: &[&str]) -> String {
    family
        .part_order()
        .iter()
        .filter(|part| parts.contains(part))
        .copied()
        .collect::<Vec<_>>()
        .join("|")
}

pub(crate) fn parts_equal(family: PartialConflictFamily, left: &[&str], right: &[&str]) -> bool {
    ordered_part_key(family, left) == ordered_part_key(family, right)
}

pub(crate) fn split_dynamic_value_state(value: &str) -> (String, String) {
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

pub(crate) fn find_top_level_state_start(value: &str) -> Option<usize> {
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

pub(crate) fn parse_class_parts(class_name: &str) -> ParsedClassParts {
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

pub(crate) fn has_top_level_multi_value(value: &str) -> bool {
    split_top_level(value, '|').len() > 1
}

pub(crate) fn create_partial_entry(descriptor: &ClassDescriptor) -> Option<PartialConflictEntry> {
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

pub(crate) fn canonicalize_partial_value(
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

pub(crate) fn normalize_css_variable_value(value: &str) -> String {
    if let Some(value) = value.strip_prefix("-.") {
        format!("-0.{value}")
    } else if let Some(value) = value.strip_prefix('.') {
        format!("0.{value}")
    } else {
        value.to_owned()
    }
}

pub(crate) fn candidate_resolves_to_declarations(
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

pub(crate) fn get_replacement_class_names(
    entry: &PartialConflictEntry,
    parts: &[&str],
) -> Vec<String> {
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

pub(crate) fn validate_partial_replacement(
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

pub(crate) fn partial_conflict_replacement(
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

pub(crate) fn find_partial_conflicts(
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
