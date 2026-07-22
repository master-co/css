#![forbid(unsafe_code)]

mod manifest;

pub use manifest::{
    CompileDefaultPresetRequest, CompileDefaultPresetResult, CompileManifestOptions,
    CompileManifestResult, compile_default_preset_manifest, compile_manifest_input,
    normalize_default_manifest_for_json, normalize_manifest_for_json,
};

use std::collections::{HashMap, HashSet};
use std::convert::Infallible;

use cssparser::{BasicParseErrorKind, CowRcStr, ParseError, Parser, ParserState};
use lightningcss::declaration::DeclarationBlock;
use lightningcss::error::{PrinterError, PrinterErrorKind};
use lightningcss::printer::Printer;
use lightningcss::properties::Property;
use lightningcss::rules::CssRule;
use lightningcss::rules::keyframes::KeyframesName;
use lightningcss::rules::style::StyleRule;
use lightningcss::rules::unknown::UnknownAtRule;
use lightningcss::selector::{Component, Selector};
use lightningcss::stylesheet::{MinifyOptions, ParserOptions, PrinterOptions, StyleSheet};
use lightningcss::traits::{AtRuleParser, ToCss};
use lightningcss::visit_types;
use lightningcss::visitor::{Visit, VisitTypes, Visitor};
use mastercss_lexer::{
    StandaloneCssDirectiveStatement, byte_to_utf16_offset, collect_class_list_token_ranges,
    extract_top_level_at_rule_blocks, find_css_import_statements, find_master_directive_statements,
    parse_css_import_source, remove_css_reference_statements, remove_master_directive_statements,
    remove_standalone_css_directives, utf16_to_byte_offset,
};
use mastercss_schema::{
    CssDirectiveConditionPathEntry, CssDirectiveExtractionPolicy, CssDirectiveManifestInput,
    CssDirectiveReferenceStatement, CssDirectiveSourceReference, CssDirectiveStyleDefinition,
    CssDirectiveVariableDefinition, Diagnostic, ErrorCode, SourceLocation, SourceLocationRange,
    SourceRange, UtilityLayerName,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use thiserror::Error;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InspectCssResult {
    pub has_master_entry_directive: bool,
    #[serde(rename = "hasMasterCSSImport")]
    pub has_master_css_import: bool,
    pub has_master_entry: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileNativeCssOptions {
    #[serde(default = "default_filename")]
    pub from: String,
    #[serde(default = "default_true", rename = "preserveNativeCSS")]
    pub preserve_native_css: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub classes: Option<Vec<String>>,
}

impl Default for CompileNativeCssOptions {
    fn default() -> Self {
        Self {
            from: default_filename(),
            preserve_native_css: true,
            classes: None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileNativeCssResult {
    #[serde(rename = "nativeCSS")]
    pub native_css: String,
    pub css: String,
    pub had_master_entry_directive: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileThemeCssResult {
    pub manifest_input: CssDirectiveManifestInput,
    pub extraction_policy: CssDirectiveExtractionPolicy,
    pub class_names: Vec<String>,
    pub native_class_names: Vec<String>,
    pub warnings: Vec<String>,
    #[serde(rename = "nativeCSS")]
    pub native_css: String,
    pub css: String,
    #[serde(rename = "generatedCSS")]
    pub generated_css: String,
    pub dependencies: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style_definitions: Option<Vec<CssDirectiveStyleDefinition>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub references: Option<Vec<CssDirectiveReferenceStatement>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedCssImportGraph {
    pub source: String,
    pub dependencies: Vec<String>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub references: Vec<CssDirectiveReferenceStatement>,
}

pub trait CssImportProvider {
    type Error: std::fmt::Display;

    fn load(&self, id: &str) -> Result<String, Self::Error>;

    /// Returns `None` for imports that should remain native CSS imports.
    fn resolve(&self, specifier: &str, from: &str) -> Result<Option<String>, Self::Error>;
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssImportGraphEdge {
    pub from: String,
    pub specifier: String,
    pub resolved: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssImportGraphRequest {
    pub entry: String,
    pub files: HashMap<String, String>,
    #[serde(default)]
    pub edges: Vec<CssImportGraphEdge>,
}

struct PreparedCssImportProvider<'a> {
    request: &'a CssImportGraphRequest,
}

impl CssImportProvider for PreparedCssImportProvider<'_> {
    type Error = String;

    fn load(&self, id: &str) -> Result<String, Self::Error> {
        self.request
            .files
            .get(id)
            .cloned()
            .ok_or_else(|| format!("Prepared CSS resource is missing: {id}"))
    }

    fn resolve(&self, specifier: &str, from: &str) -> Result<Option<String>, Self::Error> {
        Ok(self
            .request
            .edges
            .iter()
            .find(|edge| edge.from == from && edge.specifier == specifier)
            .map(|edge| edge.resolved.clone()))
    }
}

#[derive(Debug, Error)]
pub enum CompilerError {
    #[error("{message}")]
    Parse {
        message: String,
        filename: String,
        range: Option<SourceRange>,
    },
    #[error("{message}")]
    Print { message: String, filename: String },
    #[error("{message}")]
    Directive {
        message: String,
        filename: String,
        range: Option<SourceRange>,
    },
    #[error("{message}")]
    Import { message: String, filename: String },
}

impl CompilerError {
    pub fn diagnostic(&self) -> Diagnostic {
        match self {
            Self::Parse {
                message,
                filename,
                range,
            } => Diagnostic {
                code: ErrorCode::CssParseError,
                message: message.clone(),
                source: Some(filename.clone()),
                range: range.clone(),
                notes: vec![],
            },
            Self::Print { message, filename } => Diagnostic {
                code: ErrorCode::CssPrintError,
                message: message.clone(),
                source: Some(filename.clone()),
                range: None,
                notes: vec![],
            },
            Self::Directive {
                message,
                filename,
                range,
            } => Diagnostic {
                code: ErrorCode::CssDirectiveError,
                message: message.clone(),
                source: Some(filename.clone()),
                range: range.clone(),
                notes: vec![],
            },
            Self::Import { message, filename } => Diagnostic {
                code: ErrorCode::CssImportError,
                message: message.clone(),
                source: Some(filename.clone()),
                range: None,
                notes: vec![],
            },
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct ThemePrelude {
    parts: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum DirectiveName {
    Settings,
    Theme,
    Defaults,
    Components,
    Utilities,
    CustomVariant,
}

impl DirectiveName {
    const fn as_str(self) -> &'static str {
        match self {
            Self::Settings => "settings",
            Self::Theme => "theme",
            Self::Defaults => "defaults",
            Self::Components => "components",
            Self::Utilities => "utilities",
            Self::CustomVariant => "custom-variant",
        }
    }

    const fn layer(self) -> Option<UtilityLayerName> {
        match self {
            Self::Defaults => Some(UtilityLayerName::Defaults),
            Self::Components => Some(UtilityLayerName::Components),
            Self::Utilities => Some(UtilityLayerName::Utilities),
            Self::Settings | Self::Theme | Self::CustomVariant => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct ThemeAtRule {
    name: DirectiveName,
    prelude: ThemePrelude,
    body: Option<String>,
    start_byte: usize,
    body_start_byte: Option<usize>,
}

#[derive(Debug, Default)]
struct ThemeAtRuleParser {
    nested_directive: Option<(usize, DirectiveName)>,
}

impl<'i> AtRuleParser<'i> for ThemeAtRuleParser {
    type Prelude = ThemePrelude;
    type AtRule = ThemeAtRule;
    type Error = Infallible;

    fn parse_prelude<'t>(
        &mut self,
        name: CowRcStr<'i>,
        input: &mut Parser<'i, 't>,
        _options: &ParserOptions<'i>,
    ) -> Result<Self::Prelude, ParseError<'i, Self::Error>> {
        let directive_name = match name.as_ref() {
            name if name.eq_ignore_ascii_case("theme") => DirectiveName::Theme,
            name if name.eq_ignore_ascii_case("settings") => DirectiveName::Settings,
            name if name.eq_ignore_ascii_case("defaults") => DirectiveName::Defaults,
            name if name.eq_ignore_ascii_case("components") => DirectiveName::Components,
            name if name.eq_ignore_ascii_case("utilities") => DirectiveName::Utilities,
            name if name.eq_ignore_ascii_case("custom-variant") => DirectiveName::CustomVariant,
            _ => return Err(input.new_error(BasicParseErrorKind::AtRuleInvalid(name))),
        };
        let mut parts = Vec::new();
        while !input.is_exhausted() {
            parts.push(input.expect_ident_cloned()?.to_string());
        }
        parts.insert(0, directive_name.as_str().to_owned());
        Ok(ThemePrelude { parts })
    }

    fn rule_without_block(
        &mut self,
        prelude: Self::Prelude,
        start: &ParserState,
        _options: &ParserOptions<'i>,
        is_nested: bool,
    ) -> Result<Self::AtRule, ()> {
        let name = directive_name_from_prelude(&prelude);
        let prelude = ThemePrelude {
            parts: prelude.parts.into_iter().skip(1).collect(),
        };
        if is_nested {
            self.nested_directive = Some((start.position().byte_index(), name));
        }
        Ok(ThemeAtRule {
            name,
            prelude,
            body: None,
            start_byte: start.position().byte_index(),
            body_start_byte: None,
        })
    }

    fn parse_block<'t>(
        &mut self,
        prelude: Self::Prelude,
        start: &ParserState,
        input: &mut Parser<'i, 't>,
        _options: &ParserOptions<'i>,
        is_nested: bool,
    ) -> Result<Self::AtRule, ParseError<'i, Self::Error>> {
        let name = directive_name_from_prelude(&prelude);
        let prelude = ThemePrelude {
            parts: prelude.parts.into_iter().skip(1).collect(),
        };
        if is_nested {
            self.nested_directive = Some((start.position().byte_index(), name));
        }
        let body_start = input.position();
        while input.next_including_whitespace_and_comments().is_ok() {}
        Ok(ThemeAtRule {
            name,
            prelude,
            body: Some(input.slice_from(body_start).to_owned()),
            start_byte: start.position().byte_index(),
            body_start_byte: Some(body_start.byte_index()),
        })
    }
}

fn directive_name_from_prelude(prelude: &ThemePrelude) -> DirectiveName {
    match prelude.parts.first().map(String::as_str) {
        Some("settings") => DirectiveName::Settings,
        Some("defaults") => DirectiveName::Defaults,
        Some("components") => DirectiveName::Components,
        Some("utilities") => DirectiveName::Utilities,
        Some("custom-variant") => DirectiveName::CustomVariant,
        _ => DirectiveName::Theme,
    }
}

impl ToCss for ThemeAtRule {
    fn to_css<W: std::fmt::Write>(&self, _dest: &mut Printer<W>) -> Result<(), PrinterError> {
        Err(PrinterError {
            kind: PrinterErrorKind::FmtError,
            loc: None,
        })
    }
}

impl<'i, V: Visitor<'i, ThemeAtRule>> Visit<'i, ThemeAtRule, V> for ThemeAtRule {
    const CHILD_TYPES: VisitTypes = VisitTypes::empty();

    fn visit_children(&mut self, _visitor: &mut V) -> Result<(), V::Error> {
        Ok(())
    }
}

#[derive(Debug, Default)]
struct NativeClassNameCollector {
    class_names: Vec<String>,
}

impl<'i> Visitor<'i, ThemeAtRule> for NativeClassNameCollector {
    type Error = Infallible;

    fn visit_types(&self) -> VisitTypes {
        visit_types!(SELECTORS)
    }

    fn visit_selector(&mut self, selector: &mut Selector<'i>) -> Result<(), Self::Error> {
        for component in selector.iter_raw_match_order() {
            if let Component::Class(name) = component {
                let name = name.0.to_string();
                if !self.class_names.contains(&name) {
                    self.class_names.push(name);
                }
            }
        }
        selector.visit_children(self)
    }
}

fn selector_matches_class_filter(selector: &Selector<'_>, classes: &HashSet<String>) -> bool {
    let mut has_class = false;
    for component in selector.iter_raw_match_order() {
        if let Component::Class(name) = component {
            has_class = true;
            if classes.contains(name.0.as_ref()) {
                return true;
            }
        }
    }
    !has_class
}

fn filter_native_css_rules<'i, R>(
    rules: Vec<CssRule<'i, R>>,
    classes: &HashSet<String>,
) -> Vec<CssRule<'i, R>> {
    rules
        .into_iter()
        .filter_map(|rule| match rule {
            CssRule::Style(mut rule) => {
                rule.selectors
                    .0
                    .retain(|selector| selector_matches_class_filter(selector, classes));
                rule.rules.0 = filter_native_css_rules(rule.rules.0, classes);
                (!rule.selectors.0.is_empty()).then_some(CssRule::Style(rule))
            }
            CssRule::Media(mut rule) => {
                rule.rules.0 = filter_native_css_rules(rule.rules.0, classes);
                (!rule.rules.0.is_empty()).then_some(CssRule::Media(rule))
            }
            CssRule::Supports(mut rule) => {
                rule.rules.0 = filter_native_css_rules(rule.rules.0, classes);
                (!rule.rules.0.is_empty()).then_some(CssRule::Supports(rule))
            }
            CssRule::MozDocument(mut rule) => {
                rule.rules.0 = filter_native_css_rules(rule.rules.0, classes);
                (!rule.rules.0.is_empty()).then_some(CssRule::MozDocument(rule))
            }
            CssRule::Nesting(mut rule) => {
                rule.style
                    .selectors
                    .0
                    .retain(|selector| selector_matches_class_filter(selector, classes));
                rule.style.rules.0 = filter_native_css_rules(rule.style.rules.0, classes);
                (!rule.style.selectors.0.is_empty()).then_some(CssRule::Nesting(rule))
            }
            CssRule::LayerBlock(mut rule) => {
                rule.rules.0 = filter_native_css_rules(rule.rules.0, classes);
                (!rule.rules.0.is_empty()).then_some(CssRule::LayerBlock(rule))
            }
            CssRule::Container(mut rule) => {
                rule.rules.0 = filter_native_css_rules(rule.rules.0, classes);
                (!rule.rules.0.is_empty()).then_some(CssRule::Container(rule))
            }
            CssRule::Scope(mut rule) => {
                rule.rules.0 = filter_native_css_rules(rule.rules.0, classes);
                (!rule.rules.0.is_empty()).then_some(CssRule::Scope(rule))
            }
            CssRule::StartingStyle(mut rule) => {
                rule.rules.0 = filter_native_css_rules(rule.rules.0, classes);
                (!rule.rules.0.is_empty()).then_some(CssRule::StartingStyle(rule))
            }
            rule => Some(rule),
        })
        .collect()
}

fn default_filename() -> String {
    "master.css".into()
}

const fn default_true() -> bool {
    true
}

fn add_unique_string(target: &mut Vec<String>, value: &str) {
    if !target.iter().any(|existing| existing == value) {
        target.push(value.to_owned());
    }
}

fn add_unique_value(target: &mut Vec<Value>, value: Value) {
    if !target.contains(&value) {
        target.push(value);
    }
}

fn wildcard_regex_source(pattern: &str) -> String {
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

fn decode_css_quoted_string(source: &str) -> String {
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

fn extraction_policy_from_statements(
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
                        add_unique_value(
                            &mut policy.blocklist,
                            serde_json::json!({
                                "source": wildcard_regex_source(value),
                                "flags": ""
                            }),
                        );
                    } else {
                        add_unique_value(&mut policy.blocklist, Value::String(value.to_owned()));
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
    }
}

fn resolve_css_import_graph_file<P: CssImportProvider>(
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

fn directive_range(source: &str, byte_offset: usize) -> Option<SourceRange> {
    let directives = [
        "@theme",
        "@settings",
        "@defaults",
        "@components",
        "@utilities",
        "@custom-variant",
    ];
    let (start, keyword) = directives
        .into_iter()
        .flat_map(|keyword| {
            source
                .match_indices(keyword)
                .map(move |(start, _)| (start, keyword))
        })
        .min_by_key(|(start, _)| start.abs_diff(byte_offset))?;
    let end = (start + keyword.len()).min(source.len());
    Some(SourceRange {
        start: byte_to_utf16_offset(source, start)?,
        end: byte_to_utf16_offset(source, end)?,
    })
}

fn directive_error(
    source: &str,
    filename: &str,
    start_byte: usize,
    message: impl Into<String>,
) -> CompilerError {
    CompilerError::Directive {
        message: message.into(),
        filename: filename.to_owned(),
        range: directive_range(source, start_byte),
    }
}

fn parse_theme_prelude(
    source: &str,
    filename: &str,
    rule: &ThemeAtRule,
) -> Result<(Option<String>, bool, bool), CompilerError> {
    let mut mode = None;
    let mut inline = false;
    let mut is_static = false;
    for part in &rule.prelude.parts {
        match part.as_str() {
            "inline" => {
                if inline {
                    return Err(directive_error(
                        source,
                        filename,
                        rule.start_byte,
                        "@theme inline modifier cannot be repeated",
                    ));
                }
                inline = true;
            }
            "static" => {
                if is_static {
                    return Err(directive_error(
                        source,
                        filename,
                        rule.start_byte,
                        "@theme static modifier cannot be repeated",
                    ));
                }
                is_static = true;
            }
            _ => {
                if mode.is_some() {
                    return Err(directive_error(
                        source,
                        filename,
                        rule.start_byte,
                        "@theme mode must be a single token",
                    ));
                }
                mode = Some(part.clone());
            }
        }
    }
    if inline && is_static {
        return Err(directive_error(
            source,
            filename,
            rule.start_byte,
            "@theme inline and static cannot be combined",
        ));
    }
    if inline && mode.is_some() {
        return Err(directive_error(
            source,
            filename,
            rule.start_byte,
            "@theme inline cannot be mode-specific",
        ));
    }
    Ok((mode, inline, is_static))
}

#[allow(clippy::cmp_owned)] // Exact JSON number text is part of the JavaScript parity contract.
fn theme_value(value: String) -> Value {
    let value = value.trim().to_owned();
    serde_json::from_str::<Value>(&value)
        .ok()
        .filter(Value::is_number)
        .filter(|number| number.to_string() == value)
        .unwrap_or(Value::String(value))
}

fn next_char_end(value: &str, index: usize) -> usize {
    index
        + value[index..]
            .chars()
            .next()
            .map(char::len_utf8)
            .unwrap_or_default()
}

fn css_quote_end(value: &str, start: usize, quote: char) -> usize {
    let mut index = start + quote.len_utf8();
    while index < value.len() {
        let character = value[index..].chars().next().unwrap_or_default();
        let next = next_char_end(value, index);
        if character == '\\' {
            index = if next < value.len() {
                next_char_end(value, next)
            } else {
                next
            };
            continue;
        }
        index = next;
        if character == quote {
            return index;
        }
    }
    value.len()
}

fn css_comment_end(value: &str, start: usize) -> usize {
    value[start + 2..]
        .find("*/")
        .map(|offset| start + 2 + offset + 2)
        .unwrap_or(value.len())
}

fn css_function_end(value: &str, start: usize, name: &str) -> Option<usize> {
    let open = format!("{name}(");
    if !value[start..].starts_with(&open) {
        return None;
    }
    let mut index = start + open.len();
    let mut depth = 1_u32;
    while index < value.len() {
        let character = value[index..].chars().next()?;
        if matches!(character, '\'' | '"') {
            index = css_quote_end(value, index, character);
            continue;
        }
        if value[index..].starts_with("/*") {
            index = css_comment_end(value, index);
            continue;
        }
        index = next_char_end(value, index);
        match character {
            '(' => depth += 1,
            ')' => {
                depth = depth.checked_sub(1)?;
                if depth == 0 {
                    return Some(index);
                }
            }
            _ => {}
        }
    }
    None
}

fn is_css_number(value: &str) -> bool {
    let value = value
        .strip_prefix('+')
        .or_else(|| value.strip_prefix('-'))
        .unwrap_or(value);
    if value.is_empty() {
        return false;
    }
    if let Some(fraction) = value.strip_prefix('.') {
        return !fraction.is_empty() && fraction.bytes().all(|byte| byte.is_ascii_digit());
    }
    let mut parts = value.split('.');
    let integer = parts.next().unwrap_or_default();
    let fraction = parts.next();
    !integer.is_empty()
        && integer.bytes().all(|byte| byte.is_ascii_digit())
        && fraction.is_none_or(|fraction| {
            !fraction.is_empty() && fraction.bytes().all(|byte| byte.is_ascii_digit())
        })
        && parts.next().is_none()
}

fn format_alpha_percentage(value: f64) -> String {
    let value = if value == 0.0 {
        "0".to_owned()
    } else {
        value.to_string()
    };
    let value = value
        .strip_prefix("0.")
        .map(|fraction| format!(".{fraction}"))
        .or_else(|| {
            value
                .strip_prefix("-0.")
                .map(|fraction| format!("-.{fraction}"))
        })
        .unwrap_or(value);
    format!("{value}%")
}

fn is_whole_css_function(value: &str, name: &str) -> bool {
    let value = value.trim();
    css_function_end(value, 0, name) == Some(value.len())
}

fn normalize_alpha_value(value: &str) -> Result<String, String> {
    let value = value.trim();
    if value.is_empty() {
        return Err("Invalid --alpha() function: alpha value cannot be empty".into());
    }
    if is_css_number(value) {
        let alpha = value.parse::<f64>().unwrap_or(f64::NAN);
        if !(0.0..=1.0).contains(&alpha) {
            return Err(format!(
                "Invalid --alpha() function: numeric alpha must be between 0 and 1: {value}"
            ));
        }
        return Ok(format_alpha_percentage(alpha * 100.0));
    }
    if let Some(number) = value
        .strip_suffix('%')
        .filter(|number| is_css_number(number))
    {
        let percentage = number.parse::<f64>().unwrap_or(f64::NAN);
        if !(0.0..=100.0).contains(&percentage) {
            return Err(format!(
                "Invalid --alpha() function: percentage alpha must be between 0% and 100%: {value}"
            ));
        }
        return Ok(format_alpha_percentage(percentage));
    }
    if is_whole_css_function(value, "var") || is_whole_css_function(value, "calc") {
        return Ok(value.to_owned());
    }
    Err(format!(
        "Invalid --alpha() function: unsupported alpha value \"{value}\""
    ))
}

fn normalize_alpha_function(body: &str) -> Result<String, String> {
    let mut separator = None;
    let mut depth = 0_u32;
    let mut index = 0;
    while index < body.len() {
        let character = body[index..].chars().next().unwrap_or_default();
        if matches!(character, '\'' | '"') {
            index = css_quote_end(body, index, character);
            continue;
        }
        if body[index..].starts_with("/*") {
            index = css_comment_end(body, index);
            continue;
        }
        match character {
            '(' => depth += 1,
            ')' => depth = depth.saturating_sub(1),
            '/' if depth == 0 => {
                if separator.is_some() {
                    return Err("Invalid --alpha() function: expected \"<color> / <alpha>\"".into());
                }
                separator = Some(index);
            }
            _ => {}
        }
        index = next_char_end(body, index);
    }
    let separator = separator
        .ok_or_else(|| "Invalid --alpha() function: expected \"<color> / <alpha>\"".to_owned())?;
    let color = body[..separator].trim();
    if color.is_empty() {
        return Err("Invalid --alpha() function: color value cannot be empty".into());
    }
    let alpha = normalize_alpha_value(&body[separator + 1..])?;
    Ok(format!("color-mix(in oklab,{color} {alpha},transparent)"))
}

fn is_alias_character(byte: u8) -> bool {
    byte.is_ascii_alphanumeric() || matches!(byte, b'_' | b'-')
}

fn normalize_stylesheet_value(value: &str, replace_pipes: bool) -> Result<String, String> {
    let mut result = String::with_capacity(value.len());
    let mut index = 0;
    while index < value.len() {
        let character = value[index..].chars().next().unwrap_or_default();
        if matches!(character, '\'' | '"') {
            let end = css_quote_end(value, index, character);
            result.push_str(&value[index..end]);
            index = end;
            continue;
        }
        if value[index..].starts_with("/*") {
            let end = css_comment_end(value, index);
            result.push_str(&value[index..end]);
            index = end;
            continue;
        }
        if character == '$' && !value[..index].ends_with('\\') {
            let mut end = index + 1;
            if value.as_bytes().get(end) == Some(&b'-') {
                end += 1;
            }
            while value
                .as_bytes()
                .get(end)
                .is_some_and(|byte| is_alias_character(*byte))
            {
                end += 1;
            }
            if end > index + 1 {
                let alias = &value[index + 1..end];
                return Err(format!(
                    "Stylesheet values use native CSS variable references. Replace \"${alias}\" with \"var(--{alias})\"."
                ));
            }
        }
        if value[index..].starts_with("--alpha(")
            && let Some(end) = css_function_end(value, index, "--alpha")
        {
            let body_start = index + "--alpha(".len();
            result.push_str(&normalize_alpha_function(&value[body_start..end - 1])?);
            index = end;
            continue;
        }
        if replace_pipes && character == '|' {
            result.push(' ');
        } else {
            result.push(character);
        }
        index = next_char_end(value, index);
    }
    Ok(result)
}

fn normalize_theme_stylesheet_value(value: &str) -> Result<String, String> {
    normalize_stylesheet_value(value, true)
}

fn define_theme_variable(
    manifest_input: &mut CssDirectiveManifestInput,
    definition: CssDirectiveVariableDefinition,
) {
    let variables = manifest_input.variables.get_or_insert_default();
    if let Some(index) = variables
        .iter()
        .position(|existing| existing.name == definition.name && existing.mode == definition.mode)
    {
        variables.remove(index);
    }
    variables.push(definition);
}

fn declaration_name(declaration: &Property<'_>) -> Result<String, PrinterError> {
    declaration
        .property_id()
        .to_css_string(PrinterOptions::default())
}

fn collect_declarations(
    declarations: &DeclarationBlock<'_>,
    filename: &str,
) -> Result<serde_json::Map<String, Value>, CompilerError> {
    let mut result = serde_json::Map::new();
    for declaration in &declarations.declarations {
        let name = declaration_name(declaration).map_err(|error| CompilerError::Print {
            message: error.to_string(),
            filename: filename.to_owned(),
        })?;
        let value = declaration
            .value_to_css_string(PrinterOptions::default())
            .map_err(|error| CompilerError::Print {
                message: error.to_string(),
                filename: filename.to_owned(),
            })?;
        let value = normalize_stylesheet_value(&value, true).map_err(|message| {
            CompilerError::Directive {
                message,
                filename: filename.to_owned(),
                range: None,
            }
        })?;
        result.insert(name, Value::String(value));
    }
    for declaration in &declarations.important_declarations {
        let name = declaration_name(declaration).map_err(|error| CompilerError::Print {
            message: error.to_string(),
            filename: filename.to_owned(),
        })?;
        let value = declaration
            .value_to_css_string(PrinterOptions::default())
            .map_err(|error| CompilerError::Print {
                message: error.to_string(),
                filename: filename.to_owned(),
            })?;
        let value = normalize_stylesheet_value(&value, true).map_err(|message| {
            CompilerError::Directive {
                message,
                filename: filename.to_owned(),
                range: None,
            }
        })?;
        result.insert(name, Value::String(format!("{value} !important")));
    }
    Ok(result)
}

fn simple_ratio_literal(value: &str) -> bool {
    let Some((left, right)) = value.split_once('/') else {
        return false;
    };
    !left.trim().is_empty()
        && !right.trim().is_empty()
        && left
            .trim()
            .chars()
            .all(|character| character.is_ascii_digit() || matches!(character, '+' | '-' | '.'))
        && right
            .trim()
            .chars()
            .all(|character| character.is_ascii_digit() || matches!(character, '+' | '-' | '.'))
}

fn scientific_dimension_literal(value: &str) -> bool {
    let value = value.trim();
    let Some(exponent) = value.find(['e', 'E']) else {
        return false;
    };
    let mut unit_start = exponent + 1;
    if value
        .as_bytes()
        .get(unit_start)
        .is_some_and(|byte| matches!(byte, b'+' | b'-'))
    {
        unit_start += 1;
    }
    while value
        .as_bytes()
        .get(unit_start)
        .is_some_and(u8::is_ascii_digit)
    {
        unit_start += 1;
    }
    unit_start > exponent + 1
        && value[..unit_start].parse::<f64>().is_ok()
        && value[unit_start..]
            .chars()
            .all(|character| character.is_ascii_alphabetic() || character == '%')
}

fn raw_top_level_declarations(source: &str) -> Vec<(&str, &str)> {
    let mut declarations = Vec::new();
    let mut statement_start = 0;
    let mut index = 0;
    let mut parenthesis_depth = 0_u32;
    let mut bracket_depth = 0_u32;
    while index < source.len() {
        let character = source[index..].chars().next().unwrap_or_default();
        if matches!(character, '\'' | '"') {
            index = css_quote_end(source, index, character);
            continue;
        }
        if source[index..].starts_with("/*") {
            index = css_comment_end(source, index);
            continue;
        }
        match character {
            '(' => parenthesis_depth += 1,
            ')' => parenthesis_depth = parenthesis_depth.saturating_sub(1),
            '[' => bracket_depth += 1,
            ']' => bracket_depth = bracket_depth.saturating_sub(1),
            '{' if parenthesis_depth == 0 && bracket_depth == 0 => {
                index = css_block_end(source, index, source.len()).unwrap_or(source.len());
                statement_start = index;
                continue;
            }
            ';' if parenthesis_depth == 0 && bracket_depth == 0 => {
                let statement = source[statement_start..index].trim();
                if let Some((property, value)) = statement.split_once(':') {
                    declarations.push((property.trim(), value.trim()));
                }
                statement_start = index + 1;
            }
            _ => {}
        }
        index = next_char_end(source, index);
    }
    let statement = source[statement_start..].trim();
    if let Some((property, value)) = statement.split_once(':') {
        declarations.push((property.trim(), value.trim()));
    }
    declarations
}

fn preserve_compatible_literal_spelling(
    source: &str,
    start: usize,
    declarations: &mut serde_json::Map<String, Value>,
) {
    let Some(open) = source[start..].find('{').map(|offset| start + offset) else {
        return;
    };
    let Some(end) = css_block_end(source, open, source.len()) else {
        return;
    };
    for (property, raw_value) in raw_top_level_declarations(&source[open + 1..end - 1]) {
        let raw_value = raw_value
            .strip_suffix("!important")
            .map(str::trim_end)
            .unwrap_or(raw_value);
        if simple_ratio_literal(raw_value) {
            declarations.insert(
                property.into(),
                Value::String(raw_value.split_whitespace().collect()),
            );
        } else if scientific_dimension_literal(raw_value) {
            declarations.insert(property.into(), Value::String(raw_value.into()));
        }
    }
}

fn lower_theme_keyframes(
    source: &str,
    filename: &str,
    rule_start_byte: usize,
    keyframes_source: &str,
    is_static: bool,
    manifest_input: &mut CssDirectiveManifestInput,
) -> Result<(), CompilerError> {
    let stylesheet = StyleSheet::parse(
        keyframes_source,
        ParserOptions {
            filename: filename.to_owned(),
            ..ParserOptions::default()
        },
    )
    .map_err(|error| CompilerError::Parse {
        message: error.to_string(),
        filename: filename.to_owned(),
        range: directive_range(source, rule_start_byte),
    })?;
    let mut found = false;
    for css_rule in stylesheet.rules.0 {
        let CssRule::Keyframes(keyframes) = css_rule else {
            return Err(directive_error(
                source,
                filename,
                rule_start_byte,
                "@theme only accepts theme token declarations and @keyframes definitions",
            ));
        };
        found = true;
        let name = match keyframes.name {
            KeyframesName::Ident(name) => name.0.to_string(),
            KeyframesName::Custom(name) => name.to_string(),
        };
        if name.is_empty() {
            return Err(directive_error(
                source,
                filename,
                rule_start_byte,
                "@keyframes requires a name",
            ));
        }
        let mut frames = serde_json::Map::new();
        for keyframe in keyframes.keyframes {
            let declarations =
                Value::Object(collect_declarations(&keyframe.declarations, filename)?);
            for selector in keyframe.selectors {
                let selector =
                    selector
                        .to_css_string(PrinterOptions::default())
                        .map_err(|error| CompilerError::Print {
                            message: error.to_string(),
                            filename: filename.to_owned(),
                        })?;
                frames.insert(selector, declarations.clone());
            }
        }
        manifest_input
            .animations
            .get_or_insert_default()
            .insert(name.clone(), Value::Object(frames));
        if is_static {
            manifest_input
                .animation_options
                .get_or_insert_default()
                .insert(name, serde_json::json!({ "static": true }));
        }
    }
    if !found {
        return Err(directive_error(
            source,
            filename,
            rule_start_byte,
            "@keyframes requires a name",
        ));
    }
    Ok(())
}

fn strict_css_number(value: &str) -> Option<f64> {
    let number = value.parse::<f64>().ok()?;
    let normalized = if number == 0.0 {
        "0".to_owned()
    } else {
        number.to_string()
    };
    (normalized == value).then_some(number)
}

fn add_mode(manifest_input: &mut CssDirectiveManifestInput, mode: &str) {
    let modes = manifest_input.modes.get_or_insert_default();
    if !modes.iter().any(|existing| existing == mode) {
        modes.push(mode.to_owned());
    }
}

fn lower_settings_rule(
    source: &str,
    filename: &str,
    rule: ThemeAtRule,
    manifest_input: &mut CssDirectiveManifestInput,
) -> Result<(), CompilerError> {
    if !rule.prelude.parts.is_empty() {
        return Err(directive_error(
            source,
            filename,
            rule.start_byte,
            format!(
                "Unsupported @settings section: {}",
                rule.prelude.parts.join(" ")
            ),
        ));
    }
    let body = rule.body.as_deref().ok_or_else(|| {
        directive_error(
            source,
            filename,
            rule.start_byte,
            "@settings requires a style block",
        )
    })?;
    let declarations = DeclarationBlock::parse_string(
        body,
        ParserOptions {
            filename: filename.to_owned(),
            ..ParserOptions::default()
        },
    )
    .map_err(|error| directive_error(source, filename, rule.start_byte, error.to_string()))?;
    for declaration in declarations.declarations {
        let property = declaration_name(&declaration).map_err(|error| CompilerError::Print {
            message: error.to_string(),
            filename: filename.to_owned(),
        })?;
        let value = declaration
            .value_to_css_string(PrinterOptions::default())
            .map_err(|error| CompilerError::Print {
                message: error.to_string(),
                filename: filename.to_owned(),
            })?;
        match property.as_str() {
            "root-size" => {
                manifest_input.root_size = Some(strict_css_number(&value).ok_or_else(|| {
                    directive_error(
                        source,
                        filename,
                        rule.start_byte,
                        "root-size must be a number",
                    )
                })?);
            }
            "base-unit" => {
                manifest_input.base_unit = Some(strict_css_number(&value).ok_or_else(|| {
                    directive_error(
                        source,
                        filename,
                        rule.start_byte,
                        "base-unit must be a number",
                    )
                })?);
            }
            "default-mode" => {
                if value == "false" {
                    return Err(directive_error(
                        source,
                        filename,
                        rule.start_byte,
                        "default-mode must be a mode name or none",
                    ));
                }
                manifest_input.default_mode = Some(value);
            }
            "mode-trigger" => {
                if !matches!(value.as_str(), "class" | "media" | "host") {
                    return Err(directive_error(
                        source,
                        filename,
                        rule.start_byte,
                        "mode-trigger must be class, media, or host",
                    ));
                }
                manifest_input.mode_trigger = Some(value);
            }
            "important" => {
                manifest_input.important = Some(match value.as_str() {
                    "on" => true,
                    "off" => false,
                    _ => {
                        return Err(directive_error(
                            source,
                            filename,
                            rule.start_byte,
                            "important must be on or off",
                        ));
                    }
                });
            }
            "modes" => {
                for mode in value
                    .split(',')
                    .flat_map(str::split_whitespace)
                    .filter(|mode| !mode.is_empty())
                {
                    add_mode(manifest_input, mode);
                }
            }
            "scope" => manifest_input.scope = Some(value),
            _ => {
                return Err(directive_error(
                    source,
                    filename,
                    rule.start_byte,
                    format!("Unsupported @settings option: {property}"),
                ));
            }
        }
    }
    if let Some(declaration) = declarations.important_declarations.first() {
        let property = declaration_name(declaration).map_err(|error| CompilerError::Print {
            message: error.to_string(),
            filename: filename.to_owned(),
        })?;
        return Err(directive_error(
            source,
            filename,
            rule.start_byte,
            format!("@settings does not accept !important declarations: {property}"),
        ));
    }
    Ok(())
}

fn lower_theme_rule(
    source: &str,
    filename: &str,
    rule: ThemeAtRule,
    manifest_input: &mut CssDirectiveManifestInput,
) -> Result<(), CompilerError> {
    let (mode, inline, is_static) = parse_theme_prelude(source, filename, &rule)?;
    let body = rule.body.as_deref().ok_or_else(|| {
        directive_error(
            source,
            filename,
            rule.start_byte,
            "@theme requires a style block",
        )
    })?;
    if let Some(mode) = &mode {
        let modes = manifest_input.modes.get_or_insert_default();
        if !modes.contains(mode) {
            modes.push(mode.clone());
        }
    }

    let (declaration_source, keyframe_blocks) =
        extract_top_level_at_rule_blocks(body, &["keyframes", "-webkit-keyframes"]);
    if !keyframe_blocks.is_empty() && (mode.is_some() || inline) {
        return Err(directive_error(
            source,
            filename,
            rule.start_byte,
            "@theme keyframes cannot be mode-specific or inline",
        ));
    }
    for keyframes in keyframe_blocks {
        lower_theme_keyframes(
            source,
            filename,
            rule.start_byte,
            &keyframes.source,
            is_static,
            manifest_input,
        )?;
    }

    let declarations = DeclarationBlock::parse_string(
        &declaration_source,
        ParserOptions {
            filename: filename.to_owned(),
            ..ParserOptions::default()
        },
    )
    .map_err(|error| directive_error(source, filename, rule.start_byte, error.to_string()))?;

    for declaration in declarations.declarations {
        let value = declaration
            .value_to_css_string(PrinterOptions::default())
            .map_err(|error| CompilerError::Print {
                message: error.to_string(),
                filename: filename.to_owned(),
            })?;
        let value = normalize_theme_stylesheet_value(&value)
            .map_err(|message| directive_error(source, filename, rule.start_byte, message))?;
        let Property::Custom(custom) = declaration else {
            return Err(directive_error(
                source,
                filename,
                rule.start_byte,
                format!(
                    "@theme token declarations must be CSS custom properties: {}",
                    declaration.property_id().name()
                ),
            ));
        };
        let property = custom.name.as_ref();
        let name = property.strip_prefix("--").filter(|name| !name.is_empty());
        let Some(name) = name else {
            return Err(directive_error(
                source,
                filename,
                rule.start_byte,
                if property == "--" {
                    "@theme token name cannot be empty".to_owned()
                } else {
                    format!("@theme token declarations must be CSS custom properties: {property}")
                },
            ));
        };
        define_theme_variable(
            manifest_input,
            CssDirectiveVariableDefinition {
                name: Some(name.to_owned()),
                value: theme_value(value),
                mode: mode.clone(),
                inline: inline.then_some(true),
                r#static: is_static.then_some(true),
                namespace: None,
                key: None,
            },
        );
    }

    if let Some(declaration) = declarations.important_declarations.first() {
        let property_id = declaration.property_id();
        let property = property_id.name().trim_start_matches("--");
        return Err(directive_error(
            source,
            filename,
            rule.start_byte,
            format!("@theme token declarations cannot be !important: {property}"),
        ));
    }
    Ok(())
}

fn custom_variant_branch(
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

fn collect_custom_variant_branches(
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
                if selectors.iter().any(|selector| !selector.contains('&')) {
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
                        &child_selector.replace('&', selector),
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

fn lower_custom_variant_rule(
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

fn byte_offset_for_location(source: &str, line: u32, column: u32) -> Option<usize> {
    let mut line_start = 0;
    for _ in 0..line {
        let newline = source[line_start..].find('\n')?;
        line_start += newline + 1;
    }
    let target = column.saturating_sub(1);
    let mut utf16_column = 0_u32;
    let mut byte_offset = line_start;
    for character in source[line_start..].chars() {
        if character == '\n' || utf16_column >= target {
            break;
        }
        let width = character.len_utf16() as u32;
        if utf16_column + width > target {
            return None;
        }
        utf16_column += width;
        byte_offset += character.len_utf8();
    }
    (utf16_column == target).then_some(byte_offset)
}

fn source_location(source: &str, byte_offset: usize) -> Option<SourceLocation> {
    let prefix = source.get(..byte_offset)?;
    let line = prefix.bytes().filter(|byte| *byte == b'\n').count() as u32 + 1;
    let line_start = prefix.rfind('\n').map_or(0, |index| index + 1);
    let column = source[line_start..byte_offset].encode_utf16().count() as u32 + 1;
    Some(SourceLocation { line, column })
}

fn selector_end_byte(source: &str, start: usize) -> Option<usize> {
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

fn selector_source_reference(
    source: &str,
    filename: &str,
    body: &str,
    body_start_byte: usize,
    line: u32,
    column: u32,
) -> Option<CssDirectiveSourceReference> {
    let local_start = byte_offset_for_location(body, line, column)?;
    let start = body_start_byte.checked_add(local_start)?;
    let end = selector_end_byte(source, start)?;
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

fn source_reference_from_bytes(
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

fn managed_selector_definition(
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

fn printed_selectors(
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

fn combine_managed_selectors(parent: &[String], child: &[String]) -> Vec<String> {
    let mut selectors = Vec::with_capacity(parent.len() * child.len());
    for child in child {
        for parent in parent {
            selectors.push(if child.contains('&') {
                child.replace('&', parent)
            } else {
                format!("{parent} {child}")
            });
        }
    }
    selectors
}

fn rewrite_managed_variant_directives(source: &str) -> (String, HashMap<usize, String>) {
    let mut rewritten = source.to_owned();
    let mut variants = HashMap::new();
    let mut index = 0;
    while index < source.len() {
        let character = source[index..].chars().next().unwrap_or_default();
        if matches!(character, '\'' | '"') {
            index = css_quote_end(source, index, character);
            continue;
        }
        if source[index..].starts_with("/*") {
            index = css_comment_end(source, index);
            continue;
        }
        if source[index..].starts_with("@light")
            && source
                .as_bytes()
                .get(index + "@light".len())
                .is_none_or(|byte| !is_alias_character(*byte))
        {
            variants.insert(index, "@light".into());
            rewritten.replace_range(index..index + "@light".len(), "@media");
            index += "@light".len();
            continue;
        }
        if source[index..].starts_with("@dark")
            && source
                .as_bytes()
                .get(index + "@dark".len())
                .is_some_and(|byte| matches!(byte, b' ' | b'\t'))
        {
            variants.insert(index, "@dark".into());
            rewritten.replace_range(index..index + "@dark".len() + 1, "@media");
            index += "@dark".len() + 1;
            continue;
        }
        if source[index..].starts_with("@variant")
            && source
                .as_bytes()
                .get(index + "@variant".len())
                .is_none_or(|byte| !is_alias_character(*byte))
        {
            let mut token_start = index + "@variant".len();
            while source
                .as_bytes()
                .get(token_start)
                .is_some_and(u8::is_ascii_whitespace)
            {
                token_start += 1;
            }
            let mut token_end = token_start;
            while source
                .as_bytes()
                .get(token_end)
                .is_some_and(|byte| !byte.is_ascii_whitespace() && *byte != b'{')
            {
                token_end += 1;
            }
            if token_end > token_start {
                variants.insert(index, format!("@{}", &source[token_start..token_end]));
                rewritten.replace_range(index..index + "@variant".len(), "@media  ");
            }
            index = token_end;
            continue;
        }
        index = next_char_end(source, index);
    }
    (rewritten, variants)
}

fn validate_condition_variant_syntax(source: &str, filename: &str) -> Result<(), CompilerError> {
    for (directive, message_for_at, message_for_selector) in [
        (
            "@custom-variant",
            "@custom-variant uses bare condition variant names",
            "@custom-variant only defines condition variants",
        ),
        (
            "@variant",
            "@variant only applies condition variants",
            "@variant only applies condition variants",
        ),
    ] {
        let mut start = 0;
        while start < source.len() {
            let character = source[start..].chars().next().unwrap_or_default();
            if matches!(character, '\'' | '"') {
                start = css_quote_end(source, start, character);
                continue;
            }
            if source[start..].starts_with("/*") {
                start = css_comment_end(source, start);
                continue;
            }
            if !source[start..].starts_with(directive) {
                start = next_char_end(source, start);
                continue;
            }
            let after_directive = start + directive.len();
            if source
                .as_bytes()
                .get(after_directive)
                .is_some_and(|byte| is_alias_character(*byte))
            {
                start = after_directive;
                continue;
            }
            let mut token_start = after_directive;
            while source
                .as_bytes()
                .get(token_start)
                .is_some_and(u8::is_ascii_whitespace)
            {
                token_start += 1;
            }
            match source.as_bytes().get(token_start) {
                Some(b'@') => {
                    return Err(directive_error(source, filename, start, message_for_at));
                }
                Some(b':') => {
                    return Err(directive_error(
                        source,
                        filename,
                        start,
                        message_for_selector,
                    ));
                }
                _ => {}
            }
            start = after_directive;
        }
    }
    Ok(())
}

fn validate_compose_syntax(source: &str, filename: &str) -> Result<(), CompilerError> {
    let mut index = 0;
    while index < source.len() {
        let character = source[index..].chars().next().unwrap_or_default();
        if matches!(character, '\'' | '"') {
            index = css_quote_end(source, index, character);
            continue;
        }
        if source[index..].starts_with("/*") {
            index = css_comment_end(source, index);
            continue;
        }
        if !source[index..].starts_with("@compose")
            || source
                .as_bytes()
                .get(index + "@compose".len())
                .is_some_and(|byte| is_alias_character(*byte))
        {
            index = next_char_end(source, index);
            continue;
        }
        let directive_start = index;
        index += "@compose".len();
        while source
            .as_bytes()
            .get(index)
            .is_some_and(u8::is_ascii_whitespace)
        {
            index += 1;
        }
        if source.as_bytes().get(index) == Some(&b'{') {
            return Err(directive_error(
                source,
                filename,
                directive_start,
                "@compose does not accept group syntax",
            ));
        }
        let mut cursor = index;
        while cursor < source.len() {
            let character = source[cursor..].chars().next().unwrap_or_default();
            if matches!(character, '\'' | '"') {
                return Err(directive_error(
                    source,
                    filename,
                    directive_start,
                    "@compose only accepts unquoted class lists",
                ));
            }
            if source[cursor..].starts_with("/*") {
                cursor = css_comment_end(source, cursor);
                continue;
            }
            if character == ';' {
                index = cursor + 1;
                break;
            }
            cursor = next_char_end(source, cursor);
        }
        if cursor >= source.len() {
            index = cursor;
        }
    }
    Ok(())
}

#[derive(Debug, Clone)]
enum ParsedManagedPattern {
    Pattern {
        name: String,
        prefix: String,
        values: Vec<String>,
        value_map: Option<serde_json::Map<String, Value>>,
    },
    Dynamic {
        name: String,
        key: String,
        variable_alias_refs: Vec<String>,
        kind: Option<String>,
        values: Vec<String>,
        arbitrary: bool,
    },
}

impl ParsedManagedPattern {
    fn definition(&self, layer: UtilityLayerName) -> serde_json::Map<String, Value> {
        let mut definition = serde_json::Map::new();
        match self {
            Self::Pattern {
                name,
                prefix,
                values,
                value_map,
            } => {
                definition.insert("name".into(), Value::String(name.clone()));
                definition.insert("type".into(), Value::String("pattern".into()));
                definition.insert(
                    "layer".into(),
                    serde_json::to_value(layer).expect("layer serializes"),
                );
                let mut pattern = serde_json::Map::new();
                pattern.insert("prefix".into(), Value::String(prefix.clone()));
                pattern.insert(
                    "values".into(),
                    Value::Array(values.iter().cloned().map(Value::String).collect()),
                );
                if let Some(value_map) = value_map {
                    pattern.insert("valueMap".into(), Value::Object(value_map.clone()));
                }
                definition.insert("pattern".into(), Value::Object(pattern));
            }
            Self::Dynamic {
                name,
                key,
                variable_alias_refs,
                kind,
                values,
                arbitrary,
            } => {
                definition.insert("name".into(), Value::String(name.clone()));
                definition.insert("type".into(), Value::String("dynamic".into()));
                definition.insert(
                    "layer".into(),
                    serde_json::to_value(layer).expect("layer serializes"),
                );
                let mut dynamic = serde_json::Map::new();
                dynamic.insert("key".into(), Value::String(key.clone()));
                if !variable_alias_refs.is_empty() {
                    dynamic.insert(
                        "variableAliasRefs".into(),
                        Value::Array(
                            variable_alias_refs
                                .iter()
                                .cloned()
                                .map(Value::String)
                                .collect(),
                        ),
                    );
                }
                if let Some(kind) = kind {
                    dynamic.insert("kind".into(), Value::String(kind.clone()));
                }
                if !values.is_empty() {
                    dynamic.insert(
                        "values".into(),
                        Value::Array(values.iter().cloned().map(Value::String).collect()),
                    );
                }
                if *arbitrary {
                    dynamic.insert("arbitrary".into(), Value::Bool(true));
                }
                definition.insert("dynamic".into(), Value::Object(dynamic));
            }
        }
        definition
    }
}

fn valid_pattern_token(value: &str, allow_leading_digit: bool) -> bool {
    let value = value.strip_prefix('-').unwrap_or(value);
    let mut characters = value.chars();
    let Some(first) = characters.next() else {
        return false;
    };
    let valid_first = first == '_'
        || first.is_ascii_alphabetic()
        || (allow_leading_digit && first.is_ascii_digit());
    valid_first
        && characters.all(|character| {
            character == '_' || character == '-' || character.is_ascii_alphanumeric()
        })
}

fn managed_pattern_parts(pattern: &str) -> Result<(&str, &str, &str), String> {
    let start = pattern
        .find('<')
        .ok_or_else(|| "Managed pattern must contain exactly one <...> segment".to_owned())?;
    let end = pattern
        .find('>')
        .ok_or_else(|| "Managed pattern must contain exactly one <...> segment".to_owned())?;
    if pattern[start + 1..].contains('<') || pattern[end + 1..].contains('>') || end < start {
        return Err("Managed pattern must contain exactly one <...> segment".into());
    }
    Ok((
        &pattern[..start],
        &pattern[start + 1..end],
        &pattern[end + 1..],
    ))
}

fn parse_managed_enum_pattern(pattern: &str) -> Result<ParsedManagedPattern, String> {
    let (prefix, raw_values, suffix) = managed_pattern_parts(pattern)?;
    if prefix.is_empty() || !suffix.is_empty() {
        return Err("Managed enum pattern must use a prefix before <...> and no suffix".into());
    }
    let raw_values = raw_values.trim();
    if raw_values.is_empty() {
        return Err("Managed enum pattern cannot be empty".into());
    }
    if raw_values.contains(',') {
        return Err(
            "Managed enum pattern values must use \"|\" separators like text-<left|right>".into(),
        );
    }
    let entries = raw_values.split('|').map(str::trim).collect::<Vec<_>>();
    if entries.len() < 2 || entries.iter().any(|value| value.is_empty()) {
        return Err("Managed enum pattern requires at least two values separated by \"|\"".into());
    }
    let mut values = Vec::with_capacity(entries.len());
    let mut value_map = serde_json::Map::new();
    let mut canonical = Vec::with_capacity(entries.len());
    let mut has_mapping = false;
    for entry in entries {
        let mut mapping = entry.split('=');
        let class_value = mapping.next().unwrap_or_default().trim();
        let emitted_value = mapping.next().map(str::trim).unwrap_or(class_value);
        if class_value.is_empty() || emitted_value.is_empty() || mapping.next().is_some() {
            return Err(format!("Invalid managed enum mapping: {entry}"));
        }
        if !valid_pattern_token(class_value, true) {
            return Err(format!("Invalid managed enum value: {class_value}"));
        }
        if !valid_pattern_token(emitted_value, true) {
            return Err(format!(
                "Invalid managed enum mapped value: {emitted_value}"
            ));
        }
        values.push(class_value.to_owned());
        value_map.insert(
            class_value.to_owned(),
            Value::String(emitted_value.to_owned()),
        );
        if entry.contains('=') {
            has_mapping = true;
            canonical.push(format!("{class_value}={emitted_value}"));
        } else {
            canonical.push(class_value.to_owned());
        }
    }
    Ok(ParsedManagedPattern::Pattern {
        name: format!("{prefix}<{}>", canonical.join("|")),
        prefix: prefix.to_owned(),
        values,
        value_map: has_mapping.then_some(value_map),
    })
}

fn parse_managed_dynamic_pattern(pattern: &str) -> Result<ParsedManagedPattern, String> {
    let (prefix, raw_values, suffix) = managed_pattern_parts(pattern)?;
    if !prefix.ends_with(':') || prefix == ":" || !suffix.is_empty() {
        return Err("Managed dynamic utilities must use key:<...> syntax".into());
    }
    let key = &prefix[..prefix.len() - 1];
    if !valid_pattern_token(key, false) {
        return Err(format!("Invalid managed dynamic utility key: {key}"));
    }
    let raw_values = raw_values.trim();
    if raw_values.is_empty() {
        return Err("Managed dynamic utility source list cannot be empty".into());
    }
    if raw_values.contains(',') {
        return Err("Managed dynamic utility source lists must use \"|\" separators like font:<~font-size|number>".into());
    }
    let entries = raw_values.split('|').map(str::trim).collect::<Vec<_>>();
    if entries.iter().any(|value| value.is_empty()) {
        return Err("Managed dynamic utility source list cannot contain empty entries".into());
    }
    let mut aliases = Vec::new();
    let mut canonical = Vec::new();
    let mut literal_values = Vec::new();
    let mut kind: Option<String> = None;
    let mut arbitrary = false;
    let add_unique = |values: &mut Vec<String>, value: &str| {
        if !values.iter().any(|existing| existing == value) {
            values.push(value.to_owned());
        }
    };
    for value in entries {
        if value.starts_with('~') || value.starts_with('=') {
            let namespace = &value[1..];
            if !valid_pattern_token(namespace, false) || namespace.starts_with('-') {
                return Err(format!(
                    "Invalid managed dynamic utility namespace: {value}"
                ));
            }
            add_unique(&mut aliases, value);
            add_unique(&mut canonical, value);
            continue;
        }
        if matches!(value, "number" | "color" | "image") {
            if kind.as_deref().is_some_and(|existing| existing != value) {
                return Err(
                    "Managed dynamic utilities only support one raw value kind per entry".into(),
                );
            }
            kind = Some(value.to_owned());
            if value == "color" {
                add_unique(&mut aliases, "~color");
                // The implicit color namespace is part of the canonical managed
                // pattern name as well as its matcher metadata. Keep it before
                // the raw `color` source to match JavaScript insertion order.
                add_unique(&mut canonical, "~color");
            }
            add_unique(&mut canonical, value);
            continue;
        }
        if value == "*" {
            arbitrary = true;
            add_unique(&mut canonical, value);
            continue;
        }
        if valid_pattern_token(value, true) {
            add_unique(&mut literal_values, value);
            add_unique(&mut canonical, value);
            continue;
        }
        return Err(format!(
            "Unsupported managed dynamic utility source: {value}"
        ));
    }
    if arbitrary && !literal_values.is_empty() {
        return Err("Managed dynamic utility wildcard cannot be combined with enum values".into());
    }
    if !literal_values.is_empty() {
        if !aliases.is_empty() {
            return Err(
                "Managed dynamic utility enum values cannot be combined with namespaces".into(),
            );
        }
        if kind.is_none() && literal_values.len() < 2 {
            return Err("Managed dynamic utility enum source requires at least two values separated by \"|\"".into());
        }
    }
    Ok(ParsedManagedPattern::Dynamic {
        name: format!("{key}:<{}>", canonical.join("|")),
        key: key.to_owned(),
        variable_alias_refs: aliases,
        kind,
        values: literal_values,
        arbitrary,
    })
}

fn parse_managed_pattern(pattern: &str) -> Result<ParsedManagedPattern, String> {
    let pattern = pattern.trim();
    if pattern.is_empty() {
        return Err("Managed pattern requires a name".into());
    }
    let (prefix, _, _) = managed_pattern_parts(pattern)?;
    if prefix.ends_with(':') {
        parse_managed_dynamic_pattern(pattern)
    } else {
        parse_managed_enum_pattern(pattern)
    }
}

fn css_block_end(source: &str, open: usize, limit: usize) -> Option<usize> {
    let mut index = open + 1;
    let mut depth = 1_u32;
    while index < limit {
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
            '{' => depth += 1,
            '}' => {
                depth -= 1;
                if depth == 0 {
                    return Some(index);
                }
            }
            _ => {}
        }
        index = next_char_end(source, index);
    }
    None
}

fn css_statement_delimiter(source: &str, start: usize, limit: usize) -> Option<(usize, char)> {
    let mut index = start;
    let mut parentheses = 0_u32;
    let mut square = 0_u32;
    while index < limit {
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
            '(' => parentheses += 1,
            ')' => parentheses = parentheses.saturating_sub(1),
            '[' => square += 1,
            ']' => square = square.saturating_sub(1),
            ';' | '{' if parentheses == 0 && square == 0 => return Some((index, character)),
            _ => {}
        }
        index = next_char_end(source, index);
    }
    None
}

fn skip_css_trivia(source: &str, mut index: usize, limit: usize) -> usize {
    while index < limit {
        let before = index;
        while source[index..]
            .chars()
            .next()
            .is_some_and(char::is_whitespace)
        {
            index = next_char_end(source, index);
        }
        if index < limit && source[index..].starts_with("/*") {
            index = css_comment_end(source, index).min(limit);
        }
        if index == before {
            break;
        }
    }
    index
}

fn trim_byte_range(source: &str, mut start: usize, mut end: usize) -> (usize, usize) {
    while start < end
        && source[start..]
            .chars()
            .next()
            .is_some_and(char::is_whitespace)
    {
        start = next_char_end(source, start);
    }
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
    (start, end)
}

fn collect_managed_pattern_masks(
    source: &str,
    start: usize,
    end: usize,
    rewritten: &mut String,
    patterns: &mut HashMap<usize, ParsedManagedPattern>,
) -> Result<(), String> {
    let mut index = start;
    while index < end {
        index = skip_css_trivia(source, index, end);
        if index >= end {
            break;
        }
        let Some((delimiter, kind)) = css_statement_delimiter(source, index, end) else {
            break;
        };
        if kind == ';' {
            index = delimiter + 1;
            continue;
        }
        let close = css_block_end(source, delimiter, end).unwrap_or(end.saturating_sub(1));
        let (name_start, name_end) = trim_byte_range(source, index, delimiter);
        let name = &source[name_start..name_end];
        if name.starts_with('@') {
            collect_managed_pattern_masks(source, delimiter + 1, close, rewritten, patterns)?;
        } else if name.contains('<') || name.contains('>') {
            let pattern = parse_managed_pattern(name)?;
            let mask = format!("m{}", "_".repeat(name_end.saturating_sub(name_start + 1)));
            rewritten.replace_range(name_start..name_end, &mask);
            patterns.insert(name_start, pattern);
        }
        index = close.saturating_add(1);
    }
    Ok(())
}

fn mask_managed_pattern_names(
    source: &str,
) -> Result<(String, HashMap<usize, ParsedManagedPattern>), String> {
    let mut rewritten = source.to_owned();
    let mut patterns = HashMap::new();
    collect_managed_pattern_masks(source, 0, source.len(), &mut rewritten, &mut patterns)?;
    Ok((rewritten, patterns))
}

fn minified_css<T: ToCss>(value: &T, filename: &str) -> Result<String, CompilerError> {
    value
        .to_css_string(PrinterOptions {
            minify: true,
            ..PrinterOptions::default()
        })
        .map_err(|error| CompilerError::Print {
            message: error.to_string(),
            filename: filename.to_owned(),
        })
}

fn condition_properties(
    path: &[CssDirectiveConditionPathEntry],
) -> (
    Option<Vec<String>>,
    Option<Vec<CssDirectiveConditionPathEntry>>,
) {
    if path.is_empty() {
        return (None, None);
    }
    let conditions = path
        .iter()
        .map(|entry| match entry {
            CssDirectiveConditionPathEntry::Condition { value } => Some(value.clone()),
            CssDirectiveConditionPathEntry::Variant { .. } => None,
        })
        .collect::<Option<Vec<_>>>();
    (conditions, Some(path.to_vec()))
}

fn insert_condition_properties(
    object: &mut serde_json::Map<String, Value>,
    condition_path: &[CssDirectiveConditionPathEntry],
) {
    let (conditions, path) = condition_properties(condition_path);
    if let Some(conditions) = conditions {
        object.insert(
            "conditions".into(),
            Value::Array(conditions.into_iter().map(Value::String).collect()),
        );
    }
    if let Some(path) = path {
        object.insert(
            "conditionPath".into(),
            serde_json::to_value(path).expect("condition path serializes"),
        );
    }
}

fn push_pattern_declarations(
    definition: &mut serde_json::Map<String, Value>,
    declarations: serde_json::Map<String, Value>,
    selector: &str,
    condition_path: &[CssDirectiveConditionPathEntry],
) {
    if declarations.is_empty() {
        return;
    }
    let can_inline = selector == "&"
        && condition_path.is_empty()
        && !definition.contains_key("declarations")
        && !definition.contains_key("rules");
    if can_inline {
        definition.insert("declarations".into(), Value::Object(declarations));
        return;
    }

    let previous = definition.remove("declarations");
    let rules = definition
        .entry("rules")
        .or_insert_with(|| Value::Array(Vec::new()))
        .as_array_mut()
        .expect("pattern rules are an array");
    if let Some(previous) = previous {
        let mut rule = serde_json::Map::new();
        rule.insert("declarations".into(), previous);
        rules.push(Value::Object(rule));
    }
    let mut rule = serde_json::Map::new();
    rule.insert("declarations".into(), Value::Object(declarations));
    if selector != "&" {
        rule.insert("selector".into(), Value::String(selector.to_owned()));
    }
    insert_condition_properties(&mut rule, condition_path);
    rules.push(Value::Object(rule));
}

#[allow(clippy::too_many_arguments)]
fn lower_managed_pattern_rule_list(
    source: &str,
    filename: &str,
    body: &str,
    rules: Vec<CssRule<'_>>,
    selectors: &[String],
    condition_path: &[CssDirectiveConditionPathEntry],
    variant_rule_offsets: &HashMap<usize, String>,
    definition: &mut serde_json::Map<String, Value>,
) -> Result<(), CompilerError> {
    for child in rules {
        match child {
            CssRule::Style(child) => {
                let child_selectors = printed_selectors(&child.selectors.0, filename)?;
                let combined = combine_managed_selectors(selectors, &child_selectors);
                lower_managed_pattern_style(
                    source,
                    filename,
                    body,
                    child,
                    &combined,
                    condition_path,
                    variant_rule_offsets,
                    definition,
                )?;
            }
            CssRule::NestedDeclarations(child) => {
                let declarations = collect_declarations(&child.declarations, filename)?;
                for selector in selectors {
                    push_pattern_declarations(
                        definition,
                        declarations.clone(),
                        selector,
                        condition_path,
                    );
                }
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
                lower_managed_pattern_rule_list(
                    source,
                    filename,
                    body,
                    media.rules.0,
                    selectors,
                    &path,
                    variant_rule_offsets,
                    definition,
                )?;
            }
            CssRule::Supports(supports) => {
                let mut path = condition_path.to_vec();
                path.push(CssDirectiveConditionPathEntry::Condition {
                    value: format!("@supports {}", minified_css(&supports.condition, filename)?),
                });
                lower_managed_pattern_rule_list(
                    source,
                    filename,
                    body,
                    supports.rules.0,
                    selectors,
                    &path,
                    variant_rule_offsets,
                    definition,
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
                lower_managed_pattern_rule_list(
                    source,
                    filename,
                    body,
                    container.rules.0,
                    selectors,
                    &path,
                    variant_rule_offsets,
                    definition,
                )?;
            }
            CssRule::StartingStyle(starting_style) => {
                let mut path = condition_path.to_vec();
                path.push(CssDirectiveConditionPathEntry::Condition {
                    value: "@starting-style".into(),
                });
                lower_managed_pattern_rule_list(
                    source,
                    filename,
                    body,
                    starting_style.rules.0,
                    selectors,
                    &path,
                    variant_rule_offsets,
                    definition,
                )?;
            }
            CssRule::Unknown(rule) if rule.name.eq_ignore_ascii_case("compose") => {
                return Err(CompilerError::Directive {
                    message: "@compose is not supported inside managed pattern definitions".into(),
                    filename: filename.to_owned(),
                    range: None,
                });
            }
            CssRule::LayerBlock(_) => {
                return Err(CompilerError::Directive {
                    message:
                        "Nested @layer blocks are not allowed inside managed pattern definitions"
                            .into(),
                    filename: filename.to_owned(),
                    range: None,
                });
            }
            CssRule::Keyframes(_) => {
                return Err(CompilerError::Directive {
                    message: "@keyframes is not allowed inside managed pattern definitions. Move managed animation definitions to top-level @theme.".into(),
                    filename: filename.to_owned(),
                    range: None,
                });
            }
            _ => {
                return Err(CompilerError::Directive {
                    message: "Managed pattern definitions only accept declarations, nested selectors, and nested at-rules".into(),
                    filename: filename.to_owned(),
                    range: None,
                });
            }
        }
    }
    Ok(())
}

#[allow(clippy::too_many_arguments)]
fn lower_managed_pattern_style(
    source: &str,
    filename: &str,
    body: &str,
    style: StyleRule<'_>,
    selectors: &[String],
    condition_path: &[CssDirectiveConditionPathEntry],
    variant_rule_offsets: &HashMap<usize, String>,
    definition: &mut serde_json::Map<String, Value>,
) -> Result<(), CompilerError> {
    let mut declarations = collect_declarations(&style.declarations, filename)?;
    if let Some(start) = byte_offset_for_location(body, style.loc.line, style.loc.column) {
        preserve_compatible_literal_spelling(body, start, &mut declarations);
    }
    for selector in selectors {
        push_pattern_declarations(definition, declarations.clone(), selector, condition_path);
    }
    lower_managed_pattern_rule_list(
        source,
        filename,
        body,
        style.rules.0,
        selectors,
        condition_path,
        variant_rule_offsets,
        definition,
    )
}

#[derive(Debug, Clone)]
struct ManagedStyleContext {
    name: String,
    selectors: Vec<String>,
    selector_source: Option<CssDirectiveSourceReference>,
}

fn push_managed_declarations(
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
fn lower_compose_rule(
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
        return Err(CompilerError::Directive {
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
        return Err(CompilerError::Directive {
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
            return Err(CompilerError::Directive {
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
fn lower_managed_style(
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
fn lower_managed_rule_list(
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

#[derive(Debug, Clone)]
struct NativeStyleContext {
    selectors: Vec<String>,
    selector_source: Option<CssDirectiveSourceReference>,
}

fn native_rule_list_has_directives(
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

fn push_native_style_declarations(
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
fn lower_native_compose_rule(
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
        return Err(CompilerError::Directive {
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
        return Err(CompilerError::Directive {
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
            return Err(CompilerError::Directive {
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
fn lower_native_style_rule(
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
fn lower_native_rule_list(
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

#[allow(clippy::too_many_arguments)]
fn lower_managed_definition_rule(
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
) -> Result<CompileThemeCssResult, CompilerError> {
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

    Ok(CompileThemeCssResult {
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

/// Temporary migration alias for callers that were added before the Rust
/// compiler covered directives beyond `@theme`.
pub fn compile_theme_css(
    source: &str,
    options: &CompileNativeCssOptions,
) -> Result<CompileThemeCssResult, CompilerError> {
    compile_css_directives(source, options)
}

#[cfg(test)]
mod tests {
    use super::*;

    struct MemoryImportProvider {
        files: HashMap<String, String>,
        resolutions: HashMap<(String, String), String>,
    }

    impl CssImportProvider for MemoryImportProvider {
        type Error = &'static str;

        fn load(&self, id: &str) -> Result<String, Self::Error> {
            self.files.get(id).cloned().ok_or("missing file")
        }

        fn resolve(&self, specifier: &str, from: &str) -> Result<Option<String>, Self::Error> {
            Ok(self
                .resolutions
                .get(&(from.to_owned(), specifier.to_owned()))
                .cloned())
        }
    }

    #[test]
    fn recognizes_only_explicit_project_entry_markers() {
        assert_eq!(
            inspect_css("@master entry;"),
            InspectCssResult {
                has_master_entry_directive: true,
                has_master_css_import: false,
                has_master_entry: true,
            }
        );
        assert!(inspect_css("@import \"@master/css\";").has_master_entry);
        assert!(!inspect_css("@master;").has_master_entry);
        assert!(!inspect_css("@master global;").has_master_entry);
        assert!(!inspect_css(".x{content:'@import \"@master/css\";'}").has_master_entry);
    }

    #[test]
    fn resolves_import_graphs_through_a_provider_without_filesystem_ownership() {
        let provider = MemoryImportProvider {
            files: HashMap::from([
                (
                    "/entry.css".into(),
                    "@import \"./theme.css\";\n@import \"https://example.com/font.css\";\n.entry{display:block}".into(),
                ),
                (
                    "/theme.css".into(),
                    "@reference \"./tokens.css\";\n@import \"./utilities.css\";\n@theme{--color-brand:red}".into(),
                ),
                (
                    "/utilities.css".into(),
                    "@utilities{block{display:block}}".into(),
                ),
            ]),
            resolutions: HashMap::from([
                (
                    ("/entry.css".into(), "./theme.css".into()),
                    "/theme.css".into(),
                ),
                (
                    ("/theme.css".into(), "./utilities.css".into()),
                    "/utilities.css".into(),
                ),
            ]),
        };
        let graph = resolve_css_import_graph("/entry.css", &provider).unwrap();
        assert_eq!(
            graph.dependencies,
            ["/entry.css", "/theme.css", "/utilities.css"]
        );
        assert_eq!(graph.references.len(), 1);
        assert_eq!(graph.references[0].file.as_deref(), Some("/theme.css"));
        assert_eq!(graph.references[0].source, "./tokens.css");
        assert!(
            graph
                .source
                .starts_with("@import \"https://example.com/font.css\";\n")
        );
        assert!(graph.source.contains("@utilities{block{display:block}}"));
        assert!(graph.source.ends_with(".entry{display:block}"));
    }

    #[test]
    fn rejects_provider_import_cycles_deterministically() {
        let provider = MemoryImportProvider {
            files: HashMap::from([
                ("/a.css".into(), "@import \"./b.css\";".into()),
                ("/b.css".into(), "@import \"./a.css\";".into()),
            ]),
            resolutions: HashMap::from([
                (("/a.css".into(), "./b.css".into()), "/b.css".into()),
                (("/b.css".into(), "./a.css".into()), "/a.css".into()),
            ]),
        };
        let error = resolve_css_import_graph("/a.css", &provider).unwrap_err();
        assert_eq!(
            error.to_string(),
            "Circular CSS import: /a.css -> /b.css -> /a.css"
        );
        assert_eq!(error.diagnostic().code, ErrorCode::CssImportError);
    }

    #[test]
    fn compiles_native_css_and_removes_entry_directive() {
        let result = compile_native_css(
            "@master entry;\n.card { color: red; margin: 0px 1.0rem; }",
            &CompileNativeCssOptions::default(),
        )
        .unwrap();
        assert!(result.had_master_entry_directive);
        assert_eq!(
            result.native_css,
            ".card {\n  color: red;\n  margin: 0 1rem;\n}"
        );
    }

    #[test]
    fn can_skip_native_css_printing() {
        let result = compile_native_css(
            ".card { color: red; }",
            &CompileNativeCssOptions {
                preserve_native_css: false,
                ..CompileNativeCssOptions::default()
            },
        )
        .unwrap();
        assert_eq!(result.native_css, "");
    }

    #[test]
    fn filters_native_selectors_without_losing_discovered_classes() {
        let result = compile_css_directives(
            ".used,.unused { color: red; }\n@media print { .unused { display: none; } }",
            &CompileNativeCssOptions {
                classes: Some(vec!["used".into()]),
                ..CompileNativeCssOptions::default()
            },
        )
        .unwrap();
        assert_eq!(result.native_class_names, ["used", "unused"]);
        assert_eq!(result.native_css, ".used {\n  color: red;\n}");
    }

    #[test]
    fn lowers_theme_tokens_and_preserves_native_css() {
        let result = compile_theme_css(
            "@theme { --color-brand: rgb(0 128 255); --leading-tight: 1.0; }\n.card { color: red; }",
            &CompileNativeCssOptions::default(),
        )
        .unwrap();
        assert_eq!(
            serde_json::to_value(result.manifest_input).unwrap(),
            serde_json::json!({
                "variables": [
                    { "name": "color-brand", "value": "#0080ff" },
                    { "name": "leading-tight", "value": 1 }
                ]
            })
        );
        assert_eq!(result.native_css, ".card {\n  color: red;\n}");
    }

    #[test]
    fn lowers_theme_modifiers_and_replaces_duplicate_mode_tokens_in_order() {
        let result = compile_theme_css(
            "@theme { --color-brand: #111; --color-accent: #222; }\n\
             @theme dark static { --color-brand: #333; }\n\
             @theme { --color-brand: #444; }",
            &CompileNativeCssOptions::default(),
        )
        .unwrap();
        assert_eq!(
            serde_json::to_value(result.manifest_input).unwrap(),
            serde_json::json!({
                "variables": [
                    { "name": "color-accent", "value": "#222" },
                    { "name": "color-brand", "value": "#333", "mode": "dark", "static": true },
                    { "name": "color-brand", "value": "#444" }
                ],
                "modes": ["dark"]
            })
        );
    }

    #[test]
    fn rejects_invalid_theme_modifier_combinations() {
        let error = compile_theme_css(
            "/*😀*/\n@theme dark inline { --color-brand: #fff; }",
            &CompileNativeCssOptions::default(),
        )
        .unwrap_err();
        assert_eq!(error.to_string(), "@theme inline cannot be mode-specific");
        assert_eq!(
            error.diagnostic().range,
            Some(SourceRange { start: 7, end: 13 })
        );
    }

    #[test]
    fn lowers_static_theme_keyframes_outside_layers() {
        let result = compile_theme_css(
            "@theme static {\n\
               --color-brand: #123;\n\
               @keyframes fade {\n\
                 from, 50% { opacity: 0; transform: translateX(0px); }\n\
                 to { opacity: 1 !important; }\n\
               }\n\
             }",
            &CompileNativeCssOptions::default(),
        )
        .unwrap();
        assert_eq!(
            serde_json::to_value(result.manifest_input).unwrap(),
            serde_json::json!({
                "variables": [{ "name": "color-brand", "value": "#123", "static": true }],
                "animations": {
                    "fade": {
                        "from": { "opacity": "0", "transform": "translateX(0)" },
                        "50%": { "opacity": "0", "transform": "translateX(0)" },
                        "to": { "opacity": "1 !important" }
                    }
                },
                "animationOptions": { "fade": { "static": true } }
            })
        );
    }

    #[test]
    fn normalizes_theme_alpha_aliases_and_unquoted_pipes() {
        let result = compile_theme_css(
            "@theme {\n\
               --color-muted: --alpha(var(--color-primary) / .5);\n\
               --content-quoted: \"a | b\";\n\
               --content-piped: a | b;\n\
             }",
            &CompileNativeCssOptions::default(),
        )
        .unwrap();
        assert_eq!(
            serde_json::to_value(result.manifest_input).unwrap(),
            serde_json::json!({
                "variables": [
                    {
                        "name": "color-muted",
                        "value": "color-mix(in oklab,var(--color-primary) 50%,transparent)"
                    },
                    { "name": "content-quoted", "value": "\"a | b\"" },
                    { "name": "content-piped", "value": "a   b" }
                ]
            })
        );

        let error = compile_theme_css(
            "@theme { --color-brand: $color-blue-60; }",
            &CompileNativeCssOptions::default(),
        )
        .unwrap_err();
        assert_eq!(
            error.to_string(),
            "Stylesheet values use native CSS variable references. Replace \"$color-blue-60\" with \"var(--color-blue-60)\"."
        );
    }

    #[test]
    fn lowers_settings_into_the_canonical_manifest_input() {
        let result = compile_theme_css(
            "@settings {\n\
               root-size: 16;\n\
               base-unit: 1;\n\
               default-mode: light;\n\
               mode-trigger: class;\n\
               important: on;\n\
               modes: light, dark chrisma;\n\
               scope: .app;\n\
             }",
            &CompileNativeCssOptions::default(),
        )
        .unwrap();
        assert_eq!(
            serde_json::to_value(result.manifest_input).unwrap(),
            serde_json::json!({
                "rootSize": 16.0,
                "baseUnit": 1.0,
                "defaultMode": "light",
                "scope": ".app",
                "important": true,
                "modes": ["light", "dark", "chrisma"],
                "modeTrigger": "class"
            })
        );
    }

    #[test]
    fn lowers_static_managed_definitions_with_utf16_source_ranges() {
        let result = compile_theme_css(
            "/* 😀 */\n@components {\n  btn { display: inline-flex; color: red; }\n}\n@utilities { content-auto { content-visibility: auto; } }",
            &CompileNativeCssOptions::default(),
        )
        .unwrap();
        assert_eq!(result.class_names, ["btn", "content-auto"]);
        assert_eq!(
            serde_json::to_value(result.style_definitions).unwrap(),
            serde_json::json!([
                {
                    "type": "native",
                    "order": 1,
                    "selector": "&",
                    "declarations": {
                        "display": "inline-flex",
                        "color": "red"
                    },
                    "selectorSource": {
                        "file": "master.css",
                        "range": { "start": 25, "end": 28 },
                        "loc": {
                            "start": { "line": 3, "column": 3 },
                            "end": { "line": 3, "column": 6 }
                        }
                    },
                    "layer": "components",
                    "name": "btn"
                },
                {
                    "type": "native",
                    "order": 2,
                    "selector": "&",
                    "declarations": { "content-visibility": "auto" },
                    "selectorSource": {
                        "file": "master.css",
                        "range": { "start": 82, "end": 94 },
                        "loc": {
                            "start": { "line": 5, "column": 14 },
                            "end": { "line": 5, "column": 26 }
                        }
                    },
                    "layer": "utilities",
                    "name": "content-auto"
                }
            ])
        );
    }

    #[test]
    fn lowers_native_compose_and_variant_styles() {
        let result = compile_css_directives(
            "@custom-variant wide { @media (width >= 640px) { @slot; } }\n\
             @components { brand { color: red; } }\n\
             .button { @compose brand; @variant wide { @compose brand; } }",
            &CompileNativeCssOptions::default(),
        )
        .unwrap();
        let native_composes = result
            .style_definitions
            .as_ref()
            .unwrap()
            .iter()
            .filter_map(|definition| match definition {
                CssDirectiveStyleDefinition::Compose {
                    selector,
                    condition_path,
                    name,
                    ..
                } if name.is_none() => Some((selector, condition_path)),
                _ => None,
            })
            .collect::<Vec<_>>();
        assert_eq!(native_composes.len(), 2);
        assert_eq!(native_composes[0].0, ".button");
        assert_eq!(
            native_composes[1].1,
            &Some(vec![CssDirectiveConditionPathEntry::Variant {
                token: "@wide".into()
            }])
        );
        assert!(result.native_css.is_empty());
    }
}
