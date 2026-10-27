//! Theme tokens use one default scope; modes affect delivery and generated values.
use super::{
    CompilerError, CssDirectiveManifestInput, ParserOptions, ThemeAtRule, directive_error,
};
use mastercss_schema::ThemeNode;

type LocatedThemeNodes = (usize, Vec<ThemeNode>);

pub(crate) fn lower_theme_rule(
    source: &str,
    filename: &str,
    rule: ThemeAtRule,
    input: &mut CssDirectiveManifestInput,
) -> Result<(), CompilerError> {
    let mut inline = false;
    let mut is_static = false;
    let prelude_end = rule
        .body_start_byte
        .unwrap_or(source.len())
        .min(source.len());
    let prelude_tokens =
        mastercss_lexer::tokenize_css_syntax(&source[rule.start_byte..prelude_end]);
    for (index, mode) in rule.prelude.parts.iter().enumerate() {
        let error = |message: String| {
            let token = prelude_tokens.get(index + 1);
            let start = rule.start_byte + token.map_or(0, |token| token.bytes.start);
            let end = rule.start_byte + token.map_or(6, |token| token.bytes.end);
            crate::syntax::ranged_directive_diagnostic(
                source,
                filename,
                start,
                end,
                mastercss_schema::ErrorCode::CssDirectiveError,
                message,
            )
        };
        let target = match mode.as_str() {
            "inline" => &mut inline,
            "static" => &mut is_static,
            _ => {
                return Err(error(
                    "@theme accepts only static and inline modifiers".into(),
                ));
            }
        };
        if *target {
            return Err(error(format!("Duplicate @theme modifier: {mode}")));
        }
        *target = true;
    }
    let body = rule.body.as_deref().ok_or_else(|| {
        directive_error(source, filename, rule.start_byte, "@theme requires a block")
    })?;
    let context = ThemeContext {
        source,
        filename,
        body,
        inline,
        is_static,
        offset: rule.body_start_byte.unwrap_or(rule.start_byte),
    };
    let (_, mut ordered) = context.defaults()?;

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
    inline: bool,
    is_static: bool,
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
                let token = &tokens[statement.tokens.start];
                let message = if matches!(&token.kind, mastercss_lexer::CssSyntaxKind::AtKeyword(name) if name.eq_ignore_ascii_case("keyframes") || name.eq_ignore_ascii_case("-webkit-keyframes"))
                {
                    "@theme only accepts custom-property declarations; move @keyframes into native CSS outside @theme"
                } else {
                    "@theme only accepts custom-property declarations"
                };
                return Err(crate::syntax::ranged_directive_diagnostic(
                    self.source,
                    self.filename,
                    self.offset + token.bytes.start - 2,
                    self.offset + token.bytes.end - 2,
                    mastercss_schema::ErrorCode::CssDirectiveError,
                    message,
                ));
            }

            let property = &tokens[statement.tokens.start];
            if !matches!(&property.kind, mastercss_lexer::CssSyntaxKind::Ident(name) if name.starts_with("--") && name.len() > 2)
            {
                return Err(crate::syntax::ranged_directive_diagnostic(
                    self.source,
                    self.filename,
                    self.offset + property.bytes.start - 2,
                    self.offset + property.bytes.end - 2,
                    mastercss_schema::ErrorCode::CssDirectiveError,
                    "@theme only accepts custom-property declarations",
                ));
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
                    children: self.declarations(&block, range.start)?,
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
    ) -> Result<Vec<ThemeNode>, CompilerError> {
        let mut declarations = crate::collect_ordered_declarations(block, self.filename)?;
        crate::declarations::preserve_ordered_declaration_sequence(
            self.body,
            start,
            &mut declarations,
        );
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
                    inline: self.inline,
                    is_static: self.is_static,
                })
            })
            .collect()
    }
}
