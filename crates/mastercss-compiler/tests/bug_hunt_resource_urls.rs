use mastercss_compiler::{analyze_css_resources, compile_css_stylesheet_graph};
use serde_json::json;

#[test]
fn resources_use_css_url_and_image_set_grammar_including_authoring_bodies() {
    let source = r#"/* 😀 url(fake-comment) */
@import url(child.css);@namespace svg url(namespace-uri);@reference url(reference.css);
@theme { --hero: u\72l("im\61ge.png?q=1#part"); }
@utilities { paint { background: image-set("small.png" 1x, url(big.png) type("image/png") 2x); } }
.example { content:'url(fake-string)';mask:url(#mask);background:url('');src:URL(font.woff2);background-image:-webkit-image-set("retina.png" 2x); }
"#;
    let refs = analyze_css_resources(source);
    assert_eq!(
        refs.iter().map(|r| r.url.as_str()).collect::<Vec<_>>(),
        [
            "image.png?q=1#part",
            "small.png",
            "big.png",
            "font.woff2",
            "retina.png",
        ]
    );
    for r in &refs {
        let start = mastercss_lexer::utf16_to_byte_offset(source, r.start).unwrap();
        let end = mastercss_lexer::utf16_to_byte_offset(source, r.end).unwrap();
        let text = &source[start..end];
        assert!(text.contains('(') && text.ends_with(')'), "{text}");
    }
}

#[test]
fn opaque_url_payloads_and_invalid_values_do_not_create_nested_resources() {
    let source = r#".a{a:url(/*literal*/image.png);b:url(data:image/svg+xml,%3Csvg%3E);c:url("data:text/plain,url(fake)");d:url(bad space.png);e:image-set("bad.png" nonsense);f:var(--image,url(fallback.png));g:url(a\)b.png)}"#;
    assert_eq!(
        analyze_css_resources(source)
            .iter()
            .map(|r| r.url.as_str())
            .collect::<Vec<_>>(),
        [
            "/*literal*/image.png",
            "data:image/svg+xml,%3Csvg%3E",
            "data:text/plain,url(fake)",
            "fallback.png",
            "a)b.png",
        ]
    );
}

#[test]
fn source_owner_is_retained_when_managed_definition_is_composed_in_another_file() {
    let request = serde_json::from_value(json!({
        "graph": {"entry":"entry", "files": {
            "entry":"@import './child.css';.example{@compose paint;}",
            "child":"@utilities{paint{background-image:url(image.png)}}.native{background:image-set('small.png' 1x,url(big.png) 2x)}"
        }, "edges":[{"from":"entry","specifier":"./child.css","resolved":"child"}]},
        "urls":{"entry":"/output/main.css","child":"/output/child.css"},
        "resourceURLs":{"child":{"image.png":"/original/child/image.png","small.png":"/original/child/small.png","big.png":"/original/child/big.png"}},
        "baseManifest":{"version":1,"languageVersion":2,"utilities":[]}
    })).unwrap();
    let result = compile_css_stylesheet_graph(&request).unwrap();
    assert!(
        result.stylesheets[0]
            .generated_css
            .contains("/original/child/image.png")
    );
    assert!(
        result.stylesheets[1]
            .css
            .contains("/original/child/small.png")
    );
    assert!(
        result.stylesheets[1]
            .css
            .contains("/original/child/big.png")
    );
    assert!(
        result
            .manifest
            .to_string()
            .contains("/original/child/image.png")
    );
}

#[test]
fn relocation_requires_complete_independent_mappings_and_preserves_local_fragments() {
    let base = json!({
        "graph":{"entry":"entry","files":{"entry":".a{background:url(image.png);mask:url(#mask);cursor:url(''),auto}"},"edges":[]},
        "urls":{"entry":"/output.css"},"baseManifest":{"version":1,"languageVersion":2,"utilities":[]},
        "resourceURLs":{}
    });
    for (map, expected) in [
        (json!({}), "Missing resource URL mapping for image.png"),
        (
            json!({"entry":{"image.png":"../still-relative.png"}}),
            "Resource URL must be root-relative or absolute",
        ),
    ] {
        let mut request = base.clone();
        request["resourceURLs"] = map;
        let error =
            compile_css_stylesheet_graph(&serde_json::from_value(request).unwrap()).unwrap_err();
        assert!(error.to_string().contains(expected), "{error}");
    }
    let mut request = base;
    request["resourceURLs"] = json!({"entry":{"image.png":"https://assets.test/a.png?q=1#part", "#mask":"/wrong-mask", "":"/wrong-empty"}});
    let result = compile_css_stylesheet_graph(&serde_json::from_value(request).unwrap()).unwrap();
    assert!(
        result.stylesheets[0]
            .css
            .contains("https://assets.test/a.png?q=1#part")
    );
    assert!(result.stylesheets[0].css.contains("#mask"));
    assert!(!result.stylesheets[0].css.contains("wrong-"));
}

#[test]
fn theme_urls_are_resolved_before_manifest_merging_and_unmapped_absolute_urls_survive() {
    let request = serde_json::from_value(json!({
        "graph":{"entry":"entry","files":{"entry":"@theme{--hero:url(images/hero.svg);--remote:url(https://assets.test/remote.svg)}.a{background:url(data:image/svg+xml,%3Csvg%3E);filter:url(#filter)}"},"edges":[]},
        "urls":{"entry":"/moved.css"},"baseManifest":{"version":1,"languageVersion":2,"utilities":[]},
        "resourceURLs":{"entry":{"images/hero.svg":"/original/images/hero.svg"}}
    })).unwrap();
    let output = compile_css_stylesheet_graph(&request).unwrap();
    assert!(
        output
            .manifest
            .to_string()
            .contains("/original/images/hero.svg")
    );
    assert!(
        output
            .manifest
            .to_string()
            .contains("https://assets.test/remote.svg")
    );
    assert!(
        output.stylesheets[0]
            .css
            .contains("data:image/svg+xml,%3Csvg%3E")
    );
    assert!(output.stylesheets[0].css.contains("#filter"));
}

#[test]
fn analysis_ranges_stay_in_original_source_across_removed_references_and_repeated_urls() {
    let source = "/*😀*/@reference 'other.css';.a{background:url(a.png),url(a.png)}";
    let analysis = mastercss_compiler::analyze_css_dependencies(source);
    assert_eq!(analysis.resources.len(), 2);
    assert!(!analysis.source_without_references.contains("@reference"));
    for resource in analysis.resources {
        let start = mastercss_lexer::utf16_to_byte_offset(source, resource.start).unwrap();
        let end = mastercss_lexer::utf16_to_byte_offset(source, resource.end).unwrap();
        assert_eq!(&source[start..end], "url(a.png)");
    }
}
