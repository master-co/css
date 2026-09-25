use mastercss_language::{AnalyzeDocumentRequestIr, LanguageSession};

#[test]
fn markdown_uses_decoded_candidates_and_original_utf16_ranges() {
    let source = "😀 `hidden`\n\n```html\n<div class=\"flex\"/>\n```\n\n<div class=\"p&#58;2px\"/>";
    let session = LanguageSession::create(include_str!(
        "../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    let result = session
        .analyze_document(&AnalyzeDocumentRequestIr {
            source: source.into(),
            language_id: "mdx".into(),
            host_ranges: Vec::new(),
            settings: Default::default(),
        })
        .unwrap();
    assert!(result.diagnostics.is_empty());
    assert_eq!(result.class_positions.len(), 1);
    let position = &result.class_positions[0];
    assert_eq!(position.token, "p:2px");
    assert_eq!(position.raw, "p&#58;2px");
    assert_eq!(
        position.range.start as usize,
        source[..source.find("p&#").unwrap()].encode_utf16().count()
    );
    assert!(
        result
            .semantic_tokens
            .iter()
            .all(|token| token.start >= position.range.start && token.end <= position.range.end)
    );
}

#[test]
fn invalid_mdx_is_a_source_error_without_raw_fallback() {
    let session = LanguageSession::create(include_str!(
        "../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    let result = session
        .analyze_document(&AnalyzeDocumentRequestIr {
            source: "<div className={\"block\"".into(),
            language_id: "mdx".into(),
            host_ranges: Vec::new(),
            settings: Default::default(),
        })
        .unwrap();
    assert!(result.class_positions.is_empty());
    assert_eq!(
        serde_json::to_value(&result.diagnostics[0]).unwrap()["code"],
        "SOURCE_PARSE_ERROR"
    );
}

#[test]
fn editor_diagnostics_use_class_contexts_inside_actual_mdx_regions() {
    let session = LanguageSession::create(include_str!(
        "../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    let source = r#"`<div class="p:99px"/>`

<Card title="not a class.<bad" css=".a { color:red }" className="flex p:2px" />

export const display = 'padding:1px.<br'

export const classes = 'block'

<Button className={clsx('grid', active && 'hidden')} />
"#;
    let mut settings = mastercss_language::LanguageDocumentSettingsIr::default();
    settings.class_declarations.push("classes".into());
    let result = session
        .analyze_document(&AnalyzeDocumentRequestIr {
            source: source.into(),
            language_id: "mdx".into(),
            host_ranges: Vec::new(),
            settings,
        })
        .unwrap();
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_eq!(
        result
            .class_positions
            .iter()
            .map(|item| item.token.as_str())
            .collect::<Vec<_>>(),
        ["flex", "p:2px", "block", "grid", "hidden"]
    );
}
