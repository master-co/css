use super::{
    CompilerError, CssDirectiveConditionPathEntry, CssDirectiveSourceReference,
    CssDirectiveStyleDefinition, CssRule, StyleRule, ThemeAtRule, collect_ordered_declarations,
    combine_managed_selectors, condition_properties, css_statement_delimiter, minified_css,
    preserve_ordered_literal_spelling, printed_selectors,
};
use crate::source_index::SourceIndex;

#[derive(Debug, Clone)]
pub(crate) struct NativeStyleContext {
    pub(crate) selectors: Vec<String>,
    pub(crate) selector_source: Option<CssDirectiveSourceReference>,
}

pub(crate) fn native_rule_list_has_directives(rules: &[CssRule<'_, ThemeAtRule>]) -> bool {
    rules.iter().any(|rule| match rule {
        CssRule::Custom(rule) if rule.name == super::DirectiveName::Apply => true,
        CssRule::Unknown(_) => false,
        CssRule::Style(rule) => native_rule_list_has_directives(&rule.rules.0),
        CssRule::Media(rule) => native_rule_list_has_directives(&rule.rules.0),
        CssRule::Supports(rule) => native_rule_list_has_directives(&rule.rules.0),
        CssRule::Container(rule) => native_rule_list_has_directives(&rule.rules.0),
        CssRule::LayerBlock(rule) => native_rule_list_has_directives(&rule.rules.0),
        CssRule::StartingStyle(rule) => native_rule_list_has_directives(&rule.rules.0),
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
pub(crate) fn lower_native_style_rule(
    source: &SourceIndex<'_>,
    filename: &str,
    rewritten: &SourceIndex<'_>,
    style: StyleRule<'_, ThemeAtRule>,
    context: NativeStyleContext,
    condition_path: &[CssDirectiveConditionPathEntry],
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
    style_definitions: &mut Vec<CssDirectiveStyleDefinition>,
    style_order: &mut u32,
) -> Result<(), CompilerError> {
    for child in rules {
        match child {
            CssRule::Custom(rule) if rule.name == super::DirectiveName::Apply => {
                let context = context.as_ref().ok_or_else(|| {
                    super::directive_error(
                        source.text(),
                        filename,
                        rule.start_byte,
                        "@apply requires a style rule",
                    )
                })?;
                let contents = rule
                    .body
                    .as_deref()
                    .map(|body| {
                        let body = rule
                            .body_start_byte
                            .and_then(|start| source.text().get(start..start + body.len()))
                            .unwrap_or(body);
                        let nodes = crate::mixins::contents(body)?;
                        let mut definition = mastercss_schema::MixinDefinition {
                            name: "--contents-block".into(),
                            parameters: Vec::new(),
                            body: nodes,
                            source: None,
                        };
                        if let Some(start) = rule.body_start_byte {
                            crate::mixins::attach_sources(
                                &mut definition,
                                source,
                                filename,
                                rule.start_byte,
                                start,
                                body,
                            );
                        }
                        Ok::<_, String>(definition.body)
                    })
                    .transpose()
                    .map_err(|message| {
                        super::directive_error(source.text(), filename, rule.start_byte, message)
                    })?;
                let (name, arguments) = crate::mixins::application(
                    rule.prelude
                        .parts
                        .first()
                        .map(String::as_str)
                        .unwrap_or_default(),
                )
                .map_err(|message| {
                    super::directive_error(source.text(), filename, rule.start_byte, message)
                })?;
                *style_order += 1;
                style_definitions.push(CssDirectiveStyleDefinition::Apply {
                    order: *style_order,
                    selector: context.selectors.join(","),
                    name,
                    arguments,
                    contents,
                    selector_source: context.selector_source.clone(),
                    source: source.reference(filename, rule.start_byte, rule.start_byte + 6),
                    condition_path: (!condition_path.is_empty()).then(|| condition_path.to_vec()),
                });
            }
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
                    style_definitions,
                    style_order,
                )?;
            }
            CssRule::NestedDeclarations(child) => {
                let Some(context) = &context else {
                    return Err(CompilerError::Directive {
                        message: "Native condition blocks only accept style rules, declarations, and nested at-rules".into(),
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
                path.push(CssDirectiveConditionPathEntry::Condition {
                    value: format!("@media {}", minified_css(&media.query, filename)?),
                });
                lower_native_rule_list(
                    source,
                    filename,
                    rewritten,
                    media.rules.0,
                    context.clone(),
                    &path,
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
                    style_definitions,
                    style_order,
                )?;
            }

            _ => {
                return Err(CompilerError::Directive {
                    message: "Native CSS rules only accept declarations, nested selectors, and nested at-rules".into(),
                    filename: filename.to_owned(),
                    range: None,
                });
            }
        }
    }
    Ok(())
}
