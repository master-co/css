use mastercss_engine::EngineSession;
use mastercss_schema::{ErrorCode, LANGUAGE_VERSION, MatchStatus};
use serde_json::json;

fn engine() -> EngineSession {
    let declaration = |property: &str, value: &str| json!({"type":"declaration","property":property,"value":[{"type":"text","value":value}]});
    let manifest = json!({
        "version": 6,
        "languageVersion": LANGUAGE_VERSION,
        "customMedia": {"--sm": {"type":"feature","value":"(width>=52.125rem)"}},
        "mixins": [{"name":"--scope","body":[{"type":"rule","selector":".scope &","body":[{"type":"contents","fallback":[]}]}]}],
        "utilities": [
            {"kind":"static","name":"flex","body":[declaration("display", "flex")]},
            {"kind":"function","name":"cols","parameters":[{"name":"--n","syntax":"integer"}],"body":[{"type":"declaration","property":"grid-template-columns","value":[{"type":"text","value":"repeat("},{"type":"function","name":"var","value":[{"type":"text","value":"--n"}]},{"type":"text","value":",1fr)"}]}]}
        ]
    });
    EngineSession::create(&manifest.to_string()).unwrap()
}

fn rule(engine: &EngineSession, class: &str) -> String {
    let inspection = engine.inspect(class).unwrap();
    assert_eq!(
        inspection.match_status,
        MatchStatus::Matched,
        "{class}: {:?}",
        inspection.diagnostics
    );
    assert_eq!(inspection.rules.len(), 1, "{class}");
    inspection.rules[0].text.clone()
}

#[test]
fn heads_separate_names_declarations_and_suffixes_structurally() {
    let engine = engine();
    assert_eq!(
        rule(&engine, "flex:hover"),
        r".flex\:hover:hover{display:flex}"
    );
    assert_eq!(
        rule(&engine, "(flex:1|1|auto):hover"),
        r".\(flex\:1\|1\|auto\)\:hover:hover{flex:1 1 auto}"
    );
    for (class, selector, declarations) in [
        ("(display:block):hover", ":hover", "display:block"),
        (
            "(display:block)[aria-expanded=true]:hover",
            "[aria-expanded=true]:hover",
            "display:block",
        ),
        ("(color:red)::before", "::before", "color:red"),
        ("(color:red):has(>img)", ":has(>img)", "color:red"),
        ("(color:red):is(.a,.b)", ":is(.a,.b)", "color:red"),
        ("(color:red)_li", " li", "color:red"),
        ("(color:red)>li", ">li", "color:red"),
        ("(color:red)+li", "+li", "color:red"),
        ("(color:red):unknown-state", ":unknown-state", "color:red"),
        ("(unknown-property:1)", "", "unknown-property:1"),
        (
            "(grid-template-columns:[start]|1fr|[end])",
            "",
            "grid-template-columns:[start] 1fr [end]",
        ),
        ("(animation-name:slide_in)", "", "animation-name:slide_in"),
        ("(content:')')::before", "::before", "content:')'"),
        ("(content:'a|b')", "", "content:'a|b'"),
        ("(--payload:a:b@c_foo)", "", "--payload:a:b@c_foo"),
        ("(--x:{a;b})", "", "--x:{a;b}"),
        ("(--x:)", "", "--x:"),
        (
            "(background-image:url(/a{b.svg))",
            "",
            "background-image:url(/a{b.svg)",
        ),
        (
            "(width:calc(1px+(2px*3)))",
            "",
            "width:calc(1px + (2px * 3))",
        ),
        ("(color:red/*a)b*/)", "", "color:red/*a)b*/"),
        (r"(content:'\'')", "", r"content:'\''"),
    ] {
        let text = rule(&engine, class);
        assert!(
            text.ends_with(&format!("{selector}{{{declarations}}}")),
            "{class}: {text}"
        );
    }
}

#[test]
fn conditions_and_wrappers_follow_the_head_in_order() {
    let engine = engine();
    assert_eq!(
        rule(&engine, "(display:block)[aria-expanded=true]:hover@sm"),
        r"@media (width>=52.125rem){.\(display\:block\)\[aria-expanded\=true\]\:hover\@sm[aria-expanded=true]:hover{display:block}}"
    );
    assert_eq!(
        rule(&engine, "(background-image:url(/a{b.svg))@sm"),
        r"@media (width>=52.125rem){.\(background-image\:url\(\/a\{b\.svg\)\)\@sm{background-image:url(/a{b.svg)}}"
    );
    assert!(
        rule(&engine, "(color:red)@apply(--scope)@sm")
            .starts_with("@media (width>=52.125rem){.scope ")
    );
    assert!(
        rule(&engine, "(color:red)@layer(base)").contains("color:red"),
        "layer suffix"
    );
}

#[test]
fn importance_merges_native_and_class_suffixes_once() {
    let engine = engine();
    for class in [
        "(color:red)!",
        "(color:red!important)",
        "(color:red!important)!",
        "(color:red|!|IMPORTANT)",
        r"(color:red!/**/\69mportant)",
    ] {
        let text = rule(&engine, class);
        assert!(text.ends_with("{color:red!important}"), "{class}: {text}");
        let block = &text[text.rfind('{').unwrap()..];
        assert_eq!(block.matches("!important").count(), 1, "{class}");
    }
    for (class, value) in [
        ("(content:'!important')", "'!important'"),
        ("(--x:var(--y,!important))", "var(--y,!important)"),
    ] {
        assert!(
            rule(&engine, class).ends_with(&format!("{value}}}")),
            "{class}"
        );
    }
    assert!(rule(&engine, "(--x:!important)").ends_with("{--x:!important}"));
}

#[test]
fn malformed_heads_generate_nothing_and_never_become_another_head() {
    let engine = engine();
    for class in [
        "(display:block",
        "(display:block;)",
        "(display:block;color:red)",
        "(color:red)(display:block)",
        "(width:calc(1px])",
        "(content:'a)",
        "(width:)",
        "(width:!important)",
        "(color:{red})",
        "(flex)",
        "(:block)",
        "(background:url(a(b)))",
    ] {
        let inspection = engine.inspect(class).unwrap();
        assert!(inspection.rules.is_empty(), "{class}");
        assert!(!inspection.diagnostics.is_empty(), "{class}");
        assert_eq!(
            inspection.diagnostics[0].code,
            ErrorCode::ClassSyntaxError,
            "{class}"
        );
        assert!(
            engine
                .native_declaration_candidates([class])
                .unwrap()
                .is_empty()
        );
    }
    // Bare declarations are no longer a class form, even for listed properties.
    for class in [
        "display:block",
        "flex:1|1|auto",
        "--x:1",
        "width:10px:hover",
    ] {
        assert!(engine.inspect(class).unwrap().rules.is_empty(), "{class}");
    }
}

#[test]
fn functional_utilities_and_native_declarations_keep_their_heads() {
    let engine = engine();
    assert_eq!(
        rule(&engine, "cols(3):hover"),
        r".cols\(3\)\:hover:hover{grid-template-columns:repeat(3,1fr)}"
    );
    assert_eq!(
        rule(&engine, "(grid-template-columns:repeat(3,1fr))"),
        r".\(grid-template-columns\:repeat\(3\,1fr\)\){grid-template-columns:repeat(3,1fr)}"
    );
    let candidates = engine
        .native_declaration_candidates(["(flex:1|1|auto):hover", "cols(3)", "flex"])
        .unwrap();
    assert_eq!(candidates.len(), 1);
    assert_eq!(candidates[0].property, "flex");
    assert_eq!(candidates[0].value, "1 1 auto");
}

#[test]
fn utility_names_cannot_contain_descendant_markers() {
    let manifest = json!({"version":6,"languageVersion":LANGUAGE_VERSION,"utilities":[{"kind":"static","name":"a_b","body":[{"type":"declaration","property":"color","value":[{"type":"text","value":"red"}]}]}]});
    let error = EngineSession::create(&manifest.to_string()).unwrap_err();
    assert!(error.to_string().contains("cannot contain _"), "{error}");
}

#[test]
fn token_keys_with_descendant_markers_stay_variables_only() {
    let manifest = json!({
        "version":6,
        "languageVersion":LANGUAGE_VERSION,
        "variables":{"color":[{"key":"brand_ink","values":[{"path":[":root"],"value":"#123"}]},{"key":"ink","values":[{"path":[":root"],"value":"#456"}]}]},
        "utilities":[{"kind":"token","name":"fg","parameters":[{"name":"--color"}],"body":[{"type":"declaration","property":"color","value":[{"type":"function","name":"var","value":[{"type":"text","value":"--color"}]}]}]}]
    });
    let engine = EngineSession::create(&manifest.to_string()).unwrap();
    assert!(engine.inspect("fg-brand_ink").unwrap().rules.is_empty());
    assert!(!engine.inspect("fg-ink").unwrap().rules.is_empty());
    assert!(
        rule(&engine, "(color:var(--color-brand_ink))").contains("color:var(--color-brand_ink)")
    );
    let labels = engine
        .class_completion_candidates()
        .unwrap()
        .into_iter()
        .map(|candidate| candidate.label)
        .collect::<Vec<_>>();
    assert!(labels.iter().any(|label| label == "fg-ink"));
    assert!(!labels.iter().any(|label| label.contains("brand_ink")));
}
