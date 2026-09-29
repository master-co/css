use mastercss_compiler::{
    CompileManifestOptions, CompileNativeCssOptions, compile_css_directives, compile_manifest_input,
};
use mastercss_engine::EngineSession;

fn engine(source: &str) -> EngineSession {
    let parsed = compile_css_directives(source, &CompileNativeCssOptions::default()).unwrap();
    let manifest =
        compile_manifest_input(&parsed.manifest_input, &CompileManifestOptions::default())
            .unwrap()
            .manifest;
    EngineSession::create(&manifest.to_string()).unwrap()
}
const SOURCE: &str = "@theme{:root{--animate-fade:fade 1s;--color-brand:red}@keyframes fade{from{opacity:0}to{opacity:1;color:var(--color-brand)}}@keyframes pop{to{transform:scale(2)}}}";

#[test]
fn managed_keyframes_follow_last_usage_and_keep_body_tokens() {
    let mut engine = engine(SOURCE);
    assert!(engine.css_text().is_empty());
    engine
        .ensure_class_rules(["animate-fade", "animation-name:fade"])
        .unwrap();
    let text = engine.css_text();
    assert!(text.contains("@keyframes fade"), "{text}");
    assert!(!text.contains("@keyframes pop"));
    assert!(text.contains("--color-brand:red"));
    assert_eq!(text.matches("@keyframes fade").count(), 1);
    engine.delete_class_rules(["animate-fade"]).unwrap();
    assert!(engine.css_text().contains("@keyframes fade"));
    engine.delete_class_rules(["animation-name:fade"]).unwrap();
    assert_eq!(engine.css_text(), "");
}

#[test]
fn dynamic_names_keep_all_until_the_root_disappears() {
    let mut engine = engine(SOURCE);
    engine
        .ensure_class_rules(["animation:var(--external)"])
        .unwrap();
    assert_eq!(engine.snapshot().unwrap().resources.keyframes.len(), 2);
    engine
        .delete_class_rules(["animation:var(--external)"])
        .unwrap();
    assert!(engine.css_text().is_empty());
}

#[test]
fn all_scopes_and_nested_fallbacks_are_kept() {
    let mut engine = engine(&format!("{SOURCE}@theme{{.dark{{--animate-fade:pop 2s}}}}"));
    engine.ensure_class_rules(["animate-fade"]).unwrap();
    assert_eq!(engine.snapshot().unwrap().resources.keyframes.len(), 2);
}

#[test]
fn stylesheet_roots_and_emitted_globals_pin_without_duplicates() {
    let mut compiler = engine(SOURCE);
    compiler
        .ensure_stylesheet_resources(".caption{animation:fade 1s}")
        .unwrap();
    let globals = compiler.emitted_globals_snapshot().unwrap();
    assert_eq!(globals.keyframes.get("fade"), Some(&1));
    let mut runtime = EngineSession::create_with_emitted_globals(
        &compiler.manifest_json().unwrap(),
        Some(&serde_json::to_string(&globals).unwrap()),
    )
    .unwrap();
    runtime.ensure_class_rules(["animate-fade"]).unwrap();
    assert!(!runtime.css_text().contains("@keyframes"));
    runtime.delete_class_rules(["animate-fade"]).unwrap();
    assert!(!runtime.css_text().contains("@keyframes"));
    runtime.replace_emitted_globals("{}").unwrap();
    runtime.ensure_class_rules(["animation-name:fade"]).unwrap();
    assert!(runtime.css_text().contains("@keyframes fade"));
}

#[test]
fn definition_replacement_uses_final_order_and_clears_old_dependencies() {
    let mut engine = engine(&format!(
        "{SOURCE}@theme{{@keyframes fade{{to{{opacity:.5}}}}}}"
    ));
    engine
        .ensure_class_rules(["animation:var(--external)"])
        .unwrap();
    let text = engine.css_text();
    assert!(text.find("@keyframes pop").unwrap() < text.find("@keyframes fade").unwrap());
    assert!(!text.contains("--color-brand"));
}

#[test]
fn only_animation_declarations_create_roots() {
    let mut engine = engine(SOURCE);
    engine
        .ensure_stylesheet_resources(
            r#".x{content:"animation:fade 1s";--unused:pop 1s}/* animation:fade */"#,
        )
        .unwrap();
    assert!(!engine.css_text().contains("@keyframes"));
    engine
        .ensure_class_rules(["animation:fade|1s,pop|2s"])
        .unwrap();
    assert_eq!(engine.snapshot().unwrap().resources.keyframes.len(), 2);
}

#[test]
fn rejects_nested_registration_and_contents_directives() {
    for source in [
        "@theme{:root{@keyframes x{to{opacity:1}}}}",
        "@theme{@media all{@keyframes x{to{opacity:1}}}}",
        "@theme{@keyframes x{to{@apply --x;}}}",
    ] {
        assert!(
            compile_css_directives(source, &CompileNativeCssOptions::default()).is_err(),
            "{source}"
        );
    }
}

#[test]
fn native_overrides_are_included_in_class_analysis() {
    let mut engine = engine(&format!("{SOURCE}.dark{{--animate-fade:pop 2s}}"));
    engine.ensure_class_rules(["animate-fade"]).unwrap();
    assert_eq!(engine.snapshot().unwrap().resources.keyframes.len(), 2);
}

#[test]
fn native_managed_name_collisions_report_both_definitions() {
    let error = compile_css_directives(
        &format!("{SOURCE}@keyframes fade{{to{{opacity:.3}}}}"),
        &CompileNativeCssOptions::default(),
    )
    .unwrap_err();
    assert!(
        error
            .to_string()
            .contains("conflicts with managed keyframes defined at")
    );
}

#[test]
fn escaped_names_strings_keywords_and_case_follow_css_identity() {
    let mut engine = engine(
        r#"@theme{@keyframes \66 ade{to{opacity:1}}@keyframes Fade{to{opacity:.5}}@keyframes linear{to{opacity:.2}}}"#,
    );
    engine
        .ensure_class_rules([r#"animation-name:"fade""#, "animation:linear|1s|linear"])
        .unwrap();
    let snapshot = engine.snapshot().unwrap();
    assert_eq!(
        snapshot
            .resources
            .keyframes
            .iter()
            .map(|frame| frame.name.as_str())
            .collect::<Vec<_>>(),
        ["fade", "linear"]
    );
    assert!(!snapshot.text.contains("@keyframes Fade"));
}

#[test]
fn refresh_replaces_body_dependencies_and_external_snapshot_releases_roots() {
    let mut engine = engine(SOURCE);
    engine.ensure_class_rules(["animate-fade"]).unwrap();
    let mut next: serde_json::Value =
        serde_json::from_str(&engine.manifest_json().unwrap()).unwrap();
    next["keyframes"][0]["text"] = serde_json::json!("@keyframes fade{to{opacity:.3}}");
    next["keyframes"][0]["dependencies"] = serde_json::json!([]);
    let transition = engine.refresh(&next.to_string()).unwrap();
    assert!(transition.mutations.iter().any(|mutation| matches!(
        mutation,
        mastercss_schema::RuleMutationIr::Delete {
            target: mastercss_schema::RuleTarget::Keyframes,
            ..
        }
    )));
    assert!(!engine.css_text().contains("--color-brand"));
    assert!(engine.css_text().contains("opacity:.3"));
}

#[test]
fn dynamic_diagnostic_does_not_turn_a_valid_class_into_an_error() {
    let engine = engine(SOURCE);
    let inspection = engine.inspect("animation:var(--external)").unwrap();
    assert_eq!(
        inspection.match_status,
        mastercss_schema::MatchStatus::Matched
    );
    assert_eq!(
        inspection.diagnostics[0].severity,
        mastercss_schema::DiagnosticSeverity::Info
    );
}

#[test]
fn externally_delivered_keyframes_still_own_unprovided_body_tokens() {
    let mut engine = engine(SOURCE);
    engine
        .replace_emitted_globals(r#"{"keyframes":{"fade":1}}"#)
        .unwrap();
    assert!(engine.css_text().contains("--color-brand:red"));
    assert!(!engine.css_text().contains("@keyframes"));
    engine.ensure_class_rules(["animation-name:fade"]).unwrap();
    engine.delete_class_rules(["animation-name:fade"]).unwrap();
    assert!(engine.css_text().contains("--color-brand:red"));
    engine.replace_emitted_globals("{}").unwrap();
    assert!(engine.css_text().is_empty());
}

#[test]
fn cyclic_animation_and_body_tokens_release_with_the_last_root() {
    let mut engine = engine(
        "@theme{:root{--motion:var(--cycle);--cycle:var(--motion);--a:var(--b);--b:var(--a)}@keyframes one{to{opacity:var(--a,1)}}@keyframes two{to{opacity:0}}}",
    );
    engine
        .ensure_class_rules(["animation:var(--motion)"])
        .unwrap();
    let snapshot = engine.snapshot().unwrap();
    assert_eq!(snapshot.resources.keyframes.len(), 2);
    assert!(snapshot.text.contains("--a:var(--b)"));
    engine
        .delete_class_rules(["animation:var(--motion)"])
        .unwrap();
    assert!(engine.css_text().is_empty());
    assert!(engine.snapshot().unwrap().resources.variables.is_empty());
}
