use crate::source_index::SourceIndex;
use mastercss_lexer::{CssSyntaxKind, collect_css_syntax_statements, tokenize_css_syntax};
use mastercss_schema::CssUtilitySource;

pub(crate) fn collect(source: &str, filename: &str) -> Vec<CssUtilitySource> {
    let index = SourceIndex::new(source);
    let tokens = tokenize_css_syntax(source);
    let statements = collect_css_syntax_statements(&tokens);
    let mut definitions = statements.iter().filter_map(|statement| {
        let prelude = &tokens[statement.tokens.clone()];
        let first = prelude.first()?;
        if !statement.has_block || !matches!(&first.kind, CssSyntaxKind::AtKeyword(name) if name.eq_ignore_ascii_case("utility")) { return None; }
        let start = prelude.get(1)?.bytes.start;
        let end = prelude.last()?.bytes.end;
        let definition = serde_json::Value::Object(crate::pattern::parse_managed_pattern(&source[start..end]).ok()?.definition(mastercss_schema::UtilityLayerName::Utilities));
        Some(CssUtilitySource {
            name: definition["name"].as_str()?.to_owned(),
            identity: crate::utility_definitions::identity(&definition),
            replaced_by: None,
            source: index.reference(filename, start, end)?,
        })
    }).collect::<Vec<_>>();
    resolve(&mut definitions);
    definitions
}

pub(crate) fn resolve(definitions: &mut [CssUtilitySource]) {
    let mut latest = std::collections::HashMap::new();
    for definition in definitions.iter_mut().rev() {
        let identity = if definition.identity.is_empty() {
            &definition.name
        } else {
            &definition.identity
        };
        definition.replaced_by = latest.get(identity).cloned();
        latest
            .entry(identity.clone())
            .or_insert_with(|| definition.source.clone());
    }
}
