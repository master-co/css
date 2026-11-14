fn utility_validation_manifest(mixins: &str, utilities: &str) -> String {
    format!(r#"{{"version":6,"languageVersion":18,"mixins":[{mixins}],"utilities":[{utilities}]}}"#)
}

fn utility_validation_error(mixins: &str, utilities: &str) -> String {
    match EngineSession::create(&utility_validation_manifest(mixins, utilities)) {
        Err(EngineError::InvalidManifest(message)) => message,
        Err(error) => panic!("unexpected error {error:?}"),
        Ok(_) => panic!("manifest should be invalid"),
    }
}

const PADDING_MIXIN: &str = r#"{"name":"--p","parameters":[{"name":"--spacing"}],"body":[{"type":"declaration","property":"padding","value":[{"type":"function","name":"var","value":[{"type":"text","value":"--spacing"}]}]}]}"#;

#[test]
fn utility_recipes_reach_shared_mixins() {
    // Static and functional forms of one name are validated independently.
    let utilities = r#"{"kind":"static","name":"pad","body":[{"type":"apply","name":"--p","arguments":[[{"type":"text","value":"1rem"}]]}]},{"kind":"function","name":"pad","parameters":[{"name":"--size"}],"body":[{"type":"apply","name":"--p","arguments":[[{"type":"function","name":"var","value":[{"type":"text","value":"--size"}]}]]}]}"#;
    let mut engine =
        EngineSession::create(&utility_validation_manifest(PADDING_MIXIN, utilities)).unwrap();
    engine.ensure_class_rules(["pad"]).unwrap();
    assert_eq!(engine.css_text(), "@layer utilities{.pad{padding:1rem}}");
}

#[test]
fn utility_recipes_report_mixin_call_errors() {
    assert_eq!(
        utility_validation_error(
            PADDING_MIXIN,
            r#"{"kind":"static","name":"pad","body":[{"type":"apply","name":"--missing","arguments":[]}]}"#
        ),
        "Unknown mixin --missing"
    );
    assert_eq!(
        utility_validation_error(
            PADDING_MIXIN,
            r#"{"kind":"static","name":"pad","body":[{"type":"apply","name":"--p","arguments":[]}]}"#
        ),
        "Incorrect argument count for --p in pad"
    );
    // A recipe cannot call another utility; only mixins are callable.
    assert_eq!(
        utility_validation_error(
            "",
            r#"{"kind":"static","name":"a","body":[]},{"kind":"static","name":"b","body":[{"type":"apply","name":"a","arguments":[]}]}"#
        ),
        "Unknown mixin a"
    );
}

#[test]
fn utility_validation_still_rejects_invalid_mixins() {
    let recursive = r#"{"name":"--a","body":[{"type":"apply","name":"--b","arguments":[]}]},{"name":"--b","body":[{"type":"apply","name":"--a","arguments":[]}]}"#;
    let utility = r#"{"kind":"static","name":"pad","body":[]}"#;
    assert!(utility_validation_error(recursive, utility).starts_with("Recursive mixin call involving --"));
    assert_eq!(
        utility_validation_error(r#"{"name":"bad","body":[]}"#, utility),
        "Invalid mixin name bad"
    );
}
