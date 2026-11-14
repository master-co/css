//! Content-addressed manifests that requests reference instead of carrying.
//!
//! A host compiles every local stylesheet against the same project and reference
//! manifests. Shipping, parsing and validating those ~0.7 MB documents per
//! request dominated each compilation, so a host registers a manifest once and
//! then passes `{"$ref": key}` in its place; graph compilations return their
//! manifests the same way. The key is derived from the manifest text, and an
//! entry never changes: a different manifest is a different key. Eviction only
//! makes a later reference unknown, which the host answers by resending the
//! manifest itself.

use std::collections::VecDeque;
use std::hash::{BuildHasher, BuildHasherDefault, DefaultHasher};
use std::sync::{Arc, Mutex, PoisonError};

use mastercss_schema::MasterCssManifest;
use serde_json::Value;

use crate::CompilerError;

/// Project, reference and stylesheet-local manifests that a host alternates
/// between. Each entry holds the manifest text and its parsed form.
const MAX_ENTRIES: usize = 32;

/// The message prefix of a reference to a manifest this process does not hold.
pub const UNKNOWN_MANIFEST_REFERENCE: &str = "Unknown Master CSS manifest reference";

pub(crate) struct StoredManifest {
    pub(crate) key: Box<str>,
    hash: u64,
    text: Arc<str>,
    pub(crate) manifest: MasterCssManifest,
}

/// Least recently used entries first.
static MANIFESTS: Mutex<VecDeque<Arc<StoredManifest>>> = Mutex::new(VecDeque::new());

fn text_hash(text: &str) -> u64 {
    BuildHasherDefault::<DefaultHasher>::default().hash_one(text)
}

fn manifest_error(message: impl Into<String>) -> CompilerError {
    CompilerError::Directive {
        message: message.into(),
        filename: "<manifest>".into(),
        range: None,
    }
}

/// Moves a found entry to the most recently used end.
fn take(
    entries: &mut VecDeque<Arc<StoredManifest>>,
    found: impl Fn(&StoredManifest) -> bool,
) -> Option<Arc<StoredManifest>> {
    let index = entries.iter().position(|entry| found(entry))?;
    let entry = entries.remove(index).expect("found entry");
    entries.push_back(entry.clone());
    Some(entry)
}

/// Stores `text`, parsed as `manifest`, unless an identical text is stored.
fn insert(text: Arc<str>, manifest: MasterCssManifest) -> Arc<StoredManifest> {
    let hash = text_hash(&text);
    let mut entries = MANIFESTS.lock().unwrap_or_else(PoisonError::into_inner);
    if let Some(entry) = take(&mut entries, |entry| {
        entry.hash == hash && entry.text == text
    }) {
        return entry;
    }
    // The hash and length name the text; a colliding different text gets a suffix.
    let base = format!("{hash:016x}{:x}", text.len());
    let mut key = base.clone();
    let mut suffix = 0;
    while entries.iter().any(|entry| *entry.key == *key) {
        suffix += 1;
        key = format!("{base}-{suffix}");
    }
    while entries.len() >= MAX_ENTRIES {
        entries.pop_front();
    }
    let entry = Arc::new(StoredManifest {
        key: key.into(),
        hash,
        text,
        manifest,
    });
    entries.push_back(entry.clone());
    entry
}

/// Validates and stores a manifest's JSON text, returning its reference key.
/// Registering an identical text again returns the same key.
pub fn register_manifest_json(manifest_json: &str) -> Result<String, CompilerError> {
    let hash = text_hash(manifest_json);
    {
        let mut entries = MANIFESTS.lock().unwrap_or_else(PoisonError::into_inner);
        if let Some(entry) = take(&mut entries, |entry| {
            entry.hash == hash && &*entry.text == manifest_json
        }) {
            return Ok(entry.key.to_string());
        }
    }
    let value = serde_json::from_str::<Value>(manifest_json)
        .map_err(|error| manifest_error(error.to_string()))?;
    let manifest = crate::manifest::parse_manifest_owned(value)?;
    Ok(insert(manifest_json.into(), manifest).key.to_string())
}

/// The JSON text of a stored manifest, as registered or as a compilation produced it.
pub fn manifest_json(key: &str) -> Option<String> {
    let mut entries = MANIFESTS.lock().unwrap_or_else(PoisonError::into_inner);
    take(&mut entries, |entry| *entry.key == *key).map(|entry| entry.text.to_string())
}

/// Stores a manifest a compilation produced, reusing an equal `candidate`, such
/// as the manifest it was compiled against, so its reference stays stable.
pub(crate) fn store_manifest(
    manifest: &MasterCssManifest,
    candidates: &[&Arc<StoredManifest>],
) -> Arc<StoredManifest> {
    if let Some(candidate) = candidates
        .iter()
        .find(|candidate| candidate.manifest == *manifest)
    {
        let mut entries = MANIFESTS.lock().unwrap_or_else(PoisonError::into_inner);
        // Refresh its recency, or restore it if it was evicted meanwhile.
        if take(&mut entries, |entry| std::ptr::eq(entry, &***candidate)).is_none() {
            while entries.len() >= MAX_ENTRIES {
                entries.pop_front();
            }
            entries.push_back((*candidate).clone());
        }
        return (*candidate).clone();
    }
    let text: Arc<str> = manifest.to_value().to_string().into();
    insert(text, manifest.clone())
}

/// The `{"$ref": key}` value that stands for a stored manifest.
pub(crate) fn reference_value(entry: &StoredManifest) -> Value {
    serde_json::json!({ "$ref": &*entry.key })
}

/// A request manifest: carried inline, or a reference to a stored one.
pub(crate) enum RequestManifest<'a> {
    Inline(&'a Value),
    Stored(Arc<StoredManifest>),
}

pub(crate) fn request_manifest(value: &Value) -> Result<RequestManifest<'_>, CompilerError> {
    let Some(object) = value.as_object() else {
        return Ok(RequestManifest::Inline(value));
    };
    let Some(reference) = object.get("$ref") else {
        return Ok(RequestManifest::Inline(value));
    };
    let key = reference
        .as_str()
        .filter(|_| object.len() == 1)
        .ok_or_else(|| manifest_error("A manifest reference is {\"$ref\": key}"))?;
    let mut entries = MANIFESTS.lock().unwrap_or_else(PoisonError::into_inner);
    take(&mut entries, |entry| *entry.key == *key)
        .map(RequestManifest::Stored)
        .ok_or_else(|| manifest_error(format!("{UNKNOWN_MANIFEST_REFERENCE} {key}")))
}

#[cfg(test)]
mod tests {
    use super::{UNKNOWN_MANIFEST_REFERENCE, manifest_json, register_manifest_json};
    use serde_json::{Value, json};

    const PRESET: &str = include_str!("../../../packages/preset/src/default-manifest.json");

    fn compile(entry_css: &str, base: Value, resolution: Option<Value>, refs: bool) -> Value {
        let request = json!({
            "graph": { "entry": "/entry.css", "files": { "/entry.css": entry_css }, "edges": [] },
            "urls": { "/entry.css": "file:///entry.css" },
            "options": { "preserveNativeCSS": true },
            "baseManifest": base,
            "resolutionManifest": resolution,
            "manifestRefs": refs
        });
        let request = serde_json::from_value(request).unwrap();
        serde_json::to_value(crate::compile_css_stylesheet_graph_input(&request).unwrap()).unwrap()
    }

    fn reference(key: &str) -> Value {
        json!({ "$ref": key })
    }

    /// The stored manifest a `{"$ref": key}` value names.
    fn stored(value: &Value) -> (String, Value) {
        let key = value["$ref"]
            .as_str()
            .expect("a manifest reference")
            .to_owned();
        let manifest = serde_json::from_str(&manifest_json(&key).expect("stored")).unwrap();
        (key, manifest)
    }

    #[test]
    fn referenced_manifests_compile_like_inline_ones() {
        let preset: Value = serde_json::from_str(PRESET).unwrap();
        let key = register_manifest_json(PRESET).unwrap();
        assert_eq!(register_manifest_json(PRESET).unwrap(), key);
        for (css, resolution) in [
            (".store-a { color: red }", false),
            (
                "@mixin --store-m { color: red }\n.store-d { @apply --store-m }",
                true,
            ),
            (
                "@utility store-b { color: blue }\n.store-b { color: red }",
                false,
            ),
            (
                "@theme { --color-store: #123 }\n.store-c { color: var(--color-store) }",
                true,
            ),
        ] {
            let inline = compile(
                css,
                preset.clone(),
                resolution.then(|| preset.clone()),
                false,
            );
            let referenced = compile(
                css,
                reference(&key),
                resolution.then(|| reference(&key)),
                true,
            );
            for field in ["entry", "stylesheets", "directives"] {
                assert_eq!(referenced[field], inline[field], "{css}: {field}");
            }
            for field in ["manifest", "resolutionManifest"] {
                let (stored_key, manifest) = stored(&referenced[field]);
                assert_eq!(manifest, inline[field], "{css}: {field}");
                // An unchanged manifest keeps the reference it was compiled against.
                assert_eq!(stored_key == key, manifest == preset, "{css}: {field}");
            }
        }
    }

    #[test]
    fn unknown_references_fail_with_a_recognizable_error() {
        let request = json!({
            "graph": { "entry": "/entry.css", "files": { "/entry.css": ".a{}" }, "edges": [] },
            "urls": { "/entry.css": "file:///entry.css" },
            "baseManifest": reference("missing")
        });
        let request = serde_json::from_value(request).unwrap();
        let error = crate::compile_css_stylesheet_graph_input(&request).unwrap_err();
        assert_eq!(
            error.to_string(),
            format!("{UNKNOWN_MANIFEST_REFERENCE} missing")
        );
        assert!(manifest_json("missing").is_none());
        assert!(register_manifest_json("{\"version\":6,\"unknown\":1}").is_err());
    }
}
