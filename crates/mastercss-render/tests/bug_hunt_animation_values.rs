use mastercss_render::RenderSession;

fn names(css: &str) -> Vec<String> {
    let manifest = serde_json::json!({
        "version": 1,"languageVersion":3,
        "animations": {
            "fade": {"to": {"opacity": "1"}},
            "linear": {"to": {"opacity": "1"}},
            "running": {"to": {"opacity": "1"}}
        },
        "variables": {"animation": [{"key": "entrance", "value": "fade 1s"}]},
        "utilities": []
    })
    .to_string();
    let mut session = RenderSession::create(&manifest, None).unwrap();
    session.ensure_stylesheet_resources(css).unwrap();
    let output = session.snapshot().unwrap().snapshot.text;
    ["fade", "linear", "running"]
        .into_iter()
        .filter(|name| output.contains(&format!("@keyframes {name}")))
        .map(str::to_owned)
        .collect()
}

#[test]
fn timing_and_play_state_slots_take_priority_over_animation_names() {
    assert!(names(".x{animation:linear 1s}").is_empty());
    assert!(names(".x{animation:running 1s}").is_empty());
    assert_eq!(names(".x{animation:linear linear 1s}"), ["linear"]);
    assert_eq!(names(".x{animation:running running 1s}"), ["running"]);
    assert_eq!(
        names(".x{animation-name:linear,running}"),
        ["linear", "running"]
    );
    assert_eq!(names(".x{animation:fade 1s steps(2,end)}"), ["fade"]);
}

#[test]
fn variables_are_followed_only_from_animation_values_and_include_fallbacks() {
    assert_eq!(names(".x{animation:var(--animation-entrance)}"), ["fade"]);
    assert_eq!(names(".x{animation:var(--missing,fade 1s)}"), ["fade"]);
    assert_eq!(
        names(".x{animation:var(--missing,var(--other,fade 1s))}"),
        ["fade"]
    );
    assert!(names(".x{color:var(--animation-entrance)}").is_empty());
}

#[test]
fn nested_selectors_and_descriptor_blocks_do_not_create_fake_declarations() {
    assert!(names("@font-face{animation:fade 1s}").is_empty());
    assert!(names(".host{animation:hover{color:red}}").is_empty());
    assert_eq!(names(".host{@media all{animation:fade 1s}}"), ["fade"]);
    assert_eq!(names(".host{&:hover{animation:fade 1s}}"), ["fade"]);
}
