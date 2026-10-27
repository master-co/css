//! Native keyframes share source policy with native selectors. Slots keep their
//! authored position while the complete graph resolves animation usage.
use crate::{CompilerError, CssRule, ThemeAtRule};
use mastercss_schema::{KeyframeContainer, KeyframeDefinition, KeyframeResource};

pub(crate) struct KeyframeCollector<'a> {
    pub source: &'a str,
    pub filename: &'a str,
    pub retained: bool,
    pub definitions: Vec<KeyframeDefinition>,
    pub source_index: crate::source_index::SourceIndex<'a>,
    pub source_identity: String,
    pub owner_identity: String,
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

pub(crate) fn render(
    css: &str,
    manifest: &serde_json::Value,
    classes: Option<&[String]>,
    mappings: &[crate::CssOutputMapping],
) -> Result<(String, Vec<crate::CssOutputMapping>), CompilerError> {
    if !css.contains("master-css-keyframe-") {
        return Ok((css.into(), mappings.to_vec()));
    }
    let error = |cause: mastercss_engine::EngineError| CompilerError::Directive {
        message: cause.to_string(),
        filename: "stylesheet.css".into(),
        range: None,
    };
    let mut engine =
        mastercss_engine::EngineSession::create(&manifest.to_string()).map_err(error)?;
    if let Some(classes) = classes {
        engine.ensure_class_rules(classes).map_err(error)?;
    }
    engine.ensure_stylesheet_resources(css).map_err(error)?;
    render_with_engine(css, mappings, &engine)
}

pub(crate) fn render_with_engine(
    css: &str,
    mappings: &[crate::CssOutputMapping],
    engine: &mastercss_engine::EngineSession,
) -> Result<(String, Vec<crate::CssOutputMapping>), CompilerError> {
    let edits = engine
        .keyframe_output_edits(css)
        .into_iter()
        .map(|edit| crate::output_edits::OutputEdit {
            start: edit.start,
            end: edit.end,
            text: edit.text,
            mappings: edit.mappings,
        })
        .collect();
    crate::output_edits::apply_output_edits(css, mappings, edits, "stylesheet.css")
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

impl KeyframeCollector<'_> {
    pub fn collect<'i>(
        &mut self,
        rules: &mut [CssRule<'i, ThemeAtRule>],
        containers: &[KeyframeContainer],
    ) -> Result<(), CompilerError> {
        for rule in rules {
            if let CssRule::Keyframes(frame) = rule {
                let loc = frame.loc;
                let (start, open, end) = self.bounds(loc)?;
                let text = self.source[start..end].to_owned();
                for token in mastercss_lexer::tokenize_css_syntax(&text)
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
                let name = match &frame.name {
                    lightningcss::rules::keyframes::KeyframesName::Ident(name) => {
                        name.0.to_string()
                    }
                    lightningcss::rules::keyframes::KeyframesName::Custom(name) => name.to_string(),
                };
                let id = format!("{}-{start:08x}", self.source_identity);
                let mut ranges = crate::analyze_css_resources(&text)
                    .into_iter()
                    .map(|resource| (resource.start, resource.end))
                    .collect::<Vec<_>>();
                ranges.sort_unstable();
                ranges.dedup();
                let resources = ranges
                    .into_iter()
                    .map(|(start, end)| {
                        let byte_start =
                            mastercss_lexer::utf16_to_byte_offset(&text, start).unwrap();
                        let byte_end = mastercss_lexer::utf16_to_byte_offset(&text, end).unwrap();
                        KeyframeResource {
                            start,
                            end,
                            value: text[byte_start..byte_end].into(),
                        }
                    })
                    .collect();
                self.definitions.push(KeyframeDefinition {
                    id: id.clone(),
                    owner_id: Some(self.owner_identity.clone()),
                    slot_id: None,
                    occurrence: None,
                    name,
                    dependencies: mastercss_lexer::collect_css_variable_references(&text),
                    resources,
                    text,
                    containers: containers.to_vec(),
                    retained: self.retained,
                    source: self.source_index.reference(self.filename, start, end),
                });
                let _ = open;
                *rule = CssRule::Unknown(lightningcss::rules::unknown::UnknownAtRule {
                    name: format!("--master-css-keyframe-{id}").into(),
                    prelude: lightningcss::properties::custom::TokenList(Vec::new()),
                    block: None,
                    loc,
                });
                continue;
            }
            let (children, loc) = match rule {
                CssRule::Media(rule) => (&mut rule.rules.0, rule.loc),
                CssRule::Supports(rule) => (&mut rule.rules.0, rule.loc),
                CssRule::Container(rule) => (&mut rule.rules.0, rule.loc),
                CssRule::LayerBlock(rule) => (&mut rule.rules.0, rule.loc),
                CssRule::Scope(rule) => (&mut rule.rules.0, rule.loc),
                CssRule::StartingStyle(rule) => (&mut rule.rules.0, rule.loc),
                CssRule::MozDocument(rule) => (&mut rule.rules.0, rule.loc),
                _ => continue,
            };
            let (start, open, _) = self.bounds(loc)?;
            let mut path = containers.to_vec();
            path.push(KeyframeContainer {
                id: format!("{}-{start:08x}", self.source_identity),
                prelude: self.source[start..open].trim().into(),
            });
            self.collect(children, &path)?;
        }
        Ok(())
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

/// Carry reference-only URLs through host CSS processing without introducing the
/// referenced definition's layer, condition, animation or retention root.
pub(crate) fn reference_resources(
    manifest: &serde_json::Value,
    local: Option<&[KeyframeDefinition]>,
) -> String {
    let mut css = String::new();
    let mut seen = std::collections::HashSet::new();
    for value in manifest
        .get("keyframes")
        .and_then(serde_json::Value::as_array)
        .into_iter()
        .flatten()
    {
        let Ok(definition) = serde_json::from_value::<KeyframeDefinition>(value.clone()) else {
            continue;
        };
        if definition.resources.is_empty()
            || local
                .into_iter()
                .flatten()
                .any(|local| local.id == definition.id)
        {
            continue;
        }
        let id = definition.slot_id.as_ref().unwrap_or(&definition.id);
        if !seen.insert(id.clone()) {
            continue;
        }
        css.push_str(&format!(
            "@media only all,(master-css-keyframe-resource-{id}){{:not(*){{--master-css-slot:0"
        ));
        for (index, resource) in definition.resources.iter().enumerate() {
            css.push_str(&format!(
                ";--master-css-keyframe-resource-{index}:{}",
                resource.value
            ));
        }
        css.push_str("}}");
    }
    css
}
