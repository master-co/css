use super::resolution::{compile_with_base, directive_error, engine_for_manifest};
use super::{CompilerError, CssDirectiveManifestInput, EngineSession, Value};
use crate::utility_definitions;

/// Override complete units before lowering their ordered body.
/// fragments are lowered together; a nested rule can never outlive its owner.
pub(super) fn resolve_bodies(
    input: &mut CssDirectiveManifestInput,
    base: Option<Value>,
) -> Result<(EngineSession, Value, u64), CompilerError> {
    if let Some(utilities) = &mut input.utilities {
        *utilities = utility_definitions::effective(utilities);
    }
    utility_definitions::validate_names(input.utilities.as_deref().unwrap_or_default())?;
    let mut manifest = compile_with_base(input, base.clone())?;
    let mut engine = engine_for_manifest(&manifest)?;
    let utilities = input.utilities.as_deref().unwrap_or_default();
    let mut groups = Vec::new();
    let mut indices = Vec::new();
    for (index, definition) in utilities.iter().enumerate() {
        let definition_object = definition
            .as_object()
            .ok_or_else(|| directive_error("Utility definition must be an object"))?;
        if !definition_object.contains_key("body") {
            continue;
        }
        let name = definition["name"]
            .as_str()
            .ok_or_else(|| directive_error("Utility definition requires a name"))?;
        groups.push((
            (name.to_owned(), utility_definitions::layer(definition)),
            utility_definitions::body(definition_object)?,
        ));
        indices.push(index);
    }
    let mut changed = false;
    for index in 0..groups.len() {
        let mut rules = Vec::new();
        for style in super::merge::create_merged_style_definitions(
            &groups[index].1,
            &mut engine,
            Some(groups[index].0.1),
        )? {
            utility_definitions::append_rules(
                &mut rules,
                style.declarations,
                &style.selector,
                &style.conditions,
            );
        }
        let definition = &mut input.utilities.as_mut().unwrap()[indices[index]];
        let previous = definition
            .get("compiledBody")
            .and_then(Value::as_array)
            .cloned()
            .map(Ok)
            .unwrap_or_else(|| utility_definitions::seed_rules(definition.as_object().unwrap()))?;
        if previous != rules {
            changed = true;
        }
        definition["compiledBody"] = Value::Array(rules);
    }
    if changed {
        manifest = compile_with_base(input, base)?;
        engine = engine_for_manifest(&manifest)?;
    }
    Ok((engine, manifest, u64::from(changed)))
}
