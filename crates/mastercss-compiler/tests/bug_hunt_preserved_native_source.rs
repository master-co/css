use mastercss_compiler::{CompileNativeCssOptions, compile_css_directives, compile_native_css};

#[test]
fn preserves_native_bytes_around_consumed_theme() {
    let native = "/* audit */.shared{color:rgb(255, 0, 0);margin:0px 0px 0px 0px}.empty{}";
    let result = compile_css_directives(
        &format!("@theme{{--color-unused:red}}{native}"),
        &CompileNativeCssOptions {
            preserve_native_source: true,
            ..Default::default()
        },
    )
    .unwrap();
    assert_eq!(result.native_css, native);
}

#[test]
fn preserves_unicode_comments_and_literal_directive_text() {
    let native = "/* 🧪 */.名{content:\"@theme{fake}\"}.empty{}";
    let result = compile_css_directives(
        &format!("/* before */@theme{{--color-名:red}}{native}"),
        &CompileNativeCssOptions {
            preserve_native_source: true,
            ..Default::default()
        },
    )
    .unwrap();
    assert_eq!(result.native_css, format!("/* before */{native}"));
}

#[test]
fn preserves_siblings_and_containers_around_lowered_slots() {
    let source = "@theme{--color-x:red}@media screen{/* keep */.empty{} .composed{@compose p:2rem;} .other{color:rgb(0, 0, 255)}}";
    let result = compile_css_directives(
        source,
        &CompileNativeCssOptions {
            preserve_native_source: true,
            ..Default::default()
        },
    )
    .unwrap();
    let output = result.native_output.unwrap();
    assert_eq!(output.slots.len(), 1);
    assert!(output.css.contains("@media screen{/* keep */.empty{} "));
    assert!(output.css.contains(" .other{color:rgb(0, 0, 255)}}"));
    assert!(output.css.contains(&output.slots[0].marker));
    assert!(!output.css.contains("@compose"));
    assert!(!result.native_css.contains("@compose"));
}

#[test]
fn consumed_definitions_and_composes_have_no_native_whitespace_output() {
    let source = "@theme{--color-x:red}\n@components{brand{color:red}}\n.button{@compose brand;}";
    let result = compile_css_directives(
        source,
        &CompileNativeCssOptions {
            preserve_native_source: true,
            ..Default::default()
        },
    )
    .unwrap();
    assert!(result.native_css.is_empty());
    assert_eq!(result.native_output.unwrap().slots.len(), 1);
}

#[test]
fn source_preservation_is_opt_in_and_rejects_pruning() {
    let source = "@theme{--color-x:red}/* retained */.empty{}";
    let legacy = compile_css_directives(source, &CompileNativeCssOptions::default()).unwrap();
    assert!(legacy.native_css.is_empty());
    let error = compile_css_directives(
        source,
        &CompileNativeCssOptions {
            preserve_native_source: true,
            classes: Some(vec![]),
            prune_native_css: true,
            ..Default::default()
        },
    )
    .unwrap_err();
    assert!(
        error
            .to_string()
            .contains("cannot be combined with class pruning")
    );
}

#[test]
fn native_only_preservation_retains_source_and_validates_syntax() {
    let source = "/* untouched */.empty{}.shared{margin:0px 0px 0px 0px}";
    let options = CompileNativeCssOptions {
        preserve_native_source: true,
        ..Default::default()
    };
    assert_eq!(
        compile_native_css(source, &options).unwrap().native_css,
        source
    );
    assert!(
        !compile_native_css(source, &Default::default())
            .unwrap()
            .native_css
            .contains(".empty{}")
    );
    assert!(compile_native_css(".broken { color: } }", &options).is_err());
}

#[test]
fn native_only_preservation_respects_disabled_output_and_rejects_pruning() {
    let mut options = CompileNativeCssOptions {
        preserve_native_source: true,
        preserve_native_css: false,
        ..Default::default()
    };
    assert!(
        compile_native_css(".empty{}", &options)
            .unwrap()
            .css
            .is_empty()
    );
    options.classes = Some(vec![]);
    options.prune_native_css = true;
    assert!(
        compile_native_css(".empty{}", &options)
            .unwrap_err()
            .to_string()
            .contains("cannot be combined with class pruning")
    );
}
