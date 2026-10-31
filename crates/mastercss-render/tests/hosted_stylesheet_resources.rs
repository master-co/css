use mastercss_engine::EngineSession;
use mastercss_render::{RenderSession, ServerRenderIr};
use mastercss_schema::{EngineSnapshotIr, HydrationManifest};
use serde_json::json;

fn manifest() -> String {
    let color = |name: &str| json!({"type":"declaration","property":"color","value":[{"type":"text","value":format!("var(--{name})")}]});
    json!({
        "version":6,"languageVersion":17,
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
fn on_demand_keyframes_a_stylesheet_uses_render_with_the_generated_css() {
    let manifest = include_str!("../../../packages/preset/src/default-manifest.json");
    let id = serde_json::from_str::<serde_json::Value>(manifest).unwrap()["keyframes"]
        .as_array()
        .unwrap()
        .iter()
        .find(|definition| definition["name"] == "fade")
        .unwrap()["id"]
        .as_str()
        .unwrap()
        .to_owned();
    // The preset delivers no keyframes natively: a stylesheet using one roots it,
    // and the page's generated CSS emits it once, which the runtime adopts.
    let rendered = render(
        manifest,
        &[".toast{animation:fade 1s}"],
        &["(animation:fade|2s)"],
    );
    assert!(
        rendered
            .hydration_manifest
            .emitted_globals
            .keyframes
            .get(&id)
            .is_none()
    );
    assert_eq!(rendered.snapshot.text.matches("@keyframes fade").count(), 1);
    assert_eq!(rendered.hydration_manifest.resource_order.keyframes, [id]);
    assert_hydrates(manifest, &rendered);
}
