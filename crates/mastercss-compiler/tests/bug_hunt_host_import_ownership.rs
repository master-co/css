use mastercss_compiler::{CompileCssStylesheetGraphInput, compile_css_stylesheet_graph_input};
use serde_json::json;

#[test]
fn host_entry_imports_are_removed_without_dropping_child_boundaries() {
    let request: CompileCssStylesheetGraphInput = serde_json::from_value(json!({
        "graph": {"entry":"entry", "files":{
            "entry":"@import 'font-package';@import './child.css' layer(a);.entry{display:block}",
            "child":"@import 'https://remote.test/child.css';.child{display:grid}"
        },"edges":[{"from":"entry","specifier":"./child.css","resolved":"child"}]},
        "urls":{"entry":"/entry.css","child":"/child.css"},
        "hostImports":{"entry":["font-package"]}, "inlineImports":true
    }))
    .unwrap();
    let result = compile_css_stylesheet_graph_input(&request).unwrap();
    assert!(
        result
            .stylesheets
            .iter()
            .all(|sheet| !sheet.css.contains("font-package"))
    );
    assert!(
        result
            .stylesheets
            .iter()
            .any(|sheet| sheet.css.contains("https://remote.test/child.css"))
    );
    assert!(result.directives.css.contains("layer(a)"));
    assert_eq!(result.stylesheets.len(), 2);
}

#[test]
fn host_import_removal_preserves_original_native_source_anchors() {
    let source = "/*😀*/\n@import 'font-package' layer(fonts);\n.entry { color:red; }";
    let request: CompileCssStylesheetGraphInput = serde_json::from_value(json!({
        "graph":{"entry":"entry","files":{"entry":source},"edges":[]},
        "urls":{"entry":"/entry.css"}, "hostImports":{"entry":["font-package"]}
    }))
    .unwrap();
    let result = compile_css_stylesheet_graph_input(&request).unwrap();
    let sheet = &result.stylesheets[0];
    assert!(!sheet.css.contains("@import"));
    assert!(!sheet.css.contains("fonts"));
    let mapping = sheet
        .output_mappings
        .iter()
        .find(|mapping| {
            mapping.generated_start
                == sheet.css[..sheet.css.find(".entry").unwrap()]
                    .encode_utf16()
                    .count() as u32
        })
        .expect("native selector mapping retained");
    assert_eq!(mapping.source.file.as_deref(), Some("entry"));
    assert_eq!(
        mapping.source.range.start,
        source[..source.find(".entry").unwrap()]
            .encode_utf16()
            .count() as u32
    );
}

#[test]
fn host_ownership_cannot_suppress_resolved_or_missing_imports() {
    for specifier in ["./child.css", "missing"] {
        let request: CompileCssStylesheetGraphInput = serde_json::from_value(json!({
            "graph":{"entry":"entry","files":{"entry":"@import './child.css';","child":".child{display:grid}"},
                "edges":[{"from":"entry","specifier":"./child.css","resolved":"child"}]},
            "urls":{"entry":"/entry.css","child":"/child.css"}, "hostImports":{"entry":[specifier]}
        })).unwrap();
        assert!(
            compile_css_stylesheet_graph_input(&request)
                .unwrap_err()
                .to_string()
                .contains("unresolved authored import")
        );
    }
}
