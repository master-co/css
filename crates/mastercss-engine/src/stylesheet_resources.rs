use super::*;

pub(crate) fn skip_stylesheet_quoted(source: &str, start: usize, quote: char) -> usize {
    let mut index = start + quote.len_utf8();
    while index < source.len() {
        let character = source[index..].chars().next().unwrap_or_default();
        index += character.len_utf8();
        if character == '\\' {
            if let Some(escaped) = source[index..].chars().next() {
                index += escaped.len_utf8();
            }
        } else if character == quote {
            break;
        }
    }
    index
}

pub(crate) fn skip_stylesheet_comment(source: &str, start: usize) -> usize {
    source[start + 2..]
        .find("*/")
        .map(|offset| start + 2 + offset + 2)
        .unwrap_or(source.len())
}

pub(crate) fn collect_stylesheet_variable_names(source: &str) -> Vec<String> {
    let mut names = Vec::new();
    let mut index = 0;
    while index < source.len() {
        let character = source[index..].chars().next().unwrap_or_default();
        if matches!(character, '\'' | '"') {
            index = skip_stylesheet_quoted(source, index, character);
            continue;
        }
        if source[index..].starts_with("/*") {
            index = skip_stylesheet_comment(source, index);
            continue;
        }
        let is_variable_function = source
            .get(index..index + 4)
            .is_some_and(|value| value.eq_ignore_ascii_case("var("))
            && source[..index]
                .chars()
                .next_back()
                .is_none_or(|character| !is_css_identifier_character(character));
        if !is_variable_function {
            index += character.len_utf8();
            continue;
        }
        let mut cursor = index + 4;
        while source[cursor..]
            .chars()
            .next()
            .is_some_and(|character| character == ' ')
        {
            cursor += source[cursor..]
                .chars()
                .next()
                .unwrap_or_default()
                .len_utf8();
        }
        if !source[cursor..].starts_with("--") {
            index += 4;
            continue;
        }
        cursor += 2;
        let name_start = cursor;
        while source[cursor..]
            .chars()
            .next()
            .is_some_and(is_css_identifier_character)
        {
            cursor += source[cursor..]
                .chars()
                .next()
                .unwrap_or_default()
                .len_utf8();
        }
        if cursor > name_start {
            let name = &source[name_start..cursor];
            if !names.iter().any(|existing| existing == name) {
                names.push(name.to_owned());
            }
        }
        index = cursor;
    }
    names
}

pub(crate) fn collect_stylesheet_keyframe_names(source: &str) -> Vec<String> {
    let mut names = Vec::new();
    let mut index = 0;
    while let Some(offset) = source[index..].find("@keyframes") {
        index += offset;
        let mut cursor = index + "@keyframes".len();
        let Some(whitespace) = source[cursor..]
            .chars()
            .next()
            .filter(|character| character.is_whitespace())
        else {
            index = cursor;
            continue;
        };
        cursor += whitespace.len_utf8();
        while source[cursor..]
            .chars()
            .next()
            .is_some_and(char::is_whitespace)
        {
            cursor += source[cursor..]
                .chars()
                .next()
                .unwrap_or_default()
                .len_utf8();
        }
        let name_start = cursor;
        if source[cursor..].starts_with('-') {
            cursor += 1;
        }
        let Some(first) = source[cursor..]
            .chars()
            .next()
            .filter(|character| character.is_ascii_alphabetic() || *character == '_')
        else {
            index = cursor;
            continue;
        };
        cursor += first.len_utf8();
        while source[cursor..]
            .chars()
            .next()
            .is_some_and(is_css_identifier_character)
        {
            cursor += source[cursor..]
                .chars()
                .next()
                .unwrap_or_default()
                .len_utf8();
        }
        if cursor > name_start {
            let name = &source[name_start..cursor];
            if !names.iter().any(|existing| existing == name) {
                names.push(name.to_owned());
            }
        }
        index = cursor;
    }
    names
}

pub(crate) fn collect_stylesheet_animation_declarations(source: &str) -> Vec<String> {
    let mut declarations = Vec::new();
    let mut index = 0;
    while let Some(offset) = source[index..].find("animation") {
        index += offset;
        let before = source[..index].chars().next_back();
        if before.is_some_and(|character| character.is_ascii_alphanumeric() || character == '_') {
            index += "animation".len();
            continue;
        }
        let property = if source[index..].starts_with("animation-name") {
            "animation-name"
        } else {
            "animation"
        };
        let mut cursor = index + property.len();
        while source[cursor..]
            .chars()
            .next()
            .is_some_and(char::is_whitespace)
        {
            cursor += source[cursor..]
                .chars()
                .next()
                .unwrap_or_default()
                .len_utf8();
        }
        if !source[cursor..].starts_with(':') {
            index += property.len();
            continue;
        }
        cursor += 1;
        while source[cursor..]
            .chars()
            .next()
            .is_some_and(char::is_whitespace)
        {
            cursor += source[cursor..]
                .chars()
                .next()
                .unwrap_or_default()
                .len_utf8();
        }
        let value_start = cursor;
        while cursor < source.len() {
            let character = source[cursor..].chars().next().unwrap_or_default();
            if matches!(character, ';' | '{' | '}') {
                break;
            }
            cursor += character.len_utf8();
        }
        if cursor > value_start {
            declarations.push(source[value_start..cursor].trim().to_owned());
        }
        index = cursor.max(index + property.len());
    }
    declarations
}

pub(crate) fn collect_stylesheet_animation_names(
    declarations: &[String],
    variable_names: &[String],
    manifest: &ManifestProjection,
) -> Vec<String> {
    let mut sources = declarations.to_vec();
    let mut visited = HashSet::new();
    for variable_name in variable_names {
        collect_variable_animation_sources(variable_name, manifest, &mut visited, &mut sources);
    }
    let known_names = manifest
        .animations
        .keys()
        .map(String::as_str)
        .collect::<HashSet<_>>();
    let mut names = Vec::new();
    for source in sources {
        for token in source.split(|character: char| character.is_whitespace() || character == ',') {
            if known_names.contains(token) && !names.iter().any(|name| name == token) {
                names.push(token.to_owned());
            }
        }
    }
    names
}

pub(crate) fn collect_variable_animation_sources(
    name: &str,
    manifest: &ManifestProjection,
    visited: &mut HashSet<String>,
    sources: &mut Vec<String>,
) {
    if !visited.insert(name.to_owned()) {
        return;
    }
    let Some(variable) = manifest.compiled_variables.get(name) else {
        return;
    };
    if let Some(value) = &variable.value {
        sources.push(value.clone());
    }
    sources.extend(variable.modes.iter().map(|mode| mode.value.clone()));
    for dependency in &variable.dependencies {
        collect_variable_animation_sources(dependency, manifest, visited, sources);
    }
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
