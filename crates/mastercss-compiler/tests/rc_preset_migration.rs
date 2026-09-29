use mastercss_compiler::{
    CompileManifestOptions, CompileNativeCssOptions, RcMigrationRequest, compile_css_directives,
    compile_manifest_input, migrate_rc,
};
use serde_json::{Value, json};

fn manifest(source: &str) -> Value {
    let parsed = compile_css_directives(source, &CompileNativeCssOptions::default()).unwrap();
    compile_manifest_input(&parsed.manifest_input, &CompileManifestOptions::default())
        .unwrap()
        .manifest
}

fn migrate(source: &str, classes: &[&str]) -> mastercss_compiler::RcMigrationResult {
    let mut saved = manifest(source);
    let target = saved.clone();
    saved["version"] = json!(3);
    saved["languageVersion"] = json!(5);
    let request: RcMigrationRequest = serde_json::from_value(json!({"from":"rc-preset","sourceVersion":"2.0.0-rc.1", "manifest":saved,"targetManifest":target,"classLists":[classes]})).unwrap();
    migrate_rc(&request).unwrap()
}

#[test]
fn removed_recipes_expand_equivalently_with_every_modifier() {
    let result = migrate(
        "@mixin --fit{width:fit-content;height:fit-content}@mixin --full{width:100%;height:100%}@mixin --center{left:0;right:0;margin-left:auto;margin-right:auto}@mixin --middle{top:0;bottom:0;margin-top:auto;margin-bottom:auto}@mixin --round{border-radius:50%;aspect-ratio:1/1}",
        &[
            "fit:hover!",
            "full",
            "center",
            "middle",
            "round",
            "{fit;round}:focus",
        ],
    );
    assert_eq!(result.class_lists[0][5].status, "review");
    assert!(result.class_lists[0][5].after.is_none());
    let after = result.class_lists[0][..5]
        .iter()
        .map(|item| item.after.as_deref().unwrap())
        .collect::<Vec<_>>();
    assert_eq!(
        after,
        [
            "width:fit-content:hover! height:fit-content:hover!",
            "width:100% height:100%",
            "left:0 right:0 margin-left:auto margin-right:auto",
            "top:0 bottom:0 margin-top:auto margin-bottom:auto",
            "border-radius:50% aspect-ratio:1/1",
        ]
    );
}

#[test]
fn old_namespace_precedence_is_resolved_before_rewriting() {
    let result = migrate(
        "@theme{:root{--color-muted:red;--color-text-muted:gray;--color-text-body:black;--color-divider:green;--color-line-divider:silver;--color-surface-base:white}}",
        &[
            "fg-muted",
            "fg-body/.5:hover",
            "b-divider",
            "outline-divider",
            "stroke-divider",
            "caret-color-muted",
            "text-fill-color-muted",
            "border-inline-start-divider",
            "surface-base",
        ],
    );
    let after = result.class_lists[0]
        .iter()
        .map(|item| item.after.as_deref().unwrap())
        .collect::<Vec<_>>();
    assert_eq!(
        after,
        [
            "fg-muted",
            "fg-text-body/.5:hover",
            "b-line-divider",
            "outline-line-divider",
            "stroke-line-divider",
            "caret-color-text-muted",
            "text-fill-color-text-muted",
            "border-inline-start-line-divider",
            "bg-surface-base"
        ]
    );
}

#[test]
fn custom_mixins_and_family_reservations_are_never_overwritten() {
    let result = migrate(
        "@mixin --fit{color:red}@mixin --surface(--name <string>){color:red}@mixin --fg-body{color:blue}@theme{:root{--color-surface-base:white;--color-text-body:black}}",
        &["fit", "surface-base", "fg-body"],
    );
    assert!(
        result.class_lists[0]
            .iter()
            .all(|item| item.after.as_deref() == Some(&item.before))
    );
}

#[test]
fn expanding_recipes_with_overlapping_declarations_requires_review() {
    let result = migrate(
        "@mixin --round{border-radius:50%;aspect-ratio:1/1}",
        &["round", "border-radius:2px"],
    );
    assert_eq!(result.class_lists[0][0].status, "review");
    assert!(
        result.class_lists[0][0]
            .after
            .as_ref()
            .unwrap()
            .contains("aspect-ratio:1/1")
    );
}

#[test]
fn removed_class_syntax_requires_manual_migration() {
    let result = migrate(
        "@mixin --fit{width:fit-content;height:fit-content}",
        &[
            "{fit}",
            "{fit;display:block}:hover!",
            "{{fit};display:block}",
            "{fit",
            "fit:of(.active)",
            "display:block:is(:of(.active))",
        ],
    );
    for item in &result.class_lists[0] {
        assert_eq!(item.status, "review", "{item:?}");
        assert!(item.after.is_none(), "{item:?}");
    }
}
