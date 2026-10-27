use super::{EngineError, LintSession, NativeDeclarationCandidateIr};

impl LintSession {
    pub(crate) fn ensure_class_rules(
        &mut self,
        class_names: &[String],
        native_support: Option<&[bool]>,
    ) -> Result<Vec<NativeDeclarationCandidateIr>, EngineError> {
        let _ = native_support;
        let native_candidates = self.engine.native_declaration_candidates(class_names)?;
        self.engine.ensure_class_rules(class_names)?;
        Ok(native_candidates)
    }
}
