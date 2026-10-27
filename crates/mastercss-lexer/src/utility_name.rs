/// Manifest names are already decoded. CSS identifiers may contain escapes,
/// Unicode and uppercase letters, but class delimiters cannot be name content.
pub fn valid_utility_name(name: &str) -> bool {
    !name.is_empty()
        && !name.chars().any(|c| {
            c.is_ascii_control()
                || c.is_ascii_whitespace()
                || ":@!|/.,#[](){}<>&*+~='\"\\".contains(c)
        })
}
