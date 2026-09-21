/// Character boundaries and line starts built once for a document. Offsets inside
/// surrogate pairs are absent; the interior of CRLF is not an LSP position.
#[derive(Debug)]
pub(crate) struct DocumentIndex {
    boundaries: Vec<(u32, u32)>,
    lines: Vec<u32>,
    crlf_interiors: Vec<u32>,
}

impl DocumentIndex {
    pub(crate) fn new(source: &str) -> Self {
        let mut boundaries = Vec::with_capacity(source.len() + 1);
        let mut lines = vec![0];
        let mut crlf_interiors = Vec::new();
        let mut utf16 = 0;
        let mut chars = source.char_indices().peekable();
        let mut after_cr = false;
        while let Some((byte, character)) = chars.next() {
            boundaries.push((byte as u32, utf16));
            utf16 += character.len_utf16() as u32;
            if character == '\r' {
                if chars.peek().is_some_and(|(_, next)| *next == '\n') {
                    crlf_interiors.push(utf16);
                    lines.push(utf16 + 1);
                } else {
                    lines.push(utf16);
                }
            } else if character == '\n' && !after_cr {
                lines.push(utf16);
            }
            after_cr = character == '\r';
        }
        boundaries.push((source.len() as u32, utf16));
        Self {
            boundaries,
            lines,
            crlf_interiors,
        }
    }

    pub(crate) fn utf16_len(&self) -> u32 {
        self.boundaries.last().unwrap().1
    }

    pub(crate) fn byte_to_utf16(&self, byte: usize) -> Option<u32> {
        let byte = u32::try_from(byte).ok()?;
        self.boundaries
            .binary_search_by_key(&byte, |entry| entry.0)
            .ok()
            .map(|index| self.boundaries[index].1)
    }

    pub(crate) fn utf16_to_byte(&self, utf16: u32) -> Option<usize> {
        self.boundaries
            .binary_search_by_key(&utf16, |entry| entry.1)
            .ok()
            .map(|index| self.boundaries[index].0 as usize)
    }

    pub(crate) fn cursor(&self) -> PositionCursor<'_> {
        PositionCursor {
            index: self,
            boundary: 0,
            line: 0,
        }
    }
}

pub(crate) struct PositionCursor<'a> {
    index: &'a DocumentIndex,
    boundary: usize,
    line: usize,
}

impl PositionCursor<'_> {
    pub(crate) fn position(&mut self, offset: u32) -> Option<(u32, u32)> {
        if offset > self.index.utf16_len() {
            return None;
        }
        let boundaries = &self.index.boundaries;
        if boundaries[self.boundary].1 > offset {
            // Rejected overlapping/multiline tokens can move the next request back.
            self.boundary = boundaries.partition_point(|entry| entry.1 < offset);
            self.line = self.index.lines.partition_point(|start| *start <= offset) - 1;
        } else {
            while boundaries[self.boundary].1 < offset {
                self.boundary += 1;
            }
            while self
                .index
                .lines
                .get(self.line + 1)
                .is_some_and(|start| *start <= offset)
            {
                self.line += 1;
            }
        }
        if boundaries[self.boundary].1 != offset
            || self.index.crlf_interiors.binary_search(&offset).is_ok()
        {
            return None;
        }
        Some((self.line as u32, offset - self.index.lines[self.line]))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn preserves_utf16_character_boundaries_and_crlf_positions_in_both_directions() {
        let index = DocumentIndex::new("a😀\r\nb\rc\nd");
        assert_eq!(index.byte_to_utf16(5), Some(3));
        assert_eq!(index.byte_to_utf16(2), None);
        assert_eq!(index.utf16_to_byte(2), None);
        assert_eq!(index.utf16_to_byte(3), Some(5));
        assert_eq!(index.utf16_to_byte(4), Some(6));
        let mut cursor = index.cursor();
        assert_eq!(cursor.position(1), Some((0, 1)));
        assert_eq!(cursor.position(2), None);
        assert_eq!(cursor.position(3), Some((0, 3)));
        assert_eq!(cursor.position(4), None);
        assert_eq!(cursor.position(5), Some((1, 0)));
        assert_eq!(cursor.position(7), Some((2, 0)));
        assert_eq!(cursor.position(9), Some((3, 0)));
        assert_eq!(cursor.position(10), Some((3, 1)));
        assert_eq!(cursor.position(11), None);
        assert_eq!(cursor.position(3), Some((0, 3)));
        assert_eq!(cursor.position(0), Some((0, 0)));
    }
}
