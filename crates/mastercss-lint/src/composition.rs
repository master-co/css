use super::{COMPOSITION_RECIPES, CanonicalGroupEntry, CompositionRecipe, HashMap};

pub(crate) fn matching_composition_recipe(
    left: &CanonicalGroupEntry,
    right: &CanonicalGroupEntry,
) -> Option<CompositionRecipe> {
    COMPOSITION_RECIPES.iter().copied().find(|recipe| {
        (left.property == recipe.properties[0] && right.property == recipe.properties[1])
            || (left.property == recipe.properties[1] && right.property == recipe.properties[0])
    })
}

pub(crate) fn merge_group_declarations(
    left: &CanonicalGroupEntry,
    right: &CanonicalGroupEntry,
) -> Option<Vec<(String, String)>> {
    let mut merged = Vec::new();
    for (property, value) in left.declarations.iter().chain(&right.declarations) {
        if let Some((_, existing)) = merged
            .iter()
            .find(|(existing_property, _)| existing_property == property)
        {
            if existing != value {
                return None;
            }
            continue;
        }
        merged.push((property.clone(), value.clone()));
    }
    Some(merged)
}

pub(crate) fn normalize_composition_declarations(
    declarations: &[(String, String)],
    recipe: CompositionRecipe,
) -> Vec<(String, String)> {
    let mut normalized = Vec::new();
    for (property, value) in declarations {
        if let Some((equivalent, properties)) = recipe.equivalent_property
            && property == equivalent
        {
            normalized.extend(
                properties
                    .into_iter()
                    .map(|property| (property.to_owned(), value.clone())),
            );
        } else {
            normalized.push((property.clone(), value.clone()));
        }
    }
    normalized.sort();
    normalized
}

pub(crate) fn push_index_value(map: &mut HashMap<String, Vec<String>>, key: &str, value: &str) {
    let values = map.entry(key.to_owned()).or_default();
    if !values.iter().any(|existing| existing == value) {
        values.push(value.to_owned());
    }
}
