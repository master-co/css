//! The v2 release contract. RC spellings occur only in rejection/migration cases.
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
            --font-size-sm: .875rem; --font-size-brand: 2rem; --font-weight-bold: 700;
            --color-red: #e00; --color-brand: #123; --color-cover: #456;
        }}
        @custom-variant sm {{ @media (width >= 40rem) {{ @slot; }} }}
        {}
    "#,
        include_str!("../../../packages/preset/src/utilities.css")
    ))
    .unwrap()
}

fn declarations(engine: &EngineSession, class: &str) -> String {
    engine
        .composition_rules(class)
        .unwrap()
        .into_iter()
        .flat_map(|rule| {
            rule.declarations
                .into_iter()
                .map(|(property, value)| format!("{property}:{}", value.as_str().unwrap()))
        })
        .collect::<Vec<_>>()
        .join(";")
}

#[test]
fn named_tokens_and_native_values_are_separate_sources() {
    let engine = engine();
    for (class, expected) in [
        ("font-mono", "font-family:var(--font-family-mono)"),
        ("font-bold", "font-weight:var(--font-weight-bold)"),
        ("font-sm", "font-size:var(--font-size-sm)"),
        ("p-md", "padding:var(--spacing-md)"),
        ("p-card-body", "padding:var(--spacing-card-body)"),
        ("fg-red", "color:var(--color-red)"),
        ("fg:red", "color:red"),
        ("color:red", "color:red"),
        ("font-family:mono", "font-family:mono"),
        ("p:md", "padding:md"),
        (
            "m:var(--spacing-sm)|var(--spacing-md)",
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
        ("bg:#fff", "background:#fff"),
        ("b:2px", "border:2px"),
        ("outline:2px", "outline:2px"),
        ("stroke:2px", "stroke:2px"),
        ("line-clamp:3", "line-clamp:3"),
    ] {
        assert_eq!(declarations(&engine, class), expected, "{class}");
    }
    let clamp = declarations(&engine, "clamp-lines:3");
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
    assert_eq!(declarations(&engine, "bg-cover"), "background-size:cover");
    assert_eq!(
        declarations(&engine, "background-color-cover"),
        "background-color:var(--color-cover)"
    );
    let ambiguous = engine.inspect("font-brand:hover").unwrap();
    assert!(!ambiguous.valid);
    assert!(ambiguous.diagnostics[0].message.contains("Ambiguous"));
    assert!(
        ambiguous.diagnostics[0]
            .notes
            .contains(&"font-family-brand:hover".into())
    );
    assert!(
        ambiguous.diagnostics[0]
            .notes
            .contains(&"font-size-brand:hover".into())
    );
    assert!(!engine.inspect("font-family-sm").unwrap().valid);
    let group = engine.inspect("{p-md;font-brand}:hover").unwrap();
    assert!(!group.valid);
    assert!(group.diagnostics[0].message.contains("Ambiguous"));
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
        assert!(!engine.inspect(class).unwrap().valid, "{class}");
    }
    assert_eq!(
        declarations(&engine, "fg-red/0.5"),
        "color:color-mix(in oklab,var(--color-red) 50%,transparent)"
    );
    assert!(engine.inspect("{p-md;fg-red}:hover@sm!").unwrap().valid);
    let inspection = engine.inspect("p-md:hover!").unwrap();
    assert!(
        inspection.rules[0]
            .text
            .contains("padding:var(--spacing-md)!important")
    );
}

#[test]
fn raw_values_win_only_after_existing_priority_tiers() {
    for classes in [["p-md", "p:8px"], ["p:8px", "p-md"]] {
        let mut engine = engine();
        engine.ensure_class_rules(classes).unwrap();
        let css = engine.css_text();
        assert!(css.find("padding:var(--spacing-md)").unwrap() < css.find("padding:8px").unwrap());
    }
    let mut engine = engine();
    engine.ensure_class_rules(["pt-sm", "p:8px"]).unwrap();
    let css = engine.css_text();
    assert!(css.find("padding:8px").unwrap() < css.find("padding-top:var(--spacing-sm)").unwrap());
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
    assert_eq!(declarations(&engine, "p:4x"), "padding:4x"); // Invalid CSS is a host validation concern.
    let resolution = engine.inspect("p:1px@media(resolution>=2x)").unwrap();
    assert!(resolution.rules[0].text.contains("resolution >= 2x"));
    let configured = compile("@settings{root-size:20}").unwrap();
    assert_eq!(declarations(&configured, "p:4px"), "padding:4px");
    assert_eq!(
        declarations(&engine, "m:calc(var(--spacing-sm)+2px)"),
        "margin:calc(var(--spacing-sm) + 2px)"
    );
}

#[test]
fn groups_preserve_each_items_value_source_scope_and_importance() {
    for class in ["{p-md;p:8px}:hover@sm!", "{p:8px;p-md}:hover@sm!"] {
        let mut engine = engine();
        engine.ensure_class_rules([class]).unwrap();
        let css = engine.css_text();
        assert!(
            css.find("padding:var(--spacing-md)!important").unwrap()
                < css.find("padding:8px!important").unwrap()
        );
        assert_eq!(engine.composition_rules(class).unwrap().len(), 2);
        assert!(css.contains(":hover"));
        assert!(css.contains("@media"));
    }
    let mut engine = engine();
    engine.ensure_class_rules(["{p-md}", "p:8px"]).unwrap();
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
        engine
            .ensure_class_rules_with_native_support([class], &[true])
            .unwrap();
        assert_eq!(declarations(&engine, class), format!("{property}:{value}"));
    }
}

#[test]
fn rejects_rc_contracts_in_formal_compilation() {
    assert!(
        compile("@utilities{font:<~font-family>{font-family:--value()}}")
            .unwrap_err()
            .contains("named patterns")
    );
    assert!(compile("@utilities{font-<~font-family|*>{font-family:--value()}}").is_err());
    assert!(
        compile("@utilities{outline:<number>{outline-width:--value()}}")
            .unwrap_err()
            .contains("Native property")
    );
    assert!(
        compile("@settings{base-unit:4}")
            .unwrap_err()
            .contains("removed")
    );
    assert!(serde_json::from_value::<CssDirectiveManifestInput>(json!({"baseUnit":4})).is_err());
    assert!(MasterCssManifest::new(json!({"version":1,"settings":{"baseUnit":4}})).is_err());
    assert!(
        MasterCssManifest::new(
            json!({"version":1,"utilities":[{"matchers":[{"type":"variable","keys":["p"]}]}]})
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
        let class = case["v2"].as_str().unwrap();
        assert_eq!(
            declarations(&engine, class),
            case["v2Declarations"].as_str().unwrap(),
            "{class}"
        );
        if case["intentionalChange"].is_null() {
            assert_eq!(case["rcDeclarations"], case["v2Declarations"], "{class}");
        }
    }
}

#[test]
fn hand_authored_manifests_cannot_reinterpret_native_declarations() {
    for utility in [
        json!({"id":"native-override","type":0,"matchers":[{"type":"static","name":"font:16px"}],"emit":{"type":"property","property":"font-size"}}),
        json!({"id":"native-enum","type":0,"matchers":[{"type":"pattern","prefix":"color:","values":["red"],"valueMap":{"red":"blue"}}],"emit":{"type":"property","property":"color"}}),
    ] {
        let source = json!({"version":1,"utilities":[utility]}).to_string();
        assert!(
            EngineSession::create(&source)
                .err()
                .unwrap()
                .to_string()
                .contains("Native property")
        );
    }
}

#[test]
fn handwritten_static_names_reserve_token_spellings_at_every_sort_type() {
    for utility_type in [-2, -1, 0] {
        let manifest = json!({
            "version": 1,
            "variables": {"color": [{"key":"red", "type":"string", "value":"#f00"}]},
            "utilities": [{
                "id":"explicit-red", "name":"fg-red", "type": utility_type,
                "emit":{"type":"property", "property":"color"},
                "matchers":[{"type":"static", "name":"fg-red"}]
            }]
        });
        // A static rule with a declaration is independent of its sorting tier.
        let mut manifest = manifest;
        manifest["utilities"][0]["emit"] =
            json!({"type":"static", "rules":[{"declarations":{"color":"purple"}}]});
        let engine = EngineSession::create(&manifest.to_string()).unwrap();
        assert_eq!(declarations(&engine, "fg-red"), "color:purple");
        assert_eq!(declarations(&engine, "fg-red:hover"), "color:purple");
        assert_eq!(declarations(&engine, "color-red"), "color:var(--color-red)");
    }
}

#[test]
fn mixed_manifest_matchers_preserve_source_boundaries() {
    let mut manifest: serde_json::Value =
        serde_json::from_str(&engine().manifest_json().unwrap()).unwrap();
    let utilities = manifest["utilities"].as_array_mut().unwrap();
    let family = utilities
        .iter_mut()
        .find(|utility| {
            utility["emit"].to_string().contains("font-family")
                && utility["matchers"].as_array().is_some_and(|matchers| {
                    matchers
                        .iter()
                        .any(|matcher| matcher["type"] == "token" && matcher["prefix"] == "font-")
                })
        })
        .unwrap();
    let matchers = family["matchers"].as_array_mut().unwrap();
    matchers.push(json!({"type":"pattern", "prefix":"font-", "values":["reserved"], "valueMap":{"reserved":"serif"}}));
    matchers.push(json!({"type":"key", "keys":["custom-font"]}));
    let engine = EngineSession::create(&manifest.to_string()).unwrap();
    assert!(!engine.inspect("font-brand").unwrap().valid);
    assert_eq!(declarations(&engine, "font-reserved"), "font-family:serif");
    assert_eq!(
        declarations(&engine, "custom-font:monospace"),
        "font-family:monospace"
    );
}
