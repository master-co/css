use super::*;

pub(crate) fn replace_first_compose_class(
    class_names: &mut [String],
    source: &str,
    replacement: &str,
) {
    if let Some(class_name) = class_names
        .iter_mut()
        .find(|class_name| *class_name == source)
    {
        *class_name = replacement.to_owned();
    }
}

pub(crate) fn remove_first_compose_class(class_names: &mut Vec<String>, source: &str) {
    if let Some(index) = class_names
        .iter()
        .position(|class_name| class_name == source)
    {
        class_names.remove(index);
    }
}

pub(crate) fn replace_compose_class_group(
    class_names: &mut Vec<String>,
    sources: &[String],
    replacement: &str,
) {
    let Some((first, remaining)) = sources.split_first() else {
        return;
    };
    replace_first_compose_class(class_names, first, replacement);
    for source in remaining {
        remove_first_compose_class(class_names, source);
    }
}

pub(crate) fn is_safe_compose_variant_token(token: &str) -> bool {
    if token.is_empty() || (!token.starts_with(':') && !token.starts_with('@')) {
        return false;
    }
    token
        .split('@')
        .skip(1)
        .all(|segment| !segment.is_empty() && !segment.contains(':'))
}

pub(crate) fn compose_variant_keyword(condition: &str) -> String {
    let token = condition.strip_prefix('@').unwrap_or(condition);
    if matches!(token, "dark" | "light") {
        format!("@{token}")
    } else {
        format!("@variant {token}")
    }
}

pub(crate) fn compose_declaration_text(declaration: &ComposeNativeDeclaration) -> String {
    format!(
        "{}: {}{};",
        declaration.property,
        declaration.value,
        if declaration.important {
            " !important"
        } else {
            ""
        }
    )
}

pub(crate) fn compose_block_text(header: &str, body: &str, indent: &str) -> String {
    if !body.contains('\n') {
        return format!("{header} {{ {body} }}");
    }
    format!(
        "{header} {{\n{}\n{indent}}}",
        body.lines()
            .map(|line| format!("{indent}    {line}"))
            .collect::<Vec<_>>()
            .join("\n")
    )
}

pub(crate) fn compose_variant_condition_block_text(
    condition: &str,
    bucket: &ComposeBucket,
    indent: &str,
) -> String {
    compose_block_text(
        &compose_variant_keyword(condition),
        &serialize_compose_bucket(bucket, &format!("{indent}    ")),
        indent,
    )
}

pub(crate) fn compose_variant_block_text(
    token: &str,
    bucket: &ComposeBucket,
    indent: &str,
) -> String {
    let parts = split_top_level(token, '@');
    let selector = parts.first().copied().unwrap_or_default();
    let condition = parts.iter().skip(1).copied().collect::<Vec<_>>().join("@");
    if !selector.is_empty() {
        let selector_header = if selector.starts_with('&') {
            selector.to_owned()
        } else {
            format!("&{selector}")
        };
        let body = if condition.is_empty() {
            serialize_compose_bucket(bucket, &format!("{indent}    "))
        } else {
            compose_variant_condition_block_text(&condition, bucket, &format!("{indent}    "))
        };
        compose_block_text(&selector_header, &body, indent)
    } else {
        compose_variant_condition_block_text(
            if condition.is_empty() {
                token
            } else {
                &condition
            },
            bucket,
            indent,
        )
    }
}

pub(crate) fn serialize_compose_bucket(bucket: &ComposeBucket, indent: &str) -> String {
    let mut lines = Vec::new();
    if !bucket.classes.is_empty() {
        lines.push(format!("@compose {};", bucket.classes.join(" ")));
    }
    lines.extend(bucket.declarations.iter().map(compose_declaration_text));
    lines.extend(
        bucket
            .variants
            .iter()
            .map(|(token, bucket)| compose_variant_block_text(token, bucket, indent)),
    );
    lines.join("\n")
}

pub(crate) fn has_duplicate_compose_declaration_properties(bucket: &ComposeBucket) -> bool {
    let mut properties = HashSet::new();
    if bucket
        .declarations
        .iter()
        .any(|declaration| !properties.insert(&declaration.property))
    {
        return true;
    }
    bucket
        .variants
        .iter()
        .any(|(_, bucket)| has_duplicate_compose_declaration_properties(bucket))
}

pub(crate) fn process_compose_leaf(
    bucket: &mut ComposeBucket,
    class_name: &str,
    declaration: Option<ComposeNativeDeclaration>,
    report_native_declaration: bool,
    suggestions: &mut Vec<CanonicalComposeSuggestionIr>,
) -> bool {
    let Some(declaration) = declaration else {
        bucket.classes.push(class_name.to_owned());
        return false;
    };
    if report_native_declaration {
        let recommended = compose_declaration_text(&declaration)
            .strip_suffix(';')
            .unwrap_or_default()
            .to_owned();
        suggestions.push(CanonicalComposeSuggestionIr {
            actual: class_name.to_owned(),
            recommended,
            class_names: vec![class_name.to_owned()],
            kind: CanonicalComposeSuggestionKind::NativeDeclaration,
        });
    }
    bucket.declarations.push(declaration);
    true
}

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

pub(crate) fn manifest_utility_property_signatures(
    utility: &serde_json::Map<String, Value>,
) -> Vec<String> {
    let Some(emit) = utility.get("emit").and_then(Value::as_object) else {
        return Vec::new();
    };
    let mut signatures = Vec::new();
    match emit.get("type").and_then(Value::as_str) {
        Some("static") => {
            for rule in emit
                .get("rules")
                .and_then(Value::as_array)
                .into_iter()
                .flatten()
            {
                if let Some(declarations) = rule.get("declarations").and_then(Value::as_object) {
                    let mut properties = declarations.keys().cloned().collect::<Vec<_>>();
                    properties.sort();
                    let signature = properties.join("\0");
                    if !signature.is_empty() && !signatures.contains(&signature) {
                        signatures.push(signature);
                    }
                }
            }
        }
        Some("property") => {
            if let Some(property) = emit.get("property").and_then(Value::as_str) {
                signatures.push(property.to_owned());
            }
        }
        Some("template") => {
            if let Some(declarations) = emit.get("declarations").and_then(Value::as_object) {
                let mut properties = declarations.keys().cloned().collect::<Vec<_>>();
                properties.sort();
                let signature = properties.join("\0");
                if !signature.is_empty() {
                    signatures.push(signature);
                }
            }
        }
        _ => {}
    }
    signatures
}
