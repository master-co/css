use mastercss_compiler::{
    CompileNativeCssOptions, LowerCssDirectivesRequest, LowerCssDirectivesResult,
    compile_css_directives, lower_css_directives_request,
};

fn request(source: &str, preserve: bool) -> LowerCssDirectivesRequest {
    let parsed = compile_css_directives(
        source,
        &CompileNativeCssOptions {
            from: "/entry.css".into(),
            preserve_native_css: preserve,
            prune_native_css: false,
            preserve_native_source: false,
            classes: None,
        },
    )
    .unwrap();
    LowerCssDirectivesRequest {
        mixin_sources: Vec::new(),
        manifest_input: parsed.manifest_input,
        style_definitions: parsed.style_definitions.unwrap_or_default(),
        warnings: parsed.warnings,
        native_output: parsed.native_output,
    }
}
fn render(source: &str, preserve: bool) -> LowerCssDirectivesResult {
    lower_css_directives_request(&request(source, preserve), &mastercss_compiler::LowerCssDirectivesOptions { base_manifest: Some(serde_json::json!({"version":3,"languageVersion":5,"customMedia":{"--always":{"type":"true"}}})), resolution_manifest: None }).unwrap()
}

#[test]
fn direct_slots_keep_repeated_selectors_separate_and_retain_important_order() {
    let source = r###"@mixin --paint {padding:2rem}@mixin --low {padding:1rem}@layer{.a{@variant always{padding:2rem;}}.b{@variant always{padding:1rem;}}.a{padding:3rem!important}}"###;
    let result = render(source, true);
    let css = result.css.unwrap().replace([' ', '\n'], "");
    assert_eq!(css.matches("@layer").count(), 1);
    let offsets = ["padding:2rem", "padding:1rem", "padding:3rem!important"]
        .map(|value| css.find(value).unwrap());
    assert!(offsets.windows(2).all(|pair| pair[0] < pair[1]), "{css}");
    assert_eq!(css.matches(".a{").count(), 2, "{css}");
}

#[test]
fn ordered_maps_anchor_each_retained_and_composed_rule_after_replacement() {
    let source = r###"/* 😀 */
@mixin --paint {padding:2rem}
@layer{
.before{margin:1px}
.card{@variant always{padding:2rem;}color:red}
.after{padding:3rem}
}"###;
    let result = render(source, true);
    let css = result.css.as_ref().unwrap();
    for (generated, original) in [
        (".before", ".before"),
        (".card", ".card"),
        ("padding:2rem", "padding:2rem;}color"),
        ("color:red", "color:red"),
        (".after", ".after"),
    ] {
        let offset = css[..css.find(generated).unwrap()].encode_utf16().count() as u32;
        let mapping = result
            .output_mappings
            .iter()
            .find(|mapping| mapping.generated_start == offset)
            .unwrap_or_else(|| panic!("{generated}: {css}"));
        assert_eq!(
            mapping.source.range.start as usize,
            source[..source.find(original).unwrap()]
                .encode_utf16()
                .count(),
            "{generated}"
        );
    }
}

#[test]
fn disabling_native_output_preserves_only_composed_rules_and_their_containers() {
    let source = r###"@mixin --paint {padding:2rem}.plain{color:red}@media screen{@font-face{font-family:p;src:url(p.woff2)}.card{@variant always{padding:2rem;}}}"###;
    let css = render(source, false).css.unwrap();
    assert!(
        !css.contains(".plain") && !css.contains("@font-face"),
        "{css}"
    );
    assert!(
        css.contains("@media screen") && css.contains(".card{padding:2rem}"),
        "{css}"
    );
}

#[test]
fn slot_markers_cannot_collide_with_authored_rules_or_strings() {
    let source = r###"@mixin --paint {padding:2rem}@--master-css-style-slot-0;.plain{content:'@--master-css-style-slot-1;'}.card{@variant always{padding:2rem;}}"###;
    let css = render(source, true).css.unwrap();
    assert!(css.contains("@--master-css-style-slot-0;"), "{css}");
    assert!(css.contains("@--master-css-style-slot-1;"), "{css}");
    assert!(css.contains("padding:2rem"), "{css}");
}

#[test]
fn stale_or_overlapping_serialized_slots_report_errors() {
    let mut request = request(
        r###"@mixin --paint {padding:2rem}.card{@variant always{padding:2rem;}}"###,
        true,
    );
    let output = request.native_output.as_mut().unwrap();
    output.slots[0].end = u32::MAX;
    assert!(lower_css_directives_request(&request, &mastercss_compiler::LowerCssDirectivesOptions { base_manifest: Some(serde_json::json!({"version":3,"languageVersion":5,"customMedia":{"--always":{"type":"true"}}})), resolution_manifest: None }).is_err());
}
