#[test]
fn simple_query_diagnostics_and_selectors_are_shared_by_generation() {
    let engine = EngineSession::create(MANIFEST).unwrap();
    for class in ["block@media(screen|and|(width>=50rem))", "block@supports(selector([lang|=en]))"] {
        let inspection = engine.inspect(class).unwrap();
        assert!(inspection.rules.is_empty());
        assert_eq!(inspection.diagnostics[0].code, super::ErrorCode::MasterQueryRequiresCss);
        assert!(inspection.diagnostics[0].notes[0].contains("@custom-variant"));
        assert!(engine.generate_composition_rules(class).is_empty());
    }
    for class in ["padding:1px.<br", "padding:1px.foo()"] {
        let inspection = engine.inspect(class).unwrap();
        assert!(inspection.rules.is_empty(), "{class}");
        assert_eq!(inspection.diagnostics[0].code, super::ErrorCode::ClassSyntaxError);
    }
    assert!(!engine.inspect("padding:1px:future-pseudo(foo)").unwrap().rules.is_empty());
}

#[test]
fn equivalent_conditions_sort_tokens_before_direct_values() {
    let classes = ["p-md@media((width>=50rem))", "p:8px@media((min-width:50rem))"];
    for ordered in [classes.to_vec(), classes.into_iter().rev().collect()] {
        let mut engine = EngineSession::create(MANIFEST).unwrap();
        engine.ensure_class_rules(&ordered).unwrap();
        let rules = engine.snapshot().unwrap().rules;
        assert_eq!(rules.len(), 2);
        assert_eq!(rules[0].class_name, classes[0]);
        assert_eq!(rules[1].class_name, classes[1]);
        assert_eq!(rules[0].priority.features, rules[1].priority.features);
        assert_eq!(rules[0].priority.conditions, rules[1].priority.conditions);
    }
}

#[test]
fn priority_intersects_media_but_preserves_container_domains_and_exclusive_bounds() {
    let engine = EngineSession::create(MANIFEST).unwrap();
    let priority = |class: &str| engine.inspect(class).unwrap().rules[0].priority.clone();
    let a = priority("block@media((width>=800px))@media((width>=400px))");
    let b = priority("block@media((width>=400px))@media((width>=800px))");
    assert_eq!(a, b);
    assert_eq!(a.features[0].lower.as_ref().unwrap().value, 800.0);
    assert!(a.features[0].upper.is_none());
    let exclusive = priority("block@media((width>800px))");
    assert!(!exclusive.features[0].lower.as_ref().unwrap().inclusive);
    assert_ne!(exclusive.features, a.features);
    let container = priority("block@container(card|(width>=800px))@container(card|(width>=400px))");
    assert_eq!(container.features.len(), 2);
    assert_ne!(container.features[0].domain, container.features[1].domain);
    assert_ne!(container.features, a.features);
    assert_ne!(priority("block@media((width>=50rem))").features, a.features);
}

#[test]
fn mode_selector_lists_cover_every_root_and_descendant() {
    let manifest = MANIFEST.replace("\"selector\":\":root\"", "\"selector\":\".a,.b\"");
    let engine = EngineSession::create(&manifest).unwrap();
    let inspection = engine.inspect("block@dark").unwrap();
    assert_eq!(inspection.rules.len(), 2);
    assert!(inspection.rules[0].text.contains(":where(.a,.a *)"));
    assert!(inspection.rules[1].text.contains(":where(.b,.b *)"));
}

#[test]
fn selectors_replace_only_nesting_tokens_through_variant_composition() {
    let mut manifest: serde_json::Value = serde_json::from_str(MANIFEST).unwrap();
    manifest["variants"].as_array_mut().unwrap().push(serde_json::json!({
        "token":"@literal", "branches":[{"selector": "&[data-x='&']/*&*/ .escaped\\&name"}]
    }));
    let engine = EngineSession::create(&manifest.to_string()).unwrap();
    let inspection = engine.inspect("block@literal@scope").unwrap();
    assert!(inspection.rules[0].text.contains("[data-x='&']/*&*/ .escaped\\&name"));
    let composed = engine.generate_composition_rules("block@literal@scope");
    assert!(composed[0].selector.contains("[data-x='&']/*&*/ .escaped\\&name"));
}

#[test]
fn custom_property_token_streams_keep_native_dollars() {
    let engine = EngineSession::create(MANIFEST).unwrap();
    for class in ["--money:$100", "--identifier:$name", "content:'$100'"] {
        let result = engine.inspect(class).unwrap();
        assert_eq!(result.rules.len(), 1, "{class}");
        assert!(result.rules[0].text.contains('$'));
    }
    assert!(engine.inspect("width:$size").unwrap().rules.is_empty());
}
