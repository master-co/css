use mastercss_render::RenderSession;

fn expects_manifest_animation(css: &str, expected: bool) {
    let manifest = serde_json::json!({
        "version": 1,
        "animations": {"fade": {"to": {"opacity": "1"}}},
        "utilities": []
    })
    .to_string();
    let mut session = RenderSession::create(&manifest, None).unwrap();
    session.ensure_stylesheet_resources(css).unwrap();
    let output = session.snapshot().unwrap().snapshot.text;
    assert_eq!(
        output.contains("@keyframes fade"),
        expected,
        "{css}: {output}"
    );
}

macro_rules! animation_case {
    ($name:ident, $css:expr, $expected:expr) => {
        #[test]
        fn $name() {
            expects_manifest_animation($css, $expected);
        }
    };
}

animation_case!(plain_use, ".x{animation:fade 1s}", true);
animation_case!(
    native_definition,
    "@keyframes fade{to{opacity:0}}.x{animation:fade 1s}",
    false
);
animation_case!(
    nested_definition,
    "@media all{@keyframes fade{to{opacity:0}}}.x{animation:fade 1s}",
    false
);
animation_case!(
    quoted_fake_definition,
    r#".x{content:"@keyframes fade";animation:fade 1s}"#,
    true
);
animation_case!(
    commented_fake_definition,
    "/* @keyframes fade{} */.x{animation:fade 1s}",
    true
);
animation_case!(
    commented_fake_use,
    "/* animation:fade 1s; */.x{display:block}",
    false
);
animation_case!(
    quoted_fake_use,
    r#".x{content:"animation:fade 1s;"}"#,
    false
);
animation_case!(
    url_fake_use,
    r#".x{background:url("data:text/plain,animation:fade 1s;")}"#,
    false
);
animation_case!(
    supports_is_not_use,
    "@supports (animation:fade 1s){.x{display:block}}",
    false
);
animation_case!(custom_property_is_not_use, ".x{--animation:fade 1s}", false);
animation_case!(
    custom_block_is_not_use,
    ".x{--recipe:{animation:fade 1s};}",
    false
);
animation_case!(
    uppercase_definition,
    "@KEYFRAMES fade{to{opacity:0}}.x{animation:fade 1s}",
    false
);
animation_case!(
    comment_separates_definition,
    "@keyframes/**/fade{to{opacity:0}}.x{animation:fade 1s}",
    false
);
animation_case!(
    quoted_definition,
    r#"@keyframes "fade"{to{opacity:0}}.x{animation:fade 1s}"#,
    false
);
animation_case!(
    escaped_definition,
    r"@keyframes f\61 de{to{opacity:0}}.x{animation:fade 1s}",
    false
);
animation_case!(
    missing_definition_block,
    "@keyframes fade;.x{animation:fade 1s}",
    true
);
animation_case!(uppercase_property, ".x{ANIMATION:fade 1s}", true);
animation_case!(comment_before_colon, ".x{animation/**/:fade 1s}", true);
animation_case!(comment_after_name, ".x{animation:fade/**/ 1s}", true);
animation_case!(quoted_animation_name, r#".x{animation-name:"fade"}"#, true);
animation_case!(escaped_animation_name, r".x{animation-name:f\61 de}", true);
animation_case!(
    important_animation_name,
    ".x{animation-name:fade!important}",
    true
);
