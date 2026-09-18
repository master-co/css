use mastercss_compiler::compile_css_stylesheet_graph;
use serde_json::json;

#[test]
fn selected_native_output_keeps_local_reachability_and_only_selected_external_imports() {
    let base = json!({
        "graph": {"entry":"entry", "files": {
            "entry":"@import './bridge.css' supports(display:grid);@import 'https://external.test/entry.css';@utilities{paint{color:blue}}.entry{color:red}.entry-compose{@compose paint;}",
            "bridge":"@import './selected.css' layer(base);@import 'https://external.test/bridge.css';.bridge{color:red}",
            "selected":"@import 'https://external.test/selected.css';.selected{color:blue}.selected-compose{@compose paint;}"
        }, "edges":[
            {"from":"entry","specifier":"./bridge.css","resolved":"bridge"},
            {"from":"bridge","specifier":"./selected.css","resolved":"selected"}
        ]},
        "urls":{"entry":"/output/entry.css","bridge":"/output/bridge.css","selected":"/output/selected.css"},
        "baseManifest":{"version":1,"utilities":[]},
        "nativeStylesheets":["selected"]
    });
    let result =
        compile_css_stylesheet_graph(&serde_json::from_value(base.clone()).unwrap()).unwrap();
    assert!(
        result.stylesheets[0]
            .css
            .replace(' ', "")
            .contains("supports(display:grid)")
    );
    assert!(result.stylesheets[0].css.contains("/output/bridge.css"));
    assert!(!result.stylesheets[0].css.contains("external.test"));
    assert!(!result.stylesheets[0].css.contains(".entry"));
    assert!(result.stylesheets[0].generated_css.is_empty());
    assert!(result.stylesheets[1].css.contains("layer(base)"));
    assert!(result.stylesheets[1].css.contains("/output/selected.css"));
    assert!(!result.stylesheets[1].css.contains("external.test"));
    assert!(!result.stylesheets[1].css.contains(".bridge"));
    assert!(
        result.stylesheets[2]
            .css
            .contains("external.test/selected.css")
    );
    assert!(result.stylesheets[2].css.contains(".selected"));
    assert!(result.manifest.to_string().contains("paint"));

    let mut raw_disabled = base.clone();
    raw_disabled["options"] = json!({"preserveNativeCSS":false});
    let composed =
        compile_css_stylesheet_graph(&serde_json::from_value(raw_disabled).unwrap()).unwrap();
    assert!(composed.stylesheets[2].css.contains(".selected-compose"));
    assert!(composed.stylesheets[2].native_css.is_empty());
    assert!(!composed.stylesheets[2].css.contains("external.test"));

    let mut empty = base.clone();
    empty["nativeStylesheets"] = json!([]);
    let result = compile_css_stylesheet_graph(&serde_json::from_value(empty).unwrap()).unwrap();
    assert_eq!(result.stylesheets.len(), 1);
    assert!(result.stylesheets[0].css.is_empty());
    assert_eq!(result.directives.dependencies.len(), 3);
    assert!(
        result
            .stylesheets
            .iter()
            .all(|sheet| !sheet.css.contains("external.test"))
    );

    let mut invalid = base;
    invalid["nativeStylesheets"] = json!(["missing"]);
    let error =
        compile_css_stylesheet_graph(&serde_json::from_value(invalid).unwrap()).unwrap_err();
    assert!(
        error
            .to_string()
            .contains("Unknown native stylesheet: missing")
    );
}

#[test]
fn suppressed_native_imports_do_not_declare_unused_layers() {
    let base = json!({
        "graph": {"entry":"entry", "files": {
            "entry":"@import './dead.css' layer(later);@import './bridge.css' supports(display:grid);@utilities{paint{color:purple}}.live{@compose paint;}",
            "dead":"@utilities{unused{color:red}}",
            "bridge":"@import './leaf.css' layer(base);",
            "leaf":".leaf{@compose paint;}"
        }, "edges":[
            {"from":"entry","specifier":"./dead.css","resolved":"dead"},
            {"from":"entry","specifier":"./bridge.css","resolved":"bridge"},
            {"from":"bridge","specifier":"./leaf.css","resolved":"leaf"}
        ]},
        "urls":{"entry":"/entry.css","dead":"/dead.css","bridge":"/bridge.css","leaf":"/leaf.css"},
        "baseManifest":{"version":1,"utilities":[]}
    });
    let compile =
        |value| compile_css_stylesheet_graph(&serde_json::from_value(value).unwrap()).unwrap();
    let original = compile(base.clone());
    assert!(original.stylesheets[0].css.contains("layer(later)"));
    assert_eq!(original.stylesheets.len(), 4);
    for selection in [json!(["entry", "leaf"]), json!(["leaf"])] {
        let mut request = base.clone();
        request["nativeStylesheets"] = selection;
        request["options"] = json!({"preserveNativeCSS":false});
        let result = compile(request);
        assert_eq!(result.stylesheets.len(), 3);
        assert!(!result.stylesheets[0].css.contains("layer(later)"));
        assert!(
            result.stylesheets[0]
                .css
                .contains("supports(display: grid)")
        );
        assert!(result.stylesheets[1].css.contains("layer(base)"));
        assert!(result.stylesheets[2].css.contains(".leaf"));
        assert_eq!(result.manifest, original.manifest);
        assert_eq!(result.directives.dependencies.len(), 4);
    }
    let mut excluded = base;
    excluded["nativeStylesheets"] = json!([]);
    let result = compile(excluded);
    assert_eq!(result.stylesheets.len(), 1);
    assert!(result.stylesheets[0].css.is_empty());
    assert_eq!(result.manifest, original.manifest);
}
