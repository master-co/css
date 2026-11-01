use crate::{CompilerError, CssDirectiveManifestInput, CssOutputMapping};
use mastercss_lexer::{
    CssSyntaxKind as Kind, byte_to_utf16_offset, collect_css_syntax_statements, tokenize_css_syntax,
};
use mastercss_schema::{CustomMediaDefinition, MasterCssManifest, MediaQueryExpr, ThemeNode};
use std::collections::HashMap;

pub(crate) type MediaRegistry = std::collections::BTreeMap<String, MediaQueryExpr>;

/// The named conditions that lowering expands: custom media and custom containers.
#[derive(Debug, Clone, Default)]
pub(crate) struct Registry {
    pub(crate) media: MediaRegistry,
    pub(crate) containers: crate::custom_container::Registry,
}

/// A named query definition: its name, query text and source.
pub(crate) type NamedQuery = (
    String,
    String,
    Option<mastercss_schema::CssDirectiveSourceReference>,
);

pub(crate) fn collect(
    source: &str,
    filename: &str,
) -> Result<(Vec<CustomMediaDefinition>, Vec<std::ops::Range<usize>>), CompilerError> {
    let (definitions, ranges) = collect_named(source, filename, "custom-media", "media query")?;
    Ok((
        definitions
            .into_iter()
            .map(|(name, query, source)| CustomMediaDefinition {
                name,
                query,
                source,
            })
            .collect(),
        ranges,
    ))
}

/// Collects the top-level `@<directive> --name <query>;` statements of a source.
pub(crate) fn collect_named(
    source: &str,
    filename: &str,
    directive: &str,
    query_kind: &str,
) -> Result<(Vec<NamedQuery>, Vec<std::ops::Range<usize>>), CompilerError> {
    let tokens = tokenize_css_syntax(source);
    let mut definitions = Vec::new();
    let mut ranges = Vec::new();
    for statement in collect_css_syntax_statements(&tokens) {
        let header = &tokens[statement.tokens.clone()];
        let Some(first) = header.first() else {
            continue;
        };
        if !matches!(&first.kind, Kind::AtKeyword(name) if name.eq_ignore_ascii_case(directive)) {
            continue;
        }
        let fail =
            |message: String| crate::directive_error(source, filename, first.bytes.start, message);
        if statement.parent.is_some() || statement.has_block {
            return Err(fail(format!("@{directive} must be a top-level statement")));
        }
        let Some(Kind::Ident(name)) = header.get(1).map(|token| &token.kind) else {
            return Err(fail(format!(
                "@{directive} requires --name and a {query_kind}"
            )));
        };
        if !name.starts_with("--") || name.len() <= 2 || header.len() < 3 {
            return Err(fail(format!(
                "@{directive} requires --name and a {query_kind}"
            )));
        }
        let last = header.last().expect("header");
        let end = tokens
            .get(statement.tokens.end)
            .filter(|token| token.kind == Kind::Delim(';'))
            .map(|token| token.bytes.end)
            .unwrap_or(last.bytes.end);
        definitions.push((
            name.to_string(),
            source[header[2].bytes.start..last.bytes.end].into(),
            crate::native_selectors::source_reference_from_bytes(
                source,
                filename,
                first.bytes.start,
                end,
            ),
        ));
        ranges.push(first.bytes.start..end);
    }
    Ok((definitions, ranges))
}

pub(crate) fn registry(manifest: Option<&MasterCssManifest>) -> Registry {
    Registry {
        media: manifest
            .and_then(|manifest| manifest.custom_media.as_ref())
            .into_iter()
            .flatten()
            .map(|(name, query)| (name.clone(), query.clone()))
            .collect(),
        containers: crate::custom_container::registry(manifest),
    }
}

pub(crate) fn resolve(
    input: &CssDirectiveManifestInput,
    base: Option<&MasterCssManifest>,
) -> Result<Registry, CompilerError> {
    Ok(Registry {
        media: resolve_media(input, base)?,
        containers: crate::custom_container::resolve(input, base)?,
    })
}

fn resolve_media(
    input: &CssDirectiveManifestInput,
    base: Option<&MasterCssManifest>,
) -> Result<MediaRegistry, CompilerError> {
    let mut resolved = registry(base).media;
    let mut definitions = HashMap::new();
    for definition in input.custom_media.iter().flatten() {
        definitions.insert(definition.name.clone(), definition);
    }
    for name in definitions.keys() {
        resolved.remove(name);
    }
    fn visit(
        name: &str,
        definitions: &HashMap<String, &CustomMediaDefinition>,
        resolved: &mut MediaRegistry,
        stack: &mut Vec<String>,
    ) -> Result<MediaQueryExpr, String> {
        if let Some(query) = resolved.get(name) {
            return Ok(query.clone());
        }
        if stack.iter().any(|entry| entry == name) {
            return Err(format!(
                "Circular custom media reference: {} -> {name}",
                stack.join(" -> ")
            ));
        }
        let definition = definitions
            .get(name)
            .ok_or_else(|| format!("Undefined custom media {name}"))?;
        if stack.len() >= 128 {
            return Err("Custom media alias chain exceeds 128 levels".into());
        }
        stack.push(name.into());
        let result = mastercss_engine::parse_custom_media_query(&definition.query, &mut |alias| {
            visit(alias, definitions, resolved, stack)
        });
        stack.pop();
        let query = result?;
        mastercss_engine::custom_media_branches(&query)?;
        resolved.insert(name.into(), query.clone());
        Ok(query)
    }
    // Iterate source order for deterministic diagnostics, skipping superseded definitions.
    for definition in input.custom_media.iter().flatten() {
        if definitions
            .get(&definition.name)
            .is_some_and(|last| !std::ptr::eq(*last, definition))
        {
            continue;
        }
        visit(
            &definition.name,
            &definitions,
            &mut resolved,
            &mut Vec::new(),
        )
        .map_err(|message| CompilerError::Directive {
            message,
            filename: definition
                .source
                .as_ref()
                .and_then(|source| source.file.clone())
                .unwrap_or_else(|| "manifest.css".into()),
            range: definition
                .source
                .as_ref()
                .map(|source| source.range.clone()),
        })?;
    }
    if resolved.contains_key("--starting-style") {
        return Err(crate::manifest::definition_error(
            "Custom media --starting-style conflicts with the native @starting-style suffix",
        ));
    }
    Ok(resolved)
}

pub(crate) fn paths(
    conditions: &[String],
    registry: &Registry,
) -> Result<Vec<Vec<String>>, CompilerError> {
    let mut result = vec![Vec::new()];
    for condition in conditions {
        let branches = if let Some(query) = condition.strip_prefix("@container ") {
            let prelude = crate::custom_container::lower_prelude(query, &registry.containers)
                .map_err(crate::manifest::definition_error)?;
            vec![vec![prelude.map_or_else(
                || condition.clone(),
                |prelude| format!("@container {prelude}"),
            )]]
        } else if let Some(query) = condition
            .strip_prefix("@media ")
            .filter(|query| has_alias(query))
        {
            let query = mastercss_engine::parse_custom_media_query(query, &mut |name| {
                registry
                    .media
                    .get(name)
                    .cloned()
                    .ok_or_else(|| format!("Undefined custom media {name}"))
            })
            .map_err(crate::manifest::definition_error)?;
            mastercss_engine::custom_media_branches(&query)
                .map_err(crate::manifest::definition_error)?
                .into_iter()
                .map(|branch| {
                    branch
                        .into_iter()
                        .map(|query| format!("@media {query}"))
                        .collect()
                })
                .collect()
        } else {
            vec![vec![condition.clone()]]
        };
        if result.len().saturating_mul(branches.len()) > 4096 {
            return Err(crate::manifest::definition_error(
                "Custom media expansion exceeds 4096 branches",
            ));
        }
        result = result
            .into_iter()
            .flat_map(|prefix| {
                branches.iter().map(move |suffix: &Vec<String>| {
                    let mut path = prefix.clone();
                    path.extend(suffix.clone());
                    path
                })
            })
            .collect();
    }
    Ok(result)
}

fn has_alias(query: &str) -> bool {
    tokenize_css_syntax(query)
        .iter()
        .any(|token| matches!(&token.kind, Kind::Ident(name) if name.starts_with("--")))
}

/// Whether native `@media` or `@container` rules reference a custom media or
/// custom container name, which only compilation can expand.
pub(crate) fn uses_native_alias(source: &str) -> bool {
    let tokens = tokenize_css_syntax(source);
    collect_css_syntax_statements(&tokens)
        .iter()
        .any(|statement| {
            let header = &tokens[statement.tokens.clone()];
            match header.first().map(|token| &token.kind) {
                Some(Kind::AtKeyword(name)) if name.eq_ignore_ascii_case("media") => {
                    header.iter().any(
                        |token| matches!(&token.kind, Kind::Ident(name) if name.starts_with("--")),
                    )
                }
                Some(Kind::AtKeyword(name)) if name.eq_ignore_ascii_case("container") => {
                    header.len() > 1
                        && !mastercss_engine::custom_container_references(
                            &source[header[1].bytes.start..header[header.len() - 1].bytes.end],
                        )
                        .is_empty()
                }
                _ => false,
            }
        })
}

pub(crate) fn lower_theme(
    nodes: &[ThemeNode],
    registry: &Registry,
) -> Result<Vec<ThemeNode>, CompilerError> {
    let mut output = Vec::new();
    for node in nodes {
        match node {
            ThemeNode::Declaration { .. } => output.push(node.clone()),
            ThemeNode::Rule { prelude, children } => {
                let children = lower_theme(children, registry)?;
                if prelude.starts_with("@media ") || prelude.starts_with("@container ") {
                    for path in paths(std::slice::from_ref(prelude), registry)? {
                        let mut branch = children.clone();
                        for prelude in path.into_iter().rev() {
                            branch = vec![ThemeNode::Rule {
                                prelude,
                                children: branch,
                            }];
                        }
                        output.extend(branch);
                    }
                } else {
                    output.push(ThemeNode::Rule {
                        prelude: prelude.clone(),
                        children,
                    });
                }
            }
        }
    }
    Ok(output)
}

pub(crate) fn lower_css(
    source: &str,
    mappings: &[CssOutputMapping],
    registry: &Registry,
    filename: &str,
) -> Result<(String, Vec<CssOutputMapping>), CompilerError> {
    let tokens = tokenize_css_syntax(source);
    let statements = collect_css_syntax_statements(&tokens);
    let units = |byte| byte_to_utf16_offset(source, byte).expect("token boundary");
    for statement in &statements {
        let header = &tokens[statement.tokens.clone()];
        if matches!(header.first().map(|token| &token.kind), Some(Kind::AtKeyword(name)) if name.eq_ignore_ascii_case("import"))
            && header
                .iter()
                .any(|token| matches!(&token.kind, Kind::Ident(name) if name.starts_with("--")))
        {
            return Err(crate::directive_error(
                source,
                filename,
                header[0].bytes.start,
                "Resolve CSS imports using custom media before lowering; retained external @import queries cannot contain unresolved aliases",
            ));
        }
    }
    let mut edits = Vec::new();
    // Only outermost media expansions are edited here; recursively transform
    // their contents before cloning so nested expressions preserve source maps.
    let mut covered_end = 0;
    let mut conditions = statements
        .iter()
        .filter(|statement| {
            statement.has_block
                && matches!(&tokens[statement.tokens.start].kind, Kind::AtKeyword(name) if name.eq_ignore_ascii_case("media") || name.eq_ignore_ascii_case("container"))
        })
        .collect::<Vec<_>>();
    conditions.sort_by_key(|statement| tokens[statement.tokens.start].bytes.start);
    for statement in conditions {
        let header = &tokens[statement.tokens.clone()];
        let first = &header[0];
        if first.bytes.start < covered_end {
            continue;
        }
        let Some(query_start) = header.get(1) else {
            continue;
        };
        let open = &tokens[statement.tokens.end];
        let Some(close) = open.close.map(|index| &tokens[index]) else {
            continue;
        };
        let query = &source[query_start.bytes.start..open.bytes.start];
        let container =
            matches!(&first.kind, Kind::AtKeyword(name) if name.eq_ignore_ascii_case("container"));
        if !(if container {
            !mastercss_engine::custom_container_references(query).is_empty()
        } else {
            has_alias(query)
        }) {
            continue;
        }
        let (start, body_start, body_end, end) = (
            units(first.bytes.start),
            units(open.bytes.end),
            units(close.bytes.start),
            units(close.bytes.end),
        );
        let origin = mappings
            .iter()
            .filter(|mapping| {
                mapping.generated_start <= start
                    && mapping.generated_end.is_none_or(|end| start < end)
            })
            .max_by_key(|mapping| mapping.generated_start)
            .map(|mapping| mapping.source.clone())
            .or_else(|| {
                crate::native_selectors::source_reference_from_bytes(
                    source,
                    filename,
                    first.bytes.start,
                    open.bytes.start,
                )
            });
        let body_mappings = mappings
            .iter()
            .filter(|mapping| {
                mapping.generated_start >= body_start && mapping.generated_start < body_end
            })
            .cloned()
            .map(|mut mapping| {
                mapping.generated_start -= body_start;
                mapping.generated_end = mapping
                    .generated_end
                    .map(|end| end.min(body_end) - body_start);
                mapping
            })
            .collect::<Vec<_>>();
        let keyword = if container { "container" } else { "media" };
        let branches = paths(&[format!("@{keyword} {query}")], registry).map_err(|mut error| {
            if let CompilerError::Directive {
                filename: file,
                range,
                ..
            } = &mut error
            {
                *file = origin
                    .as_ref()
                    .and_then(|source| source.file.clone())
                    .unwrap_or_else(|| filename.into());
                *range = origin.as_ref().map(|source| source.range.clone());
            }
            error
        })?;
        let (body, body_mappings) = lower_css(
            &source[open.bytes.end..close.bytes.start],
            &body_mappings,
            registry,
            filename,
        )?;
        let mut text = String::new();
        let mut maps = Vec::new();
        for path in branches {
            let prefix = path
                .iter()
                .map(|query| format!("{query}{{"))
                .collect::<String>();
            let wrapper_start = text.encode_utf16().count() as u32;
            let offset = wrapper_start + prefix.encode_utf16().count() as u32;
            if let Some(origin) = &origin
                && !prefix.is_empty()
            {
                maps.push(CssOutputMapping {
                    generated_start: wrapper_start,
                    generated_end: Some(offset),
                    source: origin.clone(),
                });
            }
            text.push_str(&prefix);
            text.push_str(&body);
            text.push_str(&"}".repeat(path.len()));
            maps.extend(body_mappings.iter().cloned().map(|mut mapping| {
                mapping.generated_start += offset;
                mapping.generated_end = mapping.generated_end.map(|end| end + offset);
                mapping
            }));
        }
        edits.push(crate::output_edits::OutputEdit {
            start,
            end,
            text,
            mappings: maps,
        });
        covered_end = close.bytes.end;
    }
    crate::output_edits::apply_output_edits(source, mappings, edits, filename)
}
