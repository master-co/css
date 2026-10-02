use super::{
    CompileCssDirectivesResult, CompileNativeCssOptions, CompilerError, CssDirectiveManifestInput,
    CssDirectiveReferenceStatement, CssDirectiveStyleDefinition, CssRule, DirectiveName, HashSet,
    MinifyOptions, NativeClassNameCollector, ParserOptions, PrinterOptions, StyleSheet,
    ThemeAtRule, ThemeAtRuleParser, Visit, decode_css_quoted_string, directive_error,
    extraction_policy_from_statements, filter_native_css_rules, lower_theme_rule,
    reject_removed_directives,
};
use mastercss_lexer::{
    find_css_reference_statements, find_standalone_css_directive_statements, utf16_to_byte_offset,
};

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
    let policy = crate::analyze_standalone_directives(source).extraction_policy;
    if options.preserve_native_source
        && !policy.preserve_native
        && (options.prune_native_css || policy.prune_native)
        && options.classes.is_some()
    {
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
    reject_removed_directives(source, &options.from)?;
    crate::native_keyframes::validate_safelists(source, &options.from)?;
    crate::mixins::reject_placeholder(source, &options.from)?;
    let (custom_media, custom_media_ranges) = crate::custom_media::collect(source, &options.from)?;
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
    for range in custom_media_ranges {
        for byte in &mut masked[range] {
            if !matches!(*byte, b'\r' | b'\n') {
                *byte = b' ';
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
    let rewritten_source = &source_without_entry;
    let mut parser = ThemeAtRuleParser::default();
    let mut stylesheet = StyleSheet::parse_with(
        rewritten_source,
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
    // Lightning CSS only reports `is_nested` for style-rule nesting, so a
    // directive inside a container at-rule parses as a custom rule the printer
    // cannot emit. Import flattening produces that shape when it wraps a child
    // in its qualifier, so report the same top-level requirement instead of a
    // printer error.
    if let Some((start_byte, name)) = contained_directive(&stylesheet.rules.0, false) {
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

    let mut manifest_input = CssDirectiveManifestInput {
        custom_media: (!custom_media.is_empty()).then_some(custom_media),
        ..CssDirectiveManifestInput::default()
    };
    let mut keyframes = crate::native_keyframes::KeyframeCollector {
        source_index: crate::source_index::SourceIndex::new(source),
        source_identity: crate::native_keyframes::source_identity(
            options.resource_owner.as_deref().unwrap_or(&options.from),
            source,
        ),
        owner_identity: crate::native_keyframes::identity(
            options.resource_owner.as_deref().unwrap_or(&options.from),
        ),
        source,
        filename: &options.from,
        retained: extraction_policy.preserve_native
            || !(options.prune_native_css || extraction_policy.prune_native),
        definitions: Vec::new(),
    };
    keyframes.collect(&mut stylesheet.rules.0, &[])?;
    if !keyframes.definitions.is_empty() {
        manifest_input.keyframes = Some(keyframes.definitions);
    }
    if !extraction_policy.safelist_keyframes.is_empty() {
        manifest_input.keyframe_safelist = Some(extraction_policy.safelist_keyframes.clone());
    }
    let mut class_names = Vec::new();
    let mut style_definitions = Vec::new();
    let mut style_order = 0;
    let mut native_rules = Vec::with_capacity(stylesheet.rules.0.len());
    let mut consumed = Vec::new();
    let mut occupied_names = HashSet::new();
    let source_index = crate::source_index::SourceIndex::new(source);
    let rewritten_index = crate::source_index::SourceIndex::new(rewritten_source);
    if super::native_rule_list_has_directives(&stylesheet.rules.0) {
        for token in mastercss_lexer::tokenize_css_syntax(source) {
            if let mastercss_lexer::CssSyntaxKind::AtKeyword(name) = token.kind {
                occupied_names.insert(name.into_owned());
            }
        }
    }
    if !extraction_policy.preserve_native
        && (options.prune_native_css || extraction_policy.prune_native)
        && let Some(classes) = &options.classes
    {
        stylesheet.rules.0 =
            filter_native_css_rules(stylesheet.rules.0, &classes.iter().cloned().collect());
    }
    for rule in stylesheet.rules.0.drain(..) {
        if let CssRule::Custom(directive) = &rule {
            consumed.push(directive.start_byte);
        }
        match rule {
            CssRule::Custom(directive) => match directive.name {
                DirectiveName::Theme => {
                    lower_theme_rule(source, &options.from, directive, &mut manifest_input)?
                }
                DirectiveName::Defaults | DirectiveName::Components => {
                    let name = if matches!(directive.name, DirectiveName::Defaults) {
                        "defaults"
                    } else {
                        "components"
                    };
                    return Err(crate::syntax::ranged_directive_diagnostic(
                        source,
                        &options.from,
                        directive.start_byte,
                        directive.start_byte + name.len() + 1,
                        mastercss_schema::ErrorCode::RemovedManagedDirective,
                        format!(
                            "@{name} has been removed; use native @layer {name} with class selectors. Run master-css migrate --from rc-managed"
                        ),
                    ));
                }
                DirectiveName::Mixin => {
                    let body = directive.body.as_deref().ok_or_else(|| {
                        directive_error(
                            source,
                            &options.from,
                            directive.start_byte,
                            "@mixin requires a body",
                        )
                    })?;
                    let body = directive
                        .body_start_byte
                        .and_then(|start| source.get(start..start + body.len()))
                        .unwrap_or(body);
                    let mut definition = crate::mixins::definition(
                        directive
                            .prelude
                            .parts
                            .first()
                            .map(String::as_str)
                            .unwrap_or_default(),
                        body,
                    )
                    .map_err(|message| {
                        directive_error(source, &options.from, directive.start_byte, message)
                    })?;
                    if let Some(body_start) = directive.body_start_byte {
                        crate::mixins::attach_sources(
                            &mut definition,
                            &source_index,
                            &options.from,
                            directive.start_byte,
                            body_start,
                            body,
                        );
                    }
                    if definition.parameters.is_empty() {
                        class_names.push(definition.name.trim_start_matches("--").into());
                    }
                    manifest_input
                        .mixins
                        .get_or_insert_default()
                        .push(definition);
                }
                DirectiveName::Utility => {
                    return Err(directive_error(
                        source,
                        &options.from,
                        directive.start_byte,
                        "@utility was removed; use native declarations, named tokens or @mixin",
                    ));
                }
                DirectiveName::Apply => {
                    return Err(directive_error(
                        source,
                        &options.from,
                        directive.start_byte,
                        "@apply requires a style rule",
                    ));
                }
            },
            rule => {
                let mut lowerer = crate::native_conditionals::NativeConditionalLowerer {
                    source: &source_index,
                    filename: &options.from,
                    rewritten: &rewritten_index,

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
    if !extraction_policy.preserve_native
        && (options.prune_native_css || extraction_policy.prune_native)
        && let Some(classes) = &options.classes
    {
        let classes = classes.iter().cloned().collect::<HashSet<_>>();
        stylesheet.rules.0 = filter_native_css_rules(stylesheet.rules.0, &classes);
    }

    let preserved = if options.preserve_native_source && options.preserve_native_css {
        Some(crate::native_source::preserve_native_source(
            &source_without_entry,
            source,
            rewritten_source,
            &options.from,
            &consumed,
            slots.as_deref().map(Vec::as_slice).unwrap_or_default(),
            manifest_input.keyframes.as_deref().unwrap_or_default(),
        )?)
    } else {
        None
    };
    let mut native_output = if !external_slots
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
                rewritten_source,
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
            rewritten_source,
            &options.from,
            &stylesheet.rules.0,
            &native_css,
        )
    };
    if !external_slots && native_output.is_none() && !native_css.is_empty() {
        native_output = Some(crate::NativeCssOutput {
            css: native_css.clone(),
            mappings: native_mappings.clone(),
            slots: Vec::new(),
        });
    }
    let variables = crate::keyframes::native_variables(&native_css);
    if !variables.is_empty() {
        manifest_input.animation_variables = Some(variables);
    }
    let (native_css, native_mappings) =
        if !external_slots && !native_css.is_empty() && manifest_input.keyframes.is_some() {
            let manifest = crate::compile_manifest_input(
                &manifest_input,
                &crate::CompileManifestOptions::default(),
            )?
            .manifest;
            crate::native_keyframes::render(
                &native_css,
                &manifest,
                options.classes.as_deref(),
                &native_mappings,
            )?
        } else {
            (native_css, native_mappings)
        };
    Ok(CompileCssDirectivesResult {
        suppressed_keyframes: if options.preserve_native_css {
            Vec::new()
        } else {
            manifest_input
                .keyframes
                .iter()
                .flatten()
                .map(|frame| frame.id.clone())
                .collect()
        },
        notices: Vec::new(),
        mixin_sources: crate::mixin_sources::collect(source, &options.from),
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
        let name = format!("--master-css-style-slot-{index}");
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

/// First Master directive that sits inside a container at-rule, if any.
fn contained_directive(
    rules: &[CssRule<'_, ThemeAtRule>],
    contained: bool,
) -> Option<(usize, DirectiveName)> {
    for rule in rules {
        if let CssRule::Custom(directive) = rule {
            if contained && directive.name != DirectiveName::Apply {
                return Some((directive.start_byte, directive.name));
            }
            continue;
        }
        let nested = match rule {
            CssRule::Media(rule) => &rule.rules.0,
            CssRule::Supports(rule) => &rule.rules.0,
            CssRule::LayerBlock(rule) => &rule.rules.0,
            CssRule::Container(rule) => &rule.rules.0,
            CssRule::Scope(rule) => &rule.rules.0,
            CssRule::MozDocument(rule) => &rule.rules.0,
            CssRule::StartingStyle(rule) => &rule.rules.0,
            CssRule::Style(rule) => &rule.rules.0,
            CssRule::Nesting(rule) => &rule.style.rules.0,
            _ => continue,
        };
        if let Some(found) = contained_directive(nested, true) {
            return Some(found);
        }
    }
    None
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
    Ok(css.trim().to_owned())
}
