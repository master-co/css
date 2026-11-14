//! Process-wide reuse of lowered manifests between graph compilations.
//!
//! Most local stylesheets declare no definitions of their own, so each one lowers
//! the same empty manifest input onto the same stored project and reference
//! manifests. Lowering validates and merges both manifests and compiles an engine
//! for the resolution manifest, which cost far more than compiling the
//! stylesheet. The inputs fully determine the result, so an identical lowering
//! shares it. Entries are immutable; eviction only costs a recomputation.

use std::collections::VecDeque;
use std::hash::{BuildHasher, BuildHasherDefault, DefaultHasher};
use std::sync::{Arc, Mutex, OnceLock, PoisonError};

use mastercss_engine::EngineSession;
use mastercss_schema::{CssDirectiveManifestInput, MasterCssManifest};

use super::api::{LoweredManifests, lower_parsed_manifests};
use super::resolution::engine_for_manifest;
use crate::CompilerError;
use crate::manifest_store::{StoredManifest, store_manifest};

/// Distinct lowerings a host alternates between; stylesheets with definitions of
/// their own each have one, and repeat only when compiled again.
const MAX_ENTRIES: usize = 16;

/// Manifests lowered onto stored manifests, with the engine of the resolution
/// manifest and, once a caller needs them, their stored forms.
pub(crate) struct LoweredContext {
    pub(crate) lowered: LoweredManifests,
    pub(crate) engine: EngineSession,
    base: Option<Arc<StoredManifest>>,
    resolution: Option<Arc<StoredManifest>>,
    manifest_entry: OnceLock<Arc<StoredManifest>>,
    resolution_entry: OnceLock<Arc<StoredManifest>>,
}

impl LoweredContext {
    fn candidates(&self) -> Vec<&Arc<StoredManifest>> {
        self.base.iter().chain(self.resolution.iter()).collect()
    }

    /// The delivered manifest, stored; an unchanged input keeps its reference.
    pub(crate) fn stored_manifest(&self) -> Arc<StoredManifest> {
        self.manifest_entry
            .get_or_init(|| store_manifest(&self.lowered.manifest, &self.candidates()))
            .clone()
    }

    /// The resolution manifest, stored; an unchanged input keeps its reference.
    pub(crate) fn stored_resolution_manifest(&self) -> Arc<StoredManifest> {
        self.resolution_entry
            .get_or_init(|| store_manifest(&self.lowered.resolution_manifest, &self.candidates()))
            .clone()
    }

    /// Stores a manifest derived from this lowering, such as one extended with
    /// native animation variables.
    pub(crate) fn store_derived(&self, manifest: &MasterCssManifest) -> Arc<StoredManifest> {
        store_manifest(manifest, &self.candidates())
    }
}

struct Entry {
    hash: u64,
    key: Box<str>,
    context: Arc<LoweredContext>,
}

/// Least recently used entries first.
static LOWERINGS: Mutex<VecDeque<Entry>> = Mutex::new(VecDeque::new());

/// Lowers `input` onto stored manifests, reusing an identical earlier lowering.
pub(crate) fn lower_stored_manifests(
    input: &CssDirectiveManifestInput,
    initial_warnings: &[String],
    base: Option<&Arc<StoredManifest>>,
    resolution: Option<&Arc<StoredManifest>>,
) -> Result<Arc<LoweredContext>, CompilerError> {
    let key = serde_json::json!([
        base.map(|entry| &*entry.key),
        resolution.map(|entry| &*entry.key),
        initial_warnings,
        input,
    ])
    .to_string();
    let hash = BuildHasherDefault::<DefaultHasher>::default().hash_one(&key);
    {
        let mut entries = LOWERINGS.lock().unwrap_or_else(PoisonError::into_inner);
        if let Some(index) = entries
            .iter()
            .position(|entry| entry.hash == hash && *entry.key == *key)
        {
            let entry = entries.remove(index).expect("found entry");
            let context = entry.context.clone();
            entries.push_back(entry);
            return Ok(context);
        }
    }
    let lowered = lower_parsed_manifests(
        input,
        initial_warnings,
        base.map(|entry| &entry.manifest),
        resolution.map(|entry| entry.manifest.clone()),
    )?;
    let engine = engine_for_manifest(&lowered.resolution_manifest)?;
    let context = Arc::new(LoweredContext {
        lowered,
        engine,
        base: base.cloned(),
        resolution: resolution.cloned(),
        manifest_entry: OnceLock::new(),
        resolution_entry: OnceLock::new(),
    });
    let mut entries = LOWERINGS.lock().unwrap_or_else(PoisonError::into_inner);
    entries.retain(|entry| entry.hash != hash || *entry.key != *key);
    while entries.len() >= MAX_ENTRIES {
        entries.pop_front();
    }
    entries.push_back(Entry {
        hash,
        key: key.into(),
        context: context.clone(),
    });
    Ok(context)
}
