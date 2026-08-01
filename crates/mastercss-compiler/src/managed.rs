use super::*;

#[derive(Debug, Clone)]
pub(crate) struct ManagedStyleContext {
    name: String,
    selectors: Vec<String>,
    selector_source: Option<CssDirectiveSourceReference>,
}

pub(crate) fn push_managed_declarations(
    declarations: serde_json::Map<String, Value>,
    context: &ManagedStyleContext,
    condition_path: &[CssDirectiveConditionPathEntry],
    layer: UtilityLayerName,
    style_definitions: &mut Vec<CssDirectiveStyleDefinition>,
    style_order: &mut u32,
) {
    if declarations.is_empty() {
        return;
    }
    let (conditions, condition_path) = condition_properties(condition_path);
    *style_order += 1;
    style_definitions.push(CssDirectiveStyleDefinition::Native {
        order: *style_order,
        selector: context.selectors.join(","),
        declarations,
        source: None,
        selector_source: context.selector_source.clone(),
        conditions,
        condition_path,
        layer: Some(layer),
        name: Some(context.name.clone()),
    });
}

#[allow(clippy::too_many_arguments)]
pub(crate) fn lower_compose_rule(
    source: &str,
    filename: &str,
    body: &str,
    body_start_byte: usize,
    rule: UnknownAtRule<'_>,
    context: &ManagedStyleContext,
    condition_path: &[CssDirectiveConditionPathEntry],
    layer: UtilityLayerName,
    style_definitions: &mut Vec<CssDirectiveStyleDefinition>,
    style_order: &mut u32,
) -> Result<(), CompilerError> {
    if rule.block.is_some() {
        return Err(CompilerError::DirectiveDiagnostic {
            code: ErrorCode::ComposeGroupSyntax,
            message: "@compose does not accept group syntax".into(),
            filename: filename.to_owned(),
            range: None,
        });
    }
    let local_start =
        byte_offset_for_location(body, rule.loc.line, rule.loc.column).ok_or_else(|| {
            CompilerError::Directive {
                message: "Cannot resolve @compose source range".into(),
                filename: filename.to_owned(),
                range: None,
            }
        })?;
    let Some((semicolon, ';')) = css_statement_delimiter(body, local_start, body.len()) else {
        return Err(CompilerError::Directive {
            message: "@compose requires a semicolon".into(),
            filename: filename.to_owned(),
            range: None,
        });
    };
    let directive_end = semicolon + 1;
    let mut content_start = local_start + "@compose".len();
    while content_start < semicolon
        && body[content_start..]
            .chars()
            .next()
            .is_some_and(char::is_whitespace)
    {
        content_start = next_char_end(body, content_start);
    }
    let (_, content_end) = trim_byte_range(body, content_start, semicolon);
    let class_list = &body[content_start..content_end];
    if class_list.contains(['\'', '"']) {
        return Err(CompilerError::DirectiveDiagnostic {
            code: ErrorCode::ComposeQuotedSyntax,
            message: "@compose only accepts unquoted class lists".into(),
            filename: filename.to_owned(),
            range: None,
        });
    }
    let absolute_directive_start = body_start_byte + local_start;
    let directive_source = source_reference_from_bytes(
        source,
        filename,
        absolute_directive_start,
        body_start_byte + directive_end,
    );
    let (conditions, path) = condition_properties(condition_path);
    for token in collect_class_list_token_ranges(class_list) {
        if token.token.starts_with('{') {
            return Err(CompilerError::DirectiveDiagnostic {
                code: ErrorCode::ComposeGroupSyntax,
                message: "@compose does not accept group syntax".into(),
                filename: filename.to_owned(),
                range: None,
            });
        }
        let token_start = utf16_to_byte_offset(class_list, token.range.start)
            .expect("lexer ranges are valid UTF-16 boundaries");
        let token_end = utf16_to_byte_offset(class_list, token.range.end)
            .expect("lexer ranges are valid UTF-16 boundaries");
        *style_order += 1;
        style_definitions.push(CssDirectiveStyleDefinition::Compose {
            order: *style_order,
            class_name: token.token,
            selector: context.selectors.join(","),
            source: source_reference_from_bytes(
                source,
                filename,
                body_start_byte + content_start + token_start,
                body_start_byte + content_start + token_end,
            ),
            directive_source: directive_source.clone(),
            selector_source: context.selector_source.clone(),
            conditions: conditions.clone(),
            condition_path: path.clone(),
            layer: Some(layer),
            name: Some(context.name.clone()),
        });
    }
    Ok(())
}

#[allow(clippy::too_many_arguments)]
pub(crate) fn lower_managed_style(
    source: &str,
    filename: &str,
    body: &str,
    body_start_byte: usize,
    style: StyleRule<'_>,
    context: ManagedStyleContext,
    condition_path: &[CssDirectiveConditionPathEntry],
    variant_rule_offsets: &HashMap<usize, String>,
    pattern_rule_offsets: &HashMap<usize, ParsedManagedPattern>,
    layer: UtilityLayerName,
    class_names: &mut Vec<String>,
    manifest_input: &mut CssDirectiveManifestInput,
    style_definitions: &mut Vec<CssDirectiveStyleDefinition>,
    style_order: &mut u32,
) -> Result<(), CompilerError> {
    let mut declarations = collect_declarations(&style.declarations, filename)?;
    if let Some(start) = context
        .selector_source
        .as_ref()
        .and_then(|selector| utf16_to_byte_offset(source, selector.range.end))
    {
        preserve_compatible_literal_spelling(source, start, &mut declarations);
    }
    push_managed_declarations(
        declarations,
        &context,
        condition_path,
        layer,
        style_definitions,
        style_order,
    );
    lower_managed_rule_list(
        source,
        filename,
        body,
        body_start_byte,
        style.rules.0,
        Some(context),
        condition_path,
        variant_rule_offsets,
        pattern_rule_offsets,
        layer,
        class_names,
        manifest_input,
        style_definitions,
        style_order,
    )
}

#[allow(clippy::too_many_arguments)]
pub(crate) fn lower_managed_rule_list(
    source: &str,
    filename: &str,
    body: &str,
    body_start_byte: usize,
    rules: Vec<CssRule<'_>>,
    context: Option<ManagedStyleContext>,
    condition_path: &[CssDirectiveConditionPathEntry],
    variant_rule_offsets: &HashMap<usize, String>,
    pattern_rule_offsets: &HashMap<usize, ParsedManagedPattern>,
    layer: UtilityLayerName,
    class_names: &mut Vec<String>,
    manifest_input: &mut CssDirectiveManifestInput,
    style_definitions: &mut Vec<CssDirectiveStyleDefinition>,
    style_order: &mut u32,
) -> Result<(), CompilerError> {
    for child in rules {
        match child {
            CssRule::Style(child) => {
                let local_offset = byte_offset_for_location(body, child.loc.line, child.loc.column);
                if context.is_none()
                    && let Some(pattern) =
                        local_offset.and_then(|offset| pattern_rule_offsets.get(&offset))
                {
                    let mut definition = pattern.definition(layer);
                    lower_managed_pattern_style(
                        source,
                        filename,
                        body,
                        child,
                        &["&".into()],
                        condition_path,
                        variant_rule_offsets,
                        &mut definition,
                    )?;
                    manifest_input
                        .utilities
                        .get_or_insert_default()
                        .push(Value::Object(definition));
                    continue;
                }
                let next_context = if let Some(parent) = &context {
                    let child_selectors = printed_selectors(&child.selectors.0, filename)?;
                    ManagedStyleContext {
                        name: parent.name.clone(),
                        selectors: combine_managed_selectors(&parent.selectors, &child_selectors),
                        selector_source: selector_source_reference(
                            source,
                            filename,
                            body,
                            body_start_byte,
                            child.loc.line,
                            child.loc.column,
                        ),
                    }
                } else {
                    let (name, selector) =
                        managed_selector_definition(&child.selectors.0, filename)?;
                    if !class_names.contains(&name) {
                        class_names.push(name.clone());
                    }
                    ManagedStyleContext {
                        name,
                        selectors: vec![selector],
                        selector_source: selector_source_reference(
                            source,
                            filename,
                            body,
                            body_start_byte,
                            child.loc.line,
                            child.loc.column,
                        ),
                    }
                };
                lower_managed_style(
                    source,
                    filename,
                    body,
                    body_start_byte,
                    child,
                    next_context,
                    condition_path,
                    variant_rule_offsets,
                    pattern_rule_offsets,
                    layer,
                    class_names,
                    manifest_input,
                    style_definitions,
                    style_order,
                )?;
            }
            CssRule::NestedDeclarations(child) => {
                let Some(context) = &context else {
                    return Err(directive_error(
                        source,
                        filename,
                        body_start_byte,
                        "Managed definition directives only accept bare managed names and nested at-rules",
                    ));
                };
                let declarations = collect_declarations(&child.declarations, filename)?;
                push_managed_declarations(
                    declarations,
                    context,
                    condition_path,
                    layer,
                    style_definitions,
                    style_order,
                );
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
                lower_managed_rule_list(
                    source,
                    filename,
                    body,
                    body_start_byte,
                    media.rules.0,
                    context.clone(),
                    &path,
                    variant_rule_offsets,
                    pattern_rule_offsets,
                    layer,
                    class_names,
                    manifest_input,
                    style_definitions,
                    style_order,
                )?;
            }
            CssRule::Supports(supports) => {
                let mut path = condition_path.to_vec();
                path.push(CssDirectiveConditionPathEntry::Condition {
                    value: format!("@supports {}", minified_css(&supports.condition, filename)?),
                });
                lower_managed_rule_list(
                    source,
                    filename,
                    body,
                    body_start_byte,
                    supports.rules.0,
                    context.clone(),
                    &path,
                    variant_rule_offsets,
                    pattern_rule_offsets,
                    layer,
                    class_names,
                    manifest_input,
                    style_definitions,
                    style_order,
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
                lower_managed_rule_list(
                    source,
                    filename,
                    body,
                    body_start_byte,
                    container.rules.0,
                    context.clone(),
                    &path,
                    variant_rule_offsets,
                    pattern_rule_offsets,
                    layer,
                    class_names,
                    manifest_input,
                    style_definitions,
                    style_order,
                )?;
            }
            CssRule::StartingStyle(starting_style) => {
                let mut path = condition_path.to_vec();
                path.push(CssDirectiveConditionPathEntry::Condition {
                    value: "@starting-style".into(),
                });
                lower_managed_rule_list(
                    source,
                    filename,
                    body,
                    body_start_byte,
                    starting_style.rules.0,
                    context.clone(),
                    &path,
                    variant_rule_offsets,
                    pattern_rule_offsets,
                    layer,
                    class_names,
                    manifest_input,
                    style_definitions,
                    style_order,
                )?;
            }
            CssRule::Unknown(rule) if rule.name.eq_ignore_ascii_case("compose") => {
                let Some(context) = &context else {
                    return Err(CompilerError::Directive {
                        message: "@compose requires a style rule".into(),
                        filename: filename.to_owned(),
                        range: None,
                    });
                };
                lower_compose_rule(
                    source,
                    filename,
                    body,
                    body_start_byte,
                    rule,
                    context,
                    condition_path,
                    layer,
                    style_definitions,
                    style_order,
                )?;
            }
            CssRule::LayerBlock(_) => {
                return Err(directive_error(
                    source,
                    filename,
                    body_start_byte,
                    "Nested @layer blocks are not allowed inside managed definition directives",
                ));
            }
            CssRule::Keyframes(_) => {
                return Err(directive_error(
                    source,
                    filename,
                    body_start_byte,
                    "@keyframes is not allowed inside managed definition directives. Move managed animation definitions to top-level @theme.",
                ));
            }
            _ => {
                return Err(directive_error(
                    source,
                    filename,
                    body_start_byte,
                    "Unsupported rule inside managed definition directive",
                ));
            }
        }
    }
    Ok(())
}
