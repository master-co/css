//! CSS syntax and value-grammar checks.
//!
//! The grammar is mdn-data with css-tree's patch (`data/grammar.json`), matched by a port of
//! css-tree's lexer, parser and generator, so a value is checked exactly as css-tree checks it.
//! The tokenizer, value definition syntax parser and lexer are adapted from markuplint's Rust
//! port of css-tree (`markuplint-types`, MIT); see `THIRD_PARTY_NOTICES.md`.

mod check;
pub mod definition;
mod generate;
pub mod grammar;
pub mod lexer;
mod math;
mod parser;
mod stream;
mod strings;
pub mod tokenizer;

pub use check::{
    CssError, DeclarationValidation, Range, Status, parse_declarations, rule_declarations,
    syntax_status, validate_css, value_status,
};

/// The mdn-data release `data/grammar.json` was generated from.
pub const MDN_DATA_VERSION: &str = "2.37.2";

/// JSON of [`rule_declarations`], for bindings.
pub fn rule_declarations_json(text: &str) -> String {
    serde_json::to_string(&rule_declarations(text)).expect("declarations serialize")
}

/// JSON of [`validate_css`], for bindings.
pub fn validate_css_json(text: &str) -> String {
    serde_json::to_string(&validate_css(text)).expect("errors serialize")
}

/// JSON of [`parse_declarations`] as `[property, value]` pairs, for bindings.
pub fn parse_declarations_json(text: &str) -> String {
    serde_json::to_string(&parse_declarations(text)).expect("declarations serialize")
}

#[cfg(test)]
mod tests {
    #[test]
    fn grammar_data_matches_its_version() {
        assert!(
            crate::grammar::GRAMMAR
                .source
                .starts_with(&format!("mdn-data {} ", super::MDN_DATA_VERSION))
        );
    }
}
