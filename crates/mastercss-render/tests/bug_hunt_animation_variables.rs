use mastercss_render::RenderSession;
use serde_json::{Value, json};

#[test]
fn browser_variable_corpus_retains_exactly_the_expected_animation_union() {
    let cases: Vec<Value> =
        serde_json::from_str(include_str!("bug_hunt_animation_variables.json")).unwrap();
    for case in cases {
        let output = generated(
            case["css"].as_str().unwrap(),
            case["variables"].as_array().unwrap().clone(),
        );
        let mut names = ["fade", "linear", "running"]
            .into_iter()
            .filter(|name| output.contains(&format!("@keyframes {name}")))
            .collect::<Vec<_>>();
        names.sort_unstable();
        assert_eq!(
            serde_json::to_value(names).unwrap(),
            case["retained"],
            "{}: {output}",
            case["id"]
        );
    }
}

fn generated(css: &str, variables: Vec<Value>) -> String {
    let manifest = json!({
        "version": 1,"languageVersion":3,
        "utilities": [],
        "modes": [{"name":"dark","branches":[{"selector":".dark"}]}],
        "variables": {"animation": variables},
        "animations": {
            "fade": {"to": {"opacity": "1"}},
            "auto": {"to": {"opacity": "1"}},
            "linear": {"to": {"opacity": "1"}},
            "running": {"to": {"opacity": "1"}}
        }
    });
    let mut session = RenderSession::create(&manifest.to_string(), None).unwrap();
    session.ensure_stylesheet_resources(css).unwrap();
    session.snapshot().unwrap().snapshot.text
}

#[test]
fn variable_modes_preserve_occupied_slots_and_known_values_do_not_use_fallbacks() {
    let output = generated(
        ".x{animation:var(--animation-ease,fade) linear 1s}",
        vec![json!({"key":"ease", "value":"linear", "modes":{"dark":{"value":"ease"}}})],
    );
    assert!(output.contains("@keyframes linear"));
    assert!(!output.contains("@keyframes fade"));
}

#[test]
fn nested_variables_do_not_merge_tokens_and_mode_branches_do_not_rescue_invalid_names() {
    let output = generated(
        ".x{animation:var(--animation-outer) linear 1s}",
        vec![
            json!({"key":"outer", "value":"var(--animation-inner)"}),
            json!({"key":"inner", "value":"linear", "modes":{"dark":{"value":"fade"}}}),
        ],
    );
    assert!(output.contains("@keyframes linear"));
    assert!(output.contains("@keyframes fade"));
    let output = generated(
        ".x{animation:var(--animation-name) unexpected 1s}",
        vec![json!({"key":"name", "value":"fade", "modes":{"dark":{"value":"running running"}}})],
    );
    assert!(!output.contains("@keyframes"));
    assert!(
        !generated(
            ".x{animation:var(--animation-number)s fade}",
            vec![json!({"key":"number", "value":"1"})],
        )
        .contains("@keyframes")
    );
}

#[test]
fn comma_lists_and_animation_name_have_distinct_slot_rules() {
    let variables = vec![json!({"key":"list", "value":"linear,fade"})];
    let output = generated(
        ".x{animation-name:var(--animation-list)}",
        variables.clone(),
    );
    assert!(output.contains("@keyframes linear"));
    assert!(output.contains("@keyframes fade"));
    assert!(
        !generated(
            ".x{animation-name:var(--animation-list),initial}",
            variables
        )
        .contains("@keyframes")
    );
    assert!(
        !generated(".x{animation:fade 1s,linear unexpected extra}", vec![]).contains("@keyframes")
    );
}

#[test]
fn cycles_are_invalid_even_with_internal_fallbacks_but_outer_fallbacks_work() {
    let variables = vec![
        json!({"key":"a", "value":"var(--animation-b,linear)"}),
        json!({"key":"b", "value":"var(--animation-a,running)"}),
    ];
    let output = generated(".x{animation:var(--animation-a,fade 1s)}", variables);
    assert!(output.contains("@keyframes fade"));
    assert!(!output.contains("@keyframes linear"));
    assert!(!output.contains("@keyframes running"));
    let output = generated(
        ".x{animation:var(--animation-self,fade 1s)}",
        vec![json!({"key":"self", "value":"var(--animation-self,linear)"})],
    );
    assert!(output.contains("@keyframes fade"));
    assert!(!output.contains("@keyframes linear"));
}

#[test]
fn a_valid_mode_branch_survives_another_branch_with_a_cycle() {
    let output = generated(
        ".x{animation:var(--animation-a,fade 1s)}",
        vec![
            json!({"key":"a", "value":"var(--animation-b)"}),
            json!({"key":"b", "value":"linear linear 1s", "modes":{"dark":{"value":"var(--animation-a)"}}}),
        ],
    );
    assert!(output.contains("@keyframes linear"));
    assert!(output.contains("@keyframes fade"));
}

#[test]
fn repeated_mode_diamonds_and_deep_chains_do_not_expand_cartesian_strings() {
    let mut variables = vec![json!({"key":"v0", "value":"linear"})];
    for index in 1..80 {
        variables.push(json!({
            "key": format!("v{index}"),
            "value": format!("var(--animation-v{})", index - 1),
            "modes": {"dark":{"value":format!("var(--animation-v{},ease)", index - 1)}}
        }));
    }
    let output = generated(".x{animation:var(--animation-v79) linear 1s}", variables);
    assert!(output.contains("@keyframes linear"));
    let mut variables = vec![json!({"key":"v0", "value":"fade 1s"})];
    for index in 1..1500 {
        variables.push(
            json!({"key":format!("v{index}"), "value":format!("var(--animation-v{})", index - 1)}),
        );
    }
    assert!(
        generated(".x{animation:var(--animation-v1499)}", variables).contains("@keyframes fade")
    );
}

#[test]
fn auto_duration_preserves_names_required_by_browsers_with_the_older_grammar() {
    assert!(generated(".x{animation:auto 1s}", vec![]).contains("@keyframes auto"));
    let output = generated(".x{animation:auto fade}", vec![]);
    assert!(output.contains("@keyframes fade"));
    assert!(!output.contains("@keyframes auto"));
}
