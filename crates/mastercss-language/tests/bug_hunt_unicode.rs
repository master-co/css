use mastercss_language::{AnalyzeDocumentRequestIr, LanguageSession};

#[test]
fn bh_0013_unicode_before_a_long_line_string_does_not_panic() {
    let session = LanguageSession::create(r#"{"version":1,"languageVersion":2}"#).unwrap();
    for unicode in ["é", "中", "😀", "e\u{301}"] {
        for padding in 0..4 {
            let source = format!(
                "{}{}clsx(\"block\")",
                unicode.repeat(300),
                " ".repeat(padding)
            );
            let request: AnalyzeDocumentRequestIr = serde_json::from_value(serde_json::json!({
                "source": source,
                "languageId": "typescript"
            }))
            .unwrap();
            let result = session.analyze_document(&request).unwrap();
            assert_eq!(result.class_positions.len(), 1);
            assert_eq!(result.class_positions[0].token, "block");
        }
    }
}
