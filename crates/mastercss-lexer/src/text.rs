//! Text building without `core::fmt`. The browser runtime Wasm links no formatting
//! machinery, so code it runs joins text with [`concat_text!`](crate::concat_text)
//! and these helpers instead of `format!`; diagnostic messages behind the engine's
//! `diagnostic-messages` feature and tooling-only code may still format.

/// Joins `parts` into one string.
pub fn concat(parts: &[&str]) -> String {
    let mut text = String::with_capacity(parts.iter().map(|part| part.len()).sum());
    for part in parts {
        text.push_str(part);
    }
    text
}

/// `value` in decimal.
pub fn decimal(value: usize) -> String {
    let mut digits = [0; 20];
    let mut start = digits.len();
    let mut rest = value;
    loop {
        start -= 1;
        digits[start] = b'0' + (rest % 10) as u8;
        rest /= 10;
        if rest == 0 {
            break;
        }
    }
    digits[start..]
        .iter()
        .map(|digit| char::from(*digit))
        .collect()
}

/// `format!` for text only: joins `&str`, `String` and other `AsRef<str>` values,
/// such as `concat_text!("--", name)`, without `core::fmt`.
#[macro_export]
macro_rules! concat_text {
    ($($part:expr),+ $(,)?) => {
        $crate::text::concat(&[$(::core::convert::AsRef::<str>::as_ref(&$part)),+])
    };
}

#[cfg(test)]
mod tests {
    use super::decimal;

    #[test]
    fn joins_text_like_format() {
        let name = String::from("primary");
        assert_eq!(concat_text!("--", name, ":", &name), "--primary:primary");
        assert_eq!(concat_text!("a"), "a");
    }

    #[test]
    fn writes_decimals_like_display() {
        for value in [0, 7, 10, 1234567890, usize::MAX] {
            assert_eq!(decimal(value), value.to_string());
        }
    }
}
