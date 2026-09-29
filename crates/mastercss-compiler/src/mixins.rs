//! CSS mixin authoring to dependency-light, ordered execution IR.
use mastercss_lexer::{CssSyntaxKind as Kind, collect_css_syntax_statements, tokenize_css_syntax};
use mastercss_schema::{
    MixinDefinition, MixinNode, MixinParameter, MixinParameterSyntax, MixinValue, MixinValuePart,
};

pub(crate) fn reject_placeholder(source: &str, filename: &str) -> Result<(), crate::CompilerError> {
    let tokens = tokenize_css_syntax(source);
    let mut index = 0;
    while index < tokens.len() {
        let token = &tokens[index];
        if matches!(&token.kind, Kind::Function(name) if name.eq_ignore_ascii_case("url")) {
            index = token.close.unwrap_or(index) + 1;
            continue;
        }
        if matches!(&token.kind, Kind::Function(name) if name == "--master-value") {
            return Err(crate::ranged_directive_diagnostic(
                source,
                filename,
                token.bytes.start,
                token.bytes.end,
                mastercss_schema::ErrorCode::CssDirectiveError,
                "--master-value() was removed; use var(--parameter) inside @mixin",
            ));
        }
        index += 1;
    }
    Ok(())
}

pub(crate) fn value(source: &str) -> Result<MixinValue, String> {
    let tokens = tokenize_css_syntax(source);
    let mut output = Vec::new();
    let mut index = 0;
    let mut end = 0;
    while index < tokens.len() {
        let token = &tokens[index];
        if let Kind::Function(name) = &token.kind {
            let close = token.close.ok_or("Unclosed function in mixin value")?;
            // URL contents are not an interpolation surface.
            if name.eq_ignore_ascii_case("url") {
                index = close + 1;
                continue;
            }
            if name == "--master-value" {
                return Err("--master-value() was removed; use a mixin parameter".into());
            }
            if token.bytes.start > end {
                output.push(MixinValuePart::Text {
                    value: source[end..token.bytes.start].into(),
                });
            }
            output.push(MixinValuePart::Function {
                name: name.to_string(),
                value: value(&source[token.bytes.end..tokens[close].bytes.start])?,
            });
            end = tokens[close].bytes.end;
            index = close + 1;
        } else {
            index += 1;
        }
    }
    if end < source.len() {
        output.push(MixinValuePart::Text {
            value: source[end..].into(),
        });
    }
    Ok(output)
}

fn arguments(source: &str) -> Result<Vec<&str>, String> {
    if source.trim().is_empty() {
        return Ok(Vec::new());
    }
    let tokens = tokenize_css_syntax(source);
    let mut result = Vec::new();
    let mut start = 0;
    let mut index = 0;
    while index < tokens.len() {
        let token = &tokens[index];
        match token.kind {
            Kind::Function(_) | Kind::Delim('(' | '[' | '{') => {
                index = token.close.ok_or("Unclosed argument")?
            }
            Kind::Delim(',') => {
                result.push(source[start..token.bytes.start].trim());
                start = token.bytes.end;
            }
            _ => {}
        }
        index += 1;
    }
    result.push(source[start..].trim());
    if result.iter().any(|value| value.is_empty()) {
        return Err("Empty mixin argument".into());
    }
    Ok(result)
}

fn header(source: &str) -> Result<(String, Option<&str>), String> {
    let tokens = tokenize_css_syntax(source);
    match tokens.first() {
        Some(token) => match &token.kind {
            Kind::Ident(name) if tokens.len() == 1 && name.starts_with("--") => {
                Ok((name.to_string(), None))
            }
            Kind::Function(name) if name.starts_with("--") => {
                let close = token.close.ok_or("Unclosed mixin parameter list")?;
                if close + 1 != tokens.len() {
                    return Err("Unexpected content after mixin argument list".into());
                }
                Ok((
                    name.to_string(),
                    Some(&source[token.bytes.end..tokens[close].bytes.start]),
                ))
            }
            _ => Err("Mixins require a dashed name, for example --grid-cols(3)".into()),
        },
        None => Err("Missing mixin name".into()),
    }
}

pub(crate) fn application(source: &str) -> Result<(String, Vec<MixinValue>), String> {
    let (name, params) = header(source)?;
    let args = arguments(params.unwrap_or_default())?
        .into_iter()
        .map(value)
        .collect::<Result<_, _>>()?;
    Ok((name, args))
}

pub(crate) fn definition(prelude: &str, source: &str) -> Result<MixinDefinition, String> {
    let (name, params) = header(prelude)?;
    if !mastercss_lexer::valid_utility_name(name.trim_start_matches("--")) {
        return Err("Mixin names cannot contain Master class delimiters".into());
    }
    let mut parameters = Vec::new();
    for param in arguments(params.unwrap_or_default())? {
        let tokens = tokenize_css_syntax(param);
        let first = tokens.first().ok_or("Missing parameter name")?;
        let Kind::Ident(parameter_name) = &first.kind else {
            return Err("Mixin parameters require custom property names".into());
        };
        if !parameter_name.starts_with("--") {
            return Err("Mixin parameter names must begin with --".into());
        }
        let rest = param[first.bytes.end..].trim();
        let (syntax, rest) = if let Some(rest) = rest.strip_prefix('<') {
            let (syntax, rest) = rest.split_once('>').ok_or("Unclosed parameter type")?;
            let syntax = match syntax {
                "integer" => MixinParameterSyntax::Integer,
                "number" => MixinParameterSyntax::Number,
                "string" => MixinParameterSyntax::String,
                "custom-ident" => MixinParameterSyntax::CustomIdent,
                _ => {
                    return Err(format!(
                        "Unsupported static mixin parameter type <{syntax}>"
                    ));
                }
            };
            (Some(syntax), rest.trim())
        } else {
            (None, rest)
        };
        let default = if rest.is_empty() {
            None
        } else {
            Some(
                rest.strip_prefix(':')
                    .ok_or("Expected : before mixin parameter default")?
                    .trim()
                    .to_owned(),
            )
        };
        let parameter = MixinParameter {
            name: parameter_name.to_string(),
            syntax,
            default,
            source: None,
        };
        if parameters
            .iter()
            .any(|previous: &MixinParameter| previous.name == parameter.name)
        {
            return Err(format!("Duplicate parameter {}", parameter.name));
        }
        if let Some(default) = &parameter.default {
            mastercss_engine::validate_mixin_argument(&parameter, default)?;
        }
        parameters.push(parameter);
    }
    let wrapped = format!("x{{{source}}}");
    let tokens = tokenize_css_syntax(&wrapped);
    let statements = collect_css_syntax_statements(&tokens);
    fn nodes(
        source: &str,
        tokens: &[mastercss_lexer::CssSyntaxToken<'_>],
        statements: &[mastercss_lexer::CssSyntaxStatement],
        parent: usize,
        parameters: &[MixinParameter],
    ) -> Result<Vec<MixinNode>, String> {
        let mut children = statements
            .iter()
            .enumerate()
            .filter(|(_, statement)| statement.parent == Some(parent))
            .collect::<Vec<_>>();
        children.sort_by_key(|(_, statement)| statement.tokens.start);
        let mut output = Vec::new();
        for (index, statement) in children {
            let first = &tokens[statement.tokens.start];
            let end = tokens[statement.tokens.end - 1].bytes.end;
            let prelude = source[first.bytes.start..end].trim();
            if statement.declaration {
                let Kind::Ident(property) = &first.kind else {
                    unreachable!()
                };
                if parameters
                    .iter()
                    .any(|parameter| parameter.name == property.as_ref())
                {
                    return Err(format!("Mixin parameter {property} cannot be reassigned"));
                }
                let start = tokens[statement.tokens.start + 1].bytes.end;
                output.push(MixinNode::Declaration {
                    property: property.to_string(),
                    value: value(source[start..end].trim())?,
                    source: None,
                });
            } else if let Kind::AtKeyword(name) = &first.kind {
                match name.as_ref() {
                    "apply" if !statement.has_block => {
                        let (name, arguments) = application(source[first.bytes.end..end].trim())?;
                        output.push(MixinNode::Apply {
                            name,
                            arguments,
                            source: None,
                        });
                    }
                    "media" | "supports" | "container" | "starting-style" | "variant"
                        if statement.has_block =>
                    {
                        if tokenize_css_syntax(prelude).iter().any(|token| matches!(&token.kind, Kind::Function(name) if name.eq_ignore_ascii_case("var") || name.eq_ignore_ascii_case("ident"))) { return Err("Mixin parameters cannot be substituted into condition preludes".into()); }
                        output.push(MixinNode::Condition {
                            condition: prelude.into(),
                            body: nodes(source, tokens, statements, index, parameters)?,
                        });
                    }
                    _ => {
                        return Err(format!(
                            "@{name} is not supported in the static mixin subset"
                        ));
                    }
                }
            } else if statement.has_block {
                if tokenize_css_syntax(prelude).iter().any(|token| matches!(&token.kind, Kind::Function(name) if name.eq_ignore_ascii_case("var") || name.eq_ignore_ascii_case("ident"))) { return Err("Mixin parameters cannot be substituted into selectors".into()); }
                output.push(MixinNode::Rule {
                    selector: prelude.into(),
                    body: nodes(source, tokens, statements, index, parameters)?,
                });
            } else {
                return Err(format!("Invalid mixin body statement: {prelude}"));
            }
        }
        Ok(output)
    }
    let body = nodes(&wrapped, &tokens, &statements, 0, &parameters)?;
    Ok(MixinDefinition {
        name,
        parameters,
        body,
        source: None,
    })
}

/// Resolve definition overrides and named conditions once, before shipping IR.
pub(crate) fn resolve_definitions(
    manifest: &mut serde_json::Value,
    registry: &crate::custom_media::Registry,
) -> Result<(), crate::CompilerError> {
    let Some(raw) = manifest.get("mixins") else {
        return Ok(());
    };
    let fail = crate::manifest::definition_error;
    let mut definitions: Vec<MixinDefinition> =
        serde_json::from_value(raw.clone()).map_err(|error| fail(error.to_string()))?;
    let mut seen = std::collections::HashSet::new();
    definitions.reverse();
    definitions.retain(|definition| seen.insert(definition.name.clone()));
    definitions.reverse();
    mastercss_engine::validate_mixins(&definitions).map_err(fail)?;
    manifest["mixins"] = serde_json::to_value(&definitions).expect("mixins");
    let engine = mastercss_engine::EngineSession::create(&manifest.to_string())
        .map_err(|error| fail(error.to_string()))?;
    fn resolve(
        nodes: &[MixinNode],
        engine: &mastercss_engine::EngineSession,
        registry: &crate::custom_media::Registry,
    ) -> Result<Vec<MixinNode>, crate::CompilerError> {
        let mut output = Vec::new();
        for node in nodes {
            match node {
                MixinNode::Rule { selector, body } => output.push(MixinNode::Rule {
                    selector: selector.clone(),
                    body: resolve(body, engine, registry)?,
                }),
                MixinNode::Condition { condition, body } => {
                    let body = resolve(body, engine, registry)?;
                    if let Some(variant) = condition.strip_prefix("@variant ") {
                        let name = variant.trim().trim_start_matches('@');
                        let branches = engine
                            .composition_rules(&format!("display:block@{name}"))
                            .map_err(|error| {
                            crate::manifest::definition_error(error.to_string())
                        })?;
                        if branches.is_empty()
                            && !engine.has_named_condition(name).map_err(|error| {
                                crate::manifest::definition_error(error.to_string())
                            })?
                        {
                            return Err(crate::manifest::definition_error(format!(
                                "Unknown @variant {name}"
                            )));
                        }
                        for branch in branches {
                            let mut nodes = body.clone();
                            if branch.selector != "&" {
                                nodes = vec![MixinNode::Rule {
                                    selector: branch.selector,
                                    body: nodes,
                                }];
                            }
                            for condition in branch.conditions.into_iter().rev() {
                                nodes = vec![MixinNode::Condition {
                                    condition,
                                    body: nodes,
                                }];
                            }
                            output.extend(nodes);
                        }
                    } else {
                        for path in
                            crate::custom_media::paths(std::slice::from_ref(condition), registry)?
                        {
                            let mut nodes = body.clone();
                            for condition in path.into_iter().rev() {
                                nodes = vec![MixinNode::Condition {
                                    condition,
                                    body: nodes,
                                }];
                            }
                            output.extend(nodes);
                        }
                    }
                }
                _ => output.push(node.clone()),
            }
        }
        Ok(output)
    }
    for definition in &mut definitions {
        definition.body = resolve(&definition.body, &engine, registry)?;
    }
    manifest["mixins"] = serde_json::to_value(definitions).expect("mixins");
    Ok(())
}

/// Attach original UTF-16 declaration and parameter spans without leaking CSS
/// parser structures into execution IR. Used before URL relocation restoration.
pub(crate) fn attach_sources(
    definition: &mut MixinDefinition,
    index: &crate::source_index::SourceIndex<'_>,
    filename: &str,
    start: usize,
    body_start: usize,
    body: &str,
) {
    let source = index.text();
    let reference = |start, end| index.reference(filename, start, end);
    definition.source = reference(start, body_start + body.len() + 1);
    let header = &source[start..body_start];
    let tokens = tokenize_css_syntax(header);
    for parameter in &mut definition.parameters {
        if let Some(token) = tokens
            .iter()
            .find(|token| matches!(&token.kind, Kind::Ident(name) if name == &parameter.name))
        {
            parameter.source = reference(start + token.bytes.start, start + token.bytes.end);
        }
    }
    let wrapped = format!("x{{{body}}}");
    let tokens = tokenize_css_syntax(&wrapped);
    let statements = collect_css_syntax_statements(&tokens);
    fn attach(
        nodes: &mut [MixinNode],
        tokens: &[mastercss_lexer::CssSyntaxToken<'_>],
        statements: &[mastercss_lexer::CssSyntaxStatement],
        parent: usize,
        body_start: usize,
        reference: &impl Fn(usize, usize) -> Option<mastercss_schema::CssDirectiveSourceReference>,
    ) {
        let children = statements
            .iter()
            .enumerate()
            .filter(|(_, statement)| statement.parent == Some(parent));
        for (node, (index, statement)) in nodes.iter_mut().zip(children) {
            let start = body_start + tokens[statement.tokens.start].bytes.start - 2;
            let end = body_start + tokens[statement.tokens.end - 1].bytes.end - 2;
            match node {
                MixinNode::Declaration { source, .. } | MixinNode::Apply { source, .. } => {
                    *source = reference(start, end)
                }
                MixinNode::Rule { body, .. } | MixinNode::Condition { body, .. } => {
                    attach(body, tokens, statements, index, body_start, reference)
                }
            }
        }
    }
    attach(
        &mut definition.body,
        &tokens,
        &statements,
        0,
        body_start,
        &reference,
    );
}

pub(crate) fn visit_sources(
    definition: &mut MixinDefinition,
    visit: &mut impl FnMut(&mut Option<mastercss_schema::CssDirectiveSourceReference>),
) {
    visit(&mut definition.source);
    for parameter in &mut definition.parameters {
        visit(&mut parameter.source);
    }
    fn nodes(
        body: &mut [MixinNode],
        visit: &mut impl FnMut(&mut Option<mastercss_schema::CssDirectiveSourceReference>),
    ) {
        for node in body {
            match node {
                MixinNode::Declaration { source, .. } | MixinNode::Apply { source, .. } => {
                    visit(source)
                }
                MixinNode::Rule { body, .. } | MixinNode::Condition { body, .. } => {
                    nodes(body, visit)
                }
            }
        }
    }
    nodes(&mut definition.body, visit);
}
