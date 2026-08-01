use super::*;

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
    let statement = statement.trim();
    let mut rest = statement.strip_prefix("@import")?;
    if rest
        .chars()
        .next()
        .is_none_or(|character| !character.is_whitespace())
    {
        return None;
    }
    rest = rest.trim_start();
    if let Some(url) = rest.strip_prefix("url(") {
        rest = url.trim_start();
        if let Some(quote) = rest
            .chars()
            .next()
            .filter(|quote| matches!(quote, '\'' | '"'))
        {
            let body = &rest[quote.len_utf8()..];
            return read_quoted(body, quote).map(str::to_owned);
        }
        let end = rest.find(|character: char| character == ')' || character.is_whitespace())?;
        return Some(rest[..end].to_owned());
    }
    let quote = rest
        .chars()
        .next()
        .filter(|quote| matches!(quote, '\'' | '"'))?;
    read_quoted(&rest[quote.len_utf8()..], quote).map(str::to_owned)
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
        let prelude = statement
            .strip_prefix("@reference")
            .and_then(|value| value.strip_suffix(';'))
            .map(str::trim)
            .unwrap_or_default();
        let Some(quote) = prelude
            .chars()
            .next()
            .filter(|quote| matches!(quote, '\'' | '"'))
        else {
            return Some(statement_end.end);
        };
        let body = &prelude[quote.len_utf8()..];
        let Some(value) = read_quoted(body, quote) else {
            return Some(statement_end.end);
        };
        let quoted_length = quote.len_utf8() + value.len() + quote.len_utf8();
        if !prelude[quoted_length..].trim().is_empty() {
            return Some(statement_end.end);
        }
        references.push(CssReferenceStatement {
            start: byte_to_utf16_offset(source, start).unwrap_or_default(),
            end: byte_to_utf16_offset(source, statement_end.end).unwrap_or_default(),
            statement: statement.to_owned(),
            source: value.to_owned(),
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

pub fn find_master_directive_statements(source: &str) -> Vec<MasterDirectiveStatement> {
    let mut statements = Vec::new();
    scan_top_level_at_rules(source, |start, name| {
        if name != "master" {
            return None;
        }
        let statement_end = find_css_statement_end(source, start);
        if statement_end.reason != CssStatementEndReason::Semicolon {
            return None;
        }
        let statement = &source[start..statement_end.end];
        let prelude = statement
            .strip_prefix("@master")
            .and_then(|value| value.strip_suffix(';'))
            .map(str::trim);
        if prelude == Some("entry") {
            statements.push(MasterDirectiveStatement {
                start: byte_to_utf16_offset(source, start).unwrap_or_default(),
                end: byte_to_utf16_offset(source, statement_end.end).unwrap_or_default(),
                name: "entry".into(),
            });
        }
        Some(statement_end.end)
    });
    statements
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
            "master" | "source" | "safelist" | "blocklist" | "preserve"
        ) {
            return None;
        }
        let statement_end = find_css_statement_end(source, start);
        if statement_end.reason != CssStatementEndReason::Semicolon {
            return None;
        }
        let statement = &source[start..statement_end.end];
        let prelude = statement
            .strip_prefix(&format!("@{name}"))
            .and_then(|value| value.strip_suffix(';'))
            .unwrap_or_default();
        if name == "master" && prelude.trim() != "entry" {
            return Some(statement_end.end);
        }
        statements.push(StandaloneCssDirectiveStatement {
            start: byte_to_utf16_offset(source, start).unwrap_or_default(),
            end: byte_to_utf16_offset(source, statement_end.end).unwrap_or_default(),
            at_rule_name: name.to_owned(),
            name: if name == "master" { "entry" } else { name }.to_owned(),
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
    !find_master_directive_statements(source).is_empty()
        || find_css_import_statements(source).iter().any(|statement| {
            parse_css_import_source(&statement.statement).as_deref() == Some("@master/css")
        })
}

pub fn remove_master_directive_statements(source: &str) -> (String, bool) {
    let statements = find_master_directive_statements(source);
    if statements.is_empty() {
        return (source.to_owned(), false);
    }
    let mut output = String::with_capacity(source.len());
    let mut byte_index = 0;
    for statement in statements {
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
    (output, true)
}
