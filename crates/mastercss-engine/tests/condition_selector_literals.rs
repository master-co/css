use mastercss_engine::EngineSession;

const MANIFEST: &str = include_str!("../../../packages/preset/src/default-manifest.json");

#[test]
fn decimal_conditions_keep_a_single_numeric_value() {
    let engine = EngineSession::create(MANIFEST).unwrap();
    for (class_name, condition) in [
        ("block@w>=600.5", "@media (width>=37.53125rem)"),
        ("block@w>=.5", "@media (width>=0.03125rem)"),
        ("block@w>=-0.5", "@media (width>=-0.03125rem)"),
        ("block@container(600.5)", "@container (width>=37.53125rem)"),
        ("block@media(width>=37.5rem)", "@media (width >= 37.5rem)"),
        ("block@media(width:37.5rem)", "@media (width:37.5rem)"),
        (
            "block@h>=600.5&h<800.5",
            "@media (height>=37.53125rem) and (height<50.03125rem)",
        ),
    ] {
        let result = engine.inspect(class_name).unwrap();
        assert!(result.valid, "{class_name}");
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
            assert!(result.valid, "{selector}");
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
        r#"{"version":1,"selectors":{":first":[{"type":"pseudo-class","value":"first-child"}]}}"#,
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
    let engine = EngineSession::create(r#"{"version":1,"selectors":{":pick(2)":[{"type":"pseudo-class","value":"nth-child","children":[{"value":"2"}]}]}}"#).unwrap();
    assert_eq!(
        engine
            .resolve_style_selector(r#":is(:pick(2),[data-state=":pick(2)"]):first"#)
            .unwrap(),
        r#":is(:nth-child(2),[data-state=":pick(2)"]):first-child"#
    );
}
