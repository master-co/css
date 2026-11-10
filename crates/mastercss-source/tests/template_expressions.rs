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

fn candidates(source: &str, content: &str) -> Vec<String> {
    let result = extract(source, content);
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    result.candidates
}

fn assert_has(candidates: &[String], expected: &[&str]) {
    for name in expected {
        assert!(
            candidates.iter().any(|candidate| candidate == name),
            "{name} missing from {candidates:?}"
        );
    }
}

#[test]
fn strings_inside_placeholders_stay_candidates() {
    let found =
        extract_class_candidates("<Island className={`p:1px ${a ? \"p:2px\" : \"p:3px\"}`} />");
    assert_has(&found, &["p:1px", "p:2px", "p:3px"]);
}

#[test]
fn astro_class_list_objects_are_expressions() {
    let found = candidates(
        "page.astro",
        "<div class:list={{ \"p:1px\": a, open: b }} class=\"p:2px\"></div>\n",
    );
    assert_has(&found, &["p:1px", "p:2px"]);
}

#[test]
fn data_scripts_are_not_parsed_as_code() {
    for source in ["page.html", "page.astro"] {
        let found = candidates(
            source,
            "<div class=\"p:1px\"></div><script type=\"application/ld+json\">{\"@context\": \"https://schema.org\"}</script><script type=\"importmap\">{\"imports\": {}}</script>\n",
        );
        assert_has(&found, &["p:1px"]);
    }
}

#[test]
fn astro_scripts_are_typescript() {
    let found = candidates(
        "page.astro",
        "<div class=\"p:1px\"></div><script>const input = <HTMLInputElement>document.querySelector('#q'); input.className = 'p:2px'</script>\n",
    );
    assert_has(&found, &["p:1px", "p:2px"]);
}

#[test]
fn javascript_files_may_hold_jsx() {
    let found = candidates("page.js", "export const a = <div className=\"p:1px\" />\n");
    assert_has(&found, &["p:1px"]);
}

#[test]
fn astro_frontmatter_fences_follow_the_astro_compiler() {
    for content in [
        "---\nconst a = 'p:1px'\n---",
        "--- \nconst a = 'p:1px'\n--- \n<div class=\"p:2px\"/>",
        "\u{feff}---\nconst a = 'p:1px'\n---\r\n<div class=\"p:2px\"/>",
        "---\nconst a = 'p:1px'\n---<div class=\"p:2px\"/>",
        "---\nconst md = `\n---\ntitle: x\n---\n`\nconst a = 'p:1px'\n---\n<div class=\"p:2px\"/>",
    ] {
        let found = candidates("page.astro", content);
        assert_has(&found, &["p:1px"]);
        assert!(
            !found.iter().any(|candidate| candidate == "const"),
            "{content:?}: {found:?}"
        );
    }
    assert!(candidates("empty.astro", "---\n---").is_empty());
}

#[test]
fn svelte_class_directives_toggle_their_class() {
    let found = candidates(
        "toggle.svelte",
        "<div class:hidden={!open} class:p:1px={a} class:block></div>\n",
    );
    assert_has(&found, &["hidden", "p:1px", "block"]);
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
