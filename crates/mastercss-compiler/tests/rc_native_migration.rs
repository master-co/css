use mastercss_compiler::{RcMigrationRequest, migrate_rc};
use serde_json::{Value, json};
fn request(classes: Vec<Vec<&str>>, stylesheets: Vec<&str>) -> RcMigrationRequest {
    let manifest: Value = serde_json::from_str(include_str!(
        "../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    serde_json::from_value(json!({"from":"rc-native","sourceVersion":"2.0.0-rc.native","manifest":manifest,"targetManifest":manifest,"classLists":classes,"stylesheets":stylesheets})).unwrap()
}
#[test]
fn native_profile_preserves_modes_and_moves_complex_queries_deterministically() {
    let input = request(
        vec![
            vec!["display:block@media(screen|and|(width>=50rem))"],
            vec!["p:2px@supports(selector(:has(*)))"],
        ],
        vec![],
    );
    let result = migrate_rc(&input).unwrap();
    assert!(!result.configuration_css.contains("@mode"));
    assert!(!result.configuration_css.contains("color-scheme"));
    assert!(
        result
            .configuration_css
            .contains("@media screen and (width>=50rem)")
    );
    assert!(
        result
            .configuration_css
            .contains("@supports selector(:has(*))")
    );
    assert!(
        result
            .class_lists
            .iter()
            .all(|list| list[0].status == "replace"),
        "{:?}",
        result.class_lists
    );
    let reversed = migrate_rc(&request(
        vec![
            vec!["p:2px@supports(selector(:has(*)))"],
            vec!["display:block@media(screen|and|(width>=50rem))"],
        ],
        vec![],
    ))
    .unwrap();
    assert_eq!(result.configuration_css, reversed.configuration_css);
    assert_eq!(
        result.class_lists[0][0].after,
        reversed.class_lists[1][0].after
    );
}
#[test]
fn alpha_macro_migrates_only_proven_declaration_calls() {
    let result = migrate_rc(&request(
        vec![],
        vec![".a{color:--alpha(var(--color-brand) / .5);--money:$100;--pipe:a|b}"],
    ))
    .unwrap();
    assert!(result.stylesheets[0].notes.is_empty());
    assert_eq!(result.stylesheets[0].edits.len(), 1);
    assert_eq!(
        result.stylesheets[0].edits[0].after,
        "color-mix(in oklab,var(--color-brand) 50%,transparent)"
    );
    let native = migrate_rc(&request(
        vec![],
        vec![
            "@function --alpha(--x){result:var(--x)}",
            ".a{color:--alpha(red / .5)}",
        ],
    ))
    .unwrap();
    assert!(native.stylesheets[1].edits.is_empty());
    assert!(!native.stylesheets[1].notes.is_empty());
}
#[test]
fn literal_pipe_and_invalid_old_queries_require_manual_review() {
    let result = migrate_rc(&request(
        vec![
            vec!["display:block@supports(selector([lang|=en]))"],
            vec!["display:block@media(width>=800px)"],
        ],
        vec![],
    ))
    .unwrap();
    assert!(
        result
            .class_lists
            .iter()
            .all(|list| list[0].status == "review")
    );
    assert!(result.configuration_css.is_empty());
}

#[test]
fn repeated_native_migration_reuses_authored_variant_definitions() {
    let first = migrate_rc(&request(
        vec![vec!["block@supports(selector(:has(*)))"]],
        vec![],
    ))
    .unwrap();
    let class = first.class_lists[0][0].after.as_ref().unwrap();
    let second = migrate_rc(&request(vec![vec![class]], vec![&first.configuration_css])).unwrap();
    assert_eq!(second.class_lists[0][0].status, "unchanged");
    assert!(second.configuration_css.is_empty());
    assert!(second.stylesheets[0].edits.is_empty());
}
