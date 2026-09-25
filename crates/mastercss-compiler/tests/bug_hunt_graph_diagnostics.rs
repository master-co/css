use mastercss_compiler::{
    CompileNativeCssOptions, compile_css_directives, compile_css_stylesheet_graph,
};
use serde_json::{Value, json};

fn request(source: &str) -> Value {
    json!({
        "graph":{"entry":"entry.css","files":{"entry.css":"@import './child.css';","child.css":source},"edges":[{"from":"entry.css","specifier":"./child.css","resolved":"child.css"}]},
        "urls":{"entry.css":"/out/entry.css","child.css":"/out/child.css"},
        "resourceURLs":{"child.css":{"a.png":"/output/long-name-for-resource.png","b.png":"/b"}},
        "baseManifest":{"version":1,"languageVersion":3,"utilities":[]}
    })
}

#[test]
fn graph_diagnostics_retain_original_utf16_ranges_after_resource_edits() {
    for (source, token) in [
        (
            "/*😀*/.image{background:url(a.png)}\r\n.x{@compose unknown-utility;}",
            "unknown-utility",
        ),
        (
            "/*😀*/.image{background:url(a.png)} @utilities invalid {paint{color:red}}",
            "@utilities",
        ),
        (
            ".a{background:image-set(\"a.png\" 1x,url(b.png) 2x)}\n/*😀*/.b{background:url(b.png)}.x{@compose unknown-utility;}",
            "unknown-utility",
        ),
        (
            "/*\u{1F600}*/.a{background:image-set(\r\n\"a.png\" 1x,\r\nurl(b.png) 2x)}\n.x{@compose unknown-utility;}",
            "unknown-utility",
        ),
    ] {
        let error = compile_css_stylesheet_graph(&serde_json::from_value(request(source)).unwrap())
            .unwrap_err()
            .diagnostic();
        assert_eq!(error.source.as_deref(), Some("child.css"));
        let start = source[..source.find(token).unwrap()].encode_utf16().count() as u32;
        let range = error.range.unwrap();
        assert_eq!(range.start, start);
        assert_eq!(range.end, start + token.encode_utf16().count() as u32);
    }
}

fn source_references(value: &Value, output: &mut Vec<Value>) {
    match value {
        Value::Object(object) if object.contains_key("file") && object.contains_key("range") => {
            output.push(value.clone())
        }
        Value::Object(object) => object
            .values()
            .for_each(|value| source_references(value, output)),
        Value::Array(array) => array
            .iter()
            .for_each(|value| source_references(value, output)),
        _ => {}
    }
}

#[test]
fn relocated_style_definition_metadata_uses_original_ranges_and_locations() {
    let source = "/*😀*/.a{background:image-set(\"a.png\" 1x,url(b.png) 2x)}\r\n@utilities{paint{background:url(a.png)}}\n.example{@compose paint;}";
    let original = compile_css_directives(
        source,
        &CompileNativeCssOptions {
            from: "child.css".into(),
            ..Default::default()
        },
    )
    .unwrap();
    let actual =
        compile_css_stylesheet_graph(&serde_json::from_value(request(source)).unwrap()).unwrap();
    let mut expected_refs = Vec::new();
    let mut actual_refs = Vec::new();
    source_references(
        &serde_json::to_value(original.style_definitions).unwrap(),
        &mut expected_refs,
    );
    source_references(
        &serde_json::to_value(actual.directives.style_definitions).unwrap(),
        &mut actual_refs,
    );
    assert!(!expected_refs.is_empty());
    assert_eq!(actual_refs, expected_refs);
    assert!(
        actual.stylesheets[1]
            .css
            .contains("/output/long-name-for-resource.png")
    );
}
