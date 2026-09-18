use mastercss_compiler::{CssImportProvider, resolve_css_import_graph};

struct Files(String);
impl CssImportProvider for Files {
    type Error = String;
    fn load(&self, id: &str) -> Result<String, String> {
        match id {
            "entry" => Ok(self.0.clone()),
            "child" => Ok(".example{color:red}".into()),
            _ => Err("missing".into()),
        }
    }
    fn resolve(&self, specifier: &str, _: &str) -> Result<Option<String>, String> {
        Ok((specifier == "./child.css").then(|| "child".into()))
    }
}

#[test]
fn bh_0004_import_media_is_preserved_when_expanding() {
    let result =
        resolve_css_import_graph("entry", &Files("@import './child.css' print;".into())).unwrap();
    assert!(result.source.contains("@media print"), "{}", result.source);
}

#[test]
fn bh_0004_import_layer_is_preserved_when_expanding() {
    let result = resolve_css_import_graph(
        "entry",
        &Files("@import './child.css' layer(theme);".into()),
    )
    .unwrap();
    assert!(result.source.contains("@layer theme"), "{}", result.source);
}

#[test]
fn bh_0004_import_supports_is_preserved_when_expanding() {
    let result = resolve_css_import_graph(
        "entry",
        &Files("@import './child.css' supports(display:grid);".into()),
    )
    .unwrap();
    assert!(result.source.contains("@supports"), "{}", result.source);
}

#[test]
fn bh_0004_combined_conditions_wrap_layer_instead_of_declaring_it_unconditionally() {
    let result = resolve_css_import_graph(
        "entry",
        &Files("@import url('./child.css') layer(theme) supports(display:grid) print;".into()),
    )
    .unwrap();
    assert_eq!(
        result.source,
        "@supports (display: grid){@media print{@layer theme{.example{color:red}}}}"
    );
}

#[test]
fn bh_0004_anonymous_layers_remain_distinct_and_unqualified_css_stays_bare() {
    for (qualifier, expected) in [
        ("", ".example{color:red}"),
        (" layer", "@layer {.example{color:red}}"),
        (" layer(a.b)", "@layer a.b{.example{color:red}}"),
        (
            " screen, print",
            "@media screen, print{.example{color:red}}",
        ),
        (
            " supports((display:grid) and (color:red))",
            "@supports (display: grid) and (color: red){.example{color:red}}",
        ),
    ] {
        let source = format!("@import './child.css'{qualifier};@import './child.css'{qualifier};");
        let result = resolve_css_import_graph("entry", &Files(source)).unwrap();
        assert_eq!(result.source, expected.repeat(2));
        assert_eq!(result.dependencies, ["entry", "child"]);
    }
}

struct NestedFiles(&'static str);
impl CssImportProvider for NestedFiles {
    type Error = String;
    fn load(&self, id: &str) -> Result<String, String> {
        Ok(match id {
            "entry" => "@import 'child' layer(outer) supports(display:grid) screen;".into(),
            "child" => self.0.into(),
            "grandchild" => ".example{color:red}".into(),
            _ => return Err("missing".into()),
        })
    }
    fn resolve(&self, specifier: &str, _: &str) -> Result<Option<String>, String> {
        Ok(matches!(specifier, "child" | "grandchild").then(|| specifier.into()))
    }
}

#[test]
fn bh_0004_nested_local_imports_preserve_each_condition_and_layer_scope() {
    let result = resolve_css_import_graph("entry", &NestedFiles(
        "@import 'grandchild' layer(inner) supports(color:red) (min-width:500px);.child{display:block}"
    )).unwrap();
    assert_eq!(
        result.source,
        "@supports (display: grid){@media screen{@layer outer{@supports (color: red){@media (width >= 500px){@layer inner{.example{color:red}}}}.child{display:block}}}}"
    );
    assert_eq!(result.dependencies, ["entry", "child", "grandchild"]);
}

#[test]
fn bh_0004_external_import_keeps_its_authored_qualifiers() {
    let source =
        "@import 'https://example.test/style.css' layer(remote) supports(display:grid) print;";
    let result = resolve_css_import_graph("entry", &Files(source.into())).unwrap();
    assert_eq!(result.source, source);
}

#[test]
fn bh_0004_unresolved_nested_import_is_an_explicit_limit_not_invalid_nested_css() {
    let error = resolve_css_import_graph(
        "entry",
        &NestedFiles("@import 'https://example.test/style.css';.child{display:block}"),
    )
    .unwrap_err();
    assert!(
        error
            .to_string()
            .contains("resolve its nested imports first")
    );
}

/// An import qualifier wraps the imported rules, but the imported stylesheet's
/// definitions are global declarations. Keeping them inside the wrapper both
/// misrepresents them and leaves a directive the lowering cannot handle.
struct DefiningChild(&'static str);
impl CssImportProvider for DefiningChild {
    type Error = String;
    fn load(&self, id: &str) -> Result<String, String> {
        match id {
            "entry" => Ok("@import './child.css' layer(cards) supports(display:grid) screen;\n.after{margin:1px}".into()),
            "child" => Ok(self.0.into()),
            _ => Err("missing".into()),
        }
    }
    fn resolve(&self, specifier: &str, _: &str) -> Result<Option<String>, String> {
        Ok((specifier == "./child.css").then(|| "child".into()))
    }
}

#[test]
fn bh_0004_qualified_import_keeps_imported_definitions_top_level() {
    let result = resolve_css_import_graph(
        "entry",
        &DefiningChild("@utilities{paint{padding:2rem}}\n.card{padding:3rem}"),
    )
    .unwrap();
    assert_eq!(
        result.source,
        "@utilities{paint{padding:2rem}}\n@supports (display: grid){@media screen{@layer cards{\n.card{padding:3rem}}}}\n.after{margin:1px}"
    );
}

#[test]
fn bh_0004_qualified_import_hoists_every_definition_family() {
    let result = resolve_css_import_graph(
        "entry",
        &DefiningChild(
            "@theme{--color-card:red}\n.card{padding:3rem}\n@components{note{padding:1rem}}",
        ),
    )
    .unwrap();
    assert!(
        result
            .source
            .starts_with("@theme{--color-card:red}\n@components{note{padding:1rem}}\n@supports"),
        "{}",
        result.source
    );
    assert!(
        result
            .source
            .contains("@layer cards{\n.card{padding:3rem}\n}"),
        "{}",
        result.source
    );
}

#[test]
fn bh_0004_unqualified_import_leaves_definitions_where_they_were() {
    struct Plain;
    impl CssImportProvider for Plain {
        type Error = String;
        fn load(&self, id: &str) -> Result<String, String> {
            match id {
                "entry" => Ok("@import './child.css';\n.after{margin:1px}".into()),
                "child" => Ok("@utilities{paint{padding:2rem}}\n.card{padding:3rem}".into()),
                _ => Err("missing".into()),
            }
        }
        fn resolve(&self, specifier: &str, _: &str) -> Result<Option<String>, String> {
            Ok((specifier == "./child.css").then(|| "child".into()))
        }
    }
    let result = resolve_css_import_graph("entry", &Plain).unwrap();
    assert_eq!(
        result.source,
        "@utilities{paint{padding:2rem}}\n.card{padding:3rem}\n.after{margin:1px}"
    );
}
