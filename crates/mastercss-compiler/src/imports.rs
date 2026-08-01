use super::*;

pub(crate) fn default_filename() -> String {
    "master.css".into()
}

pub(crate) const fn default_true() -> bool {
    true
}

pub(crate) fn add_unique_string(target: &mut Vec<String>, value: &str) {
    if !target.iter().any(|existing| existing == value) {
        target.push(value.to_owned());
    }
}

pub(crate) fn add_unique_blocklist_entry(
    target: &mut Vec<CssDirectiveBlocklistEntry>,
    value: CssDirectiveBlocklistEntry,
) {
    if !target.contains(&value) {
        target.push(value);
    }
}

pub(crate) fn wildcard_regex_source(pattern: &str) -> String {
    let mut source = String::from("^");
    for character in pattern.chars() {
        match character {
            '*' => source.push_str(".*"),
            '?' => source.push('.'),
            '.' | '+' | '^' | '$' | '{' | '}' | '(' | ')' | '|' | '[' | ']' | '\\' => {
                source.push('\\');
                source.push(character);
            }
            _ => source.push(character),
        }
    }
    source.push('$');
    source
}

pub(crate) fn decode_css_quoted_string(source: &str) -> String {
    let mut decoded = String::with_capacity(source.len());
    let mut characters = source.chars();
    while let Some(character) = characters.next() {
        if character == '\\' {
            if let Some(escaped) = characters.next() {
                decoded.push(escaped);
            }
        } else {
            decoded.push(character);
        }
    }
    decoded
}

pub(crate) fn extraction_policy_from_statements(
    statements: &[StandaloneCssDirectiveStatement],
) -> CssDirectiveExtractionPolicy {
    let mut policy = CssDirectiveExtractionPolicy::default();
    for statement in statements {
        match statement.at_rule_name.as_str() {
            "source" => {
                let target = if statement.modifiers.iter().any(|value| value == "not") {
                    &mut policy.exclude
                } else {
                    &mut policy.include
                };
                for value in &statement.args {
                    add_unique_string(target, value);
                }
            }
            "safelist" => {
                for value in statement
                    .args
                    .iter()
                    .flat_map(|value| value.split_whitespace())
                {
                    add_unique_string(&mut policy.safelist, value);
                }
            }
            "blocklist" => {
                for value in statement
                    .args
                    .iter()
                    .flat_map(|value| value.split_whitespace())
                {
                    if value.contains(['*', '?']) {
                        add_unique_blocklist_entry(
                            &mut policy.blocklist,
                            CssDirectiveBlocklistEntry::Pattern {
                                source: wildcard_regex_source(value),
                                flags: String::new(),
                            },
                        );
                    } else {
                        add_unique_blocklist_entry(
                            &mut policy.blocklist,
                            CssDirectiveBlocklistEntry::Exact(value.to_owned()),
                        );
                    }
                }
            }
            "preserve" if statement.modifiers.iter().any(|value| value == "native") => {
                policy.preserve_native = true;
            }
            _ => {}
        }
    }
    policy
}

pub fn inspect_css(source: &str) -> InspectCssResult {
    let has_master_entry_directive = !find_master_directive_statements(source).is_empty();
    let has_master_css_import = find_css_import_statements(source).iter().any(|statement| {
        parse_css_import_source(&statement.statement).as_deref() == Some("@master/css")
    });
    InspectCssResult {
        has_master_entry_directive,
        has_master_css_import,
        has_master_entry: has_master_entry_directive || has_master_css_import,
        directives: find_css_directive_ranges(source)
            .into_iter()
            .map(|directive| InspectCssDirective {
                name: directive.name,
                range: directive.range,
                prelude_range: directive.prelude_range,
                has_block: directive.block_range.is_some(),
                quoted_strings: directive.quoted_string_ranges.len() as u32,
            })
            .collect(),
    }
}

pub(crate) fn resolve_css_import_graph_file<P: CssImportProvider>(
    id: &str,
    provider: &P,
    dependencies: &mut Vec<String>,
    dependency_set: &mut HashSet<String>,
    stack: &mut Vec<String>,
    references: &mut Vec<CssDirectiveReferenceStatement>,
) -> Result<String, CompilerError> {
    if stack.iter().any(|entry| entry == id) {
        let mut cycle = stack.clone();
        cycle.push(id.to_owned());
        return Err(CompilerError::Import {
            message: format!("Circular CSS import: {}", cycle.join(" -> ")),
            filename: id.to_owned(),
        });
    }
    if dependency_set.insert(id.to_owned()) {
        dependencies.push(id.to_owned());
    }
    let source = provider.load(id).map_err(|error| CompilerError::Import {
        message: format!("Cannot load CSS import {id}: {error}"),
        filename: id.to_owned(),
    })?;
    let (source_without_references, file_references) = remove_css_reference_statements(&source);
    references.extend(file_references.into_iter().map(|reference| {
        CssDirectiveReferenceStatement {
            start: reference.start,
            end: reference.end,
            statement: reference.statement,
            source: decode_css_quoted_string(&reference.source),
            file: Some(id.to_owned()),
        }
    }));
    let imports = find_css_import_statements(&source_without_references);
    if imports.is_empty() {
        return Ok(source_without_references);
    }

    stack.push(id.to_owned());
    let mut output = String::with_capacity(source_without_references.len());
    let mut byte_index = 0;
    let mut preserved_imports = Vec::new();
    for import in &imports {
        let start = utf16_to_byte_offset(&source_without_references, import.start)
            .expect("lexer import start is a valid UTF-16 boundary");
        let end = utf16_to_byte_offset(&source_without_references, import.end)
            .expect("lexer import end is a valid UTF-16 boundary");
        output.push_str(&source_without_references[byte_index..start]);
        let specifier = parse_css_import_source(&import.statement).unwrap_or_default();
        let resolved = provider
            .resolve(&specifier, id)
            .map_err(|error| CompilerError::Import {
                message: format!("Cannot resolve CSS import {specifier} from {id}: {error}"),
                filename: id.to_owned(),
            })?;
        if let Some(resolved) = resolved {
            output.push_str(&resolve_css_import_graph_file(
                &resolved,
                provider,
                dependencies,
                dependency_set,
                stack,
                references,
            )?);
        } else {
            preserved_imports.push(import.statement.trim().to_owned());
        }
        byte_index = end;
    }
    output.push_str(&source_without_references[byte_index..]);
    stack.pop();

    if preserved_imports.is_empty() {
        return Ok(output);
    }
    let first_import_start = utf16_to_byte_offset(&source_without_references, imports[0].start)
        .expect("lexer import start is a valid UTF-16 boundary");
    let suffix = output.split_off(first_import_start);
    output.push_str(&preserved_imports.join("\n"));
    if !suffix.is_empty() {
        output.push('\n');
        output.push_str(&suffix);
    }
    Ok(output)
}

pub fn resolve_css_import_graph<P: CssImportProvider>(
    entry: &str,
    provider: &P,
) -> Result<ResolvedCssImportGraph, CompilerError> {
    let mut dependencies = Vec::new();
    let mut references = Vec::new();
    let source = resolve_css_import_graph_file(
        entry,
        provider,
        &mut dependencies,
        &mut HashSet::new(),
        &mut Vec::new(),
        &mut references,
    )?;
    Ok(ResolvedCssImportGraph {
        source,
        dependencies,
        references,
    })
}

pub fn resolve_prepared_css_import_graph(
    request: &CssImportGraphRequest,
) -> Result<ResolvedCssImportGraph, CompilerError> {
    resolve_css_import_graph(&request.entry, &PreparedCssImportProvider { request })
}

/// Compiles native CSS through the shared Rust Lightning CSS pipeline.
pub fn compile_native_css(
    source: &str,
    options: &CompileNativeCssOptions,
) -> Result<CompileNativeCssResult, CompilerError> {
    let (source, had_master_entry_directive) = remove_master_directive_statements(source);
    if !options.preserve_native_css {
        return Ok(CompileNativeCssResult {
            native_css: String::new(),
            css: String::new(),
            had_master_entry_directive,
        });
    }

    let mut stylesheet = StyleSheet::parse(
        &source,
        ParserOptions {
            filename: options.from.clone(),
            ..ParserOptions::default()
        },
    )
    .map_err(|error| CompilerError::Parse {
        message: error.to_string(),
        filename: options.from.clone(),
        range: None,
    })?;
    if let Some(classes) = &options.classes {
        let classes = classes.iter().cloned().collect::<HashSet<_>>();
        stylesheet.rules.0 = filter_native_css_rules(stylesheet.rules.0, &classes);
    }

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
    let css =
        normalize_stylesheet_value(&css, false).map_err(|message| CompilerError::Directive {
            message,
            filename: options.from.clone(),
            range: None,
        })?;

    Ok(CompileNativeCssResult {
        native_css: css.clone(),
        css,
        had_master_entry_directive,
    })
}
