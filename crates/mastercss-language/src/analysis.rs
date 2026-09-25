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
    diagnostics: Vec<mastercss_schema::Diagnostic>,
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
        let markdown = matches!(request.language_id.as_str(), "markdown" | "mdx").then(|| {
            mastercss_source::extract_source_result(&mastercss_source::SourceExtractionInputIr {
                source: format!(
                    "document.{}",
                    if request.language_id == "mdx" {
                        "mdx"
                    } else {
                        "md"
                    }
                ),
                content: request.source.clone(),
                kind: mastercss_source::SourceExtractorKind::Auto,
                owner: None,
            })
        });
        let allowed = document::markdown_class_contexts(&request.source, &index, &request.settings);
        let mut contexts = if let Some(extracted) = &markdown {
            extracted
                .occurrences
                .iter()
                .filter(|item| document::markdown_class_occurrence(item, &allowed))
                .map(|item| ClassListContextIr {
                    start: item.context_range.start,
                    end: item.context_range.end,
                    unescape: Vec::new(),
                })
                .collect()
        } else {
            collect_document_contexts_indexed(
                &request.source,
                &index,
                &request.language_id,
                &request.settings,
            )
        };
        contexts.extend(request.host_ranges.iter().cloned());
        contexts.sort_by_key(|range| (range.start, range.end));
        contexts.dedup_by(|left, right| left.start == right.start && left.end == right.end);
        let mut positions = if let Some(extracted) = &markdown {
            extracted
                .occurrences
                .iter()
                .filter(|item| document::markdown_class_occurrence(item, &allowed))
                .map(|item| {
                    let start = index
                        .utf16_to_byte(item.range.start)
                        .ok_or(LanguageError::InvalidRange)?;
                    let end = index
                        .utf16_to_byte(item.range.end)
                        .ok_or(LanguageError::InvalidRange)?;
                    Ok(ClassPositionIr {
                        range: item.range.clone(),
                        context_range: item.context_range.clone(),
                        token: item.candidate.clone(),
                        raw: request.source[start..end].to_owned(),
                    })
                })
                .collect::<Result<Vec<_>, LanguageError>>()?
        } else {
            positions::collect_class_positions_indexed(&request.source, &contexts, &index)?
        };
        if markdown.is_some() {
            positions.extend(positions::collect_class_positions_indexed(
                &request.source,
                &request.host_ranges,
                &index,
            )?);
            positions.sort_by_key(|item| (item.range.start, item.range.end));
            positions.dedup_by(|a, b| a.range == b.range && a.token == b.token);
        }
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
            diagnostics: markdown.map_or_else(Vec::new, |extracted| {
                extracted
                    .diagnostics
                    .into_iter()
                    .map(|mut diagnostic| {
                        diagnostic.source = None;
                        diagnostic
                    })
                    .collect()
            }),
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
            diagnostics: prepared.diagnostics,
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
        _native_support: &[bool],
    ) -> Result<LanguageDocumentIr, LanguageError> {
        if !self
            .prepared_document
            .as_ref()
            .is_some_and(|prepared| prepared.id == id)
        {
            return Err(LanguageError::InvalidPreparedDocument);
        }
        let prepared = self.prepared_document.take().unwrap();
        self.engine.ensure_class_rules(&prepared.class_names)?;
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
