use mastercss_source::{
    SourceExtractionInputIr, SourceExtractorKind, extract_class_candidates, extract_source_result,
};

fn has(candidates: &[String], class: &str) -> bool {
    candidates.iter().any(|candidate| candidate == class)
}

#[test]
fn an_unclosed_block_comment_opener_is_template_text() {
    let candidates = extract_class_candidates(
        r#"<input accept="image/*" class="hidden"><div class="flex"></div>"#,
    );
    assert!(
        has(&candidates, "hidden") && has(&candidates, "flex"),
        "{candidates:?}"
    );
    // A closed comment is still removed.
    let closed = extract_class_candidates("<div class=\"flex\">/* p:2px */</div>");
    assert!(has(&closed, "flex") && !has(&closed, "p:2px"), "{closed:?}");
}

#[test]
fn only_style_elements_are_removed() {
    for template in [
        r#"<StyleProvider><div class="flex"/></StyleProvider>"#,
        r#"<styled-box><div class="flex"></div></styled-box>"#,
    ] {
        let candidates = extract_class_candidates(template);
        assert!(has(&candidates, "flex"), "{template}: {candidates:?}");
    }
    let styled =
        extract_class_candidates("<style scoped>.p\\:2px{}</style><div class=\"flex\"></div>");
    assert!(
        has(&styled, "flex") && !styled.iter().any(|c| c.contains("2px")),
        "{styled:?}"
    );
}

#[test]
fn urls_and_dynamic_imports_keep_the_rest_of_their_line() {
    let url = extract_class_candidates(r#"<p>see https://x.dev</p><b class="bold">"#);
    assert!(has(&url, "bold"), "{url:?}");
    let import = extract_class_candidates(
        r#"<component :is="defineAsyncComponent(() => import('./A.vue'))" class="w:full">"#,
    );
    assert!(has(&import, "w:full"), "{import:?}");
    assert!(
        !import.iter().any(|candidate| candidate.contains("A.vue")),
        "{import:?}"
    );
    // A line comment still ends class text.
    let comment = extract_class_candidates("const a = 'flex' // 'p:2px'");
    assert!(
        has(&comment, "flex") && !has(&comment, "p:2px"),
        "{comment:?}"
    );
}

#[test]
fn attribute_selectors_keep_their_equals_and_no_break_spaces_stay_in_values() {
    let candidates =
        extract_class_candidates(r#"clsx('block[aria-expanded=true]', 'hidden[data-x^=a]')"#);
    assert!(
        has(&candidates, "block[aria-expanded=true]"),
        "{candidates:?}"
    );
    assert!(has(&candidates, "hidden[data-x^=a]"), "{candidates:?}");
    let nbsp = extract_class_candidates("clsx(\"(content:'a\u{a0}b')\")");
    assert!(has(&nbsp, "(content:'a\u{a0}b')"), "{nbsp:?}");
}

#[test]
fn vue_templates_extract_after_an_unclosed_block_comment_opener() {
    let result = extract_source_result(&SourceExtractionInputIr {
        source: "App.vue".into(),
        content: "<template><input accept=\"image/*\" class=\"hidden\"><div class=\"flex\"></div></template>".into(),
        kind: SourceExtractorKind::Auto,
        owner: None,
    });
    assert!(
        has(&result.candidates, "hidden") && has(&result.candidates, "flex"),
        "{:?}",
        result.candidates
    );
}
