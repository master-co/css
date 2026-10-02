use super::*;
use mastercss_lexer::{CssSyntaxKind as Kind, collect_css_syntax_statements, tokenize_css_syntax};

fn regions(source: &str, language: &str) -> Vec<std::ops::Range<usize>> {
    let mut regions = Vec::new();
    if matches!(language, "css" | "scss" | "less") {
        regions.push(0..source.len());
    } else if matches!(language, "vue" | "svelte" | "astro" | "html") {
        let mut start = 0;
        while let Some(open) = source[start..].find("<style") {
            let Some(content) = source[start + open..].find('>') else {
                break;
            };
            let from = start + open + content + 1;
            let Some(close) = source[from..].find("</style>") else {
                break;
            };
            regions.push(from..from + close);
            start = from + close + 8;
        }
    }
    regions
}

pub(crate) fn positions(
    source: &str,
    language: &str,
    index: &DocumentIndex,
) -> Vec<ClassPositionIr> {
    let mut result = Vec::new();
    for region in regions(source, language) {
        let tokens = tokenize_css_syntax(&source[region.clone()]);
        for statement in collect_css_syntax_statements(&tokens) {
            let head = &tokens[statement.tokens.clone()];
            if !matches!(head.first().map(|t| &t.kind), Some(Kind::AtKeyword(name)) if name == "safelist")
                || !matches!(head.get(1).map(|t| &t.kind), Some(Kind::Ident(name)) if name == "keyframes")
            {
                continue;
            }
            let end = tokens
                .get(statement.tokens.end)
                .map_or(region.len(), |t| t.bytes.start);
            let context_range = SourceRange {
                start: index
                    .byte_to_utf16(region.start + head[1].bytes.end)
                    .unwrap(),
                end: index.byte_to_utf16(region.start + end).unwrap(),
            };
            let mut previous = head[1].bytes.end;
            for token in &head[2..] {
                if let Kind::String(name) = &token.kind {
                    if previous < token.bytes.start {
                        result.push(ClassPositionIr {
                            range: SourceRange {
                                start: index.byte_to_utf16(region.start + previous).unwrap(),
                                end: index
                                    .byte_to_utf16(region.start + token.bytes.start)
                                    .unwrap(),
                            },
                            context_range: context_range.clone(),
                            raw: String::new(),
                            token: String::new(),
                        });
                    }
                    result.push(ClassPositionIr {
                        range: SourceRange {
                            start: index
                                .byte_to_utf16(region.start + token.bytes.start)
                                .unwrap(),
                            end: index.byte_to_utf16(region.start + token.bytes.end).unwrap(),
                        },
                        context_range: context_range.clone(),
                        raw: source
                            [region.start + token.bytes.start..region.start + token.bytes.end]
                            .into(),
                        token: name.to_string(),
                    });
                    previous = token.bytes.end;
                }
            }
            if previous < end {
                result.push(ClassPositionIr {
                    range: SourceRange {
                        start: index.byte_to_utf16(region.start + previous).unwrap(),
                        end: context_range.end,
                    },
                    context_range,
                    raw: String::new(),
                    token: String::new(),
                });
            }
        }
    }
    result.sort_by_key(|position| (position.raw.is_empty(), position.range.start));
    result
}

pub(crate) fn completions(
    definitions: &[mastercss_schema::KeyframeDefinition],
) -> Vec<KeyframeCompletionIr> {
    let mut result: Vec<KeyframeCompletionIr> = Vec::new();
    for definition in definitions {
        let entry = if let Some(index) = result
            .iter()
            .position(|entry| entry.name == definition.name)
        {
            &mut result[index]
        } else {
            let escaped = definition
                .name
                .chars()
                .map(|ch| match ch {
                    '\\' => "\\\\".into(),
                    '"' => "\\\"".into(),
                    ch if ch.is_control() => format!("\\{:x} ", ch as u32),
                    ch => ch.to_string(),
                })
                .collect::<String>();
            result.push(KeyframeCompletionIr {
                name: definition.name.clone(),
                insert_text: format!("\"{escaped}\""),
                text: String::new(),
                sources: Vec::new(),
            });
            result.last_mut().unwrap()
        };
        if !entry.text.is_empty() {
            entry.text.push('\n');
        }
        for container in &definition.containers {
            entry.text.push_str(&container.prelude);
            entry.text.push('{');
        }
        entry.text.push_str(&definition.text);
        entry
            .text
            .extend(std::iter::repeat_n('}', definition.containers.len()));
        if let Some(source) = &definition.source {
            entry.sources.push(source.clone());
        }
    }
    result
}

pub(crate) fn diagnostics(
    source: &str,
    language: &str,
    index: &DocumentIndex,
) -> Vec<mastercss_schema::Diagnostic> {
    regions(source, language)
        .into_iter()
        .flat_map(|region| {
            let offset = index.byte_to_utf16(region.start).unwrap();
            mastercss_lexer::keyframe_safelist_diagnostics(&source[region])
                .into_iter()
                .map(move |mut diagnostic| {
                    if let Some(range) = &mut diagnostic.range {
                        range.start += offset;
                        range.end += offset;
                    }
                    diagnostic
                })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn typed_names_are_not_classes_and_keep_utf16_ranges_and_escapes() {
        let session = LanguageSession::create(&serde_json::json!({
            "version": mastercss_schema::MANIFEST_VERSION,
            "languageVersion": mastercss_schema::LANGUAGE_VERSION,
            "keyframes": [
                {"id":"a", "name":"with space", "text":"@keyframes \"with space\"{to{opacity:1}}"},
                {"id":"b", "name":"fade", "text":"@keyframes fade{to{opacity:.5}}"},
                {"id":"c", "name":"fade", "text":"@keyframes fade{to{opacity:1}}"}
            ]
        }).to_string()).unwrap();
        let source =
            "/* 😀 */@safelist keyframes \"with space\" \"\\66 ade\";@safelist \"opacity:1\";";
        let result = session
            .analyze_document(&AnalyzeDocumentRequestIr {
                source: source.into(),
                language_id: "css".into(),
                host_ranges: Vec::new(),
                settings: Default::default(),
            })
            .unwrap();
        assert_eq!(
            result
                .class_positions
                .iter()
                .map(|position| position.token.as_str())
                .collect::<Vec<_>>(),
            ["opacity:1"]
        );
        let names = result
            .keyframe_positions
            .iter()
            .filter(|position| !position.raw.is_empty())
            .collect::<Vec<_>>();
        assert_eq!(
            names
                .iter()
                .map(|position| position.token.as_str())
                .collect::<Vec<_>>(),
            ["with space", "fade"]
        );
        assert_eq!(
            source_slice(source, &names[1].range).unwrap(),
            "\"\\66 ade\""
        );
        let entries = session.completion_index().unwrap().keyframes;
        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0].insert_text, "\"with space\"");
        assert_eq!(entries[1].text.matches("@keyframes").count(), 2);
        assert!(result.diagnostics.is_empty());
    }

    #[test]
    fn malformed_typed_safelists_have_editor_diagnostics_without_class_diagnostics() {
        let source = "<style>/* 😀 */@safelist keyframes fade;</style>";
        let errors = diagnostics(source, "vue", &DocumentIndex::new(source));
        assert_eq!(errors.len(), 1);
        assert_eq!(
            errors[0].code,
            mastercss_schema::ErrorCode::CssDirectiveError
        );
        assert!(
            source_slice(source, errors[0].range.as_ref().unwrap())
                .unwrap()
                .starts_with("@safelist")
        );
        assert!(
            diagnostics(
                "const text = '@safelist keyframes fade;'",
                "typescript",
                &DocumentIndex::new("const text = '@safelist keyframes fade;' ")
            )
            .is_empty()
        );
    }
}
