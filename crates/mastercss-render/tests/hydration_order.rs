use mastercss_engine::EngineSession;
use mastercss_render::RenderSession;
use serde_json::json;

#[test]
fn server_resources_can_be_reconstructed_from_hydration_rule_order() {
    let manifest = json!({
        "version": 1,"languageVersion":3,
        "variables": { "": [
            { "name": "x", "key": "x", "value": "red" },
            { "name": "y", "key": "y", "value": "blue" },
            { "name": "a", "key": "a", "value": "linear-gradient(var(--x),var(--y))", "dependencies": ["x", "y"] },
            { "name": "z", "key": "z", "value": "green" }
        ]},
        "utilities": ([
            ("a", json!({"background-image":"var(--a)"})),
            ("b", json!({"color":"var(--x)", "border-color":"var(--z)"})),
            ("c", json!({"color":"var(--x)"}))
        ].map(|(name, declarations)| json!({
            "id": name, "name": name, "type": 0,
            "matchers": [{ "type": "static", "name": name }],
            "emit": {"type": "static", "rules": [{"declarations": declarations}]}
        })))
    }).to_string();
    let mut expected = None;
    for order in [["c", "a", "b"], ["b", "c", "a"], ["a", "b", "c"]] {
        let mut renderer = RenderSession::create(&manifest, None).unwrap();
        for class_name in order {
            renderer.ensure_classes([class_name]).unwrap();
        }
        for rendered in [
            renderer.snapshot().unwrap(),
            renderer.snapshot_for_classes(order).unwrap(),
        ] {
            let mut engine = EngineSession::create(&manifest).unwrap();
            engine
                .ensure_class_rules(
                    rendered
                        .hydration_manifest
                        .rules
                        .iter()
                        .map(|rule| &rule.class_name),
                )
                .unwrap();
            assert_eq!(engine.snapshot().unwrap(), rendered.snapshot);
            if let Some(expected) = &expected {
                assert_eq!(&rendered.snapshot, expected);
            } else {
                expected = Some(rendered.snapshot);
            }
        }
    }
}

#[test]
fn warmed_subsets_restore_theme_and_animation_order_with_host_globals() {
    let manifest = include_str!("../../../packages/preset/src/default-manifest.json");
    let classes = [
        "animation:rotate|1s",
        "bg:blue-60",
        "animation:fade|1s",
        "fg:red-60",
    ];
    for emitted in [
        None,
        Some(r#"{"variables":{"color-red-60":1},"animations":{"fade":1}}"#),
    ] {
        let mut renderer = RenderSession::create(manifest, emitted).unwrap();
        renderer.ensure_classes(["fg:green-60", "hidden"]).unwrap();
        for class_name in classes.iter().rev() {
            renderer.ensure_classes([class_name]).unwrap();
        }
        let rendered = renderer.snapshot_for_classes(classes).unwrap();
        let mut engine = EngineSession::create_with_emitted_globals(manifest, emitted).unwrap();
        engine
            .ensure_class_rules(
                rendered
                    .hydration_manifest
                    .rules
                    .iter()
                    .map(|rule| &rule.class_name),
            )
            .unwrap();
        assert_eq!(engine.snapshot().unwrap(), rendered.snapshot);
        assert!(!rendered.snapshot.text.contains("color-green-60"));
        assert!(!rendered.snapshot.text.contains(".hidden"));
    }
}
