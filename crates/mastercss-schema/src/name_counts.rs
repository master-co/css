//! Counts keyed by name, kept in name order in one sorted `Vec`. `EmittedGlobals`
//! uses it instead of `BTreeMap`, whose node code was most of what its two maps
//! cost the runtime Wasm; the JSON form is the same object.
use serde::de::{MapAccess, Visitor};
use serde::ser::SerializeMap;
use serde::{Deserialize, Deserializer, Serialize, Serializer};

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct NameCounts(Vec<(String, u32)>);

/// Names and counts in name order.
pub type Iter<'a> =
    std::iter::Map<std::slice::Iter<'a, (String, u32)>, fn(&(String, u32)) -> (&String, &u32)>;

impl NameCounts {
    fn search(&self, name: &str) -> Result<usize, usize> {
        self.0.binary_search_by(|(key, _)| key.as_str().cmp(name))
    }

    pub fn get(&self, name: &str) -> Option<&u32> {
        self.search(name).ok().map(|index| &self.0[index].1)
    }

    pub fn contains_key(&self, name: &str) -> bool {
        self.search(name).is_ok()
    }

    /// Sets the count of `name`, returning the previous one.
    pub fn insert(&mut self, name: String, count: u32) -> Option<u32> {
        match self.search(&name) {
            Ok(index) => Some(std::mem::replace(&mut self.0[index].1, count)),
            Err(index) => {
                self.0.insert(index, (name, count));
                None
            }
        }
    }

    /// The count of `name`, set to `count` first when it has none.
    pub fn get_or_insert(&mut self, name: String, count: u32) -> &mut u32 {
        let index = match self.search(&name) {
            Ok(index) => index,
            Err(index) => {
                self.0.insert(index, (name, count));
                index
            }
        };
        &mut self.0[index].1
    }

    pub fn len(&self) -> usize {
        self.0.len()
    }

    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }

    /// Names in order.
    pub fn keys(&self) -> impl Iterator<Item = &String> {
        self.0.iter().map(|(name, _)| name)
    }

    /// Names and counts in name order.
    pub fn iter(&self) -> Iter<'_> {
        self.0.iter().map(|(name, count)| (name, count))
    }
}

impl<Q: AsRef<str> + ?Sized> std::ops::Index<&Q> for NameCounts {
    type Output = u32;

    /// Panics when `name` has no count, like `BTreeMap` indexing.
    fn index(&self, name: &Q) -> &u32 {
        self.get(name.as_ref()).expect("a counted name")
    }
}

impl Extend<(String, u32)> for NameCounts {
    fn extend<T: IntoIterator<Item = (String, u32)>>(&mut self, entries: T) {
        for (name, count) in entries {
            self.insert(name, count);
        }
    }
}

impl FromIterator<(String, u32)> for NameCounts {
    fn from_iter<T: IntoIterator<Item = (String, u32)>>(entries: T) -> Self {
        let mut counts = Self::default();
        counts.extend(entries);
        counts
    }
}

impl IntoIterator for NameCounts {
    type Item = (String, u32);
    type IntoIter = std::vec::IntoIter<(String, u32)>;

    fn into_iter(self) -> Self::IntoIter {
        self.0.into_iter()
    }
}

impl<'a> IntoIterator for &'a NameCounts {
    type Item = (&'a String, &'a u32);
    type IntoIter = Iter<'a>;

    fn into_iter(self) -> Self::IntoIter {
        self.iter()
    }
}

impl Serialize for NameCounts {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut map = serializer.serialize_map(Some(self.0.len()))?;
        for (name, count) in &self.0 {
            map.serialize_entry(name, count)?;
        }
        map.end()
    }
}

impl<'de> Deserialize<'de> for NameCounts {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        struct CountsVisitor;

        impl<'de> Visitor<'de> for CountsVisitor {
            type Value = NameCounts;

            fn expecting(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                formatter.write_str("an object of counts")
            }

            fn visit_map<A: MapAccess<'de>>(self, mut entries: A) -> Result<NameCounts, A::Error> {
                let mut counts = NameCounts::default();
                while let Some((name, count)) = entries.next_entry()? {
                    counts.insert(name, count);
                }
                Ok(counts)
            }
        }

        deserializer.deserialize_map(CountsVisitor)
    }
}

#[cfg(test)]
mod tests {
    use super::NameCounts;

    #[test]
    fn keeps_names_in_order_like_a_btree_map() {
        let mut counts = NameCounts::default();
        assert_eq!(counts.insert("b".into(), 2), None);
        assert_eq!(counts.insert("a".into(), 1), None);
        assert_eq!(counts.insert("b".into(), 3), Some(2));
        *counts.get_or_insert("c".into(), 1) += 1;
        *counts.get_or_insert("a".into(), 9) += 1;
        assert_eq!(
            counts.iter().collect::<Vec<_>>(),
            [(&"a".into(), &2), (&"b".into(), &3), (&"c".into(), &2)]
        );
        assert!(counts.contains_key("c") && !counts.contains_key("d"));
        assert_eq!(counts.get("b"), Some(&3));
    }

    #[test]
    fn serializes_as_an_object_in_name_order() {
        let counts: NameCounts =
            serde_json::from_str(r#"{"z":1,"a":2,"z":3}"#).expect("an object of counts");
        assert_eq!(serde_json::to_string(&counts).unwrap(), r#"{"a":2,"z":3}"#);
    }
}
