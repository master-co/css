// Read class values from HTML start tags. This does not build a DOM tree.
// Attribute token boundaries follow HTML, including unquoted values and duplicates.
pub(super) enum Part<'a> {
    Class(&'a str),
    Script(&'a str),
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum Namespace {
    Html,
    Svg,
    Math,
}

pub(super) fn parts(source: &str) -> Vec<Part<'_>> {
    let bytes = source.as_bytes();
    let mut cursor = 0;
    let mut values = Vec::new();
    let mut elements: Vec<(&str, Namespace)> = Vec::new();
    while let Some(offset) = source[cursor..].find('<') {
        cursor += offset + 1;
        if source[cursor..].starts_with('/') {
            let name_start = cursor + 1;
            let end = source[name_start..]
                .find(|c: char| c.is_ascii_whitespace() || matches!(c, '/' | '>'))
                .map_or(bytes.len(), |offset| name_start + offset);
            let name = &source[name_start..end];
            if let Some(index) = elements
                .iter()
                .rposition(|(tag, _)| tag.eq_ignore_ascii_case(name))
            {
                elements.truncate(index);
            }
        }
        if source[cursor..].starts_with("!--") {
            cursor += 3;
            let rest = &source[cursor..];
            if rest.starts_with('>') {
                cursor += 1;
                continue;
            }
            let end = [("-->", 3), ("--!>", 4)]
                .into_iter()
                .filter_map(|(text, length)| rest.find(text).map(|offset| (offset, length)))
                .min();
            let Some((offset, length)) = end else { break };
            cursor += offset + length;
            continue;
        }
        if bytes
            .get(cursor)
            .is_some_and(|b| matches!(b, b'!' | b'?' | b'/'))
        {
            let Some(end) = source[cursor..].find('>') else {
                break;
            };
            cursor += end + 1;
            continue;
        }
        if !bytes.get(cursor).is_some_and(u8::is_ascii_alphabetic) {
            continue;
        }
        let tag_start = cursor;
        while bytes
            .get(cursor)
            .is_some_and(|b| !space(*b) && !matches!(b, b'/' | b'>'))
        {
            cursor += 1;
        }
        let tag = &source[tag_start..cursor];
        let mut class = None;
        let mut encoding = None;
        let mut self_closing = false;
        let mut ended = false;
        while cursor < bytes.len() {
            while bytes.get(cursor).is_some_and(|b| space(*b) || *b == b'/') {
                self_closing = bytes[cursor] == b'/' && bytes.get(cursor + 1) == Some(&b'>');
                cursor += 1;
            }
            if bytes.get(cursor) == Some(&b'>') {
                cursor += 1;
                ended = true;
                break;
            }
            let name_start = cursor;
            // An initial '=' is a parse error but is part of an attribute name.
            if bytes.get(cursor) == Some(&b'=') {
                cursor += 1;
            }
            while bytes
                .get(cursor)
                .is_some_and(|b| !space(*b) && !matches!(b, b'/' | b'>' | b'='))
            {
                cursor += 1;
            }
            let name = &source[name_start..cursor];
            while bytes.get(cursor).is_some_and(|b| space(*b)) {
                cursor += 1;
            }
            let mut value = "";
            if bytes.get(cursor) == Some(&b'=') {
                cursor += 1;
                while bytes.get(cursor).is_some_and(|b| space(*b)) {
                    cursor += 1;
                }
                if let Some(quote @ (b'\'' | b'"')) = bytes.get(cursor).copied() {
                    cursor += 1;
                    let start = cursor;
                    while bytes.get(cursor).is_some_and(|b| *b != quote) {
                        cursor += 1;
                    }
                    value = &source[start..cursor];
                    if cursor < bytes.len() {
                        cursor += 1;
                    }
                } else {
                    let start = cursor;
                    while bytes.get(cursor).is_some_and(|b| !space(*b) && *b != b'>') {
                        cursor += 1;
                    }
                    value = &source[start..cursor];
                }
            }
            if class.is_none() && name.eq_ignore_ascii_case("class") {
                class = Some(value);
            }
            if encoding.is_none() && name.eq_ignore_ascii_case("encoding") {
                encoding = Some(value);
            }
        }
        // EOF inside a start tag does not emit that tag or its attributes.
        if !ended {
            break;
        }
        values.extend(class.map(Part::Class));
        let parent = elements.last().map_or(Namespace::Html, |(_, ns)| *ns);
        let namespace = if parent == Namespace::Html && tag.eq_ignore_ascii_case("svg") {
            Namespace::Svg
        } else if parent == Namespace::Html && tag.eq_ignore_ascii_case("math") {
            Namespace::Math
        } else {
            parent
        };
        // Foreign integration points give their children HTML tokenization rules,
        // while the integration point itself (for example svg:title) stays foreign.
        let html_children = match namespace {
            Namespace::Html => true,
            Namespace::Svg => ["foreignObject", "desc", "title"]
                .iter()
                .any(|name| tag.eq_ignore_ascii_case(name)),
            Namespace::Math => {
                ["mi", "mo", "mn", "ms", "mtext"]
                    .iter()
                    .any(|name| tag.eq_ignore_ascii_case(name))
                    || tag.eq_ignore_ascii_case("annotation-xml")
                        && encoding.is_some_and(|value| {
                            value.eq_ignore_ascii_case("text/html")
                                || value.eq_ignore_ascii_case("application/xhtml+xml")
                        })
            }
        };
        let void = namespace == Namespace::Html
            && [
                "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
                "param", "source", "track", "wbr",
            ]
            .iter()
            .any(|name| tag.eq_ignore_ascii_case(name));
        if !void && !(self_closing && namespace != Namespace::Html) {
            elements.push((
                tag,
                if html_children {
                    Namespace::Html
                } else {
                    namespace
                },
            ));
        }
        if namespace == Namespace::Html && tag.eq_ignore_ascii_case("plaintext") {
            break;
        }
        if (!self_closing || namespace == Namespace::Html)
            && (namespace == Namespace::Html || tag.eq_ignore_ascii_case("script"))
            && [
                "style", "script", "title", "textarea", "xmp", "iframe", "noembed", "noframes",
                "noscript",
            ]
            .iter()
            .any(|raw| tag.eq_ignore_ascii_case(raw))
        {
            let mut scan = cursor;
            loop {
                let Some(offset) = source[scan..].find("</") else {
                    if tag.eq_ignore_ascii_case("script") {
                        values.push(Part::Script(&source[cursor..]));
                    }
                    return values;
                };
                let start = scan + offset;
                let name_start = start + 2;
                let name_end = name_start + tag.len();
                if source
                    .get(name_start..name_end)
                    .is_some_and(|name| name.eq_ignore_ascii_case(tag))
                    && bytes
                        .get(name_end)
                        .is_some_and(|b| space(*b) || matches!(b, b'/' | b'>'))
                {
                    if tag.eq_ignore_ascii_case("script") {
                        values.push(Part::Script(&source[cursor..start]));
                    }
                    cursor = start;
                    break;
                }
                scan = start + 2;
            }
        }
    }
    values
}

fn space(byte: u8) -> bool {
    matches!(byte, b' ' | b'\t' | b'\n' | b'\r' | 12)
}
