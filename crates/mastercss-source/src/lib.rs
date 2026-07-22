#![forbid(unsafe_code)]

use std::collections::HashSet;
use std::path::Path;

use htmlparser::{Token, Tokenizer};
use oxc_allocator::Allocator;
use oxc_ast::ast::{
    CallExpression, Directive, ExportAllDeclaration, ExportNamedDeclaration, Expression,
    ImportDeclaration, ImportExpression, StringLiteral, TemplateLiteral,
};
use oxc_ast_visit::{Visit, walk};
use oxc_parser::Parser;
use oxc_span::SourceType;

/// Extracts unvalidated Master CSS class-like candidates from arbitrary source.
/// Validation and CSS generation intentionally remain outside this crate.
pub fn extract_class_candidates(content: &str) -> Vec<String> {
    let content = pre_exclude(content);
    let mut candidates = Vec::new();
    let mut seen = HashSet::new();
    for block in content.split_whitespace() {
        for candidate in split_by_quotation(block) {
            push_candidate(&mut candidates, &mut seen, &candidate);
        }
        for inner in peel_complete_strings(block) {
            for candidate in split_by_quotation(&inner) {
                push_candidate(&mut candidates, &mut seen, &candidate);
            }
        }
    }
    candidates
}

pub fn extract_oxc_classes(source: &str, content: &str) -> Vec<String> {
    let normalized_source = source.split('?').next().unwrap_or(source);
    let source_type = SourceType::from_path(Path::new(normalized_source))
        .unwrap_or_else(|_| SourceType::unambiguous());
    let allocator = Allocator::default();
    let parsed = Parser::new(&allocator, content, source_type).parse();
    if !parsed.diagnostics.is_empty() {
        return extract_class_candidates(content);
    }
    let mut visitor = ClassCandidateVisitor::default();
    visitor.visit_program(&parsed.program);
    visitor.candidates
}

pub fn extract_html_classes(source: &str, content: &str) -> Vec<String> {
    let lowercase = content.to_ascii_lowercase();
    let mut candidates = Vec::new();
    let mut seen = HashSet::new();
    let mut cursor = 0;
    while let Some(start) = find_script_open(&lowercase, cursor) {
        extract_html_markup_classes(&content[cursor..start], &mut candidates, &mut seen);
        let Some(relative_open_end) = content[start..].find('>') else {
            break;
        };
        let body_start = start + relative_open_end + 1;
        let Some(relative_close) = lowercase[body_start..].find("</script>") else {
            add_unique_candidates(
                &mut candidates,
                &mut seen,
                extract_oxc_classes(&format!("{source}.js"), &content[body_start..]),
            );
            cursor = content.len();
            break;
        };
        let close = body_start + relative_close;
        add_unique_candidates(
            &mut candidates,
            &mut seen,
            extract_oxc_classes(&format!("{source}.js"), &content[body_start..close]),
        );
        cursor = close + "</script>".len();
    }
    extract_html_markup_classes(&content[cursor..], &mut candidates, &mut seen);
    candidates
}

pub fn extract_astro_classes(source: &str, content: &str) -> Vec<String> {
    let (frontmatter, markup) = extract_astro_frontmatter(content);
    let mut candidates = Vec::new();
    let mut seen = HashSet::new();
    if !frontmatter.is_empty() {
        add_unique_candidates(
            &mut candidates,
            &mut seen,
            extract_oxc_classes(&format!("{source}.ts"), frontmatter),
        );
    }

    let template = remove_tag_elements(markup, "script", |script| {
        add_unique_candidates(
            &mut candidates,
            &mut seen,
            extract_oxc_classes(&format!("{source}.js"), script),
        );
    });
    let template = remove_tag_elements(&template, "style", |_| {});
    add_unique_candidates(
        &mut candidates,
        &mut seen,
        extract_class_candidates(&template),
    );
    candidates
}

fn extract_astro_frontmatter(content: &str) -> (&str, &str) {
    let Some(rest) = content.strip_prefix("---") else {
        return ("", content);
    };
    let close = rest
        .find("\n---\n")
        .map(|index| (index, "\n---\n".len()))
        .or_else(|| {
            rest.find("\r\n---\r\n")
                .map(|index| (index, "\r\n---\r\n".len()))
        });
    let Some((close, delimiter_len)) = close else {
        return ("", content);
    };
    (&rest[..close], &rest[close + delimiter_len..])
}

fn remove_tag_elements(source: &str, tag: &str, mut on_content: impl FnMut(&str)) -> String {
    let lowercase = source.to_ascii_lowercase();
    let open = format!("<{tag}");
    let close = format!("</{tag}>");
    let mut output = String::with_capacity(source.len());
    let mut cursor = 0;
    while let Some(relative_start) = lowercase[cursor..].find(&open) {
        let start = cursor + relative_start;
        let boundary = lowercase[start + open.len()..].chars().next();
        if boundary.is_some_and(|character| !character.is_whitespace() && character != '>') {
            output.push_str(&source[cursor..start + open.len()]);
            cursor = start + open.len();
            continue;
        }
        let Some(relative_open_end) = source[start..].find('>') else {
            break;
        };
        let body_start = start + relative_open_end + 1;
        let Some(relative_close) = lowercase[body_start..].find(&close) else {
            break;
        };
        let body_end = body_start + relative_close;
        output.push_str(&source[cursor..start]);
        on_content(&source[body_start..body_end]);
        cursor = body_end + close.len();
    }
    output.push_str(&source[cursor..]);
    output
}

fn find_script_open(lowercase: &str, mut cursor: usize) -> Option<usize> {
    while let Some(relative) = lowercase[cursor..].find("<script") {
        let start = cursor + relative;
        let boundary = lowercase[start + "<script".len()..].chars().next();
        if boundary.is_none_or(|character| character.is_whitespace() || character == '>') {
            return Some(start);
        }
        cursor = start + "<script".len();
    }
    None
}

fn extract_html_markup_classes(
    markup: &str,
    candidates: &mut Vec<String>,
    seen: &mut HashSet<String>,
) {
    for token in Tokenizer::from(markup).flatten() {
        if let Token::Attribute {
            prefix,
            local,
            value: Some(value),
            ..
        } = token
            && prefix.as_str().is_empty()
            && local.as_str().eq_ignore_ascii_case("class")
        {
            add_unique_candidates(candidates, seen, extract_class_candidates(value.as_str()));
        }
    }
}

fn add_unique_candidates(
    target: &mut Vec<String>,
    seen: &mut HashSet<String>,
    source: impl IntoIterator<Item = String>,
) {
    for candidate in source {
        if seen.insert(candidate.clone()) {
            target.push(candidate);
        }
    }
}

#[derive(Default)]
struct ClassCandidateVisitor {
    candidates: Vec<String>,
    seen: HashSet<String>,
}

impl ClassCandidateVisitor {
    fn add_class_string(&mut self, value: &str) {
        for candidate in extract_class_candidates(value) {
            if self.seen.insert(candidate.clone()) {
                self.candidates.push(candidate);
            }
        }
    }
}

impl<'a> Visit<'a> for ClassCandidateVisitor {
    fn visit_string_literal(&mut self, literal: &StringLiteral<'a>) {
        self.add_class_string(literal.value.as_str());
    }

    fn visit_template_literal(&mut self, literal: &TemplateLiteral<'a>) {
        if literal.expressions.is_empty()
            && literal.quasis.len() == 1
            && let Some(element) = literal.quasis.first()
        {
            self.add_class_string(
                element
                    .value
                    .cooked
                    .as_ref()
                    .unwrap_or(&element.value.raw)
                    .as_str(),
            );
        } else {
            walk::walk_template_literal(self, literal);
        }
    }

    fn visit_directive(&mut self, _directive: &Directive<'a>) {}

    fn visit_import_declaration(&mut self, _declaration: &ImportDeclaration<'a>) {}

    fn visit_import_expression(&mut self, _expression: &ImportExpression<'a>) {}

    fn visit_export_all_declaration(&mut self, _declaration: &ExportAllDeclaration<'a>) {}

    fn visit_export_named_declaration(&mut self, declaration: &ExportNamedDeclaration<'a>) {
        if declaration.source.is_none() {
            walk::walk_export_named_declaration(self, declaration);
        }
    }

    fn visit_call_expression(&mut self, expression: &CallExpression<'a>) {
        if matches!(
            &expression.callee,
            Expression::Identifier(identifier) if identifier.name == "require"
        ) {
            return;
        }
        walk::walk_call_expression(self, expression);
    }
}

fn push_candidate(candidates: &mut Vec<String>, seen: &mut HashSet<String>, source: &str) {
    let candidate = trim_candidate(source);
    if candidate.is_empty() || should_exclude(&candidate) || !seen.insert(candidate.clone()) {
        return;
    }
    candidates.push(candidate);
}

fn pre_exclude(content: &str) -> String {
    let without_blocks = remove_delimited(content, "/*", "*/");
    let without_html_comments = remove_delimited(&without_blocks, "<!--", "-->");
    let without_styles = remove_style_elements(&without_html_comments);
    without_styles
        .lines()
        .map(|line| {
            let trimmed = line.trim_start();
            if trimmed.starts_with("import ")
                || trimmed.starts_with("export ") && trimmed.contains(" from ")
                || trimmed.contains("require(")
                || trimmed.contains("import(")
            {
                String::new()
            } else {
                strip_line_comment(line).to_owned()
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn remove_delimited(source: &str, open: &str, close: &str) -> String {
    let mut output = String::with_capacity(source.len());
    let mut rest = source;
    while let Some(start) = rest.find(open) {
        output.push_str(&rest[..start]);
        let after_open = &rest[start + open.len()..];
        let Some(end) = after_open.find(close) else {
            return output;
        };
        rest = &after_open[end + close.len()..];
    }
    output.push_str(rest);
    output
}

fn remove_style_elements(source: &str) -> String {
    let lowercase = source.to_ascii_lowercase();
    let mut output = String::with_capacity(source.len());
    let mut index = 0;
    while let Some(relative_start) = lowercase[index..].find("<style") {
        let start = index + relative_start;
        output.push_str(&source[index..start]);
        let Some(relative_end) = lowercase[start..].find("</style>") else {
            return output;
        };
        index = start + relative_end + "</style>".len();
    }
    output.push_str(&source[index..]);
    output
}

fn strip_line_comment(line: &str) -> &str {
    let mut quote = None;
    let mut escaped = false;
    let characters = line.char_indices().collect::<Vec<_>>();
    for (position, (index, character)) in characters.iter().copied().enumerate() {
        if escaped {
            escaped = false;
            continue;
        }
        if character == '\\' {
            escaped = true;
            continue;
        }
        if let Some(current) = quote {
            if character == current {
                quote = None;
            }
            continue;
        }
        if matches!(character, '\'' | '"' | '`') {
            quote = Some(character);
        } else if character == '/'
            && characters
                .get(position + 1)
                .is_some_and(|(_, next)| *next == '/')
        {
            return &line[..index];
        }
    }
    line
}

fn split_by_quotation(source: &str) -> Vec<String> {
    let protected = protect_complete_strings(source);
    let mut result = Vec::new();
    for part in protected.text.split(['\'', '"', '`']) {
        let restored = restore_complete_strings(part, &protected.strings);
        if !restored.is_empty() {
            result.push(restored);
        }
    }
    result
}

fn peel_complete_strings(source: &str) -> Vec<String> {
    let mut result = Vec::new();
    let mut pending = vec![source.to_owned()];
    while let Some(current) = pending.pop() {
        for range in complete_string_ranges(&current) {
            let quoted = &current[range.0..range.1];
            let quote_len = quoted.chars().next().map_or(0, char::len_utf8);
            if quoted.len() < quote_len * 2 {
                continue;
            }
            let inner = quoted[quote_len..quoted.len() - quote_len].to_owned();
            if !result.contains(&inner) {
                pending.push(inner.clone());
                result.push(inner);
            }
        }
    }
    result
}

struct ProtectedStrings {
    text: String,
    strings: Vec<String>,
}

fn protect_complete_strings(source: &str) -> ProtectedStrings {
    let ranges = complete_string_ranges(source);
    let mut text = String::with_capacity(source.len());
    let mut strings = Vec::with_capacity(ranges.len());
    let mut index = 0;
    for (start, end) in ranges {
        text.push_str(&source[index..start]);
        let id = strings.len();
        strings.push(source[start..end].to_owned());
        text.push_str(&format!("COMPLETE-STRING--{id}--"));
        index = end;
    }
    text.push_str(&source[index..]);
    ProtectedStrings { text, strings }
}

fn restore_complete_strings(source: &str, strings: &[String]) -> String {
    let mut output = source.to_owned();
    for (index, value) in strings.iter().enumerate() {
        output = output.replace(&format!("COMPLETE-STRING--{index}--"), value);
    }
    output
}

fn complete_string_ranges(source: &str) -> Vec<(usize, usize)> {
    let characters = source.char_indices().collect::<Vec<_>>();
    let mut ranges = Vec::new();
    let mut position = 0;
    while position < characters.len() {
        let (start, quote) = characters[position];
        if !matches!(quote, '\'' | '"' | '`') {
            position += 1;
            continue;
        }
        let mut end_position = position + 1;
        let mut escaped = false;
        let mut found = None;
        while end_position < characters.len() {
            let (end, character) = characters[end_position];
            if escaped {
                escaped = false;
            } else if character == '\\' {
                escaped = true;
            } else if character == quote {
                found = Some((end + character.len_utf8(), end_position + 1));
                break;
            }
            end_position += 1;
        }
        if let Some((end, next_position)) = found {
            ranges.push((start, end));
            position = next_position;
        } else {
            position += 1;
        }
    }
    ranges
}

fn trim_candidate(source: &str) -> String {
    let mut candidate = source.to_owned();
    loop {
        let before = candidate.clone();
        if let Some(equal) = candidate.find('=') {
            let prefix = &candidate[..equal];
            if !prefix.contains([':', '@', '~', '(']) && !prefix.ends_with('@') {
                candidate = candidate[equal + 1..].to_owned();
            }
        }
        candidate = candidate
            .trim_end_matches(|character| {
                matches!(character, '(' | '[' | '{' | '\\' | ':' | '#' | '=' | '.')
            })
            .to_owned();
        if candidate == before || candidate.is_empty() {
            return candidate;
        }
    }
}

fn should_exclude(candidate: &str) -> bool {
    if !balanced_brackets(candidate) {
        return true;
    }
    if let Some(body) = candidate
        .strip_prefix('{')
        .and_then(|value| value.strip_suffix('}'))
    {
        return body.split(';').any(should_exclude);
    }
    if candidate.starts_with("${") && candidate.ends_with('}') {
        return false;
    }
    if candidate.starts_with('$')
        || candidate.ends_with(';')
        || candidate.contains("</")
        || candidate.contains('<')
        || candidate.contains('>')
        || candidate.contains("{{")
        || candidate.contains("**")
        || candidate.starts_with("http://")
        || candidate.starts_with("https://")
        || candidate.starts_with("~/")
        || candidate.starts_with("./")
        || candidate.starts_with("../")
    {
        return true;
    }
    candidate.chars().next().is_none_or(|character| {
        !(character.is_alphanumeric() || matches!(character, '-' | '_' | '{'))
    })
}

fn balanced_brackets(source: &str) -> bool {
    let mut stack = Vec::new();
    let mut quote = None;
    let mut escaped = false;
    for character in source.chars() {
        if escaped {
            escaped = false;
            continue;
        }
        if character == '\\' {
            escaped = true;
            continue;
        }
        if let Some(current) = quote {
            if character == current {
                quote = None;
            }
            continue;
        }
        if matches!(character, '\'' | '"' | '`') {
            quote = Some(character);
        } else if matches!(character, '(' | '[' | '{') {
            stack.push(character);
        } else if matches!(character, ')' | ']' | '}') {
            let Some(open) = stack.pop() else {
                return false;
            };
            if !matches!((open, character), ('(', ')') | ('[', ']') | ('{', '}')) {
                return false;
            }
        }
    }
    stack.is_empty()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_mixed_source_candidates_in_insertion_order() {
        let source = r#"
            import styles from './style.css'
            const cls = "fg:red hover:bg:blue"
            const nested = { class: 'content:"a;b" bg:url("/logo.png")' }
        "#;
        assert_eq!(
            extract_class_candidates(source),
            vec![
                "const",
                "cls",
                "fg:red",
                "hover:bg:blue",
                "nested",
                "class",
                "content:\"a;b\"",
                "a;b",
                "bg:url(\"/logo.png\")",
            ]
        );
    }

    #[test]
    fn keeps_groups_and_interpolation_candidates() {
        assert_eq!(
            extract_class_candidates(r#"<div class="{fg:red;bg:blue}" data-id="${id}"></div>"#),
            vec!["{fg:red;bg:blue}", "${id}"]
        );
    }

    #[test]
    fn keeps_native_custom_properties_but_not_legacy_assignments() {
        assert_eq!(
            extract_class_candidates(r#"<div class="--token:1rem $token:1rem"></div>"#),
            vec!["--token:1rem"]
        );
    }

    #[test]
    fn extracts_static_javascript_and_typescript_strings_with_oxc() {
        let source = r#"
            const classes = 'block mx:auto'
            const active = clsx('fg:red', { 'p:4x': ok })
            element.classList.add('flex')
            export function App() {
                return <div className="hidden m:2x" />
            }
        "#;
        assert_eq!(
            extract_oxc_classes("component.tsx", source),
            vec![
                "block", "mx:auto", "fg:red", "p:4x", "flex", "hidden", "m:2x"
            ]
        );
    }

    #[test]
    fn ignores_module_specifiers_require_imports_and_directives_with_oxc() {
        let source = r#"
            'use client'
            import React from 'react'
            export { helper } from 'pkg'
            async function load() { await import('lazy-module') }
            const fs = require('fs')
            const classes = 'block fg:red'
        "#;
        assert_eq!(
            extract_oxc_classes("component.tsx", source),
            vec!["block", "fg:red"]
        );
    }

    #[test]
    fn extracts_html_class_attributes_and_delegates_scripts_to_oxc() {
        let source = r#"
            <div class="block mx:auto"></div>
            <script>
                element.classList.add('fg:red', 'p:4x')
                const classes = 'flex hidden'
            </script>
            <main class="grid"></main>
        "#;
        assert_eq!(
            extract_html_classes("index.html", source),
            vec![
                "block", "mx:auto", "fg:red", "p:4x", "flex", "hidden", "grid"
            ]
        );
    }

    #[test]
    fn extracts_astro_frontmatter_scripts_and_markup_but_not_styles() {
        let classes = extract_astro_classes(
            "Page.astro",
            "---\nconst frontmatterClasses = 'fg:red'\n---\n<script>const scriptClasses = 'p:4x'</script><style>.ignored { color: red; }</style><main class=\"block mx:auto\">Hello</main>",
        );
        assert_eq!(classes, ["fg:red", "p:4x", "block", "mx:auto"]);
    }
}
