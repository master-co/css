use super::*;
use mastercss_schema::{Diagnostic, DiagnosticPhase, DiagnosticSeverity, ErrorCode, SourceRange};
use std::ops::Range;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceOccurrenceIr {
    pub candidate: String,
    pub source: String,
    pub range: SourceRange,
    pub context_range: SourceRange,
    /// A transformed JS literal may map to its enclosing expression span.
    pub range_kind: String,
    pub extractor: String,
    pub content_kind: String,
    pub owner: String,
    pub included: bool,
    pub reason: String,
}

pub fn extract_source_result(input: &SourceExtractionInputIr) -> SourceExtractionIr {
    let mut output = SourceExtractionIr {
        source: input.source.clone(),
        candidates: Vec::new(),
        occurrences: Vec::new(),
        diagnostics: Vec::new(),
    };
    let mut collector = Collector {
        input,
        output: &mut output,
        seen: HashSet::new(),
    };
    let kind = if input.kind == SourceExtractorKind::Auto {
        let path = input.source.split('?').next().unwrap_or(&input.source);
        match Path::new(path)
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or_default()
            .to_ascii_lowercase()
            .as_str()
        {
            "md" | "markdown" => SourceExtractorKind::Markdown,
            "mdx" => SourceExtractorKind::Mdx,
            "js" | "jsx" | "cjs" | "mjs" | "ts" | "tsx" | "cts" | "mts" => SourceExtractorKind::Oxc,
            "html" | "htm" => SourceExtractorKind::Html,
            "astro" => SourceExtractorKind::Astro,
            _ => SourceExtractorKind::Raw,
        }
    } else {
        input.kind
    };
    let result = match kind {
        SourceExtractorKind::Oxc => collector.javascript(&input.content, 0, 0, "javascript"),
        SourceExtractorKind::Html => collector.html(&input.content, 0),
        SourceExtractorKind::Markdown | SourceExtractorKind::Mdx => {
            collector.markdown(kind == SourceExtractorKind::Mdx)
        }
        SourceExtractorKind::Astro => collector.astro(),
        _ => {
            collector.add(
                &input.content,
                0..input.content.len(),
                "raw",
                "text",
                true,
                None,
            );
            Ok(())
        }
    };
    if let Err((message, range)) = result {
        // A failed parse is never a successful empty-file update.
        output.candidates.clear();
        output.occurrences.clear();
        output.diagnostics.push(Diagnostic { code: ErrorCode::SourceParseError, phase: DiagnosticPhase::Compiler, severity: DiagnosticSeverity::Error, message, source: Some(input.source.clone()), range: Some(utf16_range(&input.content, range)), notes: vec!["Previous successful source contributions must be retained; use kind: 'raw' only for deliberate text extraction.".into()] });
    }
    output
}

impl Collector<'_> {
    fn astro(&mut self) -> ExtractionResult {
        let input = self.input;
        let (frontmatter, markup) = extract_astro_frontmatter(&input.content);
        if input.content.starts_with("---") && markup.len() == input.content.len() {
            return Err(("Unclosed Astro frontmatter".into(), 0..input.content.len()));
        }
        if !frontmatter.is_empty() {
            self.javascript(frontmatter, 3, 0, "astro-frontmatter")?;
        }
        let offset = input.content.len() - markup.len();
        self.html(markup, offset)?;
        // Astro's existing template adapter supplies candidates. Mark enclosing
        // source spans when it cannot expose a precise original token span.
        self.add(
            &input.content,
            0..input.content.len(),
            "astro",
            "template",
            true,
            Some(extract_astro_classes(&input.source, &input.content)),
        );
        Ok(())
    }
}

type ExtractionResult = Result<(), (String, Range<usize>)>;
struct Collector<'a> {
    input: &'a SourceExtractionInputIr,
    output: &'a mut SourceExtractionIr,
    seen: HashSet<String>,
}

fn utf16_range(source: &str, range: Range<usize>) -> SourceRange {
    SourceRange {
        start: source[..range.start].encode_utf16().count() as u32,
        end: source[..range.end].encode_utf16().count() as u32,
    }
}

impl Collector<'_> {
    fn add(
        &mut self,
        value: &str,
        range: Range<usize>,
        extractor: &str,
        content_kind: &str,
        included: bool,
        candidates: Option<Vec<String>>,
    ) {
        let original = &self.input.content[range.clone()];
        for candidate in candidates.unwrap_or_else(|| extract_class_candidates(value)) {
            let url = source_url_literal(&candidate);
            let included = included && !url;
            let matches = original
                .match_indices(&candidate)
                .map(|(offset, _)| range.start + offset..range.start + offset + candidate.len())
                .collect::<Vec<_>>();
            let precise = original == value && !matches.is_empty();
            for matched in if precise {
                matches
            } else {
                vec![range.clone()]
            } {
                self.output.occurrences.push(SourceOccurrenceIr {
                    candidate: candidate.clone(),
                    source: self.input.source.clone(),
                    range: utf16_range(&self.input.content, matched),
                    context_range: utf16_range(&self.input.content, range.clone()),
                    range_kind: if precise { "token" } else { "expression" }.into(),
                    extractor: extractor.into(),
                    content_kind: content_kind.into(),
                    owner: self.input.owner.clone().unwrap_or_else(|| "project".into()),
                    included,
                    reason: if url {
                        "url-literal"
                    } else if included {
                        "static-source"
                    } else {
                        "markdown-display"
                    }
                    .into(),
                });
            }
            if included && self.seen.insert(candidate.clone()) {
                self.output.candidates.push(candidate);
            }
        }
    }

    fn javascript(
        &mut self,
        source: &str,
        offset: usize,
        prefix: usize,
        content_kind: &str,
    ) -> ExtractionResult {
        let allocator = Allocator::default();
        let source_type = if prefix == 0 && content_kind == "javascript" {
            SourceType::from_path(&self.input.source).unwrap_or(SourceType::tsx())
        } else if content_kind == "astro-frontmatter" {
            SourceType::ts()
        } else {
            SourceType::tsx()
        };
        let parsed = Parser::new(&allocator, source, source_type).parse();
        if let Some(error) = parsed.diagnostics.first() {
            return Err((
                format!("Invalid {content_kind}: {error}"),
                offset
                    ..(offset + source.len().saturating_sub(prefix)).min(self.input.content.len()),
            ));
        }
        let mut visitor = ClassCandidateVisitor::default();
        visitor.visit_program(&parsed.program);
        for (value, range, html) in visitor.records {
            let start = offset + range.start.saturating_sub(prefix);
            let end = (offset + range.end.saturating_sub(prefix)).min(self.input.content.len());
            if html {
                self.html_attribute(&self.input.content[start..end], start);
            } else {
                self.add(&value, start..end, "oxc", content_kind, true, None);
            }
        }
        Ok(())
    }

    fn html_attribute(&mut self, raw: &str, start: usize) {
        let decoded = decode_html_attribute(raw);
        let base = self.input.content[..start].encode_utf16().count() as u32;
        for token in mastercss_lexer::collect_class_list_token_ranges(&decoded.value) {
            let included = !source_url_literal(&token.token);
            let spans = decoded
                .spans
                .iter()
                .filter(|span| {
                    span.range.start < token.range.end && span.range.end > token.range.start
                })
                .collect::<Vec<_>>();
            if let (Some(first), Some(last)) = (spans.first(), spans.last()) {
                self.output.occurrences.push(SourceOccurrenceIr {
                    candidate: token.token.clone(),
                    source: self.input.source.clone(),
                    range: SourceRange {
                        start: base + first.source_range.start,
                        end: base + last.source_range.end,
                    },
                    context_range: utf16_range(&self.input.content, start..start + raw.len()),
                    range_kind: "token".into(),
                    extractor: "html".into(),
                    content_kind: "class-attribute".into(),
                    owner: self.input.owner.clone().unwrap_or_else(|| "project".into()),
                    included,
                    reason: if included {
                        "static-source"
                    } else {
                        "url-literal"
                    }
                    .into(),
                });
                if included && self.seen.insert(token.token.clone()) {
                    self.output.candidates.push(token.token);
                }
            }
        }
    }

    fn html(&mut self, source: &str, offset: usize) -> ExtractionResult {
        for part in html_class_values::parts(source) {
            match part {
                html_class_values::Part::Class(raw) => {
                    let start = offset + (raw.as_ptr() as usize - source.as_ptr() as usize);
                    self.html_attribute(raw, start);
                }
                html_class_values::Part::Script(script) => self.javascript(
                    script,
                    offset + (script.as_ptr() as usize - source.as_ptr() as usize),
                    0,
                    "script",
                )?,
            }
        }
        Ok(())
    }

    fn markdown(&mut self, mdx: bool) -> ExtractionResult {
        let mut options = if mdx {
            markdown::ParseOptions::mdx()
        } else {
            markdown::ParseOptions::gfm()
        };
        options.constructs.frontmatter = true;
        if mdx {
            options.mdx_esm_parse = Some(Box::new(|value| {
                let allocator = Allocator::default();
                let parsed = Parser::new(&allocator, value, SourceType::tsx()).parse();
                if parsed.diagnostics.is_empty() {
                    markdown::MdxSignal::Ok
                } else {
                    markdown::MdxSignal::Eof(
                        "Invalid MDX ESM".into(),
                        Box::new("master-css".into()),
                        Box::new("SOURCE_PARSE_ERROR".into()),
                    )
                }
            }));
        }
        let tree = markdown::to_mdast(&self.input.content, &options)
            .map_err(|error| (error.to_string(), 0..self.input.content.len()))?;
        let mut masked = self.input.content.as_bytes().to_vec();
        mask_display(&tree, &mut masked);
        let masked = String::from_utf8(masked).expect("mask retains UTF-8 boundaries");
        self.markdown_node(&tree, &masked)
    }

    fn record_nested_display(&mut self, node: &markdown::mdast::Node) {
        use markdown::mdast::Node;
        if matches!(
            node,
            Node::Code(_) | Node::InlineCode(_) | Node::Text(_) | Node::Yaml(_) | Node::Toml(_)
        ) {
            if let Some(position) = node.position() {
                let range = position.start.offset..position.end.offset;
                self.add(
                    &self.input.content[range.clone()],
                    range,
                    "markdown-rs",
                    "display",
                    false,
                    None,
                );
            }
        } else if let Some(children) = node.children() {
            for child in children {
                self.record_nested_display(child);
            }
        }
    }

    fn markdown_node(&mut self, node: &markdown::mdast::Node, masked: &str) -> ExtractionResult {
        use markdown::mdast::Node;
        let range = node
            .position()
            .map(|position| position.start.offset..position.end.offset);
        if let Some(range) = range {
            match node {
                Node::MdxJsxFlowElement(_) | Node::MdxJsxTextElement(_) => {
                    self.javascript(
                        &format!("({})", &masked[range.clone()]),
                        range.start,
                        1,
                        "mdx-jsx",
                    )?;
                    self.record_nested_display(node);
                    return Ok(());
                }
                Node::MdxFlowExpression(_) | Node::MdxTextExpression(_) => {
                    return self.javascript(
                        &format!("[{}]", &self.input.content[range.start + 1..range.end - 1]),
                        range.start + 1,
                        1,
                        "mdx-expression",
                    );
                }
                Node::MdxjsEsm(_) => {
                    return self.javascript(
                        &self.input.content[range.clone()],
                        range.start,
                        0,
                        "mdx-esm",
                    );
                }
                Node::Html(_) => return self.html(&self.input.content[range.clone()], range.start),
                Node::Code(_)
                | Node::InlineCode(_)
                | Node::Text(_)
                | Node::Yaml(_)
                | Node::Toml(_) => {
                    self.add(
                        &self.input.content[range.clone()],
                        range,
                        "markdown-rs",
                        "display",
                        false,
                        None,
                    );
                    return Ok(());
                }
                _ => {}
            }
        }
        if let Some(children) = node.children() {
            for child in children {
                self.markdown_node(child, masked)?;
            }
        }
        Ok(())
    }
}

fn mask_display(node: &markdown::mdast::Node, source: &mut [u8]) {
    use markdown::mdast::Node;
    if matches!(
        node,
        Node::Code(_) | Node::InlineCode(_) | Node::Text(_) | Node::Yaml(_) | Node::Toml(_)
    ) {
        if let Some(position) = node.position() {
            for byte in &mut source[position.start.offset..position.end.offset] {
                if !matches!(*byte, b'\r' | b'\n') {
                    *byte = b' ';
                }
            }
        }
    } else if let Some(children) = node.children() {
        for child in children {
            mask_display(child, source);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn extract(source: &str, content: &str) -> SourceExtractionIr {
        extract_source_result(&SourceExtractionInputIr {
            source: source.into(),
            content: content.into(),
            kind: SourceExtractorKind::Auto,
            owner: Some("docs".into()),
        })
    }

    #[test]
    fn empty_and_comment_only_mdx_expressions_are_valid() {
        let result = extract(
            "a.mdx",
            "{/* explanation */}\n\n{}\n\n<div className=\"p:2px\" />",
        );
        assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
        assert_eq!(result.candidates, ["p:2px"]);
    }

    #[test]
    fn markdown_display_is_not_a_class_source() {
        let result = extract(
            "a.mdx",
            "---\nlabel: p:1px\n---\n\nProse `p:2px`.\n\n```html\n<div class=\"p:3px\" />\n```\n\n<div className=\"p:4px\">p:5px</div>\n\nexport const variants = {small: 'p:6px'}\n\n{true ? 'p:7px' : 'p:8px'}\n",
        );
        assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
        assert_eq!(result.candidates, ["p:4px", "p:6px", "p:7px", "p:8px"]);
        assert!(
            result
                .occurrences
                .iter()
                .any(|o| !o.included && o.candidate == "p:2px")
        );
        assert!(result.occurrences.iter().all(|o| o.owner == "docs"));
        assert!(
            result
                .occurrences
                .iter()
                .any(|o| !o.included && o.candidate == "p:5px")
        );
    }

    #[test]
    fn complete_urls_are_not_native_declaration_candidates() {
        let result = extract(
            "page.tsx",
            "const page = <a href=\"https://css.master.co\" className=\"future-property:future(2qu)\">Link</a>",
        );
        assert_eq!(result.candidates, ["future-property:future(2qu)"]);
        assert!(
            result
                .occurrences
                .iter()
                .any(|item| !item.included && item.reason == "url-literal")
        );
    }

    #[test]
    fn dynamic_fragments_only_keep_independently_complete_classes() {
        let result = extract(
            "a.tsx",
            "const a = `block p:${size} ${active ? 'flex' : 'grid'} hidden`; const b = 'fg-' + color; const c = 'inline ' + rest + ' p:2px';",
        );
        assert!(result.diagnostics.is_empty());
        assert_eq!(
            result.candidates,
            ["block", "hidden", "flex", "grid", "inline", "p:2px"]
        );
        assert!(!result.candidates.contains(&"fg-".into()));
    }

    #[test]
    fn invalid_js_and_mdx_do_not_fall_back_to_raw_extraction() {
        for (source, content) in [
            ("a.tsx", "const x = 'p:1px' +"),
            ("a.mdx", "<Box className={oops />"),
        ] {
            let result = extract(source, content);
            assert!(result.candidates.is_empty());
            assert_eq!(result.diagnostics[0].code, ErrorCode::SourceParseError);
        }
    }

    #[test]
    fn html_entity_ranges_and_unicode_refer_to_authored_utf16() {
        let content = "😀 <div class=\"p&#58;2px\"></div>";
        let result = extract("a.html", content);
        assert_eq!(result.candidates, ["p:2px"]);
        let occurrence = &result.occurrences[0];
        assert_eq!(
            occurrence.range.start,
            content[..content.find("p&#").unwrap()]
                .encode_utf16()
                .count() as u32
        );
        assert_eq!(
            occurrence.range.end - occurrence.range.start,
            "p&#58;2px".len() as u32
        );
        let mdx = extract("a.mdx", "😀\n\n<div className=\"p:2px\" />");
        assert!(mdx.diagnostics.is_empty());
        assert_eq!(mdx.candidates, ["p:2px"]);
    }
}

#[test]
fn astro_script_failures_do_not_fall_back_to_raw_source() {
    for content in [
        "---\nconst invalid =\n---\n<div class=\"p:2px\" />",
        "<script>const invalid =</script><div class=\"p:2px\" />",
        "---\nconst invalid =",
    ] {
        let result = extract_source_result(&SourceExtractionInputIr {
            source: "page.astro".into(),
            content: content.into(),
            kind: SourceExtractorKind::Auto,
            owner: None,
        });
        assert!(result.candidates.is_empty());
        assert_eq!(result.diagnostics[0].code, ErrorCode::SourceParseError);
    }
}
