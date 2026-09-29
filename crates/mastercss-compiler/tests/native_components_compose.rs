use mastercss_compiler::{
    CompileNativeCssOptions, LowerCssDirectivesRequest, compile_css_directives,
    lower_css_directives_request,
};
use mastercss_engine::EngineSession;

fn compile(source: &str) -> mastercss_compiler::LowerCssDirectivesResult {
    let parsed = compile_css_directives(source, &CompileNativeCssOptions::default()).unwrap();
    lower_css_directives_request(
        &LowerCssDirectivesRequest {
            mixin_sources: parsed.mixin_sources,
            native_output: parsed.native_output,
            manifest_input: parsed.manifest_input,
            style_definitions: parsed.style_definitions.unwrap_or_default(),
            warnings: parsed.warnings,
        },
        &mastercss_compiler::LowerCssDirectivesOptions { base_manifest: Some(serde_json::json!({"version":4,"languageVersion":6,"customMedia":{"--always":{"type":"true"}}})), resolution_manifest: None },
    )
    .unwrap()
}

#[test]
fn variant_preserves_fallbacks_and_repeated_shorthand_order() {
    let result = compile(
        r###".card{@variant always{color:red;}display:block;display:made-up-value;padding-left:20px;padding:10px;padding-left:30px}"###,
    );
    let css = result.css.unwrap();
    assert!(css.contains("display:block;display:made-up-value"), "{css}");
    assert!(
        css.contains("padding-left:20px;padding:10px;padding-left:30px"),
        "{css}"
    );
}

#[test]
fn utility_rules_preserve_fallbacks_through_manifest_and_variant() {
    let result = compile(
        r###"@mixin --fallback {display:block;display:made-up-value;padding-left:20px;padding:10px;padding-left:30px}.a{@variant always{display:block;display:made-up-value;padding-left:20px;padding:10px;padding-left:30px;}}"###,
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
            &CompileNativeCssOptions::default(),
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
    let result = compile(
        r###".a{@variant always{color:red;}@media (width>1px){color:blue}@variant always{color:green;}}"###,
    );
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
    let source = r###"@mixin --fallback {display:-webkit-box;display:flex!important;display:grid}.a{@variant always{display:-webkit-box;display:flex !important;display:grid;}display:block}"###;
    let parsed = compile_css_directives(source, &CompileNativeCssOptions::default()).unwrap();
    let body = &parsed.manifest_input.mixins.as_ref().unwrap()[0].body;
    let mut values = Vec::new();
    for node in body {
        let mastercss_schema::MixinNode::Declaration {
            value,
            source: origin,
            ..
        } = node
        else {
            panic!("declaration");
        };
        values.push(mastercss_engine::evaluate_mixin_value(value, &Default::default()).unwrap());
        let range = &origin.as_ref().unwrap().range;
        assert!(source[range.start as usize..range.end as usize].starts_with("display:"));
    }
    assert_eq!(values, ["-webkit-box", "flex!important", "grid"]);
    let css = compile(source).css.unwrap();
    assert!(
        css.contains("display:-webkit-box;display:flex !important;display:grid;display:block"),
        "{css}"
    );
}

#[test]
fn segmented_rules_keep_sort_classification_and_resource_lifetimes() {
    let result = compile(
        "@theme{:root,:host{--color-accent:red;}}@keyframes spin{to{opacity:1}}@mixin --one {display:block}@mixin --fallback {display:block;display:made-up-value}@mixin --resources {color:var(--color-accent);animation:spin 1s;color:var(--color-accent);animation:spin 2s}",
    );
    let mut engine = EngineSession::create(&result.manifest.to_string()).unwrap();
    let one = engine.inspect("one").unwrap();
    let fallback = engine.inspect("fallback").unwrap();
    assert_eq!(one.rules[0].utility_type, fallback.rules[0].utility_type);
    assert_eq!(one.rules[0].sort_tier, fallback.rules[0].sort_tier);
    assert!(
        fallback.rules[0]
            .text
            .contains("display:block;display:made-up-value")
    );
    engine.ensure_class_rules(["resources"]).unwrap();
    let snapshot = engine.snapshot().unwrap();
    assert!(snapshot.rules[0].text.contains(
        "color:var(--color-accent);animation:spin 1s;color:var(--color-accent);animation:spin 2s"
    ));
    assert_eq!(snapshot.resources.variables[0].ref_count, 1);
    assert!(!snapshot.text.contains("@keyframes"));
    engine.delete_class_rules(["resources"]).unwrap();
    let empty = engine.snapshot().unwrap();
    assert!(empty.rules.is_empty());
    assert!(empty.resources.variables.is_empty());
    assert!(!empty.text.contains("@keyframes"));
}

#[test]
fn pattern_importance_spelling_and_comments_do_not_reorder_declarations() {
    for declarations in [
        "DISPLAY:flex ! IMPORTANT; /* fallback */ display:made-up-value; display:grid!important",
        "&:hover{display:block} DISPLAY:flex !/**/IMPORTANT; /* fallback */ display:made-up-value; display:grid!important",
    ] {
        let result = compile(&format!(
            "@mixin --paint-a{{{declarations}}}@mixin --paint-b{{{declarations}}}.a{{@variant always{{{declarations}}}}}"
        ));
        let css = result.css.unwrap();
        assert!(
            css.contains("display:flex !important;display:made-up-value;display:grid !important"),
            "{css}"
        );
        let native = compile(&format!(
            ".a{{@variant always{{color:red;{declarations}}}}}"
        ));
        let css = native.css.unwrap();
        assert!(
            css.contains("display:flex !important;display:made-up-value;display:grid !important"),
            "{css}"
        );
    }
}
