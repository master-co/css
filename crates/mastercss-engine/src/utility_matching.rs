//! Class registration from explicit utility definitions.
use super::{
    ManifestProjection, UtilityDefinition, UtilityEmit, UtilityMatch, UtilityMatcher,
    UtilityMatcherType,
};
use mastercss_schema::{MixinParameterSyntax, UtilityKind};

pub(crate) fn identity(definition: &mastercss_schema::UtilityDefinition) -> String {
    definition.identity()
}

pub(crate) fn register(manifest: &mut ManifestProjection) {
    manifest.token_families =
        super::token_family::infer(&manifest.utility_definitions, &manifest.mixins);
    for definition in &manifest.utility_definitions {
        let recipe = &definition.recipe;
        let name = &recipe.name;
        let token = definition.kind == UtilityKind::Token;
        let key = token && recipe.parameters[0].syntax == Some(MixinParameterSyntax::String);
        let matcher = match definition.kind {
            UtilityKind::Static => UtilityMatcher::Static { name: name.clone() },
            UtilityKind::Function => UtilityMatcher::Function { name: name.clone() },
            UtilityKind::Token => UtilityMatcher::Token {
                prefix: format!("{name}-"),
            },
        };
        let mut utility = UtilityDefinition {
            id: identity(definition),
            name: Some(if token {
                format!("{name}-")
            } else {
                name.clone()
            }),
            utility_type: -2,
            order: Some(0),
            layer: mastercss_schema::UtilityLayerName::Utilities,
            keys: Vec::new(),
            alias_groups: Vec::new(),
            variable_aliases: Vec::new(),
            variable_alias_refs: if token {
                vec![format!("~{}", &recipe.parameters[0].name[2..])]
            } else {
                Vec::new()
            },
            variables: Default::default(),
            variable_entries: Vec::new(),
            native_fallback: false,
            emit: UtilityEmit::Recipe {
                name: identity(definition),
                key,
            },
            matchers: vec![matcher],
        };
        if token && let Some((_, property)) = super::direct_value_mixin(recipe) {
            utility.utility_type = 0;
            utility.emit = UtilityEmit::Property {
                property: property.into(),
            };
        }
        manifest.utilities.push(utility);
    }
}

fn expand(
    manifest: &ManifestProjection,
    identity: &str,
    arguments: &[String],
) -> Result<Vec<super::ExpandedMixinRule>, String> {
    let definition = manifest
        .utility_definitions
        .iter()
        .find(|definition| self::identity(definition) == identity)
        .ok_or_else(|| {
            format!(
                "Unknown utility {}",
                identity.split_once(':').map_or(identity, |(_, name)| name)
            )
        })?;
    super::expand_utility(&manifest.mixins, definition, arguments)
}

type Invocation = (String, Vec<String>, String);

fn invocation(source: &str) -> Option<Result<Invocation, String>> {
    mastercss_lexer::parse_functional_class(source).map(|result| {
        result.map(|head| {
            let arguments = head
                .arguments
                .iter()
                .map(|range| {
                    super::value_syntax::normalize_unmanaged_value(source[range.clone()].trim())
                })
                .collect();
            (head.name, arguments, source[head.suffix_start..].into())
        })
    })
}

pub(crate) fn matching(
    source: &str,
    manifest: &ManifestProjection,
) -> Option<Vec<(usize, UtilityMatch)>> {
    let (name, arguments, state_token) = match invocation(source)? {
        Ok(call) => call,
        Err(_) => return Some(Vec::new()),
    };
    let Some(index) = manifest.function_utilities.get(&name).copied() else {
        return Some(Vec::new());
    };
    if expand(manifest, &format!("Function:{name}"), &arguments).is_err() {
        return Some(Vec::new());
    }
    Some(vec![(
        index,
        UtilityMatch {
            value: Some(serde_json::to_string(&arguments).expect("arguments")),
            value_normalized: true,
            state_token,
            variable_names: Vec::new(),
            matcher_type: UtilityMatcherType::Function,
        },
    )])
}

pub(crate) fn diagnostic(source: &str, manifest: &ManifestProjection) -> Option<String> {
    if let Some(invocation) = invocation(source) {
        return match invocation {
            Err(message) => Some(message),
            Ok((name, arguments, _)) => {
                expand(manifest, &format!("Function:{name}"), &arguments).err()
            }
        };
    }
    let matches = super::named::matching_utilities(source, manifest);
    for (index, matched) in matches {
        if let UtilityEmit::Recipe { name, .. } = &manifest.utilities[index].emit {
            let arguments = matched
                .value
                .as_deref()
                .and_then(|value| serde_json::from_str::<Vec<String>>(value).ok())
                .unwrap_or_default();
            if let Err(message) = expand(manifest, name, &arguments) {
                return Some(message);
            }
        }
    }
    None
}

pub(crate) fn emit(
    manifest: &ManifestProjection,
    name: &str,
    value: Option<&str>,
    important: bool,
) -> Vec<(usize, String, Option<String>, Vec<String>)> {
    let arguments = value
        .and_then(|value| serde_json::from_str::<Vec<String>>(value).ok())
        .unwrap_or_default();
    let Ok(rules) = expand(manifest, name, &arguments) else {
        return Vec::new();
    };
    rules
        .into_iter()
        .enumerate()
        .map(|(index, rule)| {
            let declarations = rule
                .declarations
                .iter()
                .map(|declaration| {
                    super::render::format_declaration(
                        &declaration.property,
                        &declaration.value,
                        important,
                    )
                })
                .collect::<Vec<_>>()
                .join(";");
            (
                index,
                declarations,
                (rule.selector != "&").then_some(rule.selector),
                rule.conditions,
            )
        })
        .collect()
}

pub(crate) fn named_value(key: &str, utility: &UtilityDefinition) -> Option<(String, Vec<String>)> {
    let key_argument = matches!(utility.emit, UtilityEmit::Recipe { key: true, .. });
    if key_argument && key.contains("--") {
        return None;
    }
    let variable = utility.variables.get(key)?;
    // CSS strings, not JSON escape sequences: token names may contain Unicode
    // and escaped punctuation. ASCII controls cannot occur in a class name.
    if !key_argument {
        return Some((
            serde_json::to_string(&vec![format!("var(--{variable})")]).expect("argument"),
            vec![variable.clone()],
        ));
    }
    let quoted = format!("\"{}\"", key.replace('\\', "\\\\").replace('"', "\\\""));
    Some((
        serde_json::to_string(&vec![quoted]).expect("argument"),
        vec![variable.clone()],
    ))
}
