#![forbid(unsafe_code)]

use mastercss_engine::{EngineError, EngineSession};
use mastercss_schema::{
    NativeDeclarationCandidateIr, VALIDATOR_BATCH_VERSION, ValidatorBatchIr, ValidatorClassIr,
};

/// Stateful rule-generation core for host validators. CSS grammar validation
/// intentionally remains in the host so css-tree and CSS.supports behavior can
/// be preserved without introducing a second CSS grammar implementation.
#[derive(Debug)]
pub struct ValidatorSession {
    engine: EngineSession,
}

impl ValidatorSession {
    pub fn create(manifest_json: &str) -> Result<Self, EngineError> {
        Ok(Self {
            engine: EngineSession::create(manifest_json)?,
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

    pub fn generate_classes<I, S>(
        &mut self,
        class_names: I,
        native_support: Option<&[bool]>,
    ) -> Result<ValidatorBatchIr, EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        let class_names = class_names
            .into_iter()
            .map(|class_name| class_name.as_ref().to_owned())
            .collect::<Vec<_>>();
        if let Some(native_support) = native_support {
            self.engine
                .ensure_class_rules_with_native_support(&class_names, native_support)?;
        } else {
            self.engine.ensure_class_rules(&class_names)?;
        }
        let classes = class_names
            .iter()
            .map(|class_name| {
                let inspection = self.engine.inspect(class_name)?;
                Ok(ValidatorClassIr {
                    class_name: class_name.clone(),
                    matched: inspection.valid,
                    rules: inspection.rules,
                })
            })
            .collect::<Result<Vec<_>, EngineError>>()?;
        self.engine.delete_class_rules(&class_names)?;
        Ok(ValidatorBatchIr {
            version: VALIDATOR_BATCH_VERSION,
            classes,
        })
    }

    pub fn dispose(&mut self) {
        self.engine.dispose();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const MANIFEST: &str = r#"{
      "version":1,
      "utilities":[{
        "id":"display-block",
        "name":"block",
        "type":-2,
        "emit":{"type":"static","rules":[{"declarations":{"display":"block"}}]},
        "matchers":[{"type":"static","name":"block"}]
      }]
    }"#;

    #[test]
    fn generates_batches_without_retaining_class_rules() {
        let mut session = ValidatorSession::create(MANIFEST).unwrap();
        let first = session
            .generate_classes(["block", "unknown"], None)
            .unwrap();
        assert_eq!(first.version, 1);
        assert!(first.classes[0].matched);
        assert_eq!(first.classes[0].rules[0].text, ".block{display:block}");
        assert!(!first.classes[1].matched);

        let second = session.generate_classes(["block"], None).unwrap();
        assert_eq!(second.classes[0].rules, first.classes[0].rules);
    }

    #[test]
    fn commits_only_host_supported_native_declarations() {
        let mut session = ValidatorSession::create(r#"{"version":1,"utilities":[]}"#).unwrap();
        let candidates = session
            .native_declaration_candidates(["display:block", "display:banana"])
            .unwrap();
        assert_eq!(candidates.len(), 2);
        let result = session
            .generate_classes(["display:block", "display:banana"], Some(&[true, false]))
            .unwrap();
        assert!(result.classes[0].matched);
        assert!(!result.classes[1].matched);
    }

    #[test]
    fn validates_native_declarations_nested_in_groups() {
        let mut session = ValidatorSession::create(MANIFEST).unwrap();
        let candidates = session
            .native_declaration_candidates(["{text-wrap:pretty;block}"])
            .unwrap();
        assert_eq!(candidates.len(), 1);
        assert_eq!(candidates[0].class_name, "text-wrap:pretty");
        let result = session
            .generate_classes(["{text-wrap:pretty;block}"], Some(&[true]))
            .unwrap();
        assert!(result.classes[0].matched);
        assert_eq!(
            result.classes[0].rules[0].text,
            ".\\{text-wrap\\:pretty\\;block\\}{text-wrap:pretty;display:block}"
        );
    }
}
