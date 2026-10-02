use mastercss_engine::{ClassSemanticKind, EngineSession};
use mastercss_schema::{CssSyntaxStatus, ErrorCode, MatchStatus};

const MANIFEST: &str = r#"{"version":6,"languageVersion":15,"mixins":[{"name":"--block","body":[{"type":"declaration","property":"display","value":[{"type":"text","value":"block"}]}]},{"name":"--wrap","body":[{"type":"declaration","property":"order","value":[{"type":"text","value":"1"}]},{"type":"contents","fallback":[]}]}],"utilities":[{"kind":"static","name":"block","body":[{"type":"declaration","property":"display","value":[{"type":"text","value":"block"}]}]},{"kind":"static","name":"wrap","body":[{"type":"declaration","property":"order","value":[{"type":"text","value":"1"}]},{"type":"contents","fallback":[]}]}]}"#;

#[test]
fn removed_classes_have_no_execution_or_tooling_results() {
    let mut engine = EngineSession::create(MANIFEST).unwrap();
    for class in [
        "block:of(.active)",
        "display:block:of(.active>)",
        "display:block:of(.active+)",
        "display:block:of(.active~)",
        "display:block:is(:of(.active))",
        "display:block:of(.啟用😀)!",
        "display:block:OF(.active)",
        r"display:block:o\66(.active)",
        "block:of(.active):hover@media(print)!",
        "block:is(:of(.active))@unknown!",
        "block:of(.active)@apply(--wrap)",
        "display:block:of(.active)@apply(--wrap)",
        "{block}",
        "{block}!",
        "{display:block;color:red}",
        "{{block};color:red}",
        "{display:block",
        "{display:block;}",
        "{block}>li:hover@media(print)!",
        "{color:red;display:block}@apply(--wrap)",
        "{block}@apply(--wrap)!",
    ] {
        let result = engine.inspect(class).unwrap();
        assert_eq!(
            result.match_status,
            MatchStatus::SyntaxError,
            "{class}: {result:?}"
        );
        assert_eq!(
            result.css_syntax_status,
            CssSyntaxStatus::Invalid,
            "{class}"
        );
        assert!(result.rules.is_empty(), "{class}");
        let diagnostic = result
            .diagnostics
            .iter()
            .find(|diagnostic| diagnostic.code == ErrorCode::ClassSyntaxError)
            .expect("ordinary invalid-class diagnostic");
        assert_eq!(
            diagnostic
                .range
                .as_ref()
                .map(|range| (range.start, range.end)),
            Some((0, class.encode_utf16().count() as u32)),
            "{class}"
        );
        assert!(
            engine.composition_rules(class).unwrap().is_empty(),
            "{class}"
        );
        assert!(
            engine.matched_utility_names(class).unwrap().is_empty(),
            "{class}"
        );
        assert!(
            engine
                .native_declaration_candidates([class])
                .unwrap()
                .is_empty(),
            "{class}"
        );
        assert_eq!(
            engine.inspect_class_semantics(class).unwrap().kind,
            ClassSemanticKind::Unknown
        );
        engine.ensure_class_rules([class]).unwrap();
        assert!(engine.css_text().is_empty(), "{class}");
        engine.delete_class_rules([class]).unwrap();
    }
}

#[test]
fn preserves_literal_content_and_native_selectors() {
    let engine = EngineSession::create(MANIFEST).unwrap();
    for class in [
        "content:':of(.active)'",
        "content:'{display:block;color:red}'",
        "display:block[data-label=':of(.active)']",
        r"display:block[data-label=\:of\(x\)]",
        "display:block:nth-child(2n|of|.active)",
        "display:block:has(>.active)",
        "display:block:is(:hover,:focus)",
        "display:block:future-native(1)",
        "background:url('data:image/svg+xml;{x}:of(y)')",
        "--example:of(1)",
        "block@apply(--wrap)!",
    ] {
        let result = engine.inspect(class).unwrap();
        assert_eq!(
            result.match_status,
            MatchStatus::Matched,
            "{class}: {result:?}"
        );
        assert!(!result.rules.is_empty(), "{class}");
    }
}

#[test]
fn invalid_classes_do_not_retain_managed_resources() {
    let mut engine = EngineSession::create(include_str!(
        "../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    engine
        .ensure_class_rules([
            "{p-md;animation:float|1s}",
            "p-md:of(.active)",
            "animation:float|1s:of(.active)",
        ])
        .unwrap();
    let snapshot = engine.snapshot().unwrap();
    assert!(snapshot.text.is_empty());
    assert!(snapshot.resources.variables.is_empty());
    assert!(snapshot.resources.keyframes.is_empty());
}
