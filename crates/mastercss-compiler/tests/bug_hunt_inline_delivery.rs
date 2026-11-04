use std::collections::HashMap;

use mastercss_compiler::{
    CssBundleManagedStylesheets, CssStylesheetAsset, PrepareCssStylesheetBundleRequest,
    RenderCssStylesheetBundleRequest, prepare_css_stylesheet_bundle, render_css_stylesheet_bundle,
};

fn render(files: &[(&str, &str)], inline: bool) -> Vec<CssStylesheetAsset> {
    render_at(files, inline, |id| format!("/out/{id}.css"))
}
fn render_at(
    files: &[(&str, &str)],
    inline: bool,
    url: impl Fn(&str) -> String,
) -> Vec<CssStylesheetAsset> {
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
        .map(|node| (node.id.clone(), url(&node.id)))
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

fn in_order(css: &str, needles: &[&str]) {
    let positions = needles
        .iter()
        .map(|needle| {
            css.find(needle)
                .unwrap_or_else(|| panic!("{needle}: {css}"))
        })
        .collect::<Vec<_>>();
    assert!(positions.is_sorted(), "{css}");
}

#[test]
fn a_child_with_leading_external_imports_moves_after_external_predecessors() {
    for (root, expected) in [
        (
            "@import '/child.css';.after{color:green}",
            &["remote.test/font", "color:blue", "color:green"][..],
        ),
        (
            "@import 'https://remote.test/a.css';@import '/child.css';.after{color:green}",
            &[
                "remote.test/a",
                "remote.test/font",
                "color:blue",
                "color:green",
            ][..],
        ),
    ] {
        let child = "@import 'https://remote.test/font.css';.example{color:blue}";
        let result = css(&render(&[("root", root), ("child", child)], true), "bundle");
        assert!(!result.contains("/out/"), "{result}");
        in_order(&result, expected);
    }
}

#[test]
fn a_managed_entry_flattens_a_master_entry_that_starts_with_an_external_import() {
    let result = css(
        &render(
            &[
                ("root", "@import '/entry.css';.generated{color:green}"),
                (
                    "entry",
                    "@import url(https://remote.test/a.css);@import '/preset.css';.x{color:blue}",
                ),
                ("preset", "@layer theme, base;.preset{color:red}"),
            ],
            true,
        ),
        "bundle",
    );
    assert!(!result.contains("/out/"), "{result}");
    in_order(
        &result,
        &[
            "remote.test/a",
            "@layer theme",
            "color:red",
            "color:blue",
            "color:green",
        ],
    );
}

#[test]
fn leading_import_children_keep_boundaries_that_would_change_import_validity() {
    let child = "@import 'https://remote.test/font.css';.example{color:blue}";
    for (root, child) in [
        // Qualifiers become blocks, which cannot contain imports.
        ("@import '/child.css' layer;.after{color:green}", child),
        ("@import '/child.css' layer(app);.after{color:green}", child),
        (
            "@import '/child.css' supports(display:grid);.after{color:green}",
            child,
        ),
        ("@import '/child.css' print;.after{color:green}", child),
        // An earlier local import would need its rules ahead of the moved import.
        (
            "@import '/first.css';@import '/child.css';.after{color:green}",
            child,
        ),
        // The moved rules would precede, and so invalidate, a later retained import.
        (
            "@import '/child.css';@import 'https://remote.test/late.css';.after{color:green}",
            child,
        ),
        // Namespace scope belongs to one stylesheet.
        (
            "@import '/child.css';@namespace 'urn:root';*{color:green}",
            child,
        ),
        (
            "@import '/child.css';.after{color:green}",
            "@import 'https://remote.test/font.css';@namespace 'urn:child';*{color:blue}",
        ),
        // A layer statement may precede imports but not separate them.
        (
            "@import 'https://remote.test/a.css';@import '/child.css';.after{color:green}",
            "@layer child;@import 'https://remote.test/font.css';.example{color:blue}",
        ),
        // An import after a rule is invalid and stays where it is.
        (
            "@import '/child.css';.after{color:green}",
            ".example{color:blue}@import 'https://remote.test/font.css';",
        ),
    ] {
        let assets = render(
            &[
                ("root", root),
                ("child", child),
                ("first", ".first{color:red}"),
            ],
            true,
        );
        let result = css(&assets, "root");
        assert!(result.contains("/out/child.css"), "{result}");
        assert!(!result.contains("color:blue"), "{result}");
    }
}

#[test]
fn a_leading_layer_statement_moves_when_no_import_precedes_it() {
    let result = css(
        &render(
            &[
                (
                    "root",
                    "@layer app;@import '/child.css';.after{color:green}",
                ),
                (
                    "child",
                    "@layer child;@import 'https://remote.test/font.css';.example{color:blue}",
                ),
            ],
            true,
        ),
        "bundle",
    );
    assert!(!result.contains("/out/"), "{result}");
    in_order(
        &result,
        &[
            "@layer app",
            "@layer child",
            "remote.test/font",
            "color:blue",
            "color:green",
        ],
    );
}

#[test]
fn relative_leading_imports_move_only_within_the_same_delivery_base() {
    let files = [
        ("root", "@import '/child.css';.after{color:green}"),
        ("child", "@import 'font.css';.example{color:blue}"),
    ];
    let nested = render_at(&files, true, |id| match id {
        "child" => "/out/nested/child.css".into(),
        _ => format!("/out/{id}.css"),
    });
    assert!(css(&nested, "root").contains("/out/nested/child.css"));
    let sibling = css(&render(&files, true), "bundle");
    assert!(!sibling.contains("/out/"), "{sibling}");
    in_order(&sibling, &["font.css", "color:blue", "color:green"]);
}

#[test]
fn an_import_after_an_interleaved_layer_statement_is_not_activated() {
    let assets = render(
        &[
            (
                "root",
                "@import 'https://remote.test/a.css';@layer app;@import '/child.css';",
            ),
            ("child", ".example{color:blue}"),
        ],
        true,
    );
    assert!(css(&assets, "root").contains("/out/child.css"));
    assert!(!css(&assets, "root").contains("color:blue"));
}
