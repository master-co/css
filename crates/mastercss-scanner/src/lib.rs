#![forbid(unsafe_code)]

use std::collections::{HashMap, HashSet};
use std::path::Path;

use mastercss_engine::{EngineError, EngineSession};
use mastercss_schema::{EngineSnapshotIr, EngineTransitionIr};
use serde::Serialize;

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScannerUpdateIr {
    pub changed: bool,
    pub cache_hit: bool,
    pub candidates: Vec<String>,
    pub valid_classes: Vec<String>,
    pub invalid_classes: Vec<String>,
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
            source_contents: HashMap::new(),
        })
    }

    pub fn scan(&mut self, source: &str, content: &str) -> Result<ScannerUpdateIr, EngineError> {
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

        let mut candidates = Vec::new();
        for candidate in extract_source_candidates(source, content) {
            if self.latent_index.insert(candidate.clone()) {
                self.latent_classes.push(candidate.clone());
                candidates.push(candidate);
            }
        }
        if candidates.is_empty() {
            return Ok(ScannerUpdateIr::unchanged(false));
        }

        let mut valid_classes = Vec::new();
        let mut invalid_classes = Vec::new();
        let mut mutations = Vec::new();
        for candidate in &candidates {
            if self.valid_index.contains(candidate) || self.invalid_index.contains(candidate) {
                continue;
            }
            let transition = self.engine.ensure_class_rules([candidate])?;
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
            transition: EngineTransitionIr::new(mutations),
        })
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
        self.source_contents.clear();
    }
}

fn extract_source_candidates(source: &str, content: &str) -> Vec<String> {
    let clean_source = source.split('?').next().unwrap_or(source);
    let extension = Path::new(clean_source)
        .extension()
        .and_then(|extension| extension.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();
    match extension.as_str() {
        "astro" => mastercss_source::extract_astro_classes(source, content),
        "html" | "htm" => mastercss_source::extract_html_classes(source, content),
        "js" | "jsx" | "cjs" | "mjs" | "ts" | "tsx" | "cts" | "mts" => {
            mastercss_source::extract_oxc_classes(source, content)
        }
        _ => mastercss_source::extract_class_candidates(content),
    }
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
}
