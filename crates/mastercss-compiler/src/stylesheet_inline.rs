use std::collections::HashMap;

use mastercss_lexer::{
    CssSyntaxKind, collect_css_syntax_statements, tokenize_css_syntax, utf16_to_byte_offset,
};

use crate::{CompilerError, CssStylesheetAsset, CssStylesheetGraph};

/// Inline only import-free children whose stylesheet namespace is unchanged.
/// Retained imports must remain before any newly inserted declaration rules.
pub(crate) fn inline_stylesheet_imports(
    graph: &CssStylesheetGraph,
    assets: Vec<CssStylesheetAsset>,
) -> Result<Vec<CssStylesheetAsset>, CompilerError> {
    inline_stylesheet_imports_mapped(graph, assets, &mut HashMap::new())
}

pub(crate) fn inline_stylesheet_imports_mapped(
    graph: &CssStylesheetGraph,
    mut assets: Vec<CssStylesheetAsset>,
    mappings: &mut HashMap<String, Vec<crate::CssOutputMapping>>,
) -> Result<Vec<CssStylesheetAsset>, CompilerError> {
    let indexes: HashMap<_, _> = assets
        .iter()
        .enumerate()
        .map(|(index, asset)| (asset.id.clone(), index))
        .collect();
    let nodes: HashMap<_, _> = graph
        .stylesheets
        .iter()
        .map(|node| (node.id.as_str(), node))
        .collect();
    let mut done = vec![false; assets.len()];
    let mut inlineable = vec![false; assets.len()];
    let mut relative_base = vec![false; assets.len()];
    loop {
        let mut progress = false;
        for index in 0..assets.len() {
            if done[index] {
                continue;
            }
            let node = nodes[assets[index].id.as_str()];
            if node.imports.iter().any(|import| {
                import
                    .resolved
                    .as_ref()
                    .is_some_and(|id| !done[indexes[id]])
            }) {
                continue;
            }
            let source = &assets[index].css;
            let imports = crate::stylesheet_graph::source_imports(source, &node.id)?;
            // A file containing only one unqualified import adds no namespace
            // or cascade scope. Promote its child, even if that child needs imports.
            if imports.len() == 1
                && top_level_statements(source) == 1
                && let Some(target) = node.imports[0].resolved.as_ref().map(|id| indexes[id])
            {
                let import =
                    crate::stylesheet_graph::parse_import(&imports[0].statement, &node.id)?;
                if import.layer.is_none()
                    && import.supports.is_none()
                    && import.media.media_queries.is_empty()
                    && (!relative_base[target]
                        || same_resource_base(&assets[index].href, &assets[target].href))
                {
                    let edit = crate::output_edits::OutputEdit {
                        start: imports[0].start,
                        end: imports[0].end,
                        text: assets[target].css.clone(),
                        mappings: mappings
                            .get(&assets[target].id)
                            .cloned()
                            .unwrap_or_default(),
                    };
                    let (css, output) = crate::output_edits::apply_output_edits(
                        source,
                        mappings
                            .get(&node.id)
                            .map(Vec::as_slice)
                            .unwrap_or_default(),
                        vec![edit],
                        &node.id,
                    )?;
                    mappings.insert(node.id.clone(), output);
                    assets[index].css = css;
                    inlineable[index] = inlineable[target];
                    relative_base[index] = relative_base[target];
                    done[index] = true;
                    progress = true;
                    continue;
                }
            }
            let (namespace, preamble) = import_context(source);
            let mut retained_later_import = false;
            let mut replacements = Vec::new();
            for (import, original) in imports.iter().zip(&node.imports).rev() {
                let target = original.resolved.as_ref().map(|id| indexes[id]);
                let start = utf16_to_byte_offset(source, import.start).expect("import boundary");
                if !namespace
                    && !retained_later_import
                    && start < preamble
                    && let Some(target) = target
                    && inlineable[target]
                    && (!relative_base[target]
                        || same_resource_base(&assets[index].href, &assets[target].href))
                {
                    let (prefix, suffix) = crate::imports::imported_css_wrappers(
                        &import.statement,
                        &assets[target].css,
                        &node.id,
                    )?;
                    let shift = prefix.encode_utf16().count() as u32;
                    let child_mappings = mappings
                        .get(&assets[target].id)
                        .into_iter()
                        .flatten()
                        .cloned()
                        .map(|mut mapping| {
                            mapping.generated_start += shift;
                            mapping.generated_end = mapping.generated_end.map(|end| end + shift);
                            mapping
                        })
                        .collect();
                    replacements.push(crate::output_edits::OutputEdit {
                        start: import.start,
                        end: import.end,
                        text: format!("{prefix}{}{suffix}", assets[target].css),
                        mappings: child_mappings,
                    });
                } else {
                    retained_later_import = true;
                }
            }
            replacements.reverse();
            let (css, output) = crate::output_edits::apply_output_edits(
                source,
                mappings
                    .get(&node.id)
                    .map(Vec::as_slice)
                    .unwrap_or_default(),
                replacements,
                &node.id,
            )?;
            mappings.insert(node.id.clone(), output);
            let remaining_imports = crate::stylesheet_graph::source_imports(&css, &node.id)?;
            relative_base[index] = remaining_imports
                .iter()
                .any(|import| !crate::stylesheet_resources::independent_url(&import.specifier))
                || crate::analyze_css_resources(&css)
                    .iter()
                    .any(|resource| !crate::stylesheet_resources::independent_url(&resource.url));
            inlineable[index] = !namespace && remaining_imports.is_empty();
            assets[index].css = css;
            done[index] = true;
            progress = true;
        }
        if !progress {
            // Cyclic transport graphs keep their original boundaries.
            return Ok(assets);
        }
    }
}

fn import_context(source: &str) -> (bool, usize) {
    let tokens = tokenize_css_syntax(source);
    let mut namespace = false;
    let mut preamble = source.len();
    for statement in collect_css_syntax_statements(&tokens) {
        if statement.parent.is_some() {
            continue;
        }
        let Some(first) = tokens.get(statement.tokens.start) else {
            continue;
        };
        if let CssSyntaxKind::AtKeyword(name) = &first.kind {
            if name.eq_ignore_ascii_case("namespace") {
                namespace = true;
            }
            if !statement.has_block
                && ["charset", "layer", "import"]
                    .iter()
                    .any(|allowed| name.eq_ignore_ascii_case(allowed))
            {
                continue;
            }
        }
        preamble = preamble.min(first.bytes.start);
    }
    (namespace, preamble)
}

fn top_level_statements(source: &str) -> usize {
    let tokens = tokenize_css_syntax(source);
    collect_css_syntax_statements(&tokens)
        .into_iter()
        .filter(|statement| statement.parent.is_none())
        .count()
}

// URL assignment belongs to the host. Relative references can move only when
// the assigned delivery base is identical; explicit resource relocation removes
// this constraint without guessing filesystem-to-browser URL relationships.
fn same_resource_base(left: &str, right: &str) -> bool {
    fn base(url: &str) -> &str {
        url.split(['?', '#'])
            .next()
            .unwrap_or_default()
            .rsplit_once('/')
            .map_or("", |(base, _)| base)
    }
    base(left) == base(right)
}
