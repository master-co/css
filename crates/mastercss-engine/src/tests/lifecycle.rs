#[test]
fn executes_language_v2_parser_cases_and_historical_rejections() {
    let corpus: ParserParityCorpus =
        serde_json::from_str(include_str!("../../../../parity/v2-language-corpus.json"))
            .expect("semantic parity corpus parses");
    assert_eq!(corpus.version, 3);
    assert!(!corpus.parser_cases.is_empty());

    let engine = EngineSession::create(include_str!(
        "../../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    for case in corpus.parser_cases {
        assert!(!case.source_id.is_empty(), "{}", case.id);
        if case.historical_rejection {
            if case.kind == "selector" {
                assert!(
                    selector_token_to_template(&case.input, &engine.compiled).is_none(),
                    "{}",
                    case.id
                );
            } else {
                assert!(
                    render_condition_token(&case.input, &engine.compiled).is_none(),
                    "{} must not infer legacy conditions",
                    case.id
                );
            }
            continue;
        }
        let actual = match case.kind.as_str() {
            "condition" => render_condition_token(&case.input, &engine.compiled)
                .map(|(_, wrapper)| wrapper)
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
        .ensure_class_rules(["block", "width:10px", "bg-origin-border"])
        .unwrap();
    assert_eq!(transition.mutations.len(), 3);
    assert_eq!(
        engine.css_text(),
        "@layer utilities{.bg-origin-border{background-origin:border-box}.block{display:block}.width\\:10px{width:10px}}"
    );
    let snapshot = engine.snapshot().unwrap();
    assert_eq!(snapshot.rules.len(), 3);
    assert_eq!(snapshot.rules[2].class_name, "width:10px");
}

#[test]
fn ensure_is_idempotent_and_delete_reports_exact_index() {
    let mut engine = EngineSession::create(MANIFEST).unwrap();
    engine.ensure_class_rules(["block", "width:10px"]).unwrap();
    assert!(
        engine
            .ensure_class_rules(["block"])
            .unwrap()
            .mutations
            .is_empty()
    );
    let deleted = engine.delete_class_rules(["block"]).unwrap();
    assert_eq!(deleted.mutations.len(), 1);
    assert_eq!(
        engine.css_text(),
        "@layer utilities{.width\\:10px{width:10px}}"
    );
}

#[test]
fn refresh_replays_connected_classes_against_new_manifest() {
    let mut engine = EngineSession::create(MANIFEST).unwrap();
    engine.ensure_class_rules(["block"]).unwrap();
    let updated = MANIFEST.replace("\"name\":\"block\"", "\"name\":\"inline\"");
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
    assert!(inspection.match_status == mastercss_schema::MatchStatus::Matched);
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
        engine.inspect_class_semantics("width:10px!:hover").unwrap(),
        ClassSemanticInspection {
            class_name: "width:10px!:hover".into(),
            kind: ClassSemanticKind::Declaration,
            matcher_types: vec![UtilityMatcherType::Key],
            key_token: Some("width:".into()),
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
    let manifest = r#"{"version":6,"languageVersion":16,"mixins":[{"name":"--multi","body":[{"type":"declaration","property":"display","value":[{"type":"text","value":"grid"}]},{"type":"rule","selector":"&:hover","body":[{"type":"declaration","property":"color","value":[{"type":"text","value":"red"}]}]}]}],"utilities":[{"kind":"static","name":"multi","body":[{"type":"declaration","property":"display","value":[{"type":"text","value":"grid"}]},{"type":"rule","selector":"&:hover","body":[{"type":"declaration","property":"color","value":[{"type":"text","value":"red"}]}]}]}]}"#;
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
        .ensure_class_rules(["fg-red-60", "bg-red-60", "m-md"])
        .unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer theme{:root,:host{--color-red-60:#d00;--spacing-md:1rem}}@layer utilities{.bg-red-60{background-color:var(--color-red-60)}.fg-red-60{color:var(--color-red-60)}.m-md{margin:var(--spacing-md)}}"
    );
    engine.delete_class_rules(["fg-red-60"]).unwrap();
    assert!(engine.css_text().contains("--color-red-60:#d00"));
    engine.delete_class_rules(["bg-red-60"]).unwrap();
    assert!(!engine.css_text().contains("--color-red-60:#d00"));
    engine.delete_class_rules(["m-md"]).unwrap();
    assert!(!engine.css_text().contains("@layer theme"));
}

#[test]
fn preserves_custom_property_names_inside_generated_math() {
    let mut engine = EngineSession::create(MANIFEST).unwrap();
    engine.ensure_class_rules(["-m-3xs"]).unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer theme{:root,:host{--spacing-3xs:.25rem}}@layer utilities{.-m-3xs{margin:calc(var(--spacing-3xs) * -1)}}"
    );
}

#[test]
fn suppresses_variables_already_emitted_by_the_host() {
    let mut engine = EngineSession::create_with_emitted_globals(
        MANIFEST,
        Some(r#"{"variables":{"color-red-60":1}}"#),
    )
    .unwrap();
    engine.ensure_class_rules(["fg-red-60"]).unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer utilities{.fg-red-60{color:var(--color-red-60)}}"
    );
    engine.delete_class_rules(["fg-red-60"]).unwrap();
    assert_eq!(engine.css_text(), "");
}

#[test]
fn registers_host_globals_transactionally_after_classes_are_ensured() {
    let mut engine = EngineSession::create(MANIFEST).unwrap();
    engine.ensure_class_rules(["fg-red-60"]).unwrap();
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
        "@layer utilities{.fg-red-60{color:var(--color-red-60)}}"
    );

    engine.delete_class_rules(["fg-red-60"]).unwrap();
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

    engine.ensure_class_rules(["fg-red-60"]).unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer utilities{.fg-red-60{color:var(--color-red-60)}}"
    );
    engine.delete_class_rules(["fg-red-60"]).unwrap();
    assert_eq!(engine.css_text(), "");
    assert_eq!(
        engine
            .emitted_globals_snapshot()
            .unwrap()
            .variable_count("color-red-60"),
        u32::MAX
    );
}

#[test]
fn rejects_removed_animation_resource_registration_atomically() {
    let mut engine = EngineSession::create(include_str!(
        "../../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    engine.ensure_class_rules(["animation:fade|1s"]).unwrap();
    let before = engine.snapshot().unwrap();
    assert!(
        engine
            .register_emitted_globals(r#"{"animations":{"fade":1}}"#)
            .is_err()
    );
    assert_eq!(engine.snapshot().unwrap(), before);
}

#[test]
fn removed_static_variable_and_managed_animation_fields_are_rejected() {
    for field in [
        r#""settings":{}"#,
        r#""animations":{}"#,
        r#""animationOptions":{}"#,
        r#""modes":[]"#,
    ] {
        assert!(
            EngineSession::create(&format!(r#"{{"version":6,"languageVersion":16,{field}}}"#))
                .is_err()
        );
    }
    assert!(EngineSession::create(r#"{"version":6,"languageVersion":16,"variables":{"color":[{"key":"brand","value":"red","static":true}]}}"#).is_err());
}

#[test]
fn commits_native_declarations_without_host_support_filtering() {
    let mut engine = EngineSession::create(r#"{"version":6,"languageVersion":16}"#).unwrap();
    let candidates = engine
        .native_declaration_candidates(["display:block", "made-up:nope"])
        .unwrap();
    assert_eq!(candidates.len(), 2);
    assert_eq!(candidates[0].property, "display");
    engine
        .ensure_class_rules(["display:block", "made-up:nope"])
        .unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer utilities{.display\\:block{display:block}.made-up\\:nope{made-up:nope}}"
    );
}

#[test]
// RC takeover lineage: validates_native_value_namespaces_before_committing_rules.
// Also replaces commits_only_host_supported_native_declarations with preservation assertions.
// The final v2 contract preserves declarations; value validation is tooling-only.
fn preserves_native_values_and_distinguishes_named_tokens() {
    let mut engine = EngineSession::create(r#"{"version":6,"languageVersion":16}"#).unwrap();
    let candidates = engine
        .native_declaration_candidates(["width:error", "width:10px"])
        .unwrap();
    assert_eq!(candidates.len(), 2);
    assert_eq!(candidates[0].property, "width");
    assert_eq!(candidates[0].value, "error");
    assert_eq!(candidates[1].property, "width");
    assert_eq!(candidates[1].value, "10px");

    engine
        .ensure_class_rules(["width:error", "width:10px"])
        .unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer utilities{.width\\:10px{width:10px}.width\\:error{width:error}}"
    );
    assert!(
        engine.inspect("width:error").unwrap().match_status
            == mastercss_schema::MatchStatus::Matched
    );

    let token_engine = EngineSession::create(include_str!(
        "../../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    let token_candidates = token_engine
        .native_declaration_candidates(["fg-red-60"])
        .unwrap();
    assert!(token_candidates.is_empty());
    assert!(
        token_engine.inspect("fg-red-60").unwrap().match_status
            == mastercss_schema::MatchStatus::Matched
    );
}

#[test]
fn preserves_unsupported_units_for_host_validation_inside_css_math_functions() {
    let engine = EngineSession::create(r#"{"version":6,"languageVersion":16}"#).unwrap();
    let candidates = engine
        .native_declaration_candidates(["padding-left:calc(5x-2px)"])
        .unwrap();
    assert_eq!(candidates.len(), 1);
    assert_eq!(candidates[0].property, "padding-left");
    assert_eq!(candidates[0].value, "calc(5x - 2px)");
    assert_eq!(
        engine.inspect("padding-left:calc(5x-2px)").unwrap().rules[0].text,
        ".padding-left\\:calc\\(5x-2px\\){padding-left:calc(5x - 2px)}"
    );
}
