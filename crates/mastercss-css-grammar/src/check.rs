//! The checks Master CSS runs on CSS: syntax, values against the grammar, and the
//! declarations of rules. Grammar knowledge is a report, never permission to generate CSS.

use std::collections::HashMap;
use std::sync::{LazyLock, Mutex};

use serde::Serialize;

use crate::generate::{generate, generate_tokens};
use crate::grammar::{self, is_known_keyword, is_known_unit};
use crate::lexer::{Lexer, MatchResult, SyntaxMatchError};
use crate::math::{MathStatus, math_function_status, validate_math_types};
use crate::parser::{Important, Node, Parser};
use crate::tokenizer::{Token, TokenType as T, tokenize, tokenize_units};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum Status {
    Valid,
    Invalid,
    Unknown,
}

impl Status {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Valid => "valid",
            Self::Invalid => "invalid",
            Self::Unknown => "unknown",
        }
    }
}

/// The outcome of matching a value: matched, or the error css-tree reports.
enum Outcome {
    Matched,
    Error(GrammarError),
}

/// A css-tree lexer error.
#[derive(Debug, Clone)]
pub enum GrammarError {
    /// `SyntaxReferenceError`.
    Reference { kind: &'static str, name: String },
    /// `SyntaxError` of an at-rule check.
    Syntax(String),
    /// `SyntaxMatchError`.
    Match(SyntaxMatchError),
    /// `UnsupportedMatchingTree` and other non-target errors.
    Unsupported(String),
}

impl GrammarError {
    fn message(&self) -> String {
        match self {
            Self::Reference { kind, name } => format!("{kind} `{name}`"),
            Self::Syntax(message) | Self::Unsupported(message) => message.clone(),
            Self::Match(error) => details(error),
        }
    }
}

/// `SyntaxMatchError.message`.
fn details(error: &SyntaxMatchError) -> String {
    format!(
        "{}\n  syntax: {}\n   value: {}\n  --------{}^",
        error.raw_message,
        error.syntax,
        if error.css.is_empty() {
            "<empty string>"
        } else {
            &error.css
        },
        "-".repeat(error.mismatch_offset16),
    )
}

fn run_match(syntax: &str, tokens: &[Token], text: &str, css_wide_keywords: bool) -> Outcome {
    match Lexer.match_syntax(syntax, tokens, text, css_wide_keywords) {
        Ok(MatchResult::Matched) => Outcome::Matched,
        Ok(MatchResult::Unsupported(function)) => Outcome::Error(GrammarError::Unsupported(
            format!("Matching for a tree with {function}() is not supported"),
        )),
        Ok(MatchResult::Mismatch(error)) => Outcome::Error(GrammarError::Match(error)),
        Err(message) => Outcome::Error(GrammarError::Unsupported(message)),
    }
}

fn node_tokens(value: &Node) -> (String, Vec<Token>) {
    generate_tokens(value)
}

/// css-tree `lexer.matchProperty(name, value)`.
fn match_property(name: &str, value: &Node) -> Outcome {
    let Some(syntax) = grammar::property_syntax(name) else {
        if grammar::property(name).custom {
            return Outcome::Error(GrammarError::Unsupported(
                "Lexer matching doesn't applicable for custom properties".into(),
            ));
        }
        return Outcome::Error(GrammarError::Reference {
            kind: "Unknown property",
            name: name.to_owned(),
        });
    };
    let (text, tokens) = node_tokens(value);
    run_match(syntax, &tokens, &text, true)
}

fn check_atrule_name(atrule: &str) -> Option<GrammarError> {
    grammar::atrule(atrule)
        .is_none()
        .then(|| GrammarError::Reference {
            kind: "Unknown at-rule",
            name: format!("@{atrule}"),
        })
}

fn check_atrule_descriptor_name(atrule: &str, descriptor: &str) -> Option<GrammarError> {
    if let Some(error) = check_atrule_name(atrule) {
        return Some(error);
    }
    if grammar::atrule(atrule)?.descriptors.is_none() {
        return Some(GrammarError::Syntax(format!(
            "At-rule `@{atrule}` has no known descriptors"
        )));
    }
    grammar::atrule_descriptor(atrule, descriptor)
        .is_none()
        .then(|| GrammarError::Reference {
            kind: "Unknown at-rule descriptor",
            name: descriptor.to_owned(),
        })
}

/// css-tree `lexer.matchAtruleDescriptor(atrule, descriptor, value)`.
fn match_atrule_descriptor(atrule: &str, descriptor: &str, value: &Node) -> Outcome {
    if let Some(error) = check_atrule_descriptor_name(atrule, descriptor) {
        return Outcome::Error(error);
    }
    let syntax = grammar::atrule_descriptor(atrule, descriptor).expect("checked descriptor");
    let (text, tokens) = node_tokens(value);
    run_match(syntax, &tokens, &text, false)
}

fn string_matches(syntax: &str, text: &str) -> bool {
    matches!(
        run_match(syntax, &tokenize(text), text, false),
        Outcome::Matched
    )
}

/// css-tree `!lexer.matchType(name, generate(value)).error`.
pub(crate) fn match_type(name: &str, value: &Node) -> bool {
    let text = generate(value);
    match Lexer.type_def(name) {
        Some(crate::lexer::TypeDef::Syntax(syntax)) => string_matches(&syntax, &text),
        Some(crate::lexer::TypeDef::Generic(_)) => string_matches(&format!("<{name}>"), &text),
        None => false,
    }
}

/// css-tree `lexer.checkAtrulePrelude(atrule, prelude)`.
fn check_atrule_prelude(atrule: &str, prelude: Option<&Node>) -> Option<GrammarError> {
    if let Some(error) = check_atrule_name(atrule) {
        return Some(error);
    }
    let syntax = grammar::atrule(atrule)?.prelude.as_deref();
    match (syntax, prelude) {
        (None, Some(_)) => Some(GrammarError::Syntax(format!(
            "At-rule `@{atrule}` should not contain a prelude"
        ))),
        (Some(syntax), None) if !string_matches(syntax, "") => Some(GrammarError::Syntax(format!(
            "At-rule `@{atrule}` should contain a prelude"
        ))),
        _ => None,
    }
}

/// css-tree `lexer.matchAtrulePrelude(atrule, prelude)`.
fn match_atrule_prelude(atrule: &str, prelude: Option<&Node>) -> Outcome {
    if let Some(error) = check_atrule_prelude(atrule, prelude) {
        return Outcome::Error(error);
    }
    let Some(syntax) = grammar::atrule(atrule).and_then(|atrule| atrule.prelude.as_deref()) else {
        return Outcome::Matched;
    };
    let (text, tokens) = match prelude {
        Some(prelude) => node_tokens(prelude),
        None => (String::new(), Vec::new()),
    };
    run_match(syntax, &tokens, &text, false)
}

static VALUE_CACHE: LazyLock<Mutex<HashMap<String, Status>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

fn is_page_margin_box(name: &str) -> bool {
    let corner = |edge: &str| {
        ["left", "center", "right"]
            .iter()
            .any(|side| name == format!("{edge}-{side}") || name == format!("{edge}-{side}-corner"))
    };
    let side = |edge: &str| {
        ["top", "middle", "bottom"]
            .iter()
            .any(|side| name == format!("{edge}-{side}"))
    };
    corner("top") || corner("bottom") || side("left") || side("right")
}

/// The status of `value` for `property`, in the context of `at_rule` descriptors.
pub fn value_status(property: &str, value: &str, at_rule: Option<&str>) -> Status {
    let key = format!("{}\0{property}\0{value}", at_rule.unwrap_or_default());
    if let Some(status) = VALUE_CACHE
        .lock()
        .ok()
        .and_then(|cache| cache.get(&key).copied())
    {
        return status;
    }
    let status = compute_value_status(property, value, at_rule);
    if let Ok(mut cache) = VALUE_CACHE.lock() {
        if cache.len() >= 4096 {
            cache.clear();
        }
        cache.insert(key, status);
    }
    status
}

#[derive(Default)]
struct Walk {
    dependent: bool,
    unresolved: bool,
    unknown_capability: bool,
    invalid_repeat: bool,
    invalid_math: bool,
    unknown_math: bool,
}

fn walk_value(node: &Node, property: &str, state: &mut Walk) {
    match node {
        Node::Function { name, children } => {
            let lower = name.to_lowercase();
            match math_function_status(name, children) {
                Some(MathStatus::Invalid) => state.invalid_math = true,
                Some(MathStatus::Unknown) => state.unknown_math = true,
                _ => {}
            }
            if ["var", "env", "attr"].contains(&lower.as_str()) {
                state.dependent = true;
            }
            if state.dependent || !grammar::has_type(&format!("{lower}()")) {
                state.unresolved = true;
            }
            if lower == "repeat"
                && (property == "grid-template-columns" || property == "grid-template-rows")
            {
                match children.first() {
                    Some(Node::Number(count)) => {
                        let count: f64 = count.parse().unwrap_or(f64::NAN);
                        state.invalid_repeat |=
                            count.fract() != 0.0 || count <= 0.0 || count.is_nan();
                    }
                    Some(Node::Identifier(count)) => {
                        state.invalid_repeat |= count != "auto-fill" && count != "auto-fit";
                    }
                    _ => {}
                }
            }
            for child in children {
                walk_value(child, property, state);
            }
        }
        Node::Identifier(name) => {
            if !is_known_keyword(name) {
                state.unresolved = true;
            }
        }
        Node::Dimension { unit, .. } => {
            if !is_known_unit(unit) {
                state.unresolved = true;
                state.unknown_capability = true;
            }
        }
        Node::Value(children) | Node::Parentheses(children) | Node::Brackets(children) => {
            for child in children {
                walk_value(child, property, state);
            }
        }
        _ => {}
    }
}

fn compute_value_status(property: &str, value: &str, at_rule: Option<&str>) -> Status {
    if grammar::property(property).custom {
        return Status::Unknown;
    }
    let mut parser = Parser::new(value, true);
    let Ok(ast) = parser.value_context() else {
        return Status::Invalid;
    };
    let descriptor = at_rule.and_then(|at_rule| {
        grammar::atrule(at_rule)
            .and_then(|atrule| atrule.descriptors.as_ref())
            .and_then(|descriptors| descriptors.get(property))
    });
    // @page and its margin boxes also accept ordinary page properties.
    let page_context =
        at_rule.is_some_and(|at_rule| at_rule == "page" || is_page_margin_box(at_rule));
    let use_descriptor = at_rule.is_some() && (descriptor.is_some() || !page_context);
    let mut state = Walk {
        unresolved: if use_descriptor {
            descriptor.is_none()
        } else {
            grammar::property_syntax(property).is_none()
        },
        ..Walk::default()
    };
    walk_value(&ast, property, &mut state);
    let matches = |value: &Node| {
        matches!(
            if use_descriptor {
                match_atrule_descriptor(at_rule.expect("descriptor context"), property, value)
            } else {
                match_property(property, value)
            },
            Outcome::Matched
        )
    };
    let (math_ast, math) = validate_math_types(&ast, &matches);
    state.invalid_math |= math == Some(MathStatus::Invalid);
    state.unknown_math |= math == Some(MathStatus::Unknown);
    let known_match = matches(&math_ast);
    // A proven result type in an otherwise known property grammar is a definite
    // mismatch. Unknown surrounding functions or keywords remain unknown.
    if math == Some(MathStatus::Valid)
        && !known_match
        && !state.unresolved
        && !state.unknown_capability
    {
        state.invalid_math = true;
    }
    if state.invalid_repeat || state.invalid_math {
        Status::Invalid
    } else if state.dependent || state.unknown_math || state.unknown_capability {
        Status::Unknown
    } else if known_match {
        Status::Valid
    } else if state.unresolved {
        Status::Unknown
    } else {
        Status::Invalid
    }
}

/// A declaration of a stylesheet and the status of its value.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeclarationValidation {
    pub property: String,
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub at_rule: Option<String>,
    pub status: Status,
    /// UTF-16 offsets of the declaration.
    pub range: Range,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub struct Range {
    pub start: usize,
    pub end: usize,
}

/// Visits declarations depth-first with the enclosing at-rule and rule, as css-tree's walker
/// reports them (`this.atrule`, `this.rule`).
fn walk_declarations<'a>(
    node: &'a Node,
    atrule: Option<&'a str>,
    in_rule: bool,
    visit: &mut dyn FnMut(&'a Node, Option<&'a str>, bool),
) {
    match node {
        Node::StyleSheet(children) | Node::Block { children, .. } => {
            for child in children {
                walk_declarations(child, atrule, in_rule, visit);
            }
        }
        Node::Atrule {
            name,
            block: Some(block),
            ..
        } => walk_declarations(block, Some(name), in_rule, visit),
        Node::Rule { block, .. } => walk_declarations(block, atrule, true, visit),
        Node::Declaration { .. } => visit(node, atrule, in_rule),
        _ => {}
    }
}

/// Every declaration of a stylesheet with the status of its value.
pub fn rule_declarations(text: &str) -> Vec<DeclarationValidation> {
    let mut parser = Parser::new(text, true);
    let ast = parser.stylesheet();
    let mut declarations = Vec::new();
    walk_declarations(&ast, None, false, &mut |node, atrule, in_rule| {
        let Node::Declaration {
            property,
            value,
            start,
            end,
            ..
        } = node
        else {
            return;
        };
        let value = generate(value);
        let at_rule = (!in_rule).then(|| atrule.map(str::to_lowercase)).flatten();
        let status = value_status(property, &value, at_rule.as_deref());
        declarations.push(DeclarationValidation {
            property: property.clone(),
            value,
            at_rule,
            status,
            range: Range {
                start: *start,
                end: *end,
            },
        });
    });
    declarations
}

/// The token structure of CSS: balanced blocks, terminated strings and comments,
/// and no bad strings or urls. It is independent of grammars and browser support.
fn token_structure_is_valid(text: &str) -> bool {
    let units: Vec<u16> = text.encode_utf16().collect();
    let at = |offset: usize| units.get(offset).copied();
    let mut stack = Vec::new();
    let mut invalid = false;
    for (ty, start, end) in tokenize_units(&units) {
        match ty {
            T::Function | T::LeftParenthesis => stack.push(T::RightParenthesis),
            T::LeftSquareBracket => stack.push(T::RightSquareBracket),
            T::LeftCurlyBracket => stack.push(T::RightCurlyBracket),
            T::RightParenthesis | T::RightSquareBracket | T::RightCurlyBracket => {
                invalid |= stack.pop() != Some(ty);
            }
            T::BadString | T::BadUrl => invalid = true,
            T::Comment => {
                let end = end.min(units.len());
                invalid |= end < 2
                    || at(end - 2) != Some(u16::from(b'*'))
                    || at(end - 1) != Some(u16::from(b'/'));
            }
            T::String => invalid |= end < 1 || at(end - 1) != at(start) || end - start < 2,
            _ => {}
        }
    }
    !invalid && stack.is_empty()
}

/// The syntax status of CSS: `invalid` token structure, `unknown` when the parser
/// cannot read a construct (incomplete knowledge, not invalidity), else `valid`.
/// Rule and at-rule preludes are read as raw text.
pub fn syntax_status(text: &str) -> Status {
    if !token_structure_is_valid(text) {
        return Status::Invalid;
    }
    let mut parser = Parser::new(text, true);
    parser.stylesheet();
    if parser.errors.is_empty() {
        Status::Valid
    } else {
        Status::Unknown
    }
}

/// A grammar error of a stylesheet (`@master/css-tooling/css` `validateCSS`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CssError {
    pub name: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub property: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub atrule: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub descriptor: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<String>,
    /// The UTF-16 offset of a syntax error.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub offset: Option<usize>,
}

fn grammar_error(error: GrammarError, target: &str, kind: &str) -> Option<CssError> {
    let name = match &error {
        GrammarError::Reference { .. } => "SyntaxReferenceError",
        GrammarError::Syntax(_) => "SyntaxError",
        GrammarError::Match(_) => "SyntaxMatchError",
        GrammarError::Unsupported(_) => return None,
    };
    let mismatch = matches!(&error, GrammarError::Match(error) if error.raw_message == "Mismatch");
    let message = error.message();
    let (message, details) = if mismatch {
        let message = match kind {
            "prelude" => format!("Invalid value for `@{target}` prelude"),
            "descriptor" => format!("Invalid value for `{target}` descriptor"),
            _ => format!("Invalid value for `{target}` property"),
        };
        (message, Some(error.message()))
    } else {
        (message, None)
    };
    Some(CssError {
        name: name.into(),
        message,
        property: None,
        atrule: None,
        descriptor: None,
        details,
        offset: None,
    })
}

fn validate_declaration(property: &str, value: &Node) -> Vec<CssError> {
    if grammar::property(property).custom {
        return Vec::new();
    }
    let outcome = match_property(property, value);
    match outcome {
        Outcome::Matched => Vec::new(),
        Outcome::Error(error) => grammar_error(error, property, "property")
            .map(|error| CssError {
                property: Some(property.to_owned()),
                ..error
            })
            .into_iter()
            .collect(),
    }
}

fn validate_atrule(node: &Node, nested_in_rule: bool) -> Vec<CssError> {
    let Node::Atrule {
        name,
        prelude,
        block,
        ..
    } = node
    else {
        return Vec::new();
    };
    let atrule = Some(name.clone());
    if let Some(error) = check_atrule_name(name) {
        return grammar_error(error, name, "atrule")
            .map(|error| CssError {
                atrule: atrule.clone(),
                ..error
            })
            .into_iter()
            .collect();
    }
    let mut errors = Vec::new();
    let prelude = prelude.as_deref();
    let prelude_error =
        check_atrule_prelude(name, prelude).or_else(|| match match_atrule_prelude(name, prelude) {
            Outcome::Matched => None,
            Outcome::Error(error) => Some(error),
        });
    if let Some(error) = prelude_error.and_then(|error| grammar_error(error, name, "prelude")) {
        errors.push(CssError {
            atrule: atrule.clone(),
            ..error
        });
    }
    if let Some(block) = block.as_deref() {
        let Node::Block { children, .. } = block else {
            return errors;
        };
        let lower = name.to_lowercase();
        let style_context = nested_in_rule
            && [
                "media",
                "supports",
                "container",
                "layer",
                "scope",
                "starting-style",
            ]
            .contains(&lower.as_str());
        for child in children {
            let Node::Declaration {
                property, value, ..
            } = child
            else {
                continue;
            };
            if style_context {
                errors.extend(validate_declaration(property, value));
                continue;
            }
            let error = check_atrule_descriptor_name(name, property).or_else(|| {
                match match_atrule_descriptor(name, property, value) {
                    Outcome::Matched => None,
                    Outcome::Error(error) => Some(error),
                }
            });
            if let Some(error) =
                error.and_then(|error| grammar_error(error, property, "descriptor"))
            {
                errors.push(CssError {
                    atrule: atrule.clone(),
                    descriptor: Some(property.clone()),
                    ..error
                });
            }
        }
    }
    errors
}

fn collect_atrules<'a>(node: &'a Node, in_rule: bool, out: &mut Vec<(&'a Node, bool)>) {
    match node {
        Node::StyleSheet(children) | Node::Block { children, .. } => {
            for child in children {
                collect_atrules(child, in_rule, out);
            }
        }
        Node::Atrule { block, .. } => {
            out.push((node, in_rule));
            if let Some(block) = block {
                collect_atrules(block, in_rule, out);
            }
        }
        Node::Rule { block, .. } => collect_atrules(block, true, out),
        _ => {}
    }
}

fn collect_rules<'a>(node: &'a Node, out: &mut Vec<&'a Node>) {
    match node {
        Node::StyleSheet(children) | Node::Block { children, .. } => {
            for child in children {
                collect_rules(child, out);
            }
        }
        Node::Atrule {
            block: Some(block), ..
        } => collect_rules(block, out),
        Node::Rule { block, .. } => {
            out.push(node);
            collect_rules(block, out);
        }
        _ => {}
    }
}

/// The grammar errors of a stylesheet: parse errors, then at-rule, then rule errors.
pub fn validate_css(text: &str) -> Vec<CssError> {
    let mut parser = Parser::new(text, false);
    let ast = parser.stylesheet();
    let mut errors: Vec<CssError> = parser
        .errors
        .iter()
        .map(|error| CssError {
            name: "SyntaxError".into(),
            message: error.message.clone(),
            property: None,
            atrule: None,
            descriptor: None,
            details: None,
            offset: Some(error.offset),
        })
        .collect();
    let mut atrules = Vec::new();
    collect_atrules(&ast, false, &mut atrules);
    for (atrule, in_rule) in atrules {
        errors.extend(validate_atrule(atrule, in_rule));
    }
    let mut rules = Vec::new();
    collect_rules(&ast, &mut rules);
    for rule in rules {
        let Node::Rule { block, .. } = rule else {
            continue;
        };
        let Node::Block { children, .. } = block.as_ref() else {
            continue;
        };
        for child in children {
            if let Node::Declaration {
                property, value, ..
            } = child
            {
                errors.extend(validate_declaration(property, value));
            }
        }
    }
    errors
}

/// The declarations of a stylesheet as written, by property; a later declaration
/// replaces an earlier one in its place.
pub fn parse_declarations(text: &str) -> Vec<(String, String)> {
    let mut parser = Parser::new(text, true);
    let ast = parser.stylesheet();
    let mut declarations: Vec<(String, String)> = Vec::new();
    walk_declarations(&ast, None, false, &mut |node, _, _| {
        let Node::Declaration {
            property,
            important,
            value_start,
            value_end,
            ..
        } = node
        else {
            return;
        };
        let mut text = parser_text(text, *value_start, *value_end);
        if *important != Important::No {
            text.push_str("!important");
        }
        match declarations.iter_mut().find(|(name, _)| name == property) {
            Some(entry) => entry.1 = text,
            None => declarations.push((property.clone(), text)),
        }
    });
    declarations
}

fn parser_text(text: &str, start: usize, end: usize) -> String {
    let units: Vec<u16> = text.encode_utf16().collect();
    String::from_utf16_lossy(&units[start.min(units.len())..end.min(units.len())])
}
