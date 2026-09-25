use mastercss_compiler::{
    CompileCssStylesheetGraphRequest, CompileNativeCssOptions, compile_css_directives,
    compile_css_stylesheet_graph, lower_css_directives,
};
use serde_json::json;

fn direct(source: &str) -> String {
    let parsed = compile_css_directives(source, &CompileNativeCssOptions::default()).unwrap();
    let lowered = mastercss_compiler::lower_css_directives_request(
        &mastercss_compiler::LowerCssDirectivesRequest {
            utility_sources: Vec::new(),
            manifest_input: parsed.manifest_input,
            style_definitions: parsed.style_definitions.unwrap_or_default(),
            warnings: parsed.warnings,
            native_output: parsed.native_output,
        },
        &Default::default(),
    )
    .unwrap();
    lowered
        .css
        .unwrap_or_else(|| format!("{}{}", parsed.native_css, lowered.generated_css))
}

fn graph(source: &str) -> String {
    let request: CompileCssStylesheetGraphRequest = serde_json::from_value(json!({
        "graph":{"entry":"entry.css","files":{"entry.css":source},"edges":[]},
        "urls":{"entry.css":"/entry.css"},
        "baseManifest":{"version":1,"languageVersion":2,"utilities":[]}
    }))
    .unwrap();
    compile_css_stylesheet_graph(&request).unwrap().stylesheets[0]
        .css
        .clone()
}

const WRAPPERS: [&str; 6] = [
    "@media (min-width:1px)",
    "@supports (display:grid)",
    "@container card (min-width:1px)",
    "@layer cards",
    "@layer",
    "@starting-style",
];

#[test]
fn direct_native_conditionals_expand_compose() {
    for wrapper in WRAPPERS {
        let source =
            format!("@utilities{{paint{{padding:2rem}}}}{wrapper}{{.card{{@compose paint;}}}}");
        let css = direct(&source);
        assert!(!css.contains("@compose"), "{wrapper}: {css}");
        assert!(css.contains("padding:2rem"), "{wrapper}: {css}");
    }
}

#[test]
fn graph_native_conditionals_expand_compose() {
    for wrapper in WRAPPERS {
        let source =
            format!("@utilities{{paint{{padding:2rem}}}}{wrapper}{{.card{{@compose paint;}}}}");
        let css = graph(&source);
        assert!(!css.contains("@compose"), "{wrapper}: {css}");
        assert!(css.contains("padding:2rem"), "{wrapper}: {css}");
    }
}

#[test]
fn graph_preserves_unrelated_native_children_and_composed_style_order() {
    let source = "@utilities{paint{padding:2rem}}@media(min-width:1px){@font-face{font-family:probe;src:url(probe.woff2)}.before{color:red}.card{@compose paint;}.after{color:blue}@keyframes spin{to{opacity:0}}}";
    let css = graph(source);
    let tokens = [
        "@font-face",
        ".before",
        "padding:2rem",
        ".after",
        "@keyframes",
    ];
    let positions = tokens.map(|token| css.find(token).unwrap_or_else(|| panic!("{token}: {css}")));
    assert!(positions.windows(2).all(|p| p[0] < p[1]), "{css}");
    assert_eq!(css.matches("@media").count(), 1, "{css}");
}

#[test]
fn graph_preserves_one_anonymous_layer_and_nested_wrapper_structure() {
    let source = "@utilities{paint{padding:2rem}}@layer{.before{color:red}@supports(display:grid){.card{@compose paint;}.after{padding:3rem}}}";
    let css = graph(source);
    assert!(css.contains("padding:2rem"), "{css}");
    assert_eq!(css.matches("@layer").count(), 1, "{css}");
    assert_eq!(css.matches("@supports").count(), 1, "{css}");
    assert!(css.find(".card") < css.find(".after"), "{css}");
}

#[test]
fn native_wrappers_without_directives_are_unchanged() {
    for wrapper in WRAPPERS {
        let source = format!("{wrapper}{{.card{{padding:2rem}}}}");
        let parsed = compile_css_directives(&source, &CompileNativeCssOptions::default()).unwrap();
        assert!(parsed.style_definitions.is_none(), "{wrapper}");
        assert_eq!(graph(&source), parsed.native_css, "{wrapper}");
    }
}

#[test]
fn direct_native_conditional_order_is_preserved() {
    let source = "@utilities{paint{padding:2rem}}@media(min-width:1px){.card{@compose paint;}.card{padding:3rem}}";
    let css = direct(source);
    let normalized = css.replace([' ', '\n'], "");
    assert!(
        normalized.find("padding:2rem") < normalized.find("padding:3rem"),
        "{css}"
    );
}

#[test]
fn direct_anonymous_layer_remains_one_layer() {
    let source =
        "@utilities{paint{padding:2rem}}@layer{.card{@compose paint;}.after{padding:3rem}}";
    let css = direct(source);
    assert_eq!(css.matches("@layer").count(), 1, "{css}");
}

#[test]
fn conditional_selector_and_compose_origins_stay_at_authored_positions() {
    for wrapper in WRAPPERS {
        let source = format!(
            "/* 😀 */\n@utilities{{paint{{padding:2rem}}}}\n{wrapper}{{\n.card{{@compose paint;}}\n}}"
        );
        let parsed = compile_css_directives(&source, &CompileNativeCssOptions::default()).unwrap();
        let lowered = lower_css_directives(
            &parsed.manifest_input,
            parsed.style_definitions.as_deref().unwrap_or_default(),
            &[],
            &Default::default(),
        )
        .unwrap();
        for (generated, original) in [(".card", ".card"), ("padding", "paint;")] {
            let offset = lowered.generated_css[..lowered.generated_css.find(generated).unwrap()]
                .encode_utf16()
                .count() as u32;
            let mapping = lowered
                .generated_mappings
                .iter()
                .find(|m| m.generated_start == offset)
                .unwrap();
            assert_eq!(
                mapping.source.range.start as usize,
                source[..source.find(original).unwrap()]
                    .encode_utf16()
                    .count(),
                "{wrapper}"
            );
        }
    }
}

#[test]
fn native_conditions_nested_inside_styles_expand_compose() {
    for wrapper in WRAPPERS {
        let source =
            format!("@utilities{{paint{{padding:2rem}}}}.card{{{wrapper}{{@compose paint;}}}}");
        for css in [direct(&source), graph(&source)] {
            assert!(!css.contains("@compose"), "{wrapper}: {css}");
            assert!(css.contains("padding:2rem"), "{wrapper}: {css}");
        }
    }
}
