use super::*;

const DEFAULT_MANIFEST: &str = include_str!("../../../packages/preset/src/default-manifest.json");

const MANIFEST: &str = r#"{
      "version":1,
      "variables":{
        "spacing":[{"key":"md","type":"number","value":"1rem"}]
      },
      "utilities":[
        {"id":"block","name":"block","type":-2,"emit":{"type":"static","rules":[{"declarations":{"display":"block"}}]},"matchers":[{"type":"static","name":"block"}]},
        {"id":"m","name":"m:","type":-1,"variableAliasRefs":["~spacing"],"emit":{"type":"property","property":"margin"},"matchers":[{"type":"key","keys":["m"]}]},
        {"id":"mx","name":"mx:","type":-1,"emit":{"type":"template","declarations":{"margin-right":null,"margin-left":null}},"matchers":[{"type":"key","keys":["mx"]}]},
        {"id":"ml","name":"ml:","type":-1,"emit":{"type":"property","property":"margin-left"},"matchers":[{"type":"key","keys":["ml"]}]},
        {"id":"mr","name":"mr:","type":-1,"emit":{"type":"property","property":"margin-right"},"matchers":[{"type":"key","keys":["mr"]}]},
        {"id":"fg","name":"fg:","type":0,"emit":{"type":"property","property":"color"},"matchers":[{"type":"key","keys":["fg"]}]}
      ]
    }"#;

#[test]
fn classifies_host_rule_validation_results_in_rust() {
    let mut engine = EngineSession::create(MANIFEST).unwrap();
    engine.ensure_class_rules(["block"]).unwrap();
    let batch = ValidatorBatchIr {
        version: 1,
        classes: vec![
            mastercss_schema::ValidatorClassIr {
                class_name: "block".into(),
                matched: true,
                rules: engine.inspect("block").unwrap().rules,
            },
            mastercss_schema::ValidatorClassIr {
                class_name: "unknown".into(),
                matched: false,
                rules: Vec::new(),
            },
        ],
    };

    let classified = classify_host_rule_validation(
        &batch,
        &[vec![vec!["Unsupported CSS declaration.".into()]], vec![]],
    );
    assert_eq!(classified.invalid_generated_classes, ["block"]);
    assert_eq!(
        classified.validation_errors,
        [vec!["Unsupported CSS declaration.".to_owned()], vec![]]
    );

    let missing = classify_host_rule_validation(&batch, &[vec![], vec![]]);
    assert_eq!(missing.invalid_generated_classes, ["block"]);
    assert_eq!(
        missing.validation_errors[0],
        ["Host CSS validation result is missing."]
    );
}

#[test]
fn sorts_and_finds_full_conflicts_without_retaining_rules() {
    let mut session = LintSession::create(MANIFEST).unwrap();
    let batch = session
        .analyze(
            ["fg:white", "m:2px", "m:3px", "unknown"],
            None,
            &HashSet::new(),
        )
        .unwrap();
    assert_eq!(batch.version, 1);
    assert_eq!(
        batch.sorted_class_names,
        ["m:2px", "m:3px", "fg:white", "unknown"]
    );
    assert_eq!(batch.conflicts[0].class_name, "m:2px");
    assert_eq!(batch.conflicts[0].conflicts, ["m:3px"]);

    let mut default_session = LintSession::create(DEFAULT_MANIFEST).unwrap();
    let conditional = default_session
        .analyze(["m:10x@sm", "m:3.125rem@sm"], None, &HashSet::new())
        .unwrap();
    assert_eq!(
        conditional.sorted_class_names,
        ["m:3.125rem@sm", "m:10x@sm"]
    );

    let partial = session
        .analyze(["mx:2px", "ml:3px"], None, &HashSet::new())
        .unwrap();
    assert_eq!(
        partial.partial_conflicts,
        [PartialClassConflictIr {
            class_name: "mx:2px".into(),
            replacement: "mr:2px".into(),
            conflict: "ml:3px".into(),
        }]
    );
}

#[test]
fn discovers_raw_value_segments_and_creates_policy_diagnostics() {
    let mut session = LintSession::create(MANIFEST).unwrap();
    let class_names = vec!["m:md".into(), "m:md|17px".into(), "block".into()];
    let candidates = session
        .raw_value_candidates(&class_names, None, &HashSet::new())
        .unwrap();
    assert_eq!(
        candidates.candidates,
        [RawValueCandidateIr {
            class_name: "m:md|17px".into(),
            key: "m".into(),
            segments: vec!["17px".into()],
            properties: vec!["margin".into()],
        }]
    );

    let ir = session
        .analyze_class_list(
            "😀 m:md|17px",
            &["😀".into(), "m:md|17px".into()],
            None,
            &HashSet::new(),
            LintClassListPolicy {
                raw_value_policy: Some(&RawValuePolicy {
                    allowed_patterns: Vec::new(),
                    ..RawValuePolicy::default()
                }),
                ..LintClassListPolicy::default()
            },
        )
        .unwrap();
    let diagnostic = ir
        .diagnostics
        .iter()
        .find(|diagnostic| diagnostic.code == "unapproved-raw-value")
        .unwrap();
    assert_eq!(diagnostic.range, SourceRange { start: 3, end: 12 });
    assert_eq!(
        diagnostic.message,
        "Raw value \"17px\" is not approved for class \"m:md|17px\". Use a token or allow the value explicitly."
    );
    assert_eq!(diagnostic.data["properties"], serde_json::json!(["margin"]));

    let approved = session
        .analyze_class_list(
            "m:md|17px",
            &["m:md|17px".into()],
            None,
            &HashSet::new(),
            LintClassListPolicy {
                raw_value_policy: Some(
                    &RawValuePolicy::new(false, Vec::new(), vec![r"^\d+px$".into()]).unwrap(),
                ),
                ..LintClassListPolicy::default()
            },
        )
        .unwrap();
    assert!(
        approved
            .diagnostics
            .iter()
            .all(|diagnostic| diagnostic.code != "unapproved-raw-value")
    );
    assert!(RawValuePolicy::new(false, Vec::new(), vec!["[".into()]).is_err());
}

#[test]
fn suggests_canonical_classes_from_engine_facts() {
    let mut session = LintSession::create(DEFAULT_MANIFEST).unwrap();
    let class_names = [
        "text-align:center:hover@sm",
        "font:16px",
        "margin:md",
        "position:relative",
        "m:1rem|1.5rem",
        "m:var(--spacing-md)",
        "block@dark@sm",
    ]
    .map(str::to_owned);
    let native_support = vec![
        true;
        session
            .native_declaration_candidates(&class_names)
            .unwrap()
            .len()
    ];
    let result = session
        .canonical_class_names(
            &class_names,
            Some(&native_support),
            &CanonicalClassNameOptions::default(),
        )
        .unwrap();
    assert_eq!(
        result.suggestions,
        [
            CanonicalClassSuggestionIr {
                class_name: "text-align:center:hover@sm".into(),
                recommended: "text-center:hover@sm".into(),
            },
            CanonicalClassSuggestionIr {
                class_name: "font:16px".into(),
                recommended: "font:md".into(),
            },
            CanonicalClassSuggestionIr {
                class_name: "margin:md".into(),
                recommended: "m:md".into(),
            },
            CanonicalClassSuggestionIr {
                class_name: "position:relative".into(),
                recommended: "rel".into(),
            },
            CanonicalClassSuggestionIr {
                class_name: "m:1rem|1.5rem".into(),
                recommended: "m:md|lg".into(),
            },
            CanonicalClassSuggestionIr {
                class_name: "m:var(--spacing-md)".into(),
                recommended: "m:md".into(),
            },
            CanonicalClassSuggestionIr {
                class_name: "block@dark@sm".into(),
                recommended: "block@sm@dark".into(),
            },
        ]
    );
    assert_eq!(session.engine.css_text(), "");
}

#[test]
fn suggests_canonical_composition_groups_from_engine_facts() {
    let mut session = LintSession::create(DEFAULT_MANIFEST).unwrap();
    let cases = [
        (vec!["w:md", "h:md"], Some("size:md")),
        (vec!["min-w:md", "min-h:md"], Some("min-size:md")),
        (vec!["max-w:md", "max-h:md"], Some("max-size:md")),
        (vec!["mt:md", "mb:md"], Some("my:md")),
        (vec!["ml:md", "mr:md"], Some("mx:md")),
        (vec!["pt:md", "pb:md"], Some("py:md")),
        (vec!["pl:md", "pr:md"], Some("px:md")),
        (vec!["margin-top:md", "margin-bottom:md"], Some("my:md")),
        (
            vec!["mt:md@dark@sm", "mb:md@dark@sm"],
            Some("my:md@sm@dark"),
        ),
        (vec!["w:md", "h:lg"], None),
        (vec!["mt:md", "mb:md@sm"], None),
    ];
    for (class_names, expected) in cases {
        let class_names = class_names
            .into_iter()
            .map(str::to_owned)
            .collect::<Vec<_>>();
        let native_support = vec![
            true;
            session
                .native_declaration_candidates(&class_names)
                .unwrap()
                .len()
        ];
        let result = session
            .canonical_class_groups(
                &class_names,
                Some(&native_support),
                &CanonicalClassNameOptions::default(),
            )
            .unwrap();
        assert_eq!(
            result.suggestions,
            expected
                .map(|recommended| vec![CanonicalClassGroupSuggestionIr {
                    class_names: class_names.clone(),
                    recommended: recommended.into(),
                }])
                .unwrap_or_default(),
            "{class_names:?}"
        );
        assert_eq!(session.engine.css_text(), "");
    }
}

#[test]
fn creates_structural_compose_directives_from_engine_facts() {
    let mut session = LintSession::create(DEFAULT_MANIFEST).unwrap();
    let class_names = ["text-align:center", "contain:content"].map(str::to_owned);
    let native_support = vec![
        true;
        session
            .native_declaration_candidates(&class_names)
            .unwrap()
            .len()
    ];
    assert_eq!(
        session
            .canonical_compose_directive(
                &class_names,
                Some(&native_support),
                &CanonicalClassNameOptions::default(),
            )
            .unwrap(),
        CanonicalComposeDirectiveIr {
            version: LINT_BATCH_VERSION,
            suggestions: vec![
                CanonicalComposeSuggestionIr {
                    actual: "text-align:center".into(),
                    recommended: "text-center".into(),
                    class_names: vec!["text-align:center".into()],
                    kind: CanonicalComposeSuggestionKind::Class,
                },
                CanonicalComposeSuggestionIr {
                    actual: "contain:content".into(),
                    recommended: "contain: content".into(),
                    class_names: vec!["contain:content".into()],
                    kind: CanonicalComposeSuggestionKind::NativeDeclaration,
                },
            ],
            structural_change: Some(true),
            replacement: Some("@compose text-center;\ncontain: content;".into()),
        }
    );

    let class_names = ["bg:blue-60:hover@sm", "block@dark"].map(str::to_owned);
    let native_support = vec![
        true;
        session
            .native_declaration_candidates(&class_names)
            .unwrap()
            .len()
    ];
    let result = session
        .canonical_compose_directive(
            &class_names,
            Some(&native_support),
            &CanonicalClassNameOptions::default(),
        )
        .unwrap();
    assert_eq!(
        result.replacement.as_deref(),
        Some("&:hover { @variant sm { @compose bg:blue-60; } }\n@dark { @compose block; }")
    );
    assert_eq!(
        result
            .suggestions
            .iter()
            .map(|suggestion| suggestion.kind)
            .collect::<Vec<_>>(),
        [
            CanonicalComposeSuggestionKind::VariantBlock,
            CanonicalComposeSuggestionKind::VariantBlock,
        ]
    );

    let class_names = ["contain:content!"].map(str::to_owned);
    let native_support = vec![true];
    let result = session
        .canonical_compose_directive(
            &class_names,
            Some(&native_support),
            &CanonicalClassNameOptions::default(),
        )
        .unwrap();
    assert_eq!(
        result.replacement.as_deref(),
        Some("contain: content !important;")
    );
    assert_eq!(session.engine.css_text(), "");
}
