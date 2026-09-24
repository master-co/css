use super::resolution::directive_error;
use super::{
    CompilerError, CssDirectiveManifestInput, CssDirectiveSourceReference,
    CssDirectiveStyleDefinition, CssOutputMapping, HashMap, HashSet, Map, MergedStyleDefinition,
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
    rule.insert("declarations".into(), Value::Object(style.declarations));
    if style.selector != "&" {
        rule.insert("selector".into(), Value::String(style.selector));
    }
    if !style.conditions.is_empty() {
        rule.insert(
            "conditions".into(),
            Value::Array(style.conditions.into_iter().map(Value::String).collect()),
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
    for definition in definitions {
        let (name, layer) = match definition {
            CssDirectiveStyleDefinition::Native { name, layer, .. }
            | CssDirectiveStyleDefinition::Compose { name, layer, .. } => {
                let Some(name) = name else { continue };
                (name.clone(), layer.unwrap_or(UtilityLayerName::Components))
            }
        };
        if let Some((_, definitions)) =
            groups
                .iter_mut()
                .find(|((current_name, current_layer), _)| {
                    *current_name == name && *current_layer == layer
                })
        {
            definitions.push(definition.clone());
        } else {
            groups.push(((name, layer), vec![definition.clone()]));
        }
    }
    groups
}

pub(super) fn managed_dependencies(
    groups: &[((String, UtilityLayerName), Vec<CssDirectiveStyleDefinition>)],
) -> Vec<Vec<usize>> {
    let mut keys_by_name: HashMap<&str, Vec<usize>> = HashMap::new();
    for (index, ((name, _), _)) in groups.iter().enumerate() {
        keys_by_name.entry(name).or_default().push(index);
    }
    let mut names = keys_by_name.keys().copied().collect::<Vec<_>>();
    names.sort_by_key(|name| std::cmp::Reverse(name.len()));
    let mut dependencies = vec![Vec::new(); groups.len()];
    for (index, (_, definitions)) in groups.iter().enumerate() {
        for definition in definitions {
            let CssDirectiveStyleDefinition::Compose { class_name, .. } = definition else {
                continue;
            };
            let dependency_name = names.iter().find(|name| {
                class_name.as_str() == **name
                    || class_name
                        .strip_prefix(**name)
                        .and_then(|rest| rest.chars().next())
                        .is_some_and(|next| matches!(next, ':' | '@' | '!'))
            });
            if let Some(dependency_name) = dependency_name {
                for dependency in &keys_by_name[*dependency_name] {
                    if !dependencies[index].contains(dependency) {
                        dependencies[index].push(*dependency);
                    }
                }
            }
        }
    }
    dependencies
}

pub(super) fn managed_dependency_order(
    groups: &[((String, UtilityLayerName), Vec<CssDirectiveStyleDefinition>)],
    dependencies: &[Vec<usize>],
) -> Result<Vec<usize>, CompilerError> {
    fn visit(
        index: usize,
        groups: &[((String, UtilityLayerName), Vec<CssDirectiveStyleDefinition>)],
        dependencies: &[Vec<usize>],
        seen: &mut HashSet<usize>,
        visiting: &mut Vec<usize>,
        output: &mut Vec<usize>,
    ) -> Result<(), CompilerError> {
        if seen.contains(&index) {
            return Ok(());
        }
        if let Some(start) = visiting.iter().position(|current| *current == index) {
            let mut cycle = visiting[start..]
                .iter()
                .map(|current| groups[*current].0.0.as_str())
                .collect::<Vec<_>>();
            cycle.push(groups[index].0.0.as_str());
            return Err(directive_error(format!(
                "Circular @compose dependency detected: {}",
                cycle.join(" -> ")
            )));
        }
        visiting.push(index);
        for dependency in &dependencies[index] {
            visit(*dependency, groups, dependencies, seen, visiting, output)?;
        }
        visiting.pop();
        seen.insert(index);
        output.push(index);
        Ok(())
    }
    let mut seen = HashSet::new();
    let mut visiting = Vec::new();
    let mut output = Vec::new();
    for index in 0..groups.len() {
        visit(
            index,
            groups,
            dependencies,
            &mut seen,
            &mut visiting,
            &mut output,
        )?;
    }
    Ok(output)
}

pub(super) fn managed_refresh_count(
    order: &[usize],
    dependencies: &[Vec<usize>],
    has_native_definitions: bool,
) -> u64 {
    let mut count = 0;
    let mut unrefreshed = HashSet::new();
    for index in order {
        if dependencies[*index]
            .iter()
            .any(|dependency| unrefreshed.contains(dependency))
        {
            count += 1;
            unrefreshed.clear();
        }
        unrefreshed.insert(*index);
    }
    if has_native_definitions && !unrefreshed.is_empty() {
        count += 1;
    }
    count
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
        for (index, (property, value)) in definition.declarations.into_iter().enumerate() {
            if index > 0 {
                css.push(';');
                offset += 1;
            }
            let declaration = format!("{property}:{}", value.as_str().unwrap_or_default());
            let end = offset + declaration.encode_utf16().count() as u32;
            anchor(
                &mut mappings,
                offset,
                end,
                definition.declaration_sources.get(&property),
            );
            css.push_str(&declaration);
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
