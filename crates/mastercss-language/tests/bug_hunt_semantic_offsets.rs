use mastercss_language::{AnalyzeDocumentRequestIr, LanguageSession};

#[test]
fn bh_0014_semantic_ranges_follow_raw_escape_sequences() {
    let session = LanguageSession::create(include_str!(
        "../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    for source in [
        r#"clsx("content:\"x\":hover")"#,
        r#"clsx('content:\'x\':hover')"#,
        r#"/* 😀 */ clsx("content:\"😀\":hover")"#,
        r#"clsx("content:'x':hover")"#,
    ] {
        let request: AnalyzeDocumentRequestIr = serde_json::from_value(serde_json::json!({
            "source": source,
            "languageId": "typescript"
        }))
        .unwrap();
        let result = session.analyze_document(&request).unwrap();
        assert_eq!(result.class_positions.len(), 1, "{source}");
        let hover_start = source[..source.find("hover").unwrap()]
            .encode_utf16()
            .count() as u32;
        assert!(
            result
                .semantic_tokens
                .iter()
                .any(|token| { token.start == hover_start && token.end == hover_start + 5 }),
            "{source}: {:?}",
            result.semantic_tokens
        );
        let position = &result.class_positions[0];
        assert!(result.semantic_tokens.iter().all(|token| {
            token.start >= position.range.start && token.end <= position.range.end
        }));
    }
}
