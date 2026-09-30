//! One-pass substitution of explicitly inline theme tokens in generated values.
use super::ManifestProjection;
use mastercss_lexer::{CssSyntaxKind as Kind, tokenize_css_syntax};
use mastercss_schema::ScopedThemeValue;

pub(crate) fn value_without_importance(value: &str) -> (&str, bool) {
    let tokens = tokenize_css_syntax(value);
    if let [.., bang, keyword] = tokens.as_slice()
        && bang.kind == Kind::Delim('!')
        && matches!(&keyword.kind, Kind::Ident(name) if name.eq_ignore_ascii_case("important"))
    {
        return (value[..bang.bytes.start].trim_end(), true);
    }
    (value, false)
}

pub(crate) fn selected_value(values: &[ScopedThemeValue]) -> Option<String> {
    if !values.iter().any(|entry| entry.inline) {
        return None;
    }
    let mut selected = None;
    let mut selected_important = false;
    for entry in values {
        let (value, important) = value_without_importance(&entry.value);
        if selected_important && !important {
            continue;
        }
        selected = Some((entry.inline, value));
        selected_important = important;
    }
    selected.and_then(|(inline, value)| inline.then(|| value.to_owned()))
}

pub(crate) fn substitute(source: &str, manifest: &ManifestProjection) -> String {
    if !manifest.has_inline_tokens || !source.contains('(') {
        return source.into();
    }
    let tokens = tokenize_css_syntax(source);
    let mut result = String::with_capacity(source.len());
    let mut copied = 0;
    let mut index = 0;
    while let Some(token) = tokens.get(index) {
        if let Kind::Function(function) = &token.kind
            && let Some(close) = token.close
        {
            if function.eq_ignore_ascii_case("url") {
                index = close + 1;
                continue;
            }
            if function.eq_ignore_ascii_case("var")
                && let Some(Kind::Ident(name)) = tokens.get(index + 1).map(|token| &token.kind)
                && (index + 2 == close
                    || tokens
                        .get(index + 2)
                        .is_some_and(|token| token.kind == Kind::Delim(',')))
                && let Some(value) = name
                    .strip_prefix("--")
                    .and_then(|name| manifest.compiled_variables.get(name))
                    .and_then(|variable| variable.inline_value.as_deref())
            {
                result.push_str(&source[copied..token.bytes.start]);
                result.push_str(value);
                copied = tokens[close].bytes.end;
                index = close + 1;
                continue;
            }
        }
        index += 1;
    }
    result.push_str(&source[copied..]);
    result
}
