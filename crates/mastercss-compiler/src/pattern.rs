use super::{
    CompilerError, CssDirectiveConditionPathEntry, HashMap, PrinterOptions, ToCss,
    UtilityLayerName, Value, css_comment_end, css_quote_end, next_char_end,
};

#[derive(Debug, Clone)]
pub(crate) enum ParsedManagedPattern {
    Token {
        name: String,
        prefix: String,
        variable_alias_refs: Vec<String>,
    },
    Pattern {
        name: String,
        prefix: String,
        values: Vec<String>,
        value_map: Option<serde_json::Map<String, Value>>,
    },
    Dynamic {
        name: String,
        key: String,
    },
}

impl ParsedManagedPattern {
    pub(crate) fn definition(&self, layer: UtilityLayerName) -> serde_json::Map<String, Value> {
        let mut definition = serde_json::Map::new();
        match self {
            Self::Token {
                name,
                prefix,
                variable_alias_refs,
            } => {
                definition.insert("name".into(), Value::String(name.clone()));
                definition.insert("type".into(), Value::String("token".into()));
                definition.insert(
                    "layer".into(),
                    serde_json::to_value(layer).expect("layer serializes"),
                );
                definition.insert(
                    "token".into(),
                    serde_json::json!({
                        "prefix": prefix,
                        "variableAliasRefs": variable_alias_refs,
                    }),
                );
            }
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
            Self::Dynamic { name, key } => {
                definition.insert("name".into(), Value::String(name.clone()));
                definition.insert("type".into(), Value::String("dynamic".into()));
                definition.insert(
                    "layer".into(),
                    serde_json::to_value(layer).expect("layer serializes"),
                );
                definition.insert("dynamic".into(), serde_json::json!({ "key": key }));
            }
        }
        definition
    }
}

/// Decode one CSS identifier, then reject delimiters belonging to Master or HTML.
pub(crate) fn utility_identifier(value: &str) -> Result<String, String> {
    mastercss_lexer::decode_utility_name(value).ok_or_else(|| format!("Invalid utility identifier {value}; use a CSS identifier without Master class delimiters"))
}

pub(crate) fn valid_pattern_token(value: &str, allow_leading_digit: bool) -> bool {
    utility_identifier(value).is_ok()
        || (allow_leading_digit && {
            let value = value.strip_prefix('-').unwrap_or(value);
            !value.is_empty()
                && value
                    .chars()
                    .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
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
    if !prefix.ends_with('-') || prefix == "-" || !suffix.is_empty() {
        return Err("Managed enum pattern must use a prefix before <...> and no suffix".into());
    }
    let prefix = format!("{}-", utility_identifier(&prefix[..prefix.len() - 1])?);
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
        let class_value = if valid_pattern_token(class_value, false) {
            utility_identifier(class_value)?
        } else {
            class_value.to_owned()
        };
        if values.contains(&class_value) {
            return Err(format!("Duplicate managed enum key: {class_value}"));
        }
        values.push(class_value.clone());
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
    let (prefix, sources, suffix) = managed_pattern_parts(pattern)?;
    let key = prefix
        .strip_suffix(':')
        .filter(|key| !key.is_empty())
        .ok_or("Raw utilities require key:<*> syntax")?;
    let key = utility_identifier(key)?;
    if sources.trim() != "*" || !suffix.is_empty() {
        return Err(format!(
            "Raw utility {key} requires {key}:<*>; typed sources and colon enums have been removed. Use prefix-<a|b> for named options or prefix-<~namespace> for tokens"
        ));
    }
    Ok(ParsedManagedPattern::Dynamic {
        name: format!("{key}:<*>"),
        key,
    })
}

pub(crate) fn parse_managed_pattern(pattern: &str) -> Result<ParsedManagedPattern, String> {
    let pattern = pattern.trim();
    if pattern.is_empty() {
        return Err("Managed pattern requires a name".into());
    }
    let (prefix, sources, suffix) = managed_pattern_parts(pattern)?;
    if prefix.ends_with(':') {
        parse_managed_dynamic_pattern(pattern)
    } else if sources
        .split('|')
        .any(|source| source.trim().starts_with(['~', '=']))
    {
        if !prefix.ends_with('-')
            || !suffix.is_empty()
            || !valid_pattern_token(&prefix[..prefix.len() - 1], false)
        {
            return Err("Named token patterns require prefix-<~namespace> syntax".into());
        }
        let prefix = format!("{}-", utility_identifier(&prefix[..prefix.len() - 1])?);
        let mut references = Vec::new();
        for source in sources.split('|').map(str::trim) {
            if !source.starts_with('~')
                || !valid_pattern_token(&source[1..], false)
                || source[1..].starts_with('-')
            {
                return Err("Named token patterns require ~namespace (the =namespace spelling was removed); define raw values in a separate key:<*> entry".into());
            }
            let source = format!("~{}", utility_identifier(&source[1..])?);
            if !references.contains(&source) {
                references.push(source);
            }
        }
        Ok(ParsedManagedPattern::Token {
            name: format!("{prefix}<{}>", references.join("|")),
            prefix: prefix.to_owned(),
            variable_alias_refs: references,
        })
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
