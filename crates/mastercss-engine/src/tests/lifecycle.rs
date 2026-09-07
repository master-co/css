#[test]
fn executes_rc87_parser_parity_corpus() {
    let corpus: ParserParityCorpus =
        serde_json::from_str(include_str!("../../../../parity/rust-semantic-corpus.json"))
            .expect("semantic parity corpus parses");
    assert_eq!(corpus.version, 2);
    assert!(!corpus.parser_cases.is_empty());

    let engine = EngineSession::create(include_str!(
        "../../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    for case in corpus.parser_cases {
        assert!(!case.source_id.is_empty(), "{}", case.id);
        let actual = match case.kind.as_str() {
            "condition" => render_condition_token(&case.input, &engine.compiled)
                .map(|(_, wrapper, _)| wrapper)
                .expect("condition parity case renders"),
            "selector" => selector_token_to_template(&case.input, &engine.compiled)
                .expect("selector parity case renders"),
            "lexer" => continue,
            kind => panic!("unsupported parser parity kind {kind}"),
        };
        assert_eq!(actual, case.expected_canonical, "{}", case.id);
    }
}

#[test]
fn creates_sorted_rule_transitions_and_css() {
    let mut engine = EngineSession::create(MANIFEST).unwrap();
    let transition = engine
        .ensure_class_rules(["block", "w:10px", "bg-origin-border"])
        .unwrap();
    assert_eq!(transition.mutations.len(), 3);
    assert_eq!(
        engine.css_text(),
        "@layer utilities{.bg-origin-border{background-origin:border-box}.block{display:block}.w\\:10px{width:10px}}"
    );
    let snapshot = engine.snapshot().unwrap();
    assert_eq!(snapshot.rules.len(), 3);
    assert_eq!(snapshot.rules[2].class_name, "w:10px");
}

#[test]
fn ensure_is_idempotent_and_delete_reports_exact_index() {
    let mut engine = EngineSession::create(MANIFEST).unwrap();
    engine.ensure_class_rules(["block", "w:10px"]).unwrap();
    assert!(
        engine
            .ensure_class_rules(["block"])
            .unwrap()
            .mutations
            .is_empty()
    );
    let deleted = engine.delete_class_rules(["block"]).unwrap();
    assert_eq!(deleted.mutations.len(), 1);
    assert_eq!(engine.css_text(), "@layer utilities{.w\\:10px{width:10px}}");
}

#[test]
fn refresh_replays_connected_classes_against_new_manifest() {
    let mut engine = EngineSession::create(MANIFEST).unwrap();
    engine.ensure_class_rules(["block"]).unwrap();
    let updated = MANIFEST.replace("\"block\"", "\"inline\"");
    let transition = engine.refresh(&updated).unwrap();
    assert_eq!(transition.mutations.len(), 1);
    assert_eq!(engine.css_text(), "");
}

#[test]
fn disposed_sessions_fail_closed() {
    let mut engine = EngineSession::create(MANIFEST).unwrap();
    engine.dispose();
    assert!(matches!(
        engine.snapshot(),
        Err(EngineError::SessionDisposed)
    ));
}

#[test]
fn inspection_does_not_mutate_the_session() {
    let engine = EngineSession::create(MANIFEST).unwrap();
    let inspection = engine.inspect("block:hover").unwrap();
    assert!(inspection.valid);
    assert_eq!(inspection.rules.len(), 1);
    assert_eq!(inspection.rules[0].key, "block:hover\0:hover");
    assert!(inspection.rules[0].nodes.is_empty());
    assert_eq!(engine.css_text(), "");
}

#[test]
fn preserves_selector_priority_for_class_pseudo_and_attribute_states() {
    let engine = EngineSession::create(MANIFEST).unwrap();
    for (class_name, expected) in [
        ("block.active", 3),
        ("block:hover:not(.disabled)", 5),
        ("block[disabled]", 4),
    ] {
        assert_eq!(
            engine.inspect(class_name).unwrap().rules[0]
                .priority
                .selector,
            expected,
            "{class_name}"
        );
    }
}

#[test]
fn exposes_manifest_driven_class_semantics_without_mutating_the_session() {
    let engine = EngineSession::create(MANIFEST).unwrap();
    assert_eq!(
        engine.inspect_class_semantics("block:hover").unwrap(),
        ClassSemanticInspection {
            class_name: "block:hover".into(),
            kind: ClassSemanticKind::Semantic,
            matcher_types: vec![UtilityMatcherType::Static],
            key_token: None,
            value_token: None,
            state_token: Some(":hover".into()),
            important: false,
        }
    );
    assert_eq!(
        engine.inspect_class_semantics("w:10px!:hover").unwrap(),
        ClassSemanticInspection {
            class_name: "w:10px!:hover".into(),
            kind: ClassSemanticKind::Declaration,
            matcher_types: vec![UtilityMatcherType::Key],
            key_token: Some("w:".into()),
            value_token: Some("10px".into()),
            state_token: Some(":hover".into()),
            important: true,
        }
    );
    assert_eq!(
        engine
            .inspect_class_semantics("bg-origin-border")
            .unwrap()
            .kind,
        ClassSemanticKind::Semantic
    );
    assert_eq!(engine.css_text(), "");
}

#[test]
fn groups_multi_node_utilities_into_one_hydration_rule() {
    let manifest = r#"{
          "version":1,
          "utilities":[{
            "id":".multi",
            "name":"multi",
            "type":-2,
            "emit":{"type":"static","rules":[
              {"declarations":{"display":"grid"}},
              {"selector":"&:hover","declarations":{"color":"red"}}
            ]},
            "matchers":[{"type":"static","name":"multi"}]
          }]
        }"#;
    let engine = EngineSession::create(manifest).unwrap();
    let inspection = engine.inspect("multi").unwrap();
    assert_eq!(inspection.rules.len(), 1);
    let rule = &inspection.rules[0];
    assert_eq!(rule.key, "multi");
    assert_eq!(rule.selector_text.as_deref(), Some(".multi"));
    assert_eq!(rule.text, ".multi{display:grid}.multi:hover{color:red}");
    assert_eq!(rule.nodes.len(), 2);
    assert_eq!(rule.nodes[0].text, ".multi{display:grid}");
    assert_eq!(rule.nodes[1].text, ".multi:hover{color:red}");
}

#[test]
fn tracks_variable_resources_across_aliases_and_deletion() {
    let mut engine = EngineSession::create(MANIFEST).unwrap();
    engine
        .ensure_class_rules(["fg:red-60", "bg:red-60", "m:md"])
        .unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer theme{:root{--color-red-60:#d00;--spacing-md:1rem}}@layer utilities{.m\\:md{margin:var(--spacing-md)}.bg\\:red-60{background-color:var(--color-red-60)}.fg\\:red-60{color:var(--color-red-60)}}"
    );
    engine.delete_class_rules(["fg:red-60"]).unwrap();
    assert!(engine.css_text().contains("--color-red-60:#d00"));
    engine.delete_class_rules(["bg:red-60"]).unwrap();
    assert!(!engine.css_text().contains("--color-red-60:#d00"));
    engine.delete_class_rules(["m:md"]).unwrap();
    assert!(!engine.css_text().contains("@layer theme"));
}

#[test]
fn preserves_custom_property_names_inside_generated_math() {
    let mut engine = EngineSession::create(MANIFEST).unwrap();
    engine.ensure_class_rules(["m:-3xs"]).unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer theme{:root{--spacing-3xs:.25rem}}@layer utilities{.m\\:-3xs{margin:calc(var(--spacing-3xs) * -1)}}"
    );
}

#[test]
fn suppresses_variables_already_emitted_by_the_host() {
    let mut engine = EngineSession::create_with_emitted_globals(
        MANIFEST,
        Some(r#"{"variables":{"color-red-60":1}}"#),
    )
    .unwrap();
    engine.ensure_class_rules(["fg:red-60"]).unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer utilities{.fg\\:red-60{color:var(--color-red-60)}}"
    );
    engine.delete_class_rules(["fg:red-60"]).unwrap();
    assert_eq!(engine.css_text(), "");
}

#[test]
fn registers_host_globals_transactionally_after_classes_are_ensured() {
    let mut engine = EngineSession::create(MANIFEST).unwrap();
    engine.ensure_class_rules(["fg:red-60"]).unwrap();
    let before = engine.css_text();
    assert!(before.contains("--color-red-60:#d00"));

    let error = engine
        .register_emitted_globals(r#"{"variables":{"color-red-60":-1}}"#)
        .unwrap_err();
    assert!(matches!(error, EngineError::InvalidEmittedGlobals(_)));
    assert_eq!(engine.css_text(), before);

    let transition = engine
        .register_emitted_globals(r#"{"variables":{"color-red-60":1}}"#)
        .unwrap();
    assert!(transition.mutations.iter().any(|mutation| matches!(
        mutation,
        RuleMutationIr::Delete {
            target: RuleTarget::Theme,
            ..
        }
    )));
    assert_eq!(
        engine.css_text(),
        "@layer utilities{.fg\\:red-60{color:var(--color-red-60)}}"
    );

    engine.delete_class_rules(["fg:red-60"]).unwrap();
    assert_eq!(engine.css_text(), "");
    let globals = engine.emitted_globals_snapshot().unwrap();
    assert_eq!(globals.variable_count("color-red-60"), 1);
    assert!(
        engine
            .register_emitted_globals(r#"{"variables":{"color-red-60":0}}"#)
            .unwrap()
            .mutations
            .is_empty()
    );
}

#[test]
fn validates_and_saturates_host_globals_before_classes_are_ensured() {
    let mut engine = EngineSession::create(MANIFEST).unwrap();
    let before = engine.snapshot().unwrap();
    for invalid in [
        r#"{"variables":{"color-red-60":0.5}}"#,
        r#"{"variables":{"color-red-60":-1}}"#,
        r#"{"variables":}"#,
    ] {
        assert!(matches!(
            engine.register_emitted_globals(invalid),
            Err(EngineError::InvalidEmittedGlobals(_))
        ));
        assert_eq!(engine.snapshot().unwrap(), before);
    }

    assert!(
        engine
            .register_emitted_globals(r#"{"variables":{"color-red-60":4294967295}}"#)
            .unwrap()
            .mutations
            .is_empty()
    );
    assert!(
        engine
            .register_emitted_globals(r#"{"variables":{"color-red-60":1}}"#)
            .unwrap()
            .mutations
            .is_empty()
    );
    assert_eq!(
        engine
            .emitted_globals_snapshot()
            .unwrap()
            .variable_count("color-red-60"),
        u32::MAX
    );

    engine.ensure_class_rules(["fg:red-60"]).unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer utilities{.fg\\:red-60{color:var(--color-red-60)}}"
    );
    engine.delete_class_rules(["fg:red-60"]).unwrap();
    assert_eq!(engine.css_text(), "");
    assert_eq!(
        engine
            .emitted_globals_snapshot()
            .unwrap()
            .variable_count("color-red-60"),
        u32::MAX
    );

    let mut animation_engine = EngineSession::create(include_str!(
        "../../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    animation_engine
        .register_emitted_globals(r#"{"animations":{"fade":4294967295}}"#)
        .unwrap();
    animation_engine
        .ensure_class_rules(["animation:fade|1s"])
        .unwrap();
    assert!(!animation_engine.css_text().contains("@keyframes fade{"));
    animation_engine
        .delete_class_rules(["animation:fade|1s"])
        .unwrap();
    assert_eq!(
        animation_engine
            .emitted_globals_snapshot()
            .unwrap()
            .animation_count("fade"),
        u32::MAX
    );
}

#[test]
fn registers_host_keyframes_after_animation_rules_are_ensured() {
    let mut engine = EngineSession::create(include_str!(
        "../../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    engine.ensure_class_rules(["animation:fade|1s"]).unwrap();
    assert!(engine.css_text().contains("@keyframes fade{"));

    engine
        .register_emitted_globals(r#"{"animations":{"fade":1}}"#)
        .unwrap();
    assert!(!engine.css_text().contains("@keyframes fade{"));
    assert!(
        engine
            .css_text()
            .contains(".animation\\:fade\\|1s{animation:fade 1s}")
    );

    engine.delete_class_rules(["animation:fade|1s"]).unwrap();
    assert!(!engine.css_text().contains("animation:fade 1s"));
    assert_eq!(
        engine
            .emitted_globals_snapshot()
            .unwrap()
            .animation_count("fade"),
        1
    );
}

#[test]
fn host_globals_replace_locally_emitted_static_resources() {
    let manifest = r##"{
          "version":1,
          "variables":{"color":[{"key":"brand","value":"#123","static":true}]},
          "animations":{"pulse":{"to":{"opacity":"1"}}},
          "animationOptions":{"pulse":{"static":true}},
          "utilities":[]
        }"##;
    let mut engine = EngineSession::create(manifest).unwrap();
    assert!(engine.css_text().contains("--color-brand:#123"));
    assert!(engine.css_text().contains("@keyframes pulse{"));

    engine
        .register_emitted_globals(r#"{"variables":{"color-brand":1},"animations":{"pulse":1}}"#)
        .unwrap();
    assert_eq!(engine.css_text(), "");
}

#[test]
fn commits_only_host_supported_native_declarations() {
    let mut engine = EngineSession::create(r#"{"version":1,"utilities":[]}"#).unwrap();
    let candidates = engine
        .native_declaration_candidates(["display:block", "made-up:nope"])
        .unwrap();
    assert_eq!(candidates.len(), 2);
    assert_eq!(candidates[0].property, "display");
    engine
        .ensure_class_rules_with_native_support(["display:block", "made-up:nope"], &[true, false])
        .unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer utilities{.display\\:block{display:block}}"
    );
}

#[test]
fn validates_native_value_namespaces_before_committing_rules() {
    let mut engine = EngineSession::create(r#"{"version":1,"utilities":[]}"#).unwrap();
    let candidates = engine
        .native_declaration_candidates(["width:error", "w:10px"])
        .unwrap();
    assert_eq!(candidates.len(), 2);
    assert_eq!(candidates[0].property, "width");
    assert_eq!(candidates[0].value, "error");
    assert_eq!(candidates[1].property, "width");
    assert_eq!(candidates[1].value, "10px");

    engine
        .ensure_class_rules_with_native_support(["width:error", "w:10px"], &[false, true])
        .unwrap();
    assert_eq!(engine.css_text(), "@layer utilities{.w\\:10px{width:10px}}");
    assert!(!engine.inspect("width:error").unwrap().valid);

    let token_engine = EngineSession::create(include_str!(
        "../../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    let token_candidates = token_engine
        .native_declaration_candidates(["fg:red-60"])
        .unwrap();
    assert_eq!(token_candidates.len(), 1);
    assert_eq!(token_candidates[0].property, "color");
    assert_eq!(token_candidates[0].value, "var(--color-red-60)");
}

#[test]
fn normalizes_base_units_inside_css_math_functions() {
    let engine = EngineSession::create(r#"{"version":1,"utilities":[]}"#).unwrap();
    let candidates = engine
        .native_declaration_candidates(["pl:calc(5x-2px)"])
        .unwrap();
    assert_eq!(candidates.len(), 1);
    assert_eq!(candidates[0].property, "padding-left");
    assert_eq!(candidates[0].value, "calc(1.25rem - 2px)");
    assert_eq!(
        engine.inspect("pl:calc(5x-2px)").unwrap().rules[0].text,
        ".pl\\:calc\\(5x-2px\\){padding-left:calc(1.25rem - 2px)}"
    );
}
