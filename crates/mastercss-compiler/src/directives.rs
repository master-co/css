use super::{
    CompileCssDirectivesResult, CompileNativeCssOptions, CompilerError,
    CssDirectiveConditionPathEntry, CssDirectiveManifestInput, CssDirectiveReferenceStatement,
    CssDirectiveStyleDefinition, CssRule, DirectiveName, HashMap, HashSet, MinifyOptions,
    NativeClassNameCollector, NativeStyleContext, ParserOptions, PrinterOptions, StyleSheet,
    ThemeAtRule, ThemeAtRuleParser, Visit, byte_offset_for_location, decode_css_quoted_string,
    directive_error, extraction_policy_from_statements, filter_native_css_rules,
    lower_custom_variant_rule, lower_managed_rule_list, lower_native_rule_list,
    lower_native_style_rule, lower_settings_rule, lower_theme_rule, mask_managed_pattern_names,
    native_rule_list_has_directives, normalize_stylesheet_value, printed_selectors,
    remove_css_reference_statements, remove_standalone_css_directives,
    rewrite_managed_variant_directives, selector_source_reference, validate_compose_syntax,
    validate_condition_variant_syntax,
};

#[allow(clippy::too_many_arguments)]
pub(crate) fn lower_managed_definition_rule(
    source: &str,
    filename: &str,
    rule: ThemeAtRule,
    manifest_input: &mut CssDirectiveManifestInput,
    class_names: &mut Vec<String>,
    style_definitions: &mut Vec<CssDirectiveStyleDefinition>,
    style_order: &mut u32,
    stylesheet_variant_rule_offsets: &HashMap<usize, String>,
) -> Result<(), CompilerError> {
    if !rule.prelude.parts.is_empty() {
        return Err(directive_error(
            source,
            filename,
            rule.start_byte,
            format!("@{} does not accept a prelude", rule.name.as_str()),
        ));
    }
    let body = rule.body.as_deref().ok_or_else(|| {
        directive_error(
            source,
            filename,
            rule.start_byte,
            format!("@{} requires a style block", rule.name.as_str()),
        )
    })?;
    let body_start_byte = rule.body_start_byte.unwrap_or(rule.start_byte);
    let (rewritten_body, pattern_rule_offsets) = mask_managed_pattern_names(body)
        .map_err(|message| directive_error(source, filename, rule.start_byte, message))?;
    let variant_rule_offsets = stylesheet_variant_rule_offsets
        .iter()
        .filter_map(|(offset, token)| {
            offset
                .checked_sub(body_start_byte)
                .filter(|offset| *offset < body.len())
                .map(|offset| (offset, token.clone()))
        })
        .collect::<HashMap<_, _>>();
    let stylesheet = StyleSheet::parse(
        &rewritten_body,
        ParserOptions {
            filename: filename.to_owned(),
            ..ParserOptions::default()
        },
    )
    .map_err(|error| directive_error(source, filename, rule.start_byte, error.to_string()))?;
    let layer = rule.name.layer().expect("managed directives have a layer");
    lower_managed_rule_list(
        source,
        filename,
        body,
        body_start_byte,
        stylesheet.rules.0,
        None,
        &[],
        &variant_rule_offsets,
        &pattern_rule_offsets,
        layer,
        class_names,
        manifest_input,
        style_definitions,
        style_order,
    )
}

/// Lowers the production Master CSS directives and preserves host-native CSS.
pub fn compile_css_directives(
    source: &str,
    options: &CompileNativeCssOptions,
) -> Result<CompileCssDirectivesResult, CompilerError> {
    validate_condition_variant_syntax(source, &options.from)?;
    validate_compose_syntax(source, &options.from)?;
    let (source_without_references, reference_statements) = remove_css_reference_statements(source);
    let references = reference_statements
        .into_iter()
        .map(|reference| CssDirectiveReferenceStatement {
            start: reference.start,
            end: reference.end,
            statement: reference.statement,
            source: decode_css_quoted_string(&reference.source),
            file: Some(options.from.clone()),
        })
        .collect::<Vec<_>>();
    let (source_without_entry, standalone_directives) =
        remove_standalone_css_directives(&source_without_references);
    let extraction_policy = extraction_policy_from_statements(&standalone_directives);
    let (rewritten_source, stylesheet_variant_rule_offsets) =
        rewrite_managed_variant_directives(&source_without_entry);
    let mut parser = ThemeAtRuleParser::default();
    let mut stylesheet = StyleSheet::parse_with(
        &rewritten_source,
        ParserOptions {
            filename: options.from.clone(),
            ..ParserOptions::default()
        },
        &mut parser,
    )
    .map_err(|error| CompilerError::Parse {
        message: error.to_string(),
        filename: options.from.clone(),
        range: None,
    })?;

    if let Some((start_byte, name)) = parser.nested_directive {
        return Err(directive_error(
            source,
            &options.from,
            start_byte,
            format!("@{} must be top-level", name.as_str()),
        ));
    }

    let mut native_class_collector = NativeClassNameCollector::default();
    stylesheet
        .visit(&mut native_class_collector)
        .unwrap_or_else(|error| match error {});

    let mut manifest_input = CssDirectiveManifestInput::default();
    let mut class_names = Vec::new();
    let mut style_definitions = Vec::new();
    let mut style_order = 0;
    let mut native_rules = Vec::with_capacity(stylesheet.rules.0.len());
    for rule in stylesheet.rules.0.drain(..) {
        match rule {
            CssRule::Custom(directive) => match directive.name {
                DirectiveName::Settings => {
                    lower_settings_rule(source, &options.from, directive, &mut manifest_input)?
                }
                DirectiveName::Theme => {
                    lower_theme_rule(source, &options.from, directive, &mut manifest_input)?
                }
                DirectiveName::CustomVariant => lower_custom_variant_rule(
                    source,
                    &options.from,
                    directive,
                    &mut manifest_input,
                )?,
                DirectiveName::Defaults | DirectiveName::Components | DirectiveName::Utilities => {
                    lower_managed_definition_rule(
                        source,
                        &options.from,
                        directive,
                        &mut manifest_input,
                        &mut class_names,
                        &mut style_definitions,
                        &mut style_order,
                        &stylesheet_variant_rule_offsets,
                    )?
                }
            },
            CssRule::Style(style)
                if native_rule_list_has_directives(
                    &rewritten_source,
                    &style.rules.0,
                    &stylesheet_variant_rule_offsets,
                ) =>
            {
                let context = NativeStyleContext {
                    selectors: printed_selectors(&style.selectors.0, &options.from)?,
                    selector_source: selector_source_reference(
                        source,
                        &options.from,
                        &rewritten_source,
                        0,
                        style.loc.line,
                        style.loc.column,
                    ),
                };
                lower_native_style_rule(
                    source,
                    &options.from,
                    &rewritten_source,
                    style,
                    context,
                    &[],
                    &stylesheet_variant_rule_offsets,
                    &mut style_definitions,
                    &mut style_order,
                )?;
            }
            CssRule::Media(media)
                if byte_offset_for_location(
                    &rewritten_source,
                    media.loc.line,
                    media.loc.column,
                )
                .is_some_and(|offset| stylesheet_variant_rule_offsets.contains_key(&offset)) =>
            {
                let offset =
                    byte_offset_for_location(&rewritten_source, media.loc.line, media.loc.column)
                        .expect("matched variant media rules have a source offset");
                let path = [CssDirectiveConditionPathEntry::Variant {
                    token: stylesheet_variant_rule_offsets[&offset].clone(),
                }];
                lower_native_rule_list(
                    source,
                    &options.from,
                    &rewritten_source,
                    media.rules.0,
                    None,
                    &path,
                    &stylesheet_variant_rule_offsets,
                    &mut style_definitions,
                    &mut style_order,
                )?;
            }
            rule => native_rules.push(rule),
        }
    }
    stylesheet.rules.0 = native_rules;
    if let Some(classes) = &options.classes {
        let classes = classes.iter().cloned().collect::<HashSet<_>>();
        stylesheet.rules.0 = filter_native_css_rules(stylesheet.rules.0, &classes);
    }

    let native_css = if options.preserve_native_css {
        stylesheet
            .minify(MinifyOptions::default())
            .map_err(|error| CompilerError::Print {
                message: error.to_string(),
                filename: options.from.clone(),
            })?;
        let css = stylesheet
            .to_css(PrinterOptions::default())
            .map_err(|error| CompilerError::Print {
                message: error.to_string(),
                filename: options.from.clone(),
            })?
            .code
            .trim()
            .to_owned();
        normalize_stylesheet_value(&css, false).map_err(|message| CompilerError::Directive {
            message,
            filename: options.from.clone(),
            range: None,
        })?
    } else {
        String::new()
    };

    Ok(CompileCssDirectivesResult {
        manifest_input,
        extraction_policy,
        class_names,
        native_class_names: native_class_collector.class_names,
        warnings: Vec::new(),
        native_css: native_css.clone(),
        css: native_css,
        generated_css: String::new(),
        dependencies: Vec::new(),
        style_definitions: (!style_definitions.is_empty()).then_some(style_definitions),
        references: (!references.is_empty()).then_some(references),
    })
}
