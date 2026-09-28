//! Native theme trees are preserved in author order. Token liveness filters
//! declarations, never selector branches; CSS computes the active scoped value.
use super::{
    CompilerError, CssDirectiveManifestInput, CssRule, ParserOptions, StyleSheet, ThemeAtRule,
    directive_error, minified_css,
};
use mastercss_schema::ThemeNode;

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
        directive_error(
            source,
            filename,
            rule.start_byte,
            "@theme requires a block with explicit selectors",
        )
    })?;
    let sheet = StyleSheet::parse(
        body,
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
            format!("@theme requires explicit selectors: {error}"),
        )
    })?;
    let context = ThemeContext {
        source,
        filename,
        body,
        offset: rule.body_start_byte.unwrap_or(rule.start_byte),
    };
    input
        .theme
        .get_or_insert_default()
        .extend(context.rules(sheet.rules.0, false)?);
    Ok(())
}

struct ThemeContext<'a> {
    source: &'a str,
    filename: &'a str,
    body: &'a str,
    offset: usize,
}

impl ThemeContext<'_> {
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
    ) -> Result<Vec<ThemeNode>, CompilerError> {
        if rules.is_empty() {
            return Ok(Vec::new());
        }
        let index = crate::source_index::SourceIndex::new(self.body);
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
                    children.extend(self.rules(style.rules.0, true)?);
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
                    self.rules(rule.rules.0, has_selector)?,
                ),
                CssRule::Supports(rule) => (
                    format!(
                        "@supports {}",
                        minified_css(&rule.condition, self.filename)?
                    ),
                    self.rules(rule.rules.0, has_selector)?,
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
                        self.rules(rule.rules.0, has_selector)?,
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
                    (prelude, self.rules(rule.rules.0, has_selector)?)
                }
                CssRule::StartingStyle(rule) => (
                    "@starting-style".into(),
                    self.rules(rule.rules.0, has_selector)?,
                ),
                _ => {
                    return Err(directive_error(
                        self.source,
                        self.filename,
                        self.offset,
                        "@theme only accepts native selectors, @media, @supports, @container, @scope and @starting-style; keyframes belong in ordinary CSS",
                    ));
                }
            };
            output.push(ThemeNode::Rule { prelude, children });
        }
        Ok(output)
    }
}
