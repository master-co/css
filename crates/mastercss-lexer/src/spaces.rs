//! Master value spaces. HTML whitespace separates classes, so a class writes each CSS
//! space of a value, query or argument as `_`, the spelling its selectors already use
//! for the descendant space. `|` is the deprecated 2.0 spelling and still decodes to a
//! space.
//!
//! Strings, comments, escapes (so `\_` is a literal underscore) and unquoted `url()`
//! tokens are opaque. An underscore next to another underscore is literal, as in
//! selectors (`a__b`). The `--name` that opens a `var()` keeps its underscores;
//! [`DashedNames::All`] extends that to every `--name`, for queries and `@apply` calls,
//! whose dashed idents are always names.
use crate::class_head::{skip_string, skip_url};
use crate::css_syntax::{is_name_code_point, name, starts_identifier};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum DashedNames {
    /// Only the `--name` that opens a `var()`; other dashed idents are value words,
    /// so `--angle_1s` is `--angle 1s`.
    Variables,
    /// Every `--name`.
    All,
}

/// Whether the underscore at `index` encodes a space by position alone: it is not
/// escaped and neither neighbor is another underscore. Callers that read a value
/// themselves, such as editors splitting components, also check protected text.
pub fn single_underscore(source: &str, index: usize) -> bool {
    let bytes = source.as_bytes();
    bytes.get(index) == Some(&b'_')
        && (index == 0 || bytes[index - 1] != b'_')
        && bytes.get(index + 1) != Some(&b'_')
        && !escaped(bytes, index)
}

/// Whether the byte at `index` is the code point of a `\` escape.
fn escaped(bytes: &[u8], index: usize) -> bool {
    bytes[..index]
        .iter()
        .rev()
        .take_while(|byte| **byte == b'\\')
        .count()
        % 2
        == 1
}

/// Decodes `_` and `|` spaces outside protected text.
pub(crate) fn decode(source: &str, dashed: DashedNames) -> String {
    let mut output = String::with_capacity(source.len());
    let mut cursor = 0;
    // Within a name run: whether its underscores are literal.
    let mut run: Option<bool> = None;
    // The next run opens a `var()`.
    let mut variable = false;
    while let Some(character) = source[cursor..].chars().next() {
        let start = cursor;
        match character {
            '"' | '\'' => {
                cursor = skip_string(source, cursor).unwrap_or(source.len());
                run = None;
            }
            '/' if source[cursor..].starts_with("/*") => {
                cursor = source[cursor + 2..]
                    .find("*/")
                    .map_or(source.len(), |offset| cursor + 2 + offset + 2);
                run = None;
            }
            '|' => {
                output.push(' ');
                cursor += 1;
                run = None;
                variable = false;
                continue;
            }
            '_' if run != Some(true) && single_underscore(source, cursor) => {
                output.push(' ');
                cursor += 1;
                run = None;
                variable = false;
                continue;
            }
            _ if run.is_none() && starts_identifier(&source[cursor..]) => {
                let mut end = cursor;
                let ident = name(source, &mut end);
                let call = source[end..].starts_with('(');
                if call
                    && ident.eq_ignore_ascii_case("url")
                    && !source[end + 1..].starts_with(['"', '\''])
                {
                    cursor = skip_url(source, end + 1).unwrap_or(source.len());
                    variable = false;
                    output.push_str(&source[start..cursor]);
                    continue;
                }
                if call && ident.eq_ignore_ascii_case("var") {
                    cursor = end + 1;
                    variable = true;
                    output.push_str(&source[start..cursor]);
                    continue;
                }
                run = Some(ident.starts_with("--") && (dashed == DashedNames::All || variable));
                cursor = escape_or_character_end(source, cursor);
            }
            _ if character == '\\' || is_name_code_point(character) => {
                run.get_or_insert(false);
                cursor = escape_or_character_end(source, cursor);
            }
            _ => {
                cursor += character.len_utf8();
                run = None;
            }
        }
        variable = false;
        output.push_str(&source[start..cursor]);
    }
    output
}

/// The end of the escape or code point at `cursor`.
fn escape_or_character_end(source: &str, cursor: usize) -> usize {
    if !source[cursor..].starts_with('\\') {
        return cursor + source[cursor..].chars().next().map_or(0, char::len_utf8);
    }
    let mut end = cursor + 1;
    let Some(first) = source[end..].chars().next() else {
        return end;
    };
    if !first.is_ascii_hexdigit() {
        return end + first.len_utf8();
    }
    let digits = source.as_bytes()[end..]
        .iter()
        .take(6)
        .take_while(|byte| byte.is_ascii_hexdigit())
        .count();
    end += digits;
    if source[end..].starts_with([' ', '\t', '\n', '\x0c']) {
        end += 1;
    } else if source[end..].starts_with("\r\n") {
        end += 2;
    } else if source[end..].starts_with('\r') {
        end += 1;
    }
    end
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodes_underscores_and_deprecated_pipes() {
        for (source, expected) in [
            ("1px_solid_red", "1px solid red"),
            ("1px|solid|red", "1px solid red"),
            ("rgb(30_60_90/80%)", "rgb(30 60 90/80%)"),
            ("0_auto_!important", "0 auto !important"),
            ("_a_", " a "),
            ("a__b", "a__b"),
            ("a___b_c", "a___b c"),
            (r"slide\_in", r"slide\_in"),
            (r"a\5f_b", r"a\5f b"),
            (r"a\\_b", r"a\\ b"),
            ("'a_b|c'_\"d_e\"", "'a_b|c' \"d_e\""),
            ("a/*_|*/_b", "a/*_|*/ b"),
            ("url(/a_b|c.png)_no-repeat", "url(/a_b|c.png) no-repeat"),
            ("URL(/a_b.png)", "URL(/a_b.png)"),
            ("url('a_b.png')_x", "url('a_b.png') x"),
            ("var(--brand_primary)", "var(--brand_primary)"),
            ("VAR(--a_b,1px_solid)", "VAR(--a_b,1px solid)"),
            (
                "calc(var(--a_b)_*_var(--c_d))",
                "calc(var(--a_b) * var(--c_d))",
            ),
            ("var(_--a_b)", "var( --a b)"),
            ("--angle_1s_linear", "--angle 1s linear"),
            ("anchor(--a_b_top)", "anchor(--a b top)"),
            ("my_var(--a_b)", "my var(--a_b)"),
            ("#fff_#000", "#fff #000"),
            ("1.5_.5", "1.5 .5"),
        ] {
            assert_eq!(decode(source, DashedNames::Variables), expected, "{source}");
        }
    }

    #[test]
    fn query_names_keep_dashed_underscores() {
        for (source, expected) in [
            ("card_width>=40rem", "card width>=40rem"),
            ("card|width>=40rem", "card width>=40rem"),
            ("card_--md", "card --md"),
            ("--my_size", "--my_size"),
            ("my\\_card_--my_size", "my\\_card --my_size"),
            (
                "style(--density_mode:compact_x)",
                "style(--density_mode:compact x)",
            ),
            ("--mixin(1px_solid,--a_b)", "--mixin(1px solid,--a_b)"),
        ] {
            assert_eq!(decode(source, DashedNames::All), expected, "{source}");
        }
    }

    #[test]
    fn reports_single_underscores() {
        assert!(single_underscore("a_b", 1));
        assert!(!single_underscore("a__b", 1));
        assert!(!single_underscore("a__b", 2));
        assert!(!single_underscore(r"a\_b", 2));
        assert!(single_underscore(r"a\\_b", 3));
        assert!(!single_underscore("ab", 1));
    }
}
