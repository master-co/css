use mastercss_compiler::{
    CompileManifestOptions, CompileNativeCssOptions, compile_css_directives, compile_manifest_input,
};
use mastercss_engine::EngineSession;

fn engine(source: &str) -> EngineSession {
    let source = format!(
        "{source}@mixin --fg(--color){{color:var(--color)}} @utility fg(--color) {{color:var(--color)}}@utility fg-(--color) {{color:var(--color)}}@mixin --outline(--color){{outline-color:var(--color)}} @utility outline(--color) {{outline-color:var(--color)}}@utility outline-(--color) {{outline-color:var(--color)}}"
    );
    let css = compile_css_directives(&source, &CompileNativeCssOptions::default()).unwrap();
    let compiled = compile_manifest_input(
        &css.manifest_input,
        &CompileManifestOptions {
            base_manifest: None,
        },
    )
    .unwrap();
    EngineSession::create(&compiled.manifest.to_string()).unwrap()
}

#[test]
fn utility_definitions_use_native_preludes_and_whole_value_parameters() {
    let mut engine = engine(
        r#"
        @theme { --color-line-brand: red;  }
        @mixin --content-auto { content-visibility: auto; } @utility content-auto { content-visibility: auto; }
        @mixin --equal-cols(--value) { display: grid; grid-template-columns: repeat(var(--value), minmax(0, 1fr)); } @utility equal-cols(--value) { display: grid; grid-template-columns: repeat(var(--value), minmax(0, 1fr)); }
    "#,
    );
    engine
        .ensure_class_rules(["content-auto", "equal-cols(4)", "outline-line-brand"])
        .unwrap();
    let text = engine.css_text();
    assert!(text.contains("content-visibility:auto"), "{text}");
    assert!(text.contains("repeat(4,"), "{text}");
    assert!(
        text.contains("outline-color:var(--color-line-brand)"),
        "{text}"
    );
}

#[test]
fn tokens_preserve_duplicates_and_native_overrides_keep_dependencies() {
    let source = r#"@theme { --color-ink:red; --color-ink:oklch(50% .2 20); --color-ocean:blue; --color-unused:green; }
        [data-theme="ocean"] { --color-ink:var(--color-ocean); }
        @media (prefers-contrast:more) { :root,:host { --color-ink:CanvasText; } }"#;
    let parsed = compile_css_directives(source, &Default::default()).unwrap();
    let mut engine = engine(source);
    engine
        .ensure_stylesheet_resources(&parsed.native_css)
        .unwrap();
    engine.ensure_class_rules(["fg-ink"]).unwrap();
    let text = engine.css_text();
    assert!(text.contains("--color-ink:red;--color-ink:oklch"), "{text}");
    assert!(!text.contains("data-theme"));
    assert!(parsed.native_css.contains("[data-theme=\"ocean\"]"));
    assert!(parsed.native_css.contains("prefers-contrast"));
    assert!(text.contains("--color-ocean:blue"), "{text}");
    assert!(!text.contains("--color-unused"));
    engine.delete_class_rules(["fg-ink"]).unwrap();
    assert!(!engine.css_text().contains("--color-ink:"));
    assert!(engine.css_text().contains("--color-ocean:blue"));
}

#[test]
fn removed_directives_are_ranged_errors_but_literals_remain_native() {
    for source in [
        "@master entry;",
        "@settings { important: on; }",
        "@mode dark {}",
        "@utilities { box {display:block} }",
        ".x { @dark { color:red; } }",
        "@theme inline inline { --x: red; }",
        ".x { @variant media((width > 1px)) { color:red; } }",
    ] {
        let error =
            compile_css_directives(source, &CompileNativeCssOptions::default()).unwrap_err();
        assert!(error.diagnostic().range.is_some(), "{source}: {error}");
    }
    let result = compile_css_directives(
        ".x { content: '@dark'; color: --value(); }",
        &CompileNativeCssOptions::default(),
    )
    .unwrap();
    assert!(result.native_css.contains("--value()"));
}

#[test]
fn custom_media_resolves_forward_lists_negation_types_and_false() {
    let source = r#"
        @custom-media --wide (--small), print;
        @custom-media --small (width >= 48rem);
        @custom-media --off false;
        @custom-media --outside not (--wide);
        @mixin --visible-wide { @media (--wide) { visibility: visible; } } @utility visible-wide { @media (--wide) { visibility: visible; } }
    "#;
    let mut engine = engine(source);
    engine
        .ensure_class_rules([
            "display:block@small",
            "color:red@outside",
            "display:none@off",
            "visible-wide",
            "opacity:.5@media((--small))",
        ])
        .unwrap();
    let text = engine.css_text();
    assert!(text.contains("@media (width >= 48rem)"), "{text}");
    assert!(
        text.contains("@media not (width >= 48rem){@media not print{"),
        "{text}"
    );
    assert!(!text.contains("display:none"), "{text}");
    assert!(!text.contains("@media (--"), "{text}");
    for invalid in [
        "@custom-media --a (--b);",
        "@custom-media --a (--b); @custom-media --b (--a);",
        "@custom-media --a (--b: 1);",
    ] {
        let directives =
            compile_css_directives(invalid, &CompileNativeCssOptions::default()).unwrap();
        assert!(
            compile_manifest_input(
                &directives.manifest_input,
                &CompileManifestOptions {
                    base_manifest: None
                }
            )
            .is_err(),
            "{invalid}"
        );
    }
}

#[test]
fn parameters_are_tokens_only_in_parameterized_declaration_values() {
    for source in [
        "@mixin --box(--value) { width: --master-value(1); } @utility box(--value) { width: --master-value(1); }",
        "@mixin --box(--value) { @media (width > var(--value)) { width: 1px; } } @utility box(--value) { @media (width > var(--value)) { width: 1px; } }",
        "@mixin --box(--value) { &:nth-child(var(--value)) { width: 1px; } } @utility box(--value) { &:nth-child(var(--value)) { width: 1px; } }",
        "@theme {--color:red;  } @variant dark { --color: red; }",
        "@media print { @variant dark { color: red; } }",
    ] {
        let error =
            compile_css_directives(source, &CompileNativeCssOptions::default()).unwrap_err();
        assert!(error.diagnostic().range.is_some(), "{source}: {error}");
    }
    for source in [
        "@mixin --box { width: var(--value); } @utility box { width: var(--value); }",
        ".box { width: var(--value); }",
        "@theme { --x: var(--value);  }",
    ] {
        assert!(compile_css_directives(source, &CompileNativeCssOptions::default()).is_ok());
    }
    let mut engine = engine(
        r#"@mixin --box(--value) { width: var(--value); content: "var(--value)"; color: --value(); } @utility box(--value) { width: var(--value); content: "var(--value)"; color: --value(); }"#,
    );
    engine.ensure_class_rules(["box(10px)"]).unwrap();
    assert!(engine.css_text().contains("width:10px"));
    assert!(engine.css_text().contains("--value()"));
    assert!(engine.css_text().contains("var(--value)"));
}

#[test]
fn custom_media_type_conjunction_uses_resolved_boolean_logic() {
    let mut engine = engine(
        r#"
        @custom-media --a (width >= 30em), (orientation: landscape);
        @custom-media --b screen and (--a);
        @custom-media --off false;
        @mixin --named { @media (--b) { @contents; } } @utility named { @media (--b) { @contents; } }
        @mixin --box { @media (--off) { color: red; } display: block; } @utility box { @media (--off) { color: red; } display: block; }
    "#,
    );
    engine
        .ensure_class_rules(["color:red@b", "color:blue@apply(--named)", "box"])
        .unwrap();
    let text = engine.css_text();
    assert!(
        text.contains("@media screen{@media (width >= 30em)"),
        "{text}"
    );
    assert!(
        text.contains("@media screen{@media (orientation: landscape)"),
        "{text}"
    );
    assert!(text.contains(".box{display:block}"), "{text}");
    assert!(!text.contains("@media (--"), "{text}");
}

#[test]
fn theme_dependencies_handle_css_escapes_comments_and_nested_fallbacks() {
    let mut engine = engine(
        r#"
        @theme { --color-a: VAR(/* x */ --color-b, var(--color-c)); --color-b: red; --color-c: blue; --unused: green;  }
    "#,
    );
    engine.ensure_class_rules(["fg-a"]).unwrap();
    let text = engine.css_text();
    assert!(text.contains("--color-b:red"), "{text}");
    assert!(text.contains("--color-c:blue"), "{text}");
    assert!(!text.contains("--unused"), "{text}");
}

#[test]
fn same_category_condition_redefinitions_replace_the_entire_definition() {
    let mut engine = engine(
        "@custom-media --wide false;@custom-media --wide (width>1px);@mixin --named{@media print{@contents;}} @utility named {@media print{@contents;}}@mixin --named{&:hover{@contents;}} @utility named {&:hover{@contents;}}",
    );
    engine
        .ensure_class_rules(["color:red@wide", "color:blue@apply(--named)"])
        .unwrap();
    let text = engine.css_text();
    assert!(text.contains("@media (width>1px)"), "{text}");
    assert!(text.contains(":hover"), "{text}");
    assert!(!text.contains("print"), "{text}");
}

#[test]
fn native_css_custom_media_uses_the_same_registry_and_token_semantics() {
    let css = mastercss_compiler::compile_native_css(r"@custom-media --on /*comment*/ tr\75 e; @custom-media --wide screen and (width>30rem),print; @media (--on) { .on{display:block} } @media not (--wide){.outside{display:none}}", &CompileNativeCssOptions::default()).unwrap().css;
    assert!(css.contains(".on"), "{css}");
    assert!(css.contains("not screen"), "{css}");
    assert!(css.contains("not print"), "{css}");
    assert!(!css.contains("(--"), "{css}");
    let error = mastercss_compiler::compile_native_css(
        "/* 😀 */ @media (--missing){.x{color:red}}",
        &CompileNativeCssOptions::default(),
    )
    .unwrap_err();
    assert!(error.diagnostic().range.is_some());
}

#[test]
fn custom_media_rejects_excessive_expansion_and_conflicting_wire_names() {
    let terms = (0..13)
        .map(|i| format!("((width>{i}px) or (height>{i}px))"))
        .collect::<Vec<_>>()
        .join(" and ");
    let directives = compile_css_directives(
        &format!("@custom-media --huge {terms};"),
        &Default::default(),
    )
    .unwrap();
    let error =
        compile_manifest_input(&directives.manifest_input, &Default::default()).unwrap_err();
    assert!(error.to_string().contains("4096 branches"), "{error}");
    for manifest in [
        r#"{"version":6,"languageVersion":15,"customMedia":{"--wide":{"type":"true"}},"variants":[{"token":"@wide","branches":[{"selector":"&:hover"}]}]}"#,
        r#"{"version":6,"languageVersion":15,"customMedia":{"wide":{"type":"true"}}}"#,
    ] {
        assert!(EngineSession::create(manifest).is_err(), "{manifest}");
    }
}

#[test]
fn theme_retains_important_and_escaped_custom_property_identifiers() {
    let mut engine = engine(r"@theme { --color-br\61 nd: red !important; --color-brand: blue; }");
    engine
        .ensure_class_rules(["color:var(--color-brand)"])
        .unwrap();
    assert!(
        engine
            .css_text()
            .contains("--color-brand:red !important;--color-brand:blue"),
        "{}",
        engine.css_text()
    );
}
