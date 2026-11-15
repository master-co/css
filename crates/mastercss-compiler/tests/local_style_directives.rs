use mastercss_compiler::has_local_style_directives;

#[test]
fn local_style_directives_follow_compiled_definitions() {
    let local = |source: &str| has_local_style_directives(source, "/style.css").unwrap();
    // Native style rules that apply mixins, also nested, escaped or in uppercase.
    assert!(local(".a { @apply --x; }"));
    assert!(local(".a { @supports (display: grid) { @APPLY --x; } }"));
    assert!(local(".a { @\\61 pply --x; }"));
    // References and custom media.
    assert!(local("@reference './tokens.css';"));
    assert!(local(".a { @media (--wide) { color: red } }"));
    // Definitions alone, and applications outside style rules, define no local style.
    assert!(!local("@theme { --color-brand: red; }"));
    assert!(!local("@mixin --m { @apply --x; }"));
    assert!(!local("@scope (.a) { .b { @apply --x; } }"));
    assert!(!local(".a { color: red; }"));
}

#[test]
fn only_master_css_syntax_is_reported_invalid() {
    // Master CSS reports its own directives' errors.
    assert!(has_local_style_directives("@contents;", "/style.css").is_err());
    assert!(has_local_style_directives("@apply --x;", "/style.css").is_err());
    // CSS without Master CSS syntax belongs to the host's CSS pipeline.
    for source in [
        ".a{}}",
        ".a::before::after { color: red }",
        "}",
        ":is(}{color:red}",
    ] {
        assert!(
            !has_local_style_directives(source, "/style.css").unwrap(),
            "{source}"
        );
    }
}
