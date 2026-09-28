use super::resolution::directive_error;
use super::{
    CompilerError, CssDirectiveManifestInput, CssDirectiveSourceReference,
    CssDirectiveStyleDefinition, CssOutputMapping, HashMap, Map, MergedStyleDefinition,
    UtilityLayerName, Value, json,
};

pub(super) fn layer_name(layer: UtilityLayerName) -> &'static str {
    match layer {
        UtilityLayerName::Base => "base",
        UtilityLayerName::Defaults => "defaults",
        UtilityLayerName::Components => "components",
        UtilityLayerName::Utilities => "utilities",
    }
}

pub(super) fn push_static_utility_rule(
    input: &mut CssDirectiveManifestInput,
    name: &str,
    layer: UtilityLayerName,
    style: MergedStyleDefinition,
) -> Result<(), CompilerError> {
    for declarations in crate::declaration_runs(style.declarations.clone()) {
        push_static_utility_run(input, name, layer, &style, declarations)?;
    }
    Ok(())
}

fn push_static_utility_run(
    input: &mut CssDirectiveManifestInput,
    name: &str,
    layer: UtilityLayerName,
    style: &MergedStyleDefinition,
    declarations: Map<String, Value>,
) -> Result<(), CompilerError> {
    let utilities = input.utilities.get_or_insert_default();
    let layer_value = layer_name(layer);
    let index = utilities.iter().position(|utility| {
        utility.get("name").and_then(Value::as_str) == Some(name)
            && utility
                .get("layer")
                .and_then(Value::as_str)
                .unwrap_or("utilities")
                == layer_value
    });
    if index.is_none() {
        utilities.push(json!({ "name": name, "type": "static", "layer": layer_value }));
    }
    let utility_index = index.unwrap_or_else(|| utilities.len() - 1);
    let utility = utilities[utility_index]
        .as_object_mut()
        .ok_or_else(|| directive_error("Managed utility definition must be an object"))?;
    utility.insert("type".into(), Value::String("static".into()));
    utility.insert("layer".into(), Value::String(layer_value.into()));
    let mut rule = Map::new();
    rule.insert("declarations".into(), Value::Object(declarations));
    if style.selector != "&" {
        rule.insert("selector".into(), Value::String(style.selector.clone()));
    }
    if !style.conditions.is_empty() {
        rule.insert(
            "conditions".into(),
            Value::Array(
                style
                    .conditions
                    .iter()
                    .cloned()
                    .map(Value::String)
                    .collect(),
            ),
        );
    }
    if !utility.contains_key("declarations")
        && !utility.contains_key("rules")
        && !rule.contains_key("selector")
        && !rule.contains_key("conditions")
    {
        utility.insert(
            "declarations".into(),
            rule.shift_remove("declarations")
                .expect("declarations exist"),
        );
        return Ok(());
    }
    if let Some(previous) = utility.shift_remove("declarations") {
        utility
            .entry("rules")
            .or_insert_with(|| Value::Array(Vec::new()))
            .as_array_mut()
            .ok_or_else(|| directive_error("Managed utility rules must be an array"))?
            .push(json!({ "declarations": previous }));
    }
    utility
        .entry("rules")
        .or_insert_with(|| Value::Array(Vec::new()))
        .as_array_mut()
        .ok_or_else(|| directive_error("Managed utility rules must be an array"))?
        .push(Value::Object(rule));
    Ok(())
}

pub(super) fn managed_style_groups(
    definitions: &[CssDirectiveStyleDefinition],
) -> Vec<((String, UtilityLayerName), Vec<CssDirectiveStyleDefinition>)> {
    let mut groups: Vec<((String, UtilityLayerName), Vec<CssDirectiveStyleDefinition>)> =
        Vec::new();
    let mut indexes = HashMap::new();
    for definition in definitions {
        let (name, layer) = match definition {
            CssDirectiveStyleDefinition::Native { name, layer, .. } => {
                let Some(name) = name else { continue };
                (name.clone(), layer.unwrap_or(UtilityLayerName::Components))
            }
        };
        let index = *indexes.entry((name.clone(), layer)).or_insert_with(|| {
            let index = groups.len();
            groups.push(((name, layer), Vec::new()));
            index
        });
        groups[index].1.push(definition.clone());
    }
    groups
}

pub(super) fn render_style_definitions(
    definitions: Vec<MergedStyleDefinition>,
) -> (String, Vec<CssOutputMapping>) {
    fn anchor(
        mappings: &mut Vec<CssOutputMapping>,
        start: u32,
        end: u32,
        source: Option<&CssDirectiveSourceReference>,
    ) {
        if let Some(source) = source {
            mappings.push(CssOutputMapping {
                generated_start: start,
                generated_end: Some(end),
                source: source.clone(),
            });
        }
    }
    let mut css = String::new();
    let mut offset = 0u32;
    let mut mappings = Vec::new();
    for definition in definitions {
        let conditions = definition
            .conditions
            .iter()
            .map(|condition| condition.trim())
            .filter(|condition| !condition.is_empty())
            .collect::<Vec<_>>();
        for condition in &conditions {
            css.push_str(condition);
            css.push('{');
            offset += condition.encode_utf16().count() as u32 + 1;
        }
        let selector_end = offset + definition.selector.encode_utf16().count() as u32;
        anchor(
            &mut mappings,
            offset,
            selector_end,
            definition.selector_source.as_ref(),
        );
        css.push_str(&definition.selector);
        css.push('{');
        offset = selector_end + 1;
        for (index, declaration) in definition.declarations.into_iter().enumerate() {
            let property = declaration.property;
            let value = declaration.value;
            if index > 0 {
                css.push(';');
                offset += 1;
            }
            let text = format!("{property}:{}", value.as_str().unwrap_or_default());
            let end = offset + text.encode_utf16().count() as u32;
            anchor(&mut mappings, offset, end, declaration.source.as_ref());
            css.push_str(&text);
            offset = end;
        }
        css.push('}');
        offset += 1;
        for _ in conditions {
            css.push('}');
            offset += 1;
        }
    }
    (css, mappings)
}
