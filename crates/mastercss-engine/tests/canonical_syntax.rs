use mastercss_engine::{EngineSession, builtin_token_families};
use mastercss_schema::{LANGUAGE_VERSION, MatchStatus};
use serde_json::json;
use std::collections::HashSet;

fn engine() -> EngineSession {
    let mut variables = serde_json::Map::new();
    for (_, _, namespaces) in builtin_token_families() {
        for namespace in namespaces {
            variables.insert(
                namespace.trim_start_matches('~').into(),
                json!([
                    {"key":"proof","type":"string","values":[{"path":[":root"],"value":"1rem"}]}
                ]),
            );
        }
    }
    EngineSession::create(
        &json!({"version":4,"languageVersion":LANGUAGE_VERSION,"variables":variables}).to_string(),
    )
    .unwrap()
}

#[test]
fn every_builtin_family_has_exactly_one_entry() {
    let engine = engine();
    let mut prefixes = HashSet::new();
    let mut properties = HashSet::new();
    let labels = engine
        .class_completion_candidates()
        .unwrap()
        .into_iter()
        .map(|entry| entry.label)
        .collect::<HashSet<_>>();
    for (prefix, property, namespaces) in builtin_token_families() {
        assert!(prefixes.insert(prefix), "{prefix}");
        assert!(properties.insert(property), "{property}");
        assert_eq!(namespaces.len(), 1);
        let canonical = format!("{prefix}-proof");
        let result = engine.inspect(&canonical).unwrap();
        assert_eq!(
            result.match_status,
            MatchStatus::Matched,
            "{canonical}: {:?}",
            result.diagnostics
        );
        assert!(result.rules[0].text.contains(&format!(
            "{property}:var(--{}-proof)",
            namespaces[0].trim_start_matches('~')
        )));
        assert!(labels.contains(&canonical), "{canonical}");
        if prefix != property {
            for suffix in ["", ":hover", ":hover@layer(utilities)!"] {
                let retired = format!("{property}-proof{suffix}");
                let result = engine.inspect(&retired).unwrap();
                assert_ne!(result.match_status, MatchStatus::Matched, "{retired}");
                assert!(result.rules.is_empty(), "{retired}");
            }
            assert!(!labels.contains(&format!("{property}-proof")));
        }
        assert_eq!(
            engine
                .inspect(&format!("{property}:initial"))
                .unwrap()
                .match_status,
            MatchStatus::Matched
        );
    }
    for class in [
        "font-proof",
        "filter-proof",
        "backdrop-filter-proof",
        "text-shadow-proof",
    ] {
        assert_ne!(
            engine.inspect(class).unwrap().match_status,
            MatchStatus::Matched,
            "{class}"
        );
        assert!(!labels.contains(class));
    }
    assert!(!labels.contains(":of"));
    assert!(!labels.contains(":first"));
}

#[test]
fn literal_values_and_math_are_separate() {
    let engine = engine();
    for (input, output) in [
        ("calc(1px+2px)", "calc(1px + 2px)"),
        ("min(1px+2px,4px)", "min(1px + 2px, 4px)"),
        ("max(100%-1rem,2px)", "max(100% - 1rem, 2px)"),
        ("clamp(1px,2px+3px,4px)", "clamp(1px, 2px + 3px, 4px)"),
        ("calc(1.5625rem-.625rem)", "calc(1.5625rem - .625rem)"),
        ("calc(1px-2px)", "calc(1px - 2px)"),
        ("calc(1px-2e-3px)", "calc(1px - 2e-3px)"),
        ("calc(1e-3*2)", "calc(1e-3 * 2)"),
        ("calc(-1px+-2px)", "calc(-1px + -2px)"),
        (
            "calc(var(--a-b)+env(safe-area-inset-top))",
            "calc(var(--a-b) + env(safe-area-inset-top))",
        ),
        ("'calc(1+2)'", "'calc(1+2)'"),
        ("url(calc(1+2))", "url(calc(1+2))"),
        ("var(--x,calc(1px+2px))", "var(--x,calc(1px + 2px))"),
        ("'clamp(1+2,3,4)'", "'clamp(1+2,3,4)'"),
        ("calc(1px/*+*/+2px)", "calc(1px/*+*/ + 2px)"),
    ] {
        let class = format!("--example:{input}");
        let rules = engine.composition_rules(&class).unwrap();
        assert_eq!(rules[0].declarations[0].value, output, "{class}");
        let normalized = format!("--example:{}", output.replace(' ', "|"));
        if !output.starts_with('\'') {
            assert_eq!(
                engine.composition_rules(&normalized).unwrap()[0].declarations[0].value,
                output,
                "idempotence: {class}"
            );
        }
    }
}

#[test]
fn native_selectors_keep_literal_spelling() {
    let engine = engine();
    for (suffix, expected) in [
        ("_span", " span"),
        ("[data-id='a_b']", "[data-id='a_b']"),
        (r".foo\_bar", r".foo\_bar"),
        (":lang(en_US)", ":lang(en_US)"),
        (":future(a_b)", ":future(a_b)"),
        (".foo__bar", ".foo__bar"),
        (".foo_", ".foo_"),
        (":is(.foo_)", ":is(.foo_)"),
        (":is(_foo)", ":is(_foo)"),
        (":is(.foo_span)", ":is(.foo span)"),
        (".foo/*a_b*/_span", ".foo/*a_b*/ span"),
        (":before", ":before"),
        ("::slider-thumb", "::slider-thumb"),
        ("::-webkit-slider-thumb", "::-webkit-slider-thumb"),
        (
            ":is(:first-child,[data-id=':first'])",
            ":is(:first-child,[data-id=':first'])",
        ),
    ] {
        let result = engine.inspect(&format!("display:block{suffix}")).unwrap();
        assert_eq!(result.match_status, MatchStatus::Matched, "{suffix}");
        assert!(
            result.rules[0]
                .selector_text
                .as_ref()
                .unwrap()
                .ends_with(expected)
        );
        assert_eq!(engine.resolve_style_selector(suffix).unwrap(), suffix);
    }
    for suffix in [
        ":first",
        ":last",
        ":odd",
        ":even",
        ":only",
        ":rtl",
        ":ltr",
        ":is(:first)",
        ":of(2)",
    ] {
        let result = engine.inspect(&format!("display:block{suffix}")).unwrap();
        assert_eq!(result.match_status, MatchStatus::SyntaxError, "{suffix}");
        assert!(result.rules.is_empty());
        assert!(result.diagnostics[0].message.contains("use"));
    }
}

#[test]
fn native_properties_accept_unicode_and_escapes() {
    let engine = engine();
    for property in ["--色", r"--\008272", r"--a\:b", r"c\00006flor"] {
        let rules = engine
            .composition_rules(&format!("{property}:red:hover"))
            .unwrap();
        assert_eq!(rules.len(), 1, "{property}");
        assert_eq!(rules[0].declarations[0].property, property);
        assert_eq!(rules[0].declarations[0].value, "red");
    }
}

#[test]
fn language_nine_manifests_must_be_recompiled() {
    assert!(EngineSession::create(r#"{"version":4,"languageVersion":9}"#).is_err());
}
