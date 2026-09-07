use super::*;

pub(crate) fn inspect_class_name_parts(
    class_name: &str,
) -> (String, String, Option<String>, Option<String>) {
    if let Some(colon) = class_name.find(':').filter(|colon| *colon > 0) {
        let end = find_class_modifier_index(class_name, colon + 1);
        return (
            class_name[..end].to_owned(),
            class_name[end..].to_owned(),
            Some(class_name[..colon].to_owned()),
            Some(class_name[colon + 1..end].to_owned()),
        );
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

pub(crate) fn value_identifier_end(value: &str, start: usize) -> usize {
    let mut end = start;
    for character in value[start..].chars() {
        if character.is_alphanumeric() || matches!(character, '_' | '-' | '.') {
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
    variable_names: &HashSet<String>,
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
        let number_start = character.is_ascii_digit()
            || (character == '.'
                && suffix
                    .chars()
                    .nth(1)
                    .is_some_and(|next| next.is_ascii_digit()));
        if number_start {
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
            let unit_end = value_identifier_end(value, end);
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
        if character.is_alphabetic()
            || character == '_'
            || (character == '-'
                && !suffix
                    .chars()
                    .nth(1)
                    .is_some_and(|next| next.is_ascii_digit()))
        {
            let end = value_identifier_end(value, byte_index);
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
                            variable_names,
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
                    if variable_names.contains(name) {
                        "variable"
                    } else {
                        "enumMember"
                    },
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
        } else if matches!(character, '*' | '-') {
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
        if matches!(character, '(' | ')' | ':' | ',') {
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
        } else if character.is_alphanumeric() || matches!(character, '-' | '.') {
            let end = value_identifier_end(query, byte_index);
            push_query_value_token(tokens, query, offset, byte_index, end, expect_property);
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
    for (relative, character) in state[end..].char_indices() {
        if character.is_alphanumeric() || matches!(character, '_' | '-') {
            end += character.len_utf8();
        } else {
            let _ = relative;
            break;
        }
    }
    end
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
        } else if matches!(character, ')' | '[' | ']') {
            push_semantic_token(
                tokens,
                start,
                start + 1,
                "operator",
                &["selector", "selectorPunctuation"],
            );
            byte_index += character_length;
        } else if character == '@' {
            let end = state.len();
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
