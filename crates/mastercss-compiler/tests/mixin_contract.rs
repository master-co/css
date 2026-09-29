use mastercss_compiler::{
    CompileNativeCssOptions, LowerCssDirectivesOptions, LowerCssDirectivesRequest,
    compile_css_directives, lower_css_directives_request,
};
use mastercss_engine::EngineSession;
use mastercss_schema::ErrorCode;

fn compile(
    source: &str,
) -> Result<mastercss_compiler::LowerCssDirectivesResult, mastercss_compiler::CompilerError> {
    let parsed = compile_css_directives(source, &CompileNativeCssOptions::default())?;
    lower_css_directives_request(
        &LowerCssDirectivesRequest {
            mixin_sources: parsed.mixin_sources,
            native_output: parsed.native_output,
            manifest_input: parsed.manifest_input,
            style_definitions: parsed.style_definitions.unwrap_or_default(),
            warnings: parsed.warnings,
        },
        &LowerCssDirectivesOptions::default(),
    )
}

fn engine(source: &str) -> EngineSession {
    EngineSession::create(&compile(source).unwrap().manifest.to_string()).unwrap()
}
fn css(source: &str, classes: &[&str]) -> String {
    let mut session = engine(source);
    session.ensure_class_rules(classes.iter().copied()).unwrap();
    session.snapshot().unwrap().text
}

const GRID: &str = "@mixin --grid-cols(--cols <integer>){display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr))}";
const TEXT: &str = r#"
@theme {:root,:host {--text-sm:.875rem;--text-sm--line-height:1.5;--text-sm--letter-spacing:0;--text-unused:3rem}}
@mixin --text(--step <string>) {
  font-size:var(ident("--text-" var(--step)));
  line-height:var(ident("--text-" var(--step) "--line-height"),normal);
  letter-spacing:var(ident("--text-" var(--step) "--letter-spacing"),normal);
}
"#;

#[test]
fn functional_classes_preserve_grid_behavior_and_conditions() {
    let source = format!("@custom-media --sm (width>=40rem);{GRID}");
    let output = css(&source, &["grid-cols(3)", "grid-cols(4)@sm"]);
    assert!(
        output.contains("display:grid;grid-template-columns:repeat(3,minmax(0,1fr))"),
        "{output}"
    );
    assert!(output.contains("@media (width>=40rem)"), "{output}");
    assert!(!output.contains("@mixin"));
}

#[test]
fn unused_definitions_do_not_emit_css() {
    assert_eq!(css(TEXT, &[]), "");
    assert_eq!(
        css(
            &format!("{TEXT}@mixin --unused{{@apply --text(\"sm\");}}"),
            &[]
        ),
        ""
    );
}

#[test]
fn generic_named_recipes_fold_ident_and_retain_only_dependencies() {
    let output = css(TEXT, &["text-sm"]);
    assert!(output.contains("font-size:var(--text-sm)"), "{output}");
    assert!(output.contains("--text-sm--line-height:1.5"), "{output}");
    assert!(!output.contains("text-unused"), "{output}");
    assert!(!output.contains("ident("), "{output}");
    assert!(!output.contains("--step"), "{output}");
    let session = engine(TEXT);
    assert!(
        session
            .inspect("text-sm--line-height")
            .unwrap()
            .rules
            .is_empty()
    );
    assert!(!session.inspect("text(sm)").unwrap().diagnostics.is_empty());
}

#[test]
fn explicit_string_invocation_agrees_with_named_recipe() {
    let output = css(TEXT, &["text(\"sm\")"]);
    assert!(output.contains("font-size:var(--text-sm)"), "{output}");
}

#[test]
fn apply_expands_in_place_without_generating_a_class() {
    let result = compile(&format!(
        "{TEXT}.caption{{color:red;@apply --text(\"sm\");color:blue}}"
    ))
    .unwrap();
    let output = result.css.unwrap_or(result.generated_css);
    assert!(output.contains(".caption{color:red;font-size:var(--text-sm);line-height:var(--text-sm--line-height,normal);letter-spacing:var(--text-sm--letter-spacing,normal);color:#00f}"), "{output}");
    assert!(!output.contains(".text-sm"));
    assert!(!output.contains("@apply"));
}

#[test]
fn defaults_nested_calls_and_duplicate_declarations_keep_order() {
    let source = "@mixin --inner(--n <integer>:2){order:1;order:var(--n)}@mixin --outer(--n <integer>:3){color:red;@apply --inner(var(--n));color:blue}";
    let output = css(source, &["outer()"]);
    assert!(
        output.contains("color:red;order:1;order:3;color:blue"),
        "{output}"
    );
}

#[test]
fn invalid_and_dynamic_arguments_fail_explicitly() {
    let session = engine(GRID);
    for class in [
        "grid-cols()",
        "grid-cols(0)",
        "grid-cols(-1)",
        "grid-cols(1.5)",
        "grid-cols(3,4)",
        "grid-cols(var(--cols))",
        "grid-cols(attr(data-cols))",
    ] {
        let inspection = session.inspect(class).unwrap();
        assert!(
            !inspection.diagnostics.is_empty(),
            "{class}: {inspection:?}"
        );
        assert!(inspection.rules.is_empty(), "{class}");
    }
    assert!(
        !css(
            "",
            &[
                "display:grid",
                "grid-template-columns:repeat(var(--cols),minmax(0,1fr))"
            ]
        )
        .is_empty()
    );
}

#[test]
fn supported_subset_rejects_unsupported_authoring() {
    for source in [
        "@utility grid-cols:*{display:grid}",
        "@mixin --x(--n <length>){width:var(--n)}",
        "@mixin --x{@private{--n:1}color:red}",
        "@mixin --x(--n){--n:1}",
        "@mixin --x(--n,--n){}",
        "@layer utilities{@mixin --x{color:red}}",
        "@mixin --x{@apply --x;}",
        "@mixin --x{@apply --missing;}",
        "@apply --x;",
        ".x{@apply --x {color:red}}",
    ] {
        assert!(compile(source).is_err(), "{source}");
    }
}

#[test]
fn latest_definition_replaces_complete_body() {
    let output = css(
        "@mixin --card {color:red;&:hover{color:blue}}@mixin --card {padding:1px}",
        &["card"],
    );
    assert!(output.contains("padding:1px"), "{output}");
    assert!(!output.contains("color"), "{output}");
}

#[test]
fn parameters_are_private_and_do_not_cross_element_boundaries() {
    let source = "@mixin --paint(--n){color:var(--n);&:hover{color:var(--n)}}";
    let output = css(source, &["paint(red)"]);
    assert!(output.contains(":hover{color:red}"), "{output}");
    let source = "@mixin --paint(--n){& + * {color:var(--n)}}";
    assert!(compile(source).is_err());
}

#[test]
fn token_maps_work_without_preset_utility_definitions() {
    let source = "@theme{:root{--font-size-sm:.875rem;--font-family-sans:system-ui;--font-weight-bold:700;--spacing-md:1rem;--color-red-60:red;--color-surface-base:white}}";
    let output = css(
        source,
        &[
            "font-sm",
            "font-sans",
            "font-bold",
            "p-md",
            "bg-red-60",
            "bg-surface-base",
        ],
    );
    for declaration in [
        "font-size:var(--font-size-sm)",
        "font-family:var(--font-family-sans)",
        "font-weight:var(--font-weight-bold)",
        "padding:var(--spacing-md)",
        "background-color:var(--color-red-60)",
        "background-color:var(--color-surface-base)",
    ] {
        assert!(output.contains(declaration), "{declaration}: {output}");
    }
    let session = engine("@theme{:root{--font-size-brand:1rem;--font-family-brand:serif}}");
    assert!(
        session
            .inspect("font-brand")
            .unwrap()
            .diagnostics
            .iter()
            .any(|diagnostic| diagnostic.code == ErrorCode::AmbiguousToken)
    );
}

#[test]
fn direct_declarations_follow_recipe_declarations() {
    let output = css(GRID, &["display:block", "grid-cols(3)"]);
    assert!(
        output.find("display:grid").unwrap() < output.find("display:block").unwrap(),
        "{output}"
    );
}

#[test]
fn raw_aliases_are_removed_without_removing_svg_properties() {
    let session = engine("");
    for class in [
        "p:1rem",
        "fg:red",
        "bg:#fff",
        "w:2px",
        "text-stroke:1px",
        "grid-cols:3",
        "grid-rows:2",
        "grid-col-span:2",
        "grid-row-span:2",
        "clamp-lines:2",
        "text:sm",
    ] {
        let inspection = session.inspect(class).unwrap();
        assert!(inspection.rules.is_empty(), "{class}: {inspection:?}");
        assert!(
            inspection
                .diagnostics
                .iter()
                .any(|diagnostic| diagnostic.message.contains("removed")),
            "{class}"
        );
    }
    assert!(css("", &["r:2px"]).contains("r:2px"));
}

#[test]
fn vendor_pairs_are_native_engine_output_policy() {
    let output = css("", &["user-select:none", "backdrop-filter:blur(3px)!"]);
    assert!(
        output.contains("-webkit-user-select:none;user-select:none"),
        "{output}"
    );
    assert!(
        output.contains(
            "-webkit-backdrop-filter:blur(3px)!important;backdrop-filter:blur(3px)!important"
        ),
        "{output}"
    );
}

#[test]
fn functional_arguments_preserve_strings_escapes_and_nested_functions() {
    let source = r#"@mixin --paint(--color,--label <string>,--n <number>:1){color:var(--color);content:var(--label);opacity:var(--n)}"#;
    let output = css(source, &[r#"paint(rgb(1,2,3),"a,b",.5):hover!"#]);
    assert!(
        output
            .contains("color:rgb(1,2,3)!important;content:\"a,b\"!important;opacity:.5!important"),
        "{output}"
    );
    assert!(output.contains(":hover{"), "{output}");
    let output = css(source, &[r#"paint(red,'a\"b')"#]);
    assert!(output.contains("content:'a\\\"b'"), "{output}");
    for class in [
        "paint(red",
        "paint(red,,2)",
        "paint(red,sm)",
        "paint(red,'sm',2)trailing",
    ] {
        assert!(
            !engine(source)
                .inspect(class)
                .unwrap()
                .diagnostics
                .is_empty(),
            "{class}"
        );
    }
}

#[test]
fn missing_companions_keep_css_fallbacks_and_do_not_create_named_classes() {
    let source = r#"@theme{:root{--text-hero:3rem;--text-orphan--line-height:2}}@mixin --text(--step <string>){font-size:var(ident("--text-" var(--step)));line-height:var(ident("--text-" var(--step) "--line-height"),normal)}"#;
    let output = css(source, &["text-hero"]);
    assert!(
        output.contains("line-height:var(--text-hero--line-height,normal)"),
        "{output}"
    );
    assert!(!output.contains("orphan"));
    let session = engine(source);
    assert!(session.inspect("text-orphan").unwrap().rules.is_empty());
    let completions = session.class_completion_candidates().unwrap();
    assert!(
        completions
            .iter()
            .any(|completion| completion.label == "text-hero")
    );
    assert!(
        !completions
            .iter()
            .any(|completion| completion.label.starts_with("text-orphan")),
        "{:?}",
        completions
            .iter()
            .filter(|completion| completion.label.starts_with("text-orphan"))
            .collect::<Vec<_>>()
    );
}

#[test]
fn explicit_mixin_families_reserve_the_longest_prefix() {
    let source = r#"@theme{:root{--spacing-md:1rem;--p-brand:2rem;--p-wide-hero:4rem}}@mixin --p(--key <string>){margin:var(ident("--p-" var(--key)))}@mixin --p-wide(--key <string>){padding:var(ident("--p-wide-" var(--key)))}@mixin --p-brand{color:red}"#;
    assert!(css(source, &["p-brand"]).contains("color:red"));
    assert!(css(source, &["p-wide-hero"]).contains("padding:var(--p-wide-hero)"));
    for class in ["p-md", "p-wide-missing", "p-brand/.5", "-p-brand"] {
        assert!(
            engine(source).inspect(class).unwrap().rules.is_empty(),
            "{class}"
        );
    }
}

#[test]
fn custom_media_and_variants_inside_mixins_are_lowered_once() {
    let source = "@custom-media --sm (width>=40rem);@mixin --active{&:hover{@contents;}}@mixin --card(--n <integer>){@media (--sm){@apply --active{order:var(--n)}}}";
    let output = css(source, &["card(3)"]);
    assert!(output.contains("@media (width>=40rem)"), "{output}");
    assert!(output.contains(":hover{order:3}"), "{output}");
    assert!(!output.contains("@variant"));
    assert!(!output.contains("--sm"));
}

#[test]
fn mixin_resources_follow_the_last_class_reference() {
    let mut session = engine(TEXT);
    session
        .ensure_class_rules(["text-sm", "text-sm:hover"])
        .unwrap();
    session.delete_class_rules(["text-sm"]).unwrap();
    assert!(
        session
            .snapshot()
            .unwrap()
            .text
            .contains("--text-sm:.875rem")
    );
    session.delete_class_rules(["text-sm:hover"]).unwrap();
    assert_eq!(session.snapshot().unwrap().text, "");
}

#[test]
fn final_definitions_allow_forward_calls_and_clear_replaced_dependencies() {
    let source =
        "@mixin --outer{@apply --inner}@mixin --inner{@apply --missing}@mixin --inner{color:red}";
    assert!(css(source, &["outer"]).contains("color:red"));
    assert!(
        compile("@mixin --outer{@apply --inner}@mixin --inner(--n <integer>){order:var(--n)}")
            .is_err()
    );
}

#[test]
fn unreferenced_cross_element_parameters_are_rejected() {
    for selector in ["& > *", "&::before", "&:before", "& + &"] {
        assert!(
            compile(&format!("@mixin --x(--n){{{selector}{{width:var(--n)}}}}")).is_err(),
            "{selector}"
        );
    }
    // A nested call may introduce its own parameter on the descendant.
    assert!(
        css(
            "@mixin --inner(--n){width:var(--n)}@mixin --outer{& > *{@apply --inner(1px)}}",
            &["outer"]
        )
        .contains("width:1px")
    );
    // An outer parameter remains inaccessible through an implicit nested call.
    assert!(
        !engine("@mixin --inner{width:var(--n)}@mixin --outer(--n){& > *{@apply --inner}} ")
            .inspect("outer(1px)")
            .unwrap()
            .diagnostics
            .is_empty()
    );
}

#[test]
fn apply_keeps_call_diagnostics_and_definition_source_mappings() {
    let source = "@mixin --x(--n <integer>){order:var(--n)}.a{@apply --x(nope)}";
    let error = compile(source).unwrap_err();
    assert!(error.to_string().contains("defined at"), "{error}");
    assert!(error.diagnostic().range.unwrap().start > 30);
    let result = compile("@mixin --x{color:red}.a{@apply --x}").unwrap();
    assert!(
        result
            .output_mappings
            .iter()
            .any(|mapping| mapping.source.range.start == "@mixin --x{".len() as u32),
        "{:?}",
        result.output_mappings
    );
}

#[test]
fn native_apply_dependencies_survive_dom_removal_and_hydration() {
    let result = compile(&format!("{TEXT}.caption{{@apply --text(\"sm\")}}")).unwrap();
    let native = result.css.as_ref().unwrap();
    let mut session = EngineSession::create(&result.manifest.to_string()).unwrap();
    session.ensure_stylesheet_resources(native).unwrap();
    let globals = session.emitted_globals_snapshot().unwrap();
    assert!(globals.variable_count("text-sm") > 0);
    assert_eq!(globals.variable_count("text-unused"), 0);
    session.ensure_class_rules(["text-sm"]).unwrap();
    session.delete_class_rules(["text-sm"]).unwrap();
    assert!(
        session
            .snapshot()
            .unwrap()
            .resources
            .variables
            .iter()
            .any(|variable| variable.name == "text-sm")
    );
    let mut hydrated = EngineSession::create_with_emitted_globals(
        &result.manifest.to_string(),
        Some(&serde_json::to_string(&globals).unwrap()),
    )
    .unwrap();
    hydrated.ensure_class_rules(["text-sm:hover"]).unwrap();
    hydrated.delete_class_rules(["text-sm:hover"]).unwrap();
    // Hydration keeps already emitted theme CSS in the host; it must not emit it twice.
    assert!(
        hydrated
            .emitted_globals_snapshot()
            .unwrap()
            .variable_count("text-sm")
            > 0
    );
    assert!(hydrated.snapshot().unwrap().resources.variables.is_empty());
    assert!(hydrated.snapshot().unwrap().text.is_empty());
}

#[test]
fn refreshing_theme_and_mixins_releases_previous_expanded_resources() {
    let mut session = engine(TEXT);
    session.ensure_class_rules(["text-sm"]).unwrap();
    let replacement = compile("@theme{:root{--text-sm:2rem;--color-new:red}}@mixin --text(--step <string>){color:var(--color-new)}").unwrap();
    session.refresh(&replacement.manifest.to_string()).unwrap();
    let snapshot = session.snapshot().unwrap();
    assert!(
        snapshot.text.contains("color:var(--color-new)"),
        "{}",
        snapshot.text
    );
    assert!(!snapshot.text.contains("line-height") && !snapshot.text.contains("font-size"));
    session.delete_class_rules(["text-sm"]).unwrap();
    assert_eq!(session.snapshot().unwrap().text, "");
}

#[test]
fn native_pruning_removes_apply_roots_before_expansion() {
    let parsed = compile_css_directives(
        &format!("{TEXT}.caption{{@apply --text(\"sm\")}}"),
        &CompileNativeCssOptions {
            prune_native_css: true,
            classes: Some(vec![]),
            ..Default::default()
        },
    )
    .unwrap();
    let lowered = lower_css_directives_request(
        &LowerCssDirectivesRequest {
            mixin_sources: parsed.mixin_sources,
            native_output: parsed.native_output,
            manifest_input: parsed.manifest_input,
            style_definitions: parsed.style_definitions.unwrap_or_default(),
            warnings: parsed.warnings,
        },
        &Default::default(),
    )
    .unwrap();
    assert!(lowered.css.as_deref().unwrap_or_default().is_empty());
}

#[test]
fn apply_uses_definition_and_argument_url_origins() {
    let request = serde_json::from_value::<mastercss_compiler::CompileCssStylesheetGraphRequest>(serde_json::json!({
        "graph": {"entry":"/entry.css", "files": {
            "/entry.css":"@import './recipes.css';.card{@apply --asset(url(./call.png))}",
            "/recipes.css":"@mixin --asset(--image){background-image:url(./definition.png);border-image-source:var(--image)}"
        }, "edges":[{"from":"/entry.css","specifier":"./recipes.css","resolved":"/recipes.css"}]},
        "urls":{"/entry.css":"/out/entry.css","/recipes.css":"/out/recipes.css"},
        "resourceURLs":{"/entry.css":{"./call.png":"/assets/call.png"},"/recipes.css":{"./definition.png":"/assets/definition.png"}}
    })).unwrap();
    let compiled = mastercss_compiler::compile_css_stylesheet_graph(&request).unwrap();
    let text = compiled
        .stylesheets
        .iter()
        .map(|sheet| sheet.css.as_str())
        .collect::<String>();
    assert!(
        text.contains("/assets/call.png") && text.contains("/assets/definition.png"),
        "{text}"
    );
    assert!(!text.contains("@apply"));
    let mappings = compiled
        .stylesheets
        .iter()
        .flat_map(|sheet| &sheet.output_mappings)
        .collect::<Vec<_>>();
    assert!(
        mappings
            .iter()
            .any(|mapping| mapping.source.file.as_deref() == Some("/recipes.css"))
    );
}

#[test]
fn same_element_selector_lists_and_ancestor_variants_keep_parameters() {
    let result = css(
        "@mixin --dark{.dark &{@contents;}}@mixin --gap(--n){&:hover,&:focus{gap:var(--n)}@apply --dark{gap:var(--n)}}",
        &["gap(2rem)"],
    );
    assert!(result.contains("gap:2rem"), "{result}");
    assert!(result.contains(".dark "), "{result}");
    assert!(compile("@mixin --bad(--n){& + &{gap:var(--n)}}").is_err());
}

#[test]
fn builtin_function_names_and_escaped_parameter_identifiers_follow_css_rules() {
    let source = r#"@theme{:root{--step-hero:2rem}}@mixin --label(--step <string>){font-size:VAR(IDENT("--step-" VaR(--st\65 p))) }@mixin --outer(--step <string>){@apply --label(VAR(--step))}"#;
    let output = css(source, &["outer('hero')"]);
    assert!(output.contains("font-size:VAR(--step-hero)"), "{output}");
    assert!(output.contains("--step-hero:2rem"), "{output}");
    for argument in ["VAR(--external)", "AtTr(data-step)", r"v\61 r(--external)"] {
        let source = format!("@mixin --x(--n){{width:var(--n)}}.x{{@apply --x({argument})}}");
        assert!(compile(&source).is_err(), "{argument}");
    }
    for source in [
        "@mixin --x(--n){& > *{width:VAR(--n)}}",
        r"@mixin --x(--name){& > *{width:var(--n\61 me)}}",
        "@mixin --x(--n){@media (width:VAR(--n)){color:red}}",
        "@mixin --x(--n){&:nth-child(VAR(--n)){color:red}}",
        ".x{@apply --grid(0)}@mixin --grid(--n <integer>){GRID-TEMPLATE-COLUMNS:REPEAT(VAR(--n),1fr)}",
    ] {
        assert!(compile(source).is_err(), "{source}");
    }
}
