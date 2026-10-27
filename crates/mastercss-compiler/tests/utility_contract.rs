use mastercss_compiler::{
    LowerCssDirectivesRequest, compile_css_directives, lower_css_directives_request,
};
use mastercss_engine::{EngineSession, TokenFamilyArgument};

fn compile(css: &str) -> mastercss_compiler::LowerCssDirectivesResult {
    let parsed = compile_css_directives(css, &Default::default()).unwrap();
    lower_css_directives_request(
        &LowerCssDirectivesRequest {
            definition_sources: parsed.definition_sources,
            native_output: parsed.native_output,
            manifest_input: parsed.manifest_input,
            style_definitions: parsed.style_definitions.unwrap_or_default(),
            warnings: parsed.warnings,
        },
        &Default::default(),
    )
    .unwrap()
}
fn engine(css: &str) -> EngineSession {
    EngineSession::create(&compile(css).manifest.to_string()).unwrap()
}
fn declarations(engine: &EngineSession, class: &str) -> String {
    engine
        .composition_rules(class)
        .unwrap()
        .iter()
        .flat_map(|rule| &rule.declarations)
        .map(|d| format!("{}:{}", d.property, d.value.as_str().unwrap()))
        .collect::<Vec<_>>()
        .join(";")
}
#[test]
fn explicit_headers_register_only_the_authored_class_form() {
    let css = "@theme{--spacing-sm:1rem;} @utility gap-x-(--spacing){column-gap:var(--spacing)} @utility card{display:grid} @utility cols(--n <integer>){grid-template-columns:repeat(var(--n),1fr)} @mixin --hidden{color:red}";
    let e = engine(css);
    assert_eq!(declarations(&e, "gap-x-sm"), "column-gap:var(--spacing-sm)");
    assert_eq!(declarations(&e, "card"), "display:grid");
    assert_eq!(
        declarations(&e, "cols(3)"),
        "grid-template-columns:repeat(3,1fr)"
    );
    for class in [
        "hidden",
        "hidden()",
        "gap-x(1rem)",
        "card()",
        "cols-3",
        "gap-x-missing",
    ] {
        assert!(e.inspect(class).unwrap().rules.is_empty(), "{class}");
    }
    let output = compile(&format!("{css}.native{{@apply --hidden}}"));
    assert!(output.css.unwrap().contains("color:red"));
    assert_eq!(output.manifest["version"], 6);
}
#[test]
fn value_placeholder_has_multiple_declarations_and_duplicate_order() {
    let e = engine(
        "@theme{--spacing-sm:1rem;} @utility size-(--spacing){width:var(--spacing);height:var(--spacing);width:calc(var(--spacing) + 1px)}",
    );
    assert_eq!(
        declarations(&e, "size-sm"),
        "width:var(--spacing-sm);height:var(--spacing-sm);width:calc(var(--spacing-sm) + 1px)"
    );
    let families = e.token_families().unwrap();
    assert_eq!(families[0].utility, "size");
    assert_eq!(families[0].argument, TokenFamilyArgument::Value);
}
#[test]
fn key_binding_uses_parameter_namespace_and_requires_primary_token() {
    let e = engine(
        r#"@theme{--text-sm:1rem;--text-sm--line-height:1.5;--text-orphan--line-height:2;}
        @utility type-(--text <string>){font-size:var(ident("--text-" var(--text)));line-height:var(ident("--text-" var(--text) "--line-height"),normal)}"#,
    );
    assert_eq!(
        declarations(&e, "type-sm"),
        "font-size:var(--text-sm);line-height:var(--text-sm--line-height,normal)"
    );
    for class in ["type-orphan", "type-sm--line-height"] {
        assert!(e.inspect(class).unwrap().rules.is_empty(), "{class}");
    }
}
#[test]
fn explicit_utility_can_apply_a_separate_native_mixin() {
    let e = engine("@mixin --paint{color:red} @utility paint{@apply --paint;color:blue}");
    assert_eq!(declarations(&e, "paint"), "color:red;color:blue");
}
#[test]
fn malformed_patterns_and_utility_applications_are_rejected() {
    for source in [
        "@utility --gap(--spacing){gap:var(--spacing)}",
        "@utility gap-(--spacing, --other){gap:var(--spacing)}",
        "@utility gap-(--spacing <integer>){gap:var(--spacing)}",
        "@utility gap-(--spacing:1rem){gap:var(--spacing)}",
        "@utility gap-(--spacing)-end{gap:var(--spacing)}",
        "@layer utilities{@utility card{display:grid}}",
    ] {
        let result = compile_css_directives(source, &Default::default()).and_then(|parsed| {
            lower_css_directives_request(
                &LowerCssDirectivesRequest {
                    definition_sources: parsed.definition_sources,
                    native_output: parsed.native_output,
                    manifest_input: parsed.manifest_input,
                    style_definitions: parsed.style_definitions.unwrap_or_default(),
                    warnings: parsed.warnings,
                },
                &Default::default(),
            )
        });
        assert!(result.is_err(), "{source}");
    }
    let parsed = compile_css_directives(
        "@utility paint{color:red}.a{@apply --paint}",
        &Default::default(),
    )
    .unwrap();
    assert!(
        lower_css_directives_request(
            &LowerCssDirectivesRequest {
                definition_sources: parsed.definition_sources,
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

#[test]
fn generic_token_recipes_keep_conditions_without_implicit_modifiers() {
    let e = engine(
        "@theme{--spacing-sm:1rem}@utility size-(--spacing){width:var(--spacing);@media (width>40rem){&:hover{height:var(--spacing)}}}",
    );
    let rules = e.inspect("size-sm").unwrap().rules;
    assert_eq!(rules.len(), 1);
    assert_eq!(rules[0].nodes.len(), 2);
    assert!(
        rules
            .iter()
            .any(|rule| rule.text.contains("@media (width>40rem)")
                && rule.text.contains(":hover{height:var(--spacing-sm)}"))
    );
    for class in ["-size-sm", "size-sm/.5"] {
        assert!(e.inspect(class).unwrap().rules.is_empty(), "{class}");
    }
}
