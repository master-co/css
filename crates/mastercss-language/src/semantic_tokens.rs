use super::*;

pub(crate) fn inspect_class_name_parts(
    class_name: &str,
) -> (String, String, Option<String>, Option<String>) {
    if let Some(Ok(head)) = mastercss_lexer::parse_functional_class(class_name) {
        return (
            class_name[..head.suffix_start].into(),
            class_name[head.suffix_start..].into(),
            Some(head.name),
            Some(class_name[head.arguments_range].into()),
        );
    }
    // Declarations are structural; an incomplete one still names its property and
    // value prefix for editors, without becoming a complete head.
    if let Some(head) = mastercss_lexer::parse_native_declaration(class_name) {
        if let Ok(head) = head {
            return (
                class_name[..head.suffix_start].to_owned(),
                class_name[head.suffix_start..].to_owned(),
                Some(class_name[head.property].to_owned()),
                Some(class_name[head.value].to_owned()),
            );
        }
        let (property, value) = mastercss_lexer::native_declaration_prefix(class_name).map_or(
            (None, None),
            |(property, value)| {
                (
                    Some(class_name[property].to_owned()),
                    value.map(|start| class_name[start..].to_owned()),
                )
            },
        );
        return (class_name.to_owned(), String::new(), property, value);
    }
    let end = find_class_modifier_index(class_name, 0);
    (
        class_name[..end].to_owned(),
        class_name[end..].to_owned(),
        None,
        None,
    )
}

pub(crate) fn find_class_modifier_index(class_name: &str, start: usize) -> usize {
    let mut quote = None;
    let mut depth = 0_u32;
    let mut escaped = false;
    for (index, character) in class_name
        .char_indices()
        .filter(|(index, _)| *index >= start)
    {
        if escaped {
            escaped = false;
            continue;
        }
        if let Some(current_quote) = quote {
            if character == '\\' {
                escaped = true;
            } else if character == current_quote {
                quote = None;
            }
            continue;
        }
        if matches!(character, '"' | '\'') {
            quote = Some(character);
            continue;
        }
        if matches!(character, '(' | '[' | '{') {
            depth += 1;
            continue;
        }
        if matches!(character, ')' | ']' | '}') {
            depth = depth.saturating_sub(1);
            continue;
        }
        if depth == 0
            && matches!(
                character,
                '!' | '*' | '>' | '+' | '~' | ':' | '[' | '@' | '_'
            )
        {
            return index;
        }
    }
    class_name.len()
}

pub(crate) fn push_semantic_token(
    tokens: &mut Vec<SemanticTokenInputIr>,
    start: u32,
    end: u32,
    token_type: &str,
    modifiers: &[&str],
) {
    if end <= start {
        return;
    }
    tokens.push(SemanticTokenInputIr {
        start,
        end,
        token_type: token_type.to_owned(),
        modifiers: modifiers
            .iter()
            .map(|modifier| (*modifier).to_owned())
            .collect(),
    });
}

/// The end of a value word; an encoded `_` space ends it and `\_` stays in it.
pub(crate) fn value_identifier_end(value: &str, start: usize) -> usize {
    let mut end = start;
    while let Some(character) = value[end..].chars().next() {
        if character == '\\' && end > start {
            end += 1;
            end += value[end..].chars().next().map_or(0, char::len_utf8);
        } else if (character.is_alphanumeric() || matches!(character, '_' | '-' | '.'))
            && !mastercss_lexer::is_space_underscore(value, end)
        {
            end += character.len_utf8();
        } else {
            break;
        }
    }
    end
}

/// The end of a `--name`, whose underscores are literal where the name is protected.
fn dashed_name_end(value: &str, start: usize) -> usize {
    let mut end = start;
    for character in value[start..].chars() {
        if character.is_alphanumeric() || matches!(character, '_' | '-') {
            end += character.len_utf8();
        } else {
            break;
        }
    }
    end
}

pub(crate) fn push_value_semantic_tokens(
    tokens: &mut Vec<SemanticTokenInputIr>,
    value: &str,
    offset: u32,
) {
    let mut byte_index = 0;
    while byte_index < value.len() {
        let suffix = &value[byte_index..];
        let character = suffix.chars().next().unwrap_or_default();
        let start = offset + utf16_len(&value[..byte_index]);
        if character.is_whitespace() {
            byte_index += character.len_utf8();
            continue;
        }
        if matches!(character, '\'' | '"') {
            let quote = character;
            let quote_length = quote.len_utf8();
            push_semantic_token(tokens, start, start + 1, "string", &["quoted"]);
            let content_start = byte_index + quote_length;
            let mut content_end = content_start;
            let mut escaped = false;
            for next in value[content_start..].chars() {
                if escaped {
                    escaped = false;
                } else if next == '\\' {
                    escaped = true;
                } else if next == quote {
                    break;
                }
                content_end += next.len_utf8();
            }
            push_semantic_token(
                tokens,
                offset + utf16_len(&value[..content_start]),
                offset + utf16_len(&value[..content_end]),
                "string",
                &["quoted"],
            );
            if content_end < value.len() {
                let close = offset + utf16_len(&value[..content_end]);
                push_semantic_token(tokens, close, close + 1, "string", &["quoted"]);
                byte_index = content_end + quote_length;
            } else {
                byte_index = content_end;
            }
            continue;
        }
        if character == '$' {
            let end = value_identifier_end(value, byte_index + 1);
            push_semantic_token(
                tokens,
                start,
                offset + utf16_len(&value[..end]),
                "variable",
                &[],
            );
            byte_index = end;
            continue;
        }
        // A hex color is one literal, `#` included, even when it starts with a digit.
        if character == '#' {
            let end = value_identifier_end(value, byte_index + 1);
            if end > byte_index + 1 {
                push_semantic_token(
                    tokens,
                    start,
                    offset + utf16_len(&value[..end]),
                    "number",
                    &[],
                );
                byte_index = end;
                continue;
            }
        }
        let starts_number = |text: &str| {
            let mut characters = text.chars();
            match characters.next() {
                Some(first) if first.is_ascii_digit() => true,
                Some('.') => characters.next().is_some_and(|next| next.is_ascii_digit()),
                _ => false,
            }
        };
        // A sign belongs to the number unless it follows an operand, as in `100%-2rem`.
        let signed = matches!(character, '-' | '+')
            && starts_number(&suffix[1..])
            && !value[..byte_index]
                .chars()
                .next_back()
                .is_some_and(|previous| {
                    previous.is_alphanumeric() || matches!(previous, '%' | ')' | '.')
                });
        if signed || starts_number(suffix) {
            let mut end = byte_index + character.len_utf8();
            for next in value[end..].chars() {
                if next.is_ascii_digit() || next == '.' {
                    end += next.len_utf8();
                } else {
                    break;
                }
            }
            push_semantic_token(
                tokens,
                start,
                offset + utf16_len(&value[..end]),
                "number",
                &[],
            );
            let unit_end = if value[end..].starts_with('%') {
                end + 1
            } else {
                value_identifier_end(value, end)
            };
            if unit_end > end {
                push_semantic_token(
                    tokens,
                    offset + utf16_len(&value[..end]),
                    offset + utf16_len(&value[..unit_end]),
                    "enumMember",
                    &["unit"],
                );
            }
            byte_index = unit_end;
            continue;
        }
        if mastercss_lexer::is_space_underscore(value, byte_index) {
            push_semantic_token(tokens, start, start + 1, "operator", &["valueSeparator"]);
            byte_index += 1;
            continue;
        }
        if character.is_alphabetic()
            || character == '_'
            || (character == '-'
                && !suffix
                    .chars()
                    .nth(1)
                    .is_some_and(|next| next.is_ascii_digit()))
        {
            // The `--name` that opens a `var()` keeps its underscores.
            let variable = suffix.starts_with("--")
                && value[..byte_index]
                    .trim_end_matches(|character: char| {
                        character.is_whitespace() || character == '|'
                    })
                    .to_ascii_lowercase()
                    .ends_with("var(");
            let end = if variable {
                dashed_name_end(value, byte_index)
            } else {
                value_identifier_end(value, byte_index)
            };
            let name = &value[byte_index..end];
            if value[end..].starts_with('(') {
                push_semantic_token(
                    tokens,
                    start,
                    offset + utf16_len(&value[..end]),
                    "function",
                    &[],
                );
                let open = offset + utf16_len(&value[..end]);
                push_semantic_token(tokens, open, open + 1, "operator", &["functionPunctuation"]);
                if name == "url" {
                    let content_start = end + 1;
                    let content_end = value[content_start..]
                        .find(')')
                        .map_or(value.len(), |close| content_start + close);
                    let content = &value[content_start..content_end];
                    if content.starts_with(['\'', '"']) {
                        push_value_semantic_tokens(
                            tokens,
                            content,
                            offset + utf16_len(&value[..content_start]),
                        );
                    } else {
                        push_semantic_token(
                            tokens,
                            offset + utf16_len(&value[..content_start]),
                            offset + utf16_len(&value[..content_end]),
                            "string",
                            &[],
                        );
                    }
                    if content_end < value.len() {
                        let close = offset + utf16_len(&value[..content_end]);
                        push_semantic_token(
                            tokens,
                            close,
                            close + 1,
                            "operator",
                            &["functionPunctuation"],
                        );
                        byte_index = content_end + 1;
                    } else {
                        byte_index = content_end;
                    }
                } else {
                    byte_index = end + 1;
                }
            } else {
                push_semantic_token(
                    tokens,
                    start,
                    offset + utf16_len(&value[..end]),
                    if variable { "variable" } else { "enumMember" },
                    &[],
                );
                byte_index = end;
            }
            continue;
        }
        if matches!(character, '|' | '/' | ',') {
            push_semantic_token(tokens, start, start + 1, "operator", &["valueSeparator"]);
        } else if character == '!' {
            push_semantic_token(tokens, start, start + 1, "operator", &["important"]);
        } else if matches!(character, '*' | '-' | '+') {
            push_semantic_token(tokens, start, start + 1, "operator", &["valueOperator"]);
        } else if matches!(character, '(' | ')') {
            push_semantic_token(
                tokens,
                start,
                start + 1,
                "operator",
                &["functionPunctuation"],
            );
        }
        byte_index += character.len_utf8();
    }
}

pub(crate) fn push_query_value_token(
    tokens: &mut Vec<SemanticTokenInputIr>,
    query: &str,
    offset: u32,
    start: usize,
    end: usize,
    property: bool,
) {
    if start >= end {
        return;
    }
    let text = &query[start..end];
    let number_end = text
        .char_indices()
        .take_while(|(_, character)| character.is_ascii_digit() || *character == '.')
        .map(|(index, character)| index + character.len_utf8())
        .last()
        .unwrap_or_default();
    if number_end > 0 {
        push_semantic_token(
            tokens,
            offset + utf16_len(&query[..start]),
            offset + utf16_len(&query[..start + number_end]),
            "number",
            &["query"],
        );
        if start + number_end < end {
            push_semantic_token(
                tokens,
                offset + utf16_len(&query[..start + number_end]),
                offset + utf16_len(&query[..end]),
                "enumMember",
                &["query", "unit"],
            );
        }
    } else {
        push_semantic_token(
            tokens,
            offset + utf16_len(&query[..start]),
            offset + utf16_len(&query[..end]),
            if property { "property" } else { "enumMember" },
            &["query"],
        );
    }
}

pub(crate) fn push_query_semantic_tokens(
    tokens: &mut Vec<SemanticTokenInputIr>,
    query: &str,
    offset: u32,
) {
    let keyword_end = query[1..]
        .char_indices()
        .take_while(|(_, character)| character.is_alphanumeric() || matches!(character, '-' | '_'))
        .map(|(index, character)| 1 + index + character.len_utf8())
        .last()
        .unwrap_or(1);
    let has_structure = query[keyword_end..]
        .chars()
        .any(|character| matches!(character, '(' | '>' | '<' | '=' | '&'));
    if !has_structure {
        push_semantic_token(
            tokens,
            offset,
            offset + utf16_len(query),
            "keyword",
            &["query"],
        );
        return;
    }
    if query[keyword_end..].starts_with('&') {
        push_semantic_token(tokens, offset, offset + 1, "keyword", &["query"]);
        push_semantic_token(
            tokens,
            offset + 1,
            offset + utf16_len(&query[..keyword_end]),
            "enumMember",
            &["query"],
        );
    } else {
        push_semantic_token(
            tokens,
            offset,
            offset + utf16_len(&query[..keyword_end]),
            "keyword",
            &["query"],
        );
    }
    let mut byte_index = keyword_end;
    let mut expect_property = false;
    while byte_index < query.len() {
        let suffix = &query[byte_index..];
        let character = suffix.chars().next().unwrap_or_default();
        let start = offset + utf16_len(&query[..byte_index]);
        if matches!(character, '(' | ')' | ':' | ',' | '|')
            || mastercss_lexer::is_space_underscore(query, byte_index)
        {
            push_semantic_token(
                tokens,
                start,
                start + 1,
                "operator",
                &["query", "queryPunctuation"],
            );
            expect_property = character == '(' && &query[..keyword_end] == "@media";
            byte_index += 1;
        } else if matches!(character, '&' | '>' | '<' | '=') {
            let mut end = byte_index + 1;
            if matches!(character, '>' | '<') && query[end..].starts_with('=') {
                end += 1;
            }
            push_semantic_token(
                tokens,
                start,
                offset + utf16_len(&query[..end]),
                "operator",
                &["query", "queryOperator"],
            );
            expect_property = character == '&';
            byte_index = end;
        } else if character.is_alphanumeric() || matches!(character, '-' | '.' | '_') {
            // Every `--name` in a query keeps its underscores.
            let end = if query[byte_index..].starts_with("--") {
                dashed_name_end(query, byte_index)
            } else {
                value_identifier_end(query, byte_index)
            };
            // A name before a comparison or a `:` is the feature being tested, in any query.
            let feature = query[end..].trim_start().starts_with(['<', '>', '=', ':']);
            push_query_value_token(
                tokens,
                query,
                offset,
                byte_index,
                end,
                expect_property || feature,
            );
            expect_property = false;
            byte_index = end;
        } else {
            byte_index += character.len_utf8();
        }
    }
}

pub(crate) fn state_identifier_end(state: &str, start: usize, allow_star: bool) -> usize {
    let mut end = start;
    if allow_star && state[end..].starts_with('*') {
        end += 1;
    }
    let mut characters = state[end..].chars().peekable();
    let mut previous = None;
    while let Some(character) = characters.next() {
        // `\_` and other escapes stay in the name; a lone `_` is the descendant combinator,
        // while `__` (as in BEM names) is part of it.
        if character == '\\' {
            end += character.len_utf8();
            if let Some(escaped) = characters.next() {
                end += escaped.len_utf8();
            }
        } else if character.is_alphanumeric()
            || character == '-'
            || (character == '_' && (previous == Some('_') || characters.peek() == Some(&'_')))
        {
            end += character.len_utf8();
        } else {
            break;
        }
        previous = Some(character);
    }
    end
}

/// The end of a query that starts at `start`: the next top-level `@`, or a trailing `!`.
fn state_query_end(state: &str, start: usize) -> usize {
    let mut depth = 0_u32;
    let mut quote = None;
    for (index, character) in state[start..].char_indices().skip(1) {
        let index = start + index;
        if let Some(current) = quote {
            if character == current {
                quote = None;
            }
            continue;
        }
        match character {
            '\'' | '"' => quote = Some(character),
            '(' => depth += 1,
            ')' => depth = depth.saturating_sub(1),
            '@' if depth == 0 => return index,
            '!' if depth == 0 && state[index + 1..].is_empty() => return index,
            _ => {}
        }
    }
    state.len()
}

/// `[name]`, `[name=value]` and `[name='value' i]`: the name reads as an attribute, the value as a string.
fn push_attribute_selector_tokens(
    tokens: &mut Vec<SemanticTokenInputIr>,
    state: &str,
    offset: u32,
    open: usize,
) -> usize {
    let at = |byte: usize| offset + utf16_len(&state[..byte]);
    let punctuation = |tokens: &mut Vec<SemanticTokenInputIr>, from: usize, to: usize| {
        push_semantic_token(
            tokens,
            at(from),
            at(to),
            "operator",
            &["selector", "selectorPunctuation"],
        );
    };
    punctuation(tokens, open, open + 1);
    let name_start = open + 1;
    let name_end = state_identifier_end(state, name_start, false);
    push_semantic_token(
        tokens,
        at(name_start),
        at(name_end),
        "property",
        &["selector"],
    );
    let mut index = name_end;
    let operator_end = index
        + state[index..]
            .char_indices()
            .take_while(|(_, character)| matches!(character, '~' | '|' | '^' | '$' | '*' | '='))
            .map(|(_, character)| character.len_utf8())
            .sum::<usize>();
    if operator_end > index {
        push_semantic_token(
            tokens,
            at(index),
            at(operator_end),
            "operator",
            &["selector", "selectorPunctuation"],
        );
        index = operator_end;
        if let Some(quote) = state[index..]
            .chars()
            .next()
            .filter(|character| matches!(character, '\'' | '"'))
        {
            let close = state[index + 1..]
                .find(quote)
                .map_or(state.len(), |close| index + 1 + close + 1);
            push_semantic_token(tokens, at(index), at(close), "string", &["quoted"]);
            index = close;
        } else {
            let end = index
                + state[index..]
                    .char_indices()
                    .take_while(|(_, character)| !matches!(character, ']' | '_'))
                    .map(|(_, character)| character.len_utf8())
                    .sum::<usize>();
            push_semantic_token(tokens, at(index), at(end), "string", &[]);
            index = end;
        }
    }
    // A case flag such as ` i` or `_i`.
    let flag_start =
        index + state[index..].len() - state[index..].trim_start_matches([' ', '_']).len();
    if flag_start > index {
        let flag_end = state_identifier_end(state, flag_start, false);
        if state[flag_end..].starts_with(']') {
            push_semantic_token(
                tokens,
                at(flag_start),
                at(flag_end),
                "keyword",
                &["selector"],
            );
            index = flag_end;
        }
    }
    if state[index..].starts_with(']') {
        punctuation(tokens, index, index + 1);
        index += 1;
    }
    index
}

/// The `An+B [of S]` argument of an `:nth-*()` pseudo-class, up to its closing parenthesis.
fn push_nth_argument_tokens(
    tokens: &mut Vec<SemanticTokenInputIr>,
    state: &str,
    offset: u32,
    start: usize,
) -> usize {
    let at = |byte: usize| offset + utf16_len(&state[..byte]);
    let mut index = start;
    while index < state.len() {
        let rest = &state[index..];
        let character = rest.chars().next().unwrap_or_default();
        if character == ')' {
            break;
        }
        if character.is_ascii_digit() {
            let end = index + rest.chars().take_while(char::is_ascii_digit).count();
            let end = if state[end..].starts_with('n') {
                end + 1
            } else {
                end
            };
            push_semantic_token(tokens, at(index), at(end), "number", &[]);
            index = end;
        } else if character.is_alphabetic() {
            let end = state_identifier_end(state, index, false);
            let word = &state[index..end];
            if word == "of" {
                push_semantic_token(tokens, at(index), at(end), "keyword", &["selector"]);
                // The selector after `of` reads like any other selector.
                let close = state_query_close(state, end);
                push_state_semantic_tokens(tokens, &state[end..close], at(end));
                return close;
            }
            push_semantic_token(
                tokens,
                at(index),
                at(end),
                if word == "n" { "number" } else { "enumMember" },
                &[],
            );
            index = end;
        } else if matches!(character, '+' | '-') {
            push_semantic_token(
                tokens,
                at(index),
                at(index + 1),
                "operator",
                &["valueOperator"],
            );
            index += 1;
        } else {
            index += character.len_utf8();
        }
    }
    index
}

/// The index of the `)` closing the group that `start` is in.
fn state_query_close(state: &str, start: usize) -> usize {
    let mut depth = 0_u32;
    for (index, character) in state[start..].char_indices() {
        match character {
            '(' => depth += 1,
            ')' if depth == 0 => return start + index,
            ')' => depth -= 1,
            _ => {}
        }
    }
    state.len()
}

pub(crate) fn push_state_semantic_tokens(
    tokens: &mut Vec<SemanticTokenInputIr>,
    state: &str,
    offset: u32,
) {
    let mut byte_index = 0;
    while byte_index < state.len() {
        let suffix = &state[byte_index..];
        let start = offset + utf16_len(&state[..byte_index]);
        let character = suffix.chars().next().unwrap_or_default();
        let character_length = character.len_utf8();
        if character == '!' {
            push_semantic_token(tokens, start, start + 1, "operator", &["important"]);
            byte_index += 1;
        } else if matches!(character, '_' | '>' | '+' | '~') {
            push_semantic_token(
                tokens,
                start,
                start + 1,
                "operator",
                &["selector", "selectorCombinator"],
            );
            let name_start = byte_index + character_length;
            let name_end = state_identifier_end(state, name_start, true);
            push_semantic_token(
                tokens,
                offset + utf16_len(&state[..name_start]),
                offset + utf16_len(&state[..name_end]),
                "type",
                &["selector"],
            );
            byte_index = name_end;
        } else if matches!(character, '.' | '#') {
            push_semantic_token(
                tokens,
                start,
                start + 1,
                "operator",
                &["selector", "selectorPunctuation"],
            );
            let name_start = byte_index + character_length;
            let name_end = state_identifier_end(state, name_start, false);
            push_semantic_token(
                tokens,
                offset + utf16_len(&state[..name_start]),
                offset + utf16_len(&state[..name_end]),
                if character == '.' {
                    "class"
                } else {
                    "variable"
                },
                &["selector"],
            );
            byte_index = name_end;
        } else if character == '('
            && state[..byte_index]
                .rsplit(':')
                .next()
                .is_some_and(|name| name.starts_with("nth-"))
        {
            push_semantic_token(
                tokens,
                start,
                start + 1,
                "operator",
                &["selector", "selectorPunctuation"],
            );
            byte_index = push_nth_argument_tokens(tokens, state, offset, byte_index + 1);
        } else if character == '[' {
            byte_index = push_attribute_selector_tokens(tokens, state, offset, byte_index);
        } else if matches!(character, '(' | ',') {
            push_semantic_token(
                tokens,
                start,
                start + 1,
                "operator",
                &["selector", "selectorPunctuation"],
            );
            let name_start = byte_index + character_length;
            let name_end = state_identifier_end(state, name_start, true);
            push_semantic_token(
                tokens,
                offset + utf16_len(&state[..name_start]),
                offset + utf16_len(&state[..name_end]),
                "type",
                &["selector"],
            );
            byte_index = name_end;
        } else if matches!(character, ')' | ']') {
            push_semantic_token(
                tokens,
                start,
                start + 1,
                "operator",
                &["selector", "selectorPunctuation"],
            );
            byte_index += character_length;
        } else if character == '@' {
            let end = state_query_end(state, byte_index);
            push_query_semantic_tokens(tokens, &state[byte_index..end], start);
            byte_index = end;
        } else if character == ':' {
            let delimiter_length = if suffix.starts_with("::") { 2 } else { 1 };
            let (kind, delimiter) = if delimiter_length == 2 {
                ("pseudoElement", "pseudoElementDelimiter")
            } else {
                ("pseudoClass", "pseudoClassDelimiter")
            };
            push_semantic_token(
                tokens,
                start,
                start + delimiter_length,
                "operator",
                &["selector", kind, delimiter],
            );
            let name_start = byte_index + delimiter_length as usize;
            let name_end = state_identifier_end(state, name_start, false);
            push_semantic_token(
                tokens,
                offset + utf16_len(&state[..name_start]),
                offset + utf16_len(&state[..name_end]),
                "modifier",
                &[kind],
            );
            byte_index = name_end;
        } else {
            byte_index += character_length;
        }
    }
}
