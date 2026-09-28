use mastercss_compiler::{CompileNativeCssOptions, CompilerError, compile_css_directives};
use mastercss_schema::{CssDirectiveStyleDefinition, ErrorCode};

#[test]
fn rejects_removed_compose_in_every_authoring_context() {
    for source in [
        "@compose block;",
        r###".card { @compose block; }"###,
        r###"@utilities { card { @compose block; } }"###,
        r###"@utilities { box:<*> { @compose block; } }"###,
        r###"@utilities { box-<a|b> { @compose block; } }"###,
        r###"@utilities { box-<~spacing> { @compose block; } }"###,
        r###"@media print { .card { @compose block; } }"###,
        r###".card { @variant sm { @compose block; } }"###,
        ".card { @CoMpOsE block; }",
        r".card { @\63 ompose block; }",
        ".card { @compose { block } }",
    ] {
        let error =
            compile_css_directives(source, &CompileNativeCssOptions::default()).unwrap_err();
        assert!(
            matches!(
                error,
                CompilerError::DirectiveDiagnostic {
                    code: ErrorCode::RemovedComposeDirective,
                    ..
                }
            ),
            "{source}: {error}"
        );
    }
}

#[test]
fn removal_diagnostic_uses_original_utf16_positions() {
    let source = r###"/*😀*/
.card { @compose block; }"###;
    let options = CompileNativeCssOptions {
        from: "card.css".into(),
        ..Default::default()
    };
    let error = compile_css_directives(source, &options).unwrap_err();
    let CompilerError::DirectiveDiagnostic {
        code,
        filename,
        range: Some(range),
        ..
    } = error
    else {
        panic!("expected a ranged removal diagnostic");
    };
    assert_eq!(code, ErrorCode::RemovedComposeDirective);
    assert_eq!(filename, "card.css");
    assert_eq!(
        range.start,
        source[..source.find('@').unwrap()].encode_utf16().count() as u32
    );
    assert_eq!(range.end - range.start, 8);
}

#[test]
fn leaves_strings_comments_custom_values_and_unrelated_at_rules_alone() {
    let source = r#"/* @compose block; */ .card { content: "@compose block;"; --example: @compose; } @compose-other example;"#;
    assert!(compile_css_directives(source, &CompileNativeCssOptions::default()).is_ok());
}

#[test]
fn removed_compose_ir_is_not_an_accepted_lowering_input() {
    assert!(
        serde_json::from_value::<CssDirectiveStyleDefinition>(serde_json::json!({
            "type": "compose", "order": 1, "className": "block", "selector": ".card"
        }))
        .is_err()
    );
}
