use mastercss_compiler::{
    CompileManifestOptions, CompileNativeCssOptions, compile_css_directives,
    compile_manifest_input, compile_native_css,
};
use mastercss_engine::EngineSession;

fn manifest(source: &str, base: Option<String>) -> Result<String, String> {
    let directives = compile_css_directives(source, &CompileNativeCssOptions::default())
        .map_err(|error| error.to_string())?;
    compile_manifest_input(
        &directives.manifest_input,
        &CompileManifestOptions {
            base_manifest: base.map(|base| serde_json::from_str(&base).unwrap()),
        },
    )
    .map(|compiled| compiled.manifest.to_string())
    .map_err(|error| error.to_string())
}

fn engine(source: &str) -> EngineSession {
    EngineSession::create(&manifest(source, None).unwrap()).unwrap()
}

const SCALE: &str = r"
    @custom-container --max-md not (--md);
    @custom-container --md (width >= 28rem);
    @custom-container --lg (width>=32rem);
    @custom-container --compact style(--density: compact);
    @custom-container --dense (--md)   and
        (--compact);
";

#[test]
fn class_queries_expand_references_with_or_without_a_container_name() {
    let mut engine = engine(SCALE);
    engine
        .ensure_class_rules([
            "(display:grid)@container(--md)",
            "(display:flex)@container(card|--md)",
            "(display:block)@container(--max-md)",
            "(display:none)@container(card|--max-md)",
            "(gap:1rem)@container(--dense)",
            "(gap:2rem)@container(card|--compact)",
        ])
        .unwrap();
    let text = engine.css_text();
    for wrapper in [
        "@container (width >= 28rem){",
        "@container card (width >= 28rem){",
        "@container not (width >= 28rem){",
        "@container card not (width >= 28rem){",
        "@container (width >= 28rem) and style(--density: compact){",
        "@container card style(--density: compact){",
    ] {
        assert!(text.contains(wrapper), "{wrapper} in {text}");
    }
    assert!(!text.contains(" (--"), "{text}");
    let manifest: serde_json::Value =
        serde_json::from_str(&manifest(SCALE, None).unwrap()).unwrap();
    assert_eq!(
        manifest["customContainers"],
        serde_json::json!({
            "--compact": "style(--density: compact)",
            "--dense": "(width >= 28rem) and style(--density: compact)",
            "--lg": "(width>=32rem)",
            "--max-md": "not (width >= 28rem)",
            "--md": "(width >= 28rem)",
        })
    );
}

#[test]
fn named_conditions_share_ordering_with_their_native_queries() {
    let mut engine = engine(SCALE);
    engine
        .ensure_class_rules([
            "(color:blue)@container(--lg)",
            "(color:red)@container(width>=28rem)",
            "(color:green)@container(--md)",
        ])
        .unwrap();
    let text = engine.css_text();
    let position = |needle: &str| {
        text.find(needle)
            .unwrap_or_else(|| panic!("{needle} in {text}"))
    };
    assert!(position("color:red") < position("color:blue"), "{text}");
    assert!(position("color:green") < position("color:blue"), "{text}");
}

#[test]
fn container_and_media_names_are_independent() {
    let source = format!("@custom-media --md (width >= 64rem);{SCALE}");
    let mut engine = engine(&source);
    engine
        .ensure_class_rules(["(color:red)@md", "(color:blue)@container(--md)"])
        .unwrap();
    let text = engine.css_text();
    assert!(text.contains("@media (width >= 64rem)"), "{text}");
    assert!(text.contains("@container (width >= 28rem)"), "{text}");
    assert!(engine.has_named_condition("md").unwrap());
    // Bare names select custom media only.
    let mut engine = self::engine(SCALE);
    engine.ensure_class_rules(["(color:red)@lg"]).unwrap();
    assert!(!engine.css_text().contains("color:red"));
}

#[test]
fn undefined_references_report_the_name_and_emit_nothing() {
    let mut engine = engine(SCALE);
    engine
        .ensure_class_rules(["(color:red)@container(--missing)"])
        .unwrap();
    assert!(!engine.css_text().contains("color:red"));
    let inspection = engine
        .inspect("(color:red)@container(card|--missing)")
        .unwrap();
    let messages = inspection
        .diagnostics
        .iter()
        .map(|diagnostic| diagnostic.message.as_str())
        .collect::<Vec<_>>();
    assert_eq!(messages, ["Undefined custom container --missing"]);
}

#[test]
fn mixins_utilities_and_native_css_expand_references() {
    let source = format!(
        "{SCALE}@mixin --stack {{ @container card (--md) {{ display: grid; }} }} @utility stack {{ @container (--max-md) {{ display: block; }} }}"
    );
    let mut engine = engine(&source);
    engine
        .ensure_class_rules(["(color:red)@apply(--stack)", "stack"])
        .unwrap();
    let text = engine.css_text();
    assert!(text.contains("@container card (width >= 28rem)"), "{text}");
    assert!(text.contains("@container not (width >= 28rem)"), "{text}");

    let css = compile_native_css(
        &format!(
            "{SCALE}@media print {{ @container card (--md) {{ .a {{ color: red }} }} }} @container sidebar not (--dense) {{ .b {{ color: blue }} }} @container (--x\\:y) {{}} @custom-container --x\\:y (width > 1px);"
        ),
        &CompileNativeCssOptions::default(),
    )
    .unwrap()
    .css;
    assert!(css.contains("@container card (width >= 28rem)"), "{css}");
    assert!(
        css.contains("@container sidebar not ((width >= 28rem) and style(--density: compact))"),
        "{css}"
    );
    assert!(!css.contains("custom-container"), "{css}");
    assert!(!css.contains(" (--"), "{css}");
}

#[test]
fn native_css_reports_undefined_references_with_a_range() {
    let error = compile_native_css(
        "/* 😀 */ @container card (--missing) { .x { color: red } }",
        &CompileNativeCssOptions::default(),
    )
    .unwrap_err();
    assert!(
        error
            .to_string()
            .contains("Undefined custom container --missing"),
        "{error}"
    );
    assert!(error.diagnostic().range.is_some());
}

#[test]
fn invalid_definitions_are_compilation_errors() {
    for (source, message) in [
        (
            "@custom-container --a (--b);",
            "Undefined custom container --b",
        ),
        (
            "@custom-container --a (--b); @custom-container --b not (--a);",
            "Circular custom container reference",
        ),
        (
            "@custom-container --card card (width >= 1px);",
            "defines a condition without a container name",
        ),
        (
            "@custom-container --a;",
            "requires --name and a container query",
        ),
        (
            "@media print { @custom-container --a (width > 1px); }",
            "top-level",
        ),
    ] {
        let error = manifest(source, None).unwrap_err();
        assert!(error.contains(message), "{source}: {error}");
    }
}

#[test]
fn a_later_definition_replaces_an_earlier_one_for_its_dependents() {
    let mut engine = engine(&format!("{SCALE}@custom-container --md (width >= 30rem);"));
    engine
        .ensure_class_rules([
            "(color:red)@container(--md)",
            "(color:blue)@container(--max-md)",
        ])
        .unwrap();
    let text = engine.css_text();
    assert!(text.contains("@container (width >= 30rem){"), "{text}");
    assert!(text.contains("@container not (width >= 30rem){"), "{text}");

    // A base manifest supplies expanded conditions; a project fragment adds or
    // replaces names without re-expanding the base's dependents, as custom media.
    let base = manifest(SCALE, None).unwrap();
    let mut engine = EngineSession::create(
        &manifest("@custom-container --wide (width >= 60rem);", Some(base)).unwrap(),
    )
    .unwrap();
    engine
        .ensure_class_rules([
            "(color:red)@container(--wide)",
            "(color:blue)@container(--md)",
        ])
        .unwrap();
    let text = engine.css_text();
    assert!(text.contains("@container (width >= 60rem)"), "{text}");
    assert!(text.contains("@container (width >= 28rem)"), "{text}");
}
