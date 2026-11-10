use mastercss_source::{
    SourceExtractionInputIr, SourceExtractorKind, extract_class_candidates, extract_source_result,
};

fn extract(source: &str, content: &str) -> mastercss_source::SourceExtractionIr {
    extract_source_result(&SourceExtractionInputIr {
        source: source.into(),
        content: content.into(),
        kind: SourceExtractorKind::Auto,
        owner: None,
    })
}

#[test]
fn template_placeholders_are_not_class_candidates() {
    let candidates = extract_class_candidates("<div class={`grid ${size} ${a}｜${b}`}></div>");
    assert!(candidates.contains(&"grid".to_owned()), "{candidates:?}");
    assert!(
        candidates.iter().all(|candidate| !candidate.contains("${")),
        "{candidates:?}"
    );
    // Nested braces inside a placeholder belong to it.
    let nested = extract_class_candidates("`flex ${ok ? { a: 1 }.a : 'p:2px'} block`");
    assert!(nested.contains(&"flex".to_owned()) && nested.contains(&"block".to_owned()));
    assert!(
        nested.iter().all(|candidate| !candidate.contains("${")),
        "{nested:?}"
    );
}

#[test]
fn astro_class_expressions_are_javascript_not_class_lists() {
    let result = extract(
        "page.astro",
        "---\nconst size = 'p:2px'\n---\n<Base {...props} title={`${a}｜${b} > c`}><div class={`block ${size}`} class:list={['flex', { 'm:1px': on }]}>x</div></Base>\n",
    );
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    for expected in ["p:2px", "block", "flex", "m:1px"] {
        assert!(
            result.candidates.contains(&expected.to_owned()),
            "{expected} missing from {:?}",
            result.candidates
        );
    }
    for candidate in &result.candidates {
        assert!(
            !candidate.contains("${") && !candidate.contains('{') && !candidate.contains('`'),
            "{candidate} in {:?}",
            result.candidates
        );
    }
    // The class expression is read as JavaScript, not as an HTML class list.
    assert!(
        result
            .occurrences
            .iter()
            .any(|occurrence| occurrence.candidate == "block" && occurrence.extractor == "oxc")
    );
    assert!(
        !result
            .occurrences
            .iter()
            .any(|occurrence| occurrence.content_kind == "class-attribute")
    );
}

#[test]
fn quoted_astro_class_attributes_stay_class_lists() {
    let result = extract(
        "page.astro",
        "<div class=\"block p:2px\" data-x={1}></div>\n",
    );
    let html = result
        .occurrences
        .iter()
        .filter(|occurrence| occurrence.content_kind == "class-attribute")
        .map(|occurrence| occurrence.candidate.as_str())
        .collect::<Vec<_>>();
    assert_eq!(html, ["block", "p:2px"]);
}
