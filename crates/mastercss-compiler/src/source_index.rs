//! Per-source line and UTF-16 offset index.
//!
//! Anchoring output mappings converts parser locations to byte offsets and byte
//! offsets to UTF-16 ranges for every rule. Scanning the source from its start on
//! each conversion made those passes quadratic in the number of rules. The index
//! is built once per source text and answers each conversion from the nearest
//! line start or byte checkpoint.

use crate::{CssDirectiveSourceReference, SourceLocation, SourceLocationRange, SourceRange};
use mastercss_lexer::utf16_len;

const CHECKPOINT_BYTES: usize = 256;

pub(crate) struct SourceIndex<'a> {
    text: &'a str,
    /// Byte offsets where lines start, beginning with 0.
    line_starts: Vec<usize>,
    /// `(byte offset at a character boundary, UTF-16 units before it)`, ascending, beginning with `(0, 0)`.
    checkpoints: Vec<(usize, u32)>,
}

impl<'a> SourceIndex<'a> {
    pub(crate) fn new(text: &'a str) -> Self {
        let mut line_starts = vec![0];
        let mut checkpoints = vec![(0, 0)];
        let mut units = 0_u32;
        let mut next_checkpoint = CHECKPOINT_BYTES;
        for (byte, character) in text.char_indices() {
            if byte >= next_checkpoint {
                checkpoints.push((byte, units));
                next_checkpoint = byte + CHECKPOINT_BYTES;
            }
            units += character.len_utf16() as u32;
            if character == '\n' {
                line_starts.push(byte + 1);
            }
        }
        Self {
            text,
            line_starts,
            checkpoints,
        }
    }

    pub(crate) fn text(&self) -> &'a str {
        self.text
    }

    /// UTF-16 units before `byte_offset`; `None` when it is not a character boundary.
    pub(crate) fn utf16_offset(&self, byte_offset: usize) -> Option<u32> {
        if byte_offset > self.text.len() || !self.text.is_char_boundary(byte_offset) {
            return None;
        }
        let index = self
            .checkpoints
            .partition_point(|(byte, _)| *byte <= byte_offset)
            - 1;
        let (base_byte, base_units) = self.checkpoints[index];
        Some(base_units + utf16_len(&self.text[base_byte..byte_offset]))
    }

    /// Byte offset of a UTF-16 offset; `None` when it splits a surrogate pair or exceeds the text.
    pub(crate) fn byte_offset(&self, utf16_offset: u32) -> Option<usize> {
        let index = self
            .checkpoints
            .partition_point(|(_, units)| *units <= utf16_offset)
            - 1;
        let (mut byte, mut units) = self.checkpoints[index];
        for character in self.text[byte..].chars() {
            if units == utf16_offset {
                return Some(byte);
            }
            let next = units + character.len_utf16() as u32;
            if next > utf16_offset {
                return None;
            }
            units = next;
            byte += character.len_utf8();
        }
        (units == utf16_offset).then_some(byte)
    }

    /// One-based line and UTF-16 column of a byte offset.
    pub(crate) fn location(&self, byte_offset: usize) -> Option<SourceLocation> {
        let units = self.utf16_offset(byte_offset)?;
        let line = self
            .line_starts
            .partition_point(|start| *start <= byte_offset);
        let line_start = self.line_starts[line - 1];
        let column = units - self.utf16_offset(line_start)? + 1;
        Some(SourceLocation {
            line: line as u32,
            column,
        })
    }

    /// Source reference for a byte range, matching `source_reference_from_bytes`.
    pub(crate) fn reference(
        &self,
        filename: &str,
        start: usize,
        end: usize,
    ) -> Option<CssDirectiveSourceReference> {
        Some(CssDirectiveSourceReference {
            file: Some(filename.to_owned()),
            range: SourceRange {
                start: self.utf16_offset(start)?,
                end: self.utf16_offset(end)?,
            },
            loc: Some(SourceLocationRange {
                start: self.location(start)?,
                end: self.location(end)?,
            }),
        })
    }

    /// Selector reference anchored at a parser location inside `body`, matching
    /// `selector_source_reference`: the selector ends in this (original) text.
    pub(crate) fn selector_reference(
        &self,
        filename: &str,
        body: &SourceIndex<'_>,
        body_start_byte: usize,
        line: u32,
        column: u32,
    ) -> Option<CssDirectiveSourceReference> {
        let local_start = body.byte_offset_for_location(line, column)?;
        let start = body_start_byte.checked_add(local_start)?;
        let end = crate::variant::selector_end_byte(self.text, start)?;
        self.reference(filename, start, end)
    }

    /// Byte offset of a parser location: zero-based line, one-based UTF-16 column,
    /// which must stay within that line.
    pub(crate) fn byte_offset_for_location(&self, line: u32, column: u32) -> Option<usize> {
        let line = line as usize;
        let line_start = *self.line_starts.get(line)?;
        let units = self.utf16_offset(line_start)? + column.saturating_sub(1);
        let byte = self.byte_offset(units)?;
        let line_end = self
            .line_starts
            .get(line + 1)
            .map_or(self.text.len(), |next| next - 1);
        (byte <= line_end).then_some(byte)
    }
}

#[cfg(test)]
mod tests {
    use super::SourceIndex;
    use crate::variant::source_location;
    use mastercss_lexer::{byte_to_utf16_offset, utf16_to_byte_offset};

    /// The scanning conversion the index replaced; kept as the test oracle.
    fn byte_offset_for_location(source: &str, line: u32, column: u32) -> Option<usize> {
        let mut line_start = 0;
        for _ in 0..line {
            let newline = source[line_start..].find('\n')?;
            line_start += newline + 1;
        }
        let target = column.saturating_sub(1);
        let mut utf16_column = 0_u32;
        let mut byte_offset = line_start;
        for character in source[line_start..].chars() {
            if character == '\n' || utf16_column >= target {
                break;
            }
            let width = character.len_utf16() as u32;
            if utf16_column + width > target {
                return None;
            }
            utf16_column += width;
            byte_offset += character.len_utf8();
        }
        (utf16_column == target).then_some(byte_offset)
    }

    fn corpus() -> Vec<String> {
        let mut corpus = vec![
            String::new(),
            "\n".into(),
            "a".into(),
            ".a{color:red}\n.b{color:blue}".into(),
            ".a{color:red}\r\n\r\n.b{content:\"é😀\"}\n".into(),
            "😀😀\n😀".into(),
            "é\né\n\n".into(),
        ];
        // Long enough to cross several byte checkpoints; short enough for the
        // exhaustive comparison against the scanning conversions.
        let long = (0..48)
            .map(|index| format!(".r{index}{{content:\"ü😀\";padding:{}px}}", index % 9))
            .collect::<Vec<_>>();
        corpus.push(long.join(""));
        corpus.push(long.join("\n"));
        corpus
    }

    #[test]
    fn matches_scanning_conversions() {
        for text in corpus() {
            let index = SourceIndex::new(&text);
            for byte in 0..=text.len() + 1 {
                assert_eq!(
                    index.utf16_offset(byte),
                    byte_to_utf16_offset(&text, byte),
                    "{text:?} {byte}"
                );
                assert_eq!(
                    index.location(byte),
                    source_location(&text, byte),
                    "{text:?} {byte}"
                );
            }
            let units = mastercss_lexer::utf16_len(&text);
            for utf16 in 0..=units + 1 {
                assert_eq!(
                    index.byte_offset(utf16),
                    utf16_to_byte_offset(&text, utf16),
                    "{text:?} {utf16}"
                );
            }
            let lines = text.matches('\n').count() as u32 + 2;
            for line in 0..lines {
                for column in 0..=units + 1 {
                    assert_eq!(
                        index.byte_offset_for_location(line, column),
                        byte_offset_for_location(&text, line, column),
                        "{text:?} line {line} column {column}"
                    );
                }
            }
        }
    }

    #[test]
    fn checkpoints_cover_multibyte_boundaries() {
        let text = "😀".repeat(300);
        let index = SourceIndex::new(&text);
        assert!(index.checkpoints.len() > 2);
        assert_eq!(index.utf16_offset(text.len()), Some(600));
        assert_eq!(index.byte_offset(600), Some(text.len()));
        assert_eq!(index.byte_offset(599), None);
        assert_eq!(index.utf16_offset(1), None);
    }
}
