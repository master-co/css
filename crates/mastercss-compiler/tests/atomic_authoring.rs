use mastercss_compiler::{
    CompileManifestOptions, CompileNativeCssOptions, compile_css_directives, compile_manifest_input,
};
use mastercss_engine::EngineSession;
use mastercss_schema::MatchStatus;

fn engine() -> EngineSession {
    let source = format!(
        "{}\n{}",
        include_str!("../../../packages/preset/src/theme.css"),
        include_str!("../../../packages/preset/src/utilities.css")
    );
    let directives = compile_css_directives(&source, &CompileNativeCssOptions::default()).unwrap();
    let manifest = compile_manifest_input(
        &directives.manifest_input,
        &CompileManifestOptions::default(),
    )
    .unwrap()
    .manifest;
    EngineSession::create(&manifest.to_string()).unwrap()
}

#[test]
fn declarations_use_one_priority_without_shorthand_interpretation() {
    let engine = engine();
    for class in [
        "margin:1px|1px",
        "border:1px|solid|red",
        "padding-top:2px",
        "p-sm",
        "border-width:1px",
        "animation:fade|1s",
        "--custom:a|b",
    ] {
        let inspection = engine.inspect(class).unwrap();
        assert_eq!(inspection.match_status, MatchStatus::Matched, "{class}");
        assert!(
            inspection.rules.iter().all(|rule| rule.utility_type == 0),
            "{class}"
        );
    }
    assert!(
        engine.inspect("margin:1px|1px").unwrap().rules[0]
            .text
            .contains("margin:1px 1px")
    );
    let disabled = engine.inspect("animation:none@media(print)").unwrap();
    assert_eq!(disabled.match_status, MatchStatus::Matched);
    let rule = &disabled.rules[0];
    assert!(rule.text.contains("@media print"), "{}", rule.text);
    assert!(rule.text.contains("animation:none"), "{}", rule.text);
    assert!(!rule.text.contains("animation-name:"));
    assert!(!rule.text.contains("animation-duration:"));
    for class in [
        "b-1",
        "b-solid",
        "border-red",
        "animation-fast",
        "transition-smooth",
    ] {
        assert_ne!(
            engine.inspect(class).unwrap().match_status,
            MatchStatus::Matched,
            "{class}"
        );
    }
    let conditional = engine
        .inspect("border-width:calc(1px+1px):hover@media((width>=40rem))!")
        .unwrap();
    assert_eq!(conditional.match_status, MatchStatus::Matched);
    assert!(
        conditional
            .rules
            .iter()
            .all(|rule| rule.text.contains("!important"))
    );
}

#[test]
fn all_animation_tokens_emit_shorthand_and_retain_only_referenced_keyframes() {
    for name in [
        "fade", "flash", "float", "heart", "jump", "ping", "pulse", "rotate", "shake", "zoom",
    ] {
        let mut engine = engine();
        let class = format!("animate-{name}");
        let inspected = engine.inspect(&class).unwrap();
        assert_eq!(inspected.match_status, MatchStatus::Matched, "{name}");
        let rule = &inspected.rules[0];
        assert_eq!(rule.utility_type, 0);
        assert!(
            rule.text
                .contains(&format!("animation:var(--animate-{name})"))
        );
        assert_eq!(
            rule.text,
            format!(".animate-{name}{{animation:var(--animate-{name})}}")
        );
        assert!(!rule.text.contains("animation-duration:"));
        engine.ensure_class_rules([class.as_str()]).unwrap();
        let css = engine.css_text();
        assert!(css.contains(&format!("@keyframes {name}")), "{name}: {css}");
        assert_eq!(css.matches("@keyframes ").count(), 1, "{name}");
        engine.delete_class_rules([class.as_str()]).unwrap();
        assert!(!engine.css_text().contains("@keyframes"));
    }
}

#[test]
fn atomic_overrides_follow_general_value_source_order() {
    let mut left = engine();
    let mut right = engine();
    left.ensure_class_rules([
        "pt-sm",
        "padding:8px",
        "animate-float",
        "animation-duration:2s",
    ])
    .unwrap();
    right
        .ensure_class_rules([
            "animation-duration:2s",
            "animate-float",
            "padding:8px",
            "pt-sm",
        ])
        .unwrap();
    assert_eq!(left.css_text(), right.css_text());
    let css = left.css_text();
    assert!(css.find("padding-top:var(").unwrap() < css.find("padding:8px").unwrap());
    assert!(css.find("animation:var(").unwrap() < css.find("animation-duration:2s").unwrap());
}

#[test]
fn animation_token_and_longhand_order_does_not_depend_on_class_order() {
    let classes = [
        "animate-fade",
        "animation-duration-fast",
        "animation-duration:var(--duration-slow)",
        "animation-iteration-count:1",
    ];
    let mut left = engine();
    let mut right = engine();
    left.ensure_class_rules(classes).unwrap();
    right.ensure_class_rules(classes.into_iter().rev()).unwrap();
    let css = left.css_text();
    assert_eq!(css, right.css_text());
    let shorthand = css.find("animation:var(--animate-fade)").unwrap();
    assert!(css.find("animation-duration:var(--duration-fast)").unwrap() < shorthand);
    assert!(shorthand < css.find("animation-duration:var(--duration-slow)").unwrap());
    for class in ["animation-fade", "animate:fade"] {
        assert_ne!(
            left.inspect(class).unwrap().match_status,
            MatchStatus::Matched
        );
    }
}
