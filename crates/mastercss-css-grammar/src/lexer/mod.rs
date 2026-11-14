//! Port of css-tree's lexer (`lib/lexer/`): matching a value against a syntax.
//!
//! The syntax dictionary is [`GRAMMAR`](crate::grammar::GRAMMAR); the generic types
//! (`<length>`, `<number>`, …) are code ([`generic`]).

pub mod an_plus_b;
pub mod generic;
pub mod graph;
pub mod matcher;
pub mod urange;

use std::collections::HashMap;
use std::sync::{Arc, LazyLock, Mutex};

use crate::definition::{self as syntax_definition, ast::SyntaxNode};

use super::tokenizer::{Token, tokenize};
use generic::Generic;
use graph::{Graph, Id};

/// A type of the lexer: a syntax, or a generic type (a function in css-tree).
#[derive(Debug, Clone)]
pub enum TypeDef {
    Syntax(Arc<str>),
    Generic(Generic),
}

static AST_CACHE: LazyLock<Mutex<HashMap<String, Arc<SyntaxNode>>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

/// css-tree `parse` of the definition syntax, cached (css-tree parses a descriptor lazily once).
pub(crate) fn parse_cached(syntax: &str) -> Result<Arc<SyntaxNode>, String> {
    if let Some(ast) = AST_CACHE
        .lock()
        .ok()
        .and_then(|cache| cache.get(syntax).cloned())
    {
        return Ok(ast);
    }
    let ast = Arc::new(syntax_definition::parse(syntax)?);
    if let Ok(mut cache) = AST_CACHE.lock() {
        cache.insert(syntax.to_owned(), Arc::clone(&ast));
    }
    Ok(ast)
}

/// css-tree's default lexer over [`GRAMMAR`](crate::grammar::GRAMMAR).
#[derive(Default, Clone, Copy)]
pub struct Lexer;

/// TS `SyntaxMatchError` for a string value: what `cssSyntaxMatch` reads from it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SyntaxMatchError {
    /// `rawMessage`: `Mismatch`, or the iteration-limit message.
    pub raw_message: &'static str,
    /// `syntax`: the generated syntax the value was matched against.
    pub syntax: String,
    /// `mismatchOffset`, in bytes.
    pub mismatch_offset: usize,
    /// `mismatchLength`, in bytes.
    pub mismatch_length: usize,
    /// `mismatchOffset`, in UTF-16 code units as css-tree reports it.
    pub mismatch_offset16: usize,
    /// `css`: the matched value.
    pub css: String,
    /// `line` (1-based).
    pub line: usize,
    /// `column` (1-based, in UTF-16 code units).
    pub column: usize,
}

/// The result of [`Lexer::match_syntax`].
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MatchResult {
    Matched,
    /// The value contains `var()` or `env()`, which css-tree's lexer does not match.
    Unsupported(&'static str),
    Mismatch(SyntaxMatchError),
}

/// The CSS-wide keywords (`generic-const.js`).
pub const CSS_WIDE_KEYWORDS: [&str; 6] = [
    "initial",
    "inherit",
    "unset",
    "revert",
    "revert-layer",
    "revert-rule",
];

impl Lexer {
    /// `lexer.types[name]`: a generic type set over the data, or the data's syntax.
    #[must_use]
    pub fn type_def(&self, name: &str) -> Option<TypeDef> {
        if let Some(generic) = generic::lookup(name) {
            return Some(TypeDef::Generic(generic));
        }
        crate::grammar::GRAMMAR
            .types
            .get(name)
            .map(|syntax| TypeDef::Syntax(syntax.as_str().into()))
    }

    /// `lexer.properties[name]` (the exact name).
    #[must_use]
    pub fn property(&self, name: &str) -> Option<Arc<str>> {
        crate::grammar::GRAMMAR
            .properties
            .get(name)
            .map(|syntax| syntax.as_str().into())
    }

    /// css-tree `matchSyntax(lexer, syntax, tokens, useCssWideKeywords)`.
    ///
    /// # Errors
    ///
    /// Returns the message css-tree throws: `syntax` cannot be parsed, or the match reaches a type
    /// or a property the lexer does not define.
    pub fn match_syntax(
        &self,
        syntax: &str,
        tokens: &[Token],
        value: &str,
        css_wide_keywords: bool,
    ) -> Result<MatchResult, String> {
        if tokens.iter().any(|t| t.value.eq_ignore_ascii_case("var(")) {
            return Ok(MatchResult::Unsupported("var"));
        }
        if tokens.iter().any(|t| t.value.eq_ignore_ascii_case("env(")) {
            return Ok(MatchResult::Unsupported("env"));
        }
        if css_wide_keywords {
            let wide = parse_cached(&CSS_WIDE_KEYWORDS.join(" |  "))?;
            let mut run = Run {
                lexer: self,
                graph: Graph::default(),
                compiled: HashMap::new(),
            };
            let start = run.graph.build_match_graph(&wide);
            if matcher::match_tokens(&mut run, tokens, start)?.matched {
                return Ok(MatchResult::Matched);
            }
        }
        let ast = parse_cached(syntax)?;
        let mut run = Run {
            lexer: self,
            graph: Graph::default(),
            compiled: HashMap::new(),
        };
        let start = run.graph.build_match_graph(&ast);
        let outcome = matcher::match_tokens(&mut run, tokens, start)?;
        if outcome.matched {
            return Ok(MatchResult::Matched);
        }
        Ok(MatchResult::Mismatch(locate_mismatch(
            tokens,
            value,
            outcome.longest_match,
            outcome.reason,
            syntax_definition::generate::generate(&ast),
        )))
    }

    /// css-tree `lexer.match(syntax, value)` for a string value.
    ///
    /// # Errors
    ///
    /// See [`Lexer::match_syntax`].
    pub fn match_value(&self, syntax: &str, value: &str) -> Result<MatchResult, String> {
        self.match_syntax(syntax, &tokenize(value), value, false)
    }
}

/// css-tree `locateMismatch` for a string value: no token carries an AST node, so the location
/// is counted over the concatenated token values (the value).
fn locate_mismatch(
    tokens: &[Token],
    value: &str,
    longest_match: usize,
    raw_message: &'static str,
    syntax: String,
) -> SyntaxMatchError {
    let mismatch_offset16 = tokens.get(longest_match).map_or(0, |token| token.start16);
    let (mismatch_offset, mismatch_length, before) = if let Some(token) = tokens.get(longest_match)
    {
        (token.start, token.end - token.start, &value[..token.start])
    } else {
        // the mismatch is at the end: css-tree leaves the offset and length at 0 and points the
        // line and column past the value
        (0, 0, value)
    };
    let (line, column) = build_loc(before);
    SyntaxMatchError {
        raw_message,
        syntax,
        mismatch_offset,
        mismatch_length,
        mismatch_offset16,
        css: value.to_owned(),
        line,
        column,
    }
}

/// css-tree `buildLoc(defaultLoc, extra)`: lines split at `\n`, `\r\n`, `\r` and `\f`; the column
/// in UTF-16 code units.
fn build_loc(extra: &str) -> (usize, usize) {
    let normalized = extra.replace("\r\n", "\n").replace(['\r', '\u{c}'], "\n");
    let lines: Vec<&str> = normalized.split('\n').collect();
    let last = lines.last().copied().unwrap_or("");
    if lines.len() == 1 {
        (1, 1 + last.encode_utf16().count())
    } else {
        (lines.len(), last.encode_utf16().count() + 1)
    }
}

/// The graph of one match: css-tree compiles a descriptor's graph on its first use; here each
/// match compiles what it reaches.
pub struct Run<'a> {
    lexer: &'a Lexer,
    pub graph: Graph,
    compiled: HashMap<(bool, String), Option<Id>>,
}

impl Run<'_> {
    /// The graph of the type or property `name` (`dictSyntax.matchRef || dictSyntax.match`).
    pub fn descriptor(&mut self, is_property: bool, name: &str) -> Option<Id> {
        let key = (is_property, name.to_owned());
        if let Some(id) = self.compiled.get(&key) {
            return *id;
        }
        let id = if is_property {
            self.lexer
                .property(name)
                .and_then(|syntax| parse_cached(&syntax).ok())
                .map(|ast| match (&*ast, top_level_comma_multiplier_term(&ast)) {
                    // `matchRef`: `{ ...syntax, terms: [syntax.terms[0].term] }`
                    (
                        SyntaxNode::Group {
                            combinator,
                            disallow_empty,
                            explicit,
                            ..
                        },
                        Some(term),
                    ) => {
                        let ast = SyntaxNode::Group {
                            terms: vec![term.clone()],
                            combinator: combinator.clone(),
                            disallow_empty: *disallow_empty,
                            explicit: *explicit,
                        };
                        self.graph.build_match_graph(&ast)
                    }
                    _ => self.graph.build_match_graph(&ast),
                })
        } else {
            match self.lexer.type_def(name) {
                Some(TypeDef::Generic(generic)) => Some(self.graph.build_generic_graph(generic)),
                Some(TypeDef::Syntax(syntax)) => parse_cached(&syntax)
                    .ok()
                    .map(|ast| self.graph.build_match_graph(&ast)),
                None => None,
            }
        };
        self.compiled.insert(key, id);
        id
    }
}

/// css-tree `syntaxHasTopLevelCommaMultiplier`: a property referenced as `<'name'>` matches one
/// item of its top-level comma-separated list.
fn top_level_comma_multiplier_term(ast: &SyntaxNode) -> Option<&SyntaxNode> {
    let SyntaxNode::Group {
        terms,
        explicit: false,
        ..
    } = ast
    else {
        return None;
    };
    match terms.as_slice() {
        [SyntaxNode::Multiplier { term, info }] if info.comma => Some(term),
        _ => None,
    }
}
