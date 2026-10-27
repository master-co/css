use super::{
    CssImportStatement, CssReferenceStatement, CssStatementEndReason,
    StandaloneCssDirectiveStatement, byte_to_utf16_offset, find_css_statement_end,
    scan_top_level_at_rules, utf16_to_byte_offset,
};

pub fn find_css_import_statements(source: &str) -> Vec<CssImportStatement> {
    let mut imports = Vec::new();
    scan_top_level_at_rules(source, |start, name| {
        if name != "import" {
            return None;
        }
        let statement_end = find_css_statement_end(source, start);
        if statement_end.reason != CssStatementEndReason::Semicolon {
            return None;
        }
        imports.push(CssImportStatement {
            start: byte_to_utf16_offset(source, start).unwrap_or_default(),
            end: byte_to_utf16_offset(source, statement_end.end).unwrap_or_default(),
            statement: source[start..statement_end.end].to_owned(),
        });
        Some(statement_end.end)
    });
    imports
}

pub fn parse_css_import_source(statement: &str) -> Option<String> {
    use super::{CssSyntaxKind as Kind, tokenize_css_syntax};
    let tokens = tokenize_css_syntax(statement);
    if !matches!(&tokens.first()?.kind, Kind::AtKeyword(name) if name.eq_ignore_ascii_case("import"))
    {
        return None;
    }
    match &tokens.get(1)?.kind {
        Kind::String(_) => {
            Some(statement[tokens[1].bytes.start + 1..tokens[1].bytes.end - 1].to_owned())
        }
        Kind::Function(name) if name.eq_ignore_ascii_case("url") => {
            let close = tokens[1].close?;
            if close == 3 && matches!(tokens[2].kind, Kind::String(_)) {
                return Some(
                    statement[tokens[2].bytes.start + 1..tokens[2].bytes.end - 1].to_owned(),
                );
            }
            let value = statement[tokens[1].bytes.end..tokens[close].bytes.start].trim();
            (!value.is_empty() && !value.chars().any(char::is_whitespace)).then(|| value.to_owned())
        }
        _ => None,
    }
}

pub fn find_css_reference_statements(source: &str) -> Vec<CssReferenceStatement> {
    let mut references = Vec::new();
    scan_top_level_at_rules(source, |start, name| {
        if name != "reference" {
            return None;
        }
        let statement_end = find_css_statement_end(source, start);
        if statement_end.reason != CssStatementEndReason::Semicolon {
            return None;
        }
        let statement = &source[start..statement_end.end];
        let tokens = super::tokenize_css_syntax(statement);
        let [_, value, semicolon] = tokens.as_slice() else {
            return Some(statement_end.end);
        };
        let super::CssSyntaxKind::String(_) = &value.kind else {
            return Some(statement_end.end);
        };
        let value = &statement[value.bytes.start + 1..value.bytes.end - 1];
        if semicolon.kind != super::CssSyntaxKind::Delim(';') {
            return Some(statement_end.end);
        }
        references.push(CssReferenceStatement {
            start: byte_to_utf16_offset(source, start).unwrap_or_default(),
            end: byte_to_utf16_offset(source, statement_end.end).unwrap_or_default(),
            statement: statement.to_owned(),
            source: value.to_string(),
        });
        Some(statement_end.end)
    });
    references
}

pub fn remove_css_reference_statements(source: &str) -> (String, Vec<CssReferenceStatement>) {
    let references = find_css_reference_statements(source);
    if references.is_empty() {
        return (source.to_owned(), references);
    }
    let mut output = String::with_capacity(source.len());
    let mut byte_index = 0;
    for reference in &references {
        let Some(start) = utf16_to_byte_offset(source, reference.start) else {
            continue;
        };
        let Some(end) = utf16_to_byte_offset(source, reference.end) else {
            continue;
        };
        output.push_str(&source[byte_index..start]);
        byte_index = end;
    }
    output.push_str(&source[byte_index..]);
    (output, references)
}

pub(crate) fn parse_quoted_strings(source: &str) -> Vec<String> {
    let mut values = Vec::new();
    let mut index = 0;
    while index < source.len() {
        let character = source[index..].chars().next().unwrap_or_default();
        if !matches!(character, '\'' | '"') {
            index += character.len_utf8();
            continue;
        }
        let quote = character;
        index += quote.len_utf8();
        let mut value = String::new();
        while index < source.len() {
            let character = source[index..].chars().next().unwrap_or_default();
            index += character.len_utf8();
            if character == '\\' {
                if let Some(escaped) = source[index..].chars().next() {
                    value.push(escaped);
                    index += escaped.len_utf8();
                }
            } else if character == quote {
                values.push(value);
                break;
            } else {
                value.push(character);
            }
        }
    }
    values
}

pub(crate) fn parse_unquoted_words(source: &str) -> Vec<String> {
    let mut words = Vec::new();
    let mut word = String::new();
    let mut index = 0;
    while index < source.len() {
        let character = source[index..].chars().next().unwrap_or_default();
        if matches!(character, '\'' | '"') {
            if !word.is_empty() {
                words.push(std::mem::take(&mut word));
            }
            let quote = character;
            index += quote.len_utf8();
            while index < source.len() {
                let character = source[index..].chars().next().unwrap_or_default();
                index += character.len_utf8();
                if character == '\\' {
                    index += source[index..]
                        .chars()
                        .next()
                        .map(char::len_utf8)
                        .unwrap_or_default();
                } else if character == quote {
                    break;
                }
            }
            continue;
        }
        if source[index..].starts_with("/*") {
            if !word.is_empty() {
                words.push(std::mem::take(&mut word));
            }
            index = source[index + 2..]
                .find("*/")
                .map(|offset| index + 2 + offset + 2)
                .unwrap_or(source.len());
            continue;
        }
        if character.is_ascii_alphanumeric() || matches!(character, '-' | '_') {
            word.push(character);
        } else if !word.is_empty() {
            words.push(std::mem::take(&mut word));
        }
        index += character.len_utf8();
    }
    if !word.is_empty() {
        words.push(word);
    }
    words
}

pub fn find_standalone_css_directive_statements(
    source: &str,
) -> Vec<StandaloneCssDirectiveStatement> {
    let mut statements = Vec::new();
    scan_top_level_at_rules(source, |start, name| {
        if !matches!(
            name,
            "source" | "safelist" | "blocklist" | "preserve" | "prune"
        ) {
            return None;
        }
        let statement_end = find_css_statement_end(source, start);
        if statement_end.reason != CssStatementEndReason::Semicolon {
            return None;
        }
        let statement = &source[start..statement_end.end];
        let tokens = super::tokenize_css_syntax(statement);
        let prelude = &statement[tokens[0].bytes.end..statement.len() - 1];
        statements.push(StandaloneCssDirectiveStatement {
            start: byte_to_utf16_offset(source, start).unwrap_or_default(),
            end: byte_to_utf16_offset(source, statement_end.end).unwrap_or_default(),
            at_rule_name: name.to_owned(),
            name: name.to_owned(),
            statement: statement.to_owned(),
            args: parse_quoted_strings(prelude),
            modifiers: parse_unquoted_words(prelude),
        });
        Some(statement_end.end)
    });
    statements
}

pub fn remove_standalone_css_directives(
    source: &str,
) -> (String, Vec<StandaloneCssDirectiveStatement>) {
    let statements = find_standalone_css_directive_statements(source);
    if statements.is_empty() {
        return (source.to_owned(), statements);
    }
    let mut output = String::with_capacity(source.len());
    let mut byte_index = 0;
    for statement in &statements {
        let Some(start) = utf16_to_byte_offset(source, statement.start) else {
            continue;
        };
        let Some(end) = utf16_to_byte_offset(source, statement.end) else {
            continue;
        };
        output.push_str(&source[byte_index..start]);
        byte_index = end;
    }
    output.push_str(&source[byte_index..]);
    (output, statements)
}

pub fn has_master_css_manifest_entrypoint(source: &str) -> bool {
    find_css_import_statements(source).iter().any(|statement| {
        parse_css_import_source(&statement.statement).as_deref() == Some("@master/css")
    })
}
