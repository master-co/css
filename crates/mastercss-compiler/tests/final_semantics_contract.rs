//! Language v2 semantics. Historical RC syntax appears only in rejection cases.
use mastercss_compiler::{
    CompileManifestOptions, CompileNativeCssOptions, compile_css_directives, compile_manifest_input,
};
use mastercss_engine::EngineSession;

fn engine(source: &str) -> Result<EngineSession, String> {
    let directives = compile_css_directives(source, &CompileNativeCssOptions::default())
        .map_err(|e| e.to_string())?;
    let result = compile_manifest_input(
        &directives.manifest_input,
        &CompileManifestOptions::default(),
    )
    .map_err(|e| e.to_string())?;
    EngineSession::create(&result.manifest.to_string()).map_err(|e| e.to_string())
}

fn css(engine: &mut EngineSession, classes: &[&str]) -> String {
    engine.ensure_class_rules(classes.iter().copied()).unwrap();
    engine.snapshot().unwrap().text
}

#[test]
fn native_queries_preserve_dimensions_and_wrapper_nesting() {
    let mut e = engine("@theme { --breakpoint-sm: 800px; }").unwrap();
    let output = css(
        &mut e,
        &[
            "width:10px@sm",
            "width:20px@media((width>=800px))",
            "width:30px@media((aspect-ratio>=1.5))",
            "width:40px@media((resolution>=2x))",
            "width:50px@supports(selector(:has(*)))@supports((display:grid))",
            "width:60px@container(card|(width>=40rem))",
            "width:70px@container(style(--density:compact))",
        ],
    );
    assert!(output.contains("@media (width>=800px)"), "{output}");
    assert!(output.contains("@media (aspect-ratio>=1.5)"), "{output}");
    assert!(output.contains("@media (resolution>=2x)"), "{output}");
    assert!(
        output.contains("@supports selector(:has(*)){@supports (display:grid){"),
        "{output}"
    );
    assert!(
        output.contains("@container card (width>=40rem)"),
        "{output}"
    );
    assert!(
        output.contains("@container style(--density:compact)"),
        "{output}"
    );
    let named = e.inspect("width:10px@sm").unwrap();
    let native = e.inspect("width:20px@media((width>=800px))").unwrap();
    assert_eq!(
        named.rules[0].priority.features,
        native.rules[0].priority.features
    );
}

#[test]
fn legacy_conditions_and_unknown_names_do_not_generate() {
    let e = engine("").unwrap();
    for class in [
        "width:1px@>=800",
        "width:1px@>=800px",
        "width:1px@typo",
        "width:1px@media((width>=1px)",
    ] {
        assert!(e.inspect(class).unwrap().rules.is_empty(), "{class}");
    }
}

#[test]
fn modes_own_activation_and_theme_values_use_the_same_branches() {
    let mut e = engine(
        r#"
        @mode ocean {
            @supports (display: grid) { [data-theme="ocean"] { @slot; } }
            :host([data-theme="ocean"]) { @slot; }
        }
        @theme { --color-surface: white; }
        @theme ocean { --color-surface: #082f49; }
    "#,
    )
    .unwrap();
    let output = css(&mut e, &["color-surface", "padding:1px@ocean"]);
    assert!(
        output.contains(":root,:host{--color-surface:white}"),
        "{output}"
    );
    assert!(
        output.contains("[data-theme=ocean]{--color-surface:#082f49}"),
        "{output}"
    );
    assert!(
        output.contains(":where([data-theme=ocean],[data-theme=ocean] *)"),
        "{output}"
    );
    assert!(
        output.contains(":where(:host([data-theme=ocean]),:host([data-theme=ocean]) *)"),
        "{output}"
    );
    assert!(!output.contains("color-scheme"), "{output}");
}

#[test]
fn mode_redefinition_replaces_branches_and_moves_cascade_order() {
    let mut e = engine("@mode a { .old { @slot; } } @mode b { .b { @slot; } } @mode a { .new { @slot; } } @theme a { --color-x: red; } @theme b { --color-x: blue; }").unwrap();
    let output = css(&mut e, &["color-x"]);
    assert!(!output.contains(".old"));
    assert!(
        output.find(".b{").unwrap() < output.find(".new{").unwrap(),
        "{output}"
    );
}

#[test]
fn invalid_modes_and_removed_settings_are_rejected() {
    for source in [
        "@mode a { @slot; }",
        "@mode a { .a::before { @slot; } }",
        "@mode a { .a { color: red; @slot; } }",
        "@mode a { @container (width>1px) { .a { @slot; } } }",
        "@mode a { @layer utilities { .a { @slot; } } }",
        "@theme missing { --color-x: red; }",
        "@mode sm { .sm { @slot; } } @theme { --breakpoint-sm: 1rem; }",
        "@settings { root-size: 20; }",
        "@settings { default-mode: dark; }",
        "@settings { mode-trigger: class; }",
    ] {
        assert!(engine(source).is_err(), "{source}");
    }
}

#[test]
fn native_generation_does_not_depend_on_host_value_support() {
    let mut e = engine("").unwrap();
    let output = css(
        &mut e,
        &[
            "width:--space(2)",
            "future-property:future(2qu)",
            "font:16px",
            "padding:nonsense",
        ],
    );
    for declaration in [
        "width:--space(2)",
        "future-property:future(2qu)",
        "font:16px",
        "padding:nonsense",
    ] {
        assert!(output.contains(declaration), "{declaration}: {output}");
    }
}

#[test]
fn native_pruning_requires_an_explicit_policy_and_preserve_wins() {
    let options = CompileNativeCssOptions {
        classes: Some(vec!["used".into()]),
        ..Default::default()
    };
    let source = ".used{color:red}.unused{color:blue}";
    assert!(
        compile_css_directives(source, &options)
            .unwrap()
            .native_css
            .contains(".unused")
    );
    let pruned = compile_css_directives(&format!("@prune native;{source}"), &options).unwrap();
    assert!(!pruned.native_css.contains(".unused"));
    assert!(pruned.extraction_policy.prune_native);
    let preserved = compile_css_directives(
        &format!("@prune native;@preserve native;{source}"),
        &options,
    )
    .unwrap();
    assert!(preserved.native_css.contains(".unused"));
}

#[test]
fn quoted_legacy_markers_remain_native_literals() {
    let e = engine("").unwrap();
    for class in [
        r#"content:'$(value)'"#,
        r#"content:'$name'"#,
        r#"content:'a|b'"#,
    ] {
        let result = e.inspect(class).unwrap();
        assert_eq!(
            result.match_status,
            mastercss_schema::MatchStatus::Matched,
            "{class}"
        );
        assert!(
            result.rules[0]
                .text
                .contains(class.split_once(':').unwrap().1),
            "{}",
            result.rules[0].text
        );
    }
    for class in ["color:$name", "color:$(name)"] {
        assert!(e.inspect(class).unwrap().rules.is_empty(), "{class}");
    }
}

#[test]
fn manifest_modes_cannot_bypass_activation_validation() {
    for (name, selector) in [
        ("ocean", ".x::before"),
        ("ocean", ".x:BEFORE"),
        ("ocean", "&.x"),
        ("0ocean", ".x"),
        ("ocean", ".x:has("),
    ] {
        let manifest = serde_json::json!({"version":1,"languageVersion":2,"modes":[{"name":name,"branches":[{"selector":selector}]}]});
        assert!(
            EngineSession::create(&manifest.to_string()).is_err(),
            "{manifest}"
        );
    }
}

#[test]
fn match_diagnostics_have_stable_codes_independent_of_message_text() {
    let e = engine("").unwrap();
    for (class, code) in [
        (
            "width:1px@typo",
            mastercss_schema::ErrorCode::UnknownCondition,
        ),
        ("width:calc(", mastercss_schema::ErrorCode::ClassSyntaxError),
    ] {
        let result = e.inspect(class).unwrap();
        assert_eq!(
            result.match_status,
            mastercss_schema::MatchStatus::SyntaxError
        );
        assert_eq!(result.diagnostics[0].code, code);
    }
}
