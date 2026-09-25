use mastercss_engine::EngineSession;

const MANIFEST: &str = include_str!("../../../packages/preset/src/default-manifest.json");

#[test]
fn decimal_conditions_keep_a_single_numeric_value() {
    let engine = EngineSession::create(MANIFEST).unwrap();
    for (class_name, condition) in [
        ("block@media((width>=600.5px))", "@media (width>=600.5px)"),
        ("block@media((width>=.5rem))", "@media (width>=.5rem)"),
        ("block@media((width>=-0.5px))", "@media (width>=-0.5px)"),
        (
            "block@container((width>=600.5px))",
            "@container (width>=600.5px)",
        ),
        ("block@media((width>=37.5rem))", "@media (width>=37.5rem)"),
        ("block@media((width:37.5rem))", "@media (width:37.5rem)"),
        (
            "block@media((600.5px<=height<800.5px))",
            "@media (600.5px<=height<800.5px)",
        ),
    ] {
        let result = engine.inspect(class_name).unwrap();
        assert!(
            result.match_status == mastercss_schema::MatchStatus::Matched,
            "{class_name}"
        );
        assert_eq!(
            result.rules[0].text,
            format!(
                "{condition}{{.{}{{display:block}}}}",
                mastercss_lexer::css_escape(class_name)
            ),
            "{class_name}"
        );
    }
}

#[test]
fn selector_aliases_preserve_attribute_literals_and_escaped_identifiers() {
    let engine = EngineSession::create(MANIFEST).unwrap();
    for (selector, expected) in [
        (
            r#"[data-state=":first"]:first"#,
            r#"[data-state=":first"]:first-child"#,
        ),
        (
            r#"[data-state=':before']:before"#,
            r#"[data-state=':before']::before"#,
        ),
        (
            r#":is(:first,[data-state=":last"]):after"#,
            r#":is(:first-child,[data-state=":last"])::after"#,
        ),
        (
            r#"[data-state="escaped\":first"]:last"#,
            r#"[data-state="escaped\":first"]:last-child"#,
        ),
        (r".literal\:first:first", r".literal\:first:first-child"),
        (r".literal\:before:before", r".literal\:before::before"),
        ("::before", "::before"),
        ("::first", "::first"),
        (":first-of-type", ":first-of-type"),
    ] {
        assert_eq!(engine.resolve_style_selector(selector).unwrap(), expected);
        if !selector.starts_with('.') {
            let result = engine.inspect(&format!("block{selector}")).unwrap();
            assert!(
                result.match_status == mastercss_schema::MatchStatus::Matched,
                "{selector}"
            );
            assert!(
                result.rules[0]
                    .selector_text
                    .as_ref()
                    .unwrap()
                    .ends_with(expected),
                "{selector}: {:?}",
                result.rules[0].selector_text
            );
        }
    }
}

#[test]
fn manifest_selector_aliases_match_actual_pseudos_only() {
    let engine = EngineSession::create(
        r#"{"version":1,"languageVersion":3,"selectors":{":first":[{"type":"pseudo-class","value":"first-child"}]}}"#,
    )
    .unwrap();
    assert_eq!(
        engine
            .resolve_style_selector(
                r#".literal\:first[data-state=":first"]:is(:first,::first,:firstly)"#
            )
            .unwrap(),
        r#".literal\:first[data-state=":first"]:is(:first-child,::first,:firstly)"#
    );
}

#[test]
fn preserves_complete_functional_manifest_aliases() {
    let engine = EngineSession::create(r#"{"version":1,"languageVersion":3,"selectors":{":pick(2)":[{"type":"pseudo-class","value":"nth-child","children":[{"value":"2"}]}]}}"#).unwrap();
    assert_eq!(
        engine
            .resolve_style_selector(r#":is(:pick(2),[data-state=":pick(2)"]):first"#)
            .unwrap(),
        r#":is(:nth-child(2),[data-state=":pick(2)"]):first-child"#
    );
}

#[test]
fn raw_manifest_mode_conditions_require_balanced_native_queries() {
    for condition in [
        "@media (width>1px",
        "@supports ",
        "@media width>1px",
        "@container (width>1px)",
        "@media (width>1px);body{display:none}",
    ] {
        let manifest = serde_json::json!({"version":1,"languageVersion":3,"modes":[{"name":"custom","branches":[{"selector":".custom","conditions":[condition]}]}]});
        assert!(
            EngineSession::create(&manifest.to_string()).is_err(),
            "{condition}"
        );
    }
}

#[test]
fn raw_manifest_variant_index_cannot_hide_a_different_condition() {
    let mut manifest = serde_json::json!({"version":1,"languageVersion":3,
      "conditions":{"wide":{"id":"media","nodes":[{"type":"string","value":"(width>=800px)"}]}},
      "variants":[{"token":"@wide","branches":[{"conditions":["@media (width>=900px)"]}]}]});
    assert!(EngineSession::create(&manifest.to_string()).is_err());
    manifest["variants"][0]["branches"][0]["conditions"][0] = "@media (width>=800px)".into();
    assert!(EngineSession::create(&manifest.to_string()).is_ok());
    manifest["variables"] = serde_json::json!({"breakpoint":[{"key":"wide","value":"800px"}]});
    assert!(EngineSession::create(&manifest.to_string()).is_err());
}

#[test]
fn native_data_urls_preserve_semicolons_and_resolution_descriptors() {
    let engine = EngineSession::create(MANIFEST).unwrap();
    let result = engine
        .inspect("background-image:image-set(url(data:image/gif;base64,AAAA)|1x)")
        .unwrap();
    assert_eq!(
        result.match_status,
        mastercss_schema::MatchStatus::Matched,
        "{result:?}"
    );
    assert!(
        result.rules[0]
            .text
            .contains("url(data:image/gif;base64,AAAA) 1x")
    );
}
