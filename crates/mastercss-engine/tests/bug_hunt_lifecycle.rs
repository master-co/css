use std::collections::BTreeMap;

use mastercss_engine::EngineSession;
use mastercss_schema::{EngineSnapshotIr, EngineTransitionIr, RuleMutationIr};

const MANIFEST: &str = include_str!("../../../packages/preset/src/default-manifest.json");
type Mirror = BTreeMap<String, Vec<(String, String)>>;

fn apply(mirror: &mut Mirror, transition: EngineTransitionIr) {
    for mutation in transition.mutations {
        match mutation {
            RuleMutationIr::Insert {
                target,
                index,
                key,
                text,
                ..
            } => {
                let target = serde_json::to_string(&target).unwrap();
                let rules = mirror.entry(target).or_default();
                assert!(index as usize <= rules.len(), "insert index {index}");
                rules.insert(index as usize, (key, text));
            }
            RuleMutationIr::Delete { target, index, key } => {
                let target = serde_json::to_string(&target).unwrap();
                let rules = mirror.entry(target).or_default();
                assert!((index as usize) < rules.len(), "delete index {index}");
                assert_eq!(
                    rules.remove(index as usize).0,
                    key,
                    "delete key/index mismatch"
                );
            }
        }
    }
}

fn assert_snapshot(mirror: &Mirror, snapshot: &EngineSnapshotIr) {
    let mut expected: Mirror = BTreeMap::new();
    if let Some(text) = &snapshot.resources.theme_text {
        expected
            .entry("\"theme\"".into())
            .or_default()
            .push(("theme:root".into(), text.clone()));
    }
    for animation in &snapshot.resources.animations {
        expected
            .entry("\"keyframes\"".into())
            .or_default()
            .push((animation.name.clone(), animation.text.clone()));
    }
    for rule in &snapshot.rules {
        expected
            .entry(serde_json::to_string(&rule.layer).unwrap())
            .or_default()
            .push((rule.key.clone(), rule.text.clone()));
    }
    let actual: Mirror = mirror
        .iter()
        .filter(|(_, v)| !v.is_empty())
        .map(|(k, v)| (k.clone(), v.clone()))
        .collect();
    assert_eq!(actual, expected);
}

#[test]
fn audit_transition_replay_matches_snapshot_through_256_operations() {
    let mut engine = EngineSession::create(MANIFEST).unwrap();
    let mut mirror = Mirror::new();
    apply(&mut mirror, engine.refresh(MANIFEST).unwrap());
    let classes = [
        "block",
        "hidden",
        "fg:red-60",
        "bg:red-60",
        "m:md",
        "p:md",
        "w:10px:hover@sm",
        "animate:spin",
        "block@base",
        "block@default",
        "block!",
        "invalid-unknown",
    ];
    let mut active = Vec::new();
    for step in 0..256 {
        let class = classes[(step * 17 + step / 7) % classes.len()];
        let transition = match step % 7 {
            0 => {
                active.retain(|item| *item != class);
                engine
                    .delete_class_rules([class, class, "not-connected"])
                    .unwrap()
            }
            1 => engine.refresh(MANIFEST).unwrap(),
            _ => {
                if engine.inspect(class).unwrap().match_status
                    == mastercss_schema::MatchStatus::Matched
                    && !active.contains(&class)
                {
                    active.push(class);
                }
                engine.ensure_class_rules([class, class, ""]).unwrap()
            }
        };
        apply(&mut mirror, transition);
        assert_snapshot(&mirror, &engine.snapshot().unwrap());
        let mut fresh = EngineSession::create(MANIFEST).unwrap();
        fresh.ensure_class_rules(&active).unwrap();
        assert_eq!(
            engine.snapshot().unwrap(),
            fresh.snapshot().unwrap(),
            "step {step}"
        );
    }
    apply(&mut mirror, engine.delete_class_rules(active).unwrap());
    assert_snapshot(&mirror, &engine.snapshot().unwrap());
    assert_eq!(
        engine.snapshot().unwrap(),
        EngineSession::create(MANIFEST).unwrap().snapshot().unwrap()
    );
}

#[test]
fn audit_invalid_refresh_preserves_active_state_and_disposal_is_repeatable() {
    let mut engine = EngineSession::create(MANIFEST).unwrap();
    engine.ensure_class_rules(["block", "fg:red-60"]).unwrap();
    let before = engine.snapshot().unwrap();
    for invalid in [
        "{",
        r#"{"version":999}"#,
        r#"{"version":1,"languageVersion":2,"utilities":null}"#,
    ] {
        assert!(engine.refresh(invalid).is_err());
        assert_eq!(engine.snapshot().unwrap(), before);
    }
    engine.dispose();
    engine.dispose();
    assert!(engine.snapshot().is_err());
    assert!(engine.refresh(MANIFEST).is_err());
    assert!(engine.ensure_class_rules(["block"]).is_err());
    assert!(engine.delete_class_rules(["block"]).is_err());
}
