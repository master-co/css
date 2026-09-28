use super::{
    CompilerError, CssDirectiveConditionPathEntry, PrinterOptions, ToCss, UtilityLayerName, Value,
    css_comment_end, css_quote_end, next_char_end,
};

#[derive(Debug, Clone)]
pub(crate) enum ParsedManagedPattern {
    Static {
        name: String,
    },
    Token {
        name: String,
        prefix: String,
        variable_alias_refs: Vec<String>,
    },
    Dynamic {
        name: String,
        key: String,
    },
}

impl ParsedManagedPattern {
    pub(crate) fn definition(&self, layer: UtilityLayerName) -> serde_json::Map<String, Value> {
        let mut definition = serde_json::Map::new();
        definition.insert(
            "layer".into(),
            serde_json::to_value(layer).expect("layer serializes"),
        );
        let (name, kind) = match self {
            Self::Static { name } => (name, "static"),
            Self::Dynamic { name, key } => {
                definition.insert("dynamic".into(), serde_json::json!({ "key": key }));
                (name, "dynamic")
            }
            Self::Token {
                name,
                prefix,
                variable_alias_refs,
            } => {
                definition.insert(
                    "token".into(),
                    serde_json::json!({
                        "prefix": prefix, "variableAliasRefs": variable_alias_refs,
                    }),
                );
                (name, "token")
            }
        };
        definition.insert("name".into(), name.clone().into());
        definition.insert("type".into(), kind.into());
        definition
    }
}

/// Parse the one-definition @utility prelude with CSS token boundaries. Escaped
/// identifiers are decoded by cssparser; comments are trivia, not delimiters.
pub(crate) fn parse_managed_pattern(source: &str) -> Result<ParsedManagedPattern, String> {
    use cssparser::{Parser, ParserInput, Token};
    let mut input = ParserInput::new(source);
    let mut parser = Parser::new(&mut input);
    let ident = parser
        .expect_ident_cloned()
        .map_err(|_| "@utility requires a CSS identifier")?;
    let name = ident.to_string();
    if !mastercss_lexer::valid_utility_name(&name) {
        return Err(format!("Invalid utility identifier {name}"));
    }
    if parser.is_exhausted() {
        return Ok(ParsedManagedPattern::Static { name });
    }
    if parser.try_parse(|parser| parser.expect_colon()).is_ok() {
        parser
            .expect_delim('*')
            .map_err(|_| "Raw utilities require name:* syntax")?;
        parser
            .expect_exhausted()
            .map_err(|_| "Raw utilities require exactly one terminal wildcard")?;
        return Ok(ParsedManagedPattern::Dynamic {
            name: format!("{name}:*"),
            key: name,
        });
    }
    parser.expect_delim('*').map_err(
        |_| "Use name:*, name-* from(--namespace-*), or separate fixed @utility definitions",
    )?;
    if !name.ends_with('-') || name == "-" {
        return Err("Named token utilities require name-* from(--namespace-*)".into());
    }
    parser
        .expect_function_matching("from")
        .map_err(|_| "Named token utilities require from(--namespace-*)")?;
    let refs: Result<Vec<String>, cssparser::ParseError<'_, ()>> =
        parser.parse_nested_block(|parser| {
            parser.parse_comma_separated(|parser| {
                let namespace = parser.expect_ident_cloned()?.to_string();
                if !namespace.starts_with("--") || !namespace.ends_with('-') || namespace.len() <= 3
                {
                    return Err(parser.new_custom_error(()));
                }
                parser.expect_delim('*')?;
                match parser.next() {
                    Err(_) => Ok(format!("~{}", &namespace[2..namespace.len() - 1])),
                    Ok(Token::Comma) => unreachable!("comma is bounded by parse_comma_separated"),
                    _ => Err(parser.new_custom_error(())),
                }
            })
        });
    let refs = refs.map_err(
        |_| "from() accepts comma-separated --namespace-* sources with one terminal wildcard",
    )?;
    parser
        .expect_exhausted()
        .map_err(|_| "Unexpected tokens after from()")?;
    let mut unique = Vec::new();
    for reference in refs {
        if !unique.contains(&reference) {
            unique.push(reference);
        }
    }
    Ok(ParsedManagedPattern::Token {
        name: format!(
            "{name}* from({})",
            unique
                .iter()
                .map(|value| format!("--{}-*", &value[1..]))
                .collect::<Vec<_>>()
                .join(", ")
        ),
        prefix: name,
        variable_alias_refs: unique,
    })
}

pub(crate) fn css_block_end(source: &str, open: usize, limit: usize) -> Option<usize> {
    let mut index = open + 1;
    let mut depth = 1_u32;
    while index < limit {
        let character = source[index..].chars().next()?;
        if matches!(character, '\'' | '"') {
            index = css_quote_end(source, index, character);
            continue;
        }
        if source[index..].starts_with("/*") {
            index = css_comment_end(source, index);
            continue;
        }
        match character {
            '{' => depth += 1,
            '}' => {
                depth -= 1;
                if depth == 0 {
                    return Some(index);
                }
            }
            _ => {}
        }
        index = next_char_end(source, index);
    }
    None
}

pub(crate) fn css_statement_delimiter(
    source: &str,
    start: usize,
    limit: usize,
) -> Option<(usize, char)> {
    let mut index = start;
    let mut parentheses = 0_u32;
    let mut square = 0_u32;
    while index < limit {
        let character = source[index..].chars().next()?;
        if matches!(character, '\'' | '"') {
            index = css_quote_end(source, index, character);
            continue;
        }
        if source[index..].starts_with("/*") {
            index = css_comment_end(source, index);
            continue;
        }
        match character {
            '(' => parentheses += 1,
            ')' => parentheses = parentheses.saturating_sub(1),
            '[' => square += 1,
            ']' => square = square.saturating_sub(1),
            ';' | '{' if parentheses == 0 && square == 0 => return Some((index, character)),
            _ => {}
        }
        index = next_char_end(source, index);
    }
    None
}

pub(crate) fn minified_css<T: ToCss>(value: &T, filename: &str) -> Result<String, CompilerError> {
    value
        .to_css_string(PrinterOptions {
            minify: true,
            ..PrinterOptions::default()
        })
        .map_err(|error| CompilerError::Print {
            message: error.to_string(),
            filename: filename.to_owned(),
        })
}

pub(crate) fn condition_properties(
    path: &[CssDirectiveConditionPathEntry],
) -> (
    Option<Vec<String>>,
    Option<Vec<CssDirectiveConditionPathEntry>>,
) {
    if path.is_empty() {
        return (None, None);
    }
    let conditions = path
        .iter()
        .map(|entry| match entry {
            CssDirectiveConditionPathEntry::Condition { value } => Some(value.clone()),
            CssDirectiveConditionPathEntry::Variant { .. } => None,
        })
        .collect::<Option<Vec<_>>>();
    (conditions, Some(path.to_vec()))
}
