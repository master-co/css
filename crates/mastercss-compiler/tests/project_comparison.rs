use mastercss_compiler::{
    CompileNativeCssOptions, LowerCssDirectivesOptions, LowerCssDirectivesRequest,
    ProjectComparisonRequest, compare_project_snapshots, compile_css_directives,
    lower_css_directives_request,
};
use serde_json::{Value, json};

fn snapshot(css: &str, classes: &[&str]) -> Value {
    let css = format!(
        "{css}@mixin --bg(--color){{background-color:var(--color)}}@mixin --fg(--color){{color:var(--color)}}"
    );
    let parsed = compile_css_directives(&css, &CompileNativeCssOptions::default()).unwrap();
    let lowered = lower_css_directives_request(
        &LowerCssDirectivesRequest {
            mixin_sources: parsed.mixin_sources,
            native_output: parsed.native_output,
            manifest_input: parsed.manifest_input,
            style_definitions: parsed.style_definitions.unwrap_or_default(),
            warnings: parsed.warnings,
        },
        &LowerCssDirectivesOptions::default(),
    )
    .unwrap();
    json!({"version":1,"manifest":lowered.manifest,"sources":[{"path":"view.html","classes":classes}],"stylesheets":[{"path":"styles.css","css":lowered.css.unwrap_or_default()}],"outputs":[],"excluded":[],"unresolved":[]})
}

fn compare(before: Value, after: Value) -> Value {
    let request: ProjectComparisonRequest =
        serde_json::from_value(json!({"before":before,"after":after})).unwrap();
    serde_json::to_value(compare_project_snapshots(&request).unwrap()).unwrap()
}

#[test]
fn unchanged_classes_retain_transitive_token_consumers() {
    let before =
        "@theme{--color-brand:red;--color-information:red;--color-accent:var(--color-brand)}";
    let after = before.replace("--color-brand:red", "--color-brand:blue");
    let classes = &["bg-brand", "fg-accent", "fg-information"];
    let report = compare(snapshot(before, classes), snapshot(&after, classes));
    let changed = report["classes"].as_array().unwrap();
    assert_eq!(changed.len(), 2, "{report:#}");
    assert_eq!(changed[1]["className"], "fg-accent");
    assert_eq!(
        changed[1]["changedDependencies"],
        json!(["variable:--color-brand"])
    );
    assert_eq!(changed[1]["beforeRules"], changed[1]["afterRules"]);
}

#[test]
fn native_scopes_and_dependent_stylesheets_are_reported() {
    let before = snapshot(
        "@theme{--color-brand:red}.card{color:var(--color-brand)}[data-theme=night]{--color-brand:purple}",
        &["bg-brand", "card"],
    );
    let mut after = before.clone();
    after["stylesheets"][0]["css"] = json!(
        before["stylesheets"][0]["css"]
            .as_str()
            .unwrap()
            .replace("purple", "green")
            .replace("#800080", "green")
    );
    let report = compare(before, after);
    assert_eq!(report["classes"].as_array().unwrap().len(), 2, "{report:#}");
    assert_eq!(report["definitions"][0]["id"], "variable:--color-brand");
    assert_eq!(
        report["classes"][1]["reasons"],
        json!(["native-stylesheet"])
    );
}

#[test]
fn mixin_and_condition_changes_preserve_rule_evidence() {
    let source = "@custom-media --small (width>30rem);@mixin --columns(--n <integer>){display:grid;grid-template-columns:repeat(var(--n),1fr)}";
    let after = source.replace("30rem", "40rem").replace("1fr", "2fr");
    let report = compare(
        snapshot(source, &["columns(2)@small"]),
        snapshot(&after, &["columns(2)@small"]),
    );
    assert_eq!(
        report["definitions"].as_array().unwrap().len(),
        2,
        "{report:#}"
    );
    assert_ne!(
        report["classes"][0]["beforeRules"],
        report["classes"][0]["afterRules"]
    );
    assert_eq!(
        report["classes"][0]["changedDependencies"],
        json!(["custom-media:--small", "mixin:--columns"])
    );
}

#[test]
fn identical_snapshots_are_empty_and_invalid_versions_fail() {
    let state = snapshot("@theme{--color-brand:red}", &["bg-brand"]);
    let result = compare(state.clone(), state.clone());
    for key in ["definitions", "classes", "stylesheets", "outputs", "files"] {
        assert_eq!(result[key], json!([]));
    }
    let mut after = state.clone();
    after["version"] = json!(99);
    let request = serde_json::from_value(json!({"before":state,"after":after})).unwrap();
    assert!(
        compare_project_snapshots(&request)
            .unwrap_err()
            .to_string()
            .contains("version 99")
    );
}

#[test]
fn source_offset_changes_do_not_report_recipe_behavior_changes() {
    let before = snapshot("@mixin --button{color:red}", &["button"]);
    let after = snapshot(
        "/* moved definition */ @mixin --button{color:red}",
        &["button"],
    );
    let report = compare(before, after);
    assert_eq!(report["definitions"], json!([]));
    assert_eq!(report["classes"], json!([]));
}

#[test]
fn inline_tokens_remain_authoring_dependencies_after_substitution() {
    let source = "@theme inline{--color-brand:red}@mixin --button{color:var(--color-brand)}";
    let classes = &["fg-brand", "color:var(--color-brand)", "button"];
    let report = compare(
        snapshot(source, classes),
        snapshot(&source.replace("red", "blue"), classes),
    );
    for change in report["classes"].as_array().unwrap() {
        assert_eq!(
            change["changedDependencies"],
            json!(["variable:--color-brand"]),
            "{report:#}"
        );
    }
    assert_eq!(report["classes"].as_array().unwrap().len(), 3);
}

#[test]
fn unresolved_directives_and_duplicate_asset_identities_are_rejected() {
    let before = snapshot("", &[]);
    for stylesheets in [
        json!([{"path":"a.css","css":"@theme{--color-brand:red}"}]),
        json!([{"path":"a.css","css":""},{"path":"a.css","css":""}]),
    ] {
        let mut after = before.clone();
        after["stylesheets"] = stylesheets;
        let request = serde_json::from_value(json!({"before":before,"after":after})).unwrap();
        assert!(compare_project_snapshots(&request).is_err());
    }
}

#[test]
fn nested_recipe_dependencies_and_usage_moves_are_visible() {
    let source = "@mixin --inner{color:red}@mixin --outer{@apply --inner}";
    let mut after = snapshot(&source.replace("red", "blue"), &["outer"]);
    after["sources"][0]["path"] = json!("moved.html");
    let report = compare(snapshot(source, &["outer"]), after);
    assert!(
        report["classes"][0]["changedDependencies"]
            .as_array()
            .unwrap()
            .contains(&json!("mixin:--inner"))
    );
    assert!(
        report["classes"][0]["reasons"]
            .as_array()
            .unwrap()
            .contains(&json!("usage-membership"))
    );
    assert_eq!(
        report["classes"][0]["files"],
        json!(["moved.html", "view.html"])
    );
}

#[test]
fn keyframes_follow_transitive_values_and_dynamic_names() {
    let source =
        "@prune native;@theme{--color-brand:red;}@keyframes pulse{to{color:var(--color-brand)}}";
    let classes = &["animation:pulse|1s", "animation-name:var(--motion)"];
    let report = compare(
        snapshot(source, classes),
        snapshot(&source.replace("red", "blue"), classes),
    );
    assert_eq!(report["classes"].as_array().unwrap().len(), 2, "{report:#}");
    assert!(
        report["classes"][0]["changedDependencies"]
            .as_array()
            .unwrap()
            .contains(&json!("variable:--color-brand"))
    );
}

#[test]
fn delivery_order_layers_duplicates_and_coverage_are_preserved() {
    let mut before = snapshot("", &["card"]);
    before["stylesheets"] = json!([{"path":"a.css","css":"@layer components{.card{color:red;color:blue}}"},{"path":"b.css","css":"@layer utilities{.card{color:green}}"}]);
    before["outputs"] = before["stylesheets"].clone();
    let mut after = before.clone();
    after["stylesheets"].as_array_mut().unwrap().reverse();
    after["outputs"].as_array_mut().unwrap().reverse();
    after["unresolved"] = json!(["cms"]);
    after["excluded"] = json!(["vendor/**"]);
    let report = compare(before, after);
    assert_eq!(report["stylesheetOrderChanged"], true);
    assert_eq!(report["outputOrderChanged"], true);
    assert_eq!(
        report["classes"][0]["reasons"],
        json!(["native-stylesheet"])
    );
    assert_eq!(report["coverage"]["unresolved"], json!(["cms"]));
    assert_eq!(report["coverage"]["browser"], "not-checked");
}
