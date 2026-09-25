use mastercss_project::load_project_manifest;
use mastercss_scanner::ScannerSession;
use serde_json::json;
use std::{
    fs,
    path::PathBuf,
    sync::atomic::{AtomicU64, Ordering},
};

struct Project(PathBuf);
impl Project {
    fn new() -> Self {
        static NEXT: AtomicU64 = AtomicU64::new(0);
        let path = std::env::temp_dir().join(format!(
            "master-filesystem-boundaries-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir_all(&path).unwrap();
        Self(path.canonicalize().unwrap())
    }
    fn file(&self, name: &str, source: &str) -> String {
        let path = self.0.join(name);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(&path, source).unwrap();
        path.to_string_lossy().into_owned()
    }
    fn load(&self) -> mastercss_project::ProjectManifestIr {
        load_project_manifest(
            &self.0,
            json!({"version":1,"languageVersion":2,"utilities":[]}),
        )
        .unwrap()
    }
}
impl Drop for Project {
    fn drop(&mut self) {
        fs::remove_dir_all(&self.0).unwrap();
    }
}
fn css(manifest: &serde_json::Value, classes: &str) -> String {
    let mut scanner = ScannerSession::create(&manifest.to_string()).unwrap();
    scanner
        .scan("view.html", &format!("<div class=\"{classes}\"></div>"))
        .unwrap();
    scanner.state().unwrap().engine.text
}

#[test]
fn qualified_files_reject_global_definitions_but_keep_native_compose() {
    for qualifier in [
        "",
        " layer",
        " layer(cards)",
        " supports(display:grid)",
        " screen",
        " layer(cards) supports(display:grid) screen",
    ] {
        let project = Project::new();
        project.file(
            "entry.css",
            &format!("@import './child.css'{qualifier};@master entry;"),
        );
        project.file(
            "child.css",
            "@utilities{paint{color:red}}.card{@compose paint;}.ordinary{color:blue}",
        );
        if !qualifier.is_empty() {
            let error = load_project_manifest(&project.0, json!({"version":1,"languageVersion":2}))
                .unwrap_err()
                .to_string();
            assert!(error.contains("Qualified import"), "{error}");
            assert!(error.contains("child.css"), "{error}");
            project.file("entry.css", &format!("@import './child.css'{qualifier};@master entry;@utilities{{paint{{color:red}}}}"));
            project.file("child.css", ".card{@compose paint;}.ordinary{color:blue}");
        }
        let result = project.load();
        assert!(
            css(&result.manifest, "paint").contains(".paint{color:red}"),
            "{qualifier}: {}",
            result.manifest
        );
        assert!(
            result.css.contains(".card{color:red}"),
            "{qualifier}: {}",
            result.css
        );
        assert!(result.generated_css.contains(".card{color:red}"));
        assert!(!result.css.contains(".ordinary"));
        if qualifier.contains("layer") {
            assert!(result.css.contains("@layer"), "{}", result.css);
        }
        if qualifier.contains("supports") {
            assert!(result.css.contains("@supports"), "{}", result.css);
        }
        if qualifier.contains("screen") {
            assert!(result.css.contains("@media screen"), "{}", result.css);
        }
    }
}

#[test]
fn imported_source_patterns_belong_to_the_child_file() {
    let project = Project::new();
    project.file("entry.css", "@import './styles/child.css';@master entry;");
    project.file(
        "styles/child.css",
        "@source './views/*.html';@utilities{paint{color:red}}",
    );
    let view = project.file("styles/views/real.html", "<div class=paint></div>");
    project.file("views/wrong.html", "<div class=wrong></div>");
    assert_eq!(project.load().source_plan.files, vec![view]);
}

#[test]
fn external_native_imports_do_not_block_manifest_and_compose() {
    let project = Project::new();
    project.file(
        "entry.css",
        "@import './child.css' layer(cards) screen;@master entry;@utilities{paint{color:red}}",
    );
    project.file("child.css", "@import 'https://invalid.invalid/remote.css';.card{@compose paint;}body{background:url('./missing.png')}");
    let result = project.load();
    assert!(css(&result.manifest, "paint").contains(".paint{color:red}"));
    assert!(result.css.contains(".card{color:red}"), "{}", result.css);
    assert!(!result.css.contains("@import"));
    assert_eq!(result.dependencies.len(), 2);
}

#[test]
fn references_resolve_compose_without_exporting_reference_definitions_or_sources() {
    let project = Project::new();
    project.file("entry.css", "@master entry;@reference './tokens.css';@utilities{button{@compose paint;}}.card{@compose paint;}");
    let tokens = project.file(
        "tokens.css",
        "@source './ignored/*.html';@utilities{paint{color:red}}",
    );
    project.file("ignored/view.html", "ignored");
    let result = project.load();
    let actual = css(&result.manifest, "button paint");
    assert!(actual.contains(".button{color:red}"), "{actual}");
    assert!(!actual.contains(".paint{"));
    assert!(result.css.contains(".card{color:red}"), "{}", result.css);
    assert!(result.dependencies.contains(&tokens));
    assert!(result.source_plan.files.is_empty());
}

#[test]
fn filesystem_import_and_reference_cycles_remain_errors() {
    for kind in ["import", "reference"] {
        let project = Project::new();
        project.file(
            "entry.css",
            &format!("@{kind} './child.css';@master entry;"),
        );
        project.file("child.css", &format!("@{kind} './entry.css';"));
        let error = load_project_manifest(
            &project.0,
            json!({"version":1,"languageVersion":2,"utilities":[]}),
        )
        .unwrap_err();
        assert!(
            error.to_string().contains("Circular CSS"),
            "{kind}: {error}"
        );
    }
}

#[test]
fn repeated_imports_and_entry_override_keep_authoring_order() {
    let project = Project::new();
    project.file(
        "entry.css",
        "@import './red.css';@import './blue.css';@import './red.css';@master entry;",
    );
    project.file("red.css", "@utilities{paint{color:red}}");
    project.file("blue.css", "@utilities{paint{color:blue}}");
    assert!(css(&project.load().manifest, "paint").contains(".paint{color:red}"));
    project.file(
        "entry.css",
        "@import './red.css';@master entry;@utilities{paint{color:blue}}",
    );
    assert!(css(&project.load().manifest, "paint").contains(".paint{color:#00f}"));
}
