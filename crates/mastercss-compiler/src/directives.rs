use super::{
    CompileCssDirectivesResult, CompileNativeCssOptions, CompilerError, CssDirectiveManifestInput,
    CssDirectiveReferenceStatement, CssDirectiveStyleDefinition, CssRule, DirectiveName, HashMap,
    HashSet, MinifyOptions, NativeClassNameCollector, ParserOptions, PrinterOptions, StyleSheet,
    ThemeAtRule, ThemeAtRuleParser, Visit, decode_css_quoted_string, directive_error,
    extraction_policy_from_statements, filter_native_css_rules, lower_custom_variant_rule,
    lower_managed_rule_list, lower_settings_rule, lower_theme_rule, mask_managed_pattern_names,
    normalize_stylesheet_value, rewrite_managed_variant_directives, validate_compose_syntax,
    validate_condition_variant_syntax,
};
use mastercss_lexer::{
    find_css_reference_statements, find_standalone_css_directive_statements, utf16_to_byte_offset,
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
    let source_index = crate::source_index::SourceIndex::new(source);
    let body_index = crate::source_index::SourceIndex::new(body);
    lower_managed_rule_list(
        &source_index,
        filename,
        &body_index,
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
    compile_css_directives_impl(source, options, None)
}

pub(crate) struct NativeStyleSlot {
    pub name: String,
    pub loc: lightningcss::rules::Location,
    pub definitions: Vec<CssDirectiveStyleDefinition>,
}

pub(crate) fn compile_css_directives_with_slots(
    source: &str,
    options: &CompileNativeCssOptions,
) -> Result<(CompileCssDirectivesResult, Vec<NativeStyleSlot>), CompilerError> {
    let mut slots = Vec::new();
    let result = compile_css_directives_impl(source, options, Some(&mut slots))?;
    Ok((result, slots))
}

fn compile_css_directives_impl(
    source: &str,
    options: &CompileNativeCssOptions,
    slots: Option<&mut Vec<NativeStyleSlot>>,
) -> Result<CompileCssDirectivesResult, CompilerError> {
    if options.preserve_native_source && options.classes.is_some() {
        return Err(CompilerError::Print {
            filename: options.from.clone(),
            message: "preserveNativeSource cannot be combined with class pruning".into(),
        });
    }
    let external_slots = slots.is_some();
    let mut local_slots = Vec::new();
    let mut slots = Some(match slots {
        Some(slots) => slots,
        None => &mut local_slots,
    });
    validate_condition_variant_syntax(source, &options.from)?;
    validate_compose_syntax(source, &options.from)?;
    let reference_statements = find_css_reference_statements(source);
    let standalone_directives = find_standalone_css_directive_statements(source);
    // Parsing still addresses the original source. Blank consumed statements
    // instead of deleting bytes, preserving line breaks and all later offsets.
    let mut masked = source.as_bytes().to_vec();
    for (start, end) in reference_statements
        .iter()
        .map(|statement| (statement.start, statement.end))
        .chain(
            standalone_directives
                .iter()
                .map(|statement| (statement.start, statement.end)),
        )
    {
        if let Some((start, end)) =
            utf16_to_byte_offset(source, start).zip(utf16_to_byte_offset(source, end))
        {
            for byte in &mut masked[start..end] {
                if !matches!(*byte, b'\r' | b'\n') {
                    *byte = b' ';
                }
            }
        }
    }
    let source_without_entry =
        String::from_utf8(masked).expect("statement ranges end at UTF-8 boundaries");
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
    let mut consumed = Vec::new();
    let mut occupied_names = HashSet::new();
    let source_index = crate::source_index::SourceIndex::new(source);
    let rewritten_index = crate::source_index::SourceIndex::new(&rewritten_source);
    if super::native_rule_list_has_directives(
        &rewritten_index,
        &stylesheet.rules.0,
        &stylesheet_variant_rule_offsets,
    ) {
        for token in mastercss_lexer::tokenize_css_syntax(source) {
            if let mastercss_lexer::CssSyntaxKind::AtKeyword(name) = token.kind {
                occupied_names.insert(name.into_owned());
            }
        }
    }
    for rule in stylesheet.rules.0.drain(..) {
        if let CssRule::Custom(directive) = &rule {
            consumed.push(directive.start_byte);
        }
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
            rule => {
                let mut lowerer = crate::native_conditionals::NativeConditionalLowerer {
                    source: &source_index,
                    filename: &options.from,
                    rewritten: &rewritten_index,
                    variants: &stylesheet_variant_rule_offsets,
                    definitions: &mut style_definitions,
                    order: &mut style_order,
                    slots: slots.as_deref_mut(),
                    occupied: &mut occupied_names,
                };
                if let Some(rule) = lowerer.lower(rule, &[])? {
                    native_rules.push(rule);
                }
            }
        }
    }
    crate::output_mappings::refine_native_declaration_sources(source, &mut style_definitions);
    stylesheet.rules.0 = native_rules;
    if let Some(classes) = &options.classes {
        let classes = classes.iter().cloned().collect::<HashSet<_>>();
        stylesheet.rules.0 = filter_native_css_rules(stylesheet.rules.0, &classes);
    }

    let preserved = if options.preserve_native_source && options.preserve_native_css {
        Some(crate::native_source::preserve_native_source(
            &source_without_entry,
            source,
            &rewritten_source,
            &options.from,
            &consumed,
            slots.as_deref().map(Vec::as_slice).unwrap_or_default(),
        )?)
    } else {
        None
    };
    let native_output = if !external_slots
        && let Some(slots) = slots.as_deref_mut().filter(|slots| !slots.is_empty())
    {
        // Both views use the same parsed and lowered tree. The raw native view
        // removes slots before minification; the ordered view retains them.
        let rules = stylesheet.rules.0.clone();
        let names = slots.iter().map(|slot| slot.name.as_str()).collect();
        if !options.preserve_native_css {
            stylesheet.rules.0 =
                crate::native_output::retain_style_slots(stylesheet.rules.0, &names);
        }
        let css = match &preserved {
            Some((ordered, _)) => ordered.css.clone(),
            None => print_native_css(&mut stylesheet, &options.from)?,
        };
        let mappings = if let Some((ordered, _)) = &preserved {
            ordered.mappings.clone()
        } else {
            crate::output_mappings::native_output_mappings(
                source,
                &rewritten_source,
                &options.from,
                &stylesheet.rules.0,
                &css,
            )
        };
        stylesheet.rules.0 = crate::native_output::strip_style_slots(rules, &names).0;
        Some(crate::native_output::prepare_native_output(
            source,
            &options.from,
            css,
            mappings,
            slots,
        )?)
    } else {
        None
    };
    if !options.preserve_native_css
        && external_slots
        && let Some(slots) = slots.as_deref()
    {
        let names = slots.iter().map(|slot| slot.name.as_str()).collect();
        stylesheet.rules.0 = crate::native_output::retain_style_slots(stylesheet.rules.0, &names);
    }
    let native_css = if options.preserve_native_css || external_slots {
        match &preserved {
            Some((ordered, plain)) => {
                if external_slots {
                    ordered.css.clone()
                } else {
                    plain.css.clone()
                }
            }
            None => print_native_css(&mut stylesheet, &options.from)?,
        }
    } else {
        String::new()
    };

    let native_mappings = if let Some((ordered, plain)) = &preserved {
        if external_slots {
            ordered.mappings.clone()
        } else {
            plain.mappings.clone()
        }
    } else {
        crate::output_mappings::native_output_mappings(
            source,
            &rewritten_source,
            &options.from,
            &stylesheet.rules.0,
            &native_css,
        )
    };
    Ok(CompileCssDirectivesResult {
        native_output,
        native_mappings,
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

pub(crate) fn native_style_slot<'a>(
    slots: &mut Vec<NativeStyleSlot>,
    occupied: &mut HashSet<String>,
    definitions: &[CssDirectiveStyleDefinition],
    loc: lightningcss::rules::Location,
) -> CssRule<'a, ThemeAtRule> {
    let mut index = slots.len();
    let name = loop {
        let name = format!("--master-css-compose-slot-{index}");
        if occupied.insert(name.clone()) {
            break name;
        }
        index += 1;
    };
    slots.push(NativeStyleSlot {
        name: name.clone(),
        loc,
        definitions: definitions.to_vec(),
    });
    CssRule::Unknown(lightningcss::rules::unknown::UnknownAtRule {
        name: name.into(),
        prelude: lightningcss::properties::custom::TokenList(Vec::new()),
        block: None,
        loc,
    })
}

fn print_native_css(
    stylesheet: &mut StyleSheet<'_, ThemeAtRule>,
    filename: &str,
) -> Result<String, CompilerError> {
    stylesheet
        .minify(MinifyOptions::default())
        .map_err(|error| CompilerError::Print {
            message: error.to_string(),
            filename: filename.into(),
        })?;
    let css = stylesheet
        .to_css(PrinterOptions::default())
        .map_err(|error| CompilerError::Print {
            message: error.to_string(),
            filename: filename.into(),
        })?
        .code;
    normalize_stylesheet_value(css.trim(), false).map_err(|message| CompilerError::Directive {
        message,
        filename: filename.into(),
        range: None,
    })
}
