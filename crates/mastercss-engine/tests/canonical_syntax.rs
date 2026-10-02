use mastercss_engine::EngineSession;
use mastercss_schema::{LANGUAGE_VERSION, MatchStatus};
use serde_json::json;
use std::collections::HashSet;

fn baseline() -> Vec<serde_json::Value> {
    serde_json::from_str(include_str!("fixtures/token-family-baseline.json")).unwrap()
}

// Preserve the original 139-family snapshot; these preset APIs were deliberately retired.
const RETIRED_PRESET_FAMILIES: [&str; 20] = [
    "perspective",
    "perspective-origin",
    "transform-origin",
    "background-position",
    "mask-position",
    "object-position",
    "background-size",
    "mask-size",
    "cx",
    "cy",
    "stroke-dashoffset",
    "x",
    "y",
    "content",
    "font-feature-settings",
    "text-underline",
    "text-decoration",
    "text-stroke",
    "contain-intrinsic-block-size",
    "contain-intrinsic-inline-size",
];

fn engine() -> EngineSession {
    let variables = baseline().into_iter().map(|family| (
        family["namespace"].as_str().unwrap().to_owned(),
        json!([{ "key":"proof", "type":"string", "values":[{"path":[":root"],"value":"1rem"}] }]),
    )).collect::<serde_json::Map<_, _>>();
    let preset: serde_json::Value = serde_json::from_str(include_str!(
        "../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    EngineSession::create(&json!({"version":5,"languageVersion":LANGUAGE_VERSION,"variables":variables,"mixins":preset["mixins"]}).to_string()).unwrap()
}

#[test]
fn every_retained_preset_value_family_preserves_the_frozen_builtin_contract() {
    let engine = engine();
    let mut prefixes = HashSet::new();
    let mut properties = HashSet::new();
    let labels = engine
        .class_completion_candidates()
        .unwrap()
        .into_iter()
        .map(|entry| entry.label)
        .collect::<HashSet<_>>();
    assert_eq!(baseline().len(), 139);
    for family in baseline() {
        let prefix = family["prefix"].as_str().unwrap();
        let property = family["property"].as_str().unwrap();
        if RETIRED_PRESET_FAMILIES.contains(&prefix) {
            for class in [
                format!("{prefix}-proof"),
                format!(
                    "{prefix}(var(--{}-proof))",
                    family["namespace"].as_str().unwrap()
                ),
            ] {
                let result = engine.inspect(&class).unwrap();
                assert_ne!(result.match_status, MatchStatus::Matched, "{class}");
                assert!(result.rules.is_empty(), "{class}");
                assert!(!labels.contains(&class), "{class}");
            }
            // The existing native-declaration fallback accepts unknown property names.
            let suffixed = engine
                .inspect(&format!("{prefix}-proof:hover@layer(utilities)!"))
                .unwrap();
            assert!(
                suffixed.rules[0]
                    .text
                    .contains(&format!("{{{prefix}-proof:hover!important}}"))
            );
            assert_eq!(
                engine
                    .inspect(&format!("{property}:initial"))
                    .unwrap()
                    .match_status,
                MatchStatus::Matched
            );
            continue;
        }
        assert!(prefixes.insert(prefix.to_owned()), "{prefix}");
        assert!(properties.insert(property.to_owned()), "{property}");
        let canonical = format!("{prefix}-proof");
        let result = engine.inspect(&canonical).unwrap();
        assert_eq!(
            result.match_status,
            MatchStatus::Matched,
            "{canonical}: {:?}",
            result.diagnostics
        );
        assert_eq!(result.rules[0].text, family["css"].as_str().unwrap());
        let call = format!(
            "{prefix}(var(--{}-proof))",
            family["namespace"].as_str().unwrap()
        );
        let expanded = engine.inspect(&call).unwrap();
        assert_eq!(expanded.match_status, MatchStatus::Matched, "{call}");
        assert_eq!(
            expanded.rules[0].text.split_once('{').unwrap().1,
            result.rules[0].text.split_once('{').unwrap().1,
            "{call}"
        );
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
    assert_eq!(prefixes.len(), 119);
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
