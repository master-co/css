use mastercss_compiler::{
    CompileCssStylesheetGraphRequest, CompileNativeCssOptions, LowerCssDirectivesOptions,
    compile_css_directives, compile_css_stylesheet_graph, lower_css_directives,
};
use serde_json::{Value, json};

fn request(entry: &str, child: &str) -> CompileCssStylesheetGraphRequest {
    serde_json::from_value(json!({
        "graph": {"entry":"entry", "files":{"entry":entry, "child":child},
            "edges":[{"from":"entry", "specifier":"./child.css", "resolved":"child"}]},
        "urls":{"entry":"/output/entry.css", "child":"/output/child.css"},
        "baseManifest":{"version":1,"languageVersion":2,"utilities":[]}
    }))
    .unwrap()
}

#[test]
fn child_native_compose_resolves_managed_definitions_declared_by_parent() {
    let request = request(
        "@import './child.css' layer(shared);@utilities{paint{color:red}}",
        ".example{@compose paint;}",
    );
    let output = compile_css_stylesheet_graph(&request).unwrap();
    assert!(output.stylesheets[0].css.contains("layer(shared)"));
    assert!(!output.stylesheets[0].css.contains("@utilities"));
    assert!(output.stylesheets[1].generated_css.contains("color:red"));
    assert!(output.stylesheets[1].css.contains(".example"));
    assert!(!output.stylesheets[1].css.contains("@compose"));
    assert_eq!(output.directives.dependencies, ["entry", "child"]);
}

#[test]
fn manifest_and_managed_dependencies_match_concatenated_authoring_order() {
    let entry = "@import './child.css';@theme{--tone:blue;}@utilities{second{color:red}}";
    let child = "@theme{--tone:red;}@utilities{first{@compose second;}}";
    let output = compile_css_stylesheet_graph(&request(entry, child)).unwrap();
    let flat = format!("{child}{}", entry.replace("@import './child.css';", ""));
    let parsed = compile_css_directives(&flat, &CompileNativeCssOptions::default()).unwrap();
    let expected = lower_css_directives(
        &parsed.manifest_input,
        parsed.style_definitions.as_deref().unwrap_or_default(),
        &[],
        &LowerCssDirectivesOptions {
            base_manifest: Some(json!({"version":1,"languageVersion":2,"utilities":[]})),
            resolution_manifest: None,
        },
    )
    .unwrap();
    assert_eq!(output.manifest, expected.manifest);
}

#[test]
fn repeated_imports_use_occurrence_order_for_manifest_overrides() {
    let mut request = request(
        "@import './child.css';@import './other.css';@import './child.css';.example{@compose paint;}",
        "@utilities{paint{color:red}}",
    );
    request
        .graph
        .files
        .insert("other".into(), "@utilities{paint{color:blue}}".into());
    request.graph.edges.push(
        serde_json::from_value(
            json!({"from":"entry", "specifier":"./other.css", "resolved":"other"}),
        )
        .unwrap(),
    );
    request
        .urls
        .insert("other".into(), "/output/other.css".into());
    let output = compile_css_stylesheet_graph(&request).unwrap();
    assert!(
        output.stylesheets[0].generated_css.contains("color:red"),
        "{}",
        output.stylesheets[0].css
    );
    assert_eq!(output.stylesheets.len(), 3);
    assert_eq!(
        output.stylesheets[0]
            .native_css
            .matches("child.css")
            .count(),
        2
    );
}

#[test]
fn native_filtering_does_not_remove_import_topology_or_manifest_definitions() {
    let mut request = request(
        "@import './child.css' print;@utilities{paint{color:green}}.unused{color:blue}",
        ".example{color:red}.unused{color:blue}",
    );
    request.options.classes = Some(vec!["example".into()]);
    request.options.prune_native_css = true;
    let output = compile_css_stylesheet_graph(&request).unwrap();
    assert!(output.stylesheets[0].css.contains("print"));
    assert!(
        !output
            .stylesheets
            .iter()
            .any(|sheet| sheet.css.contains("unused"))
    );
    assert!(output.stylesheets[1].css.contains(".example"));
    assert_eq!(output.directives.class_names, ["paint"]);
}

#[test]
fn generated_child_css_keeps_import_conditions_when_native_preservation_is_disabled() {
    let mut request = request(
        "@import './child.css' print;@utilities{paint{color:red}}",
        ".native{color:blue}.example{@compose paint;}",
    );
    request.options.preserve_native_css = false;
    let output = compile_css_stylesheet_graph(&request).unwrap();
    assert!(output.stylesheets[0].css.contains("print"));
    assert!(!output.stylesheets[1].css.contains(".native"));
    assert!(output.stylesheets[1].css.contains("color:red"));
}

#[test]
fn compiled_browser_corpus_assets() {
    let cases: Vec<Value> =
        serde_json::from_str(include_str!("bug_hunt_stylesheet_graph.json")).unwrap();
    for case in cases {
        let request: CompileCssStylesheetGraphRequest = serde_json::from_value(json!({
            "graph":{"entry":"entry", "files":{"entry":case["entry"], "local":case["local"].as_str().unwrap_or(".example{color:red}")},
                "edges":[{"from":"entry", "specifier":"./local.css", "resolved":"local"}]},
            "urls":{"entry":"/delivered/entry.css", "local":"/delivered/local.css"},
            "baseManifest":{"version":1,"languageVersion":2,"utilities":[]}, "options":{"classes":["example"]}
        })).unwrap();
        let output = compile_css_stylesheet_graph(&request).unwrap();
        assert_eq!(output.stylesheets.len(), 2);
        println!(
            "BH_COMPILED_GRAPH_JSON:{}",
            json!({"id":case["id"], "assets":output.stylesheets})
        );
    }
}

#[test]
fn native_compose_keeps_its_position_before_later_native_rules() {
    let output = compile_css_stylesheet_graph(&request(
        "@import './child.css';@utilities{paint{color:red}}",
        ".example{@compose paint;}.example{color:blue}",
    ))
    .unwrap();
    let css = output.stylesheets[1]
        .css
        .split_whitespace()
        .collect::<String>();
    assert!(
        css.find("color:red").unwrap()
            < css
                .find("color:#00f")
                .or_else(|| css.find("color:blue"))
                .unwrap(),
        "{css}"
    );
}

#[test]
fn authored_unknown_at_rules_cannot_collide_with_private_compose_slots() {
    let output = compile_css_stylesheet_graph(&request(
        "@import './child.css';@utilities{paint{color:red}}",
        "@--master-css-compose-slot-0;@--master-css-compose-slot-\\31;.example{@compose paint;}",
    ))
    .unwrap();
    let css = &output.stylesheets[1].css;
    assert!(css.contains("@--master-css-compose-slot-0;"), "{css}");
    assert!(css.contains("@--master-css-compose-slot-1;"), "{css}");
    assert!(!css.contains("@--master-css-compose-slot-2;"), "{css}");
    assert!(css.contains("color:red"));
}
