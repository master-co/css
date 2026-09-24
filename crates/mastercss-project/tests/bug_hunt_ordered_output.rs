use mastercss_project::load_project_manifest_entries;
use serde_json::json;
use std::{
    fs,
    time::{SystemTime, UNIX_EPOCH},
};

#[test]
fn flat_project_css_uses_ordered_output_while_preserving_metadata_views() {
    let root = std::env::temp_dir().join(format!(
        "master-project-ordered-{}-{}",
        std::process::id(),
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    fs::create_dir_all(&root).unwrap();
    let entry = root.join("entry.css");
    fs::write(&entry, "@master entry;@utilities{paint{padding:2rem!important}low{padding:1rem!important}}@layer{.a{@compose paint;}.b{@compose low;}}").unwrap();
    let result = load_project_manifest_entries(
        &[entry],
        json!({"version":1,"languageVersion":2,"utilities":[]}),
    );
    fs::remove_dir_all(root).unwrap();
    let result = result.unwrap();
    assert_eq!(result.css.matches("@layer").count(), 1, "{}", result.css);
    assert_eq!(
        result.generated_css.matches("@layer").count(),
        2,
        "metadata remains separate"
    );
}
