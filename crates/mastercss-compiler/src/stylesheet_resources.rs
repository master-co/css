use std::{collections::HashMap, ops::Range};

use cssparser::{Parser, ParserInput, Token};
use lightningcss::{
    stylesheet::PrinterOptions,
    traits::{Parse, ToCss},
    values::{image::Image, url::Url},
    visitor::{Visit, VisitTypes, Visitor},
};
use mastercss_lexer::utf16_to_byte_offset;
use mastercss_schema::{CssDirectiveSourceReference, CssDirectiveStyleDefinition, SourceRange};
use serde::{Deserialize, Serialize};

use crate::CompilerError;

/// Positions refer to the original source and span the containing URL/image-set.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssResourceReference {
    pub start: u32,
    pub end: u32,
    pub url: String,
}

// Resource values are reprinted before directive lowering. Keep their original
// spans so compiler diagnostics and definition metadata still address authored CSS.
struct ResourceEdit {
    original: Range<u32>,
    generated: Range<u32>,
}

pub(crate) struct RelocatedStylesheet {
    pub source: String,
    edits: Vec<ResourceEdit>,
}

impl RelocatedStylesheet {
    fn original_offset(&self, offset: u32, end: bool) -> u32 {
        let index = self
            .edits
            .partition_point(|edit| edit.generated.end < offset);
        if let Some(edit) = self.edits.get(index) {
            if offset <= edit.generated.start {
                return edit.original.start - (edit.generated.start - offset);
            }
            if offset == edit.generated.end || end {
                return edit.original.end;
            }
            return edit.original.start;
        }
        self.edits.last().map_or(offset, |edit| {
            edit.original.end + (offset - edit.generated.end)
        })
    }

    pub fn restore_range(&self, range: &mut SourceRange) {
        range.start = self.original_offset(range.start, false);
        range.end = self.original_offset(range.end, true);
    }

    pub fn restore_error(&self, mut error: CompilerError) -> CompilerError {
        match &mut error {
            CompilerError::Parse { range, .. }
            | CompilerError::Directive { range, .. }
            | CompilerError::DirectiveDiagnostic { range, .. } => {
                if let Some(range) = range {
                    self.restore_range(range);
                }
            }
            _ => {}
        }
        error
    }

    pub(crate) fn restore_reference(
        &self,
        original: &str,
        reference: &mut CssDirectiveSourceReference,
    ) {
        self.restore_range(&mut reference.range);
        reference.loc = utf16_to_byte_offset(original, reference.range.start)
            .zip(utf16_to_byte_offset(original, reference.range.end))
            .and_then(|(start, end)| {
                crate::variant::source_reference_from_bytes(
                    original,
                    reference.file.as_deref().unwrap_or_default(),
                    start,
                    end,
                )
            })
            .and_then(|source| source.loc);
    }

    pub fn restore_definition(&self, original: &str, definition: &mut CssDirectiveStyleDefinition) {
        match definition {
            CssDirectiveStyleDefinition::Native {
                source,
                selector_source,
                declarations,
                ..
            } => {
                for declaration in declarations {
                    if let Some(reference) = &mut declaration.source {
                        self.restore_reference(original, reference);
                    }
                }
                for reference in [source, selector_source].into_iter().flatten() {
                    self.restore_reference(original, reference);
                }
            }
            CssDirectiveStyleDefinition::Compose {
                source,
                directive_source,
                selector_source,
                ..
            } => {
                for reference in [source, directive_source, selector_source]
                    .into_iter()
                    .flatten()
                {
                    self.restore_reference(original, reference);
                }
            }
        }
    }
}

pub(crate) fn independent_url(url: &str) -> bool {
    if url.starts_with('/') {
        return true;
    }
    let Some((scheme, _)) = url.split_once(':') else {
        return false;
    };
    scheme.starts_with(|c: char| c.is_ascii_alphabetic())
        && scheme
            .bytes()
            .all(|c| c.is_ascii_alphanumeric() || b"+-.".contains(&c))
}

pub(crate) fn sibling_url(url: &str) -> bool {
    let Some(name) = url.strip_prefix("./") else {
        return false;
    };
    let path = name.split(['?', '#']).next().unwrap_or_default();
    let lower = path.to_ascii_lowercase();
    !path.is_empty()
        && !matches!(path, "." | "..")
        && !path.contains(['/', '\\'])
        && !lower.contains("%2f")
        && !lower.contains("%5c")
        && !lower.contains("%2e")
}

struct Resources<'a> {
    filename: &'a str,
    relative: bool,
    mappings: Option<&'a HashMap<String, String>>,
    urls: Vec<String>,
    changed: bool,
}

impl<'i> Visitor<'i> for Resources<'_> {
    type Error = CompilerError;

    fn visit_types(&self) -> VisitTypes {
        VisitTypes::URLS | VisitTypes::IMAGES
    }

    fn visit_image(&mut self, image: &mut Image<'i>) -> Result<(), Self::Error> {
        // ImageSetOption's recursive image field is excluded from Lightning's
        // derived visit-type mask. Traverse its parsed options explicitly.
        if let Image::ImageSet(set) = image {
            for option in &mut set.options {
                option.image.visit(self)?;
            }
            Ok(())
        } else {
            image.visit_children(self)
        }
    }

    fn visit_url(&mut self, url: &mut Url<'i>) -> Result<(), Self::Error> {
        let value = url.url.as_ref();
        // Fragment-only URLs are local tree references, not stylesheet resources.
        // Empty URLs must not become requests for the stylesheet/document itself.
        if value.is_empty() || value.starts_with('#') {
            return Ok(());
        }
        self.urls.push(value.to_owned());
        if let Some(mappings) = self.mappings {
            if let Some(target) = mappings.get(value) {
                if !independent_url(target) && !(self.relative && sibling_url(target)) {
                    return Err(CompilerError::Import {
                        filename: self.filename.into(),
                        message: format!(
                            "Resource URL must be root-relative or absolute: {target}"
                        ),
                    });
                }
                self.changed |= value != target;
                url.url = target.clone().into();
            } else if !independent_url(value) {
                return Err(CompilerError::Import {
                    filename: self.filename.into(),
                    message: format!("Missing resource URL mapping for {value}"),
                });
            }
        }
        Ok(())
    }
}

// cssparser consumes unquoted URLs as opaque tokens, including their parentheses,
// comments-as-path-text and data payload. Ordinary strings remain opaque as well.
fn resource_ranges(input: &mut Parser<'_, '_>, ranges: &mut Vec<Range<usize>>) {
    let mut skip_prelude = false;
    loop {
        let start = input.position().byte_index();
        let Ok(token) = input.next_including_whitespace_and_comments().cloned() else {
            break;
        };
        match token {
            Token::AtKeyword(name)
                if name.eq_ignore_ascii_case("import")
                    || name.eq_ignore_ascii_case("namespace")
                    || name.eq_ignore_ascii_case("reference") =>
            {
                skip_prelude = true
            }
            Token::Semicolon => skip_prelude = false,
            Token::UnquotedUrl(_) if !skip_prelude => {
                ranges.push(start..input.position().byte_index());
            }
            Token::Function(name)
                if !skip_prelude
                    && (name.eq_ignore_ascii_case("url")
                        || name.eq_ignore_ascii_case("image-set")
                        || name.eq_ignore_ascii_case("-webkit-image-set")) =>
            {
                let _: Result<(), cssparser::ParseError<'_, ()>> =
                    input.parse_nested_block(|nested| {
                        while nested.next_including_whitespace_and_comments().is_ok() {}
                        Ok(())
                    });
                ranges.push(start..input.position().byte_index());
            }
            Token::Function(_)
            | Token::ParenthesisBlock
            | Token::SquareBracketBlock
            | Token::CurlyBracketBlock
                if !skip_prelude =>
            {
                let _: Result<(), cssparser::ParseError<'_, ()>> =
                    input.parse_nested_block(|nested| {
                        resource_ranges(nested, ranges);
                        Ok(())
                    });
            }
            _ => {}
        }
    }
}

fn process_resources(
    source: &str,
    filename: &str,
    mappings: Option<&HashMap<String, String>>,
    relative: bool,
) -> Result<(RelocatedStylesheet, Vec<CssResourceReference>), CompilerError> {
    let mut input = ParserInput::new(source);
    let mut ranges = Vec::new();
    resource_ranges(&mut Parser::new(&mut input), &mut ranges);
    let mut references = Vec::new();
    let mut output = String::with_capacity(source.len());
    let mut edits = Vec::new();
    let mut generated_units = 0;
    let mut cursor = 0;
    let index = crate::source_index::SourceIndex::new(source);
    for range in ranges {
        // The value parser validates the complete URL/image-set grammar. Never
        // repair an invalid value into a valid one while relocating resources.
        let Ok(mut value) = Image::parse_string(&source[range.clone()]) else {
            continue;
        };
        let mut visitor = Resources {
            filename,
            relative,
            mappings,
            urls: Vec::new(),
            changed: false,
        };
        value.visit(&mut visitor)?;
        for url in visitor.urls {
            references.push(CssResourceReference {
                start: index.utf16_offset(range.start).expect("parser boundary"),
                end: index.utf16_offset(range.end).expect("parser boundary"),
                url,
            });
        }
        if visitor.changed {
            output.push_str(&source[cursor..range.start]);
            generated_units += source[cursor..range.start].encode_utf16().count() as u32;
            let generated_start = generated_units;
            let replacement = value
                .to_css_string(PrinterOptions::default())
                .map_err(|error| CompilerError::Print {
                    filename: filename.into(),
                    message: error.to_string(),
                })?;
            generated_units += replacement.encode_utf16().count() as u32;
            edits.push(ResourceEdit {
                original: index.utf16_offset(range.start).expect("parser boundary")
                    ..index.utf16_offset(range.end).expect("parser boundary"),
                generated: generated_start..generated_units,
            });
            output.push_str(&replacement);
            cursor = range.end;
        }
    }
    output.push_str(&source[cursor..]);
    Ok((
        RelocatedStylesheet {
            source: output,
            edits,
        },
        references,
    ))
}

pub fn analyze_css_resources(source: &str) -> Vec<CssResourceReference> {
    process_resources(source, "", None, false)
        .expect("analysis does not rewrite URLs")
        .1
}

pub(crate) fn rewrite_css_resources(
    source: &str,
    filename: &str,
    mappings: &HashMap<String, String>,
    relative: bool,
) -> Result<RelocatedStylesheet, CompilerError> {
    process_resources(source, filename, Some(mappings), relative).map(|(source, _)| source)
}
