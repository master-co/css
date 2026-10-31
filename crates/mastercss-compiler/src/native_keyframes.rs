//! Native `@keyframes` become manifest definitions. A `@prune native` stylesheet
//! hands its keyframes to the engines, which emit them on demand like tokens, so
//! they leave its native output. Any other stylesheet keeps them in place and
//! verbatim: Lightning CSS would merge same-name keyframes while minifying, so they
//! are printed as markers and restored right after printing.
use crate::source_index::SourceIndex;
use crate::{CompilerError, CssOutputMapping, CssRule, ThemeAtRule};
use mastercss_schema::{KeyframeContainer, KeyframeDefinition};

const MARKER_PREFIX: &str = "--master-css-keyframes-";

pub(crate) struct KeyframeCollector<'a> {
    pub source: &'a str,
    pub filename: &'a str,
    /// Whether this stylesheet delivers its keyframes as native CSS.
    pub native: bool,
    pub definitions: Vec<KeyframeDefinition>,
    pub source_index: SourceIndex<'a>,
    pub source_identity: String,
}

pub(crate) fn identity(source: &str) -> String {
    let hash = source.bytes().fold(0xcbf29ce484222325u64, |hash, byte| {
        (hash ^ u64::from(byte)).wrapping_mul(0x100000001b3)
    });
    format!("k{hash:016x}")
}

pub(crate) fn source_identity(owner: &str, source: &str) -> String {
    identity(&format!("{owner}\0{source}"))
}

pub(crate) fn validate_safelists(source: &str, filename: &str) -> Result<(), CompilerError> {
    if let Some(diagnostic) = mastercss_lexer::keyframe_safelist_diagnostics(source)
        .into_iter()
        .next()
    {
        return Err(crate::syntax::ranged_directive_diagnostic(
            source,
            filename,
            mastercss_lexer::utf16_to_byte_offset(source, diagnostic.range.as_ref().unwrap().start)
                .unwrap(),
            mastercss_lexer::utf16_to_byte_offset(source, diagnostic.range.as_ref().unwrap().end)
                .unwrap(),
            diagnostic.code,
            diagnostic.message,
        ));
    }
    Ok(())
}

/// An emitted on-demand definition is wrapped in its containers again; an anonymous
/// layer cannot be re-entered.
pub(crate) fn is_anonymous_layer(prelude: &str) -> bool {
    prelude.trim().eq_ignore_ascii_case("@layer")
}

impl KeyframeCollector<'_> {
    pub fn collect(
        &mut self,
        rules: &mut Vec<CssRule<'_, ThemeAtRule>>,
        containers: &[KeyframeContainer],
    ) -> Result<(), CompilerError> {
        let mut index = 0;
        while index < rules.len() {
            let definition = match &mut rules[index] {
                CssRule::Keyframes(frame) => {
                    let name = match &frame.name {
                        lightningcss::rules::keyframes::KeyframesName::Ident(name) => {
                            name.0.to_string()
                        }
                        lightningcss::rules::keyframes::KeyframesName::Custom(name) => {
                            name.to_string()
                        }
                    };
                    self.definition(frame.loc, name, containers)?
                }
                rule => {
                    let (children, loc) = match rule {
                        CssRule::Media(rule) => (&mut rule.rules.0, rule.loc),
                        CssRule::Supports(rule) => (&mut rule.rules.0, rule.loc),
                        CssRule::Container(rule) => (&mut rule.rules.0, rule.loc),
                        CssRule::LayerBlock(rule) => (&mut rule.rules.0, rule.loc),
                        CssRule::Scope(rule) => (&mut rule.rules.0, rule.loc),
                        CssRule::StartingStyle(rule) => (&mut rule.rules.0, rule.loc),
                        CssRule::MozDocument(rule) => (&mut rule.rules.0, rule.loc),
                        _ => {
                            index += 1;
                            continue;
                        }
                    };
                    let (start, open, _) = self.bounds(loc)?;
                    let mut path = containers.to_vec();
                    path.push(KeyframeContainer {
                        id: format!("{}-{start:08x}", self.source_identity),
                        prelude: self.source[start..open].trim().into(),
                    });
                    self.collect(children, &path)?;
                    index += 1;
                    continue;
                }
            };
            if self.native {
                let loc = match &rules[index] {
                    CssRule::Keyframes(frame) => frame.loc,
                    _ => unreachable!(),
                };
                rules[index] = CssRule::Unknown(lightningcss::rules::unknown::UnknownAtRule {
                    name: format!("{MARKER_PREFIX}{}", definition.id).into(),
                    prelude: lightningcss::properties::custom::TokenList(Vec::new()),
                    block: None,
                    loc,
                });
                index += 1;
            } else {
                rules.remove(index);
            }
            self.definitions.push(definition);
        }
        Ok(())
    }

    fn definition(
        &self,
        loc: lightningcss::rules::Location,
        name: String,
        containers: &[KeyframeContainer],
    ) -> Result<KeyframeDefinition, CompilerError> {
        let (start, _, end) = self.bounds(loc)?;
        let text = &self.source[start..end];
        for token in mastercss_lexer::tokenize_css_syntax(text)
            .into_iter()
            .skip(1)
        {
            if matches!(token.kind, mastercss_lexer::CssSyntaxKind::AtKeyword(_)) {
                return Err(crate::directive_error(
                    self.source,
                    self.filename,
                    start + token.bytes.start,
                    "Keyframes require native frame declarations; nested directives are unsupported",
                ));
            }
        }
        if !self.native {
            if containers
                .iter()
                .any(|container| is_anonymous_layer(&container.prelude))
            {
                return Err(crate::directive_error(
                    self.source,
                    self.filename,
                    start,
                    "On-demand keyframes cannot be declared in an anonymous @layer; name the layer or use @preserve native",
                ));
            }
            if let Some(resource) = crate::analyze_css_resources(text)
                .into_iter()
                .find(|resource| !is_portable_url(&resource.url))
            {
                return Err(crate::directive_error(
                    self.source,
                    self.filename,
                    start
                        + mastercss_lexer::utf16_to_byte_offset(text, resource.start)
                            .unwrap_or_default(),
                    "On-demand keyframes cannot contain relative url() references; use an absolute URL or @preserve native",
                ));
            }
        }
        Ok(KeyframeDefinition {
            id: format!("{}-{start:08x}", self.source_identity),
            name,
            text: text.to_owned(),
            containers: containers.to_vec(),
            native: self.native,
            safelisted: false,
            dependencies: mastercss_lexer::collect_css_variable_references(text),
            source: self.source_index.reference(self.filename, start, end),
        })
    }

    fn bounds(
        &self,
        loc: lightningcss::rules::Location,
    ) -> Result<(usize, usize, usize), CompilerError> {
        let start = self
            .source_index
            .byte_offset_for_location(loc.line, loc.column)
            .unwrap_or_default();
        let open = crate::pattern::css_statement_delimiter(self.source, start, self.source.len())
            .map(|(open, _)| open);
        let end = open.and_then(|open| crate::css_block_end(self.source, open, self.source.len()));
        match (open, end) {
            (Some(open), Some(end)) => Ok((start, open, end + 1)),
            _ => Err(crate::directive_error(
                self.source,
                self.filename,
                start,
                "Invalid native keyframes container",
            )),
        }
    }
}

/// A URL that resolves the same from any stylesheet or document.
fn is_portable_url(url: &str) -> bool {
    url.starts_with('#') || crate::stylesheet_resources::independent_url(url)
}

/// Whether CSS can be emitted away from its stylesheet: every URL it holds is portable.
pub(crate) fn has_portable_urls(css: &str) -> bool {
    crate::analyze_css_resources(css)
        .iter()
        .all(|resource| is_portable_url(&resource.url))
}

/// Replaces the markers of native keyframes in printed CSS with their authored text.
pub(crate) fn restore(
    css: &str,
    mappings: &[CssOutputMapping],
    definitions: &[KeyframeDefinition],
    filename: &str,
) -> Result<(String, Vec<CssOutputMapping>), CompilerError> {
    if !css.contains(MARKER_PREFIX) {
        return Ok((css.into(), mappings.to_vec()));
    }
    let mut edits = Vec::new();
    let mut previous_byte = 0;
    let mut previous_offset = 0;
    for token in mastercss_lexer::tokenize_css_syntax(css) {
        let mastercss_lexer::CssSyntaxKind::AtKeyword(name) = &token.kind else {
            continue;
        };
        let Some(id) = name.strip_prefix(MARKER_PREFIX) else {
            continue;
        };
        let definition = definitions
            .iter()
            .find(|definition| definition.id == id)
            .ok_or_else(|| CompilerError::Print {
                message: format!("Unknown native keyframes marker {id}"),
                filename: filename.into(),
            })?;
        let end_byte = token.bytes.end + 1;
        if css.as_bytes().get(token.bytes.end) != Some(&b';') {
            return Err(CompilerError::Print {
                message: "Native keyframes marker was altered".into(),
                filename: filename.into(),
            });
        }
        let start =
            previous_offset + css[previous_byte..token.bytes.start].encode_utf16().count() as u32;
        let end = start + css[token.bytes.start..end_byte].encode_utf16().count() as u32;
        previous_byte = end_byte;
        previous_offset = end;
        edits.push(crate::output_edits::OutputEdit {
            start,
            end,
            text: definition.text.clone(),
            mappings: definition
                .source
                .clone()
                .map(|source| CssOutputMapping {
                    generated_start: 0,
                    generated_end: Some(definition.text.encode_utf16().count() as u32),
                    source,
                })
                .into_iter()
                .collect(),
        });
    }
    crate::output_edits::apply_output_edits(css, mappings, edits, filename)
}
