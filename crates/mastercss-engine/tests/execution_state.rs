use mastercss_engine::EngineSession;

#[test]
fn execution_state_reads_stored_references_without_ensuring_or_inspecting_classes() {
    let manifest = include_str!("../../../packages/preset/src/default-manifest.json");
    let mut engine = EngineSession::create(manifest).unwrap();
    assert!(
        engine.inspect("block").unwrap().match_status == mastercss_schema::MatchStatus::Matched
    );
    let initial = engine.execution_state(["block", "unknown"]).unwrap();
    assert!(
        initial
            .classes
            .iter()
            .all(|class| class.references.is_empty())
    );
    let classes = ["fg:red-60", "block", "block@base", "unknown", "block"];
    engine.ensure_class_rules(classes).unwrap();
    let state = engine.execution_state(classes).unwrap();
    let snapshot = engine.snapshot().unwrap();
    assert_eq!(state.resources, snapshot.resources);
    assert_eq!(state.classes.len(), classes.len());
    for (class, expected_name) in state.classes.iter().zip(classes) {
        assert_eq!(class.class_name, expected_name);
        let expected = snapshot
            .rules
            .iter()
            .filter(|rule| rule.class_name == expected_name)
            .map(|rule| (rule.layer, rule.key.as_str()))
            .collect::<Vec<_>>();
        assert_eq!(
            class
                .references
                .iter()
                .map(|reference| (reference.layer, reference.key.as_str()))
                .collect::<Vec<_>>(),
            expected
        );
    }
    assert_eq!(engine.snapshot().unwrap(), snapshot);
    engine.delete_class_rules(["block"]).unwrap();
    assert!(
        engine.execution_state(["block"]).unwrap().classes[0]
            .references
            .is_empty()
    );
    engine
        .refresh(r#"{"version":1,"languageVersion":3}"#)
        .unwrap();
    assert!(
        engine.execution_state(["block@base"]).unwrap().classes[0]
            .references
            .is_empty()
    );
    engine.dispose();
    assert!(engine.execution_state(["block"]).is_err());
}

#[test]
fn execution_state_tracks_resource_counts_without_css_mutations() {
    let mut engine = EngineSession::create(
        r#"{"version":1,"languageVersion":3,"variables":{"": [{"name":"x","key":"x","value":"red"}]}}"#,
    )
    .unwrap();
    engine
        .ensure_stylesheet_resources("a{color:var(--x)}")
        .unwrap();
    let before = engine.execution_state(std::iter::empty::<&str>()).unwrap();
    let transition = engine
        .ensure_stylesheet_resources("b{color:var(--x)}")
        .unwrap();
    assert!(transition.mutations.is_empty());
    let after = engine.execution_state(std::iter::empty::<&str>()).unwrap();
    assert_eq!(
        after.resources.variables[0].ref_count,
        before.resources.variables[0].ref_count + 1
    );
    assert_eq!(after.resources, engine.snapshot().unwrap().resources);
}
