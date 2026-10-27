use std::{cell::RefCell, collections::HashMap};

use mastercss_compiler::{
    CssImportGraphRequest, CssImportProvider, render_css_stylesheet_graph,
    resolve_css_stylesheet_graph, resolve_prepared_css_stylesheet_graph,
};
use serde_json::{Value, json};

struct Files {
    sources: HashMap<String, String>,
    loads: RefCell<Vec<String>>,
}

impl Files {
    fn new(files: &[(&str, &str)]) -> Self {
        Self {
            sources: files
                .iter()
                .map(|(id, source)| ((*id).into(), (*source).into()))
                .collect(),
            loads: RefCell::new(Vec::new()),
        }
    }
}

impl CssImportProvider for Files {
    type Error = String;
    fn load(&self, id: &str) -> Result<String, String> {
        self.loads.borrow_mut().push(id.into());
        self.sources
            .get(id)
            .cloned()
            .ok_or_else(|| format!("missing:{id}"))
    }
    fn resolve(&self, specifier: &str, _: &str) -> Result<Option<String>, String> {
        if specifier == "resolve-error" {
            return Err("provider denied".into());
        }
        Ok((!specifier.starts_with("https:")).then(|| specifier.into()))
    }
}

#[test]
fn preserves_duplicate_edges_and_loads_diamond_nodes_once() {
    let files = Files::new(&[
        ("entry", "@import 'a' layer;@import 'b';@import 'a' layer;"),
        ("a", "@import 'shared';.a{color:red}"),
        ("b", "@import 'shared';"),
        ("shared", ".shared{color:blue}"),
    ]);
    let graph = resolve_css_stylesheet_graph("entry", &files).unwrap();
    assert_eq!(*files.loads.borrow(), ["entry", "a", "shared", "b"]);
    assert_eq!(graph.stylesheets[0].imports.len(), 3);
    for node in &graph.stylesheets {
        assert_eq!(node.source, files.sources[&node.id]);
    }
    assert_eq!(
        graph.stylesheets[0].imports[0].resolved.as_deref(),
        Some("a")
    );
    assert_eq!(
        graph.stylesheets[0].imports[2].resolved.as_deref(),
        Some("a")
    );
}

#[test]
fn decoded_imports_keep_utf16_ranges_and_opaque_text() {
    let source = "/*🦀 @import 'fake';*/\n@IMPORT url('child') layer(foo);\n@\\69mport 'ch\\69ld' print;.x{content:\"@import 'fake';\"}";
    let files = Files::new(&[("entry", source), ("child", ".child{color:red}")]);
    let graph = resolve_css_stylesheet_graph("entry", &files).unwrap();
    let edges = &graph.stylesheets[0].imports;
    assert_eq!(edges.len(), 2);
    assert_eq!(
        edges[0].start as usize,
        source[..source.find("@IMPORT").unwrap()]
            .encode_utf16()
            .count()
    );
    assert!(edges.iter().all(|edge| edge.specifier == "child"));
    assert_eq!(edges[1].statement, "@\\69mport 'ch\\69ld' print;");
    let urls = HashMap::from([
        ("entry".into(), "/entry.css".into()),
        ("child".into(), "/child.css".into()),
    ]);
    let assets = render_css_stylesheet_graph(&graph, &urls).unwrap();
    assert!(assets[0].css.starts_with("/*🦀 @import 'fake';*/"));
    assert!(assets[0].css.ends_with(".x{content:\"@import 'fake';\"}"));
}

#[test]
fn references_are_reported_with_original_filename_and_removed_before_ranges() {
    let source = "/*🦀*/@reference 'tokens.css';\n@import 'child';";
    let graph =
        resolve_css_stylesheet_graph("entry", &Files::new(&[("entry", source), ("child", "")]))
            .unwrap();
    assert_eq!(graph.references.len(), 1);
    assert_eq!(graph.references[0].file.as_deref(), Some("entry"));
    assert!(!graph.stylesheets[0].source.contains("@reference"));
    let edge = &graph.stylesheets[0].imports[0];
    assert_eq!(
        edge.start as usize,
        graph.stylesheets[0]
            .source
            .split("@import")
            .next()
            .unwrap()
            .encode_utf16()
            .count()
    );
}

#[test]
fn provider_failures_and_cycles_retain_actionable_paths() {
    for (source, expected) in [
        ("@import 'missing';", "missing:missing"),
        ("@import 'resolve-error';", "provider denied"),
    ] {
        let error =
            resolve_css_stylesheet_graph("entry", &Files::new(&[("entry", source)])).unwrap_err();
        assert!(error.to_string().contains(expected), "{error}");
    }
    let error = resolve_css_stylesheet_graph(
        "entry",
        &Files::new(&[("entry", "@import 'child';"), ("child", "@import 'entry';")]),
    )
    .unwrap_err();
    assert!(
        error.to_string().contains("entry -> child -> entry"),
        "{error}"
    );
}

#[test]
fn deep_graph_does_not_recurse_on_the_rust_call_stack() {
    let mut files = Files::new(&[]);
    for index in 0..2048 {
        files.sources.insert(
            index.to_string(),
            if index == 2047 {
                ".x{color:red}".into()
            } else {
                format!("@import '{}';", index + 1)
            },
        );
    }
    let graph = resolve_css_stylesheet_graph("0", &files).unwrap();
    assert_eq!(graph.stylesheets.len(), 2048);
    assert_eq!(files.loads.borrow().len(), 2048);
}

#[test]
fn renderer_preserves_external_bytes_and_escapes_host_urls() {
    let source = "@import 'child' layer(outer) supports(display:grid) print;\n@import 'https://remote.test/a.css' /*keep*/ layer;";
    let graph = resolve_css_stylesheet_graph(
        "entry",
        &Files::new(&[("entry", source), ("child", ".x{color:red}")]),
    )
    .unwrap();
    assert_eq!(graph.stylesheets[0].imports[1].resolved, None);
    let url = "/child\"\\name.css";
    let urls = HashMap::from([
        ("entry".into(), "/entry.css".into()),
        ("child".into(), url.into()),
    ]);
    let assets = render_css_stylesheet_graph(&graph, &urls).unwrap();
    assert!(
        assets[0]
            .css
            .ends_with("@import 'https://remote.test/a.css' /*keep*/ layer;")
    );
    let parsed = resolve_css_stylesheet_graph(
        "entry",
        &Files::new(&[("entry", &assets[0].css), (url, "")]),
    )
    .unwrap();
    assert_eq!(parsed.stylesheets[0].imports[0].specifier, url);
    assert!(
        assets[0]
            .css
            .contains("layer(outer) supports(display: grid) print")
    );
}

#[test]
fn renderer_rejects_missing_targets_urls_and_stale_ranges() {
    let graph = resolve_css_stylesheet_graph(
        "entry",
        &Files::new(&[("entry", "@import 'child';"), ("child", "")]),
    )
    .unwrap();
    let urls = HashMap::from([
        ("entry".into(), "/entry.css".into()),
        ("child".into(), "/child.css".into()),
    ]);
    assert!(render_css_stylesheet_graph(&graph, &HashMap::new()).is_err());
    for fault in 0..6 {
        let mut invalid = graph.clone();
        match fault {
            0 => invalid.stylesheets[0].imports[0].start = 999,
            1 => invalid.stylesheets[0].imports[0].statement = "@import 'other';".into(),
            2 => invalid.stylesheets[0].imports[0].specifier = "other".into(),
            3 => invalid.stylesheets[0].imports[0].resolved = Some("unknown".into()),
            4 => invalid.version = 2,
            _ => invalid.entry = "unknown".into(),
        }
        assert!(
            render_css_stylesheet_graph(&invalid, &urls).is_err(),
            "fault {fault}"
        );
    }
}

#[test]
fn browser_corpus_assets() {
    let cases: Vec<Value> =
        serde_json::from_str(include_str!("bug_hunt_stylesheet_graph.json")).unwrap();
    for case in cases {
        let request: CssImportGraphRequest = serde_json::from_value(json!({
            "entry": "entry", "files": {"entry": case["entry"], "local": case["local"].as_str().unwrap_or(".example{color:red}")},
            "edges": [{"from":"entry", "specifier":"./local.css", "resolved":"local"}]
        })).unwrap();
        let graph = resolve_prepared_css_stylesheet_graph(&request).unwrap();
        assert_eq!(graph.stylesheets.len(), 2, "{}", case["id"]);
        assert_eq!(graph.stylesheets[0].source, request.files["entry"]);
        let urls = HashMap::from([
            ("entry".into(), "/delivered/entry.css".into()),
            ("local".into(), "/delivered/local.css".into()),
        ]);
        let assets = render_css_stylesheet_graph(&graph, &urls).unwrap();
        println!(
            "BH_GRAPH_JSON:{}",
            json!({"id":case["id"], "assets":assets})
        );
    }
}
