#![forbid(unsafe_code)]

use mastercss_engine::{EngineError, EngineSession};
use mastercss_schema::{
    CssDirectiveBlocklistEntry, EngineSnapshotIr, EngineTransitionIr,
    filter_css_extraction_candidates,
};
use mastercss_source::{SourceExtractionInputIr, SourceExtractorKind};
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet, HashSet};

#[derive(Debug)]
pub enum ScannerError {
    Engine(EngineError),
    Source(mastercss_schema::Diagnostic),
}
impl From<EngineError> for ScannerError {
    fn from(error: EngineError) -> Self {
        Self::Engine(error)
    }
}
impl std::fmt::Display for ScannerError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Engine(error) => error.fmt(formatter),
            Self::Source(error) => error.message.fmt(formatter),
        }
    }
}
impl std::error::Error for ScannerError {}
impl ScannerError {
    pub fn diagnostic(&self) -> mastercss_schema::Diagnostic {
        match self {
            Self::Engine(error) => error.diagnostic(),
            Self::Source(error) => error.clone(),
        }
    }
}

fn project_owner() -> String {
    "project".into()
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ScannerSourceOptions {
    #[serde(default = "project_owner")]
    pub owner: String,
    #[serde(default)]
    pub kind: SourceExtractorKind,
    #[serde(default)]
    pub parent_source: Option<String>,
    /// Host extractor identity/version; part of extraction cache identity.
    #[serde(default)]
    pub extractor: String,
}
impl Default for ScannerSourceOptions {
    fn default() -> Self {
        Self {
            owner: project_owner(),
            kind: SourceExtractorKind::Auto,
            parent_source: None,
            extractor: String::new(),
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScannerSourceInput {
    pub source: String,
    pub content: String,
    #[serde(default)]
    pub options: ScannerSourceOptions,
    #[serde(default)]
    pub candidates: Option<Vec<String>>,
    #[serde(default)]
    pub blocklist: Vec<CssDirectiveBlocklistEntry>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScannerUpdateIr {
    pub changed: bool,
    pub source_changed: bool,
    pub cache_hit: bool,
    pub candidates: Vec<String>,
    pub valid_classes: Vec<String>,
    pub invalid_classes: Vec<String>,
    pub used_native_classes: Vec<String>,
    pub transition: EngineTransitionIr,
}
impl ScannerUpdateIr {
    fn unchanged(cache_hit: bool) -> Self {
        Self {
            changed: false,
            source_changed: false,
            cache_hit,
            candidates: Vec::new(),
            valid_classes: Vec::new(),
            invalid_classes: Vec::new(),
            used_native_classes: Vec::new(),
            transition: EngineTransitionIr::empty(),
        }
    }
    fn append(&mut self, update: Self) {
        self.changed |= update.changed;
        self.source_changed |= update.source_changed;
        self.candidates.extend(update.candidates);
        self.valid_classes.extend(update.valid_classes);
        self.invalid_classes.extend(update.invalid_classes);
        self.used_native_classes.extend(update.used_native_classes);
        self.transition
            .mutations
            .extend(update.transition.mutations);
    }
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScannerStateIr {
    pub latent_classes: Vec<String>,
    pub valid_classes: Vec<String>,
    pub invalid_classes: Vec<String>,
    pub native_classes: Vec<String>,
    pub used_native_classes: Vec<String>,
    pub cached_sources: usize,
    pub sources: Vec<ScannerSourceStateIr>,
    pub engine: EngineSnapshotIr,
}
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScannerSourceStateIr {
    pub source: String,
    pub owner: String,
    pub parent_source: Option<String>,
    pub kind: SourceExtractorKind,
    pub extractor: String,
    pub candidates: Vec<String>,
}
#[derive(Debug)]
struct CachedSource {
    extracted: bool,
    content: String,
    policy: String,
    candidates: Vec<String>,
    active: BTreeSet<String>,
    parent: Option<String>,
    kind: SourceExtractorKind,
    extractor: String,
}

#[derive(Debug)]
pub struct ScannerSession {
    manifest_json: String,
    engine: EngineSession,
    sources: BTreeMap<(String, String), CachedSource>,
    references: BTreeMap<String, usize>,
    valid: BTreeSet<String>,
    invalid: BTreeSet<String>,
    native_owners: BTreeMap<String, BTreeSet<String>>,
}
impl ScannerSession {
    pub fn create(manifest_json: &str) -> Result<Self, ScannerError> {
        Ok(Self {
            manifest_json: manifest_json.into(),
            engine: EngineSession::create(manifest_json)?,
            sources: BTreeMap::new(),
            references: BTreeMap::new(),
            valid: BTreeSet::new(),
            invalid: BTreeSet::new(),
            native_owners: BTreeMap::new(),
        })
    }
    pub fn scan(&mut self, source: &str, content: &str) -> Result<ScannerUpdateIr, ScannerError> {
        self.scan_source(source, content, &ScannerSourceOptions::default(), &[])
    }
    pub fn scan_source(
        &mut self,
        source: &str,
        content: &str,
        options: &ScannerSourceOptions,
        blocklist: &[CssDirectiveBlocklistEntry],
    ) -> Result<ScannerUpdateIr, ScannerError> {
        let candidates = self
            .cached_extraction(source, content, options)
            .map(Ok)
            .unwrap_or_else(|| extract(source, content, options))?;
        let update = self.scan_candidates(source, content, candidates, blocklist, options)?;
        self.sources
            .get_mut(&(options.owner.clone(), source.into()))
            .unwrap()
            .extracted = true;
        Ok(update)
    }
    fn cached_extraction(
        &self,
        source: &str,
        content: &str,
        options: &ScannerSourceOptions,
    ) -> Option<Vec<String>> {
        self.sources
            .get(&(options.owner.clone(), source.into()))
            .filter(|old| {
                old.extracted
                    && old.content == content
                    && old.kind == options.kind
                    && old.extractor == options.extractor
            })
            .map(|old| old.candidates.clone())
    }
    pub fn scan_candidates(
        &mut self,
        source: &str,
        content: &str,
        candidates: Vec<String>,
        blocklist: &[CssDirectiveBlocklistEntry],
        options: &ScannerSourceOptions,
    ) -> Result<ScannerUpdateIr, ScannerError> {
        self.engine.ensure_class_rules(Vec::<String>::new())?;
        let key = (options.owner.clone(), source.into());
        let policy = format!(
            "{:?}\0{}\0{}",
            options.kind,
            options.extractor,
            serde_json::to_string(blocklist).expect("blocklist serializes")
        );
        if self.sources.get(&key).is_some_and(|old| {
            old.content == content
                && old.policy == policy
                && old.candidates == candidates
                && old.parent == options.parent_source
        }) {
            let mut update = ScannerUpdateIr::unchanged(true);
            update.candidates = candidates;
            return Ok(update);
        }
        let active = filter_blocklisted_candidates(&candidates, blocklist)
            .into_iter()
            .collect::<BTreeSet<_>>();
        let previous = self
            .sources
            .get(&key)
            .map(|s| s.active.clone())
            .unwrap_or_default();
        let mut update = self.replace_contribution(&previous, &active)?;
        update.source_changed = true;
        update.candidates = candidates.clone();
        self.sources.insert(
            key,
            CachedSource {
                extracted: false,
                content: content.into(),
                policy,
                candidates,
                active,
                parent: options.parent_source.clone(),
                kind: options.kind,
                extractor: options.extractor.clone(),
            },
        );
        Ok(update)
    }
    fn replace_contribution(
        &mut self,
        previous: &BTreeSet<String>,
        active: &BTreeSet<String>,
    ) -> Result<ScannerUpdateIr, ScannerError> {
        let before_native = self.used_native();
        let mut update = ScannerUpdateIr::unchanged(false);
        let mut removed = Vec::new();
        for class in previous.difference(active) {
            let count = self
                .references
                .get_mut(class)
                .expect("source reference exists");
            *count -= 1;
            if *count == 0 {
                self.references.remove(class);
                self.valid.remove(class);
                self.invalid.remove(class);
                removed.push(class.clone());
            }
        }
        update
            .transition
            .mutations
            .extend(self.engine.delete_class_rules(&removed)?.mutations);
        let mut added = Vec::new();
        for class in active.difference(previous) {
            let count = self.references.entry(class.clone()).or_default();
            *count += 1;
            if *count != 1 {
                continue;
            }
            added.push(class);
        }
        update
            .transition
            .mutations
            .extend(self.engine.ensure_class_rules(&added)?.mutations);
        for class in added {
            let valid =
                self.engine.inspect(class)?.match_status == mastercss_schema::MatchStatus::Matched;
            if valid {
                self.valid.insert(class.clone());
                update.valid_classes.push(class.clone());
            } else {
                self.invalid.insert(class.clone());
                update.invalid_classes.push(class.clone());
            }
        }
        let used_native = self.used_native();
        update.changed = !update.transition.mutations.is_empty() || used_native != before_native;
        update.used_native_classes = used_native.difference(&before_native).cloned().collect();
        Ok(update)
    }
    pub fn remove_source(
        &mut self,
        source: &str,
        options: &ScannerSourceOptions,
    ) -> Result<ScannerUpdateIr, ScannerError> {
        self.engine.ensure_class_rules(Vec::<String>::new())?;
        let mut pending = vec![source.to_owned()];
        let mut update = ScannerUpdateIr::unchanged(false);
        let mut visited = BTreeSet::new();
        while let Some(source) = pending.pop() {
            if !visited.insert(source.clone()) {
                continue;
            }
            pending.extend(
                self.sources
                    .iter()
                    .filter(|((owner, _), value)| {
                        *owner == options.owner && value.parent.as_deref() == Some(&source)
                    })
                    .map(|((_, source), _)| source.clone()),
            );
            if let Some(old) = self.sources.remove(&(options.owner.clone(), source)) {
                update.append(self.replace_contribution(&old.active, &BTreeSet::new())?);
                update.source_changed = true;
            }
        }
        Ok(update)
    }
    pub fn reconcile_sources(
        &mut self,
        owner: &str,
        mut inputs: Vec<ScannerSourceInput>,
    ) -> Result<ScannerUpdateIr, ScannerError> {
        // Resolve the entire proposed snapshot before changing any contribution.
        let mut seen = BTreeSet::new();
        let mut extracted = BTreeSet::new();
        for input in &mut inputs {
            if !seen.insert(input.source.clone()) {
                return Err(EngineError::InvalidManifest(format!(
                    "Duplicate source in owner snapshot: {}",
                    input.source
                ))
                .into());
            }
            input.options.owner = owner.into();
            if input.candidates.is_none() {
                input.candidates = Some(
                    self.cached_extraction(&input.source, &input.content, &input.options)
                        .map(Ok)
                        .unwrap_or_else(|| {
                            extract(&input.source, &input.content, &input.options)
                        })?,
                );
                extracted.insert(input.source.clone());
            }
        }
        let mut update = ScannerUpdateIr::unchanged(false);
        // Add replacements first to retain resources shared by renamed sources.
        for input in inputs {
            update.append(self.scan_candidates(
                &input.source,
                &input.content,
                input.candidates.unwrap_or_default(),
                &input.blocklist,
                &input.options,
            )?);
            if extracted.contains(&input.source) {
                self.sources
                    .get_mut(&(owner.into(), input.source))
                    .unwrap()
                    .extracted = true;
            }
        }
        let removed = self
            .sources
            .keys()
            .filter(|(source_owner, source)| source_owner == owner && !seen.contains(source))
            .map(|(_, source)| source.clone())
            .collect::<Vec<_>>();
        for source in removed {
            // A snapshot declares exact membership. An explicitly retained child
            // may refer to a parent managed outside this scanner; don't recursively
            // remove that child as an incidental effect of replacing the snapshot.
            if let Some(old) = self.sources.remove(&(owner.into(), source)) {
                update.append(self.replace_contribution(&old.active, &BTreeSet::new())?);
                update.source_changed = true;
            }
        }
        Ok(update)
    }
    pub fn remove_owner(&mut self, owner: &str) -> Result<ScannerUpdateIr, ScannerError> {
        let mut update = self.reconcile_sources(owner, Vec::new())?;
        if self.native_owners.remove(owner).is_some() {
            update.changed = true;
            update.source_changed = true;
        }
        Ok(update)
    }
    pub fn collect_candidates<I, S>(&self, candidates: I) -> Vec<String>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        let mut seen = HashSet::new();
        candidates
            .into_iter()
            .map(|s| s.as_ref().to_owned())
            .filter(|s| seen.insert(s.clone()))
            .collect()
    }
    pub fn ensure_classes<I, S>(&mut self, classes: I) -> Result<EngineTransitionIr, ScannerError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        let classes = self.collect_candidates(classes);
        Ok(self
            .scan_candidates(
                "safelist",
                &classes.join(" "),
                classes.clone(),
                &[],
                &ScannerSourceOptions {
                    owner: "safelist".into(),
                    ..Default::default()
                },
            )?
            .transition)
    }
    pub fn register_native_classes<I, S>(&mut self, owner: &str, names: I) -> bool
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        let names = names
            .into_iter()
            .map(|s| s.as_ref().to_owned())
            .collect::<BTreeSet<_>>();
        if self.native_owners.get(owner) == Some(&names) {
            return false;
        }
        self.native_owners.insert(owner.into(), names);
        true
    }
    fn native(&self) -> BTreeSet<String> {
        self.native_owners
            .values()
            .flat_map(|names| names.iter().cloned())
            .collect()
    }
    fn used_native(&self) -> BTreeSet<String> {
        self.native()
            .into_iter()
            .filter(|name| self.references.contains_key(name))
            .collect()
    }
    pub fn state(&self) -> Result<ScannerStateIr, ScannerError> {
        Ok(ScannerStateIr {
            latent_classes: self
                .sources
                .values()
                .flat_map(|s| s.candidates.iter().cloned())
                .collect::<BTreeSet<_>>()
                .into_iter()
                .collect(),
            valid_classes: self.valid.iter().cloned().collect(),
            invalid_classes: self.invalid.iter().cloned().collect(),
            native_classes: self.native().into_iter().collect(),
            used_native_classes: self.used_native().into_iter().collect(),
            cached_sources: self.sources.len(),
            sources: self
                .sources
                .iter()
                .map(|((owner, source), value)| ScannerSourceStateIr {
                    source: source.clone(),
                    owner: owner.clone(),
                    parent_source: value.parent.clone(),
                    kind: value.kind,
                    extractor: value.extractor.clone(),
                    candidates: value.candidates.clone(),
                })
                .collect(),
            engine: self.engine.snapshot()?,
        })
    }
    pub fn reset(&mut self) -> Result<(), ScannerError> {
        *self = Self::create(&self.manifest_json)?;
        Ok(())
    }
    pub fn dispose(&mut self) {
        self.engine.dispose();
        self.sources.clear();
        self.references.clear();
        self.valid.clear();
        self.invalid.clear();
        self.native_owners.clear();
    }
}

pub fn extract(
    source: &str,
    content: &str,
    options: &ScannerSourceOptions,
) -> Result<Vec<String>, ScannerError> {
    let result = mastercss_source::extract_source_result(&SourceExtractionInputIr {
        source: source.into(),
        content: content.into(),
        kind: options.kind,
        owner: Some(options.owner.clone()),
    });
    if let Some(error) = result.diagnostics.first() {
        return Err(ScannerError::Source(error.clone()));
    }
    Ok(result.candidates)
}
pub fn extract_source_candidates(source: &str, content: &str) -> Result<Vec<String>, ScannerError> {
    extract(source, content, &ScannerSourceOptions::default())
}
pub fn filter_blocklisted_candidates<I, S>(
    candidates: I,
    blocklist: &[CssDirectiveBlocklistEntry],
) -> Vec<String>
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
{
    filter_css_extraction_candidates(candidates, blocklist)
}

#[cfg(test)]
mod tests;
