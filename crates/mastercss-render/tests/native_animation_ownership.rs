use mastercss_render::RenderSession;
use serde_json::json;

#[test]
fn native_animation_values_never_register_or_synthesize_keyframes() {
    let manifest = json!({"version":4,"languageVersion":9}).to_string();
    for css in [
        ".x{animation:fade 1s}",
        ".x{animation-name:\"fade\"}",
        r".x{animation-name:f\61 de}",
        ".x{ANIMATION:fade 1s}",
        ".x{animation:linear 1s linear, running 2s running}",
        ".x{animation:var(--name,fade) 1s}",
        "@keyframes fade{to{opacity:1}}.x{animation:fade 1s}",
        "/* @keyframes fade{} */.x{content:'animation:fade 1s'}",
    ] {
        let mut session = RenderSession::create(&manifest, None).unwrap();
        session.ensure_stylesheet_resources(css).unwrap();
        let rendered = session.snapshot().unwrap();
        assert!(rendered.snapshot.text.is_empty(), "{css}");
        assert!(rendered.hydration_manifest.rules.is_empty());
        assert!(
            serde_json::to_value(session.emitted_globals().unwrap())
                .unwrap()
                .get("animations")
                .is_none()
        );
    }
}
#[test]
fn animation_classes_hydrate_with_managed_keyframe_metadata() {
    let manifest = include_str!("../../../packages/preset/src/default-manifest.json");
    let mut session = RenderSession::create(manifest, None).unwrap();
    session
        .ensure_classes(["animation:fade|1s", "animation-name:rotate"])
        .unwrap();
    let rendered = session.snapshot().unwrap();
    assert!(rendered.snapshot.text.contains("animation:fade 1s"));
    assert!(rendered.snapshot.text.contains("@keyframes fade"));
    assert!(rendered.snapshot.text.contains("@keyframes rotate"));
    let hydration = serde_json::to_value(rendered.hydration_manifest).unwrap();
    assert_eq!(hydration["version"], 3);
    assert!(
        hydration["rules"]
            .as_array()
            .unwrap()
            .iter()
            .all(|rule| rule.get("animationNames").is_none())
    );
    assert_eq!(
        hydration["resourceOrder"]["keyframes"],
        json!(["fade", "rotate"])
    );
    assert!(RenderSession::create(manifest, Some(r#"{"animations":{"fade":1}}"#)).is_err());
}
