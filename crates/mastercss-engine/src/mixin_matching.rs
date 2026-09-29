use super::{
    ManifestProjection, UtilityDefinition, UtilityEmit, UtilityMatch, UtilityMatcher,
    UtilityMatcherType,
};
use mastercss_schema::MixinParameterSyntax;

pub(crate) fn register(manifest: &mut ManifestProjection) {
    for definition in &manifest.mixins {
        let name = definition.name.trim_start_matches("--");
        let mut matchers = vec![UtilityMatcher::Function { name: name.into() }];
        if definition.parameters.is_empty() {
            matchers.push(UtilityMatcher::Static { name: name.into() });
        }
        let named = definition.parameters.len() == 1
            && definition.parameters[0].syntax == Some(MixinParameterSyntax::String);
        if named {
            matchers.push(UtilityMatcher::Token {
                prefix: format!("{name}-"),
            });
        }
        manifest.utilities.push(UtilityDefinition {
            id: definition.name.clone(),
            name: Some(name.into()),
            utility_type: -2,
            order: Some(0),
            layer: mastercss_schema::UtilityLayerName::Utilities,
            keys: Vec::new(),
            alias_groups: Vec::new(),
            variable_aliases: Vec::new(),
            variable_alias_refs: if named {
                vec![format!("~{name}")]
            } else {
                Vec::new()
            },
            variables: Default::default(),
            variable_entries: Vec::new(),
            native_fallback: false,
            builtin_token: false,
            emit: UtilityEmit::Mixin {
                name: definition.name.clone(),
            },
            matchers,
        });
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
    if super::expand_mixin(&manifest.mixins, &format!("--{name}"), &arguments).is_err() {
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
                super::expand_mixin(&manifest.mixins, &format!("--{name}"), &arguments).err()
            }
        };
    }
    let matches = super::named::matching_utilities(source, manifest);
    for (index, matched) in matches {
        if let UtilityEmit::Mixin { name } = &manifest.utilities[index].emit {
            let arguments = matched
                .value
                .as_deref()
                .and_then(|value| serde_json::from_str::<Vec<String>>(value).ok())
                .unwrap_or_default();
            if let Err(message) = super::expand_mixin(&manifest.mixins, name, &arguments) {
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
    let Ok(rules) = super::expand_mixin(&manifest.mixins, name, &arguments) else {
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
    if key.contains("--") {
        return None;
    }
    let variable = utility.variables.get(key)?;
    // CSS strings, not JSON escape sequences: token names may contain Unicode
    // and escaped punctuation. ASCII controls cannot occur in a class name.
    let quoted = format!("\"{}\"", key.replace('\\', "\\\\").replace('"', "\\\""));
    Some((
        serde_json::to_string(&vec![quoted]).expect("argument"),
        vec![variable.clone()],
    ))
}
