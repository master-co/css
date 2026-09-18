use mastercss_compiler::{analyze_css_dependencies, resolve_prepared_css_import_graph};
use serde_json::json;

#[test]
fn decoded_import_discovery_and_resolution_share_css_rules_and_utf16_ranges() {
    for statement in [
        "@IMPORT './child.css';",
        r#"@\69mport u\72l('./ch\69ld.css') layer(theme) print;"#,
        "@import /*comment*/ url('./child.css') supports(display:grid);",
    ] {
        let source = format!("/*😀*/{statement}");
        let analysis = analyze_css_dependencies(&source);
        assert_eq!(analysis.imports.len(), 1, "{statement}");
        let import = &analysis.imports[0];
        assert_eq!(import.source, "./child.css");
        let start = mastercss_lexer::utf16_to_byte_offset(&source, import.start).unwrap();
        let end = mastercss_lexer::utf16_to_byte_offset(&source, import.end).unwrap();
        assert_eq!(&source[start..end], statement);
        let request=serde_json::from_value(json!({"entry":"entry","files":{"entry":source,"child":".example{color:red}"},"edges":[{"from":"entry","specifier":"./child.css","resolved":"child"}]})).unwrap();
        let graph = resolve_prepared_css_import_graph(&request).unwrap();
        assert_eq!(graph.dependencies, ["entry", "child"]);
        assert!(graph.source.contains("color:red"));
    }
}

#[test]
fn malformed_import_does_not_hide_other_valid_imports_during_analysis() {
    let source = "@import 123;@import './good.css';.x{content:'@import fake'}";
    let analysis = analyze_css_dependencies(source);
    assert_eq!(
        analysis
            .imports
            .iter()
            .map(|i| i.source.as_str())
            .collect::<Vec<_>>(),
        ["./good.css"]
    );
    let request =
        serde_json::from_value(json!({"entry":"entry","files":{"entry":source},"edges":[]}))
            .unwrap();
    assert!(resolve_prepared_css_import_graph(&request).is_err());
}

#[test]
fn nested_and_opaque_import_text_is_not_an_edge() {
    let source = r#"/*@import 'comment.css';*/.x{content:"@import 'string.css';"} @media screen{@import 'nested.css';}.a{--x: '@import fake.css;'}"#;
    assert!(analyze_css_dependencies(source).imports.is_empty());
}

#[test]
fn escaped_unresolved_nested_import_still_reports_the_known_qualified_limit() {
    let request=serde_json::from_value(json!({"entry":"entry","files":{"entry":"@import 'child' print;","child":"@IMPORT 'https://external.test/x.css';"},"edges":[{"from":"entry","specifier":"child","resolved":"child"}]})).unwrap();
    let error = resolve_prepared_css_import_graph(&request).unwrap_err();
    assert!(
        error
            .to_string()
            .contains("resolve its nested imports first"),
        "{error}"
    );
}
