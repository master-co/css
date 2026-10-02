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
    validate_argument(parameter, value, false)
}

fn validate_argument(
    parameter: &MixinParameter,
    value: &str,
    allow_var: bool,
) -> Result<(), String> {
    let tokens = tokenize_css_syntax(value);
    if tokens.is_empty() {
        return Err(format!("Missing argument {}", parameter.name));
    }
    if tokens.iter().any(|token| matches!(&token.kind, Kind::Function(name)
        if (name.eq_ignore_ascii_case("var") && !allow_var) || matches!(name.to_ascii_lowercase().as_str(), "attr" | "env" | "random" | "random-item") || name.starts_with("--"))) {
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
    validate_recipe_definitions(definitions, None)
}

fn validate_recipe_definitions(
    definitions: &[MixinDefinition],
    utility_root: Option<&str>,
) -> Result<(), String> {
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
                        contents,
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
                        if let Some(contents) = contents {
                            pending.push((contents, same_element));
                        }
                    }
                    MixinNode::Rule { selector, body } => {
                        pending.push((body, same_element && same_subject(selector)))
                    }
                    MixinNode::Condition { body, .. } | MixinNode::Contents { fallback: body } => {
                        pending.push((body, same_element))
                    }
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
        if utility_root != Some(name)
            && (!name.starts_with("--") || !mastercss_lexer::valid_utility_name(&name[2..]))
        {
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

#[derive(Clone)]
struct ContentsContext {
    nodes: Vec<MixinNode>,
    environment: HashMap<String, String>,
    outer: Option<Box<ContentsContext>>,
    stack: Vec<String>,
    safe_subject: bool,
    forbidden: HashSet<String>,
}

#[derive(Clone, Copy)]
struct Placement<'a> {
    selector: &'a str,
    conditions: &'a [String],
}

struct Expansion<'a> {
    registry: HashMap<&'a str, &'a MixinDefinition>,
    symbolic_root: Option<&'a str>,
    stack: Vec<String>,
    output: Vec<ExpandedMixinRule>,
    steps: usize,
    depth: usize,
}

impl Expansion<'_> {
    fn call(
        &mut self,
        name: &str,
        arguments: &[String],
        outer: &HashMap<String, String>,
        placement: Placement<'_>,
        forbidden: &HashSet<String>,
        contents: Option<&ContentsContext>,
    ) -> Result<(), String> {
        if self.depth >= 64 {
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
        self.depth += 1;
        if arguments.len() > definition.parameters.len() {
            return Err(format!("Too many arguments for {name}"));
        }
        let mut environment = outer.clone();
        for (index, parameter) in definition.parameters.iter().enumerate() {
            let value = arguments
                .get(index)
                .or(parameter.default.as_ref())
                .ok_or_else(|| format!("Missing argument {} for {name}", parameter.name))?;
            validate_argument(
                parameter,
                value,
                super::direct_value_mixin(definition).is_some() || self.symbolic_root == Some(name),
            )?;
            environment.insert(parameter.name.clone(), value.clone());
        }
        let mut forbidden = forbidden.clone();
        for parameter in &definition.parameters {
            forbidden.remove(&parameter.name);
        }
        self.nodes(
            &definition.body,
            &environment,
            placement,
            true,
            &forbidden,
            contents,
        )?;
        self.stack.pop();
        self.depth -= 1;
        Ok(())
    }

    fn nodes(
        &mut self,
        nodes: &[MixinNode],
        environment: &HashMap<String, String>,
        placement: Placement<'_>,
        safe_subject: bool,
        forbidden: &HashSet<String>,
        contents: Option<&ContentsContext>,
    ) -> Result<(), String> {
        let Placement {
            selector,
            conditions,
        } = placement;
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
                    let substituted = references_parameters(value, environment);
                    let value = evaluate_mixin_value(value, environment)?;
                    if substituted {
                        validate_declaration(property, &value)?;
                    }
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
                                self.stack
                                    .last()
                                    .and_then(|name| self.registry.get(name.as_str()))
                                    .and_then(|definition| definition.source.clone())
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
                                    self.stack
                                        .last()
                                        .and_then(|name| self.registry.get(name.as_str()))
                                        .and_then(|definition| definition.source.clone())
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
                        Placement {
                            selector: &next,
                            conditions,
                        },
                        safe_subject && same_subject(child),
                        forbidden,
                        contents,
                    )?;
                }
                MixinNode::Condition { condition, body } => {
                    let mut next = conditions.to_vec();
                    next.push(condition.clone());
                    self.nodes(
                        body,
                        environment,
                        Placement {
                            selector,
                            conditions: &next,
                        },
                        safe_subject,
                        forbidden,
                        contents,
                    )?;
                }
                MixinNode::Contents { fallback } => {
                    if let Some(context) = contents {
                        let stack = std::mem::replace(&mut self.stack, context.stack.clone());
                        let result = self.nodes(
                            &context.nodes,
                            &context.environment,
                            placement,
                            safe_subject && context.safe_subject,
                            &context.forbidden,
                            context.outer.as_deref(),
                        );
                        self.stack = stack;
                        result?;
                    } else {
                        self.nodes(
                            fallback,
                            environment,
                            placement,
                            safe_subject,
                            forbidden,
                            None,
                        )?;
                    }
                }
                MixinNode::Apply {
                    name,
                    arguments,
                    contents: body,
                    ..
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
                    let passed = body.as_ref().map(|nodes| ContentsContext {
                        nodes: nodes.clone(),
                        environment: environment.clone(),
                        outer: contents.cloned().map(Box::new),
                        stack: self.stack.clone(),
                        safe_subject,
                        forbidden: forbidden.clone(),
                    });
                    self.call(
                        name,
                        &arguments,
                        environment,
                        placement,
                        &forbidden,
                        passed.as_ref(),
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
    expand_mixin_with_contents(definitions, name, arguments, None)
}

pub fn expand_mixin_with_contents(
    definitions: &[MixinDefinition],
    name: &str,
    arguments: &[String],
    contents: Option<&[MixinNode]>,
) -> Result<Vec<ExpandedMixinRule>, String> {
    let mut expansion = Expansion {
        symbolic_root: None,
        registry: definitions
            .iter()
            .map(|definition| (definition.name.as_str(), definition))
            .collect(),
        stack: Vec::new(),
        output: Vec::new(),
        steps: 0,
        depth: 0,
    };
    let contents = contents.map(|nodes| ContentsContext {
        nodes: nodes.to_vec(),
        environment: HashMap::new(),
        outer: None,
        stack: Vec::new(),
        safe_subject: true,
        forbidden: HashSet::new(),
    });
    if let Err(message) = expansion.call(
        name,
        arguments,
        &HashMap::new(),
        Placement {
            selector: "&",
            conditions: &[],
        },
        &HashSet::new(),
        contents.as_ref(),
    ) {
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

/// Execute an already compiled caller body without inventing a named definition.
pub(crate) fn expand_body(
    definitions: &[MixinDefinition],
    body: &[MixinNode],
) -> Result<Vec<ExpandedMixinRule>, String> {
    let mut expansion = Expansion {
        symbolic_root: None,
        registry: definitions
            .iter()
            .map(|definition| (definition.name.as_str(), definition))
            .collect(),
        stack: Vec::new(),
        output: Vec::new(),
        steps: 0,
        depth: 0,
    };
    expansion.nodes(
        body,
        &HashMap::new(),
        Placement {
            selector: "&",
            conditions: &[],
        },
        true,
        &HashSet::new(),
        None,
    )?;
    Ok(expansion.output)
}

/// Utility recipes have their own registration namespace. Only token-value
/// binding permits symbolic arguments for general bodies; native calls retain
/// their existing static evaluation contract.
pub fn expand_utility(
    mixins: &[MixinDefinition],
    definition: &mastercss_schema::UtilityDefinition,
    arguments: &[String],
) -> Result<Vec<ExpandedMixinRule>, String> {
    let recipe = &definition.recipe;
    let mut expansion = Expansion {
        registry: mixins
            .iter()
            .map(|item| (item.name.as_str(), item))
            .collect(),
        symbolic_root: (definition.kind == mastercss_schema::UtilityKind::Token
            && recipe.parameters[0].syntax.is_none())
        .then_some(recipe.name.as_str()),
        stack: Vec::new(),
        output: Vec::new(),
        steps: 0,
        depth: 0,
    };
    expansion.registry.insert(&recipe.name, recipe);
    expansion.call(
        &recipe.name,
        arguments,
        &HashMap::new(),
        Placement {
            selector: "&",
            conditions: &[],
        },
        &HashSet::new(),
        None,
    )?;
    Ok(expansion.output)
}

pub fn validate_utilities(
    mixins: &[MixinDefinition],
    definitions: &[mastercss_schema::UtilityDefinition],
) -> Result<(), String> {
    use mastercss_schema::UtilityKind;
    for definition in definitions {
        let recipe = &definition.recipe;
        if recipe.name.starts_with("--")
            || !mastercss_lexer::valid_utility_name(&recipe.name)
            || recipe.name.ends_with('-')
        {
            return Err(format!("Invalid utility name {}", recipe.name));
        }
        match definition.kind {
            UtilityKind::Static if !recipe.parameters.is_empty() => {
                return Err("Static utilities cannot have parameters".into());
            }
            UtilityKind::Token => {
                let [parameter] = recipe.parameters.as_slice() else {
                    return Err("Token patterns require exactly one parameter".into());
                };
                if parameter.default.is_some()
                    || !matches!(parameter.syntax, None | Some(MixinParameterSyntax::String))
                {
                    return Err(
                        "Token patterns accept an untyped value or <string> key, without defaults"
                            .into(),
                    );
                }
            }
            _ => {}
        }
        let mut registry = mixins.to_vec();
        registry.push(recipe.clone());
        validate_recipe_definitions(&registry, Some(&recipe.name))?;
    }
    Ok(())
}
