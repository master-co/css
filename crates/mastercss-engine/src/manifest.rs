use super::{CompiledVariable, EngineVariableIr, Program, UtilityLayerName, UtilityMatcher};
use super::{EngineError, HashMap, MasterCssManifest};
use mastercss_lexer::concat_text;
use mastercss_schema::{ManifestVariable, Record};

pub(crate) fn layer_name(layer: UtilityLayerName) -> &'static str {
    match layer {
        UtilityLayerName::Base => "base",
        UtilityLayerName::Defaults => "defaults",
        UtilityLayerName::Components => "components",
        UtilityLayerName::Utilities => "utilities",
    }
}

/// Validates a manifest and compiles it into the encoded part of a program; decoding
/// derives the rest with [`finish_program`].
pub(crate) fn compile_manifest(manifest: &MasterCssManifest) -> Result<Program, EngineError> {
    let mut keyframes = manifest.keyframes.clone().unwrap_or_default();
    let mut seen = super::HashSet::default();
    keyframes.reverse();
    keyframes.retain(|definition| seen.insert(definition.id.clone()));
    keyframes.reverse();
    seen.clear();
    let mut mixins = manifest.mixins.clone().unwrap_or_default();
    mixins.reverse();
    mixins.retain(|definition| seen.insert(definition.name.clone()));
    mixins.reverse();
    super::validate_mixins(&mixins).map_err(EngineError::InvalidManifest)?;
    seen.clear();
    let mut utility_definitions = manifest.utilities.clone().unwrap_or_default();
    utility_definitions.reverse();
    utility_definitions
        .retain(|definition| seen.insert(super::utility_matching::identity(definition)));
    utility_definitions.reverse();
    super::validate_utilities(&mixins, &utility_definitions)
        .map_err(EngineError::InvalidManifest)?;
    let (compiled_variables, compiled_variable_order) =
        compile_variables(manifest.variables.as_ref())?;
    let custom_media = manifest
        .custom_media
        .iter()
        .flatten()
        .map(|(name, query)| (name.clone(), query.clone()))
        .collect::<HashMap<_, _>>();
    for name in custom_media.keys() {
        if !name.starts_with("--") || name.len() == 2 || name == "--starting-style" {
            return Err(EngineError::InvalidManifest(concat_text!(
                "Invalid or reserved custom media name ",
                name
            )));
        }
    }
    let mut program = Program {
        theme: manifest.theme.clone().unwrap_or_default(),
        keyframes,
        animation_variables: manifest
            .animation_variables
            .iter()
            .flatten()
            .map(|(name, values)| (name.clone(), values.clone()))
            .collect(),
        custom_media,
        mixins,
        utility_definitions,
        compiled_variables,
        compiled_variable_order,
        ..Program::default()
    };
    super::utility_matching::register(&mut program);
    for query in program.custom_media.values() {
        crate::custom_media_branches(query).map_err(EngineError::InvalidManifest)?;
    }
    Ok(program)
}

/// Static utilities match before the others; the sort is stable.
pub(crate) fn static_last(utility: &super::UtilityDefinition) -> u8 {
    (!utility
        .matchers
        .iter()
        .any(|matcher| matches!(matcher, UtilityMatcher::Static { .. }))) as u8
}

/// Derives the lookup state of a program from its registered utilities, compiled
/// variables and custom media. Compiling and decoding share it, so neither stores
/// what this computes.
pub(crate) fn finish_program(program: &mut Program) -> Result<(), String> {
    program.has_inline_tokens = program
        .compiled_variables
        .values()
        .any(|variable| variable.inline_value.is_some());
    for (name, query) in &program.custom_media {
        let paths = crate::custom_media_branches(query)?;
        program.custom_media_paths.insert(name.clone(), paths);
    }
    for utility in &mut program.utilities {
        if utility.name.is_none() {
            utility.name = Some(utility.id.clone());
        }
    }
    // A stable partition by `static_last`, without the standard sort's code.
    let (mut utilities, rest): (Vec<_>, Vec<_>) = std::mem::take(&mut program.utilities)
        .into_iter()
        .partition(|utility| static_last(utility) == 0);
    utilities.extend(rest);
    program.utilities = utilities;
    for (index, utility) in program.utilities.iter().enumerate() {
        for matcher in &utility.matchers {
            match matcher {
                UtilityMatcher::Token { prefix } => {
                    program
                        .token_utilities
                        .entry(prefix.clone())
                        .or_default()
                        .push(index);
                }
                UtilityMatcher::Function { name } => {
                    program.function_utilities.insert(name.clone(), index);
                }
                UtilityMatcher::Static { name } => {
                    program
                        .static_utilities
                        .entry(name.clone())
                        .or_default()
                        .push(index);
                }
            }
        }
    }
    Ok(())
}

pub(crate) fn compile_variables(
    groups: Option<&Record<Vec<ManifestVariable>>>,
) -> Result<(HashMap<String, CompiledVariable>, Vec<String>), EngineError> {
    let mut variables = HashMap::default();
    let mut order = Vec::new();
    for (namespace, definitions) in groups.into_iter().flatten() {
        for definition in definitions {
            let key = definition.key.clone();
            let name = definition.name_in(namespace);
            if name.is_empty() {
                continue;
            }
            if [&key, &name]
                .iter()
                .any(|text| text.starts_with('-') || text.ends_with('-'))
            {
                return Err(EngineError::InvalidManifest(concat_text!(
                    "Variable ",
                    name,
                    " must not have a key or name that starts or ends with -"
                )));
            }
            let values = definition.values.clone();
            if !variables.contains_key(&name) {
                order.push(name.clone());
            }
            variables.insert(
                name.clone(),
                CompiledVariable {
                    name,
                    key,
                    namespace: namespace.clone(),
                    inline_value: super::inline_theme::selected_value(&values),
                    is_static: values.iter().any(|value| value.is_static),
                    values,
                    numeric: definition.numeric.as_ref().and_then(|numeric| {
                        Some(super::VariableNumeric {
                            value: numeric.value.as_ref()?.as_f64()?,
                            unit: numeric.unit.clone(),
                        })
                    }),
                    variable_type: definition
                        .variable_type
                        .clone()
                        .unwrap_or_else(|| "string".into()),
                    dependencies: definition.dependencies.clone().unwrap_or_default(),
                },
            );
        }
    }
    Ok((variables, order))
}

pub(crate) fn engine_variable_ir(variable: &CompiledVariable) -> EngineVariableIr {
    EngineVariableIr {
        namespace: variable.namespace.clone(),
        name: variable.name.clone(),
        key: variable.key.clone(),
        variable_type: variable.variable_type.clone(),
        values: variable.values.clone(),
        dependencies: variable.dependencies.clone(),
    }
}
