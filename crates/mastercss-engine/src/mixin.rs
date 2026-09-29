//! Execution of the statically compilable mixin subset. No CSS stylesheet parser
//! or browser-dependent parameter evaluation is part of the runtime engine.
use std::collections::{HashMap, HashSet};

use mastercss_lexer::{CssSyntaxKind as Kind, css_escape, tokenize_css_syntax};
use mastercss_schema::{
    MixinDefinition, MixinNode, MixinParameter, MixinParameterSyntax, MixinValue, MixinValuePart,
};

#[derive(Debug, Clone, PartialEq)]
pub struct ExpandedMixinRule {
    pub selector: String,
    pub conditions: Vec<String>,
    pub declarations: Vec<ExpandedMixinDeclaration>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ExpandedMixinDeclaration {
    pub property: String,
    pub value: String,
    pub source: Option<mastercss_schema::CssDirectiveSourceReference>,
}

pub fn validate_mixin_argument(parameter: &MixinParameter, value: &str) -> Result<(), String> {
    let tokens = tokenize_css_syntax(value);
    if tokens.is_empty() {
        return Err(format!("Missing argument {}", parameter.name));
    }
    if tokens.iter().any(|token| matches!(&token.kind, Kind::Function(name)
        if matches!(name.to_ascii_lowercase().as_str(), "var" | "attr" | "env" | "random" | "random-item") || name.starts_with("--"))) {
        return Err(format!("Argument {} must be static; express dynamic values in native CSS", parameter.name));
    }
    if tokens
        .iter()
        .any(|token| matches!(token.kind, Kind::Delim(';' | '{' | '}' | '!')))
        || tokens.iter().any(|token| {
            matches!(token.kind, Kind::Function(_) | Kind::Delim('(' | '['))
                && token.close.is_none()
        })
    {
        return Err(format!("Invalid argument {}", parameter.name));
    }
    let wide = |name: &str| {
        matches!(
            name.to_ascii_lowercase().as_str(),
            "initial" | "inherit" | "unset" | "revert" | "revert-layer" | "default"
        )
    };
    if tokens.len() == 1 && matches!(&tokens[0].kind, Kind::Ident(name) if wide(name)) {
        return Err(format!(
            "CSS-wide argument values are not supported for {}",
            parameter.name
        ));
    }
    let valid = match parameter.syntax {
        None => true,
        Some(MixinParameterSyntax::Integer) => {
            matches!(tokens.as_slice(), [token] if matches!(token.kind, Kind::Number(number) if number.trim_start_matches(['+', '-']).chars().all(|c| c.is_ascii_digit()) && number.parse::<i64>().is_ok()))
        }
        Some(MixinParameterSyntax::Number) => {
            matches!(tokens.as_slice(), [token] if matches!(token.kind, Kind::Number(number) if number.parse::<f64>().is_ok_and(f64::is_finite)))
        }
        Some(MixinParameterSyntax::String) => {
            matches!(tokens.as_slice(), [token] if matches!(token.kind, Kind::String(_)) && value.ends_with(['\'', '"']))
        }
        Some(MixinParameterSyntax::CustomIdent) => {
            matches!(tokens.as_slice(), [token] if matches!(&token.kind, Kind::Ident(name) if !wide(name)))
        }
    };
    if valid {
        Ok(())
    } else {
        Err(format!(
            "Argument {} does not match {:?}",
            parameter.name, parameter.syntax
        ))
    }
}

/// Validate the final registry, including unused definitions. Generation being
/// lazy must not hide malformed definitions or recursive call graphs.
pub fn validate_mixins(definitions: &[MixinDefinition]) -> Result<(), String> {
    let registry = definitions
        .iter()
        .map(|definition| (definition.name.as_str(), definition))
        .collect::<HashMap<_, _>>();
    fn visit<'a>(
        name: &'a str,
        registry: &HashMap<&'a str, &'a MixinDefinition>,
        visiting: &mut HashSet<&'a str>,
        done: &mut HashSet<&'a str>,
    ) -> Result<(), String> {
        if visiting.len() >= 64 {
            return Err("Mixin call depth exceeds 64".into());
        }
        if done.contains(name) {
            return Ok(());
        }
        if !visiting.insert(name) {
            return Err(format!("Recursive mixin call involving {name}"));
        }
        let definition = registry
            .get(name)
            .ok_or_else(|| format!("Unknown mixin {name}"))?;
        let mut names = HashSet::new();
        for parameter in &definition.parameters {
            if !parameter.name.starts_with("--") || !names.insert(&parameter.name) {
                return Err(format!(
                    "Invalid or duplicate parameter {} in {name}",
                    parameter.name
                ));
            }
            if let Some(default) = &parameter.default {
                validate_mixin_argument(parameter, default)?;
            }
        }
        let parameters = definition
            .parameters
            .iter()
            .map(|parameter| (parameter.name.clone(), String::new()))
            .collect::<HashMap<_, _>>();
        let mut pending = vec![(definition.body.as_slice(), true)];
        while let Some((nodes, same_element)) = pending.pop() {
            for node in nodes {
                match node {
                    MixinNode::Apply {
                        name: target,
                        arguments,
                        ..
                    } => {
                        let target_definition = registry
                            .get(target.as_str())
                            .ok_or_else(|| format!("Unknown mixin {target}"))?;
                        if arguments.len() > target_definition.parameters.len()
                            || target_definition
                                .parameters
                                .iter()
                                .skip(arguments.len())
                                .any(|parameter| parameter.default.is_none())
                        {
                            return Err(format!("Incorrect argument count for {target} in {name}"));
                        }
                        if !same_element
                            && arguments
                                .iter()
                                .any(|value| references_parameters(value, &parameters))
                        {
                            return Err(format!(
                                "Mixin parameters cannot be passed across elements in {name}"
                            ));
                        }
                        visit(target, registry, visiting, done)?;
                    }
                    MixinNode::Rule { selector, body } => {
                        pending.push((body, same_element && same_subject(selector)))
                    }
                    MixinNode::Condition { body, .. } => pending.push((body, same_element)),
                    MixinNode::Declaration { property, .. } if names.contains(property) => {
                        return Err(format!("Mixin parameter {property} cannot be reassigned"));
                    }
                    MixinNode::Declaration { value, .. }
                        if !same_element && references_parameters(value, &parameters) =>
                    {
                        return Err(format!(
                            "Mixin parameters cannot be used across elements in {name}"
                        ));
                    }
                    _ => {}
                }
            }
        }
        visiting.remove(name);
        done.insert(name);
        Ok(())
    }
    let mut done = HashSet::new();
    for name in registry.keys() {
        if !name.starts_with("--") || !mastercss_lexer::valid_utility_name(&name[2..]) {
            return Err(format!("Invalid mixin name {name}"));
        }
        visit(name, &registry, &mut HashSet::new(), &mut done)?;
    }
    Ok(())
}

fn ident(value: &str) -> Result<String, String> {
    let mut result = String::new();
    for token in tokenize_css_syntax(value) {
        match token.kind {
            Kind::String(value) | Kind::Ident(value) => result.push_str(&value),
            Kind::Number(value) if value.parse::<i64>().is_ok() => result.push_str(value),
            _ => return Err("ident() requires static strings, identifiers or integers".into()),
        }
    }
    if result.is_empty() {
        return Err("ident() cannot produce an empty identifier".into());
    }
    Ok(css_escape(&result))
}

pub fn evaluate_mixin_value(
    value: &MixinValue,
    environment: &HashMap<String, String>,
) -> Result<String, String> {
    let mut output = String::new();
    for part in value {
        match part {
            MixinValuePart::Text { value } => output.push_str(value),
            MixinValuePart::Function { name, value } => {
                let inner = evaluate_mixin_value(value, environment)?;
                if name.eq_ignore_ascii_case("var")
                    && let Some(argument) = parameter_value(&inner, environment)
                {
                    output.push_str(argument);
                    continue;
                }
                if name.eq_ignore_ascii_case("ident") {
                    output.push_str(&ident(&inner)?);
                } else {
                    output.push_str(name);
                    output.push('(');
                    output.push_str(&inner);
                    output.push(')');
                }
            }
        }
    }
    Ok(output)
}

fn parameter_value<'a>(
    inner: &str,
    environment: &'a HashMap<String, String>,
) -> Option<&'a String> {
    let parts = super::split_top_level(inner, ',');
    let tokens = tokenize_css_syntax(parts.first()?.trim());
    match tokens.as_slice() {
        [token] => match &token.kind {
            Kind::Ident(name) => environment.get(name.as_ref()),
            _ => None,
        },
        _ => None,
    }
}

fn references_parameters(value: &MixinValue, environment: &HashMap<String, String>) -> bool {
    value.iter().any(|part| match part {
        MixinValuePart::Text { .. } => false,
        MixinValuePart::Function { name, value } => {
            (name.eq_ignore_ascii_case("var")
                && evaluate_mixin_value(value, &HashMap::new())
                    .is_ok_and(|inner| parameter_value(&inner, environment).is_some()))
                || references_parameters(value, environment)
        }
    })
}

/// A nested selector stays on the invoking element only when it is one compound
/// rooted at &, with no pseudo-element. Functional pseudo-classes may contain
/// selector arguments, but do not change the compound's subject.
fn same_subject(selector: &str) -> bool {
    super::split_top_level(selector, ',').iter().all(|branch| {
        let branch = branch.trim();
        let tokens = tokenize_css_syntax(branch);
        let mut index = 0;
        let mut ampersands = 0;
        let mut subject = false;
        let mut previous_end = 0;
        while index < tokens.len() {
            let token = &tokens[index];
            if branch[previous_end..token.bytes.start].chars().any(char::is_whitespace) {
                subject = false;
            }
            match &token.kind {
                Kind::Delim('&') => { ampersands += 1; subject = true; }
                Kind::Delim('>' | '+' | '~' | '|') => subject = false,
                Kind::Delim(':') if tokens.get(index + 1).is_some_and(|next| next.kind == Kind::Delim(':') || matches!(&next.kind, Kind::Ident(name) if matches!(name.as_ref(), "before" | "after" | "first-letter" | "first-line"))) => return false,
                Kind::Function(_) | Kind::Delim('[') => {
                    let Some(close) = token.close else { return false; };
                    index = close;
                }
                _ => {}
            }
            previous_end = tokens[index].bytes.end;
            index += 1;
        }
        ampersands == 1 && subject
    })
}

fn validate_declaration(property: &str, value: &str) -> Result<(), String> {
    let tokens = tokenize_css_syntax(value);
    let property = property.to_ascii_lowercase();
    for (index, token) in tokens.iter().enumerate() {
        let positive = matches!(&token.kind, Kind::Function(name) if name.eq_ignore_ascii_case("repeat"))
            || (matches!(property.as_str(), "grid-column" | "grid-row")
                && matches!(&token.kind, Kind::Ident(name) if name.eq_ignore_ascii_case("span")));
        if positive
            && let Some(Kind::Number(number)) = tokens.get(index + 1).map(|next| &next.kind)
            && number
                .parse::<f64>()
                .is_ok_and(|number| number <= 0.0 || number.fract() != 0.0)
        {
            return Err(format!("{property} requires a positive integer"));
        }
    }
    if property == "-webkit-line-clamp"
        && matches!(tokens.first().map(|token| &token.kind), Some(Kind::Number(number)) if number.parse::<f64>().is_ok_and(|number| number <= 0.0 || number.fract() != 0.0))
    {
        return Err("-webkit-line-clamp requires a positive integer".into());
    }
    Ok(())
}

struct Expansion<'a> {
    registry: HashMap<&'a str, &'a MixinDefinition>,
    stack: Vec<String>,
    output: Vec<ExpandedMixinRule>,
    steps: usize,
}

impl Expansion<'_> {
    fn call(
        &mut self,
        name: &str,
        arguments: &[String],
        outer: &HashMap<String, String>,
        selector: &str,
        conditions: &[String],
        forbidden: &HashSet<String>,
    ) -> Result<(), String> {
        if self.stack.len() >= 64 {
            return Err("Mixin call depth exceeds 64".into());
        }
        if self.stack.iter().any(|value| value == name) {
            return Err(format!("Recursive mixin call {name}"));
        }
        let definition = *self
            .registry
            .get(name)
            .ok_or_else(|| format!("Unknown mixin {name}"))?;
        self.stack.push(name.into());
        if arguments.len() > definition.parameters.len() {
            return Err(format!("Too many arguments for {name}"));
        }
        let mut environment = outer.clone();
        for (index, parameter) in definition.parameters.iter().enumerate() {
            let value = arguments
                .get(index)
                .or(parameter.default.as_ref())
                .ok_or_else(|| format!("Missing argument {} for {name}", parameter.name))?;
            validate_mixin_argument(parameter, value)?;
            environment.insert(parameter.name.clone(), value.clone());
        }
        let mut forbidden = forbidden.clone();
        for parameter in &definition.parameters {
            forbidden.remove(&parameter.name);
        }
        self.nodes(
            &definition.body,
            &environment,
            selector,
            conditions,
            true,
            &forbidden,
        )?;
        self.stack.pop();
        Ok(())
    }

    fn nodes(
        &mut self,
        nodes: &[MixinNode],
        environment: &HashMap<String, String>,
        selector: &str,
        conditions: &[String],
        safe_subject: bool,
        forbidden: &HashSet<String>,
    ) -> Result<(), String> {
        for node in nodes {
            self.steps += 1;
            if self.steps > 100000 {
                return Err("Mixin expansion exceeds 100000 body nodes".into());
            }
            match node {
                MixinNode::Declaration {
                    property,
                    value,
                    source,
                } => {
                    if environment.contains_key(property) {
                        return Err(format!("Mixin parameter {property} cannot be reassigned"));
                    }
                    if (!safe_subject && references_parameters(value, environment))
                        || references_parameters(
                            value,
                            &environment
                                .iter()
                                .filter(|(name, _)| forbidden.contains(*name))
                                .map(|(name, value)| (name.clone(), value.clone()))
                                .collect(),
                        )
                    {
                        return Err(
                            "Mixin parameters cannot be used across elements in the static subset"
                                .into(),
                        );
                    }
                    let value = evaluate_mixin_value(value, environment)?;
                    validate_declaration(property, &value)?;
                    // One declaration per fragment preserves duplicates and all
                    // interleaving with nested rules. Adjacent runs are joined below.
                    if let Some(previous) = self
                        .output
                        .last_mut()
                        .filter(|rule| rule.selector == selector && rule.conditions == conditions)
                    {
                        previous.declarations.push(ExpandedMixinDeclaration {
                            property: property.clone(),
                            value,
                            source: source.clone().or_else(|| {
                                self.registry[self.stack.last().expect("active call").as_str()]
                                    .source
                                    .clone()
                            }),
                        });
                    } else {
                        self.output.push(ExpandedMixinRule {
                            selector: selector.into(),
                            conditions: conditions.into(),
                            declarations: vec![ExpandedMixinDeclaration {
                                property: property.clone(),
                                value,
                                source: source.clone().or_else(|| {
                                    self.registry[self.stack.last().expect("active call").as_str()]
                                        .source
                                        .clone()
                                }),
                            }],
                        });
                    }
                }
                MixinNode::Rule {
                    selector: child,
                    body,
                } => {
                    let next = mastercss_lexer::replace_nesting_selector(child, selector)
                        .unwrap_or_else(|| format!("{selector} {child}"));
                    self.nodes(
                        body,
                        environment,
                        &next,
                        conditions,
                        safe_subject && same_subject(child),
                        forbidden,
                    )?;
                }
                MixinNode::Condition { condition, body } => {
                    let mut next = conditions.to_vec();
                    next.push(condition.clone());
                    self.nodes(body, environment, selector, &next, safe_subject, forbidden)?;
                }
                MixinNode::Apply {
                    name, arguments, ..
                } => {
                    if arguments.iter().any(|argument| {
                        (!safe_subject && references_parameters(argument, environment))
                            || references_parameters(
                                argument,
                                &environment
                                    .iter()
                                    .filter(|(name, _)| forbidden.contains(*name))
                                    .map(|(name, value)| (name.clone(), value.clone()))
                                    .collect(),
                            )
                    }) {
                        return Err(
                            "Mixin arguments cannot reference parameters across elements".into(),
                        );
                    }
                    let arguments = arguments
                        .iter()
                        .map(|argument| evaluate_mixin_value(argument, environment))
                        .collect::<Result<Vec<_>, _>>()?;
                    let mut forbidden = forbidden.clone();
                    if !safe_subject {
                        forbidden.extend(environment.keys().cloned());
                    }
                    self.call(
                        name,
                        &arguments,
                        environment,
                        selector,
                        conditions,
                        &forbidden,
                    )?;
                }
            }
        }
        Ok(())
    }
}

pub fn expand_mixin(
    definitions: &[MixinDefinition],
    name: &str,
    arguments: &[String],
) -> Result<Vec<ExpandedMixinRule>, String> {
    let mut expansion = Expansion {
        registry: definitions
            .iter()
            .map(|definition| (definition.name.as_str(), definition))
            .collect(),
        stack: Vec::new(),
        output: Vec::new(),
        steps: 0,
    };
    if let Err(message) =
        expansion.call(name, arguments, &HashMap::new(), "&", &[], &HashSet::new())
    {
        let definition = expansion.stack.last().map(String::as_str).unwrap_or(name);
        let location = expansion
            .registry
            .get(definition)
            .and_then(|definition| definition.source.as_ref());
        return Err(match location {
            Some(source) => format!(
                "{message}; {definition} defined at {}:{}",
                source.file.as_deref().unwrap_or("stylesheet.css"),
                source.range.start
            ),
            None => message,
        });
    }
    Ok(expansion.output)
}
