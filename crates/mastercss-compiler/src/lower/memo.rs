//! Process-wide reuse of lowered manifests between graph compilations.
//!
//! Most local stylesheets declare no definitions of their own, so each one lowers
//! the same empty manifest input onto the same stored project and reference
//! manifests. Lowering validates and merges both manifests and compiles an engine
//! for the resolution manifest, which cost far more than compiling the
//! stylesheet. The inputs fully determine the result, so an identical lowering
//! shares it. Entries are immutable; eviction only costs a recomputation.

use std::borrow::Cow;
use std::collections::VecDeque;
use std::hash::{BuildHasher, BuildHasherDefault, DefaultHasher};
use std::sync::{Arc, Mutex, OnceLock, PoisonError};

use mastercss_engine::EngineSession;
use mastercss_schema::{CssDirectiveManifestInput, MasterCssManifest};

use super::api::{LoweredManifests, lower_parsed_manifests};
use super::resolution::engine_for_manifest;
use crate::CompilerError;
use crate::manifest_store::{RequestManifest, StoredManifest, request_manifest, store_manifest};

/// Distinct lowerings a host alternates between; stylesheets with definitions of
/// their own each have one, and repeat only when compiled again.
const MAX_ENTRIES: usize = 8;

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
            .get_or_init(|| store_manifest(&self.lowered.manifest, &self.candidates(), None))
            .clone()
    }

    /// The resolution manifest, stored; an unchanged input keeps its reference.
    pub(crate) fn stored_resolution_manifest(&self) -> Arc<StoredManifest> {
        self.resolution_entry
            .get_or_init(|| {
                // The engine executes exactly this manifest.
                store_manifest(
                    &self.lowered.resolution_manifest,
                    &self.candidates(),
                    Some(&|| self.engine.manifest_program()),
                )
            })
            .clone()
    }

    /// Stores what this lowering's delivered or resolution manifest became once
    /// native animation variables extended it, which changes nothing else.
    pub(crate) fn store_derived(
        &self,
        manifest: &MasterCssManifest,
        resolution: bool,
    ) -> Arc<StoredManifest> {
        let program = || {
            self.engine
                .manifest_program()
                .with_animation_variables(manifest)
        };
        store_manifest(
            manifest,
            &self.candidates(),
            resolution.then_some(&program as &dyn Fn() -> _),
        )
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
        base.map(|entry| entry.key()),
        resolution.map(|entry| entry.key()),
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

/// Manifests lowered for a compilation: shared through the memo when both
/// request manifests are stored, or lowered for this compilation alone.
pub(crate) enum Lowering {
    Stored(Arc<LoweredContext>),
    Inline(Box<(LoweredManifests, EngineSession)>),
}

impl Lowering {
    /// Lowers `input` onto request manifests, inline or `{"$ref": key}`.
    pub(crate) fn lower(
        input: &CssDirectiveManifestInput,
        warnings: &[String],
        base: Option<&serde_json::Value>,
        resolution: Option<&serde_json::Value>,
    ) -> Result<Self, CompilerError> {
        let base = base.map(request_manifest).transpose()?;
        let resolution = resolution.map(request_manifest).transpose()?;
        let stored = |manifest: &Option<RequestManifest<'_>>| match manifest {
            Some(RequestManifest::Stored(entry)) => Some(Some(entry.clone())),
            Some(RequestManifest::Inline(_)) => None,
            None => Some(None),
        };
        if let (Some(base), Some(resolution)) = (stored(&base), stored(&resolution)) {
            return Ok(Self::Stored(lower_stored_manifests(
                input,
                warnings,
                base.as_ref(),
                resolution.as_ref(),
            )?));
        }
        let parse = |manifest: Option<RequestManifest<'_>>| {
            manifest
                .map(|manifest| match manifest {
                    RequestManifest::Inline(value) => crate::manifest::parse_manifest(value),
                    RequestManifest::Stored(entry) => Ok(entry.manifest.clone()),
                })
                .transpose()
        };
        let base = parse(base)?;
        let resolution = parse(resolution)?;
        let lowered = lower_parsed_manifests(input, warnings, base.as_ref(), resolution)?;
        let engine = engine_for_manifest(&lowered.resolution_manifest)?;
        Ok(Self::Inline(Box::new((lowered, engine))))
    }

    pub(crate) fn lowered(&self) -> &LoweredManifests {
        match self {
            Self::Stored(context) => &context.lowered,
            Self::Inline(inline) => &inline.0,
        }
    }

    /// The engine that executes the lowered resolution manifest.
    pub(crate) fn engine(&self) -> &EngineSession {
        match self {
            Self::Stored(context) => &context.engine,
            Self::Inline(inline) => &inline.1,
        }
    }

    /// Stores the delivered (`resolution: false`) or resolution manifest a
    /// compilation produced from this lowering: the lowered one, or what native
    /// animation variables extended it to.
    #[allow(clippy::ptr_arg)] // Whether it is borrowed is what tells a lowered manifest from an extended one.
    pub(crate) fn store(
        &self,
        manifest: &Cow<'_, MasterCssManifest>,
        resolution: bool,
    ) -> Arc<StoredManifest> {
        let extended = match manifest {
            Cow::Borrowed(_) => None,
            Cow::Owned(manifest) => Some(manifest),
        };
        match (self, extended) {
            (Self::Stored(context), None) if resolution => context.stored_resolution_manifest(),
            (Self::Stored(context), None) => context.stored_manifest(),
            (Self::Stored(context), Some(manifest)) => context.store_derived(manifest, resolution),
            (Self::Inline(..), _) if !resolution => store_manifest(manifest, &[], None),
            // The engine executes the lowered resolution manifest, which native
            // animation variables alone may have extended.
            (Self::Inline(inline), _) => store_manifest(
                manifest,
                &[],
                Some(&|| {
                    inline
                        .1
                        .manifest_program()
                        .with_animation_variables(manifest)
                }),
            ),
        }
    }
}
