use mastercss_lexer::{CssSyntaxKind as Kind, collect_css_syntax_statements, tokenize_css_syntax};

#[test]
fn numeric_components_keep_signs_exponents_units_and_identifier_boundaries() {
    let source = r"+.5 -1 1e2 1E-2ms -.5s 2% 1\73  \31 fade - @1fade 1/**/s";
    let tokens = tokenize_css_syntax(source);
    assert_eq!(
        tokenize_css_syntax(r"1\73 \31 fade")[0].kind,
        Kind::Dimension("1", "s1fade".into())
    );
    assert_eq!(tokens[0].kind, Kind::Number("+.5"));
    assert_eq!(tokens[1].kind, Kind::Number("-1"));
    assert_eq!(tokens[2].kind, Kind::Number("1e2"));
    assert_eq!(tokens[3].kind, Kind::Dimension("1E-2", "ms".into()));
    assert_eq!(tokens[4].kind, Kind::Dimension("-.5", "s".into()));
    assert_eq!(tokens[5].kind, Kind::Percentage("2"));
    assert_eq!(tokens[6].kind, Kind::Dimension("1", "s".into()));
    assert_eq!(tokens[7].kind, Kind::Ident("1fade".into()));
    assert_eq!(tokens[8].kind, Kind::Delim('-'));
    assert_eq!(tokens[9].kind, Kind::Delim('@'));
    assert_eq!(tokens[10].kind, Kind::Dimension("1", "fade".into()));
    assert_eq!(tokens[11].kind, Kind::Number("1"));
    assert_eq!(tokens[12].kind, Kind::Ident("s".into()));
    for token in tokens {
        assert!(source.get(token.bytes).is_some());
    }
}

#[test]
fn names_and_strings_decode_css_escapes_without_merging_comment_separated_tokens() {
    let tokens = tokenize_css_syntax(r#"f\61 de "f\61 de" \31 fade anima/**/tion"#);
    let values = tokens
        .iter()
        .map(|token| match &token.kind {
            Kind::Ident(name) | Kind::String(name) => name.as_ref(),
            _ => "other",
        })
        .collect::<Vec<_>>();
    assert_eq!(values, ["fade", "fade", "1fade", "anima", "tion"]);
}

#[test]
fn balanced_components_keep_custom_values_and_feature_queries_out_of_declarations() {
    let source = r#"@supports (animation:fade){.x{--recipe:{animation:fade};background:url(";{}");animation:fade 1s}}"#;
    let tokens = tokenize_css_syntax(source);
    let statements = collect_css_syntax_statements(&tokens);
    let properties = statements
        .iter()
        .filter(|statement| statement.declaration)
        .map(|statement| match &tokens[statement.tokens.start].kind {
            Kind::Ident(name) => name.as_ref(),
            _ => unreachable!(),
        })
        .collect::<Vec<_>>();
    assert_eq!(properties, ["--recipe", "background", "animation"]);
    assert_eq!(
        statements
            .iter()
            .filter(|statement| statement.has_block)
            .count(),
        2
    );
}

#[test]
fn unicode_bytes_and_deep_blocks_do_not_recurse_on_the_call_stack() {
    let source = format!(
        "{}😀{{animation:fade}}{}",
        "@media all{".repeat(2000),
        "}".repeat(2000)
    );
    let tokens = tokenize_css_syntax(&source);
    for token in &tokens {
        assert!(source.get(token.bytes.clone()).is_some());
    }
    let statements = collect_css_syntax_statements(&tokens);
    assert_eq!(statements.iter().filter(|s| s.declaration).count(), 1);
}
