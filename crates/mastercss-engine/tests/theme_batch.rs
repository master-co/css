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
            let name = serde_json::to_value(layer).unwrap();
            format!("@layer {}{{{content}}}", name.as_str().unwrap())
        })
        .collect::<String>();
    assert_eq!(text, after.text);
}

#[test]
fn batches_two_hundred_variables_and_replays_ensure_delete_refresh_and_globals() {
    let manifest = json!({
        "version":3,"languageVersion":5,
        "variables": {"": (0..200).map(|i| json!({"name":format!("v{i}"),"key":format!("v{i}"),"values":[{"path":[":root,:host"],"value":"red"}]})).collect::<Vec<_>>()},
        "theme": [{"type":"rule","prelude":":root,:host","children":(0..200).map(|i|json!({"type":"declaration","name":format!("v{i}"),"value":"red"})).collect::<Vec<_>>() }],
        "mixins": (0..200).map(|i| json!({
            "name":format!("--c{i}"), "body":[{"type":"declaration","property":"color","value":[{"type":"text","value":format!("var(--v{i})")}]}]
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
fn batches_scoped_tokens_cyclic_dependencies_and_native_animation_properties() {
    let manifest = json!({
      "version":3,"languageVersion":5,
      "variables": {
        "": [
          {
            "name": "a",
            "key": "a",
            "dependencies": [
              "b"
            ],
            "values": [
              {
                "path": [
                  ":root,:host"
                ],
                "value": "var(--b)"
              }
            ]
          },
          {
            "name": "b",
            "key": "b",
            "dependencies": [
              "a"
            ],
            "values": [
              {
                "path": [
                  ":root,:host"
                ],
                "value": "var(--a)"
              }
            ]
          },
          {
            "name": "stable",
            "key": "stable",
            "values": [
              {
                "path": [
                  ":root,:host"
                ],
                "value": "black"
              }
            ]
          },
          {
            "name": "inline",
            "key": "inline",
            "dependencies": [
              "dynamic"
            ],
            "values": [
              {
                "path": [
                  ":root,:host"
                ],
                "value": "var(--dynamic)"
              }
            ]
          },
          {
            "name": "dynamic",
            "key": "dynamic",
            "values": [
              {
                "path": [
                  ".light"
                ],
                "value": "red"
              },
              {
                "path": [
                  ".dark"
                ],
                "value": "blue"
              }
            ]
          }
        ]
      },
      "mixins": [
        {"name":"--one","body":[
          {"type":"declaration","property":"color","value":[{"type":"text","value":"var(--a)"}]},
          {"type":"declaration","property":"background","value":[{"type":"text","value":"var(--inline)"}]},
          {"type":"declaration","property":"animation","value":[{"type":"text","value":"pulse 1s"}]}
        ]},
        {"name":"--two","body":[
          {"type":"declaration","property":"color","value":[{"type":"text","value":"var(--b)"}]},
          {"type":"declaration","property":"animation","value":[{"type":"text","value":"pulse 1s"}]}
        ]}
      ],
      "variants": [
        {
          "token": "@light",
          "branches": [
            {
              "selector": "&:where(.light,.light *)"
            }
          ]
        },
        {
          "token": "@dark",
          "branches": [
            {
              "selector": "&:where(.dark,.dark *)"
            }
          ]
        }
      ],
      "theme": [
        {
          "type": "rule",
          "prelude": ":root,:host",
          "children": [
            {
              "type": "declaration",
              "name": "a",
              "value": "var(--b)"
            }
          ]
        },
        {
          "type": "rule",
          "prelude": ":root,:host",
          "children": [
            {
              "type": "declaration",
              "name": "b",
              "value": "var(--a)"
            }
          ]
        },
        {
          "type": "rule",
          "prelude": ":root,:host",
          "children": [
            {
              "type": "declaration",
              "name": "stable",
              "value": "black"
            }
          ]
        },
        {
          "type": "rule",
          "prelude": ":root,:host",
          "children": [
            {
              "type": "declaration",
              "name": "inline",
              "value": "var(--dynamic)"
            }
          ]
        },
        {
          "type": "rule",
          "prelude": ".light",
          "children": [
            {
              "type": "declaration",
              "name": "dynamic",
              "value": "red"
            }
          ]
        },
        {
          "type": "rule",
          "prelude": ".dark",
          "children": [
            {
              "type": "declaration",
              "name": "dynamic",
              "value": "blue"
            }
          ]
        }
      ]
    })
    .to_string();
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
        assert!(!after.text.contains("@keyframes"));
        if after.rules.iter().any(|rule| rule.class_name == "one") {
            assert!(after.text.contains("--inline:var(--dynamic)"));
            assert!(after.text.contains(".light{--dynamic:red}"));
            assert!(after.text.contains(".dark{--dynamic:blue}"));
        }
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
