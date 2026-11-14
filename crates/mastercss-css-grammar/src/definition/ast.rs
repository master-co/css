use std::fmt;

/// A node in the CSS Value Definition Syntax AST.
#[derive(Clone, Debug, PartialEq)]
pub enum SyntaxNode {
    /// A CSS keyword (e.g., `auto`, `none`, `inherit`).
    Keyword { name: String },

    /// A CSS data type (e.g., `<color>`, `<length>`).
    Type {
        name: String,
        opts: Option<TypeRange>,
    },

    /// A CSS property reference (e.g., `<'transform'>`).
    Property { name: String },

    /// A function notation (e.g., `rgb(`).
    Function { name: String },

    /// A group of terms with a combinator.
    Group {
        terms: Vec<SyntaxNode>,
        combinator: Combinator,
        disallow_empty: bool,
        explicit: bool,
    },

    /// A multiplied term (e.g., `<color>+`, `<length>{1,4}`).
    Multiplier {
        term: Box<SyntaxNode>,
        info: MultiplierInfo,
    },

    /// A raw token character.
    Token { value: String },

    /// A quoted string value.
    StringNode { value: String },

    /// A comma literal.
    Comma,

    /// An at-keyword (e.g., `@supports`).
    AtKeyword { name: String },

    /// A boolean expression (e.g., `<boolean-expr[<test>]>`).
    Boolean { term: Box<SyntaxNode> },
}

/// Combinator type for groups.
#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub enum Combinator {
    /// Juxtaposition (space) — all required, in order.
    Juxtaposition,
    /// `&&` — all required, any order.
    DoubleAmpersand,
    /// `||` — one or more, any order.
    DoubleBar,
    /// `|` — exactly one.
    Bar,
}

impl fmt::Display for Combinator {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Juxtaposition => write!(f, " "),
            Self::DoubleAmpersand => write!(f, " && "),
            Self::DoubleBar => write!(f, " || "),
            Self::Bar => write!(f, " | "),
        }
    }
}

/// Multiplier info attached to a term.
#[derive(Clone, Debug, PartialEq)]
pub struct MultiplierInfo {
    /// Minimum occurrences. 0 means no minimum.
    pub min: u32,
    /// Maximum occurrences. 0 means unbounded.
    pub max: u32,
    /// Whether this is a comma-separated multiplier (`#`).
    pub comma: bool,
}

/// Range restriction for types (e.g., `<integer [0,10]>`, `<time [0s,∞]>`).
///
/// Values are stored as raw strings to preserve unit suffixes (e.g., `"0s"`).
/// `None` represents infinity (negative for min, positive for max).
#[derive(Clone, Debug, PartialEq)]
pub struct TypeRange {
    /// Minimum value. `None` means negative infinity.
    pub min: Option<String>,
    /// Maximum value. `None` means positive infinity.
    pub max: Option<String>,
}
