//! Tooling-facing definition references reuse the engine matcher and suffix parser.
use crate::{EngineError, EngineSession};
use std::collections::BTreeSet;

impl EngineSession {
    /// Authoring dependencies, including variables before inline substitution.
    /// Animation resource references remain on generated rules. No DOM evaluation.
    pub fn class_definition_references(&self, class: &str) -> Result<Vec<String>, EngineError> {
        self.ensure_active()?;
        let source = class.strip_suffix('!').unwrap_or(class);
        let (head, suffixes) = super::state::split_state_token(source);
        let mut references = BTreeSet::new();
        for (index, matched) in super::named::matching_utilities(&head, &self.compiled) {
            references.extend(
                matched
                    .variable_names
                    .iter()
                    .map(|name| format!("variable:--{name}")),
            );
            let id = &self.compiled.utilities[index].id;
            if self
                .compiled
                .utility_definitions
                .iter()
                .any(|definition| super::utility_matching::identity(definition) == *id)
            {
                references.insert(format!("utility:{id}"));
            }
        }
        for rule in self.generate_composition_rules_raw(source) {
            for declaration in rule.declarations {
                if let Some(value) = declaration.value.as_str() {
                    references.extend(
                        mastercss_lexer::collect_css_variable_references(value)
                            .into_iter()
                            .map(|name| format!("variable:--{name}")),
                    );
                }
            }
        }
        for suffix in suffixes {
            if let Some(Ok((name, _))) = super::class_apply::invocation(&suffix) {
                references.insert(format!("mixin:{name}"));
            } else if self
                .compiled
                .custom_media
                .contains_key(&format!("--{suffix}"))
            {
                references.insert(format!("custom-media:--{suffix}"));
            } else if let Some(query) = mastercss_lexer::parse_native_query(&suffix)
                && query.kind == "media"
            {
                // Use the same parser as condition expansion, including aliases
                // inside boolean media expressions and escaped identifiers.
                let _ = crate::parse_custom_media_query(&query.prelude, &mut |name| {
                    references.insert(format!("custom-media:{name}"));
                    self.compiled
                        .custom_media
                        .get(name)
                        .cloned()
                        .ok_or_else(|| format!("Undefined custom media {name}"))
                });
            }
        }
        Ok(references.into_iter().collect())
    }
}
