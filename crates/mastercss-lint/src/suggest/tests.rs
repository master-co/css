use super::*;

const PRESET: &str = include_str!("../../../../packages/preset/src/default-manifest.json");

#[test]
fn suggests_manifest_utilities_without_replacing_literal_values_with_tokens() {
    let lint = LintSession::create(PRESET).unwrap();
    let result = lint
        .suggest_classes("display: flex; align-items: center; padding: 16px; gap: 1rem;")
        .unwrap();
    assert_eq!(result.status, "suggested");
    assert_eq!(
        result.classes,
        ["flex", "items-center", "p(16)", "(gap:1rem)"]
    );
    assert!(result.css.contains("padding:calc(16 * 1px)"));
    assert!(result.verification.declarations);
    assert!(!result.verification.cascade);
    assert!(!result.verification.browser);
}

#[test]
fn retains_explicit_token_identity_and_important() {
    let lint = LintSession::create(PRESET).unwrap();
    let result = lint
        .suggest_classes("padding: var(--spacing-md); display: flex !IMPORTANT")
        .unwrap();
    assert_eq!(result.classes, ["p-md", "flex!"]);
    assert!(result.declarations[1].important);
    assert!(result.css.contains("!important"));
    assert_eq!(
        lint.suggest_classes("color:var(--app-brand)")
            .unwrap()
            .classes,
        ["(color:var(--app-brand))"]
    );
}

#[test]
fn does_not_change_invalid_negative_lengths_into_computed_value_clamping() {
    let lint = LintSession::create(PRESET).unwrap();
    assert_eq!(
        lint.suggest_classes("padding:-1px").unwrap().classes,
        ["(padding:-1px)"]
    );
    assert_eq!(
        lint.suggest_classes("width:-1px!important")
            .unwrap()
            .classes,
        ["(width:-1px)!"]
    );
}

#[test]
fn preserves_native_variable_references_when_inline_theme_would_substitute_them() {
    let mut manifest: serde_json::Value = serde_json::from_str(PRESET).unwrap();
    let variable = manifest["variables"]["spacing"]
        .as_array_mut()
        .unwrap()
        .iter_mut()
        .find(|v| v["key"] == "md")
        .unwrap();
    for value in variable["values"].as_array_mut().unwrap() {
        value["inline"] = true.into();
    }
    let lint = LintSession::create(&manifest.to_string()).unwrap();
    let result = lint.suggest_classes("padding:var(--spacing-md)").unwrap();
    assert_eq!(result.status, "preserved");
    assert_eq!(result.remaining_css, "padding:var(--spacing-md)");
}

#[test]
fn retains_complete_blocks_when_order_or_encoding_needs_review() {
    let lint = LintSession::create(PRESET).unwrap();
    for input in [
        "display:block;display:flex",
        "padding:1rem;padding-left:0",
        "margin-left:1rem;margin-inline:0",
        "font:16px sans-serif;line-height:2",
        "gap:1rem;row-gap:0",
        "gap:1rem;grid-gap:0",
        "columns:2;column-width:8rem",
        "overflow-wrap:anywhere;word-wrap:normal",
        "break-before:page;page-break-before:auto",
        "-webkit-line-clamp:2;max-lines:3",
        "all:unset;color:red",
        "color:red; &:hover { color:blue }",
        "@media print { color:red }",
        "--brand:red;color:red",
        "color:red/*keep*/",
        "content:'a b'",
        "content:'a\\20 b'",
        "color:var(--x",
        "color:red;}x{color:blue",
        "width:calc(1px | 2px)",
        "future-property:1",
        "background-image:url('./icon.svg')",
        "background-image:image-set('./icon.svg' 1x)",
        "color:red;broken",
        "color:red!important!important",
    ] {
        let result = lint.suggest_classes(input).unwrap();
        assert_eq!(result.status, "preserved", "{input}");
        assert_eq!(result.remaining_css, input);
        assert!(result.classes.is_empty());
        assert!(result.css.is_empty());
    }
}

#[test]
fn nested_functions_and_strings_keep_component_values() {
    let lint = LintSession::create(PRESET).unwrap();
    let result = lint
        .suggest_classes("width: calc(100% - 2rem); content: 'a;b:c';")
        .unwrap();
    assert_eq!(
        result.classes,
        ["(width:calc(100%|-|2rem))", "(content:'a;b:c')"]
    );
    assert!(result.css.contains("calc(100% - 2rem)"));
    assert!(result.css.contains("'a;b:c'"));
}

#[test]
fn project_overrides_are_executed_and_recipes_are_not_inverted() {
    let mut manifest: serde_json::Value = serde_json::from_str(PRESET).unwrap();
    let utilities = manifest["utilities"].as_array_mut().unwrap();
    utilities.push(serde_json::json!({"kind":"static","name":"flex","body":[{"type":"declaration","property":"display","value":[{"type":"text","value":"grid"}]}]}));
    utilities.push(serde_json::json!({"kind":"static","name":"product-flex","body":[{"type":"declaration","property":"display","value":[{"type":"text","value":"flex"}]}]}));
    let lint = LintSession::create(&manifest.to_string()).unwrap();
    assert_eq!(
        lint.suggest_classes("display:flex").unwrap().classes,
        ["product-flex"]
    );
    assert_eq!(
        lint.suggest_classes("display:grid").unwrap().classes,
        ["flex"]
    );
}

#[test]
fn utility_importance_must_match_the_authored_declaration() {
    let mut manifest: serde_json::Value = serde_json::from_str(PRESET).unwrap();
    manifest["utilities"].as_array_mut().unwrap().push(serde_json::json!({
        "kind":"static", "name":"flex", "body":[{
            "type":"declaration", "property":"display", "value":[{"type":"text","value":"flex!important"}]
        }]
    }));
    let lint = LintSession::create(&manifest.to_string()).unwrap();
    assert_eq!(
        lint.suggest_classes("display:flex").unwrap().classes,
        ["(display:flex)"]
    );
}

#[test]
fn empty_and_disposed_sessions_are_truthful() {
    let mut lint = LintSession::create(PRESET).unwrap();
    assert!(lint.suggest_classes("").unwrap().classes.is_empty());
    lint.dispose();
    assert!(lint.suggest_classes("display:flex").is_err());
}
