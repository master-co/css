use mastercss_compiler::{RcMigrationRequest, migrate_rc};
use serde_json::{Value, json};
fn request(classes: Vec<Vec<&str>>, stylesheets: Vec<&str>) -> RcMigrationRequest {
    let manifest: Value = serde_json::from_str(include_str!(
        "../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    serde_json::from_value(json!({"from":"rc-managed","sourceVersion":"2.0.0-rc.managed","manifest":manifest,"targetManifest":manifest,"classLists":classes,"stylesheets":stylesheets})).unwrap()
}
#[test]
fn migrates_static_names_without_rewriting_native_values_or_nested_rules() {
    let source = "@defaults{wide{width:10px}}@components{card{color:red;&:hover{color:blue}@compose display:block;}}";
    let result = migrate_rc(&request(vec![vec!["card"]], vec![source])).unwrap();
    assert!(result.notes.is_empty());
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
    assert_eq!(
        output,
        "@layer defaults{.wide{width:10px}}@layer components{.card{color:red;&:hover{color:blue}@compose display:block;}}"
    );
    let second = migrate_rc(&request(vec![vec!["card"]], vec![&output])).unwrap();
    assert!(second.stylesheets[0].edits.is_empty());
    assert!(second.stylesheets[0].notes.is_empty());
    assert_eq!(second.class_lists[0][0].status, "unchanged");
    assert_eq!(result.behavior_changes.len(), 2);
}
#[test]
fn reports_cross_file_compose_derived_classes_patterns_and_cascade_conflicts() {
    let result = migrate_rc(&request(
        vec![vec!["card:hover@sm"]],
        vec![
            "@components{zebra{color:red}card{color:blue}size-<sm|lg>{width:$value}}",
            ".other{@compose card;}@safelist card;",
        ],
    ))
    .unwrap();
    assert_eq!(result.class_lists[0][0].status, "review");
    assert!(
        result.stylesheets[0]
            .notes
            .iter()
            .any(|note| note.contains("source order"))
    );
    assert!(
        result.stylesheets[0]
            .notes
            .iter()
            .any(|note| note.contains("pattern"))
    );
    assert!(
        result.stylesheets[1]
            .notes
            .iter()
            .any(|note| note.contains("@compose") && note.contains("UTF-16"))
    );
    assert!(
        result.stylesheets[1]
            .notes
            .iter()
            .any(|note| note.contains("@safelist"))
    );
}
#[test]
fn preserves_rc_managed_queries_functions_and_numeric_values() {
    let source = "@layer components{.card{color:--alpha(red,.5)}}";
    let result = migrate_rc(&request(
        vec![vec!["width:3", "color:red@sm"]],
        vec![source],
    ))
    .unwrap();
    assert!(result.stylesheets[0].edits.is_empty());
    assert!(
        result.class_lists[0]
            .iter()
            .all(|item| item.status == "unchanged")
    );
    assert!(result.configuration_css.is_empty());
}

#[test]
fn nested_names_and_shorthand_conflicts_require_review() {
    let result = migrate_rc(&request(
        vec![vec!["card:hover"]],
        vec![
            "@components{@media (width>1px){zebra{padding-left:1px}card{padding:2px}}}",
            ".a{@compose card;}",
        ],
    ))
    .unwrap();
    assert_eq!(result.class_lists[0][0].status, "review");
    assert!(
        result.stylesheets[0]
            .notes
            .iter()
            .any(|note| note.contains("source order"))
    );
    assert!(
        result.stylesheets[1]
            .notes
            .iter()
            .any(|note| note.contains("@compose"))
    );
}

#[test]
fn cross_file_cascade_and_dynamic_class_uses_are_reported() {
    let mut input = request(
        vec![],
        vec![
            "@components{a{padding:1px}}",
            "@components{b{padding-left:2px}}",
        ],
    );
    input.documents = vec!["<div className={kind + ':hover'} />".into()];
    let result = migrate_rc(&input).unwrap();
    assert!(
        result.stylesheets[1]
            .notes
            .iter()
            .any(|note| note.contains("stylesheet 1") && note.contains("source order"))
    );
    assert!(
        result.documents[0]
            .iter()
            .any(|note| note.contains("line 1") && note.contains("Dynamic"))
    );
}

#[test]
fn manual_review_locations_use_utf16_columns() {
    let source = "/*😀*/@components{paint-<a|b>{color:--value()}}";
    let result = migrate_rc(&request(vec![], vec![source])).unwrap();
    let column = source[..source.find("paint-").unwrap()]
        .encode_utf16()
        .count()
        + 1;
    assert!(
        result.stylesheets[0]
            .notes
            .iter()
            .any(|note| note.starts_with(&format!("1:{column}:")))
    );
}
