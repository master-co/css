use super::*;

use mastercss_scanner::ScannerSession;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

static TEMP_PROJECT_COUNTER: AtomicU64 = AtomicU64::new(0);

fn temp_project() -> PathBuf {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let counter = TEMP_PROJECT_COUNTER.fetch_add(1, Ordering::Relaxed);
    let path = std::env::temp_dir().join(format!(
        "mastercss-project-{}-{nonce}-{counter}",
        std::process::id()
    ));
    fs::create_dir_all(&path).unwrap();
    path
}

#[test]
fn source_paths_remove_windows_verbatim_prefixes_before_glob_matching() {
    for (input, expected) in [
        (r"C:\project\views\*.html", "C:/project/views/*.html"),
        (r"\\?\C:\project\views\*.html", "C:/project/views/*.html"),
        (
            r"\\?\UNC\server\share\views\*.html",
            "//server/share/views/*.html",
        ),
        (
            r"\\server\share\views\*.html",
            "//server/share/views/*.html",
        ),
    ] {
        let pattern = normalize_path(Path::new(input));
        assert_eq!(pattern, expected);
        assert_eq!(
            source_pattern_root(&pattern),
            PathBuf::from(expected.strip_suffix("*.html").unwrap())
        );
        assert!(glob_matches(
            &pattern,
            &expected.replace("*.html", "index.html")
        ));
    }
}

#[test]
fn discovers_entries_and_compiles_local_imports() {
    let project = temp_project();
    fs::write(
        project.join("entry.css"),
        "@import '@master/css'; @import './components.css';",
    )
    .unwrap();
    fs::write(
        project.join("components.css"),
        " @mixin --btn { display: block; } ",
    )
    .unwrap();
    fs::create_dir_all(project.join("node_modules/ignored")).unwrap();
    fs::write(
        project.join("node_modules/ignored/entry.css"),
        "@import '@master/css';@mixin --always{@contents;}",
    )
    .unwrap();

    let entries = find_css_manifest_entries(&project);
    assert_eq!(entries.len(), 1);
    let result = load_project_manifest_entries(
        &entries,
        serde_json::json!({"version":4,"languageVersion":12}),
    )
    .unwrap();
    let mut scanner = ScannerSession::create(&result.manifest.to_string()).unwrap();
    scanner
        .scan("index.html", "<button class=\"btn\"></button>")
        .unwrap();
    let css = scanner.state().unwrap().engine.text;
    assert!(
        css.contains(".btn{display:block}"),
        "css={css} manifest={}",
        result.manifest
    );
    assert_eq!(result.dependencies.len(), 2);

    fs::remove_dir_all(project).unwrap();
}

#[test]
fn excludes_generated_stylesheets_from_implicit_entries_only() {
    let project = temp_project();
    let entry = project.join("entry.css");
    let generated = project.join(".master/stylesheets/revision/entry.css");
    fs::create_dir_all(generated.parent().unwrap()).unwrap();
    fs::write(&entry, "@import '@master/css';@mixin --always{@contents;}").unwrap();
    fs::write(
        &generated,
        "@import '@master/css';@mixin --always{@contents;}",
    )
    .unwrap();

    assert_eq!(
        find_css_manifest_entries(&project),
        vec![entry.canonicalize().unwrap()]
    );

    let explicit = load_project_manifest_entries(
        std::slice::from_ref(&generated),
        serde_json::json!({"version":4,"languageVersion":12}),
    )
    .unwrap();
    assert_eq!(
        explicit.entries,
        vec![normalize_path(&generated.canonicalize().unwrap())]
    );

    let css_extensions = HashSet::from(["css"]);
    assert!(collect_project_files(&project, &css_extensions).contains(&generated));

    fs::remove_dir_all(project).unwrap();
}

#[test]
fn lowers_native_variants_against_the_base_manifest() {
    let project = temp_project();
    let entry = project.join("entry.css");
    fs::write(
        &entry,
        r###"@import '@master/css';@mixin --always{@contents;} .hidden-card { @apply --always { display:none; } }"###,
    )
    .unwrap();
    let base_manifest = serde_json::from_str(include_str!(
        "../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();

    let result = load_project_manifest_entries(&[entry], base_manifest).unwrap();
    assert!(
        result.generated_css.contains(".hidden-card{display:none}"),
        "generated CSS: {}",
        result.generated_css
    );
    assert!(result.css.contains(".hidden-card{display:none}"));

    fs::remove_dir_all(project).unwrap();
}

#[test]
fn resolves_entry_owned_source_plans_and_arbitrary_extensions() {
    let workspace = temp_project();
    let project = workspace.join("app");
    let styles = project.join("styles");
    let templates = project.join("templates");
    let shared = workspace.join("shared");
    fs::create_dir_all(&styles).unwrap();
    fs::create_dir_all(&templates).unwrap();
    fs::create_dir_all(&shared).unwrap();
    fs::write(
        styles.join("entry.css"),
        r#"@import '@master/css';@mixin --always{@contents;}
@source "../templates/**/*.{liquid,erb}";
@source not "../templates/skip.*";
@source "../../shared/*.cshtml";"#,
    )
    .unwrap();
    fs::write(
        templates.join("product.liquid"),
        "<div class=\"block\"></div>",
    )
    .unwrap();
    fs::write(
        templates.join("detail.erb"),
        "<div class=\"margin:0\"></div>",
    )
    .unwrap();
    fs::write(
        templates.join("skip.liquid"),
        "<div class=\"color:red\"></div>",
    )
    .unwrap();
    fs::write(
        shared.join("shell.cshtml"),
        "<div class=\"text:center\"></div>",
    )
    .unwrap();

    let result = load_project_manifest(
        &project,
        serde_json::json!({"version":4,"languageVersion":12}),
    )
    .unwrap();
    let entry_plan = &result.source_plan.entries[0];
    assert_eq!(result.source_plan.version, PROJECT_SOURCE_PLAN_VERSION);
    assert_eq!(
        entry_plan.entry,
        normalize_path(&styles.join("entry.css").canonicalize().unwrap())
    );
    assert_eq!(entry_plan.include.len(), 3);
    assert_eq!(entry_plan.exclude.len(), 1);
    assert_eq!(
        result.source_plan.files,
        vec![
            normalize_path(&templates.join("detail.erb").canonicalize().unwrap()),
            normalize_path(&templates.join("product.liquid").canonicalize().unwrap()),
            normalize_path(&shared.join("shell.cshtml").canonicalize().unwrap()),
        ]
    );

    fs::remove_dir_all(workspace).unwrap();
}

#[test]
fn resolves_bare_source_patterns_from_the_declaring_stylesheet() {
    let project = temp_project();
    fs::create_dir_all(project.join("styles")).unwrap();
    fs::create_dir_all(project.join("styles/views")).unwrap();
    fs::write(
        project.join("styles/entry.css"),
        "@import '@master/css';@mixin --always{@contents;} @source \"views/*.tmpl\";",
    )
    .unwrap();
    fs::write(
        project.join("styles/views/page.tmpl"),
        "<div class=\"block\"></div>",
    )
    .unwrap();

    let result = load_project_manifest(
        &project,
        serde_json::json!({"version":4,"languageVersion":12}),
    )
    .unwrap();
    assert_eq!(
        result.source_plan.files,
        vec![normalize_path(
            &project
                .join("styles/views/page.tmpl")
                .canonicalize()
                .unwrap()
        )]
    );

    fs::remove_dir_all(project).unwrap();
}

#[test]
fn matches_source_globs_with_fast_glob_compatible_primitives() {
    assert!(glob_matches("/root/**/[a-c]?.tsx", "/root/a/b2.tsx"));
    assert!(glob_matches("/root/icon-??.svg", "/root/icon-😀.svg"));
    assert!(!glob_matches("/root/icon-?.svg", "/root/icon-😀.svg"));
    assert!(!glob_matches("/root/**/*.tsx", "/root/.hidden/page.tsx"));
    assert!(glob_matches(
        "/root/.hidden/**/*.tsx",
        "/root/.hidden/page.tsx"
    ));
    assert!(glob_matches("/root/[!a]*.tsx", "/root/button.tsx"));
    assert!(!glob_matches("/root/[!a]*.tsx", "/root/alert.tsx"));
}
