use std::collections::HashSet;

use mastercss_lexer::{
    CssSyntaxKind, CssSyntaxStatement, CssSyntaxToken, byte_to_utf16_offset,
    collect_css_syntax_statements, tokenize_css_syntax,
};
use mastercss_schema::SourceRange;
use serde::{Deserialize, Serialize};

use crate::{CompilerError, CssResourceReference, CssStylesheetGraph, CssStylesheetNode};

/// Ordinary bundle fragments retain their original owner and UTF-16 range.
/// Hosts must rebase their resource URLs before moving them to another directory.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssBundleSource {
    pub id: String,
    pub filename: String,
    pub range: SourceRange,
    /// Namespace declarations copied from the original sheet, before this range.
    pub prefix: String,
    /// Resource/import references use original bundle UTF-16 positions.
    pub resources: Vec<CssResourceReference>,
    pub imports: Vec<CssResourceReference>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssBundleGraph {
    pub graph: CssStylesheetGraph,
    pub sources: Vec<CssBundleSource>,
    pub slots: usize,
}

fn error(source: &str, filename: &str, start: usize, end: usize, message: &str) -> CompilerError {
    CompilerError::Parse {
        filename: filename.into(),
        message: message.into(),
        range: Some(SourceRange {
            start: byte_to_utf16_offset(source, start).expect("token boundary"),
            end: byte_to_utf16_offset(source, end).expect("token boundary"),
        }),
    }
}

fn end_token(statement: &CssSyntaxStatement, tokens: &[CssSyntaxToken<'_>]) -> usize {
    if statement.has_block {
        tokens[statement.tokens.end]
            .close
            .map_or(tokens.len(), |end| end + 1)
    } else if tokens
        .get(statement.tokens.end)
        .is_some_and(|token| token.kind == CssSyntaxKind::Delim(';'))
    {
        statement.tokens.end + 1
    } else {
        statement.tokens.end
    }
}

pub(crate) fn import_node(
    id: String,
    source: String,
    targets: &[String],
) -> Result<CssStylesheetNode, CompilerError> {
    let mut imports = crate::stylesheet_graph::source_imports(&source, &id)?;
    for (import, target) in imports.iter_mut().zip(targets) {
        import.resolved = Some(target.clone());
    }
    Ok(CssStylesheetNode {
        id,
        source,
        imports,
    })
}

fn append_import(source: &mut String, target: &str, suffix: &str) {
    source.push_str("@import ");
    cssparser::serialize_string(target, source).expect("writing a String cannot fail");
    source.push_str(suffix);
    source.push(';');
}

fn same_slot(left: &[CssSyntaxToken<'_>], right: &[CssSyntaxToken<'_>]) -> bool {
    left.iter()
        .filter(|t| t.kind != CssSyntaxKind::Delim(';'))
        .map(|t| &t.kind)
        .eq(right
            .iter()
            .filter(|t| t.kind != CssSyntaxKind::Delim(';'))
            .map(|t| &t.kind))
}

/// Replace complete slot rules with an already compiled stylesheet graph, keeping
/// ordinary rules on either side in separate files. Each media/supports/layer
/// wrapper owns one intermediate node, including one shared anonymous layer.
/// Every slot occurrence is retained; adapter deduplication policy is separate.
/// This prepares a graph only: no assets are written and no resource URLs rebased.
pub fn compose_css_bundle_graph(
    source: &str,
    filename: &str,
    slot: &str,
    managed: &CssStylesheetGraph,
) -> Result<CssBundleGraph, CompilerError> {
    let tokens = tokenize_css_syntax(source);
    let statements = collect_css_syntax_statements(&tokens);
    let slot_tokens = tokenize_css_syntax(slot);
    let slot_statements = collect_css_syntax_statements(&slot_tokens);
    if slot_statements
        .iter()
        .filter(|s| s.parent.is_none())
        .count()
        != 1
        || !slot_statements.first().is_some_and(|s| s.has_block)
        || slot_tokens
            .first()
            .is_none_or(|t| matches!(t.kind, CssSyntaxKind::AtKeyword(_)))
    {
        return Err(error(
            source,
            filename,
            0,
            0,
            "Bundle slot must be one qualified CSS rule",
        ));
    }
    let mut slots = HashSet::new();
    let mut split = HashSet::new();
    for (index, statement) in statements.iter().enumerate() {
        if statement.has_block
            && same_slot(
                &tokens[statement.tokens.start..end_token(statement, &tokens)],
                &slot_tokens,
            )
        {
            slots.insert(index);
            let mut current = Some(index);
            while let Some(index) = current {
                split.insert(index);
                current = statements[index].parent;
            }
        }
    }
    if slots.is_empty() {
        let (node, reference) = crate::stylesheet_bundle_context::fragment(
            source,
            filename,
            filename.into(),
            0,
            source.len(),
            "",
        )?;
        return Ok(CssBundleGraph {
            graph: CssStylesheetGraph {
                version: 1,
                entry: filename.into(),
                references: Vec::new(),
                stylesheets: vec![node],
            },
            sources: vec![reference],
            slots: 0,
        });
    }
    let mut used: HashSet<String> = managed
        .stylesheets
        .iter()
        .map(|node| node.id.clone())
        .collect();
    if managed.version != 1
        || used.len() != managed.stylesheets.len()
        || !used.contains(&managed.entry)
        || !used.insert(filename.into())
    {
        return Err(error(
            source,
            filename,
            0,
            0,
            "Invalid managed graph or colliding bundle entry ID",
        ));
    }
    // Namespace scope belongs to ordinary source fragments, not managed imports.
    let mut root_barrier = false;
    let mut namespace_source = String::new();
    let mut namespace_end = 0;
    for statement in statements.iter().filter(|s| s.parent.is_some()) {
        if matches!(&tokens[statement.tokens.start].kind, CssSyntaxKind::AtKeyword(name) if name.eq_ignore_ascii_case("import") || name.eq_ignore_ascii_case("namespace"))
        {
            let start = tokens[statement.tokens.start].bytes.start;
            return Err(error(
                source,
                filename,
                start,
                start,
                "Nested import or namespace cannot be promoted into a bundle fragment",
            ));
        }
    }
    for statement in statements.iter().filter(|s| s.parent.is_none()) {
        let name = match &tokens[statement.tokens.start].kind {
            CssSyntaxKind::AtKeyword(name) => name.to_ascii_lowercase(),
            _ => String::new(),
        };
        let start = tokens[statement.tokens.start].bytes.start;
        if (name == "namespace" && root_barrier)
            || (name == "import" && (root_barrier || namespace_end > 0))
        {
            return Err(error(
                source,
                filename,
                start,
                start,
                "Misplaced bundle namespace or import requires invalid-rule handling",
            ));
        }
        if name == "namespace" {
            let end = tokens[end_token(statement, &tokens) - 1].bytes.end;
            let text = &source[start..end];
            let parsed = lightningcss::stylesheet::StyleSheet::parse(
                text,
                lightningcss::stylesheet::ParserOptions::default(),
            )
            .map_err(|_| {
                error(
                    source,
                    filename,
                    start,
                    end,
                    "Invalid bundle namespace declaration",
                )
            })?;
            if parsed.rules.0.len() != 1
                || !matches!(
                    parsed.rules.0[0],
                    lightningcss::rules::CssRule::Namespace(_)
                )
            {
                return Err(error(
                    source,
                    filename,
                    start,
                    end,
                    "Invalid bundle namespace declaration",
                ));
            }
            namespace_source.push_str(text);
            namespace_source.push('\n');
            namespace_end = end;
        }
        root_barrier |= statement.has_block
            || !matches!(name.as_str(), "charset" | "import" | "layer" | "namespace");
    }
    let mut counter = 0;
    let mut fresh = || loop {
        let id = format!("{filename}#master-css-part-{counter}");
        counter += 1;
        if used.insert(id.clone()) {
            break id;
        }
    };
    let mut nodes = Vec::new();
    let mut sources = Vec::new();
    // Iterative jobs avoid consuming the Rust stack for deeply nested wrappers.
    let mut jobs = vec![(None, filename.to_owned(), 0, source.len())];
    while let Some((parent, id, start, end)) = jobs.pop() {
        let mut output = String::new();
        let mut targets = Vec::new();
        let mut cursor = start;
        let mut children = statements
            .iter()
            .enumerate()
            .filter(|(_, s)| s.parent == parent)
            .collect::<Vec<_>>();
        children.sort_by_key(|(_, s)| s.tokens.start);
        for (index, statement) in children {
            if !split.contains(&index) {
                continue;
            }
            let rule_start = tokens[statement.tokens.start].bytes.start;
            let token_end = end_token(statement, &tokens);
            let rule_end = tokens[token_end - 1].bytes.end;
            if rule_end > end
                || !statement.has_block
                || tokens[statement.tokens.end].close.is_none()
            {
                return Err(error(
                    source,
                    filename,
                    rule_start,
                    rule_end,
                    "Unclosed bundle rule containing a managed slot",
                ));
            }
            if cursor < rule_start {
                let fragment = fresh();
                append_import(&mut output, &fragment, "");
                targets.push(fragment.clone());
                let prefix = if cursor < namespace_end {
                    ""
                } else {
                    &namespace_source
                };
                let (node, reference) = crate::stylesheet_bundle_context::fragment(
                    source, filename, fragment, cursor, rule_start, prefix,
                )?;
                nodes.push(node);
                sources.push(reference);
            }
            if slots.contains(&index) {
                append_import(&mut output, &managed.entry, "");
                targets.push(managed.entry.clone());
            } else {
                let name = match &tokens[statement.tokens.start].kind {
                    CssSyntaxKind::AtKeyword(name) => name.to_ascii_lowercase(),
                    _ => String::new(),
                };
                let open = &tokens[statement.tokens.end];
                let prelude =
                    source[tokens[statement.tokens.start].bytes.end..open.bytes.start].trim();
                let suffix = match name.as_str() {
                    "media" => format!(" {prelude}"),
                    "supports" => format!(" supports({prelude})"),
                    "layer" if prelude.is_empty() => " layer".into(),
                    "layer" => format!(" layer({prelude})"),
                    _ => {
                        return Err(error(
                            source,
                            filename,
                            rule_start,
                            open.bytes.end,
                            "Managed bundle slot inside this rule requires additional scope lowering",
                        ));
                    }
                };
                let group = fresh();
                append_import(&mut output, &group, &suffix);
                targets.push(group.clone());
                jobs.push((
                    Some(index),
                    group,
                    open.bytes.end,
                    tokens[open.close.unwrap()].bytes.start,
                ));
            }
            cursor = rule_end;
        }
        if cursor < end {
            let fragment = fresh();
            append_import(&mut output, &fragment, "");
            targets.push(fragment.clone());
            let prefix = if cursor < namespace_end {
                ""
            } else {
                &namespace_source
            };
            let (node, reference) = crate::stylesheet_bundle_context::fragment(
                source, filename, fragment, cursor, end, prefix,
            )?;
            nodes.push(node);
            sources.push(reference);
        }
        nodes.push(import_node(id, output, &targets)?);
    }
    nodes.extend(managed.stylesheets.iter().cloned());
    Ok(CssBundleGraph {
        graph: CssStylesheetGraph {
            version: 1,
            entry: filename.into(),
            stylesheets: nodes,
            references: managed.references.clone(),
        },
        sources,
        slots: slots.len(),
    })
}
