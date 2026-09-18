use mastercss_compiler::{CompileNativeCssOptions, compile_css_directives};

/// Import flattening wraps a child stylesheet in its qualifier's at-rules, which
/// puts the child's Master directives inside a container. They declare global
/// definitions, so the requirement is the same as for style-rule nesting: report
/// it as a directive error rather than letting the printer fail opaquely.
fn error_for(source: &str) -> String {
    let error = compile_css_directives(
        source,
        &CompileNativeCssOptions {
            preserve_native_css: true,
            ..Default::default()
        },
    )
    .expect_err("contained directive must be rejected");
    error.diagnostic().message
}

#[test]
fn rejects_directives_inside_container_at_rules() {
    for container in [
        "@layer cards{@utilities{paint{padding:2rem}}.card{padding:2rem}}",
        "@media screen{@utilities{paint{padding:2rem}}.card{padding:2rem}}",
        "@supports (display: grid){@utilities{paint{padding:2rem}}.card{padding:2rem}}",
    ] {
        assert_eq!(error_for(container), "@utilities must be top-level");
    }
}

#[test]
fn rejects_directives_in_a_flattened_qualified_import() {
    let flattened = "@supports (display: grid){@media screen{@layer cards{@utilities{paint{padding:2rem}}\n.card{padding:2rem}}}}\n.after{margin:1px}";
    assert_eq!(error_for(flattened), "@utilities must be top-level");
}

#[test]
fn reports_the_contained_directive_name() {
    assert_eq!(
        error_for("@layer cards{@theme{--color-unused:red}}"),
        "@theme must be top-level"
    );
}

#[test]
fn top_level_directives_beside_container_at_rules_still_compile() {
    let result = compile_css_directives(
        "@utilities{paint{padding:2rem}}\n@layer cards{.card{padding:2rem}}",
        &CompileNativeCssOptions {
            preserve_native_css: true,
            ..Default::default()
        },
    )
    .expect("top-level directives remain accepted");
    assert!(
        result.class_names.iter().any(|name| name == "paint"),
        "{:?}",
        result.class_names
    );
    assert!(
        result.native_css.contains("@layer cards"),
        "{}",
        result.native_css
    );
}
