use mastercss_compiler::{RcMigrationRequest, migrate_rc};
use serde_json::{Value, json};

fn request(classes: Vec<Vec<&str>>, styles: Vec<&str>) -> RcMigrationRequest {
    let target: Value = serde_json::from_str(include_str!(
        "../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    let utility = |id: &str, kind: &str, property: &str| json!({"id":id,"type":0,"kind":kind,"emit":{"type":"property","property":property},"matchers":[{"type":"value","keys":["text-stroke"]}]});
    let original = json!({"version":1,"languageVersion":2,"utilities":[
        utility("stroke-width", "number", "-webkit-text-stroke-width"),
        utility("stroke-color", "color", "-webkit-text-stroke-color"),
        {"id":"stroke-any","type":0,"emit":{"type":"property","property":"-webkit-text-stroke"},"matchers":[{"type":"key","keys":["text-stroke"]}]},
        {"id":"clamp-lines","type":0,"kind":"number","emit":{"type":"property","property":"-webkit-line-clamp"},"matchers":[{"type":"value","keys":["clamp-lines"]}]}
    ]});
    serde_json::from_value(json!({"from":"rc-utilities","sourceVersion":"2.0.0-rc.utilities","manifest":original,"targetManifest":target,"classLists":classes,"stylesheets":styles})).unwrap()
}

#[test]
fn preserves_actual_stroke_intent_and_does_not_guess_variable_types() {
    let result = migrate_rc(&request(
        vec![
            vec!["text-stroke:2px"],
            vec!["text-stroke:#fff"],
            vec!["text-stroke:red"],
            vec!["text-stroke:var(--stroke)"],
            vec!["clamp-lines:var(--lines)"],
        ],
        vec![],
    ))
    .unwrap();
    assert_eq!(
        result.class_lists[0][0].after.as_deref(),
        Some("text-stroke-width:2px"),
        "{:?}",
        result.class_lists[0][0].notes
    );
    assert_eq!(
        result.class_lists[1][0].after.as_deref(),
        Some("text-stroke-color:#fff")
    );
    assert_eq!(
        result.class_lists[2][0].after.as_deref(),
        Some("text-stroke:red")
    );
    assert_eq!(result.class_lists[3][0].status, "review");
    assert_eq!(result.class_lists[4][0].status, "review");
}
#[test]
fn converts_only_safe_patterns_and_retains_native_values() {
    let source = "@utilities{size:<number|*>{width:--value()}gap-<=spacing>{gap:--value()}}.a{--alpha:--alpha(red,.5)}";
    let result = migrate_rc(&request(vec![], vec![source])).unwrap();
    assert!(
        result.stylesheets[0].notes.is_empty(),
        "{:?}",
        result.stylesheets[0].notes
    );
    let mut output = source.to_owned();
    for edit in result.stylesheets[0].edits.iter().rev() {
        output.replace_range(
            edit.range.start as usize..edit.range.end as usize,
            &edit.after,
        );
    }
    assert!(output.contains("size:<*>"), "{output}");
    assert!(output.contains("gap-<~spacing>"), "{output}");
    assert!(output.contains("--alpha(red,.5)"));
    let rerun = migrate_rc(&request(vec![], vec![&output])).unwrap();
    assert!(rerun.stylesheets[0].edits.is_empty());
    for pattern in ["size:<number>", "size:<auto|none>"] {
        let source = format!("@utilities{{{pattern}{{width:--value()}}}}");
        let result = migrate_rc(&request(vec![], vec![&source])).unwrap();
        assert!(!result.stylesheets[0].notes.is_empty());
        assert!(result.stylesheets[0].edits.is_empty());
    }
}
#[test]
fn combines_adjacent_static_definitions_in_original_order() {
    let source = "@utilities{card{color:red;&:hover{display:block}}card{color:blue}}";
    let result = migrate_rc(&request(vec![], vec![source])).unwrap();
    assert!(
        result.stylesheets[0].notes.is_empty(),
        "{:?}",
        result.stylesheets[0].notes
    );
    assert_eq!(result.stylesheets[0].edits.len(), 1);
    assert_eq!(
        result.stylesheets[0].edits[0].after,
        "card{color:red;&:hover{display:block}\ncolor:blue}"
    );
}

#[test]
fn cross_file_replacement_and_overloads_require_manual_review() {
    let result = migrate_rc(&request(
        vec![],
        vec![
            "@utilities{card{color:red}}",
            "@utilities{card{color:blue}}",
            "@utilities{pair:<number|*>{width:--value()}pair:<color|*>{color:--value()}}",
        ],
    ))
    .unwrap();
    assert!(result.stylesheets[..2].iter().all(|sheet| {
        sheet
            .notes
            .iter()
            .any(|note| note.contains("multiple sources"))
    }));
    assert!(
        result.stylesheets[2]
            .notes
            .iter()
            .any(|note| note.contains("overloaded"))
    );
    assert!(
        result
            .stylesheets
            .iter()
            .all(|sheet| sheet.edits.is_empty())
    );
}

#[test]
fn does_not_activate_previously_unmatched_or_invalid_values() {
    let result = migrate_rc(&request(
        vec![
            vec!["clamp-lines:-3"],
            vec!["text-stroke:foo"],
            vec!["text-stroke:2px:hover@media((width>=40rem))"],
        ],
        vec![],
    ))
    .unwrap();
    assert_eq!(result.class_lists[0][0].status, "review");
    assert_eq!(result.class_lists[1][0].status, "review");
    assert_eq!(
        result.class_lists[2][0].after.as_deref(),
        Some("text-stroke-width:2px:hover@media((width>=40rem))")
    );
}

#[test]
fn unchanged_declarations_do_not_hide_changed_resource_values() {
    let mut request = request(vec![vec!["card"]], vec![]);
    let definition = json!({"id":"card","type":-2,"emit":{"type":"declarations","declarations":["color:var(--color-brand)"]},"matchers":[{"type":"static","name":"card"}]});
    request.manifest = json!({"version":1,"languageVersion":2,"variables":{"color":[{"key":"brand","value":"red"}]},"utilities":[definition.clone()]});
    request.target_manifest = json!({"version":1,"languageVersion":3,"variables":{"color":[{"key":"brand","value":"blue"}]},"utilities":[definition]});
    let result = migrate_rc(&request).unwrap();
    assert_eq!(result.class_lists[0][0].status, "review");
    assert!(
        result.class_lists[0][0]
            .notes
            .iter()
            .any(|note| note.contains("resources")),
        "{:?}",
        result.class_lists[0][0].notes
    );
}
