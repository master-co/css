use super::*;

impl EngineSession {
    pub(crate) fn theme_rule_text(&self) -> Option<String> {
        self.theme_text.clone()
    }

    pub(crate) fn sync_theme_text(&mut self) {
        if self.theme_dirty {
            self.theme_text = self.render_theme_rule_text();
            self.theme_dirty = false;
        }
    }

    pub(crate) fn with_theme_batch(
        &mut self,
        operation: impl FnOnce(&mut Self) -> Result<EngineTransitionIr, EngineError>,
    ) -> Result<EngineTransitionIr, EngineError> {
        self.ensure_active()?;
        self.theme_batch_depth += 1;
        let mut result = operation(self);
        self.theme_batch_depth -= 1;
        if self.theme_batch_depth == 0 && self.theme_dirty {
            let previous = self.theme_text.take();
            self.sync_theme_text();
            // Keep the cache consistent even when an operation fails. Only a
            // successful outermost transition owns the resulting CSS mutations.
            if previous != self.theme_text
                && let Ok(transition) = &mut result
            {
                let mut mutations = Vec::with_capacity(2);
                if previous.is_some() {
                    mutations.push(RuleMutationIr::Delete {
                        target: RuleTarget::Theme,
                        index: 0,
                        key: "theme:root".into(),
                    });
                }
                if let Some(text) = &self.theme_text {
                    mutations.push(RuleMutationIr::Insert {
                        target: RuleTarget::Theme,
                        index: 0,
                        key: "theme:root".into(),
                        text: text.clone(),
                        rule: None,
                    });
                }
                transition.mutations.splice(0..0, mutations);
            }
        }
        result
    }
}
