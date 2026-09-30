use mastercss_engine::EngineSession;
use serde_json::{Value, json};

fn manifest(cycle: bool) -> String {
    let root = ":root,:host";
    let mut variables = vec![
        json!({"key":"a","values":[{"path":[root],"value":"var(--color-b)"}],"dependencies":["color-b"]}),
        json!({"key":"b","values":[{"path":[root],"value":if cycle {"var(--color-a)"} else {"red"}}],"dependencies":if cycle {vec!["color-a"]} else {vec![]}}),
    ];
    variables[0]["values"]
        .as_array_mut()
        .unwrap()
        .push(json!({"path":[".dark"],"value":"var(--color-c)"}));
    variables[0]["dependencies"]
        .as_array_mut()
        .unwrap()
        .push(json!("color-c"));
    variables.push(json!({"key":"c","values":[{"path":[root],"value":"blue"}],"dependencies":[]}));
    let theme = variables.iter().flat_map(|variable| variable["values"].as_array().unwrap().iter().map(|value| json!({"type":"rule","prelude":value["path"][0],"children":[{"type":"declaration","name":format!("color-{}",variable["key"].as_str().unwrap()),"value":value["value"]}]}))).collect::<Vec<_>>();
    json!({"version":4,"languageVersion":11,"variables":{"color":variables},"theme":theme,"mixins":[]}).to_string()
}
fn counts(engine: &EngineSession) -> Vec<(String, u32)> {
    let mut values = engine
        .snapshot()
        .unwrap()
        .resources
        .variables
        .into_iter()
        .map(|v| (v.name, v.ref_count))
        .collect::<Vec<_>>();
    values.sort();
    values
}

#[test]
fn each_live_token_keeps_all_scopes_and_transitive_dependencies() {
    for cycle in [false, true] {
        let mut engine = EngineSession::create(&manifest(cycle)).unwrap();
        assert!(engine.css_text().is_empty());
        for _ in 0..3 {
            engine.ensure_class_rules(["fg-a"]).unwrap();
            assert_eq!(
                counts(&engine),
                [
                    ("color-a".into(), 1),
                    ("color-b".into(), 1),
                    ("color-c".into(), 1)
                ]
            );
            assert!(
                engine
                    .css_text()
                    .contains(".dark{--color-a:var(--color-c)}")
            );
            assert!(engine.css_text().contains("--color-c:blue"));
            engine.delete_class_rules(["fg-a"]).unwrap();
            assert!(counts(&engine).is_empty());
            assert!(engine.css_text().is_empty());
        }
    }
}
#[test]
fn independently_used_dependencies_are_released_only_after_the_last_owner() {
    let mut engine = EngineSession::create(&manifest(false)).unwrap();
    engine.ensure_class_rules(["fg-a", "bg-b"]).unwrap();
    assert_eq!(counts(&engine)[1], ("color-b".into(), 2));
    engine.delete_class_rules(["fg-a"]).unwrap();
    assert_eq!(counts(&engine), [("color-b".into(), 1)]);
    engine.delete_class_rules(["bg-b"]).unwrap();
    assert!(engine.css_text().is_empty());
}
#[test]
fn refresh_replaces_authored_scopes_while_preserving_live_class_names() {
    let source = manifest(false);
    let mut engine = EngineSession::create(&source).unwrap();
    engine.ensure_class_rules(["fg-a"]).unwrap();
    engine
        .refresh(
            &source
                .replace("blue", "green")
                .replace(".dark", "[data-theme=night]"),
        )
        .unwrap();
    assert!(engine.css_text().contains("[data-theme=night]{--color-a"));
    assert!(engine.css_text().contains("--color-c:green"));
    assert!(!engine.css_text().contains("blue"));
    engine.delete_class_rules(["fg-a"]).unwrap();
    assert!(engine.css_text().is_empty());
}
#[test]
fn removed_static_inline_and_mode_metadata_is_rejected_atomically() {
    let source = manifest(false);
    let mut engine = EngineSession::create(&source).unwrap();
    engine.ensure_class_rules(["fg-a"]).unwrap();
    let before = engine.snapshot().unwrap();
    for field in ["static", "inline", "mode", "modes", "value"] {
        let mut changed: Value = serde_json::from_str(&source).unwrap();
        changed["variables"]["color"][0][field] = json!(true);
        assert!(engine.refresh(&changed.to_string()).is_err(), "{field}");
        assert_eq!(engine.snapshot().unwrap(), before);
    }
}

#[test]
fn direct_manifest_values_are_opaque_and_dependencies_are_explicit() {
    for value in [
        "hsl(120 50% 40%)",
        "color-mix(in srgb, var(--color-b) 50%, transparent)",
        "--alpha(var(--color-b) / 50%)",
        "var(--missing)",
    ] {
        let mut input: Value = serde_json::from_str(&manifest(false)).unwrap();
        input["variables"]["color"][0]["values"] = json!([{"path":[":root,:host"],"value":value}]);
        input["variables"]["color"][0]["dependencies"] = json!([]);
        input["theme"] = json!([{"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"color-a","value":value}]}]);
        let mut engine = EngineSession::create(&input.to_string()).unwrap();
        engine.ensure_class_rules(["fg-a"]).unwrap();
        assert!(engine.css_text().contains(&format!("--color-a:{value}")));
        assert_eq!(counts(&engine), [("color-a".into(), 1)]);
        assert!(!engine.css_text().contains("--color-b:"));
    }
}

#[test]
fn native_light_dark_keeps_both_branches_until_the_last_consumer_is_removed() {
    let source = include_str!("../../../packages/preset/src/default-manifest.json");
    let mut engine = EngineSession::create(source).unwrap();
    engine
        .ensure_class_rules(["bg-surface-base", "fg-text-body"])
        .unwrap();
    let css = engine.css_text();
    assert!(css.contains("light-dark(var(--color-neutral-0), var(--color-gray-95))"));
    for name in [
        "color-neutral-0",
        "color-gray-95",
        "color-neutral-70",
        "color-gray-30",
    ] {
        assert!(css.contains(&format!("--{name}:")), "{name}");
    }
    engine.delete_class_rules(["bg-surface-base"]).unwrap();
    assert!(!engine.css_text().contains("--color-gray-95:"));
    assert!(engine.css_text().contains("--color-gray-30:"));
    engine.delete_class_rules(["fg-text-body"]).unwrap();
    assert!(engine.css_text().is_empty());
}
