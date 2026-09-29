use super::normalize_dynamic_value;
use mastercss_lexer::{CssSyntaxKind as Kind, tokenize_css_syntax};
use std::borrow::Cow;

pub(crate) fn native_declaration_head(source: &str) -> Option<(usize, Cow<'_, str>)> {
    let tokens = tokenize_css_syntax(source);
    let [first, colon, ..] = tokens.as_slice() else {
        return None;
    };
    let Kind::Ident(name) = &first.kind else {
        return None;
    };
    (first.bytes.start == 0
        && colon.bytes.start == first.bytes.end
        && colon.kind == Kind::Delim(':')
        && name != "--")
        .then(|| (colon.bytes.start, name.clone()))
}

pub(crate) fn normalize_unmanaged_value(value: &str) -> String {
    let mut output = String::with_capacity(value.len());
    let mut token = String::new();
    let mut quote = None;
    let mut escaped = false;
    let flush = |token: &mut String, output: &mut String| {
        if token.is_empty() {
            return;
        }
        output.push_str(&normalize_dynamic_value(token));
        token.clear();
    };
    for character in value.chars() {
        if escaped {
            if quote.is_some() {
                output.push(character);
            } else {
                token.push(character);
            }
            escaped = false;
            continue;
        }
        if character == '\\' {
            if quote.is_some() {
                output.push(character);
            } else {
                token.push(character);
            }
            escaped = true;
            continue;
        }
        if let Some(current_quote) = quote {
            output.push(character);
            if character == current_quote {
                quote = None;
            }
            continue;
        }
        if matches!(character, '\'' | '"') {
            flush(&mut token, &mut output);
            quote = Some(character);
            output.push(character);
        } else if character == '|' {
            flush(&mut token, &mut output);
            output.push(' ');
        } else if character.is_ascii_whitespace() || matches!(character, '(' | ')' | ',' | '/') {
            flush(&mut token, &mut output);
            output.push(character);
        } else {
            token.push(character);
        }
    }
    flush(&mut token, &mut output);
    output
}

/// Normalize actual math component values, leaving strings, comments and URLs opaque.
pub(crate) fn normalize_css_math_functions(source: &str) -> String {
    let tokens = tokenize_css_syntax(source);
    let mut output = String::with_capacity(source.len());
    let mut copied = 0;
    let mut index = 0;
    while let Some(token) = tokens.get(index) {
        if let Kind::Function(name) = &token.kind
            && let Some(close) = token.close
        {
            if name.eq_ignore_ascii_case("url") {
                index = close + 1;
                continue;
            }
            let start = token.bytes.end;
            let end = tokens[close].bytes.start;
            let inner = normalize_css_math_functions(&source[start..end]);
            let inner = if ["calc", "min", "max", "clamp"]
                .iter()
                .any(|n| name.eq_ignore_ascii_case(n))
            {
                normalize_math_expression(&inner)
            } else {
                inner
            };
            output.push_str(&source[copied..start]);
            output.push_str(&inner);
            copied = end;
            index = close + 1;
        } else {
            index += 1;
        }
    }
    output.push_str(&source[copied..]);
    output
}

/// CSS token boundaries protect exponent signs and escaped/quoted identifiers.
/// Signed adjacent numbers and numeric subtraction within compact dimensions
/// are the two deliberate extensions to native CSS tokenization.
fn normalize_math_expression(source: &str) -> String {
    let tokens = tokenize_css_syntax(source);
    let mut edits: Vec<(std::ops::Range<usize>, String)> = Vec::new();
    let mut operand = false;
    let mut index = 0;
    while let Some(token) = tokens.get(index) {
        let raw = &source[token.bytes.clone()];
        if let Some(close) = token.close {
            // Nested parentheses are math; function payloads were handled by
            // the component-value walker (var names/fallbacks are not math).
            if token.kind == Kind::Delim('(') {
                let range = token.bytes.end..tokens[close].bytes.start;
                edits.push((range.clone(), normalize_math_expression(&source[range])));
            }
            operand = true;
            index = close + 1;
            continue;
        }
        match &token.kind {
            Kind::Number(number) | Kind::Dimension(number, _) | Kind::Percentage(number) => {
                if operand && raw.starts_with(['+', '-']) {
                    edits.push((
                        token.bytes.start..token.bytes.start + 1,
                        format!(" {} ", &raw[..1]),
                    ));
                }
                if matches!(token.kind, Kind::Dimension(_, _)) && !raw.contains('\\') {
                    // `1px-2px` lexes as one dimension in native CSS. Only a
                    // minus followed by a numeric operand is Master subtraction.
                    if let Some(at) =
                        raw[number.len()..]
                            .match_indices('-')
                            .find_map(|(offset, _)| {
                                let at = number.len() + offset;
                                let next = raw.as_bytes().get(at + 1);
                                (next.is_none()
                                    && tokens.get(index + 1).is_some_and(|next| {
                                        next.bytes.start == token.bytes.end
                                            && matches!(
                                                next.kind,
                                                Kind::Number(_)
                                                    | Kind::Dimension(_, _)
                                                    | Kind::Percentage(_)
                                            )
                                    })
                                    || next.is_some_and(u8::is_ascii_digit)
                                    || next == Some(&b'.')
                                        && raw
                                            .as_bytes()
                                            .get(at + 2)
                                            .is_some_and(u8::is_ascii_digit))
                                .then_some(at)
                            })
                    {
                        // Re-tokenize the remaining numeric expression so a later
                        // exponent sign never becomes another subtraction operator.
                        edits.push((
                            token.bytes.start + at..token.bytes.end,
                            format!(" - {}", normalize_math_expression(&raw[at + 1..])),
                        ));
                    }
                }
                operand = true;
            }
            Kind::Delim(op @ ('+' | '-' | '*' | '/')) if operand => {
                edits.push((token.bytes.clone(), format!(" {op} ")));
                operand = false;
            }
            Kind::Delim(',') => {
                edits.push((token.bytes.clone(), ", ".into()));
                operand = false;
            }
            Kind::Ident(_) => operand = true,
            _ => operand = false,
        }
        index += 1;
    }
    // Expand operator edits across adjacent whitespace, never across comments.
    // Disjoint byte ranges make normalization idempotent without reserializing literals.
    for (range, replacement) in &mut edits {
        if replacement.starts_with(' ') || replacement.starts_with(',') {
            if replacement.starts_with(' ') {
                while range.start > 0 && source.as_bytes()[range.start - 1].is_ascii_whitespace() {
                    range.start -= 1;
                }
            }
            while range.end < source.len() && source.as_bytes()[range.end].is_ascii_whitespace() {
                range.end += 1;
            }
        }
    }
    let mut output = String::with_capacity(source.len() + edits.len() * 2);
    let mut copied = 0;
    for (range, replacement) in edits {
        if range.start < copied {
            continue;
        }
        output.push_str(&source[copied..range.start]);
        output.push_str(&replacement);
        copied = range.end;
    }
    output.push_str(&source[copied..]);
    output
}

pub(crate) fn find_matching_parenthesis(source: &str, open: usize) -> Option<usize> {
    let tail = &source[open..];
    let tokens = tokenize_css_syntax(tail);
    let first = tokens.first()?;
    (first.bytes.start == 0 && first.kind == Kind::Delim('(')).then_some(())?;
    Some(open + tokens.get(first.close?)?.bytes.start)
}
