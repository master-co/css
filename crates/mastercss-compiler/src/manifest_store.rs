//! Manifests that requests reference instead of carrying.
//!
//! A host compiles every local stylesheet against the same project and reference
//! manifests. Shipping, parsing and validating those ~0.7 MB documents per
//! request dominated each compilation, so a host registers a manifest once and
//! then passes `{"$ref": key}` in its place; graph compilations return their
//! manifests the same way. An entry never changes. A registered manifest's key
//! derives from its text; a compiled manifest gets a fresh key and is serialized
//! only when a host reads it, since most are only executed.
//!
//! Hosts keep entries alive by holding them ([`stored_manifest`]); the store
//! itself retains the recently used ones. A reference to an entry nobody holds
//! may fail with [`UNKNOWN_MANIFEST_REFERENCE`], which the host answers by
//! resending the manifest itself.

use std::collections::{HashMap, VecDeque};
use std::hash::{BuildHasher, BuildHasherDefault, DefaultHasher};
use std::sync::{Arc, LazyLock, Mutex, OnceLock, PoisonError, Weak};

use mastercss_engine::ManifestProgram;
use mastercss_schema::MasterCssManifest;
use serde_json::Value;

use crate::CompilerError;

/// Recently used registered manifests the store retains without a holder: the
/// project manifest and the manifests hosts pass back.
const MAX_RECENT: usize = 32;

/// Compiled manifests the store retains until a host holds them. A host takes
/// both manifests of a compilation right after it returns.
const MAX_RECENT_COMPILED: usize = 16;

/// The message prefix of a reference to a manifest this process does not hold.
pub const UNKNOWN_MANIFEST_REFERENCE: &str = "Unknown Master CSS manifest reference";

/// A stored manifest, its JSON and the program sessions execute for it.
pub struct StoredManifest {
    key: Box<str>,
    /// The hash of a registered text; compiled manifests are not looked up by text.
    text_hash: Option<u64>,
    text: OnceLock<Arc<str>>,
    pub(crate) manifest: MasterCssManifest,
    program: OnceLock<ManifestProgram>,
}

impl StoredManifest {
    pub fn key(&self) -> &str {
        &self.key
    }

    /// The manifest JSON: the registered text, or the compiled manifest serialized
    /// on first use.
    pub fn json(&self) -> Arc<str> {
        self.text
            .get_or_init(|| self.manifest.to_value().to_string().into())
            .clone()
    }

    /// The compiled program, compiled on first use unless a compilation supplied it.
    pub fn program(&self) -> Result<ManifestProgram, mastercss_engine::EngineError> {
        if let Some(program) = self.program.get() {
            return Ok(program.clone());
        }
        let program = ManifestProgram::compile(&self.manifest)?;
        Ok(self.program.get_or_init(|| program).clone())
    }

    /// Supplies the program a compilation already built for this exact manifest.
    pub(crate) fn supply_program(&self, program: impl FnOnce() -> ManifestProgram) {
        if self.program.get().is_none() {
            let _ = self.program.set(program());
        }
    }
}

impl std::fmt::Debug for StoredManifest {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter
            .debug_struct("StoredManifest")
            .field("key", &self.key)
            .finish_non_exhaustive()
    }
}

#[derive(Default)]
struct Store {
    index: HashMap<Box<str>, Weak<StoredManifest>>,
    /// Least recently used first.
    recent: VecDeque<Arc<StoredManifest>>,
    /// Most recently compiled last.
    recent_compiled: VecDeque<Arc<StoredManifest>>,
    next_key: u64,
}

impl Store {
    fn touch(&mut self, entry: &Arc<StoredManifest>) {
        let (recent, max) = if entry.text_hash.is_some() {
            (&mut self.recent, MAX_RECENT)
        } else {
            (&mut self.recent_compiled, MAX_RECENT_COMPILED)
        };
        if let Some(index) = recent.iter().position(|recent| Arc::ptr_eq(recent, entry)) {
            recent.remove(index);
        }
        recent.push_back(entry.clone());
        while recent.len() > max {
            recent.pop_front();
        }
    }

    fn get(&mut self, key: &str) -> Option<Arc<StoredManifest>> {
        let entry = self.index.get(key)?.upgrade()?;
        self.touch(&entry);
        Some(entry)
    }

    fn insert(&mut self, entry: StoredManifest) -> Arc<StoredManifest> {
        if self.index.len() >= 4 * (MAX_RECENT + MAX_RECENT_COMPILED) {
            self.index.retain(|_, entry| entry.strong_count() > 0);
        }
        let entry = Arc::new(entry);
        self.index.insert(entry.key.clone(), Arc::downgrade(&entry));
        self.touch(&entry);
        entry
    }

    fn registered(&mut self, hash: u64, text: &str) -> Option<Arc<StoredManifest>> {
        let entry = self
            .index
            .values()
            .filter_map(Weak::upgrade)
            .find(|entry| {
                entry.text_hash == Some(hash)
                    && entry.text.get().is_some_and(|stored| **stored == *text)
            })?;
        self.touch(&entry);
        Some(entry)
    }
}

static STORE: LazyLock<Mutex<Store>> = LazyLock::new(Default::default);

fn store() -> std::sync::MutexGuard<'static, Store> {
    STORE.lock().unwrap_or_else(PoisonError::into_inner)
}

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

/// Validates and stores a manifest's JSON text. Registering an identical text
/// again returns the same entry while it is alive.
pub fn register_manifest(manifest_json: &str) -> Result<Arc<StoredManifest>, CompilerError> {
    let hash = text_hash(manifest_json);
    if let Some(entry) = store().registered(hash, manifest_json) {
        return Ok(entry);
    }
    let value = serde_json::from_str::<Value>(manifest_json)
        .map_err(|error| manifest_error(error.to_string()))?;
    let manifest = crate::manifest::parse_manifest_owned(value)?;
    let mut store = store();
    if let Some(entry) = store.registered(hash, manifest_json) {
        return Ok(entry);
    }
    // The hash and length name the text; a colliding different text gets a suffix.
    let base = format!("{hash:016x}{:x}", manifest_json.len());
    let mut key = base.clone();
    let mut suffix = 0;
    while store
        .index
        .get(key.as_str())
        .is_some_and(|entry| entry.strong_count() > 0)
    {
        suffix += 1;
        key = format!("{base}-{suffix}");
    }
    let text = OnceLock::new();
    let _ = text.set(Arc::from(manifest_json));
    Ok(store.insert(StoredManifest {
        key: key.into(),
        text_hash: Some(hash),
        text,
        manifest,
        program: OnceLock::new(),
    }))
}

/// [`register_manifest`], returning the reference key.
pub fn register_manifest_json(manifest_json: &str) -> Result<String, CompilerError> {
    Ok(register_manifest(manifest_json)?.key().to_owned())
}

/// The stored manifest a key names, while anything holds it.
pub fn stored_manifest(key: &str) -> Option<Arc<StoredManifest>> {
    store().get(key)
}

/// The JSON of a stored manifest, as registered or as a compilation produced it.
pub fn manifest_json(key: &str) -> Option<String> {
    stored_manifest(key).map(|entry| entry.json().to_string())
}

/// Stores a manifest a compilation produced, reusing an equal `candidate`, such
/// as the manifest it was compiled against, so its reference stays stable.
/// `program`, when given, is the compiled form of exactly this manifest.
pub(crate) fn store_manifest(
    manifest: &MasterCssManifest,
    candidates: &[&Arc<StoredManifest>],
    program: Option<&dyn Fn() -> ManifestProgram>,
) -> Arc<StoredManifest> {
    let entry = match candidates
        .iter()
        .find(|candidate| candidate.manifest == *manifest)
    {
        Some(candidate) => {
            let mut store = store();
            // Refresh its recency, or restore it if it was dropped meanwhile.
            if !store.index.contains_key(candidate.key()) {
                store
                    .index
                    .insert(candidate.key.clone(), Arc::downgrade(candidate));
            }
            store.touch(candidate);
            (*candidate).clone()
        }
        None => {
            let mut store = store();
            let key = format!("p{:x}", store.next_key);
            store.next_key += 1;
            store.insert(StoredManifest {
                key: key.into(),
                text_hash: None,
                text: OnceLock::new(),
                manifest: manifest.clone(),
                program: OnceLock::new(),
            })
        }
    };
    if let Some(program) = program {
        entry.supply_program(program);
    }
    entry
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
    stored_manifest(key)
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
