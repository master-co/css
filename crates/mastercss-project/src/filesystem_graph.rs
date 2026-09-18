use std::{
    cell::RefCell,
    collections::{HashMap, HashSet},
};

use mastercss_compiler::{
    CompilerError, CssImportGraphEdge, CssImportGraphRequest, CssImportProvider,
    resolve_css_stylesheet_graph,
};

use super::FilesystemCssProvider;

// Capture the authored bytes used by discovery, including references removed
// from its rendered nodes. Compilation must consume that same file snapshot.
#[derive(Default)]
struct CapturedFiles(RefCell<HashMap<String, String>>);
impl CssImportProvider for CapturedFiles {
    type Error = String;

    fn load(&self, id: &str) -> Result<String, String> {
        if let Some(source) = self.0.borrow().get(id) {
            return Ok(source.clone());
        }
        let source = FilesystemCssProvider.load(id)?;
        self.0.borrow_mut().insert(id.into(), source.clone());
        Ok(source)
    }

    fn resolve(&self, specifier: &str, from: &str) -> Result<Option<String>, String> {
        FilesystemCssProvider.resolve(specifier, from)
    }
}

pub(super) fn prepare(entry: &str) -> Result<CssImportGraphRequest, CompilerError> {
    let provider = CapturedFiles::default();
    let mut edges = Vec::new();
    let mut visited = HashSet::new();
    let mut pending = vec![entry.to_owned()];
    while let Some(root) = pending.pop() {
        if !visited.insert(root.clone()) {
            continue;
        }
        let graph = resolve_css_stylesheet_graph(&root, &provider)?;
        for node in graph.stylesheets {
            for import in node.imports {
                if let Some(resolved) = import.resolved {
                    let edge = CssImportGraphEdge {
                        from: node.id.clone(),
                        specifier: import.specifier,
                        resolved,
                    };
                    if !edges.contains(&edge) {
                        edges.push(edge);
                    }
                }
            }
        }
        for reference in graph.references {
            let from = reference.file.as_deref().unwrap_or(&root);
            let resolved = provider
                .resolve(&reference.source, from)
                .map_err(|message| CompilerError::Import {
                    filename: from.into(),
                    message,
                })?
                .ok_or_else(|| CompilerError::Import {
                    filename: from.into(),
                    message: format!("Unresolved CSS reference: {}", reference.source),
                })?;
            pending.push(resolved.clone());
            let edge = CssImportGraphEdge {
                from: from.into(),
                specifier: reference.source,
                resolved,
            };
            if !edges.contains(&edge) {
                edges.push(edge);
            }
        }
    }
    Ok(CssImportGraphRequest {
        entry: entry.into(),
        files: provider.0.into_inner(),
        edges,
    })
}
