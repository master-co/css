use super::{
    CompilerError, CssDirectiveConditionPathEntry, CssDirectiveSourceReference,
    CssDirectiveStyleDefinition, CssRule, ErrorCode, HashMap, StyleRule, ThemeAtRule,
    UnknownAtRule, collect_class_list_token_ranges, collect_ordered_declarations,
    combine_managed_selectors, condition_properties, css_statement_delimiter, minified_css,
    next_char_end, preserve_ordered_literal_spelling, printed_selectors, trim_byte_range,
    utf16_to_byte_offset,
};
use crate::source_index::SourceIndex;

#[derive(Debug, Clone)]
pub(crate) struct NativeStyleContext {
    pub(crate) selectors: Vec<String>,
    pub(crate) selector_source: Option<CssDirectiveSourceReference>,
}

pub(crate) fn native_rule_list_has_directives(
    source: &SourceIndex<'_>,
    rules: &[CssRule<'_, ThemeAtRule>],
    variant_rule_offsets: &HashMap<usize, String>,
) -> bool {
    rules.iter().any(|rule| match rule {
        CssRule::Unknown(rule) => rule.name.eq_ignore_ascii_case("compose"),
        CssRule::Style(rule) => {
            native_rule_list_has_directives(source, &rule.rules.0, variant_rule_offsets)
        }
        CssRule::Media(rule) => {
            source
                .byte_offset_for_location(rule.loc.line, rule.loc.column)
                .is_some_and(|offset| variant_rule_offsets.contains_key(&offset))
                || native_rule_list_has_directives(source, &rule.rules.0, variant_rule_offsets)
        }
        CssRule::Supports(rule) => {
            native_rule_list_has_directives(source, &rule.rules.0, variant_rule_offsets)
        }
        CssRule::Container(rule) => {
            native_rule_list_has_directives(source, &rule.rules.0, variant_rule_offsets)
        }
        CssRule::LayerBlock(rule) => {
            native_rule_list_has_directives(source, &rule.rules.0, variant_rule_offsets)
        }
        CssRule::StartingStyle(rule) => {
            native_rule_list_has_directives(source, &rule.rules.0, variant_rule_offsets)
        }
        _ => false,
    })
}

pub(crate) fn push_native_style_declarations(
    declarations: Vec<super::CssDeclaration>,
    source: Option<CssDirectiveSourceReference>,
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
        source,
        selector_source: context.selector_source.clone(),
        conditions,
        condition_path,
        layer: None,
        name: None,
    });
}

#[allow(clippy::too_many_arguments)]
pub(crate) fn lower_native_compose_rule(
    source: &SourceIndex<'_>,
    filename: &str,
    rewritten: &SourceIndex<'_>,
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
    let rewritten_source = rewritten.text();
    let local_start = rewritten
        .byte_offset_for_location(rule.loc.line, rule.loc.column)
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
    let directive_source = source.reference(filename, local_start, directive_end);
    let (conditions, path) = condition_properties(condition_path);
    *style_order += 1;
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
        style_definitions.push(CssDirectiveStyleDefinition::Compose {
            order: *style_order,
            class_name: token.token,
            selector: context.selectors.join(","),
            source: source.reference(
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
    source: &SourceIndex<'_>,
    filename: &str,
    rewritten: &SourceIndex<'_>,
    style: StyleRule<'_, ThemeAtRule>,
    context: NativeStyleContext,
    condition_path: &[CssDirectiveConditionPathEntry],
    variant_rule_offsets: &HashMap<usize, String>,
    style_definitions: &mut Vec<CssDirectiveStyleDefinition>,
    style_order: &mut u32,
) -> Result<(), CompilerError> {
    let mut declarations = collect_ordered_declarations(&style.declarations, filename)?;
    let text = source.text();
    let selector_end = context
        .selector_source
        .as_ref()
        .and_then(|selector| source.byte_offset(selector.range.end));
    if let Some(start) = selector_end {
        preserve_ordered_literal_spelling(text, start, &mut declarations);
    }
    let declaration_source = selector_end
        .and_then(|start| css_statement_delimiter(text, start, text.len()))
        .filter(|(_, delimiter)| *delimiter == '{')
        .and_then(|(start, _)| {
            let start = start + 1;
            let mut input = cssparser::ParserInput::new(&text[start..]);
            let mut parser = cssparser::Parser::new(&mut input);
            parser.skip_whitespace();
            let start = start + parser.position().byte_index();
            source.reference(filename, start, start)
        });
    push_native_style_declarations(
        declarations,
        declaration_source,
        &context,
        condition_path,
        style_definitions,
        style_order,
    );
    lower_native_rule_list(
        source,
        filename,
        rewritten,
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
    source: &SourceIndex<'_>,
    filename: &str,
    rewritten: &SourceIndex<'_>,
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
                    selector_source: source
                        .selector_reference(
                            filename,
                            rewritten,
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
                    rewritten,
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
                    collect_ordered_declarations(&child.declarations, filename)?,
                    rewritten
                        .byte_offset_for_location(child.loc.line, child.loc.column)
                        .and_then(|start| source.reference(filename, start, start)),
                    context,
                    condition_path,
                    style_definitions,
                    style_order,
                );
            }
            CssRule::Media(media) => {
                let mut path = condition_path.to_vec();
                let local_offset =
                    rewritten.byte_offset_for_location(media.loc.line, media.loc.column);
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
                    rewritten,
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
                    rewritten,
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
                    rewritten,
                    container.rules.0,
                    context.clone(),
                    &path,
                    variant_rule_offsets,
                    style_definitions,
                    style_order,
                )?;
            }
            CssRule::LayerBlock(layer) => {
                let value = match &layer.name {
                    Some(name) => format!("@layer {}", minified_css(name, filename)?),
                    None => "@layer".into(),
                };
                let mut path = condition_path.to_vec();
                path.push(CssDirectiveConditionPathEntry::Condition { value });
                lower_native_rule_list(
                    source,
                    filename,
                    rewritten,
                    layer.rules.0,
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
                    rewritten,
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
                    rewritten,
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
