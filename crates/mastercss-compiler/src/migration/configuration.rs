//! Convert saved RC configuration without teaching the runtime legacy settings.
use super::error;
use crate::CompilerError;
use serde_json::{Value, json};

pub(super) struct Configuration {
    pub manifest: Value,
    pub css: String,
    pub notes: Vec<String>,
    pub modes: Vec<String>,
}

pub(super) fn convert(original: &Value) -> Result<Configuration, CompilerError> {
    let mut manifest = original.clone();
    manifest["languageVersion"] = json!(mastercss_schema::LANGUAGE_VERSION);
    let settings = original.get("settings");
    let trigger = settings
        .and_then(|s| s.get("modeTrigger"))
        .and_then(Value::as_str)
        .unwrap_or("media");
    if !matches!(trigger, "media" | "class" | "host") {
        return Err(error(
            "The saved mode trigger cannot be converted safely; recover an explicit media, class, or host configuration",
        ));
    }
    let default_mode = settings
        .and_then(|s| s.get("defaultMode"))
        .and_then(Value::as_str)
        .unwrap_or("light");
    let modes: Vec<String> = match settings.and_then(|s| s.get("modes")) {
        Some(value) => serde_json::from_value(value.clone())
            .map_err(|_| error("Invalid saved settings.modes"))?,
        None => vec!["light".into(), "dark".into()],
    };
    let mut definitions = Vec::new();
    let mut css = String::new();
    let mut notes = Vec::new();
    for name in &modes {
        if name.is_empty()
            || name.starts_with(|c: char| c.is_ascii_digit())
            || name == "-"
            || name
                .strip_prefix('-')
                .is_some_and(|s| s.starts_with(|c: char| c.is_ascii_digit()))
            || !name
                .chars()
                .all(|c| c.is_alphanumeric() || matches!(c, '-' | '_'))
        {
            return Err(error("Saved mode names require manual selector migration"));
        }
        let escaped = mastercss_lexer::css_escape(name);
        let selector = match trigger {
            "class" => format!(".{escaped}"),
            "host" => format!(":host(.{escaped})"),
            _ => ":root,:host".into(),
        };
        let conditions = if trigger == "media" {
            if !matches!(name.as_str(), "light" | "dark") {
                notes.push(format!("Mode {name} used an invalid prefers-color-scheme value; choose an explicit activation selector"));
            }
            vec![format!("@media (prefers-color-scheme:{name})")]
        } else {
            Vec::new()
        };
        definitions
            .push(json!({"name":name,"branches":[{"selector":selector,"conditions":conditions}]}));
        let branch = format!("{selector}{{@slot;}}");
        let branch = conditions
            .iter()
            .rev()
            .fold(branch, |body, condition| format!("{condition}{{{body}}}"));
        css.push_str(&format!("@mode {name}{{{branch}}}\n"));
        if trigger != "media" && matches!(name.as_str(), "light" | "dark") {
            css.push_str(&format!(
                "@layer theme{{{selector}{{color-scheme:{name}}}}}\n"
            ));
        }
    }
    if trigger != "media" {
        let mut base = Vec::new();
        for (namespace, variables) in manifest
            .get_mut("variables")
            .and_then(Value::as_object_mut)
            .into_iter()
            .flatten()
        {
            for variable in variables.as_array_mut().into_iter().flatten() {
                if variable.get("value").is_some() {
                    continue;
                }
                let Some(value) = variable
                    .get("modes")
                    .and_then(|m| m.get(default_mode))
                    .cloned()
                else {
                    continue;
                };
                let value = value.get("value").cloned().unwrap_or(value);
                variable["value"] = value.clone();
                let key = variable["key"].as_str().unwrap_or_default();
                let name = variable
                    .get("name")
                    .and_then(Value::as_str)
                    .map(str::to_owned)
                    .unwrap_or_else(|| {
                        if namespace.is_empty() {
                            key.into()
                        } else if key.is_empty() {
                            namespace.clone()
                        } else {
                            format!("{namespace}-{key}")
                        }
                    });
                base.push(format!(
                    "--{name}:{};",
                    value
                        .as_str()
                        .map(str::to_owned)
                        .unwrap_or_else(|| value.to_string())
                ));
            }
        }
        if !base.is_empty() {
            css.push_str(&format!("@theme{{{}}}\n", base.join("")));
            if matches!(default_mode, "light" | "dark") {
                css.push_str(&format!(
                    "@layer theme{{:root,:host{{color-scheme:{default_mode}}}}}\n"
                ));
            }
        }
        notes.push("Review overlapping and nested modes, activation-element utilities, zero-specificity guards, and the formerly demand-driven color-scheme declarations".into());
    }
    manifest["modes"] = Value::Array(definitions);
    if let Some(settings) = manifest.get_mut("settings").and_then(Value::as_object_mut) {
        for key in [
            "rootSize",
            "baseUnit",
            "defaultMode",
            "modeTrigger",
            "modes",
        ] {
            settings.remove(key);
        }
    }
    Ok(Configuration {
        manifest,
        css,
        notes,
        modes,
    })
}
