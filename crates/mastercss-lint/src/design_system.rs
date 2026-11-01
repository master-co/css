//! Read-only design-token evidence over authored stylesheet sources.
mod stylesheet;
#[cfg(test)]
mod tests;

use crate::{LintSession, RawValuePolicy, RawValuePolicyRequest};
use mastercss_schema::SourceRange;
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value, json};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct DesignTokenMetadata {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deprecated: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub replacement: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct DesignSystemStylesheet {
    pub source: String,
    pub content: String,
    #[serde(default)]
    pub importers: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct DesignSystemRequest {
    pub version: u32,
    pub stylesheets: Vec<DesignSystemStylesheet>,
    #[serde(default)]
    pub metadata: BTreeMap<String, DesignTokenMetadata>,
    pub raw_value_policy: Option<RawValuePolicyRequest>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesignSystemToken {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<DesignTokenMetadata>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StylesheetAncestor {
    pub kind: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    pub prelude: String,
    pub range: SourceRange,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StylesheetTokenReference {
    pub source: String,
    pub token: String,
    pub registered: bool,
    pub range: SourceRange,
    pub property: String,
    pub declaration_range: SourceRange,
    pub ancestry: Vec<StylesheetAncestor>,
    pub has_fallback: bool,
    pub in_fallback: bool,
    pub importers: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesignSystemDiagnostic {
    pub code: &'static str,
    pub severity: &'static str,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub range: Option<SourceRange>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub token: Option<String>,
    #[serde(skip_serializing_if = "Map::is_empty")]
    pub data: Map<String, Value>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesignSystemCollision {
    pub prefix: String,
    pub key: String,
    pub class_name: String,
    pub namespaces: Vec<String>,
    pub properties: Vec<String>,
}

/// A component class's attribute vocabulary, read from the selectors that style it.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesignSystemComponent {
    pub class_name: String,
    pub attributes: Vec<DesignSystemComponentAttribute>,
    pub sources: Vec<String>,
}

/// `values` lists exact `[name="value"]` matches; `presence` means a bare `[name]` selector exists.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesignSystemComponentAttribute {
    pub name: String,
    pub values: Vec<String>,
    pub presence: bool,
}

#[derive(Debug, Default)]
pub(crate) struct ComponentVocabulary {
    attributes: BTreeMap<String, BTreeMap<String, (BTreeSet<String>, bool)>>,
    sources: BTreeMap<String, BTreeSet<String>>,
}

impl ComponentVocabulary {
    pub(crate) fn record(
        &mut self,
        source: &str,
        class_name: &str,
        attribute: &str,
        value: Option<&str>,
    ) {
        let entry = self
            .attributes
            .entry(class_name.to_owned())
            .or_default()
            .entry(attribute.to_owned())
            .or_default();
        match value {
            Some(value) => {
                entry.0.insert(value.to_owned());
            }
            None => entry.1 = true,
        }
        self.sources
            .entry(class_name.to_owned())
            .or_default()
            .insert(source.to_owned());
    }

    fn into_components(self) -> Vec<DesignSystemComponent> {
        let mut sources = self.sources;
        self.attributes
            .into_iter()
            .map(|(class_name, attributes)| DesignSystemComponent {
                sources: sources
                    .remove(&class_name)
                    .unwrap_or_default()
                    .into_iter()
                    .collect(),
                attributes: attributes
                    .into_iter()
                    .map(
                        |(name, (values, presence))| DesignSystemComponentAttribute {
                            name,
                            values: values.into_iter().collect(),
                            presence,
                        },
                    )
                    .collect(),
                class_name,
            })
            .collect()
    }
}

#[derive(Debug, Serialize)]
pub struct DesignSystemCoverage {
    pub scope: &'static str,
    pub browser: &'static str,
    pub notes: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct DesignSystemSummary {
    pub stylesheets: usize,
    pub tokens: usize,
    pub references: usize,
    pub collisions: usize,
    pub errors: usize,
    pub warnings: usize,
}

#[derive(Debug, Serialize)]
pub struct DesignSystemReport {
    pub version: u32,
    pub tokens: Vec<DesignSystemToken>,
    pub references: Vec<StylesheetTokenReference>,
    pub collisions: Vec<DesignSystemCollision>,
    pub components: Vec<DesignSystemComponent>,
    pub diagnostics: Vec<DesignSystemDiagnostic>,
    pub coverage: DesignSystemCoverage,
    pub summary: DesignSystemSummary,
}

impl DesignSystemDiagnostic {
    fn new(
        code: &'static str,
        severity: &'static str,
        message: String,
        token: Option<String>,
    ) -> Self {
        Self {
            code,
            severity,
            message,
            source: None,
            range: None,
            token,
            data: Map::new(),
        }
    }
}

impl LintSession {
    pub fn inspect_design_system(
        &self,
        request: &DesignSystemRequest,
    ) -> Result<DesignSystemReport, String> {
        if request.version != 1 {
            return Err("Unsupported design-system request version".into());
        }
        let names = self
            .engine
            .variable_names()
            .map_err(|error| error.to_string())?
            .into_iter()
            .map(|name| format!("--{name}"))
            .collect::<BTreeSet<_>>();
        let policy = request
            .raw_value_policy
            .as_ref()
            .map(RawValuePolicyRequest::compile)
            .transpose()?;
        let mut diagnostics = metadata_diagnostics(&request.metadata, &names);
        let mut references = Vec::new();
        let mut vocabulary = ComponentVocabulary::default();
        for source in &request.stylesheets {
            stylesheet::collect_components(source, &mut vocabulary);
            stylesheet::analyze(
                self,
                source,
                &names,
                policy.as_ref(),
                &mut references,
                &mut diagnostics,
            );
        }
        for reference in &references {
            if request
                .metadata
                .get(&reference.token)
                .is_some_and(|metadata| metadata.deprecated == Some(true))
                && reference.registered
            {
                let mut diagnostic = DesignSystemDiagnostic::new(
                    "DEPRECATED_TOKEN",
                    "warning",
                    format!("Token {} is deprecated.", reference.token),
                    Some(reference.token.clone()),
                );
                diagnostic.source = Some(reference.source.clone());
                diagnostic.range = Some(reference.range.clone());
                if let Some(replacement) = request
                    .metadata
                    .get(&reference.token)
                    .and_then(|metadata| metadata.replacement.as_ref())
                {
                    diagnostic
                        .data
                        .insert("replacement".into(), json!(replacement));
                }
                diagnostics.push(diagnostic);
            }
        }
        let collisions = self.design_system_collisions()?;
        for collision in &collisions {
            let mut diagnostic = DesignSystemDiagnostic::new(
                "TOKEN_FAMILY_COLLISION",
                "warning",
                format!(
                    "Class {} is ambiguous across token namespaces {}.",
                    collision.class_name,
                    collision.namespaces.join(", ")
                ),
                None,
            );
            diagnostic.data = serde_json::to_value(collision)
                .expect("collision serializes")
                .as_object()
                .expect("collision is an object")
                .clone();
            diagnostics.push(diagnostic);
        }
        let tokens = names
            .into_iter()
            .map(|name| DesignSystemToken {
                metadata: request.metadata.get(&name).cloned(),
                name,
            })
            .collect::<Vec<_>>();
        let summary = DesignSystemSummary {
            stylesheets: request.stylesheets.len(),
            tokens: tokens.len(),
            references: references.len(),
            collisions: collisions.len(),
            errors: diagnostics
                .iter()
                .filter(|item| item.severity == "error")
                .count(),
            warnings: diagnostics
                .iter()
                .filter(|item| item.severity == "warning")
                .count(),
        };
        let components = vocabulary.into_components();
        Ok(DesignSystemReport { version: 1, tokens, references, collisions, components, diagnostics, summary,
            coverage: DesignSystemCoverage { scope: "provided-stylesheets", browser: "not-checked", notes: vec![
                "References are authored declaration occurrences, not proof of DOM usage, cascade winners, computed values or visual behavior.".into(),
                "Only supplied sources are analyzed. Importers are source-graph predecessors, including references, not delivery edges.".into(),
                "Utility and mixin definition bodies are excluded; their parameters require compiler binding. Theme token dependencies are included.".into(),
                "Raw-value policy checks only token-backed native properties and top-level value components. Complete var() components, including fallbacks, are exempt; CSS grammar and browser support are not checked.".into(),
                "Unregistered custom-property references may resolve through ordinary CSS, inheritance or external sources; they are not missing-token errors.".into(),
                "Components list attribute selectors written in the same compound as a class, outside functional pseudo-classes; nested `&` selectors and markup usage are not checked.".into(),
            ] },
        })
    }

    fn design_system_collisions(&self) -> Result<Vec<DesignSystemCollision>, String> {
        let mut candidates: BTreeMap<(String, String), (BTreeSet<String>, BTreeSet<String>)> =
            BTreeMap::new();
        for family in self
            .engine
            .token_families()
            .map_err(|error| error.to_string())?
        {
            for key in self
                .engine
                .token_family_keys(family)
                .map_err(|error| error.to_string())?
            {
                let (namespaces, properties) =
                    candidates.entry((family.prefix.clone(), key)).or_default();
                namespaces.insert(family.namespace.clone());
                properties.extend(family.properties.iter().cloned());
            }
        }
        let mut collisions = Vec::new();
        for ((prefix, key), (namespaces, properties)) in candidates {
            if namespaces.len() < 2 {
                continue;
            }
            let class_name = format!("{prefix}-{key}");
            if self
                .engine
                .inspect(&class_name)
                .map_err(|error| error.to_string())?
                .match_status
                != mastercss_schema::MatchStatus::Ambiguous
            {
                continue;
            }
            collisions.push(DesignSystemCollision {
                prefix,
                key,
                class_name,
                namespaces: namespaces.into_iter().collect(),
                properties: properties.into_iter().collect(),
            });
        }
        Ok(collisions)
    }
}

fn metadata_diagnostics(
    metadata: &BTreeMap<String, DesignTokenMetadata>,
    names: &BTreeSet<String>,
) -> Vec<DesignSystemDiagnostic> {
    let mut diagnostics = Vec::new();
    for (name, item) in metadata {
        if !names.contains(name) {
            diagnostics.push(DesignSystemDiagnostic::new(
                "UNKNOWN_METADATA_TOKEN",
                "error",
                format!("Metadata token {name} is not registered in this manifest."),
                Some(name.clone()),
            ));
        }
        if let Some(replacement) = &item.replacement {
            if !names.contains(replacement) {
                diagnostics.push(DesignSystemDiagnostic::new(
                    "UNKNOWN_TOKEN_REPLACEMENT",
                    "error",
                    format!("Replacement {replacement} for {name} is not registered."),
                    Some(name.clone()),
                ));
            } else if replacement == name {
                diagnostics.push(DesignSystemDiagnostic::new(
                    "INVALID_TOKEN_REPLACEMENT",
                    "error",
                    format!("Token {name} cannot replace itself."),
                    Some(name.clone()),
                ));
            } else if metadata
                .get(replacement)
                .is_some_and(|value| value.deprecated == Some(true))
            {
                diagnostics.push(DesignSystemDiagnostic::new(
                    "DEPRECATED_TOKEN_REPLACEMENT",
                    "warning",
                    format!("Replacement {replacement} for {name} is also deprecated."),
                    Some(name.clone()),
                ));
            }
        }
    }
    diagnostics
}
