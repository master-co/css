//! Native theme trees are preserved in author order. Token liveness filters
//! declarations, never selector branches; CSS computes the active scoped value.
use super::{
    CompilerError, CssDirectiveManifestInput, CssRule, ParserOptions, StyleSheet, ThemeAtRule,
    directive_error, minified_css,
};
use mastercss_schema::ThemeNode;

type LocatedThemeNodes = (usize, Vec<ThemeNode>);

pub(crate) fn lower_theme_rule(
    source: &str,
    filename: &str,
    rule: ThemeAtRule,
    input: &mut CssDirectiveManifestInput,
) -> Result<(), CompilerError> {
    if !rule.prelude.parts.is_empty() {
        return Err(directive_error(
            source,
            filename,
            rule.start_byte,
            "@theme does not accept modes, inline or static; use explicit native selectors and conditions",
        ));
    }
    let body = rule.body.as_deref().ok_or_else(|| {
        directive_error(source, filename, rule.start_byte, "@theme requires a block")
    })?;
    let context = ThemeContext {
        source,
        filename,
        body,
        offset: rule.body_start_byte.unwrap_or(rule.start_byte),
    };
    let (native_body, mut ordered) = context.defaults()?;
    let sheet = StyleSheet::parse(
        &native_body,
        ParserOptions {
            filename: filename.into(),
            ..ParserOptions::default()
        },
    )
    .map_err(|error| {
        directive_error(
            source,
            filename,
            rule.start_byte,
            format!("Invalid @theme body: {error}"),
        )
    })?;
    // Parser columns belong to the masked text. It preserves byte offsets, but
    // replacing non-ASCII declarations changes the corresponding UTF-16 columns.
    let index = crate::source_index::SourceIndex::new(&native_body);
    for child in sheet.rules.0 {
        if let CssRule::Keyframes(keyframe) = child {
            let start = index
                .byte_offset_for_location(keyframe.loc.line, keyframe.loc.column)
                .unwrap_or_default();
            let open = crate::pattern::css_statement_delimiter(body, start, body.len())
                .map(|(open, _)| open)
                .ok_or_else(|| {
                    directive_error(
                        source,
                        filename,
                        context.offset + start,
                        "Invalid keyframes block",
                    )
                })?;
            let end = super::css_block_end(body, open, body.len()).ok_or_else(|| {
                directive_error(
                    source,
                    filename,
                    context.offset + start,
                    "Unclosed keyframes block",
                )
            })?;
            let text = body[start..=end].to_owned();
            for token in mastercss_lexer::tokenize_css_syntax(&text) {
                if let mastercss_lexer::CssSyntaxKind::AtKeyword(name) = token.kind
                    && (token.bytes.start != 0 || !name.eq_ignore_ascii_case("keyframes"))
                {
                    return Err(directive_error(
                        source,
                        filename,
                        context.offset + start + token.bytes.start,
                        "Managed keyframes require native frame declarations; nested directives and vendor keyframes are unsupported",
                    ));
                }
            }
            let name = match keyframe.name {
                lightningcss::rules::keyframes::KeyframesName::Ident(name) => name.0.to_string(),
                lightningcss::rules::keyframes::KeyframesName::Custom(name) => name.to_string(),
            };
            let dependencies = mastercss_lexer::collect_css_variable_references(&text);
            input
                .keyframes
                .get_or_insert_default()
                .push(mastercss_schema::KeyframeDefinition {
                    name,
                    text,
                    dependencies,
                    source: crate::source_index::SourceIndex::new(source).reference(
                        filename,
                        context.offset + start,
                        context.offset + end + 1,
                    ),
                });
        } else {
            let loc = match &child {
                CssRule::Style(rule) => rule.loc,
                CssRule::Media(rule) => rule.loc,
                CssRule::Supports(rule) => rule.loc,
                CssRule::Container(rule) => rule.loc,
                CssRule::Scope(rule) => rule.loc,
                CssRule::StartingStyle(rule) => rule.loc,
                _ => {
                    // Reuse the strict theme diagnostic for unsupported rules.
                    context.rules(vec![child], false, &index)?;
                    continue;
                }
            };
            let start = index
                .byte_offset_for_location(loc.line, loc.column)
                .unwrap_or_default();
            ordered.push((start, context.rules(vec![child], false, &index)?));
        }
    }
    ordered.sort_by_key(|(start, _)| *start);
    input
        .theme
        .get_or_insert_default()
        .extend(ordered.into_iter().flat_map(|(_, nodes)| nodes));
    Ok(())
}

struct ThemeContext<'a> {
    source: &'a str,
    filename: &'a str,
    body: &'a str,
    offset: usize,
}

impl ThemeContext<'_> {
    /// Mask only direct declarations so native rules retain their original byte
    /// locations. Each consecutive declaration run gets its own default scope.
    fn defaults(&self) -> Result<(String, Vec<LocatedThemeNodes>), CompilerError> {
        use mastercss_lexer::{collect_css_syntax_statements, tokenize_css_syntax};
        let wrapped = format!("x{{{}}}", self.body);
        let tokens = tokenize_css_syntax(&wrapped);
        let statements = collect_css_syntax_statements(&tokens);
        let mut children = statements
            .iter()
            .filter(|statement| statement.parent == Some(0))
            .collect::<Vec<_>>();
        children.sort_by_key(|statement| statement.tokens.start);
        let mut runs: Vec<std::ops::Range<usize>> = Vec::new();
        let mut adjacent = false;
        for statement in children {
            if !statement.declaration {
                adjacent = false;
                continue;
            }
            let start = tokens[statement.tokens.start].bytes.start - 2;
            let end = tokens
                .get(statement.tokens.end)
                .filter(|token| token.kind == mastercss_lexer::CssSyntaxKind::Delim(';'))
                .map_or_else(
                    || tokens[statement.tokens.end - 1].bytes.end,
                    |token| token.bytes.end,
                )
                - 2;
            if adjacent {
                runs.last_mut().expect("declaration run").end = end;
            } else {
                runs.push(start..end);
            }
            adjacent = true;
        }
        let mut masked = self.body.as_bytes().to_vec();
        let mut nodes = Vec::new();
        for range in runs {
            let block = super::DeclarationBlock::parse_string(
                &self.body[range.clone()],
                ParserOptions::default(),
            )
            .map_err(|error| {
                directive_error(
                    self.source,
                    self.filename,
                    self.offset + range.start,
                    format!("Invalid @theme declaration: {error}"),
                )
            })?;
            nodes.push((
                range.start,
                vec![ThemeNode::Rule {
                    prelude: ":root,:host".into(),
                    children: self.declarations(&block, range.start, true)?,
                }],
            ));
            for byte in &mut masked[range] {
                if !matches!(*byte, b'\r' | b'\n') {
                    *byte = b' ';
                }
            }
        }
        Ok((String::from_utf8(masked).expect("masked UTF-8"), nodes))
    }

    fn declarations(
        &self,
        block: &lightningcss::declaration::DeclarationBlock<'_>,
        start: usize,
        has_selector: bool,
    ) -> Result<Vec<ThemeNode>, CompilerError> {
        let mut declarations = crate::collect_ordered_declarations(block, self.filename)?;
        crate::declarations::preserve_ordered_declaration_sequence(
            self.body,
            start,
            &mut declarations,
        );
        if !has_selector && !declarations.is_empty() {
            return Err(directive_error(
                self.source,
                self.filename,
                self.offset + start,
                "@theme declarations require an explicit selector",
            ));
        }
        declarations
            .into_iter()
            .map(|declaration| {
                let Some(name) = declaration
                    .property
                    .strip_prefix("--")
                    .filter(|name| !name.is_empty())
                else {
                    return Err(directive_error(
                        self.source,
                        self.filename,
                        self.offset + start,
                        "@theme only accepts custom-property declarations",
                    ));
                };
                let value = declaration.value.as_str().ok_or_else(|| {
                    directive_error(
                        self.source,
                        self.filename,
                        self.offset + start,
                        "Invalid theme value",
                    )
                })?;
                Ok(ThemeNode::Declaration {
                    name: name.to_owned(),
                    value: value.to_owned(),
                })
            })
            .collect()
    }

    fn rules(
        &self,
        rules: Vec<CssRule<'_>>,
        has_selector: bool,
        index: &crate::source_index::SourceIndex<'_>,
    ) -> Result<Vec<ThemeNode>, CompilerError> {
        if rules.is_empty() {
            return Ok(Vec::new());
        }
        let mut output = Vec::new();
        for rule in rules {
            let (prelude, children) = match rule {
                CssRule::Style(style) => {
                    let start = index
                        .byte_offset_for_location(style.loc.line, style.loc.column)
                        .unwrap_or_default();
                    let open =
                        crate::pattern::css_statement_delimiter(self.body, start, self.body.len())
                            .map(|(open, _)| open + 1)
                            .unwrap_or(start);
                    let mut children = self.declarations(&style.declarations, open, true)?;
                    children.extend(self.rules(style.rules.0, true, index)?);
                    (
                        crate::printed_selectors(&style.selectors.0, self.filename)?.join(","),
                        children,
                    )
                }
                CssRule::NestedDeclarations(rule) => {
                    let start = index
                        .byte_offset_for_location(rule.loc.line, rule.loc.column)
                        .unwrap_or_default();
                    output.extend(self.declarations(&rule.declarations, start, has_selector)?);
                    continue;
                }
                CssRule::Media(rule) => (
                    format!("@media {}", minified_css(&rule.query, self.filename)?),
                    self.rules(rule.rules.0, has_selector, index)?,
                ),
                CssRule::Supports(rule) => (
                    format!(
                        "@supports {}",
                        minified_css(&rule.condition, self.filename)?
                    ),
                    self.rules(rule.rules.0, has_selector, index)?,
                ),
                CssRule::Container(rule) => {
                    let mut parts = Vec::new();
                    if let Some(name) = &rule.name {
                        parts.push(minified_css(name, self.filename)?);
                    }
                    if let Some(condition) = &rule.condition {
                        parts.push(minified_css(condition, self.filename)?);
                    }
                    (
                        format!("@container {}", parts.join(" ")),
                        self.rules(rule.rules.0, has_selector, index)?,
                    )
                }
                CssRule::Scope(rule) => {
                    let mut prelude = "@scope".to_owned();
                    if let Some(start) = &rule.scope_start {
                        prelude.push_str(&format!(" ({})", minified_css(start, self.filename)?));
                    }
                    if let Some(end) = &rule.scope_end {
                        prelude.push_str(&format!(" to ({})", minified_css(end, self.filename)?));
                    }
                    (prelude, self.rules(rule.rules.0, has_selector, index)?)
                }
                CssRule::StartingStyle(rule) => (
                    "@starting-style".into(),
                    self.rules(rule.rules.0, has_selector, index)?,
                ),
                _ => {
                    return Err(directive_error(
                        self.source,
                        self.filename,
                        self.offset,
                        "@theme only accepts native selectors, @media, @supports, @container, @scope and @starting-style; managed keyframes must be direct children of @theme",
                    ));
                }
            };
            output.push(ThemeNode::Rule { prelude, children });
        }
        Ok(output)
    }
}
