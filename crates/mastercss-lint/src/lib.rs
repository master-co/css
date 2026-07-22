#![forbid(unsafe_code)]

mod class_list;

use mastercss_engine::{
    ClassSemanticInspection, EngineError, EngineSession, builtin_key_aliases,
    builtin_native_value_properties, natural_compare,
};
use mastercss_schema::{
    GeneratedRuleIr, LINT_BATCH_VERSION, NativeDeclarationCandidateIr, SourceRange,
    UtilityLayerName, ValidatorBatchIr,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::cmp::Ordering;
use std::collections::{HashMap, HashSet};

const UNKNOWN_PROPERTY_GROUP_ORDER: u8 = 99;
const UNKNOWN_PROPERTY_ORDER: u8 = 99;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClassConflictIr {
    pub class_name: String,
    pub conflicts: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PartialClassConflictIr {
    pub class_name: String,
    pub replacement: String,
    pub conflict: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LintEditIr {
    pub range: SourceRange,
    pub text: String,
    pub scope: LintEditScope,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum LintEditScope {
    ClassList,
    Directive,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LintDiagnosticIr {
    pub rule_id: String,
    pub code: String,
    pub message: String,
    pub range: SourceRange,
    #[serde(default, skip_serializing_if = "serde_json::Map::is_empty")]
    pub data: serde_json::Map<String, Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fix: Option<LintEditIr>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LintClassListIr {
    pub version: u32,
    pub analysis: LintBatchIr,
    pub diagnostics: Vec<LintDiagnosticIr>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sort_edit: Option<LintEditIr>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conflict_edit: Option<LintEditIr>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conflict_range: Option<SourceRange>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RawValueCandidateIr {
    pub class_name: String,
    pub key: String,
    pub segments: Vec<String>,
    pub properties: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RawValueCandidatesIr {
    pub version: u32,
    pub candidates: Vec<RawValueCandidateIr>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LintHostValidationIr {
    pub invalid_generated_classes: Vec<String>,
    pub validation_errors: Vec<Vec<String>>,
}

pub fn classify_host_rule_validation(
    batch: &ValidatorBatchIr,
    rule_errors: &[Vec<Vec<String>>],
) -> LintHostValidationIr {
    let validation_errors = batch
        .classes
        .iter()
        .enumerate()
        .map(|(class_index, class_result)| {
            if !class_result.matched {
                return Vec::new();
            }
            class_result
                .rules
                .iter()
                .enumerate()
                .flat_map(|(rule_index, _)| {
                    rule_errors
                        .get(class_index)
                        .and_then(|errors| errors.get(rule_index))
                        .cloned()
                        .unwrap_or_else(|| vec!["Host CSS validation result is missing.".into()])
                })
                .collect()
        })
        .collect::<Vec<Vec<String>>>();
    let invalid_generated_classes = batch
        .classes
        .iter()
        .enumerate()
        .filter(|(index, class_result)| {
            class_result.matched && !validation_errors[*index].is_empty()
        })
        .map(|(_, class_result)| class_result.class_name.clone())
        .collect();
    LintHostValidationIr {
        invalid_generated_classes,
        validation_errors,
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CanonicalClassNameOptions {
    #[serde(default = "default_true")]
    pub prefer_static_utilities: bool,
    #[serde(default = "default_true")]
    pub prefer_theme_tokens: bool,
    #[serde(default = "default_true")]
    pub prefer_property_aliases: bool,
    #[serde(default = "default_true")]
    pub prefer_variable_references: bool,
    #[serde(default = "default_true")]
    pub prefer_multi_value_tokens: bool,
    #[serde(default = "default_true")]
    pub prefer_composition_utilities: bool,
    #[serde(default = "default_true")]
    pub prefer_condition_order: bool,
    #[serde(default = "default_true")]
    pub prefer_native_declarations_in_compose: bool,
    #[serde(default = "default_true")]
    pub prefer_variant_blocks_in_compose: bool,
}

impl Default for CanonicalClassNameOptions {
    fn default() -> Self {
        Self {
            prefer_static_utilities: true,
            prefer_theme_tokens: true,
            prefer_property_aliases: true,
            prefer_variable_references: true,
            prefer_multi_value_tokens: true,
            prefer_composition_utilities: true,
            prefer_condition_order: true,
            prefer_native_declarations_in_compose: true,
            prefer_variant_blocks_in_compose: true,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CanonicalClassSuggestionIr {
    pub class_name: String,
    pub recommended: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CanonicalClassSuggestionsIr {
    pub version: u32,
    pub suggestions: Vec<CanonicalClassSuggestionIr>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CanonicalClassGroupSuggestionIr {
    pub class_names: Vec<String>,
    pub recommended: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CanonicalClassGroupSuggestionsIr {
    pub version: u32,
    pub suggestions: Vec<CanonicalClassGroupSuggestionIr>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum CanonicalComposeSuggestionKind {
    Class,
    NativeDeclaration,
    VariantBlock,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CanonicalComposeSuggestionIr {
    pub actual: String,
    pub recommended: String,
    pub class_names: Vec<String>,
    pub kind: CanonicalComposeSuggestionKind,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CanonicalComposeDirectiveIr {
    pub version: u32,
    pub suggestions: Vec<CanonicalComposeSuggestionIr>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub structural_change: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub replacement: Option<String>,
}

#[derive(Debug, Clone, Default)]
pub struct RawValuePolicy {
    pub allow_raw_values: bool,
    pub allow_properties: Vec<String>,
    pub allowed_patterns: Vec<regex::Regex>,
}

impl RawValuePolicy {
    pub fn new(
        allow_raw_values: bool,
        allow_properties: Vec<String>,
        allowed_patterns: Vec<String>,
    ) -> Result<Self, String> {
        let allowed_patterns = allowed_patterns
            .into_iter()
            .map(|pattern| {
                regex::Regex::new(&pattern)
                    .map_err(|error| format!("Invalid lint allowed pattern {pattern:?}: {error}"))
            })
            .collect::<Result<Vec<_>, _>>()?;
        Ok(Self {
            allow_raw_values,
            allow_properties,
            allowed_patterns,
        })
    }
}

#[derive(Debug, Clone, Copy, Default)]
pub struct LintClassListPolicy<'a> {
    pub validation_errors: &'a [Vec<String>],
    pub disallow_unknown_class: bool,
    pub raw_value_policy: Option<&'a RawValuePolicy>,
    pub canonical_options: Option<&'a CanonicalClassNameOptions>,
    pub compose_directive: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LintBatchIr {
    pub version: u32,
    pub sorted_class_names: Vec<String>,
    pub conflicts: Vec<ClassConflictIr>,
    pub partial_conflicts: Vec<PartialClassConflictIr>,
}

#[derive(Debug)]
pub struct LintSession {
    engine: EngineSession,
    variable_keys: Vec<String>,
    variable_values: HashMap<String, String>,
    canonical_index: CanonicalRecommendationIndex,
    supported_native_declarations: HashSet<(String, String)>,
}

#[derive(Debug, Default)]
struct CanonicalRecommendationIndex {
    static_candidates_by_signature: HashMap<String, Vec<String>>,
    preferred_aliases_by_property: HashMap<String, Vec<String>>,
    variable_keys_by_property_signature: HashMap<String, Vec<String>>,
    modes: HashSet<String>,
    breakpoints: HashSet<String>,
    root_size: f64,
    base_unit: f64,
}

#[derive(Debug)]
struct CanonicalClassParts {
    base: String,
    suffix: String,
    key: Option<String>,
    value: Option<String>,
}

#[derive(Debug)]
struct CanonicalCandidate {
    class_name: String,
    order: u8,
}

#[derive(Debug)]
struct MatchingVariableKeys {
    keys: Vec<String>,
    numeric: bool,
}

#[derive(Debug)]
struct CanonicalGroupEntry {
    index: usize,
    class_name: String,
    canonical_class_name: String,
    value: String,
    suffix: String,
    property: String,
    declarations: Vec<(String, String)>,
    rule: GeneratedRuleIr,
}

#[derive(Debug, Clone, Copy)]
struct CompositionRecipe {
    properties: [&'static str; 2],
    target_key: &'static str,
    equivalent_property: Option<(&'static str, [&'static str; 2])>,
}

const COMPOSITION_RECIPES: [CompositionRecipe; 7] = [
    CompositionRecipe {
        properties: ["width", "height"],
        target_key: "size",
        equivalent_property: None,
    },
    CompositionRecipe {
        properties: ["min-width", "min-height"],
        target_key: "min-size",
        equivalent_property: None,
    },
    CompositionRecipe {
        properties: ["max-width", "max-height"],
        target_key: "max-size",
        equivalent_property: None,
    },
    CompositionRecipe {
        properties: ["margin-top", "margin-bottom"],
        target_key: "my",
        equivalent_property: Some(("margin-block", ["margin-top", "margin-bottom"])),
    },
    CompositionRecipe {
        properties: ["margin-left", "margin-right"],
        target_key: "mx",
        equivalent_property: Some(("margin-inline", ["margin-left", "margin-right"])),
    },
    CompositionRecipe {
        properties: ["padding-top", "padding-bottom"],
        target_key: "py",
        equivalent_property: Some(("padding-block", ["padding-top", "padding-bottom"])),
    },
    CompositionRecipe {
        properties: ["padding-left", "padding-right"],
        target_key: "px",
        equivalent_property: Some(("padding-inline", ["padding-left", "padding-right"])),
    },
];

#[derive(Debug, Clone)]
struct ComposeNativeDeclaration {
    property: String,
    value: String,
    important: bool,
}

#[derive(Debug, Default)]
struct ComposeBucket {
    classes: Vec<String>,
    declarations: Vec<ComposeNativeDeclaration>,
    variants: Vec<(String, ComposeBucket)>,
}

const fn default_true() -> bool {
    true
}

#[derive(Debug, Clone)]
struct ClassDescriptor {
    class_name: String,
    matched: bool,
    rule: Option<GeneratedRuleIr>,
    rule_count: usize,
    valid_for_conflicts: bool,
    properties: Vec<String>,
    declarations: Vec<(String, String)>,
    group: u8,
    property_order: u8,
    type_order: u8,
}

impl LintSession {
    pub fn create(manifest_json: &str) -> Result<Self, EngineError> {
        let (variable_keys, variable_values) = collect_manifest_variables(manifest_json);
        let engine = EngineSession::create(manifest_json)?;
        let manifest = serde_json::from_str::<Value>(manifest_json).unwrap_or(Value::Null);
        let canonical_index = build_canonical_recommendation_index(&manifest, &engine)?;
        Ok(Self {
            engine,
            variable_keys,
            variable_values,
            canonical_index,
            supported_native_declarations: HashSet::new(),
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
        self.engine.native_declaration_candidates(class_names)
    }

    pub fn analyze<I, S>(
        &mut self,
        class_names: I,
        native_support: Option<&[bool]>,
        invalid_generated_classes: &HashSet<String>,
    ) -> Result<LintBatchIr, EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        let class_names = class_names
            .into_iter()
            .map(|class_name| class_name.as_ref().to_owned())
            .collect::<Vec<_>>();
        self.analyze_with_matches(class_names, native_support, invalid_generated_classes)
            .map(|(analysis, _)| analysis)
    }

    fn analyze_with_matches(
        &mut self,
        class_names: Vec<String>,
        native_support: Option<&[bool]>,
        invalid_generated_classes: &HashSet<String>,
    ) -> Result<(LintBatchIr, Vec<bool>), EngineError> {
        self.ensure_class_rules(&class_names, native_support)?;
        let descriptors = class_names
            .iter()
            .map(|class_name| {
                let inspection = self.engine.inspect(class_name)?;
                let rule_count = inspection.rules.len();
                Ok(ClassDescriptor::new(
                    class_name,
                    inspection.rules.first().cloned(),
                    rule_count,
                    !invalid_generated_classes.contains(class_name),
                ))
            })
            .collect::<Result<Vec<_>, EngineError>>()?;
        let sorted_class_names = sort_descriptors(&descriptors);
        let conflicts = find_conflicts(&descriptors);
        let partial_conflicts = find_partial_conflicts(
            &descriptors,
            &self.engine,
            &self.variable_keys,
            &self.variable_values,
        )?;
        let matches = descriptors
            .iter()
            .map(|descriptor| descriptor.matched)
            .collect();
        self.engine.delete_class_rules(&class_names)?;
        Ok((
            LintBatchIr {
                version: LINT_BATCH_VERSION,
                sorted_class_names,
                conflicts,
                partial_conflicts,
            },
            matches,
        ))
    }

    pub fn analyze_class_list(
        &mut self,
        class_list: &str,
        class_names: &[String],
        native_support: Option<&[bool]>,
        invalid_generated_classes: &HashSet<String>,
        policy: LintClassListPolicy<'_>,
    ) -> Result<LintClassListIr, EngineError> {
        let (analysis, matches) = self.analyze_with_matches(
            class_names.to_vec(),
            native_support,
            invalid_generated_classes,
        )?;
        let raw_value_candidates = if policy
            .raw_value_policy
            .is_some_and(|policy| !policy.allow_raw_values)
        {
            self.collect_raw_value_candidates(class_names, invalid_generated_classes)?
        } else {
            Vec::new()
        };
        let mut result = class_list::create_class_list_ir(
            class_list,
            class_names,
            analysis,
            class_list::ClassListPolicy {
                matches: &matches,
                validation_errors: policy.validation_errors,
                disallow_unknown_class: policy.disallow_unknown_class,
                raw_value_candidates: &raw_value_candidates,
                raw_value_policy: policy.raw_value_policy,
            },
        );
        if let Some(options) = policy.canonical_options {
            if policy.compose_directive {
                let compose =
                    self.canonical_compose_directive(class_names, native_support, options)?;
                if compose.structural_change == Some(true) {
                    class_list::add_canonical_compose_diagnostics(
                        &mut result,
                        class_list,
                        class_names,
                        &compose,
                    );
                } else {
                    let groups =
                        self.canonical_class_groups(class_names, native_support, options)?;
                    let names = self.canonical_class_names(class_names, native_support, options)?;
                    class_list::add_canonical_class_diagnostics(
                        &mut result,
                        class_list,
                        class_names,
                        &groups.suggestions,
                        &names.suggestions,
                    );
                }
            } else {
                let groups = self.canonical_class_groups(class_names, native_support, options)?;
                let names = self.canonical_class_names(class_names, native_support, options)?;
                class_list::add_canonical_class_diagnostics(
                    &mut result,
                    class_list,
                    class_names,
                    &groups.suggestions,
                    &names.suggestions,
                );
            }
        }
        Ok(result)
    }

    pub fn raw_value_candidates(
        &mut self,
        class_names: &[String],
        native_support: Option<&[bool]>,
        invalid_generated_classes: &HashSet<String>,
    ) -> Result<RawValueCandidatesIr, EngineError> {
        self.ensure_class_rules(class_names, native_support)?;
        let candidates =
            self.collect_raw_value_candidates(class_names, invalid_generated_classes)?;
        self.engine.delete_class_rules(class_names)?;
        Ok(RawValueCandidatesIr {
            version: LINT_BATCH_VERSION,
            candidates,
        })
    }

    pub fn canonical_class_names(
        &mut self,
        class_names: &[String],
        native_support: Option<&[bool]>,
        options: &CanonicalClassNameOptions,
    ) -> Result<CanonicalClassSuggestionsIr, EngineError> {
        self.ensure_class_rules(class_names, native_support)?;
        let result = (|| {
            let mut suggestions = Vec::new();
            for class_name in class_names {
                if let Some(recommended) = self.suggest_canonical_class_name(class_name, options)? {
                    suggestions.push(CanonicalClassSuggestionIr {
                        class_name: class_name.clone(),
                        recommended,
                    });
                }
            }
            Ok(CanonicalClassSuggestionsIr {
                version: LINT_BATCH_VERSION,
                suggestions,
            })
        })();
        let cleanup = self.engine.delete_class_rules(class_names);
        match result {
            Ok(result) => {
                cleanup?;
                Ok(result)
            }
            Err(error) => {
                let _ = cleanup;
                Err(error)
            }
        }
    }

    pub fn canonical_class_groups(
        &mut self,
        class_names: &[String],
        native_support: Option<&[bool]>,
        options: &CanonicalClassNameOptions,
    ) -> Result<CanonicalClassGroupSuggestionsIr, EngineError> {
        if !options.prefer_composition_utilities {
            return Ok(CanonicalClassGroupSuggestionsIr {
                version: LINT_BATCH_VERSION,
                suggestions: Vec::new(),
            });
        }
        self.ensure_class_rules(class_names, native_support)?;
        let result = self.suggest_canonical_class_groups(class_names, options);
        let cleanup = self.engine.delete_class_rules(class_names);
        match result {
            Ok(suggestions) => {
                cleanup?;
                Ok(CanonicalClassGroupSuggestionsIr {
                    version: LINT_BATCH_VERSION,
                    suggestions,
                })
            }
            Err(error) => {
                let _ = cleanup;
                Err(error)
            }
        }
    }

    pub fn canonical_compose_directive(
        &mut self,
        class_names: &[String],
        native_support: Option<&[bool]>,
        options: &CanonicalClassNameOptions,
    ) -> Result<CanonicalComposeDirectiveIr, EngineError> {
        let native_candidates = self.ensure_class_rules(class_names, native_support)?;
        let mut native_declarations = HashMap::new();
        for (index, candidate) in native_candidates.into_iter().enumerate() {
            if native_support
                .and_then(|support| support.get(index))
                .copied()
                .unwrap_or(false)
                && self.is_compose_native_declaration(&candidate)?
            {
                native_declarations.insert(candidate.class_name.clone(), candidate);
            }
        }
        for class_name in class_names {
            if !native_declarations.contains_key(class_name)
                && let Some(candidate) = self.known_native_declaration(class_name)?
            {
                native_declarations.insert(class_name.clone(), candidate);
            }
        }
        let result =
            self.suggest_canonical_compose_directive(class_names, options, native_declarations);
        let cleanup = self.engine.delete_class_rules(class_names);
        match result {
            Ok(result) => {
                cleanup?;
                Ok(result)
            }
            Err(error) => {
                let _ = cleanup;
                Err(error)
            }
        }
    }

    fn ensure_class_rules(
        &mut self,
        class_names: &[String],
        native_support: Option<&[bool]>,
    ) -> Result<Vec<NativeDeclarationCandidateIr>, EngineError> {
        let Some(native_support) = native_support else {
            self.engine.ensure_class_rules(class_names)?;
            return Ok(Vec::new());
        };
        let native_candidates = self.engine.native_declaration_candidates(class_names)?;
        for (index, candidate) in native_candidates.iter().enumerate() {
            if native_support.get(index).copied().unwrap_or(false) {
                self.supported_native_declarations
                    .insert((candidate.property.clone(), candidate.value.clone()));
            }
        }
        self.engine
            .ensure_class_rules_with_native_support(class_names, native_support)?;
        Ok(native_candidates)
    }

    fn known_native_declaration(
        &self,
        class_name: &str,
    ) -> Result<Option<NativeDeclarationCandidateIr>, EngineError> {
        let Some(candidate) = self.compose_native_declaration(class_name)? else {
            return Ok(None);
        };
        if !self
            .supported_native_declarations
            .contains(&(candidate.property.clone(), candidate.value.clone()))
        {
            return Ok(None);
        }
        Ok(Some(candidate))
    }

    fn is_compose_native_declaration(
        &self,
        candidate: &NativeDeclarationCandidateIr,
    ) -> Result<bool, EngineError> {
        Ok(self
            .compose_native_declaration(&candidate.class_name)?
            .is_some_and(|declaration| {
                declaration.property == candidate.property && declaration.value == candidate.value
            }))
    }

    fn compose_native_declaration(
        &self,
        class_name: &str,
    ) -> Result<Option<NativeDeclarationCandidateIr>, EngineError> {
        let semantics = self.engine.inspect_class_semantics(class_name)?;
        if semantics.kind != mastercss_engine::ClassSemanticKind::Declaration
            || semantics.state_token.is_some()
            || !self.engine.class_variable_keys(class_name)?.is_empty()
        {
            return Ok(None);
        }
        let parts = canonical_class_parts(class_name, &semantics);
        let Some(source_key) = parts.key else {
            return Ok(None);
        };
        let inspection = self.engine.inspect(class_name)?;
        if inspection.rules.len() != 1 {
            return Ok(None);
        }
        let rule = &inspection.rules[0];
        if rule.utility_type != 0
            || rule.layer != UtilityLayerName::Utilities
            || !rule.nodes.is_empty()
            || !rule.variable_names.is_empty()
        {
            return Ok(None);
        }
        let declarations = collect_rule_declarations(&rule.text);
        let [(property, value)] = declarations.as_slice() else {
            return Ok(None);
        };
        if source_key != *property {
            return Ok(None);
        }
        Ok(Some(NativeDeclarationCandidateIr {
            class_name: class_name.to_owned(),
            property: property.clone(),
            value: value.clone(),
        }))
    }

    fn suggest_canonical_compose_directive(
        &self,
        class_names: &[String],
        options: &CanonicalClassNameOptions,
        mut native_declarations: HashMap<String, NativeDeclarationCandidateIr>,
    ) -> Result<CanonicalComposeDirectiveIr, EngineError> {
        let group_suggestions = self.suggest_canonical_class_groups(class_names, options)?;
        let covered_class_names = group_suggestions
            .iter()
            .flat_map(|suggestion| suggestion.class_names.iter().cloned())
            .collect::<HashSet<_>>();
        let mut canonical_class_names = class_names.to_vec();
        let mut suggestions = Vec::new();

        for suggestion in group_suggestions {
            replace_compose_class_group(
                &mut canonical_class_names,
                &suggestion.class_names,
                &suggestion.recommended,
            );
            suggestions.push(CanonicalComposeSuggestionIr {
                actual: suggestion.class_names.join(" "),
                recommended: suggestion.recommended,
                class_names: suggestion.class_names,
                kind: CanonicalComposeSuggestionKind::Class,
            });
        }

        for class_name in class_names {
            if covered_class_names.contains(class_name) {
                continue;
            }
            let Some(recommended) = self.suggest_canonical_class_name(class_name, options)? else {
                continue;
            };
            replace_first_compose_class(&mut canonical_class_names, class_name, &recommended);
            if let Some(declaration) = native_declarations.get(class_name).cloned() {
                let source_semantics = self.engine.inspect_class_semantics(class_name)?;
                let recommended_semantics = self.engine.inspect_class_semantics(&recommended)?;
                let source_parts = canonical_class_parts(class_name, &source_semantics);
                let recommended_parts = canonical_class_parts(&recommended, &recommended_semantics);
                if source_parts.base == recommended_parts.base {
                    native_declarations.insert(recommended.clone(), declaration);
                }
            }
            suggestions.push(CanonicalComposeSuggestionIr {
                actual: class_name.clone(),
                recommended,
                class_names: vec![class_name.clone()],
                kind: CanonicalComposeSuggestionKind::Class,
            });
        }

        let canonical_recommendations = suggestions
            .iter()
            .map(|suggestion| suggestion.recommended.clone())
            .collect::<HashSet<_>>();
        let mut bucket = ComposeBucket::default();
        let mut structural_change = false;
        for class_name in canonical_class_names {
            structural_change |= self.process_compose_class(
                &mut bucket,
                &class_name,
                options,
                &native_declarations,
                &canonical_recommendations,
                &mut suggestions,
            )?;
        }

        let replacement = serialize_compose_bucket(&bucket, "");
        Ok(CanonicalComposeDirectiveIr {
            version: LINT_BATCH_VERSION,
            suggestions,
            structural_change: structural_change.then_some(true),
            replacement: (structural_change
                && !replacement.is_empty()
                && !has_duplicate_compose_declaration_properties(&bucket))
            .then_some(replacement),
        })
    }

    fn process_compose_class(
        &self,
        bucket: &mut ComposeBucket,
        class_name: &str,
        options: &CanonicalClassNameOptions,
        native_declarations: &HashMap<String, NativeDeclarationCandidateIr>,
        canonical_recommendations: &HashSet<String>,
        suggestions: &mut Vec<CanonicalComposeSuggestionIr>,
    ) -> Result<bool, EngineError> {
        let semantics = self.engine.inspect_class_semantics(class_name)?;
        if options.prefer_variant_blocks_in_compose
            && let Some(state_token) = semantics.state_token.as_deref()
            && is_safe_compose_variant_token(state_token)
        {
            let parts = canonical_class_parts(class_name, &semantics);
            let base_class_name = format!(
                "{}{}",
                parts.base,
                if semantics.important { "!" } else { "" }
            );
            let variant_index = bucket
                .variants
                .iter()
                .position(|(token, _)| token == state_token)
                .unwrap_or_else(|| {
                    bucket
                        .variants
                        .push((state_token.to_owned(), ComposeBucket::default()));
                    bucket.variants.len() - 1
                });
            let native_declaration =
                native_declarations
                    .get(class_name)
                    .map(|candidate| ComposeNativeDeclaration {
                        property: candidate.property.clone(),
                        value: candidate.value.clone(),
                        important: semantics.important,
                    });
            process_compose_leaf(
                &mut bucket.variants[variant_index].1,
                &base_class_name,
                native_declaration,
                false,
                suggestions,
            );
            if !canonical_recommendations.contains(class_name) {
                suggestions.push(CanonicalComposeSuggestionIr {
                    actual: class_name.to_owned(),
                    recommended: compose_variant_block_text(
                        state_token,
                        &bucket.variants[variant_index].1,
                        "",
                    ),
                    class_names: vec![class_name.to_owned()],
                    kind: CanonicalComposeSuggestionKind::VariantBlock,
                });
            }
            return Ok(true);
        }

        let native_declaration =
            if options.prefer_native_declarations_in_compose && semantics.state_token.is_none() {
                native_declarations
                    .get(class_name)
                    .map(|candidate| ComposeNativeDeclaration {
                        property: candidate.property.clone(),
                        value: candidate.value.clone(),
                        important: semantics.important,
                    })
            } else {
                None
            };
        Ok(process_compose_leaf(
            bucket,
            class_name,
            native_declaration,
            true,
            suggestions,
        ))
    }

    fn suggest_canonical_class_groups(
        &self,
        class_names: &[String],
        options: &CanonicalClassNameOptions,
    ) -> Result<Vec<CanonicalClassGroupSuggestionIr>, EngineError> {
        let mut entries = Vec::new();
        for (index, class_name) in class_names.iter().enumerate() {
            let canonical_class_name = self
                .suggest_canonical_class_name(class_name, options)?
                .unwrap_or_else(|| class_name.clone());
            let inspection = self.engine.inspect(&canonical_class_name)?;
            if inspection.rules.len() != 1 {
                continue;
            }
            let semantics = self.engine.inspect_class_semantics(&canonical_class_name)?;
            let parts = canonical_class_parts(&canonical_class_name, &semantics);
            let Some(value) = parts.value else {
                continue;
            };
            let declarations = collect_rule_declarations(&inspection.rules[0].text);
            if declarations.len() != 1 {
                continue;
            }
            entries.push(CanonicalGroupEntry {
                index,
                class_name: class_name.clone(),
                canonical_class_name,
                value,
                suffix: parts.suffix,
                property: declarations[0].0.clone(),
                declarations,
                rule: inspection.rules[0].clone(),
            });
        }

        let mut suggestions = Vec::new();
        let mut used_indexes = HashSet::new();
        for left_index in 0..entries.len() {
            let left = &entries[left_index];
            if used_indexes.contains(&left.index) {
                continue;
            }
            for right in entries.iter().skip(left_index + 1) {
                if used_indexes.contains(&right.index) {
                    continue;
                }
                let Some(recipe) = matching_composition_recipe(left, right) else {
                    continue;
                };
                let Some(recommended) =
                    self.composition_recommendation(left, right, recipe, options)?
                else {
                    continue;
                };
                suggestions.push(CanonicalClassGroupSuggestionIr {
                    class_names: vec![left.class_name.clone(), right.class_name.clone()],
                    recommended,
                });
                used_indexes.insert(left.index);
                used_indexes.insert(right.index);
                break;
            }
        }
        Ok(suggestions)
    }

    fn composition_recommendation(
        &self,
        left: &CanonicalGroupEntry,
        right: &CanonicalGroupEntry,
        recipe: CompositionRecipe,
        options: &CanonicalClassNameOptions,
    ) -> Result<Option<String>, EngineError> {
        if left.suffix != right.suffix || left.rule.priority != right.rule.priority {
            return Ok(None);
        }
        let Some(merged_declarations) = merge_group_declarations(left, right) else {
            return Ok(None);
        };
        let expected = normalize_composition_declarations(&merged_declarations, recipe);
        let mut candidates = Vec::new();
        for entry in [left, right] {
            let candidate = format!("{}:{}{}", recipe.target_key, entry.value, entry.suffix);
            let candidate = self
                .suggest_canonical_class_name(&candidate, options)?
                .unwrap_or(candidate);
            if !candidates.contains(&candidate) {
                candidates.push(candidate);
            }
        }
        candidates
            .sort_by(|left, right| left.len().cmp(&right.len()).then_with(|| left.cmp(right)));

        for candidate in candidates {
            if candidate == left.canonical_class_name || candidate == right.canonical_class_name {
                continue;
            }
            let inspection = self.engine.inspect(&candidate)?;
            if inspection.rules.len() != 1 {
                continue;
            }
            let rule = &inspection.rules[0];
            if rule.layer != UtilityLayerName::Utilities || rule.priority != left.rule.priority {
                continue;
            }
            let declarations =
                normalize_composition_declarations(&collect_rule_declarations(&rule.text), recipe);
            if declarations == expected {
                return Ok(Some(candidate));
            }
        }
        Ok(None)
    }

    fn suggest_canonical_class_name(
        &self,
        class_name: &str,
        options: &CanonicalClassNameOptions,
    ) -> Result<Option<String>, EngineError> {
        let source = self.engine.inspect(class_name)?;
        if source.rules.is_empty() {
            return Ok(None);
        }
        let semantics = self.engine.inspect_class_semantics(class_name)?;
        let parts = canonical_class_parts(class_name, &semantics);
        let canonical_suffix = canonical_condition_suffix(
            &parts,
            &semantics,
            &source.rules,
            &self.canonical_index,
            options,
        );
        let mut candidates = Vec::new();

        if options.prefer_static_utilities {
            let signature = rules_declaration_signature(&source.rules);
            for candidate_base in self
                .canonical_index
                .static_candidates_by_signature
                .get(&signature)
                .into_iter()
                .flatten()
            {
                push_canonical_candidate(
                    &mut candidates,
                    candidate_base,
                    &parts,
                    &canonical_suffix,
                    0,
                );
            }
        }

        if let (Some(source_key), Some(source_value)) = (&parts.key, &parts.value) {
            if options.prefer_theme_tokens {
                let variable_match =
                    self.matching_multi_value_keys(source_key, source_value, options)?;
                if let Some(variable_match) = variable_match {
                    for source_rule in &source.rules {
                        let signature = declaration_property_signature(source_rule);
                        let candidate_keys = canonical_variable_candidate_keys(
                            &self.canonical_index,
                            &signature,
                            source_key,
                            &variable_match,
                            options.prefer_property_aliases,
                        );
                        for candidate_key in candidate_keys {
                            for variable_key in &variable_match.keys {
                                push_canonical_candidate(
                                    &mut candidates,
                                    &format!("{candidate_key}:{variable_key}"),
                                    &parts,
                                    &canonical_suffix,
                                    1,
                                );
                            }
                        }
                    }
                }
            }

            if options.prefer_property_aliases
                && let Some(source_rule) = source.rules.first()
            {
                for (property, _) in collect_rule_declarations(&source_rule.text) {
                    if source_key != &property {
                        continue;
                    }
                    for alias in self
                        .canonical_index
                        .preferred_aliases_by_property
                        .get(&property)
                        .into_iter()
                        .flatten()
                    {
                        push_canonical_candidate(
                            &mut candidates,
                            &format!("{alias}:{source_value}"),
                            &parts,
                            &canonical_suffix,
                            2,
                        );
                    }
                }
            }
        }

        push_canonical_candidate(&mut candidates, &parts.base, &parts, &canonical_suffix, 3);
        candidates.sort_by(|left, right| {
            left.order
                .cmp(&right.order)
                .then_with(|| left.class_name.len().cmp(&right.class_name.len()))
                .then_with(|| left.class_name.cmp(&right.class_name))
        });
        candidates.dedup_by(|left, right| left.class_name == right.class_name);

        for candidate in candidates {
            if candidate.class_name == class_name {
                continue;
            }
            let candidate_rules = self.engine.inspect(&candidate.class_name)?.rules;
            if !candidate_rules.is_empty()
                && has_same_canonical_rule_shape(&source.rules, &candidate_rules)
            {
                return Ok(Some(candidate.class_name));
            }
        }
        Ok(None)
    }

    fn matching_multi_value_keys(
        &self,
        source_key: &str,
        source_value: &str,
        options: &CanonicalClassNameOptions,
    ) -> Result<Option<MatchingVariableKeys>, EngineError> {
        let segments = split_top_level(source_value, '|');
        if segments.len() <= 1 {
            return self.matching_variable_keys(source_key, source_value, options);
        }
        if !options.prefer_multi_value_tokens || segments.iter().any(|segment| segment.is_empty()) {
            return Ok(None);
        }
        let mut keys = Vec::new();
        let mut numeric = false;
        for segment in segments {
            let Some(matched) = self.matching_variable_keys(source_key, segment, options)? else {
                return Ok(None);
            };
            let Some(key) = matched.keys.first() else {
                return Ok(None);
            };
            keys.push(key.clone());
            numeric |= matched.numeric;
        }
        Ok(Some(MatchingVariableKeys {
            keys: vec![keys.join("|")],
            numeric,
        }))
    }

    fn matching_variable_keys(
        &self,
        source_key: &str,
        source_value: &str,
        options: &CanonicalClassNameOptions,
    ) -> Result<Option<MatchingVariableKeys>, EngineError> {
        let variable_reference = css_variable_reference_name(source_value);
        if variable_reference.is_some() && !options.prefer_variable_references {
            return Ok(None);
        }
        let source_class = format!("{source_key}:{source_value}");
        let source_rules = self.engine.inspect(&source_class)?.rules;
        if source_rules.is_empty() {
            return Ok(None);
        }
        let mut variable_keys = self.engine.class_variable_keys(&source_class)?;
        variable_keys
            .sort_by(|left, right| left.len().cmp(&right.len()).then_with(|| left.cmp(right)));
        variable_keys.dedup();
        let mut token_keys = Vec::new();
        let mut numeric_keys = Vec::new();
        for variable_key in variable_keys {
            let candidate = self
                .engine
                .inspect(&format!("{source_key}:{variable_key}"))?;
            if candidate.rules.is_empty() {
                continue;
            }
            if variable_key == source_value
                || variable_reference.is_some_and(|name| {
                    candidate
                        .rules
                        .iter()
                        .any(|rule| rule.variable_names.iter().any(|variable| variable == name))
                })
            {
                token_keys.push(variable_key);
            } else if candidate.rules.iter().any(|rule| {
                rule.variable_names.iter().any(|variable_name| {
                    self.variable_values
                        .get(variable_name)
                        .is_some_and(|value| {
                            numeric_values_match(
                                source_value,
                                value,
                                self.canonical_index.root_size,
                                self.canonical_index.base_unit,
                            )
                        })
                })
            }) || declarations_match_after_variable_resolution(
                &source_rules,
                &candidate.rules,
                &self.variable_values,
            ) {
                numeric_keys.push(variable_key);
            }
        }
        let (keys, numeric) = if token_keys.is_empty() {
            (numeric_keys, true)
        } else {
            (token_keys, false)
        };
        Ok((!keys.is_empty()).then_some(MatchingVariableKeys { keys, numeric }))
    }

    fn collect_raw_value_candidates(
        &self,
        class_names: &[String],
        invalid_generated_classes: &HashSet<String>,
    ) -> Result<Vec<RawValueCandidateIr>, EngineError> {
        let mut candidates = Vec::new();
        for class_name in class_names {
            if invalid_generated_classes.contains(class_name) {
                continue;
            }
            let semantics = self.engine.inspect_class_semantics(class_name)?;
            let (Some(key_token), Some(value)) = (semantics.key_token, semantics.value_token)
            else {
                continue;
            };
            let variable_keys = self.engine.class_variable_keys(class_name)?;
            if variable_keys.is_empty() {
                continue;
            }
            let segments = split_top_level(&value, '|')
                .into_iter()
                .filter(|segment| !variable_keys.iter().any(|key| key == segment))
                .map(str::to_owned)
                .collect::<Vec<_>>();
            if segments.is_empty() {
                continue;
            }
            let inspection = self.engine.inspect(class_name)?;
            let mut properties = inspection
                .rules
                .iter()
                .flat_map(|rule| collect_rule_declarations(&rule.text))
                .map(|(property, _)| property)
                .collect::<Vec<_>>();
            properties.sort();
            properties.dedup();
            candidates.push(RawValueCandidateIr {
                class_name: class_name.clone(),
                key: key_token.trim_end_matches(':').to_owned(),
                segments,
                properties,
            });
        }
        Ok(candidates)
    }

    pub fn dispose(&mut self) {
        self.engine.dispose();
    }
}

fn replace_first_compose_class(class_names: &mut [String], source: &str, replacement: &str) {
    if let Some(class_name) = class_names
        .iter_mut()
        .find(|class_name| *class_name == source)
    {
        *class_name = replacement.to_owned();
    }
}

fn remove_first_compose_class(class_names: &mut Vec<String>, source: &str) {
    if let Some(index) = class_names
        .iter()
        .position(|class_name| class_name == source)
    {
        class_names.remove(index);
    }
}

fn replace_compose_class_group(
    class_names: &mut Vec<String>,
    sources: &[String],
    replacement: &str,
) {
    let Some((first, remaining)) = sources.split_first() else {
        return;
    };
    replace_first_compose_class(class_names, first, replacement);
    for source in remaining {
        remove_first_compose_class(class_names, source);
    }
}

fn is_safe_compose_variant_token(token: &str) -> bool {
    if token.is_empty() || (!token.starts_with(':') && !token.starts_with('@')) {
        return false;
    }
    token
        .split('@')
        .skip(1)
        .all(|segment| !segment.is_empty() && !segment.contains(':'))
}

fn compose_variant_keyword(condition: &str) -> String {
    let token = condition.strip_prefix('@').unwrap_or(condition);
    if matches!(token, "dark" | "light") {
        format!("@{token}")
    } else {
        format!("@variant {token}")
    }
}

fn compose_declaration_text(declaration: &ComposeNativeDeclaration) -> String {
    format!(
        "{}: {}{};",
        declaration.property,
        declaration.value,
        if declaration.important {
            " !important"
        } else {
            ""
        }
    )
}

fn compose_block_text(header: &str, body: &str, indent: &str) -> String {
    if !body.contains('\n') {
        return format!("{header} {{ {body} }}");
    }
    format!(
        "{header} {{\n{}\n{indent}}}",
        body.lines()
            .map(|line| format!("{indent}    {line}"))
            .collect::<Vec<_>>()
            .join("\n")
    )
}

fn compose_variant_condition_block_text(
    condition: &str,
    bucket: &ComposeBucket,
    indent: &str,
) -> String {
    compose_block_text(
        &compose_variant_keyword(condition),
        &serialize_compose_bucket(bucket, &format!("{indent}    ")),
        indent,
    )
}

fn compose_variant_block_text(token: &str, bucket: &ComposeBucket, indent: &str) -> String {
    let parts = split_top_level(token, '@');
    let selector = parts.first().copied().unwrap_or_default();
    let condition = parts.iter().skip(1).copied().collect::<Vec<_>>().join("@");
    if !selector.is_empty() {
        let selector_header = if selector.starts_with('&') {
            selector.to_owned()
        } else {
            format!("&{selector}")
        };
        let body = if condition.is_empty() {
            serialize_compose_bucket(bucket, &format!("{indent}    "))
        } else {
            compose_variant_condition_block_text(&condition, bucket, &format!("{indent}    "))
        };
        compose_block_text(&selector_header, &body, indent)
    } else {
        compose_variant_condition_block_text(
            if condition.is_empty() {
                token
            } else {
                &condition
            },
            bucket,
            indent,
        )
    }
}

fn serialize_compose_bucket(bucket: &ComposeBucket, indent: &str) -> String {
    let mut lines = Vec::new();
    if !bucket.classes.is_empty() {
        lines.push(format!("@compose {};", bucket.classes.join(" ")));
    }
    lines.extend(bucket.declarations.iter().map(compose_declaration_text));
    lines.extend(
        bucket
            .variants
            .iter()
            .map(|(token, bucket)| compose_variant_block_text(token, bucket, indent)),
    );
    lines.join("\n")
}

fn has_duplicate_compose_declaration_properties(bucket: &ComposeBucket) -> bool {
    let mut properties = HashSet::new();
    if bucket
        .declarations
        .iter()
        .any(|declaration| !properties.insert(&declaration.property))
    {
        return true;
    }
    bucket
        .variants
        .iter()
        .any(|(_, bucket)| has_duplicate_compose_declaration_properties(bucket))
}

fn process_compose_leaf(
    bucket: &mut ComposeBucket,
    class_name: &str,
    declaration: Option<ComposeNativeDeclaration>,
    report_native_declaration: bool,
    suggestions: &mut Vec<CanonicalComposeSuggestionIr>,
) -> bool {
    let Some(declaration) = declaration else {
        bucket.classes.push(class_name.to_owned());
        return false;
    };
    if report_native_declaration {
        let recommended = compose_declaration_text(&declaration)
            .strip_suffix(';')
            .unwrap_or_default()
            .to_owned();
        suggestions.push(CanonicalComposeSuggestionIr {
            actual: class_name.to_owned(),
            recommended,
            class_names: vec![class_name.to_owned()],
            kind: CanonicalComposeSuggestionKind::NativeDeclaration,
        });
    }
    bucket.declarations.push(declaration);
    true
}

fn matching_composition_recipe(
    left: &CanonicalGroupEntry,
    right: &CanonicalGroupEntry,
) -> Option<CompositionRecipe> {
    COMPOSITION_RECIPES.iter().copied().find(|recipe| {
        (left.property == recipe.properties[0] && right.property == recipe.properties[1])
            || (left.property == recipe.properties[1] && right.property == recipe.properties[0])
    })
}

fn merge_group_declarations(
    left: &CanonicalGroupEntry,
    right: &CanonicalGroupEntry,
) -> Option<Vec<(String, String)>> {
    let mut merged = Vec::new();
    for (property, value) in left.declarations.iter().chain(&right.declarations) {
        if let Some((_, existing)) = merged
            .iter()
            .find(|(existing_property, _)| existing_property == property)
        {
            if existing != value {
                return None;
            }
            continue;
        }
        merged.push((property.clone(), value.clone()));
    }
    Some(merged)
}

fn normalize_composition_declarations(
    declarations: &[(String, String)],
    recipe: CompositionRecipe,
) -> Vec<(String, String)> {
    let mut normalized = Vec::new();
    for (property, value) in declarations {
        if let Some((equivalent, properties)) = recipe.equivalent_property
            && property == equivalent
        {
            normalized.extend(
                properties
                    .into_iter()
                    .map(|property| (property.to_owned(), value.clone())),
            );
        } else {
            normalized.push((property.clone(), value.clone()));
        }
    }
    normalized.sort();
    normalized
}

fn push_index_value(map: &mut HashMap<String, Vec<String>>, key: &str, value: &str) {
    let values = map.entry(key.to_owned()).or_default();
    if !values.iter().any(|existing| existing == value) {
        values.push(value.to_owned());
    }
}

fn manifest_utility_property_signatures(utility: &serde_json::Map<String, Value>) -> Vec<String> {
    let Some(emit) = utility.get("emit").and_then(Value::as_object) else {
        return Vec::new();
    };
    let mut signatures = Vec::new();
    match emit.get("type").and_then(Value::as_str) {
        Some("static") => {
            for rule in emit
                .get("rules")
                .and_then(Value::as_array)
                .into_iter()
                .flatten()
            {
                if let Some(declarations) = rule.get("declarations").and_then(Value::as_object) {
                    let mut properties = declarations.keys().cloned().collect::<Vec<_>>();
                    properties.sort();
                    let signature = properties.join("\0");
                    if !signature.is_empty() && !signatures.contains(&signature) {
                        signatures.push(signature);
                    }
                }
            }
        }
        Some("property") => {
            if let Some(property) = emit.get("property").and_then(Value::as_str) {
                signatures.push(property.to_owned());
            }
        }
        Some("template") => {
            if let Some(declarations) = emit.get("declarations").and_then(Value::as_object) {
                let mut properties = declarations.keys().cloned().collect::<Vec<_>>();
                properties.sort();
                let signature = properties.join("\0");
                if !signature.is_empty() {
                    signatures.push(signature);
                }
            }
        }
        _ => {}
    }
    signatures
}

fn build_canonical_recommendation_index(
    manifest: &Value,
    engine: &EngineSession,
) -> Result<CanonicalRecommendationIndex, EngineError> {
    let mut index = CanonicalRecommendationIndex::default();
    for (alias, property) in builtin_key_aliases() {
        push_index_value(&mut index.preferred_aliases_by_property, property, alias);
    }
    for aliases in index.preferred_aliases_by_property.values_mut() {
        aliases.sort_by(|left, right| left.len().cmp(&right.len()).then_with(|| left.cmp(right)));
    }
    for property in builtin_native_value_properties() {
        for alias in index
            .preferred_aliases_by_property
            .get(property)
            .cloned()
            .unwrap_or_default()
        {
            push_index_value(
                &mut index.variable_keys_by_property_signature,
                property,
                &alias,
            );
        }
        push_index_value(
            &mut index.variable_keys_by_property_signature,
            property,
            property,
        );
    }

    for utility in manifest
        .get("utilities")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(Value::as_object)
    {
        let property_signatures = manifest_utility_property_signatures(utility);
        for matcher in utility
            .get("matchers")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .filter_map(Value::as_object)
        {
            let matcher_type = matcher.get("type").and_then(Value::as_str);
            if matcher_type == Some("variable") {
                for key in matcher
                    .get("keys")
                    .and_then(Value::as_array)
                    .into_iter()
                    .flatten()
                    .filter_map(Value::as_str)
                {
                    for signature in &property_signatures {
                        push_index_value(
                            &mut index.variable_keys_by_property_signature,
                            signature,
                            key,
                        );
                    }
                }
            }

            if utility.get("type").and_then(Value::as_i64) != Some(-2)
                || utility
                    .get("layer")
                    .and_then(Value::as_str)
                    .is_some_and(|layer| layer != "utilities")
            {
                continue;
            }
            let mut names = Vec::new();
            match matcher_type {
                Some("static") => {
                    if let Some(name) = matcher.get("name").and_then(Value::as_str) {
                        names.push(name.to_owned());
                    }
                }
                Some("pattern") => {
                    let prefix = matcher
                        .get("prefix")
                        .and_then(Value::as_str)
                        .unwrap_or_default();
                    names.extend(
                        matcher
                            .get("values")
                            .and_then(Value::as_array)
                            .into_iter()
                            .flatten()
                            .filter_map(Value::as_str)
                            .map(|value| format!("{prefix}{value}")),
                    );
                }
                _ => {}
            }
            for name in names {
                if name.contains(':') {
                    continue;
                }
                let rules = engine.inspect(&name)?.rules;
                if rules.is_empty()
                    || rules
                        .iter()
                        .any(|rule| rule.layer != UtilityLayerName::Utilities)
                {
                    continue;
                }
                push_index_value(
                    &mut index.static_candidates_by_signature,
                    &rules_declaration_signature(&rules),
                    &name,
                );
            }
        }
    }
    for values in index.static_candidates_by_signature.values_mut() {
        values.sort_by(|left, right| left.len().cmp(&right.len()).then_with(|| left.cmp(right)));
    }
    for values in index.variable_keys_by_property_signature.values_mut() {
        values.sort_by(|left, right| left.len().cmp(&right.len()).then_with(|| left.cmp(right)));
    }

    index.root_size = manifest
        .get("settings")
        .and_then(|settings| settings.get("rootSize"))
        .and_then(Value::as_f64)
        .unwrap_or(16.0);
    index.base_unit = manifest
        .get("settings")
        .and_then(|settings| settings.get("baseUnit"))
        .and_then(Value::as_f64)
        .unwrap_or(4.0);

    index.modes.extend(
        manifest
            .get("settings")
            .and_then(|settings| settings.get("modes"))
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .filter_map(Value::as_str)
            .map(str::to_owned),
    );
    if index.modes.is_empty() {
        index.modes.extend(["light".into(), "dark".into()]);
    }
    index.breakpoints.extend(
        manifest
            .get("breakpointConditions")
            .and_then(Value::as_object)
            .into_iter()
            .flat_map(|conditions| conditions.keys().cloned()),
    );
    Ok(index)
}

fn rules_declaration_signature(rules: &[GeneratedRuleIr]) -> String {
    let mut signatures = rules
        .iter()
        .map(|rule| {
            serde_json::to_string(&collect_rule_declarations(&rule.text)).unwrap_or_default()
        })
        .collect::<Vec<_>>();
    signatures.sort();
    signatures.join("\0")
}

fn declaration_property_signature(rule: &GeneratedRuleIr) -> String {
    let mut properties = collect_rule_declarations(&rule.text)
        .into_iter()
        .map(|(property, _)| property)
        .collect::<Vec<_>>();
    properties.sort();
    properties.dedup();
    properties.join("\0")
}

fn canonical_class_parts(
    class_name: &str,
    semantics: &ClassSemanticInspection,
) -> CanonicalClassParts {
    let key = semantics
        .key_token
        .as_deref()
        .map(|key| key.trim_end_matches(':').to_owned());
    let value = semantics.value_token.clone();
    let base_end = if let (Some(key_token), Some(value_token)) =
        (&semantics.key_token, &semantics.value_token)
    {
        (key_token.len() + value_token.len()).min(class_name.len())
    } else {
        let semantic = class_name.strip_suffix('!').unwrap_or(class_name);
        let mut end = semantics
            .state_token
            .as_deref()
            .filter(|state| semantic.ends_with(*state))
            .map_or(semantic.len(), |state| semantic.len() - state.len());
        if semantic.as_bytes().get(end.wrapping_sub(1)) == Some(&b'!') {
            end = end.saturating_sub(1);
        }
        end
    };
    CanonicalClassParts {
        base: class_name[..base_end].to_owned(),
        suffix: class_name[base_end..].to_owned(),
        key,
        value,
    }
}

fn safe_breakpoint_name<'a>(token: &'a str, breakpoints: &HashSet<String>) -> Option<&'a str> {
    let name = token
        .strip_prefix(">=")
        .or_else(|| token.strip_prefix("<="))
        .or_else(|| token.strip_prefix('>'))
        .or_else(|| token.strip_prefix('<'))
        .unwrap_or(token);
    (!name.is_empty()
        && name
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '_' | '-'))
        && breakpoints.contains(name))
    .then_some(name)
}

fn canonical_condition_suffix(
    parts: &CanonicalClassParts,
    semantics: &ClassSemanticInspection,
    rules: &[GeneratedRuleIr],
    index: &CanonicalRecommendationIndex,
    options: &CanonicalClassNameOptions,
) -> String {
    if !options.prefer_condition_order
        || rules
            .iter()
            .any(|rule| rule.layer != UtilityLayerName::Utilities)
    {
        return parts.suffix.clone();
    }
    let Some(state_token) = semantics.state_token.as_deref() else {
        return parts.suffix.clone();
    };
    if !state_token.contains('@') {
        return parts.suffix.clone();
    }
    let state_parts = split_top_level(state_token, '@');
    if state_parts.len() <= 2 || state_parts.iter().skip(1).any(|part| part.is_empty()) {
        return parts.suffix.clone();
    }
    let selector_prefix = state_parts[0];
    let mut mode = None;
    let mut breakpoints = Vec::new();
    for condition in state_parts.into_iter().skip(1) {
        let is_mode = index.modes.contains(condition);
        let is_breakpoint = safe_breakpoint_name(condition, &index.breakpoints).is_some();
        if is_mode && is_breakpoint {
            return parts.suffix.clone();
        }
        if is_mode {
            if mode.is_some() {
                return parts.suffix.clone();
            }
            mode = Some(condition);
        } else if is_breakpoint {
            breakpoints.push(condition);
        } else {
            return parts.suffix.clone();
        }
    }
    let Some(mode) = mode else {
        return parts.suffix.clone();
    };
    if breakpoints.is_empty() {
        return parts.suffix.clone();
    }
    let canonical_state = format!(
        "{selector_prefix}{}@{mode}",
        breakpoints
            .iter()
            .map(|condition| format!("@{condition}"))
            .collect::<String>()
    );
    if canonical_state == state_token {
        return parts.suffix.clone();
    }
    format!(
        "{}{canonical_state}",
        if semantics.important { "!" } else { "" }
    )
}

fn push_canonical_candidate(
    candidates: &mut Vec<CanonicalCandidate>,
    candidate_base: &str,
    parts: &CanonicalClassParts,
    suffix: &str,
    order: u8,
) {
    if candidate_base.is_empty() || (candidate_base == parts.base && suffix == parts.suffix) {
        return;
    }
    let class_name = format!("{candidate_base}{suffix}");
    if candidates
        .iter()
        .any(|candidate| candidate.class_name == class_name)
    {
        return;
    }
    candidates.push(CanonicalCandidate { class_name, order });
}

fn canonical_variable_candidate_keys(
    index: &CanonicalRecommendationIndex,
    signature: &str,
    source_key: &str,
    matched: &MatchingVariableKeys,
    prefer_property_aliases: bool,
) -> Vec<String> {
    let mut keys = vec![source_key.to_owned()];
    for key in index
        .variable_keys_by_property_signature
        .get(signature)
        .into_iter()
        .flatten()
    {
        if !keys.contains(key) {
            keys.push(key.clone());
        }
    }
    if !prefer_property_aliases {
        let aliases = index
            .preferred_aliases_by_property
            .get(signature)
            .cloned()
            .unwrap_or_default();
        keys.retain(|key| key == source_key || !aliases.contains(key));
    }
    if !matched.numeric {
        keys.retain(|key| key == source_key || signature == source_key);
    }
    keys
}

fn css_variable_reference_name(value: &str) -> Option<&str> {
    value
        .strip_prefix("var(--")
        .and_then(|value| value.strip_suffix(')'))
        .filter(|name| {
            !name.is_empty()
                && name.chars().all(|character| {
                    character.is_ascii_alphanumeric() || matches!(character, '_' | '-')
                })
        })
}

fn normalized_numeric_value(value: &str, root_size: f64, base_unit: f64) -> Option<(bool, f64)> {
    let split = value
        .char_indices()
        .find(|(_, character)| character.is_ascii_alphabetic() || *character == '%')
        .map_or(value.len(), |(index, _)| index);
    let number = value[..split].parse::<f64>().ok()?;
    match value[split..].to_ascii_lowercase().as_str() {
        "" => Some((false, number)),
        "rem" => Some((true, number)),
        "px" if root_size != 0.0 => Some((true, number / root_size)),
        "x" if root_size != 0.0 => Some((true, number * base_unit / root_size)),
        _ => None,
    }
}

fn numeric_values_match(left: &str, right: &str, root_size: f64, base_unit: f64) -> bool {
    let (Some(left), Some(right)) = (
        normalized_numeric_value(left, root_size, base_unit),
        normalized_numeric_value(right, root_size, base_unit),
    ) else {
        return false;
    };
    left.0 == right.0 && (left.1 - right.1).abs() < 0.000001
}

fn resolved_rule_declarations(
    rule: &GeneratedRuleIr,
    variable_values: &HashMap<String, String>,
) -> Vec<(String, String)> {
    collect_rule_declarations(&rule.text)
        .into_iter()
        .map(|(property, mut value)| {
            for variable_name in &rule.variable_names {
                if let Some(variable_value) = variable_values.get(variable_name) {
                    value = value.replace(
                        &format!("var(--{variable_name})"),
                        &normalize_css_variable_value(variable_value),
                    );
                }
            }
            (property, normalize_css_variable_value(&value))
        })
        .collect()
}

fn declarations_match_after_variable_resolution(
    source: &[GeneratedRuleIr],
    candidate: &[GeneratedRuleIr],
    variable_values: &HashMap<String, String>,
) -> bool {
    if source.len() != candidate.len() {
        return false;
    }
    let mut source = source
        .iter()
        .map(|rule| resolved_rule_declarations(rule, variable_values))
        .collect::<Vec<_>>();
    let mut candidate = candidate
        .iter()
        .map(|rule| resolved_rule_declarations(rule, variable_values))
        .collect::<Vec<_>>();
    source.sort();
    candidate.sort();
    source == candidate
}

fn has_same_canonical_rule_shape(
    source: &[GeneratedRuleIr],
    candidate: &[GeneratedRuleIr],
) -> bool {
    if source.len() != candidate.len() {
        return false;
    }
    let mut remaining = candidate.iter().collect::<Vec<_>>();
    for source_rule in source {
        let source_signature = declaration_property_signature(source_rule);
        let Some(index) = remaining.iter().position(|candidate_rule| {
            candidate_rule.layer == source_rule.layer
                && candidate_rule.priority == source_rule.priority
                && declaration_property_signature(candidate_rule) == source_signature
        }) else {
            return false;
        };
        remaining.remove(index);
    }
    true
}

impl ClassDescriptor {
    fn unknown(class_name: &str) -> Self {
        Self {
            class_name: class_name.to_owned(),
            matched: false,
            rule: None,
            rule_count: 0,
            valid_for_conflicts: false,
            properties: Vec::new(),
            declarations: Vec::new(),
            group: UNKNOWN_PROPERTY_GROUP_ORDER,
            property_order: UNKNOWN_PROPERTY_ORDER,
            type_order: 0,
        }
    }

    fn new(
        class_name: &str,
        rule: Option<GeneratedRuleIr>,
        rule_count: usize,
        valid_for_conflicts: bool,
    ) -> Self {
        let Some(rule) = rule else {
            return Self::unknown(class_name);
        };
        let declarations = collect_rule_declarations(&rule.text);
        let mut properties = declarations
            .iter()
            .map(|(property, _)| property.clone())
            .collect::<Vec<_>>();
        properties.sort();
        properties.dedup();
        let (group, property_order) = properties
            .iter()
            .map(|property| get_property_order(property))
            .min()
            .unwrap_or((UNKNOWN_PROPERTY_GROUP_ORDER, UNKNOWN_PROPERTY_ORDER));
        let type_order = if rule.utility_type == -2 && !has_dynamic_value(class_name) {
            0
        } else if rule.utility_type == -2 {
            1
        } else {
            2
        };
        Self {
            class_name: class_name.to_owned(),
            matched: true,
            rule: Some(rule),
            rule_count,
            valid_for_conflicts,
            properties,
            declarations,
            group,
            property_order,
            type_order,
        }
    }
}

fn sort_descriptors(descriptors: &[ClassDescriptor]) -> Vec<String> {
    let mut seen = HashSet::new();
    let mut descriptors = descriptors
        .iter()
        .filter(|descriptor| seen.insert(descriptor.class_name.clone()))
        .cloned()
        .collect::<Vec<_>>();
    descriptors.sort_by(compare_descriptors);
    descriptors
        .into_iter()
        .map(|descriptor| descriptor.class_name)
        .collect()
}

fn compare_descriptors(left: &ClassDescriptor, right: &ClassDescriptor) -> Ordering {
    match (&left.rule, &right.rule) {
        (None, None) => return left.class_name.cmp(&right.class_name),
        (None, Some(_)) => return Ordering::Greater,
        (Some(_), None) => return Ordering::Less,
        _ => {}
    }
    let left_rule = left.rule.as_ref().expect("known descriptor has a rule");
    let right_rule = right.rule.as_ref().expect("known descriptor has a rule");
    layer_order(left_rule.layer)
        .cmp(&layer_order(right_rule.layer))
        .then_with(|| left_rule.sort_tier.cmp(&right_rule.sort_tier))
        .then_with(|| {
            compare_condition_features(&left_rule.priority.features, &right_rule.priority.features)
        })
        .then_with(|| {
            left_rule
                .priority
                .selector
                .cmp(&right_rule.priority.selector)
        })
        .then_with(|| (left.group, left.property_order).cmp(&(right.group, right.property_order)))
        .then_with(|| left.type_order.cmp(&right.type_order))
        .then_with(|| left_rule.utility_type.cmp(&right_rule.utility_type))
        .then_with(|| natural_compare(&left_rule.key, &right_rule.key))
        .then_with(|| left.class_name.cmp(&right.class_name))
}

fn find_conflicts(descriptors: &[ClassDescriptor]) -> Vec<ClassConflictIr> {
    let mut conflicts = Vec::new();
    for (index, descriptor) in descriptors.iter().enumerate() {
        if !descriptor.valid_for_conflicts {
            continue;
        }
        let Some(rule) = descriptor.rule.as_ref() else {
            continue;
        };
        let mut last_conflict = None;
        for compare in &descriptors[index + 1..] {
            if !compare.valid_for_conflicts {
                continue;
            }
            let Some(compare_rule) = compare.rule.as_ref() else {
                continue;
            };
            if descriptor.properties == compare.properties
                && equal_variant_scope(rule, compare_rule)
            {
                last_conflict = Some(compare.class_name.clone());
            }
        }
        if let Some(conflict) = last_conflict {
            conflicts.push(ClassConflictIr {
                class_name: descriptor.class_name.clone(),
                conflicts: vec![conflict],
            });
        }
    }
    conflicts
}

fn equal_variant_scope(left: &GeneratedRuleIr, right: &GeneratedRuleIr) -> bool {
    left.layer == right.layer
        && branch_key(&left.key) == branch_key(&right.key)
        && left.sort_tier == right.sort_tier
        && left.priority == right.priority
}

fn branch_key(key: &str) -> &str {
    key.split_once('\0').map_or("", |(_, branch)| branch)
}

fn has_dynamic_value(class_name: &str) -> bool {
    let mut depth = 0_u32;
    for character in class_name.chars() {
        match character {
            '{' | '[' | '(' => depth += 1,
            '}' | ']' | ')' => depth = depth.saturating_sub(1),
            ':' if depth == 0 => return true,
            _ => {}
        }
    }
    false
}

fn layer_order(layer: UtilityLayerName) -> u8 {
    match layer {
        UtilityLayerName::Base => 1,
        UtilityLayerName::Defaults => 2,
        UtilityLayerName::Components => 3,
        UtilityLayerName::Utilities => 4,
    }
}

fn collect_rule_declarations(text: &str) -> Vec<(String, String)> {
    let mut declarations = Vec::new();
    let mut stack = Vec::new();
    let mut quote = None;
    let mut escaped = false;
    for (index, character) in text.char_indices() {
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
            continue;
        }
        if character == '{' {
            stack.push(index + 1);
        } else if character == '}'
            && let Some(start) = stack.pop()
            && !text[start..index].contains('{')
        {
            for declaration in split_top_level(&text[start..index], ';') {
                let Some((property, value)) = declaration.split_once(':') else {
                    continue;
                };
                let property = property.trim();
                let value = value
                    .trim()
                    .strip_suffix("!important")
                    .unwrap_or(value.trim());
                if !property.is_empty()
                    && !declarations
                        .iter()
                        .any(|entry: &(String, String)| entry.0 == property && entry.1 == value)
                {
                    declarations.push((property.to_owned(), value.to_owned()));
                }
            }
        }
    }
    declarations.sort();
    declarations
}

fn split_top_level(source: &str, separator: char) -> Vec<&str> {
    let mut values = Vec::new();
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
        if matches!(character, '\'' | '"') {
            quote = Some(character);
        } else if matches!(character, '(' | '[') {
            depth += 1;
        } else if matches!(character, ')' | ']') {
            depth = depth.saturating_sub(1);
        } else if depth == 0 && character == separator {
            values.push(&source[start..index]);
            start = index + character.len_utf8();
        }
    }
    values.push(&source[start..]);
    values
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum PartialConflictFamily {
    Margin,
    Padding,
    Inset,
    Radius,
    BorderWidth,
    BorderColor,
    BorderStyle,
}

const PARTIAL_CONFLICT_FAMILIES: [PartialConflictFamily; 7] = [
    PartialConflictFamily::Margin,
    PartialConflictFamily::Padding,
    PartialConflictFamily::Inset,
    PartialConflictFamily::Radius,
    PartialConflictFamily::BorderWidth,
    PartialConflictFamily::BorderColor,
    PartialConflictFamily::BorderStyle,
];
const PHYSICAL_SIDES: [&str; 4] = ["top", "right", "bottom", "left"];
const RADIUS_CORNERS: [&str; 4] = ["top-left", "top-right", "bottom-right", "bottom-left"];

#[derive(Debug, Clone)]
struct ParsedClassParts {
    key: Option<String>,
    value: Option<String>,
    suffix: String,
}

#[derive(Debug, Clone)]
struct PartialConflictEntry {
    class_name: String,
    value: String,
    suffix: String,
    family: PartialConflictFamily,
    parts: Vec<&'static str>,
    rule: GeneratedRuleIr,
    declarations: Vec<(String, String)>,
}

impl PartialConflictFamily {
    fn name(self) -> &'static str {
        match self {
            Self::Margin => "margin",
            Self::Padding => "padding",
            Self::Inset => "inset",
            Self::Radius => "radius",
            Self::BorderWidth => "border-width",
            Self::BorderColor => "border-color",
            Self::BorderStyle => "border-style",
        }
    }

    fn part_order(self) -> &'static [&'static str] {
        match self {
            Self::Radius => &RADIUS_CORNERS,
            _ => &PHYSICAL_SIDES,
        }
    }

    fn requires_property_match(self) -> bool {
        !matches!(self, Self::Margin | Self::Padding)
    }

    fn disallows_multi_value(self) -> bool {
        self.requires_property_match()
    }

    fn key_parts(self, key: &str) -> Option<&'static [&'static str]> {
        match self {
            Self::Margin => match key {
                "m" | "margin" => Some(&PHYSICAL_SIDES),
                "mx" => Some(&["right", "left"]),
                "my" => Some(&["top", "bottom"]),
                "mt" | "margin-top" => Some(&["top"]),
                "mr" | "margin-right" => Some(&["right"]),
                "mb" | "margin-bottom" => Some(&["bottom"]),
                "ml" | "margin-left" => Some(&["left"]),
                _ => None,
            },
            Self::Padding => match key {
                "p" | "padding" => Some(&PHYSICAL_SIDES),
                "px" => Some(&["right", "left"]),
                "py" => Some(&["top", "bottom"]),
                "pt" | "padding-top" => Some(&["top"]),
                "pr" | "padding-right" => Some(&["right"]),
                "pb" | "padding-bottom" => Some(&["bottom"]),
                "pl" | "padding-left" => Some(&["left"]),
                _ => None,
            },
            Self::Inset => match key {
                "inset" => Some(&PHYSICAL_SIDES),
                "top" => Some(&["top"]),
                "right" => Some(&["right"]),
                "bottom" => Some(&["bottom"]),
                "left" => Some(&["left"]),
                _ => None,
            },
            Self::Radius => match key {
                "r" | "border-radius" => Some(&RADIUS_CORNERS),
                "rtl" | "border-top-left-radius" => Some(&["top-left"]),
                "rtr" | "border-top-right-radius" => Some(&["top-right"]),
                "rbr" | "border-bottom-right-radius" => Some(&["bottom-right"]),
                "rbl" | "border-bottom-left-radius" => Some(&["bottom-left"]),
                _ => None,
            },
            Self::BorderWidth => match key {
                "b" | "border-width" => Some(&PHYSICAL_SIDES),
                "bt" | "border-top-width" => Some(&["top"]),
                "br" | "border-right-width" => Some(&["right"]),
                "bb" | "border-bottom-width" => Some(&["bottom"]),
                "bl" | "border-left-width" => Some(&["left"]),
                _ => None,
            },
            Self::BorderColor => match key {
                "b" | "border-color" => Some(&PHYSICAL_SIDES),
                "bt" | "border-top-color" => Some(&["top"]),
                "br" | "border-right-color" => Some(&["right"]),
                "bb" | "border-bottom-color" => Some(&["bottom"]),
                "bl" | "border-left-color" => Some(&["left"]),
                _ => None,
            },
            Self::BorderStyle => match key {
                "b" | "border-style" => Some(&PHYSICAL_SIDES),
                "bt" | "border-top-style" => Some(&["top"]),
                "br" | "border-right-style" => Some(&["right"]),
                "bb" | "border-bottom-style" => Some(&["bottom"]),
                "bl" | "border-left-style" => Some(&["left"]),
                _ => None,
            },
        }
    }

    fn property_parts(self, property: &str) -> Option<&'static [&'static str]> {
        match self {
            Self::Inset => match property {
                "inset" => Some(&PHYSICAL_SIDES),
                "top" => Some(&["top"]),
                "right" => Some(&["right"]),
                "bottom" => Some(&["bottom"]),
                "left" => Some(&["left"]),
                _ => None,
            },
            Self::Radius => match property {
                "border-radius" => Some(&RADIUS_CORNERS),
                "border-top-left-radius" => Some(&["top-left"]),
                "border-top-right-radius" => Some(&["top-right"]),
                "border-bottom-right-radius" => Some(&["bottom-right"]),
                "border-bottom-left-radius" => Some(&["bottom-left"]),
                _ => None,
            },
            Self::BorderWidth => border_property_parts(property, "width"),
            Self::BorderColor => border_property_parts(property, "color"),
            Self::BorderStyle => border_property_parts(property, "style"),
            Self::Margin | Self::Padding => None,
        }
    }

    fn replacement_key(self, parts: &[&str]) -> Option<&'static str> {
        let key = ordered_part_key(self, parts);
        match self {
            Self::Margin => match key.as_str() {
                "top|right|bottom|left" => Some("m"),
                "right|left" => Some("mx"),
                "top|bottom" => Some("my"),
                "top" => Some("mt"),
                "right" => Some("mr"),
                "bottom" => Some("mb"),
                "left" => Some("ml"),
                _ => None,
            },
            Self::Padding => match key.as_str() {
                "top|right|bottom|left" => Some("p"),
                "right|left" => Some("px"),
                "top|bottom" => Some("py"),
                "top" => Some("pt"),
                "right" => Some("pr"),
                "bottom" => Some("pb"),
                "left" => Some("pl"),
                _ => None,
            },
            Self::Inset => match key.as_str() {
                "top|right|bottom|left" => Some("inset"),
                "top" => Some("top"),
                "right" => Some("right"),
                "bottom" => Some("bottom"),
                "left" => Some("left"),
                _ => None,
            },
            Self::Radius => match key.as_str() {
                "top-left|top-right|bottom-right|bottom-left" => Some("r"),
                "top-left" => Some("rtl"),
                "top-right" => Some("rtr"),
                "bottom-right" => Some("rbr"),
                "bottom-left" => Some("rbl"),
                _ => None,
            },
            Self::BorderWidth | Self::BorderColor | Self::BorderStyle => match key.as_str() {
                "top|right|bottom|left" => Some("b"),
                "top" => Some("bt"),
                "right" => Some("br"),
                "bottom" => Some("bb"),
                "left" => Some("bl"),
                _ => None,
            },
        }
    }

    fn is_preferred_key(self, key: Option<&str>) -> bool {
        key.is_some_and(|key| match self {
            Self::Margin => matches!(key, "m" | "mx" | "my" | "mt" | "mr" | "mb" | "ml"),
            Self::Padding => matches!(key, "p" | "px" | "py" | "pt" | "pr" | "pb" | "pl"),
            Self::Inset => matches!(key, "inset" | "top" | "right" | "bottom" | "left"),
            Self::Radius => matches!(key, "r" | "rtl" | "rtr" | "rbr" | "rbl"),
            Self::BorderWidth | Self::BorderColor => matches!(key, "b" | "bt" | "br" | "bb" | "bl"),
            Self::BorderStyle => matches!(key, "b" | "bt" | "br" | "bb" | "bl"),
        })
    }

    fn format_replacement(self, key: &str, value: &str, suffix: &str) -> String {
        if self == Self::BorderStyle {
            format!("{key}-{value}{suffix}")
        } else {
            format!("{key}:{value}{suffix}")
        }
    }
}

fn border_property_parts(property: &str, kind: &str) -> Option<&'static [&'static str]> {
    if property == format!("border-{kind}") {
        return Some(&PHYSICAL_SIDES);
    }
    match property {
        value if value == format!("border-top-{kind}") => Some(&["top"]),
        value if value == format!("border-right-{kind}") => Some(&["right"]),
        value if value == format!("border-bottom-{kind}") => Some(&["bottom"]),
        value if value == format!("border-left-{kind}") => Some(&["left"]),
        _ => None,
    }
}

fn collect_manifest_variables(manifest_json: &str) -> (Vec<String>, HashMap<String, String>) {
    let Ok(manifest) = serde_json::from_str::<Value>(manifest_json) else {
        return (Vec::new(), HashMap::new());
    };
    let mut keys = Vec::new();
    let mut seen = HashSet::new();
    let mut values = HashMap::new();
    let Some(variables) = manifest.get("variables").and_then(Value::as_object) else {
        return (keys, values);
    };
    for (namespace, entries) in variables {
        let Some(entries) = entries.as_array() else {
            continue;
        };
        for entry in entries {
            let Some(entry) = entry.as_object() else {
                continue;
            };
            let Some(key) = entry.get("key").and_then(Value::as_str) else {
                continue;
            };
            if seen.insert(key.to_owned()) {
                keys.push(key.to_owned());
            }
            let Some(value) = entry.get("value").and_then(|value| match value {
                Value::String(value) => Some(value.clone()),
                Value::Number(value) => Some(value.to_string()),
                _ => None,
            }) else {
                continue;
            };
            let name = entry
                .get("name")
                .and_then(Value::as_str)
                .map(str::to_owned)
                .unwrap_or_else(|| format!("{namespace}-{key}"));
            values.insert(name, value);
        }
    }
    (keys, values)
}

fn ordered_part_key(family: PartialConflictFamily, parts: &[&str]) -> String {
    family
        .part_order()
        .iter()
        .filter(|part| parts.contains(part))
        .copied()
        .collect::<Vec<_>>()
        .join("|")
}

fn parts_equal(family: PartialConflictFamily, left: &[&str], right: &[&str]) -> bool {
    ordered_part_key(family, left) == ordered_part_key(family, right)
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
        if matches!(character, '\'' | '"') {
            quote = Some(character);
        } else if matches!(character, '(' | '[' | '{') {
            depth += 1;
        } else if matches!(character, ')' | ']' | '}') {
            depth = depth.saturating_sub(1);
        } else if depth == 0 && matches!(character, ':' | '@' | '!' | '>') {
            return (value[..index].to_owned(), value[index..].to_owned());
        }
    }
    (value.to_owned(), String::new())
}

fn find_top_level_state_start(value: &str) -> Option<usize> {
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
        if matches!(character, '\'' | '"') {
            quote = Some(character);
        } else if matches!(character, '(' | '[' | '{') {
            depth += 1;
        } else if matches!(character, ')' | ']' | '}') {
            depth = depth.saturating_sub(1);
        } else if depth == 0 && matches!(character, ':' | '@' | '!' | '>') {
            return Some(index);
        }
    }
    None
}

fn parse_class_parts(class_name: &str) -> ParsedClassParts {
    let (semantic, important) = class_name
        .strip_suffix('!')
        .map_or((class_name, ""), |value| (value, "!"));
    if let Some(colon) = find_top_level_state_start(semantic)
        && semantic.as_bytes().get(colon) == Some(&b':')
    {
        let key = &semantic[..colon];
        if PARTIAL_CONFLICT_FAMILIES
            .iter()
            .any(|family| family.key_parts(key).is_some())
        {
            let (value, suffix) = split_dynamic_value_state(&semantic[colon + 1..]);
            return ParsedClassParts {
                key: Some(key.to_owned()),
                value: Some(value),
                suffix: format!("{suffix}{important}"),
            };
        }
    }
    let state_start = find_top_level_state_start(semantic).unwrap_or(semantic.len());
    ParsedClassParts {
        key: None,
        value: None,
        suffix: format!("{}{important}", &semantic[state_start..]),
    }
}

fn has_top_level_multi_value(value: &str) -> bool {
    split_top_level(value, '|').len() > 1
}

fn create_partial_entry(descriptor: &ClassDescriptor) -> Option<PartialConflictEntry> {
    let rule = descriptor.rule.as_ref()?;
    if descriptor.rule_count != 1 || rule.layer != UtilityLayerName::Utilities {
        return None;
    }
    let parsed = parse_class_parts(&descriptor.class_name);
    let declaration = (descriptor.declarations.len() == 1).then(|| &descriptor.declarations[0]);
    for family in PARTIAL_CONFLICT_FAMILIES {
        let property_parts = declaration.and_then(|(property, _)| family.property_parts(property));
        let key_parts = parsed.key.as_deref().and_then(|key| family.key_parts(key));
        if family.requires_property_match() && property_parts.is_none() {
            continue;
        }
        let parts = if let Some(key_parts) = key_parts
            && property_parts
                .is_none_or(|property_parts| parts_equal(family, key_parts, property_parts))
        {
            key_parts
        } else if let Some(property_parts) = property_parts {
            property_parts
        } else {
            continue;
        };
        let value = if key_parts.is_some() {
            parsed.value.as_deref()
        } else {
            declaration.map(|(_, value)| value.as_str())
        }?;
        if family.disallows_multi_value() && has_top_level_multi_value(value) {
            continue;
        }
        return Some(PartialConflictEntry {
            class_name: descriptor.class_name.clone(),
            value: value.to_owned(),
            suffix: parsed.suffix,
            family,
            parts: parts.to_vec(),
            rule: rule.clone(),
            declarations: descriptor.declarations.clone(),
        });
    }
    None
}

fn canonicalize_partial_value(
    entry: &mut PartialConflictEntry,
    parsed: &ParsedClassParts,
    engine: &EngineSession,
    variable_keys: &[String],
    variable_values: &HashMap<String, String>,
) -> Result<(), EngineError> {
    if entry.family.is_preferred_key(parsed.key.as_deref())
        || (parsed.key.is_none() && entry.family == PartialConflictFamily::BorderStyle)
    {
        return Ok(());
    }
    let Some(key) = entry.family.replacement_key(entry.family.part_order()) else {
        return Ok(());
    };
    for value in variable_keys {
        let candidate = entry.family.format_replacement(key, value, &entry.suffix);
        let inspection = engine.inspect(&candidate)?;
        if inspection.rules.len() != 1 {
            continue;
        }
        let candidate_rule = &inspection.rules[0];
        if candidate_rule.layer == UtilityLayerName::Utilities
            && equal_variant_scope(&entry.rule, candidate_rule)
            && (collect_rule_declarations(&candidate_rule.text) == entry.declarations
                || candidate_resolves_to_declarations(
                    candidate_rule,
                    &entry.declarations,
                    variable_values,
                ))
        {
            entry.value = value.clone();
            return Ok(());
        }
    }
    Ok(())
}

fn normalize_css_variable_value(value: &str) -> String {
    if let Some(value) = value.strip_prefix("-.") {
        format!("-0.{value}")
    } else if let Some(value) = value.strip_prefix('.') {
        format!("0.{value}")
    } else {
        value.to_owned()
    }
}

fn candidate_resolves_to_declarations(
    candidate_rule: &GeneratedRuleIr,
    source_declarations: &[(String, String)],
    variable_values: &HashMap<String, String>,
) -> bool {
    let candidate_declarations = collect_rule_declarations(&candidate_rule.text);
    if candidate_declarations.len() != source_declarations.len()
        || candidate_declarations
            .iter()
            .map(|(property, _)| property)
            .ne(source_declarations.iter().map(|(property, _)| property))
    {
        return false;
    }
    let Some(variable_name) = candidate_rule.variable_names.first() else {
        return false;
    };
    let Some(variable_value) = variable_values.get(variable_name) else {
        return false;
    };
    let variable_value = normalize_css_variable_value(variable_value);
    source_declarations
        .iter()
        .all(|(_, value)| normalize_css_variable_value(value) == variable_value)
}

fn get_replacement_class_names(entry: &PartialConflictEntry, parts: &[&str]) -> Vec<String> {
    if let Some(key) = entry.family.replacement_key(parts) {
        return vec![
            entry
                .family
                .format_replacement(key, &entry.value, &entry.suffix),
        ];
    }
    let mut remaining = parts.iter().copied().collect::<HashSet<_>>();
    let mut replacements = Vec::new();
    if matches!(
        entry.family,
        PartialConflictFamily::Margin | PartialConflictFamily::Padding
    ) {
        for grouped in [["right", "left"], ["top", "bottom"]] {
            if !grouped.iter().all(|part| remaining.contains(part)) {
                continue;
            }
            if let Some(key) = entry.family.replacement_key(&grouped) {
                replacements.push(entry.family.format_replacement(
                    key,
                    &entry.value,
                    &entry.suffix,
                ));
                for part in grouped {
                    remaining.remove(part);
                }
            }
        }
    }
    for part in entry.family.part_order() {
        if !remaining.contains(part) {
            continue;
        }
        if let Some(key) = entry.family.replacement_key(&[*part]) {
            replacements.push(
                entry
                    .family
                    .format_replacement(key, &entry.value, &entry.suffix),
            );
        }
    }
    replacements
}

fn validate_partial_replacement(
    class_names: &[String],
    source: &PartialConflictEntry,
    engine: &EngineSession,
) -> Result<bool, EngineError> {
    for class_name in class_names {
        let inspection = engine.inspect(class_name)?;
        if inspection.rules.len() != 1
            || inspection.rules[0].layer != UtilityLayerName::Utilities
            || !equal_variant_scope(&source.rule, &inspection.rules[0])
        {
            return Ok(false);
        }
    }
    Ok(true)
}

fn partial_conflict_replacement(
    source: &PartialConflictEntry,
    conflict: &PartialConflictEntry,
    engine: &EngineSession,
) -> Result<Option<String>, EngineError> {
    if source.family.name() != conflict.family.name()
        || source.suffix != conflict.suffix
        || !equal_variant_scope(&source.rule, &conflict.rule)
        || conflict.parts.len() >= source.parts.len()
        || !conflict
            .parts
            .iter()
            .all(|part| source.parts.contains(part))
    {
        return Ok(None);
    }
    let remaining = source
        .parts
        .iter()
        .copied()
        .filter(|part| !conflict.parts.contains(part))
        .collect::<Vec<_>>();
    let replacements = get_replacement_class_names(source, &remaining);
    if replacements.is_empty() || !validate_partial_replacement(&replacements, source, engine)? {
        return Ok(None);
    }
    Ok(Some(replacements.join(" ")))
}

fn find_partial_conflicts(
    descriptors: &[ClassDescriptor],
    engine: &EngineSession,
    variable_keys: &[String],
    variable_values: &HashMap<String, String>,
) -> Result<Vec<PartialClassConflictIr>, EngineError> {
    let mut entries = Vec::new();
    for descriptor in descriptors {
        let Some(mut entry) = create_partial_entry(descriptor) else {
            continue;
        };
        let parsed = parse_class_parts(&descriptor.class_name);
        canonicalize_partial_value(&mut entry, &parsed, engine, variable_keys, variable_values)?;
        entries.push(entry);
    }
    let mut conflicts = Vec::new();
    for (index, entry) in entries.iter().enumerate() {
        for compare in &entries[index + 1..] {
            let Some(replacement) = partial_conflict_replacement(entry, compare, engine)? else {
                continue;
            };
            conflicts.push(PartialClassConflictIr {
                class_name: entry.class_name.clone(),
                replacement,
                conflict: compare.class_name.clone(),
            });
            break;
        }
    }
    Ok(conflicts)
}

fn get_property_order(property: &str) -> (u8, u8) {
    if property == "position" {
        return (0, 0);
    }
    if matches!(property, "top" | "right" | "bottom" | "left") || property_prefix(property, "inset")
    {
        return (0, 1);
    }
    if property == "z-index" {
        return (0, 2);
    }
    if property == "display" {
        return (0, 3);
    }
    if property == "visibility" {
        return (0, 4);
    }
    if property_prefix(property, "overflow") {
        return (0, 5);
    }
    if property_prefix(property, "container") {
        return (0, 6);
    }
    if property == "isolation" {
        return (0, 7);
    }
    if property == "float" {
        return (0, 8);
    }
    if property == "clear" {
        return (0, 9);
    }
    if property_prefix(property, "flex") {
        return (1, 0);
    }
    if property_prefix(property, "grid") {
        return (1, 1);
    }
    if property_prefix(property, "place") {
        return (1, 2);
    }
    if property_prefix(property, "align") {
        return (1, 3);
    }
    if property_prefix(property, "justify") {
        return (1, 4);
    }
    if property_prefix(property, "gap") {
        return (1, 5);
    }
    if property == "order" {
        return (1, 6);
    }
    if property_prefix(property, "columns") {
        return (1, 7);
    }
    if property == "height" {
        return (2, 0);
    }
    if property == "width" {
        return (2, 1);
    }
    if property_prefix(property, "min") {
        return (2, 2);
    }
    if property_prefix(property, "max") {
        return (2, 3);
    }
    if property == "size" {
        return (2, 4);
    }
    if property == "aspect-ratio" {
        return (2, 5);
    }
    if property_prefix(property, "margin") {
        return (3, 0);
    }
    if property_prefix(property, "padding") {
        return (3, 1);
    }
    if property_prefix(property, "scroll-margin") {
        return (3, 2);
    }
    if property_prefix(property, "scroll-padding") {
        return (3, 3);
    }
    if property_prefix(property, "border") {
        return (4, 0);
    }
    if property_prefix(property, "outline") {
        return (4, 1);
    }
    if property_prefix(property, "font") {
        return (5, 0);
    }
    if property == "line-height" {
        return (5, 1);
    }
    if property == "letter-spacing" {
        return (5, 2);
    }
    if property_prefix(property, "text") {
        return (5, 3);
    }
    if property == "white-space" {
        return (5, 4);
    }
    if property_prefix(property, "word") {
        return (5, 5);
    }
    if property_prefix(property, "list-style") {
        return (5, 6);
    }
    if property_prefix(property, "background") {
        return (6, 0);
    }
    if property == "color" {
        return (6, 1);
    }
    if property == "fill" {
        return (6, 2);
    }
    if property == "stroke" {
        return (6, 3);
    }
    if property == "accent-color" {
        return (6, 4);
    }
    if property == "caret-color" {
        return (6, 5);
    }
    if property_prefix(property, "mask") {
        return (6, 6);
    }
    if property == "opacity" {
        return (7, 0);
    }
    if property == "box-shadow" {
        return (7, 1);
    }
    if property == "filter" {
        return (7, 2);
    }
    if property == "backdrop-filter" {
        return (7, 3);
    }
    if property == "mix-blend-mode" {
        return (7, 4);
    }
    if property == "transform" {
        return (7, 5);
    }
    if property == "translate" {
        return (7, 6);
    }
    if property == "scale" {
        return (7, 7);
    }
    if property == "rotate" {
        return (7, 8);
    }
    if property_prefix(property, "transition") {
        return (7, 9);
    }
    if property_prefix(property, "animation") {
        return (7, 10);
    }
    if property == "cursor" {
        return (8, 0);
    }
    if property == "pointer-events" {
        return (8, 1);
    }
    if property == "user-select" {
        return (8, 2);
    }
    if property == "touch-action" {
        return (8, 3);
    }
    if property == "resize" {
        return (8, 4);
    }
    if property_prefix(property, "scroll") {
        return (8, 5);
    }
    if property_prefix(property, "overscroll") {
        return (8, 6);
    }
    if property == "appearance" {
        return (8, 7);
    }
    (UNKNOWN_PROPERTY_GROUP_ORDER, UNKNOWN_PROPERTY_ORDER)
}

fn property_prefix(property: &str, prefix: &str) -> bool {
    property == prefix || property.starts_with(&format!("{prefix}-"))
}

fn compare_condition_features(
    left: &[(String, f64, f64)],
    right: &[(String, f64, f64)],
) -> Ordering {
    for index in 0..left.len().max(right.len()) {
        let Some(left) = left.get(index) else {
            return Ordering::Less;
        };
        let Some(right) = right.get(index) else {
            return Ordering::Greater;
        };
        let order = natural_compare(&left.0, &right.0)
            .then_with(|| {
                (right.2 - right.1)
                    .partial_cmp(&(left.2 - left.1))
                    .unwrap_or(Ordering::Equal)
            })
            .then_with(|| right.1.partial_cmp(&left.1).unwrap_or(Ordering::Equal))
            .then_with(|| right.2.partial_cmp(&left.2).unwrap_or(Ordering::Equal));
        if order != Ordering::Equal {
            return order;
        }
    }
    Ordering::Equal
}

#[cfg(test)]
mod tests {
    use super::*;

    const DEFAULT_MANIFEST: &str =
        include_str!("../../../packages/preset/src/default-manifest.json");

    const MANIFEST: &str = r#"{
      "version":1,
      "variables":{
        "spacing":[{"key":"md","type":"number","value":"1rem"}]
      },
      "utilities":[
        {"id":"block","name":"block","type":-2,"emit":{"type":"static","rules":[{"declarations":{"display":"block"}}]},"matchers":[{"type":"static","name":"block"}]},
        {"id":"m","name":"m:","type":-1,"variableAliasRefs":["~spacing"],"emit":{"type":"property","property":"margin"},"matchers":[{"type":"key","keys":["m"]}]},
        {"id":"mx","name":"mx:","type":-1,"emit":{"type":"template","declarations":{"margin-right":null,"margin-left":null}},"matchers":[{"type":"key","keys":["mx"]}]},
        {"id":"ml","name":"ml:","type":-1,"emit":{"type":"property","property":"margin-left"},"matchers":[{"type":"key","keys":["ml"]}]},
        {"id":"mr","name":"mr:","type":-1,"emit":{"type":"property","property":"margin-right"},"matchers":[{"type":"key","keys":["mr"]}]},
        {"id":"fg","name":"fg:","type":0,"emit":{"type":"property","property":"color"},"matchers":[{"type":"key","keys":["fg"]}]}
      ]
    }"#;

    #[test]
    fn classifies_host_rule_validation_results_in_rust() {
        let mut engine = EngineSession::create(MANIFEST).unwrap();
        engine.ensure_class_rules(["block"]).unwrap();
        let batch = ValidatorBatchIr {
            version: 1,
            classes: vec![
                mastercss_schema::ValidatorClassIr {
                    class_name: "block".into(),
                    matched: true,
                    rules: engine.inspect("block").unwrap().rules,
                },
                mastercss_schema::ValidatorClassIr {
                    class_name: "unknown".into(),
                    matched: false,
                    rules: Vec::new(),
                },
            ],
        };

        let classified = classify_host_rule_validation(
            &batch,
            &[vec![vec!["Unsupported CSS declaration.".into()]], vec![]],
        );
        assert_eq!(classified.invalid_generated_classes, ["block"]);
        assert_eq!(
            classified.validation_errors,
            [vec!["Unsupported CSS declaration.".to_owned()], vec![]]
        );

        let missing = classify_host_rule_validation(&batch, &[vec![], vec![]]);
        assert_eq!(missing.invalid_generated_classes, ["block"]);
        assert_eq!(
            missing.validation_errors[0],
            ["Host CSS validation result is missing."]
        );
    }

    #[test]
    fn sorts_and_finds_full_conflicts_without_retaining_rules() {
        let mut session = LintSession::create(MANIFEST).unwrap();
        let batch = session
            .analyze(
                ["fg:white", "m:2px", "m:3px", "unknown"],
                None,
                &HashSet::new(),
            )
            .unwrap();
        assert_eq!(batch.version, 1);
        assert_eq!(
            batch.sorted_class_names,
            ["m:2px", "m:3px", "fg:white", "unknown"]
        );
        assert_eq!(batch.conflicts[0].class_name, "m:2px");
        assert_eq!(batch.conflicts[0].conflicts, ["m:3px"]);

        let mut default_session = LintSession::create(DEFAULT_MANIFEST).unwrap();
        let conditional = default_session
            .analyze(["m:10x@sm", "m:3.125rem@sm"], None, &HashSet::new())
            .unwrap();
        assert_eq!(
            conditional.sorted_class_names,
            ["m:3.125rem@sm", "m:10x@sm"]
        );

        let partial = session
            .analyze(["mx:2px", "ml:3px"], None, &HashSet::new())
            .unwrap();
        assert_eq!(
            partial.partial_conflicts,
            [PartialClassConflictIr {
                class_name: "mx:2px".into(),
                replacement: "mr:2px".into(),
                conflict: "ml:3px".into(),
            }]
        );
    }

    #[test]
    fn discovers_raw_value_segments_and_creates_policy_diagnostics() {
        let mut session = LintSession::create(MANIFEST).unwrap();
        let class_names = vec!["m:md".into(), "m:md|17px".into(), "block".into()];
        let candidates = session
            .raw_value_candidates(&class_names, None, &HashSet::new())
            .unwrap();
        assert_eq!(
            candidates.candidates,
            [RawValueCandidateIr {
                class_name: "m:md|17px".into(),
                key: "m".into(),
                segments: vec!["17px".into()],
                properties: vec!["margin".into()],
            }]
        );

        let ir = session
            .analyze_class_list(
                "😀 m:md|17px",
                &["😀".into(), "m:md|17px".into()],
                None,
                &HashSet::new(),
                LintClassListPolicy {
                    raw_value_policy: Some(&RawValuePolicy {
                        allowed_patterns: Vec::new(),
                        ..RawValuePolicy::default()
                    }),
                    ..LintClassListPolicy::default()
                },
            )
            .unwrap();
        let diagnostic = ir
            .diagnostics
            .iter()
            .find(|diagnostic| diagnostic.code == "unapproved-raw-value")
            .unwrap();
        assert_eq!(diagnostic.range, SourceRange { start: 3, end: 12 });
        assert_eq!(
            diagnostic.message,
            "Raw value \"17px\" is not approved for class \"m:md|17px\". Use a token or allow the value explicitly."
        );
        assert_eq!(diagnostic.data["properties"], serde_json::json!(["margin"]));

        let approved = session
            .analyze_class_list(
                "m:md|17px",
                &["m:md|17px".into()],
                None,
                &HashSet::new(),
                LintClassListPolicy {
                    raw_value_policy: Some(
                        &RawValuePolicy::new(false, Vec::new(), vec![r"^\d+px$".into()]).unwrap(),
                    ),
                    ..LintClassListPolicy::default()
                },
            )
            .unwrap();
        assert!(
            approved
                .diagnostics
                .iter()
                .all(|diagnostic| diagnostic.code != "unapproved-raw-value")
        );
        assert!(RawValuePolicy::new(false, Vec::new(), vec!["[".into()]).is_err());
    }

    #[test]
    fn suggests_canonical_classes_from_engine_facts() {
        let mut session = LintSession::create(DEFAULT_MANIFEST).unwrap();
        let class_names = [
            "text-align:center:hover@sm",
            "font:16px",
            "margin:md",
            "position:relative",
            "m:1rem|1.5rem",
            "m:var(--spacing-md)",
            "block@dark@sm",
        ]
        .map(str::to_owned);
        let native_support = vec![
            true;
            session
                .native_declaration_candidates(&class_names)
                .unwrap()
                .len()
        ];
        let result = session
            .canonical_class_names(
                &class_names,
                Some(&native_support),
                &CanonicalClassNameOptions::default(),
            )
            .unwrap();
        assert_eq!(
            result.suggestions,
            [
                CanonicalClassSuggestionIr {
                    class_name: "text-align:center:hover@sm".into(),
                    recommended: "text-center:hover@sm".into(),
                },
                CanonicalClassSuggestionIr {
                    class_name: "font:16px".into(),
                    recommended: "font:md".into(),
                },
                CanonicalClassSuggestionIr {
                    class_name: "margin:md".into(),
                    recommended: "m:md".into(),
                },
                CanonicalClassSuggestionIr {
                    class_name: "position:relative".into(),
                    recommended: "rel".into(),
                },
                CanonicalClassSuggestionIr {
                    class_name: "m:1rem|1.5rem".into(),
                    recommended: "m:md|lg".into(),
                },
                CanonicalClassSuggestionIr {
                    class_name: "m:var(--spacing-md)".into(),
                    recommended: "m:md".into(),
                },
                CanonicalClassSuggestionIr {
                    class_name: "block@dark@sm".into(),
                    recommended: "block@sm@dark".into(),
                },
            ]
        );
        assert_eq!(session.engine.css_text(), "");
    }

    #[test]
    fn suggests_canonical_composition_groups_from_engine_facts() {
        let mut session = LintSession::create(DEFAULT_MANIFEST).unwrap();
        let cases = [
            (vec!["w:md", "h:md"], Some("size:md")),
            (vec!["min-w:md", "min-h:md"], Some("min-size:md")),
            (vec!["max-w:md", "max-h:md"], Some("max-size:md")),
            (vec!["mt:md", "mb:md"], Some("my:md")),
            (vec!["ml:md", "mr:md"], Some("mx:md")),
            (vec!["pt:md", "pb:md"], Some("py:md")),
            (vec!["pl:md", "pr:md"], Some("px:md")),
            (vec!["margin-top:md", "margin-bottom:md"], Some("my:md")),
            (
                vec!["mt:md@dark@sm", "mb:md@dark@sm"],
                Some("my:md@sm@dark"),
            ),
            (vec!["w:md", "h:lg"], None),
            (vec!["mt:md", "mb:md@sm"], None),
        ];
        for (class_names, expected) in cases {
            let class_names = class_names
                .into_iter()
                .map(str::to_owned)
                .collect::<Vec<_>>();
            let native_support = vec![
                true;
                session
                    .native_declaration_candidates(&class_names)
                    .unwrap()
                    .len()
            ];
            let result = session
                .canonical_class_groups(
                    &class_names,
                    Some(&native_support),
                    &CanonicalClassNameOptions::default(),
                )
                .unwrap();
            assert_eq!(
                result.suggestions,
                expected
                    .map(|recommended| vec![CanonicalClassGroupSuggestionIr {
                        class_names: class_names.clone(),
                        recommended: recommended.into(),
                    }])
                    .unwrap_or_default(),
                "{class_names:?}"
            );
            assert_eq!(session.engine.css_text(), "");
        }
    }

    #[test]
    fn creates_structural_compose_directives_from_engine_facts() {
        let mut session = LintSession::create(DEFAULT_MANIFEST).unwrap();
        let class_names = ["text-align:center", "contain:content"].map(str::to_owned);
        let native_support = vec![
            true;
            session
                .native_declaration_candidates(&class_names)
                .unwrap()
                .len()
        ];
        assert_eq!(
            session
                .canonical_compose_directive(
                    &class_names,
                    Some(&native_support),
                    &CanonicalClassNameOptions::default(),
                )
                .unwrap(),
            CanonicalComposeDirectiveIr {
                version: LINT_BATCH_VERSION,
                suggestions: vec![
                    CanonicalComposeSuggestionIr {
                        actual: "text-align:center".into(),
                        recommended: "text-center".into(),
                        class_names: vec!["text-align:center".into()],
                        kind: CanonicalComposeSuggestionKind::Class,
                    },
                    CanonicalComposeSuggestionIr {
                        actual: "contain:content".into(),
                        recommended: "contain: content".into(),
                        class_names: vec!["contain:content".into()],
                        kind: CanonicalComposeSuggestionKind::NativeDeclaration,
                    },
                ],
                structural_change: Some(true),
                replacement: Some("@compose text-center;\ncontain: content;".into()),
            }
        );

        let class_names = ["bg:blue-60:hover@sm", "block@dark"].map(str::to_owned);
        let native_support = vec![
            true;
            session
                .native_declaration_candidates(&class_names)
                .unwrap()
                .len()
        ];
        let result = session
            .canonical_compose_directive(
                &class_names,
                Some(&native_support),
                &CanonicalClassNameOptions::default(),
            )
            .unwrap();
        assert_eq!(
            result.replacement.as_deref(),
            Some("&:hover { @variant sm { @compose bg:blue-60; } }\n@dark { @compose block; }")
        );
        assert_eq!(
            result
                .suggestions
                .iter()
                .map(|suggestion| suggestion.kind)
                .collect::<Vec<_>>(),
            [
                CanonicalComposeSuggestionKind::VariantBlock,
                CanonicalComposeSuggestionKind::VariantBlock,
            ]
        );

        let class_names = ["contain:content!"].map(str::to_owned);
        let native_support = vec![true];
        let result = session
            .canonical_compose_directive(
                &class_names,
                Some(&native_support),
                &CanonicalClassNameOptions::default(),
            )
            .unwrap();
        assert_eq!(
            result.replacement.as_deref(),
            Some("contain: content !important;")
        );
        assert_eq!(session.engine.css_text(), "");
    }
}
