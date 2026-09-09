use super::{HashSet, ManifestProjection, split_top_level};

pub(crate) fn collect_stylesheet_variable_names(
    tokens: &[mastercss_lexer::CssSyntaxToken<'_>],
) -> Vec<String> {
    use mastercss_lexer::CssSyntaxKind as Kind;
    let mut names = Vec::new();
    let mut index = 0;
    while index < tokens.len() {
        let token = &tokens[index];
        let end = token.close.unwrap_or(tokens.len());
        if matches!(&token.kind, Kind::Function(name) if name.eq_ignore_ascii_case("url")) {
            // Unquoted URL content is not a nested CSS component-value stream.
            index = (end + 1).min(tokens.len());
            continue;
        }
        if matches!(&token.kind, Kind::Function(name) if name.eq_ignore_ascii_case("var"))
            && let Some(Kind::Ident(name)) = tokens.get(index + 1).map(|token| &token.kind)
            && let Some(name) = name.strip_prefix("--").filter(|name| !name.is_empty())
            && (index + 2 == end
                || tokens
                    .get(index + 2)
                    .is_some_and(|token| token.kind == Kind::Delim(',')))
            && !names.iter().any(|existing| existing == name)
        {
            names.push(name.to_owned());
        }
        // Visit nested fallback functions too; strings/comments stay opaque.
        index += 1;
    }
    names
}

pub(crate) fn collect_stylesheet_animation_names(
    declarations: &[super::stylesheet_animation::StylesheetAnimationValue],
    manifest: &ManifestProjection,
) -> Vec<String> {
    let mut names = Vec::new();
    for declaration in declarations {
        for name in super::stylesheet_animation_value::animation_value_names(
            &declaration.value,
            declaration.name_only,
            manifest,
        ) {
            if manifest.animations.contains_key(&name) && !names.contains(&name) {
                names.push(name);
            }
        }
    }
    names
}

pub(crate) fn collect_animation_names(
    declarations: &str,
    variable_names: &[String],
    manifest: &ManifestProjection,
) -> Vec<String> {
    let mut sources = split_top_level(declarations, ';')
        .into_iter()
        .filter_map(|declaration| {
            let (property, value) = declaration.split_once(':')?;
            matches!(property, "animation" | "animation-name").then(|| value.to_owned())
        })
        .collect::<Vec<_>>();
    if sources.is_empty() {
        return Vec::new();
    }
    let mut visited = HashSet::new();
    let mut pending = variable_names.to_vec();
    while let Some(name) = pending.pop() {
        if !visited.insert(name.clone()) {
            continue;
        }
        let Some(variable) = manifest.compiled_variables.get(&name) else {
            continue;
        };
        if let Some(value) = &variable.value {
            sources.push(value.clone());
        }
        sources.extend(variable.modes.iter().map(|mode| mode.value.clone()));
        pending.extend(variable.dependencies.iter().cloned());
    }
    manifest
        .animations
        .keys()
        .filter(|name| {
            sources
                .iter()
                .any(|source| contains_css_identifier(source, name))
        })
        .cloned()
        .collect()
}

pub(crate) fn contains_css_identifier(source: &str, name: &str) -> bool {
    source.match_indices(name).any(|(index, _)| {
        let before = source[..index].chars().next_back();
        let after = source[index + name.len()..].chars().next();
        before.is_none_or(|character| !is_css_identifier_character(character))
            && after.is_none_or(|character| !is_css_identifier_character(character))
    })
}

pub(crate) fn is_css_identifier_character(character: char) -> bool {
    character.is_ascii_alphanumeric() || matches!(character, '-' | '_')
}
