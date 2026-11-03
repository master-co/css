use mastercss_engine::EngineSession;
use mastercss_schema::{LANGUAGE_VERSION, MatchStatus};
use serde_json::json;

fn engine() -> EngineSession {
    let manifest = json!({
        "version": 6,
        "languageVersion": LANGUAGE_VERSION,
        "customMedia": {"--touch": {"type":"or","queries":[
            {"type":"feature","value":"(pointer:coarse)"},
            {"type":"feature","value":"(hover:none)"}
        ]}},
        "mixins": [{"name":"--scope","body":[{"type":"contents","fallback":[]}]}]
    });
    EngineSession::create(&manifest.to_string()).unwrap()
}

#[test]
fn compact_subtraction_chains_stop_normalizing_instead_of_overflowing_the_stack() {
    let engine = engine();
    let chain = vec!["1px"; 200_000].join("-");
    let inspection = engine.inspect(&format!("(width:calc({chain}))")).unwrap();
    assert_eq!(inspection.match_status, MatchStatus::Matched);
    let text = &inspection.rules[0].text;
    assert!(text.starts_with(r".\(width\:calc\("));
    assert!(
        text.contains("{width:calc(1px - 1px - "),
        "{}",
        &text[..200]
    );
    // Past the recursion limit the rest of the chain is left as written.
    assert!(text.contains("1px-1px-1px"));
}

#[test]
fn short_subtraction_chains_are_still_normalized() {
    let engine = engine();
    let inspection = engine.inspect("(width:calc(1px-2px-3px))").unwrap();
    assert!(
        inspection.rules[0]
            .text
            .ends_with("{width:calc(1px - 2px - 3px)}"),
        "{}",
        inspection.rules[0].text
    );
}

#[test]
fn repeated_multi_path_conditions_cannot_expand_exponentially() {
    let engine = engine();
    let inspection = engine.inspect("(display:block)@touch@touch").unwrap();
    assert_eq!(inspection.rules.len(), 4);
    let class = format!("(display:block){}", "@touch".repeat(40));
    assert!(engine.inspect(&class).unwrap().rules.is_empty());
    let applied = format!("(display:block){}@apply(--scope)", "@touch".repeat(40));
    assert!(engine.inspect(&applied).unwrap().rules.is_empty());
}
