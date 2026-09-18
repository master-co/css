use mastercss_compiler::{
    CssImportGraphRequest, compose_css_bundle_graph, relocate_css_bundle_resources,
    resolve_prepared_css_stylesheet_graph,
};
use std::collections::HashMap;

const SLOT: &str = "#master-css-slot{--slot:0}";

fn managed() -> mastercss_compiler::CssStylesheetGraph {
    resolve_prepared_css_stylesheet_graph(&CssImportGraphRequest {
        entry: "managed".into(),
        files: HashMap::from([("managed".into(), ".example{background:yellow}".into())]),
        edges: vec![],
    })
    .unwrap()
}

#[test]
fn namespaces_follow_ordinary_fragments_without_leaking_into_managed_graph() {
    let source = format!(
        "@namespace svg url('http://www.w3.org/2000/svg');svg|a{{fill:red}}{SLOT}@media print{{svg|a{{fill:blue}}{SLOT}svg|a{{stroke:green}}}}"
    );
    let result = compose_css_bundle_graph(&source, "bundle", SLOT, &managed()).unwrap();
    for fragment in &result.sources {
        let node = result
            .graph
            .stylesheets
            .iter()
            .find(|n| n.id == fragment.id)
            .unwrap();
        assert!(node.source.contains("@namespace svg"), "{}", node.source);
    }
    let node = result
        .graph
        .stylesheets
        .iter()
        .find(|n| n.id == "managed")
        .unwrap();
    assert!(!node.source.contains("@namespace"));
}

#[test]
fn imports_stay_before_namespace_and_redeclared_defaults_keep_order() {
    let source = format!(
        "@import 'https://example.test/base.css';@namespace 'urn:first';@namespace 'urn:second';a{{color:red}}{SLOT}a{{color:blue}}"
    );
    let result = compose_css_bundle_graph(&source, "bundle", SLOT, &managed()).unwrap();
    assert_eq!(result.sources.len(), 2);
    for fragment in &result.sources {
        let node = result
            .graph
            .stylesheets
            .iter()
            .find(|n| n.id == fragment.id)
            .unwrap();
        assert!(node.source.find("urn:first").unwrap() < node.source.find("urn:second").unwrap());
    }
    let first = result
        .graph
        .stylesheets
        .iter()
        .find(|n| n.id == result.sources[0].id)
        .unwrap();
    assert!(first.source.starts_with("@import"));
    assert!(result.sources[0].prefix.is_empty());
    assert!(!result.sources[1].prefix.is_empty());
}

#[test]
fn relocation_preserves_original_positions_and_namespace_identifiers() {
    let source = format!(
        "/*🦀*/@import 'child.css?rev=1' layer(a);@namespace ns url(namespace-uri);.example{{background:url(before.svg)}}{SLOT}.example{{background-image:image-set('after.svg?q=1#part' 1x,url(big.svg) 2x);mask:url(#local);content:'url(fake.svg)'}}"
    );
    let result = compose_css_bundle_graph(&source, "original.css", SLOT, &managed()).unwrap();
    let mapping = HashMap::from([
        ("child.css?rev=1".into(), "/original/child.css?rev=1".into()),
        ("before.svg".into(), "/original/before.svg".into()),
        (
            "after.svg?q=1#part".into(),
            "https://assets.test/after.svg?q=1#part".into(),
        ),
        ("big.svg".into(), "/original/big.svg".into()),
        ("namespace-uri".into(), "/must-not-change".into()),
    ]);
    let relocated = relocate_css_bundle_resources(&result, &mapping).unwrap();
    assert_eq!(
        serde_json::to_value(&relocated.sources).unwrap(),
        serde_json::to_value(&result.sources).unwrap()
    );
    let resources = result
        .sources
        .iter()
        .flat_map(|s| &s.resources)
        .collect::<Vec<_>>();
    assert_eq!(resources.len(), 3);
    for r in resources {
        let start = mastercss_lexer::utf16_to_byte_offset(&source, r.start).unwrap();
        let end = mastercss_lexer::utf16_to_byte_offset(&source, r.end).unwrap();
        assert!(source[start..end].contains("url(") || source[start..end].contains("image-set("));
    }
    let imports = &result.sources[0].imports;
    assert_eq!(imports[0].url, "child.css?rev=1");
    for node in &relocated.graph.stylesheets {
        assert!(!node.source.contains("must-not-change"));
        if node.id == "managed" {
            assert_eq!(node.source, ".example{background:yellow}");
        }
    }
    assert!(
        relocated
            .graph
            .stylesheets
            .iter()
            .any(|n| n.source.contains("https://assets.test/after.svg?q=1#part"))
    );
    assert!(relocated.graph.stylesheets.iter().any(|n| {
        n.imports
            .iter()
            .any(|i| i.specifier == "/original/child.css?rev=1" && i.statement.contains("layer(a)"))
    }));
}

#[test]
fn missing_or_relative_mapping_does_not_partially_mutate_input() {
    let source = format!(".a{{background:url(before.svg)}}{SLOT}.a{{background:url(after.svg)}}");
    let result = compose_css_bundle_graph(&source, "bundle", SLOT, &managed()).unwrap();
    let before = serde_json::to_value(&result).unwrap();
    for target in ["/original/before.svg", "../still-relative.svg"] {
        let error = relocate_css_bundle_resources(
            &result,
            &HashMap::from([("before.svg".into(), target.into())]),
        )
        .unwrap_err();
        assert!(
            matches!(error, mastercss_compiler::CompilerError::Import { filename, .. } if filename == "bundle")
        );
        assert_eq!(serde_json::to_value(&result).unwrap(), before);
    }
    let source = format!("@import 'relative.css';{SLOT}");
    let result = compose_css_bundle_graph(&source, "bundle", SLOT, &managed()).unwrap();
    assert!(
        relocate_css_bundle_resources(&result, &HashMap::new())
            .unwrap_err()
            .to_string()
            .contains("Missing bundle import URL mapping")
    );
}
