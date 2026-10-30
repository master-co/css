use super::*;
use crate::RawValueCandidateIr;
use mastercss_lexer::{
    CssSyntaxKind as Kind, CssSyntaxStatement, CssSyntaxToken, Utf16Index,
    collect_css_syntax_statements, tokenize_css_syntax,
};

fn range(index: &Utf16Index, start: usize, end: usize) -> SourceRange {
    SourceRange {
        start: index.byte_to_utf16(start).expect("token boundary"),
        end: index.byte_to_utf16(end).expect("token boundary"),
    }
}

fn ancestry(
    source: &str,
    index: &Utf16Index,
    tokens: &[CssSyntaxToken<'_>],
    statements: &[CssSyntaxStatement],
    statement: &CssSyntaxStatement,
) -> Vec<StylesheetAncestor> {
    let mut result = Vec::new();
    let mut parent = statement.parent;
    while let Some(position) = parent {
        let ancestor = &statements[position];
        let items = &tokens[ancestor.tokens.clone()];
        if let (Some(first), Some(last)) = (items.first(), items.last()) {
            let (kind, name, start) = match &first.kind {
                Kind::AtKeyword(name) => {
                    ("at-rule", Some(name.to_ascii_lowercase()), first.bytes.end)
                }
                _ => ("selector", None, first.bytes.start),
            };
            result.push(StylesheetAncestor {
                kind,
                name,
                prelude: source[start..last.bytes.end].trim().into(),
                range: range(index, first.bytes.start, last.bytes.end),
            });
        }
        parent = ancestor.parent;
    }
    result.reverse();
    result
}

pub(super) fn analyze(
    session: &LintSession,
    source: &DesignSystemStylesheet,
    names: &BTreeSet<String>,
    policy: Option<&RawValuePolicy>,
    references: &mut Vec<StylesheetTokenReference>,
    diagnostics: &mut Vec<DesignSystemDiagnostic>,
) {
    let tokens = tokenize_css_syntax(&source.content);
    let statements = collect_css_syntax_statements(&tokens);
    let index = Utf16Index::new(&source.content);
    // inspect_design_system verifies the immutable session before walking sources.
    let families = session
        .engine
        .token_families()
        .expect("active lint session");
    let mut token_backed_properties = BTreeMap::new();
    let mut order = (0..statements.len())
        .filter(|position| statements[*position].declaration)
        .collect::<Vec<_>>();
    order.sort_by_key(|position| tokens[statements[*position].tokens.start].bytes.start);
    for position in order {
        let statement = &statements[position];
        let parents = ancestry(&source.content, &index, &tokens, &statements, statement);
        if parents
            .iter()
            .any(|parent| matches!(parent.name.as_deref(), Some("mixin" | "utility")))
        {
            continue;
        }
        let Kind::Ident(property) = &tokens[statement.tokens.start].kind else {
            continue;
        };
        let property = if property.starts_with("--") {
            property.to_string()
        } else {
            property.to_ascii_lowercase()
        };
        let value_start = statement.tokens.start + 2;
        if value_start >= statement.tokens.end {
            continue;
        }
        let declaration_range = range(
            &index,
            tokens[statement.tokens.start].bytes.start,
            tokens[statement.tokens.end - 1].bytes.end,
        );
        let mut cursor = value_start;
        let mut fallbacks = Vec::new();
        while cursor < statement.tokens.end {
            let token = &tokens[cursor];
            let Some(close) = token.close.filter(|close| *close < statement.tokens.end) else {
                cursor += 1;
                continue;
            };
            if matches!(&token.kind, Kind::Function(name) if name.eq_ignore_ascii_case("url")) {
                cursor = close + 1;
                continue;
            }
            if matches!(&token.kind, Kind::Function(name) if name.eq_ignore_ascii_case("var"))
                && let Some(argument) = tokens.get(cursor + 1)
                && let Kind::Ident(name) = &argument.kind
                && name.starts_with("--")
                && name.len() > 2
                && (cursor + 2 == close
                    || tokens
                        .get(cursor + 2)
                        .is_some_and(|token| token.kind == Kind::Delim(',')))
            {
                let has_fallback = cursor + 2 < close;
                references.push(StylesheetTokenReference {
                    source: source.source.clone(),
                    token: name.to_string(),
                    registered: names.contains(name.as_ref()),
                    range: range(&index, argument.bytes.start, argument.bytes.end),
                    property: property.clone(),
                    declaration_range: declaration_range.clone(),
                    ancestry: parents.clone(),
                    has_fallback,
                    in_fallback: fallbacks
                        .iter()
                        .any(|(start, end)| cursor > *start && cursor < *end),
                    importers: source.importers.clone(),
                });
                if has_fallback {
                    fallbacks.push((cursor + 2, close));
                }
            }
            cursor += 1;
        }
        let Some(policy) = policy else { continue };
        if property.starts_with("--")
            || parents
                .iter()
                .any(|parent| parent.name.as_deref() == Some("theme"))
            || !*token_backed_properties
                .entry(property.clone())
                .or_insert_with(|| session.engine.has_named_tokens_for_property(&property))
        {
            continue;
        }
        let segments = raw_segments(&source.content, &tokens, value_start, statement.tokens.end);
        let candidate = RawValueCandidateIr {
            class_name: String::new(),
            key: property.clone(),
            properties: vec![property.clone()],
            segments,
        };
        if let Some(value) = policy.unapproved_value(&candidate) {
            let mut diagnostic = DesignSystemDiagnostic::new(
                "UNAPPROVED_RAW_VALUE",
                "warning",
                format!(
                    "Raw value {value:?} is not approved for property {property}. Use a token or allow the value explicitly."
                ),
                None,
            );
            diagnostic.source = Some(source.source.clone());
            diagnostic.range = Some(range(
                &index,
                tokens[value_start].bytes.start,
                tokens[statement.tokens.end - 1].bytes.end,
            ));
            diagnostic.data = Map::from_iter([
                ("property".into(), json!(property)),
                ("value".into(), json!(value)),
                (
                    "policy".into(),
                    json!({"rule":"no-unapproved-raw-values", "requireProperties":policy.require_properties}),
                ),
                (
                    "tokenFamilies".into(),
                    json!(
                        families
                            .iter()
                            .filter(|family| family.properties.contains(&property))
                            .collect::<Vec<_>>()
                    ),
                ),
            ]);
            diagnostics.push(diagnostic);
        }
    }
}

/// Native CSS uses whitespace/comma/slash-separated top-level components rather
/// than markup pipes. Function bodies and quoted strings remain indivisible.
fn raw_segments(
    source: &str,
    tokens: &[CssSyntaxToken<'_>],
    start: usize,
    mut end: usize,
) -> Vec<String> {
    if end >= start + 2
        && matches!(&tokens[end - 1].kind, Kind::Ident(name) if name.eq_ignore_ascii_case("important"))
        && tokens[end - 2].kind == Kind::Delim('!')
    {
        end -= 2;
    }
    let mut segments = Vec::new();
    let mut cursor = start;
    while cursor < end {
        if matches!(tokens[cursor].kind, Kind::Delim(',' | '/')) {
            cursor += 1;
            continue;
        }
        let first = cursor;
        let mut last = tokens[cursor]
            .close
            .filter(|close| *close < end)
            .unwrap_or(cursor);
        cursor = last + 1;
        // Adjacent tokens such as #fff form one CSS component.
        while cursor < end
            && !matches!(tokens[cursor].kind, Kind::Delim(',' | '/'))
            && tokens[last].bytes.end == tokens[cursor].bytes.start
        {
            last = tokens[cursor]
                .close
                .filter(|close| *close < end)
                .unwrap_or(cursor);
            cursor = last + 1;
        }
        if matches!(&tokens[first].kind, Kind::Function(name) if name.eq_ignore_ascii_case("var"))
            && tokens[first].close == Some(last)
        {
            continue;
        }
        segments.push(source[tokens[first].bytes.start..tokens[last].bytes.end].to_owned());
    }
    segments
}
