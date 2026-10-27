use super::*;
use mastercss_schema::{
    EngineClassExecutionStateIr, EngineExecutionStateIr, EngineRuleReferenceIr,
};

impl EngineSession {
    /// Read stored execution references without generating or copying utility rules.
    pub fn execution_state<I, S>(
        &self,
        class_names: I,
    ) -> Result<EngineExecutionStateIr, EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        self.ensure_active()?;
        Ok(EngineExecutionStateIr {
            classes: class_names
                .into_iter()
                .map(|class_name| {
                    let class_name = class_name.as_ref();
                    EngineClassExecutionStateIr {
                        class_name: class_name.to_owned(),
                        references: self
                            .class_rules
                            .get(class_name)
                            .into_iter()
                            .flatten()
                            .map(|(layer, key)| EngineRuleReferenceIr {
                                layer: *layer,
                                key: key.clone(),
                            })
                            .collect(),
                    }
                })
                .collect(),
            resources: self.resource_snapshot(),
        })
    }
}
