use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use mastercss_compiler::{CssImportGraphEdge, CssImportGraphRequest};
use mastercss_project::{ProjectEntryGraphIr, load_project_manifest_graphs_with_root};
use mastercss_scanner::ScannerSession;
use serde_json::json;

struct Project(PathBuf);
impl Project {
    fn new() -> Self {
        static COUNTER: AtomicU64 = AtomicU64::new(0);
        let path = std::env::temp_dir().join(format!(
            "mastercss-manifest-graph-{}-{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos(),
            COUNTER.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir_all(&path).unwrap();
        Self(path.canonicalize().unwrap())
    }
    fn file(&self, name: &str, source: &str) -> String {
        let file = self.0.join(name);
        fs::create_dir_all(file.parent().unwrap()).unwrap();
        fs::write(&file, source).unwrap();
        file.to_string_lossy().into_owned()
    }
}
impl Drop for Project {
    fn drop(&mut self) {
        fs::remove_dir_all(&self.0).unwrap();
    }
}

fn graph(entry: &str, files: &[(&str, &str)], edges: &[(&str, &str, &str)]) -> ProjectEntryGraphIr {
    ProjectEntryGraphIr {
        entry: entry.into(),
        source: String::new(),
        dependencies: Vec::new(),
        manifest_graph: Some(CssImportGraphRequest {
            entry: entry.into(),
            files: files
                .iter()
                .map(|(file, source)| ((*file).into(), (*source).into()))
                .collect::<HashMap<_, _>>(),
            edges: edges
                .iter()
                .map(|(from, specifier, resolved)| CssImportGraphEdge {
                    from: (*from).into(),
                    specifier: (*specifier).into(),
                    resolved: (*resolved).into(),
                })
                .collect(),
        }),
    }
}

fn css(manifest: &serde_json::Value, classes: &str) -> String {
    let mut scanner = ScannerSession::create(&manifest.to_string()).unwrap();
    scanner
        .scan("index.html", &format!("<div class=\"{classes}\"></div>"))
        .unwrap();
    scanner.state().unwrap().engine.text
}

#[test]
fn qualified_external_imports_do_not_block_manifest_or_source_plan_compilation() {
    let project = Project::new();
    let entry_source = "@import './styles/child.css' layer(outer) supports(display:grid) screen;@master entry;@utilities{paint{color:red}}@utilities{button{@compose paint;}}";
    let child_source = "@import 'https://invalid.invalid/external.css';@source './views/*.html';.native{background:url('./missing.png')}";
    let entry = project.file("entry.css", entry_source);
    let child = project.file("styles/child.css", child_source);
    let view = project.file("styles/views/view.html", "<div class=\"button\"></div>");
    let result = load_project_manifest_graphs_with_root(
        &project.0,
        vec![graph(
            &entry,
            &[(&entry, entry_source), (&child, child_source)],
            &[(&entry, "./styles/child.css", &child)],
        )],
        json!({"version":1,"languageVersion":3,"utilities":[]}),
    )
    .unwrap();
    assert!(css(&result.manifest, "button paint").contains(".button{color:red}"));
    assert_eq!(result.source_plan.files, vec![view]);
    assert!(
        result.css.is_empty() && result.native_css.is_empty() && result.generated_css.is_empty()
    );
    assert_eq!(result.dependencies.len(), 2);
    assert!(!Path::new(&project.0.join("styles/missing.png")).exists());
}

#[test]
fn references_resolve_managed_definitions_without_importing_their_sources_or_classes() {
    let project = Project::new();
    let entry_source =
        "@master entry;@reference './tokens.css';@utilities{button{@compose paint;}}";
    let reference_source = "@import 'https://invalid.invalid/external.css';@source './ignored/*.html';@utilities{paint{color:red}}.reference-native{color:blue}";
    let entry = project.file("entry.css", entry_source);
    let reference = project.file("tokens.css", reference_source);
    project.file("ignored/view.html", "ignored");
    let result = load_project_manifest_graphs_with_root(
        &project.0,
        vec![graph(
            &entry,
            &[(&entry, entry_source), (&reference, reference_source)],
            &[(&entry, "./tokens.css", &reference)],
        )],
        json!({"version":1,"languageVersion":3,"utilities":[]}),
    )
    .unwrap();
    let generated = css(&result.manifest, "button paint");
    assert!(generated.contains(".button{color:red}"));
    assert!(!generated.contains(".paint{"));
    assert!(result.source_plan.files.is_empty());
    assert!(
        !result
            .native_class_names
            .contains(&"reference-native".into())
    );
    assert!(result.dependencies.contains(&reference));
}

#[test]
fn prepared_reference_cycles_and_missing_edges_remain_errors() {
    let project = Project::new();
    let source = "@master entry;@reference './tokens.css';";
    let referenced = "@reference './entry.css';";
    let entry = project.file("entry.css", source);
    let tokens = project.file("tokens.css", referenced);
    let input = graph(
        &entry,
        &[(&entry, source), (&tokens, referenced)],
        &[
            (&entry, "./tokens.css", &tokens),
            (&tokens, "./entry.css", &entry),
        ],
    );
    let error = load_project_manifest_graphs_with_root(
        &project.0,
        vec![input],
        json!({"version":1,"languageVersion":3,"utilities":[]}),
    )
    .unwrap_err();
    assert!(
        error.to_string().contains("Circular CSS reference"),
        "{error}"
    );
    let error = load_project_manifest_graphs_with_root(
        &project.0,
        vec![graph(&entry, &[(&entry, source)], &[])],
        json!({"version":1,"languageVersion":3,"utilities":[]}),
    )
    .unwrap_err();
    assert!(
        error.to_string().contains("Unresolved CSS reference"),
        "{error}"
    );
}

#[test]
fn structured_project_entries_merge_in_order() {
    let project = Project::new();
    let first = "@master entry;@utilities{choice{color:red}}";
    let second = "@master entry;@utilities{choice{color:blue}}";
    let a = project.file("a.css", first);
    let b = project.file("b.css", second);
    let result = load_project_manifest_graphs_with_root(
        &project.0,
        vec![
            graph(&a, &[(&a, first)], &[]),
            graph(&b, &[(&b, second)], &[]),
        ],
        json!({"version":1,"languageVersion":3,"utilities":[]}),
    )
    .unwrap();
    let actual = css(&result.manifest, "choice");
    assert!(
        actual.contains(".choice{color:#00f}"),
        "CSS={actual} manifest={}",
        result.manifest
    );
    assert_eq!(result.entries, vec![a.clone(), b.clone()]);
    let reversed = load_project_manifest_graphs_with_root(
        &project.0,
        vec![
            graph(&b, &[(&b, second)], &[]),
            graph(&a, &[(&a, first)], &[]),
        ],
        json!({"version":1,"languageVersion":3,"utilities":[]}),
    )
    .unwrap();
    assert!(css(&reversed.manifest, "choice").contains(".choice{color:red}"));
}
