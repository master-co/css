use std::collections::HashMap;

use mastercss_compiler::{
    CssImportGraphRequest, CssStylesheetGraph, compose_css_bundle_graph,
    render_css_stylesheet_graph, resolve_prepared_css_stylesheet_graph,
};
use mastercss_lexer::utf16_to_byte_offset;

const SLOT: &str = "#master-css-slot{--slot:0}";

fn managed() -> CssStylesheetGraph {
    resolve_prepared_css_stylesheet_graph(&CssImportGraphRequest {
        entry: "managed".into(),
        files: HashMap::from([(
            "managed".into(),
            "@import 'https://remote.test/style.css';.example{color:blue}".into(),
        )]),
        edges: vec![],
    })
    .unwrap()
}

#[test]
fn separates_complete_rules_and_preserves_original_utf16_sources() {
    let source = format!("/*🦀*/.example{{color:red}}{SLOT}.example{{color:green}};");
    let result = compose_css_bundle_graph(&source, "bundle", SLOT, &managed()).unwrap();
    assert_eq!(result.slots, 1);
    assert_eq!(result.sources.len(), 2);
    let root = result
        .graph
        .stylesheets
        .iter()
        .find(|n| n.id == "bundle")
        .unwrap();
    assert_eq!(root.imports.len(), 3);
    assert_eq!(root.imports[1].resolved.as_deref(), Some("managed"));
    for fragment in &result.sources {
        let start = utf16_to_byte_offset(&source, fragment.range.start).unwrap();
        let end = utf16_to_byte_offset(&source, fragment.range.end).unwrap();
        let node = result
            .graph
            .stylesheets
            .iter()
            .find(|n| n.id == fragment.id)
            .unwrap();
        assert_eq!(node.source, source[start..end]);
        assert_eq!(fragment.filename, "bundle");
    }
}

#[test]
fn complete_slot_matching_ignores_trivia_but_not_strings_or_larger_rules() {
    let source = format!(
        r#"/*{SLOT}*/.x{{content:"{SLOT}";--data:{{x:y}}}}#master-css-slot.extra{{--slot:0}}#master-css-slot /*trivia*/ {{ --slot: 0; }}"#
    );
    let result = compose_css_bundle_graph(&source, "bundle", SLOT, &managed()).unwrap();
    assert_eq!(result.slots, 1);
    let ordinary = &result
        .graph
        .stylesheets
        .iter()
        .find(|n| n.id == result.sources[0].id)
        .unwrap()
        .source;
    assert!(ordinary.contains("--data:{x:y}"));
    assert!(ordinary.contains("#master-css-slot.extra"));
    assert!(ordinary.contains(&format!("content:\"{SLOT}\"")));
}

#[test]
fn keeps_nested_conditions_and_one_shared_anonymous_layer() {
    let source = format!(
        "@layer {{.before{{color:red}}@supports (display:grid){{@media print{{{SLOT}}}}}.after{{color:green}}}}"
    );
    let result = compose_css_bundle_graph(&source, "bundle", SLOT, &managed()).unwrap();
    let urls = result
        .graph
        .stylesheets
        .iter()
        .enumerate()
        .map(|(i, n)| (n.id.clone(), format!("/assets/{i}.css")))
        .collect();
    let assets = render_css_stylesheet_graph(&result.graph, &urls).unwrap();
    let root = assets.iter().find(|a| a.id == "bundle").unwrap();
    assert_eq!(root.css.matches(" layer;").count(), 1);
    assert!(
        assets
            .iter()
            .any(|a| a.css.contains("supports(display: grid)")),
        "{assets:?}"
    );
    assert!(assets.iter().any(|a| a.css.contains(" print;")));
    assert_eq!(
        assets
            .iter()
            .map(|a| a.css.matches(" layer;").count())
            .sum::<usize>(),
        1
    );
    let group = &result
        .graph
        .stylesheets
        .iter()
        .find(|n| n.id == "bundle")
        .unwrap()
        .imports[0];
    let group = result
        .graph
        .stylesheets
        .iter()
        .find(|n| Some(&n.id) == group.resolved.as_ref())
        .unwrap();
    assert_eq!(
        group.imports.len(),
        3,
        "before/conditional managed/after share this one layer"
    );
}

#[test]
fn retains_every_occurrence_and_avoids_managed_id_collisions() {
    let mut graph = managed();
    graph
        .stylesheets
        .push(mastercss_compiler::CssStylesheetNode {
            id: "bundle#master-css-part-0".into(),
            source: "".into(),
            imports: vec![],
        });
    let result = compose_css_bundle_graph(
        &format!(".a{{color:red}}{SLOT}@layer named{{{SLOT}}}{SLOT}"),
        "bundle",
        SLOT,
        &graph,
    )
    .unwrap();
    assert_eq!(result.slots, 3);
    let count = result
        .graph
        .stylesheets
        .iter()
        .flat_map(|n| &n.imports)
        .filter(|e| e.resolved.as_deref() == Some("managed"))
        .count();
    assert_eq!(count, 3);
    let mut ids = result
        .graph
        .stylesheets
        .iter()
        .map(|n| &n.id)
        .collect::<Vec<_>>();
    ids.sort();
    ids.dedup();
    assert_eq!(ids.len(), result.graph.stylesheets.len());
}

#[test]
fn leaves_absent_slots_untouched_and_reports_unimplemented_contexts() {
    let source = ".plain{color:red}";
    let result = compose_css_bundle_graph(source, "bundle", SLOT, &managed()).unwrap();
    assert_eq!(result.slots, 0);
    assert_eq!(result.graph.stylesheets.len(), 1);
    assert_eq!(result.graph.stylesheets[0].source, source);
    for source in [
        format!(".a{{color:red}}@namespace svg 'http://www.w3.org/2000/svg';{SLOT}"),
        format!(".a{{color:red}}@import 'late.css';{SLOT}"),
        format!("@container (width>1px){{{SLOT}}}"),
        format!(".outer{{{SLOT}}}"),
        format!("@media print{{@import 'invalid.css';{SLOT}}}"),
    ] {
        assert!(
            compose_css_bundle_graph(&source, "bundle", SLOT, &managed()).is_err(),
            "{source}"
        );
    }
    assert!(compose_css_bundle_graph(SLOT, "managed", SLOT, &managed()).is_err());
    assert!(compose_css_bundle_graph(SLOT, "bundle", "", &managed()).is_err());
}

#[test]
fn deep_wrappers_are_iterative_and_repeated_plans_are_stable() {
    let source = format!("{}{}{}", "@media all{".repeat(512), SLOT, "}".repeat(512));
    let first = compose_css_bundle_graph(&source, "bundle", SLOT, &managed()).unwrap();
    let second = compose_css_bundle_graph(&source, "bundle", SLOT, &managed()).unwrap();
    assert_eq!(first.slots, 1);
    assert_eq!(first.graph.stylesheets.len(), 514);
    assert_eq!(
        serde_json::to_value(first).unwrap(),
        serde_json::to_value(second).unwrap()
    );
    assert!(
        compose_css_bundle_graph(&format!("@media print{{{SLOT}"), "bundle", SLOT, &managed())
            .is_err()
    );
}
