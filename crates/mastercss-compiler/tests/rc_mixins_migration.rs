use mastercss_compiler::{RcMigrationRequest, migrate_rc};
use serde_json::json;

fn migrate(classes: &[&str], stylesheets: &[&str]) -> mastercss_compiler::RcMigrationResult {
    let target: serde_json::Value = serde_json::from_str(include_str!(
        "../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    let request: RcMigrationRequest = serde_json::from_value(json!({
        "from":"rc-mixins", "sourceVersion":"2.0.0-rc.1", "manifest":{"version":2,"languageVersion":4},
        "targetManifest": target, "classLists":[classes], "stylesheets":stylesheets
    })).unwrap();
    migrate_rc(&request).unwrap()
}

#[test]
fn converts_static_properties_and_parameter_recipes_without_reinterpreting_tokens() {
    let result = migrate(
        &[
            "block:hover@sm",
            "p:1rem",
            "bg:#fff",
            "r:2px",
            "grid-cols:3@sm",
            "grid-rows:4",
            "p-md",
            "p-4",
            "grid-cols-3",
        ],
        &[],
    );
    let after: Vec<_> = result.class_lists[0]
        .iter()
        .map(|item| item.after.as_deref().unwrap())
        .collect();
    assert_eq!(
        after,
        [
            "display:block:hover@sm",
            "padding:1rem",
            "background:#fff",
            "border-radius:2px",
            "grid-cols(3)@sm",
            "grid-rows(4)",
            "p-md",
            "p-4",
            "grid-cols-3"
        ]
    );
    assert!(
        result.class_lists[0][..7]
            .iter()
            .all(|item| item.status != "review")
    );
}

#[test]
fn dynamic_arguments_invalid_counts_and_previous_typography_require_review() {
    let result = migrate(
        &["grid-cols:var(--cols)", "grid-col-span:0", "text:24px"],
        &[],
    );
    assert!(
        result.class_lists[0]
            .iter()
            .all(|item| item.status == "review" && item.after.is_none())
    );
    assert!(result.class_lists[0][0].notes[0].contains("native CSS"));
    assert!(result.class_lists[0][2].notes[0].contains("line-height"));
}

#[test]
fn rewrites_safe_definitions_and_reports_cross_namespace_families() {
    let result = migrate(
        &[],
        &[
            "@utility card { color:red; color:blue }",
            "@utility tile:*{width:--master-value()}",
            "@utility font-* from(--font-size-*){font-size:--master-value()}",
        ],
    );
    assert_eq!(
        result.stylesheets[0].edits[0].after,
        "@utility card { color:red; color:blue }"
    );
    assert_eq!(
        result.stylesheets[1].edits[0].after,
        "@utility tile(--value) {width:var(--value)}"
    );
    assert_eq!(
        result.stylesheets[2].edits[0].after,
        "@utility font-(--font-size){font-size:var(--font-size)}"
    );
}

#[test]
fn color_typography_overlap_is_not_guessed() {
    let target: serde_json::Value = serde_json::from_str(include_str!(
        "../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    let request: RcMigrationRequest = serde_json::from_value(json!({
        "from":"rc-mixins", "sourceVersion":"2.0.0-rc.1",
        "manifest":{"version":2,"languageVersion":4,"variables":{"color-text":[{"key":"body"},{"key":"sm"}],"font-size":[{"key":"sm"}]}},
        "targetManifest":target,"classLists":[["text-body/.5:hover","text-sm"]]
    })).unwrap();
    let result = migrate_rc(&request).unwrap();
    assert_eq!(
        result.class_lists[0][0].after.as_deref(),
        Some("fg-text-body/.5:hover")
    );
    assert_eq!(result.class_lists[0][1].status, "review");
    assert!(result.class_lists[0][1].after.is_none());
}

#[test]
fn native_colon_values_win_over_historical_fixed_names_and_migration_is_idempotent() {
    let first = migrate(&["flex:1", "top:20px", "top", "block:hover"], &[]);
    let classes = first.class_lists[0]
        .iter()
        .map(|item| item.after.as_deref().unwrap())
        .collect::<Vec<_>>();
    assert_eq!(
        classes,
        ["flex:1", "top:20px", "top:0", "display:block:hover"]
    );
    let second = migrate(&classes, &[]);
    assert!(
        second.class_lists[0]
            .iter()
            .all(|item| item.before == item.after.as_deref().unwrap())
    );
}

#[test]
fn removed_token_spellings_require_manual_review_without_new_migrations() {
    let result = migrate(&["font-size-sm", "padding-md"], &[]);
    for item in &result.class_lists[0] {
        assert_eq!(item.status, "review", "{}", item.before);
        assert!(item.after.is_none());
        assert!(
            item.notes
                .iter()
                .any(|note| note.contains("canonical family"))
        );
    }
    for item in &migrate(&["font-sm", "font-sans", "font-bold"], &[]).class_lists[0] {
        assert_eq!(item.status, "unchanged");
        assert_eq!(item.after.as_deref(), Some(item.before.as_str()));
    }
}
