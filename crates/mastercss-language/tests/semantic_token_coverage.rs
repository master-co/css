use mastercss_language::{AnalyzeDocumentRequestIr, LanguageSession};

/// The semantic tokens of one class in an HTML `class` attribute, as `text:type[.modifier]` views.
fn class_tokens(session: &LanguageSession, class_name: &str) -> Vec<String> {
    let source = format!("<a class=\"{class_name}\"></a>");
    let request: AnalyzeDocumentRequestIr = serde_json::from_value(serde_json::json!({
        "source": source,
        "languageId": "html"
    }))
    .unwrap();
    let result = session.analyze_document(&request).unwrap();
    let utf16 = source.encode_utf16().collect::<Vec<_>>();
    result
        .semantic_tokens
        .iter()
        .map(|token| {
            let text =
                String::from_utf16(&utf16[token.start as usize..token.end as usize]).unwrap();
            match token.modifiers.first() {
                Some(modifier) => format!("{text}:{}.{modifier}", token.token_type),
                None => format!("{text}:{}", token.token_type),
            }
        })
        .collect()
}

fn session() -> LanguageSession {
    LanguageSession::create(include_str!(
        "../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap()
}

#[test]
fn every_meaningful_character_of_a_class_is_covered() {
    let session = session();
    for class_name in [
        "(color:#4f46e5)",
        "(color:#123456)",
        "(--progress:40%)",
        "(color:rgb(30|60|90/80%))",
        "(width:calc(100%-2rem))",
        "block@dark@sm",
        "grid@media(width>=40rem)@supports(display:grid)",
        "grid-cols(2)@container(card|width>=40rem)",
        "underline.is\\_active",
        "underline[data-state=':first']:first-child",
        "bg-surface-inset:nth-child(2n+1)",
    ] {
        let source = format!("<a class=\"{class_name}\"></a>");
        let request: AnalyzeDocumentRequestIr = serde_json::from_value(serde_json::json!({
            "source": source,
            "languageId": "html"
        }))
        .unwrap();
        let result = session.analyze_document(&request).unwrap();
        let start = source.find(class_name).unwrap() as u32;
        let mut covered = vec![false; class_name.len()];
        for token in &result.semantic_tokens {
            for index in token.start..token.end {
                covered[(index - start) as usize] = true;
            }
        }
        let gaps = class_name
            .char_indices()
            .filter(|(index, _)| !covered[*index])
            .map(|(_, character)| character)
            .collect::<String>();
        assert_eq!(gaps, "", "{class_name}: {:?}", result.semantic_tokens);
    }
}

#[test]
fn values_keep_hex_colors_percentages_and_signs_whole() {
    let session = session();
    for (class_name, expected) in [
        ("(color:#4f46e5)", "#4f46e5:number"),
        ("(color:#fff)", "#fff:number"),
        ("(--progress:40%)", "%:enumMember.unit"),
        ("(margin:-2rem)", "-2:number"),
        ("(width:calc(100%-2rem))", "-:operator.valueOperator"),
    ] {
        let tokens = class_tokens(&session, class_name);
        assert!(
            tokens.iter().any(|token| token == expected),
            "{class_name}: {tokens:?}"
        );
    }
    let tokens = class_tokens(&session, "(color:#4f46e5)");
    assert!(
        !tokens.iter().any(|token| token.contains("unit")),
        "{tokens:?}"
    );
}

#[test]
fn queries_split_at_each_at_sign_and_name_their_features() {
    let session = session();
    let tokens = class_tokens(&session, "block@dark@sm");
    assert_eq!(
        tokens[1..],
        ["@dark:keyword.query", "@sm:keyword.query"],
        "{tokens:?}"
    );
    let tokens = class_tokens(&session, "grid@media(width>=40rem)@supports(display:grid)");
    for expected in [
        "@supports:keyword.query",
        "display:property.query",
        "width:property.query",
    ] {
        assert!(tokens.iter().any(|token| token == expected), "{tokens:?}");
    }
    let tokens = class_tokens(&session, "grid-cols(2)@container(card|width>=40rem)");
    for expected in [
        "|:operator.query",
        "width:property.query",
        "card:enumMember.query",
    ] {
        assert!(tokens.iter().any(|token| token == expected), "{tokens:?}");
    }
}

#[test]
fn selectors_respect_escapes_combinators_attributes_and_nth_arguments() {
    let session = session();
    let tokens = class_tokens(&session, "underline.is\\_active");
    assert!(
        tokens
            .iter()
            .any(|token| token == "is\\_active:class.selector"),
        "{tokens:?}"
    );
    let tokens = class_tokens(&session, "fg-blue-60:hover_h2");
    assert_eq!(
        tokens[1..],
        [
            "::operator.selector",
            "hover:modifier.pseudoClass",
            "_:operator.selector",
            "h2:type.selector"
        ],
        "{tokens:?}"
    );
    let tokens = class_tokens(&session, "block_.card__title");
    assert!(
        tokens
            .iter()
            .any(|token| token == "card__title:class.selector"),
        "{tokens:?}"
    );
    let tokens = class_tokens(&session, "underline[data-state=':first']:first-child");
    assert_eq!(
        tokens[1..],
        [
            "[:operator.selector",
            "data-state:property.selector",
            "=:operator.selector",
            "':first':string.quoted",
            "]:operator.selector",
            "::operator.selector",
            "first-child:modifier.pseudoClass",
        ],
        "{tokens:?}"
    );
    let tokens = class_tokens(&session, "bg-surface-inset:nth-child(even)");
    assert!(
        tokens.iter().any(|token| token == "even:enumMember"),
        "{tokens:?}"
    );
    let tokens = class_tokens(&session, "bg-surface-inset:nth-child(2n+1)");
    for expected in ["2n:number", "+:operator.valueOperator", "1:number"] {
        assert!(tokens.iter().any(|token| token == expected), "{tokens:?}");
    }
}

#[test]
fn functional_utility_parentheses_read_as_function_punctuation() {
    let tokens = class_tokens(&session(), "b(1)");
    assert_eq!(
        tokens,
        [
            "b:function",
            "(:operator.functionPunctuation",
            "1:number",
            "):operator.functionPunctuation"
        ]
    );
}
