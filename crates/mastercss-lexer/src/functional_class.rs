use crate::{CssSyntaxKind as Kind, tokenize_css_syntax};
use std::ops::Range;

/// A functional class head, before selectors, conditions and importance.
/// Ranges are byte offsets into the original class; values remain authored CSS.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FunctionalClassHead {
    pub name: String,
    pub name_range: Range<usize>,
    pub arguments: Vec<Range<usize>>,
    pub arguments_range: Range<usize>,
    pub suffix_start: usize,
}

pub fn parse_functional_class(source: &str) -> Option<Result<FunctionalClassHead, String>> {
    let tokens = tokenize_css_syntax(source);
    let first = tokens.first()?;
    let Kind::Function(name) = &first.kind else {
        return None;
    };
    let Some(close) = first.close else {
        return Some(Err("Unclosed mixin argument list".into()));
    };
    let suffix_start = tokens[close].bytes.end;
    let tail = &source[suffix_start..];
    if !tail.is_empty() && !tail.starts_with(['!', '*', '>', '+', '~', ':', '[', '@', '_', '.']) {
        return Some(Err("Invalid suffix after mixin arguments".into()));
    }
    let arguments_range = first.bytes.end..tokens[close].bytes.start;
    let mut arguments = Vec::new();
    if !source[arguments_range.clone()].trim().is_empty() {
        let mut start = arguments_range.start;
        let mut index = 1;
        while index < close {
            let token = &tokens[index];
            if token.kind == Kind::Delim(',') {
                arguments.push(start..token.bytes.start);
                start = token.bytes.end;
            } else if let Some(end) = token.close {
                index = end;
            }
            index += 1;
        }
        arguments.push(start..arguments_range.end);
        if arguments
            .iter()
            .any(|range| source[range.clone()].trim().is_empty())
        {
            return Some(Err("Empty mixin argument".into()));
        }
    }
    Some(Ok(FunctionalClassHead {
        name: name.to_string(),
        name_range: first.bytes.start..first.bytes.end - 1,
        arguments,
        arguments_range,
        suffix_start,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn preserves_argument_boundaries_and_external_modifiers() {
        let source = r#"paint(rgb(1,2,3),"a,\"b",calc(2*3)):hover@sm!"#;
        let head = parse_functional_class(source).unwrap().unwrap();
        assert_eq!(head.name, "paint");
        assert_eq!(
            head.arguments
                .iter()
                .map(|range| &source[range.clone()])
                .collect::<Vec<_>>(),
            ["rgb(1,2,3)", r#""a,\"b""#, "calc(2*3)"]
        );
        assert_eq!(&source[head.suffix_start..], ":hover@sm!");
        assert!(parse_functional_class("display:block").is_none());
        for invalid in ["x(1", "x(1,,2)", "x(1)more", "x(1))"] {
            assert!(
                parse_functional_class(invalid).unwrap().is_err(),
                "{invalid}"
            );
        }
    }
}
