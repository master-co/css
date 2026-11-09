//! Advisory CSS-to-class authoring. This is deliberately separate from autofix:
//! moving a declaration into utilities changes its cascade context.
use super::{EngineError, EngineSession, LintSession};
use mastercss_lexer::{CssSyntaxKind as Kind, collect_css_syntax_statements, tokenize_css_syntax};
use mastercss_schema::{MixinNode, MixinParameterSyntax, UtilityDefinition, UtilityKind};
use serde::Serialize;
use std::collections::HashSet;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClassSuggestions {
    pub version: u32,
    pub status: &'static str,
    pub classes: Vec<String>,
    pub css: String,
    pub remaining_css: String,
    pub declarations: Vec<SuggestedDeclaration>,
    pub notes: Vec<String>,
    pub verification: SuggestionVerification,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SuggestedDeclaration {
    pub property: String,
    pub value: String,
    pub important: bool,
    pub class_name: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SuggestionVerification {
    pub declarations: bool,
    pub cascade: bool,
    pub browser: bool,
}

impl ClassSuggestions {
    fn preserved(source: &str, reason: &str) -> Self {
        Self {
            version: 1,
            status: "preserved",
            classes: vec![],
            css: String::new(),
            remaining_css: source.into(),
            declarations: vec![],
            notes: vec![reason.into()],
            verification: SuggestionVerification {
                declarations: false,
                cascade: false,
                browser: false,
            },
        }
    }
}

struct Declaration {
    property: String,
    value: String,
    important: bool,
}

fn parse(source: &str) -> Option<Vec<Declaration>> {
    // Preserve comments and escapes verbatim instead of guessing how a class
    // attribute's whitespace or host-language quoting would represent them.
    if source.contains("/*") || source.contains('\\') || source.contains('|') {
        return None;
    }
    let wrapped = format!("x{{{source}}}");
    let tokens = tokenize_css_syntax(&wrapped);
    if tokens.get(1)?.close != Some(tokens.len() - 1) {
        return None;
    }
    let statements = collect_css_syntax_statements(&tokens);
    let mut result = vec![];
    for statement in statements.iter().skip(1) {
        if !statement.declaration || statement.parent != Some(0) || statement.has_block {
            return None;
        }
        let items = &tokens[statement.tokens.clone()];
        let Kind::Ident(property) = &items.first()?.kind else {
            return None;
        };
        if !mastercss_schema::is_listed_native_css_property(property) {
            return None;
        }
        let mut values = items.get(2..)?;
        let important = values.len() >= 2
            && values[values.len() - 2].kind == Kind::Delim('!')
            && matches!(&values[values.len() - 1].kind, Kind::Ident(name) if name.eq_ignore_ascii_case("important"));
        if important {
            values = &values[..values.len() - 2];
        }
        let first = values.first()?;
        let last = values.last()?;
        if values.iter().any(|token| {
            matches!(&token.kind, Kind::Function(name) if matches!(name.to_ascii_lowercase().as_str(), "url" | "src" | "image" | "image-set" | "-webkit-image-set"))
                || matches!(token.kind, Kind::Other)
                || matches!(token.kind, Kind::Function(_) | Kind::Delim('(' | '[' | '{'))
                    && token.close.is_none()
                || matches!(token.kind, Kind::Delim('{' | '}' | '!'))
                || matches!(token.kind, Kind::String(_))
                    && wrapped[token.bytes.clone()]
                        .chars()
                        .any(char::is_whitespace)
        }) {
            return None;
        }
        result.push(Declaration {
            property: property.to_ascii_lowercase(),
            value: wrapped[first.bytes.start..last.bytes.end].into(),
            important,
        });
    }
    Some(result)
}

// Conservative groups, not a CSS conflict engine. A possible interaction keeps
// the complete block in CSS, including its source order and fallback declarations.
fn group(property: &str) -> &str {
    let property = property
        .strip_prefix("-webkit-")
        .or_else(|| property.strip_prefix("-moz-"))
        .or_else(|| property.strip_prefix("-ms-"))
        .or_else(|| property.strip_prefix("-o-"))
        .unwrap_or(property);
    match property {
        "top" | "right" | "bottom" | "left" => "inset",
        "gap" | "row-gap" | "column-gap" => "grid",
        "columns" => "column",
        "word-wrap" | "overflow-wrap" => "text",
        p if p.starts_with("page-break-") => "break",
        "line-clamp" | "max-lines" | "block-ellipsis" => "clamp",
        "line-height" => "font",
        "width" | "height" | "inline-size" | "block-size" | "min-width" | "max-width"
        | "min-height" | "max-height" | "min-inline-size" | "max-inline-size"
        | "min-block-size" | "max-block-size" => "size",
        p if p.starts_with("place-") || p.starts_with("align-") || p.starts_with("justify-") => {
            "alignment"
        }
        p if p.starts_with("white-space") || p.starts_with("text-") => "text",
        _ => property.split('-').next().unwrap_or(property),
    }
}

/// A CSS value as a class value: each whitespace run becomes one `_`, and an authored
/// underscore the class would read as a space is escaped. The engine verifies the result.
fn encoded(value: &str) -> String {
    let mut output = String::with_capacity(value.len());
    let mut authored = Vec::new();
    let mut quote = None;
    let mut characters = value.chars().peekable();
    while let Some(character) = characters.next() {
        if let Some(current) = quote {
            output.push(character);
            if character == current {
                quote = None;
            } else if character == '\\'
                && let Some(next) = characters.next()
            {
                output.push(next);
            }
            continue;
        }
        match character {
            '\'' | '"' => {
                quote = Some(character);
                output.push(character);
            }
            '\\' => {
                output.push(character);
                if let Some(next) = characters.next() {
                    output.push(next);
                }
            }
            '_' => {
                authored.push(output.len());
                output.push('_');
            }
            _ if character.is_ascii_whitespace() => {
                while characters.next_if(char::is_ascii_whitespace).is_some() {}
                output.push('_');
            }
            _ => output.push(character),
        }
    }
    // Decoding replaces bytes in place, so offsets line up with `output`.
    let decoded = mastercss_lexer::decode_native_value(&output);
    let mut result = String::with_capacity(output.len() + authored.len());
    let mut copied = 0;
    for index in authored {
        if decoded.as_bytes()[index] == b' ' {
            result.push_str(&output[copied..index]);
            result.push('\\');
            copied = index;
        }
    }
    result.push_str(&output[copied..]);
    result
}

fn numeric_argument(value: &str) -> Option<&str> {
    let tokens = tokenize_css_syntax(value);
    match tokens.as_slice() {
        [token] => match &token.kind {
            Kind::Number(number) => Some(number),
            Kind::Dimension(number, unit) if unit.eq_ignore_ascii_case("px") => Some(number),
            _ => None,
        },
        _ => None,
    }
}

// Keep importance and duplicate declarations: the conflict-analysis collector
// intentionally removes both and is unsuitable for equivalence verification.
fn rule_declarations(source: &str) -> Vec<(String, String)> {
    let tokens = tokenize_css_syntax(source);
    collect_css_syntax_statements(&tokens)
        .iter()
        .filter(|statement| statement.declaration)
        .filter_map(|statement| {
            let items = &tokens[statement.tokens.clone()];
            let Kind::Ident(property) = &items.first()?.kind else {
                return None;
            };
            let values = items.get(2..)?;
            Some((
                property.to_string(),
                source[values.first()?.bytes.start..values.last()?.bytes.end].into(),
            ))
        })
        .collect()
}

fn same_declarations(actual: &[(String, String)], expected: &[(String, String)]) -> bool {
    if actual == expected {
        return true;
    }
    let ([(property, value)], [(expected_property, expected_value)]) = (actual, expected) else {
        return false;
    };
    if property != expected_property {
        return false;
    }
    let value = tokenize_css_syntax(value);
    let expected_value = tokenize_css_syntax(expected_value);
    if value
        .iter()
        .map(|t| &t.kind)
        .eq(expected_value.iter().map(|t| &t.kind))
    {
        return true;
    }
    // The preset number utilities deliberately retain calc(n * 1px). Recognize
    // only that identity, with the same nonnegative finite number and importance.
    // Negative literal lengths can be invalid at parse time while calc() clamps
    // them at computed-value time (e.g. padding); do not change that behavior.
    let (Some(actual), Some(expected)) = (value.get(..5), expected_value.first()) else {
        return false;
    };
    matches!((&actual[0].kind, &actual[1].kind, &actual[2].kind, &actual[3].kind, &actual[4].kind, &expected.kind),
        (Kind::Function(function), Kind::Number(n), Kind::Delim('*'), Kind::Dimension("1", unit), Kind::Delim(')'), Kind::Dimension(other, other_unit))
        if function.eq_ignore_ascii_case("calc") && n == other
            && n.parse::<f64>().is_ok_and(|number| number.is_finite() && number >= 0.0)
            && unit.eq_ignore_ascii_case("px") && other_unit.eq_ignore_ascii_case("px"))
        && value[5..]
            .iter()
            .map(|t| &t.kind)
            .eq(expected_value[1..].iter().map(|t| &t.kind))
}

impl LintSession {
    pub fn suggest_classes(&self, source: &str) -> Result<ClassSuggestions, EngineError> {
        let manifest_json = self.engine.manifest_json()?; // also checks disposal
        if source.len() > 32_768 {
            return Ok(ClassSuggestions::preserved(
                source,
                "Use a declaration block of at most 32 KiB.",
            ));
        }
        let Some(declarations) = parse(source) else {
            return Ok(ClassSuggestions::preserved(
                source,
                "Keep this block in native CSS: nested rules, custom or unknown properties, comments, escapes, resource URLs, or unrepresentable values require review.",
            ));
        };
        let mut groups = HashSet::new();
        if declarations
            .iter()
            .any(|d| d.property == "all" || !groups.insert(group(&d.property)))
        {
            return Ok(ClassSuggestions::preserved(
                source,
                "Keep the complete block in native CSS to preserve overlapping properties, duplicates and fallback order.",
            ));
        }
        let manifest: serde_json::Value =
            serde_json::from_str(&manifest_json).expect("validated manifest");
        let utilities: Vec<UtilityDefinition> = serde_json::from_value(
            manifest
                .get("utilities")
                .cloned()
                .unwrap_or_else(|| serde_json::json!([])),
        )
        .expect("validated utilities");
        let mut result = ClassSuggestions {
            version: 1, status: "suggested", classes: vec![], css: String::new(), remaining_css: String::new(), declarations: vec![],
            notes: vec!["Declaration output is checked against the active manifest. Moving styles into utilities can change cascade winners; review the surrounding styles and browser states. CSS value validity and browser support are separate checks.".into()],
            verification: SuggestionVerification { declarations: true, cascade: false, browser: false },
        };
        for declaration in declarations {
            let important = if declaration.important { "!" } else { "" };
            let native = format!(
                "({}:{}){important}",
                declaration.property,
                encoded(&declaration.value)
            );
            let source_rules = self.engine.inspect(&native)?.rules;
            if source_rules.len() != 1 {
                return Ok(ClassSuggestions::preserved(
                    source,
                    "A declaration cannot be represented by a single native class. Keep the complete block in CSS.",
                ));
            }
            let expected = rule_declarations(&source_rules[0].text);
            let original = vec![(
                declaration.property.clone(),
                format!(
                    "{}{}",
                    declaration.value,
                    if declaration.important {
                        "!important"
                    } else {
                        ""
                    }
                ),
            )];
            if !same_declarations(&expected, &original) {
                return Ok(ClassSuggestions::preserved(
                    source,
                    "Master generation changes the authored declaration, for example through inline theme substitution. Keep the complete original CSS block.",
                ));
            }
            let mut candidates: Vec<(u8, String)> = vec![];
            for utility in &utilities {
                let recipe = &utility.recipe;
                if !matches!(recipe.body.as_slice(), [MixinNode::Declaration { property, .. }] if property == &declaration.property)
                {
                    continue;
                }
                match utility.kind {
                    UtilityKind::Static => {
                        candidates.push((1, format!("{}{important}", recipe.name)))
                    }
                    UtilityKind::Function if matches!(recipe.parameters.as_slice(), [p] if matches!(p.syntax, Some(MixinParameterSyntax::Number | MixinParameterSyntax::Integer))) => {
                        if let Some(argument) = numeric_argument(&declaration.value) {
                            candidates.push((2, format!("{}({argument}){important}", recipe.name)));
                        }
                    }
                    UtilityKind::Token => {
                        if let Some(parameter) = recipe.parameters.first()
                            && let Some(variable) = declaration
                                .value
                                .strip_prefix("var(")
                                .and_then(|v| v.strip_suffix(')'))
                            && let Some(key) = variable
                                .trim()
                                .strip_prefix(&format!("{}-", parameter.name))
                        {
                            candidates.push((0, format!("{}-{key}{important}", recipe.name)));
                        }
                    }
                    _ => {}
                }
            }
            candidates.sort_by(|a, b| {
                a.0.cmp(&b.0)
                    .then(a.1.len().cmp(&b.1.len()))
                    .then(a.1.cmp(&b.1))
            });
            let mut selected = native;
            for (_, candidate) in candidates {
                let rules = self.engine.inspect(&candidate)?.rules;
                if rules.len() == 1
                    && rules[0].layer == source_rules[0].layer
                    && same_declarations(&rule_declarations(&rules[0].text), &expected)
                    && rules[0].variable_names == source_rules[0].variable_names
                {
                    selected = candidate;
                    break;
                }
            }
            result.classes.push(selected.clone());
            result.declarations.push(SuggestedDeclaration {
                property: declaration.property,
                value: declaration.value,
                important: declaration.important,
                class_name: selected,
            });
        }
        let mut engine = EngineSession::create(&manifest_json)?;
        engine.ensure_class_rules(&result.classes)?;
        result.css = engine.css_text();
        Ok(result)
    }
}

#[cfg(test)]
mod tests;
