use std::collections::{HashMap, HashSet};

use lightningcss::{
    rules::CssRule,
    stylesheet::{ParserOptions, PrinterOptions, StyleSheet},
    traits::ToCss,
};
use mastercss_lexer::{
    CssSyntaxKind, byte_to_utf16_offset, collect_css_syntax_statements, tokenize_css_syntax,
    utf16_to_byte_offset,
};
use serde::{Deserialize, Serialize};

use crate::{
    CompilerError, CssDirectiveReferenceStatement, CssImportGraphRequest, CssImportProvider,
    PreparedCssImportProvider,
};

/// Ordered CSS files and import edges before any bundling discards boundaries.
/// Offsets refer to UTF-16 positions in each node's source, after @reference removal.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssStylesheetGraph {
    pub version: u32,
    pub entry: String,
    pub stylesheets: Vec<CssStylesheetNode>,
    pub references: Vec<CssDirectiveReferenceStatement>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssStylesheetNode {
    pub id: String,
    pub source: String,
    pub imports: Vec<CssStylesheetImport>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssStylesheetImport {
    pub start: u32,
    pub end: u32,
    pub statement: String,
    pub specifier: String,
    pub resolved: Option<String>,
}

/// Host-assigned URLs keep asset emission and path policy outside the compiler.
/// CSS import parsing and rewriting remain in Rust.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssStylesheetAsset {
    pub id: String,
    pub href: String,
    pub css: String,
}

fn import_error(id: &str, message: impl Into<String>) -> CompilerError {
    CompilerError::Import {
        filename: id.to_owned(),
        message: message.into(),
    }
}

pub(crate) fn parse_import<'a>(
    statement: &'a str,
    id: &str,
) -> Result<lightningcss::rules::import::ImportRule<'a>, CompilerError> {
    let mut sheet = StyleSheet::parse(statement, ParserOptions::default()).map_err(|error| {
        CompilerError::Parse {
            filename: id.to_owned(),
            message: error.to_string(),
            range: None,
        }
    })?;
    if sheet.rules.0.len() != 1 {
        return Err(import_error(id, "Expected one CSS import statement"));
    }
    match sheet.rules.0.remove(0) {
        CssRule::Import(import) => Ok(import),
        _ => Err(import_error(id, "Expected a CSS import statement")),
    }
}

pub(crate) fn source_imports(
    source: &str,
    id: &str,
) -> Result<Vec<CssStylesheetImport>, CompilerError> {
    collect_source_imports(source, id, true)
}

pub(crate) fn discover_source_imports(source: &str) -> Vec<CssStylesheetImport> {
    // Analysis historically ignores malformed import statements. Compilation
    // uses the same discovery/parser but reports their errors instead.
    collect_source_imports(source, "master.css", false).expect("non-strict discovery")
}

fn collect_source_imports(
    source: &str,
    id: &str,
    strict: bool,
) -> Result<Vec<CssStylesheetImport>, CompilerError> {
    let tokens = tokenize_css_syntax(source);
    let mut imports = Vec::new();
    for statement in collect_css_syntax_statements(&tokens) {
        if statement.parent.is_some() || statement.has_block {
            continue;
        }
        let Some(first) = tokens.get(statement.tokens.start) else {
            continue;
        };
        if !matches!(&first.kind, CssSyntaxKind::AtKeyword(name) if name.eq_ignore_ascii_case("import"))
        {
            continue;
        }
        let end = tokens
            .get(statement.tokens.end)
            .filter(|token| token.kind == CssSyntaxKind::Delim(';'))
            .map_or(source.len(), |token| token.bytes.end);
        let authored = &source[first.bytes.start..end];
        let import = match parse_import(authored, id) {
            Ok(import) => import,
            Err(error) if strict => return Err(error),
            Err(_) => continue,
        };
        imports.push(CssStylesheetImport {
            start: byte_to_utf16_offset(source, first.bytes.start).expect("token boundary"),
            end: byte_to_utf16_offset(source, end).expect("token boundary"),
            statement: authored.to_owned(),
            specifier: import.url.to_string(),
            resolved: None,
        });
    }
    Ok(imports)
}

/// Resolve each local file once while retaining every authored import occurrence.
/// External imports stay edges without a target; no network or filesystem policy
/// is introduced here. The existing provider's cycle error contract is retained.
pub fn resolve_css_stylesheet_graph<P: CssImportProvider>(
    entry: &str,
    provider: &P,
) -> Result<CssStylesheetGraph, CompilerError> {
    let mut graph = CssStylesheetGraph {
        version: 1,
        entry: entry.to_owned(),
        stylesheets: Vec::new(),
        references: Vec::new(),
    };
    let mut visited = HashSet::new();
    let mut active = HashSet::new();
    let mut stack = Vec::new();
    let mut work = vec![(entry.to_owned(), false)];
    while let Some((id, exit)) = work.pop() {
        if exit {
            active.remove(&id);
            stack.pop();
            continue;
        }
        if active.contains(&id) {
            stack.push(id.clone());
            return Err(import_error(
                &id,
                format!("Circular CSS import: {}", stack.join(" -> ")),
            ));
        }
        if !visited.insert(id.clone()) {
            continue;
        }
        let source = crate::imports::load_css_import_source(&id, provider, &mut graph.references)?;
        let mut imports = source_imports(&source, &id)?;
        for import in &mut imports {
            import.resolved = provider.resolve(&import.specifier, &id).map_err(|error| {
                import_error(
                    &id,
                    format!(
                        "Cannot resolve CSS import {} from {id}: {error}",
                        import.specifier
                    ),
                )
            })?;
        }
        active.insert(id.clone());
        stack.push(id.clone());
        work.push((id.clone(), true));
        work.extend(
            imports
                .iter()
                .rev()
                .filter_map(|import| import.resolved.as_ref())
                .map(|target| (target.clone(), false)),
        );
        graph.stylesheets.push(CssStylesheetNode {
            id,
            source,
            imports,
        });
    }
    Ok(graph)
}

pub fn resolve_prepared_css_stylesheet_graph(
    request: &CssImportGraphRequest,
) -> Result<CssStylesheetGraph, CompilerError> {
    resolve_css_stylesheet_graph(&request.entry, &PreparedCssImportProvider { request })
}

/// Rewrite only resolved import URLs, never move an import or concatenate nodes.
/// The host must preserve source-relative non-import URL semantics when assigning
/// delivery URLs; this function does not claim to rebase declaration URLs.
pub fn render_css_stylesheet_graph(
    graph: &CssStylesheetGraph,
    urls: &HashMap<String, String>,
) -> Result<Vec<CssStylesheetAsset>, CompilerError> {
    Ok(
        render_css_stylesheet_graph_mapped(graph, urls, &HashMap::new())?
            .into_iter()
            .map(|(asset, _)| asset)
            .collect(),
    )
}

pub(crate) fn render_css_stylesheet_graph_mapped(
    graph: &CssStylesheetGraph,
    urls: &HashMap<String, String>,
    source_mappings: &HashMap<String, Vec<crate::CssOutputMapping>>,
) -> Result<Vec<(CssStylesheetAsset, Vec<crate::CssOutputMapping>)>, CompilerError> {
    let ids = graph
        .stylesheets
        .iter()
        .map(|node| node.id.as_str())
        .collect::<HashSet<_>>();
    if graph.version != 1
        || !ids.contains(graph.entry.as_str())
        || ids.len() != graph.stylesheets.len()
    {
        return Err(import_error(
            &graph.entry,
            "Invalid stylesheet graph version, entry or duplicate node",
        ));
    }
    let mut assets = Vec::new();
    for node in &graph.stylesheets {
        let href = urls
            .get(&node.id)
            .ok_or_else(|| import_error(&node.id, "Missing stylesheet delivery URL"))?;
        let mappings = source_mappings
            .get(&node.id)
            .map(Vec::as_slice)
            .unwrap_or_default();
        let mut edits = Vec::new();
        let mut cursor = 0;
        for edge in &node.imports {
            let range = utf16_to_byte_offset(&node.source, edge.start)
                .zip(utf16_to_byte_offset(&node.source, edge.end));
            let Some((start, end)) = range.filter(|(start, end)| *start >= cursor && end >= start)
            else {
                return Err(import_error(&node.id, "Invalid stylesheet import range"));
            };
            if node.source.get(start..end) != Some(edge.statement.as_str()) {
                return Err(import_error(
                    &node.id,
                    "Stylesheet import range does not match its statement",
                ));
            }
            if let Some(target) = &edge.resolved {
                if !ids.contains(target.as_str()) {
                    return Err(import_error(&node.id, "Unknown stylesheet import target"));
                }
                let url = urls
                    .get(target)
                    .ok_or_else(|| import_error(target, "Missing stylesheet delivery URL"))?;
                let mut import = parse_import(&edge.statement, &node.id)?;
                if import.url.as_ref() != edge.specifier {
                    return Err(import_error(
                        &node.id,
                        "Stylesheet import specifier mismatch",
                    ));
                }
                import.url = url.clone().into();
                let text = import
                    .to_css_string(PrinterOptions::default())
                    .map_err(|error| CompilerError::Print {
                        filename: node.id.clone(),
                        message: error.to_string(),
                    })?;
                let anchors = mappings
                    .iter()
                    .filter(|mapping| mapping.generated_start == edge.start)
                    .cloned()
                    .map(|mut mapping| {
                        mapping.generated_start = 0;
                        mapping.generated_end = mapping
                            .generated_end
                            .map(|_| text.encode_utf16().count() as u32);
                        mapping
                    })
                    .collect();
                edits.push(crate::output_edits::OutputEdit {
                    start: edge.start,
                    end: edge.end,
                    text,
                    mappings: anchors,
                });
            }
            cursor = end;
        }
        let (css, mappings) =
            crate::output_edits::apply_output_edits(&node.source, mappings, edits, &node.id)?;
        assets.push((
            CssStylesheetAsset {
                id: node.id.clone(),
                href: href.clone(),
                css,
            },
            mappings,
        ));
    }
    Ok(assets)
}
