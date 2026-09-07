use super::{EngineSettings, normalize_dynamic_value, split_top_level};

pub(crate) fn is_native_shorthand_property(property: &str) -> bool {
    matches!(
        property,
        "all"
            | "animation"
            | "animation-range"
            | "background"
            | "background-position"
            | "background-repeat"
            | "border"
            | "border-block"
            | "border-block-color"
            | "border-block-end"
            | "border-block-start"
            | "border-block-style"
            | "border-block-width"
            | "border-bottom"
            | "border-color"
            | "border-image"
            | "border-inline"
            | "border-inline-color"
            | "border-inline-end"
            | "border-inline-start"
            | "border-inline-style"
            | "border-inline-width"
            | "border-left"
            | "border-radius"
            | "border-right"
            | "border-style"
            | "border-top"
            | "border-width"
            | "column-rule"
            | "columns"
            | "contain-intrinsic-size"
            | "container"
            | "flex"
            | "flex-flow"
            | "font"
            | "font-synthesis"
            | "font-variant"
            | "gap"
            | "grid"
            | "grid-area"
            | "grid-column"
            | "grid-row"
            | "grid-template"
            | "inset"
            | "inset-block"
            | "inset-inline"
            | "line-clamp"
            | "list-style"
            | "margin"
            | "margin-block"
            | "margin-inline"
            | "mask"
            | "mask-border"
            | "mask-position"
            | "mask-repeat"
            | "offset"
            | "outline"
            | "overflow"
            | "overscroll-behavior"
            | "padding"
            | "padding-block"
            | "padding-inline"
            | "place-content"
            | "place-items"
            | "place-self"
            | "scroll-margin"
            | "scroll-margin-block"
            | "scroll-margin-inline"
            | "scroll-padding"
            | "scroll-padding-block"
            | "scroll-padding-inline"
            | "scroll-timeline"
            | "text-decoration"
            | "text-emphasis"
            | "text-wrap"
            | "transition"
            | "view-timeline"
            | "white-space"
    )
}

pub(crate) fn is_valid_native_property(property: &str) -> bool {
    let mut characters = property.chars();
    if let Some(property) = property.strip_prefix("--") {
        return !property.is_empty()
            && property.chars().all(|character| {
                character.is_ascii_alphanumeric() || matches!(character, '-' | '_')
            });
    }
    let first = characters.next();
    if first == Some('-') {
        return characters
            .next()
            .is_some_and(|character| character.is_ascii_alphabetic() || character == '_')
            && characters.all(|character| {
                character.is_ascii_alphanumeric() || matches!(character, '-' | '_')
            });
    }
    first.is_some_and(|character| character.is_ascii_alphabetic() || character == '_')
        && characters
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
}

pub(crate) fn normalize_unmanaged_value(value: &str, settings: &EngineSettings) -> String {
    let mut output = String::with_capacity(value.len());
    let mut token = String::new();
    let mut quote = None;
    let mut escaped = false;
    let flush = |token: &mut String, output: &mut String| {
        if token.is_empty() {
            return;
        }
        output.push_str(&normalize_dynamic_value(token, settings));
        token.clear();
    };
    for character in value.chars() {
        if escaped {
            if quote.is_some() {
                output.push(character);
            } else {
                token.push(character);
            }
            escaped = false;
            continue;
        }
        if character == '\\' {
            if quote.is_some() {
                output.push(character);
            } else {
                token.push(character);
            }
            escaped = true;
            continue;
        }
        if let Some(current_quote) = quote {
            output.push(character);
            if character == current_quote {
                quote = None;
            }
            continue;
        }
        if matches!(character, '\'' | '"') {
            flush(&mut token, &mut output);
            quote = Some(character);
            output.push(character);
        } else if character == '|' {
            flush(&mut token, &mut output);
            output.push(' ');
        } else if character.is_ascii_whitespace() || matches!(character, '(' | ')' | ',' | '/') {
            flush(&mut token, &mut output);
            output.push(character);
        } else {
            token.push(character);
        }
    }
    flush(&mut token, &mut output);
    output
}

pub(crate) fn normalize_css_math_functions(source: &str, settings: &EngineSettings) -> String {
    let mut output = String::with_capacity(source.len());
    let mut index = 0;
    while index < source.len() {
        let Some(character) = source[index..].chars().next() else {
            break;
        };
        if character.is_ascii_alphabetic() {
            let name_end = source[index..]
                .find(|character: char| !character.is_ascii_alphanumeric() && character != '-')
                .map(|offset| index + offset)
                .unwrap_or(source.len());
            let name = &source[index..name_end];
            if matches!(name, "calc" | "clamp" | "min" | "max")
                && source[name_end..].starts_with('(')
                && let Some(close) = find_matching_parenthesis(source, name_end)
            {
                let inner = normalize_css_math_functions(&source[name_end + 1..close], settings);
                let inner = match name {
                    "calc" => normalize_math_expression(&inner, settings),
                    "clamp" => split_top_level(&inner, ',')
                        .into_iter()
                        .map(|argument| {
                            let argument = argument.trim();
                            if has_top_level_binary_math_operator(argument)
                                && !argument.starts_with("calc(")
                            {
                                format!("calc({})", normalize_math_expression(argument, settings))
                            } else {
                                argument.to_owned()
                            }
                        })
                        .collect::<Vec<_>>()
                        .join(", "),
                    _ => inner,
                };
                output.push_str(name);
                output.push('(');
                output.push_str(&inner);
                output.push(')');
                index = close + 1;
                continue;
            }
        }
        output.push(character);
        index += character.len_utf8();
    }
    output
}

pub(crate) fn find_matching_parenthesis(source: &str, open: usize) -> Option<usize> {
    let mut depth = 0_u32;
    let mut quote = None;
    let mut escaped = false;
    for (offset, character) in source[open..].char_indices() {
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
        } else if character == '(' {
            depth += 1;
        } else if character == ')' {
            depth -= 1;
            if depth == 0 {
                return Some(open + offset);
            }
        }
    }
    None
}

pub(crate) fn normalize_math_expression(source: &str, settings: &EngineSettings) -> String {
    let characters = source.chars().collect::<Vec<_>>();
    let mut output = String::with_capacity(source.len() + 8);
    let mut index = 0;
    while index < characters.len() {
        if characters[index..].starts_with(&['v', 'a', 'r', '('])
            || characters[index..].starts_with(&['e', 'n', 'v', '('])
        {
            let mut cursor = index;
            let mut depth = 0_u32;
            let mut quote = None;
            let mut escaped = false;
            while cursor < characters.len() {
                let current = characters[cursor];
                output.push(current);
                cursor += 1;
                if escaped {
                    escaped = false;
                    continue;
                }
                if current == '\\' {
                    escaped = true;
                    continue;
                }
                if let Some(current_quote) = quote {
                    if current == current_quote {
                        quote = None;
                    }
                    continue;
                }
                if matches!(current, '\'' | '"') {
                    quote = Some(current);
                } else if current == '(' {
                    depth += 1;
                } else if current == ')' {
                    depth = depth.saturating_sub(1);
                    if depth == 0 {
                        break;
                    }
                }
            }
            index = cursor;
            continue;
        }
        let character = characters[index];
        let previous = characters[..index]
            .iter()
            .rev()
            .find(|character| !character.is_ascii_whitespace())
            .copied();
        let next = characters[index + 1..]
            .iter()
            .find(|character| !character.is_ascii_whitespace())
            .copied();
        let binary = match character {
            '*' | '/' => true,
            '+' | '-' => is_binary_plus_minus(character, previous, next),
            _ => false,
        };
        if binary {
            while output.ends_with(' ') {
                output.pop();
            }
            output.push(' ');
            output.push(character);
            output.push(' ');
            index += 1;
            while index < characters.len() && characters[index].is_ascii_whitespace() {
                index += 1;
            }
            continue;
        }
        output.push(character);
        index += 1;
    }
    normalize_unmanaged_value(&normalize_leading_decimal_sequences(&output), settings)
}

pub(crate) fn normalize_leading_decimal_sequences(source: &str) -> String {
    let characters = source.chars().collect::<Vec<_>>();
    let mut output = String::with_capacity(source.len() + 4);
    for (index, character) in characters.iter().copied().enumerate() {
        if character == '.'
            && characters
                .get(index + 1)
                .is_some_and(|next| next.is_ascii_digit())
            && characters
                .get(index.wrapping_sub(1))
                .is_none_or(|previous| !previous.is_ascii_digit())
        {
            output.push('0');
        }
        output.push(character);
    }
    output
}

pub(crate) fn is_binary_plus_minus(
    operator: char,
    previous: Option<char>,
    next: Option<char>,
) -> bool {
    let (Some(previous), Some(next)) = (previous, next) else {
        return false;
    };
    if matches!(previous, '(' | ',' | '+' | '-' | '*' | '/') || matches!(next, '+' | '-') {
        return false;
    }
    operator == '+' || !(previous.is_ascii_alphabetic() && next.is_ascii_alphabetic())
}

pub(crate) fn has_top_level_binary_math_operator(source: &str) -> bool {
    let characters = source.chars().collect::<Vec<_>>();
    let mut depth = 0_u32;
    for (index, character) in characters.iter().copied().enumerate() {
        if character == '(' {
            depth += 1;
        } else if character == ')' {
            depth = depth.saturating_sub(1);
        } else if depth == 0
            && (matches!(character, '*' | '/')
                || matches!(character, '+' | '-')
                    && is_binary_plus_minus(
                        character,
                        characters[..index]
                            .iter()
                            .rev()
                            .find(|character| !character.is_ascii_whitespace())
                            .copied(),
                        characters[index + 1..]
                            .iter()
                            .find(|character| !character.is_ascii_whitespace())
                            .copied(),
                    ))
        {
            return true;
        }
    }
    false
}
