use mastercss_engine::{EngineSession, effective_utilities};
use mastercss_schema::MatchStatus;
use serde_json::{Value, json};

fn engine(utilities: Value, variables: Value) -> EngineSession {
    EngineSession::create(
        &json!({"version":1,"languageVersion":3,"utilities":utilities,"variables":variables})
            .to_string(),
    )
    .unwrap()
}
fn raw(id: &str, keys: &[&str], property: &str) -> Value {
    json!({"id":id,"type":-1,"emit":{"type":"property","property":property},"matchers":[{"type":"key","keys":keys}]})
}
fn token(id: &str, namespace: &str, layer: &str, property: &str) -> Value {
    json!({"id":id,"type":0,"layer":layer,"variableAliasRefs":[namespace],"emit":{"type":"property","property":property},"matchers":[{"type":"token","prefix":"paint-"}]})
}

#[test]
fn raw_alias_replacement_preserves_only_unmodified_entries() {
    let definitions = vec![
        raw("old", &["size", "box"], "width"),
        raw("new", &["size"], "height"),
    ];
    let normalized = effective_utilities(&definitions);
    assert_eq!(effective_utilities(&normalized), normalized);
    let mut session = engine(json!(definitions), json!({}));
    session
        .ensure_class_rules(["size:20px", "box:30px"])
        .unwrap();
    let text = session.snapshot().unwrap().text;
    assert!(text.contains(".size\\:20px{height:20px}"), "{text}");
    assert!(text.contains(".box\\:30px{width:30px}"), "{text}");
    assert!(!text.contains("width:20px"));
}

#[test]
fn static_alias_replacement_removes_nested_rules_and_resources() {
    let old = json!({"id":"old","type":-2,"matchers":[{"type":"static","name":"card"},{"type":"static","name":"panel"}],"emit":{"type":"static","rules":[{"declarations":{"color":"var(--color-old)"}},{"selector":"&:hover","declarations":{"color":"red"}}]}});
    let new = json!({"id":"new","type":-2,"matchers":[{"type":"static","name":"card"}],"emit":{"type":"static","rules":[]}});
    let mut session = engine(
        json!([old, new]),
        json!({"color":[{"key":"old","value":"blue"}]}),
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
fn token_ambiguity_is_independent_of_inline_values_and_layers() {
    for value in ["red", "blue"] {
        for layer in ["utilities", "components"] {
            let session = engine(
                json!([
                    token("a", "~a", "utilities", "color"),
                    token("b", "~b", layer, "color")
                ]),
                json!({"a":[{"key":"brand","value":"red","inline":true}],"b":[{"key":"brand","value":value,"inline":true}]}),
            );
            let result = session.inspect("paint-brand").unwrap();
            assert_eq!(result.match_status, MatchStatus::Ambiguous);
            assert!(result.rules.is_empty());
            assert!(result.diagnostics[0].message.contains("a [~a], b [~b]"));
            assert!(result.diagnostics[0].notes.is_empty());
        }
    }
}

#[test]
fn same_token_family_retains_each_layer_and_namespace_order() {
    let mut session = engine(
        json!([
            token("a", "~color", "components", "color"),
            token("b", "~color", "utilities", "background-color")
        ]),
        json!({"color":[{"key":"brand","value":"red"}]}),
    );
    let result = session.inspect("paint-brand").unwrap();
    assert_eq!(result.match_status, MatchStatus::Matched);
    assert_eq!(result.rules.len(), 2);
    session.ensure_class_rules(["paint-brand"]).unwrap();
    let text = session.snapshot().unwrap().text;
    assert!(text.contains("@layer components{"), "{text}");
    assert!(text.contains("@layer utilities{"), "{text}");
    assert!(text.contains("background-color:var(--color-brand)"));
}
