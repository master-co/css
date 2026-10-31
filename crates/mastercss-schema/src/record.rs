//! A JSON object of named values that keeps its member order, like a JSON object
//! parsed with `preserve_order`: a repeated name keeps its first position and its
//! last value. Lookups scan one `Vec`, which suits the few dozen names a manifest
//! record holds and keeps map code out of the engine Wasm.
use serde::de::{MapAccess, Visitor};
use serde::ser::SerializeMap;
use serde::{Deserialize, Deserializer, Serialize, Serializer};

#[derive(Debug, Clone)]
pub struct Record<T>(Vec<(String, T)>);

/// Names and values in order.
pub type Iter<'a, T> =
    std::iter::Map<std::slice::Iter<'a, (String, T)>, fn(&(String, T)) -> (&String, &T)>;

/// Names and values in order, with mutable values.
pub type IterMut<'a, T> =
    std::iter::Map<std::slice::IterMut<'a, (String, T)>, fn(&mut (String, T)) -> (&String, &mut T)>;

impl<T> Default for Record<T> {
    fn default() -> Self {
        Self(Vec::new())
    }
}

impl<T> Record<T> {
    fn position(&self, name: &str) -> Option<usize> {
        self.0.iter().position(|(key, _)| key == name)
    }

    pub fn get(&self, name: &str) -> Option<&T> {
        self.position(name).map(|index| &self.0[index].1)
    }

    pub fn contains_key(&self, name: &str) -> bool {
        self.position(name).is_some()
    }

    /// Sets the value of `name` in place, or appends it, returning the previous one.
    pub fn insert(&mut self, name: String, value: T) -> Option<T> {
        match self.position(&name) {
            Some(index) => Some(std::mem::replace(&mut self.0[index].1, value)),
            None => {
                self.0.push((name, value));
                None
            }
        }
    }

    /// The value of `name`, appended as `T::default()` first when it has none.
    pub fn get_or_insert_default(&mut self, name: String) -> &mut T
    where
        T: Default,
    {
        let index = self.position(&name).unwrap_or_else(|| {
            self.0.push((name, T::default()));
            self.0.len() - 1
        });
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

    /// Names and values in order.
    pub fn iter(&self) -> Iter<'_, T> {
        self.0.iter().map(|(name, value)| (name, value))
    }

    /// Names and values in order, with mutable values.
    pub fn iter_mut(&mut self) -> IterMut<'_, T> {
        self.0.iter_mut().map(|(name, value)| (&*name, value))
    }
}

/// Equal when both have the same names with equal values, in any order, as JSON
/// objects compare.
impl<T: PartialEq> PartialEq for Record<T> {
    fn eq(&self, other: &Self) -> bool {
        self.len() == other.len()
            && self
                .iter()
                .all(|(name, value)| other.get(name) == Some(value))
    }
}

impl<T> Extend<(String, T)> for Record<T> {
    fn extend<I: IntoIterator<Item = (String, T)>>(&mut self, entries: I) {
        for (name, value) in entries {
            self.insert(name, value);
        }
    }
}

impl<T> FromIterator<(String, T)> for Record<T> {
    fn from_iter<I: IntoIterator<Item = (String, T)>>(entries: I) -> Self {
        let mut record = Self::default();
        record.extend(entries);
        record
    }
}

impl<T> IntoIterator for Record<T> {
    type Item = (String, T);
    type IntoIter = std::vec::IntoIter<(String, T)>;

    fn into_iter(self) -> Self::IntoIter {
        self.0.into_iter()
    }
}

impl<'a, T> IntoIterator for &'a Record<T> {
    type Item = (&'a String, &'a T);
    type IntoIter = Iter<'a, T>;

    fn into_iter(self) -> Self::IntoIter {
        self.iter()
    }
}

impl<'a, T> IntoIterator for &'a mut Record<T> {
    type Item = (&'a String, &'a mut T);
    type IntoIter = IterMut<'a, T>;

    fn into_iter(self) -> Self::IntoIter {
        self.iter_mut()
    }
}

impl<T: Serialize> Serialize for Record<T> {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut map = serializer.serialize_map(Some(self.0.len()))?;
        for (name, value) in &self.0 {
            map.serialize_entry(name, value)?;
        }
        map.end()
    }
}

impl<'de, T: Deserialize<'de>> Deserialize<'de> for Record<T> {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        struct RecordVisitor<T>(std::marker::PhantomData<T>);

        impl<'de, T: Deserialize<'de>> Visitor<'de> for RecordVisitor<T> {
            type Value = Record<T>;

            fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
                formatter.write_str("a map")
            }

            fn visit_map<A: MapAccess<'de>>(self, mut map: A) -> Result<Record<T>, A::Error> {
                let mut record = Record::default();
                while let Some((name, value)) = map.next_entry()? {
                    record.insert(name, value);
                }
                Ok(record)
            }
        }

        deserializer.deserialize_map(RecordVisitor(std::marker::PhantomData))
    }
}
