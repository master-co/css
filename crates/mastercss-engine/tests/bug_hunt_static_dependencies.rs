use mastercss_engine::EngineSession;

fn manifest() -> String {
    serde_json::json!({
        "version": 1,
        "variables": {"color": [
            {"key":"brand", "value":"var(--color-base)", "dependencies":["color-base"], "static":true},
            {"key":"base", "value":"red"}
        ]},
        "utilities": []
    }).to_string()
}

#[test]
fn bh_0003_static_resources_retain_transitive_dependencies_at_creation() {
    let engine = EngineSession::create(&manifest()).unwrap();
    assert!(engine.snapshot().unwrap().text.contains("--color-base:red"));
}

#[test]
fn bh_0003_static_dependency_survives_last_class_deletion() {
    let mut engine = EngineSession::create(&manifest()).unwrap();
    engine.ensure_class_rules(["fg:brand"]).unwrap();
    assert!(engine.snapshot().unwrap().text.contains("--color-base:red"));
    engine.delete_class_rules(["fg:brand"]).unwrap();
    assert!(engine.snapshot().unwrap().text.contains("--color-base:red"));
}
