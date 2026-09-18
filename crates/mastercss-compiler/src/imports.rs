use super::{
    CompileNativeCssOptions, CompileNativeCssResult, CompilerError, CssDirectiveBlocklistEntry,
    CssDirectiveExtractionPolicy, CssDirectiveReferenceStatement, CssImportGraphRequest,
    CssImportProvider, HashSet, InspectCssDirective, InspectCssResult, MinifyOptions,
    ParserOptions, PreparedCssImportProvider, PrinterOptions, ResolvedCssImportGraph,
    StandaloneCssDirectiveStatement, StyleSheet, filter_native_css_rules,
    find_css_directive_ranges, find_css_import_statements, find_master_directive_statements,
    normalize_stylesheet_value, parse_css_import_source, remove_css_reference_statements,
    remove_master_directive_statements, utf16_to_byte_offset,
};
use crate::source_spans::MappedSource;
use lightningcss::{rules::CssRule, traits::ToCss};

pub(crate) fn imported_css_wrappers(
    statement: &str,
    source: &str,
    filename: &str,
) -> Result<(String, String), CompilerError> {
    let stylesheet = StyleSheet::parse(statement, ParserOptions::default()).map_err(|error| {
        CompilerError::Parse {
            message: error.to_string(),
            filename: filename.to_owned(),
            range: None,
        }
    })?;
    let Some(CssRule::Import(import)) = stylesheet.rules.0.first() else {
        return Err(CompilerError::Import {
            message: "Expected a CSS import rule".into(),
            filename: filename.to_owned(),
        });
    };
    if (import.layer.is_some()
        || import.supports.is_some()
        || !import.media.media_queries.is_empty())
        && !crate::stylesheet_graph::source_imports(source, filename)?.is_empty()
    {
        // @import is invalid inside conditional/layer blocks. A provider must
        // resolve these children before their enclosing import can be inlined.
        return Err(CompilerError::Import {
            message: "Cannot inline a qualified CSS import containing unresolved imports; resolve its nested imports first".into(),
            filename: filename.to_owned(),
        });
    }
    let print_error = |error: lightningcss::error::PrinterError| CompilerError::Print {
        message: error.to_string(),
        filename: filename.to_owned(),
    };
    let mut prefix = String::new();
    let mut suffix = String::new();
    if let Some(layer) = &import.layer {
        let name = layer
            .as_ref()
            .map(|name| name.to_css_string(PrinterOptions::default()))
            .transpose()
            .map_err(print_error)?
            .unwrap_or_default();
        prefix = format!("@layer {name}{{{prefix}");
        suffix.push('}');
    }
    if !import.media.media_queries.is_empty() {
        let media = import
            .media
            .to_css_string(PrinterOptions::default())
            .map_err(print_error)?;
        prefix = format!("@media {media}{{{prefix}");
        suffix.push('}');
    }
    if let Some(supports) = &import.supports {
        let supports = supports
            .to_css_string(PrinterOptions::default())
            .map_err(print_error)?;
        prefix = format!("@supports {supports}{{{prefix}");
        suffix.push('}');
    }
    Ok((prefix, suffix))
}

/// Named cascade layers in authored first-appearance order, or `None` when the
/// stylesheet declares an order itself.
fn authored_layer_order(
    source: &str,
    imports: &[crate::stylesheet_graph::CssStylesheetImport],
) -> Option<Vec<String>> {
    let (without_blocks, blocks) =
        mastercss_lexer::extract_top_level_at_rule_blocks(source, &["layer"]);
    if has_layer_statement(&without_blocks) {
        return None;
    }
    let mut ordered = blocks
        .iter()
        .filter_map(|block| Some((block.start, layer_block_name(&block.source)?)))
        .chain(
            imports
                .iter()
                .filter_map(|import| Some((import.start, import_layer_name(&import.statement)?))),
        )
        .collect::<Vec<_>>();
    ordered.sort_by_key(|(start, _)| *start);
    let mut names: Vec<String> = Vec::new();
    for (_, name) in ordered {
        if !names.contains(&name) {
            names.push(name);
        }
    }
    Some(names)
}

/// True when a top-level `@layer` ends as a statement rather than a block. Block
/// forms are already blanked out of `source` by the caller.
fn has_layer_statement(source: &str) -> bool {
    let bytes = source.as_bytes();
    let mut index = 0;
    while let Some(offset) = source[index..].to_ascii_lowercase().find("@layer") {
        let start = index + offset;
        let mut cursor = start + "@layer".len();
        while cursor < bytes.len() && bytes[cursor] != b'{' && bytes[cursor] != b';' {
            cursor += 1;
        }
        if cursor < bytes.len() && bytes[cursor] == b';' {
            return true;
        }
        index = cursor.max(start + 1);
    }
    false
}

/// Name of a `@layer name {` block; anonymous layers cannot be pinned.
fn layer_block_name(block: &str) -> Option<String> {
    let name = block.strip_prefix('@')?.get("layer".len()..)?;
    let name = name.split('{').next()?.trim();
    (!name.is_empty() && !name.contains(',')).then(|| name.to_owned())
}

/// Name an `@import` assigns its stylesheet; anonymous layers cannot be pinned.
fn import_layer_name(statement: &str) -> Option<String> {
    let stylesheet = StyleSheet::parse(statement, ParserOptions::default()).ok()?;
    let CssRule::Import(import) = stylesheet.rules.0.first()? else {
        return None;
    };
    import
        .layer
        .as_ref()?
        .as_ref()?
        .to_css_string(PrinterOptions::default())
        .ok()
}

/// Definition directives an imported stylesheet may declare at its top level.
const IMPORTED_DEFINITION_DIRECTIVES: [&str; 6] = [
    "settings",
    "theme",
    "custom-variant",
    "defaults",
    "components",
    "utilities",
];

/// A qualifier wraps the imported rules in `@layer`/`@media`/`@supports`, but the
/// imported stylesheet's definitions are global declarations, not conditional
/// ones, and a directive contained in a native at-rule cannot be lowered. Split
/// them out so they stay beside the wrapper instead of inside it.
fn split_imported_definitions(source: MappedSource) -> (Option<MappedSource>, MappedSource) {
    let (_, blocks) = mastercss_lexer::extract_top_level_at_rule_blocks(
        &source.text,
        &IMPORTED_DEFINITION_DIRECTIVES,
    );
    if blocks.is_empty() {
        return (None, source);
    }
    let mut definitions = MappedSource::default();
    let mut body = MappedSource::default();
    let mut byte_index = 0;
    for block in &blocks {
        let (Some(start), Some(end)) = (
            utf16_to_byte_offset(&source.text, block.start),
            utf16_to_byte_offset(&source.text, block.end),
        ) else {
            continue;
        };
        if start < byte_index {
            continue;
        }
        body.push(source.slice(byte_index, start));
        if !definitions.text.is_empty() {
            definitions.push_unmapped("\n");
        }
        definitions.push(source.slice(start, end));
        byte_index = end;
    }
    if definitions.text.is_empty() {
        return (None, source);
    }
    body.push(source.slice(byte_index, source.text.len()));
    (Some(definitions), body)
}

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

pub(crate) fn load_css_import_source<P: CssImportProvider>(
    id: &str,
    provider: &P,
    references: &mut Vec<CssDirectiveReferenceStatement>,
) -> Result<String, CompilerError> {
    Ok(load_css_import_source_mapped(id, provider, references)?.text)
}

fn load_css_import_source_mapped<P: CssImportProvider>(
    id: &str,
    provider: &P,
    references: &mut Vec<CssDirectiveReferenceStatement>,
) -> Result<MappedSource, CompilerError> {
    let source = provider.load(id).map_err(|error| CompilerError::Import {
        message: format!("Cannot load CSS import {id}: {error}"),
        filename: id.to_owned(),
    })?;
    let (source_without_references, file_references) = remove_css_reference_statements(&source);
    let authored = MappedSource::authored(id, source);
    let mut mapped = MappedSource::default();
    let mut cursor = 0;
    for reference in &file_references {
        let start = utf16_to_byte_offset(&authored.text, reference.start)
            .expect("reference start boundary");
        let end =
            utf16_to_byte_offset(&authored.text, reference.end).expect("reference end boundary");
        mapped.push(authored.slice(cursor, start));
        cursor = end;
    }
    mapped.push(authored.slice(cursor, authored.text.len()));
    debug_assert_eq!(mapped.text, source_without_references);
    references.extend(file_references.into_iter().map(|reference| {
        CssDirectiveReferenceStatement {
            start: reference.start,
            end: reference.end,
            statement: reference.statement,
            source: decode_css_quoted_string(&reference.source),
            file: Some(id.to_owned()),
        }
    }));
    Ok(mapped)
}

pub(crate) fn resolve_css_import_graph_file<P: CssImportProvider>(
    id: &str,
    provider: &P,
    dependencies: &mut Vec<String>,
    dependency_set: &mut HashSet<String>,
    stack: &mut Vec<String>,
    references: &mut Vec<CssDirectiveReferenceStatement>,
) -> Result<MappedSource, CompilerError> {
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
    let mapped = load_css_import_source_mapped(id, provider, references)?;
    let source_without_references = &mapped.text;
    let imports = crate::stylesheet_graph::source_imports(source_without_references, id)?;
    if imports.is_empty() {
        return Ok(mapped);
    }

    stack.push(id.to_owned());
    let mut output = MappedSource::default();
    let mut byte_index = 0;
    let mut preserved_imports = Vec::new();
    for import in &imports {
        let start = utf16_to_byte_offset(source_without_references, import.start)
            .expect("lexer import start is a valid UTF-16 boundary");
        let end = utf16_to_byte_offset(source_without_references, import.end)
            .expect("lexer import end is a valid UTF-16 boundary");
        output.push(mapped.slice(byte_index, start));
        let specifier = &import.specifier;
        let resolved = provider
            .resolve(specifier, id)
            .map_err(|error| CompilerError::Import {
                message: format!("Cannot resolve CSS import {specifier} from {id}: {error}"),
                filename: id.to_owned(),
            })?;
        if let Some(resolved) = resolved {
            let source = resolve_css_import_graph_file(
                &resolved,
                provider,
                dependencies,
                dependency_set,
                stack,
                references,
            )?;
            let (prefix, suffix) = imported_css_wrappers(&import.statement, &source.text, id)?;
            if prefix.is_empty() {
                output.push(source);
            } else {
                let (definitions, body) = split_imported_definitions(source);
                if let Some(definitions) = definitions {
                    output.push(definitions);
                    output.push_unmapped("\n");
                }
                output.push_unmapped(&prefix);
                output.push(body);
                output.push_unmapped(&suffix);
            }
        } else {
            let statement = &source_without_references[start..end];
            let trim_start = statement.len() - statement.trim_start().len();
            preserved_imports.push(mapped.slice(
                start + trim_start,
                start + trim_start + statement.trim().len(),
            ));
        }
        byte_index = end;
    }
    output.push(mapped.slice(byte_index, source_without_references.len()));
    stack.pop();

    if preserved_imports.is_empty() {
        return Ok(output);
    }
    let first_import_start = utf16_to_byte_offset(source_without_references, imports[0].start)
        .expect("lexer import start is a valid UTF-16 boundary");
    let suffix = output.slice(first_import_start, output.text.len());
    output = output.slice(0, first_import_start);
    for (index, import) in preserved_imports.into_iter().enumerate() {
        if index > 0 {
            output.push_unmapped("\n");
        }
        output.push(import);
    }
    if !suffix.text.is_empty() {
        output.push_unmapped("\n");
        output.push(suffix);
    }
    // Hoisting an unresolved import also hoists the first appearance of the
    // layer it names, and first appearance is what orders layers. Lead with the
    // authored order so the hoist cannot reorder the cascade. Only a stylesheet
    // that names more than one layer can be reordered, and one that declares an
    // order already wins, so both are left untouched.
    if let Some(layers) = authored_layer_order(source_without_references, &imports)
        && layers.len() > 1
    {
        let mut pinned = MappedSource::default();
        pinned.push_unmapped(&format!("@layer {};\n", layers.join(", ")));
        pinned.push(output);
        output = pinned;
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
        source: source.text,
        source_mappings: source.mappings,
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
    if options.preserve_native_source && options.classes.is_some() {
        return Err(CompilerError::Print {
            filename: options.from.clone(),
            message: "preserveNativeSource cannot be combined with class pruning".into(),
        });
    }
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
    if options.preserve_native_source {
        drop(stylesheet);
        return Ok(CompileNativeCssResult {
            native_css: source.clone(),
            css: source,
            had_master_entry_directive,
        });
    }
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
