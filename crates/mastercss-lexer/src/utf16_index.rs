/// Reusable UTF-8/UTF-16 character boundaries. Interior bytes and surrogate halves
/// are deliberately absent so callers cannot manufacture invalid source spans.
#[derive(Debug)]
pub struct Utf16Index {
    boundaries: Vec<(u32, u32)>,
}

impl Utf16Index {
    pub fn new(source: &str) -> Self {
        let mut boundaries = Vec::with_capacity(source.len() + 1);
        let mut utf16 = 0;
        for (byte, character) in source.char_indices() {
            boundaries.push((byte as u32, utf16));
            utf16 += character.len_utf16() as u32;
        }
        boundaries.push((source.len() as u32, utf16));
        Self { boundaries }
    }

    pub fn utf16_len(&self) -> u32 {
        self.boundaries.last().unwrap().1
    }

    pub fn byte_to_utf16(&self, byte: usize) -> Option<u32> {
        let byte = u32::try_from(byte).ok()?;
        self.boundaries
            .binary_search_by_key(&byte, |entry| entry.0)
            .ok()
            .map(|index| self.boundaries[index].1)
    }

    pub fn utf16_to_byte(&self, utf16: u32) -> Option<usize> {
        self.boundaries
            .binary_search_by_key(&utf16, |entry| entry.1)
            .ok()
            .map(|index| self.boundaries[index].0 as usize)
    }

    /// Ordered (UTF-8 byte, UTF-16 unit) offsets for monotonic position cursors.
    pub fn boundaries(&self) -> &[(u32, u32)] {
        &self.boundaries
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matches_prefix_conversion_at_every_boundary() {
        for source in ["", "ascii\r\ntext", "中文😀e\u{301}\r\n𐐀\0end"] {
            let index = Utf16Index::new(source);
            for byte in 0..=source.len() {
                let expected = source
                    .get(..byte)
                    .map(|prefix| prefix.encode_utf16().count() as u32);
                assert_eq!(index.byte_to_utf16(byte), expected);
                if let Some(units) = expected {
                    assert_eq!(index.utf16_to_byte(units), Some(byte));
                }
            }
            assert_eq!(index.utf16_len(), source.encode_utf16().count() as u32);
            assert_eq!(index.byte_to_utf16(source.len() + 1), None);
            assert_eq!(index.utf16_to_byte(index.utf16_len() + 1), None);
        }
        assert_eq!(Utf16Index::new("a😀b").utf16_to_byte(2), None);
    }
}
