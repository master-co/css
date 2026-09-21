use mastercss_language::{AnalyzeDocumentRequestIr, LanguageError, LanguageSession};

fn request(source: &str) -> AnalyzeDocumentRequestIr {
    serde_json::from_value(serde_json::json!({ "source": source, "languageId": "html" })).unwrap()
}

fn session() -> LanguageSession {
    LanguageSession::create(include_str!(
        "../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap()
}

#[test]
fn prepared_analysis_preserves_positions_and_tokens_across_unicode_and_line_endings() {
    let mut session = session();
    for source in [
        "😀\r\n<div class=\"block fg:red-60\"/>\n<div class=\"flex\"/>",
        "\r<div class=\"block\"/>\r\n<div class=\"font:16\"/>",
        "<div class=\"fg:red-60\"/>".repeat(2_000).as_str(),
    ] {
        let request = request(source);
        let expected = session.analyze_document(&request).unwrap();
        let prepared = session.prepare_document(&request).unwrap();
        let actual = session
            .finish_document(prepared.id, &vec![true; prepared.native_candidates.len()])
            .unwrap();
        assert_eq!(actual, expected);
        assert!(session.finish_document(prepared.id, &[]).is_err());
    }
}

#[test]
fn prepared_analysis_consumes_or_cancels_pending_state_and_rejects_stale_ids() {
    let mut session = session();
    let a = session
        .prepare_document(&request("<div class=\"block\"/>"))
        .unwrap();
    let b = session
        .prepare_document(&request("<div class=\"block\"/>"))
        .unwrap();
    assert_ne!(a.id, b.id);
    assert!(matches!(
        session.finish_document(a.id, &[]),
        Err(LanguageError::InvalidPreparedDocument)
    ));
    assert!(session.finish_document(b.id, &[]).is_ok());
    let c = session
        .prepare_document(&request("<div class=\"accent-color:red\"/>"))
        .unwrap();
    assert!(matches!(
        session.finish_document(c.id, &[]),
        Err(LanguageError::InvalidNativeSupport)
    ));
    assert!(session.finish_document(c.id, &[true]).is_err());
    let d = session
        .prepare_document(&request("<div class=\"block\"/>"))
        .unwrap();
    session.cancel_document(d.id);
    assert!(session.finish_document(d.id, &[]).is_err());
    let e = session
        .prepare_document(&request("<div class=\"block\"/>"))
        .unwrap();
    session.dispose();
    assert!(session.finish_document(e.id, &[]).is_err());
    assert!(session.prepare_document(&request("")).is_err());
}

#[test]
fn native_support_is_resolved_once_per_unique_class_and_applied_before_semantics() {
    let mut session = LanguageSession::create(r#"{"version":1}"#).unwrap();
    let prepared = session
        .prepare_document(&request(
            "<div class=\"display:banana display:block display:block\"/>",
        ))
        .unwrap();
    assert_eq!(prepared.native_candidates.len(), 2);
    let result = session
        .finish_document(prepared.id, &[false, true])
        .unwrap();
    assert_eq!(result.class_positions.len(), 3);
    assert!(
        !result
            .semantic_tokens
            .iter()
            .any(|token| token.start < result.class_positions[1].range.start)
    );
    assert!(!result.semantic_tokens.is_empty());
}
