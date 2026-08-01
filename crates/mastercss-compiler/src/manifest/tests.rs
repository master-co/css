
use super::*;

#[test]
fn compiles_variables_conditions_and_utilities() {
    let input: CssDirectiveManifestInput = serde_json::from_value(json!({
            "variables": [
                { "namespace": "spacing", "key": "card", "value": 12, "static": true },
                { "namespace": "color", "key": "brand", "value": "var(--color-blue-50)" },
                { "namespace": "color", "key": "brand", "value": "#123", "mode": "dark", "static": true },
                { "namespace": "breakpoint", "key": "card", "value": "48rem" }
            ],
            "utilities": [{
                "name": "card",
                "layer": "components",
                "declarations": { "display": "grid", "color": "var(--color-primary)" }
            }]
        }))
        .unwrap();
    let manifest = compile_manifest_input(&input, &CompileManifestOptions::default())
        .unwrap()
        .manifest;
    assert_eq!(manifest["variables"]["spacing"][0]["key"], "card");
    assert_eq!(
        manifest["variables"]["color"][0]["modes"]["dark"]["value"],
        "#123"
    );
    assert_eq!(
        manifest["conditions"]["card"]["nodes"][0]["value"].as_f64(),
        Some(48.0)
    );
    assert_eq!(manifest["utilities"][0]["matchers"][0]["name"], "card");
}

#[test]
fn compiles_variant_nodes() {
    let input: CssDirectiveManifestInput = serde_json::from_value(json!({
            "variants": [
                { "token": ":hocus", "branches": [{ "selector": "&:hover,&:focus" }] },
                { "token": "@motion-safe", "branches": [{ "conditions": ["@media (prefers-reduced-motion:no-preference)"] }] }
            ]
        }))
        .unwrap();
    let manifest = compile_manifest_input(&input, &CompileManifestOptions::default())
        .unwrap()
        .manifest;
    assert_eq!(manifest["selectors"][":hocus"][0]["value"], "hover");
    assert_eq!(
        manifest["conditions"]["motion-safe"]["nodes"][0]["name"],
        "prefers-reduced-motion"
    );
}

#[test]
fn ignores_placeholders_and_dependencies_inside_quoted_values() {
    let input: CssDirectiveManifestInput = serde_json::from_value(json!({
        "variables": [{
            "name": "content-demo",
            "value": "\"var(--color-blue-60) | $quoted\""
        }],
        "utilities": [{
            "name": "label-<info>",
            "type": "pattern",
            "pattern": { "prefix": "label-", "values": ["info"] },
            "declarations": {
                "content": "\"--value()\"",
                "color": "--value()"
            }
        }]
    }))
    .unwrap();
    let manifest = compile_manifest_input(&input, &CompileManifestOptions::default())
        .unwrap()
        .manifest;
    assert_eq!(
        manifest["variables"]["content"][0]["value"],
        "\"var(--color-blue-60) | $quoted\""
    );
    assert!(manifest["variables"]["content"][0]["dependencies"].is_null());
    let declarations = &manifest["utilities"][0]["emit"]["rules"][0]["declarations"];
    assert_eq!(declarations["content"], "\"--value()\"");
    assert!(declarations["color"].is_null());
}
