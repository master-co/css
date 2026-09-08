use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

struct Scratch(PathBuf);
impl Drop for Scratch {
    fn drop(&mut self) {
        fs::remove_dir_all(&self.0).unwrap();
    }
}

#[test]
fn bh_0018_native_cli_discovers_mjs_by_default_glob_and_explicit_path() {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let root = Scratch(
        std::env::temp_dir().join(format!("master-css-bh-mjs-{}-{nonce}", std::process::id())),
    );
    fs::create_dir(&root.0).unwrap();
    fs::write(root.0.join("entry.mjs"), "export const classes = 'block'").unwrap();
    fs::write(root.0.join("ignored.json"), r#"{"class":"hidden"}"#).unwrap();
    for paths in [vec![], vec!["**/*.mjs"], vec!["entry.mjs"]] {
        let result = Command::new(env!("CARGO_BIN_EXE_mcss"))
            .arg("--no-export")
            .args(&paths)
            .current_dir(&root.0)
            .output()
            .unwrap();
        assert!(
            result.status.success(),
            "{:?}: {}",
            paths,
            String::from_utf8_lossy(&result.stderr)
        );
        let css = String::from_utf8(result.stdout).unwrap();
        assert!(css.contains(".block{display:block}"), "{paths:?}: {css}");
        assert!(!css.contains(".hidden{display:none}"), "{paths:?}: {css}");
        assert!(!root.0.join("master.css").exists());
    }
}
