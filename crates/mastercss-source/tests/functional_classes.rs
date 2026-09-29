use mastercss_source::{SourceExtractionInputIr, SourceExtractorKind, extract_source};

fn candidates(source: &str, content: &str) -> Vec<String> {
    extract_source(&SourceExtractionInputIr {
        source: source.into(),
        content: content.into(),
        kind: SourceExtractorKind::Auto,
        owner: None,
    })
}

#[test]
fn functional_classes_survive_html_entities_and_nested_arguments() {
    let classes = candidates(
        "index.html",
        r#"<div class='grid-cols(3)@sm text(&quot;sm&quot;):hover pair(calc(2px+1rem),rgb(1,2,3))'></div>"#,
    );
    for expected in [
        "grid-cols(3)@sm",
        "text(\"sm\"):hover",
        "pair(calc(2px+1rem),rgb(1,2,3))",
    ] {
        assert!(classes.iter().any(|class| class == expected), "{classes:?}");
    }
}

#[test]
fn contents_wrappers_keep_nested_calls_groups_and_order() {
    let classes = candidates(
        "component.tsx",
        r#"const node = <div className={'{color:red;display:block}@apply(--wrap(calc(2px+1rem)))@apply(--hover)@layer(components)!'} />;"#,
    );
    assert!(classes.contains(&"{color:red;display:block}@apply(--wrap(calc(2px+1rem)))@apply(--hover)@layer(components)!".into()), "{classes:?}");
    let html = candidates(
        "index.html",
        r#"<div class='color:red@apply(--wrap(&quot;wide&quot;))@dark'></div>"#,
    );
    assert!(
        html.contains(&"color:red@apply(--wrap(\"wide\"))@dark".into()),
        "{html:?}"
    );
}

#[test]
fn javascript_calls_are_not_class_candidates() {
    let classes = candidates(
        "component.tsx",
        r#"gridCols(3); text("ordinary prose"); const cls = 'grid-cols(3)@sm'; const node = <div className={'text("sm")'} />;"#,
    );
    assert!(classes.contains(&"grid-cols(3)@sm".into()), "{classes:?}");
    assert!(classes.contains(&"text(\"sm\")".into()), "{classes:?}");
    assert!(!classes.contains(&"gridCols(3)".into()));
    assert!(!classes.contains(&"text(\"ordinary prose\")".into()));
}

#[test]
fn markdown_markup_retains_functions_while_code_fences_are_excluded() {
    let classes = candidates(
        "guide.mdx",
        "<div className='grid-cols(4)@sm text(\"sm\")' />\n\n```html\n<div class='grid-cols(99)'></div>\n```\n",
    );
    assert!(!classes.contains(&"grid-cols(99)".into()));
    assert!(classes.contains(&"grid-cols(4)@sm".into()), "{classes:?}");
    assert!(classes.contains(&"text(\"sm\")".into()), "{classes:?}");
}
