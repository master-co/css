use mastercss_compiler::{CompileCssStylesheetGraphInput, compile_css_stylesheet_graph_input};
use serde_json::{Value, json};

fn compile(entry: &str, child: &str, child_url: &str) -> Value {
    let input: CompileCssStylesheetGraphInput = serde_json::from_value(json!({
        "inlineImports":true,
        "graph":{"entry":"/entry.css","files":{"/entry.css":entry,"/child.css":child},"edges":[{"from":"/entry.css","specifier":"./child.css","resolved":"/child.css"}]},
        "urls":{"/entry.css":"/entry.css","/child.css":child_url},"baseManifest":{"version":1,"utilities":[]}
    })).unwrap();
    serde_json::to_value(compile_css_stylesheet_graph_input(&input).unwrap()).unwrap()
}
#[test]
fn inline_qualified_child_keeps_composition_and_original_anchors() {
    let child = "@utilities{paint{padding:2rem}}\n.card{@compose paint;}.card{padding:3rem}";
    let entry =
        "@import './child.css' layer supports(display:grid) screen;/* 😀 */\n.after{margin:1px}";
    let result = compile(entry, child, "/child.css");
    assert_eq!(result["stylesheets"].as_array().unwrap().len(), 1);
    let sheet = &result["stylesheets"][0];
    let css = sheet["css"].as_str().unwrap();
    assert!(
        css.contains("@supports") && css.contains("@media screen") && css.contains("@layer"),
        "{css}"
    );
    for (needle, file, source, original) in [
        (".card", "/child.css", child, ".card"),
        (".after", "/entry.css", entry, ".after"),
    ] {
        let generated = css[..css.find(needle).unwrap()].encode_utf16().count();
        let mapping = sheet["outputMappings"]
            .as_array()
            .unwrap()
            .iter()
            .find(|mapping| mapping["generatedStart"] == generated)
            .unwrap();
        assert_eq!(mapping["source"]["file"], file);
        assert_eq!(
            mapping["source"]["range"]["start"],
            source[..source.find(original).unwrap()]
                .encode_utf16()
                .count()
        );
    }
}
#[test]
fn inlining_keeps_external_order_and_namespace_boundaries_as_assets() {
    for (entry, child) in [
        (
            "@import './child.css';@import 'https://remote.test/a.css';",
            ".card{color:red}",
        ),
        (
            "@import './child.css';.after{color:blue}",
            "@namespace svg 'http://www.w3.org/2000/svg';svg|a{color:red}",
        ),
    ] {
        let result = compile(entry, child, "/child.css");
        assert_eq!(result["stylesheets"].as_array().unwrap().len(), 2);
        assert!(
            result["stylesheets"][0]["css"]
                .as_str()
                .unwrap()
                .contains("@import \"/child.css\"")
        );
    }
}
#[test]
fn inlining_does_not_move_relative_resource_or_import_bases() {
    for child in [
        ".card{background:url('./dot.svg')}",
        "@import './unresolved.css';",
    ] {
        assert_eq!(
            compile("@import './child.css';", child, "/nested/child.css")["stylesheets"]
                .as_array()
                .unwrap()
                .len(),
            2
        );
        assert_eq!(
            compile("@import './child.css';", child, "/child.css")["stylesheets"]
                .as_array()
                .unwrap()
                .len(),
            1
        );
    }
}
