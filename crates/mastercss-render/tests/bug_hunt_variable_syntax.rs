use mastercss_render::RenderSession;
use serde_json::{Value, json};

#[test]
fn raw_stylesheet_variables_follow_css_tokens_and_keep_nested_fallbacks() {
    let cases: Vec<Value> =
        serde_json::from_str(include_str!("bug_hunt_variable_syntax.json")).unwrap();
    let manifest = json!({"version":6,"languageVersion":16,"variables":{"color":[{"key":"brand","values":[{"path":[":root,:host"],"value":"red"}]},{"key":"accent","values":[{"path":[":root,:host"],"value":"blue"}]},{"key":"品牌","values":[{"path":[":root,:host"],"value":"red"}]}],"animation":[{"key":"entrance","values":[{"path":[":root,:host"],"value":"fade 1s"}]}]},"theme":[{"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"color-brand","value":"red"}]},{"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"color-accent","value":"blue"}]},{"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"color-品牌","value":"red"}]},{"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"animation-entrance","value":"fade 1s"}]}]})
    .to_string();
    let mut failures = Vec::new();
    for case in cases {
        let mut session = RenderSession::create(&manifest, None).unwrap();
        session
            .ensure_stylesheet_resources(case["css"].as_str().unwrap())
            .unwrap();
        let globals = session.emitted_globals().unwrap();
        let mut names = globals.variables.keys().cloned().collect::<Vec<_>>();
        names.sort_unstable();
        let output = session.snapshot().unwrap().snapshot.text;
        if json!(names) != case["variables"] || output.contains("@keyframes") {
            failures.push(format!(
                "{}: variables={names:?}, output={output}",
                case["id"]
            ));
        }
    }
    assert!(failures.is_empty(), "{}", failures.join("\n"));
}
