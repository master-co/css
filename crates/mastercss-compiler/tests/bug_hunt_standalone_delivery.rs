use mastercss_compiler::compile_css_stylesheet_graph;
use serde_json::json;

#[test]
fn relative_resources_require_explicit_sibling_delivery_and_keep_cross_file_ownership() {
    let base = json!({
        "graph": {"entry":"entry", "files": {
            "entry":"@import './child.css';.example{@compose paint;}",
            "child":"@utilities{paint{background-image:url(image.svg)}}"
        }, "edges":[{"from":"entry","specifier":"./child.css","resolved":"child"}]},
        "urls":{"entry":"./main.css","child":"./child.css"},
        "resourceURLs":{"child":{"image.svg":"./asset.svg?q=1#part"}},
        "baseManifest":{"version":1,"utilities":[]}
    });
    let error =
        compile_css_stylesheet_graph(&serde_json::from_value(base.clone()).unwrap()).unwrap_err();
    assert!(error.to_string().contains("root-relative or absolute"));
    let mut request = base;
    request["relativeResourceURLs"] = json!(true);
    let result =
        compile_css_stylesheet_graph(&serde_json::from_value(request.clone()).unwrap()).unwrap();
    assert!(result.stylesheets[0].css.contains("./asset.svg?q=1#part"));
    assert!(result.manifest.to_string().contains("./asset.svg?q=1#part"));
    for invalid in [
        "./nested/child.css",
        "../child.css",
        "/child.css",
        "https://cdn.test/child.css",
        "./%2e%2e",
    ] {
        request["urls"]["child"] = json!(invalid);
        let error = compile_css_stylesheet_graph(&serde_json::from_value(request.clone()).unwrap())
            .unwrap_err();
        assert!(
            error.to_string().contains("sibling stylesheet"),
            "{invalid}: {error}"
        );
    }
    request["urls"]["child"] = json!("./child.css");
    for invalid in [
        "../asset.svg",
        "./nested/asset.svg",
        "./%2e%2e/asset.svg",
        "./a%2fb.svg",
    ] {
        request["resourceURLs"]["child"]["image.svg"] = json!(invalid);
        assert!(
            compile_css_stylesheet_graph(&serde_json::from_value(request.clone()).unwrap())
                .is_err()
        );
    }
}
