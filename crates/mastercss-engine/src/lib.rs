#![forbid(unsafe_code)]

use std::cmp::Ordering;
use std::collections::{HashMap, HashSet};

use mastercss_lexer::css_escape;
use mastercss_schema::{
    Diagnostic, EmittedGlobals, EngineInspectionIr, EngineSnapshotIr, EngineTransitionIr,
    ErrorCode, GeneratedRuleIr, GeneratedRuleNodeIr, MasterCssManifest,
    NativeDeclarationCandidateIr, RuleMutationIr, RulePriorityIr, RuleTarget, UtilityLayerName,
};
use serde::Deserialize;
use serde_json::{Map, Value};
use thiserror::Error;

const LAYER_COUNT: usize = 4;
const JS_MAX_SAFE_INTEGER: f64 = 9_007_199_254_740_991.0;
type ConditionFeature = (String, f64, f64);

#[derive(Debug, Error)]
pub enum EngineError {
    #[error(transparent)]
    Schema(#[from] mastercss_schema::SchemaError),
    #[error("Invalid MasterCSSManifest engine field: {0}")]
    InvalidManifest(String),
    #[error("Invalid Master CSS emitted globals JSON: {0}")]
    InvalidEmittedGlobals(String),
    #[error("Master CSS engine session has been disposed.")]
    SessionDisposed,
}

impl EngineError {
    pub fn diagnostic(&self) -> Diagnostic {
        let code = match self {
            Self::Schema(error) => error.code(),
            Self::InvalidManifest(_) => ErrorCode::InvalidManifest,
            Self::InvalidEmittedGlobals(_) => ErrorCode::InvalidInput,
            Self::SessionDisposed => ErrorCode::SessionDisposed,
        };
        Diagnostic {
            code,
            message: self.to_string(),
            source: None,
            range: None,
            notes: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ManifestProjection {
    version: u32,
    #[serde(default)]
    settings: EngineSettings,
    #[serde(default)]
    utilities: Vec<UtilityDefinition>,
    #[serde(default)]
    variants: Vec<ManifestVariant>,
    #[serde(default)]
    conditions: HashMap<String, ManifestCondition>,
    #[serde(default, rename = "breakpointConditions")]
    breakpoint_conditions: HashMap<String, ManifestCondition>,
    #[serde(default, rename = "containerConditions")]
    container_conditions: HashMap<String, ManifestCondition>,
    #[serde(default)]
    selectors: HashMap<String, Vec<ManifestSelectorNode>>,
    #[serde(default)]
    variables: Map<String, Value>,
    #[serde(default)]
    animations: Map<String, Value>,
    #[serde(default, rename = "animationOptions")]
    animation_options: HashMap<String, AnimationOptions>,
    #[serde(skip)]
    compiled_variables: HashMap<String, CompiledVariable>,
    #[serde(skip)]
    compiled_variable_order: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct EngineSettings {
    #[serde(default = "default_root_size")]
    root_size: f64,
    #[serde(default = "default_base_unit")]
    base_unit: f64,
    #[serde(default)]
    scope: Option<String>,
    #[serde(default)]
    important: bool,
    #[serde(default = "default_mode", rename = "defaultMode")]
    default_mode: String,
    #[serde(default = "default_mode_trigger")]
    mode_trigger: String,
    #[serde(default = "default_modes")]
    modes: Vec<String>,
}

impl Default for EngineSettings {
    fn default() -> Self {
        Self {
            root_size: default_root_size(),
            base_unit: default_base_unit(),
            scope: None,
            important: false,
            default_mode: default_mode(),
            mode_trigger: default_mode_trigger(),
            modes: default_modes(),
        }
    }
}

fn default_root_size() -> f64 {
    16.0
}

fn default_base_unit() -> f64 {
    4.0
}

fn default_mode() -> String {
    "light".into()
}

fn default_mode_trigger() -> String {
    "media".into()
}

fn default_modes() -> Vec<String> {
    vec!["light".into(), "dark".into()]
}

#[derive(Debug, Clone, Deserialize)]
struct ManifestCondition {
    id: String,
    #[serde(default)]
    nodes: Vec<Value>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ManifestSelectorNode {
    #[serde(default, rename = "type")]
    node_type: Option<String>,
    #[serde(default)]
    value: Option<String>,
    #[serde(default)]
    children: Vec<ManifestSelectorNode>,
}

#[derive(Debug, Clone, Deserialize)]
struct ManifestVariant {
    token: String,
    #[serde(default)]
    branches: Vec<ManifestVariantBranch>,
}

#[derive(Debug, Clone, Default, Deserialize)]
struct AnimationOptions {
    #[serde(default, rename = "static")]
    static_resource: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ManifestVariantBranch {
    #[serde(default)]
    selector: Option<String>,
    #[serde(default)]
    selector_nodes: Vec<ManifestSelectorNode>,
    #[serde(default)]
    conditions: Vec<String>,
    #[serde(default)]
    condition_nodes: Vec<ManifestCondition>,
    #[serde(default)]
    layer: Option<UtilityLayerName>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UtilityDefinition {
    id: String,
    #[serde(default)]
    name: Option<String>,
    #[serde(rename = "type")]
    utility_type: i32,
    #[serde(default)]
    order: Option<i32>,
    #[serde(default)]
    layer: UtilityLayerName,
    #[serde(default)]
    kind: Option<String>,
    #[serde(default, rename = "variableAliases")]
    variable_aliases: Vec<(String, String)>,
    #[serde(default, rename = "variableAliasRefs")]
    variable_alias_refs: Vec<String>,
    #[serde(skip)]
    variables: HashMap<String, String>,
    #[serde(skip)]
    native_fallback: bool,
    emit: UtilityEmit,
    #[serde(default)]
    matchers: Vec<UtilityMatcher>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
enum UtilityMatcher {
    Static {
        name: String,
    },
    Pattern {
        prefix: String,
        values: Vec<String>,
        #[serde(default, rename = "valueMap")]
        value_map: HashMap<String, String>,
    },
    Key {
        keys: Vec<String>,
    },
    Variable {
        keys: Vec<String>,
        #[serde(default)]
        segments: Option<String>,
    },
    Value {
        keys: Vec<String>,
        #[serde(default)]
        segments: Option<String>,
    },
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
enum UtilityEmit {
    Static { rules: Vec<StaticUtilityRule> },
    Property { property: String },
    Template { declarations: Map<String, Value> },
    Declarations { declarations: Vec<String> },
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StaticUtilityRule {
    declarations: Map<String, Value>,
    #[serde(default)]
    selector: Option<String>,
    #[serde(default)]
    conditions: Vec<String>,
}

#[derive(Debug, Clone)]
struct UtilityMatch {
    value: Option<String>,
    state_token: String,
    variable_names: Vec<String>,
}

#[derive(Debug, Clone)]
struct CompiledVariable {
    name: String,
    namespace: String,
    value: Option<String>,
    modes: Vec<CompiledVariableMode>,
    variable_type: String,
    dependencies: Vec<String>,
    inline: bool,
    static_resource: bool,
}

#[derive(Debug, Clone)]
struct CompiledVariableMode {
    name: String,
    value: String,
}

#[derive(Debug, Clone, Default)]
struct StateBranch {
    key: String,
    selector_template: Option<String>,
    condition_wrappers: Vec<(String, String)>,
    layer: Option<UtilityLayerName>,
    mode: Option<String>,
    important: bool,
    features: Vec<ConditionFeature>,
}

#[derive(Debug, Clone)]
struct StoredRule {
    ir: GeneratedRuleIr,
    manifest_order: i32,
    declarations: String,
}

#[derive(Debug)]
struct ThemeBucket {
    media_text: String,
    selector_text: String,
    mode: Option<String>,
    order: usize,
    declarations: Vec<String>,
}

struct NativeDeclarationCandidate {
    ir: NativeDeclarationCandidateIr,
    match_name: String,
}

#[derive(Debug)]
pub struct EngineSession {
    manifest: MasterCssManifest,
    compiled: ManifestProjection,
    layers: [Vec<StoredRule>; LAYER_COUNT],
    class_rules: HashMap<String, Vec<(UtilityLayerName, String)>>,
    class_order: Vec<String>,
    rule_counts: HashMap<(UtilityLayerName, String), u32>,
    emitted_globals: EmittedGlobals,
    variable_counts: HashMap<String, u32>,
    theme_variable_names: Vec<String>,
    animation_counts: HashMap<String, u32>,
    animation_names: Vec<String>,
    disposed: bool,
}

impl EngineSession {
    pub fn create(manifest_json: &str) -> Result<Self, EngineError> {
        Self::create_with_emitted_globals(manifest_json, None)
    }

    pub fn create_with_emitted_globals(
        manifest_json: &str,
        emitted_globals_json: Option<&str>,
    ) -> Result<Self, EngineError> {
        let manifest = MasterCssManifest::parse(manifest_json)?;
        let compiled = compile_manifest(&manifest)?;
        let emitted_globals = emitted_globals_json
            .map(EmittedGlobals::parse)
            .transpose()
            .map_err(|error| EngineError::InvalidEmittedGlobals(error.to_string()))?
            .unwrap_or_default();
        let mut session = Self {
            manifest,
            compiled,
            layers: std::array::from_fn(|_| Vec::new()),
            class_rules: HashMap::new(),
            class_order: Vec::new(),
            rule_counts: HashMap::new(),
            emitted_globals,
            variable_counts: HashMap::new(),
            theme_variable_names: Vec::new(),
            animation_counts: HashMap::new(),
            animation_names: Vec::new(),
            disposed: false,
        };
        session.initialize_variable_resources();
        session.initialize_animation_resources();
        Ok(session)
    }

    pub fn manifest_json(&self) -> Result<String, EngineError> {
        self.ensure_active()?;
        Ok(self.manifest.to_json()?)
    }

    pub fn ensure_class_rules<I, S>(
        &mut self,
        class_names: I,
    ) -> Result<EngineTransitionIr, EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        self.ensure_active()?;
        let mut mutations = Vec::new();
        for class_name in class_names {
            let class_name = class_name.as_ref();
            if class_name.is_empty() || self.class_rules.contains_key(class_name) {
                continue;
            }
            let generated = self.generate_class_rules(class_name);
            if generated.is_empty() {
                continue;
            }
            let mut class_rule_keys = Vec::with_capacity(generated.len());
            for rule in generated {
                let layer = rule.ir.layer;
                let reference = (layer, rule.ir.key.clone());
                if let Some(count) = self.rule_counts.get_mut(&reference) {
                    *count += 1;
                    class_rule_keys.push(reference);
                    continue;
                }
                self.register_rule_variables(&rule.ir.variable_names, &mut mutations);
                let layer_rules = &mut self.layers[layer_index(layer)];
                let index = layer_rules
                    .binary_search_by(|existing| compare_stored_rules(existing, &rule))
                    .unwrap_or_else(|index| index);
                layer_rules.insert(index, rule.clone());
                class_rule_keys.push(reference.clone());
                self.rule_counts.insert(reference, 1);
                mutations.push(RuleMutationIr::Insert {
                    target: layer.into(),
                    index: index as u32,
                    key: rule.ir.key.clone(),
                    text: rule.ir.text.clone(),
                    rule: Some(Box::new(rule.ir)),
                });
                let animation_names = layer_rules[index].ir.animation_names.clone();
                self.register_rule_animations(&animation_names, &mut mutations);
            }
            if !class_rule_keys.is_empty() {
                self.class_order.push(class_name.to_owned());
                self.class_rules
                    .insert(class_name.to_owned(), class_rule_keys);
            }
        }
        Ok(EngineTransitionIr::new(mutations))
    }

    pub fn delete_class_rules<I, S>(
        &mut self,
        class_names: I,
    ) -> Result<EngineTransitionIr, EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        self.ensure_active()?;
        let mut mutations = Vec::new();
        for class_name in class_names {
            let class_name = class_name.as_ref();
            let Some(keys) = self.class_rules.remove(class_name) else {
                continue;
            };
            for (layer, key) in keys.into_iter().rev() {
                let reference = (layer, key.clone());
                let should_remove = match self.rule_counts.get_mut(&reference) {
                    Some(count) if *count > 1 => {
                        *count -= 1;
                        false
                    }
                    Some(_) => true,
                    None => false,
                };
                if !should_remove {
                    continue;
                }
                self.rule_counts.remove(&reference);
                let rules = &mut self.layers[layer_index(layer)];
                let Some(index) = rules.iter().position(|rule| rule.ir.key == key) else {
                    continue;
                };
                let rule = rules.remove(index);
                mutations.push(RuleMutationIr::Delete {
                    target: RuleTarget::from(layer),
                    index: index as u32,
                    key,
                });
                self.unregister_rule_variables(&rule.ir.variable_names, &mut mutations);
                self.unregister_rule_animations(&rule.ir.animation_names, &mut mutations);
            }
            self.class_order
                .retain(|connected_class_name| connected_class_name != class_name);
        }
        Ok(EngineTransitionIr::new(mutations))
    }

    pub fn native_declaration_candidates<I, S>(
        &self,
        class_names: I,
    ) -> Result<Vec<NativeDeclarationCandidateIr>, EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        self.ensure_active()?;
        Ok(class_names
            .into_iter()
            .flat_map(|class_name| {
                self.native_declaration_candidates_for_class(class_name.as_ref())
                    .into_iter()
                    .map(|candidate| candidate.ir)
            })
            .collect())
    }

    pub fn ensure_class_rules_with_native_support<I, S>(
        &mut self,
        class_names: I,
        supported: &[bool],
    ) -> Result<EngineTransitionIr, EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        self.ensure_active()?;
        let class_names = class_names
            .into_iter()
            .map(|class_name| class_name.as_ref().to_owned())
            .collect::<Vec<_>>();
        let candidates = class_names
            .iter()
            .flat_map(|class_name| self.native_declaration_candidates_for_class(class_name))
            .collect::<Vec<_>>();
        for (candidate, supported) in candidates.into_iter().zip(supported.iter().copied()) {
            if !supported {
                continue;
            }
            let id = format!("native:{}\0{}", candidate.ir.property, candidate.ir.value);
            if self
                .compiled
                .utilities
                .iter()
                .any(|utility| utility.id == id)
            {
                continue;
            }
            let mut declarations = Map::new();
            declarations.insert(
                candidate.ir.property.clone(),
                Value::String(candidate.ir.value),
            );
            self.compiled.utilities.push(UtilityDefinition {
                id,
                name: Some(candidate.match_name.clone()),
                utility_type: if is_native_shorthand_property(&candidate.ir.property) {
                    -1
                } else {
                    0
                },
                order: Some(0),
                layer: UtilityLayerName::Utilities,
                kind: None,
                variable_aliases: Vec::new(),
                variable_alias_refs: Vec::new(),
                variables: HashMap::new(),
                native_fallback: true,
                emit: UtilityEmit::Static {
                    rules: vec![StaticUtilityRule {
                        declarations,
                        selector: None,
                        conditions: Vec::new(),
                    }],
                },
                matchers: vec![UtilityMatcher::Static {
                    name: candidate.match_name,
                }],
            });
        }
        self.ensure_class_rules(class_names)
    }

    pub fn ensure_stylesheet_resources(
        &mut self,
        native_css: &str,
    ) -> Result<EngineTransitionIr, EngineError> {
        self.ensure_active()?;
        let mut mutations = Vec::new();
        let native_animation_names = collect_stylesheet_keyframe_names(native_css);
        for name in &native_animation_names {
            let count = self.emitted_globals.animation_count(name);
            self.emitted_globals
                .animations
                .insert(name.clone(), Value::from(count.saturating_add(1)));
            if let Some(index) = self
                .animation_names
                .iter()
                .position(|animation_name| animation_name == name)
            {
                self.animation_names.remove(index);
                mutations.push(RuleMutationIr::Delete {
                    target: RuleTarget::Keyframes,
                    index: index as u32,
                    key: name.clone(),
                });
            }
        }

        let variable_names = collect_stylesheet_variable_names(native_css)
            .into_iter()
            .filter(|name| self.compiled.compiled_variables.contains_key(name))
            .collect::<Vec<_>>();
        for variable_name in &variable_names {
            self.register_variable(variable_name, &mut mutations, &mut HashSet::new());
        }

        let animation_declarations = collect_stylesheet_animation_declarations(native_css);
        let animation_names = collect_stylesheet_animation_names(
            &animation_declarations,
            &variable_names,
            &self.compiled,
        )
        .into_iter()
        .filter(|name| !native_animation_names.contains(name))
        .collect::<Vec<_>>();
        self.register_rule_animations(&animation_names, &mut mutations);
        Ok(EngineTransitionIr::new(mutations))
    }

    pub fn emitted_globals_snapshot(&self) -> Result<EmittedGlobals, EngineError> {
        self.ensure_active()?;
        let mut emitted_globals = self.emitted_globals.clone();
        for name in &self.theme_variable_names {
            emitted_globals
                .variables
                .entry(name.clone())
                .or_insert_with(|| Value::from(1));
        }
        for name in &self.animation_names {
            emitted_globals
                .animations
                .entry(name.clone())
                .or_insert_with(|| Value::from(1));
        }
        Ok(emitted_globals)
    }

    pub fn refresh(&mut self, manifest_json: &str) -> Result<EngineTransitionIr, EngineError> {
        self.ensure_active()?;
        let manifest = MasterCssManifest::parse(manifest_json)?;
        let compiled = compile_manifest(&manifest)?;
        let connected_classes = self.class_order.clone();
        let mut mutations = Vec::new();
        for layer in UTILITY_LAYERS.into_iter().rev() {
            let rules = &mut self.layers[layer_index(layer)];
            for index in (0..rules.len()).rev() {
                let rule = rules.remove(index);
                mutations.push(RuleMutationIr::Delete {
                    target: layer.into(),
                    index: index as u32,
                    key: rule.ir.key,
                });
            }
        }
        for index in (0..self.animation_names.len()).rev() {
            let name = self.animation_names[index].clone();
            mutations.push(RuleMutationIr::Delete {
                target: RuleTarget::Keyframes,
                index: index as u32,
                key: name,
            });
        }
        let previous_theme_text = self.theme_rule_text();
        self.variable_counts.clear();
        self.theme_variable_names.clear();
        self.animation_counts.clear();
        self.animation_names.clear();
        if previous_theme_text.is_some() {
            mutations.push(RuleMutationIr::Delete {
                target: RuleTarget::Theme,
                index: 0,
                key: "theme:root".into(),
            });
        }
        self.compiled = compiled;
        self.manifest = manifest;
        self.class_rules.clear();
        self.class_order.clear();
        self.rule_counts.clear();
        self.initialize_variable_resources();
        self.initialize_animation_resources();
        if let Some(text) = self.theme_rule_text() {
            mutations.push(RuleMutationIr::Insert {
                target: RuleTarget::Theme,
                index: 0,
                key: "theme:root".into(),
                text,
                rule: None,
            });
        }
        for (index, name) in self.animation_names.iter().enumerate() {
            if let Some(text) = self.keyframe_text(name) {
                mutations.push(RuleMutationIr::Insert {
                    target: RuleTarget::Keyframes,
                    index: index as u32,
                    key: name.clone(),
                    text,
                    rule: None,
                });
            }
        }
        mutations.extend(self.ensure_class_rules(connected_classes)?.mutations);
        Ok(EngineTransitionIr::new(mutations))
    }

    pub fn snapshot(&self) -> Result<EngineSnapshotIr, EngineError> {
        self.ensure_active()?;
        let rules = UTILITY_LAYERS
            .iter()
            .flat_map(|layer| self.layers[layer_index(*layer)].iter())
            .map(|rule| rule.ir.clone())
            .collect();
        Ok(EngineSnapshotIr {
            version: 1,
            rules,
            text: self.css_text(),
        })
    }

    pub fn inspect(&self, class_name: &str) -> Result<EngineInspectionIr, EngineError> {
        self.ensure_active()?;
        let rules = self
            .generate_class_rules(class_name)
            .into_iter()
            .map(|rule| rule.ir)
            .collect::<Vec<_>>();
        Ok(EngineInspectionIr {
            version: 1,
            class_name: class_name.to_owned(),
            valid: !rules.is_empty(),
            rules,
        })
    }

    pub fn css_text(&self) -> String {
        let mut output = String::new();
        if let Some(theme) = self.theme_rule_text() {
            output.push_str("@layer theme{");
            output.push_str(&theme);
            output.push('}');
        }
        for layer in UTILITY_LAYERS {
            let rules = &self.layers[layer_index(layer)];
            if rules.is_empty() {
                continue;
            }
            output.push_str("@layer ");
            output.push_str(layer_name(layer));
            output.push('{');
            for rule in rules {
                output.push_str(&rule.ir.text);
            }
            output.push('}');
        }
        for name in &self.animation_names {
            if let Some(keyframes) = self.keyframe_text(name) {
                output.push_str(&keyframes);
            }
        }
        output
    }

    pub fn dispose(&mut self) {
        self.layers.iter_mut().for_each(Vec::clear);
        self.class_rules.clear();
        self.class_order.clear();
        self.rule_counts.clear();
        self.variable_counts.clear();
        self.theme_variable_names.clear();
        self.animation_counts.clear();
        self.animation_names.clear();
        self.disposed = true;
    }

    fn ensure_active(&self) -> Result<(), EngineError> {
        if self.disposed {
            Err(EngineError::SessionDisposed)
        } else {
            Ok(())
        }
    }

    fn theme_rule_text(&self) -> Option<String> {
        let mut buckets = Vec::<ThemeBucket>::new();
        for name in &self.theme_variable_names {
            let Some(variable) = self.compiled.compiled_variables.get(name) else {
                continue;
            };
            if let Some(value) = &variable.value {
                push_theme_declaration(
                    &mut buckets,
                    "",
                    ":root",
                    None,
                    format!("--{name}:{value}"),
                );
            }
            if self.compiled.settings.mode_trigger.is_empty() {
                continue;
            }
            for mode in &variable.modes {
                let is_default_mode = variable.value.is_none()
                    && self.compiled.settings.default_mode != "none"
                    && self.compiled.settings.default_mode == mode.name;
                let (media_text, selector_text) = match self.compiled.settings.mode_trigger.as_str()
                {
                    "class" => (
                        "".to_owned(),
                        format!(
                            ".{}{}",
                            mode.name,
                            if is_default_mode { ",:root" } else { "" }
                        ),
                    ),
                    "host" => (
                        "".to_owned(),
                        format!(
                            ":host(.{}){}",
                            mode.name,
                            if is_default_mode { ",:host" } else { "" }
                        ),
                    ),
                    _ => (
                        format!("@media (prefers-color-scheme:{})", mode.name),
                        ":root".to_owned(),
                    ),
                };
                push_theme_declaration(
                    &mut buckets,
                    &media_text,
                    &selector_text,
                    Some(&mode.name),
                    format!("--{name}:{}", mode.value),
                );
            }
        }
        buckets.sort_by(|left, right| {
            theme_bucket_rank(left)
                .cmp(&theme_bucket_rank(right))
                .then_with(|| left.order.cmp(&right.order))
        });
        let text = buckets
            .into_iter()
            .map(|bucket| {
                let mut declarations = Vec::new();
                if matches!(
                    self.compiled.settings.mode_trigger.as_str(),
                    "class" | "host"
                ) && bucket.media_text.is_empty()
                    && matches!(bucket.mode.as_deref(), Some("light" | "dark"))
                {
                    declarations.push(format!(
                        "color-scheme:{}",
                        bucket.mode.as_deref().unwrap_or_default()
                    ));
                }
                declarations.extend(bucket.declarations);
                let rule = format!("{}{{{}}}", bucket.selector_text, declarations.join(";"));
                if bucket.media_text.is_empty() {
                    rule
                } else {
                    format!("{}{{{rule}}}", bucket.media_text)
                }
            })
            .collect::<String>();
        (!text.is_empty()).then_some(text)
    }

    fn initialize_variable_resources(&mut self) {
        for (name, count) in &self.emitted_globals.variables {
            let count = count
                .as_u64()
                .and_then(|value| u32::try_from(value).ok())
                .unwrap_or_default();
            if count > 0 {
                self.variable_counts.insert(name.clone(), count);
            }
        }
        let static_variables = self
            .compiled
            .compiled_variable_order
            .iter()
            .filter(|name| {
                self.compiled
                    .compiled_variables
                    .get(*name)
                    .is_some_and(|variable| variable.static_resource && !variable.inline)
                    && self.emitted_globals.variable_count(name) == 0
            })
            .cloned()
            .collect::<Vec<_>>();
        for variable_name in static_variables {
            *self
                .variable_counts
                .entry(variable_name.clone())
                .or_default() += 1;
            self.theme_variable_names.push(variable_name);
        }
    }

    fn initialize_animation_resources(&mut self) {
        for (name, count) in &self.emitted_globals.animations {
            let count = count
                .as_u64()
                .and_then(|value| u32::try_from(value).ok())
                .unwrap_or_default();
            if count > 0 {
                self.animation_counts.insert(name.clone(), count);
            }
        }
        let static_animations = self
            .compiled
            .animations
            .keys()
            .filter(|name| {
                self.compiled
                    .animation_options
                    .get(*name)
                    .is_some_and(|options| options.static_resource)
            })
            .cloned()
            .collect::<Vec<_>>();
        for name in static_animations {
            if self.emitted_globals.animation_count(&name) == 0 {
                *self.animation_counts.entry(name.clone()).or_default() += 1;
                self.animation_names.push(name.clone());
            }
            let mut ignored = Vec::new();
            for variable_name in self.keyframe_variable_names(&name) {
                self.register_variable(&variable_name, &mut ignored, &mut HashSet::new());
            }
        }
    }

    fn keyframe_text(&self, name: &str) -> Option<String> {
        let frames = self.compiled.animations.get(name)?.as_object()?;
        let mut text = format!("@keyframes {name}{{");
        for (selector, declarations) in frames {
            let declarations = declarations.as_object()?;
            text.push_str(selector);
            text.push('{');
            for (index, (property, value)) in declarations.iter().enumerate() {
                if index > 0 {
                    text.push(';');
                }
                text.push_str(property);
                text.push(':');
                text.push_str(&serialize_literal_value(value)?);
            }
            text.push('}');
        }
        text.push('}');
        Some(text)
    }

    fn parse_native_declaration_candidate(
        &self,
        class_name: &str,
    ) -> Option<NativeDeclarationCandidate> {
        let semantic_class_name = class_name.strip_suffix('!').unwrap_or(class_name);
        let colon = semantic_class_name.find(':')?;
        let source_property = &semantic_class_name[..colon];
        if !is_valid_native_property(source_property) {
            return None;
        }
        let property = builtin_key_alias(source_property).unwrap_or(source_property);
        if !is_valid_native_property(property) {
            return None;
        }
        let (raw_value, _) = split_dynamic_value_state(&semantic_class_name[colon + 1..]);
        if raw_value.is_empty() {
            return None;
        }
        let value = normalize_unmanaged_value(&raw_value, &self.compiled.settings);
        Some(NativeDeclarationCandidate {
            ir: NativeDeclarationCandidateIr {
                class_name: class_name.to_owned(),
                property: property.to_owned(),
                value,
            },
            match_name: format!("{property}:{raw_value}"),
        })
    }

    fn native_declaration_candidates_for_class(
        &self,
        class_name: &str,
    ) -> Vec<NativeDeclarationCandidate> {
        if self.class_rules.contains_key(class_name) {
            return Vec::new();
        }
        if let Some(body) = class_name.strip_prefix('{')
            && let Some(close) = find_group_close(body)
        {
            return split_top_level(&body[..close], ';')
                .into_iter()
                .filter(|nested_class| !nested_class.is_empty())
                .flat_map(|nested_class| {
                    self.native_declaration_candidates_for_class(&nested_class)
                })
                .collect();
        }
        if !self.generate_class_rules(class_name).is_empty() {
            return Vec::new();
        }
        self.parse_native_declaration_candidate(class_name)
            .into_iter()
            .collect()
    }

    fn keyframe_variable_names(&self, name: &str) -> Vec<String> {
        let Some(keyframes) = self.compiled.animations.get(name) else {
            return Vec::new();
        };
        collect_css_variable_names(&keyframes.to_string())
            .into_iter()
            .filter(|name| self.compiled.compiled_variables.contains_key(name))
            .collect()
    }

    fn register_rule_animations(
        &mut self,
        animation_names: &[String],
        mutations: &mut Vec<RuleMutationIr>,
    ) {
        for name in animation_names {
            if !self.compiled.animations.contains_key(name) {
                continue;
            }
            let count = self.animation_counts.entry(name.clone()).or_default();
            *count += 1;
            if *count != 1 || self.emitted_globals.animation_count(name) > 0 {
                continue;
            }
            let index = self.animation_names.len();
            self.animation_names.push(name.clone());
            if let Some(text) = self.keyframe_text(name) {
                mutations.push(RuleMutationIr::Insert {
                    target: RuleTarget::Keyframes,
                    index: index as u32,
                    key: name.clone(),
                    text,
                    rule: None,
                });
            }
            for variable_name in self.keyframe_variable_names(name) {
                self.register_variable(&variable_name, mutations, &mut HashSet::new());
            }
        }
    }

    fn unregister_rule_animations(
        &mut self,
        animation_names: &[String],
        mutations: &mut Vec<RuleMutationIr>,
    ) {
        for name in animation_names {
            let remove = match self.animation_counts.get_mut(name) {
                Some(count) if *count > 1 => {
                    *count -= 1;
                    false
                }
                Some(_) => true,
                None => false,
            };
            if !remove {
                continue;
            }
            self.animation_counts.remove(name);
            if let Some(index) = self
                .animation_names
                .iter()
                .position(|animation_name| animation_name == name)
            {
                self.animation_names.remove(index);
                mutations.push(RuleMutationIr::Delete {
                    target: RuleTarget::Keyframes,
                    index: index as u32,
                    key: name.clone(),
                });
                for variable_name in self.keyframe_variable_names(name) {
                    self.unregister_variable(&variable_name, mutations, &mut HashSet::new());
                }
            }
        }
    }

    fn register_rule_variables(
        &mut self,
        variable_names: &[String],
        mutations: &mut Vec<RuleMutationIr>,
    ) {
        for variable_name in variable_names {
            self.register_variable(variable_name, mutations, &mut HashSet::new());
        }
    }

    fn register_variable(
        &mut self,
        variable_name: &str,
        mutations: &mut Vec<RuleMutationIr>,
        visited: &mut HashSet<String>,
    ) {
        if !visited.insert(variable_name.to_owned()) {
            return;
        }
        let Some(variable) = self.compiled.compiled_variables.get(variable_name).cloned() else {
            return;
        };
        if variable.inline {
            return;
        }
        let count = self
            .variable_counts
            .entry(variable_name.to_owned())
            .or_default();
        *count += 1;
        if *count == 1 {
            let previous = self.theme_rule_text();
            self.theme_variable_names.push(variable_name.to_owned());
            self.push_theme_rule_change(previous, mutations);
        }
        for dependency in variable.dependencies {
            self.register_variable(&dependency, mutations, visited);
        }
    }

    fn unregister_rule_variables(
        &mut self,
        variable_names: &[String],
        mutations: &mut Vec<RuleMutationIr>,
    ) {
        for variable_name in variable_names {
            self.unregister_variable(variable_name, mutations, &mut HashSet::new());
        }
    }

    fn unregister_variable(
        &mut self,
        variable_name: &str,
        mutations: &mut Vec<RuleMutationIr>,
        visited: &mut HashSet<String>,
    ) {
        if !visited.insert(variable_name.to_owned()) {
            return;
        }
        let Some(variable) = self.compiled.compiled_variables.get(variable_name).cloned() else {
            return;
        };
        if variable.inline {
            return;
        }
        let previous = self.theme_rule_text();
        let remove = match self.variable_counts.get_mut(variable_name) {
            Some(count) if *count > 1 => {
                *count -= 1;
                false
            }
            Some(_) => true,
            None => false,
        };
        if remove {
            self.variable_counts.remove(variable_name);
            self.theme_variable_names
                .retain(|name| name != variable_name);
            self.push_theme_rule_change(previous, mutations);
        }
        for dependency in variable.dependencies {
            self.unregister_variable(&dependency, mutations, visited);
        }
    }

    fn push_theme_rule_change(
        &self,
        previous: Option<String>,
        mutations: &mut Vec<RuleMutationIr>,
    ) {
        let next = self.theme_rule_text();
        if previous == next {
            return;
        }
        if previous.is_some() {
            mutations.push(RuleMutationIr::Delete {
                target: RuleTarget::Theme,
                index: 0,
                key: "theme:root".into(),
            });
        }
        if let Some(text) = next {
            mutations.push(RuleMutationIr::Insert {
                target: RuleTarget::Theme,
                index: 0,
                key: "theme:root".into(),
                text,
                rule: None,
            });
        }
    }

    fn generate_class_rules(&self, class_name: &str) -> Vec<StoredRule> {
        if let Some(rules) = self.generate_group_rules(class_name) {
            return rules;
        }
        let mut generated = Vec::new();
        let mut seen = HashSet::new();
        let (semantic_class_name, important) = class_name
            .strip_suffix('!')
            .map_or((class_name, false), |name| (name, true));
        let mut matching_class_names = vec![semantic_class_name.to_owned()];
        if let Some(canonical) = canonicalize_class_name(semantic_class_name) {
            matching_class_names.push(canonical);
        }
        for matching_class_name in matching_class_names {
            let generated_before_candidate = generated.len();
            for utility in &self.compiled.utilities {
                if utility.native_fallback && generated.len() > generated_before_candidate {
                    break;
                }
                let Some(matched) = match_utility(&matching_class_name, utility, &self.compiled)
                else {
                    continue;
                };
                let state_branches =
                    resolve_state_branches(&matched.state_token, important, &self.compiled);
                let resolved_value = matched
                    .value
                    .as_deref()
                    .map(|value| normalize_dynamic_value(value, &self.compiled.settings));
                for (branch_index, branch) in state_branches.into_iter().enumerate() {
                    let emitted_rules = emit_declarations(
                        utility,
                        resolved_value.as_deref(),
                        branch.important || self.compiled.settings.important,
                    );
                    if emitted_rules.is_empty() {
                        continue;
                    }
                    let key = if branch_index == 0 && branch.key.is_empty() {
                        class_name.to_owned()
                    } else {
                        format!("{class_name}\0{}", branch.key)
                    };
                    if !seen.insert(key.clone()) {
                        continue;
                    }
                    let selector_text =
                        create_selector_text(class_name, None, &branch, &self.compiled);
                    let mut node_texts = Vec::with_capacity(emitted_rules.len());
                    let mut declaration_texts = Vec::with_capacity(emitted_rules.len());
                    for (_, declarations, selector, rule_conditions) in emitted_rules {
                        let selector_text = create_selector_text(
                            class_name,
                            selector.as_deref(),
                            &branch,
                            &self.compiled,
                        );
                        let mut text = format!("{selector_text}{{{declarations}}}");
                        text = wrap_raw_conditions(text, &rule_conditions);
                        text = wrap_state_conditions(text, &branch.condition_wrappers);
                        node_texts.push(text);
                        declaration_texts.push(declarations);
                    }
                    let text = node_texts.concat();
                    let declarations = declaration_texts.join(";");
                    let mut variable_names = matched.variable_names.clone();
                    for name in collect_css_variable_names(&declarations) {
                        if self.compiled.compiled_variables.contains_key(&name)
                            && !variable_names.contains(&name)
                        {
                            variable_names.push(name);
                        }
                    }
                    let layer = branch.layer.unwrap_or(utility.layer);
                    let sort_tier = if !branch.condition_wrappers.is_empty() {
                        3
                    } else if branch.mode.is_some() {
                        2
                    } else if branch.selector_template.is_some() {
                        1
                    } else {
                        0
                    };
                    let animation_names =
                        collect_animation_names(&declarations, &variable_names, &self.compiled);
                    generated.push(StoredRule {
                        ir: GeneratedRuleIr {
                            class_name: class_name.to_owned(),
                            key,
                            layer,
                            utility_type: utility.utility_type,
                            sort_tier,
                            priority: RulePriorityIr {
                                features: branch.features.clone(),
                                selector: selector_priority(branch.selector_template.as_deref()),
                            },
                            text,
                            nodes: if node_texts.len() > 1 {
                                node_texts
                                    .into_iter()
                                    .map(|text| GeneratedRuleNodeIr { text })
                                    .collect()
                            } else {
                                Vec::new()
                            },
                            selector_text: Some(selector_text),
                            variable_names,
                            animation_names,
                        },
                        manifest_order: utility.order.unwrap_or_default(),
                        declarations,
                    });
                }
            }
            if generated.len() > generated_before_candidate {
                break;
            }
        }
        generated
    }

    fn generate_group_rules(&self, class_name: &str) -> Option<Vec<StoredRule>> {
        let body = class_name.strip_prefix('{')?;
        let close = find_group_close(body)?;
        let declarations_source = &body[..close];
        let state_token = &body[close + 1..];
        let mut declarations = Map::<String, Value>::new();
        let mut variable_names = Vec::new();
        let mut animation_names = Vec::new();
        for nested_class in split_top_level(declarations_source, ';') {
            if nested_class.is_empty() {
                continue;
            }
            for nested_rule in self.generate_class_rules(&nested_class) {
                for declaration in split_top_level(&nested_rule.declarations, ';') {
                    let Some((property, value)) = declaration.split_once(':') else {
                        continue;
                    };
                    declarations.insert(property.to_owned(), Value::String(value.to_owned()));
                }
                for name in nested_rule.ir.variable_names {
                    if !variable_names.contains(&name) {
                        variable_names.push(name);
                    }
                }
                for name in nested_rule.ir.animation_names {
                    if !animation_names.contains(&name) {
                        animation_names.push(name);
                    }
                }
            }
        }
        if declarations.is_empty() {
            return Some(Vec::new());
        }
        let declarations = declarations
            .iter()
            .map(|(property, value)| format!("{property}:{}", value.as_str().unwrap_or_default()))
            .collect::<Vec<_>>()
            .join(";");
        Some(
            resolve_state_branches(state_token, false, &self.compiled)
                .into_iter()
                .enumerate()
                .map(|(branch_index, branch)| {
                    let selector_text =
                        create_selector_text(class_name, None, &branch, &self.compiled);
                    let mut text = format!("{selector_text}{{{declarations}}}");
                    text = wrap_state_conditions(text, &branch.condition_wrappers);
                    let layer = branch.layer.unwrap_or_default();
                    StoredRule {
                        ir: GeneratedRuleIr {
                            class_name: class_name.to_owned(),
                            key: if branch_index == 0 && branch.key.is_empty() {
                                class_name.to_owned()
                            } else {
                                format!("{class_name}\0{}", branch.key)
                            },
                            layer,
                            utility_type: -1,
                            sort_tier: if !branch.condition_wrappers.is_empty() {
                                3
                            } else if branch.mode.is_some() {
                                2
                            } else if branch.selector_template.is_some() {
                                1
                            } else {
                                0
                            },
                            priority: RulePriorityIr {
                                features: branch.features.clone(),
                                selector: selector_priority(branch.selector_template.as_deref()),
                            },
                            text,
                            nodes: Vec::new(),
                            selector_text: Some(selector_text),
                            variable_names: variable_names.clone(),
                            animation_names: animation_names.clone(),
                        },
                        manifest_order: 0,
                        declarations: declarations.clone(),
                    }
                })
                .collect(),
        )
    }
}

const UTILITY_LAYERS: [UtilityLayerName; LAYER_COUNT] = [
    UtilityLayerName::Base,
    UtilityLayerName::Defaults,
    UtilityLayerName::Components,
    UtilityLayerName::Utilities,
];

fn push_theme_declaration(
    buckets: &mut Vec<ThemeBucket>,
    media_text: &str,
    selector_text: &str,
    mode: Option<&str>,
    declaration: String,
) {
    if let Some(bucket) = buckets
        .iter_mut()
        .find(|bucket| bucket.media_text == media_text && bucket.selector_text == selector_text)
    {
        bucket.declarations.push(declaration);
        return;
    }
    buckets.push(ThemeBucket {
        media_text: media_text.to_owned(),
        selector_text: selector_text.to_owned(),
        mode: mode.map(str::to_owned),
        order: buckets.len(),
        declarations: vec![declaration],
    });
}

fn theme_bucket_rank(bucket: &ThemeBucket) -> u8 {
    if !bucket.media_text.is_empty() {
        2
    } else if bucket
        .selector_text
        .split(',')
        .map(str::trim)
        .any(|selector| matches!(selector, ":root" | ":host"))
    {
        0
    } else {
        1
    }
}

fn layer_name(layer: UtilityLayerName) -> &'static str {
    match layer {
        UtilityLayerName::Base => "base",
        UtilityLayerName::Defaults => "defaults",
        UtilityLayerName::Components => "components",
        UtilityLayerName::Utilities => "utilities",
    }
}

fn compile_manifest(manifest: &MasterCssManifest) -> Result<ManifestProjection, EngineError> {
    let mut projection: ManifestProjection = serde_json::from_value(manifest.as_value().clone())
        .map_err(|error| EngineError::InvalidManifest(error.to_string()))?;
    if projection.version != 1 {
        return Err(EngineError::InvalidManifest(
            "unsupported projection version".into(),
        ));
    }
    let (compiled_variables, compiled_variable_order) = compile_variables(&projection.variables)?;
    projection.compiled_variables = compiled_variables;
    projection.compiled_variable_order = compiled_variable_order;
    append_builtin_native_value_utilities(&mut projection.utilities);
    append_builtin_native_declaration_utilities(&mut projection.utilities);
    let count = projection.utilities.len() as i32;
    projection.utilities = projection
        .utilities
        .into_iter()
        .enumerate()
        .map(|(index, mut utility)| {
            if utility.name.is_none() {
                utility.name = Some(utility.id.clone());
            }
            if utility.order.is_none() {
                utility.order = Some(count - index as i32 - 1);
            }
            compile_utility_variables(
                &mut utility,
                &projection.compiled_variables,
                &projection.compiled_variable_order,
            );
            utility
        })
        .collect();
    Ok(projection)
}

fn compile_variables(
    groups: &Map<String, Value>,
) -> Result<(HashMap<String, CompiledVariable>, Vec<String>), EngineError> {
    let mut variables = HashMap::new();
    let mut order = Vec::new();
    for (namespace, definitions) in groups {
        let Some(definitions) = definitions.as_array() else {
            return Err(EngineError::InvalidManifest(format!(
                "variables.{namespace} must be an array"
            )));
        };
        for definition in definitions {
            let Some(object) = definition.as_object() else {
                return Err(EngineError::InvalidManifest(format!(
                    "variables.{namespace} entries must be objects"
                )));
            };
            if object.get("value") == Some(&Value::Bool(false)) {
                continue;
            }
            let key = object
                .get("key")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_owned();
            let name = object
                .get("name")
                .and_then(Value::as_str)
                .map(str::to_owned)
                .unwrap_or_else(|| {
                    if namespace.is_empty() {
                        key.clone()
                    } else if key.is_empty() {
                        namespace.clone()
                    } else {
                        format!("{namespace}-{key}")
                    }
                });
            if name.is_empty() {
                continue;
            }
            let value = object.get("value").and_then(normalize_variable_value);
            let modes = object
                .get("modes")
                .and_then(Value::as_object)
                .map(|modes| {
                    modes
                        .iter()
                        .filter_map(|(mode, value)| {
                            let value = value
                                .as_object()?
                                .get("value")
                                .and_then(normalize_variable_value)?;
                            Some(CompiledVariableMode {
                                name: mode.clone(),
                                value,
                            })
                        })
                        .collect()
                })
                .unwrap_or_default();
            let variable_type = object
                .get("type")
                .and_then(Value::as_str)
                .unwrap_or_else(|| {
                    if object.get("value").is_some_and(Value::is_number) {
                        "number"
                    } else {
                        "string"
                    }
                })
                .to_owned();
            let dependencies = object
                .get("dependencies")
                .and_then(Value::as_array)
                .map(|values| {
                    values
                        .iter()
                        .filter_map(Value::as_str)
                        .map(str::to_owned)
                        .collect()
                })
                .unwrap_or_default();
            if !variables.contains_key(&name) {
                order.push(name.clone());
            }
            variables.insert(
                name.clone(),
                CompiledVariable {
                    name,
                    namespace: namespace.clone(),
                    value,
                    modes,
                    variable_type,
                    dependencies,
                    inline: object.get("inline").and_then(Value::as_bool) == Some(true),
                    static_resource: object.get("static").and_then(Value::as_bool) == Some(true),
                },
            );
        }
    }
    Ok((variables, order))
}

fn normalize_variable_value(value: &Value) -> Option<String> {
    match value {
        Value::String(value) => Some(value.clone()),
        Value::Number(value) => Some(value.to_string()),
        Value::Array(values) => values
            .iter()
            .map(normalize_variable_value)
            .collect::<Option<Vec<_>>>()
            .map(|values| values.join(",")),
        _ => None,
    }
}

fn serialize_literal_value(value: &Value) -> Option<String> {
    match value {
        Value::String(value) => Some(value.clone()),
        Value::Number(value) => Some(value.to_string()),
        Value::Bool(value) => Some(value.to_string()),
        Value::Array(values) => values
            .iter()
            .map(serialize_literal_value)
            .collect::<Option<Vec<_>>>()
            .map(|values| values.join("")),
        _ => None,
    }
}

const SPACING_PROPERTIES: &[&str] = &[
    "background-position",
    "bottom",
    "border-spacing",
    "column-gap",
    "gap",
    "inset",
    "inset-block",
    "inset-block-end",
    "inset-block-start",
    "inset-inline",
    "inset-inline-end",
    "inset-inline-start",
    "left",
    "margin",
    "margin-block",
    "margin-block-end",
    "margin-block-start",
    "margin-bottom",
    "margin-inline",
    "margin-inline-end",
    "margin-inline-start",
    "margin-left",
    "margin-right",
    "margin-top",
    "mask-position",
    "object-position",
    "outline-offset",
    "padding",
    "padding-block",
    "padding-block-end",
    "padding-block-start",
    "padding-bottom",
    "padding-inline",
    "padding-inline-end",
    "padding-inline-start",
    "padding-left",
    "padding-right",
    "padding-top",
    "perspective",
    "perspective-origin",
    "right",
    "row-gap",
    "scroll-margin",
    "scroll-margin-block",
    "scroll-margin-block-end",
    "scroll-margin-block-start",
    "scroll-margin-bottom",
    "scroll-margin-inline",
    "scroll-margin-inline-end",
    "scroll-margin-inline-start",
    "scroll-margin-left",
    "scroll-margin-right",
    "scroll-margin-top",
    "scroll-padding",
    "scroll-padding-block",
    "scroll-padding-block-end",
    "scroll-padding-block-start",
    "scroll-padding-bottom",
    "scroll-padding-inline",
    "scroll-padding-inline-end",
    "scroll-padding-inline-start",
    "scroll-padding-left",
    "scroll-padding-right",
    "scroll-padding-top",
    "shape-margin",
    "text-indent",
    "text-underline-offset",
    "top",
    "translate",
    "transform-origin",
    "word-spacing",
];

const SPACING_UNITLESS_PROPERTIES: &[&str] = &["cx", "cy", "stroke-dashoffset", "x", "y"];

const CONTAINER_PROPERTIES: &[&str] = &[
    "background-size",
    "block-size",
    "contain-intrinsic-block-size",
    "contain-intrinsic-inline-size",
    "flex-basis",
    "height",
    "inline-size",
    "max-block-size",
    "max-height",
    "max-inline-size",
    "max-width",
    "min-block-size",
    "min-height",
    "min-inline-size",
    "min-width",
    "mask-size",
    "width",
];

const RADIUS_PROPERTIES: &[&str] = &[
    "border-bottom-left-radius",
    "border-bottom-right-radius",
    "border-end-end-radius",
    "border-end-start-radius",
    "border-radius",
    "border-start-end-radius",
    "border-start-start-radius",
    "border-top-left-radius",
    "border-top-right-radius",
];

const BORDER_COLOR_PROPERTIES: &[&str] = &[
    "border",
    "border-block",
    "border-block-color",
    "border-block-end",
    "border-block-end-color",
    "border-block-start",
    "border-block-start-color",
    "border-bottom",
    "border-bottom-color",
    "border-color",
    "border-inline",
    "border-inline-color",
    "border-inline-end",
    "border-inline-end-color",
    "border-inline-start",
    "border-inline-start-color",
    "border-left",
    "border-left-color",
    "border-right",
    "border-right-color",
    "border-top",
    "border-top-color",
    "outline",
    "outline-color",
];

const BUILTIN_NATIVE_VALUE_NAMESPACES: &[(&[&str], &[&str])] = &[
    (SPACING_PROPERTIES, &["~spacing"]),
    (SPACING_UNITLESS_PROPERTIES, &["~spacing"]),
    (CONTAINER_PROPERTIES, &["~container"]),
    (RADIUS_PROPERTIES, &["~radius"]),
    (BORDER_COLOR_PROPERTIES, &["~color-line", "~color"]),
    (
        &["accent-color", "background-color", "fill", "filter"],
        &["~color"],
    ),
    (&["caret-color"], &["~color-text", "~color"]),
    (&["stroke"], &["~color-line", "~color"]),
    (&["color"], &["=color", "~color-text", "~color"]),
    (
        &["-webkit-text-fill-color", "text-decoration-color"],
        &["~color-text", "~color"],
    ),
    (&["-webkit-text-stroke-color"], &["~color"]),
    (&["text-shadow"], &["~color"]),
    (&["box-shadow"], &["~shadow", "~color"]),
    (
        &[
            "animation-delay",
            "animation-duration",
            "transition-delay",
            "transition-duration",
        ],
        &["~duration"],
    ),
    (
        &["animation-timing-function", "transition-timing-function"],
        &["~easing"],
    ),
    (&["animation", "transition"], &["~duration", "~easing"]),
    (&["content"], &["=content"]),
    (&["font-feature-settings"], &["=font-feature"]),
    (&["font-family"], &["=font-family"]),
    (&["font-size"], &["=font-size"]),
    (&["font-weight"], &["=font-weight"]),
    (&["letter-spacing"], &["~tracking"]),
    (&["line-height"], &["~leading"]),
    (&["order"], &["=order"]),
];

const BUILTIN_NATIVE_DECLARATION_PROPERTIES: &[&str] = &[
    "border-block-end-style",
    "border-block-end-width",
    "border-block-start-style",
    "border-block-start-width",
    "border-block-style",
    "border-block-width",
    "border-bottom-style",
    "border-bottom-width",
    "border-inline-end-style",
    "border-inline-end-width",
    "border-inline-start-style",
    "border-inline-style",
    "border-inline-width",
    "border-left-style",
    "border-left-width",
    "border-right-style",
    "border-right-width",
    "border-style",
    "border-top-style",
    "border-top-width",
    "border-width",
    "overflow",
    "scroll-snap-type",
    "text-overflow",
];

fn is_native_shorthand_property(property: &str) -> bool {
    matches!(
        property,
        "all"
            | "animation"
            | "animation-range"
            | "background"
            | "background-position"
            | "background-repeat"
            | "border"
            | "border-block"
            | "border-block-color"
            | "border-block-end"
            | "border-block-start"
            | "border-block-style"
            | "border-block-width"
            | "border-bottom"
            | "border-color"
            | "border-image"
            | "border-inline"
            | "border-inline-color"
            | "border-inline-end"
            | "border-inline-start"
            | "border-inline-style"
            | "border-inline-width"
            | "border-left"
            | "border-radius"
            | "border-right"
            | "border-style"
            | "border-top"
            | "border-width"
            | "column-rule"
            | "columns"
            | "contain-intrinsic-size"
            | "container"
            | "flex"
            | "flex-flow"
            | "font"
            | "font-synthesis"
            | "font-variant"
            | "gap"
            | "grid"
            | "grid-area"
            | "grid-column"
            | "grid-row"
            | "grid-template"
            | "inset"
            | "inset-block"
            | "inset-inline"
            | "line-clamp"
            | "list-style"
            | "margin"
            | "margin-block"
            | "margin-inline"
            | "mask"
            | "mask-border"
            | "mask-position"
            | "mask-repeat"
            | "offset"
            | "outline"
            | "overflow"
            | "overscroll-behavior"
            | "padding"
            | "padding-block"
            | "padding-inline"
            | "place-content"
            | "place-items"
            | "place-self"
            | "scroll-margin"
            | "scroll-margin-block"
            | "scroll-margin-inline"
            | "scroll-padding"
            | "scroll-padding-block"
            | "scroll-padding-inline"
            | "scroll-timeline"
            | "text-decoration"
            | "text-emphasis"
            | "text-wrap"
            | "transition"
            | "view-timeline"
            | "white-space"
    )
}

fn is_valid_native_property(property: &str) -> bool {
    let mut characters = property.chars();
    if let Some(property) = property.strip_prefix("--") {
        return !property.is_empty()
            && property.chars().all(|character| {
                character.is_ascii_alphanumeric() || matches!(character, '-' | '_')
            });
    }
    let first = characters.next();
    if first == Some('-') {
        return characters
            .next()
            .is_some_and(|character| character.is_ascii_alphabetic() || character == '_')
            && characters.all(|character| {
                character.is_ascii_alphanumeric() || matches!(character, '-' | '_')
            });
    }
    first.is_some_and(|character| character.is_ascii_alphabetic() || character == '_')
        && characters
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_'))
}

fn normalize_unmanaged_value(value: &str, settings: &EngineSettings) -> String {
    let mut output = String::with_capacity(value.len());
    let mut token = String::new();
    let mut quote = None;
    let mut escaped = false;
    let flush = |token: &mut String, output: &mut String| {
        if token.is_empty() {
            return;
        }
        output.push_str(&normalize_dynamic_value(token, settings));
        token.clear();
    };
    for character in value.chars() {
        if escaped {
            if quote.is_some() {
                output.push(character);
            } else {
                token.push(character);
            }
            escaped = false;
            continue;
        }
        if character == '\\' {
            if quote.is_some() {
                output.push(character);
            } else {
                token.push(character);
            }
            escaped = true;
            continue;
        }
        if let Some(current_quote) = quote {
            output.push(character);
            if character == current_quote {
                quote = None;
            }
            continue;
        }
        if matches!(character, '\'' | '"') {
            flush(&mut token, &mut output);
            quote = Some(character);
            output.push(character);
        } else if character == '|' {
            flush(&mut token, &mut output);
            output.push(' ');
        } else if character.is_ascii_whitespace() || matches!(character, '(' | ')' | ',' | '/') {
            flush(&mut token, &mut output);
            output.push(character);
        } else {
            token.push(character);
        }
    }
    flush(&mut token, &mut output);
    output
}

fn normalize_css_math_functions(source: &str) -> String {
    let mut output = String::with_capacity(source.len());
    let mut index = 0;
    while index < source.len() {
        let Some(character) = source[index..].chars().next() else {
            break;
        };
        if character.is_ascii_alphabetic() {
            let name_end = source[index..]
                .find(|character: char| !character.is_ascii_alphanumeric() && character != '-')
                .map(|offset| index + offset)
                .unwrap_or(source.len());
            let name = &source[index..name_end];
            if matches!(name, "calc" | "clamp" | "min" | "max")
                && source[name_end..].starts_with('(')
                && let Some(close) = find_matching_parenthesis(source, name_end)
            {
                let inner = normalize_css_math_functions(&source[name_end + 1..close]);
                let inner = match name {
                    "calc" => normalize_math_expression(&inner),
                    "clamp" => split_top_level(&inner, ',')
                        .into_iter()
                        .map(|argument| {
                            let argument = argument.trim();
                            if has_top_level_binary_math_operator(argument)
                                && !argument.starts_with("calc(")
                            {
                                format!("calc({})", normalize_math_expression(argument))
                            } else {
                                argument.to_owned()
                            }
                        })
                        .collect::<Vec<_>>()
                        .join(", "),
                    _ => inner,
                };
                output.push_str(name);
                output.push('(');
                output.push_str(&inner);
                output.push(')');
                index = close + 1;
                continue;
            }
        }
        output.push(character);
        index += character.len_utf8();
    }
    output
}

fn find_matching_parenthesis(source: &str, open: usize) -> Option<usize> {
    let mut depth = 0_u32;
    let mut quote = None;
    let mut escaped = false;
    for (offset, character) in source[open..].char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if character == '\\' {
            escaped = true;
            continue;
        }
        if let Some(current_quote) = quote {
            if character == current_quote {
                quote = None;
            }
            continue;
        }
        if matches!(character, '\'' | '"') {
            quote = Some(character);
        } else if character == '(' {
            depth += 1;
        } else if character == ')' {
            depth -= 1;
            if depth == 0 {
                return Some(open + offset);
            }
        }
    }
    None
}

fn normalize_math_expression(source: &str) -> String {
    let characters = source.chars().collect::<Vec<_>>();
    let mut output = String::with_capacity(source.len() + 8);
    let mut index = 0;
    while index < characters.len() {
        let character = characters[index];
        let previous = characters[..index]
            .iter()
            .rev()
            .find(|character| !character.is_ascii_whitespace())
            .copied();
        let next = characters[index + 1..]
            .iter()
            .find(|character| !character.is_ascii_whitespace())
            .copied();
        let binary = match character {
            '*' | '/' => true,
            '+' | '-' => is_binary_plus_minus(character, previous, next),
            _ => false,
        };
        if binary {
            while output.ends_with(' ') {
                output.pop();
            }
            output.push(' ');
            output.push(character);
            output.push(' ');
            index += 1;
            while index < characters.len() && characters[index].is_ascii_whitespace() {
                index += 1;
            }
            continue;
        }
        output.push(character);
        index += 1;
    }
    normalize_leading_decimal_sequences(&output)
}

fn normalize_leading_decimal_sequences(source: &str) -> String {
    let characters = source.chars().collect::<Vec<_>>();
    let mut output = String::with_capacity(source.len() + 4);
    for (index, character) in characters.iter().copied().enumerate() {
        if character == '.'
            && characters
                .get(index + 1)
                .is_some_and(|next| next.is_ascii_digit())
            && characters
                .get(index.wrapping_sub(1))
                .is_none_or(|previous| !previous.is_ascii_digit())
        {
            output.push('0');
        }
        output.push(character);
    }
    output
}

fn is_binary_plus_minus(operator: char, previous: Option<char>, next: Option<char>) -> bool {
    let (Some(previous), Some(next)) = (previous, next) else {
        return false;
    };
    if matches!(previous, '(' | ',' | '+' | '-' | '*' | '/') || matches!(next, '+' | '-') {
        return false;
    }
    operator == '+' || !(previous.is_ascii_alphabetic() && next.is_ascii_alphabetic())
}

fn has_top_level_binary_math_operator(source: &str) -> bool {
    let characters = source.chars().collect::<Vec<_>>();
    let mut depth = 0_u32;
    for (index, character) in characters.iter().copied().enumerate() {
        if character == '(' {
            depth += 1;
        } else if character == ')' {
            depth = depth.saturating_sub(1);
        } else if depth == 0
            && (matches!(character, '*' | '/')
                || matches!(character, '+' | '-')
                    && is_binary_plus_minus(
                        character,
                        characters[..index]
                            .iter()
                            .rev()
                            .find(|character| !character.is_ascii_whitespace())
                            .copied(),
                        characters[index + 1..]
                            .iter()
                            .find(|character| !character.is_ascii_whitespace())
                            .copied(),
                    ))
        {
            return true;
        }
    }
    false
}

fn collect_css_variable_names(source: &str) -> Vec<String> {
    let mut names = Vec::new();
    let mut rest = source;
    while let Some(index) = rest.find("var(--") {
        let after = &rest[index + 6..];
        let end = after
            .find(|character: char| {
                character.is_ascii_whitespace() || matches!(character, ')' | ',')
            })
            .unwrap_or(after.len());
        if end > 0 && (index == 0 || !rest[..index].ends_with('-')) {
            let name = &after[..end];
            if !names.iter().any(|existing| existing == name) {
                names.push(name.to_owned());
            }
        }
        rest = &after[end..];
    }
    names
}

fn skip_stylesheet_quoted(source: &str, start: usize, quote: char) -> usize {
    let mut index = start + quote.len_utf8();
    while index < source.len() {
        let character = source[index..].chars().next().unwrap_or_default();
        index += character.len_utf8();
        if character == '\\' {
            if let Some(escaped) = source[index..].chars().next() {
                index += escaped.len_utf8();
            }
        } else if character == quote {
            break;
        }
    }
    index
}

fn skip_stylesheet_comment(source: &str, start: usize) -> usize {
    source[start + 2..]
        .find("*/")
        .map(|offset| start + 2 + offset + 2)
        .unwrap_or(source.len())
}

fn collect_stylesheet_variable_names(source: &str) -> Vec<String> {
    let mut names = Vec::new();
    let mut index = 0;
    while index < source.len() {
        let character = source[index..].chars().next().unwrap_or_default();
        if matches!(character, '\'' | '"') {
            index = skip_stylesheet_quoted(source, index, character);
            continue;
        }
        if source[index..].starts_with("/*") {
            index = skip_stylesheet_comment(source, index);
            continue;
        }
        let is_variable_function = source
            .get(index..index + 4)
            .is_some_and(|value| value.eq_ignore_ascii_case("var("))
            && source[..index]
                .chars()
                .next_back()
                .is_none_or(|character| !is_css_identifier_character(character));
        if !is_variable_function {
            index += character.len_utf8();
            continue;
        }
        let mut cursor = index + 4;
        while source[cursor..]
            .chars()
            .next()
            .is_some_and(|character| character == ' ')
        {
            cursor += source[cursor..]
                .chars()
                .next()
                .unwrap_or_default()
                .len_utf8();
        }
        if !source[cursor..].starts_with("--") {
            index += 4;
            continue;
        }
        cursor += 2;
        let name_start = cursor;
        while source[cursor..]
            .chars()
            .next()
            .is_some_and(is_css_identifier_character)
        {
            cursor += source[cursor..]
                .chars()
                .next()
                .unwrap_or_default()
                .len_utf8();
        }
        if cursor > name_start {
            let name = &source[name_start..cursor];
            if !names.iter().any(|existing| existing == name) {
                names.push(name.to_owned());
            }
        }
        index = cursor;
    }
    names
}

fn collect_stylesheet_keyframe_names(source: &str) -> Vec<String> {
    let mut names = Vec::new();
    let mut index = 0;
    while let Some(offset) = source[index..].find("@keyframes") {
        index += offset;
        let mut cursor = index + "@keyframes".len();
        let Some(whitespace) = source[cursor..]
            .chars()
            .next()
            .filter(|character| character.is_whitespace())
        else {
            index = cursor;
            continue;
        };
        cursor += whitespace.len_utf8();
        while source[cursor..]
            .chars()
            .next()
            .is_some_and(char::is_whitespace)
        {
            cursor += source[cursor..]
                .chars()
                .next()
                .unwrap_or_default()
                .len_utf8();
        }
        let name_start = cursor;
        if source[cursor..].starts_with('-') {
            cursor += 1;
        }
        let Some(first) = source[cursor..]
            .chars()
            .next()
            .filter(|character| character.is_ascii_alphabetic() || *character == '_')
        else {
            index = cursor;
            continue;
        };
        cursor += first.len_utf8();
        while source[cursor..]
            .chars()
            .next()
            .is_some_and(is_css_identifier_character)
        {
            cursor += source[cursor..]
                .chars()
                .next()
                .unwrap_or_default()
                .len_utf8();
        }
        if cursor > name_start {
            let name = &source[name_start..cursor];
            if !names.iter().any(|existing| existing == name) {
                names.push(name.to_owned());
            }
        }
        index = cursor;
    }
    names
}

fn collect_stylesheet_animation_declarations(source: &str) -> Vec<String> {
    let mut declarations = Vec::new();
    let mut index = 0;
    while let Some(offset) = source[index..].find("animation") {
        index += offset;
        let before = source[..index].chars().next_back();
        if before.is_some_and(|character| character.is_ascii_alphanumeric() || character == '_') {
            index += "animation".len();
            continue;
        }
        let property = if source[index..].starts_with("animation-name") {
            "animation-name"
        } else {
            "animation"
        };
        let mut cursor = index + property.len();
        while source[cursor..]
            .chars()
            .next()
            .is_some_and(char::is_whitespace)
        {
            cursor += source[cursor..]
                .chars()
                .next()
                .unwrap_or_default()
                .len_utf8();
        }
        if !source[cursor..].starts_with(':') {
            index += property.len();
            continue;
        }
        cursor += 1;
        while source[cursor..]
            .chars()
            .next()
            .is_some_and(char::is_whitespace)
        {
            cursor += source[cursor..]
                .chars()
                .next()
                .unwrap_or_default()
                .len_utf8();
        }
        let value_start = cursor;
        while cursor < source.len() {
            let character = source[cursor..].chars().next().unwrap_or_default();
            if matches!(character, ';' | '{' | '}') {
                break;
            }
            cursor += character.len_utf8();
        }
        if cursor > value_start {
            declarations.push(source[value_start..cursor].trim().to_owned());
        }
        index = cursor.max(index + property.len());
    }
    declarations
}

fn collect_stylesheet_animation_names(
    declarations: &[String],
    variable_names: &[String],
    manifest: &ManifestProjection,
) -> Vec<String> {
    let mut sources = declarations.to_vec();
    let mut visited = HashSet::new();
    for variable_name in variable_names {
        collect_variable_animation_sources(variable_name, manifest, &mut visited, &mut sources);
    }
    let known_names = manifest
        .animations
        .keys()
        .map(String::as_str)
        .collect::<HashSet<_>>();
    let mut names = Vec::new();
    for source in sources {
        for token in source.split(|character: char| character.is_whitespace() || character == ',') {
            if known_names.contains(token) && !names.iter().any(|name| name == token) {
                names.push(token.to_owned());
            }
        }
    }
    names
}

fn collect_variable_animation_sources(
    name: &str,
    manifest: &ManifestProjection,
    visited: &mut HashSet<String>,
    sources: &mut Vec<String>,
) {
    if !visited.insert(name.to_owned()) {
        return;
    }
    let Some(variable) = manifest.compiled_variables.get(name) else {
        return;
    };
    if let Some(value) = &variable.value {
        sources.push(value.clone());
    }
    sources.extend(variable.modes.iter().map(|mode| mode.value.clone()));
    for dependency in &variable.dependencies {
        collect_variable_animation_sources(dependency, manifest, visited, sources);
    }
}

fn collect_animation_names(
    declarations: &str,
    variable_names: &[String],
    manifest: &ManifestProjection,
) -> Vec<String> {
    let mut sources = vec![declarations.to_owned()];
    let mut visited = HashSet::new();
    let mut pending = variable_names.to_vec();
    while let Some(name) = pending.pop() {
        if !visited.insert(name.clone()) {
            continue;
        }
        let Some(variable) = manifest.compiled_variables.get(&name) else {
            continue;
        };
        if let Some(value) = &variable.value {
            sources.push(value.clone());
        }
        sources.extend(variable.modes.iter().map(|mode| mode.value.clone()));
        pending.extend(variable.dependencies.iter().cloned());
    }
    manifest
        .animations
        .keys()
        .filter(|name| {
            sources
                .iter()
                .any(|source| contains_css_identifier(source, name))
        })
        .cloned()
        .collect()
}

fn contains_css_identifier(source: &str, name: &str) -> bool {
    source.match_indices(name).any(|(index, _)| {
        let before = source[..index].chars().next_back();
        let after = source[index + name.len()..].chars().next();
        before.is_none_or(|character| !is_css_identifier_character(character))
            && after.is_none_or(|character| !is_css_identifier_character(character))
    })
}

fn is_css_identifier_character(character: char) -> bool {
    character.is_ascii_alphanumeric() || matches!(character, '-' | '_')
}

fn append_builtin_native_value_utilities(utilities: &mut Vec<UtilityDefinition>) {
    for (properties, variable_alias_refs) in BUILTIN_NATIVE_VALUE_NAMESPACES {
        for property in *properties {
            if utilities.iter().any(|utility| utility.id == *property) {
                continue;
            }
            utilities.push(UtilityDefinition {
                id: (*property).into(),
                name: Some((*property).into()),
                utility_type: if is_native_shorthand_property(property) {
                    -1
                } else {
                    0
                },
                order: Some(0),
                layer: UtilityLayerName::Utilities,
                kind: None,
                variable_aliases: Vec::new(),
                variable_alias_refs: variable_alias_refs
                    .iter()
                    .map(|reference| (*reference).to_owned())
                    .collect(),
                variables: HashMap::new(),
                native_fallback: true,
                emit: UtilityEmit::Property {
                    property: (*property).into(),
                },
                matchers: vec![UtilityMatcher::Key {
                    keys: vec![(*property).into()],
                }],
            });
        }
    }
}

fn append_builtin_native_declaration_utilities(utilities: &mut Vec<UtilityDefinition>) {
    for property in BUILTIN_NATIVE_DECLARATION_PROPERTIES {
        if utilities.iter().any(|utility| utility.id == *property) {
            continue;
        }
        utilities.push(UtilityDefinition {
            id: (*property).into(),
            name: Some((*property).into()),
            utility_type: if is_native_shorthand_property(property) {
                -1
            } else {
                0
            },
            order: Some(0),
            layer: UtilityLayerName::Utilities,
            kind: None,
            variable_aliases: Vec::new(),
            variable_alias_refs: Vec::new(),
            variables: HashMap::new(),
            native_fallback: true,
            emit: UtilityEmit::Property {
                property: (*property).into(),
            },
            matchers: vec![UtilityMatcher::Key {
                keys: vec![(*property).into()],
            }],
        });
    }
}

fn compile_utility_variables(
    utility: &mut UtilityDefinition,
    variables: &HashMap<String, CompiledVariable>,
    variable_order: &[String],
) {
    for (key, name) in &utility.variable_aliases {
        if variables.contains_key(name) {
            utility.variables.entry(key.clone()).or_insert(name.clone());
        }
    }
    for reference in &utility.variable_alias_refs {
        let namespace = reference
            .strip_prefix('=')
            .or_else(|| reference.strip_prefix('~'))
            .unwrap_or(reference.as_str());
        for variable_name in variable_order {
            let Some(variable) = variables.get(variable_name) else {
                continue;
            };
            if let Some(key) = get_variable_key_by_namespace(&variable.name, namespace) {
                utility
                    .variables
                    .entry(key)
                    .or_insert_with(|| variable.name.clone());
            }
        }
    }
}

fn get_variable_key_by_namespace(variable_name: &str, namespace: &str) -> Option<String> {
    let (negative, positive_name) = variable_name
        .strip_prefix('-')
        .map_or((false, variable_name), |name| (true, name));
    if positive_name != namespace && !positive_name.starts_with(&format!("{namespace}-")) {
        return None;
    }
    let key = positive_name
        .strip_prefix(namespace)
        .and_then(|name| name.strip_prefix('-'))
        .unwrap_or_default();
    Some(if negative {
        format!("-{key}")
    } else {
        key.to_owned()
    })
}

fn layer_index(layer: UtilityLayerName) -> usize {
    match layer {
        UtilityLayerName::Base => 0,
        UtilityLayerName::Defaults => 1,
        UtilityLayerName::Components => 2,
        UtilityLayerName::Utilities => 3,
    }
}

fn compare_stored_rules(left: &StoredRule, right: &StoredRule) -> Ordering {
    left.ir
        .sort_tier
        .cmp(&right.ir.sort_tier)
        .then_with(|| {
            compare_condition_features(&left.ir.priority.features, &right.ir.priority.features)
        })
        .then_with(|| left.ir.priority.selector.cmp(&right.ir.priority.selector))
        .then_with(|| left.ir.utility_type.cmp(&right.ir.utility_type))
        .then_with(|| natural_compare(&left.ir.key, &right.ir.key))
        .then_with(|| left.manifest_order.cmp(&right.manifest_order))
}

fn compare_condition_features(left: &[ConditionFeature], right: &[ConditionFeature]) -> Ordering {
    for index in 0..left.len().max(right.len()) {
        let Some(left) = left.get(index) else {
            return Ordering::Less;
        };
        let Some(right) = right.get(index) else {
            return Ordering::Greater;
        };
        let name_order = natural_compare(&left.0, &right.0);
        if name_order != Ordering::Equal {
            return name_order;
        }
        let left_range = left.2 - left.1;
        let right_range = right.2 - right.1;
        let range_order = right_range
            .partial_cmp(&left_range)
            .unwrap_or(Ordering::Equal);
        if range_order != Ordering::Equal {
            return range_order;
        }
        let min_order = right.1.partial_cmp(&left.1).unwrap_or(Ordering::Equal);
        if min_order != Ordering::Equal {
            return min_order;
        }
        let max_order = right.2.partial_cmp(&left.2).unwrap_or(Ordering::Equal);
        if max_order != Ordering::Equal {
            return max_order;
        }
    }
    Ordering::Equal
}

fn natural_compare(left: &str, right: &str) -> Ordering {
    let mut left_chars = left.chars().peekable();
    let mut right_chars = right.chars().peekable();
    loop {
        match (left_chars.peek(), right_chars.peek()) {
            (None, None) => return Ordering::Equal,
            (None, Some(_)) => return Ordering::Less,
            (Some(_), None) => return Ordering::Greater,
            (Some(left_char), Some(right_char))
                if left_char.is_ascii_digit() && right_char.is_ascii_digit() =>
            {
                let left_digits: String =
                    std::iter::from_fn(|| left_chars.next_if(|value| value.is_ascii_digit()))
                        .collect();
                let right_digits: String =
                    std::iter::from_fn(|| right_chars.next_if(|value| value.is_ascii_digit()))
                        .collect();
                let number_order = left_digits
                    .trim_start_matches('0')
                    .len()
                    .cmp(&right_digits.trim_start_matches('0').len())
                    .then_with(|| left_digits.cmp(&right_digits));
                if number_order != Ordering::Equal {
                    return number_order;
                }
            }
            _ => {
                let left_char = left_chars.next().unwrap();
                let right_char = right_chars.next().unwrap();
                let order = left_char.cmp(&right_char);
                if order != Ordering::Equal {
                    return order;
                }
            }
        }
    }
}

fn match_utility(
    class_name: &str,
    utility: &UtilityDefinition,
    manifest: &ManifestProjection,
) -> Option<UtilityMatch> {
    for matcher in &utility.matchers {
        match matcher {
            UtilityMatcher::Static { name }
                if class_name.strip_prefix(name).is_some_and(|rest| {
                    is_match_state_boundary(rest)
                        && (!rest.starts_with(':') || is_selector_state_start(rest))
                }) =>
            {
                return Some(UtilityMatch {
                    value: None,
                    state_token: class_name[name.len()..].to_owned(),
                    variable_names: Vec::new(),
                });
            }
            UtilityMatcher::Pattern {
                prefix,
                values,
                value_map,
            } => {
                let Some(value) = class_name.strip_prefix(prefix) else {
                    continue;
                };
                let Some(candidate) = values.iter().find(|candidate| {
                    value
                        .strip_prefix(candidate.as_str())
                        .is_some_and(is_match_state_boundary)
                }) else {
                    continue;
                };
                let state_token = &value[candidate.len()..];
                return Some(UtilityMatch {
                    value: Some(
                        value_map
                            .get(candidate)
                            .cloned()
                            .unwrap_or_else(|| candidate.to_string()),
                    ),
                    state_token: state_token.to_owned(),
                    variable_names: Vec::new(),
                });
            }
            UtilityMatcher::Key { keys } => {
                for key in keys {
                    let Some(raw_value) = class_name
                        .strip_prefix(key)
                        .and_then(|rest| rest.strip_prefix(':'))
                    else {
                        continue;
                    };
                    let (value, state_token) = split_dynamic_value_state(raw_value);
                    if !value.is_empty() {
                        let (value, variable_names) =
                            resolve_utility_value_components(&value, utility, manifest);
                        return Some(UtilityMatch {
                            value: Some(value),
                            state_token,
                            variable_names,
                        });
                    }
                }
            }
            UtilityMatcher::Variable { keys, segments } => {
                for key in keys {
                    let Some(raw_value) = class_name
                        .strip_prefix(key)
                        .and_then(|rest| rest.strip_prefix(':'))
                    else {
                        continue;
                    };
                    let (value, state_token) = split_dynamic_value_state(raw_value);
                    if value.is_empty()
                        || (segments.as_deref() != Some("multiple")
                            && has_top_level_value_separator(&value))
                    {
                        continue;
                    }
                    let Some((value, variable_names)) =
                        resolve_utility_value(&value, utility, manifest)
                    else {
                        continue;
                    };
                    return Some(UtilityMatch {
                        value: Some(value),
                        state_token,
                        variable_names,
                    });
                }
            }
            UtilityMatcher::Value { keys, segments } => {
                for key in keys {
                    let Some(raw_value) = class_name
                        .strip_prefix(key)
                        .and_then(|rest| rest.strip_prefix(':'))
                    else {
                        continue;
                    };
                    let (value, state_token) = split_dynamic_value_state(raw_value);
                    if value.is_empty()
                        || (segments.as_deref() != Some("multiple")
                            && has_top_level_value_separator(&value))
                        || !matches_utility_kind(&value, utility.kind.as_deref())
                    {
                        continue;
                    }
                    let (value, variable_names) =
                        resolve_utility_value_components(&value, utility, manifest);
                    return Some(UtilityMatch {
                        value: Some(value),
                        state_token,
                        variable_names,
                    });
                }
            }
            _ => {}
        }
    }
    None
}

fn canonicalize_class_name(class_name: &str) -> Option<String> {
    let colon = class_name.find(':')?;
    let key = &class_name[..colon];
    let canonical = builtin_key_alias(key)?;
    Some(format!("{canonical}{}", &class_name[colon..]))
}

fn builtin_key_alias(key: &str) -> Option<&'static str> {
    Some(match key {
        "fg" => "color",
        "bg" => "background",
        "gap-x" => "column-gap",
        "gap-y" => "row-gap",
        "grid-col" => "grid-column",
        "grid-col-end" => "grid-column-end",
        "grid-col-start" => "grid-column-start",
        "b" => "border",
        "bb" => "border-bottom",
        "bl" => "border-left",
        "br" => "border-right",
        "bt" => "border-top",
        "bx" => "border-inline",
        "by" => "border-block",
        "h" => "height",
        "ix" => "inset-inline",
        "ixe" => "inset-inline-end",
        "ixs" => "inset-inline-start",
        "iy" => "inset-block",
        "iye" => "inset-block-end",
        "iys" => "inset-block-start",
        "leading" => "line-height",
        "m" => "margin",
        "max" => "max-size",
        "max-h" => "max-height",
        "max-size-x" => "max-inline-size",
        "max-size-y" => "max-block-size",
        "max-w" => "max-width",
        "mb" => "margin-bottom",
        "min" => "min-size",
        "min-h" => "min-height",
        "min-size-x" => "min-inline-size",
        "min-size-y" => "min-block-size",
        "min-w" => "min-width",
        "ml" => "margin-left",
        "mr" => "margin-right",
        "mt" => "margin-top",
        "mx" => "margin-inline",
        "mxe" => "margin-inline-end",
        "mxs" => "margin-inline-start",
        "my" => "margin-block",
        "mye" => "margin-block-end",
        "mys" => "margin-block-start",
        "p" => "padding",
        "pb" => "padding-bottom",
        "pl" => "padding-left",
        "pr" => "padding-right",
        "pt" => "padding-top",
        "px" => "padding-inline",
        "pxe" => "padding-inline-end",
        "pxs" => "padding-inline-start",
        "py" => "padding-block",
        "pye" => "padding-block-end",
        "pys" => "padding-block-start",
        "r" => "border-radius",
        "rbl" => "border-bottom-left-radius",
        "rbr" => "border-bottom-right-radius",
        "rtl" => "border-top-left-radius",
        "rtr" => "border-top-right-radius",
        "scroll-m" => "scroll-margin",
        "scroll-mb" => "scroll-margin-bottom",
        "scroll-ml" => "scroll-margin-left",
        "scroll-mr" => "scroll-margin-right",
        "scroll-mt" => "scroll-margin-top",
        "scroll-mx" => "scroll-margin-inline",
        "scroll-mxe" => "scroll-margin-inline-end",
        "scroll-mxs" => "scroll-margin-inline-start",
        "scroll-my" => "scroll-margin-block",
        "scroll-mye" => "scroll-margin-block-end",
        "scroll-mys" => "scroll-margin-block-start",
        "scroll-p" => "scroll-padding",
        "scroll-pb" => "scroll-padding-bottom",
        "scroll-pl" => "scroll-padding-left",
        "scroll-pr" => "scroll-padding-right",
        "scroll-pt" => "scroll-padding-top",
        "scroll-px" => "scroll-padding-inline",
        "scroll-pxe" => "scroll-padding-inline-end",
        "scroll-pxs" => "scroll-padding-inline-start",
        "scroll-py" => "scroll-padding-block",
        "scroll-pye" => "scroll-padding-block-end",
        "scroll-pys" => "scroll-padding-block-start",
        "shadow" => "box-shadow",
        "size-x" => "inline-size",
        "size-y" => "block-size",
        "line-clamp" => "-webkit-line-clamp",
        "text-fill-color" => "-webkit-text-fill-color",
        "text-stroke-color" => "-webkit-text-stroke-color",
        "text-stroke-width" => "-webkit-text-stroke-width",
        "tracking" => "letter-spacing",
        "w" => "width",
        "z" => "z-index",
        _ => return None,
    })
}

fn resolve_utility_value(
    value: &str,
    utility: &UtilityDefinition,
    manifest: &ManifestProjection,
) -> Option<(String, Vec<String>)> {
    if let Some((key, alpha)) = value.split_once('/') {
        let variable_name = key
            .strip_prefix('$')
            .filter(|name| manifest.compiled_variables.contains_key(*name))
            .map(str::to_owned)
            .or_else(|| utility.variables.get(key).cloned())
            .or_else(|| {
                manifest
                    .compiled_variables
                    .contains_key(key)
                    .then(|| key.to_owned())
            })?;
        let variable = manifest.compiled_variables.get(&variable_name)?;
        if !variable.namespace.starts_with("color") {
            return None;
        }
        let alpha = alpha.parse::<f64>().ok()?;
        if !(0.0..=1.0).contains(&alpha) {
            return None;
        }
        let color = if variable.inline {
            variable.value.clone()?
        } else {
            format!("var(--{})", variable.name)
        };
        return Some((
            format!(
                "color-mix(in oklab,{color} {}%,transparent)",
                format_standard_number(alpha * 100.0)
            ),
            if variable.inline {
                Vec::new()
            } else {
                vec![variable.name.clone()]
            },
        ));
    }
    let (negative, key) = value
        .strip_prefix('-')
        .map_or((false, value), |key| (true, key));
    let variable_name = key
        .strip_prefix('$')
        .filter(|name| manifest.compiled_variables.contains_key(*name))
        .or_else(|| utility.variables.get(key).map(String::as_str))
        .or_else(|| manifest.compiled_variables.contains_key(key).then_some(key))?;
    let variable = manifest.compiled_variables.get(variable_name)?;
    if negative && variable.variable_type != "number" {
        return None;
    }
    if variable.inline {
        let value = variable.value.clone()?;
        return Some((
            if negative {
                format!("calc({value} * -1)")
            } else {
                value
            },
            Vec::new(),
        ));
    }
    let reference = format!("var(--{})", variable.name);
    Some((
        if negative {
            format!("calc({reference} * -1)")
        } else {
            reference
        },
        vec![variable.name.clone()],
    ))
}

fn resolve_utility_value_components(
    value: &str,
    utility: &UtilityDefinition,
    manifest: &ManifestProjection,
) -> (String, Vec<String>) {
    let mut output = String::with_capacity(value.len());
    let mut token = String::new();
    let mut quote = None;
    let mut escaped = false;
    let mut variable_names = Vec::new();
    let flush = |token: &mut String, output: &mut String, variable_names: &mut Vec<String>| {
        if token.is_empty() {
            return;
        }
        if let Some((resolved, names)) = resolve_utility_value(token, utility, manifest) {
            output.push_str(&resolved);
            for name in names {
                if !variable_names.contains(&name) {
                    variable_names.push(name);
                }
            }
        } else {
            output.push_str(&normalize_dynamic_value(token, &manifest.settings));
        }
        token.clear();
    };
    for character in value.chars() {
        if escaped {
            if quote.is_some() {
                output.push(character);
            } else {
                token.push(character);
            }
            escaped = false;
            continue;
        }
        if character == '\\' {
            if quote.is_some() {
                output.push(character);
            } else {
                token.push(character);
            }
            escaped = true;
            continue;
        }
        if let Some(current_quote) = quote {
            output.push(character);
            if character == current_quote {
                quote = None;
            }
            continue;
        }
        if matches!(character, '\'' | '"') {
            flush(&mut token, &mut output, &mut variable_names);
            quote = Some(character);
            output.push(character);
        } else if character == '(' {
            // A token immediately followed by `(` is a CSS function name, not a
            // variable key. In particular, the inline `min`/`max` variables
            // must not rewrite the standard min()/max() math functions.
            output.push_str(&token);
            token.clear();
            output.push(character);
        } else if character == '|' {
            flush(&mut token, &mut output, &mut variable_names);
            output.push(' ');
        } else if character == '/' && !token.is_empty() {
            token.push(character);
        } else if character.is_ascii_whitespace() || matches!(character, ')' | ',' | '/') {
            flush(&mut token, &mut output, &mut variable_names);
            output.push(character);
        } else {
            token.push(character);
        }
    }
    flush(&mut token, &mut output, &mut variable_names);
    for name in collect_css_variable_names(&output) {
        if manifest.compiled_variables.contains_key(&name) && !variable_names.contains(&name) {
            variable_names.push(name);
        }
    }
    (normalize_css_math_functions(&output), variable_names)
}

fn matches_utility_kind(value: &str, kind: Option<&str>) -> bool {
    let function_name = value
        .trim_start_matches('-')
        .split_once('(')
        .filter(|(_, rest)| rest.ends_with(')'))
        .map(|(name, _)| name);
    match kind {
        Some("number") => {
            value
                .chars()
                .next()
                .is_some_and(|character| character.is_ascii_digit() || character == '.')
                || matches!(function_name, Some("calc" | "clamp" | "min" | "max"))
        }
        Some("color") => {
            value.starts_with('#')
                || value.starts_with("currentColor")
                || value.starts_with("transparent")
                || function_name.is_some_and(|name| {
                    !matches!(name, "calc" | "clamp" | "min" | "max" | "url" | "image")
                        && !name.ends_with("gradient")
                })
        }
        Some("image") => function_name.is_some_and(|name| {
            name == "url"
                || name == "element"
                || name == "paint"
                || name == "cross-fade"
                || name.ends_with("gradient")
                || name.contains("image")
        }),
        _ => false,
    }
}

fn is_match_state_boundary(rest: &str) -> bool {
    rest.is_empty()
        || rest.chars().next().is_some_and(|character| {
            matches!(
                character,
                '!' | '*' | '>' | '+' | '~' | ':' | '[' | '@' | '_' | '.'
            )
        })
}

fn is_selector_state_start(rest: &str) -> bool {
    if rest.starts_with("::") {
        return true;
    }
    let Some(rest) = rest.strip_prefix(':') else {
        return false;
    };
    let name = rest
        .split(|character: char| !character.is_ascii_alphanumeric() && character != '-')
        .next()
        .unwrap_or_default();
    matches!(
        name,
        "active"
            | "any-link"
            | "autofill"
            | "blank"
            | "checked"
            | "current"
            | "default"
            | "defined"
            | "disabled"
            | "empty"
            | "enabled"
            | "first"
            | "first-child"
            | "first-of-type"
            | "focus"
            | "focus-visible"
            | "focus-within"
            | "fullscreen"
            | "future"
            | "has"
            | "host"
            | "host-context"
            | "hover"
            | "in-range"
            | "indeterminate"
            | "invalid"
            | "is"
            | "lang"
            | "last"
            | "last-child"
            | "last-of-type"
            | "left"
            | "link"
            | "local-link"
            | "modal"
            | "not"
            | "nth-child"
            | "nth-col"
            | "nth-last-child"
            | "nth-last-col"
            | "nth-last-of-type"
            | "nth-of-type"
            | "only"
            | "only-child"
            | "only-of-type"
            | "optional"
            | "out-of-range"
            | "past"
            | "paused"
            | "picture-in-picture"
            | "placeholder-shown"
            | "playing"
            | "read-only"
            | "read-write"
            | "required"
            | "right"
            | "root"
            | "scope"
            | "seeking"
            | "stalled"
            | "target"
            | "target-within"
            | "user-invalid"
            | "user-valid"
            | "valid"
            | "visited"
            | "volume-locked"
            | "where"
    )
}

fn split_dynamic_value_state(value: &str) -> (String, String) {
    let mut quote = None;
    let mut escaped = false;
    let mut depth = 0_u32;
    for (index, character) in value.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if character == '\\' {
            escaped = true;
            continue;
        }
        if let Some(current_quote) = quote {
            if character == current_quote {
                quote = None;
            }
            continue;
        }
        if character == '\'' || character == '"' {
            quote = Some(character);
            continue;
        }
        if matches!(character, '(' | '[' | '{') {
            depth += 1;
            continue;
        }
        if matches!(character, ')' | ']' | '}') {
            depth = depth.saturating_sub(1);
            continue;
        }
        if depth == 0 && matches!(character, ':' | '@' | '!' | '>') {
            return (value[..index].to_owned(), value[index..].to_owned());
        }
    }
    (value.to_owned(), String::new())
}

fn has_top_level_value_separator(value: &str) -> bool {
    let mut quote = None;
    let mut escaped = false;
    let mut depth = 0_u32;
    for character in value.chars() {
        if escaped {
            escaped = false;
            continue;
        }
        if character == '\\' {
            escaped = true;
            continue;
        }
        if let Some(current_quote) = quote {
            if character == current_quote {
                quote = None;
            }
            continue;
        }
        if character == '\'' || character == '"' {
            quote = Some(character);
        } else if matches!(character, '(' | '[' | '{') {
            depth += 1;
        } else if matches!(character, ')' | ']' | '}') {
            depth = depth.saturating_sub(1);
        } else if character == '|' && depth == 0 {
            return true;
        }
    }
    false
}

fn resolve_state_branches(
    state_token: &str,
    inherited_important: bool,
    manifest: &ManifestProjection,
) -> Vec<StateBranch> {
    let mut state_token = state_token;
    let mut important = inherited_important;
    if let Some(rest) = state_token.strip_prefix('!') {
        important = true;
        state_token = rest;
    }

    let (selector_token, condition_tokens) = split_state_token(state_token);
    let mut branches = vec![StateBranch {
        important,
        ..StateBranch::default()
    }];

    if !selector_token.is_empty() {
        let selector_variant = manifest
            .variants
            .iter()
            .find(|variant| variant.token == selector_token);
        if let Some(variant) = selector_variant {
            branches = expand_variant_branches(branches, variant, manifest);
        } else {
            let template = selector_token_to_template(&selector_token, manifest);
            for branch in &mut branches {
                branch.key.push_str(&selector_token);
                branch.selector_template = template.clone();
            }
        }
    }

    for condition_token in condition_tokens {
        if manifest.settings.modes.contains(&condition_token) {
            for branch in &mut branches {
                branch.key.push('@');
                branch.key.push_str(&condition_token);
                branch.mode = Some(condition_token.clone());
                if manifest.settings.mode_trigger == "media" {
                    add_condition_wrapper(
                        &mut branch.condition_wrappers,
                        "media",
                        format!("@media (prefers-color-scheme:{condition_token})"),
                    );
                }
            }
            continue;
        }

        let variant_token = format!("@{condition_token}");
        if let Some(variant) = manifest
            .variants
            .iter()
            .find(|variant| variant.token == variant_token)
        {
            branches = expand_variant_branches(branches, variant, manifest);
            continue;
        }

        if let Some(layer) = resolve_layer_condition(&condition_token, manifest) {
            branches.retain_mut(|branch| {
                if branch.layer.is_some_and(|current| current != layer) {
                    return false;
                }
                branch.key.push('@');
                branch.key.push_str(&condition_token);
                branch.layer = Some(layer);
                true
            });
            continue;
        }

        if let Some((id, wrapper, features)) = render_condition_token(&condition_token, manifest) {
            for branch in &mut branches {
                branch.key.push('@');
                branch.key.push_str(&condition_token);
                add_condition_wrapper(&mut branch.condition_wrappers, &id, wrapper.clone());
                merge_condition_features(&mut branch.features, &features);
            }
        }
    }
    branches
}

fn split_state_token(state_token: &str) -> (String, Vec<String>) {
    let mut selector = String::new();
    let mut conditions = Vec::new();
    let mut start = 0;
    let mut depth = 0_u32;
    let mut quote = None;
    let mut escaped = false;
    for (index, character) in state_token.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if character == '\\' {
            escaped = true;
            continue;
        }
        if let Some(current_quote) = quote {
            if character == current_quote {
                quote = None;
            }
            continue;
        }
        if character == '\'' || character == '"' {
            quote = Some(character);
        } else if matches!(character, '(' | '[' | '{') {
            depth += 1;
        } else if matches!(character, ')' | ']' | '}') {
            depth = depth.saturating_sub(1);
        } else if character == '@' && depth == 0 {
            if conditions.is_empty() {
                selector = state_token[..index].to_owned();
            } else {
                conditions.push(state_token[start..index].to_owned());
            }
            start = index + character.len_utf8();
        }
    }
    if start == 0 {
        selector = state_token.to_owned();
    } else if start < state_token.len() {
        conditions.push(state_token[start..].to_owned());
    }
    (selector, conditions)
}

fn expand_variant_branches(
    current: Vec<StateBranch>,
    variant: &ManifestVariant,
    manifest: &ManifestProjection,
) -> Vec<StateBranch> {
    current
        .into_iter()
        .flat_map(|base| {
            variant
                .branches
                .iter()
                .enumerate()
                .filter_map(|(index, variant_branch)| {
                    if base.layer.is_some()
                        && variant_branch.layer.is_some()
                        && base.layer != variant_branch.layer
                    {
                        return None;
                    }
                    let mut branch = base.clone();
                    branch.key.push_str(&variant.token);
                    branch.key.push('#');
                    branch.key.push_str(&index.to_string());
                    branch.layer = variant_branch.layer.or(branch.layer);

                    let variant_selector = if let Some(selector) = &variant_branch.selector {
                        Some(selector.clone())
                    } else if !variant_branch.selector_nodes.is_empty() {
                        let suffix = generate_selector_nodes(&variant_branch.selector_nodes);
                        Some(suffix_to_template(&suffix))
                    } else {
                        None
                    };
                    branch.selector_template = compose_selector_templates(
                        branch.selector_template.as_deref(),
                        variant_selector.as_deref(),
                    );

                    if !variant_branch.condition_nodes.is_empty() {
                        for condition in &variant_branch.condition_nodes {
                            let wrapper = render_manifest_condition(condition, None);
                            add_condition_wrapper(
                                &mut branch.condition_wrappers,
                                &condition.id,
                                wrapper,
                            );
                            add_condition_features(&mut branch.features, &condition.nodes, None);
                        }
                    } else {
                        for raw in &variant_branch.conditions {
                            if let Some((id, wrapper)) = parse_raw_condition_wrapper(raw) {
                                add_condition_wrapper(&mut branch.condition_wrappers, &id, wrapper);
                            }
                        }
                    }
                    let _ = manifest;
                    Some(branch)
                })
                .collect::<Vec<_>>()
        })
        .collect()
}

fn compose_selector_templates(current: Option<&str>, next: Option<&str>) -> Option<String> {
    let next = next?;
    if next == "&" {
        return current.map(str::to_owned);
    }
    Some(next.replace('&', current.unwrap_or("&")))
}

fn selector_token_to_template(
    selector_token: &str,
    manifest: &ManifestProjection,
) -> Option<String> {
    if selector_token.is_empty() {
        return None;
    }
    if let Some(nodes) = manifest.selectors.get(selector_token) {
        return Some(suffix_to_template(&generate_selector_nodes(nodes)));
    }
    let mut selector = selector_token.to_owned();
    for (alias, replacement) in [
        (":first", ":first-child"),
        (":last", ":last-child"),
        (":even", ":nth-child(2n)"),
        (":odd", ":nth-child(odd)"),
        (":only", ":only-child"),
        (":rtl", ":dir(rtl)"),
        (":ltr", ":dir(ltr)"),
        ("::scrollbar-thumb", "::-webkit-scrollbar-thumb"),
        ("::scrollbar-track", "::-webkit-scrollbar-track"),
        ("::scrollbar", "::-webkit-scrollbar"),
        ("::slider-thumb", "::-webkit-slider-thumb"),
        ("::slider-runnable-track", "::-webkit-slider-runnable-track"),
        ("::resizer", "::-webkit-resizer"),
    ] {
        selector = replace_selector_alias(&selector, alias, replacement);
    }
    selector = replace_selector_underscores(&selector);
    Some(suffix_to_template(&selector))
}

fn replace_selector_alias(source: &str, alias: &str, replacement: &str) -> String {
    let mut output = String::with_capacity(source.len());
    let mut rest = source;
    while let Some(index) = rest.find(alias) {
        output.push_str(&rest[..index]);
        let after = &rest[index + alias.len()..];
        if after.chars().next().is_none_or(|character| {
            !character.is_ascii_alphanumeric() && character != '-' && character != '_'
        }) {
            output.push_str(replacement);
        } else {
            output.push_str(alias);
        }
        rest = after;
    }
    output.push_str(rest);
    output
}

fn replace_selector_underscores(source: &str) -> String {
    let characters: Vec<char> = source.chars().collect();
    let mut output = String::with_capacity(source.len());
    for (index, character) in characters.iter().enumerate() {
        if *character == '_'
            && characters.get(index.wrapping_sub(1)) != Some(&'_')
            && characters.get(index + 1) != Some(&'_')
        {
            output.push(' ');
        } else {
            output.push(*character);
        }
    }
    output
}

fn suffix_to_template(suffix: &str) -> String {
    split_top_level(suffix, ',')
        .into_iter()
        .map(|group| format!("&{group}"))
        .collect::<Vec<_>>()
        .join(",")
}

fn split_top_level(source: &str, delimiter: char) -> Vec<String> {
    let mut result = Vec::new();
    let mut start = 0;
    let mut depth = 0_u32;
    let mut quote = None;
    let mut escaped = false;
    for (index, character) in source.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if character == '\\' {
            escaped = true;
            continue;
        }
        if let Some(current_quote) = quote {
            if character == current_quote {
                quote = None;
            }
            continue;
        }
        if character == '\'' || character == '"' {
            quote = Some(character);
        } else if matches!(character, '(' | '[' | '{') {
            depth += 1;
        } else if matches!(character, ')' | ']' | '}') {
            depth = depth.saturating_sub(1);
        } else if character == delimiter && depth == 0 {
            result.push(source[start..index].to_owned());
            start = index + character.len_utf8();
        }
    }
    result.push(source[start..].to_owned());
    result
}

fn find_group_close(source: &str) -> Option<usize> {
    let mut nested_depth = 0_u32;
    let mut quote = None;
    let mut escaped = false;
    for (index, character) in source.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if character == '\\' {
            escaped = true;
            continue;
        }
        if let Some(current_quote) = quote {
            if character == current_quote {
                quote = None;
            }
            continue;
        }
        if matches!(character, '\'' | '"') {
            quote = Some(character);
        } else if character == '{' {
            nested_depth += 1;
        } else if character == '}' {
            if nested_depth == 0 {
                return Some(index);
            }
            nested_depth -= 1;
        }
    }
    None
}

fn generate_selector_nodes(nodes: &[ManifestSelectorNode]) -> String {
    nodes
        .iter()
        .map(|node| {
            let value = node.value.as_deref().unwrap_or_default();
            if node.node_type.as_deref() == Some("separator") {
                return value.to_owned();
            }
            let prefix = match node.node_type.as_deref() {
                Some("pseudo-class") => ":",
                Some("pseudo-element") => "::",
                Some("class") => ".",
                Some("id") => "#",
                Some("attribute") | Some("combinator") | Some("universal") | None => "",
                Some(_) => "",
            };
            if node.node_type.as_deref() == Some("attribute") {
                return format!("[{value}]");
            }
            let mut output = format!("{prefix}{value}");
            if !node.children.is_empty() {
                let children = generate_selector_nodes(&node.children);
                if value.is_empty() {
                    output.push_str(&children);
                } else {
                    output.push('(');
                    output.push_str(&children);
                    output.push(')');
                }
            }
            output
        })
        .collect()
}

fn resolve_layer_condition(token: &str, manifest: &ManifestProjection) -> Option<UtilityLayerName> {
    let condition = manifest.conditions.get(token)?;
    if condition.id != "layer" || condition.nodes.len() != 1 {
        return None;
    }
    let value = condition.nodes[0].get("value")?.as_str()?;
    match value {
        "base" => Some(UtilityLayerName::Base),
        "defaults" => Some(UtilityLayerName::Defaults),
        "components" => Some(UtilityLayerName::Components),
        "utilities" => Some(UtilityLayerName::Utilities),
        _ => None,
    }
}

fn render_condition_token(
    token: &str,
    manifest: &ManifestProjection,
) -> Option<(String, String, Vec<ConditionFeature>)> {
    let terms = split_top_level(token, '&');
    let mut id = None::<String>;
    let mut bodies = Vec::new();
    let mut features = Vec::new();
    for term in terms {
        if let Some((condition_id, body, term_features)) =
            render_function_condition(&term, manifest)
        {
            id.get_or_insert(condition_id);
            if !body.is_empty() {
                bodies.push(body);
            }
            merge_condition_features(&mut features, &term_features);
            continue;
        }
        let (operator, name) = split_comparison_prefix(&term);
        let condition = manifest
            .conditions
            .get(name)
            .or_else(|| manifest.breakpoint_conditions.get(name))
            .or_else(|| manifest.container_conditions.get(name));
        if let Some(condition) = condition {
            if condition.id == "layer" {
                continue;
            }
            id.get_or_insert_with(|| condition.id.clone());
            bodies.push(render_condition_nodes_body(
                &condition.id,
                &condition.nodes,
                operator,
            ));
            add_condition_features(&mut features, &condition.nodes, operator);
            continue;
        }

        if let Ok(number) = name.parse::<f64>() {
            let value = format_number(number / manifest.settings.root_size);
            id.get_or_insert_with(|| "media".into());
            bodies.push(format!("(width{}{}rem)", operator.unwrap_or(">="), value));
            add_condition_feature(
                &mut features,
                "width",
                operator.unwrap_or(">="),
                number / manifest.settings.root_size,
            );
            continue;
        }

        let inferred_id = if name.starts_with("supports:") {
            "supports"
        } else {
            "container"
        };
        id.get_or_insert_with(|| inferred_id.into());
        bodies.push(
            operator.map_or_else(|| name.to_owned(), |operator| format!("{operator} {name}")),
        );
    }
    let id = id?;
    let body = bodies
        .into_iter()
        .filter(|body| !body.is_empty())
        .collect::<Vec<_>>()
        .join(" and ");
    let wrapper = if body.is_empty() {
        format!("@{id}")
    } else {
        format!("@{id} {body}")
    };
    features.sort_by(|left, right| natural_compare(&left.0, &right.0));
    Some((id, wrapper, features))
}

fn render_function_condition(
    token: &str,
    manifest: &ManifestProjection,
) -> Option<(String, String, Vec<ConditionFeature>)> {
    let open = token.find('(')?;
    if !token.ends_with(')') {
        return None;
    }
    let name = &token[..open];
    if name.is_empty() {
        return None;
    }
    let body = &token[open + 1..token.len() - 1];
    let mut features = Vec::new();
    match name {
        "media" => Some(("media".into(), body.replace('|', " "), features)),
        "supports" => Some((
            "supports".into(),
            format!("({})", body.replace('|', " ")),
            features,
        )),
        "starting-style" => Some(("starting-style".into(), String::new(), features)),
        "layer" => Some(("layer".into(), body.to_owned(), features)),
        "container" => {
            let body = render_named_condition_body(body, "container", manifest, &mut features);
            Some(("container".into(), body, features))
        }
        _ => {
            let query = render_named_condition_body(body, "container", manifest, &mut features);
            Some((
                "container".into(),
                if query.is_empty() {
                    name.to_owned()
                } else {
                    format!("{name} {query}")
                },
                features,
            ))
        }
    }
}

fn render_named_condition_body(
    token: &str,
    condition_id: &str,
    manifest: &ManifestProjection,
    features: &mut Vec<ConditionFeature>,
) -> String {
    if let Some((value, rendered_value)) = resolve_condition_numeric(token, manifest) {
        add_condition_feature(features, "width", ">=", value);
        return format!("(width>={rendered_value})");
    }
    if let Some((left, operator, right)) = split_infix_comparison(token) {
        let feature_name = match left {
            "w" => "width",
            "h" => "height",
            value => value,
        };
        if let Some((value, rendered_value)) = resolve_condition_numeric(right, manifest) {
            add_condition_feature(features, feature_name, operator, value);
            return format!("({feature_name}{operator}{rendered_value})");
        }
    }
    let condition = if condition_id == "container" {
        manifest.container_conditions.get(token).or_else(|| {
            (!manifest.breakpoint_conditions.contains_key(token))
                .then(|| manifest.conditions.get(token))
                .flatten()
        })
    } else {
        manifest.conditions.get(token)
    };
    if let Some(condition) = condition {
        add_condition_features(features, &condition.nodes, None);
        return render_condition_nodes_body(&condition.id, &condition.nodes, None);
    }
    token.replace('|', " ")
}

fn split_infix_comparison(token: &str) -> Option<(&str, &str, &str)> {
    for operator in [">=", "<=", ">", "<", "="] {
        if let Some(index) = token.find(operator) {
            let left = &token[..index];
            let right = &token[index + operator.len()..];
            if !left.is_empty() && !right.is_empty() {
                return Some((left, operator, right));
            }
        }
    }
    None
}

fn resolve_condition_numeric(token: &str, manifest: &ManifestProjection) -> Option<(f64, String)> {
    if let Ok(value) = token.parse::<f64>() {
        let value = value / manifest.settings.root_size;
        return Some((value, format!("{}rem", format_number(value))));
    }
    let condition = manifest
        .conditions
        .get(token)
        .or_else(|| manifest.breakpoint_conditions.get(token))
        .or_else(|| manifest.container_conditions.get(token))?;
    let node = condition.nodes.first()?.as_object()?;
    if node.get("type").and_then(Value::as_str) != Some("number") {
        return None;
    }
    let value = node.get("value")?.as_f64()?;
    let unit = node.get("unit").and_then(Value::as_str).unwrap_or_default();
    Some((value, format!("{}{unit}", format_number(value))))
}

fn split_comparison_prefix(term: &str) -> (Option<&str>, &str) {
    for operator in [">=", "<=", ">", "<", "="] {
        if let Some(name) = term.strip_prefix(operator) {
            return (Some(operator), name);
        }
    }
    (None, term)
}

fn add_condition_features(
    features: &mut Vec<ConditionFeature>,
    nodes: &[Value],
    override_operator: Option<&str>,
) {
    add_condition_features_inner(features, nodes, override_operator, false);
    features.sort_by(|left, right| natural_compare(&left.0, &right.0));
}

fn add_condition_features_inner(
    features: &mut Vec<ConditionFeature>,
    nodes: &[Value],
    override_operator: Option<&str>,
    outside_not: bool,
) {
    for (index, node) in nodes.iter().enumerate() {
        let Some(object) = node.as_object() else {
            continue;
        };
        let previous_is_not = index.checked_sub(1).is_some_and(|previous| {
            nodes[previous].as_object().is_some_and(|previous| {
                previous.get("type").and_then(Value::as_str) == Some("logical")
                    && previous.get("value").and_then(Value::as_str) == Some("not")
            })
        });
        if let Some(children) = object.get("children").and_then(Value::as_array) {
            add_condition_features_inner(
                features,
                children,
                override_operator,
                outside_not || previous_is_not,
            );
            continue;
        }
        if object.get("type").and_then(Value::as_str) != Some("number") {
            continue;
        }
        let Some(value) = object.get("value").and_then(Value::as_f64) else {
            continue;
        };
        let name = object
            .get("name")
            .and_then(Value::as_str)
            .unwrap_or("width");
        let Some(mut operator) = override_operator
            .or_else(|| object.get("operator").and_then(Value::as_str))
            .or_else(|| object.get("name").is_none().then_some(">="))
        else {
            continue;
        };
        if outside_not || previous_is_not {
            operator = invert_comparison_operator(operator);
        }
        add_condition_feature(features, name, operator, value);
    }
}

fn invert_comparison_operator(operator: &str) -> &str {
    match operator {
        ">=" => "<",
        "<=" => ">",
        ">" => "<=",
        "<" => ">=",
        _ => operator,
    }
}

fn add_condition_feature(
    features: &mut Vec<ConditionFeature>,
    name: &str,
    operator: &str,
    value: f64,
) {
    let feature = if let Some(feature) = features.iter_mut().find(|feature| feature.0 == name) {
        feature
    } else {
        features.push((name.to_owned(), 0.0, JS_MAX_SAFE_INTEGER));
        features.last_mut().expect("inserted condition feature")
    };
    match operator {
        ">" => feature.1 = value + 0.02,
        ">=" => feature.1 = value,
        "<" => feature.2 = value - 0.02,
        "<=" => feature.2 = value,
        _ => {}
    }
}

fn merge_condition_features(target: &mut Vec<ConditionFeature>, source: &[ConditionFeature]) {
    for (name, min, max) in source {
        if let Some(feature) = target.iter_mut().find(|feature| feature.0 == *name) {
            if *min != 0.0 {
                feature.1 = *min;
            }
            if *max != JS_MAX_SAFE_INTEGER {
                feature.2 = *max;
            }
        } else {
            target.push((name.clone(), *min, *max));
        }
    }
    target.sort_by(|left, right| natural_compare(&left.0, &right.0));
}

fn render_manifest_condition(condition: &ManifestCondition, operator: Option<&str>) -> String {
    let body = render_condition_nodes_body(&condition.id, &condition.nodes, operator);
    if body.is_empty() {
        format!("@{}", condition.id)
    } else {
        format!("@{} {body}", condition.id)
    }
}

fn render_condition_nodes_body(id: &str, nodes: &[Value], operator: Option<&str>) -> String {
    nodes
        .iter()
        .map(|node| render_condition_node(id, node, operator))
        .filter(|node| !node.is_empty())
        .collect::<Vec<_>>()
        .join(if id == "layer" { "." } else { " " })
}

fn render_condition_node(id: &str, node: &Value, operator: Option<&str>) -> String {
    let Some(object) = node.as_object() else {
        return String::new();
    };
    if let Some(children) = object.get("children").and_then(Value::as_array) {
        let body = render_condition_nodes_body(id, children, operator);
        return if object.get("type").and_then(Value::as_str) == Some("group") {
            format!("({body})")
        } else {
            body
        };
    }
    let node_type = object
        .get("type")
        .and_then(Value::as_str)
        .unwrap_or_default();
    if node_type == "boolean" {
        return object
            .get("name")
            .and_then(Value::as_str)
            .map(|name| format!("({name})"))
            .unwrap_or_default();
    }
    if node_type == "logical" || node_type == "comparison" {
        return object
            .get("value")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_owned();
    }
    let value = match object.get("value") {
        Some(Value::Number(number)) => {
            let mut value = number.to_string();
            value.push_str(
                object
                    .get("unit")
                    .and_then(Value::as_str)
                    .unwrap_or_default(),
            );
            value
        }
        Some(Value::String(value)) => value.clone(),
        _ => String::new(),
    };
    let name = object.get("name").and_then(Value::as_str);
    if node_type == "number" && name.is_none() {
        return format!("(width{}{value})", operator.unwrap_or(">="));
    }
    if let Some(name) = name {
        if node_type == "number" {
            let operator = operator
                .or_else(|| object.get("operator").and_then(Value::as_str))
                .unwrap_or(":");
            return format!("({name}{operator}{value})");
        }
        return format!("({name}:{value})");
    }
    value
}

fn format_number(value: f64) -> String {
    let mut output = value.to_string();
    if output.starts_with("0.") {
        output.remove(0);
    } else if output.starts_with("-0.") {
        output.remove(1);
    }
    output
}

fn normalize_dynamic_value(value: &str, settings: &EngineSettings) -> String {
    if value.as_bytes().first() == Some(&b'.')
        && value.as_bytes().get(1).is_some_and(u8::is_ascii_digit)
    {
        return format!("0{value}");
    }
    if value.as_bytes().starts_with(b"-.")
        && value.as_bytes().get(2).is_some_and(u8::is_ascii_digit)
    {
        return format!("-0{}", &value[1..]);
    }
    let Some(number) = value.strip_suffix('x') else {
        return value.to_owned();
    };
    if number.is_empty()
        || !number
            .chars()
            .all(|character| character.is_ascii_digit() || matches!(character, '+' | '-' | '.'))
    {
        return value.to_owned();
    }
    number
        .parse::<f64>()
        .map(|number| {
            format!(
                "{}rem",
                format_standard_number(number * settings.base_unit / settings.root_size)
            )
        })
        .unwrap_or_else(|_| value.to_owned())
}

fn format_standard_number(value: f64) -> String {
    if value == 0.0 {
        "0".into()
    } else {
        value.to_string()
    }
}

fn parse_raw_condition_wrapper(raw: &str) -> Option<(String, String)> {
    let raw = raw.trim();
    let id = raw.strip_prefix('@')?.split_whitespace().next()?.to_owned();
    Some((id, raw.to_owned()))
}

fn add_condition_wrapper(wrappers: &mut Vec<(String, String)>, id: &str, wrapper: String) {
    if let Some((_, current)) = wrappers.iter_mut().find(|(current_id, _)| current_id == id) {
        let prefix = format!("@{id}");
        let current_body = current.strip_prefix(&prefix).unwrap_or(current).trim();
        let next_body = wrapper.strip_prefix(&prefix).unwrap_or(&wrapper).trim();
        *current = if current_body.is_empty() {
            wrapper
        } else if next_body.is_empty() {
            current.clone()
        } else {
            format!("{prefix} {current_body} and {next_body}")
        };
    } else {
        wrappers.push((id.to_owned(), wrapper));
    }
}

fn create_selector_text(
    class_name: &str,
    declaration_selector: Option<&str>,
    branch: &StateBranch,
    manifest: &ManifestProjection,
) -> String {
    let mut body = format!(".{}", css_escape(class_name));
    let mut prefix = String::new();
    if let Some(scope) = &manifest.settings.scope {
        prefix.push_str(scope);
        prefix.push(' ');
    }
    if let Some(mode) = &branch.mode {
        match manifest.settings.mode_trigger.as_str() {
            "class" => prefix = format!(".{mode} {prefix}"),
            "host" => prefix = format!(":host(.{mode}) {prefix}"),
            _ => {}
        }
    }
    body.insert_str(0, &prefix);
    let mut selector = branch
        .selector_template
        .as_deref()
        .map(|template| template.replace('&', &body))
        .unwrap_or(body);
    if let Some(template) = declaration_selector {
        selector = template.replace('&', &selector);
    }
    selector
}

fn wrap_raw_conditions(mut text: String, conditions: &[String]) -> String {
    for condition in conditions.iter().rev() {
        let condition = condition.trim();
        if !condition.is_empty() {
            text = format!("{condition}{{{text}}}");
        }
    }
    text
}

fn wrap_state_conditions(mut text: String, wrappers: &[(String, String)]) -> String {
    for id in ["container", "starting-style", "supports", "media", "layer"] {
        if let Some((_, wrapper)) = wrappers.iter().find(|(current_id, _)| current_id == id) {
            text = format!("{wrapper}{{{text}}}");
        }
    }
    text
}

fn selector_priority(selector: Option<&str>) -> i32 {
    let Some(selector) = selector else {
        return 0;
    };
    [
        (":hover", 1),
        (":focus-visible", 2),
        (":focus", 2),
        (":active", 3),
        (":disabled", 4),
    ]
    .into_iter()
    .map(|(token, priority)| selector.matches(token).count() as i32 * priority)
    .sum()
}

fn emit_declarations(
    utility: &UtilityDefinition,
    matched_value: Option<&str>,
    important: bool,
) -> Vec<(usize, String, Option<String>, Vec<String>)> {
    match &utility.emit {
        UtilityEmit::Static { rules } => rules
            .iter()
            .enumerate()
            .filter_map(|(index, rule)| {
                serialize_declarations(&rule.declarations, matched_value, important).map(
                    |declarations| {
                        (
                            index,
                            declarations,
                            rule.selector.clone(),
                            rule.conditions.clone(),
                        )
                    },
                )
            })
            .collect(),
        UtilityEmit::Property { property } => matched_value
            .filter(|value| !value.is_empty())
            .map(|value| {
                vec![(
                    0,
                    format_declaration(property, value, important),
                    None,
                    Vec::new(),
                )]
            })
            .unwrap_or_default(),
        UtilityEmit::Template { declarations } => {
            serialize_declarations(declarations, matched_value, important)
                .map(|declarations| vec![(0, declarations, None, Vec::new())])
                .unwrap_or_default()
        }
        UtilityEmit::Declarations { declarations } => {
            let text = declarations
                .iter()
                .map(|declaration| {
                    let declaration = matched_value
                        .map(|value| declaration.replace("$value", value))
                        .unwrap_or_else(|| declaration.clone());
                    if important && !declaration.ends_with("!important") {
                        format!("{declaration}!important")
                    } else {
                        declaration
                    }
                })
                .collect::<Vec<_>>()
                .join(";");
            (!text.is_empty())
                .then_some(vec![(0, text, None, Vec::new())])
                .unwrap_or_default()
        }
    }
}

fn serialize_declarations(
    declarations: &Map<String, Value>,
    matched_value: Option<&str>,
    important: bool,
) -> Option<String> {
    let mut output = Vec::new();
    for (property, raw_value) in declarations {
        let value = serialize_declaration_value(raw_value, matched_value)?;
        output.push(format_declaration(property, &value, important));
    }
    (!output.is_empty()).then(|| output.join(";"))
}

fn serialize_declaration_value(value: &Value, matched_value: Option<&str>) -> Option<String> {
    match value {
        Value::Null => Some(matched_value?.to_owned()),
        Value::String(value) => Some(
            matched_value
                .map(|matched| value.replace("$value", matched))
                .unwrap_or_else(|| value.clone()),
        ),
        Value::Number(value) => Some(value.to_string()),
        Value::Bool(value) => Some(value.to_string()),
        Value::Array(segments) => segments
            .iter()
            .map(|segment| serialize_declaration_value(segment, matched_value))
            .collect::<Option<Vec<_>>>()
            .map(|segments| segments.join("")),
        _ => None,
    }
}

fn format_declaration(property: &str, value: &str, important: bool) -> String {
    if important && !value.ends_with("!important") {
        format!("{property}:{value}!important")
    } else {
        format!("{property}:{value}")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const MANIFEST: &str = r##"{
      "version":1,
      "conditions":{
        "sm":{"id":"media","nodes":[{"type":"number","value":52.125,"unit":"rem"}]}
      },
      "variables":{
        "":[
          {"key":"min","value":"min-content","inline":true},
          {"key":"max","value":"max-content","inline":true}
        ],
        "color":[{"key":"red-60","value":"#d00"}],
        "spacing":[{"key":"md","type":"number","value":"1rem"}]
      },
      "variants":[
        {"token":"@base","branches":[{"layer":"base"}]}
      ],
      "utilities":[
        {
          "id":"display-block",
          "name":"block",
          "type":-2,
          "emit":{"type":"static","rules":[{"declarations":{"display":"block"}}]},
          "matchers":[{"type":"static","name":"block"}]
        },
        {
          "id":"bg-origin",
          "type":-2,
          "emit":{"type":"static","rules":[{"declarations":{"background-origin":null}}]},
          "matchers":[{
            "type":"pattern",
            "prefix":"bg-origin-",
            "values":["border"],
            "valueMap":{"border":"border-box"}
          }]
        },
        {
          "id":"background-color",
          "type":0,
          "kind":"color",
          "variableAliasRefs":["~color"],
          "emit":{"type":"static","rules":[{"declarations":{"background-color":null}}]},
          "matchers":[
            {"type":"variable","keys":["bg"]},
            {"type":"value","keys":["bg"]}
          ]
        },
        {
          "id":"width",
          "name":"width",
          "type":0,
          "emit":{"type":"property","property":"width"},
          "matchers":[{"type":"key","keys":["w"]}]
        }
      ]
    }"##;

    #[test]
    fn creates_sorted_rule_transitions_and_css() {
        let mut engine = EngineSession::create(MANIFEST).unwrap();
        let transition = engine
            .ensure_class_rules(["block", "w:10px", "bg-origin-border"])
            .unwrap();
        assert_eq!(transition.mutations.len(), 3);
        assert_eq!(
            engine.css_text(),
            "@layer utilities{.bg-origin-border{background-origin:border-box}.block{display:block}.w\\:10px{width:10px}}"
        );
        let snapshot = engine.snapshot().unwrap();
        assert_eq!(snapshot.rules.len(), 3);
        assert_eq!(snapshot.rules[2].class_name, "w:10px");
    }

    #[test]
    fn ensure_is_idempotent_and_delete_reports_exact_index() {
        let mut engine = EngineSession::create(MANIFEST).unwrap();
        engine.ensure_class_rules(["block", "w:10px"]).unwrap();
        assert!(
            engine
                .ensure_class_rules(["block"])
                .unwrap()
                .mutations
                .is_empty()
        );
        let deleted = engine.delete_class_rules(["block"]).unwrap();
        assert_eq!(deleted.mutations.len(), 1);
        assert_eq!(engine.css_text(), "@layer utilities{.w\\:10px{width:10px}}");
    }

    #[test]
    fn refresh_replays_connected_classes_against_new_manifest() {
        let mut engine = EngineSession::create(MANIFEST).unwrap();
        engine.ensure_class_rules(["block"]).unwrap();
        let updated = MANIFEST.replace("\"block\"", "\"inline\"");
        let transition = engine.refresh(&updated).unwrap();
        assert_eq!(transition.mutations.len(), 1);
        assert_eq!(engine.css_text(), "");
    }

    #[test]
    fn disposed_sessions_fail_closed() {
        let mut engine = EngineSession::create(MANIFEST).unwrap();
        engine.dispose();
        assert!(matches!(
            engine.snapshot(),
            Err(EngineError::SessionDisposed)
        ));
    }

    #[test]
    fn inspection_does_not_mutate_the_session() {
        let engine = EngineSession::create(MANIFEST).unwrap();
        let inspection = engine.inspect("block:hover").unwrap();
        assert!(inspection.valid);
        assert_eq!(inspection.rules.len(), 1);
        assert_eq!(inspection.rules[0].key, "block:hover\0:hover");
        assert!(inspection.rules[0].nodes.is_empty());
        assert_eq!(engine.css_text(), "");
    }

    #[test]
    fn groups_multi_node_utilities_into_one_hydration_rule() {
        let manifest = r#"{
          "version":1,
          "utilities":[{
            "id":".multi",
            "name":"multi",
            "type":-2,
            "emit":{"type":"static","rules":[
              {"declarations":{"display":"grid"}},
              {"selector":"&:hover","declarations":{"color":"red"}}
            ]},
            "matchers":[{"type":"static","name":"multi"}]
          }]
        }"#;
        let engine = EngineSession::create(manifest).unwrap();
        let inspection = engine.inspect("multi").unwrap();
        assert_eq!(inspection.rules.len(), 1);
        let rule = &inspection.rules[0];
        assert_eq!(rule.key, "multi");
        assert_eq!(rule.selector_text.as_deref(), Some(".multi"));
        assert_eq!(rule.text, ".multi{display:grid}.multi:hover{color:red}");
        assert_eq!(rule.nodes.len(), 2);
        assert_eq!(rule.nodes[0].text, ".multi{display:grid}");
        assert_eq!(rule.nodes[1].text, ".multi:hover{color:red}");
    }

    #[test]
    fn tracks_variable_resources_across_aliases_and_deletion() {
        let mut engine = EngineSession::create(MANIFEST).unwrap();
        engine
            .ensure_class_rules(["fg:red-60", "bg:red-60", "m:md"])
            .unwrap();
        assert_eq!(
            engine.css_text(),
            "@layer theme{:root{--color-red-60:#d00;--spacing-md:1rem}}@layer utilities{.m\\:md{margin:var(--spacing-md)}.bg\\:red-60{background-color:var(--color-red-60)}.fg\\:red-60{color:var(--color-red-60)}}"
        );
        engine.delete_class_rules(["fg:red-60"]).unwrap();
        assert!(engine.css_text().contains("--color-red-60:#d00"));
        engine.delete_class_rules(["bg:red-60"]).unwrap();
        assert!(!engine.css_text().contains("--color-red-60:#d00"));
        engine.delete_class_rules(["m:md"]).unwrap();
        assert!(!engine.css_text().contains("@layer theme"));
    }

    #[test]
    fn suppresses_variables_already_emitted_by_the_host() {
        let mut engine = EngineSession::create_with_emitted_globals(
            MANIFEST,
            Some(r#"{"variables":{"color-red-60":1}}"#),
        )
        .unwrap();
        engine.ensure_class_rules(["fg:red-60"]).unwrap();
        assert_eq!(
            engine.css_text(),
            "@layer utilities{.fg\\:red-60{color:var(--color-red-60)}}"
        );
        engine.delete_class_rules(["fg:red-60"]).unwrap();
        assert_eq!(engine.css_text(), "");
    }

    #[test]
    fn commits_only_host_supported_native_declarations() {
        let mut engine = EngineSession::create(r#"{"version":1,"utilities":[]}"#).unwrap();
        let candidates = engine
            .native_declaration_candidates(["display:block", "made-up:nope"])
            .unwrap();
        assert_eq!(candidates.len(), 2);
        assert_eq!(candidates[0].property, "display");
        engine
            .ensure_class_rules_with_native_support(
                ["display:block", "made-up:nope"],
                &[true, false],
            )
            .unwrap();
        assert_eq!(
            engine.css_text(),
            "@layer utilities{.display\\:block{display:block}}"
        );
    }

    #[test]
    fn renders_selector_condition_layer_and_important_state() {
        for (class_name, expected) in [
            (
                "block:hover",
                "@layer utilities{.block\\:hover:hover{display:block}}",
            ),
            (
                "block:first",
                "@layer utilities{.block\\:first:first-child{display:block}}",
            ),
            (
                "block_button",
                "@layer utilities{.block_button button{display:block}}",
            ),
            (
                "block@sm",
                "@layer utilities{@media (width>=52.125rem){.block\\@sm{display:block}}}",
            ),
            (
                "block@media(print)",
                "@layer utilities{@media print{.block\\@media\\(print\\){display:block}}}",
            ),
            (
                "block@supports(display:grid)",
                "@layer utilities{@supports (display:grid){.block\\@supports\\(display\\:grid\\){display:block}}}",
            ),
            (
                "block@container(h>160)",
                "@layer utilities{@container (height>10rem){.block\\@container\\(h\\>160\\){display:block}}}",
            ),
            (
                "w:10px:hover@sm",
                "@layer utilities{@media (width>=52.125rem){.w\\:10px\\:hover\\@sm:hover{width:10px}}}",
            ),
            ("block@base", "@layer base{.block\\@base{display:block}}"),
            (
                "block!",
                "@layer utilities{.block\\!{display:block!important}}",
            ),
            ("w:1x", "@layer utilities{.w\\:1x{width:0.25rem}}"),
        ] {
            let mut engine = EngineSession::create(MANIFEST).unwrap();
            engine.ensure_class_rules([class_name]).unwrap();
            assert_eq!(engine.css_text(), expected, "{class_name}");
        }
    }

    #[test]
    fn separates_child_selectors_from_dynamic_values() {
        let mut engine = EngineSession::create(r#"{"version":1,"utilities":[]}"#).unwrap();
        engine.ensure_class_rules(["mt:0>div"]).unwrap();
        assert_eq!(
            engine.css_text(),
            "@layer utilities{.mt\\:0\\>div>div{margin-top:0}}"
        );
    }

    #[test]
    fn preserves_pattern_utility_precedence_inside_groups() {
        let manifest = r#"{
          "version":1,
          "utilities":[{
            "id":"text-<wrap|pretty>",
            "type":-2,
            "emit":{"type":"static","rules":[{"declarations":{"text-wrap":null}}]},
            "matchers":[{"type":"pattern","prefix":"text-","values":["wrap","pretty"]}]
          }]
        }"#;
        let mut engine = EngineSession::create(manifest).unwrap();
        engine
            .ensure_class_rules_with_native_support(["{text-wrap:pretty}"], &[true])
            .unwrap();
        assert_eq!(
            engine.css_text(),
            "@layer utilities{.\\{text-wrap\\:pretty\\}{text-wrap:wrap}}"
        );
    }

    #[test]
    fn preserves_math_function_names_that_overlap_inline_variables() {
        let mut engine = EngineSession::create(MANIFEST).unwrap();
        engine
            .ensure_class_rules(["w:min(1px,max(2px,3px))"])
            .unwrap();
        assert_eq!(
            engine.css_text(),
            "@layer utilities{.w\\:min\\(1px\\,max\\(2px\\,3px\\)\\){width:min(1px,max(2px,3px))}}"
        );
    }
}
