use super::*;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PreparedDocumentIr {
    pub id: u32,
    pub native_candidates: Vec<NativeDeclarationCandidateIr>,
}

#[derive(Debug)]
pub(crate) struct PreparedDocument {
    id: u32,
    index: DocumentIndex,
    contexts: Vec<ClassListContextIr>,
    positions: Vec<ClassPositionIr>,
    class_names: Vec<String>,
    native_candidates: Vec<NativeDeclarationCandidateIr>,
}

impl LanguageSession {
    fn document_input(
        &self,
        request: &AnalyzeDocumentRequestIr,
        id: u32,
    ) -> Result<PreparedDocument, LanguageError> {
        // This also rejects calls after disposal without allocating inspection data.
        self.engine
            .native_declaration_candidates(std::iter::empty::<&str>())?;
        let index = DocumentIndex::new(&request.source);
        let mut contexts = collect_document_contexts_indexed(
            &request.source,
            &index,
            &request.language_id,
            &request.settings,
        );
        contexts.extend(request.host_ranges.iter().cloned());
        contexts.sort_by_key(|range| (range.start, range.end));
        contexts.dedup_by(|left, right| left.start == right.start && left.end == right.end);
        let positions =
            positions::collect_class_positions_indexed(&request.source, &contexts, &index)?;
        let mut seen = HashSet::new();
        let class_names = positions
            .iter()
            .filter(|position| seen.insert(position.token.as_str()))
            .map(|position| position.token.clone())
            .collect::<Vec<_>>();
        Ok(PreparedDocument {
            id,
            index,
            contexts,
            positions,
            class_names,
            native_candidates: Vec::new(),
        })
    }

    fn document_result(
        &self,
        prepared: PreparedDocument,
    ) -> Result<LanguageDocumentIr, LanguageError> {
        let semantic_tokens =
            self.semantic_tokens_for_positions(&prepared.positions, &prepared.contexts)?;
        Ok(LanguageDocumentIr {
            version: LANGUAGE_BATCH_VERSION,
            class_positions: prepared.positions,
            semantic_token_data: positions::encode_semantic_tokens_indexed(
                &prepared.index,
                &semantic_tokens,
            ),
            semantic_tokens,
        })
    }

    pub fn analyze_document(
        &self,
        request: &AnalyzeDocumentRequestIr,
    ) -> Result<LanguageDocumentIr, LanguageError> {
        self.document_result(self.document_input(request, 0)?)
    }

    pub fn prepare_document(
        &mut self,
        request: &AnalyzeDocumentRequestIr,
    ) -> Result<PreparedDocumentIr, LanguageError> {
        self.prepared_document = None;
        self.next_document_id = self
            .next_document_id
            .checked_add(1)
            .ok_or(LanguageError::InvalidPreparedDocument)?;
        let mut prepared = self.document_input(request, self.next_document_id)?;
        prepared.native_candidates = self
            .engine
            .native_declaration_candidates(&prepared.class_names)?;
        let result = PreparedDocumentIr {
            id: prepared.id,
            native_candidates: prepared.native_candidates.clone(),
        };
        self.prepared_document = Some(prepared);
        Ok(result)
    }

    pub fn finish_document(
        &mut self,
        id: u32,
        native_support: &[bool],
    ) -> Result<LanguageDocumentIr, LanguageError> {
        if !self
            .prepared_document
            .as_ref()
            .is_some_and(|prepared| prepared.id == id)
        {
            return Err(LanguageError::InvalidPreparedDocument);
        }
        let prepared = self.prepared_document.take().unwrap();
        if native_support.len() != prepared.native_candidates.len() {
            return Err(LanguageError::InvalidNativeSupport);
        }
        for (candidate, supported) in prepared
            .native_candidates
            .iter()
            .zip(native_support.iter().copied())
        {
            self.native_support_by_class
                .insert(candidate.class_name.clone(), supported);
        }
        self.engine
            .ensure_class_rules_with_native_support(&prepared.class_names, native_support)?;
        self.document_result(prepared)
    }

    pub fn cancel_document(&mut self, id: u32) {
        if self
            .prepared_document
            .as_ref()
            .is_some_and(|prepared| prepared.id == id)
        {
            self.prepared_document = None;
        }
    }

    pub fn discard_prepared_document(&mut self) {
        self.prepared_document = None;
    }
}
