use std::collections::HashMap;

use super::{
    CompileNativeCssOptions, CssImportProvider, ErrorCode, SourceRange, compile_css_directives,
    compile_native_css, inspect_css, resolve_css_import_graph,
};

struct MemoryImportProvider {
    files: HashMap<String, String>,
    resolutions: HashMap<(String, String), String>,
}

impl CssImportProvider for MemoryImportProvider {
    type Error = &'static str;

    fn load(&self, id: &str) -> Result<String, Self::Error> {
        self.files.get(id).cloned().ok_or("missing file")
    }

    fn resolve(&self, specifier: &str, from: &str) -> Result<Option<String>, Self::Error> {
        Ok(self
            .resolutions
            .get(&(from.to_owned(), specifier.to_owned()))
            .cloned())
    }
}

#[test]
fn recognizes_only_explicit_project_entry_markers() {
    let inspection = inspect_css("@master entry;");
    assert!(!inspection.has_master_css_import);
    assert!(!inspection.has_master_entry);
    assert!(inspection.directives.is_empty());
    assert!(inspect_css("@import \"@master/css\";").has_master_entry);
    assert!(!inspect_css("@master;").has_master_entry);
    assert!(!inspect_css("@master global;").has_master_entry);
    assert!(!inspect_css(".x{content:'@import \"@master/css\";'}").has_master_entry);
}

#[test]
fn resolves_import_graphs_through_a_provider_without_filesystem_ownership() {
    let provider = MemoryImportProvider {
            files: HashMap::from([
                (
                    "/entry.css".into(),
                    "@import \"./theme.css\";\n@import \"https://example.com/font.css\";\n.entry{display:block}".into(),
                ),
                (
                    "/theme.css".into(),
                    "@reference \"./tokens.css\";\n@import \"./utilities.css\";\n@theme{:root, :host {--color-brand:red}}".into(),
                ),
                (
                    "/utilities.css".into(),
                    "@mixin --block {display:block}".into(),
                ),
            ]),
            resolutions: HashMap::from([
                (
                    ("/entry.css".into(), "./theme.css".into()),
                    "/theme.css".into(),
                ),
                (
                    ("/theme.css".into(), "./utilities.css".into()),
                    "/utilities.css".into(),
                ),
            ]),
        };
    let graph = resolve_css_import_graph("/entry.css", &provider).unwrap();
    assert_eq!(
        graph.dependencies,
        ["/entry.css", "/theme.css", "/utilities.css"]
    );
    assert_eq!(graph.references.len(), 1);
    assert_eq!(graph.references[0].file.as_deref(), Some("/theme.css"));
    assert_eq!(graph.references[0].source, "./tokens.css");
    assert!(
        graph
            .source
            .starts_with("@import \"https://example.com/font.css\";\n")
    );
    assert!(graph.source.contains("@mixin --block {display:block}"));
    assert!(graph.source.ends_with(".entry{display:block}"));
}

#[test]
fn rejects_provider_import_cycles_deterministically() {
    let provider = MemoryImportProvider {
        files: HashMap::from([
            ("/a.css".into(), "@import \"./b.css\";".into()),
            ("/b.css".into(), "@import \"./a.css\";".into()),
        ]),
        resolutions: HashMap::from([
            (("/a.css".into(), "./b.css".into()), "/b.css".into()),
            (("/b.css".into(), "./a.css".into()), "/a.css".into()),
        ]),
    };
    let error = resolve_css_import_graph("/a.css", &provider).unwrap_err();
    assert_eq!(
        error.to_string(),
        "Circular CSS import: /a.css -> /b.css -> /a.css"
    );
    assert_eq!(error.diagnostic().code, ErrorCode::CssImportError);
}

#[test]
fn native_css_rejects_removed_entry_directive() {
    let error = compile_native_css(
        "@master entry;\n.card { color: red; }",
        &CompileNativeCssOptions::default(),
    )
    .unwrap_err();
    assert!(error.diagnostic().range.is_some());
    let result = compile_native_css(
        ".card { color: red; margin: 0px 1.0rem; }",
        &CompileNativeCssOptions::default(),
    )
    .unwrap();
    assert_eq!(
        result.native_css,
        ".card {\n  color: red;\n  margin: 0 1rem;\n}"
    );
}

#[test]
fn can_skip_native_css_printing() {
    let result = compile_native_css(
        ".card { color: red; }",
        &CompileNativeCssOptions {
            preserve_native_css: false,
            ..CompileNativeCssOptions::default()
        },
    )
    .unwrap();
    assert_eq!(result.native_css, "");
}

#[test]
fn filters_native_selectors_without_losing_discovered_classes() {
    let result = compile_css_directives(
        ".used,.unused { color: red; }\n@media print { .unused { display: none; } }",
        &CompileNativeCssOptions {
            classes: Some(vec!["used".into()]),
            prune_native_css: true,
            ..CompileNativeCssOptions::default()
        },
    )
    .unwrap();
    assert_eq!(result.native_class_names, ["used", "unused"]);
    assert_eq!(result.native_css, ".used {\n  color: red;\n}");
}

#[test]
fn lowers_theme_tokens_and_preserves_native_css() {
    let result = compile_css_directives(
        "@theme { :root, :host { --color-brand: rgb(0 128 255); --leading-tight: 1.0; }}\n.card { color: red; }",
        &CompileNativeCssOptions::default(),
    ).unwrap();
    assert_eq!(
        serde_json::to_value(result.manifest_input).unwrap(),
        serde_json::json!({
            "theme": [{"type":"rule","prelude":":root,:host","children":[
                {"type":"declaration","name":"color-brand","value":"#0080ff"},
                {"type":"declaration","name":"leading-tight","value":"1"}
            ]}]
        })
    );
    assert_eq!(result.native_css, ".card {\n  color: red;\n}");
}

#[test]
fn theme_preserves_all_scopes_and_repeated_declarations() {
    let result = compile_css_directives(
        "@theme{:root{--color-brand:#111;--color-accent:#222}[data-theme=dark]{--color-brand:#333}:root{--color-brand:#444}}",
        &CompileNativeCssOptions::default(),
    ).unwrap();
    let theme = serde_json::to_value(result.manifest_input).unwrap()["theme"].clone();
    assert_eq!(theme.as_array().unwrap().len(), 3);
    assert_eq!(theme[0]["children"][0]["value"], "#111");
    assert_eq!(theme[1]["prelude"], "[data-theme=dark]");
    assert_eq!(theme[1]["children"][0]["value"], "#333");
    assert_eq!(theme[2]["children"][0]["value"], "#444");
}

#[test]
fn rejects_removed_theme_modifiers_with_original_ranges() {
    let error = compile_css_directives(
        "/*😀*/\n@theme dark inline { --color-brand: #fff; }",
        &CompileNativeCssOptions::default(),
    )
    .unwrap_err();
    assert!(
        error
            .to_string()
            .contains("does not accept modes, inline or static")
    );
    assert_eq!(
        error.diagnostic().range,
        Some(SourceRange { start: 7, end: 13 })
    );
}

#[test]
fn keyframes_require_native_stylesheet_ownership() {
    let result = compile_css_directives(
        "@theme{:root{--color-brand:#123}}@keyframes fade{from,50%{opacity:0}to{opacity:1}}",
        &CompileNativeCssOptions::default(),
    )
    .unwrap();
    assert!(result.native_css.contains("@keyframes fade"));
    assert!(
        serde_json::to_value(result.manifest_input)
            .unwrap()
            .get("animations")
            .is_none()
    );
    assert!(
        compile_css_directives(
            "@theme{@keyframes fade{to{opacity:1}}}",
            &CompileNativeCssOptions::default()
        )
        .is_err()
    );
}

#[test]
fn preserves_native_theme_functions_dollars_and_pipes() {
    let result = compile_css_directives(
        r#"@theme{:root{--color-muted:--alpha(var(--color-primary) / .5);--content-quoted:"a | b";--content-piped:a | b;--money:$100;--pipe:a|b}}.data{--value:--value();--money:$100;--pipe:a|b}"#,
        &CompileNativeCssOptions::default(),
    ).unwrap();
    let theme = serde_json::to_value(result.manifest_input).unwrap();
    let declarations = &theme["theme"][0]["children"];
    assert_eq!(
        declarations[0]["value"],
        "--alpha(var(--color-primary) / .5)"
    );
    assert_eq!(declarations[1]["value"], "\"a | b\"");
    assert_eq!(declarations[2]["value"], "a | b");
    assert_eq!(declarations[3]["value"], "$100");
    assert_eq!(declarations[4]["value"], "a|b");
    for literal in ["--value()", "$100", "a|b"] {
        assert!(result.native_css.contains(literal));
    }
}

#[test]
fn settings_are_removed_at_the_directive_boundary() {
    let error = compile_css_directives(
        "@settings { important: on; scope: .app; }",
        &CompileNativeCssOptions::default(),
    )
    .unwrap_err();
    assert!(error.to_string().contains("@settings has been removed"));
    assert_eq!(
        error.diagnostic().range,
        Some(SourceRange { start: 0, end: 9 })
    );
}

#[test]
fn lowers_mixins_with_utf16_source_ranges() {
    let source = "/* 😀 */\n@mixin --btn { display: inline-flex; color: red; }\n@mixin --content-auto { content-visibility: auto; }";
    let result = compile_css_directives(source, &CompileNativeCssOptions::default()).unwrap();
    let definitions = result.manifest_input.mixins.unwrap();
    for (definition, name, property, value) in [
        (&definitions[0], "--btn", "display", "inline-flex"),
        (
            &definitions[1],
            "--content-auto",
            "content-visibility",
            "auto",
        ),
    ] {
        assert_eq!(definition.name, name);
        let mastercss_schema::MixinNode::Declaration {
            property: actual_property,
            value: actual_value,
            ..
        } = &definition.body[0]
        else {
            panic!("declaration");
        };
        assert_eq!(actual_property, property);
        assert_eq!(
            mastercss_engine::evaluate_mixin_value(actual_value, &Default::default()).unwrap(),
            value
        );
        let start = source[..source.find(&format!("@mixin {name}")).unwrap()]
            .encode_utf16()
            .count();
        assert_eq!(
            definition.source.as_ref().unwrap().range.start as usize,
            start
        );
    }
}
