use mastercss_compiler::{
    CompileNativeCssOptions, LowerCssDirectivesOptions, LowerCssDirectivesRequest,
    compile_css_directives, lower_css_directives_request,
};
use mastercss_engine::EngineSession;

fn compile(source: &str) -> mastercss_compiler::LowerCssDirectivesResult {
    let parsed = compile_css_directives(source, &CompileNativeCssOptions::default()).unwrap();
    lower_css_directives_request(
        &LowerCssDirectivesRequest {
            utility_sources: parsed.utility_sources,
            native_output: parsed.native_output,
            manifest_input: parsed.manifest_input,
            style_definitions: parsed.style_definitions.unwrap_or_default(),
            warnings: parsed.warnings,
        },
        &LowerCssDirectivesOptions::default(),
    )
    .unwrap()
}

#[test]
fn compose_preserves_fallbacks_and_repeated_shorthand_order() {
    let result = compile(
        ".card{@compose color:red;display:block;display:made-up-value;padding-left:20px;padding:10px;padding-left:30px}",
    );
    let css = result.css.unwrap();
    assert!(css.contains("display:block;display:made-up-value"), "{css}");
    assert!(
        css.contains("padding-left:20px;padding:10px;padding-left:30px"),
        "{css}"
    );
}

#[test]
fn compose_statements_keep_source_order_but_class_lists_use_master_priority() {
    assert_eq!(
        compile(".a{@compose color:red color:blue;}").css,
        compile(".a{@compose color:blue color:red;}").css
    );
    let separate = compile(".a{@compose color:red;@compose color:blue;}")
        .css
        .unwrap();
    assert!(separate.contains("color:red;color:blue"), "{separate}");
    let mixed = compile(".a{@compose color:red;color:green;@compose color:blue;}")
        .css
        .unwrap();
    assert!(
        mixed.contains("color:red;color:green;color:blue"),
        "{mixed}"
    );
}

#[test]
fn utility_rules_preserve_fallbacks_through_manifest_and_composition() {
    let result = compile(
        "@utilities{fallback{display:block;display:made-up-value;padding-left:20px;padding:10px;padding-left:30px}}.a{@compose fallback;}",
    );
    let mut engine = EngineSession::create(&result.manifest.to_string()).unwrap();
    engine.ensure_class_rules(["fallback"]).unwrap();
    let generated = engine.snapshot().unwrap().text;
    assert!(generated.contains("display:block"), "{generated}");
    assert!(generated.contains("display:made-up-value"), "{generated}");
    let css = result.css.unwrap();
    assert!(css.contains("display:block;display:made-up-value"), "{css}");
    assert!(
        css.contains("padding-left:20px;padding:10px;padding-left:30px"),
        "{css}"
    );
}

#[test]
fn removed_managed_directives_are_diagnosed() {
    for name in ["defaults", "components"] {
        let error = compile_css_directives(
            &format!("@{name}{{card{{color:red}}}}"),
            &Default::default(),
        )
        .unwrap_err();
        assert!(error.to_string().contains("has been removed"));
        assert!(error.to_string().contains(&format!("@layer {name}")));
    }
}

#[test]
fn native_components_are_output_without_becoming_utilities() {
    let result = compile("@layer components{.card{color:red}}");
    assert!(result.manifest.get("utilities").is_none());
    let engine = EngineSession::create(&result.manifest.to_string()).unwrap();
    assert!(engine.inspect("card").unwrap().rules.is_empty());
}

#[test]
fn nested_rules_are_not_moved_across_source_boundaries() {
    let result =
        compile(".a{@compose color:red;@media (width>1px){color:blue}@compose color:green;}");
    let css = result.css.unwrap();
    assert!(
        css.find("color:red").unwrap() < css.find("color:#00f").unwrap(),
        "{css}"
    );
    assert!(
        css.find("color:#00f").unwrap() < css.find("color:green").unwrap(),
        "{css}"
    );
}

#[test]
fn preserves_importance_vendor_fallbacks_and_per_declaration_origins() {
    let source = "@utilities{fallback{display:-webkit-box;display:flex!important;display:grid}}.a{@compose fallback;display:block}";
    let parsed = compile_css_directives(source, &Default::default()).unwrap();
    let value = serde_json::to_value(parsed.style_definitions).unwrap();
    let declarations = value[0]["declarations"].as_array().unwrap();
    assert_eq!(
        declarations
            .iter()
            .map(|d| d["value"].as_str().unwrap())
            .collect::<Vec<_>>(),
        ["-webkit-box", "flex !important", "grid"]
    );
    for declaration in declarations {
        let range = &declaration["source"]["range"];
        let authored = &source
            [range["start"].as_u64().unwrap() as usize..range["end"].as_u64().unwrap() as usize];
        assert!(authored.starts_with("display:"), "{authored}");
    }
    let css = compile(source).css.unwrap();
    assert!(
        css.contains("display:-webkit-box;display:flex !important;display:grid;display:block"),
        "{css}"
    );
}

#[test]
fn unknown_native_class_and_cycles_fail_without_partial_output() {
    for source in [
        ".btn{color:red}.a{@compose display:block btn;}",
        "@utilities{a{@compose b;}b{@compose a;}}",
    ] {
        let parsed = compile_css_directives(source, &Default::default()).unwrap();
        assert!(
            lower_css_directives_request(
                &LowerCssDirectivesRequest {
                    utility_sources: parsed.utility_sources,
                    native_output: parsed.native_output,
                    manifest_input: parsed.manifest_input,
                    style_definitions: parsed.style_definitions.unwrap_or_default(),
                    warnings: parsed.warnings,
                },
                &Default::default()
            )
            .is_err()
        );
    }
}

#[test]
fn pattern_compose_remains_unsupported_with_an_explicit_diagnostic() {
    let error = compile_css_directives(
        "@utilities{size-<sm|lg>{@compose display:block;}}",
        &Default::default(),
    )
    .unwrap_err();
    assert!(error.to_string().contains("@compose"), "{error}");
}

#[test]
fn composed_layer_switch_is_rejected() {
    let source =
        "@custom-variant target{@layer components{@slot;}}.a{@compose display:block@target;}";
    let parsed = compile_css_directives(source, &Default::default()).unwrap();
    let error = lower_css_directives_request(
        &LowerCssDirectivesRequest {
            utility_sources: parsed.utility_sources,
            native_output: parsed.native_output,
            manifest_input: parsed.manifest_input,
            style_definitions: parsed.style_definitions.unwrap_or_default(),
            warnings: parsed.warnings,
        },
        &Default::default(),
    )
    .unwrap_err();
    assert!(
        error.to_string().contains("cannot change layers"),
        "{error}"
    );
}

#[test]
fn inspection_retains_statement_definition_and_resource_provenance() {
    let source = "@theme{--color-accent:red;@keyframes spin{to{opacity:1}}}@utilities{paint{color:var(--color-accent);animation:spin 1s}}.a{@compose paint;@compose color:blue;}";
    let result = compile(source);
    assert_eq!(result.compositions.len(), 2);
    let trace = &result.compositions[0];
    assert_eq!(trace.classes, ["paint"]);
    assert!(trace.css.contains("color:var(--color-accent)"));
    assert!(trace.variable_names.contains(&"color-accent".into()));
    assert!(trace.animation_names.contains(&"spin".into()));
    let location = trace.definition_sources.first().unwrap();
    assert_eq!(
        &source[location.range.start as usize..location.range.end as usize],
        "paint"
    );
    let call = trace.source.as_ref().unwrap();
    assert_eq!(
        &source[call.range.start as usize..call.range.end as usize],
        "@compose paint;"
    );
    assert!(!result.manifest.to_string().contains("definitionSources"));
}

#[test]
fn pattern_nested_declarations_preserve_importance_and_fallback_order() {
    let result = compile(
        "@utilities{paint-<a|b>{&:hover{display:block}display:flex!important;display:made-up-value;display:grid}}.a{@compose paint-a;}",
    );
    let css = result.css.unwrap();
    assert!(
        css.contains("display:flex !important;display:made-up-value;display:grid"),
        "{css}"
    );
    assert!(
        result.compositions[0]
            .definition_sources
            .iter()
            .any(|source| source.range.end - source.range.start == 11)
    );
}

#[test]
fn segmented_rules_keep_sort_classification_and_resource_lifetimes() {
    let result = compile(
        "@theme{--color-accent:red;@keyframes spin{to{opacity:1}}}@utilities{one{display:block}fallback{display:block;display:made-up-value}resources{color:var(--color-accent);animation:spin 1s;color:var(--color-accent);animation:spin 2s}}",
    );
    let mut engine = EngineSession::create(&result.manifest.to_string()).unwrap();
    let one = engine.inspect("one").unwrap();
    let fallback = engine.inspect("fallback").unwrap();
    assert_eq!(one.rules[0].utility_type, fallback.rules[0].utility_type);
    assert_eq!(one.rules[0].sort_tier, fallback.rules[0].sort_tier);
    assert_eq!(fallback.rules[0].nodes.len(), 2);
    engine.ensure_class_rules(["resources"]).unwrap();
    let snapshot = engine.snapshot().unwrap();
    assert_eq!(snapshot.rules[0].nodes.len(), 2);
    assert_eq!(snapshot.resources.variables[0].ref_count, 1);
    assert_eq!(snapshot.resources.animations[0].ref_count, 1);
    engine.delete_class_rules(["resources"]).unwrap();
    let empty = engine.snapshot().unwrap();
    assert!(empty.rules.is_empty());
    assert!(empty.resources.variables.is_empty());
    assert!(empty.resources.animations.is_empty());
}

#[test]
fn inspection_uses_actual_matches_for_pattern_and_dependency_provenance() {
    let source = "@utilities{paint-<red|blue>{color:--value()}paint-<small|large>{font-size:--value()}alias{@compose paint-red;}}.a{@compose alias:hover paint-blue:hover;}";
    let result = compile(source);
    let trace = result.compositions.last().unwrap();
    let definitions = trace
        .definition_sources
        .iter()
        .map(|location| &source[location.range.start as usize..location.range.end as usize])
        .collect::<Vec<_>>();
    assert!(definitions.contains(&"paint-<red|blue>"), "{definitions:?}");
    assert!(definitions.contains(&"alias"), "{definitions:?}");
    assert!(
        !definitions.contains(&"paint-<small|large>"),
        "{definitions:?}"
    );
    assert!(
        !serde_json::to_string(trace)
            .unwrap()
            .contains("resolvedUtilities")
    );
}

#[test]
fn pattern_importance_spelling_and_comments_do_not_reorder_declarations() {
    for declarations in [
        "DISPLAY:flex ! IMPORTANT; /* fallback */ display:made-up-value; display:grid!important",
        "&:hover{display:block} DISPLAY:flex !/**/IMPORTANT; /* fallback */ display:made-up-value; display:grid!important",
    ] {
        let result = compile(&format!(
            "@utilities{{paint-<a|b>{{{declarations}}}}}.a{{@compose paint-a;}}"
        ));
        let css = result.css.unwrap();
        assert!(
            css.contains("display:flex !important;display:made-up-value;display:grid !important"),
            "{css}"
        );
        let native = compile(&format!(".a{{@compose color:red;{declarations}}}"));
        let css = native.css.unwrap();
        assert!(
            css.contains("display:flex !important;display:made-up-value;display:grid !important"),
            "{css}"
        );
    }
}
