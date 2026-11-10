use mastercss_compiler::{CompileNativeCssOptions, compile_css_directives, compile_native_css};

const NATIVE: &str = r#"@layer components {
  .glass { -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }
  .reverse { backdrop-filter: blur(9px); -webkit-backdrop-filter: blur(9px); }
  .screen { height: 100vh; height: 100dvh; }
  .paint { color: #f00; color: oklch(60% .2 30); }
  .empty {}
  @media (width >= 1px) { .gone {} }
}
@layer later {}"#;

fn assert_declarations_survive(css: &str) {
    for expected in [
        "-webkit-backdrop-filter: blur(8px);\n    backdrop-filter: blur(8px)",
        "backdrop-filter: blur(9px);\n    -webkit-backdrop-filter: blur(9px)",
        "height: 100vh;\n    height: 100dvh",
        "color: red;\n    color: oklch(60% .2 30)",
    ] {
        assert!(css.contains(expected), "missing {expected:?} in\n{css}");
    }
    assert!(!css.contains(".empty"), "{css}");
    assert!(!css.contains(".gone") && !css.contains("@media"), "{css}");
    // An empty layer block still establishes layer order.
    assert!(css.contains("@layer later"), "{css}");
}

#[test]
fn directive_stylesheets_keep_prefixed_pairs_and_fallbacks() {
    let source = format!("@theme {{--color-x:red}}\n{NATIVE}");
    let result = compile_css_directives(&source, &CompileNativeCssOptions::default()).unwrap();
    assert_declarations_survive(&result.native_css);
}

#[test]
fn native_stylesheets_keep_prefixed_pairs_and_fallbacks() {
    let result = compile_native_css(
        NATIVE,
        &CompileNativeCssOptions {
            preserve_native_css: true,
            ..Default::default()
        },
    )
    .unwrap();
    assert_declarations_survive(&result.css);
}
