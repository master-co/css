use crate::{CssDirectiveSourceReference, CssOutputMapping, SourceRange, byte_to_utf16_offset};

/// Exact copied spans. Generated wrappers deliberately have no authoring source.
#[derive(Default)]
pub(crate) struct MappedSource {
    pub text: String,
    pub mappings: Vec<CssOutputMapping>,
    length: u32,
}

impl MappedSource {
    pub fn authored(file: &str, text: String) -> Self {
        let length = text.encode_utf16().count() as u32;
        let mappings = if length == 0 {
            Vec::new()
        } else {
            vec![CssOutputMapping {
                generated_start: 0,
                generated_end: Some(length),
                source: CssDirectiveSourceReference {
                    file: Some(file.into()),
                    range: SourceRange {
                        start: 0,
                        end: length,
                    },
                    loc: None,
                },
            }]
        };
        Self {
            text,
            mappings,
            length,
        }
    }

    pub fn push(&mut self, other: Self) {
        self.mappings
            .extend(other.mappings.into_iter().map(|mut span| {
                span.generated_start += self.length;
                span.generated_end = span.generated_end.map(|end| end + self.length);
                span
            }));
        self.text.push_str(&other.text);
        self.length += other.length;
    }

    pub fn push_unmapped(&mut self, text: &str) {
        self.text.push_str(text);
        self.length += text.encode_utf16().count() as u32;
    }

    pub fn slice(&self, start: usize, end: usize) -> Self {
        let start_offset =
            byte_to_utf16_offset(&self.text, start).expect("slice starts at a character boundary");
        let end_offset =
            byte_to_utf16_offset(&self.text, end).expect("slice ends at a character boundary");
        let mappings = self
            .mappings
            .iter()
            .filter_map(|span| {
                let start = span.generated_start.max(start_offset);
                let end = span.generated_end?.min(end_offset);
                if start >= end {
                    return None;
                }
                let source_start = span.source.range.start + start - span.generated_start;
                Some(CssOutputMapping {
                    generated_start: start - start_offset,
                    generated_end: Some(end - start_offset),
                    source: CssDirectiveSourceReference {
                        file: span.source.file.clone(),
                        range: SourceRange {
                            start: source_start,
                            end: source_start + end - start,
                        },
                        loc: None,
                    },
                })
            })
            .collect();
        Self {
            text: self.text[start..end].into(),
            mappings,
            length: end_offset - start_offset,
        }
    }
}
