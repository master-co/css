use super::{
    CompilerError, Component, CssDirectiveManifestInput, CssDirectiveSourceReference, CssRule,
    ErrorCode, HashMap, ParserOptions, PrinterOptions, Selector, SourceLocation,
    SourceLocationRange, SourceRange, StyleSheet, ThemeAtRule, ToCss, UtilityLayerName, Value,
    byte_to_utf16_offset, collect_declarations, css_comment_end, css_quote_end, directive_error,
    minified_css, next_char_end, ranged_directive_diagnostic,
};

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
                if selectors.iter().any(|selector| {
                    mastercss_lexer::replace_nesting_selector(selector, "").is_none()
                }) {
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
                        &mastercss_lexer::replace_nesting_selector(&child_selector, selector)
                            .unwrap_or_else(|| child_selector.to_owned()),
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
            selectors.push(
                mastercss_lexer::replace_nesting_selector(child, parent)
                    .unwrap_or_else(|| format!("{parent} {child}")),
            );
        }
    }
    selectors
}

pub(crate) fn rewrite_managed_variant_directives(source: &str) -> (String, HashMap<usize, String>) {
    use mastercss_lexer::{CssSyntaxKind, collect_css_syntax_statements, tokenize_css_syntax};
    let tokens = tokenize_css_syntax(source);
    let mut rewritten = source.as_bytes().to_vec();
    let mut variants = HashMap::new();
    for statement in collect_css_syntax_statements(&tokens) {
        let prelude = &tokens[statement.tokens.clone()];
        let [first, name] = prelude else { continue };
        if !matches!(&first.kind, CssSyntaxKind::AtKeyword(value) if value.eq_ignore_ascii_case("variant"))
        {
            continue;
        }
        let CssSyntaxKind::Ident(name) = &name.kind else {
            continue;
        };
        variants.insert(first.bytes.start, format!("@{name}"));
        let end = prelude.last().expect("prelude").bytes.end;
        for byte in &mut rewritten[first.bytes.start..end] {
            if !matches!(*byte, b'\r' | b'\n') {
                *byte = b' ';
            }
        }
        rewritten[first.bytes.start..first.bytes.start + 6].copy_from_slice(b"@media");
        // An empty @media is accepted by Lightning CSS as an unconditional
        // wrapper; the source offset records the named variant to apply.
    }
    (String::from_utf8(rewritten).expect("masked CSS"), variants)
}

pub(crate) fn validate_condition_variant_syntax(
    source: &str,
    filename: &str,
) -> Result<(), CompilerError> {
    use mastercss_lexer::{CssSyntaxKind, collect_css_syntax_statements, tokenize_css_syntax};
    let tokens = tokenize_css_syntax(source);
    let statements = collect_css_syntax_statements(&tokens);
    for statement in &statements {
        let prelude = &tokens[statement.tokens.clone()];
        let Some(first) = prelude.first() else {
            continue;
        };
        let CssSyntaxKind::AtKeyword(name) = &first.kind else {
            continue;
        };
        if !name.eq_ignore_ascii_case("variant") && !name.eq_ignore_ascii_case("custom-variant") {
            continue;
        }
        if !statement.has_block
            || prelude.len() != 2
            || !matches!(prelude[1].kind, CssSyntaxKind::Ident(_))
        {
            return Err(directive_error(
                source,
                filename,
                first.bytes.start,
                format!(
                    "@{name} requires one named condition and a block; use native @media, @supports or @container for queries"
                ),
            ));
        }
        if name.eq_ignore_ascii_case("variant") {
            let mut parent = statement.parent;
            let mut style = false;
            while let Some(index) = parent {
                let ancestor = &statements[index];
                match &tokens[ancestor.tokens.start].kind {
                    CssSyntaxKind::AtKeyword(name) if name.eq_ignore_ascii_case("theme") => {
                        return Err(directive_error(
                            source,
                            filename,
                            first.bytes.start,
                            "@theme requires native conditions; @variant is not supported inside @theme",
                        ));
                    }
                    CssSyntaxKind::AtKeyword(name) if name.eq_ignore_ascii_case("utility") => {
                        style = true
                    }
                    CssSyntaxKind::AtKeyword(_) => {}
                    _ => style = true,
                }
                parent = ancestor.parent;
            }
            if !style {
                return Err(directive_error(
                    source,
                    filename,
                    first.bytes.start,
                    "@variant must be inside a style rule or @utility",
                ));
            }
        }
    }
    Ok(())
}

pub(crate) fn reject_removed_directives(source: &str, filename: &str) -> Result<(), CompilerError> {
    use mastercss_lexer::{CssSyntaxKind, collect_css_syntax_statements, tokenize_css_syntax};
    let tokens = tokenize_css_syntax(source);
    for statement in collect_css_syntax_statements(&tokens) {
        let Some(token) = tokens.get(statement.tokens.start) else {
            continue;
        };
        if let CssSyntaxKind::AtKeyword(name) = &token.kind {
            let message = match name.to_ascii_lowercase().as_str() {
                "master" => Some(
                    "@master entry has been removed; use @import \"@master/css\" for a project entry",
                ),
                "settings" => Some(
                    "@settings has been removed; use per-class ! for important and native selectors for scope",
                ),
                "mode" => Some(
                    "@mode has been removed; author explicit native selectors and conditions in @theme and use @custom-variant for named conditions",
                ),
                "utilities" => Some(
                    "@utilities has been removed; use one @utility name { ... } per definition",
                ),
                "dark" | "light" => Some(
                    "@dark and @light blocks have been removed; use @variant dark or @variant light with a named custom variant",
                ),
                _ => None,
            };
            if let Some(message) = message {
                return Err(ranged_directive_diagnostic(
                    source,
                    filename,
                    token.bytes.start,
                    token.bytes.end,
                    ErrorCode::CssDirectiveError,
                    message,
                ));
            }
        }
        if matches!(&token.kind, CssSyntaxKind::AtKeyword(name) if name.eq_ignore_ascii_case("compose"))
        {
            return Err(ranged_directive_diagnostic(
                source,
                filename,
                token.bytes.start,
                token.bytes.end,
                ErrorCode::RemovedComposeDirective,
                "@compose has been removed; use native CSS declarations and selectors, or use utilities directly in markup",
            ));
        }
    }
    Ok(())
}
