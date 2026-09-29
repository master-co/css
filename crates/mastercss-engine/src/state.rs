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
        let Some(template) = selector_token_to_template(&selector_token, manifest) else {
            return Vec::new();
        };
        if !mastercss_lexer::valid_selector_structure(&template) {
            return Vec::new();
        }
        for branch in &mut branches {
            branch.key.push_str(&selector_token);
            branch.selector_template = Some(template.clone());
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
    if selector_token.is_empty() || !valid_class_selector(selector_token) {
        return None;
    }
    let selector = replace_selector_underscores(selector_token);
    Some(suffix_to_template(&selector))
}

/// Master selector suffixes accept native CSS, excluding retired class syntax.
/// Inspect tokens so strings, escaped punctuation and attribute contents stay literal.
pub(crate) fn valid_class_selector(selector: &str) -> bool {
    removed_selector(selector).is_none()
}

/// Only active pseudo-class tokens are retired; literals and native pseudo-elements are opaque.
pub(crate) fn removed_selector(selector: &str) -> Option<(&'static str, &'static str)> {
    use mastercss_lexer::{CssSyntaxKind as Kind, tokenize_css_syntax};
    let tokens = tokenize_css_syntax(selector);
    let mut index = 0;
    while let Some(token) = tokens.get(index) {
        if matches!(token.kind, Kind::Delim('[')) {
            index = token.close.map_or(tokens.len(), |close| close + 1);
            continue;
        }
        if matches!(token.kind, Kind::Delim(':'))
            && (index == 0 || !matches!(tokens[index - 1].kind, Kind::Delim(':')))
            && let Some(next) = tokens.get(index + 1)
            && token.bytes.end == next.bytes.start
        {
            let name = match &next.kind {
                Kind::Ident(name) => name.as_ref(),
                Kind::Function(name) if name.eq_ignore_ascii_case("of") => "of",
                _ => "",
            };
            for (old, new) in [
                ("first", ":first-child"),
                ("last", ":last-child"),
                ("even", ":nth-child(2n)"),
                ("odd", ":nth-child(odd)"),
                ("only", ":only-child"),
                ("rtl", ":dir(rtl)"),
                ("ltr", ":dir(ltr)"),
                ("of", ":nth-child(...)"),
            ] {
                if name.eq_ignore_ascii_case(old) {
                    return Some((old, new));
                }
            }
        }
        index += 1;
    }
    None
}

pub(crate) fn resolve_style_selector_aliases(
    selector: &str,
    _manifest: &ManifestProjection,
) -> String {
    selector.to_owned()
}

pub(crate) fn replace_selector_underscores(source: &str) -> String {
    use mastercss_lexer::{CssSyntaxKind as Kind, tokenize_css_syntax};
    let tokens = tokenize_css_syntax(source);
    let mut protected = Vec::new();
    let mut index = 0;
    while let Some(token) = tokens.get(index) {
        if matches!(token.kind, Kind::Delim('['))
            && let Some(close) = token.close
        {
            protected.push(token.bytes.start..tokens[close].bytes.end);
            index = close + 1;
            continue;
        }
        if let Kind::Function(name) = &token.kind
            && let Some(close) = token.close
        {
            // Only selector-list arguments contain descendant combinators.
            // Other native function arguments (lang, dir, state, future syntax)
            // keep identifier underscores as authored.
            if ![
                "is",
                "where",
                "not",
                "has",
                "host",
                "host-context",
                "slotted",
            ]
            .iter()
            .any(|candidate| name.eq_ignore_ascii_case(candidate))
            {
                let start = if ["nth-child", "nth-last-child"]
                    .iter()
                    .any(|candidate| name.eq_ignore_ascii_case(candidate))
                {
                    tokens[index + 1..close].iter().find(|token| matches!(&token.kind, Kind::Ident(name) if name.eq_ignore_ascii_case("of")))
                        .map_or(tokens[close].bytes.start, |token| token.bytes.start)
                } else {
                    tokens[close].bytes.start
                };
                if start > token.bytes.end {
                    protected.push(token.bytes.end..start);
                }
                if start == tokens[close].bytes.start {
                    index = close + 1;
                    continue;
                }
            }
        }
        if matches!(token.kind, Kind::String(_)) {
            protected.push(token.bytes.clone());
        }
        index += 1;
    }
    let mut output = String::with_capacity(source.len());
    let mut cursor = 0;
    while cursor < source.len() {
        if let Some(range) = protected.iter().find(|range| range.start == cursor) {
            output.push_str(&source[range.clone()]);
            cursor = range.end;
            continue;
        }
        if source[cursor..].starts_with("/*") {
            let end = source[cursor + 2..]
                .find("*/")
                .map_or(source.len(), |n| cursor + 4 + n);
            output.push_str(&source[cursor..end]);
            cursor = end;
            continue;
        }
        let ch = source[cursor..].chars().next().unwrap();
        if ch == '\\' {
            let start = cursor;
            cursor += 1;
            let mut digits = 0;
            while digits < 6
                && source
                    .as_bytes()
                    .get(cursor)
                    .is_some_and(u8::is_ascii_hexdigit)
            {
                digits += 1;
                cursor += 1;
            }
            if digits == 0 {
                cursor += source[cursor..].chars().next().map_or(0, char::len_utf8);
            } else if source
                .as_bytes()
                .get(cursor)
                .is_some_and(u8::is_ascii_whitespace)
            {
                cursor += 1;
            }
            output.push_str(&source[start..cursor]);
            continue;
        }
        output.push(
            if ch == '_'
                && source.as_bytes().get(cursor.wrapping_sub(1)) != Some(&b'_')
                && source.as_bytes().get(cursor + 1) != Some(&b'_')
                && tokens
                    .iter()
                    .rev()
                    .find(|token| token.bytes.start < cursor)
                    .and_then(|token| {
                        source[token.bytes.start..token.bytes.end.min(cursor)]
                            .chars()
                            .next_back()
                    })
                    .is_none_or(|previous| {
                        !matches!(
                            previous,
                            '(' | ',' | '.' | ':' | '#' | '>' | '+' | '~' | '|'
                        )
                    })
                && tokens
                    .iter()
                    .find(|token| token.bytes.end > cursor + 1)
                    .and_then(|token| {
                        source[token.bytes.start.max(cursor + 1)..token.bytes.end]
                            .chars()
                            .next()
                    })
                    .is_some_and(|next| !matches!(next, ')' | ',' | '>' | '+' | '~' | '|'))
            {
                ' '
            } else {
                ch
            },
        );
        cursor += ch.len_utf8();
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
