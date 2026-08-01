use super::*;

#[derive(Debug, Clone)]
pub(crate) enum ParsedManagedPattern {
    Pattern {
        name: String,
        prefix: String,
        values: Vec<String>,
        value_map: Option<serde_json::Map<String, Value>>,
    },
    Dynamic {
        name: String,
        key: String,
        variable_alias_refs: Vec<String>,
        kind: Option<String>,
        values: Vec<String>,
        arbitrary: bool,
    },
}

impl ParsedManagedPattern {
    pub(crate) fn definition(&self, layer: UtilityLayerName) -> serde_json::Map<String, Value> {
        let mut definition = serde_json::Map::new();
        match self {
            Self::Pattern {
                name,
                prefix,
                values,
                value_map,
            } => {
                definition.insert("name".into(), Value::String(name.clone()));
                definition.insert("type".into(), Value::String("pattern".into()));
                definition.insert(
                    "layer".into(),
                    serde_json::to_value(layer).expect("layer serializes"),
                );
                let mut pattern = serde_json::Map::new();
                pattern.insert("prefix".into(), Value::String(prefix.clone()));
                pattern.insert(
                    "values".into(),
                    Value::Array(values.iter().cloned().map(Value::String).collect()),
                );
                if let Some(value_map) = value_map {
                    pattern.insert("valueMap".into(), Value::Object(value_map.clone()));
                }
                definition.insert("pattern".into(), Value::Object(pattern));
            }
            Self::Dynamic {
                name,
                key,
                variable_alias_refs,
                kind,
                values,
                arbitrary,
            } => {
                definition.insert("name".into(), Value::String(name.clone()));
                definition.insert("type".into(), Value::String("dynamic".into()));
                definition.insert(
                    "layer".into(),
                    serde_json::to_value(layer).expect("layer serializes"),
                );
                let mut dynamic = serde_json::Map::new();
                dynamic.insert("key".into(), Value::String(key.clone()));
                if !variable_alias_refs.is_empty() {
                    dynamic.insert(
                        "variableAliasRefs".into(),
                        Value::Array(
                            variable_alias_refs
                                .iter()
                                .cloned()
                                .map(Value::String)
                                .collect(),
                        ),
                    );
                }
                if let Some(kind) = kind {
                    dynamic.insert("kind".into(), Value::String(kind.clone()));
                }
                if !values.is_empty() {
                    dynamic.insert(
                        "values".into(),
                        Value::Array(values.iter().cloned().map(Value::String).collect()),
                    );
                }
                if *arbitrary {
                    dynamic.insert("arbitrary".into(), Value::Bool(true));
                }
                definition.insert("dynamic".into(), Value::Object(dynamic));
            }
        }
        definition
    }
}

pub(crate) fn valid_pattern_token(value: &str, allow_leading_digit: bool) -> bool {
    let value = value.strip_prefix('-').unwrap_or(value);
    let mut characters = value.chars();
    let Some(first) = characters.next() else {
        return false;
    };
    let valid_first = first == '_'
        || first.is_ascii_alphabetic()
        || (allow_leading_digit && first.is_ascii_digit());
    valid_first
        && characters.all(|character| {
            character == '_' || character == '-' || character.is_ascii_alphanumeric()
        })
}

pub(crate) fn managed_pattern_parts(pattern: &str) -> Result<(&str, &str, &str), String> {
    let start = pattern
        .find('<')
        .ok_or_else(|| "Managed pattern must contain exactly one <...> segment".to_owned())?;
    let end = pattern
        .find('>')
        .ok_or_else(|| "Managed pattern must contain exactly one <...> segment".to_owned())?;
    if pattern[start + 1..].contains('<') || pattern[end + 1..].contains('>') || end < start {
        return Err("Managed pattern must contain exactly one <...> segment".into());
    }
    Ok((
        &pattern[..start],
        &pattern[start + 1..end],
        &pattern[end + 1..],
    ))
}

pub(crate) fn parse_managed_enum_pattern(pattern: &str) -> Result<ParsedManagedPattern, String> {
    let (prefix, raw_values, suffix) = managed_pattern_parts(pattern)?;
    if prefix.is_empty() || !suffix.is_empty() {
        return Err("Managed enum pattern must use a prefix before <...> and no suffix".into());
    }
    let raw_values = raw_values.trim();
    if raw_values.is_empty() {
        return Err("Managed enum pattern cannot be empty".into());
    }
    if raw_values.contains(',') {
        return Err(
            "Managed enum pattern values must use \"|\" separators like text-<left|right>".into(),
        );
    }
    let entries = raw_values.split('|').map(str::trim).collect::<Vec<_>>();
    if entries.len() < 2 || entries.iter().any(|value| value.is_empty()) {
        return Err("Managed enum pattern requires at least two values separated by \"|\"".into());
    }
    let mut values = Vec::with_capacity(entries.len());
    let mut value_map = serde_json::Map::new();
    let mut canonical = Vec::with_capacity(entries.len());
    let mut has_mapping = false;
    for entry in entries {
        let mut mapping = entry.split('=');
        let class_value = mapping.next().unwrap_or_default().trim();
        let emitted_value = mapping.next().map(str::trim).unwrap_or(class_value);
        if class_value.is_empty() || emitted_value.is_empty() || mapping.next().is_some() {
            return Err(format!("Invalid managed enum mapping: {entry}"));
        }
        if !valid_pattern_token(class_value, true) {
            return Err(format!("Invalid managed enum value: {class_value}"));
        }
        if !valid_pattern_token(emitted_value, true) {
            return Err(format!(
                "Invalid managed enum mapped value: {emitted_value}"
            ));
        }
        values.push(class_value.to_owned());
        value_map.insert(
            class_value.to_owned(),
            Value::String(emitted_value.to_owned()),
        );
        if entry.contains('=') {
            has_mapping = true;
            canonical.push(format!("{class_value}={emitted_value}"));
        } else {
            canonical.push(class_value.to_owned());
        }
    }
    Ok(ParsedManagedPattern::Pattern {
        name: format!("{prefix}<{}>", canonical.join("|")),
        prefix: prefix.to_owned(),
        values,
        value_map: has_mapping.then_some(value_map),
    })
}

pub(crate) fn parse_managed_dynamic_pattern(pattern: &str) -> Result<ParsedManagedPattern, String> {
    let (prefix, raw_values, suffix) = managed_pattern_parts(pattern)?;
    if !prefix.ends_with(':') || prefix == ":" || !suffix.is_empty() {
        return Err("Managed dynamic utilities must use key:<...> syntax".into());
    }
    let key = &prefix[..prefix.len() - 1];
    if !valid_pattern_token(key, false) {
        return Err(format!("Invalid managed dynamic utility key: {key}"));
    }
    let raw_values = raw_values.trim();
    if raw_values.is_empty() {
        return Err("Managed dynamic utility source list cannot be empty".into());
    }
    if raw_values.contains(',') {
        return Err("Managed dynamic utility source lists must use \"|\" separators like font:<~font-size|number>".into());
    }
    let entries = raw_values.split('|').map(str::trim).collect::<Vec<_>>();
    if entries.iter().any(|value| value.is_empty()) {
        return Err("Managed dynamic utility source list cannot contain empty entries".into());
    }
    let mut aliases = Vec::new();
    let mut canonical = Vec::new();
    let mut literal_values = Vec::new();
    let mut kind: Option<String> = None;
    let mut arbitrary = false;
    let add_unique = |values: &mut Vec<String>, value: &str| {
        if !values.iter().any(|existing| existing == value) {
            values.push(value.to_owned());
        }
    };
    for value in entries {
        if value.starts_with('~') || value.starts_with('=') {
            let namespace = &value[1..];
            if !valid_pattern_token(namespace, false) || namespace.starts_with('-') {
                return Err(format!(
                    "Invalid managed dynamic utility namespace: {value}"
                ));
            }
            add_unique(&mut aliases, value);
            add_unique(&mut canonical, value);
            continue;
        }
        if matches!(value, "number" | "color" | "image") {
            if kind.as_deref().is_some_and(|existing| existing != value) {
                return Err(
                    "Managed dynamic utilities only support one raw value kind per entry".into(),
                );
            }
            kind = Some(value.to_owned());
            if value == "color" {
                add_unique(&mut aliases, "~color");
                // The implicit color namespace is part of the canonical managed
                // pattern name as well as its matcher metadata. Keep it before
                // the raw `color` source to match JavaScript insertion order.
                add_unique(&mut canonical, "~color");
            }
            add_unique(&mut canonical, value);
            continue;
        }
        if value == "*" {
            arbitrary = true;
            add_unique(&mut canonical, value);
            continue;
        }
        if valid_pattern_token(value, true) {
            add_unique(&mut literal_values, value);
            add_unique(&mut canonical, value);
            continue;
        }
        return Err(format!(
            "Unsupported managed dynamic utility source: {value}"
        ));
    }
    if arbitrary && !literal_values.is_empty() {
        return Err("Managed dynamic utility wildcard cannot be combined with enum values".into());
    }
    if !literal_values.is_empty() {
        if !aliases.is_empty() {
            return Err(
                "Managed dynamic utility enum values cannot be combined with namespaces".into(),
            );
        }
        if kind.is_none() && literal_values.len() < 2 {
            return Err("Managed dynamic utility enum source requires at least two values separated by \"|\"".into());
        }
    }
    Ok(ParsedManagedPattern::Dynamic {
        name: format!("{key}:<{}>", canonical.join("|")),
        key: key.to_owned(),
        variable_alias_refs: aliases,
        kind,
        values: literal_values,
        arbitrary,
    })
}

pub(crate) fn parse_managed_pattern(pattern: &str) -> Result<ParsedManagedPattern, String> {
    let pattern = pattern.trim();
    if pattern.is_empty() {
        return Err("Managed pattern requires a name".into());
    }
    let (prefix, _, _) = managed_pattern_parts(pattern)?;
    if prefix.ends_with(':') {
        parse_managed_dynamic_pattern(pattern)
    } else {
        parse_managed_enum_pattern(pattern)
    }
}

pub(crate) fn css_block_end(source: &str, open: usize, limit: usize) -> Option<usize> {
    let mut index = open + 1;
    let mut depth = 1_u32;
    while index < limit {
        let character = source[index..].chars().next()?;
        if matches!(character, '\'' | '"') {
            index = css_quote_end(source, index, character);
            continue;
        }
        if source[index..].starts_with("/*") {
            index = css_comment_end(source, index);
            continue;
        }
        match character {
            '{' => depth += 1,
            '}' => {
                depth -= 1;
                if depth == 0 {
                    return Some(index);
                }
            }
            _ => {}
        }
        index = next_char_end(source, index);
    }
    None
}

pub(crate) fn css_statement_delimiter(
    source: &str,
    start: usize,
    limit: usize,
) -> Option<(usize, char)> {
    let mut index = start;
    let mut parentheses = 0_u32;
    let mut square = 0_u32;
    while index < limit {
        let character = source[index..].chars().next()?;
        if matches!(character, '\'' | '"') {
            index = css_quote_end(source, index, character);
            continue;
        }
        if source[index..].starts_with("/*") {
            index = css_comment_end(source, index);
            continue;
        }
        match character {
            '(' => parentheses += 1,
            ')' => parentheses = parentheses.saturating_sub(1),
            '[' => square += 1,
            ']' => square = square.saturating_sub(1),
            ';' | '{' if parentheses == 0 && square == 0 => return Some((index, character)),
            _ => {}
        }
        index = next_char_end(source, index);
    }
    None
}

pub(crate) fn skip_css_trivia(source: &str, mut index: usize, limit: usize) -> usize {
    while index < limit {
        let before = index;
        while source[index..]
            .chars()
            .next()
            .is_some_and(char::is_whitespace)
        {
            index = next_char_end(source, index);
        }
        if index < limit && source[index..].starts_with("/*") {
            index = css_comment_end(source, index).min(limit);
        }
        if index == before {
            break;
        }
    }
    index
}

pub(crate) fn trim_byte_range(source: &str, mut start: usize, mut end: usize) -> (usize, usize) {
    while start < end
        && source[start..]
            .chars()
            .next()
            .is_some_and(char::is_whitespace)
    {
        start = next_char_end(source, start);
    }
    while end > start
        && source[..end]
            .chars()
            .next_back()
            .is_some_and(char::is_whitespace)
    {
        end -= source[..end]
            .chars()
            .next_back()
            .map(char::len_utf8)
            .unwrap_or_default();
    }
    (start, end)
}

pub(crate) fn collect_managed_pattern_masks(
    source: &str,
    start: usize,
    end: usize,
    rewritten: &mut String,
    patterns: &mut HashMap<usize, ParsedManagedPattern>,
) -> Result<(), String> {
    let mut index = start;
    while index < end {
        index = skip_css_trivia(source, index, end);
        if index >= end {
            break;
        }
        let Some((delimiter, kind)) = css_statement_delimiter(source, index, end) else {
            break;
        };
        if kind == ';' {
            index = delimiter + 1;
            continue;
        }
        let close = css_block_end(source, delimiter, end).unwrap_or(end.saturating_sub(1));
        let (name_start, name_end) = trim_byte_range(source, index, delimiter);
        let name = &source[name_start..name_end];
        if name.starts_with('@') {
            collect_managed_pattern_masks(source, delimiter + 1, close, rewritten, patterns)?;
        } else if name.contains('<') || name.contains('>') {
            let pattern = parse_managed_pattern(name)?;
            let mask = format!("m{}", "_".repeat(name_end.saturating_sub(name_start + 1)));
            rewritten.replace_range(name_start..name_end, &mask);
            patterns.insert(name_start, pattern);
        }
        index = close.saturating_add(1);
    }
    Ok(())
}

pub(crate) fn mask_managed_pattern_names(
    source: &str,
) -> Result<(String, HashMap<usize, ParsedManagedPattern>), String> {
    let mut rewritten = source.to_owned();
    let mut patterns = HashMap::new();
    collect_managed_pattern_masks(source, 0, source.len(), &mut rewritten, &mut patterns)?;
    Ok((rewritten, patterns))
}

pub(crate) fn minified_css<T: ToCss>(value: &T, filename: &str) -> Result<String, CompilerError> {
    value
        .to_css_string(PrinterOptions {
            minify: true,
            ..PrinterOptions::default()
        })
        .map_err(|error| CompilerError::Print {
            message: error.to_string(),
            filename: filename.to_owned(),
        })
}

pub(crate) fn condition_properties(
    path: &[CssDirectiveConditionPathEntry],
) -> (
    Option<Vec<String>>,
    Option<Vec<CssDirectiveConditionPathEntry>>,
) {
    if path.is_empty() {
        return (None, None);
    }
    let conditions = path
        .iter()
        .map(|entry| match entry {
            CssDirectiveConditionPathEntry::Condition { value } => Some(value.clone()),
            CssDirectiveConditionPathEntry::Variant { .. } => None,
        })
        .collect::<Option<Vec<_>>>();
    (conditions, Some(path.to_vec()))
}

pub(crate) fn insert_condition_properties(
    object: &mut serde_json::Map<String, Value>,
    condition_path: &[CssDirectiveConditionPathEntry],
) {
    let (conditions, path) = condition_properties(condition_path);
    if let Some(conditions) = conditions {
        object.insert(
            "conditions".into(),
            Value::Array(conditions.into_iter().map(Value::String).collect()),
        );
    }
    if let Some(path) = path {
        object.insert(
            "conditionPath".into(),
            serde_json::to_value(path).expect("condition path serializes"),
        );
    }
}

pub(crate) fn push_pattern_declarations(
    definition: &mut serde_json::Map<String, Value>,
    declarations: serde_json::Map<String, Value>,
    selector: &str,
    condition_path: &[CssDirectiveConditionPathEntry],
) {
    if declarations.is_empty() {
        return;
    }
    let can_inline = selector == "&"
        && condition_path.is_empty()
        && !definition.contains_key("declarations")
        && !definition.contains_key("rules");
    if can_inline {
        definition.insert("declarations".into(), Value::Object(declarations));
        return;
    }

    let previous = definition.remove("declarations");
    let rules = definition
        .entry("rules")
        .or_insert_with(|| Value::Array(Vec::new()))
        .as_array_mut()
        .expect("pattern rules are an array");
    if let Some(previous) = previous {
        let mut rule = serde_json::Map::new();
        rule.insert("declarations".into(), previous);
        rules.push(Value::Object(rule));
    }
    let mut rule = serde_json::Map::new();
    rule.insert("declarations".into(), Value::Object(declarations));
    if selector != "&" {
        rule.insert("selector".into(), Value::String(selector.to_owned()));
    }
    insert_condition_properties(&mut rule, condition_path);
    rules.push(Value::Object(rule));
}

#[allow(clippy::too_many_arguments)]
pub(crate) fn lower_managed_pattern_rule_list(
    source: &str,
    filename: &str,
    body: &str,
    rules: Vec<CssRule<'_>>,
    selectors: &[String],
    condition_path: &[CssDirectiveConditionPathEntry],
    variant_rule_offsets: &HashMap<usize, String>,
    definition: &mut serde_json::Map<String, Value>,
) -> Result<(), CompilerError> {
    for child in rules {
        match child {
            CssRule::Style(child) => {
                let child_selectors = printed_selectors(&child.selectors.0, filename)?;
                let combined = combine_managed_selectors(selectors, &child_selectors);
                lower_managed_pattern_style(
                    source,
                    filename,
                    body,
                    child,
                    &combined,
                    condition_path,
                    variant_rule_offsets,
                    definition,
                )?;
            }
            CssRule::NestedDeclarations(child) => {
                let declarations = collect_declarations(&child.declarations, filename)?;
                for selector in selectors {
                    push_pattern_declarations(
                        definition,
                        declarations.clone(),
                        selector,
                        condition_path,
                    );
                }
            }
            CssRule::Media(media) => {
                let mut path = condition_path.to_vec();
                let local_offset = byte_offset_for_location(body, media.loc.line, media.loc.column);
                if let Some(token) =
                    local_offset.and_then(|offset| variant_rule_offsets.get(&offset))
                {
                    path.push(CssDirectiveConditionPathEntry::Variant {
                        token: token.clone(),
                    });
                } else {
                    path.push(CssDirectiveConditionPathEntry::Condition {
                        value: format!("@media {}", minified_css(&media.query, filename)?),
                    });
                }
                lower_managed_pattern_rule_list(
                    source,
                    filename,
                    body,
                    media.rules.0,
                    selectors,
                    &path,
                    variant_rule_offsets,
                    definition,
                )?;
            }
            CssRule::Supports(supports) => {
                let mut path = condition_path.to_vec();
                path.push(CssDirectiveConditionPathEntry::Condition {
                    value: format!("@supports {}", minified_css(&supports.condition, filename)?),
                });
                lower_managed_pattern_rule_list(
                    source,
                    filename,
                    body,
                    supports.rules.0,
                    selectors,
                    &path,
                    variant_rule_offsets,
                    definition,
                )?;
            }
            CssRule::Container(container) => {
                let mut prelude = Vec::new();
                if let Some(name) = &container.name {
                    prelude.push(minified_css(name, filename)?);
                }
                if let Some(condition) = &container.condition {
                    prelude.push(minified_css(condition, filename)?);
                }
                let mut path = condition_path.to_vec();
                path.push(CssDirectiveConditionPathEntry::Condition {
                    value: format!("@container {}", prelude.join(" ")),
                });
                lower_managed_pattern_rule_list(
                    source,
                    filename,
                    body,
                    container.rules.0,
                    selectors,
                    &path,
                    variant_rule_offsets,
                    definition,
                )?;
            }
            CssRule::StartingStyle(starting_style) => {
                let mut path = condition_path.to_vec();
                path.push(CssDirectiveConditionPathEntry::Condition {
                    value: "@starting-style".into(),
                });
                lower_managed_pattern_rule_list(
                    source,
                    filename,
                    body,
                    starting_style.rules.0,
                    selectors,
                    &path,
                    variant_rule_offsets,
                    definition,
                )?;
            }
            CssRule::Unknown(rule) if rule.name.eq_ignore_ascii_case("compose") => {
                return Err(CompilerError::Directive {
                    message: "@compose is not supported inside managed pattern definitions".into(),
                    filename: filename.to_owned(),
                    range: None,
                });
            }
            CssRule::LayerBlock(_) => {
                return Err(CompilerError::Directive {
                    message:
                        "Nested @layer blocks are not allowed inside managed pattern definitions"
                            .into(),
                    filename: filename.to_owned(),
                    range: None,
                });
            }
            CssRule::Keyframes(_) => {
                return Err(CompilerError::Directive {
                    message: "@keyframes is not allowed inside managed pattern definitions. Move managed animation definitions to top-level @theme.".into(),
                    filename: filename.to_owned(),
                    range: None,
                });
            }
            _ => {
                return Err(CompilerError::Directive {
                    message: "Managed pattern definitions only accept declarations, nested selectors, and nested at-rules".into(),
                    filename: filename.to_owned(),
                    range: None,
                });
            }
        }
    }
    Ok(())
}

#[allow(clippy::too_many_arguments)]
pub(crate) fn lower_managed_pattern_style(
    source: &str,
    filename: &str,
    body: &str,
    style: StyleRule<'_>,
    selectors: &[String],
    condition_path: &[CssDirectiveConditionPathEntry],
    variant_rule_offsets: &HashMap<usize, String>,
    definition: &mut serde_json::Map<String, Value>,
) -> Result<(), CompilerError> {
    let mut declarations = collect_declarations(&style.declarations, filename)?;
    if let Some(start) = byte_offset_for_location(body, style.loc.line, style.loc.column) {
        preserve_compatible_literal_spelling(body, start, &mut declarations);
    }
    for selector in selectors {
        push_pattern_declarations(definition, declarations.clone(), selector, condition_path);
    }
    lower_managed_pattern_rule_list(
        source,
        filename,
        body,
        style.rules.0,
        selectors,
        condition_path,
        variant_rule_offsets,
        definition,
    )
}
