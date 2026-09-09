use mastercss_engine::EngineSession;
use serde_json::{Value, json};

fn manifest(variables: Value) -> String {
    json!({"version":1,"utilities":[],"variables":{"color":variables}}).to_string()
}

fn names(engine: &EngineSession) -> Vec<String> {
    let mut names = engine
        .snapshot()
        .unwrap()
        .resources
        .variables
        .iter()
        .map(|resource| resource.name.clone())
        .collect::<Vec<_>>();
    names.sort();
    names
}

fn graph() -> String {
    manifest(json!([
        {"key":"brand","value":"var(--color-mid)","static":true,"dependencies":["color-mid"]},
        {"key":"mid","value":"var(--color-base)","dependencies":["color-base"]},
        {"key":"base","value":"red"}
    ]))
}

#[test]
fn static_chain_counts_survive_repeated_class_lifetimes() {
    let mut engine = EngineSession::create(&graph()).unwrap();
    let expected = vec!["color-base", "color-brand", "color-mid"];
    assert_eq!(names(&engine), expected);
    for _ in 0..3 {
        engine.ensure_class_rules(["fg:brand", "bg:mid"]).unwrap();
        engine.delete_class_rules(["fg:brand", "bg:mid"]).unwrap();
        assert_eq!(names(&engine), expected);
        assert!(
            engine
                .snapshot()
                .unwrap()
                .resources
                .variables
                .iter()
                .all(|v| v.ref_count == 1)
        );
    }
}

#[test]
fn static_roots_share_one_declaration_and_independent_baselines() {
    let source = manifest(json!([
        {"key":"a","value":"var(--color-base)","static":true,"dependencies":["color-base"]},
        {"key":"b","value":"var(--color-base)","static":true,"dependencies":["color-base"]},
        {"key":"base","value":"red"}
    ]));
    let mut engine = EngineSession::create(&source).unwrap();
    assert_eq!(
        engine
            .snapshot()
            .unwrap()
            .text
            .matches("--color-base:red")
            .count(),
        1
    );
    engine.ensure_class_rules(["fg:a", "bg:b"]).unwrap();
    engine.delete_class_rules(["fg:a", "bg:b"]).unwrap();
    assert_eq!(
        engine
            .snapshot()
            .unwrap()
            .resources
            .variables
            .iter()
            .find(|v| v.name == "color-base")
            .unwrap()
            .ref_count,
        2
    );
}

#[test]
fn cyclic_dependency_graph_is_retained_once_per_static_root() {
    let source = manifest(json!([
        {"key":"a","value":"var(--color-b)","static":true,"dependencies":["color-b"]},
        {"key":"b","value":"var(--color-a)","dependencies":["color-a"]}
    ]));
    let mut engine = EngineSession::create(&source).unwrap();
    engine.ensure_class_rules(["fg:a"]).unwrap();
    engine.delete_class_rules(["fg:a"]).unwrap();
    assert_eq!(names(&engine), ["color-a", "color-b"]);
    assert!(
        engine
            .snapshot()
            .unwrap()
            .resources
            .variables
            .iter()
            .all(|v| v.ref_count == 1)
    );
}

#[test]
fn inline_intermediate_is_not_emitted_but_its_dependencies_are_retained() {
    let source = manifest(json!([
        {"key":"brand","value":"var(--color-alias)","static":true,"dependencies":["color-alias"]},
        {"key":"alias","value":"var(--color-base)","inline":true,"dependencies":["color-base"]},
        {"key":"base","value":"red"}
    ]));
    let mut engine = EngineSession::create(&source).unwrap();
    assert_eq!(names(&engine), ["color-base", "color-brand"]);
    assert!(
        engine
            .snapshot()
            .unwrap()
            .text
            .contains("--color-brand:var(--color-base)")
    );
    engine.ensure_class_rules(["fg:brand"]).unwrap();
    engine.delete_class_rules(["fg:brand"]).unwrap();
    assert_eq!(names(&engine), ["color-base", "color-brand"]);
}

#[test]
fn mode_only_static_root_keeps_dependencies_from_all_modes() {
    let source = manifest(json!([
        {"key":"brand","static":true,"modes":{"light":{"value":"var(--color-base)"},"dark":{"value":"var(--color-dark)"}},"dependencies":["color-base","color-dark"]},
        {"key":"base","value":"red"}, {"key":"dark","value":"blue"}
    ]));
    let engine = EngineSession::create(&source).unwrap();
    assert_eq!(names(&engine), ["color-base", "color-brand", "color-dark"]);
}

#[test]
fn externally_emitted_root_still_keeps_missing_dependencies() {
    let globals = json!({"variables":{"color-brand":1},"animations":{}}).to_string();
    let mut engine = EngineSession::create_with_emitted_globals(&graph(), Some(&globals)).unwrap();
    assert_eq!(names(&engine), ["color-base", "color-mid"]);
    engine.ensure_class_rules(["fg:brand"]).unwrap();
    engine.delete_class_rules(["fg:brand"]).unwrap();
    assert_eq!(names(&engine), ["color-base", "color-mid"]);
}

#[test]
fn full_external_graph_is_not_duplicated_and_refresh_keeps_suppression() {
    let globals =
        json!({"variables":{"color-brand":1,"color-mid":1,"color-base":1},"animations":{}})
            .to_string();
    let mut engine = EngineSession::create_with_emitted_globals(&graph(), Some(&globals)).unwrap();
    engine.ensure_class_rules(["fg:brand"]).unwrap();
    engine.delete_class_rules(["fg:brand"]).unwrap();
    engine.refresh(&graph()).unwrap();
    assert!(names(&engine).is_empty());
    assert_eq!(
        engine.emitted_globals_snapshot().unwrap().variables.len(),
        3
    );
}

#[test]
fn refresh_replaces_static_dependencies_and_subset_forks_preserve_them() {
    let mut engine = EngineSession::create(&graph()).unwrap();
    assert!(
        engine
            .snapshot_for_classes(["block"])
            .unwrap()
            .text
            .contains("--color-base:red")
    );
    let next = manifest(json!([
        {"key":"brand","static":true,"value":"var(--color-new)","dependencies":["color-new"]},
        {"key":"new","value":"blue"}
    ]));
    engine.refresh(&next).unwrap();
    assert_eq!(names(&engine), ["color-brand", "color-new"]);
    engine.refresh(&manifest(json!([]))).unwrap();
    assert!(names(&engine).is_empty());
}

#[test]
fn registering_external_root_after_creation_preserves_local_dependencies() {
    let mut engine = EngineSession::create(&graph()).unwrap();
    engine
        .register_emitted_globals(
            &json!({"variables":{"color-brand":1},"animations":{}}).to_string(),
        )
        .unwrap();
    assert_eq!(names(&engine), ["color-base", "color-mid"]);
}

#[test]
fn dynamic_inline_dependency_graph_is_fully_released() {
    let source = manifest(json!([
        {"key":"brand","value":"var(--color-alias)","dependencies":["color-alias"]},
        {"key":"alias","value":"var(--color-base)","inline":true,"dependencies":["color-base"]},
        {"key":"base","value":"red"}
    ]));
    let mut engine = EngineSession::create(&source).unwrap();
    engine.ensure_class_rules(["fg:brand"]).unwrap();
    assert_eq!(names(&engine), ["color-base", "color-brand"]);
    engine.delete_class_rules(["fg:brand"]).unwrap();
    assert!(names(&engine).is_empty());
}

#[test]
fn refresh_from_static_to_dynamic_removes_the_permanent_reference() {
    let mut engine = EngineSession::create(&graph()).unwrap();
    engine.ensure_class_rules(["fg:brand"]).unwrap();
    let source = graph().replace("\"static\":true", "\"static\":false");
    engine.refresh(&source).unwrap();
    assert_eq!(names(&engine), ["color-base", "color-brand", "color-mid"]);
    engine.delete_class_rules(["fg:brand"]).unwrap();
    assert!(names(&engine).is_empty());
}

#[test]
fn deep_static_chain_uses_bounded_call_stack() {
    let count = 2048;
    let variables = (0..count)
        .map(|index| {
            let mut variable = json!({"key":format!("v{index}"),"value":"red","static":index==0});
            if index + 1 < count {
                variable["value"] = json!(format!("var(--color-v{})", index + 1));
                variable["dependencies"] = json!([format!("color-v{}", index + 1)]);
            }
            variable
        })
        .collect::<Vec<_>>();
    let engine = EngineSession::create(&manifest(json!(variables))).unwrap();
    assert_eq!(names(&engine).len(), count);
    assert!(
        engine
            .snapshot()
            .unwrap()
            .resources
            .variables
            .iter()
            .all(|v| v.ref_count == 1)
    );
}
