//! The engine's hash maps use an FxHash-style multiply hash, like rustc's: keys are
//! class names and names from the project's program, and the runtime Wasm needs
//! neither SipHash's code nor random keys.
use std::hash::{BuildHasherDefault, Hasher};

pub(crate) type HashMap<K, V> = std::collections::HashMap<K, V, BuildHasherDefault<FxHasher>>;
pub(crate) type HashSet<T> = std::collections::HashSet<T, BuildHasherDefault<FxHasher>>;

/// The multiplier and final rotation of `rustc-hash` 2.
const MULTIPLIER: u64 = 0xf135_7aea_2e62_a9c5;

#[derive(Default)]
pub(crate) struct FxHasher {
    hash: u64,
}

impl FxHasher {
    fn add(&mut self, word: u64) {
        self.hash = self.hash.wrapping_add(word).wrapping_mul(MULTIPLIER);
    }
}

impl Hasher for FxHasher {
    fn write(&mut self, bytes: &[u8]) {
        let (words, rest) = bytes.as_chunks::<8>();
        for word in words {
            self.add(u64::from_le_bytes(*word));
        }
        if !rest.is_empty() {
            let mut word = [0; 8];
            word[..rest.len()].copy_from_slice(rest);
            self.add(u64::from_le_bytes(word));
        }
    }

    fn write_u8(&mut self, value: u8) {
        self.add(u64::from(value));
    }

    fn write_u32(&mut self, value: u32) {
        self.add(u64::from(value));
    }

    fn write_u64(&mut self, value: u64) {
        self.add(value);
    }

    fn write_usize(&mut self, value: usize) {
        self.add(value as u64);
    }

    fn finish(&self) -> u64 {
        // Hash tables take bucket indexes from the low bits, which the multiply
        // mixes least.
        self.hash.rotate_left(26)
    }
}

#[cfg(test)]
mod tests {
    use std::collections::HashSet;
    use std::hash::{BuildHasher, BuildHasherDefault};

    use super::FxHasher;

    #[test]
    fn spreads_similar_names_over_low_and_high_bits() {
        let build = BuildHasherDefault::<FxHasher>::default();
        let hashes = (0..100)
            .map(|index| {
                build.hash_one(mastercss_lexer::concat_text!(
                    "color-red-",
                    mastercss_lexer::text::decimal(index)
                ))
            })
            .collect::<Vec<_>>();
        // 100 random values fill about 69 of 128 slots.
        for bits in [|hash: u64| hash & 0x7f, |hash: u64| hash >> 57] {
            let slots = hashes
                .iter()
                .map(|hash| bits(*hash))
                .collect::<HashSet<_>>();
            assert!(slots.len() >= 55, "{}", slots.len());
        }
    }
}
