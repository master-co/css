//! Frozen RC utility matching, exclusively for migration evidence. Runtime never
//! decodes typed matchers or guesses intent from a current variable value.
use super::{Migration, RcMigrationProfile};
use mastercss_engine::EngineSession;
use serde_json::{Value, json};

pub(super) fn legacy_kind(value: &str, kind: Option<&str>) -> bool {
    let function = value
        .trim_start_matches('-')
        .split_once('(')
        .filter(|(_, tail)| tail.ends_with(')'))
        .map(|(name, _)| name);
    match kind {
        Some("number") => {
            value
                .chars()
                .next()
                .is_some_and(|c| c.is_ascii_digit() || c == '.')
                || matches!(function, Some("calc" | "clamp" | "min" | "max"))
        }
        Some("color") => {
            value.starts_with('#')
                || value.starts_with("currentColor")
                || value.starts_with("transparent")
                || function.is_some_and(|name| {
                    !matches!(name, "calc" | "clamp" | "min" | "max" | "url" | "image")
                        && !name.ends_with("gradient")
                })
        }
        Some("image") => function.is_some_and(|name| {
            matches!(name, "url" | "element" | "paint" | "cross-fade")
                || name.ends_with("gradient")
                || name.contains("image")
        }),
        _ => false,
    }
}

pub(super) fn current_helper(manifest: &mut Value) {
    if manifest["version"] == 4
        && manifest["languageVersion"] == 6
        && manifest.get("utilities").is_none()
    {
        return;
    }
    super::manifest::upgrade(manifest);
    for utility in manifest["utilities"].as_array_mut().into_iter().flatten() {
        if let Some(object) = utility.as_object_mut() {
            object.remove("kind");
            object.remove("segments");
        }
        for reference in utility
            .get_mut("variableAliasRefs")
            .and_then(Value::as_array_mut)
            .into_iter()
            .flatten()
        {
            if let Some(name) = reference.as_str().and_then(|name| name.strip_prefix('=')) {
                *reference = json!(format!("~{name}"));
            }
        }
        for matcher in utility["matchers"].as_array_mut().into_iter().flatten() {
            if matcher["type"] == "value" {
                matcher["type"] = json!("key");
            }
            if let Some(object) = matcher.as_object_mut() {
                object.remove("segments");
            }
        }
    }
    super::saved_rules::freeze(manifest);
}

impl Migration {
    pub(super) fn utility_class(&self, before: &str, after: String) -> Result<String, String> {
        if before.contains("${") || before.contains("{{") {
            return Err("Dynamic utility construction requires manual migration".into());
        }
        if !matches!(
            self.profile,
            RcMigrationProfile::RcUtilities
                | RcMigrationProfile::RcSizing
                | RcMigrationProfile::RcManaged
                | RcMigrationProfile::RcNative
                | RcMigrationProfile::RcNamed
        ) {
            return Ok(after);
        }
        if before.starts_with('{') {
            return Ok(after);
        } // Each group member was converted independently.
        let fixed = self.original["utilities"]
            .as_array()
            .into_iter()
            .flatten()
            .filter(|utility| {
                utility["matchers"]
                    .as_array()
                    .into_iter()
                    .flatten()
                    .any(|matcher| {
                        matcher["type"] == "static"
                            && matcher["name"].as_str().is_some_and(|name| {
                                before.strip_prefix(name).is_some_and(|suffix| {
                                    suffix.is_empty()
                                        || suffix.starts_with([':', '@', '!', '>', '+', '~', '.'])
                                })
                            })
                    })
            })
            .collect::<Vec<_>>();
        if fixed.len() > 1 {
            return Err("Multiple saved static definitions require a whole-definition and source-order review".into());
        }
        if let Some(definition) = fixed.first() {
            let mut manifest = self.original.clone();
            manifest["utilities"] = json!([definition]);
            current_helper(&mut manifest);
            let translated = matches!(
                self.profile,
                RcMigrationProfile::RcNamed | RcMigrationProfile::RcNative
            );
            if translated {
                // The preceding profile stage proved these query translations.
                // Apply them around the saved utility body for comparison.
                for field in ["variants", "conditions", "customMedia"] {
                    if let Some(value) = self.target_manifest.borrow().get(field) {
                        manifest[field] = value.clone();
                    }
                }
            }
            let engine =
                EngineSession::create(&manifest.to_string()).map_err(|error| error.to_string())?;
            let old = super::saved_rules::rules(&engine, if translated { &after } else { before })?;
            if old.is_empty() {
                let target = self
                    .target
                    .borrow()
                    .inspect(&after)
                    .map_err(|error| error.to_string())?;
                if target.match_status != mastercss_schema::MatchStatus::Matched
                    || !target.rules.is_empty()
                {
                    return Err("Empty saved utility changed its match or generated output".into());
                }
            } else {
                self.equivalent(&old, &after, true)?;
            }
            self.utility_resources(&engine, if translated { &after } else { before }, &after)?;
            return Ok(after);
        }
        let Some((key, rest)) = before.split_once(':') else {
            return Ok(after);
        };
        let (value, suffix) = super::values::split_rc_value_state(rest);
        let utilities = self.original["utilities"]
            .as_array()
            .ok_or("Saved manifest requires utilities")?;
        let mut registered = false;
        let mut selected = None;
        for utility in utilities {
            for matcher in utility["matchers"].as_array().into_iter().flatten() {
                let kind = matcher["type"].as_str().unwrap_or_default();
                let owns = matches!(kind, "key" | "value")
                    && matcher["keys"]
                        .as_array()
                        .is_some_and(|keys| keys.iter().any(|entry| entry.as_str() == Some(key)))
                    || kind == "pattern" && matcher["prefix"].as_str() == Some(&format!("{key}:"));
                if !owns {
                    continue;
                }
                registered = true;
                let matches = match kind {
                    "key" => true,
                    "value" => {
                        legacy_kind(&value, utility["kind"].as_str())
                            && (matcher["segments"] == "multiple" || !value.contains('|'))
                    }
                    "pattern" => matcher["values"].as_array().is_some_and(|values| {
                        values.iter().any(|entry| entry.as_str() == Some(&value))
                    }),
                    _ => false,
                };
                if matches && selected.is_none() {
                    selected = Some(utility);
                }
            }
        }
        if !registered {
            return Ok(after);
        }
        let Some(selected) = selected else {
            return Err(format!(
                "{before} did not match its RC utility; accepting it now may activate previously ineffective CSS. Review the saved browser result"
            ));
        };
        if selected["kind"] == "color"
            && ["var(", "env(", "attr("]
                .iter()
                .any(|function| value.contains(function))
        {
            return Err(format!(
                "RC inferred a color overload for {before}; choose the intended explicit property without inferring from the variable's current value"
            ));
        }
        let mut probe = selected.clone();
        probe["id"] = json!("migration-saved-utility");
        probe["name"] = json!("migration-saved-utility");
        probe["matchers"] = json!([{ "type": "key", "keys": ["migration-saved-utility"] }]);
        let mut manifest = self.original.clone();
        manifest["utilities"] = json!([probe]);
        current_helper(&mut manifest);
        let engine =
            EngineSession::create(&manifest.to_string()).map_err(|error| error.to_string())?;
        let old = super::saved_rules::rules(
            &engine,
            &format!("migration-saved-utility:{value}{suffix}"),
        )?;
        let candidate =
            if key == "text-stroke" && old.len() == 1 && old[0].declarations.len() == 1 {
                let property = old[0].declarations[0].property.as_str();
                let key =
                    match property {
                        "-webkit-text-stroke-width" => "text-stroke-width",
                        "-webkit-text-stroke-color" => "text-stroke-color",
                        "-webkit-text-stroke" => "text-stroke",
                        _ => return Err(
                            "Saved text-stroke utility has custom intent; review its declarations"
                                .into(),
                        ),
                    };
                format!("{key}:{value}{suffix}")
            } else {
                after
            };
        self.equivalent(&old, &candidate, true)?;
        self.utility_resources(
            &engine,
            &format!("migration-saved-utility:{value}{suffix}"),
            &candidate,
        )?;
        Ok(candidate)
    }

    pub(super) fn utility_resources(
        &self,
        original: &EngineSession,
        before: &str,
        after: &str,
    ) -> Result<(), String> {
        if !matches!(
            self.profile,
            RcMigrationProfile::RcUtilities | RcMigrationProfile::RcSizing
        ) {
            return Ok(());
        }
        let resources = |engine: &EngineSession, class: &str| -> Result<Value, String> {
            let (mut probe, class, _) = super::saved_rules::prepare(engine, class)?;
            probe
                .ensure_class_rules([class.as_str()])
                .map_err(|error| error.to_string())?;
            let snapshot = probe.snapshot().map_err(|error| error.to_string())?;
            serde_json::to_value(snapshot.resources).map_err(|error| error.to_string())
        };
        if resources(original, before)?
            != resources(
                &self.target.borrow(),
                &super::mixins::class(after, &self.original)?,
            )?
        {
            return Err("Saved token or animation resources differ from the target; review resource values, ordering and ownership before migrating".into());
        }
        Ok(())
    }
}
