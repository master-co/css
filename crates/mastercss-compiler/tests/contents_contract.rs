use mastercss_compiler::{
    CompileNativeCssOptions, LowerCssDirectivesOptions, LowerCssDirectivesRequest,
    compile_css_directives, lower_css_directives_request,
};

fn compile(
    source: &str,
) -> Result<mastercss_compiler::LowerCssDirectivesResult, mastercss_compiler::CompilerError> {
    let parsed = compile_css_directives(source, &CompileNativeCssOptions::default())?;
    lower_css_directives_request(
        &LowerCssDirectivesRequest {
            definition_sources: parsed.definition_sources,
            native_output: parsed.native_output,
            manifest_input: parsed.manifest_input,
            style_definitions: parsed.style_definitions.unwrap_or_default(),
            warnings: parsed.warnings,
        },
        &LowerCssDirectivesOptions::default(),
    )
}

fn css(source: &str) -> String {
    let result = compile(source).unwrap();
    result.css.unwrap_or(result.generated_css)
}

#[test]
fn contents_distinguish_omitted_empty_and_repeated_blocks() {
    let output = css(
        "@mixin --wrap { order:1; @contents {order:2} order:3; @contents; } @utility wrap { order:1; @contents {order:2} order:3; @contents; } .a{@apply --wrap;} .b{@apply --wrap{}} .c{@apply --wrap{order:4;order:5}} ",
    );
    assert!(output.contains(".a{order:1;order:2;order:3}"), "{output}");
    assert!(output.contains(".b{order:1;order:3}"), "{output}");
    assert!(
        output.contains(".c{order:1;order:4;order:5;order:3;order:4;order:5}"),
        "{output}"
    );
}

#[test]
fn preset_normalization_cannot_upgrade_old_executable_data_silently() {
    for field in [
        "variants",
        "conditions",
        "selectors",
        "containerConditions",
        "breakpointConditions",
    ] {
        let mut manifest = serde_json::json!({"version":6,"languageVersion":16});
        manifest[field] = serde_json::json!([]);
        assert!(mastercss_compiler::normalize_default_manifest_for_json(&manifest).is_err());
    }
    assert!(
        mastercss_compiler::normalize_default_manifest_for_json(
            &serde_json::json!({"version":4,"languageVersion":6})
        )
        .is_err()
    );
}

#[test]
fn contents_keep_caller_bindings_and_forward_outer_contents() {
    let output = css(
        "@mixin --inner(--n:2){order:var(--n);@contents;} @utility inner(--n:2) {order:var(--n);@contents;} @mixin --outer(--n:1){@apply --inner(3){order:var(--n);@contents;}} @utility outer(--n:1) {@apply --inner(3){order:var(--n);@contents;}} .a{@apply --outer{order:var(--n)}}",
    );
    assert!(
        output.contains("order:3;order:1;order:var(--n)"),
        "{output}"
    );
}

#[test]
fn finite_nested_calls_of_the_same_mixin_are_not_recursion() {
    let output = css(
        "@mixin --wrap{order:1;@contents;} @utility wrap {order:1;@contents;} .a{@apply --wrap{@apply --wrap{order:2}}}",
    );
    assert!(output.contains("order:1;order:1;order:2"), "{output}");
    assert!(
        compile(
            "@mixin --a{@apply --a{@contents;}} @utility a {@apply --a{@contents;}} .a{@apply --a;}"
        )
        .is_err()
    );
}

#[test]
fn ignored_contents_and_unused_fallback_do_not_retain_resources() {
    let output = css(
        "@theme {--color-unused:red;--color-fallback:blue} @mixin --ignore{order:1} @utility ignore {order:1} @mixin --fallback{@contents{color:var(--color-fallback)}} @utility fallback {@contents{color:var(--color-fallback)}} .a{@apply --ignore{color:var(--color-unused)} @apply --fallback{order:2}}",
    );
    assert!(!output.contains("--color-unused"), "{output}");
    assert!(!output.contains("--color-fallback"), "{output}");
}

#[test]
fn wrapper_ordering_uses_emitted_declarations_when_contents_are_discarded() {
    let mut e = engine(
        "@mixin --blue{color:blue} @utility blue {color:blue}@mixin --red{color:red} @utility red {color:red}",
    );
    let red = "color:blue@apply(--red)";
    let blue = "color:red@apply(--blue)";
    e.ensure_class_rules([red, blue]).unwrap();
    let snapshot = e.snapshot().unwrap();
    assert_eq!(snapshot.rules[0].class_name, blue);
    assert_eq!(snapshot.rules[1].class_name, red);
    assert_eq!(snapshot.rules[0].priority.sort_key, "color:blue");
}

#[test]
fn native_query_dependencies_and_unsubstituted_contents_remain_css() {
    assert_eq!(
        mastercss_compiler::analyze_css_dependencies(".a{@media (--wide){color:red}}")
            .uses_custom_media,
        Some(true)
    );
    assert_eq!(
        mastercss_compiler::analyze_css_dependencies(
            ".a{content:'@media (--wide){}'} /* @media (--wide){} */"
        )
        .uses_custom_media,
        None
    );
    let output = css(
        "@mixin --identity{@contents;} @utility identity {@contents;} .a{@apply --identity{grid-template-columns:repeat(2.5,1fr)}}",
    );
    assert!(output.contains("repeat(2.5,1fr)"), "{output}");
    assert!(
        compile(
            "@mixin --cols(--n){grid-template-columns:repeat(var(--n),1fr)} @utility cols(--n) {grid-template-columns:repeat(var(--n),1fr)} .a{@apply --cols(2.5)}"
        )
        .is_err()
    );
}

fn engine(source: &str) -> mastercss_engine::EngineSession {
    let parsed = compile_css_directives(source, &CompileNativeCssOptions::default()).unwrap();
    let manifest =
        mastercss_compiler::compile_manifest_input(&parsed.manifest_input, &Default::default())
            .unwrap()
            .manifest;
    mastercss_engine::EngineSession::create(&manifest.to_string()).unwrap()
}

#[test]
fn class_contents_wrap_mixins_once_and_preserve_wrapper_order() {
    let source = "@mixin --pair {color:red;display:block} @utility pair {color:red;display:block} @mixin --a{order:1;@supports (display:grid){@contents;}order:2;} @utility a {order:1;@supports (display:grid){@contents;}order:2;} @mixin --b{order:3;&:hover{@contents;}order:4;} @utility b {order:3;&:hover{@contents;}order:4;}";
    let mut e = engine(source);
    let class = "pair@apply(--a)@apply(--b)!";
    let inspection = e.inspect(class).unwrap();
    assert!(
        inspection.diagnostics.is_empty(),
        "{:?}",
        inspection.diagnostics
    );
    assert!(!inspection.rules.is_empty());
    e.ensure_class_rules([class]).unwrap();
    let output = e.snapshot().unwrap().text;
    for value in [1, 2, 3, 4] {
        assert_eq!(
            output.matches(&format!("order:{value}!important")).count(),
            1,
            "{output}"
        );
    }
    assert!(
        output.contains("color:red!important;display:block!important"),
        "{output}"
    );
    assert!(output.find("order:1").unwrap() < output.find("order:3").unwrap());
    assert!(output.find("order:4").unwrap() < output.find("order:2").unwrap());
    let native = css(&format!(
        "{source}.a{{@apply --a{{@apply --b{{color:red;display:block}}}}}}"
    ));
    assert_eq!(
        output.matches("@supports").count(),
        native.matches("@supports").count(),
        "{output}\n{native}"
    );
    let class_css = output
        .strip_prefix("@layer utilities{")
        .unwrap()
        .strip_suffix('}')
        .unwrap()
        .replace(&format!(".{}", mastercss_lexer::css_escape(class)), ".a")
        .replace("!important", "");
    assert_eq!(class_css, native);
}

#[test]
fn builtin_layers_and_starting_style_work_without_a_preset() {
    let mut e = engine("");
    for layer in ["base", "defaults", "components", "utilities"] {
        let class = format!("opacity:0@starting-style@layer({layer})@layer({layer})");
        e.ensure_class_rules([class.as_str()]).unwrap();
        assert!(
            e.snapshot()
                .unwrap()
                .text
                .contains(&format!("@layer {layer}{{@starting-style{{"))
        );
    }
    for class in [
        "color:red@layer(theme)",
        "color:red@layer(custom)",
        "color:red@layer(base)@layer(utilities)",
    ] {
        let result = e.inspect(class).unwrap();
        assert!(result.rules.is_empty(), "{class}");
        assert!(!result.diagnostics.is_empty(), "{class}");
    }
    assert!(compile("@custom-media --starting-style (width>1px);").is_err());
    assert!(mastercss_engine::EngineSession::create(
        r#"{"version":6,"languageVersion":16,"customMedia":{"--starting-style":{"type":"true"}}}"#
    ).is_err());
}

#[test]
fn named_media_and_mixin_names_are_independent_and_false_discards_contents() {
    let mut e = engine(
        "@custom-media --x (width>1px); @custom-media --never false; @mixin --x{&:hover{@contents;}} @utility x {&:hover{@contents;}} @mixin --drop{@contents;} @utility drop {@contents;}",
    );
    e.ensure_class_rules([
        "color:red@x",
        "color:blue@apply(--x)",
        "color:green@never@apply(--drop)",
    ])
    .unwrap();
    let output = e.snapshot().unwrap().text;
    assert!(output.contains("@media (width>1px)"), "{output}");
    assert!(output.contains(":hover{color:blue}"), "{output}");
    assert!(!output.contains("green"), "{output}");
}

#[test]
fn removed_variants_and_layer_wrapping_are_rejected() {
    for source in [
        "@custom-variant hocus{&:hover{@slot;}}",
        ".x{@variant hocus{color:red}}",
        ".x{@slot;}",
        "@mixin --x{@layer components{@contents;}} @utility x {@layer components{@contents;}}",
        ".x{@apply --x{@layer components{color:red}}}",
    ] {
        assert!(compile(source).is_err(), "{source}");
    }
}

#[test]
fn contents_preserve_selector_lists_pseudo_elements_and_declaration_sources() {
    let source = "@mixin --wrap{&:hover,&:focus{&::before{@contents;}}} @utility wrap {&:hover,&:focus{&::before{@contents;}}} .a,#b{@apply --wrap{content:'x';color:red;color:blue}}";
    let result = compile(source).unwrap();
    let output = result.css.as_deref().unwrap_or(&result.generated_css);
    assert!(output.contains(":is(.a,#b)"), "{output}");
    assert!(output.contains("::before"), "{output}");
    assert!(output.contains("color:red;color:blue"), "{output}");
    let mappings = serde_json::to_value(&result).unwrap();
    assert!(mappings.to_string().contains("source"));
}

#[test]
fn contents_urls_and_spans_retain_the_calling_file_across_imports() {
    let caller = "@import './defs.css';.card{@apply --wrap{background:url(card.png)}}";
    let definitions = "@mixin --wrap{mask:url(mask.svg);&:hover{@contents;}@contents{background:url(unused.png)}} @utility wrap {mask:url(mask.svg);&:hover{@contents;}@contents{background:url(unused.png)}}";
    let request = serde_json::from_value(serde_json::json!({
        "graph":{"entry":"entry","files":{"entry":caller,"defs":definitions},"edges":[{"from":"entry","specifier":"./defs.css","resolved":"defs"}]},
        "urls":{"entry":"/output/entry.css","defs":"/output/defs.css"},
        "resourceURLs":{"entry":{"card.png":"/caller/card.png"},"defs":{"mask.svg":"/definition/mask.svg","unused.png":"/definition/unused.png"}},
        "baseManifest":{"version":6,"languageVersion":16}
    })).unwrap();
    let result = mastercss_compiler::compile_css_stylesheet_graph(&request).unwrap();
    let output = result
        .stylesheets
        .iter()
        .map(|sheet| sheet.css.as_str())
        .collect::<String>();
    assert!(output.contains("/caller/card.png"), "{output}");
    assert!(output.contains("/definition/mask.svg"), "{output}");
    assert!(!output.contains("/definition/unused.png"), "{output}");
    let entry = result
        .stylesheets
        .iter()
        .find(|sheet| sheet.id == "entry")
        .unwrap();
    assert!(
        entry
            .output_mappings
            .iter()
            .any(|mapping| mapping.source.file.as_deref() == Some("entry")
                && mapping.source.range.start == caller.find("background:").unwrap() as u32)
    );
}

#[test]
fn supplied_content_suppresses_invalid_fallback_execution_and_keeps_parameters_static() {
    let mut e = engine(
        "@mixin --needs(--x <integer>){order:var(--x)} @utility needs(--x <integer>) {order:var(--x)} @mixin --wrap{@contents{@apply --needs(nope);}} @utility wrap {@contents{@apply --needs(nope);}} @mixin --parameter(--x:1){@apply --wrap{order:var(--x)}} @utility parameter(--x:1) {@apply --wrap{order:var(--x)}}",
    );
    let result = e.inspect("color:red@apply(--wrap)").unwrap();
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    e.ensure_class_rules(["color:red@apply(--wrap)"]).unwrap();
    assert!(e.css_text().contains("color:red"));
    assert!(compile("@mixin --child{& .child{@contents;}} @utility child {& .child{@contents;}} @mixin --wrap(--x:1){@apply --child{order:var(--x)}} @utility wrap(--x:1) {@apply --child{order:var(--x)}} .a{@apply --wrap;}").is_err());
    assert!(compile(".a{@contents;}").is_err());
}
