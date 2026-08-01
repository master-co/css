use super::*;

#[derive(Debug, Clone)]
pub(crate) struct NativeStyleContext {
    pub(crate) selectors: Vec<String>,
    pub(crate) selector_source: Option<CssDirectiveSourceReference>,
}

pub(crate) fn native_rule_list_has_directives(
    source: &str,
    rules: &[CssRule<'_, ThemeAtRule>],
    variant_rule_offsets: &HashMap<usize, String>,
) -> bool {
    rules.iter().any(|rule| match rule {
        CssRule::Unknown(rule) => rule.name.eq_ignore_ascii_case("compose"),
        CssRule::Style(rule) => {
            native_rule_list_has_directives(source, &rule.rules.0, variant_rule_offsets)
        }
        CssRule::Media(rule) => {
            byte_offset_for_location(source, rule.loc.line, rule.loc.column)
                .is_some_and(|offset| variant_rule_offsets.contains_key(&offset))
                || native_rule_list_has_directives(source, &rule.rules.0, variant_rule_offsets)
        }
        CssRule::Supports(rule) => {
            native_rule_list_has_directives(source, &rule.rules.0, variant_rule_offsets)
        }
        CssRule::Container(rule) => {
            native_rule_list_has_directives(source, &rule.rules.0, variant_rule_offsets)
        }
        CssRule::StartingStyle(rule) => {
            native_rule_list_has_directives(source, &rule.rules.0, variant_rule_offsets)
        }
        _ => false,
    })
}

pub(crate) fn push_native_style_declarations(
    declarations: serde_json::Map<String, Value>,
    context: &NativeStyleContext,
    condition_path: &[CssDirectiveConditionPathEntry],
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
        layer: None,
        name: None,
    });
}

#[allow(clippy::too_many_arguments)]
pub(crate) fn lower_native_compose_rule(
    source: &str,
    filename: &str,
    rewritten_source: &str,
    rule: UnknownAtRule<'_>,
    context: &NativeStyleContext,
    condition_path: &[CssDirectiveConditionPathEntry],
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
    let local_start = byte_offset_for_location(rewritten_source, rule.loc.line, rule.loc.column)
        .ok_or_else(|| CompilerError::Directive {
            message: "Cannot resolve @compose source range".into(),
            filename: filename.to_owned(),
            range: None,
        })?;
    let Some((semicolon, ';')) =
        css_statement_delimiter(rewritten_source, local_start, rewritten_source.len())
    else {
        return Err(CompilerError::Directive {
            message: "@compose requires a semicolon".into(),
            filename: filename.to_owned(),
            range: None,
        });
    };
    let directive_end = semicolon + 1;
    let mut content_start = local_start + "@compose".len();
    while content_start < semicolon
        && rewritten_source[content_start..]
            .chars()
            .next()
            .is_some_and(char::is_whitespace)
    {
        content_start = next_char_end(rewritten_source, content_start);
    }
    let (_, content_end) = trim_byte_range(rewritten_source, content_start, semicolon);
    let class_list = &rewritten_source[content_start..content_end];
    if class_list.contains(['\'', '"']) {
        return Err(CompilerError::DirectiveDiagnostic {
            code: ErrorCode::ComposeQuotedSyntax,
            message: "@compose only accepts unquoted class lists".into(),
            filename: filename.to_owned(),
            range: None,
        });
    }
    let directive_source =
        source_reference_from_bytes(source, filename, local_start, directive_end);
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
                content_start + token_start,
                content_start + token_end,
            ),
            directive_source: directive_source.clone(),
            selector_source: context.selector_source.clone(),
            conditions: conditions.clone(),
            condition_path: path.clone(),
            layer: None,
            name: None,
        });
    }
    Ok(())
}

#[allow(clippy::too_many_arguments)]
pub(crate) fn lower_native_style_rule(
    source: &str,
    filename: &str,
    rewritten_source: &str,
    style: StyleRule<'_, ThemeAtRule>,
    context: NativeStyleContext,
    condition_path: &[CssDirectiveConditionPathEntry],
    variant_rule_offsets: &HashMap<usize, String>,
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
    push_native_style_declarations(
        declarations,
        &context,
        condition_path,
        style_definitions,
        style_order,
    );
    lower_native_rule_list(
        source,
        filename,
        rewritten_source,
        style.rules.0,
        Some(context),
        condition_path,
        variant_rule_offsets,
        style_definitions,
        style_order,
    )
}

#[allow(clippy::too_many_arguments)]
pub(crate) fn lower_native_rule_list(
    source: &str,
    filename: &str,
    rewritten_source: &str,
    rules: Vec<CssRule<'_, ThemeAtRule>>,
    context: Option<NativeStyleContext>,
    condition_path: &[CssDirectiveConditionPathEntry],
    variant_rule_offsets: &HashMap<usize, String>,
    style_definitions: &mut Vec<CssDirectiveStyleDefinition>,
    style_order: &mut u32,
) -> Result<(), CompilerError> {
    for child in rules {
        match child {
            CssRule::Style(child) => {
                let child_selectors = printed_selectors(&child.selectors.0, filename)?;
                let selectors = context
                    .as_ref()
                    .map(|parent| combine_managed_selectors(&parent.selectors, &child_selectors))
                    .unwrap_or(child_selectors);
                let next_context = NativeStyleContext {
                    selectors,
                    selector_source: selector_source_reference(
                        source,
                        filename,
                        rewritten_source,
                        0,
                        child.loc.line,
                        child.loc.column,
                    )
                    .or_else(|| {
                        context
                            .as_ref()
                            .and_then(|parent| parent.selector_source.clone())
                    }),
                };
                lower_native_style_rule(
                    source,
                    filename,
                    rewritten_source,
                    child,
                    next_context,
                    condition_path,
                    variant_rule_offsets,
                    style_definitions,
                    style_order,
                )?;
            }
            CssRule::NestedDeclarations(child) => {
                let Some(context) = &context else {
                    return Err(CompilerError::Directive {
                        message: "Native @variant blocks only accept style rules, declarations, @compose, and nested at-rules".into(),
                        filename: filename.to_owned(),
                        range: None,
                    });
                };
                push_native_style_declarations(
                    collect_declarations(&child.declarations, filename)?,
                    context,
                    condition_path,
                    style_definitions,
                    style_order,
                );
            }
            CssRule::Media(media) => {
                let mut path = condition_path.to_vec();
                let local_offset =
                    byte_offset_for_location(rewritten_source, media.loc.line, media.loc.column);
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
                lower_native_rule_list(
                    source,
                    filename,
                    rewritten_source,
                    media.rules.0,
                    context.clone(),
                    &path,
                    variant_rule_offsets,
                    style_definitions,
                    style_order,
                )?;
            }
            CssRule::Supports(supports) => {
                let mut path = condition_path.to_vec();
                path.push(CssDirectiveConditionPathEntry::Condition {
                    value: format!("@supports {}", minified_css(&supports.condition, filename)?),
                });
                lower_native_rule_list(
                    source,
                    filename,
                    rewritten_source,
                    supports.rules.0,
                    context.clone(),
                    &path,
                    variant_rule_offsets,
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
                lower_native_rule_list(
                    source,
                    filename,
                    rewritten_source,
                    container.rules.0,
                    context.clone(),
                    &path,
                    variant_rule_offsets,
                    style_definitions,
                    style_order,
                )?;
            }
            CssRule::StartingStyle(starting_style) => {
                let mut path = condition_path.to_vec();
                path.push(CssDirectiveConditionPathEntry::Condition {
                    value: "@starting-style".into(),
                });
                lower_native_rule_list(
                    source,
                    filename,
                    rewritten_source,
                    starting_style.rules.0,
                    context.clone(),
                    &path,
                    variant_rule_offsets,
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
                lower_native_compose_rule(
                    source,
                    filename,
                    rewritten_source,
                    rule,
                    context,
                    condition_path,
                    style_definitions,
                    style_order,
                )?;
            }
            _ => {
                return Err(CompilerError::Directive {
                    message: "Native CSS rules only accept declarations, @compose, nested selectors, and nested at-rules".into(),
                    filename: filename.to_owned(),
                    range: None,
                });
            }
        }
    }
    Ok(())
}
