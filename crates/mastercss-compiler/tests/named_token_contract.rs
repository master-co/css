//! The v3 named token contract. RC spellings occur only in rejection/migration cases.
use mastercss_compiler::{
    CompileManifestOptions, CompileNativeCssOptions, compile_css_directives, compile_manifest_input,
};
use mastercss_engine::{ClassSemanticKind, EngineSession};
use mastercss_schema::{CssDirectiveManifestInput, MasterCssManifest};
use serde_json::json;

fn compile(source: &str) -> Result<EngineSession, String> {
    let directives = compile_css_directives(source, &CompileNativeCssOptions::default())
        .map_err(|error| error.to_string())?;
    let manifest = compile_manifest_input(
        &directives.manifest_input,
        &CompileManifestOptions::default(),
    )
    .map_err(|error| error.to_string())?
    .manifest;
    EngineSession::create(&manifest.to_string()).map_err(|error| error.to_string())
}

fn engine() -> EngineSession {
    compile(&format!(
        r#"
        @theme {{
            --spacing-md: 1rem; --spacing-sm: .5rem; --spacing-card-body: 1.25rem;
            --font-family-mono: monospace; --font-family-brand: Brand;
            --text-sm: var(--font-size-sm); --font-size-sm: .875rem; --font-size-brand: 2rem; --font-weight-bold: 700;
            --color-red: #e00; --color-brand: #123; --color-cover: #456;
         }}
        @custom-media --sm (width >= 40rem);
        {}
    "#,
        include_str!("../../../packages/preset/src/mixins.css")
    ))
    .unwrap()
}

fn declarations(engine: &EngineSession, class: &str) -> String {
    class
        .split_whitespace()
        .flat_map(|class| engine.composition_rules(class).unwrap())
        .flat_map(|rule| {
            rule.declarations.into_iter().map(|declaration| {
                format!(
                    "{}:{}",
                    declaration.property,
                    declaration.value.as_str().unwrap()
                )
            })
        })
        .collect::<Vec<_>>()
        .join(";")
}

#[test]
fn named_tokens_and_native_values_are_separate_sources() {
    let engine = engine();
    for (class, expected) in [
        ("font-family-mono", "font-family:var(--font-family-mono)"),
        ("font-weight-bold", "font-weight:var(--font-weight-bold)"),
        ("font-size-sm", "font-size:var(--font-size-sm)"),
        ("p-md", "padding:var(--spacing-md)"),
        ("p-card-body", "padding:var(--spacing-card-body)"),
        ("fg-red", "color:var(--color-red)"),
        ("color:red", "color:red"),
        ("color:red", "color:red"),
        ("font-family:mono", "font-family:mono"),
        ("padding:md", "padding:md"),
        (
            "margin:var(--spacing-sm)|var(--spacing-md)",
            "margin:var(--spacing-sm) var(--spacing-md)",
        ),
    ] {
        assert_eq!(declarations(&engine, class), expected, "{class}");
    }
    assert_eq!(
        engine.inspect_class_semantics("p-md:hover").unwrap().kind,
        ClassSemanticKind::Token
    );
}

#[test]
fn native_shorthands_are_never_reinterpreted() {
    let engine = engine();
    for (class, expected) in [
        ("font:16px", "font:16px"),
        ("background:#fff", "background:#fff"),
        ("border:2px", "border:2px"),
        ("outline:2px", "outline:2px"),
        ("stroke:2px", "stroke:2px"),
        ("line-clamp:3", "line-clamp:3"),
    ] {
        assert_eq!(declarations(&engine, class), expected, "{class}");
    }
    let clamp = declarations(&engine, "clamp-lines(3)");
    assert!(clamp.contains("-webkit-line-clamp:3"));
    assert!(clamp.contains("display:-webkit-box"));
    assert_eq!(
        declarations(&engine, "bg-brand"),
        "background-color:var(--color-brand)"
    );
    assert!(declarations(&engine, "text-sm").contains("letter-spacing:"));
}

#[test]
fn reserved_names_longest_prefix_and_ambiguity_are_deterministic() {
    let engine = engine();
    assert_eq!(
        declarations(&engine, "bg-cover"),
        "background-color:var(--color-cover)"
    );
    assert!(declarations(&engine, "background-color-cover").is_empty());
    let retired = engine.inspect("font-brand:hover").unwrap();
    assert_eq!(
        retired.match_status,
        mastercss_schema::MatchStatus::SyntaxError
    );
    for name in ["font-family-brand:hover", "font-size-brand:hover"] {
        assert!(retired.diagnostics[0].message.contains(name));
    }
    assert!(
        engine.inspect("font-family-sm").unwrap().match_status
            != mastercss_schema::MatchStatus::Matched
    );
    let group = engine.inspect("{p-md;font-brand}:hover").unwrap();
    assert!(group.match_status != mastercss_schema::MatchStatus::Matched);
    assert_eq!(
        group.diagnostics[0].code,
        mastercss_schema::ErrorCode::ClassSyntaxError
    );
    assert_eq!(
        declarations(&engine, "font-size-brand"),
        "font-size:var(--font-size-brand)"
    );
    assert!(
        engine
            .native_declaration_candidates(["font-brand:hover"])
            .unwrap()
            .is_empty()
    );
}

#[test]
fn signs_opacity_and_variants_preserve_token_identity() {
    let engine = engine();
    assert_eq!(
        declarations(&engine, "-m-sm"),
        "margin:calc(var(--spacing-sm) * -1)"
    );
    for class in ["-p-sm", "-fg-red", "p--sm", "fg-red/2", "p-md/0.5", "p-4"] {
        assert!(
            engine.inspect(class).unwrap().match_status != mastercss_schema::MatchStatus::Matched,
            "{class}"
        );
    }
    assert_eq!(
        declarations(&engine, "fg-red/0.5"),
        "color:color-mix(in oklab,var(--color-red) 50%,transparent)"
    );
    assert!(
        engine.inspect("p-md:hover@sm!").unwrap().match_status
            == mastercss_schema::MatchStatus::Matched
    );
    let inspection = engine.inspect("p-md:hover!").unwrap();
    assert!(
        inspection.rules[0]
            .text
            .contains("padding:var(--spacing-md)!important")
    );
}

#[test]
fn raw_values_win_only_after_existing_priority_tiers() {
    for classes in [["p-md", "padding:8px"], ["padding:8px", "p-md"]] {
        let mut engine = engine();
        engine.ensure_class_rules(classes).unwrap();
        let css = engine.css_text();
        assert!(css.find("padding:var(--spacing-md)").unwrap() < css.find("padding:8px").unwrap());
    }
    let mut engine = engine();
    engine.ensure_class_rules(["pt-sm", "padding:8px"]).unwrap();
    let css = engine.css_text();
    assert!(css.find("padding-top:var(--spacing-sm)").unwrap() < css.find("padding:8px").unwrap());
}

#[test]
fn css_resolution_x_is_preserved_and_lengths_are_not_converted() {
    let engine = engine();
    assert_eq!(
        declarations(
            &engine,
            "background-image:image-set(url(a.png)|1x,url(b.png)|2x)"
        ),
        "background-image:image-set(url(a.png) 1x,url(b.png) 2x)"
    );
    assert_eq!(declarations(&engine, "padding:4x"), "padding:4x"); // Invalid CSS is a host validation concern.
    let resolution = engine
        .inspect("padding:1px@media((resolution>=2x))")
        .unwrap();
    assert!(resolution.rules[0].text.contains("resolution>=2x"));
    assert!(compile("@settings{root-size:20}").is_err());
    assert_eq!(declarations(&engine, "padding:4px"), "padding:4px");
    assert_eq!(
        declarations(&engine, "margin:calc(var(--spacing-sm)+2px)"),
        "margin:calc(var(--spacing-sm) + 2px)"
    );
}

#[test]
fn independent_classes_preserve_value_source_scope_and_importance() {
    for class in [
        "p-md:hover@sm! padding:8px:hover@sm!",
        "padding:8px:hover@sm! p-md:hover@sm!",
    ] {
        let mut engine = engine();
        engine.ensure_class_rules(class.split_whitespace()).unwrap();
        let css = engine.css_text();
        assert!(
            css.find("padding:var(--spacing-md)!important").unwrap()
                < css.find("padding:8px!important").unwrap()
        );
        assert_eq!(
            class
                .split_whitespace()
                .map(|class| engine.composition_rules(class).unwrap().len())
                .sum::<usize>(),
            2
        );
        assert!(css.contains(":hover"));
        assert!(css.contains("@media"));
    }
    let mut engine = engine();
    engine.ensure_class_rules(["p-md", "padding:8px"]).unwrap();
    assert!(
        engine.css_text().find("padding:var(--spacing-md)").unwrap()
            < engine.css_text().find("padding:8px").unwrap()
    );
}

#[test]
fn native_property_names_do_not_become_token_prefixes() {
    let mut engine = engine();
    for (class, property, value) in [
        ("font-optical-sizing:auto", "font-optical-sizing", "auto"),
        (
            "background-position-x:left",
            "background-position-x",
            "left",
        ),
        ("text-wrap:pretty", "text-wrap", "pretty"),
    ] {
        let candidates = engine.native_declaration_candidates([class]).unwrap();
        assert_eq!(candidates[0].property, property);
        assert_eq!(candidates[0].value, value);
        engine.ensure_class_rules(class.split_whitespace()).unwrap();
        assert_eq!(declarations(&engine, class), format!("{property}:{value}"));
    }
}

#[test]
fn rejects_rc_contracts_in_formal_compilation() {
    assert!(
        compile("@utility font:<~font-family> {font-family:var(--value)}")
            .unwrap_err()
            .contains("utility")
    );
    assert!(
        compile("@utility font-* from(--font-family-*, --*-*) {font-family:var(--value)}").is_err()
    );
    let native = compile("@mixin --outline(--value) {outline-width:var(--value)}").unwrap();
    assert_eq!(declarations(&native, "outline:2px"), "outline:2px");
    assert_eq!(declarations(&native, "outline(2px)"), "outline-width:2px");
    assert!(
        compile("@settings{base-unit:4}")
            .unwrap_err()
            .contains("removed")
    );
    assert!(serde_json::from_value::<CssDirectiveManifestInput>(json!({"baseUnit":4})).is_err());
    assert!(
        MasterCssManifest::new(json!({
          "version": 1,
          "languageVersion": 3
        }))
        .is_err()
    );
    assert!(
        MasterCssManifest::new(
            json!({"version":5,"languageVersion":14,"utilities":[{"matchers":[{"type":"variable","keys":["p"]}]}]})
        )
        .is_err()
    );
}

#[test]
fn migration_map_preserves_saved_rc_declarations_except_recorded_corrections() {
    let engine = EngineSession::create(include_str!(
        "../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    let mapping: serde_json::Value =
        serde_json::from_str(include_str!("fixtures/v2-rc-syntax-map.json")).unwrap();
    for case in mapping["cases"].as_array().unwrap() {
        let class = case["current"].as_str().unwrap();
        assert_eq!(
            declarations(&engine, class),
            case["currentDeclarations"].as_str().unwrap(),
            "{class}"
        );
        if case["intentionalChange"].is_null() {
            assert_eq!(
                case["rcDeclarations"], case["currentDeclarations"],
                "{class}"
            );
        }
    }
}

#[test]
fn hand_authored_manifests_cannot_reinterpret_native_declarations() {
    for utility in [
        json!({"id":"native-override","type":0,"matchers":[{"type":"static","name":"font:16px"}],"emit":{"type":"property","property":"font-size"}}),
        json!({"id":"native-enum","type":0,"matchers":[{"type":"pattern","prefix":"color:","values":["red"],"valueMap":{"red":"blue"}}],"emit":{"type":"property","property":"color"}}),
    ] {
        let source = json!({"version":5,"languageVersion":14,"utilities":[utility]}).to_string();
        assert!(
            EngineSession::create(&source)
                .err()
                .unwrap()
                .to_string()
                .contains("utilities")
                || EngineSession::create(&source)
                    .err()
                    .unwrap()
                    .to_string()
                    .contains("utilities")
        );
    }
}

#[test]
fn handwritten_mixin_reserves_token_spelling() {
    let engine = compile("@theme {--color-red:red}@mixin --fg-red{color:purple}").unwrap();
    assert_eq!(declarations(&engine, "fg-red"), "color:purple");
    assert!(
        engine.inspect("fg-red:hover").unwrap().rules[0]
            .text
            .contains("color:purple")
    );
}
