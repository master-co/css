use mastercss_engine::EngineSession;
use mastercss_render::{RenderSession, ServerRenderIr};
use mastercss_schema::{EngineSnapshotIr, HydrationManifest};
use serde_json::json;

fn manifest() -> String {
    let color = |name: &str| json!({"type":"declaration","property":"color","value":[{"type":"text","value":format!("var(--{name})")}]});
    json!({
        "version":6,"languageVersion":16,
        "variables":{"color":[
            {"key":"primary","values":[{"path":[":root,:host"],"value":"red"}]},
            {"key":"secondary","values":[{"path":[":root,:host"],"value":"blue"},{"path":[".dark,:host(.dark)"],"value":"navy"}]}
        ]},
        "theme":[
            {"type":"rule","prelude":":root,:host","children":[
                {"type":"declaration","name":"color-primary","value":"red"},
                {"type":"declaration","name":"color-secondary","value":"blue"}
            ]},
            {"type":"rule","prelude":".dark,:host(.dark)","children":[
                {"type":"declaration","name":"color-secondary","value":"navy"}
            ]}
        ],
        "utilities":[
            {"kind":"static","name":"brand","body":[color("color-primary")]},
            {"kind":"static","name":"accent","body":[color("color-secondary")]}
        ]
    })
    .to_string()
}

fn render(manifest: &str, stylesheets: &[&str], classes: &[&str]) -> ServerRenderIr {
    let mut session = RenderSession::create(manifest, None).unwrap();
    for css in stylesheets {
        session.ensure_stylesheet_resources(css).unwrap();
    }
    session.ensure_classes(classes).unwrap();
    session.snapshot().unwrap()
}

/// What a runtime without the page's stylesheets reproduces from the manifest.
fn hydrate(manifest: &str, rendered: &ServerRenderIr) -> EngineSnapshotIr {
    let mut runtime = EngineSession::create(manifest).unwrap();
    runtime
        .ensure_class_rules(&rendered.hydration_manifest.class_names)
        .unwrap();
    runtime
        .register_emitted_globals(rendered.hydration_manifest.emitted_globals.clone())
        .unwrap();
    runtime.snapshot().unwrap()
}

fn assert_hydrates(manifest: &str, rendered: &ServerRenderIr) {
    let snapshot = hydrate(manifest, rendered);
    assert_eq!(
        HydrationManifest::from_snapshot(&snapshot).resource_order,
        rendered.hydration_manifest.resource_order
    );
    assert_eq!(snapshot.text, rendered.snapshot.text);
}

#[test]
fn variables_a_stylesheet_defines_on_every_theme_path_are_not_generated_again() {
    let manifest = manifest();
    // Minified compiler output: the stylesheet defines what it uses.
    let rendered = render(
        &manifest,
        &[
            ".card{color:var(--color-primary);background:var(--color-secondary)}@layer theme{:root, :host{--color-primary:red;--color-secondary:blue}}",
        ],
        &["brand", "accent"],
    );
    let emitted_globals = &rendered.hydration_manifest.emitted_globals;
    assert_eq!(emitted_globals.variable_count("color-primary"), 1);
    // The dark value of color-secondary is still missing from the stylesheet.
    assert_eq!(emitted_globals.variable_count("color-secondary"), 0);
    assert!(!rendered.snapshot.text.contains("--color-primary:"));
    assert!(
        rendered
            .snapshot
            .text
            .contains(".dark,:host(.dark){--color-secondary:navy}")
    );
    assert_eq!(
        rendered.hydration_manifest.resource_order.variables,
        ["color-secondary"]
    );
    assert_hydrates(&manifest, &rendered);
}

#[test]
fn scoped_or_conditional_declarations_do_not_define_theme_variables() {
    let manifest = manifest();
    for css in [
        ".card{--color-primary:green;color:var(--color-primary)}",
        "@media print{:root,:host{--color-primary:green}}.card{color:var(--color-primary)}",
        "@keyframes pulse{to{--color-primary:green}}.card{color:var(--color-primary)}",
    ] {
        let rendered = render(&manifest, &[css], &["brand"]);
        assert!(
            rendered.hydration_manifest.emitted_globals.is_empty(),
            "{css}"
        );
        assert!(
            rendered.snapshot.text.contains("--color-primary:red"),
            "{css}"
        );
    }
}

#[test]
fn keyframes_a_stylesheet_uses_through_its_own_slot_are_hosted() {
    let manifest = include_str!("../../../packages/preset/src/default-manifest.json");
    let fade = serde_json::from_str::<serde_json::Value>(manifest).unwrap()["keyframes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|definition| definition["name"] == "fade")
        .unwrap()
        .clone();
    let id = fade["id"].as_str().unwrap();
    let slot = fade["slotId"].as_str().unwrap_or(id);
    let css =
        format!("@media only all,(master-css-keyframe-{slot}){{:not(*){{--master-css-slot:0}}}}");
    // A component stylesheet uses the keyframes through the entry's slot.
    let rendered = render(
        manifest,
        &[&css, ".toast{animation:fade 1s}"],
        &["animation:fade|2s"],
    );
    let emitted_globals = &rendered.hydration_manifest.emitted_globals;
    assert_eq!(emitted_globals.keyframes.get(id), Some(&1));
    assert!(emitted_globals.keyframe_slots.iter().any(|slot| slot == id));
    // The frames render into the stylesheet's slot, so the runtime leaves them alone.
    assert!(!rendered.snapshot.text.contains("@keyframes fade"));
    assert!(rendered.snapshot.stylesheets[0].contains("@keyframes fade"));
    assert!(
        rendered
            .hydration_manifest
            .resource_order
            .keyframes
            .is_empty()
    );
    assert_hydrates(manifest, &rendered);
}
