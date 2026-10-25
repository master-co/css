//! Helpers for the internally tagged wire enums.
//!
//! Serde buffers internally tagged and flattened values into its private
//! `Content` tree, which instantiates a second deserializer for every
//! recursive manifest type and dominated the runtime Wasm. Those enums
//! deserialize through plain `Raw*` structs instead: one optional slot per
//! variant field, converted with `try_from`. Serialization keeps the derived
//! tagged form, so the wire format is unchanged.

use serde::de::{Error as _, value::Error};

pub(crate) fn required<T>(value: Option<T>, field: &'static str) -> Result<T, Error> {
    value.ok_or_else(|| Error::missing_field(field))
}

/// Rejects a field that belongs to another variant, matching the message
/// `deny_unknown_fields` reports for the selected variant.
pub(crate) fn only(
    present: &[(&'static str, bool)],
    expected: &'static [&'static str],
) -> Result<(), Error> {
    match present
        .iter()
        .find(|(field, set)| *set && !expected.contains(field))
    {
        Some((field, _)) => Err(Error::unknown_field(field, expected)),
        None => Ok(()),
    }
}
