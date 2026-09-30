//! Catalog native custom properties without taking ownership of their CSS.
use mastercss_lexer::{CssSyntaxKind as Kind, collect_css_syntax_statements, tokenize_css_syntax};
use mastercss_schema::NativeTokenDefinition;

pub(crate) fn collect(source: &str, filename: &str) -> Vec<NativeTokenDefinition> {
    let tokens = tokenize_css_syntax(source);
    let statements = collect_css_syntax_statements(&tokens);
    let source_index = crate::source_index::SourceIndex::new(source);
    let mut output = Vec::new();
    for statement in &statements {
        if !statement.declaration || statement.tokens.len() < 2 {
            continue;
        }
        let first = &tokens[statement.tokens.start];
        let Kind::Ident(property) = &first.kind else {
            continue;
        };
        let Some(name) = property.strip_prefix("--").filter(|name| !name.is_empty()) else {
            continue;
        };
        let mut parent = statement.parent;
        let mut path = Vec::new();
        let mut has_selector = false;
        let mut native = true;
        while let Some(index) = parent {
            let ancestor = &statements[index];
            let first = &tokens[ancestor.tokens.start];
            if let Kind::AtKeyword(name) = &first.kind {
                // Descriptors, keyframe locals and unexpanded Master bodies do
                // not establish reusable CSS token definitions.
                if !matches!(
                    name.to_ascii_lowercase().as_str(),
                    "media" | "supports" | "container" | "scope" | "starting-style" | "layer"
                ) {
                    native = false;
                    break;
                }
            } else {
                has_selector = true;
            }
            let end = tokens[ancestor.tokens.end - 1].bytes.end;
            path.push(source[first.bytes.start..end].trim().to_owned());
            parent = ancestor.parent;
        }
        if !native || !has_selector {
            continue;
        }
        path.reverse();
        let start = tokens[statement.tokens.start + 1].bytes.end;
        let end = tokens[statement.tokens.end - 1].bytes.end;
        output.push((
            first.bytes.start,
            NativeTokenDefinition {
                name: name.into(),
                path,
                value: source[start..end].trim().to_owned(),
                source: source_index.reference(filename, first.bytes.start, end),
            },
        ));
    }
    output.sort_by_key(|(start, _)| *start);
    output
        .into_iter()
        .map(|(_, definition)| definition)
        .collect()
}
