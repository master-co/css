//! Conservative animation-name analysis over CSS token streams. This is shared
//! by class execution and compiler-delivered styles, without a stylesheet parser.
use super::{HashMap, HashSet, ManifestProjection};
use mastercss_lexer::{CssSyntaxKind as Kind, collect_css_syntax_statements, tokenize_css_syntax};

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct AnimationReferences {
    pub names: Vec<String>,
    pub retain_all: bool,
}

/// Return authored declaration values, excluding animation declarations inside
/// keyframes (which CSS ignores). Strings, comments and selector preludes are not
/// declarations. Custom properties remain opaque until used by an animation.
pub fn stylesheet_declarations(source: &str) -> Vec<(String, String)> {
    let tokens = tokenize_css_syntax(source);
    let statements = collect_css_syntax_statements(&tokens);
    statements.iter().filter_map(|statement| {
        if !statement.declaration || statement.tokens.len() < 3 { return None; }
        let mut parent = statement.parent;
        while let Some(index) = parent {
            let ancestor = &statements[index];
            if matches!(&tokens[ancestor.tokens.start].kind, Kind::AtKeyword(name) if name.eq_ignore_ascii_case("keyframes") || name.eq_ignore_ascii_case("-webkit-keyframes")) { return None; }
            parent = ancestor.parent;
        }
        let Kind::Ident(property) = &tokens[statement.tokens.start].kind else { return None; };
        let start = tokens[statement.tokens.start + 2].bytes.start;
        let end = tokens[statement.tokens.end - 1].bytes.end;
        Some((property.to_string(), source[start..end].to_owned()))
    }).collect()
}

pub(crate) fn analyze(
    declarations: &[(String, String)],
    manifest: &ManifestProjection,
) -> AnimationReferences {
    if manifest.keyframes.is_empty() {
        return AnimationReferences::default();
    }
    let mut variables = manifest.animation_variables.clone();
    for (name, value) in declarations {
        if let Some(name) = name.strip_prefix("--") {
            variables
                .entry(name.into())
                .or_default()
                .push(value.clone());
        }
    }
    let mut result = AnimationReferences::default();
    for (property, value) in declarations {
        let property = property.to_ascii_lowercase();
        let property = property.strip_prefix("-webkit-").unwrap_or(&property);
        if !matches!(property, "animation" | "animation-name") {
            continue;
        }
        let mut budget = 256;
        match resolve(
            value,
            manifest,
            &variables,
            &mut HashSet::new(),
            &mut budget,
        ) {
            Some(values) => {
                for value in values {
                    parse_names(&value, property == "animation-name", &mut result);
                }
            }
            None => result.retain_all = true,
        }
    }
    result.names.retain(|name| {
        manifest
            .keyframes
            .iter()
            .any(|definition| &definition.name == name)
    });
    result
}

fn resolve(
    value: &str,
    manifest: &ManifestProjection,
    variables: &HashMap<String, Vec<String>>,
    stack: &mut HashSet<String>,
    budget: &mut usize,
) -> Option<Vec<String>> {
    if *budget == 0 || stack.len() > 64 {
        return None;
    }
    *budget -= 1;
    let tokens = tokenize_css_syntax(value);
    let Some((index, token)) = tokens.iter().enumerate().find(|(_, token)| matches!(&token.kind, Kind::Function(name) if name.eq_ignore_ascii_case("var"))) else {
        return Some(vec![value.into()]);
    };
    let close = token.close?;
    let Kind::Ident(name) = &tokens.get(index + 1)?.kind else {
        return None;
    };
    let name = name.strip_prefix("--")?.to_owned();
    if !stack.insert(name.clone()) {
        return None;
    }
    let mut options = manifest
        .compiled_variables
        .get(&name)
        .into_iter()
        // Native catalog entries describe vocabulary, not stylesheet delivery.
        // Only the delivered animation_variables map supplies native values.
        .flat_map(|variable| {
            variable
                .values
                .iter()
                .filter(|value| value.delivery.is_none())
                .map(|value| value.value.clone())
        })
        .collect::<Vec<_>>();
    options.extend(variables.get(&name).into_iter().flatten().cloned());
    // A fallback does not prove that an externally supplied property is absent.
    // Keep the unknown branch live even when a literal fallback exists.
    if options.is_empty() {
        stack.remove(&name);
        return None;
    }
    if let Some(comma) = tokens
        .get(index + 2)
        .filter(|token| token.kind == Kind::Delim(','))
    {
        options.push(value[comma.bytes.end..tokens[close].bytes.start].into());
    }
    let mut output = Vec::new();
    for option in options {
        // !important belongs to the custom-property declaration, not its substituted value.
        let option_tokens = tokenize_css_syntax(&option);
        let option = option_tokens.iter().rev().nth(1).filter(|token| token.kind == Kind::Delim('!')).filter(|_| matches!(option_tokens.last().map(|token| &token.kind), Some(Kind::Ident(name)) if name.eq_ignore_ascii_case("important"))).map_or(option.as_str(), |token| &option[..token.bytes.start]);
        for replacement in resolve(option, manifest, variables, stack, budget)? {
            let expanded = format!(
                "{}{}{}",
                &value[..token.bytes.start],
                replacement,
                &value[tokens[close].bytes.end..]
            );
            // The replacement has been resolved; sibling uses of this variable
            // are independent, rather than a cycle.
            stack.remove(&name);
            output.extend(resolve(&expanded, manifest, variables, stack, budget)?);
            stack.insert(name.clone());
        }
    }
    stack.remove(&name);
    Some(output)
}

fn parse_names(value: &str, names_only: bool, result: &mut AnimationReferences) {
    let tokens = tokenize_css_syntax(value);
    let mut used = HashSet::new();
    let mut cursor = 0;
    while cursor < tokens.len() {
        let token = &tokens[cursor];
        let name = match &token.kind {
            Kind::Delim(',') => {
                used.clear();
                None
            }
            Kind::Delim('!') => break,
            Kind::String(name) => Some(name.to_string()),
            Kind::Ident(name) => {
                let keyword = name.to_ascii_lowercase();
                if matches!(
                    keyword.as_str(),
                    "initial" | "inherit" | "unset" | "revert" | "revert-layer"
                ) {
                    // Inherited animation names cannot be known without cascade.
                    if keyword == "inherit" || keyword.starts_with("revert") {
                        result.retain_all = true;
                    }
                    None
                } else if names_only {
                    (keyword != "none").then(|| name.to_string())
                } else {
                    let category = match keyword.as_str() {
                        "ease" | "linear" | "ease-in" | "ease-out" | "ease-in-out"
                        | "step-start" | "step-end" => Some("timing"),
                        "infinite" => Some("iteration"),
                        "normal" | "reverse" | "alternate" | "alternate-reverse" => {
                            Some("direction")
                        }
                        "none" | "forwards" | "backwards" | "both" => Some("fill"),
                        "running" | "paused" => Some("play"),
                        "auto" => Some("duration"),
                        _ => None,
                    };
                    if category.is_some_and(|category| used.insert(category)) || keyword == "none" {
                        None
                    } else {
                        Some(name.to_string())
                    }
                }
            }
            Kind::Function(name) => {
                let function = name.to_ascii_lowercase();
                if matches!(function.as_str(), "steps" | "cubic-bezier" | "linear") {
                    used.insert("timing");
                } else if !matches!(
                    function.as_str(),
                    "calc" | "min" | "max" | "clamp" | "round" | "mod" | "rem" | "abs" | "sign"
                ) {
                    result.retain_all = true;
                }
                if let Some(close) = token.close {
                    cursor = close;
                } else {
                    result.retain_all = true;
                }
                None
            }
            Kind::Number(_) => {
                used.insert("iteration");
                None
            }
            Kind::Dimension(_, _) | Kind::Percentage(_) => None,
            _ => {
                result.retain_all = true;
                None
            }
        };
        if let Some(name) = name
            && !result.names.contains(&name)
        {
            result.names.push(name);
        }
        cursor += 1;
    }
}
