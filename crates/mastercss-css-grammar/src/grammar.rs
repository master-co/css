//! The CSS grammar the checks match against (`data/grammar.json`) and css-tree's
//! name helpers (`lib/utils/names.js`).

use std::collections::{HashMap, HashSet};
use std::sync::LazyLock;

use crate::definition::{self, ast::SyntaxNode};

/// An at-rule: its prelude syntax and its descriptor syntaxes.
#[derive(Debug, serde::Deserialize)]
pub struct AtruleGrammar {
    pub prelude: Option<String>,
    pub descriptors: Option<HashMap<String, String>>,
}

/// mdn-data's types, properties and at-rules with css-tree's patch, as
/// `scripts/generate-css-grammar-data.mjs` writes them.
#[derive(Debug, serde::Deserialize)]
pub struct Grammar {
    pub source: String,
    pub types: HashMap<String, String>,
    pub properties: HashMap<String, String>,
    pub atrules: HashMap<String, AtruleGrammar>,
}

pub static GRAMMAR: LazyLock<Grammar> = LazyLock::new(|| {
    serde_json::from_str(include_str!("../data/grammar.json")).expect("data/grammar.json is valid")
});

/// css-tree `lexer.units`: every unit of the generic dimension types.
pub const UNITS: &[&[&str]] = &[
    &[
        "cm", "mm", "q", "in", "pt", "pc", "px", "em", "rem", "ex", "rex", "cap", "rcap", "ch",
        "rch", "ic", "ric", "lh", "rlh", "vw", "svw", "lvw", "dvw", "vh", "svh", "lvh", "dvh",
        "vi", "svi", "lvi", "dvi", "vb", "svb", "lvb", "dvb", "vmin", "svmin", "lvmin", "dvmin",
        "vmax", "svmax", "lvmax", "dvmax", "cqw", "cqh", "cqi", "cqb", "cqmin", "cqmax",
    ],
    &["deg", "grad", "rad", "turn"],
    &["s", "ms"],
    &["hz", "khz"],
    &["dpi", "dpcm", "dppx", "x"],
    &["fr"],
    &["db"],
    &["st"],
];

/// Whether `unit` is a unit of any generic dimension type (ASCII case-insensitive).
pub fn is_known_unit(unit: &str) -> bool {
    let unit = unit.to_ascii_lowercase();
    UNITS.iter().any(|units| units.contains(&unit.as_str()))
}

static KEYWORDS: LazyLock<HashSet<String>> = LazyLock::new(|| {
    let mut keywords = HashSet::new();
    let grammar = &*GRAMMAR;
    for syntax in grammar.properties.values().chain(grammar.types.values()) {
        if let Ok(ast) = definition::parse(syntax) {
            collect_keywords(&ast, &mut keywords);
        }
    }
    keywords
});

fn collect_keywords(node: &SyntaxNode, keywords: &mut HashSet<String>) {
    match node {
        SyntaxNode::Keyword { name } => {
            keywords.insert(name.to_lowercase());
        }
        SyntaxNode::Group { terms, .. } => {
            for term in terms {
                collect_keywords(term, keywords);
            }
        }
        SyntaxNode::Multiplier { term, .. } | SyntaxNode::Boolean { term } => {
            collect_keywords(term, keywords);
        }
        _ => {}
    }
}

/// Whether a keyword of any property or type syntax is `name` (ASCII case-insensitive).
pub fn is_known_keyword(name: &str) -> bool {
    KEYWORDS.contains(&name.to_lowercase())
}

/// css-tree `names.keyword(name)`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct KeywordName {
    pub name: String,
    pub basename: String,
    pub vendor: String,
    pub custom: bool,
}

/// css-tree `names.property(name)`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PropertyName {
    pub name: String,
    pub basename: String,
    pub hack: String,
    pub vendor: String,
    pub custom: bool,
}

fn is_custom_property(value: &[u16], offset: usize) -> bool {
    value.len() >= offset + 2
        && value[offset] == u16::from(b'-')
        && value[offset + 1] == u16::from(b'-')
}

fn vendor_prefix(value: &[u16], offset: usize) -> usize {
    if value.len() >= offset + 3
        && value[offset] == u16::from(b'-')
        && value[offset + 1] != u16::from(b'-')
        && let Some(dash) = value[offset + 2..]
            .iter()
            .position(|&c| c == u16::from(b'-'))
    {
        return dash + 3;
    }
    0
}

fn units(value: &str) -> Vec<u16> {
    value.encode_utf16().collect()
}

fn text(units: &[u16]) -> String {
    String::from_utf16_lossy(units)
}

/// css-tree `names.keyword(keyword)`.
pub fn keyword(keyword: &str) -> KeywordName {
    let name = units(&keyword.to_lowercase());
    let custom = is_custom_property(&name, 0);
    let vendor = if custom { 0 } else { vendor_prefix(&name, 0) };
    KeywordName {
        basename: text(&name[vendor..]),
        vendor: text(&name[..vendor]),
        name: text(&name),
        custom,
    }
}

/// css-tree `names.property(property)`.
pub fn property(property: &str) -> PropertyName {
    let source = units(property);
    let hack = match source
        .first()
        .copied()
        .map(u32::from)
        .and_then(char::from_u32)
    {
        Some('/') => {
            if source.get(1) == Some(&u16::from(b'/')) {
                2
            } else {
                1
            }
        }
        Some('_' | '*' | '$' | '#' | '+' | '&') => 1,
        _ => 0,
    };
    let custom = is_custom_property(&source, hack);
    let name = if custom {
        source
    } else {
        units(&property.to_lowercase())
    };
    let vendor = if custom {
        0
    } else {
        vendor_prefix(&name, hack)
    };
    let prefix = hack + vendor;
    PropertyName {
        basename: text(&name[prefix..]),
        name: text(&name[hack..]),
        hack: text(&name[..hack]),
        vendor: text(&name[hack..prefix]),
        custom,
    }
}

/// css-tree `lexer.getProperty(name)`: the syntax of a property, falling back to
/// the unprefixed name for a vendor-prefixed one.
pub fn property_syntax(name: &str) -> Option<&'static str> {
    let property = property(name);
    let grammar = &*GRAMMAR;
    grammar
        .properties
        .get(&property.name)
        .or_else(|| {
            (!property.vendor.is_empty())
                .then(|| grammar.properties.get(&property.basename))
                .flatten()
        })
        .map(String::as_str)
}

/// css-tree `lexer.getAtrule(name)`.
pub fn atrule(name: &str) -> Option<&'static AtruleGrammar> {
    let atrule = keyword(name);
    let grammar = &*GRAMMAR;
    grammar.atrules.get(&atrule.name).or_else(|| {
        (!atrule.vendor.is_empty())
            .then(|| grammar.atrules.get(&atrule.basename))
            .flatten()
    })
}

/// css-tree `lexer.getAtruleDescriptor(atrule, name)`.
pub fn atrule_descriptor(atrule_name: &str, name: &str) -> Option<&'static str> {
    let descriptors = atrule(atrule_name)?.descriptors.as_ref()?;
    let descriptor = keyword(name);
    descriptors
        .get(&descriptor.name)
        .or_else(|| descriptors.get(&descriptor.basename))
        .map(String::as_str)
}

/// css-tree `lexer.getType(name)`: a type of the data or a generic type.
pub fn has_type(name: &str) -> bool {
    crate::lexer::generic::lookup(name).is_some() || GRAMMAR.types.contains_key(name)
}
