use mastercss_compiler::{
    CompileManifestOptions, CompileNativeCssOptions, compile_css_directives, compile_manifest_input,
};
use mastercss_engine::EngineSession;
use mastercss_schema::MatchStatus;

fn engine(source: &str) -> EngineSession {
    let input = compile_css_directives(source, &CompileNativeCssOptions::default())
        .unwrap()
        .manifest_input;
    let manifest = compile_manifest_input(&input, &CompileManifestOptions::default())
        .unwrap()
        .manifest;
    EngineSession::create(&manifest.to_string()).unwrap()
}

#[test]
fn custom_recipes_and_canonical_token_keys_are_not_retired_aliases() {
    let engine = engine(
        r#"
        @theme { :root {
            --color-color-red: red;
            --padding-card: 2rem;
            --font-brand: 500;
            --spacing-md: 1rem;
        } }
        @mixin --font(--key <string>) { font-weight: var(ident("--font-" var(--key))); }
        @mixin --padding(--key <string>) { padding: var(ident("--padding-" var(--key))); }
        @mixin --padding-md { padding: 3rem; }
    "#,
    );
    for class in [
        "font-brand",
        "padding-card",
        "padding-md",
        "text-stroke-color-red",
    ] {
        let result = engine.inspect(class).unwrap();
        assert_eq!(
            result.match_status,
            MatchStatus::Matched,
            "{class}: {:?}",
            result.diagnostics
        );
    }
    assert!(
        engine.inspect("padding-md").unwrap().rules[0]
            .text
            .contains("padding:3rem")
    );
}

#[test]
fn escaped_theme_names_and_unicode_have_the_same_dependency_identity() {
    let mut engine =
        engine(r"@theme { :root { --色: 1rem; --大小: var(--\008272); --a\:b: 2rem; } }");
    for class in [r"width:var(--\005927\005c0f)", r"height:var(--a\:b)"] {
        let result = engine.inspect(class).unwrap();
        assert_eq!(result.match_status, MatchStatus::Matched);
        engine.ensure_class_rules([class]).unwrap();
    }
    let css = engine.css_text();
    assert!(css.contains("--色:1rem"), "{css}");
    assert!(css.contains("--大小:"), "{css}");
    assert!(css.contains(r"--a\:b:2rem"), "{css}");
    engine
        .delete_class_rules([r"width:var(--\005927\005c0f)", r"height:var(--a\:b)"])
        .unwrap();
    assert!(engine.css_text().is_empty());
}

#[test]
fn native_stylesheets_do_not_receive_class_math_or_selector_rewrites() {
    let result = compile_css_directives(
        r#"@layer components { .foo_bar:before { --example: 'calc(1+2)'; --math: min(1px - 2px,4px); } }"#,
        &CompileNativeCssOptions { preserve_native_css: true, ..Default::default() },
    ).unwrap();
    assert!(result.native_css.contains(".foo_bar:before"));
    assert!(
        result.native_css.contains("calc(1+2)"),
        "{}",
        result.native_css
    );
    assert!(
        result.native_css.contains("min(1px - 2px,4px)"),
        "{}",
        result.native_css
    );
}
