/// CSSOM-compatible identifier escaping, implemented over UTF-16 code units to match
/// `CSS.escape` and the existing JavaScript fallback exactly.
pub fn css_escape(value: &str) -> String {
    let units: Vec<u16> = value.encode_utf16().collect();
    if units.len() == 1 && units[0] == 0x002d {
        return "\\-".into();
    }

    let first = units.first().copied().unwrap_or_default();
    let mut result = String::new();
    for (index, unit) in units.iter().copied().enumerate() {
        if unit == 0 {
            result.push('\u{fffd}');
            continue;
        }
        if (0x0001..=0x001f).contains(&unit)
            || unit == 0x007f
            || (index == 0 && is_ascii_digit_unit(unit))
            || (index == 1 && is_ascii_digit_unit(unit) && first == 0x002d)
        {
            result.push('\\');
            result.push_str(&format!("{unit:x}"));
            result.push(' ');
            continue;
        }
        if unit >= 0x0080
            || unit == 0x002d
            || unit == 0x005f
            || is_ascii_digit_unit(unit)
            || is_ascii_uppercase_unit(unit)
            || is_ascii_lowercase_unit(unit)
        {
            result.push_str(&String::from_utf16_lossy(&[unit]));
            continue;
        }
        result.push('\\');
        result.push_str(&String::from_utf16_lossy(&[unit]));
    }
    result
}

pub fn escape_regexp(value: &str) -> String {
    let mut output = String::with_capacity(value.len());
    for character in value.chars() {
        if matches!(
            character,
            '\\' | '^' | '$' | '.' | '*' | '+' | '?' | '(' | ')' | '[' | ']' | '{' | '}' | '|'
        ) {
            output.push('\\');
        }
        output.push(character);
    }
    output
}

pub(crate) fn is_ascii_digit_unit(value: u16) -> bool {
    (0x0030..=0x0039).contains(&value)
}

pub(crate) fn is_ascii_uppercase_unit(value: u16) -> bool {
    (0x0041..=0x005a).contains(&value)
}

pub(crate) fn is_ascii_lowercase_unit(value: u16) -> bool {
    (0x0061..=0x007a).contains(&value)
}
