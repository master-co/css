//! Class registration from explicit utility definitions.
#[cfg(feature = "manifest")]
use super::UtilityMatcher;
use super::{Program, UtilityDefinition, UtilityEmit, UtilityMatch, UtilityMatcherType};
#[cfg(feature = "manifest")]
use mastercss_schema::{MixinParameterSyntax, UtilityKind};

pub(crate) fn identity(definition: &mastercss_schema::UtilityDefinition) -> String {
    definition.identity()
}

#[cfg(feature = "manifest")]
pub(crate) fn register(manifest: &mut Program) {
    manifest.token_families =
        super::token_family::infer(&manifest.utility_definitions, &manifest.mixins);
    for (index, definition) in manifest.utility_definitions.iter().enumerate() {
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
                definition: index,
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
    manifest: &Program,
    definition: usize,
    arguments: &[String],
) -> Result<Vec<super::ExpandedMixinRule>, String> {
    super::expand_utility(
        &manifest.mixins,
        &manifest.utility_definitions[definition],
        arguments,
    )
}

/// The recipe a registered function utility expands.
fn function_definition(manifest: &Program, name: &str) -> Option<(usize, usize)> {
    let index = manifest.function_utilities.get(name).copied()?;
    match manifest.utilities[index].emit {
        UtilityEmit::Recipe { definition, .. } => Some((index, definition)),
        UtilityEmit::Property { .. } => None,
    }
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

pub(crate) fn matching(source: &str, manifest: &Program) -> Option<Vec<(usize, UtilityMatch)>> {
    let (name, arguments, state_token) = match invocation(source)? {
        Ok(call) => call,
        Err(_) => return Some(Vec::new()),
    };
    let Some((index, definition)) = function_definition(manifest, &name) else {
        return Some(Vec::new());
    };
    let Ok(expansion) = expand(manifest, definition, &arguments) else {
        return Some(Vec::new());
    };
    Some(vec![(
        index,
        UtilityMatch {
            value: None,
            arguments,
            expansion: Some(expansion).into(),
            state_token,
            variable_names: Vec::new(),
            matcher_type: UtilityMatcherType::Function,
        },
    )])
}

pub(crate) fn diagnostic(source: &str, manifest: &Program) -> Option<String> {
    if let Some(invocation) = invocation(source) {
        return match invocation {
            Err(message) => Some(message),
            Ok((name, arguments, _)) => match function_definition(manifest, &name) {
                Some((_, definition)) => expand(manifest, definition, &arguments).err(),
                None => Some(crate::message(|| format!("Unknown utility {name}"))),
            },
        };
    }
    let matches = super::named::matching_utilities(source, manifest);
    for (index, matched) in matches {
        if let UtilityEmit::Recipe { definition, .. } = manifest.utilities[index].emit
            && let Err(message) = expand(manifest, definition, &matched.arguments)
        {
            return Some(message);
        }
    }
    None
}

pub(crate) fn emit(
    manifest: &Program,
    definition: usize,
    matched: &UtilityMatch,
    important: bool,
) -> Vec<(usize, String, Option<String>, Vec<String>)> {
    let Some(rules) = matched
        .expansion
        .get_or_init(|| expand(manifest, definition, &matched.arguments).ok())
    else {
        return Vec::new();
    };
    rules
        .iter()
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
                (rule.selector != "&").then(|| rule.selector.clone()),
                rule.conditions.clone(),
            )
        })
        .collect()
}

pub(crate) fn named_arguments(
    key: &str,
    utility: &UtilityDefinition,
) -> Option<(Vec<String>, Vec<String>)> {
    let key_argument = matches!(utility.emit, UtilityEmit::Recipe { key: true, .. });
    if key_argument && key.contains("--") {
        return None;
    }
    let variable = utility.variables.get(key)?;
    // CSS strings, not JSON escape sequences: token names may contain Unicode
    // and escaped punctuation. ASCII controls cannot occur in a class name.
    if !key_argument {
        return Some((vec![format!("var(--{variable})")], vec![variable.clone()]));
    }
    let quoted = format!("\"{}\"", key.replace('\\', "\\\\").replace('"', "\\\""));
    Some((vec![quoted], vec![variable.clone()]))
}
