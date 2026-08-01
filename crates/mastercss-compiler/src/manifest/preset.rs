use super::*;

pub(super) fn append_default_preset_styles(
    input: &mut CssDirectiveManifestInput,
    definitions: &[CssDirectiveStyleDefinition],
) -> Result<(), CompilerError> {
    let utilities = input.utilities.get_or_insert_default();
    for definition in definitions {
        let CssDirectiveStyleDefinition::Native {
            selector,
            declarations,
            conditions,
            condition_path,
            layer,
            name,
            ..
        } = definition
        else {
            return Err(manifest_error(
                "Default preset generation cannot contain @compose definitions",
            ));
        };
        let name = name.as_deref().ok_or_else(|| {
            manifest_error("Default preset managed style definition requires a name")
        })?;
        if condition_path.as_ref().is_some_and(|path| {
            path.iter().any(|entry| {
                matches!(
                    entry,
                    mastercss_schema::CssDirectiveConditionPathEntry::Variant { .. }
                )
            })
        }) {
            return Err(manifest_error(
                "Default preset managed style definitions cannot depend on named variants",
            ));
        }
        let layer = layer
            .map(|layer| serde_json::to_value(layer).expect("utility layer serializes"))
            .unwrap_or_else(|| Value::String("utilities".into()));
        let layer_name = layer.as_str().unwrap_or("utilities");
        let existing = utilities.iter_mut().find(|utility| {
            utility.get("name").and_then(Value::as_str) == Some(name)
                && utility
                    .get("layer")
                    .and_then(Value::as_str)
                    .unwrap_or("utilities")
                    == layer_name
                && utility
                    .get("type")
                    .and_then(Value::as_str)
                    .unwrap_or("static")
                    == "static"
        });
        let utility = if let Some(existing) = existing {
            existing
                .as_object_mut()
                .expect("managed utility definitions are objects")
        } else {
            utilities.push(json!({ "name": name, "type": "static", "layer": layer }));
            utilities
                .last_mut()
                .and_then(Value::as_object_mut)
                .expect("managed utility definition was inserted")
        };
        let can_inline = selector == "&"
            && conditions.as_ref().is_none_or(Vec::is_empty)
            && !utility.contains_key("declarations")
            && !utility.contains_key("rules");
        if can_inline {
            utility.insert("declarations".into(), Value::Object(declarations.clone()));
            continue;
        }
        if let Some(previous) = utility.shift_remove("declarations") {
            utility
                .entry("rules")
                .or_insert_with(|| Value::Array(Vec::new()))
                .as_array_mut()
                .expect("managed utility rules are an array")
                .push(json!({ "declarations": previous }));
        }
        let mut rule = Map::new();
        rule.insert("declarations".into(), Value::Object(declarations.clone()));
        if selector != "&" {
            rule.insert("selector".into(), Value::String(selector.clone()));
        }
        if let Some(conditions) = conditions
            .as_ref()
            .filter(|conditions| !conditions.is_empty())
        {
            rule.insert(
                "conditions".into(),
                Value::Array(conditions.iter().cloned().map(Value::String).collect()),
            );
        }
        utility
            .entry("rules")
            .or_insert_with(|| Value::Array(Vec::new()))
            .as_array_mut()
            .expect("managed utility rules are an array")
            .push(Value::Object(rule));
    }
    Ok(())
}

pub fn compile_manifest_input_with_styles(
    input: &CssDirectiveManifestInput,
    definitions: &[CssDirectiveStyleDefinition],
    options: &CompileManifestOptions,
) -> Result<CompileManifestResult, CompilerError> {
    let mut input = input.clone();
    append_default_preset_styles(&mut input, definitions)?;
    compile_manifest_input(&input, options)
}

pub fn compile_default_preset_manifest(
    request: &CompileDefaultPresetRequest,
) -> Result<CompileDefaultPresetResult, CompilerError> {
    let manifest = compile_manifest_input_with_styles(
        &request.manifest_input,
        &request.style_definitions,
        &CompileManifestOptions::default(),
    )?
    .manifest;
    let manifest = normalize_default_manifest_for_json(&manifest)?;
    let json = serde_json::to_string(&manifest)
        .map_err(|error| manifest_error(format!("Cannot serialize default manifest: {error}")))?;
    Ok(CompileDefaultPresetResult { manifest, json })
}
