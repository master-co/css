use mastercss_engine::EngineSession;
use mastercss_schema::{EngineSnapshotIr, EngineTransitionIr, RuleMutationIr, RuleTarget};
use serde_json::json;

fn target(mutation: &RuleMutationIr) -> RuleTarget {
    match mutation {
        RuleMutationIr::Insert { target, .. } | RuleMutationIr::Delete { target, .. } => *target,
    }
}

fn assert_replay(
    before: &EngineSnapshotIr,
    transition: &EngineTransitionIr,
    after: &EngineSnapshotIr,
) {
    let layers = [
        RuleTarget::Theme,
        RuleTarget::Base,
        RuleTarget::Defaults,
        RuleTarget::Components,
        RuleTarget::Utilities,
        RuleTarget::Keyframes,
    ];
    let mut rules = layers.map(|layer| (layer, Vec::<(String, String)>::new()));
    if let Some(text) = &before.resources.theme_text {
        rules[0].1.push(("theme:root".into(), text.clone()));
    }
    for rule in &before.rules {
        rules
            .iter_mut()
            .find(|(layer, _)| *layer == RuleTarget::from(rule.layer))
            .unwrap()
            .1
            .push((rule.key.clone(), rule.text.clone()));
    }
    for animation in &before.resources.animations {
        rules[5]
            .1
            .push((animation.name.clone(), animation.text.clone()));
    }
    let themes = transition
        .mutations
        .iter()
        .take_while(|mutation| target(mutation) == RuleTarget::Theme)
        .count();
    assert!(themes <= 2);
    assert!(
        transition.mutations[themes..]
            .iter()
            .all(|mutation| target(mutation) != RuleTarget::Theme)
    );
    for mutation in &transition.mutations {
        let rules = &mut rules
            .iter_mut()
            .find(|(layer, _)| *layer == target(mutation))
            .unwrap()
            .1;
        match mutation {
            RuleMutationIr::Insert {
                index, key, text, ..
            } => rules.insert(*index as usize, (key.clone(), text.clone())),
            RuleMutationIr::Delete { index, key, .. } => {
                assert_eq!(rules.remove(*index as usize).0, *key)
            }
        }
    }
    let text = rules
        .into_iter()
        .filter(|(_, rules)| !rules.is_empty())
        .map(|(layer, rules)| {
            let content = rules.into_iter().map(|(_, text)| text).collect::<String>();
            if layer == RuleTarget::Keyframes {
                return content;
            }
            let name = serde_json::to_value(layer).unwrap();
            format!("@layer {}{{{content}}}", name.as_str().unwrap())
        })
        .collect::<String>();
    assert_eq!(text, after.text);
}

#[test]
fn batches_two_hundred_variables_and_replays_ensure_delete_refresh_and_globals() {
    let manifest = json!({
        "version": 1,"languageVersion":3,
        "variables": {"": (0..200).map(|i| json!({"name":format!("v{i}"),"key":format!("v{i}"),"value":"red"})).collect::<Vec<_>>()},
        "utilities": (0..200).map(|i| json!({
            "id":format!("c{i}"),"name":format!("c{i}"),"type":0,
            "matchers":[{"type":"static","name":format!("c{i}")}],
            "emit":{"type":"static","rules":[{"declarations":{"color":format!("var(--v{i})")}}]}
        })).collect::<Vec<_>>()
    }).to_string();
    let classes = (0..200).map(|i| format!("c{i}")).collect::<Vec<_>>();
    let mut engine = EngineSession::create(&manifest).unwrap();
    let before = engine.snapshot().unwrap();
    let transition = engine.ensure_class_rules(&classes).unwrap();
    let inserted = engine.snapshot().unwrap();
    assert_eq!(
        transition
            .mutations
            .iter()
            .filter(|mutation| target(mutation) == RuleTarget::Theme)
            .count(),
        1
    );
    assert!(matches!(
        transition.mutations[0],
        RuleMutationIr::Insert {
            target: RuleTarget::Theme,
            ..
        }
    ));
    assert_eq!(inserted.resources.variables.len(), 200);
    assert!(
        inserted
            .resources
            .variables
            .iter()
            .all(|variable| variable.ref_count == 1)
    );
    assert_replay(&before, &transition, &inserted);
    let refresh = engine.refresh(&manifest).unwrap();
    assert!(
        !refresh
            .mutations
            .iter()
            .any(|mutation| target(mutation) == RuleTarget::Theme)
    );
    assert_eq!(inserted, engine.snapshot().unwrap());
    assert_replay(&inserted, &refresh, &engine.snapshot().unwrap());
    let globals = engine
        .register_emitted_globals(r#"{"variables":{"v0":1,"v1":2}}"#)
        .unwrap();
    let after_globals = engine.snapshot().unwrap();
    assert_replay(&inserted, &globals, &after_globals);
    let deleted = engine.delete_class_rules(&classes).unwrap();
    let after_delete = engine.snapshot().unwrap();
    assert_replay(&after_globals, &deleted, &after_delete);
    assert_eq!(
        deleted
            .mutations
            .iter()
            .filter(|mutation| target(mutation) == RuleTarget::Theme)
            .count(),
        1
    );
    assert!(after_delete.resources.variables.is_empty());
}

#[test]
fn batches_static_dynamic_inline_cyclic_dependencies_modes_and_keyframes() {
    let manifest = json!({
        "version":1,"languageVersion":3,
        "modes":[{"name":"light","branches":[{"selector":".light","conditions":[]}]},{"name":"dark","branches":[{"selector":".dark","conditions":[]}]}],
        "variables":{"": [
            {"name":"a","key":"a","value":"var(--b)","dependencies":["b"]},
            {"name":"b","key":"b","value":"var(--a)","dependencies":["a"]},
            {"name":"stable","key":"stable","value":"black","static":true},
            {"name":"inline","key":"inline","value":"var(--dynamic)","inline":true,"dependencies":["dynamic"]},
            {"name":"dynamic","key":"dynamic","modes":{"light":{"value":"red"},"dark":{"value":"blue"}}}
        ]},
        "animations":{"pulse":{"to":{"color":"var(--dynamic)"}}},
        "utilities":[
            {"id":"one","name":"one","type":0,"matchers":[{"type":"static","name":"one"}],"emit":{"type":"static","rules":[{"declarations":{"color":"var(--a)","background":"var(--inline)","animation":"pulse 1s"}}]}},
            {"id":"two","name":"two","type":0,"layer":"base","matchers":[{"type":"static","name":"two"}],"emit":{"type":"static","rules":[{"declarations":{"color":"var(--b)","animation":"pulse 1s"}}]}}
        ]
    }).to_string();
    let mut engine = EngineSession::create(&manifest).unwrap();
    for (insert, classes) in [
        (true, vec!["one", "two"]),
        (false, vec!["one"]),
        (true, vec!["one"]),
        (false, vec!["two", "one"]),
    ] {
        let before = engine.snapshot().unwrap();
        let transition = if insert {
            engine.ensure_class_rules(classes)
        } else {
            engine.delete_class_rules(classes)
        }
        .unwrap();
        let after = engine.snapshot().unwrap();
        assert_replay(&before, &transition, &after);
        assert!(
            !after
                .resources
                .variables
                .iter()
                .any(|variable| variable.name == "inline")
        );
    }
    let before = engine.snapshot().unwrap();
    let transition = engine
        .ensure_stylesheet_resources(
            "a{color:var(--a);background:var(--dynamic);animation:pulse 1s}",
        )
        .unwrap();
    let after = engine.snapshot().unwrap();
    assert_replay(&before, &transition, &after);
    let repeated = engine
        .ensure_stylesheet_resources(
            "a{color:var(--a);background:var(--dynamic);animation:pulse 1s}",
        )
        .unwrap();
    assert!(repeated.mutations.is_empty());
    assert_replay(&after, &repeated, &engine.snapshot().unwrap());
}
