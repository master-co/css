use std::collections::HashSet;

use super::{
    CanonicalClassGroupSuggestionIr, CanonicalClassNameOptions, EngineSession, LintClassListPolicy,
    LintSession, RawValueCandidateIr, RawValuePolicy, SourceRange, ValidatorBatchIr,
    classify_host_rule_validation,
};

const DEFAULT_MANIFEST: &str = include_str!("../../../packages/preset/src/default-manifest.json");

const MANIFEST: &str = r#"{"version":4,"languageVersion":12,"variables":{"spacing":[{"key":"md","type":"number","values":[{"path":[":root,:host"],"value":"1rem"}]}]},"theme":[{"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"spacing-md","value":"1rem"}]}],"mixins":[{"name":"--block","body":[{"type":"declaration","property":"display","value":[{"type":"text","value":"block"}]}]},{"name":"--physical-mx","parameters":[{"name":"--value"}],"body":[{"type":"declaration","property":"margin-right","value":[{"type":"function","name":"var","value":[{"type":"text","value":"--value"}]}]},{"type":"declaration","property":"margin-left","value":[{"type":"function","name":"var","value":[{"type":"text","value":"--value"}]}]}]}]}"#;

#[test]
fn wrapper_conflicts_compare_expanded_selectors_and_keep_branch_order() {
    let manifest = serde_json::json!({"version":4,"languageVersion":12,"mixins":[
        {"name":"--a","body":[{"type":"rule","selector":"&:hover","body":[{"type":"contents","fallback":[]}]}]},
        {"name":"--b","body":[{"type":"rule","selector":"&:hover","body":[{"type":"contents","fallback":[]}]}]},
        {"name":"--c","body":[{"type":"rule","selector":"&:focus","body":[{"type":"contents","fallback":[]}]}]},
        {"name":"--multiple","body":[{"type":"contents","fallback":[]},{"type":"rule","selector":"&:hover","body":[{"type":"contents","fallback":[]}]}]}
    ]});
    let mut session = LintSession::create(&manifest.to_string()).unwrap();
    let equivalent = session
        .analyze(
            ["color:red@apply(--a)", "color:blue@apply(--b)"],
            None,
            &HashSet::new(),
        )
        .unwrap();
    assert_eq!(equivalent.conflicts.len(), 1);
    for classes in [
        ["color:red@apply(--a)", "color:blue@apply(--c)"],
        ["color:red@apply(--multiple)", "color:blue@apply(--a)"],
        [
            "color:red@apply(--a)@apply(--c)",
            "color:blue@apply(--c)@apply(--a)",
        ],
    ] {
        let result = session.analyze(classes, None, &HashSet::new()).unwrap();
        assert!(result.conflicts.is_empty(), "{classes:?}");
        assert!(result.partial_conflicts.is_empty(), "{classes:?}");
    }
}

#[test]
fn classifies_host_rule_validation_results_in_rust() {
    let mut engine = EngineSession::create(MANIFEST).unwrap();
    engine.ensure_class_rules(["block"]).unwrap();
    let batch = ValidatorBatchIr {
        version: 1,
        classes: vec![
            mastercss_schema::ValidatorClassIr {
                diagnostics: Vec::new(),
                class_name: "block".into(),
                match_status: mastercss_schema::MatchStatus::Matched,
                css_syntax_status: mastercss_schema::CssSyntaxStatus::NotChecked,
                css_value_status: mastercss_schema::CssValueStatus::NotChecked,
                browser_support: mastercss_schema::BrowserSupport::NotChecked,
                rules: engine.inspect("block").unwrap().rules,
            },
            mastercss_schema::ValidatorClassIr {
                diagnostics: Vec::new(),
                class_name: "unknown".into(),
                match_status: mastercss_schema::MatchStatus::Unmatched,
                css_syntax_status: mastercss_schema::CssSyntaxStatus::NotChecked,
                css_value_status: mastercss_schema::CssValueStatus::NotChecked,
                browser_support: mastercss_schema::BrowserSupport::NotChecked,
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
            ["color:white", "margin:2px", "margin:3px", "unknown"],
            None,
            &HashSet::new(),
        )
        .unwrap();
    assert_eq!(batch.version, 4);
    assert_eq!(
        batch.sorted_class_names,
        ["margin:2px", "margin:3px", "color:white", "unknown"]
    );
    assert_eq!(batch.conflicts[0].class_name, "margin:2px");
    assert_eq!(batch.conflicts[0].conflicts, ["margin:3px"]);

    let mut default_session = LintSession::create(DEFAULT_MANIFEST).unwrap();
    let conditional = default_session
        .analyze(
            ["margin:2.5rem@sm", "margin:3.125rem@sm"],
            None,
            &HashSet::new(),
        )
        .unwrap();
    assert_eq!(
        conditional.sorted_class_names,
        ["margin:2.5rem@sm", "margin:3.125rem@sm"]
    );

    let partial = session
        .analyze(
            ["physical-mx:2px", "margin-left:3px"],
            None,
            &HashSet::new(),
        )
        .unwrap();
    assert!(
        partial.partial_conflicts.is_empty(),
        "A replacement must preserve the source priority tier"
    );
}

#[test]
fn discovers_raw_value_segments_and_creates_policy_diagnostics() {
    let mut session = LintSession::create(MANIFEST).unwrap();
    let class_names = vec![
        "m-md".into(),
        "margin:var(--spacing-md)|17px".into(),
        "block".into(),
    ];
    let candidates = session
        .raw_value_candidates(&class_names, None, &HashSet::new())
        .unwrap();
    assert_eq!(
        candidates.candidates,
        [RawValueCandidateIr {
            class_name: "margin:var(--spacing-md)|17px".into(),
            key: "margin".into(),
            segments: vec!["17px".into()],
            properties: vec!["margin".into()],
        }]
    );

    let ir = session
        .analyze_class_list(
            "😀 margin:var(--spacing-md)|17px",
            &["😀".into(), "margin:var(--spacing-md)|17px".into()],
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
    assert_eq!(diagnostic.range, SourceRange { start: 3, end: 32 });
    assert_eq!(
        diagnostic.message,
        "Raw value \"17px\" is not approved for class \"margin:var(--spacing-md)|17px\". Use a token or allow the value explicitly."
    );
    assert_eq!(diagnostic.data["properties"], serde_json::json!(["margin"]));

    let approved = session
        .analyze_class_list(
            "margin:var(--spacing-md)|17px",
            &["margin:var(--spacing-md)|17px".into()],
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
        "font-size:16px",
        "margin-md",
        "position:relative",
        "margin:1rem|1.5rem",
        "margin:var(--spacing-md)",
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
    assert!(result.suggestions.is_empty());
    assert_eq!(session.engine.css_text(), "");
}

#[test]
fn suggests_canonical_composition_groups_from_engine_facts() {
    let mut session = LintSession::create(DEFAULT_MANIFEST).unwrap();
    let cases = [
        (vec!["w-md", "h-md"], None::<&str>),
        (vec!["min-w-md", "min-h-md"], None::<&str>),
        (vec!["max-w-md", "max-h-md"], None::<&str>),
        (vec!["mt-md", "mb-md"], None::<&str>),
        (vec!["ml-md", "mr-md"], None::<&str>),
        (vec!["pt-md", "pb-md"], None::<&str>),
        (vec!["pl-md", "pr-md"], None::<&str>),
        (vec!["margin-top-md", "margin-bottom-md"], None::<&str>),
        (vec!["mt-md@dark@sm", "mb-md@dark@sm"], None::<&str>),
        (vec!["w-md", "h-lg"], None),
        (vec!["mt-md", "mb-md@sm"], None),
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
fn retired_aliases_are_not_autofixed_and_conflicts_follow_engine_order() {
    let mut session = LintSession::create(DEFAULT_MANIFEST).unwrap();
    let names = [
        "margin-md",
        "-margin-md",
        "margin:16px",
        "padding:1rem",
        "padding:16px",
        "font-size:16px",
    ]
    .map(str::to_owned);
    let support = vec![true; session.native_declaration_candidates(&names).unwrap().len()];
    let result = session
        .canonical_class_names(
            &names,
            Some(&support),
            &CanonicalClassNameOptions::default(),
        )
        .unwrap();
    assert!(result.suggestions.is_empty());
    for names in [["p-md", "padding:8px"], ["padding:8px", "p-md"]] {
        let support = vec![true; session.native_declaration_candidates(names).unwrap().len()];
        let result = session
            .analyze(names, Some(&support), &HashSet::new())
            .unwrap();
        assert_eq!(result.conflicts.len(), 1);
        assert_eq!(result.conflicts[0].class_name, "p-md");
        assert_eq!(result.conflicts[0].conflicts, ["padding:8px"]);
    }
}

#[test]
fn conflict_sorting_is_total_with_unknown_classes_and_ignores_html_order() {
    let classes = (0..80)
        .flat_map(|i| [format!("padding:{i}px"), format!("unknown-{i}")])
        .collect::<Vec<_>>();
    let mut session = LintSession::create(DEFAULT_MANIFEST).unwrap();
    for input in [classes.clone(), classes.into_iter().rev().collect()] {
        let result = session
            .analyze(input.iter().map(String::as_str), None, &HashSet::new())
            .unwrap();
        assert_eq!(result.conflicts.len(), 79);
        assert!(
            result
                .conflicts
                .iter()
                .all(|conflict| conflict.conflicts == ["padding:79px"])
        );
    }
}

#[test]
fn canonical_partial_fixes_preserve_static_cascade_positions() {
    let mut session = LintSession::create(DEFAULT_MANIFEST).unwrap();
    for classes in [["b-solid", "bt-dashed"], ["bt-dashed", "b-solid"]] {
        let result = session.analyze(classes, None, &HashSet::new()).unwrap();
        assert!(result.partial_conflicts.is_empty());
    }
}

#[test]
fn unknown_named_prefixes_follow_the_unknown_class_policy() {
    let mut session = LintSession::create(DEFAULT_MANIFEST).unwrap();
    for strict in [false, true] {
        let result = session
            .analyze_class_list(
                "bg-custom-card",
                &["bg-custom-card".into()],
                None,
                &HashSet::new(),
                LintClassListPolicy {
                    disallow_unknown_class: strict,
                    ..Default::default()
                },
            )
            .unwrap();
        let unknown = result
            .diagnostics
            .iter()
            .filter(|diagnostic| diagnostic.rule_id == "no-invalid-classes")
            .collect::<Vec<_>>();
        assert_eq!(unknown.len(), usize::from(strict));
        if strict {
            assert_eq!(unknown[0].code, "UNKNOWN_TOKEN");
        }
    }
}

#[test]
fn retired_alias_preference_is_rejected() {
    assert!(
        serde_json::from_str::<CanonicalClassNameOptions>(r#"{"preferPropertyAliases":false}"#)
            .is_err()
    );
}
