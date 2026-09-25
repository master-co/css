use mastercss_compiler::{CompileCssStylesheetGraphRequest, compile_css_stylesheet_graph};
use serde_json::{Value, json};

fn offset(text: &str, needle: &str) -> u32 {
    text[..text.find(needle).unwrap()].encode_utf16().count() as u32
}
fn mapping<'a>(sheet: &'a Value, needle: &str) -> &'a Value {
    let css = sheet["css"].as_str().unwrap();
    let start = offset(css, needle);
    sheet["outputMappings"]
        .as_array()
        .expect("graph output mappings")
        .iter()
        .find(|map| map["generatedStart"] == start)
        .unwrap_or_else(|| panic!("missing mapping for {needle}: {sheet}"))
}
fn compile(entry: &str, child: &str, resource_urls: Value) -> Value {
    let request: CompileCssStylesheetGraphRequest = serde_json::from_value(json!({
        "graph":{"entry":"/entry.css","files":{"/entry.css":entry,"/child.css":child},"edges":[{"from":"/entry.css","specifier":"./child.css","resolved":"/child.css"}]},
        "urls":{"/entry.css":"/entry.css","/child.css":"/assets/very-long-child-😀.css?version=abcdef"},
        "resourceURLs":resource_urls,
        "baseManifest":{"version":1,"languageVersion":3,"utilities":[]}
    })).unwrap();
    serde_json::to_value(compile_css_stylesheet_graph(&request).unwrap()).unwrap()
}
#[test]
fn graph_native_anchor_survives_import_url_length_change() {
    let entry = "@import './child.css' layer;/* 😀 */\n.after{margin:1px}";
    let result = compile(entry, ".child{padding:3rem}", Value::Null);
    let map = mapping(&result["stylesheets"][0], ".after");
    assert_eq!(map["source"]["file"], "/entry.css");
    assert_eq!(map["source"]["range"]["start"], offset(entry, ".after"));
}
#[test]
fn graph_compose_and_native_siblings_keep_original_child_anchors() {
    let child = "/* 😀 */\n@layer{.card{@compose paint;}.card{padding:3rem}}";
    let result = compile(
        "@import './child.css' layer;@utilities{paint{padding:2rem}}",
        child,
        Value::Null,
    );
    let sheet = &result["stylesheets"][1];
    let selector = mapping(sheet, ".card");
    assert_eq!(selector["source"]["file"], "/child.css");
    assert_eq!(selector["source"]["range"]["start"], offset(child, ".card"));
    let composed = mapping(sheet, "padding:2rem");
    assert_eq!(
        composed["source"]["range"]["start"],
        offset(child, "paint;")
    );
    assert_eq!(sheet["css"].as_str().unwrap().matches("@layer").count(), 1);
}
#[test]
fn graph_resource_relocation_preserves_later_authored_ranges() {
    let child = ".image{background:url('./dot.svg')}/* 😀 */\n.after{margin:1px}@utilities{paint{padding:2rem}}.card{@compose paint;}";
    let result = compile(
        "@import './child.css';",
        child,
        json!({"/child.css":{"./dot.svg":"https://cdn.test/a-long-resource-name.svg"}}),
    );
    let sheet = &result["stylesheets"][1];
    let map = mapping(sheet, ".after");
    assert_eq!(map["source"]["file"], "/child.css");
    assert_eq!(map["source"]["range"]["start"], offset(child, ".after"));
    let map = mapping(sheet, "padding:2rem");
    assert_eq!(map["source"]["range"]["start"], offset(child, "paint;"));
}
#[test]
fn graph_compose_slot_does_not_replace_a_quoted_marker() {
    let child = "@utilities{paint{padding:2rem}}.label{content:'@--master-css-compose-slot-0;'}.card{@compose paint;}";
    let result = compile("@import './child.css';", child, Value::Null);
    let css = result["stylesheets"][1]["css"].as_str().unwrap();
    assert!(css.contains("\"@--master-css-compose-slot-0;\""), "{css}");
    assert!(css.contains(".card{padding:2rem}"), "{css}");
}

#[test]
fn graph_native_suppression_keeps_composed_conditions_and_layer_identity() {
    let source = "@utilities{paint{padding:2rem}}.plain{margin:1px}@media print{@layer{.card{@compose paint;}.other{@compose paint;}}}";
    let request: CompileCssStylesheetGraphRequest = serde_json::from_value(json!({
        "graph":{"entry":"/entry.css","files":{"/entry.css":source},"edges":[]},
        "urls":{"/entry.css":"/entry.css"},"options":{"preserveNativeCSS":false},
        "baseManifest":{"version":1,"languageVersion":3,"utilities":[]}
    }))
    .unwrap();
    let result = serde_json::to_value(compile_css_stylesheet_graph(&request).unwrap()).unwrap();
    let sheet = &result["stylesheets"][0];
    let css = sheet["css"].as_str().unwrap();
    assert!(css.contains("@media print"), "{css}");
    assert_eq!(css.matches("@layer").count(), 1, "{css}");
    assert!(!css.contains(".plain"), "{css}");
    assert_eq!(
        mapping(sheet, ".card")["source"]["range"]["start"],
        offset(source, ".card")
    );
}
