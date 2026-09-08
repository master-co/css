use mastercss_lexer::{
    collect_class_list_token_ranges, collect_css_variable_references, find_css_directive_ranges,
    transform_css_variable_references,
};

#[test]
fn audit_unicode_class_ranges_round_trip_utf16() {
    for token in [
        "fg:red",
        "w:10px:hover@sm",
        "你好",
        "🦀",
        "e\u{301}",
        "content:'a\\b'",
        "x\u{a0}y",
        "",
        "{a;b}",
    ] {
        for separator in [" ", "\t", "\r\n", "\x0c"] {
            let source = format!("🦀{separator}{token}{separator}block");
            let units: Vec<u16> = source.encode_utf16().collect();
            for item in collect_class_list_token_ranges(&source) {
                assert!(item.range.start <= item.range.end);
                assert!(item.range.end as usize <= units.len());
                assert_eq!(
                    String::from_utf16(&units[item.range.start as usize..item.range.end as usize])
                        .unwrap(),
                    item.token
                );
            }
        }
    }
}

#[test]
fn audit_variable_transform_identity_and_malformed_directives_do_not_panic() {
    for body in [
        "",
        "🦀",
        "\"",
        "'",
        "/*",
        "\\",
        "(--x",
        "var( --brand, var(--fallback))",
        "'var(--ignored)'",
        "/* var(--ignored) */",
    ] {
        let source = format!("@theme {{ --x: {body}; }}");
        let transformed: Result<String, ()> =
            transform_css_variable_references(&source, |_, _| Ok(None));
        assert_eq!(transformed.unwrap(), source);
        let _ = collect_css_variable_references(&source);
        let units = source.encode_utf16().count();
        for directive in find_css_directive_ranges(&source) {
            assert!(directive.range.start <= directive.range.end);
            assert!(directive.range.end as usize <= units);
        }
    }
    assert_eq!(
        collect_css_variable_references("/* var(--no) */ 'var(--no)' var(\n--yes,var(--fallback))"),
        ["yes", "fallback"]
    );
}
