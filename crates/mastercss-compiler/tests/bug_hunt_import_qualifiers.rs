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
