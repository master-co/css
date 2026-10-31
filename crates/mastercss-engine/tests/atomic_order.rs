use mastercss_engine::{EngineSession, compare_rule_priority};
use mastercss_schema::GeneratedRuleIr;
use serde_json::json;
use std::cmp::Ordering;

fn preset() -> serde_json::Value {
    serde_json::from_str(include_str!(
        "../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap()
}

fn rules(engine: &EngineSession, classes: &[&str]) -> Vec<GeneratedRuleIr> {
    classes
        .iter()
        .flat_map(|class| engine.inspect(class).unwrap().rules)
        .collect()
}

#[test]
fn rule_priority_is_a_total_order() {
    let engine = EngineSession::create(&preset().to_string()).unwrap();
    let rules = rules(
        &engine,
        &[
            "m-md",
            "mt(0)",
            "mx-auto",
            "m(4)",
            "(margin:2rem)",
            "(margin-top:1px)",
            "mxs(10)",
            "ml(0)",
            "b(2)",
            "bt(0)",
            "b-solid",
            "b-red-60",
            "bt-dashed",
            "r-md",
            "rtl(4)",
            "gap(8)",
            "row-gap-md",
            "col-gap(4)",
            "gap-sm",
            "overflow-hidden",
            "overflow-x-auto",
            "truncate",
            "flex",
            "hidden",
            "block",
            "text-center",
            "whitespace-nowrap",
            "sr-only",
            "grid-cols(3)",
            "text-sm",
            "animate-fade",
            "animation-fast",
            "(animation-duration:2s)",
            "select-none",
            "(--gap:1px)",
            "(--Gap:2px)",
            "p-md",
            "p(8)",
            "-mx-md",
            "w-full",
            "order-first",
            "order-last",
            "pill",
            "basis-fit",
            "grow(1)",
            "m-md:hover",
            "mt(0)@sm",
            "block@sm",
            "(color:red)!",
        ],
    );
    assert!(rules.len() > 40);
    for a in &rules {
        assert_eq!(compare_rule_priority(a, a), Ordering::Equal, "{}", a.key);
        for b in &rules {
            let forward = compare_rule_priority(a, b);
            assert_eq!(
                forward,
                compare_rule_priority(b, a).reverse(),
                "{} {}",
                a.key,
                b.key
            );
            for c in &rules {
                if forward != Ordering::Greater && compare_rule_priority(b, c) != Ordering::Greater
                {
                    assert_ne!(
                        compare_rule_priority(a, c),
                        Ordering::Greater,
                        "{} <= {} <= {}",
                        a.key,
                        b.key,
                        c.key
                    );
                }
            }
        }
    }
}

#[test]
fn fixed_names_complete_once_beside_same_named_tokens() {
    let mut manifest = preset();
    let token = |key: &str, value: &str| json!({"key": key, "values": [{"path": [":root,:host"], "value": value}], "dependencies": []});
    manifest["variables"]["text"]
        .as_array_mut()
        .unwrap()
        .push(token("center", "2rem"));
    manifest["variables"]["color"]
        .as_array_mut()
        .unwrap()
        .push(token("solid", "red"));
    let engine = EngineSession::create(&manifest.to_string()).unwrap();
    let labels = engine
        .class_completion_candidates()
        .unwrap()
        .into_iter()
        .map(|entry| entry.label)
        .collect::<Vec<_>>();
    for label in ["text-center", "b-solid", "mx-auto"] {
        assert_eq!(
            labels
                .iter()
                .filter(|candidate| *candidate == label)
                .count(),
            1,
            "{label}"
        );
    }
    // The key still completes for other prefixes of its namespace.
    assert!(labels.iter().any(|label| label == "fg-solid"));
    let text = engine.inspect("text-center").unwrap().rules;
    assert_eq!(text[0].text, ".text-center{text-align:center}");
}
