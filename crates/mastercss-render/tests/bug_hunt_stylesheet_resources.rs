use mastercss_render::RenderSession;

fn render(css: &str) -> String {
    let manifest = serde_json::json!({"version":4,"languageVersion":11,"variables":{"color":[{"key":"brand","values":[{"path":[":root,:host"],"value":"red"}]}]},"theme":[{"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"color-brand","value":"red"}]}]})
    .to_string();
    let mut session = RenderSession::create(&manifest, None).unwrap();
    session.ensure_stylesheet_resources(css).unwrap();
    session.snapshot().unwrap().snapshot.text
}

#[test]
fn native_keyframes_are_owned_entirely_by_the_stylesheet() {
    assert!(!render(".x{animation:fade 1s}").contains("@keyframes fade"));
    assert!(
        !render(".x{animation:fade 1s}@keyframes fade{to{opacity:.5}}").contains("@keyframes fade")
    );
    assert!(render(".x{color:var( --color-brand)}").contains("--color-brand:red"));
}

#[test]
fn bh_0001_commented_keyframes_must_not_suppress_used_animation() {
    let expected = render(".x{animation:fade 1s}");
    let actual = render("/* @keyframes fade {to{opacity:0}} */ .x{animation:fade 1s}");
    assert_eq!(
        actual, expected,
        "CSS comments cannot define host keyframes"
    );
}

#[test]
fn bh_0001_comment_animation_must_not_emit_unused_keyframes() {
    assert_eq!(render("/* animation:fade 1s; */"), "");
    assert_eq!(render(".x{content:'animation:fade 1s;'}"), "");
}

#[test]
fn bh_0002_css_whitespace_in_var_must_preserve_dependencies() {
    let expected = render(".x{color:var( --color-brand)}");
    for whitespace in ["\t", "\n", "\r\n", "\x0c", "/**/"] {
        let actual = render(&format!(".x{{color:var({whitespace}--color-brand)}}"));
        assert_eq!(actual, expected, "CSS whitespace {whitespace:?}");
    }
}
