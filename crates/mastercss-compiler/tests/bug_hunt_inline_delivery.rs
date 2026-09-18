use std::collections::HashMap;

use mastercss_compiler::{
    CssBundleManagedStylesheets, CssStylesheetAsset, PrepareCssStylesheetBundleRequest,
    RenderCssStylesheetBundleRequest, prepare_css_stylesheet_bundle, render_css_stylesheet_bundle,
};

fn render(files: &[(&str, &str)], inline: bool) -> Vec<CssStylesheetAsset> {
    let bundle = prepare_css_stylesheet_bundle(&PrepareCssStylesheetBundleRequest {
        source: "#slot{--slot:0}".into(),
        from: "bundle".into(),
        slot_css_rule: "#slot{--slot:0}".into(),
        managed: CssBundleManagedStylesheets {
            entry: "root".into(),
            stylesheets: files
                .iter()
                .map(|(id, css)| CssStylesheetAsset {
                    id: (*id).into(),
                    href: format!("/{id}.css"),
                    css: (*css).into(),
                })
                .collect(),
        },
    })
    .unwrap();
    let urls = bundle
        .graph
        .stylesheets
        .iter()
        .map(|node| (node.id.clone(), format!("/out/{}.css", node.id)))
        .collect();
    render_css_stylesheet_bundle(&RenderCssStylesheetBundleRequest {
        bundle,
        urls,
        resource_urls: HashMap::new(),
        preserve_resource_base: true,
        inline_imports: inline,
    })
    .unwrap()
}
fn css(assets: &[CssStylesheetAsset], id: &str) -> String {
    assets
        .iter()
        .find(|asset| asset.id == id)
        .unwrap()
        .css
        .clone()
}

#[test]
fn leaf_graph_becomes_a_real_css_string_and_default_delivery_stays_split() {
    let files = [
        ("root", "@import '/child.css';.after{color:green}"),
        ("child", ".example{color:blue}"),
    ];
    assert!(css(&render(&files, false), "bundle").contains("@import"));
    let result = css(&render(&files, true), "bundle");
    assert!(!result.contains("@import"), "{result}");
    assert!(result.find("color:blue").unwrap() < result.find("color:green").unwrap());
}

#[test]
fn qualified_and_repeated_anonymous_layers_keep_distinct_wrappers() {
    let assets = render(
        &[
            (
                "root",
                "@import '/child.css' layer supports(display:grid) print;@import '/child.css' layer;",
            ),
            ("child", ".example{color:blue}"),
        ],
        true,
    );
    let result = css(&assets, "bundle");
    assert_eq!(result.matches("@layer {").count(), 2, "{result}");
    assert!(result.contains("@supports (display: grid)"), "{result}");
    assert!(result.contains("@media print"), "{result}");
}

#[test]
fn retained_later_import_prevents_earlier_rules_from_invalidating_it() {
    let assets = render(
        &[
            (
                "root",
                "@import '/child.css';@import 'https://remote.test/style.css';.after{color:green}",
            ),
            ("child", ".example{color:blue}"),
        ],
        true,
    );
    let result = css(&assets, "root");
    assert!(
        result.starts_with("@import \"/out/child.css\";"),
        "{result}"
    );
    assert!(!result.contains("color:blue"));
}

#[test]
fn earlier_external_import_can_precede_an_inlined_suffix() {
    let assets = render(
        &[
            (
                "root",
                "@import 'https://remote.test/style.css';@import '/child.css';.after{color:green}",
            ),
            ("child", ".example{color:blue}"),
        ],
        true,
    );
    let result = css(&assets, "root");
    assert!(result.find("https://remote.test").unwrap() < result.find("color:blue").unwrap());
    assert!(!result.contains("/out/child.css"));
}

#[test]
fn conditional_external_children_remain_stylesheet_assets() {
    let assets = render(
        &[
            ("root", "@import '/child.css' layer(shared) print;"),
            (
                "child",
                "@import 'https://remote.test/style.css';.example{color:blue}",
            ),
        ],
        true,
    );
    assert!(css(&assets, "root").contains("layer(shared) print"));
    assert!(css(&assets, "child").starts_with("@import 'https://remote.test/style.css'"));
}

#[test]
fn parent_and_child_namespaces_are_not_merged() {
    for files in [
        [
            (
                "root",
                "@import '/child.css';@namespace 'urn:root';*{color:red}",
            ),
            ("child", "*{color:blue}"),
        ],
        [
            ("root", "@import '/child.css';*{color:red}"),
            ("child", "@namespace 'urn:child';*{color:blue}"),
        ],
    ] {
        assert!(css(&render(&files, true), "root").contains("/out/child.css"));
    }
}

#[test]
fn invalid_late_import_is_not_activated_by_inlining() {
    let assets = render(
        &[
            ("root", ".before{color:red}@import '/child.css';"),
            ("child", ".example{color:blue}"),
        ],
        true,
    );
    assert!(!css(&assets, "root").contains("color:blue"));
    assert!(css(&assets, "root").contains("@import"));
}

#[test]
fn a_bare_wrapper_can_promote_a_namespace_stylesheet_without_changing_its_scope() {
    let assets = render(&[("root", "@namespace 'urn:example';a{color:blue}")], true);
    let result = css(&assets, "bundle");
    assert!(!result.contains("@import"), "{result}");
    assert!(result.contains("@namespace 'urn:example'"), "{result}");
}
