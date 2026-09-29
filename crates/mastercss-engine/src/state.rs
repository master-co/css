use super::{
    ManifestProjection, StateBranch, add_condition_wrapper, render_condition_token,
    resolve_layer_condition,
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
        let template = selector_token_to_template(&selector_token, manifest);
        if template
            .as_deref()
            .is_some_and(|selector| !mastercss_lexer::valid_selector_structure(selector))
        {
            return Vec::new();
        }
        for branch in &mut branches {
            branch.key.push_str(&selector_token);
            branch.selector_template = template.clone();
        }
    }

    for condition_token in condition_tokens {
        let media = if let Some(query) = manifest.custom_media.get(&format!("--{condition_token}"))
        {
            Some(Ok(query.clone()))
        } else {
            mastercss_lexer::parse_native_query(&condition_token)
                .filter(|query| query.kind == "media" && query.prelude.contains("--"))
                .map(|query| {
                    crate::parse_custom_media_query(&query.prelude, &mut |name| {
                        manifest
                            .custom_media
                            .get(name)
                            .cloned()
                            .ok_or_else(|| format!("Undefined custom media {name}"))
                    })
                })
        };
        if let Some(media) = media {
            let Ok(media) = media else { return Vec::new() };
            let Ok(paths) = crate::custom_media_branches(&media) else {
                return Vec::new();
            };
            branches = branches
                .into_iter()
                .flat_map(|branch| {
                    paths
                        .iter()
                        .enumerate()
                        .map(|(index, path)| {
                            let mut branch = branch.clone();
                            branch.key.push_str(&format!("@{condition_token}#{index}"));
                            for query in path {
                                branch
                                    .condition_wrappers
                                    .push(("media".into(), format!("@media {query}")));
                            }
                            branch
                        })
                        .collect::<Vec<_>>()
                })
                .collect();
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

        if let Some((id, wrapper)) = render_condition_token(&condition_token, manifest) {
            for branch in &mut branches {
                branch.key.push('@');
                branch.key.push_str(&condition_token);
                add_condition_wrapper(&mut branch.condition_wrappers, &id, wrapper.clone());
            }
        } else {
            return Vec::new();
        }
    }
    branches
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

#[cfg(test)]
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
    Some(
        mastercss_lexer::replace_nesting_selector(next, current.unwrap_or("&"))
            .unwrap_or_else(|| next.to_owned()),
    )
}

pub(crate) fn selector_token_to_template(
    selector_token: &str,
    _manifest: &ManifestProjection,
) -> Option<String> {
    if selector_token.is_empty() {
        return None;
    }
    let mut selector = normalize_selector_aliases(selector_token);
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
    let _ = manifest;
    normalize_selector_aliases(selector)
}

fn normalize_selector_aliases(source: &str) -> String {
    rewrite_pseudo_selectors(source, |token| {
        let replacement = match token {
            ":first-letter" => "::first-letter",
            ":first-line" => "::first-line",
            ":before" => "::before",
            ":after" => "::after",
            ":first" => ":first-child",
            ":last" => ":last-child",
            ":even" => ":nth-child(2n)",
            ":odd" => ":nth-child(odd)",
            ":only" => ":only-child",
            ":rtl" => ":dir(rtl)",
            ":ltr" => ":dir(ltr)",
            "::scrollbar-thumb" => "::-webkit-scrollbar-thumb",
            "::scrollbar-track" => "::-webkit-scrollbar-track",
            "::scrollbar" => "::-webkit-scrollbar",
            "::slider-thumb" => "::-webkit-slider-thumb",
            "::slider-runnable-track" => "::-webkit-slider-runnable-track",
            "::resizer" => "::-webkit-resizer",
            _ => return None,
        };
        Some(replacement.to_owned())
    })
}

fn rewrite_pseudo_selectors(source: &str, resolve: impl Fn(&str) -> Option<String>) -> String {
    use mastercss_lexer::{CssSyntaxKind, tokenize_css_syntax};

    let tokens = tokenize_css_syntax(source);
    let mut output = String::with_capacity(source.len());
    let mut copied = 0;
    let mut index = 0;
    while index < tokens.len() {
        let token = &tokens[index];
        if matches!(token.kind, CssSyntaxKind::Delim('[')) {
            index = token.close.map_or(tokens.len(), |close| close + 1);
            continue;
        }
        if !matches!(token.kind, CssSyntaxKind::Delim(':')) {
            index += 1;
            continue;
        }
        let start = token.bytes.start;
        let mut end = token.bytes.end;
        index += 1;
        while let Some(next) = tokens.get(index)
            && next.bytes.start == end
            && matches!(next.kind, CssSyntaxKind::Delim(':'))
        {
            end = next.bytes.end;
            index += 1;
        }
        let Some(name) = tokens.get(index).filter(|name| name.bytes.start == end) else {
            continue;
        };
        end = match name.kind {
            CssSyntaxKind::Ident(_) => name.bytes.end,
            CssSyntaxKind::Function(_) => name.bytes.end - 1,
            _ => continue,
        };
        let full_function = if matches!(name.kind, CssSyntaxKind::Function(_)) {
            name.close.and_then(|close| {
                let end = tokens[close].bytes.end;
                resolve(&source[start..end]).map(|replacement| (close + 1, end, replacement))
            })
        } else {
            None
        };
        let replacement = if let Some((next, function_end, replacement)) = full_function {
            index = next;
            end = function_end;
            replacement
        } else if let Some(replacement) = resolve(&source[start..end]) {
            replacement
        } else {
            continue;
        };
        output.push_str(&source[copied..start]);
        output.push_str(&replacement);
        copied = end;
    }
    output.push_str(&source[copied..]);
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
