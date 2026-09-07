use super::*;

use std::time::{SystemTime, UNIX_EPOCH};

fn temporary_directory(label: &str) -> PathBuf {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    env::temp_dir().join(format!("mastercss-{label}-{nonce}"))
}

#[test]
fn atomically_replaces_staged_artifacts() {
    let root = temporary_directory("atomic-copy");
    fs::create_dir_all(&root).unwrap();
    let source = root.join("source.node");
    let output = root.join("mastercss.node");
    fs::write(&source, "new binding").unwrap();
    fs::write(&output, "stale binding").unwrap();

    copy_fresh(&source, &output).unwrap();

    assert_eq!(fs::read_to_string(&output).unwrap(), "new binding");
    assert_eq!(fs::read_dir(&root).unwrap().count(), 2);
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn assembles_all_native_packages_and_writes_stable_checksums() {
    let root = temporary_directory("native-release");
    fs::create_dir_all(&root).unwrap();
    for package in BINDING_TARGET_PACKAGES {
        let directory = root.join(format!("mastercss-{package}"));
        fs::create_dir_all(&directory).unwrap();
        fs::create_dir_all(root.join("packages").join(package)).unwrap();
        let executable = if package.contains("win32") {
            "mcss.exe"
        } else {
            "mcss"
        };
        fs::write(directory.join("mastercss.node"), format!("addon:{package}")).unwrap();
        fs::write(directory.join(executable), format!("cli:{package}")).unwrap();
        fs::write(
            directory.join("package.json"),
            serde_json::json!({
                "name": format!("@master/css-{package}"),
                "files": ["mastercss.node", executable],
                "bin": { "mcss": format!("./{executable}") }
            })
            .to_string(),
        )
        .unwrap();
    }
    let output = root.join("checksums.json");
    assemble_native_release_at(&root, &root, &output, true, false, false).unwrap();
    let manifest: serde_json::Value =
        serde_json::from_str(&fs::read_to_string(&output).unwrap()).unwrap();
    assert_eq!(manifest["version"], 1);
    assert_eq!(manifest["packages"].as_array().unwrap().len(), 8);
    assert_eq!(manifest["assets"].as_array().unwrap().len(), 0);
    assert!(
        manifest["packages"][0]["addon"]["sha256"]
            .as_str()
            .is_some_and(|checksum| checksum.len() == 64)
    );
    let staged_addon = root.join("packages/binding-darwin-arm64/mastercss.node");
    fs::write(&staged_addon, "modified after staging").unwrap();
    assert_eq!(
        assemble_native_release_at(
            &root,
            &root,
            &root.join("verified-checksums.json"),
            false,
            false,
            true,
        )
        .unwrap_err(),
        "Staged native artifact differs from release input: packages/binding-darwin-arm64/mastercss.node"
    );
    let required_output = root.join("required-checksums.json");
    assert_eq!(
        assemble_native_release_at(&root, &root, &required_output, false, true, false).unwrap_err(),
        "Missing required release asset: packages/runtime/dist/global.min.js"
    );
    fs::remove_dir_all(root).unwrap();
}
