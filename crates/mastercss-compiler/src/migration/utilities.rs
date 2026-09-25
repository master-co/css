//! Frozen RC utility matching, exclusively for migration evidence. Runtime never
//! decodes typed matchers or guesses intent from a current variable value.
use super::stylesheets::{RcStylesheetMigration, add_edit};
use super::{Migration, RcMigrationProfile};
use mastercss_engine::EngineSession;
use mastercss_lexer::{CssSyntaxKind, collect_css_syntax_statements, tokenize_css_syntax};
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
    manifest["languageVersion"] = json!(mastercss_schema::LANGUAGE_VERSION);
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
}

impl Migration {
    pub(super) fn utility_class(&self, before: &str, after: String) -> Result<String, String> {
        if before.contains("${") || before.contains("{{") {
            return Err("Dynamic utility construction requires manual migration".into());
        }
        if !matches!(
            self.profile,
            RcMigrationProfile::RcUtilities
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
                for field in ["variants", "conditions", "modes"] {
                    if let Some(value) = self.target_manifest.borrow().get(field) {
                        manifest[field] = value.clone();
                    }
                }
            }
            let engine =
                EngineSession::create(&manifest.to_string()).map_err(|error| error.to_string())?;
            let old = engine
                .composition_rules(if translated { &after } else { before })
                .map_err(|error| error.to_string())?;
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
        let old = engine
            .composition_rules(&format!("migration-saved-utility:{value}{suffix}"))
            .map_err(|error| error.to_string())?;
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

    fn utility_resources(
        &self,
        original: &EngineSession,
        before: &str,
        after: &str,
    ) -> Result<(), String> {
        if self.profile != RcMigrationProfile::RcUtilities {
            return Ok(());
        }
        let resources = |engine: &EngineSession, class: &str| -> Result<Value, String> {
            let manifest = engine.manifest_json().map_err(|error| error.to_string())?;
            let mut probe = EngineSession::create(&manifest).map_err(|error| error.to_string())?;
            probe
                .ensure_class_rules([class])
                .map_err(|error| error.to_string())?;
            let snapshot = probe.snapshot().map_err(|error| error.to_string())?;
            serde_json::to_value(snapshot.resources).map_err(|error| error.to_string())
        };
        if resources(original, before)? != resources(&self.target.borrow(), after)? {
            return Err("Saved token or animation resources differ from the target; review resource values, ordering and ownership before migrating".into());
        }
        Ok(())
    }

    pub(super) fn utility_stylesheet(&self, source: &str, result: &mut RcStylesheetMigration) {
        let tokens = tokenize_css_syntax(source);
        let statements = collect_css_syntax_statements(&tokens);
        let mut definitions = Vec::new();
        for statement in &statements {
            if !statement.has_block {
                continue;
            }
            let mut parent = statement.parent;
            let mut managed = false;
            while let Some(index) = parent {
                match &tokens[statements[index].tokens.start].kind {
                    CssSyntaxKind::AtKeyword(name) if name == "utilities" => {
                        managed = true;
                        break;
                    }
                    CssSyntaxKind::AtKeyword(_) => parent = statements[index].parent,
                    _ => break,
                }
            }
            if !managed {
                continue;
            }
            let start = tokens[statement.tokens.start].bytes.start;
            let Some(open) = tokens.get(statement.tokens.end) else {
                continue;
            };
            let Some(close) = open.close.and_then(|index| tokens.get(index)) else {
                continue;
            };
            let name = source[start..open.bytes.start].trim();
            definitions.push((
                name.to_owned(),
                start,
                open.bytes.start,
                open.bytes.end,
                close.bytes.start,
                close.bytes.end,
            ));
        }
        for (name, start, prelude_end, _, _, _) in &definitions {
            let start_utf16 = source[..*start].encode_utf16().count() as u32;
            if result
                .edits
                .iter()
                .any(|edit| edit.range.start <= start_utf16 && start_utf16 < edit.range.end)
            {
                continue;
            }
            if let Some((prefix, members)) = name
                .split_once('<')
                .and_then(|(prefix, body)| body.strip_suffix('>').map(|members| (prefix, members)))
            {
                let entries = members.split('|').map(str::trim).collect::<Vec<_>>();
                if prefix.ends_with(':') && entries != ["*"] {
                    let overloads = definitions
                        .iter()
                        .filter(|(name, ..)| name.starts_with(&format!("{prefix}<")))
                        .count();
                    if entries.contains(&"*")
                        && entries
                            .iter()
                            .all(|entry| matches!(*entry, "*" | "number" | "color" | "image"))
                        && overloads == 1
                    {
                        add_edit(
                            result,
                            source,
                            *start,
                            *prelude_end,
                            format!("{prefix}<*> "),
                        );
                    } else {
                        result.notes.push(format!("Utility {name} has typed-only, enum or overloaded acceptance; converting it to {prefix}<*> expands its domain and requires review"));
                    }
                } else if prefix.ends_with('-')
                    && entries.iter().all(|entry| entry.starts_with(['~', '=']))
                    && entries.iter().any(|entry| entry.starts_with('='))
                {
                    let entries = entries
                        .iter()
                        .map(|entry| format!("~{}", &entry[1..]))
                        .collect::<Vec<_>>();
                    add_edit(
                        result,
                        source,
                        *start,
                        *prelude_end,
                        format!("{prefix}<{}> ", entries.join("|")),
                    );
                }
            }
        }
        // Adjacent static definitions with no intervening definitions can be
        // combined without moving their ordered statements or nested rules.
        for (index, (name, start, _, body_start, body_end, end)) in definitions.iter().enumerate() {
            if name.contains('<') {
                continue;
            }
            let previous = definitions[..index]
                .iter()
                .rposition(|(previous, ..)| previous == name);
            if let Some(previous) = previous {
                let (_, previous_start, _, previous_body_start, previous_body_end, previous_end) =
                    &definitions[previous];
                if previous + 1 == index
                    && source[*previous_end..*start].trim().is_empty()
                    && definitions
                        .iter()
                        .filter(|(other, ..)| other == name)
                        .count()
                        == 2
                {
                    add_edit(
                        result,
                        source,
                        *previous_start,
                        *end,
                        format!(
                            "{name}{{{}\n{}}}",
                            &source[*previous_body_start..*previous_body_end],
                            &source[*body_start..*body_end]
                        ),
                    );
                } else {
                    result.notes.push(format!("Repeated utility {name} now replaces its entire definition; preserve its RC statement order manually across definitions/imports"));
                }
            }
        }
    }
}
