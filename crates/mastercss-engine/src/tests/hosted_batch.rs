/// Registering hosted stylesheets together ends in the state registering them one
/// at a time does, including hosted variables, animation variables and keyframes.
#[test]
fn hosted_stylesheets_register_together_like_one_at_a_time() {
    let manifest = include_str!("../../../../packages/preset/src/default-manifest.json");
    let stylesheets = [
        ".plain { color: var(--color-stone-5) }",
        ":root, :host { --color-stone-0: #fff }",
        "",
        ".a { --motion: fade 1s; animation: var(--motion) }",
        "@keyframes fade { from { opacity: 0 } to { opacity: 1 } }",
        ".b { color: var(--color-stone-10); animation: slide 2s }",
        ".c { --motion: slide 2s }",
        ":root, :host { --color-stone-0: #000; --color-stone-5: #eee }",
        "@keyframes slide { from { translate: 0 } }",
    ];
    let classes = ["block", "fg-stone-0", "bg-stone-5", "fg-stone-10"];
    for split in [0, 1, 3, stylesheets.len()] {
        let mut one_at_a_time = EngineSession::create(manifest).unwrap();
        one_at_a_time.ensure_class_rules(&classes[..2]).unwrap();
        for stylesheet in stylesheets {
            one_at_a_time
                .ensure_hosted_stylesheet_resources(stylesheet)
                .unwrap();
        }
        one_at_a_time.ensure_class_rules(&classes[2..]).unwrap();

        let mut together = EngineSession::create(manifest).unwrap();
        together.ensure_class_rules(&classes[..2]).unwrap();
        together
            .ensure_hosted_stylesheets_resources(&stylesheets[..split])
            .unwrap();
        together
            .ensure_hosted_stylesheets_resources(&stylesheets[split..])
            .unwrap();
        together.ensure_class_rules(&classes[2..]).unwrap();

        assert_eq!(
            serde_json::to_value(together.snapshot().unwrap()).unwrap(),
            serde_json::to_value(one_at_a_time.snapshot().unwrap()).unwrap(),
            "split at {split}"
        );
        assert_eq!(
            serde_json::to_value(together.emitted_globals_snapshot().unwrap()).unwrap(),
            serde_json::to_value(one_at_a_time.emitted_globals_snapshot().unwrap()).unwrap(),
            "split at {split}"
        );
    }
}
