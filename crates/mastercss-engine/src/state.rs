use super::{
    ManifestProjection, ManifestSelectorNode, ManifestVariant, StateBranch, add_condition_features,
    add_condition_wrapper, merge_condition_features, parse_raw_condition_wrapper,
    render_condition_token, render_manifest_condition, resolve_layer_condition,
};

pub(crate) fn resolve_state_branches(
    state_token: &str,
    inherited_important: bool,
    manifest: &ManifestProjection,
) -> Vec<StateBranch> {
    let mut state_token = state_token;
    let mut important = inherited_important;
    if let Some(rest) = state_token.strip_prefix('!') {
        important = true;
        state_token = rest;
    }

    let (selector_token, condition_tokens) = split_state_token(state_token);
    let mut branches = vec![StateBranch {
        important,
        ..StateBranch::default()
    }];

    if !selector_token.is_empty() {
        let selector_variant = manifest
            .variants
            .iter()
            .find(|variant| variant.token == selector_token);
        if let Some(variant) = selector_variant {
            branches = expand_variant_branches(branches, variant, manifest);
        } else {
            let template = selector_token_to_template(&selector_token, manifest);
            for branch in &mut branches {
                branch.key.push_str(&selector_token);
                branch.selector_template = template.clone();
            }
        }
    }

    for condition_token in condition_tokens {
        if manifest.settings.modes.contains(&condition_token) {
            for branch in &mut branches {
                branch.key.push('@');
                branch.key.push_str(&condition_token);
                branch.mode = Some(condition_token.clone());
                if manifest.settings.mode_trigger == "media" {
                    add_condition_wrapper(
                        &mut branch.condition_wrappers,
                        "media",
                        format!("@media (prefers-color-scheme:{condition_token})"),
                    );
                }
            }
            continue;
        }

        let variant_token = format!("@{condition_token}");
        if let Some(variant) = manifest
            .variants
            .iter()
            .find(|variant| variant.token == variant_token)
        {
            branches = expand_variant_branches(branches, variant, manifest);
            continue;
        }

        if let Some(layer) = resolve_layer_condition(&condition_token, manifest) {
            branches.retain_mut(|branch| {
                if branch.layer.is_some_and(|current| current != layer) {
                    return false;
                }
                branch.key.push('@');
                branch.key.push_str(&condition_token);
                branch.layer = Some(layer);
                true
            });
            continue;
        }

        if let Some((id, wrapper, features)) = render_condition_token(&condition_token, manifest) {
            for branch in &mut branches {
                branch.key.push('@');
                branch.key.push_str(&condition_token);
                add_condition_wrapper(&mut branch.condition_wrappers, &id, wrapper.clone());
                merge_condition_features(&mut branch.features, &features);
            }
        }
    }
    branches
}

pub(crate) fn apply_forced_mode(
    branches: &mut [StateBranch],
    mode: Option<&str>,
    manifest: &ManifestProjection,
) {
    let Some(mode) = mode else {
        return;
    };
    for branch in branches {
        if branch.mode.is_some() {
            continue;
        }
        branch.mode = Some(mode.to_owned());
        if manifest.settings.mode_trigger == "media" {
            add_condition_wrapper(
                &mut branch.condition_wrappers,
                "media",
                format!("@media (prefers-color-scheme:{mode})"),
            );
        }
    }
}

pub(crate) fn split_state_token(state_token: &str) -> (String, Vec<String>) {
    let mut selector = String::new();
    let mut conditions = Vec::new();
    let mut start = 0;
    let mut depth = 0_u32;
    let mut quote = None;
    let mut escaped = false;
    for (index, character) in state_token.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if character == '\\' {
            escaped = true;
            continue;
        }
        if let Some(current_quote) = quote {
            if character == current_quote {
                quote = None;
            }
            continue;
        }
        if character == '\'' || character == '"' {
            quote = Some(character);
        } else if matches!(character, '(' | '[' | '{') {
            depth += 1;
        } else if matches!(character, ')' | ']' | '}') {
            depth = depth.saturating_sub(1);
        } else if character == '@' && depth == 0 {
            if start == 0 {
                selector = state_token[..index].to_owned();
            } else {
                conditions.push(state_token[start..index].to_owned());
            }
            start = index + character.len_utf8();
        }
    }
    if start == 0 {
        selector = state_token.to_owned();
    } else if start < state_token.len() {
        conditions.push(state_token[start..].to_owned());
    }
    (selector, conditions)
}

pub(crate) fn expand_variant_branches(
    current: Vec<StateBranch>,
    variant: &ManifestVariant,
    manifest: &ManifestProjection,
) -> Vec<StateBranch> {
    current
        .into_iter()
        .flat_map(|base| {
            variant
                .branches
                .iter()
                .enumerate()
                .filter_map(|(index, variant_branch)| {
                    if base.layer.is_some()
                        && variant_branch.layer.is_some()
                        && base.layer != variant_branch.layer
                    {
                        return None;
                    }
                    let mut branch = base.clone();
                    branch.key.push_str(&variant.token);
                    branch.key.push('#');
                    branch.key.push_str(&index.to_string());
                    branch.layer = variant_branch.layer.or(branch.layer);

                    let variant_selector = if let Some(selector) = &variant_branch.selector {
                        Some(selector.clone())
                    } else if !variant_branch.selector_nodes.is_empty() {
                        let suffix = generate_selector_nodes(&variant_branch.selector_nodes);
                        Some(suffix_to_template(&suffix))
                    } else {
                        None
                    };
                    branch.selector_template = compose_selector_templates(
                        branch.selector_template.as_deref(),
                        variant_selector.as_deref(),
                    );

                    if !variant_branch.condition_nodes.is_empty() {
                        for condition in &variant_branch.condition_nodes {
                            let wrapper = render_manifest_condition(condition, None);
                            add_condition_wrapper(
                                &mut branch.condition_wrappers,
                                &condition.id,
                                wrapper,
                            );
                            add_condition_features(&mut branch.features, &condition.nodes, None);
                        }
                    } else {
                        for raw in &variant_branch.conditions {
                            if let Some((id, wrapper)) = parse_raw_condition_wrapper(raw) {
                                add_condition_wrapper(&mut branch.condition_wrappers, &id, wrapper);
                            }
                        }
                    }
                    let _ = manifest;
                    Some(branch)
                })
                .collect::<Vec<_>>()
        })
        .collect()
}

pub(crate) fn compose_selector_templates(
    current: Option<&str>,
    next: Option<&str>,
) -> Option<String> {
    let Some(next) = next else {
        return current.map(str::to_owned);
    };
    if next == "&" {
        return current.map(str::to_owned);
    }
    Some(next.replace('&', current.unwrap_or("&")))
}

pub(crate) fn selector_token_to_template(
    selector_token: &str,
    manifest: &ManifestProjection,
) -> Option<String> {
    if selector_token.is_empty() {
        return None;
    }
    if let Some(nodes) = manifest.selectors.get(selector_token) {
        return Some(suffix_to_template(&generate_selector_nodes(nodes)));
    }
    let mut selector = selector_token.to_owned();
    selector = replace_legacy_pseudo_elements(&selector);
    for (alias, replacement) in [
        (":first", ":first-child"),
        (":last", ":last-child"),
        (":even", ":nth-child(2n)"),
        (":odd", ":nth-child(odd)"),
        (":only", ":only-child"),
        (":rtl", ":dir(rtl)"),
        (":ltr", ":dir(ltr)"),
        ("::scrollbar-thumb", "::-webkit-scrollbar-thumb"),
        ("::scrollbar-track", "::-webkit-scrollbar-track"),
        ("::scrollbar", "::-webkit-scrollbar"),
        ("::slider-thumb", "::-webkit-slider-thumb"),
        ("::slider-runnable-track", "::-webkit-slider-runnable-track"),
        ("::resizer", "::-webkit-resizer"),
    ] {
        selector = replace_selector_alias(&selector, alias, replacement);
    }
    selector = replace_selector_underscores(&selector);
    if let Some((before, context, after)) = split_top_level_of_selector(&selector) {
        let suffix = format!("{before}{after}");
        let separator = if context.chars().next_back().is_some_and(|character| {
            !character.is_whitespace() && !matches!(character, '>' | '+' | '~')
        }) {
            " "
        } else {
            ""
        };
        return Some(format!(
            "{context}{separator}{}",
            suffix_to_template(&suffix)
        ));
    }
    Some(suffix_to_template(&selector))
}

pub(crate) fn split_top_level_of_selector(selector: &str) -> Option<(&str, &str, &str)> {
    let mut depth = 0_u32;
    let mut quote = None;
    let mut escaped = false;
    let mut index = 0;
    while index < selector.len() {
        let character = selector[index..].chars().next()?;
        if escaped {
            escaped = false;
            index += character.len_utf8();
            continue;
        }
        if character == '\\' {
            escaped = true;
            index += character.len_utf8();
            continue;
        }
        if let Some(current_quote) = quote {
            if character == current_quote {
                quote = None;
            }
            index += character.len_utf8();
            continue;
        }
        if character == '\'' || character == '"' {
            quote = Some(character);
            index += character.len_utf8();
            continue;
        }
        if depth == 0 && selector[index..].starts_with(":of(") {
            let body_start = index + ":of(".len();
            let mut body_depth = 1_u32;
            let mut body_quote = None;
            let mut body_escaped = false;
            for (offset, body_character) in selector[body_start..].char_indices() {
                if body_escaped {
                    body_escaped = false;
                    continue;
                }
                if body_character == '\\' {
                    body_escaped = true;
                    continue;
                }
                if let Some(current_quote) = body_quote {
                    if body_character == current_quote {
                        body_quote = None;
                    }
                    continue;
                }
                if body_character == '\'' || body_character == '"' {
                    body_quote = Some(body_character);
                } else if body_character == '(' {
                    body_depth += 1;
                } else if body_character == ')' {
                    body_depth -= 1;
                    if body_depth == 0 {
                        let body_end = body_start + offset;
                        let after_start = body_end + body_character.len_utf8();
                        return Some((
                            &selector[..index],
                            &selector[body_start..body_end],
                            &selector[after_start..],
                        ));
                    }
                }
            }
            return None;
        }
        if matches!(character, '(' | '[' | '{') {
            depth += 1;
        } else if matches!(character, ')' | ']' | '}') {
            depth = depth.saturating_sub(1);
        }
        index += character.len_utf8();
    }
    None
}

pub(crate) fn resolve_style_selector_aliases(
    selector: &str,
    manifest: &ManifestProjection,
) -> String {
    let mut tokens = manifest
        .selectors
        .keys()
        .filter(|token| token.starts_with(':'))
        .cloned()
        .collect::<Vec<_>>();
    tokens.sort_by(|left, right| right.len().cmp(&left.len()).then_with(|| left.cmp(right)));
    let mut output = String::with_capacity(selector.len());
    let mut index = 0;
    let mut quote = None;
    let mut attribute_depth = 0_u32;
    while index < selector.len() {
        let character = selector[index..].chars().next().unwrap_or_default();
        if let Some(current_quote) = quote {
            output.push(character);
            index += character.len_utf8();
            if character == '\\' {
                if let Some(escaped) = selector[index..].chars().next() {
                    output.push(escaped);
                    index += escaped.len_utf8();
                }
            } else if character == current_quote {
                quote = None;
            }
            continue;
        }
        if matches!(character, '\'' | '"') {
            quote = Some(character);
            output.push(character);
            index += character.len_utf8();
            continue;
        }
        if character == '[' {
            attribute_depth += 1;
        } else if character == ']' {
            attribute_depth = attribute_depth.saturating_sub(1);
        }
        if attribute_depth == 0
            && let Some(token) = tokens.iter().find(|token| {
                if !selector[index..].starts_with(token.as_str()) {
                    return false;
                }
                selector[index + token.len()..]
                    .chars()
                    .next()
                    .is_none_or(|next| {
                        next == '(' || (!next.is_ascii_alphanumeric() && !matches!(next, '-' | '_'))
                    })
            })
            && let Some(nodes) = manifest.selectors.get(token)
        {
            output.push_str(&generate_selector_nodes(nodes));
            index += token.len();
            continue;
        }
        output.push(character);
        index += character.len_utf8();
    }
    output = replace_legacy_pseudo_elements(&output);
    for (alias, replacement) in [
        (":first", ":first-child"),
        (":last", ":last-child"),
        (":even", ":nth-child(2n)"),
        (":odd", ":nth-child(odd)"),
        (":only", ":only-child"),
        (":rtl", ":dir(rtl)"),
        (":ltr", ":dir(ltr)"),
        ("::scrollbar-thumb", "::-webkit-scrollbar-thumb"),
        ("::scrollbar-track", "::-webkit-scrollbar-track"),
        ("::scrollbar", "::-webkit-scrollbar"),
        ("::slider-thumb", "::-webkit-slider-thumb"),
        ("::slider-runnable-track", "::-webkit-slider-runnable-track"),
        ("::resizer", "::-webkit-resizer"),
    ] {
        output = replace_selector_alias(&output, alias, replacement);
    }
    output
}

pub(crate) fn replace_legacy_pseudo_elements(source: &str) -> String {
    let mut output = source.to_owned();
    for pseudo_element in ["first-letter", "first-line", "before", "after"] {
        let alias = format!(":{pseudo_element}");
        let replacement = format!("::{pseudo_element}");
        let mut normalized = String::with_capacity(output.len() + 1);
        let mut rest = output.as_str();
        while let Some(index) = rest.find(&alias) {
            normalized.push_str(&rest[..index]);
            let before = rest[..index].chars().next_back();
            let after = &rest[index + alias.len()..];
            if before != Some(':')
                && after.chars().next().is_none_or(|character| {
                    !character.is_ascii_alphanumeric() && character != '-' && character != '_'
                })
            {
                normalized.push_str(&replacement);
            } else {
                normalized.push_str(&alias);
            }
            rest = after;
        }
        normalized.push_str(rest);
        output = normalized;
    }
    output
}

pub(crate) fn replace_selector_alias(source: &str, alias: &str, replacement: &str) -> String {
    let mut output = String::with_capacity(source.len());
    let mut rest = source;
    while let Some(index) = rest.find(alias) {
        output.push_str(&rest[..index]);
        let after = &rest[index + alias.len()..];
        if after.chars().next().is_none_or(|character| {
            !character.is_ascii_alphanumeric() && character != '-' && character != '_'
        }) {
            output.push_str(replacement);
        } else {
            output.push_str(alias);
        }
        rest = after;
    }
    output.push_str(rest);
    output
}

pub(crate) fn replace_selector_underscores(source: &str) -> String {
    let characters: Vec<char> = source.chars().collect();
    let mut output = String::with_capacity(source.len());
    for (index, character) in characters.iter().enumerate() {
        if *character == '_'
            && characters.get(index.wrapping_sub(1)) != Some(&'_')
            && characters.get(index + 1) != Some(&'_')
        {
            output.push(' ');
        } else {
            output.push(*character);
        }
    }
    output
}

pub(crate) fn suffix_to_template(suffix: &str) -> String {
    split_top_level(suffix, ',')
        .into_iter()
        .map(|group| format!("&{group}"))
        .collect::<Vec<_>>()
        .join(",")
}

pub(crate) fn split_top_level(source: &str, delimiter: char) -> Vec<String> {
    let mut result = Vec::new();
    let mut start = 0;
    let mut depth = 0_u32;
    let mut quote = None;
    let mut escaped = false;
    for (index, character) in source.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if character == '\\' {
            escaped = true;
            continue;
        }
        if let Some(current_quote) = quote {
            if character == current_quote {
                quote = None;
            }
            continue;
        }
        if character == '\'' || character == '"' {
            quote = Some(character);
        } else if matches!(character, '(' | '[' | '{') {
            depth += 1;
        } else if matches!(character, ')' | ']' | '}') {
            depth = depth.saturating_sub(1);
        } else if character == delimiter && depth == 0 {
            result.push(source[start..index].to_owned());
            start = index + character.len_utf8();
        }
    }
    result.push(source[start..].to_owned());
    result
}

pub(crate) fn find_group_close(source: &str) -> Option<usize> {
    let mut nested_depth = 0_u32;
    let mut quote = None;
    let mut escaped = false;
    for (index, character) in source.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if character == '\\' {
            escaped = true;
            continue;
        }
        if let Some(current_quote) = quote {
            if character == current_quote {
                quote = None;
            }
            continue;
        }
        if matches!(character, '\'' | '"') {
            quote = Some(character);
        } else if character == '{' {
            nested_depth += 1;
        } else if character == '}' {
            if nested_depth == 0 {
                return Some(index);
            }
            nested_depth -= 1;
        }
    }
    None
}

pub(crate) fn generate_selector_nodes(nodes: &[ManifestSelectorNode]) -> String {
    nodes
        .iter()
        .map(|node| {
            let value = node.value.as_deref().unwrap_or_default();
            if node.node_type.as_deref() == Some("separator") {
                return value.to_owned();
            }
            let prefix = match node.node_type.as_deref() {
                Some("pseudo-class") => ":",
                Some("pseudo-element") => "::",
                Some("class") => ".",
                Some("id") => "#",
                Some("attribute") | Some("combinator") | Some("universal") | None => "",
                Some(_) => "",
            };
            if node.node_type.as_deref() == Some("attribute") {
                return format!("[{value}]");
            }
            let mut output = format!("{prefix}{value}");
            if !node.children.is_empty() {
                let children = generate_selector_nodes(&node.children);
                if value.is_empty() {
                    output.push_str(&children);
                } else {
                    output.push('(');
                    output.push_str(&children);
                    output.push(')');
                }
            }
            output
        })
        .collect()
}
