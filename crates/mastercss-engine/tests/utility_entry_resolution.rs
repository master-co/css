use mastercss_engine::EngineSession;
use mastercss_schema::MatchStatus;
use serde_json::{Value, json};

fn definition(name: &str, property: &str, value: &str) -> Value {
    json!({"name":name,"body":[{"type":"declaration","property":property,"value":[{"type":"text","value":value}]}]})
}
fn engine(mixins: Vec<Value>, variables: Value) -> EngineSession {
    let theme = variables.as_object().unwrap().iter().flat_map(|(namespace, entries)| entries.as_array().unwrap().iter().flat_map(move |entry| entry["values"].as_array().unwrap().iter().map(move |value| json!({"type":"rule","prelude":value["path"][0],"children":[{"type":"declaration","name":format!("{namespace}-{}",entry["key"].as_str().unwrap()),"value":value["value"]}]})))).collect::<Vec<_>>();
    EngineSession::create(&json!({"version":4,"languageVersion":6,"mixins":mixins,"variables":variables,"theme":theme}).to_string()).unwrap()
}

#[test]
fn replacements_are_by_complete_mixin_name() {
    let mut session = engine(
        vec![
            definition("--size", "width", "20px"),
            definition("--box", "width", "30px"),
            definition("--size", "height", "20px"),
        ],
        json!({}),
    );
    session.ensure_class_rules(["size", "box"]).unwrap();
    let text = session.snapshot().unwrap().text;
    assert!(text.contains(".size{height:20px}"));
    assert!(text.contains(".box{width:30px}"));
    assert!(!text.contains("width:20px"));
}

#[test]
fn empty_replacement_clears_old_rules_and_resources() {
    let mut session = engine(
        vec![
            definition("--card", "color", "var(--color-old)"),
            definition("--panel", "color", "var(--color-old)"),
            json!({"name":"--card","body":[]}),
        ],
        json!({"color":[{"key":"old","values":[{"path":[":root,:host"],"value":"blue"}]}]}),
    );
    assert_eq!(
        session.inspect("card").unwrap().match_status,
        MatchStatus::Matched
    );
    session.ensure_class_rules(["card"]).unwrap();
    assert!(session.snapshot().unwrap().text.is_empty());
    session.ensure_class_rules(["panel"]).unwrap();
    assert!(
        session
            .snapshot()
            .unwrap()
            .text
            .contains("--color-old:blue")
    );
    session.delete_class_rules(["panel"]).unwrap();
    assert!(session.snapshot().unwrap().text.is_empty());
}

#[test]
fn font_ambiguity_depends_on_token_existence_instead_of_values() {
    for value in ["1rem", "sans-serif"] {
        let session = engine(
            vec![],
            json!({"font-size":[{"key":"brand","values":[{"path":[":root"],"value":"1rem"}]}],"font-family":[{"key":"brand","values":[{"path":[".dark"],"value":value}]}]}),
        );
        let result = session.inspect("font-brand").unwrap();
        assert_eq!(result.match_status, MatchStatus::Ambiguous);
        assert!(result.rules.is_empty());
        for name in ["font-size-brand", "font-family-brand"] {
            assert_eq!(
                session.inspect(name).unwrap().match_status,
                MatchStatus::Matched
            );
        }
    }
}

#[test]
fn static_mixin_names_do_not_override_native_properties() {
    let session = engine(vec![definition("--display", "color", "red")], json!({}));
    assert_eq!(
        session.inspect("display:block").unwrap().rules[0].text,
        ".display\\:block{display:block}"
    );
    assert!(
        session.inspect("display").unwrap().rules[0]
            .text
            .contains("color:red")
    );
}
