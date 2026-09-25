use mastercss_compiler::{CompileNativeCssOptions, compile_css_directives};
use serde_json::Value;

#[test]
fn native_output_retains_original_rule_locations_after_consumed_directives() {
    let source = "/* 😀 */\n@master entry;\n@theme { --gap: 2rem; }\n.card { padding: 1rem; }";
    let result = compile_css_directives(
        source,
        &CompileNativeCssOptions {
            from: "/project/entry.scss".into(),
            ..Default::default()
        },
    )
    .unwrap();
    let value = serde_json::to_value(&result).unwrap();
    let mappings = value["nativeMappings"]
        .as_array()
        .expect("native output mappings");
    let mapping = mappings
        .iter()
        .find(|mapping| {
            let offset = mapping["generatedStart"].as_u64().unwrap() as usize;
            String::from_utf16(
                &result
                    .native_css
                    .encode_utf16()
                    .skip(offset)
                    .collect::<Vec<_>>(),
            )
            .unwrap()
            .starts_with(".card")
        })
        .expect("card mapping");
    assert_eq!(
        mapping["source"]["file"],
        Value::from("/project/entry.scss")
    );
    assert_eq!(mapping["source"]["loc"]["start"]["line"], Value::from(4));
    assert_eq!(
        mapping["source"]["range"]["start"],
        Value::from(
            source[..source.find(".card").unwrap()]
                .encode_utf16()
                .count()
        )
    );
}

#[test]
fn native_output_maps_nested_rules_to_their_own_origins() {
    let source = "@media screen {\n  .card { color: red; }\n}\n.plain { padding: 2rem; }";
    let result = compile_css_directives(source, &CompileNativeCssOptions::default()).unwrap();
    let value = serde_json::to_value(&result).unwrap();
    let mappings = value["nativeMappings"]
        .as_array()
        .expect("native output mappings");
    for selector in [".card", ".plain"] {
        let original = source[..source.find(selector).unwrap()]
            .encode_utf16()
            .count();
        assert!(
            mappings.iter().any(
                |mapping| mapping["source"]["range"]["start"].as_u64() == Some(original as u64)
            ),
            "{selector}"
        );
    }
}

#[test]
fn native_rule_anchors_survive_crlf_unicode_masks_variants_and_minification() {
    for source in [
        "@reference \"./😀.css\";.card { padding: 1rem; }",
        "/* 😀 */\r\n@master entry;\r\n.card { padding: 1rem; }",
        "@utilities { paint { color: red } } .managed { @variant dark { @compose paint; } } .card { padding: 1rem; }",
        ".empty {} .card { padding: 1rem; } .after { color: blue; }",
        "@layer base { @supports (display:grid) { .card { padding: 1rem; } } }",
    ] {
        let result = compile_css_directives(source, &CompileNativeCssOptions::default()).unwrap();
        let original = source[..source.find(".card").unwrap()]
            .encode_utf16()
            .count() as u32;
        let mapping = result
            .native_mappings
            .iter()
            .find(|mapping| mapping.source.range.start == original)
            .unwrap_or_else(|| {
                panic!(
                    "missing card mapping for {source}: {:?}",
                    result.native_mappings
                )
            });
        let suffix = String::from_utf16(
            &result
                .native_css
                .encode_utf16()
                .skip(mapping.generated_start as usize)
                .collect::<Vec<_>>(),
        )
        .unwrap();
        assert!(suffix.starts_with(".card"), "{source}: {suffix}");
    }
}

#[test]
fn lower_output_retains_compose_and_native_declaration_origins() {
    let source =
        "@utilities { paint { padding: 2rem; } }\n.card {\n @compose paint;\n color: red;\n}";
    let parsed = compile_css_directives(
        source,
        &CompileNativeCssOptions {
            from: "/project/entry.css".into(),
            ..Default::default()
        },
    )
    .unwrap();
    let result = mastercss_compiler::lower_css_directives(
        &parsed.manifest_input,
        &parsed.style_definitions.unwrap(),
        &[],
        &Default::default(),
    )
    .unwrap();
    let value = serde_json::to_value(&result).unwrap();
    let mappings = value["generatedMappings"]
        .as_array()
        .expect("lowered output mappings");
    for (generated, authored) in [
        (".card", ".card"),
        ("padding", "paint;"),
        ("color", "color:"),
    ] {
        let offset = result.generated_css[..result.generated_css.find(generated).unwrap()]
            .encode_utf16()
            .count() as u64;
        let mapping = mappings
            .iter()
            .find(|mapping| mapping["generatedStart"].as_u64() == Some(offset))
            .expect(generated);
        assert_eq!(mapping["source"]["file"], "/project/entry.css");
        let start = mapping["source"]["range"]["start"].as_u64().unwrap() as usize;
        let end = mapping["source"]["range"]["end"].as_u64().unwrap() as usize;
        let units = source.encode_utf16().collect::<Vec<_>>();
        let authored_start = source[..source.find(authored).unwrap()]
            .encode_utf16()
            .count();
        assert!(
            start <= authored_start && authored_start <= end,
            "{generated}: {start}..{end}, expected {authored_start}: {:?}, mappings={mappings:?}",
            String::from_utf16(&units[start..end])
        );
    }
}

#[test]
fn expanded_import_graph_retains_copied_spans_through_references_wrappers_and_hoisting() {
    use mastercss_compiler::{
        CssImportGraphEdge, CssImportGraphRequest, resolve_prepared_css_import_graph,
    };
    use std::collections::HashMap;
    let entry = "/* 😀 */\n@reference './tokens.css';\n@import './child.css' layer(cards) print;\n@import 'https://example.test/external.css';\n.root { color: red }\n@import './child.css';";
    let child = "/* authored child */\n@reference './tokens.css';\n.child { padding: 2rem; }";
    let files = HashMap::from([
        ("/entry.css".into(), entry.into()),
        ("/child.css".into(), child.into()),
    ]);
    let request = CssImportGraphRequest {
        entry: "/entry.css".into(),
        files: files.clone(),
        edges: vec![CssImportGraphEdge {
            from: "/entry.css".into(),
            specifier: "./child.css".into(),
            resolved: "/child.css".into(),
        }],
    };
    let result = resolve_prepared_css_import_graph(&request).unwrap();
    let value = serde_json::to_value(&result).unwrap();
    let mappings = value["sourceMappings"]
        .as_array()
        .expect("copied graph spans");
    let generated = result.source.encode_utf16().collect::<Vec<_>>();
    for mapping in mappings {
        let start = mapping["generatedStart"].as_u64().unwrap() as usize;
        let end = mapping["generatedEnd"].as_u64().unwrap() as usize;
        let source = &files[mapping["source"]["file"].as_str().unwrap()];
        let original = source.encode_utf16().collect::<Vec<_>>();
        let original_start = mapping["source"]["range"]["start"].as_u64().unwrap() as usize;
        let original_end = mapping["source"]["range"]["end"].as_u64().unwrap() as usize;
        assert_eq!(
            &generated[start..end],
            &original[original_start..original_end]
        );
    }
    for (index, _) in result.source.match_indices(".child") {
        let offset = result.source[..index].encode_utf16().count() as u64;
        let span = mappings
            .iter()
            .find(|m| {
                m["generatedStart"].as_u64().unwrap() <= offset
                    && offset < m["generatedEnd"].as_u64().unwrap()
            })
            .expect("child original");
        let original = span["source"]["range"]["start"].as_u64().unwrap() + offset
            - span["generatedStart"].as_u64().unwrap();
        assert_eq!(span["source"]["file"], "/child.css");
        assert_eq!(
            original,
            child[..child.find(".child").unwrap()]
                .encode_utf16()
                .count() as u64
        );
    }
    assert_eq!(result.source.matches(".child").count(), 2);
}

#[test]
fn composed_declaration_mappings_preserve_the_important_and_fallback_declarations() {
    let source = "@utilities{low{padding:2rem}high{padding:3rem!important}}\n.card{@compose high low;padding:4rem}";
    let parsed = compile_css_directives(source, &CompileNativeCssOptions::default()).unwrap();
    let lowered = mastercss_compiler::lower_css_directives(
        &parsed.manifest_input,
        &parsed.style_definitions.unwrap(),
        &[],
        &Default::default(),
    )
    .unwrap();
    assert_eq!(
        lowered.generated_css,
        ".card{padding:3rem !important;padding:2rem;padding:4rem}"
    );
    let mapping = lowered
        .generated_mappings
        .iter()
        .find(|mapping| mapping.generated_start == 6)
        .expect("winning declaration origin");
    assert_eq!(
        mapping.source.range.start as usize,
        source.rfind("high").unwrap()
    );
    assert_eq!(mapping.source.range.end - mapping.source.range.start, 4);
}

#[test]
fn wrapped_lowered_selectors_map_after_generated_condition_prefixes() {
    let source =
        "@utilities{paint{padding:2rem}}\n@media (min-width:10px){\n.card{@compose paint;}\n}";
    let parsed = compile_css_directives(source, &CompileNativeCssOptions::default()).unwrap();
    let lowered = mastercss_compiler::lower_css_directives(
        &parsed.manifest_input,
        &parsed.style_definitions.unwrap(),
        &[],
        &Default::default(),
    )
    .unwrap();
    let generated = lowered
        .generated_css
        .find(".card")
        .expect("wrapped selector");
    assert!(generated > 0);
    let mapping = lowered
        .generated_mappings
        .iter()
        .find(|mapping| mapping.generated_start as usize == generated)
        .expect("selector anchor");
    assert_eq!(
        mapping.source.range.start as usize,
        source.find(".card").unwrap()
    );
    assert_eq!(mapping.source.loc.as_ref().unwrap().start.line, 3);
}
