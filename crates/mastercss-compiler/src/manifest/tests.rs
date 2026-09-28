use super::{CompileManifestOptions, CssDirectiveManifestInput, compile_manifest_input};
use serde_json::json;

#[test]
fn compiles_scoped_variables_custom_media_and_utilities() {
    let input: CssDirectiveManifestInput = serde_json::from_value(json!({
        "theme":[
            {"type":"rule","prelude":":root","children":[
                {"type":"declaration","name":"spacing-card","value":"12px"},
                {"type":"declaration","name":"color-brand","value":"var(--color-blue-50)"}]},
            {"type":"rule","prelude":"[data-theme=dark]","children":[{"type":"declaration","name":"color-brand","value":"#123"}]}],
        "customMedia":[{"name":"--card","query":"(width >= 48rem)"}],
        "utilities":[{"name":"card","layer":"components","declarations":{"display":"grid","color":"var(--color-primary)"}}]
    })).unwrap();
    let manifest = compile_manifest_input(&input, &CompileManifestOptions::default())
        .unwrap()
        .manifest;
    assert_eq!(manifest["variables"]["spacing"][0]["key"], "card");
    assert_eq!(
        manifest["variables"]["color"][0]["values"][1]["value"],
        "#123"
    );
    assert_eq!(
        manifest["variables"]["color"][0]["values"][1]["path"],
        json!(["[data-theme=dark]"])
    );
    assert_eq!(
        manifest["customMedia"]["--card"]["value"],
        "(width >= 48rem)"
    );
    assert_eq!(manifest["utilities"][0]["matchers"][0]["name"], "card");
}

#[test]
fn compiles_variant_nodes() {
    let input: CssDirectiveManifestInput = serde_json::from_value(json!({
        "variants":[{"token":":hocus","branches":[{"selector":"&:hover,&:focus"}]},
        {"token":"@motion-safe","branches":[{"conditions":["@media (prefers-reduced-motion:no-preference)"]}]}]
    })).unwrap();
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
        "theme":[{"type":"rule","prelude":":root","children":[{"type":"declaration","name":"content-demo","value":"\"var(--color-blue-60) | $quoted\""}]}],
        "utilities":[{"name":"label:*","type":"dynamic","dynamic":{"key":"label"},"declarations":{"content":"\"--master-value()\"","color":"--master-value()"}}]
    })).unwrap();
    let manifest = compile_manifest_input(&input, &CompileManifestOptions::default())
        .unwrap()
        .manifest;
    assert_eq!(
        manifest["variables"]["content"][0]["values"][0]["value"],
        "\"var(--color-blue-60) | $quoted\""
    );
    assert!(
        manifest["variables"]["content"][0]["dependencies"]
            .as_array()
            .is_none_or(|values| values.is_empty())
    );
    let declarations = &manifest["utilities"][0]["emit"]["rules"][0]["declarations"];
    assert_eq!(declarations["content"], "\"--master-value()\"");
    assert!(declarations["color"].is_null());
}

#[test]
fn removed_enum_authoring_input_is_not_treated_as_a_static_definition() {
    let input: CssDirectiveManifestInput = serde_json::from_value(json!({"utilities":[{"name":"x-<a|b>","type":"pattern","pattern":{"prefix":"x-","values":["a","b"]},"declarations":{"color":"--value()"}}]})).unwrap();
    assert!(compile_manifest_input(&input, &CompileManifestOptions::default()).is_err());
}
