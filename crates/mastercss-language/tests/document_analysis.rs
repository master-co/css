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
        "😀\r\n<div class=\"block fg-red-60\"/>\n<div class=\"flex\"/>",
        "\r<div class=\"block\"/>\r\n<div class=\"font-size:16px\"/>",
        "<div class=\"fg-red-60\"/>".repeat(2_000).as_str(),
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
    assert!(session.finish_document(c.id, &[]).is_ok());
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
fn host_support_does_not_remove_native_declaration_semantics() {
    let mut session = LanguageSession::create(r#"{"version":6,"languageVersion":15}"#).unwrap();
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
        result
            .semantic_tokens
            .iter()
            .any(|token| token.start < result.class_positions[1].range.start)
    );
    assert!(!result.semantic_tokens.is_empty());
}

#[test]
fn retired_classes_keep_complete_utf16_ranges_without_member_semantics() {
    let session = session();
    for (language, source) in [
        (
            "html",
            "😀<div class=\"{p-md;animation:float|1s} display:block:of(.active) display:block\"/>",
        ),
        (
            "typescriptreact",
            "const emoji = '😀'; const view = <div className=\"{p-md;animation:float|1s} display:block:of(.active) display:block\"/>",
        ),
        (
            "vue",
            "<template>😀<div class=\"{p-md;animation:float|1s} display:block:of(.active) display:block\"/></template>",
        ),
        (
            "svelte",
            "😀<div class=\"{p-md;animation:float|1s} display:block:of(.active) display:block\"/>",
        ),
        (
            "mdx",
            "😀\n<div className=\"{p-md;animation:float|1s} display:block:of(.active) display:block\"/>",
        ),
    ] {
        let request =
            serde_json::from_value(serde_json::json!({"source":source,"languageId":language}))
                .unwrap();
        let result = session.analyze_document(&request).unwrap();
        assert_eq!(result.class_positions.len(), 3, "{language}: {result:?}");
        for position in &result.class_positions[..2] {
            let raw = String::from_utf16(
                &source
                    .encode_utf16()
                    .skip(position.range.start as usize)
                    .take((position.range.end - position.range.start) as usize)
                    .collect::<Vec<_>>(),
            )
            .unwrap();
            assert_eq!(raw, position.token);
            assert!(
                !result
                    .semantic_tokens
                    .iter()
                    .any(|token| token.start >= position.range.start
                        && token.start < position.range.end),
                "{language}"
            );
            let inspection = session.inspect_class_name(&position.token, None).unwrap();
            assert_eq!(
                inspection.match_status,
                mastercss_schema::MatchStatus::SyntaxError
            );
            assert!(inspection.text.is_empty());
            assert!(inspection.variables.is_empty());
        }
        assert!(!result.semantic_tokens.is_empty());
    }
}
