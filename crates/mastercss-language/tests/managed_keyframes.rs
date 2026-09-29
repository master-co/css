use mastercss_language::LanguageSession;
use serde_json::json;

#[test]
fn managed_names_complete_with_css_hover_and_definition_origin() {
    let manifest = json!({"version":4,"languageVersion":7,"keyframes":[{"name":"reveal","text":"@keyframes reveal{to{opacity:1}}","source":{"file":"theme.css","range":{"start":10,"end":40}}}]});
    let session = LanguageSession::create(&manifest.to_string()).unwrap();
    let completion = session
        .completion_index()
        .unwrap()
        .class_entries
        .into_iter()
        .find(|entry| entry.label == "animation-name:reveal")
        .unwrap();
    assert!(
        completion
            .documentation_text
            .unwrap()
            .contains("@keyframes reveal")
    );
    let inspection = session
        .inspect_class_name("animation-name:reveal", None)
        .unwrap();
    assert_eq!(
        inspection.definition_source.unwrap().file.as_deref(),
        Some("theme.css")
    );
    let dynamic = session
        .inspect_class_name("animation-name:var(--external)", None)
        .unwrap();
    assert!(dynamic.definition_source.is_none());
    assert!(dynamic.diagnostics.iter().any(|diagnostic| diagnostic.code == mastercss_schema::ErrorCode::DynamicAnimationNames));
}
