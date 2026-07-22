#![forbid(unsafe_code)]

use std::collections::HashSet;

use mastercss_engine::{EngineError, EngineSession};
use mastercss_schema::{EngineSnapshotIr, HydrationManifest};
use serde::Serialize;

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerRenderIr {
    pub classes: Vec<String>,
    pub snapshot: EngineSnapshotIr,
    pub hydration_manifest: HydrationManifest,
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
    let mut classes = Vec::new();
    let mut class_index = HashSet::new();
    for class_name in class_names {
        let class_name = class_name.as_ref();
        if !class_name.is_empty() && class_index.insert(class_name.to_owned()) {
            classes.push(class_name.to_owned());
        }
    }

    let mut engine = EngineSession::create(manifest_json)?;
    if let Some(native_support) = native_support {
        engine.ensure_class_rules_with_native_support(&classes, native_support)?;
    } else {
        engine.ensure_class_rules(&classes)?;
    }
    let snapshot = engine.snapshot()?;
    let hydration_manifest = HydrationManifest::new(snapshot.rules.clone());
    Ok(ServerRenderIr {
        classes,
        snapshot,
        hydration_manifest,
    })
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
}
