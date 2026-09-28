use mastercss_compiler::{RcMigrationRequest, migrate_rc};
use serde_json::{Value, json};

// Frozen pre-removal preset definitions; custom same-name definitions are tested
// separately so a spelling alone never proves the old sizing intent.
fn request(classes: Vec<Vec<&str>>) -> RcMigrationRequest {
    let target: Value = serde_json::from_str(include_str!(
        "../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    let mut original: Value = serde_json::from_str(include_str!(
        "fixtures/v2-rc-before-directives.manifest.json"
    ))
    .unwrap();
    for (key, w, h) in [
        ("size", "width", "height"),
        ("min-size", "min-width", "min-height"),
        ("max-size", "max-width", "max-height"),
    ] {
        for token in [false, true] {
            let mut u = json!({"id":if token {format!("{key}-<~container>")} else {format!("{key}:<*>")},"type":-1,"emit":{"type":"static","rules":[{"declarations":{w:null,h:null}}]},"matchers":[if token {json!({"type":"token","prefix":format!("{key}-")})}else{json!({"type":"key","keys":[key]})}]});
            if token {
                u["variableAliasRefs"] = json!(["~container"]);
            }
            original["utilities"].as_array_mut().unwrap().push(u);
        }
    }
    serde_json::from_value(json!({"from":"rc-sizing","sourceVersion":"2.0.0-rc.sizing","manifest":original,"targetManifest":target,"classLists":classes})).unwrap()
}
#[test]
fn preserves_dimensions_conditions_importance_and_token_identity() {
    let request = request(vec![
        vec!["size:20px:hover@sm!"],
        vec!["min-size:2rem"],
        vec!["max-size-sm"],
    ]);
    let result = migrate_rc(&request).unwrap();
    for (index, expected) in [
        "{width:20px;height:20px}:hover@sm!",
        "{min-width:2rem;min-height:2rem}",
        "{max-width-sm;max-height-sm}",
    ]
    .iter()
    .enumerate()
    {
        assert_eq!(
            result.class_lists[index][0].after.as_deref(),
            Some(*expected),
            "{:?}",
            result.class_lists[index][0].notes
        );
    }
    let mut rerun = request;
    rerun.class_lists = result
        .class_lists
        .into_iter()
        .map(|list| list.into_iter().map(|item| item.after.unwrap()).collect())
        .collect();
    assert!(
        migrate_rc(&rerun)
            .unwrap()
            .class_lists
            .iter()
            .flatten()
            .all(|item| item.status == "unchanged")
    );
}
#[test]
fn reviews_dimension_competition_and_retains_explicit_custom_sizing() {
    let mut input = request(vec![vec!["size:20px", "width:30px"]]);
    assert!(
        migrate_rc(&input).unwrap().class_lists[0]
            .iter()
            .all(|item| item.status == "review")
    );
    let custom = json!({"id":"project-size","type":-1,"emit":{"type":"property","property":"inline-size"},"matchers":[{"type":"key","keys":["size"]}]});
    input.manifest["utilities"]
        .as_array_mut()
        .unwrap()
        .retain(|u| u["id"] != "size:<*>");
    input.manifest["utilities"]
        .as_array_mut()
        .unwrap()
        .push(custom.clone());
    input.target_manifest["utilities"]
        .as_array_mut()
        .unwrap()
        .push(custom);
    input.class_lists = vec![vec!["size:20px".into()]];
    assert_eq!(
        migrate_rc(&input).unwrap().class_lists[0][0].status,
        "unchanged"
    );
}
#[test]
fn refuses_same_spelling_with_changed_intent_and_dynamic_values() {
    let mut input = request(vec![vec!["size:20px"], vec!["size:${n}px"]]);
    let old = input.manifest["utilities"]
        .as_array_mut()
        .unwrap()
        .iter_mut()
        .find(|u| u["id"] == "size:<*>")
        .unwrap();
    old["emit"]["rules"][0]["declarations"]["height"] = json!("auto");
    assert!(
        migrate_rc(&input)
            .unwrap()
            .class_lists
            .iter()
            .flatten()
            .all(|item| item.status == "review")
    );
}

#[test]
fn every_profile_finishes_with_the_shared_sizing_stage() {
    use mastercss_compiler::RcMigrationProfile;
    for profile in [
        RcMigrationProfile::RcLegacy,
        RcMigrationProfile::RcNamed,
        RcMigrationProfile::RcNative,
        RcMigrationProfile::RcManaged,
        RcMigrationProfile::RcUtilities,
        RcMigrationProfile::RcSizing,
    ] {
        let mut input = request(vec![vec!["size:20px"]]);
        input.from = profile;
        let result = migrate_rc(&input).unwrap();
        assert_eq!(
            result.class_lists[0][0].after.as_deref(),
            Some("{width:20px;height:20px}"),
            "{profile:?}: {:?}",
            result.class_lists[0][0].notes
        );
        input.class_lists = vec![vec!["size:20px".into(), "width:30px".into()]];
        assert!(
            migrate_rc(&input).unwrap().class_lists[0]
                .iter()
                .all(|item| item.status == "review"),
            "{profile:?}"
        );
    }
}

#[test]
fn sizing_helpers_do_not_replace_explicit_short_alias_definitions() {
    let mut input = request(vec![vec!["min:20px"], vec!["min-size:20px"]]);
    let custom = json!({"id":"project-min","type":-1,"emit":{"type":"property","property":"inline-size"},"matchers":[{"type":"key","keys":["min"]}]});
    for manifest in [&mut input.manifest, &mut input.target_manifest] {
        manifest["utilities"]
            .as_array_mut()
            .unwrap()
            .push(custom.clone());
    }
    let result = migrate_rc(&input).unwrap();
    assert_eq!(result.class_lists[0][0].status, "unchanged");
    assert_eq!(
        result.class_lists[1][0].after.as_deref(),
        Some("{min-width:20px;min-height:20px}")
    );
}
