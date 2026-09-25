//! Explicit RC migration. Legacy decoding is confined to the compiler; the
//! runtime engine only receives ordinary, current-contract helper utilities.
mod conditions;
mod configuration;
mod managed;
mod native;
mod stylesheets;
mod values;

use crate::CompilerError;
use mastercss_engine::{
    EngineCompositionRuleIr, EngineSession, builtin_key_aliases, builtin_token_namespaces,
};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::cell::RefCell;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RcMigrationRequest {
    pub from: RcMigrationProfile,
    pub source_version: String,
    /// The resolved manifest saved using the project's actual RC installation.
    pub manifest: Value,
    /// The new preset or a fully compiled, migrated project manifest.
    pub target_manifest: Value,
    /// Overlay the saved RC resources only when the target is a bare preset.
    #[serde(default)]
    pub target_is_preset: bool,
    pub class_lists: Vec<Vec<String>>,
    #[serde(default)]
    pub stylesheets: Vec<String>,
    #[serde(default)]
    pub documents: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum RcMigrationProfile {
    RcLegacy,
    RcNamed,
    RcNative,
    RcManaged,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RcMigrationResult {
    pub version: u32,
    pub from: RcMigrationProfile,
    pub source_version: String,
    #[serde(rename = "configurationCSS")]
    pub configuration_css: String,
    pub notes: Vec<String>,
    pub behavior_changes: Vec<String>,
    pub class_lists: Vec<Vec<RcClassMigration>>,
    pub stylesheets: Vec<stylesheets::RcStylesheetMigration>,
    pub documents: Vec<Vec<String>>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RcClassMigration {
    pub before: String,
    pub after: Option<String>,
    pub status: &'static str,
    pub notes: Vec<String>,
}

struct Family {
    key: String,
    token: String,
    probe: String,
    render: String,
    resolver: String,
    managed: bool,
}

struct StaticFamily {
    source_prefix: String,
    probe_prefix: String,
}

struct Migration {
    profile: RcMigrationProfile,
    original: Value,
    configuration_css: String,
    notes: Vec<String>,
    modes: Vec<String>,
    unchanged_conditions: Vec<String>,
    helper: RefCell<EngineSession>,
    target: RefCell<EngineSession>,
    target_manifest: RefCell<Value>,
    query_definitions: RefCell<std::collections::BTreeMap<String, String>>,
    native_alpha: bool,
    managed_names: Vec<String>,
    families: Vec<Family>,
    static_families: Vec<StaticFamily>,
    base_unit: f64,
    root_size: f64,
}

fn error(message: impl Into<String>) -> CompilerError {
    CompilerError::Directive {
        message: message.into(),
        filename: "rc-manifest.json".into(),
        range: None,
    }
}

pub fn migrate_rc(request: &RcMigrationRequest) -> Result<RcMigrationResult, CompilerError> {
    let migration = Migration::create(request)?;
    let mut class_lists = Vec::new();
    for classes in &request.class_lists {
        let mut proposals = classes
            .iter()
            .map(|class| migration.class(class))
            .collect::<Vec<_>>();
        // The new value-source and spelling-independent order can change any
        // overlapping declarations. Never silently write such a class list.
        for left in 0..proposals.len() {
            for right in left + 1..proposals.len() {
                let a = proposals[left]
                    .after
                    .as_deref()
                    .unwrap_or(&proposals[left].before);
                let b = proposals[right]
                    .after
                    .as_deref()
                    .unwrap_or(&proposals[right].before);
                if request.from != RcMigrationProfile::RcManaged && migration.overlap(a, b) {
                    for index in [left, right] {
                        proposals[index].status = "review";
                        let note = "Overlapping declarations require a cascade review against the saved RC result".to_owned();
                        if !proposals[index].notes.contains(&note) {
                            proposals[index].notes.push(note);
                        }
                    }
                }
            }
        }
        class_lists.push(proposals);
    }
    let mut previous_styles = Vec::new();
    let stylesheets = request
        .stylesheets
        .iter()
        .enumerate()
        .map(|(index, source)| migration.stylesheet(source, index, &mut previous_styles))
        .collect();
    Ok(RcMigrationResult {
        version: 2,
        from: request.from,
        source_version: request.source_version.clone(),
        configuration_css: format!(
            "{}{}",
            migration.configuration_css,
            migration
                .query_definitions
                .borrow()
                .values()
                .cloned()
                .collect::<String>()
        ),
        notes: migration.notes.clone(),
        behavior_changes: vec!["Native @layer defaults/components styles are emitted even when unused; pruning remains opt-in".into(), "Native styles in the same layer follow CSS source order, including shorthand/longhand and importance".into()],
        class_lists,
        stylesheets,
        documents: request
            .documents
            .iter()
            .map(|source| if request.from == RcMigrationProfile::RcManaged {
                if migration.managed_names.is_empty() { Vec::new() } else {
                    source.lines().enumerate().flat_map(|(line, source)| values::audit_source(source).into_iter().map(move |note| format!("line {}: {note}; verify native selectors and explicitly enumerate any managed suffix variants", line + 1))).collect()
                }
            } else { values::audit_source(source) })
            .collect(),
    })
}

impl Migration {
    fn create(request: &RcMigrationRequest) -> Result<Self, CompilerError> {
        if request.manifest.get("version") != Some(&json!(1)) || !request.manifest.is_object() {
            return Err(error(
                "Migration requires the original resolved RC Manifest v1; save it before upgrading",
            ));
        }
        let setting = |name: &str, default: f64| -> Result<f64, CompilerError> {
            match request.manifest.get("settings").and_then(|settings| settings.get(name)) {
                None => Ok(default), // These are the RC Manifest v1 defaults, not a read-error fallback.
                Some(value) => value.as_f64().filter(|number| number.is_finite() && *number > 0.0)
                    .ok_or_else(|| error(format!("Cannot migrate invalid RC setting {name}; recover the original configuration"))),
            }
        };
        if request
            .manifest
            .get("settings")
            .is_some_and(|settings| !settings.is_object())
        {
            return Err(error("Cannot read original RC manifest settings"));
        }
        let base_unit = setting("baseUnit", 4.0)?;
        let root_size = setting("rootSize", 16.0)?;
        if request.source_version.trim().is_empty() {
            return Err(error(
                "Record the actual source package version before migrating",
            ));
        }
        let configuration = if matches!(
            request.from,
            RcMigrationProfile::RcNative | RcMigrationProfile::RcManaged
        ) {
            configuration::Configuration {
                manifest: request.manifest.clone(),
                css: String::new(),
                notes: Vec::new(),
                modes: request.manifest["modes"]
                    .as_array()
                    .into_iter()
                    .flatten()
                    .filter_map(|mode| mode["name"].as_str().map(str::to_owned))
                    .collect(),
            }
        } else {
            configuration::convert(&request.manifest)?
        };
        let mut helper_manifest = configuration.manifest;
        if let Some(settings) = helper_manifest
            .get_mut("settings")
            .and_then(Value::as_object_mut)
        {
            settings.remove("baseUnit");
        }
        let original = request
            .manifest
            .get("utilities")
            .and_then(Value::as_array)
            .ok_or_else(|| error("Original RC manifest requires a utilities array"))?;
        let mut utilities = Vec::new();
        let mut families = Vec::new();
        let mut static_families = Vec::new();
        for utility in original {
            let matchers = utility
                .get("matchers")
                .and_then(Value::as_array)
                .ok_or_else(|| error("Invalid utility in original RC manifest"))?;
            let mut keys = Vec::new();
            for matcher in matchers {
                if matches!(matcher["type"].as_str(), Some("static" | "pattern")) {
                    let field = if matcher["type"] == "static" {
                        "name"
                    } else {
                        "prefix"
                    };
                    let prefix = matcher[field]
                        .as_str()
                        .ok_or_else(|| error("Invalid RC static matcher"))?;
                    let probe = format!("migration-static-{}-", static_families.len());
                    let mut renamed = matcher.clone();
                    renamed[field] = json!(probe);
                    let mut utility = utility.clone();
                    utility["id"] = json!(probe);
                    utility["matchers"] = json!([renamed]);
                    utilities.push(utility);
                    static_families.push(StaticFamily {
                        source_prefix: prefix.into(),
                        probe_prefix: probe,
                    });
                }
                if matches!(matcher["type"].as_str(), Some("variable" | "key" | "value")) {
                    for key in matcher["keys"]
                        .as_array()
                        .into_iter()
                        .flatten()
                        .filter_map(Value::as_str)
                    {
                        if !keys.contains(&key) {
                            keys.push(key);
                        }
                    }
                }
            }
            for key in keys {
                add_family(&mut utilities, &mut families, key, utility, true);
            }
        }
        for (properties, references) in builtin_token_namespaces() {
            for property in *properties {
                let utility = json!({"id":property,"type":0,"variableAliasRefs": references,
                    "emit":{"type":"property","property": property},"matchers":[{"type":"key","keys":[property]}]});
                add_family(&mut utilities, &mut families, property, &utility, false);
                for (alias, target) in builtin_key_aliases() {
                    if target == property {
                        add_family(&mut utilities, &mut families, alias, &utility, false);
                    }
                }
            }
        }
        // Full variable names and $name used to work in every declaration.
        let mut aliases = Vec::new();
        for (namespace, variables) in request
            .manifest
            .get("variables")
            .and_then(Value::as_object)
            .into_iter()
            .flatten()
        {
            for variable in variables.as_array().into_iter().flatten() {
                let key = variable["key"].as_str().unwrap_or_default();
                let name = variable["name"]
                    .as_str()
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
                aliases.push(json!([name, name]));
            }
        }
        utilities.push(json!({"id":"migration-global","type":0,"variableAliases":aliases,
            "emit":{"type":"property","property":"margin"},"matchers":[{"type":"token","prefix":"migration-global-"}]}));
        utilities.push(json!({"id":"migration-parse","type":0,"emit":{"type":"property","property":"--migration-value"},
            "matchers":[{"type":"key","keys":["migration-parse"]}]}));
        if request.from == RcMigrationProfile::RcLegacy {
            helper_manifest["utilities"] = Value::Array(utilities);
        }
        let mut target_manifest = request.target_manifest.clone();
        // Saved project resources retain their identities. Managed definitions
        // must be present in the migrated target manifest to prove equivalence.
        for key in [
            "variables",
            "conditions",
            "selectors",
            "variants",
            "animations",
            "settings",
            "modes",
        ] {
            if request.target_is_preset
                && let Some(value) = helper_manifest.get(key)
            {
                target_manifest[key] = value.clone();
            }
        }
        if request.from == RcMigrationProfile::RcNative {
            native::restore_query_variants(&request.stylesheets, &mut target_manifest)?;
        }
        Ok(Self {
            profile: request.from,
            managed_names: managed::names(&request.stylesheets, &request.manifest),
            original: request.manifest.clone(),
            configuration_css: configuration.css,
            notes: configuration.notes,
            modes: configuration.modes,
            unchanged_conditions: request
                .manifest
                .get("conditions")
                .and_then(Value::as_object)
                .into_iter()
                .flatten()
                .filter(|(name, value)| {
                    request
                        .target_manifest
                        .get("conditions")
                        .and_then(|conditions| conditions.get(*name))
                        == Some(*value)
                })
                .map(|(name, _)| name.clone())
                .collect(),
            helper: RefCell::new(
                EngineSession::create(&helper_manifest.to_string())
                    .map_err(|err| error(err.to_string()))?,
            ),
            target: RefCell::new(
                EngineSession::create(&target_manifest.to_string())
                    .map_err(|err| error(err.to_string()))?,
            ),
            target_manifest: RefCell::new(target_manifest),
            query_definitions: RefCell::new(Default::default()),
            native_alpha: request
                .stylesheets
                .iter()
                .any(|source| native::declares_alpha(source)),
            families,
            static_families,
            base_unit,
            root_size,
        })
    }

    fn class(&self, source: &str) -> RcClassMigration {
        match self.convert(source) {
            Ok(after) => RcClassMigration {
                before: source.into(),
                status: if after == source {
                    "unchanged"
                } else {
                    "replace"
                },
                after: Some(after),
                notes: Vec::new(),
            },
            Err(note) => RcClassMigration {
                before: source.into(),
                after: None,
                status: "review",
                notes: vec![note],
            },
        }
    }

    fn convert(&self, source: &str) -> Result<String, String> {
        if let Some(name) = self.managed_reference(source) {
            return if name == source {
                Ok(source.into())
            } else {
                Err(format!(
                    "Managed class `{name}` becomes native and cannot derive `{source}`; write the selector/condition explicitly inside its native layer"
                ))
            };
        }
        if self.profile == RcMigrationProfile::RcManaged {
            return Ok(source.into());
        }

        let important = source.ends_with('!');
        let source = source.strip_suffix('!').unwrap_or(source);
        let mut migrated = source.to_owned();
        for (start, end) in conditions::suffixes(source).into_iter().rev() {
            let token = &source[start + 1..end];
            if self.unchanged_conditions.iter().any(|name| name == token)
                || self.modes.iter().any(|mode| mode == token)
                || self.original["variants"]
                    .as_array()
                    .into_iter()
                    .flatten()
                    .any(|variant| variant["token"] == format!("@{token}"))
            {
                continue;
            }
            // A complete query is also the idempotent target of migration.
            let complete = self.native_profile()
                || token.split_once('(').is_some_and(|(_, body)| {
                    body.starts_with('(')
                        || body.starts_with("selector(")
                        || body.starts_with("style(")
                });
            let query = if complete {
                token.into()
            } else {
                conditions::decode(&self.original, token)?
            };
            let query = self.query(&query)?;
            migrated.replace_range(start + 1..end, &query);
        }
        if important {
            migrated.push('!');
        }
        self.convert_declaration(&migrated)
    }

    fn convert_declaration(&self, source: &str) -> Result<String, String> {
        if source.contains("${") || source.contains("{{") {
            return Err("Dynamic class construction cannot be migrated safely".into());
        }
        if source.starts_with('{') {
            return self.group(source);
        }
        if matches!(
            self.profile,
            RcMigrationProfile::RcNamed | RcMigrationProfile::RcNative
        ) {
            let diagnostics = self
                .target
                .borrow()
                .inspect(source)
                .map_err(|error| error.to_string())?
                .diagnostics;
            if let Some(diagnostic) = diagnostics.first() {
                return Err(diagnostic.message.clone());
            }
            return Ok(source.into());
        }
        for family in &self.static_families {
            if let Some(rest) = source.strip_prefix(&family.source_prefix) {
                let rules = self.rules(&self.helper, &format!("{}{rest}", family.probe_prefix));
                if !rules.is_empty() {
                    self.equivalent(&rules, source, false)?;
                    return Ok(source.into());
                }
            }
        }
        let Some((key, rest)) = source.split_once(':') else {
            return Ok(source.into());
        };
        // Existing static and enum names (including their states) stay reserved.
        if self
            .target
            .borrow()
            .inspect_class_semantics(source)
            .is_ok_and(|semantic| {
                matches!(
                    semantic.kind,
                    mastercss_engine::ClassSemanticKind::Semantic
                        | mastercss_engine::ClassSemanticKind::Pattern
                        | mastercss_engine::ClassSemanticKind::Token
                        | mastercss_engine::ClassSemanticKind::Component
                )
            })
        {
            return Ok(source.into());
        }
        let (value, suffix) = values::split_rc_value_state(rest);
        if value.is_empty() {
            return Ok(source.into());
        }
        for family in self.families.iter().filter(|family| family.key == key) {
            let token_probe = token_class(&family.token, &value, &suffix);
            let token_rules = self.rules(&self.helper, &token_probe);
            if !token_rules.is_empty() && !value.contains('$') {
                let candidate = token_class(key, &value, &suffix);
                self.equivalent(&token_rules, &candidate, true)?;
                return Ok(candidate);
            }
            let probe_value = self.rewrite_value(&value, None, key == "image-resolution")?;
            let probe = format!("{}:{probe_value}{suffix}", family.probe);
            if self.rules(&self.helper, &probe).is_empty() {
                continue;
            }
            let rewritten = self.rewrite_value(&value, Some(family), key == "image-resolution")?;
            let old = self.rules(
                &self.helper,
                &format!("{}:{rewritten}{suffix}", family.render),
            );
            let output_key = if key == "line-clamp" && family.managed {
                "clamp-lines".to_owned()
            } else if old.len() == 1 && old[0].declarations.len() == 1 && family.managed {
                let property = &old[0].declarations[0].property;
                let canonical = builtin_key_aliases()
                    .iter()
                    .find_map(|(alias, property)| (*alias == key).then_some(*property))
                    .unwrap_or(key);
                if mastercss_schema::is_native_css_property(canonical) && property != canonical {
                    property.clone()
                } else {
                    key.into()
                }
            } else {
                key.into()
            };
            let candidate = format!("{output_key}:{rewritten}{suffix}");
            self.equivalent(&old, &candidate, candidate != source)?;
            return Ok(candidate);
        }
        // Native properties not in the token registry still used the global
        // shortcut and length converter in RC. They have no managed intent.
        let rewritten = self.rewrite_value(&value, None, key == "image-resolution")?;
        let candidate = format!("{key}:{rewritten}{suffix}");
        if candidate != source
            && !mastercss_schema::is_native_css_property(key)
            && !builtin_key_aliases().iter().any(|(alias, _)| *alias == key)
        {
            return Err("Custom utility has no provable equivalent in the target manifest".into());
        }
        Ok(candidate)
    }

    fn rules(&self, engine: &RefCell<EngineSession>, class: &str) -> Vec<EngineCompositionRuleIr> {
        let mut engine = engine.borrow_mut();
        if engine.ensure_class_rules([class]).is_err() {
            return Vec::new();
        }
        let rules = engine.composition_rules(class).unwrap_or_default();
        // A failed synthetic probe is not an unknown native declaration.
        let rules = if rules.iter().any(|rule| {
            rule.declarations
                .iter()
                .map(|declaration| &declaration.property)
                .any(|property| property.starts_with("migration-"))
        }) {
            Vec::new()
        } else {
            rules
        };
        let _ = engine.delete_class_rules([class]);
        rules
    }

    fn equivalent(
        &self,
        expected: &[EngineCompositionRuleIr],
        candidate: &str,
        validate: bool,
    ) -> Result<(), String> {
        for rule in expected {
            for declaration in &rule.declarations {
                let property = &declaration.property;
                let value = &declaration.value;
                let Some(value) = value.as_str() else {
                    return Err("Cannot validate the saved declaration value".into());
                };
                if validate && !valid_saved_declaration(property, value) {
                    return Err(format!(
                        "Cannot validate saved CSS {property}:{value}; review the original browser behavior before migrating"
                    ));
                }
            }
        }
        let actual = self.rules(&self.target, candidate);
        if !expected.is_empty()
            && expected.len() == actual.len()
            && expected.iter().zip(&actual).all(|(a, b)| {
                a.declarations == b.declarations
                    && a.layer == b.layer
                    && a.selector == b.selector
                    && a.conditions == b.conditions
            })
        {
            return Ok(());
        }
        let diagnostics = self
            .target
            .borrow()
            .inspect(candidate)
            .ok()
            .map(|inspection| inspection.diagnostics)
            .unwrap_or_default();
        Err(diagnostics.first().map(|diagnostic| diagnostic.message.clone())
            .unwrap_or_else(|| format!("Cannot prove equivalent declarations for {candidate}; migrate the custom utility or choose an explicit property name")))
    }

    fn overlap(&self, a: &str, b: &str) -> bool {
        self.rules(&self.target, a).iter().any(|a| {
            self.rules(&self.target, b).iter().any(|b| {
                a.layer == b.layer
                    && a.selector == b.selector
                    && a.conditions == b.conditions
                    && a.declarations
                        .iter()
                        .map(|declaration| &declaration.property)
                        .any(|a| {
                            b.declarations
                                .iter()
                                .map(|declaration| &declaration.property)
                                .any(|b| properties_overlap(a, b))
                        })
            })
        })
    }

    fn group(&self, source: &str) -> Result<String, String> {
        let parts = values::group_parts(source).ok_or("Unbalanced declaration group")?;
        let mut converted = Vec::new();
        for part in &parts.0 {
            converted.push(self.convert(part)?);
        }
        for (index, a) in converted.iter().enumerate() {
            if converted[index + 1..].iter().any(|b| self.overlap(a, b)) {
                return Err(
                    "Group has overlapping declarations; review cascade order manually".into(),
                );
            }
        }
        Ok(format!("{{{}}}{}", converted.join(";"), parts.1))
    }
}

fn token_class(prefix: &str, value: &str, suffix: &str) -> String {
    let (sign, value) = value
        .strip_prefix('-')
        .map_or(("", value), |value| ("-", value));
    format!("{sign}{prefix}-{value}{suffix}")
}

fn add_family(
    utilities: &mut Vec<Value>,
    families: &mut Vec<Family>,
    key: &str,
    original: &Value,
    managed: bool,
) {
    let index = families.len();
    let token = format!("migration-token-{index}");
    let probe = format!("migration-probe-{index}");
    let render = format!("migration-render-{index}");
    let resolver = format!("migration-resolve-{index}");
    let matchers = original["matchers"].as_array().unwrap();
    let token_allowed = !managed
        || matchers
            .iter()
            .any(|matcher| matcher["type"] == "variable" || matcher["type"] == "key");
    let raw_allowed = matchers
        .iter()
        .any(|matcher| matcher["type"] == "key" || matcher["type"] == "value");
    for (name, matcher, generic) in [
        (
            &token,
            json!({"type":"token","prefix":format!("{token}-")}),
            false,
        ),
        (
            &probe,
            json!({"type":if original.get("kind").is_some() {"value"} else {"key"},"keys":[probe]}),
            false,
        ),
        (&render, json!({"type":"key","keys":[render]}), false),
        (
            &resolver,
            json!({"type":"token","prefix":format!("{resolver}-")}),
            true,
        ),
    ] {
        if (name == &token && !token_allowed) || (name == &probe && !raw_allowed) {
            continue;
        }
        let mut utility = original.clone();
        utility["id"] = json!(name);
        utility["matchers"] = json!([matcher]);
        if generic {
            utility["emit"] = json!({"type":"property","property":"margin"});
        }
        utilities.push(utility);
    }
    families.push(Family {
        key: key.into(),
        token,
        probe,
        render,
        resolver,
        managed,
    });
}

/// Equivalence requires usable CSS, not merely equal strings. Unknown future
/// syntax is left for review; variable substitution stays a browser concern.
fn valid_saved_declaration(property: &str, value: &str) -> bool {
    use lightningcss::declaration::DeclarationBlock;
    use lightningcss::properties::Property;
    use lightningcss::stylesheet::ParserOptions;
    if property.starts_with("--") {
        return true;
    }
    let value = value.strip_suffix("!important").unwrap_or(value).trim();
    if property == "-webkit-line-clamp" && value.parse::<u32>().is_ok_and(|value| value > 0) {
        return true;
    }
    if property == "content" {
        let mut input = cssparser::ParserInput::new(value);
        if cssparser::Parser::new(&mut input)
            .parse_entirely(|parser| {
                parser
                    .expect_string()
                    .map(|_| ())
                    .map_err(cssparser::ParseError::<()>::from)
            })
            .is_ok()
        {
            return true;
        }
    }
    let source = format!("{property}:{value}");
    let Ok(block) = DeclarationBlock::parse_string(&source, ParserOptions::default()) else {
        return false;
    };
    !block.declarations.is_empty()
        && block
            .declarations
            .iter()
            .all(|declaration| match declaration {
                Property::Unparsed(_) | Property::Custom(_) => {
                    ["var(", "env(", "attr("]
                        .iter()
                        .any(|function| value.contains(function))
                        || matches!(
                            value,
                            "initial" | "inherit" | "unset" | "revert" | "revert-layer"
                        )
                }
                _ => true,
            })
}

// Expand native shorthands before checking overlap. Logical and physical axes
// may address the same side depending on writing-mode, so require review.
fn properties_overlap(a: &str, b: &str) -> bool {
    use lightningcss::properties::PropertyId;
    use lightningcss::traits::ToCss;
    fn leaves(property: PropertyId<'_>) -> Vec<String> {
        if let Some(longhands) = property.longhands() {
            longhands.into_iter().flat_map(leaves).collect()
        } else {
            vec![
                property
                    .to_css_string(Default::default())
                    .unwrap_or_default(),
            ]
        }
    }
    if a == "all" || b == "all" {
        return !a.starts_with("--") && !b.starts_with("--");
    }
    let a = leaves(PropertyId::from(a));
    let b = leaves(PropertyId::from(b));
    a.iter().any(|a| {
        b.iter().any(|b| {
            if a == b {
                return true;
            }
            let logical =
                |property: &str| property.contains("-inline") || property.contains("-block");
            if !logical(a) && !logical(b) {
                return false;
            }
            ["margin", "padding", "border", "inset"]
                .iter()
                .any(|family| a.starts_with(family) && b.starts_with(family))
                || [a, b].iter().all(|property| {
                    matches!(
                        property.as_str(),
                        "width" | "height" | "inline-size" | "block-size"
                    )
                })
                || [a, b].iter().all(|property| {
                    matches!(property.as_str(), "top" | "right" | "bottom" | "left")
                        || property.starts_with("inset-")
                })
        })
    })
}
