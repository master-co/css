use super::*;

#[test]
fn validates_manifest_v1_without_dropping_unknown_fields() {
    let source = r#"{"version":1,"future":{"value":true},"utilities":[]}"#;
    let manifest = MasterCssManifest::parse(source).unwrap();
    assert_eq!(manifest.to_json().unwrap(), source);
}

#[test]
fn rejects_legacy_manifest_shapes() {
    assert!(matches!(
        MasterCssManifest::parse(r#"{"version":0}"#),
        Err(SchemaError::UnsupportedManifestVersion)
    ));
    assert!(matches!(
        MasterCssManifest::parse(r#"{"version":1,"variables":[]}"#),
        Err(SchemaError::UnsupportedVariablesFormat)
    ));
    assert!(matches!(
        MasterCssManifest::parse(r#"{"version":1,"utilityBuckets":{}}"#),
        Err(SchemaError::UnsupportedUtilityBuckets)
    ));
}

#[test]
fn hydration_json_is_script_safe() {
    let manifest = HydrationManifest::new(
        vec![GeneratedRuleIr {
            class_name: "content:<".into(),
            key: "content:<".into(),
            layer: UtilityLayerName::Utilities,
            utility_type: 0,
            sort_tier: 0,
            priority: RulePriorityIr::default(),
            text: ".content\\:\\<{content:\"<\"}".into(),
            nodes: Vec::new(),
            selector_text: None,
            variable_names: Vec::new(),
            animation_names: Vec::new(),
        }],
        Vec::new(),
    );
    let json = manifest.to_script_json().unwrap();
    assert!(!json.contains('<'));
    assert!(json.contains("\\u003c"));
}
