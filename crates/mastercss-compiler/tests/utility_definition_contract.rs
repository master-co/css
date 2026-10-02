use mastercss_compiler::{
    CompileNativeCssOptions, LowerCssDirectivesRequest, compile_css_directives,
    lower_css_directives_request,
};
use mastercss_engine::EngineSession;
use mastercss_schema::MatchStatus;

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
        &mastercss_compiler::LowerCssDirectivesOptions {
            base_manifest: Some(
                serde_json::json!({"version":6,"languageVersion":16,"mixins":[{"name":"--always","body":[{"type":"contents","fallback":[]}]}],"utilities":[{"kind":"static","name":"always","body":[{"type":"contents","fallback":[]}]}]}),
            ),
            resolution_manifest: None,
        },
    )
}
fn css(source: &str, classes: &[&str]) -> String {
    let result = compile(source).unwrap();
    let mut engine = EngineSession::create(&result.manifest.to_string()).unwrap();
    engine.ensure_class_rules(classes.iter().copied()).unwrap();
    engine.snapshot().unwrap().text
}

#[test]
fn untyped_static_arguments_do_not_depend_on_property_value_kind() {
    let source = "@mixin --size(--value){width:var(--value);height:var(--value)} @utility size(--value) {width:var(--value);height:var(--value)}";
    for value in ["red", "-1px", "future(1px)", "1px|2px"] {
        let generated = css(source, &[&format!("size({value})")]);
        assert!(
            generated.contains("width:") && generated.contains("height:"),
            "{generated}"
        );
    }
    let result = compile(source).unwrap();
    let engine = EngineSession::create(&result.manifest.to_string()).unwrap();
    assert!(
        !engine
            .inspect("size(var(--size))")
            .unwrap()
            .diagnostics
            .is_empty()
    );
}

#[test]
fn removed_authoring_forms_fail_explicitly() {
    for source in [
        "@utility --card{color:red}",
        "@utility font-* from(--font-size-*){font-size:--master-value()}",
        "@utilities{x:<number>{width:--value()}}",
        ".x{width:--master-value()}",
    ] {
        assert!(compile(source).is_err(), "{source}");
    }
}

#[test]
fn registration_forms_have_independent_replacements() {
    let source = "@mixin --card{color:red;&:hover{color:blue}} @utility card {color:red;&:hover{color:blue}}@mixin --card(--n <integer>){order:var(--n)} @utility card(--n <integer>) {order:var(--n)}";
    let generated = css(source, &["card(2)"]);
    assert!(generated.contains("order:2"));
    assert!(!generated.contains("color:") && !generated.contains(":hover"));
    let result = compile(source).unwrap();
    assert_eq!(
        EngineSession::create(&result.manifest.to_string())
            .unwrap()
            .inspect("card")
            .unwrap()
            .match_status,
        MatchStatus::Matched
    );
}

#[test]
fn empty_utility_remains_matched_without_output() {
    let result = compile(
        "@mixin --card{color:red} @utility card {color:red}@mixin --card{} @utility card {}",
    )
    .unwrap();
    let engine = EngineSession::create(&result.manifest.to_string()).unwrap();
    let inspection = engine.inspect("card").unwrap();
    assert_eq!(inspection.match_status, MatchStatus::Matched);
    assert!(inspection.rules.is_empty());
    let removed_group = engine.inspect("{card}").unwrap();
    assert_eq!(removed_group.match_status, MatchStatus::SyntaxError);
    assert!(removed_group.rules.is_empty());
    assert_eq!(
        engine.inspect_class_semantics("card").unwrap().kind,
        mastercss_engine::ClassSemanticKind::Semantic
    );
}

#[test]
fn static_names_accept_future_pseudo_classes() {
    for state in [":open", ":state(open)", ":future-pseudo(hello)", "::before"] {
        let generated = css(
            "@mixin --block{display:block} @utility block {display:block}",
            &[&format!("block{state}")],
        );
        assert!(
            generated.contains("display:block") && generated.contains(&format!("{state}{{")),
            "{generated}"
        );
    }
}

#[test]
fn strings_and_urls_are_not_interpolation_surfaces() {
    let generated = css(
        r#"@mixin --sample(--value){width:var(--value);--quoted:'var(--value)';background:url(var(--value).svg)} @utility sample(--value) {width:var(--value);--quoted:'var(--value)';background:url(var(--value).svg)}"#,
        &["sample(2px)"],
    );
    assert!(generated.contains("width:2px"), "{generated}");
    assert!(generated.contains("var(--value).svg"), "{generated}");
    assert!(
        generated.contains("'var(--value)'") || generated.contains("\"var(--value)\""),
        "{generated}"
    );
}

#[test]
fn identifiers_preserve_case_unicode_and_decoded_escapes() {
    let generated = css(
        r"@mixin --Accent{color:red} @utility Accent {color:red}@mixin --accent{color:blue} @utility accent {color:blue}@utility \31 st{display:block}@utility 文字{display:grid}",
        &["Accent", "accent", "1st", "文字"],
    );
    for declaration in ["color:red", "color:blue", "display:block", "display:grid"] {
        assert!(generated.contains(declaration), "{generated}");
    }
    for name in [r"bad\:name", r"bad\20 name", r"bad\@name"] {
        assert!(compile(&format!("@mixin --{name}{{color:red}}")).is_err());
    }
}

#[test]
fn public_manifest_compilation_resolves_mixin_conditions() {
    let parsed=compile_css_directives("@mixin --always{@contents;} @utility always {@contents;}@mixin --pair(--value){@apply --always{display:block}width:var(--value)} @utility pair(--value) {@apply --always{display:block}width:var(--value)}",&Default::default()).unwrap();
    let result =
        mastercss_compiler::compile_manifest_input(&parsed.manifest_input, &Default::default())
            .unwrap();
    let engine = EngineSession::create(&result.manifest.to_string()).unwrap();
    let rules = engine.composition_rules("pair(1px)").unwrap();
    assert!(
        rules
            .iter()
            .flat_map(|rule| &rule.declarations)
            .any(|declaration| declaration.property == "display")
    );
}

#[test]
fn clearing_named_and_parameter_mixins_drops_old_resources() {
    let result=compile(r#"@theme {--paint-brand:var(--color-brand);--color-brand:red}@mixin --paint(--name <string>){color:var(ident("--paint-" var(--name)))} @utility paint(--name <string>) {color:var(ident("--paint-" var(--name)))}@utility paint-(--paint <string>) {color:var(ident("--paint-" var(--paint)))}@mixin --paint(--name <string>){} @utility paint(--name <string>) {}@utility paint-(--paint <string>) {}@mixin --size(--n){width:var(--n)} @utility size(--n) {width:var(--n)}@utility size-(--n) {width:var(--n)}@mixin --size(--n){} @utility size(--n) {}"#).unwrap();
    let mut engine = EngineSession::create(&result.manifest.to_string()).unwrap();
    for class in ["size(1px)", "paint-brand"] {
        assert_eq!(
            engine.inspect(class).unwrap().match_status,
            MatchStatus::Matched
        );
        engine.ensure_class_rules([class]).unwrap();
    }
    assert!(engine.css_text().is_empty());
}

#[test]
fn replacing_named_recipe_keeps_primary_token_identity() {
    let generated = css(
        r#"@theme {--spacing-md:1rem;--gutter-md:var(--spacing-md)}@mixin --gutter(--key <string>){margin:var(ident("--gutter-" var(--key)))} @utility gutter(--key <string>) {margin:var(ident("--gutter-" var(--key)))}@utility gutter-(--gutter <string>) {margin:var(ident("--gutter-" var(--gutter)))}@mixin --gutter(--key <string>){padding:var(ident("--gutter-" var(--key)))} @utility gutter(--key <string>) {padding:var(ident("--gutter-" var(--key)))}@utility gutter-(--gutter <string>) {padding:var(ident("--gutter-" var(--gutter)))}"#,
        &["gutter-md"],
    );
    assert!(
        generated.contains("padding:var(--gutter-md)") && !generated.contains("margin:"),
        "{generated}"
    );
}

#[test]
fn old_manifest_matcher_and_emit_authoring_is_rejected() {
    let old = serde_json::json!({"version":6,"languageVersion":16,"utilities":[{"id":"x","emit":{"type":"property","property":"color"},"matchers":[{"type":"static","name":"x"}]}]});
    assert!(EngineSession::create(&old.to_string()).is_err());
}
