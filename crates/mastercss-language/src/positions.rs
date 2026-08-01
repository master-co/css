use super::*;

#[derive(Debug, thiserror::Error)]
pub enum LanguageError {
    #[error(transparent)]
    Engine(#[from] EngineError),
    #[error("Language input contains a range outside the UTF-16 document boundary.")]
    InvalidRange,
}

pub fn collect_class_positions(
    source: &str,
    contexts: &[ClassListContextIr],
) -> Result<Vec<ClassPositionIr>, LanguageError> {
    let mut positions = Vec::new();
    for context in contexts {
        let start =
            utf16_to_byte_offset(source, context.start).ok_or(LanguageError::InvalidRange)?;
        let end = utf16_to_byte_offset(source, context.end).ok_or(LanguageError::InvalidRange)?;
        if start > end {
            return Err(LanguageError::InvalidRange);
        }
        let class_list = &source[start..end];
        if class_list.is_empty() {
            positions.push(ClassPositionIr {
                range: SourceRange {
                    start: context.start,
                    end: context.start,
                },
                context_range: SourceRange {
                    start: context.start,
                    end: context.end,
                },
                token: String::new(),
                raw: String::new(),
            });
            continue;
        }
        for range in collect_class_list_token_ranges(class_list) {
            let raw_start = utf16_to_byte_offset(class_list, range.range.start)
                .ok_or(LanguageError::InvalidRange)?;
            let raw_end = utf16_to_byte_offset(class_list, range.range.end)
                .ok_or(LanguageError::InvalidRange)?;
            let raw = class_list[raw_start..raw_end].to_owned();
            positions.push(ClassPositionIr {
                range: SourceRange {
                    start: context.start + range.range.start,
                    end: context.start + range.range.end,
                },
                context_range: SourceRange {
                    start: context.start,
                    end: context.end,
                },
                token: unescape_token(&raw, &context.unescape),
                raw,
            });
        }
    }
    positions.sort_by_key(|position| (position.range.start, position.range.end));
    positions.dedup_by(|left, right| left.range == right.range);
    Ok(positions)
}

pub fn encode_semantic_tokens(source: &str, tokens: &[SemanticTokenInputIr]) -> Vec<u32> {
    let mut tokens = tokens
        .iter()
        .filter(|token| token.end > token.start)
        .cloned()
        .collect::<Vec<_>>();
    tokens.sort_by_key(|token| (token.start, token.end));

    let mut data = Vec::new();
    let mut previous_line = 0;
    let mut previous_character = 0;
    let mut previous_end = None;
    for token in tokens {
        if previous_end.is_some_and(|end| token.start < end) {
            continue;
        }
        let Some((start_line, start_character)) = position_at(source, token.start) else {
            continue;
        };
        let Some((end_line, end_character)) = position_at(source, token.end) else {
            continue;
        };
        if start_line != end_line {
            continue;
        }
        let Some(type_index) = SEMANTIC_TOKEN_TYPES
            .iter()
            .position(|token_type| *token_type == token.token_type)
        else {
            continue;
        };
        data.extend([
            start_line - previous_line,
            if start_line == previous_line {
                start_character - previous_character
            } else {
                start_character
            },
            end_character - start_character,
            type_index as u32,
            modifier_bits(&token.modifiers),
        ]);
        previous_line = start_line;
        previous_character = start_character;
        previous_end = Some(token.end);
    }
    data
}

const SEMANTIC_TOKEN_TYPES: [&str; 11] = [
    "class",
    "enumMember",
    "property",
    "variable",
    "function",
    "number",
    "string",
    "keyword",
    "modifier",
    "operator",
    "type",
];

const SEMANTIC_TOKEN_MODIFIERS: [&str; 24] = [
    "declaration",
    "defaultLibrary",
    "component",
    "directive",
    "important",
    "pseudoClass",
    "pseudoElement",
    "query",
    "quoted",
    "selector",
    "unit",
    "blockBrace",
    "declarationSeparator",
    "declarationTerminator",
    "directiveTerminator",
    "functionPunctuation",
    "valueSeparator",
    "valueOperator",
    "queryOperator",
    "queryPunctuation",
    "selectorCombinator",
    "selectorPunctuation",
    "pseudoClassDelimiter",
    "pseudoElementDelimiter",
];

fn modifier_bits(modifiers: &[String]) -> u32 {
    modifiers.iter().fold(0, |bits, modifier| {
        SEMANTIC_TOKEN_MODIFIERS
            .iter()
            .position(|candidate| *candidate == modifier)
            .map_or(bits, |index| bits | (1 << index))
    })
}

fn unescape_token(raw: &str, characters: &[String]) -> String {
    characters.iter().fold(raw.to_owned(), |token, character| {
        token.replace(&format!("\\{character}"), character)
    })
}

fn position_at(source: &str, offset: u32) -> Option<(u32, u32)> {
    if offset > utf16_len(source) {
        return None;
    }
    let mut line = 0;
    let mut character = 0;
    let mut utf16_offset = 0;
    let mut chars = source.chars().peekable();
    while let Some(value) = chars.next() {
        if utf16_offset == offset {
            return Some((line, character));
        }
        let length = value.len_utf16() as u32;
        if utf16_offset + length > offset {
            return None;
        }
        utf16_offset += length;
        if value == '\r' {
            if chars.peek() == Some(&'\n') {
                chars.next();
                utf16_offset += 1;
            }
            line += 1;
            character = 0;
        } else if value == '\n' {
            line += 1;
            character = 0;
        } else {
            character += length;
        }
    }
    (utf16_offset == offset).then_some((line, character))
}
