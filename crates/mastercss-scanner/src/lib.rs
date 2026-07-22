#![forbid(unsafe_code)]

use std::collections::{HashMap, HashSet};

use mastercss_engine::{EngineError, EngineSession};
use mastercss_schema::{
    CssDirectiveBlocklistEntry, EngineSnapshotIr, EngineTransitionIr, NativeDeclarationCandidateIr,
    ValidatorBatchIr, filter_css_extraction_candidates, is_css_class_blocklisted,
};
use serde::Serialize;

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScannerUpdateIr {
    pub changed: bool,
    pub cache_hit: bool,
    pub candidates: Vec<String>,
    pub valid_classes: Vec<String>,
    pub invalid_classes: Vec<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub used_native_classes: Vec<String>,
    pub transition: EngineTransitionIr,
}

impl ScannerUpdateIr {
    fn unchanged(cache_hit: bool) -> Self {
        Self {
            changed: false,
            cache_hit,
            candidates: Vec::new(),
            valid_classes: Vec::new(),
            invalid_classes: Vec::new(),
            used_native_classes: Vec::new(),
            transition: EngineTransitionIr::empty(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScannerStateIr {
    pub latent_classes: Vec<String>,
    pub valid_classes: Vec<String>,
    pub invalid_classes: Vec<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub native_classes: Vec<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub used_native_classes: Vec<String>,
    pub cached_sources: usize,
    pub engine: EngineSnapshotIr,
}

#[derive(Debug)]
pub struct ScannerSession {
    manifest_json: String,
    engine: EngineSession,
    latent_classes: Vec<String>,
    latent_index: HashSet<String>,
    valid_classes: Vec<String>,
    valid_index: HashSet<String>,
    invalid_classes: Vec<String>,
    invalid_index: HashSet<String>,
    native_classes: Vec<String>,
    native_index: HashSet<String>,
    used_native_classes: Vec<String>,
    used_native_index: HashSet<String>,
    source_contents: HashMap<String, String>,
}

impl ScannerSession {
    pub fn create(manifest_json: &str) -> Result<Self, EngineError> {
        Ok(Self {
            manifest_json: manifest_json.to_owned(),
            engine: EngineSession::create(manifest_json)?,
            latent_classes: Vec::new(),
            latent_index: HashSet::new(),
            valid_classes: Vec::new(),
            valid_index: HashSet::new(),
            invalid_classes: Vec::new(),
            invalid_index: HashSet::new(),
            native_classes: Vec::new(),
            native_index: HashSet::new(),
            used_native_classes: Vec::new(),
            used_native_index: HashSet::new(),
            source_contents: HashMap::new(),
        })
    }

    pub fn scan(&mut self, source: &str, content: &str) -> Result<ScannerUpdateIr, EngineError> {
        let candidates = extract_source_candidates(source, content);
        self.scan_candidates(source, content, candidates, &[], &[], &HashSet::new())
    }

    pub fn native_declaration_candidates<I, S>(
        &self,
        candidates: I,
    ) -> Result<Vec<NativeDeclarationCandidateIr>, EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        self.engine.native_declaration_candidates(candidates)
    }

    pub fn scan_candidates(
        &mut self,
        source: &str,
        content: &str,
        extracted_candidates: Vec<String>,
        blocklist: &[CssDirectiveBlocklistEntry],
        native_support: &[bool],
        invalid_generated_classes: &HashSet<String>,
    ) -> Result<ScannerUpdateIr, EngineError> {
        if content.is_empty() {
            return Ok(ScannerUpdateIr::unchanged(false));
        }
        if !source.is_empty()
            && self
                .source_contents
                .get(source)
                .is_some_and(|previous| previous == content)
        {
            return Ok(ScannerUpdateIr::unchanged(true));
        }
        if !source.is_empty() {
            self.source_contents
                .insert(source.to_owned(), content.to_owned());
        }

        let candidates = self.collect_candidates(extracted_candidates);
        if candidates.is_empty() {
            return Ok(ScannerUpdateIr::unchanged(false));
        }

        let mut valid_classes = Vec::new();
        let mut invalid_classes = Vec::new();
        let mut used_native_classes = Vec::new();
        let mut mutations = Vec::new();
        let mut native_support_offset: usize = 0;
        for candidate in &candidates {
            if is_css_class_blocklisted(candidate, blocklist) {
                continue;
            }
            if self.native_index.contains(candidate)
                && self.used_native_index.insert(candidate.clone())
            {
                self.used_native_classes.push(candidate.clone());
                used_native_classes.push(candidate.clone());
            }
            if self.valid_index.contains(candidate) || self.invalid_index.contains(candidate) {
                continue;
            }
            let native_candidate_count = self
                .engine
                .native_declaration_candidates([candidate])?
                .len();
            let native_support_end = native_support_offset
                .saturating_add(native_candidate_count)
                .min(native_support.len());
            let candidate_native_support =
                &native_support[native_support_offset..native_support_end];
            native_support_offset = native_support_end;
            if invalid_generated_classes.contains(candidate) {
                self.invalid_index.insert(candidate.clone());
                self.invalid_classes.push(candidate.clone());
                invalid_classes.push(candidate.clone());
                continue;
            }
            let transition = if candidate_native_support.is_empty() {
                self.engine.ensure_class_rules([candidate])?
            } else {
                self.engine
                    .ensure_class_rules_with_native_support([candidate], candidate_native_support)?
            };
            let valid = self.engine.inspect(candidate)?.valid;
            if valid {
                self.valid_index.insert(candidate.clone());
                self.valid_classes.push(candidate.clone());
                valid_classes.push(candidate.clone());
                mutations.extend(transition.mutations);
            } else {
                self.invalid_index.insert(candidate.clone());
                self.invalid_classes.push(candidate.clone());
                invalid_classes.push(candidate.clone());
            }
        }

        Ok(ScannerUpdateIr {
            changed: true,
            cache_hit: false,
            candidates,
            valid_classes,
            invalid_classes,
            used_native_classes,
            transition: EngineTransitionIr::new(mutations),
        })
    }

    pub fn collect_candidates<I, S>(&mut self, candidates: I) -> Vec<String>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        let mut collected = Vec::new();
        for candidate in candidates {
            let candidate = candidate.as_ref();
            if self.latent_index.insert(candidate.to_owned()) {
                self.latent_classes.push(candidate.to_owned());
                collected.push(candidate.to_owned());
            }
        }
        collected
    }

    pub fn ensure_classes<I, S>(
        &mut self,
        class_names: I,
    ) -> Result<EngineTransitionIr, EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        self.engine.ensure_class_rules(class_names)
    }

    pub fn register_native_classes<I, S>(&mut self, class_names: I) -> bool
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        let mut changed = false;
        for class_name in class_names {
            let class_name = class_name.as_ref();
            if self.native_index.insert(class_name.to_owned()) {
                self.native_classes.push(class_name.to_owned());
                changed = true;
            }
            if self.latent_index.contains(class_name)
                && self.used_native_index.insert(class_name.to_owned())
            {
                self.used_native_classes.push(class_name.to_owned());
                changed = true;
            }
        }
        changed
    }

    pub fn reset(&mut self) -> Result<(), EngineError> {
        *self = Self::create(&self.manifest_json)?;
        Ok(())
    }

    pub fn state(&self) -> Result<ScannerStateIr, EngineError> {
        Ok(ScannerStateIr {
            latent_classes: self.latent_classes.clone(),
            valid_classes: self.valid_classes.clone(),
            invalid_classes: self.invalid_classes.clone(),
            native_classes: self.native_classes.clone(),
            used_native_classes: self.used_native_classes.clone(),
            cached_sources: self.source_contents.len(),
            engine: self.engine.snapshot()?,
        })
    }

    pub fn dispose(&mut self) {
        self.engine.dispose();
        self.latent_classes.clear();
        self.latent_index.clear();
        self.valid_classes.clear();
        self.valid_index.clear();
        self.invalid_classes.clear();
        self.invalid_index.clear();
        self.native_classes.clear();
        self.native_index.clear();
        self.used_native_classes.clear();
        self.used_native_index.clear();
        self.source_contents.clear();
    }
}

pub fn extract_source_candidates(source: &str, content: &str) -> Vec<String> {
    mastercss_source::extract_source(&mastercss_source::SourceExtractionInputIr {
        source: source.into(),
        content: content.into(),
        kind: mastercss_source::SourceExtractorKind::Auto,
    })
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

pub fn invalid_generated_classes(
    batch: &ValidatorBatchIr,
    rule_support: &[Vec<bool>],
) -> Vec<String> {
    batch
        .classes
        .iter()
        .enumerate()
        .filter_map(|(class_index, class_result)| {
            if !class_result.matched {
                return None;
            }
            let support = rule_support.get(class_index);
            class_result
                .rules
                .iter()
                .enumerate()
                .any(|(rule_index, _)| {
                    !support
                        .and_then(|values| values.get(rule_index))
                        .copied()
                        .unwrap_or(false)
                })
                .then(|| class_result.class_name.clone())
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn manifest() -> String {
        serde_json::json!({
            "version": 1,
            "utilities": [
                {
                    "id": "display-block",
                    "name": "block",
                    "type": 0,
                    "emit": {
                        "type": "static",
                        "rules": [{ "declarations": { "display": "block" } }]
                    },
                    "matchers": [{ "type": "static", "name": "block" }]
                },
                {
                    "id": "color-red",
                    "name": "fg:red",
                    "type": 0,
                    "emit": {
                        "type": "static",
                        "rules": [{ "declarations": { "color": "red" } }]
                    },
                    "matchers": [{ "type": "static", "name": "fg:red" }]
                }
            ]
        })
        .to_string()
    }

    #[test]
    fn caches_sources_and_tracks_valid_invalid_candidates_in_insertion_order() {
        let mut scanner = ScannerSession::create(&manifest()).unwrap();
        let first = scanner
            .scan(
                "App.tsx",
                "export const App = () => <div className=\"block unknown fg:red\" />",
            )
            .unwrap();
        assert!(first.changed);
        assert_eq!(first.valid_classes, ["block", "fg:red"]);
        assert_eq!(first.invalid_classes, ["unknown"]);
        assert_eq!(first.transition.mutations.len(), 2);

        let cached = scanner
            .scan(
                "App.tsx",
                "export const App = () => <div className=\"block unknown fg:red\" />",
            )
            .unwrap();
        assert!(!cached.changed);
        assert!(cached.cache_hit);

        let changed = scanner
            .scan(
                "App.tsx",
                "export const App = () => <div className=\"block\" />",
            )
            .unwrap();
        assert!(!changed.changed);
        assert!(!changed.cache_hit);
        assert_eq!(scanner.state().unwrap().cached_sources, 1);
    }

    #[test]
    fn reset_recreates_engine_and_clears_all_scanner_state() {
        let mut scanner = ScannerSession::create(&manifest()).unwrap();
        scanner
            .scan("index.html", "<div class=\"block\"></div>")
            .unwrap();
        scanner.reset().unwrap();
        let state = scanner.state().unwrap();
        assert!(state.latent_classes.is_empty());
        assert!(state.engine.rules.is_empty());
        assert_eq!(state.cached_sources, 0);
    }

    #[test]
    fn commits_host_css_validation_and_ordered_native_support() {
        let mut scanner = ScannerSession::create(&manifest()).unwrap();
        let update = scanner
            .scan_candidates(
                "index.html",
                "changed",
                vec!["bad".into(), "made-up:value".into()],
                &[],
                &[true],
                &HashSet::from(["bad".into()]),
            )
            .unwrap();
        assert_eq!(update.invalid_classes, ["bad"]);
        assert_eq!(update.valid_classes, ["made-up:value"]);
        assert_eq!(
            scanner.state().unwrap().engine.text,
            "@layer utilities{.made-up\\:value{made-up:value}}"
        );
    }

    #[test]
    fn matches_compiler_blocklist_values_without_changing_regex_dialects() {
        let blocklist = vec![
            CssDirectiveBlocklistEntry::Exact("exact".into()),
            CssDirectiveBlocklistEntry::Pattern {
                source: "^debug\\-.*$".into(),
                flags: String::new(),
            },
            CssDirectiveBlocklistEntry::Pattern {
                source: "^icon\\-.$".into(),
                flags: String::new(),
            },
        ];
        assert!(is_css_class_blocklisted("exact", &blocklist));
        assert!(is_css_class_blocklisted("debug-card", &blocklist));
        assert!(is_css_class_blocklisted("icon-a", &blocklist));
        assert!(!is_css_class_blocklisted("icon-😀", &blocklist));
        assert!(!is_css_class_blocklisted("debug", &blocklist));
        assert!(!is_css_class_blocklisted("icon-long", &blocklist));

        let scanner_blocklist = vec![CssDirectiveBlocklistEntry::Pattern {
            source: "^bg:".into(),
            flags: "g".into(),
        }];
        assert!(is_css_class_blocklisted("bg:red", &scanner_blocklist));
        assert!(!is_css_class_blocklisted("fg:red", &scanner_blocklist));
    }

    #[test]
    fn owns_generated_rule_validation_classification() {
        let mut validator = mastercss_validator::ValidatorSession::create(&manifest()).unwrap();
        let batch = validator
            .generate_classes(["block", "unknown"], None)
            .unwrap();
        assert_eq!(
            invalid_generated_classes(&batch, &[vec![false], vec![]]),
            ["block"]
        );
        assert!(invalid_generated_classes(&batch, &[vec![true], vec![]]).is_empty());
    }
}
