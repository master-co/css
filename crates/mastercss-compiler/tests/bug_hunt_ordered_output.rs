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
        manifest_input: parsed.manifest_input,
        style_definitions: parsed.style_definitions.unwrap_or_default(),
        warnings: parsed.warnings,
        native_output: parsed.native_output,
    }
}
fn render(source: &str, preserve: bool) -> LowerCssDirectivesResult {
    lower_css_directives_request(&request(source, preserve), &Default::default()).unwrap()
}

#[test]
fn direct_slots_keep_repeated_selectors_separate_and_retain_important_order() {
    let source = "@utilities{paint{padding:2rem}low{padding:1rem}}@layer{.a{@compose paint;}.b{@compose low;}.a{padding:3rem!important}}";
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
    let source = "/* 😀 */\n@utilities{paint{padding:2rem}}\n@layer{\n.before{margin:1px}\n.card{@compose paint;color:red}\n.after{padding:3rem}\n}";
    let result = render(source, true);
    let css = result.css.as_ref().unwrap();
    for (generated, original) in [
        (".before", ".before"),
        (".card", ".card"),
        ("padding:2rem", "paint;color"),
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
    let source = "@utilities{paint{padding:2rem}}.plain{color:red}@media screen{@font-face{font-family:p;src:url(p.woff2)}.card{@compose paint;}}";
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
    let source = "@utilities{paint{padding:2rem}}@--master-css-compose-slot-0;.plain{content:'@--master-css-compose-slot-1;'}.card{@compose paint;}";
    let css = render(source, true).css.unwrap();
    assert!(css.contains("@--master-css-compose-slot-0;"), "{css}");
    assert!(css.contains("@--master-css-compose-slot-1;"), "{css}");
    assert!(css.contains("padding:2rem"), "{css}");
}

#[test]
fn stale_or_overlapping_serialized_slots_report_errors() {
    let mut request = request(
        "@utilities{paint{padding:2rem}}.card{@compose paint;}",
        true,
    );
    let output = request.native_output.as_mut().unwrap();
    output.slots[0].end = u32::MAX;
    assert!(lower_css_directives_request(&request, &Default::default()).is_err());
}

#[test]
fn overlapping_slots_and_backwards_mapping_ranges_are_rejected() {
    let original = request(
        "@utilities{paint{padding:2rem}}.a{@compose paint;}.b{@compose paint;}",
        true,
    );
    let mut overlapping = original.clone();
    let output = overlapping.native_output.as_mut().unwrap();
    output.slots[1] = output.slots[0].clone();
    assert!(lower_css_directives_request(&overlapping, &Default::default()).is_err());
    let mut backwards = original;
    let output = backwards.native_output.as_mut().unwrap();
    let source = output.slots[0]
        .definitions
        .iter()
        .find_map(|definition| match definition {
            mastercss_schema::CssDirectiveStyleDefinition::Compose { source, .. } => source.clone(),
            _ => None,
        })
        .unwrap();
    output.mappings.push(mastercss_schema::CssOutputMapping {
        generated_start: 2,
        generated_end: Some(1),
        source,
    });
    assert!(lower_css_directives_request(&backwards, &Default::default()).is_err());
}
