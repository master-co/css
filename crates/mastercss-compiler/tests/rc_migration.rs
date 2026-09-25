//! Historical RC inputs are intentionally confined to this migration suite.
use mastercss_compiler::{RcMigrationRequest, migrate_rc};
use serde_json::{Value, json};

fn request(classes: &[&str]) -> RcMigrationRequest {
    RcMigrationRequest {
        from: mastercss_compiler::RcMigrationProfile::RcLegacy,
        source_version: "2.0.0-rc.87".into(),
        manifest: serde_json::from_str(include_str!(
            "fixtures/v2-rc-before-named-tokens.manifest.json"
        ))
        .unwrap(),
        target_manifest: serde_json::from_str(include_str!(
            "../../../packages/preset/src/default-manifest.json"
        ))
        .unwrap(),
        target_is_preset: true,
        class_lists: classes.iter().map(|class| vec![(*class).into()]).collect(),
        stylesheets: Vec::new(),
        documents: Vec::new(),
    }
}

#[test]
fn migrates_saved_rc_examples_and_preserves_identity() {
    let map: Value = serde_json::from_str(include_str!("fixtures/v2-rc-syntax-map.json")).unwrap();
    let cases = map["cases"].as_array().unwrap();
    let classes = cases
        .iter()
        .map(|case| case["rc"].as_str().unwrap())
        .collect::<Vec<_>>();
    let result = migrate_rc(&request(&classes)).unwrap();
    for (case, list) in cases.iter().zip(&result.class_lists) {
        let before = case["rc"].as_str().unwrap();
        let proposal = &list[0];
        assert_ne!(proposal.status, "review", "{before}: {:?}", proposal.notes);
        assert_eq!(proposal.after.as_deref(), case["v2"].as_str(), "{before}");
    }
}

#[test]
fn reads_original_units_and_preserves_resolution_and_quoted_values() {
    let mut request = request(&[
        "m:-1.5x@sm!",
        "w:calc(2x+1px)",
        "background-image:image-set(url(a.png)|1x,url(b.png)|2x)",
        "content:'4x'",
        "image-resolution:2x",
        "m:sm|md",
        "p:$spacing-md",
    ]);
    request.manifest["settings"] = json!({"baseUnit":8,"rootSize":20});
    let result = migrate_rc(&request).unwrap();
    for (list, expected) in result.class_lists.iter().zip([
        "m:-0.6rem@sm!",
        "w:calc(0.8rem+1px)",
        "background-image:image-set(url(a.png)|1x,url(b.png)|2x)",
        "content:'4x'",
        "image-resolution:2x",
        "m:var(--spacing-sm)|var(--spacing-md)",
        "p:var(--spacing-md)",
    ]) {
        assert_ne!(list[0].status, "review", "{:?}", list[0].notes);
        assert_eq!(list[0].after.as_deref(), Some(expected));
    }
    request.manifest["settings"]["rootSize"] = json!(0);
    assert!(migrate_rc(&request).is_err());
}

#[test]
fn reports_ambiguity_dynamic_values_and_cascade_risks() {
    let mut request = request(&["font:brand", "bg:${color}"]);
    request.manifest["variables"]["font-family"]
        .as_array_mut()
        .unwrap()
        .push(json!({"key":"brand","value":"Brand"}));
    request.manifest["variables"]["font-size"]
        .as_array_mut()
        .unwrap()
        .push(json!({"key":"brand","value":"2rem","type":"number"}));
    request
        .class_lists
        .push(vec!["p:md".into(), "p:8px".into()]);
    let result = migrate_rc(&request).unwrap();
    assert!(
        result
            .class_lists
            .iter()
            .flatten()
            .all(|proposal| proposal.status == "review"),
        "{}",
        serde_json::to_string(&result).unwrap()
    );
    assert!(result.class_lists[0][0].notes[0].contains("Ambiguous"));
}

#[test]
fn migration_is_idempotent_for_safe_classes() {
    let input = request(&["font:mono:hover@sm!", "p:4x", "{p:md;fg:red}:hover"]);
    let first = migrate_rc(&input).unwrap();
    let second = migrate_rc(&RcMigrationRequest {
        class_lists: first
            .class_lists
            .iter()
            .map(|list| {
                list.iter()
                    .map(|proposal| proposal.after.clone().expect("safe proposal"))
                    .collect()
            })
            .collect(),
        ..input
    })
    .unwrap();
    assert!(
        second
            .class_lists
            .iter()
            .flatten()
            .all(|proposal| proposal.status == "unchanged")
    );
}

#[test]
fn migrates_directives_and_reports_selector_references() {
    let mut input = request(&[]);
    input.manifest["settings"] = json!({"baseUnit":8,"rootSize":20});
    input.stylesheets = vec!["@settings{base-unit:8;root-size:20}@utilities{font:<~font-size|number|*>{font-size:--value()}}.card{@compose p:md font:mono}".into(),
        ".p\\:md{color:red}".into()];
    let result = migrate_rc(&input).unwrap();
    assert!(
        result.stylesheets[0].notes.is_empty(),
        "{:?}",
        result.stylesheets[0].notes
    );
    let mut migrated = input.stylesheets[0].clone();
    for edit in result.stylesheets[0].edits.iter().rev() {
        migrated.replace_range(
            edit.range.start as usize..edit.range.end as usize,
            &edit.after,
        );
    }
    assert!(!migrated.contains("base-unit"));
    assert!(migrated.contains("font-<~font-size>"));
    assert!(migrated.contains("font-size:<*>"));
    assert!(migrated.contains("@compose p-md font-mono"));
    assert!(!result.stylesheets[1].notes.is_empty());
    input.stylesheets = vec![migrated];
    let again = migrate_rc(&input).unwrap();
    assert!(
        again.stylesheets[0].edits.is_empty(),
        "{:?}",
        again.stylesheets[0].edits
    );
}

#[test]
fn respects_explicit_target_resources_in_equivalence_checks() {
    let mut input = request(&["p:md"]);
    input.target_is_preset = false;
    input.target_manifest["variables"]["spacing"]
        .as_array_mut()
        .unwrap()
        .iter_mut()
        .find(|variable| variable["key"] == "md")
        .unwrap()["value"] = json!("99rem");
    // The CSS variable identity remains the same. Its value is a deliberate
    // project change, not something the migrator may overwrite from RC.
    let result = migrate_rc(&input).unwrap();
    assert_eq!(result.class_lists[0][0].after.as_deref(), Some("p-md"));
    input.target_manifest["variables"]["spacing"]
        .as_array_mut()
        .unwrap()
        .retain(|variable| variable["key"] != "md");
    assert_eq!(
        migrate_rc(&input).unwrap().class_lists[0][0].status,
        "review"
    );
}

#[test]
fn audits_dynamic_sources_and_cross_file_selector_dependencies() {
    let mut input = request(&[]);
    input.documents = vec![
        "<div className={`p:${size} font:mono`} />".into(),
        "const el = document.querySelector('.font\\:mono')".into(),
        "<div class=\"font:mono\"></div>".into(),
    ];
    let result = migrate_rc(&input).unwrap();
    assert!(result.documents[0][0].contains("Dynamic"));
    assert!(result.documents[1][0].contains("cross-file"));
    assert!(result.documents[2].is_empty());
}

#[test]
fn does_not_auto_preserve_invalid_rc_managed_declarations() {
    let result = migrate_rc(&request(&["bg:image-set(url(a.png)|1x,url(b.png)|2x)"])).unwrap();
    assert_eq!(result.class_lists[0][0].status, "review");
    assert!(result.class_lists[0][0].notes[0].contains("saved CSS"));
}

#[test]
fn custom_static_definitions_require_a_proven_target() {
    let mut input = request(&["card:hover@sm"]);
    let custom = json!({"id":"card","type":-2,"matchers":[{"type":"static","name":"card"}],
        "emit":{"type":"static","rules":[{"declarations":{"padding":"4px"}}]}});
    input.manifest["utilities"]
        .as_array_mut()
        .unwrap()
        .push(custom.clone());
    assert_eq!(
        migrate_rc(&input).unwrap().class_lists[0][0].status,
        "review"
    );
    input.target_manifest["utilities"]
        .as_array_mut()
        .unwrap()
        .push(custom);
    assert_eq!(
        migrate_rc(&input).unwrap().class_lists[0][0].status,
        "unchanged"
    );
}

#[test]
fn migrates_var_fallbacks_and_nested_image_lengths_without_touching_resolution() {
    let result = migrate_rc(&request(&[
        "p:var(--space,4x)",
        "background-image:image-set(linear-gradient(red|2x,blue|4x)|2x)",
    ]))
    .unwrap();
    assert_eq!(
        result.class_lists[0][0].after.as_deref(),
        Some("p:var(--space,1rem)")
    );
    assert_eq!(result.class_lists[0][0].status, "replace");
    assert_eq!(
        result.class_lists[1][0].after.as_deref(),
        Some("background-image:image-set(linear-gradient(red|0.5rem,blue|1rem)|2x)")
    );
}

#[test]
fn audits_unchanged_alias_spellings_and_logical_shorthand_overlaps() {
    let mut input = request(&[]);
    input.class_lists = vec![
        vec!["p:8px".into(), "padding:4px".into()],
        vec!["mx:sm".into(), "ml:8px".into()],
        vec!["grid-area:1/2/3/4".into(), "grid-row:2".into()],
    ];
    let result = migrate_rc(&input).unwrap();
    assert!(
        result
            .class_lists
            .iter()
            .flatten()
            .all(|proposal| proposal.status == "review"),
        "{}",
        serde_json::to_string(&result).unwrap()
    );
}

#[test]
fn named_rc_profile_preserves_old_numeric_queries_and_native_dimensions() {
    let mut request = request(&[
        "p-md@>=800",
        "width:8px@media((width>=800px))",
        "p-md@>=800px",
    ]);
    request.from = mastercss_compiler::RcMigrationProfile::RcNamed;
    request.manifest = json!({
        "version":1,"settings":{"rootSize":20},
        "variables":{"spacing":[{"key":"md","value":"1rem"}]}, "utilities":[]
    });
    let result = migrate_rc(&request).unwrap();
    assert_eq!(
        result.class_lists[0][0].after.as_deref(),
        Some("p-md@media((width>=40rem))")
    );
    assert_eq!(
        result.class_lists[1][0].after.as_deref(),
        Some("width:8px@media((width>=800px))")
    );
    assert_eq!(
        result.class_lists[2][0].status, "review",
        "{:?}",
        result.class_lists[2][0]
    );
    assert_eq!(result.from, mastercss_compiler::RcMigrationProfile::RcNamed);
    assert!(result.configuration_css.contains("@mode dark"));
    let encoded = serde_json::to_value(&result).unwrap();
    assert_eq!(encoded["configurationCSS"], result.configuration_css);
    assert!(encoded.get("configurationCss").is_none());
}

#[test]
fn named_rc_settings_become_explicit_modes_base_values_and_scheme() {
    let mut request = request(&[]);
    request.from = mastercss_compiler::RcMigrationProfile::RcNamed;
    request.manifest = json!({
        "version":1,"settings":{"rootSize":20,"modeTrigger":"class","defaultMode":"dark","modes":["light","dark"]},
        "variables":{"color":[{"key":"surface","modes":{"light":{"value":"white"},"dark":{"value":"black"}}}]},
        "utilities":[]
    });
    request.stylesheets = vec![
        "@settings{root-size:20;mode-trigger:class;default-mode:dark;modes:light,dark;}".into(),
    ];
    let result = migrate_rc(&request).unwrap();
    assert!(
        result
            .configuration_css
            .contains("@mode dark{.dark{@slot;}}")
    );
    assert!(
        result
            .configuration_css
            .contains("@theme{--color-surface:black;}")
    );
    assert!(result.configuration_css.contains("color-scheme:dark"));
    assert!(
        !result.notes.is_empty(),
        "Class-mode overlap and specificity need review"
    );
    assert!(
        result.stylesheets[0]
            .edits
            .iter()
            .any(|edit| edit.before == "root-size:20;" && edit.after.is_empty())
    );
}
