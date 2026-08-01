use super::*;

pub(crate) fn custom_variant_branch(
    selector: &str,
    conditions: &[String],
    layer: Option<UtilityLayerName>,
) -> Value {
    let mut branch = serde_json::Map::new();
    if selector != "&" {
        branch.insert("selector".into(), Value::String(selector.to_owned()));
    }
    if !conditions.is_empty() {
        branch.insert(
            "conditions".into(),
            Value::Array(conditions.iter().cloned().map(Value::String).collect()),
        );
    }
    if let Some(layer) = layer {
        branch.insert(
            "layer".into(),
            serde_json::to_value(layer).expect("layer serializes"),
        );
    }
    Value::Object(branch)
}

pub(crate) fn collect_custom_variant_branches(
    rules: Vec<CssRule<'_>>,
    token: &str,
    selector: &str,
    conditions: &[String],
    layer: Option<UtilityLayerName>,
    filename: &str,
    branches: &mut Vec<Value>,
) -> Result<(), CompilerError> {
    for child in rules {
        match child {
            CssRule::Unknown(rule) if rule.name.eq_ignore_ascii_case("slot") => {
                if rule.block.is_some() || !rule.prelude.0.is_empty() {
                    return Err(CompilerError::Directive {
                        message: format!("@custom-variant {token} only accepts @slot statements"),
                        filename: filename.to_owned(),
                        range: None,
                    });
                }
                branches.push(custom_variant_branch(selector, conditions, layer));
            }
            CssRule::Style(style) => {
                if !collect_declarations(&style.declarations, filename)?.is_empty() {
                    return Err(CompilerError::Directive {
                        message: format!("@custom-variant {token} does not accept declarations"),
                        filename: filename.to_owned(),
                        range: None,
                    });
                }
                let selectors = printed_selectors(&style.selectors.0, filename)?;
                if selectors.iter().any(|selector| !selector.contains('&')) {
                    return Err(CompilerError::Directive {
                        message: format!(
                            "@custom-variant {token} selector value must include \"&\""
                        ),
                        filename: filename.to_owned(),
                        range: None,
                    });
                }
                for child_selector in selectors {
                    collect_custom_variant_branches(
                        style.rules.0.clone(),
                        token,
                        &child_selector.replace('&', selector),
                        conditions,
                        layer,
                        filename,
                        branches,
                    )?;
                }
            }
            CssRule::NestedDeclarations(declarations) => {
                if !collect_declarations(&declarations.declarations, filename)?.is_empty() {
                    return Err(CompilerError::Directive {
                        message: format!("@custom-variant {token} does not accept declarations"),
                        filename: filename.to_owned(),
                        range: None,
                    });
                }
            }
            CssRule::Media(media) => {
                let mut path = conditions.to_vec();
                path.push(format!("@media {}", minified_css(&media.query, filename)?));
                collect_custom_variant_branches(
                    media.rules.0,
                    token,
                    selector,
                    &path,
                    layer,
                    filename,
                    branches,
                )?;
            }
            CssRule::Supports(supports) => {
                let mut path = conditions.to_vec();
                path.push(format!(
                    "@supports {}",
                    minified_css(&supports.condition, filename)?
                ));
                collect_custom_variant_branches(
                    supports.rules.0,
                    token,
                    selector,
                    &path,
                    layer,
                    filename,
                    branches,
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
                let mut path = conditions.to_vec();
                path.push(format!("@container {}", prelude.join(" ")));
                collect_custom_variant_branches(
                    container.rules.0,
                    token,
                    selector,
                    &path,
                    layer,
                    filename,
                    branches,
                )?;
            }
            CssRule::StartingStyle(starting_style) => {
                let mut path = conditions.to_vec();
                path.push("@starting-style".into());
                collect_custom_variant_branches(
                    starting_style.rules.0,
                    token,
                    selector,
                    &path,
                    layer,
                    filename,
                    branches,
                )?;
            }
            CssRule::LayerBlock(layer_rule) => {
                let layer_name = layer_rule
                    .name
                    .as_ref()
                    .map(|name| minified_css(name, filename))
                    .transpose()?
                    .unwrap_or_default();
                let next_layer = match layer_name.as_str() {
                    "base" => UtilityLayerName::Base,
                    "defaults" => UtilityLayerName::Defaults,
                    "components" => UtilityLayerName::Components,
                    "utilities" => UtilityLayerName::Utilities,
                    _ => {
                        return Err(CompilerError::Directive {
                            message: format!(
                                "@custom-variant {token} only accepts Master CSS layers"
                            ),
                            filename: filename.to_owned(),
                            range: None,
                        });
                    }
                };
                if layer.is_some_and(|layer| layer != next_layer) {
                    return Err(CompilerError::Directive {
                        message: format!("@custom-variant {token} cannot assign multiple layers"),
                        filename: filename.to_owned(),
                        range: None,
                    });
                }
                collect_custom_variant_branches(
                    layer_rule.rules.0,
                    token,
                    selector,
                    conditions,
                    Some(next_layer),
                    filename,
                    branches,
                )?;
            }
            CssRule::Keyframes(_) => {
                return Err(CompilerError::Directive {
                    message: "@keyframes cannot be used inside @custom-variant".into(),
                    filename: filename.to_owned(),
                    range: None,
                });
            }
            CssRule::Unknown(rule) if rule.name.eq_ignore_ascii_case("custom-variant") => {
                return Err(CompilerError::Directive {
                    message: "@custom-variant cannot be nested inside @custom-variant".into(),
                    filename: filename.to_owned(),
                    range: None,
                });
            }
            CssRule::Unknown(rule) if rule.name.eq_ignore_ascii_case("variant") => {
                return Err(CompilerError::Directive {
                    message: "@variant cannot be used inside @custom-variant".into(),
                    filename: filename.to_owned(),
                    range: None,
                });
            }
            _ => {
                return Err(CompilerError::Directive {
                    message: format!("Unsupported rule inside @custom-variant {token}"),
                    filename: filename.to_owned(),
                    range: None,
                });
            }
        }
    }
    Ok(())
}

pub(crate) fn lower_custom_variant_rule(
    source: &str,
    filename: &str,
    rule: ThemeAtRule,
    manifest_input: &mut CssDirectiveManifestInput,
) -> Result<(), CompilerError> {
    let [name] = rule.prelude.parts.as_slice() else {
        return Err(directive_error(
            source,
            filename,
            rule.start_byte,
            "@custom-variant requires a full variant token",
        ));
    };
    let token = format!("@{name}");
    let body = rule.body.as_deref().ok_or_else(|| {
        directive_error(
            source,
            filename,
            rule.start_byte,
            format!("@custom-variant {token} requires a block body"),
        )
    })?;
    let stylesheet = StyleSheet::parse(
        body,
        ParserOptions {
            filename: filename.to_owned(),
            ..ParserOptions::default()
        },
    )
    .map_err(|error| directive_error(source, filename, rule.start_byte, error.to_string()))?;
    let mut branches = Vec::new();
    collect_custom_variant_branches(
        stylesheet.rules.0,
        &token,
        "&",
        &[],
        None,
        filename,
        &mut branches,
    )?;
    if branches.is_empty() {
        return Err(directive_error(
            source,
            filename,
            rule.start_byte,
            format!("@custom-variant {token} requires @slot"),
        ));
    }
    let mut definition = serde_json::Map::new();
    definition.insert("token".into(), Value::String(token.clone()));
    definition.insert("branches".into(), Value::Array(branches));
    let variants = manifest_input.variants.get_or_insert_default();
    if let Some(index) = variants
        .iter()
        .position(|variant| variant.get("token").and_then(Value::as_str) == Some(token.as_str()))
    {
        variants.remove(index);
    }
    variants.push(Value::Object(definition));
    Ok(())
}

pub(crate) fn byte_offset_for_location(source: &str, line: u32, column: u32) -> Option<usize> {
    let mut line_start = 0;
    for _ in 0..line {
        let newline = source[line_start..].find('\n')?;
        line_start += newline + 1;
    }
    let target = column.saturating_sub(1);
    let mut utf16_column = 0_u32;
    let mut byte_offset = line_start;
    for character in source[line_start..].chars() {
        if character == '\n' || utf16_column >= target {
            break;
        }
        let width = character.len_utf16() as u32;
        if utf16_column + width > target {
            return None;
        }
        utf16_column += width;
        byte_offset += character.len_utf8();
    }
    (utf16_column == target).then_some(byte_offset)
}

pub(crate) fn source_location(source: &str, byte_offset: usize) -> Option<SourceLocation> {
    let prefix = source.get(..byte_offset)?;
    let line = prefix.bytes().filter(|byte| *byte == b'\n').count() as u32 + 1;
    let line_start = prefix.rfind('\n').map_or(0, |index| index + 1);
    let column = source[line_start..byte_offset].encode_utf16().count() as u32 + 1;
    Some(SourceLocation { line, column })
}

pub(crate) fn selector_end_byte(source: &str, start: usize) -> Option<usize> {
    let mut index = start;
    let mut square_depth = 0_u32;
    let mut parenthesis_depth = 0_u32;
    while index < source.len() {
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
            '[' => square_depth += 1,
            ']' => square_depth = square_depth.saturating_sub(1),
            '(' => parenthesis_depth += 1,
            ')' => parenthesis_depth = parenthesis_depth.saturating_sub(1),
            '{' if square_depth == 0 && parenthesis_depth == 0 => {
                let mut end = index;
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
                return Some(end);
            }
            _ => {}
        }
        index = next_char_end(source, index);
    }
    None
}

pub(crate) fn selector_source_reference(
    source: &str,
    filename: &str,
    body: &str,
    body_start_byte: usize,
    line: u32,
    column: u32,
) -> Option<CssDirectiveSourceReference> {
    let local_start = byte_offset_for_location(body, line, column)?;
    let start = body_start_byte.checked_add(local_start)?;
    let end = selector_end_byte(source, start)?;
    Some(CssDirectiveSourceReference {
        file: Some(filename.to_owned()),
        range: SourceRange {
            start: byte_to_utf16_offset(source, start)?,
            end: byte_to_utf16_offset(source, end)?,
        },
        loc: Some(SourceLocationRange {
            start: source_location(source, start)?,
            end: source_location(source, end)?,
        }),
    })
}

pub(crate) fn source_reference_from_bytes(
    source: &str,
    filename: &str,
    start: usize,
    end: usize,
) -> Option<CssDirectiveSourceReference> {
    Some(CssDirectiveSourceReference {
        file: Some(filename.to_owned()),
        range: SourceRange {
            start: byte_to_utf16_offset(source, start)?,
            end: byte_to_utf16_offset(source, end)?,
        },
        loc: Some(SourceLocationRange {
            start: source_location(source, start)?,
            end: source_location(source, end)?,
        }),
    })
}

pub(crate) fn managed_selector_definition(
    selectors: &[Selector<'_>],
    filename: &str,
) -> Result<(String, String), CompilerError> {
    let selector_text = selectors
        .iter()
        .map(|selector| {
            selector.to_css_string(PrinterOptions {
                minify: true,
                ..PrinterOptions::default()
            })
        })
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| CompilerError::Print {
            message: error.to_string(),
            filename: filename.to_owned(),
        })?
        .join(",");
    let name = if let [selector] = selectors {
        let mut components = selector.iter_raw_match_order();
        match (components.next(), components.next()) {
            (Some(Component::LocalName(name)), None) => Some(name.name.0.to_string()),
            _ => None,
        }
    } else {
        None
    };
    name.map(|name| (name, "&".to_owned()))
        .ok_or_else(|| CompilerError::Directive {
            message: format!("Managed definition names must be bare identifiers: {selector_text}"),
            filename: filename.to_owned(),
            range: None,
        })
}

pub(crate) fn printed_selectors(
    selectors: &[Selector<'_>],
    filename: &str,
) -> Result<Vec<String>, CompilerError> {
    selectors
        .iter()
        .map(|selector| {
            selector
                .to_css_string(PrinterOptions {
                    minify: true,
                    ..PrinterOptions::default()
                })
                .map_err(|error| CompilerError::Print {
                    message: error.to_string(),
                    filename: filename.to_owned(),
                })
        })
        .collect()
}

pub(crate) fn combine_managed_selectors(parent: &[String], child: &[String]) -> Vec<String> {
    let mut selectors = Vec::with_capacity(parent.len() * child.len());
    for child in child {
        for parent in parent {
            selectors.push(if child.contains('&') {
                child.replace('&', parent)
            } else {
                format!("{parent} {child}")
            });
        }
    }
    selectors
}

pub(crate) fn rewrite_managed_variant_directives(source: &str) -> (String, HashMap<usize, String>) {
    let mut rewritten = source.to_owned();
    let mut variants = HashMap::new();
    let mut index = 0;
    while index < source.len() {
        let character = source[index..].chars().next().unwrap_or_default();
        if matches!(character, '\'' | '"') {
            index = css_quote_end(source, index, character);
            continue;
        }
        if source[index..].starts_with("/*") {
            index = css_comment_end(source, index);
            continue;
        }
        if source[index..].starts_with("@light")
            && source
                .as_bytes()
                .get(index + "@light".len())
                .is_none_or(|byte| !is_alias_character(*byte))
        {
            variants.insert(index, "@light".into());
            rewritten.replace_range(index..index + "@light".len(), "@media");
            index += "@light".len();
            continue;
        }
        if source[index..].starts_with("@dark")
            && source
                .as_bytes()
                .get(index + "@dark".len())
                .is_some_and(|byte| matches!(byte, b' ' | b'\t'))
        {
            variants.insert(index, "@dark".into());
            rewritten.replace_range(index..index + "@dark".len() + 1, "@media");
            index += "@dark".len() + 1;
            continue;
        }
        if source[index..].starts_with("@variant")
            && source
                .as_bytes()
                .get(index + "@variant".len())
                .is_none_or(|byte| !is_alias_character(*byte))
        {
            let mut token_start = index + "@variant".len();
            while source
                .as_bytes()
                .get(token_start)
                .is_some_and(u8::is_ascii_whitespace)
            {
                token_start += 1;
            }
            let mut token_end = token_start;
            while source
                .as_bytes()
                .get(token_end)
                .is_some_and(|byte| !byte.is_ascii_whitespace() && *byte != b'{')
            {
                token_end += 1;
            }
            if token_end > token_start {
                variants.insert(index, format!("@{}", &source[token_start..token_end]));
                rewritten.replace_range(index..index + "@variant".len(), "@media  ");
                rewritten
                    .replace_range(token_start..token_end, &"x".repeat(token_end - token_start));
            }
            index = token_end;
            continue;
        }
        index = next_char_end(source, index);
    }
    (rewritten, variants)
}

pub(crate) fn validate_condition_variant_syntax(
    source: &str,
    filename: &str,
) -> Result<(), CompilerError> {
    for (directive, message_for_at, message_for_selector) in [
        (
            "@custom-variant",
            "@custom-variant uses bare condition variant names",
            "@custom-variant only defines condition variants",
        ),
        (
            "@variant",
            "@variant only applies condition variants",
            "@variant only applies condition variants",
        ),
    ] {
        let mut start = 0;
        while start < source.len() {
            let character = source[start..].chars().next().unwrap_or_default();
            if matches!(character, '\'' | '"') {
                start = css_quote_end(source, start, character);
                continue;
            }
            if source[start..].starts_with("/*") {
                start = css_comment_end(source, start);
                continue;
            }
            if !source[start..].starts_with(directive) {
                start = next_char_end(source, start);
                continue;
            }
            let after_directive = start + directive.len();
            if source
                .as_bytes()
                .get(after_directive)
                .is_some_and(|byte| is_alias_character(*byte))
            {
                start = after_directive;
                continue;
            }
            let mut token_start = after_directive;
            while source
                .as_bytes()
                .get(token_start)
                .is_some_and(u8::is_ascii_whitespace)
            {
                token_start += 1;
            }
            match source.as_bytes().get(token_start) {
                Some(b'@') => {
                    return Err(directive_error(source, filename, start, message_for_at));
                }
                Some(b':') => {
                    return Err(directive_error(
                        source,
                        filename,
                        start,
                        message_for_selector,
                    ));
                }
                _ => {}
            }
            start = after_directive;
        }
    }
    Ok(())
}

pub(crate) fn validate_compose_syntax(source: &str, filename: &str) -> Result<(), CompilerError> {
    let mut index = 0;
    while index < source.len() {
        let character = source[index..].chars().next().unwrap_or_default();
        if matches!(character, '\'' | '"') {
            index = css_quote_end(source, index, character);
            continue;
        }
        if source[index..].starts_with("/*") {
            index = css_comment_end(source, index);
            continue;
        }
        if !source[index..].starts_with("@compose")
            || source
                .as_bytes()
                .get(index + "@compose".len())
                .is_some_and(|byte| is_alias_character(*byte))
        {
            index = next_char_end(source, index);
            continue;
        }
        index += "@compose".len();
        while source
            .as_bytes()
            .get(index)
            .is_some_and(u8::is_ascii_whitespace)
        {
            index += 1;
        }
        if source.as_bytes().get(index) == Some(&b'{') {
            let group_end = css_block_end(source, index, source.len())
                .map(|end| next_char_end(source, end))
                .unwrap_or(index + 1);
            return Err(ranged_directive_diagnostic(
                source,
                filename,
                index,
                group_end,
                ErrorCode::ComposeGroupSyntax,
                "@compose does not accept group syntax",
            ));
        }
        let mut cursor = index;
        while cursor < source.len() {
            let character = source[cursor..].chars().next().unwrap_or_default();
            if matches!(character, '\'' | '"') {
                let quote_end = css_quote_end(source, cursor, character);
                return Err(ranged_directive_diagnostic(
                    source,
                    filename,
                    cursor,
                    quote_end,
                    ErrorCode::ComposeQuotedSyntax,
                    "@compose only accepts unquoted class lists",
                ));
            }
            if source[cursor..].starts_with("/*") {
                cursor = css_comment_end(source, cursor);
                continue;
            }
            if character == ';' {
                index = cursor + 1;
                break;
            }
            cursor = next_char_end(source, cursor);
        }
        if cursor >= source.len() {
            index = cursor;
        }
    }
    Ok(())
}
