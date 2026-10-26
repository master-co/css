use super::*;

#[test]
fn validates_current_manifest_without_dropping_unknown_fields() {
    let source = r#"{"version":6,"languageVersion":16,"future":{"value":true}}"#;
    let manifest = MasterCssManifest::parse(source).unwrap();
    assert_eq!(manifest.to_json().unwrap(), source);
}

#[test]
fn rejects_legacy_manifest_shapes() {
    assert!(matches!(
        MasterCssManifest::parse(r#"{"version":6,"languageVersion":15}"#),
        Err(SchemaError::UnsupportedLanguageVersion)
    ));
    assert!(matches!(
        MasterCssManifest::parse(r#"{"version":6,"languageVersion":10}"#),
        Err(SchemaError::UnsupportedLanguageVersion)
    ));
    assert!(matches!(
        MasterCssManifest::parse(r#"{"version":6,"languageVersion":7}"#),
        Err(SchemaError::UnsupportedLanguageVersion)
    ));
    assert!(matches!(
        MasterCssManifest::parse(r#"{"version":4,"languageVersion":13}"#),
        Err(SchemaError::UnsupportedManifestVersion)
    ));
    assert!(matches!(
        MasterCssManifest::parse(r#"{"version":0}"#),
        Err(SchemaError::UnsupportedManifestVersion)
    ));
    assert!(matches!(
        MasterCssManifest::parse(r#"{"version":6,"languageVersion":16,"variables":[]}"#),
        Err(SchemaError::UnsupportedVariablesFormat)
    ));
    assert!(matches!(
        MasterCssManifest::parse(r#"{"version":6,"languageVersion":16,"utilityBuckets":{}}"#),
        Err(SchemaError::UnsupportedUtilityBuckets)
    ));
}

#[test]
fn hydration_json_is_script_safe() {
    let manifest = HydrationManifest::new(vec!["content:<".into()], Vec::new());
    let json = manifest.to_script_json().unwrap();
    assert!(!json.contains('<'));
    assert!(json.contains("\\u003c"));
}

fn round_trip<T>(json: &str) -> T
where
    T: serde::de::DeserializeOwned + Serialize + PartialEq + std::fmt::Debug,
{
    let from_str: T = serde_json::from_str(json).unwrap();
    let from_value: T = serde_json::from_value(serde_json::from_str(json).unwrap()).unwrap();
    assert_eq!(from_str, from_value);
    assert_eq!(serde_json::to_string(&from_str).unwrap(), json);
    from_str
}

fn rejection<T: serde::de::DeserializeOwned + std::fmt::Debug>(json: &str) -> String {
    serde_json::from_value::<T>(serde_json::from_str(json).unwrap())
        .unwrap_err()
        .to_string()
}

#[test]
fn tagged_wire_enums_round_trip_without_changing_the_wire_format() {
    round_trip::<Vec<MixinNode>>(
        r#"[{"type":"declaration","property":"color","value":[{"type":"text","value":"red"},{"type":"function","name":"var","value":[{"type":"text","value":"--a"}]}]},{"type":"rule","selector":"&:hover","body":[]},{"type":"condition","condition":"@media print","body":[{"type":"contents","fallback":[]}]},{"type":"apply","name":"m","arguments":[[]],"contents":[]}]"#,
    );
    round_trip::<Vec<ThemeNode>>(
        r#"[{"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"--a","value":"1","inline":true,"static":true}]}]"#,
    );
    round_trip::<MediaQueryExpr>(
        r#"{"type":"not","query":{"type":"or","queries":[{"type":"true"},{"type":"false"},{"type":"feature","value":"(width>=1px)"},{"type":"and","queries":[{"type":"media-type","name":"print"}]}]}}"#,
    );
    round_trip::<UtilityDefinition>(
        r#"{"kind":"token","name":"fg","parameters":[{"name":"--color"}],"body":[]}"#,
    );
}

#[test]
fn tagged_wire_enums_accept_the_tag_after_variant_fields() {
    let node: MixinNode =
        serde_json::from_str(r#"{"selector":"a","body":[],"type":"rule"}"#).unwrap();
    assert_eq!(
        node,
        MixinNode::Rule {
            selector: "a".into(),
            body: Vec::new()
        }
    );
}

#[test]
fn tagged_wire_enums_reject_fields_from_other_variants() {
    assert_eq!(
        rejection::<MixinNode>(r#"{"type":"rule","selector":"a","body":[],"property":"x"}"#),
        "unknown field `property`, expected `selector` or `body`"
    );
    assert_eq!(
        rejection::<MixinValuePart>(r#"{"type":"text","value":"x","name":"f"}"#),
        "unknown field `name`, expected `value`"
    );
    assert_eq!(
        rejection::<ThemeNode>(r#"{"type":"rule","prelude":":root","children":[],"inline":false}"#),
        "unknown field `inline`, expected `prelude` or `children`"
    );
    assert_eq!(
        rejection::<MediaQueryExpr>(r#"{"type":"true","value":"x"}"#),
        "unknown field `value`, there are no fields"
    );
    assert!(
        rejection::<MixinNode>(r#"{"type":"rule","selector":"a","body":[],"zzz":1}"#)
            .starts_with("unknown field `zzz`")
    );
}

#[test]
fn tagged_wire_enums_report_missing_and_mistyped_fields() {
    assert_eq!(
        rejection::<MixinNode>(r#"{"selector":"a","body":[]}"#),
        "missing field `type`"
    );
    assert_eq!(
        rejection::<MixinNode>(r#"{"type":"declaration","value":[]}"#),
        "missing field `property`"
    );
    assert!(rejection::<MixinNode>(r#"{"type":"nope"}"#).starts_with("unknown variant `nope`"));
    assert_eq!(
        rejection::<MixinValuePart>(r#"{"type":"text","value":[]}"#),
        "invalid type: sequence, expected a string"
    );
    assert_eq!(
        rejection::<MixinValuePart>(r#"{"type":"function","name":"f","value":"x"}"#),
        "invalid type: string \"x\", expected a sequence"
    );
}

#[test]
fn utility_definitions_ignore_unknown_fields_like_the_flattened_recipe() {
    let utility: UtilityDefinition =
        serde_json::from_str(r#"{"kind":"static","name":"btn","body":[],"future":1}"#).unwrap();
    assert_eq!(utility.recipe.name, "btn");
}
