use mastercss_source::{extract_class_candidates, extract_html_classes, extract_oxc_classes};

#[test]
fn decodes_html_attribute_references_and_preserves_class_tokens() {
    for (raw, expected) in [
        ("block&#32;hidden", vec!["block", "hidden"]),
        (
            "block&#x20;hidden&#X09;flex",
            vec!["block", "hidden", "flex"],
        ),
        ("block&#32hidden", vec!["block", "hidden"]),
        (
            "block&Tab;hidden&NewLine;flex",
            vec!["block", "hidden", "flex"],
        ),
        ("block&nbsp;hidden", vec!["block\u{a0}hidden"]),
        ("block&#11;hidden", vec!["block\u{b}hidden"]),
        ("content:&quot;x&quot;", vec!["content:\"x\""]),
        ("content:&quot;&amp;copy;&quot;", vec!["content:\"&copy;\""]),
        ("a&notit;b", vec!["a&notit;b"]),
        ("a&notin;b", vec!["a\u{2209}b"]),
        ("a&amp=1", vec!["a&amp=1"]),
        ("a&amp!", vec!["a&!"]),
        ("a&NotEqualTilde;b", vec!["a\u{2242}\u{338}b"]),
        (
            "a&#0;b&#xD800;c&#1114112;d",
            vec!["a\u{fffd}b\u{fffd}c\u{fffd}d"],
        ),
        ("a&#999999999999999999999999;b", vec!["a\u{fffd}b"]),
        ("a&#x80;b&#x81;c", vec!["a\u{20ac}b\u{81}c"]),
        ("a&#xFFFF;b", vec!["a\u{ffff}b"]),
        ("a&#;b&#x;c&unknown;d", vec!["a&#;b&#x;c&unknown;d"]),
    ] {
        for quote in ["\"", "'"] {
            let html = format!("<div class={quote}{raw}{quote}></div>");
            assert_eq!(
                extract_html_classes("index.html", &html),
                expected,
                "{html}"
            );
        }
    }
}

#[test]
fn handles_unquoted_attributes_and_deduplicates_decoded_values() {
    assert_eq!(
        extract_html_classes(
            "index.html",
            "<div class=block&#32;hidden></div><div CLASS='block hidden'></div>"
        ),
        vec!["block", "hidden"]
    );
}

#[test]
fn does_not_decode_javascript_or_raw_source_strings() {
    let js = "const classes = 'block&#32;hidden'";
    assert_eq!(extract_oxc_classes("app.js", js), vec!["block&#32;hidden"]);
    assert_eq!(
        extract_class_candidates("block&#32;hidden"),
        vec!["block&#32;hidden"]
    );
    assert_eq!(
        extract_html_classes("index.html", &format!("<script>{js}</script>")),
        vec!["block&#32;hidden"]
    );
}

#[test]
fn ignores_comments_raw_text_and_tag_like_attribute_text() {
    let html = r#"
        <!-- <script>const fake = 'grid'</script><div class="grid"> -->
        <style>.x { content: '<div class="grid">' }</style>
        <textarea><div class="grid"></textarea>
        <div data-text="<script>const fake = 'grid'</script>" class="block&#32;hidden"></div>
        <script class="inline">const actual = 'flex'</script>
    "#;
    assert_eq!(
        extract_html_classes("index.html", html),
        vec!["block", "hidden", "inline", "flex"]
    );
}

#[test]
fn respects_first_class_attribute_and_incomplete_tags() {
    assert_eq!(
        extract_html_classes("index.html", "<div class='block' CLASS='hidden'>"),
        vec!["block"]
    );
    assert!(extract_html_classes("index.html", "<div class CLASS='hidden'>").is_empty());
    assert!(extract_html_classes("index.html", "<div class='hidden'").is_empty());
    assert_eq!(
        extract_html_classes("index.html", "<div class='a\0b'>"),
        vec!["a\u{fffd}b"]
    );
}

#[test]
fn distinguishes_foreign_titles_and_html_integration_points() {
    assert_eq!(
        extract_html_classes(
            "index.html",
            "<svg><title><a class='block'></a></title></svg>"
        ),
        vec!["block"]
    );
    assert_eq!(
        extract_html_classes(
            "index.html",
            "<svg><foreignObject><style>.x{content:'<div class=hidden>'}</style><div class=block></div></foreignObject></svg>"
        ),
        vec!["block"]
    );
    assert_eq!(
        extract_html_classes(
            "index.html",
            "<math><mtext><textarea><div class=hidden></textarea><span class=block></span></mtext></math>"
        ),
        vec!["block"]
    );
}
