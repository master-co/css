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
        _native_support: Option<&[bool]>,
    ) -> Result<ValidatorBatchIr, EngineError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        let class_names = class_names
            .into_iter()
            .map(|class_name| class_name.as_ref().to_owned())
            .collect::<Vec<_>>();
        self.engine.ensure_class_rules(&class_names)?;
        let classes = class_names
            .iter()
            .map(|class_name| {
                let inspection = self.engine.inspect(class_name)?;
                Ok(ValidatorClassIr {
                    class_name: class_name.clone(),
                    match_status: inspection.match_status,
                    css_syntax_status: inspection.css_syntax_status,
                    css_value_status: inspection.css_value_status,
                    browser_support: inspection.browser_support,
                    rules: inspection.rules,
                    diagnostics: inspection.diagnostics,
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
      "version":1,"languageVersion":2,
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
        assert_eq!(first.version, VALIDATOR_BATCH_VERSION);
        assert!(first.classes[0].match_status == mastercss_schema::MatchStatus::Matched);
        assert_eq!(first.classes[0].rules[0].text, ".block{display:block}");
        assert!(first.classes[1].match_status != mastercss_schema::MatchStatus::Matched);

        let second = session.generate_classes(["block"], None).unwrap();
        assert_eq!(second.classes[0].rules, first.classes[0].rules);
    }

    #[test]
    fn preserves_native_declarations_regardless_of_host_support() {
        let mut session =
            ValidatorSession::create(r#"{"version":1,"languageVersion":2,"utilities":[]}"#)
                .unwrap();
        let candidates = session
            .native_declaration_candidates(["display:block", "display:banana"])
            .unwrap();
        assert_eq!(candidates.len(), 2);
        let result = session
            .generate_classes(["display:block", "display:banana"], Some(&[true, false]))
            .unwrap();
        assert!(result.classes[0].match_status == mastercss_schema::MatchStatus::Matched);
        assert!(result.classes[1].match_status == mastercss_schema::MatchStatus::Matched);
        assert_eq!(
            result.classes[1].css_value_status,
            mastercss_schema::CssValueStatus::NotChecked
        );
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
        assert!(result.classes[0].match_status == mastercss_schema::MatchStatus::Matched);
        assert_eq!(
            result.classes[0].rules[0].text,
            ".\\{text-wrap\\:pretty\\;block\\}{text-wrap:pretty}"
        );
        assert_eq!(result.classes[0].rules.len(), 2);
        assert!(result.classes[0].rules[1].text.contains("display:block"));
    }
}
