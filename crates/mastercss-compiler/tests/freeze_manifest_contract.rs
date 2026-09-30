//! Public compiler/engine boundary regressions for the 2.0 freeze (#447, #450).
use mastercss_compiler::{
    CompileManifestOptions, CompileNativeCssOptions, compile_css_directives, compile_manifest_input,
};
use mastercss_engine::EngineSession;
use mastercss_schema::{MasterCssManifest, MatchStatus};

fn manifest(source: &str) -> MasterCssManifest {
    let parsed = compile_css_directives(source, &CompileNativeCssOptions::default()).unwrap();
    let compiled =
        compile_manifest_input(&parsed.manifest_input, &CompileManifestOptions::default()).unwrap();
    MasterCssManifest::new(compiled.manifest).unwrap()
}

#[test]
fn variant_and_breakpoint_wrappers_survive_manifest_roundtrip_and_batch_order() {
    // Current-language counterpart of the old RC report #444. Keep both wrappers:
    // joining media features with a space creates invalid CSS.
    let original = manifest(
        r#"
        @mixin --dark {
            @media (prefers-color-scheme: dark) { @contents; }
        }
        @mixin --sm { @media (width >= 40rem) { @contents; } }
        @theme { --color-brand: red; --paint-brand: var(--color-brand);  }
        @mixin --paint(--key <string>) { color: var(ident("--paint-" var(--key))); }
        "#,
    );
    let encoded = original.to_json().unwrap();
    let reloaded = MasterCssManifest::parse(&encoded).unwrap();
    assert_eq!(original, reloaded);
    let classes = [
        "paint-brand@apply(--dark)@apply(--sm)",
        "padding:8px@apply(--sm)@apply(--dark)",
    ];
    let mut batched = EngineSession::create(&encoded).unwrap();
    let mut incremental = EngineSession::create(&reloaded.to_json().unwrap()).unwrap();
    for class in classes {
        let inspection = batched.inspect(class).unwrap();
        assert_eq!(inspection.match_status, MatchStatus::Matched, "{class}");
        assert!(!inspection.rules.is_empty(), "{class}");
        for rule in inspection.rules {
            assert_eq!(rule.text.matches("@media").count(), 2, "{}", rule.text);
            assert!(
                rule.text
                    .replace(' ', "")
                    .contains("prefers-color-scheme:dark"),
                "{}",
                rule.text
            );
            assert!(rule.text.contains("40rem"), "{}", rule.text);
            lightningcss::stylesheet::StyleSheet::parse(&rule.text, Default::default())
                .unwrap_or_else(|error| panic!("{class}: {error}"));
        }
    }
    batched.ensure_class_rules(classes).unwrap();
    for class in classes.into_iter().rev() {
        incremental.ensure_class_rules([class]).unwrap();
    }
    assert_eq!(
        batched.snapshot().unwrap().text,
        incremental.snapshot().unwrap().text
    );
}

#[test]
fn execution_rejects_missing_or_unsupported_versions_before_matching() {
    let original = manifest("@mixin --probe { color:red; }");
    for field in ["version", "languageVersion"] {
        for value in [None, Some(serde_json::json!(999))] {
            let mut invalid = original.as_value().clone();
            let object = invalid.as_object_mut().unwrap();
            match value {
                Some(value) => {
                    object.insert(field.into(), value);
                }
                None => {
                    object.remove(field);
                }
            }
            assert!(
                EngineSession::create(&invalid.to_string()).is_err(),
                "{invalid}"
            );
        }
    }
}
