use super::*;

#[test]
fn validates_current_manifest_fields_only() {
    let source =
        r#"{"version":6,"languageVersion":18,"variables":{"color":[{"key":"red","values":[]}]}}"#;
    let manifest = MasterCssManifest::parse(source).unwrap();
    assert_eq!(manifest.to_json().unwrap(), source);
    assert!(matches!(
        MasterCssManifest::parse(r#"{"version":6,"languageVersion":18,"future":{}}"#),
        Err(SchemaError::UnknownField(field)) if field == "future"
    ));
    assert!(matches!(
        MasterCssManifest::parse(
            r#"{"version":6,"languageVersion":18,"variables":{"color":[{"key":"red","values":[],"future":1}]}}"#
        ),
        Err(SchemaError::UnknownField(field)) if field == "variables.*.future"
    ));
}

#[test]
fn rejects_unsupported_manifest_versions_and_shapes() {
    assert!(matches!(
        MasterCssManifest::parse(r#"{"version":6,"languageVersion":15}"#),
        Err(SchemaError::UnsupportedLanguageVersion)
    ));
    assert!(matches!(
        MasterCssManifest::parse(r#"{"version":0}"#),
        Err(SchemaError::UnsupportedManifestVersion)
    ));
    assert!(matches!(
        MasterCssManifest::parse(r#"{"version":6,"languageVersion":18,"variables":[]}"#),
        Err(SchemaError::UnsupportedVariablesFormat)
    ));
}

#[test]
fn manifests_parse_into_typed_sections_and_write_back_the_same_json() {
    let source = concat!(
        r#"{"version":6,"languageVersion":18,"#,
        r#""theme":[{"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"color-red","value":"red","static":true}]}],"#,
        r#""animationVariables":{"spin":["spin 1s"]},"#,
        r#""keyframes":[],"#,
        r#""customMedia":{"--sm":{"type":"feature","value":"(width >= 40rem)"},"--md":{"type":"feature","value":"(width >= 48rem)"}},"#,
        r#""variables":{"color":[{"key":"red","values":[{"path":[":root,:host"],"value":"red","static":true}],"dependencies":[]}],"#,
        r#""spacing":[{"name":"gap","key":"gap","values":[{"path":[":root,:host"],"value":"1rem"}],"type":"number","numeric":{"value":1,"unit":"rem"}}]},"#,
        r#""debug":{"owner":"preset"}}"#
    );
    let manifest = MasterCssManifest::parse(source).unwrap();
    assert_eq!(manifest.keyframes, Some(Vec::new()));
    assert_eq!(
        manifest
            .custom_media
            .as_ref()
            .unwrap()
            .keys()
            .collect::<Vec<_>>(),
        ["--sm", "--md"]
    );
    assert_eq!(manifest.to_json().unwrap(), source);
}

#[test]
fn manifest_variable_numbers_keep_their_json_spelling() {
    for numeric in [
        r#"{"value":16,"unit":"px"}"#,
        r#"{"value":0.25,"unit":"rem"}"#,
        r#"{"value":16.0,"unit":""}"#,
        r#"{"value":null,"unit":""}"#,
    ] {
        let source = format!(
            r#"{{"version":6,"languageVersion":18,"variables":{{"spacing":[{{"key":"x","values":[],"numeric":{numeric}}}]}}}}"#
        );
        assert_eq!(
            MasterCssManifest::parse(&source)
                .unwrap()
                .to_json()
                .unwrap(),
            source
        );
    }
}

#[test]
fn manifests_reject_mistyped_variable_fields_and_reserved_media() {
    assert!(matches!(
        MasterCssManifest::parse(
            r#"{"version":6,"languageVersion":18,"variables":{"color":[{"name":1,"key":"red","values":[]}]}}"#
        ),
        Err(SchemaError::InvalidJson(_))
    ));
    assert!(matches!(
        MasterCssManifest::parse(
            r#"{"version":6,"languageVersion":18,"variables":{"color":[{"key":"red"}]}}"#
        ),
        Err(SchemaError::UnsupportedVariablesFormat)
    ));
    assert!(matches!(
        MasterCssManifest::parse(
            r#"{"version":6,"languageVersion":18,"customMedia":{"--starting-style":{"type":"true"}}}"#
        ),
        Err(SchemaError::ReservedCustomMediaName)
    ));
}

#[test]
fn records_keep_first_positions_and_last_values_and_compare_like_objects() {
    let record: Record<u32> = serde_json::from_str(r#"{"b":1,"a":2,"b":3}"#).unwrap();
    assert_eq!(serde_json::to_string(&record).unwrap(), r#"{"b":3,"a":2}"#);
    let reordered: Record<u32> = serde_json::from_str(r#"{"a":2,"b":3}"#).unwrap();
    assert_eq!(record, reordered);
    assert_ne!(record, serde_json::from_str(r#"{"a":2}"#).unwrap());
}

#[test]
fn variables_flatten_and_group_with_one_name_derivation() {
    assert_eq!(variable_name("color", "red"), "color-red");
    assert_eq!(variable_name("color", ""), "color");
    assert_eq!(variable_name("", "gap"), "gap");
    let groups: Record<Vec<ManifestVariable>> = serde_json::from_str(
        r#"{"color":[{"key":"red","values":[]},{"name":"brand","key":"blue","values":[],"type":"number"}],"":[{"key":"gap","values":[]}]}"#,
    )
    .unwrap();
    let flattened = flatten_variables(groups);
    assert_eq!(
        flattened
            .iter()
            .map(|variable| (
                variable.name.as_deref().unwrap(),
                variable.namespace.as_deref(),
                variable.variable_type.as_deref().unwrap()
            ))
            .collect::<Vec<_>>(),
        [
            ("color-red", Some("color"), "string"),
            ("brand", Some("color"), "number"),
            ("gap", None, "string"),
        ]
    );
    assert_eq!(
        serde_json::to_string(&group_variables(flattened).unwrap()).unwrap(),
        r#"{"color":[{"name":"color-red","key":"red","values":[],"type":"string"},{"name":"brand","key":"blue","values":[],"type":"number"}],"":[{"name":"gap","key":"gap","values":[],"type":"string"}]}"#
    );
    assert_eq!(group_variables(Vec::new()), None);
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
