use mastercss_project::{ProjectManifestIr, load_project_manifest};
use serde_json::{Value, json};
use std::{
    fs,
    path::{Path, PathBuf},
    sync::atomic::{AtomicU64, Ordering},
};

/// A project root inside its own temporary directory.
struct Checkout(PathBuf, PathBuf);
impl Checkout {
    fn new(layout: &str) -> Self {
        static NEXT: AtomicU64 = AtomicU64::new(0);
        let temporary = std::env::temp_dir().join(format!(
            "master-keyframe-owner-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir_all(temporary.join(layout)).unwrap();
        let checkout = Self(temporary.join(layout).canonicalize().unwrap(), temporary);
        checkout.file("package.json", r#"{"name":"app"}"#);
        checkout.file(
            "styles/entry.css",
            "@import '@master/css';@import './motion.css';@import './esm/fade.css';",
        );
        checkout.file(
            "styles/motion.css",
            "@keyframes slide{to{opacity:1}}.slider{animation:slide 1s}",
        );
        checkout.file("styles/esm/package.json", r#"{"type":"module"}"#);
        checkout.file(
            "styles/esm/fade.css",
            "@keyframes slide{to{opacity:1}}.fader{animation:slide 1s}",
        );
        checkout
    }
    fn file(&self, name: &str, source: &str) {
        let path = self.0.join(name);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, source).unwrap();
    }
    fn load(&self) -> ProjectManifestIr {
        load_project_manifest(&self.0, json!({"version":6,"languageVersion":16})).unwrap()
    }
}
impl Drop for Checkout {
    fn drop(&mut self) {
        fs::remove_dir_all(&self.1).unwrap();
    }
}

/// Source provenance keeps the checkout path; identities and CSS must not.
fn identities(project: &ProjectManifestIr, root: &Path) -> Vec<Value> {
    let root = root.to_string_lossy();
    project.manifest["keyframes"]
        .as_array()
        .unwrap()
        .iter()
        .map(|definition| {
            let file = definition["source"]["file"].as_str().unwrap();
            json!({
                "id": definition["id"],
                "ownerId": definition["ownerId"],
                "slotId": definition["slotId"],
                "file": file.strip_prefix(root.as_ref()).unwrap(),
            })
        })
        .collect()
}

#[test]
fn keyframe_identity_is_independent_of_the_checkout_path() {
    let first = Checkout::new("a");
    let second = Checkout::new("deeper/checkout/b");
    let keyframes = identities(&first.load(), &first.0);
    assert_eq!(keyframes, identities(&second.load(), &second.0));
    assert_eq!(keyframes.len(), 2);
    // Same text in different files of one package keeps independent owners,
    // including below a nameless nested manifest.
    assert_ne!(keyframes[0]["ownerId"], keyframes[1]["ownerId"]);
    assert_ne!(keyframes[0]["id"], keyframes[1]["id"]);
}

#[test]
fn renaming_the_package_changes_keyframe_identity() {
    let first = Checkout::new("a");
    let second = Checkout::new("a");
    second.file("package.json", r#"{"name":"other"}"#);
    let (a, b) = (first.load(), second.load());
    let (a, b) = (identities(&a, &first.0), identities(&b, &second.0));
    assert_ne!(a[0]["ownerId"], b[0]["ownerId"]);
    assert_ne!(a[0]["slotId"], b[0]["slotId"]);
}
