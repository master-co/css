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
        load_project_manifest(&self.0, json!({"version":4,"languageVersion":12})).unwrap()
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
fn qualified_files_reject_global_definitions_but_keep_native_variants() {
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
            &format!(
                "@import './child.css'{qualifier};@import '@master/css';@mixin --always{{@contents;}}"
            ),
        );
        project.file(
            "child.css",
            r###"@mixin --paint {color:red}.card{@apply --always{color:red;}}.ordinary{color:blue}"###,
        );
        if !qualifier.is_empty() {
            let error =
                load_project_manifest(&project.0, json!({"version":4,"languageVersion":12}))
                    .unwrap_err()
                    .to_string();
            assert!(error.contains("Qualified import"), "{error}");
            assert!(error.contains("child.css"), "{error}");
            project.file("entry.css", &format!("@import './child.css'{qualifier};@import '@master/css';@mixin --always{{@contents;}}@mixin --paint{{color:red}}"));
            project.file(
                "child.css",
                ".card{@apply --always{color:red;}}.ordinary{color:blue}",
            );
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
    project.file(
        "entry.css",
        "@import './styles/child.css';@import '@master/css';@mixin --always{@contents;}",
    );
    project.file(
        "styles/child.css",
        "@source './views/*.html';@mixin --paint {color:red}",
    );
    let view = project.file("styles/views/real.html", "<div class=paint></div>");
    project.file("views/wrong.html", "<div class=wrong></div>");
    assert_eq!(project.load().source_plan.files, vec![view]);
}

#[test]
fn external_native_imports_do_not_block_manifest_and_variants() {
    let project = Project::new();
    project.file(
        "entry.css",
        "@import './child.css' layer(cards) screen;@import '@master/css';@mixin --always{@contents;}@mixin --paint {color:red}",
    );
    project.file("child.css", "@import 'https://invalid.invalid/remote.css';.card{@apply --always{color:red;}}body{background:url('./missing.png')}");
    let result = project.load();
    assert!(css(&result.manifest, "paint").contains(".paint{color:red}"));
    assert!(result.css.contains(".card{color:red}"), "{}", result.css);
    assert!(!result.css.contains("@import"));
    assert_eq!(result.dependencies.len(), 2);
}

#[test]
fn references_resolve_variants_without_exporting_reference_definitions_or_sources() {
    let project = Project::new();
    project.file("entry.css", "@import '@master/css';@mixin --always{@contents;}@reference './tokens.css';@mixin --button {@apply --print-paint{color:red;}}.card{@apply --print-paint{color:red;}}");
    let tokens = project.file(
        "tokens.css",
        "@source './ignored/*.html';@mixin --print-paint{@media print{@contents;}}@mixin --paint {color:blue}",
    );
    project.file("ignored/view.html", "ignored");
    let result = project.load();
    let actual = css(&result.manifest, "button paint");
    assert!(
        actual.contains("@media print{.button{color:red}}"),
        "{actual}"
    );
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
            &format!("@{kind} './child.css';@import '@master/css';@mixin --always{{@contents;}}"),
        );
        project.file("child.css", &format!("@{kind} './entry.css';"));
        let error = load_project_manifest(&project.0, json!({"version":4,"languageVersion":12}))
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
        "@import './red.css';@import './blue.css';@import './red.css';@import '@master/css';@mixin --always{@contents;}",
    );
    project.file("red.css", "@mixin --paint {color:red}");
    project.file("blue.css", "@mixin --paint {color:blue}");
    assert!(css(&project.load().manifest, "paint").contains(".paint{color:red}"));
    project.file(
        "entry.css",
        "@import './red.css';@import '@master/css';@mixin --always{@contents;}@mixin --paint {color:blue}",
    );
    assert!(css(&project.load().manifest, "paint").contains(".paint{color:blue}"));
}

#[test]
fn reference_native_apply_is_not_a_root_but_called_definitions_remain_available() {
    let project = Project::new();
    project.file("entry.css", "@import '@master/css';@reference './recipes.css';@mixin --card{@apply --paint(red)}.caption{@apply --paint(blue)}");
    project.file("recipes.css", "@mixin --paint(--color){color:var(--color)}@mixin --unused{color:var(--unused)}.reference-only{@apply --unused;}");
    let result = project.load();
    assert!(
        result.css.contains(".caption{color:blue}"),
        "{}",
        result.css
    );
    assert!(!result.css.contains("reference-only"));
    assert!(!result.css.contains("--unused"));
    assert_eq!(css(&result.manifest, ""), "");
    assert!(css(&result.manifest, "card").contains(".card{color:red}"));
}
