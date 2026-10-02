//! Token metadata from explicit utility registration.
use mastercss_lexer::{CssSyntaxKind, tokenize_css_syntax};
use mastercss_schema::{MixinDefinition, MixinNode, MixinParameterSyntax, MixinValuePart};
use serde::Serialize;
use std::collections::HashSet;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum TokenFamilyArgument {
    Value,
    Key,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenFamily {
    pub utility: String,
    pub prefix: String,
    pub namespace: String,
    pub argument: TokenFamilyArgument,
    pub properties: Vec<String>,
}

/// Only this identity-shaped body permits delayed CSS values as arguments.
/// In particular, parameter fallbacks, types and defaults require evaluation
/// semantics that cannot be implemented by substituting the caller's tokens.
pub fn direct_value_mixin(definition: &MixinDefinition) -> Option<(&str, &str)> {
    let [parameter] = definition.parameters.as_slice() else {
        return None;
    };
    if parameter.syntax.is_some() || parameter.default.is_some() {
        return None;
    }
    let [
        MixinNode::Declaration {
            property, value, ..
        },
    ] = definition.body.as_slice()
    else {
        return None;
    };
    if property.starts_with("--") || !mastercss_schema::is_native_css_property(property) {
        return None;
    }
    let parts = value
        .iter()
        .filter(|part| !matches!(part, MixinValuePart::Text { value } if value.trim().is_empty()))
        .collect::<Vec<_>>();
    let [MixinValuePart::Function { name, value }] = parts.as_slice() else {
        return None;
    };
    if !name.eq_ignore_ascii_case("var") {
        return None;
    }
    let mut argument = String::new();
    for part in value.iter() {
        let MixinValuePart::Text { value } = part else {
            return None;
        };
        argument.push_str(value);
    }
    let tokens = tokenize_css_syntax(&argument);
    if !matches!(tokens.as_slice(), [token] if matches!(&token.kind, CssSyntaxKind::Ident(name) if name.as_ref() == parameter.name))
    {
        return None;
    }
    Some((&parameter.name, property))
}

pub(crate) fn infer(
    definitions: &[mastercss_schema::UtilityDefinition],
    mixins: &[MixinDefinition],
) -> Vec<TokenFamily> {
    definitions
        .iter()
        .filter(|definition| definition.kind == mastercss_schema::UtilityKind::Token)
        .map(|definition| {
            let recipe = &definition.recipe;
            let parameter = &recipe.parameters[0];
            let mut properties = Vec::new();
            collect_properties(&recipe.body, mixins, &mut HashSet::new(), &mut properties);
            TokenFamily {
                utility: recipe.name.clone(),
                prefix: recipe.name.clone(),
                namespace: parameter.name[2..].into(),
                argument: if parameter.syntax == Some(MixinParameterSyntax::String) {
                    TokenFamilyArgument::Key
                } else {
                    TokenFamilyArgument::Value
                },
                properties,
            }
        })
        .collect()
}

fn collect_properties(
    nodes: &[MixinNode],
    definitions: &[MixinDefinition],
    visited: &mut HashSet<String>,
    properties: &mut Vec<String>,
) {
    for node in nodes {
        match node {
            MixinNode::Declaration { property, .. } => {
                if !properties.contains(property) {
                    properties.push(property.clone());
                }
            }
            MixinNode::Rule { body, .. }
            | MixinNode::Condition { body, .. }
            | MixinNode::Contents { fallback: body } => {
                collect_properties(body, definitions, visited, properties)
            }
            MixinNode::Apply { name, contents, .. } => {
                if visited.insert(name.clone())
                    && let Some(definition) = definitions
                        .iter()
                        .find(|definition| &definition.name == name)
                {
                    collect_properties(&definition.body, definitions, visited, properties);
                }
                if let Some(contents) = contents {
                    collect_properties(contents, definitions, visited, properties);
                }
            }
        }
    }
}
