use serde::de::{Deserializer, Error as _, SeqAccess, Unexpected, Visitor, value::Error};
use serde::{Deserialize, Serialize};

use crate::tagged::{only, required};

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
#[serde(tag = "type", rename_all = "kebab-case", try_from = "RawMixinNode")]
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
#[serde(
    tag = "type",
    rename_all = "kebab-case",
    try_from = "RawMixinValuePart"
)]
pub enum MixinValuePart {
    Text { value: String },
    Function { name: String, value: MixinValue },
}

#[derive(Deserialize)]
#[serde(rename_all = "kebab-case")]
enum MixinNodeType {
    Declaration,
    Rule,
    Condition,
    Apply,
    Contents,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RawMixinNode {
    r#type: MixinNodeType,
    property: Option<String>,
    value: Option<MixinValue>,
    selector: Option<String>,
    condition: Option<String>,
    body: Option<Vec<MixinNode>>,
    name: Option<String>,
    arguments: Option<Vec<MixinValue>>,
    contents: Option<Vec<MixinNode>>,
    fallback: Option<Vec<MixinNode>>,
    source: Option<crate::CssDirectiveSourceReference>,
}

impl TryFrom<RawMixinNode> for MixinNode {
    type Error = Error;

    fn try_from(raw: RawMixinNode) -> Result<Self, Error> {
        let present = [
            ("property", raw.property.is_some()),
            ("value", raw.value.is_some()),
            ("selector", raw.selector.is_some()),
            ("condition", raw.condition.is_some()),
            ("body", raw.body.is_some()),
            ("name", raw.name.is_some()),
            ("arguments", raw.arguments.is_some()),
            ("contents", raw.contents.is_some()),
            ("fallback", raw.fallback.is_some()),
            ("source", raw.source.is_some()),
        ];
        Ok(match raw.r#type {
            MixinNodeType::Declaration => {
                only(&present, &["property", "value", "source"])?;
                Self::Declaration {
                    property: required(raw.property, "property")?,
                    value: required(raw.value, "value")?,
                    source: raw.source,
                }
            }
            MixinNodeType::Rule => {
                only(&present, &["selector", "body"])?;
                Self::Rule {
                    selector: required(raw.selector, "selector")?,
                    body: required(raw.body, "body")?,
                }
            }
            MixinNodeType::Condition => {
                only(&present, &["condition", "body"])?;
                Self::Condition {
                    condition: required(raw.condition, "condition")?,
                    body: required(raw.body, "body")?,
                }
            }
            MixinNodeType::Apply => {
                only(&present, &["name", "arguments", "contents", "source"])?;
                Self::Apply {
                    name: required(raw.name, "name")?,
                    arguments: required(raw.arguments, "arguments")?,
                    contents: raw.contents,
                    source: raw.source,
                }
            }
            MixinNodeType::Contents => {
                only(&present, &["fallback"])?;
                Self::Contents {
                    fallback: required(raw.fallback, "fallback")?,
                }
            }
        })
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "kebab-case")]
enum MixinValuePartType {
    Text,
    Function,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RawMixinValuePart {
    r#type: MixinValuePartType,
    name: Option<String>,
    value: Option<TextOrValue>,
}

/// `value` is a string for text parts and a nested value for functions.
enum TextOrValue {
    Text(String),
    Value(MixinValue),
}

impl<'de> Deserialize<'de> for TextOrValue {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        struct TextOrValueVisitor;

        impl<'de> Visitor<'de> for TextOrValueVisitor {
            type Value = TextOrValue;

            fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
                formatter.write_str("a string or a sequence")
            }

            fn visit_str<E: serde::de::Error>(self, value: &str) -> Result<TextOrValue, E> {
                Ok(TextOrValue::Text(value.to_owned()))
            }

            fn visit_string<E: serde::de::Error>(self, value: String) -> Result<TextOrValue, E> {
                Ok(TextOrValue::Text(value))
            }

            fn visit_seq<A: SeqAccess<'de>>(
                self,
                mut sequence: A,
            ) -> Result<TextOrValue, A::Error> {
                let mut parts = Vec::new();
                while let Some(part) = sequence.next_element()? {
                    parts.push(part);
                }
                Ok(TextOrValue::Value(parts))
            }
        }

        deserializer.deserialize_any(TextOrValueVisitor)
    }
}

impl TryFrom<RawMixinValuePart> for MixinValuePart {
    type Error = Error;

    fn try_from(raw: RawMixinValuePart) -> Result<Self, Error> {
        let present = [("name", raw.name.is_some()), ("value", raw.value.is_some())];
        Ok(match raw.r#type {
            MixinValuePartType::Text => {
                only(&present, &["value"])?;
                match required(raw.value, "value")? {
                    TextOrValue::Text(value) => Self::Text { value },
                    TextOrValue::Value(_) => {
                        return Err(Error::invalid_type(Unexpected::Seq, &"a string"));
                    }
                }
            }
            MixinValuePartType::Function => {
                only(&present, &["name", "value"])?;
                let name = required(raw.name, "name")?;
                match required(raw.value, "value")? {
                    TextOrValue::Value(value) => Self::Function { name, value },
                    TextOrValue::Text(value) => {
                        return Err(Error::invalid_type(Unexpected::Str(&value), &"a sequence"));
                    }
                }
            }
        })
    }
}

/// Explicit class registration, independent of native mixin names.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", from = "RawUtilityDefinition")]
pub struct UtilityDefinition {
    pub kind: UtilityKind,
    #[serde(flatten)]
    pub recipe: MixinDefinition,
}

/// Mirrors the flattened `kind` plus recipe fields. Like the flattened
/// derive, unknown fields are ignored.
#[derive(Deserialize)]
struct RawUtilityDefinition {
    kind: UtilityKind,
    name: String,
    #[serde(default)]
    parameters: Vec<MixinParameter>,
    body: Vec<MixinNode>,
    source: Option<crate::CssDirectiveSourceReference>,
}

impl From<RawUtilityDefinition> for UtilityDefinition {
    fn from(raw: RawUtilityDefinition) -> Self {
        Self {
            kind: raw.kind,
            recipe: MixinDefinition {
                name: raw.name,
                parameters: raw.parameters,
                body: raw.body,
                source: raw.source,
            },
        }
    }
}

impl UtilityDefinition {
    /// Registration identity shared by execution, lowering and source tracking.
    /// Parameter mode and body are deliberately excluded: a later definition
    /// replaces the entire registration within the same token namespace.
    pub fn identity(&self) -> String {
        self.kind.identity(
            &self.recipe.name,
            self.recipe
                .parameters
                .first()
                .map(|parameter| parameter.name.as_str()),
        )
    }
}

impl UtilityKind {
    pub fn identity(self, name: &str, namespace: Option<&str>) -> String {
        match self {
            UtilityKind::Token => format!(
                "Token:{}",
                serde_json::to_string(&(name, namespace)).expect("utility identity")
            ),
            kind => format!("{kind:?}:{name}"),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum UtilityKind {
    Static,
    Token,
    Function,
}
