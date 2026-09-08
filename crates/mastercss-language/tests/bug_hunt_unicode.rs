use mastercss_language::{AnalyzeDocumentRequestIr, LanguageSession};

#[test]
fn bh_0013_unicode_before_a_long_line_string_does_not_panic() {
    let session = LanguageSession::create(r#"{"version":1}"#).unwrap();
    let source = format!("{}clsx(\"block\")", "é".repeat(300));
    let request: AnalyzeDocumentRequestIr = serde_json::from_value(serde_json::json!({
        "source": source,
        "languageId": "typescript"
    }))
    .unwrap();
    assert!(session.analyze_document(&request).is_ok());
}
