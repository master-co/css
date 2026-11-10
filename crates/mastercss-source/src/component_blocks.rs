// Locate the `<script>` and `<style>` blocks of a Svelte or Vue single-file component.
// Their templates are not HTML (attribute values may be `{expression}`), so only the
// block boundaries are read here: scripts are JavaScript, styles are not class sources,
// and everything else stays template text. A `<script` inside a template expression,
// an attribute value or a comment is text, not a block, as for the frameworks' parsers.
use std::ops::Range;

pub(super) enum ScriptLanguage {
    JavaScript,
    TypeScript,
    Jsx,
    Tsx,
}

pub(super) struct Block {
    /// The whole element, from `<` of the opening tag to the end of the closing tag.
    pub range: Range<usize>,
    /// The script body when it is JavaScript; `None` for styles and data scripts.
    pub script: Option<(Range<usize>, ScriptLanguage)>,
}

/// The template syntax that decides where an expression starts and ends.
#[derive(Clone, Copy, PartialEq, Eq)]
pub(super) enum Template {
    /// `{expression}` in text and attribute values.
    Svelte,
    /// `{{ expression }}` in text; attribute values are quoted.
    Vue,
}

pub(super) fn blocks(source: &str, template: Template) -> Vec<Block> {
    let bytes = source.as_bytes();
    let mut blocks = Vec::new();
    let mut cursor = 0;
    while cursor < bytes.len() {
        let byte = bytes[cursor];
        let expression = match template {
            Template::Svelte if byte == b'{' => Some((cursor + 1, "}")),
            Template::Vue if bytes[cursor..].starts_with(b"{{") => Some((cursor + 2, "}}")),
            _ => None,
        };
        if let Some((from, close)) = expression {
            // An unclosed expression is left to the framework to report; read on as text.
            cursor = expression_end(source, from, close).unwrap_or(cursor + 1);
            continue;
        }
        if byte != b'<' {
            cursor += 1;
            continue;
        }
        let start = cursor;
        cursor = start + 1;
        if source[cursor..].starts_with("!--") {
            let Some(end) = source[cursor + 3..].find("-->") else {
                break;
            };
            cursor += 3 + end + 3;
            continue;
        }
        let name = ["script", "style"].into_iter().find(|name| {
            source
                .get(cursor..cursor + name.len())
                .is_some_and(|tag| tag.eq_ignore_ascii_case(name))
                && bytes
                    .get(cursor + name.len())
                    .is_none_or(|b| b.is_ascii_whitespace() || matches!(b, b'>' | b'/'))
        });
        let Some(name) = name else {
            // Another element's attributes may hold `<script` in a value or expression.
            if bytes.get(cursor).is_some_and(u8::is_ascii_alphabetic) {
                match opening_tag_end(source, cursor, template) {
                    Some(end) => cursor = end + 1,
                    None => break,
                }
            }
            continue;
        };
        let Some(tag_end) = opening_tag_end(source, cursor + name.len(), template) else {
            break;
        };
        let attributes = &source[cursor + name.len()..tag_end];
        let body_start = tag_end + 1;
        let self_closing = attributes.trim_end().ends_with('/');
        let (body, end) = if self_closing {
            (body_start..body_start, body_start)
        } else {
            match closing_tag(source, body_start, name) {
                Some((close, end)) => (body_start..close, end),
                None => (body_start..source.len(), source.len()),
            }
        };
        let script = (name == "script")
            .then(|| script_language(attributes))
            .flatten()
            .map(|language| (body, language));
        blocks.push(Block {
            range: start..end,
            script,
        });
        cursor = end;
    }
    blocks
}

/// The index after the `close` that ends a template expression starting at `from`,
/// skipping nested braces, strings, template literals and comments.
pub(super) fn expression_end(source: &str, from: usize, close: &str) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut depth = 0usize;
    let mut cursor = from;
    while cursor < bytes.len() {
        let byte = bytes[cursor];
        if depth == 0 && bytes[cursor..].starts_with(close.as_bytes()) {
            return Some(cursor + close.len());
        }
        match byte {
            b'{' => depth += 1,
            b'}' => depth = depth.checked_sub(1)?,
            b'\'' | b'"' => cursor = string_end(bytes, cursor + 1, byte)?,
            b'`' => cursor = template_literal_end(source, cursor + 1)?,
            b'/' if bytes.get(cursor + 1) == Some(&b'/') => {
                cursor = source[cursor..]
                    .find('\n')
                    .map_or(bytes.len(), |end| cursor + end);
            }
            b'/' if bytes.get(cursor + 1) == Some(&b'*') => {
                cursor = cursor + 2 + source[cursor + 2..].find("*/")? + 1;
            }
            _ => {}
        }
        cursor += 1;
    }
    None
}

/// The index of the quote that closes a string whose body starts at `from`.
fn string_end(bytes: &[u8], from: usize, quote: u8) -> Option<usize> {
    let mut cursor = from;
    while cursor < bytes.len() {
        match bytes[cursor] {
            b'\\' => cursor += 1,
            byte if byte == quote => return Some(cursor),
            b'\n' => return None,
            _ => {}
        }
        cursor += 1;
    }
    None
}

/// The index of the backtick that closes a template literal whose body starts at `from`.
fn template_literal_end(source: &str, from: usize) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut cursor = from;
    while cursor < bytes.len() {
        match bytes[cursor] {
            b'\\' => cursor += 1,
            b'`' => return Some(cursor),
            b'$' if bytes.get(cursor + 1) == Some(&b'{') => {
                cursor = expression_end(source, cursor + 2, "}")? - 1;
            }
            _ => {}
        }
        cursor += 1;
    }
    None
}

/// The index of the `>` that ends an opening tag, skipping quoted attribute values and,
/// in Svelte, `{expression}` values, which may contain `>` and quotes.
fn opening_tag_end(source: &str, from: usize, template: Template) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut quote = None;
    let mut cursor = from;
    while cursor < bytes.len() {
        let byte = bytes[cursor];
        if template == Template::Svelte
            && byte == b'{'
            && let Some(end) = expression_end(source, cursor + 1, "}")
        {
            cursor = end;
            continue;
        }
        match quote {
            Some(open) if byte == open => quote = None,
            Some(_) => {}
            None if matches!(byte, b'"' | b'\'') => quote = Some(byte),
            None if byte == b'>' => return Some(cursor),
            None => {}
        }
        cursor += 1;
    }
    None
}

/// The start and end of `</name>` after `from`.
fn closing_tag(source: &str, from: usize, name: &str) -> Option<(usize, usize)> {
    let bytes = source.as_bytes();
    let mut scan = from;
    while let Some(offset) = source[scan..].find("</") {
        let start = scan + offset;
        let name_end = start + 2 + name.len();
        if source
            .get(start + 2..name_end)
            .is_some_and(|tag| tag.eq_ignore_ascii_case(name))
            && bytes
                .get(name_end)
                .is_none_or(|b| b.is_ascii_whitespace() || *b == b'>')
        {
            let end = source[name_end..]
                .find('>')
                .map_or(source.len(), |offset| name_end + offset + 1);
            return Some((start, end));
        }
        scan = start + 2;
    }
    None
}

/// The language of a script block, or `None` for a data block such as JSON-LD.
fn script_language(attributes: &str) -> Option<ScriptLanguage> {
    let mut lang = None;
    let mut kind = None;
    for (name, value) in attribute_values(attributes) {
        if lang.is_none() && name.eq_ignore_ascii_case("lang") {
            lang = Some(value);
        } else if kind.is_none() && name.eq_ignore_ascii_case("type") {
            kind = Some(value);
        }
    }
    if let Some(kind) = kind.map(str::trim)
        && !kind.is_empty()
        && ![
            "module",
            "text/javascript",
            "application/javascript",
            "text/typescript",
            "application/typescript",
            "ts",
        ]
        .iter()
        .any(|known| kind.eq_ignore_ascii_case(known))
    {
        return None;
    }
    let lang = lang.or(kind).unwrap_or_default().trim();
    Some(
        if lang.eq_ignore_ascii_case("ts")
            || lang.eq_ignore_ascii_case("typescript")
            || lang.eq_ignore_ascii_case("text/typescript")
            || lang.eq_ignore_ascii_case("application/typescript")
        {
            ScriptLanguage::TypeScript
        } else if lang.eq_ignore_ascii_case("tsx") {
            ScriptLanguage::Tsx
        } else if lang.eq_ignore_ascii_case("jsx") {
            ScriptLanguage::Jsx
        } else {
            ScriptLanguage::JavaScript
        },
    )
}

fn attribute_values(attributes: &str) -> Vec<(&str, &str)> {
    let bytes = attributes.as_bytes();
    let mut values = Vec::new();
    let mut cursor = 0;
    while cursor < bytes.len() {
        while bytes
            .get(cursor)
            .is_some_and(|b| b.is_ascii_whitespace() || *b == b'/')
        {
            cursor += 1;
        }
        let name_start = cursor;
        while bytes
            .get(cursor)
            .is_some_and(|b| !b.is_ascii_whitespace() && !matches!(b, b'=' | b'/'))
        {
            cursor += 1;
        }
        let name = &attributes[name_start..cursor];
        while bytes.get(cursor).is_some_and(u8::is_ascii_whitespace) {
            cursor += 1;
        }
        let mut value = "";
        if bytes.get(cursor) == Some(&b'=') {
            cursor += 1;
            while bytes.get(cursor).is_some_and(u8::is_ascii_whitespace) {
                cursor += 1;
            }
            if let Some(quote @ (b'"' | b'\'')) = bytes.get(cursor).copied() {
                let start = cursor + 1;
                let end = attributes[start..]
                    .find(quote as char)
                    .map_or(attributes.len(), |offset| start + offset);
                value = &attributes[start..end];
                cursor = (end + 1).min(attributes.len());
            } else {
                let start = cursor;
                while bytes.get(cursor).is_some_and(|b| !b.is_ascii_whitespace()) {
                    cursor += 1;
                }
                value = &attributes[start..cursor];
            }
        }
        if name.is_empty() {
            cursor += 1;
        } else {
            values.push((name, value));
        }
    }
    values
}
