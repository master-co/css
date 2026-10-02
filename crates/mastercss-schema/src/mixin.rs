use serde::{Deserialize, Serialize};

/// Compiled, ordered mixin body. CSS parsing belongs to the compiler; the engine
/// only binds component-value templates and executes these nodes.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct MixinDefinition {
    pub name: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub parameters: Vec<MixinParameter>,
    pub body: Vec<MixinNode>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source: Option<crate::CssDirectiveSourceReference>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct MixinParameter {
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub syntax: Option<MixinParameterSyntax>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub default: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source: Option<crate::CssDirectiveSourceReference>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum MixinParameterSyntax {
    Integer,
    Number,
    String,
    CustomIdent,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "kebab-case", deny_unknown_fields)]
pub enum MixinNode {
    Declaration {
        property: String,
        value: MixinValue,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        source: Option<crate::CssDirectiveSourceReference>,
    },
    Rule {
        selector: String,
        body: Vec<MixinNode>,
    },
    Condition {
        condition: String,
        body: Vec<MixinNode>,
    },
    Apply {
        name: String,
        arguments: Vec<MixinValue>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        contents: Option<Vec<MixinNode>>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        source: Option<crate::CssDirectiveSourceReference>,
    },
    Contents {
        fallback: Vec<MixinNode>,
    },
}

pub type MixinValue = Vec<MixinValuePart>;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "kebab-case", deny_unknown_fields)]
pub enum MixinValuePart {
    Text { value: String },
    Function { name: String, value: MixinValue },
}

/// Explicit class registration, independent of native mixin names.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UtilityDefinition {
    pub kind: UtilityKind,
    #[serde(flatten)]
    pub recipe: MixinDefinition,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum UtilityKind {
    Static,
    Token,
    Function,
}
