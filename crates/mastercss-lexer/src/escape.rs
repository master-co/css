/// CSSOM-compatible identifier escaping that matches `CSS.escape`: positions count
/// UTF-16 code units, and a character outside the Basic Multilingual Plane is
/// kept whole.
pub fn css_escape(value: &str) -> String {
    if value == "-" {
        return "\\-".into();
    }
    let first = value.chars().next().unwrap_or_default();
    let mut result = String::with_capacity(value.len());
    let mut index = 0;
    for character in value.chars() {
        let unit = character as u32;
        let digit = character.is_ascii_digit();
        if unit == 0 {
            result.push('\u{fffd}');
        } else if (0x0001..=0x001f).contains(&unit)
            || unit == 0x007f
            || (index == 0 && digit)
            || (index == 1 && digit && first == '-')
        {
            result.push('\\');
            push_hex(&mut result, unit as u16);
            result.push(' ');
        } else if unit >= 0x0080
            || character == '-'
            || character == '_'
            || character.is_ascii_alphanumeric()
        {
            result.push(character);
        } else {
            result.push('\\');
            result.push(character);
        }
        index += character.len_utf16();
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

/// Appends `unit` in lowercase hexadecimal without leading zeros.
fn push_hex(result: &mut String, unit: u16) {
    let mut started = false;
    for shift in [12, 8, 4, 0] {
        let digit = (unit >> shift) & 0xf;
        if started || digit != 0 || shift == 0 {
            started = true;
            result.push(char::from(b"0123456789abcdef"[usize::from(digit)]));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::css_escape;

    #[test]
    fn characters_outside_the_basic_plane_stay_whole() {
        assert_eq!(css_escape("(content:'🙂')"), r"\(content\:\'🙂\'\)");
        assert_eq!(css_escape("icon-😀"), "icon-😀");
        assert_ne!(css_escape("icon-😀"), css_escape("icon-😁"));
        // Positions still count UTF-16 code units, as `CSS.escape` does.
        assert_eq!(css_escape("1a"), r"\31 a");
        assert_eq!(css_escape("-1"), r"-\31 ");
        assert_eq!(css_escape("😀1"), "😀1");
        assert_eq!(css_escape("-"), r"\-");
        assert_eq!(css_escape("a\u{0}b"), "a\u{fffd}b");
    }
}
