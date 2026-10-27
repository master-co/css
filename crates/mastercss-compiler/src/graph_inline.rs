use crate::{
    CompileCssStylesheetGraphRequest, CompiledCssStylesheetGraph, CompilerError,
    CssStylesheetAsset, CssStylesheetGraph, CssStylesheetNode, compile_css_stylesheet_graph,
};
use serde::Deserialize;
use std::collections::{HashMap, HashSet};

/// Wire invocation options leave the existing Rust graph request usable by
/// project/asset consumers that need separate stylesheet outputs.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileCssStylesheetGraphInput {
    #[serde(flatten)]
    pub request: CompileCssStylesheetGraphRequest,
    #[serde(default)]
    pub inline_imports: bool,
    /// Imports already emitted by the host, keyed by their original file owner.
    #[serde(default)]
    pub host_imports: HashMap<String, Vec<String>>,
}

pub fn compile_css_stylesheet_graph_input(
    input: &CompileCssStylesheetGraphInput,
) -> Result<CompiledCssStylesheetGraph, CompilerError> {
    let mut result = compile_css_stylesheet_graph(&input.request)?;
    if input
        .host_imports
        .values()
        .any(|imports| !imports.is_empty())
    {
        let authored = crate::resolve_prepared_css_stylesheet_graph(&input.request.graph)?;
        for (file, specifiers) in &input.host_imports {
            let node = authored.stylesheets.iter().find(|node| &node.id == file);
            for specifier in specifiers {
                if input.request.urls.values().any(|url| url == specifier)
                    || !node.is_some_and(|node| {
                        node.imports.iter().any(|import| {
                            import.specifier == *specifier && import.resolved.is_none()
                        })
                    })
                {
                    return Err(CompilerError::Import {
                        filename: file.clone(),
                        message: format!(
                            "Host import must identify an unresolved authored import: {specifier}"
                        ),
                    });
                }
            }
        }
        for sheet in &mut result.stylesheets {
            let Some(specifiers) = input.host_imports.get(&sheet.id) else {
                continue;
            };
            let edits = crate::stylesheet_graph::source_imports(&sheet.css, &sheet.id)?
                .into_iter()
                .filter(|import| specifiers.contains(&import.specifier))
                .map(|import| crate::output_edits::OutputEdit {
                    start: import.start,
                    end: import.end,
                    text: String::new(),
                    mappings: Vec::new(),
                })
                .collect();
            (sheet.css, sheet.output_mappings) = crate::output_edits::apply_output_edits(
                &sheet.css,
                &sheet.output_mappings,
                edits,
                &sheet.id,
            )?;
        }
        result.directives.css = result
            .stylesheets
            .iter()
            .find(|sheet| sheet.id == result.entry)
            .expect("entry retained")
            .css
            .clone();
    }
    if !input.inline_imports {
        return Ok(result);
    }
    let error = |message: &str| CompilerError::Import {
        filename: result.entry.clone(),
        message: message.into(),
    };
    let mut hrefs = HashMap::new();
    for sheet in &result.stylesheets {
        if sheet.href.is_empty()
            || hrefs
                .insert(sheet.href.as_str(), sheet.id.as_str())
                .is_some()
        {
            return Err(error("Inlining requires distinct nonempty stylesheet URLs"));
        }
    }
    let mut nodes = Vec::new();
    let mut assets = Vec::new();
    let mut mappings = HashMap::new();
    for sheet in &result.stylesheets {
        let mut imports = crate::stylesheet_graph::source_imports(&sheet.css, &sheet.id)?;
        for import in &mut imports {
            import.resolved = hrefs
                .get(import.specifier.as_str())
                .map(|id| (*id).to_owned());
        }
        nodes.push(CssStylesheetNode {
            id: sheet.id.clone(),
            source: sheet.css.clone(),
            imports,
        });
        assets.push(CssStylesheetAsset {
            id: sheet.id.clone(),
            href: sheet.href.clone(),
            css: sheet.css.clone(),
        });
        mappings.insert(sheet.id.clone(), sheet.output_mappings.clone());
    }
    let graph = CssStylesheetGraph {
        version: 1,
        entry: result.entry.clone(),
        stylesheets: nodes,
        references: Vec::new(),
    };
    let assets =
        crate::stylesheet_inline::inline_stylesheet_imports_mapped(&graph, assets, &mut mappings)?;
    // Return only remaining reachable delivery assets. Inlining may eliminate
    // a local link, but retained external/namespace boundaries still need files.
    let mut children = HashMap::new();
    for asset in &assets {
        children.insert(
            asset.id.as_str(),
            crate::stylesheet_graph::source_imports(&asset.css, &asset.id)?
                .into_iter()
                .filter_map(|import| hrefs.get(import.specifier.as_str()).copied())
                .collect::<Vec<_>>(),
        );
    }
    let mut needed = HashSet::new();
    let mut pending = vec![result.entry.as_str()];
    while let Some(id) = pending.pop() {
        if needed.insert(id) {
            pending.extend(children[id].iter().copied());
        }
    }
    let needed = needed
        .into_iter()
        .map(str::to_owned)
        .collect::<HashSet<_>>();
    for (sheet, asset) in result.stylesheets.iter_mut().zip(assets) {
        sheet.css = asset.css;
        sheet.output_mappings = mappings.remove(&sheet.id).unwrap_or_default();
    }
    result
        .stylesheets
        .retain(|sheet| needed.contains(&sheet.id));
    result.directives.css = result
        .stylesheets
        .iter()
        .find(|sheet| sheet.id == result.entry)
        .expect("entry retained")
        .css
        .clone();
    Ok(result)
}
