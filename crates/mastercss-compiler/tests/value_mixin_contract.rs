//! Direct-value class adapters are inferred from native mixin IR.
use mastercss_compiler::{
    LowerCssDirectivesRequest, compile_css_directives, lower_css_directives_request,
};
use mastercss_engine::{ClassSemanticKind, EngineSession, TokenFamilyArgument};

fn compile(source: &str) -> mastercss_compiler::LowerCssDirectivesResult {
    let parsed = compile_css_directives(source, &Default::default()).unwrap();
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
fn engine(source: &str) -> EngineSession {
    EngineSession::create(&compile(source).manifest.to_string()).unwrap()
}
fn declaration(session: &EngineSession, class: &str) -> String {
    session
        .composition_rules(class)
        .unwrap()
        .iter()
        .flat_map(|rule| &rule.declarations)
        .map(|d| format!("{}:{}", d.property, d.value.as_str().unwrap()))
        .collect::<Vec<_>>()
        .join(";")
}
const SOURCE: &str = "@theme {--spacing-md:1rem;--color-red:#f00;}@mixin --p(--spacing){padding:var(--spacing)} @utility p(--spacing) {padding:var(--spacing)}@utility p-(--spacing) {padding:var(--spacing)}@mixin --m(--spacing){margin:var(--spacing)} @utility m(--spacing) {margin:var(--spacing)}@utility m-(--spacing) {margin:var(--spacing)}@mixin --fg(--color){color:var(--color)} @utility fg(--color) {color:var(--color)}@utility fg-(--color) {color:var(--color)}";

#[test]
fn named_calls_function_calls_and_apply_preserve_symbolic_arguments() {
    let session = engine(SOURCE);
    for (class, call, expected) in [
        ("p-md", "p(var(--spacing-md))", "padding:var(--spacing-md)"),
        (
            "-m-md",
            "m(calc(var(--spacing-md)|*|-1))",
            "margin:calc(var(--spacing-md) * -1)",
        ),
        (
            "fg-red/.5",
            "fg(color-mix(in|oklab,var(--color-red)|50%,transparent))",
            "color:color-mix(in oklab,var(--color-red) 50%,transparent)",
        ),
    ] {
        assert_eq!(declaration(&session, class), expected);
        assert_eq!(declaration(&session, call), expected);
        let result = compile(&format!(
            "{SOURCE}.x{{@apply --{}}}",
            call.replace('|', " ")
        ));
        assert!(result.css.unwrap().contains(expected), "{class}");
        assert_eq!(
            session.inspect_class_semantics(class).unwrap().kind,
            ClassSemanticKind::Token
        );
    }
    for class in ["-p-md", "fg-red/1.1", "p-md/.5", "p-missing"] {
        assert!(session.inspect(class).unwrap().rules.is_empty(), "{class}");
    }
    for argument in [
        "2rem",
        "var(--spacing)",
        "var(--external,2rem)",
        "calc(var(--external,1rem)|+|2px)",
    ] {
        assert_eq!(
            declaration(&session, &format!("p({argument})")),
            format!("padding:{}", argument.replace('|', " "))
        );
    }
    let result = compile(&format!(
        "{SOURCE}.x{{--spacing:2rem;@apply --p(var(--spacing))}}"
    ));
    assert!(result.css.unwrap().contains("padding:var(--spacing)"));
}

#[test]
fn functional_symbolic_arguments_require_the_exact_transparent_shape() {
    let source = "@mixin --value(--space){padding:var(--space)} @utility value(--space) {padding:var(--space)}@utility value-(--space) {padding:var(--space)}
        @mixin --typed(--space <integer>){padding:var(--space)} @utility typed(--space <integer>) {padding:var(--space)}
        @mixin --default(--space:1px){padding:var(--space)} @utility default(--space:1px) {padding:var(--space)}
        @mixin --fallback(--space){padding:var(--space,1px)} @utility fallback(--space) {padding:var(--space,1px)}
        @mixin --duplicate(--space){padding:var(--space);padding:var(--space)} @utility duplicate(--space) {padding:var(--space);padding:var(--space)}
        @mixin --nested(--space){&:hover{padding:var(--space)}} @utility nested(--space) {&:hover{padding:var(--space)}}
        @mixin --conditional(--space){@media (width>1px){padding:var(--space)}} @utility conditional(--space) {@media (width>1px){padding:var(--space)}}
        @mixin --indirect(--space){@apply --value(var(--space))} @utility indirect(--space) {@apply --value(var(--space))}
        @mixin --private(--space){--local:var(--space)} @utility private(--space) {--local:var(--space)}";
    let session = engine(source);
    let families = session.token_families().unwrap();
    assert_eq!(families.len(), 1);
    assert_eq!(families[0].namespace, "space");
    assert_eq!(families[0].argument, TokenFamilyArgument::Value);
    assert!(
        session
            .class_completion_candidates()
            .unwrap()
            .iter()
            .all(|item| item.label != "value-md")
    );
    for name in [
        "typed",
        "default",
        "fallback",
        "duplicate",
        "nested",
        "conditional",
        "indirect",
        "private",
    ] {
        assert!(
            session
                .inspect(&format!("{name}(var(--outside))"))
                .unwrap()
                .rules
                .is_empty(),
            "{name}"
        );
    }
}

#[test]
fn loaded_definitions_control_namespaces_keys_and_whole_definition_overrides() {
    let source = "@theme {--space-3:3px;--space-4:4px;--space-空:2rem;--space-a--b:3rem;--space-wide-missing:5rem;}@mixin --pad(--space){padding:var(--space)} @utility pad(--space) {padding:var(--space)}@utility pad-(--space) {padding:var(--space)}@mixin --pad-wide(--other){margin:var(--other)} @utility pad-wide(--other) {margin:var(--other)}@utility pad-wide-(--other) {margin:var(--other)}@mixin --pad-4{color:red} @utility pad-4 {color:red}";
    let session = engine(source);
    assert_eq!(declaration(&session, "pad-3"), "padding:var(--space-3)");
    assert_eq!(declaration(&session, "pad-4"), "color:red");
    assert_eq!(declaration(&session, "pad-空"), "padding:var(--space-空)");
    assert_eq!(
        declaration(&session, "pad-a--b"),
        "padding:var(--space-a--b)"
    );
    assert!(
        session
            .inspect("pad-wide-missing")
            .unwrap()
            .rules
            .is_empty()
    );
    assert!(
        engine("@theme {--spacing-md:1rem}")
            .token_families()
            .unwrap()
            .is_empty()
    );
    let session = engine(&format!(
        "{SOURCE}@mixin --p(--spacing){{margin:var(--spacing);padding:1px}} @utility p(--spacing) {{margin:var(--spacing);padding:1px}}"
    ));
    assert_eq!(declaration(&session, "p-md"), "padding:var(--spacing-md)");
    assert_eq!(declaration(&session, "p(2rem)"), "margin:2rem;padding:1px");
    assert!(
        session
            .token_families()
            .unwrap()
            .iter()
            .any(|family| family.prefix == "p")
    );
}

#[test]
fn escaped_identifiers_use_the_parsed_namespace_and_preserve_caller_values() {
    let session = engine(
        r"@theme {--space-md:2rem;}@utility p\61 d-(--sp\61 ce){padding:var(--sp\61 ce)}@utility p\61 d(--sp\61 ce){padding:var(--sp\61 ce)}",
    );
    assert_eq!(session.token_families().unwrap()[0].prefix, "pad");
    assert_eq!(session.token_families().unwrap()[0].namespace, "space");
    assert_eq!(declaration(&session, "pad-md"), "padding:var(--space-md)");
    assert_eq!(
        declaration(&session, r"pad(var(--色,2rem))"),
        "padding:var(--色,2rem)"
    );
}

#[test]
fn custom_family_capabilities_drive_negative_completion_and_color_hints() {
    let session = engine(
        "@theme {--spacing-md:1rem;--color-brand:#123456}@mixin --offset(--spacing){margin:var(--spacing)} @utility offset(--spacing) {margin:var(--spacing)}@utility offset-(--spacing) {margin:var(--spacing)}@mixin --ink(--color){color:var(--color)} @utility ink(--color) {color:var(--color)}@utility ink-(--color) {color:var(--color)}",
    );
    assert_eq!(
        declaration(&session, "-offset-md"),
        "margin:calc(var(--spacing-md) * -1)"
    );
    assert!(
        session
            .class_completion_candidates()
            .unwrap()
            .iter()
            .any(|item| item.label == "-offset-md")
    );
    let colors = session.color_tokens("ink-brand/.5").unwrap();
    assert_eq!(colors.len(), 1);
    assert_eq!(colors[0].value, "#123456");
}

#[test]
fn refresh_inline_dependencies_and_resource_reference_counts_remain_shared() {
    let mut session = engine(
        "@theme {--base:1rem;--spacing-md:var(--base)}@mixin --p(--spacing){padding:var(--spacing)} @utility p(--spacing) {padding:var(--spacing)}@utility p-(--spacing) {padding:var(--spacing)}",
    );
    session.ensure_class_rules(["p-md", "p-md:hover"]).unwrap();
    assert!(session.css_text().contains("--base:1rem"));
    session.delete_class_rules(["p-md"]).unwrap();
    assert!(session.css_text().contains("--spacing-md:var(--base)"));
    let replacement = compile(
        "@theme inline {--spacing-md:2rem}@mixin --p(--spacing){padding:var(--spacing)} @utility p(--spacing) {padding:var(--spacing)}@utility p-(--spacing) {padding:var(--spacing)}",
    );
    session.refresh(&replacement.manifest.to_string()).unwrap();
    assert!(session.css_text().contains("padding:2rem"));
    assert!(!session.css_text().contains("--base"));
    session.delete_class_rules(["p-md:hover"]).unwrap();
    assert_eq!(session.css_text(), "");
}
