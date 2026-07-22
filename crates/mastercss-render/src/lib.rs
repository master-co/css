#![forbid(unsafe_code)]

use std::collections::HashSet;

use mastercss_engine::{EngineError, EngineSession};
use mastercss_schema::{
    EmittedGlobals, EngineSnapshotIr, HydrationManifest, NativeDeclarationCandidateIr,
};
use serde::Serialize;

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerRenderIr {
    pub classes: Vec<String>,
    pub snapshot: EngineSnapshotIr,
    pub hydration_manifest: HydrationManifest,
}

#[derive(Debug)]
pub struct RenderSession {
    engine: EngineSession,
    classes: Vec<String>,
    class_index: HashSet<String>,
}

impl RenderSession {
    pub fn create(
        manifest_json: &str,
        emitted_globals_json: Option<&str>,
    ) -> Result<Self, EngineError> {
        Ok(Self {
            engine: EngineSession::create_with_emitted_globals(
                manifest_json,
                emitted_globals_json,
            )?,
            classes: Vec::new(),
            class_index: HashSet::new(),
        })
    }

    pub fn native_declaration_candidates<I, S>(
        &self,
        class_names: I,
    ) -> Result<Vec<NativeDeclarationCandidateIr>, EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        self.engine.native_declaration_candidates(
            class_names
                .into_iter()
                .filter(|class_name| !self.class_index.contains(class_name.as_ref())),
        )
    }

    pub fn ensure_classes<I, S>(
        &mut self,
        class_names: I,
        native_support: Option<&[bool]>,
    ) -> Result<(), EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        let mut new_classes = Vec::new();
        for class_name in class_names {
            let class_name = class_name.as_ref();
            if !class_name.is_empty() && self.class_index.insert(class_name.to_owned()) {
                self.classes.push(class_name.to_owned());
                new_classes.push(class_name.to_owned());
            }
        }
        if let Some(native_support) = native_support {
            self.engine
                .ensure_class_rules_with_native_support(&new_classes, native_support)?;
        } else {
            self.engine.ensure_class_rules(&new_classes)?;
        }
        Ok(())
    }

    pub fn ensure_stylesheet_resources(&mut self, native_css: &str) -> Result<(), EngineError> {
        self.engine.ensure_stylesheet_resources(native_css)?;
        Ok(())
    }

    pub fn emitted_globals(&self) -> Result<EmittedGlobals, EngineError> {
        self.engine.emitted_globals_snapshot()
    }

    pub fn snapshot(&self) -> Result<ServerRenderIr, EngineError> {
        let snapshot = self.engine.snapshot()?;
        let hydration_manifest = HydrationManifest::new(snapshot.rules.clone());
        Ok(ServerRenderIr {
            classes: self.classes.clone(),
            snapshot,
            hydration_manifest,
        })
    }

    pub fn snapshot_for_classes<I, S>(&self, class_names: I) -> Result<ServerRenderIr, EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        let mut classes = Vec::new();
        let mut class_index = HashSet::new();
        for class_name in class_names {
            let class_name = class_name.as_ref();
            if !class_name.is_empty() && class_index.insert(class_name.to_owned()) {
                classes.push(class_name.to_owned());
            }
        }
        let snapshot = self.engine.snapshot_for_classes(&classes)?;
        let hydration_manifest = HydrationManifest::new(snapshot.rules.clone());
        Ok(ServerRenderIr {
            classes,
            snapshot,
            hydration_manifest,
        })
    }

    pub fn dispose(&mut self) {
        self.engine.dispose();
        self.classes.clear();
        self.class_index.clear();
    }
}

/// Generates the deterministic server-side stylesheet and hydration IR from an
/// already extracted class list. HTML parsing and serialization intentionally
/// remain in the host adapter, where existing DOM parser behavior is preserved.
pub fn render_classes<I, S>(
    manifest_json: &str,
    class_names: I,
    native_support: Option<&[bool]>,
) -> Result<ServerRenderIr, EngineError>
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
{
    let classes = class_names
        .into_iter()
        .map(|class_name| class_name.as_ref().to_owned())
        .collect::<Vec<_>>();
    let mut session = RenderSession::create(manifest_json, None)?;
    session.ensure_classes(classes, native_support)?;
    session.snapshot()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn manifest() -> String {
        serde_json::json!({
            "version": 1,
            "utilities": [
                {
                    "id": ".block",
                    "name": "block",
                    "type": -2,
                    "order": 1,
                    "emit": {
                        "type": "static",
                        "rules": [{ "declarations": { "display": "block" } }]
                    },
                    "matchers": [{ "type": "static", "name": "block" }]
                },
                {
                    "id": ".red",
                    "name": "red",
                    "type": -2,
                    "order": 0,
                    "emit": {
                        "type": "static",
                        "rules": [{ "declarations": { "color": "red" } }]
                    },
                    "matchers": [{ "type": "static", "name": "red" }]
                }
            ]
        })
        .to_string()
    }

    #[test]
    fn composes_sorted_css_and_hydration_rules() {
        let rendered =
            render_classes(&manifest(), ["red", "block", "red", "unknown"], None).unwrap();
        assert_eq!(rendered.classes, ["red", "block", "unknown"]);
        assert_eq!(
            rendered.snapshot.text,
            "@layer utilities{.block{display:block}.red{color:red}}"
        );
        assert_eq!(rendered.hydration_manifest.version, 1);
        assert_eq!(rendered.hydration_manifest.rules, rendered.snapshot.rules);
    }

    #[test]
    fn native_support_only_applies_to_new_classes() {
        let mut session = RenderSession::create(r#"{"version":1,"utilities":[]}"#, None).unwrap();
        let candidates = session
            .native_declaration_candidates(["display:block"])
            .unwrap();
        assert_eq!(candidates.len(), 1);
        session
            .ensure_classes(["display:block"], Some(&[true]))
            .unwrap();

        assert!(
            session
                .native_declaration_candidates(["display:block"])
                .unwrap()
                .is_empty()
        );
        session.ensure_classes(["display:block"], None).unwrap();
        assert_eq!(
            session.snapshot().unwrap().snapshot.text,
            "@layer utilities{.display\\:block{display:block}}"
        );
    }

    #[test]
    fn snapshots_cached_class_subsets_like_fresh_sessions() {
        let manifest = manifest();
        let mut cached = RenderSession::create(&manifest, None).unwrap();
        cached
            .ensure_classes(["block", "red", "unknown"], None)
            .unwrap();

        let red = cached
            .snapshot_for_classes(["red", "unknown", "red"])
            .unwrap();
        let fresh_red = render_classes(&manifest, ["red", "unknown", "red"], None).unwrap();
        assert_eq!(red, fresh_red);

        let block_red = cached.snapshot_for_classes(["block", "red"]).unwrap();
        let fresh_block_red = render_classes(&manifest, ["block", "red"], None).unwrap();
        assert_eq!(block_red, fresh_block_red);
    }

    #[test]
    fn cached_subset_output_does_not_depend_on_warm_up_order() {
        let manifest = manifest();
        let mut forward = RenderSession::create(&manifest, None).unwrap();
        forward.ensure_classes(["block", "red"], None).unwrap();
        let mut reverse = RenderSession::create(&manifest, None).unwrap();
        reverse.ensure_classes(["red", "block"], None).unwrap();

        assert_eq!(
            forward.snapshot_for_classes(["red", "block"]).unwrap(),
            reverse.snapshot_for_classes(["red", "block"]).unwrap()
        );
    }

    #[test]
    fn cached_subsets_preserve_page_resource_composition() {
        let manifest = serde_json::json!({
            "version": 1,
            "variables": {
                "color": [{ "key": "primary", "value": "red" }]
            },
            "animations": {
                "fade": { "to": { "opacity": "1" } }
            },
            "utilities": [
                {
                    "id": ".brand",
                    "name": "brand",
                    "type": -2,
                    "order": 0,
                    "emit": {
                        "type": "static",
                        "rules": [{ "declarations": { "color": "var(--color-primary)" } }]
                    },
                    "matchers": [{ "type": "static", "name": "brand" }]
                },
                {
                    "id": ".animated",
                    "name": "animated",
                    "type": -2,
                    "order": 1,
                    "emit": {
                        "type": "static",
                        "rules": [{ "declarations": { "animation": "fade 1s" } }]
                    },
                    "matchers": [{ "type": "static", "name": "animated" }]
                }
            ]
        })
        .to_string();
        let emitted_globals = r#"{"animations":{"fade":1}}"#;
        let mut cached = RenderSession::create(&manifest, Some(emitted_globals)).unwrap();
        cached.ensure_classes(["animated", "brand"], None).unwrap();

        for classes in [["brand"].as_slice(), ["animated", "brand"].as_slice()] {
            let cached_snapshot = cached.snapshot_for_classes(classes).unwrap();
            let mut fresh = RenderSession::create(&manifest, Some(emitted_globals)).unwrap();
            fresh.ensure_classes(classes, None).unwrap();
            assert_eq!(cached_snapshot, fresh.snapshot().unwrap());
        }
    }

    #[test]
    fn composes_native_stylesheet_resources_without_duplicate_keyframes() {
        let manifest = serde_json::json!({
            "version": 1,
            "variables": {
                "color": [{ "key": "primary", "value": "red" }]
            },
            "animations": {
                "fade": { "to": { "opacity": "1" } },
                "native-spin": { "to": { "opacity": "0" } }
            },
            "utilities": []
        })
        .to_string();
        let mut session = RenderSession::create(&manifest, None).unwrap();

        session
            .ensure_stylesheet_resources(
                r#"
                .quoted { content: "var(--color-ignored)"; }
                /* var(--color-commented); animation: native-spin 1s; */
                .native { color: var(--color-primary); animation: fade 1s; }
                @keyframes native-spin { to { opacity: .5; } }
                "#,
            )
            .unwrap();

        let rendered = session.snapshot().unwrap();
        assert!(rendered.snapshot.text.contains("--color-primary:red"));
        assert!(rendered.snapshot.text.contains("@keyframes fade"));
        assert!(!rendered.snapshot.text.contains("@keyframes native-spin"));
        let emitted_globals = session.emitted_globals().unwrap();
        assert_eq!(emitted_globals.variable_count("color-primary"), 1);
        assert_eq!(emitted_globals.animation_count("fade"), 1);
        assert_eq!(emitted_globals.animation_count("native-spin"), 1);
        assert_eq!(emitted_globals.variable_count("color-ignored"), 0);
        assert_eq!(emitted_globals.variable_count("color-commented"), 0);
    }

    #[test]
    fn preserves_and_increments_host_resource_counts() {
        let manifest = serde_json::json!({
            "version": 1,
            "variables": {
                "color": [{ "key": "primary", "value": "red" }]
            },
            "animations": {
                "native-spin": { "to": { "opacity": "0" } }
            },
            "utilities": []
        })
        .to_string();
        let mut session = RenderSession::create(
            &manifest,
            Some(r#"{"variables":{"color-primary":2},"animations":{"native-spin":2}}"#),
        )
        .unwrap();
        session
            .ensure_stylesheet_resources(
                ".native{color:var(--color-primary)}@keyframes native-spin{to{opacity:.5}}",
            )
            .unwrap();

        assert_eq!(session.snapshot().unwrap().snapshot.text, "");
        let emitted_globals = session.emitted_globals().unwrap();
        assert_eq!(emitted_globals.variable_count("color-primary"), 2);
        assert_eq!(emitted_globals.animation_count("native-spin"), 3);
    }
}
