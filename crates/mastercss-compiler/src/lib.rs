#![forbid(unsafe_code)]

mod lower;
mod manifest;

pub use lower::{
    LowerCssDirectivesOptions, LowerCssDirectivesRequest, LowerCssDirectivesResult,
    lower_css_directives, lower_css_directives_request,
};
pub use manifest::{
    CompileDefaultPresetRequest, CompileDefaultPresetResult, CompileManifestOptions,
    CompileManifestResult, compile_default_preset_manifest, compile_manifest_input,
    compile_manifest_input_with_styles, normalize_default_manifest_for_json,
    normalize_manifest_for_json,
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
    extract_top_level_at_rule_blocks, find_css_directive_ranges, find_css_import_statements,
    find_master_directive_statements, parse_css_import_source, remove_css_reference_statements,
    remove_master_directive_statements, remove_standalone_css_directives, utf16_to_byte_offset,
};
use mastercss_schema::{
    CssDirectiveBlocklistEntry, CssDirectiveConditionPathEntry, CssDirectiveExtractionPolicy,
    CssDirectiveManifestInput, CssDirectiveReferenceStatement, CssDirectiveSourceReference,
    CssDirectiveStyleDefinition, CssDirectiveVariableDefinition, Diagnostic, ErrorCode,
    SourceLocation, SourceLocationRange, SourceRange, UtilityLayerName,
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
    pub directives: Vec<InspectCssDirective>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InspectCssDirective {
    pub name: String,
    pub range: SourceRange,
    pub prelude_range: SourceRange,
    pub has_block: bool,
    pub quoted_strings: u32,
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

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CssDependencyImport {
    pub start: u32,
    pub end: u32,
    pub statement: String,
    pub source: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CssDependencyAnalysis {
    pub source_without_references: String,
    pub imports: Vec<CssDependencyImport>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StandaloneDirectiveStatementIr {
    pub start: u32,
    pub end: u32,
    pub at_rule_name: String,
    pub name: String,
    pub statement: String,
    pub args: Vec<String>,
    pub modifiers: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StandaloneDirectiveAnalysis {
    pub code: String,
    pub statements: Vec<StandaloneDirectiveStatementIr>,
    pub extraction_policy: CssDirectiveExtractionPolicy,
}

pub fn analyze_standalone_directives(source: &str) -> StandaloneDirectiveAnalysis {
    let (code, statements) = remove_standalone_css_directives(source);
    let extraction_policy = extraction_policy_from_statements(&statements);
    StandaloneDirectiveAnalysis {
        code,
        statements: statements
            .into_iter()
            .map(|statement| StandaloneDirectiveStatementIr {
                start: statement.start,
                end: statement.end,
                at_rule_name: statement.at_rule_name,
                name: statement.name,
                statement: statement.statement,
                args: statement.args,
                modifiers: statement.modifiers,
            })
            .collect(),
        extraction_policy,
    }
}

pub fn analyze_css_dependencies(source: &str) -> CssDependencyAnalysis {
    let (source_without_references, _) = remove_css_reference_statements(source);
    let imports = find_css_import_statements(&source_without_references)
        .into_iter()
        .filter_map(|statement| {
            let source = parse_css_import_source(&statement.statement)?;
            Some(CssDependencyImport {
                start: statement.start,
                end: statement.end,
                statement: statement.statement,
                source,
            })
        })
        .collect();
    CssDependencyAnalysis {
        source_without_references,
        imports,
    }
}

pub fn merge_extraction_policies(
    policies: &[CssDirectiveExtractionPolicy],
) -> CssDirectiveExtractionPolicy {
    let mut merged = CssDirectiveExtractionPolicy::default();
    for policy in policies {
        for value in &policy.include {
            if !merged.include.contains(value) {
                merged.include.push(value.clone());
            }
        }
        for value in &policy.exclude {
            if !merged.exclude.contains(value) {
                merged.exclude.push(value.clone());
            }
        }
        for value in &policy.safelist {
            if !merged.safelist.contains(value) {
                merged.safelist.push(value.clone());
            }
        }
        for value in &policy.blocklist {
            if !merged.blocklist.contains(value) {
                merged.blocklist.push(value.clone());
            }
        }
        merged.preserve_native |= policy.preserve_native;
    }
    merged
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
    DirectiveDiagnostic {
        code: ErrorCode,
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
            Self::DirectiveDiagnostic {
                code,
                message,
                filename,
                range,
            } => Diagnostic {
                code: *code,
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

mod directives;
mod imports;
mod managed;
mod native_style;
mod pattern;
mod syntax;
mod theme;
mod variant;

#[allow(unused_imports)]
pub(crate) use directives::*;
#[allow(unused_imports)]
pub(crate) use imports::*;
#[allow(unused_imports)]
pub(crate) use managed::*;
#[allow(unused_imports)]
pub(crate) use native_style::*;
#[allow(unused_imports)]
pub(crate) use pattern::*;
#[allow(unused_imports)]
pub(crate) use syntax::*;
#[allow(unused_imports)]
pub(crate) use theme::*;
#[allow(unused_imports)]
pub(crate) use variant::*;

pub use directives::{compile_css_directives, compile_theme_css};
pub use imports::{
    compile_native_css, inspect_css, resolve_css_import_graph, resolve_prepared_css_import_graph,
};

#[cfg(test)]
mod tests;
