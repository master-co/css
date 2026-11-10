use super::*;
use mastercss_lexer::Utf16Index;
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
    crate::with_source_stack(input.content.len(), || extract(input))
}

fn extract(input: &SourceExtractionInputIr) -> SourceExtractionIr {
    let mut output = SourceExtractionIr {
        source: input.source.clone(),
        candidates: Vec::new(),
        occurrences: Vec::new(),
        diagnostics: Vec::new(),
    };
    let offsets = Utf16Index::new(&input.content);
    let mut collector = Collector {
        input,
        offsets: &offsets,
        output: &mut output,
        seen: HashSet::new(),
    };
    let path = input.source.split('?').next().unwrap_or(&input.source);
    let extension = Path::new(path)
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();
    // Single-file components: script blocks are JavaScript, not template text.
    let component =
        input.kind == SourceExtractorKind::Auto && matches!(extension.as_str(), "svelte" | "vue");
    let kind = if input.kind == SourceExtractorKind::Auto {
        match extension.as_str() {
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
        _ if component => collector.component(&extension),
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
        output.diagnostics.push(Diagnostic { code: ErrorCode::SourceParseError, phase: DiagnosticPhase::Compiler, severity: DiagnosticSeverity::Error, message, source: Some(input.source.clone()), range: Some(utf16_range(&offsets, range)), notes: vec!["Previous successful source contributions must be retained; use kind: 'raw' only for deliberate text extraction.".into()] });
    }
    output
}

impl Collector<'_> {
    /// Svelte and Vue components: each JavaScript block through Oxc like a module (or as
    /// text when it does not parse), styles skipped, and the template, whose syntax is not
    /// HTML, as text.
    fn component(&mut self, extension: &str) -> ExtractionResult {
        let input = self.input;
        let content = input.content.as_str();
        let mut cursor = 0;
        use crate::component_blocks::{ScriptLanguage, Template};
        let template = if extension == "vue" {
            Template::Vue
        } else {
            Template::Svelte
        };
        for block in crate::component_blocks::blocks(content, template) {
            self.template_text(cursor..block.range.start);
            if let Some((body, language)) = block.script {
                let source_type = match language {
                    ScriptLanguage::JavaScript => SourceType::mjs(),
                    ScriptLanguage::TypeScript => SourceType::ts(),
                    ScriptLanguage::Jsx => SourceType::jsx(),
                    ScriptLanguage::Tsx => SourceType::tsx(),
                };
                let parsed = self.javascript_as(
                    &content[body.clone()],
                    body.start,
                    0,
                    if extension == "vue" {
                        "vue-script"
                    } else {
                        "svelte-script"
                    },
                    Some(source_type),
                );
                // The framework compiler reports its own script errors. Read a script that
                // does not parse as text, as before script blocks were parsed, instead of
                // failing the build over a block this reader may have cut wrongly.
                if parsed.is_err() {
                    self.template_text(body);
                }
            }
            cursor = block.range.end;
        }
        self.template_text(cursor..content.len());
        Ok(())
    }

    fn template_text(&mut self, range: Range<usize>) {
        if range.is_empty() {
            return;
        }
        let input = self.input;
        self.add(
            &input.content[range.clone()],
            range,
            "raw",
            "template",
            true,
            None,
        );
    }

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
        self.html_parts(markup, offset, html_class_values::astro_parts(markup))?;
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
    offsets: &'a Utf16Index,
    output: &'a mut SourceExtractionIr,
    seen: HashSet<String>,
}

fn utf16_range(offsets: &Utf16Index, range: Range<usize>) -> SourceRange {
    SourceRange {
        start: offsets
            .byte_to_utf16(range.start)
            .expect("source range start is a character boundary"),
        end: offsets
            .byte_to_utf16(range.end)
            .expect("source range end is a character boundary"),
    }
}

/// The most candidate matches one extracted block may scan. Past it, its candidates
/// report the whole expression, so a block of many overlapping candidates such as
/// `a aa aaa …` cannot multiply its occurrences.
const MAX_BLOCK_MATCHES: usize = 1 << 18;

/// The non-overlapping matches of each candidate in `text`, as `str::match_indices`
/// finds them, from one pass over the text instead of one per candidate.
fn candidate_matches(text: &str, candidates: &[String]) -> Vec<Vec<Range<usize>>> {
    let mut matches = vec![Vec::new(); candidates.len()];
    // An empty pattern would match inside UTF-8 sequences; candidates are never empty.
    if candidates.iter().any(String::is_empty) {
        return matches;
    }
    let Ok(automaton) = aho_corasick::AhoCorasick::new(candidates) else {
        return matches;
    };
    for (found, matched) in automaton.find_overlapping_iter(text).enumerate() {
        if found >= MAX_BLOCK_MATCHES {
            return vec![Vec::new(); candidates.len()];
        }
        let ranges: &mut Vec<Range<usize>> = &mut matches[matched.pattern().as_usize()];
        // Overlapping matches of one candidate arrive in order; keep the leftmost
        // non-overlapping ones, as a per-candidate search does.
        if ranges.last().is_none_or(|last| matched.start() >= last.end) {
            ranges.push(matched.range());
        }
    }
    matches
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
        let context_range = utf16_range(self.offsets, range.clone());
        let candidates = candidates.unwrap_or_else(|| extract_class_candidates(value));
        // Only an unchanged value has token ranges; others report the expression.
        let mut matches = if original == value {
            candidate_matches(original, &candidates)
        } else {
            vec![Vec::new(); candidates.len()]
        };
        for (candidate, matches) in candidates.into_iter().zip(matches.iter_mut()) {
            let url = source_url_literal(&candidate);
            let included = included && !url;
            let precise = !matches.is_empty();
            for matched in if precise {
                std::mem::take(matches)
                    .into_iter()
                    .map(|matched| range.start + matched.start..range.start + matched.end)
                    .collect()
            } else {
                vec![range.clone()]
            } {
                self.output.occurrences.push(SourceOccurrenceIr {
                    candidate: candidate.clone(),
                    source: self.input.source.clone(),
                    range: utf16_range(self.offsets, matched),
                    context_range: context_range.clone(),
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
        self.javascript_as(source, offset, prefix, content_kind, None)
    }

    fn javascript_as(
        &mut self,
        source: &str,
        offset: usize,
        prefix: usize,
        content_kind: &str,
        source_type: Option<SourceType>,
    ) -> ExtractionResult {
        let allocator = Allocator::default();
        let source_type = if let Some(source_type) = source_type {
            source_type
        } else if prefix == 0 && content_kind == "javascript" {
            SourceType::from_path(&self.input.source).unwrap_or(SourceType::tsx())
        } else if content_kind == "astro-frontmatter" {
            SourceType::ts()
        } else {
            SourceType::tsx()
        };
        // Astro frontmatter may end the component early, e.g. `return Astro.redirect(url)`.
        let options = oxc_parser::ParseOptions {
            allow_return_outside_function: content_kind == "astro-frontmatter",
            ..Default::default()
        };
        let parsed = Parser::new(&allocator, source, source_type)
            .with_options(options)
            .parse();
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
                let candidates = crate::literal_class_candidates(&value);
                self.add(
                    &value,
                    start..end,
                    "oxc",
                    content_kind,
                    true,
                    Some(candidates),
                );
            }
        }
        Ok(())
    }

    fn html_attribute(&mut self, raw: &str, start: usize) {
        let decoded = decode_html_attribute(raw);
        let context_range = utf16_range(self.offsets, start..start + raw.len());
        let base = context_range.start;
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
                    context_range: context_range.clone(),
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
        self.html_parts(source, offset, html_class_values::parts(source))
    }

    fn html_parts(
        &mut self,
        source: &str,
        offset: usize,
        parts: Vec<html_class_values::Part<'_>>,
    ) -> ExtractionResult {
        for part in parts {
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

    #[test]
    fn candidate_matches_equal_a_search_per_candidate() {
        let text = "aaaa aa:hover a:a:a aa a:hover 中a:hover文 aaaaa";
        let candidates = [
            "a", "aa", "aaa", "a:a", "a:hover", "aa:hover", "missing", "aa",
        ]
        .map(String::from);
        let matches = candidate_matches(text, &candidates);
        for (candidate, matches) in candidates.iter().zip(matches) {
            let expected = text
                .match_indices(candidate.as_str())
                .map(|(start, _)| start..start + candidate.len())
                .collect::<Vec<_>>();
            assert_eq!(matches, expected, "{candidate}");
        }
    }

    fn extract(source: &str, content: &str) -> SourceExtractionIr {
        extract_source_result(&SourceExtractionInputIr {
            source: source.into(),
            content: content.into(),
            kind: SourceExtractorKind::Auto,
            owner: Some("docs".into()),
        })
    }

    #[test]
    fn valueless_class_attributes_preserve_source_offsets() {
        for content in [
            "<div class></div><p class=\"block\">中文</p>",
            "中文<div class hidden></div><p class='block'></p>",
            "<div class=\"\"></div><p class='block'></p>",
            "<div class=></div><p class='block'></p>",
        ] {
            for source in ["a.html", "a.astro"] {
                let result = extract(source, content);
                assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
                assert!(
                    result
                        .candidates
                        .iter()
                        .any(|candidate| candidate == "block")
                );
                let occurrence = result
                    .occurrences
                    .iter()
                    .find(|entry| entry.candidate == "block" && entry.extractor == "html")
                    .unwrap();
                let start = content[..content.find("block").unwrap()]
                    .encode_utf16()
                    .count() as u32;
                assert_eq!(
                    occurrence.range,
                    SourceRange {
                        start,
                        end: start + 5
                    }
                );
            }
        }
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
    fn deeply_nested_sources_do_not_overflow_the_caller_stack() {
        let depth = 20_000;
        let sources = [
            (
                "a.js",
                format!("x={}'block'{}", "[".repeat(depth), "]".repeat(depth)),
            ),
            ("a.js", format!("x={}'block'", "a=>".repeat(depth))),
            ("a.js", format!("x={}'block'", "a?b:".repeat(depth))),
            (
                "a.tsx",
                format!("x={}{}", "<a>".repeat(depth), "</a>".repeat(depth)),
            ),
            (
                "a.ts",
                format!("let x:{}B{}='block'", "A<".repeat(depth), ">".repeat(depth)),
            ),
            ("a.md", ">".repeat(depth)),
        ];
        // An ordinary caller stack, far smaller than these sources would need.
        std::thread::Builder::new()
            .stack_size(1 << 20)
            .spawn(move || {
                for (source, content) in &sources {
                    extract(source, content);
                    crate::extract_oxc_classes(source, content);
                }
            })
            .unwrap()
            .join()
            .unwrap();
    }

    #[test]
    fn component_scripts_are_javascript_not_template_text() {
        let svelte = r#"<script lang="ts">
  const count = hidden.length, active = grid.current
  const tone: string = open ? 'block' : 'inline'
  const sum = a.block+b
</script>
<div class="hidden p-md">{count}</div>
<style>.card > .title { color: red }</style>
<script type="application/ld+json">{"@context": "https://schema.org"}</script>
"#;
        let result = extract("Card.svelte", svelte);
        assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
        for candidate in ["block", "inline", "hidden", "p-md"] {
            assert!(
                result.candidates.iter().any(|c| c == candidate),
                "{candidate}: {:?}",
                result.candidates
            );
        }
        for candidate in [
            "hidden.length,",
            "grid.current",
            "a.block+b",
            ".card",
            "color:",
        ] {
            assert!(
                !result.candidates.iter().any(|c| c == candidate),
                "{candidate}: {:?}",
                result.candidates
            );
        }
        let block = result
            .occurrences
            .iter()
            .find(|occurrence| occurrence.candidate == "block")
            .unwrap();
        assert_eq!(block.extractor, "oxc");
        assert_eq!(
            &svelte[block.range.start as usize..block.range.end as usize],
            "block"
        );

        let vue = r#"<template>
  <div class="flex" :class="{ active: isActive }"></div>
</template>
<script setup lang="ts">
const props = defineProps<{ size: string }>()
const width = grid.current + 'px'
const tone = 'fg-red'
</script>
"#;
        let result = extract("Card.vue", vue);
        assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
        assert!(result.candidates.iter().any(|c| c == "flex"));
        assert!(result.candidates.iter().any(|c| c == "fg-red"));
        assert!(!result.candidates.iter().any(|c| c == "grid.current"));
        assert!(!result.candidates.iter().any(|c| c == "defineProps<{"));

        // A script that does not parse is read as text; the framework reports the error.
        let result = extract("Broken.svelte", "<script>const x = 'p:1px' +</script>");
        assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
        assert!(result.candidates.iter().any(|c| c == "p:1px"));
    }

    #[test]
    fn component_script_tags_in_template_expressions_are_text() {
        let svelte = r#"<script lang="ts">
  const x = "a";
</script>
<div class="mb-lg">{@html '<script>' + x + '</scr' + 'ipt>'}</div>
<p title="<script>" class="mt-xl">{`<script>${x}`}</p>
<button onclick={() => count > 1 && go('<script>')} class="p-md">{x}</button>
<!-- <script> -->
<span class="hidden">好辦 { { a: '}', b: "中文" }.a } 中文</span>
<script context="module">export const tone = 'fg-red'</script>
"#;
        let result = extract("Page.svelte", svelte);
        assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
        for candidate in ["mb-lg", "mt-xl", "p-md", "hidden", "fg-red"] {
            assert!(
                result.candidates.iter().any(|c| c == candidate),
                "{candidate}: {:?}",
                result.candidates
            );
        }
        let tone = result
            .occurrences
            .iter()
            .find(|occurrence| occurrence.candidate == "fg-red")
            .unwrap();
        assert_eq!(tone.extractor, "oxc");

        let vue = r#"<template>
  <div class="mb-lg" :title="'<script>'">中文 {{ '<script>' + x }} 中文</div>
</template>
<script setup lang="ts">
const tone = 'fg-red'
</script>
"#;
        let result = extract("Card.vue", vue);
        assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
        assert!(result.candidates.iter().any(|c| c == "mb-lg"));
        let tone = result
            .occurrences
            .iter()
            .find(|occurrence| occurrence.candidate == "fg-red")
            .unwrap();
        assert_eq!(tone.extractor, "oxc");
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

#[test]
fn astro_frontmatter_may_return_early() {
    let result = extract_source_result(&SourceExtractionInputIr {
        source: "page.astro".into(),
        content: "---\nif (Astro.props.moved) return Astro.redirect('/next')\nconst size = 'p:1px'\n---\n<div class=\"p:2px\" />".into(),
        kind: SourceExtractorKind::Auto,
        owner: None,
    });
    assert!(result.diagnostics.is_empty(), "{:?}", result.diagnostics);
    assert_eq!(result.candidates, ["p:1px", "p:2px"]);
}
