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
        "mixins":[{"name":"--card","body":[{"type":"declaration","property":"display","value":[{"type":"text","value":"grid"}]}]}]
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
    assert_eq!(manifest["mixins"][0]["name"], "--card");
}

#[test]
fn rejects_removed_variant_input() {
    assert!(
        serde_json::from_value::<CssDirectiveManifestInput>(json!({
            "variants":[{"token":"@hocus","branches":[{"selector":"&:hover,&:focus"}]}]
        }))
        .is_err()
    );
}

#[test]
fn ignores_placeholders_and_dependencies_inside_quoted_values() {
    let input: CssDirectiveManifestInput = serde_json::from_value(json!({
        "theme":[{"type":"rule","prelude":":root","children":[{"type":"declaration","name":"content-demo","value":"\"var(--color-blue-60) | $quoted\""}]}],
        "mixins":[{"name":"--label","parameters":[{"name":"--value"}],"body":[{"type":"declaration","property":"content","value":[{"type":"text","value":"\"var(--value)\""}]},{"type":"declaration","property":"color","value":[{"type":"function","name":"var","value":[{"type":"text","value":"--value"}]}]}]}]
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
    let body = &manifest["mixins"][0]["body"];
    assert_eq!(body[0]["value"][0]["value"], "\"var(--value)\"");
    assert_eq!(body[1]["value"][0]["name"], "var");
}

#[test]
fn removed_enum_authoring_input_is_not_treated_as_a_static_definition() {
    assert!(
        serde_json::from_value::<CssDirectiveManifestInput>(
            json!({"utilities":[{"name":"x-<a|b>"}]})
        )
        .is_err()
    );
}

#[test]
fn remerging_base_theme_rules_keeps_one_later_copy() {
    let base_input: CssDirectiveManifestInput = serde_json::from_value(json!({
        "theme":[
            {"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"color-brand","value":"red"}]},
            {"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"spacing-card","value":"12px"}]}]
    })).unwrap();
    let base = compile_manifest_input(&base_input, &CompileManifestOptions::default())
        .unwrap()
        .manifest;
    // A project entry re-imports the base preset and then overrides one token.
    let input: CssDirectiveManifestInput = serde_json::from_value(json!({
        "theme":[
            {"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"color-brand","value":"red"}]},
            {"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"spacing-card","value":"12px"}]},
            {"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"color-brand","value":"blue"}]}]
    })).unwrap();
    let options = CompileManifestOptions {
        base_manifest: Some(base.clone()),
    };
    let manifest = compile_manifest_input(&input, &options).unwrap().manifest;
    assert_eq!(
        manifest["theme"],
        serde_json::to_value(&input.theme).unwrap()
    );
    assert_eq!(
        manifest["variables"]["color"][0]["values"],
        json!([
            {"path":[":root,:host"],"value":"red"},
            {"path":[":root,:host"],"value":"blue"}
        ])
    );
    assert_eq!(
        manifest["variables"]["spacing"][0]["values"],
        base["variables"]["spacing"][0]["values"]
    );
    // The repeated rule keeps its later cascade position after unrepeated base rules.
    let repeated: CssDirectiveManifestInput = serde_json::from_value(json!({
        "theme":[{"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"color-brand","value":"red"}]}]
    })).unwrap();
    let manifest = compile_manifest_input(&repeated, &options)
        .unwrap()
        .manifest;
    assert_eq!(
        manifest["theme"],
        json!([base["theme"][1], base["theme"][0]])
    );
}
