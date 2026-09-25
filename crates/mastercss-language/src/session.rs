use super::*;
use crate::color::{color_expression, color_source_format};

impl LanguageSession {
    pub fn create(manifest_json: &str) -> Result<Self, LanguageError> {
        let engine = EngineSession::create(manifest_json)?;
        Ok(Self {
            engine,
            manifest_json: manifest_json.to_owned(),
            prepared_document: None,
            next_document_id: 0,
        })
    }

    pub fn native_declaration_candidates<I, S>(
        &self,
        class_names: I,
    ) -> Result<Vec<NativeDeclarationCandidateIr>, LanguageError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        Ok(self.engine.native_declaration_candidates(class_names)?)
    }

    pub fn format_directives(
        &self,
        request: &FormatDirectivesRequestIr,
    ) -> Result<LanguageFormatEditsIr, LanguageError> {
        let source_length = utf16_len(&request.source);
        let regions = if request.style_ranges.is_empty() {
            vec![SourceRange {
                start: 0,
                end: source_length,
            }]
        } else {
            request.style_ranges.clone()
        };
        let mut edits = Vec::new();
        for region in regions {
            let region_source =
                source_slice(&request.source, &region).ok_or(LanguageError::InvalidRange)?;
            for directive in find_css_directive_ranges(region_source) {
                let directive_range = SourceRange {
                    start: region.start + directive.range.start,
                    end: region.start + directive.range.end,
                };
                let prelude_range = SourceRange {
                    start: region.start + directive.prelude_range.start,
                    end: region.start + directive.prelude_range.end,
                };
                if !range_within(&directive_range, request.range.as_ref())
                    && !ranges_equal(&prelude_range, request.range.as_ref())
                {
                    continue;
                }
                let Some(text) = formatted_directive_prelude(region_source, &directive) else {
                    continue;
                };
                if !range_within(&prelude_range, request.range.as_ref()) {
                    continue;
                }
                let current = source_slice(&request.source, &prelude_range)
                    .ok_or(LanguageError::InvalidRange)?;
                if current != text {
                    edits.push(LanguageFormatEditIr {
                        range: prelude_range,
                        text,
                    });
                }
            }
        }
        edits.sort_by_key(|edit| (edit.range.start, edit.range.end));
        edits.dedup_by(|left, right| left.range == right.range && left.text == right.text);
        Ok(LanguageFormatEditsIr {
            version: LANGUAGE_BATCH_VERSION,
            edits,
        })
    }

    pub(crate) fn push_class_semantic_tokens(
        &self,
        class_name: &str,
        token_start: u32,
        tokens: &mut Vec<SemanticTokenInputIr>,
    ) -> Result<(), LanguageError> {
        let starts_with_group = class_name.starts_with('{');
        let group_close = starts_with_group
            .then(|| find_language_group_close(class_name))
            .flatten();
        let body_start = usize::from(starts_with_group);
        let body_end = group_close.unwrap_or(class_name.len());
        let body = &class_name[body_start..body_end];
        let semicolons = top_level_semicolons(body);
        if starts_with_group || !semicolons.is_empty() {
            if starts_with_group {
                push_semantic_token(
                    tokens,
                    token_start,
                    token_start + 1,
                    "operator",
                    &["blockBrace"],
                );
            }
            let mut part_start = 0;
            for part_end in semicolons
                .iter()
                .copied()
                .chain(std::iter::once(body.len()))
            {
                let part = &body[part_start..part_end];
                let trimmed = part.trim();
                if !trimmed.is_empty() {
                    let leading_bytes = part.len() - part.trim_start().len();
                    self.push_class_semantic_tokens(
                        trimmed,
                        token_start
                            + utf16_len(&class_name[..body_start])
                            + utf16_len(&body[..part_start + leading_bytes]),
                        tokens,
                    )?;
                }
                if part_end < body.len() {
                    let semicolon_start = token_start
                        + utf16_len(&class_name[..body_start])
                        + utf16_len(&body[..part_end]);
                    push_semantic_token(
                        tokens,
                        semicolon_start,
                        semicolon_start + 1,
                        "operator",
                        &["declarationTerminator"],
                    );
                }
                part_start = part_end.saturating_add(1);
            }
            if let Some(close) = group_close {
                let close_start = token_start + utf16_len(&class_name[..close]);
                push_semantic_token(
                    tokens,
                    close_start,
                    close_start + 1,
                    "operator",
                    &["blockBrace"],
                );
                let suffix_start = close + 1;
                push_state_semantic_tokens(
                    tokens,
                    &class_name[suffix_start..],
                    token_start + utf16_len(&class_name[..suffix_start]),
                );
            }
            return Ok(());
        }

        let semantics = self.engine.inspect_class_semantics(class_name)?;
        if semantics.kind == ClassSemanticKind::Unknown {
            for (index, character) in class_name.char_indices() {
                if !matches!(character, ':' | '_' | '>' | '+' | '~' | '@') || index == 0 {
                    continue;
                }
                let base = &class_name[..index];
                if self.engine.inspect_class_semantics(base)?.kind == ClassSemanticKind::Unknown {
                    continue;
                }
                self.push_class_semantic_tokens(base, token_start, tokens)?;
                push_state_semantic_tokens(
                    tokens,
                    &class_name[index..],
                    token_start + utf16_len(base),
                );
                return Ok(());
            }
            return Ok(());
        }
        let state_length = semantics
            .state_token
            .as_deref()
            .map(utf16_len)
            .unwrap_or_default();
        let important_length = u32::from(semantics.important);
        let base_end = token_start
            .saturating_add(utf16_len(class_name))
            .saturating_sub(state_length + important_length);
        match semantics.kind {
            ClassSemanticKind::Component => push_semantic_token(
                tokens,
                token_start,
                base_end,
                "class",
                &["declaration", "component"],
            ),
            ClassSemanticKind::Semantic | ClassSemanticKind::Pattern => {
                push_semantic_token(tokens, token_start, base_end, "enumMember", &[])
            }
            ClassSemanticKind::Token => {
                if let (Some(key), Some(value)) = (
                    semantics.key_token.as_deref(),
                    semantics.value_token.as_deref(),
                ) {
                    let (name, opacity) = value
                        .split_once('/')
                        .map_or((value, None), |(name, alpha)| (name, Some(alpha)));
                    let name_end = token_start + utf16_len(key) + utf16_len(name);
                    push_semantic_token(tokens, token_start, name_end, "enumMember", &[]);
                    if let Some(alpha) = opacity {
                        push_semantic_token(
                            tokens,
                            name_end,
                            name_end + 1,
                            "operator",
                            &["valueSeparator"],
                        );
                        push_semantic_token(
                            tokens,
                            name_end + 1,
                            name_end + 1 + utf16_len(alpha),
                            "number",
                            &[],
                        );
                    }
                }
            }
            ClassSemanticKind::Declaration => {
                if let Some(key) = semantics.key_token.as_deref() {
                    let key_length = utf16_len(key.trim_end_matches([':', '-']));
                    push_semantic_token(
                        tokens,
                        token_start,
                        token_start + key_length,
                        "property",
                        &[],
                    );
                    if key.ends_with([':', '-']) {
                        push_semantic_token(
                            tokens,
                            token_start + key_length,
                            token_start + key_length + 1,
                            "operator",
                            &["declarationSeparator"],
                        );
                    }
                    if let Some(value) = semantics.value_token.as_deref() {
                        let value_start = token_start + utf16_len(key);
                        push_value_semantic_tokens(tokens, value, value_start);
                    }
                }
            }
            ClassSemanticKind::Unknown => {}
        }
        if semantics.important {
            push_semantic_token(tokens, base_end, base_end + 1, "operator", &["important"]);
        }
        if let Some(state) = semantics.state_token.as_deref() {
            push_state_semantic_tokens(
                tokens,
                state,
                token_start + utf16_len(class_name) - state_length,
            );
        }
        Ok(())
    }

    pub(crate) fn semantic_tokens_for_positions(
        &self,
        positions: &[ClassPositionIr],
        contexts: &[ClassListContextIr],
    ) -> Result<Vec<SemanticTokenInputIr>, LanguageError> {
        let mut tokens = Vec::new();
        for position in positions {
            if position.raw == position.token {
                self.push_class_semantic_tokens(
                    &position.token,
                    position.range.start,
                    &mut tokens,
                )?;
                continue;
            }
            let context = contexts
                .iter()
                .find(|context| {
                    context.start == position.context_range.start
                        && context.end == position.context_range.end
                })
                .ok_or(LanguageError::InvalidRange)?;
            if context.unescape.is_empty() {
                // Decoded entities and JS expressions have a source span, not an
                // offset-preserving character mapping. Highlight that span only.
                tokens.push(SemanticTokenInputIr {
                    start: position.range.start,
                    end: position.range.end,
                    token_type: "class".into(),
                    modifiers: Vec::new(),
                });
                continue;
            }
            let offsets = crate::positions::unescape_offsets(&position.raw, &context.unescape);
            let first = tokens.len();
            self.push_class_semantic_tokens(&position.token, 0, &mut tokens)?;
            for token in &mut tokens[first..] {
                token.start = position.range.start
                    + offsets
                        .get(token.start as usize)
                        .ok_or(LanguageError::InvalidRange)?;
                token.end = position.range.start
                    + offsets
                        .get(token.end as usize)
                        .ok_or(LanguageError::InvalidRange)?;
            }
        }
        Ok(tokens)
    }

    pub fn classify_class_names<I, S>(
        &mut self,
        class_names: I,
        _native_support: Option<&[bool]>,
    ) -> Result<LanguageClassificationsIr, LanguageError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        let class_names = class_names
            .into_iter()
            .map(|class_name| class_name.as_ref().to_owned())
            .collect::<Vec<_>>();
        let classes = class_names
            .iter()
            .map(|class_name| self.engine.inspect_class_semantics(class_name))
            .collect::<Result<Vec<_>, _>>()?;
        Ok(LanguageClassificationsIr {
            version: LANGUAGE_BATCH_VERSION,
            variable_names: self.engine.variable_names()?,
            classes,
        })
    }

    pub fn inspect_class_name(
        &self,
        class_name: &str,
        _native_support: Option<&[bool]>,
        mode: Option<&str>,
    ) -> Result<LanguageInspectionIr, LanguageError> {
        let mut engine = EngineSession::create(&self.manifest_json)?;
        engine.ensure_class_rules([class_name])?;
        let semantics = engine.inspect_class_semantics_with_mode(class_name, mode)?;
        let inspection = engine.inspect_with_mode(class_name, mode)?;
        let (fallback_base, fallback_suffix, fallback_key, fallback_value) =
            inspect_class_name_parts(class_name);
        let (base, suffix, key, value) =
            if inspection.match_status == mastercss_schema::MatchStatus::Matched {
                let suffix = format!(
                    "{}{}",
                    if semantics.important { "!" } else { "" },
                    semantics.state_token.as_deref().unwrap_or_default()
                );
                let base = if suffix.is_empty() {
                    class_name.to_owned()
                } else {
                    class_name
                        .strip_suffix(&suffix)
                        .unwrap_or(class_name)
                        .to_owned()
                };
                let key_value = semantics
                    .key_token
                    .as_deref()
                    .and_then(|key| key.strip_suffix(':').or_else(|| key.strip_suffix('-')))
                    .zip(semantics.value_token.as_deref());
                let (key, value) = key_value
                    .map(|(key, value)| (Some(key.to_owned()), Some(value.to_owned())))
                    .unwrap_or_default();
                (base, suffix, key, value)
            } else {
                (fallback_base, fallback_suffix, fallback_key, fallback_value)
            };
        let mut variables = engine.class_variable_entries(class_name)?;
        if semantics.kind == ClassSemanticKind::Token {
            let token_key = semantics
                .value_token
                .as_deref()
                .unwrap_or_default()
                .split('/')
                .next()
                .unwrap_or_default();
            variables.retain(|entry| entry.key == token_key);
        }
        let text = engine.render_class_name_isolated_with_mode(class_name, mode)?;
        Ok(LanguageInspectionIr {
            version: LANGUAGE_BATCH_VERSION,
            class_name: class_name.to_owned(),
            match_status: inspection.match_status,
            css_syntax_status: inspection.css_syntax_status,
            css_value_status: inspection.css_value_status,
            browser_support: inspection.browser_support,
            kind: semantics.kind,
            base,
            suffix,
            key,
            value,
            key_token: semantics.key_token,
            value_token: semantics.value_token,
            state_token: semantics.state_token,
            important: semantics.important,
            matcher_types: semantics.matcher_types,
            variables,
            rules: inspection.rules,
            diagnostics: inspection.diagnostics,
            text,
        })
    }

    pub fn completion_index(&self) -> Result<LanguageCompletionIndexIr, LanguageError> {
        let candidates = self.engine.class_completion_candidates()?;
        let documentation_class_names = candidates
            .iter()
            .filter_map(|candidate| candidate.documentation_class_name.clone())
            .collect::<Vec<_>>();
        let documentation_texts = self
            .engine
            .render_class_names_isolated(&documentation_class_names)?;
        let documentation_by_class = documentation_class_names
            .into_iter()
            .zip(documentation_texts)
            .collect::<HashMap<_, _>>();
        let mut class_entries = candidates
            .into_iter()
            .map(|candidate| LanguageCompletionEntryIr {
                label: candidate.label,
                kind: match candidate.kind {
                    EngineClassCompletionKind::Property => LanguageCompletionKind::Property,
                    EngineClassCompletionKind::Value => LanguageCompletionKind::Value,
                },
                detail: candidate.detail,
                documentation_text: candidate
                    .documentation_class_name
                    .as_deref()
                    .and_then(|class_name| documentation_by_class.get(class_name))
                    .cloned(),
                sort_text: candidate.sort_text,
                trigger_suggest: candidate.trigger_suggest,
            })
            .collect();
        augment_completion_entries(&mut class_entries);
        Ok(LanguageCompletionIndexIr {
            version: LANGUAGE_BATCH_VERSION,
            class_entries,
        })
    }

    pub fn color_presentation(
        &self,
        color_token: &str,
    ) -> Result<LanguageColorPresentationIr, LanguageError> {
        let semantic = self.engine.inspect_class_semantics(color_token)?;
        let named = semantic.kind == mastercss_engine::ClassSemanticKind::Token;
        let rules = if named {
            self.engine.composition_rules(color_token)?
        } else {
            Vec::new()
        };
        let replacement_prefix = (rules.len() == 1 && rules[0].declarations.len() == 1)
            .then(|| format!("{}:", rules[0].declarations.keys().next().unwrap()));
        Ok(LanguageColorPresentationIr {
            version: LANGUAGE_BATCH_VERSION,
            editable: !named || replacement_prefix.is_some(),
            replacement_prefix,
            color_token: color_token.to_owned(),
            source_format: color_source_format(&self.engine, color_token)?,
        })
    }

    pub fn color_tokens(
        &self,
        candidates: &[LanguageColorCandidateInputIr],
    ) -> Result<LanguageColorTokensIr, LanguageError> {
        let mut tokens = Vec::new();
        for candidate in candidates {
            for token in self.engine.color_tokens(&candidate.class_name)? {
                let start = candidate
                    .start
                    .checked_add(token.start)
                    .ok_or(LanguageError::InvalidRange)?;
                let end = candidate
                    .start
                    .checked_add(token.end)
                    .ok_or(LanguageError::InvalidRange)?;
                if let Some(expression) = color_expression(
                    &self.engine,
                    &candidate.class_name,
                    &token.value,
                    token.alpha,
                )? {
                    tokens.push(LanguageColorTokenIr {
                        range: SourceRange { start, end },
                        expression,
                    });
                }
            }
        }
        Ok(LanguageColorTokensIr {
            version: LANGUAGE_BATCH_VERSION,
            tokens,
        })
    }

    pub fn dispose(&mut self) {
        self.prepared_document = None;
        self.engine.dispose();
    }
}
