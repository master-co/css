use std::{
    fs,
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};

#[test]
fn native_cli_keeps_composed_styles_in_one_anonymous_layer() {
    let root = std::env::temp_dir().join(format!(
        "master-cli-ordered-{}-{}",
        std::process::id(),
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    fs::create_dir_all(&root).unwrap();
    fs::write(root.join("entry.css"), "@master entry;@utilities{paint{padding:2rem!important}low{padding:1rem!important}}@layer{.a{@compose paint;}.b{@compose low;}}").unwrap();
    let output = Command::new(env!("CARGO_BIN_EXE_mcss"))
        .current_dir(&root)
        .args(["--no-export", "-v", "0"])
        .output()
        .unwrap();
    fs::remove_dir_all(root).unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let css = String::from_utf8(output.stdout).unwrap();
    assert_eq!(css.matches("@layer").count(), 1, "{css}");
    assert!(css.find(".a{") < css.find(".b{"), "{css}");
}
