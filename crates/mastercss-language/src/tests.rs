use super::*;
use mastercss_lexer::collect_class_list_cursor_ranges;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LexerParityCorpus {
    parser_cases: Vec<LexerParityCase>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LexerParityCase {
    source_id: String,
    kind: String,
    input: String,
}

fn token_views(
    source: &str,
    tokens: &[SemanticTokenInputIr],
) -> Vec<(String, String, Vec<String>)> {
    tokens
        .iter()
        .map(|token| {
            (
                source_slice(
                    source,
                    &SourceRange {
                        start: token.start,
                        end: token.end,
                    },
                )
                .unwrap()
                .to_owned(),
                token.token_type.clone(),
                token.modifiers.clone(),
            )
        })
        .collect()
}

#[test]
fn executes_rc87_language_lexer_parity_corpus() {
    let corpus: LexerParityCorpus =
        serde_json::from_str(include_str!("../../../parity/rust-semantic-corpus.json")).unwrap();
    let source_ids = [
        "rc87-56bd470c266dafff",
        "rc87-51f771f5b7ef1697",
        "rc87-1e55f6831835ae55",
        "rc87-3b3607e8b4b583a3",
        "rc87-58dfe44e344938aa",
        "rc87-116f378a8315c994",
        "rc87-377b579d44d48303",
        "rc87-26f2db55b217f0d5",
        "rc87-bcbede53a81f0bc5",
        "rc87-eb118a232c54e6de",
        "rc87-af4d2924300d54db",
    ];
    let session = LanguageSession::create(include_str!(
        "../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    let mut executed = 0;
    for case in corpus
        .parser_cases
        .into_iter()
        .filter(|case| case.kind == "lexer" && source_ids.contains(&case.source_id.as_str()))
    {
        executed += 1;
        match case.source_id.as_str() {
            "rc87-56bd470c266dafff" => assert_eq!(
                collect_class_list_cursor_ranges(&case.input),
                [
                    SourceRange { start: 0, end: 1 },
                    SourceRange { start: 1, end: 1 },
                    SourceRange { start: 2, end: 2 },
                    SourceRange { start: 3, end: 4 },
                    SourceRange { start: 4, end: 4 },
                    SourceRange { start: 5, end: 5 },
                ]
            ),
            "rc87-51f771f5b7ef1697" => {
                let mut tokens = Vec::new();
                push_value_semantic_tokens(&mut tokens, &case.input, 0, &HashSet::new());
                assert_eq!(
                    token_views(&case.input, &tokens)
                        .into_iter()
                        .map(|(text, token_type, _)| (text, token_type))
                        .collect::<Vec<_>>(),
                    [
                        ("12".into(), "number".into()),
                        ("px".into(), "enumMember".into()),
                        ("/".into(), "operator".into()),
                        ("$space".into(), "variable".into()),
                        ("url".into(), "function".into()),
                        ("(".into(), "operator".into()),
                        ("\"".into(), "string".into()),
                        ("/a;b.png".into(), "string".into()),
                        ("\"".into(), "string".into()),
                        (")".into(), "operator".into()),
                        ("!".into(), "operator".into()),
                    ]
                );
                assert!(
                    tokens
                        .last()
                        .unwrap()
                        .modifiers
                        .contains(&"important".into())
                );
            }
            "rc87-1e55f6831835ae55" => {
                let mut tokens = Vec::new();
                push_value_semantic_tokens(&mut tokens, &case.input, 0, &HashSet::new());
                assert_eq!(
                    token_views(&case.input, &tokens)
                        .into_iter()
                        .map(|(text, _, _)| text)
                        .collect::<Vec<_>>(),
                    [
                        "--value", "(", ")", "calc", "(", "--value", "(", ")", "*", "-", "1", ")"
                    ]
                );
            }
            "rc87-3b3607e8b4b583a3" => {
                let mut tokens = Vec::new();
                push_query_semantic_tokens(&mut tokens, &case.input[..8], 0);
                push_state_semantic_tokens(&mut tokens, &case.input[8..], 8);
                assert_eq!(
                    token_views(&case.input, &tokens)
                        .into_iter()
                        .map(|(text, _, _)| text)
                        .collect::<Vec<_>>(),
                    ["@sm", ">=", "640", ":", "hover", ">", ".", "item"]
                );
            }
            "rc87-58dfe44e344938aa" => {
                let state_start = case.input.find('_').unwrap();
                let mut tokens = Vec::new();
                push_query_semantic_tokens(&mut tokens, &case.input[..state_start], 0);
                push_state_semantic_tokens(
                    &mut tokens,
                    &case.input[state_start..],
                    state_start as u32,
                );
                assert_eq!(
                    token_views(&case.input, &tokens)
                        .into_iter()
                        .map(|(text, _, _)| text)
                        .collect::<Vec<_>>(),
                    [
                        "@media", "(", "pointer", ":", "coarse", ")", ",", "screen", "_", ":",
                        "is", "(", ".", "active", ",", "#", "target", ",", "button", ")"
                    ]
                );
            }
            "rc87-116f378a8315c994" => {
                let mut tokens = Vec::new();
                push_query_semantic_tokens(&mut tokens, &case.input, 0);
                assert_eq!(
                    token_views(&case.input, &tokens)
                        .into_iter()
                        .map(|(text, _, _)| text)
                        .collect::<Vec<_>>(),
                    ["@", "sm", "&", "<=", "md"]
                );
            }
            "rc87-377b579d44d48303" => {
                let mut tokens = Vec::new();
                session
                    .push_class_semantic_tokens(&case.input, 0, &mut tokens)
                    .unwrap();
                assert_eq!(
                    token_views(&case.input, &tokens)
                        .into_iter()
                        .map(|(text, _, _)| text)
                        .collect::<Vec<_>>(),
                    ["{", "fg", ":", "red", ";", "bg", ":", "blue", "}"]
                );
            }
            "rc87-26f2db55b217f0d5" => {
                let mut tokens = Vec::new();
                session
                    .push_class_semantic_tokens(&case.input, 0, &mut tokens)
                    .unwrap();
                let views = token_views(&case.input, &tokens);
                assert_eq!(
                    views
                        .iter()
                        .map(|(text, _, _)| text.as_str())
                        .collect::<Vec<_>>(),
                    [
                        "{", "fg", ":", "red", ";", "block", "}", ">", "li", ":", "hover", "@sm"
                    ]
                );
                assert!(
                    views
                        .iter()
                        .any(|(_, _, modifiers)| modifiers.contains(&"selectorCombinator".into()))
                );
            }
            "rc87-bcbede53a81f0bc5" => {
                let mut tokens = Vec::new();
                session
                    .push_class_semantic_tokens(&case.input, 0, &mut tokens)
                    .unwrap();
                assert_eq!(
                    token_views(&case.input, &tokens)
                        .iter()
                        .map(|(text, _, _)| text.as_str())
                        .collect::<Vec<_>>(),
                    ["{", "block", "}", "@sm"]
                );
            }
            "rc87-eb118a232c54e6de" => {
                let mut tokens = Vec::new();
                session
                    .push_class_semantic_tokens(&case.input, 0, &mut tokens)
                    .unwrap();
                assert_eq!(
                    token_views(&case.input, &tokens)
                        .iter()
                        .map(|(text, _, _)| text.as_str())
                        .collect::<Vec<_>>(),
                    ["{", "fg", ":", "red", ";", "bg", ":", "blue"]
                );
            }
            "rc87-af4d2924300d54db" => {
                let mut tokens = Vec::new();
                session
                    .push_class_semantic_tokens(&case.input, 0, &mut tokens)
                    .unwrap();
                assert_eq!(
                    token_views(&case.input, &tokens)
                        .iter()
                        .map(|(text, _, _)| text.as_str())
                        .collect::<Vec<_>>(),
                    ["fg", ":", "red", ";", "bg", ":", "blue"]
                );
            }
            source_id => panic!("unhandled language-owned lexer case {source_id}"),
        }
    }
    assert_eq!(executed, 11);
}

#[test]
fn keeps_class_positions_and_semantic_tokens_in_utf16() {
    let source = "😀 <div class=\"fg:red  m:1x\">\r\nnext</div>";
    let class_start = source
        .encode_utf16()
        .position(|unit| unit == 'f' as u16)
        .unwrap() as u32;
    let class_end = class_start + "fg:red  m:1x".encode_utf16().count() as u32;
    let class_positions = collect_class_positions(
        source,
        &[ClassListContextIr {
            start: class_start,
            end: class_end,
            unescape: Vec::new(),
        }],
    )
    .unwrap();
    let semantic_token_data = encode_semantic_tokens(
        source,
        &[
            SemanticTokenInputIr {
                start: class_start,
                end: class_start + 6,
                token_type: "property".into(),
                modifiers: vec!["declaration".into()],
            },
            SemanticTokenInputIr {
                start: class_start + 8,
                end: class_end,
                token_type: "variable".into(),
                modifiers: Vec::new(),
            },
        ],
    );
    assert_eq!(class_positions[0].token, "fg:red");
    assert_eq!(class_positions[1].token, "m:1x");
    assert_eq!(
        semantic_token_data,
        [0, class_start, 6, 2, 1, 0, 8, 4, 3, 0]
    );
}

#[test]
fn treats_plaintext_as_a_class_list_and_skips_markup_comments() {
    let class_list = "fg:brand:hover@sm {bg:blue;fg:white}";
    let contexts = collect_document_contexts(
        class_list,
        "plaintext",
        &LanguageDocumentSettingsIr::default(),
    );
    assert_eq!(
        collect_class_positions(class_list, &contexts)
            .unwrap()
            .iter()
            .map(|position| position.token.as_str())
            .collect::<Vec<_>>(),
        ["fg:brand:hover@sm", "{bg:blue;fg:white}"]
    );

    let html = "<!-- <div class=\"fg:red\"></div> --><div class=\"fg:blue\"></div>";
    let contexts = collect_document_contexts(html, "html", &LanguageDocumentSettingsIr::default());
    assert_eq!(
        collect_class_positions(html, &contexts)
            .unwrap()
            .iter()
            .map(|position| position.token.as_str())
            .collect::<Vec<_>>(),
        ["fg:blue"]
    );
}

#[test]
fn applies_document_context_settings_in_rust() {
    let markup = r#"<div data-class="fg:red"></div>"#;
    let contexts = collect_document_contexts(
        markup,
        "html",
        &LanguageDocumentSettingsIr {
            class_attributes: vec!["data-class".into()],
            ..LanguageDocumentSettingsIr::default()
        },
    );
    assert_eq!(
        collect_class_positions(markup, &contexts)
            .unwrap()
            .iter()
            .map(|position| position.token.as_str())
            .collect::<Vec<_>>(),
        ["fg:red"]
    );

    let script = r#"twMerge("fg:blue"); const styles = "block";"#;
    let contexts = collect_document_contexts(
        script,
        "typescript",
        &LanguageDocumentSettingsIr {
            class_functions: vec!["twMerge".into()],
            class_declarations: vec!["const styles".into()],
            ..LanguageDocumentSettingsIr::default()
        },
    );
    assert_eq!(
        collect_class_positions(script, &contexts)
            .unwrap()
            .iter()
            .map(|position| position.token.as_str())
            .collect::<Vec<_>>(),
        ["fg:blue", "block"]
    );
}

#[test]
fn tokenizes_group_terminators_and_selector_combinators_in_rust() {
    let session = LanguageSession::create(
        r#"{
              "version":1,
              "utilities":[
                {
                  "id":"block",
                  "type":-1,
                  "emit":{"type":"static","rules":[{"declarations":{"display":"block"}}]},
                  "matchers":[{"type":"static","name":"block"}]
                },
                {
                  "id":"foreground-color",
                  "type":0,
                  "emit":{"type":"property","property":"color"},
                  "matchers":[{"type":"key","keys":["fg"]}]
                }
              ]
            }"#,
    )
    .unwrap();
    let source = "<div class=\"{fg:red;block}>li:hover@sm\"></div>";
    let result = session
        .analyze_document(&AnalyzeDocumentRequestIr {
            source: source.into(),
            language_id: "html".into(),
            host_ranges: Vec::new(),
            settings: LanguageDocumentSettingsIr::default(),
        })
        .unwrap();
    assert!(result.semantic_tokens.iter().any(|token| {
        token
            .modifiers
            .iter()
            .any(|modifier| modifier == "declarationTerminator")
    }));
    assert!(result.semantic_tokens.iter().any(|token| {
        token
            .modifiers
            .iter()
            .any(|modifier| modifier == "selectorCombinator")
    }));
    assert!(result.semantic_tokens.iter().any(|token| {
        token.token_type == "property"
            && token.modifiers.is_empty()
            && source_slice(
                source,
                &SourceRange {
                    start: token.start,
                    end: token.end,
                },
            ) == Some("fg")
    }));
}

#[test]
fn skips_overlapping_and_multiline_tokens() {
    let source = "a\nb";
    assert_eq!(
        encode_semantic_tokens(
            source,
            &[
                SemanticTokenInputIr {
                    start: 0,
                    end: 1,
                    token_type: "class".into(),
                    modifiers: Vec::new(),
                },
                SemanticTokenInputIr {
                    start: 0,
                    end: 2,
                    token_type: "enumMember".into(),
                    modifiers: Vec::new(),
                },
                SemanticTokenInputIr {
                    start: 2,
                    end: 3,
                    token_type: "property".into(),
                    modifiers: Vec::new(),
                },
            ]
        ),
        [0, 0, 1, 0, 0, 1, 0, 1, 2, 0]
    );
}

#[test]
fn batches_manifest_driven_class_semantics() {
    let mut session = LanguageSession::create(
            r#"{
              "version":1,
              "variables":{"spacing":[{"key":"md","type":"number","value":"1rem","numeric":{"value":1,"unit":"rem"}}]},
              "utilities":[
                {
                  "id":"card",
                  "name":"card",
                  "type":-2,
                  "layer":"components",
                  "emit":{"type":"static","rules":[{"declarations":{"display":"block"}}]},
                  "matchers":[{"type":"static","name":"card"}]
                },
                {
                  "id":"width",
                  "type":0,
                  "variableAliasRefs":["~spacing"],
                  "emit":{"type":"property","property":"width"},
                  "matchers":[{"type":"key","keys":["w"]}]
                }
              ]
            }"#,
        )
        .unwrap();
    let batch = session
        .classify_class_names(["card:hover", "w:10px", "w:md", "unknown"], None)
        .unwrap();
    assert_eq!(batch.version, LANGUAGE_BATCH_VERSION);
    assert_eq!(
        batch.classes[0].kind,
        mastercss_engine::ClassSemanticKind::Component
    );
    assert_eq!(batch.classes[0].state_token.as_deref(), Some(":hover"));
    assert_eq!(batch.classes[1].key_token.as_deref(), Some("w:"));
    assert_eq!(batch.classes[1].value_token.as_deref(), Some("10px"));
    assert_eq!(batch.variable_names, ["spacing-md"]);
    assert_eq!(
        batch.classes[3].kind,
        mastercss_engine::ClassSemanticKind::Unknown
    );
}

#[test]
fn owns_mdn_and_negative_completion_candidates_in_rust() {
    let session = LanguageSession::create(
            r#"{
              "version":1,
              "variables":{"spacing":[{"key":"md","type":"number","value":"1rem","numeric":{"value":1,"unit":"rem"}}]},
              "utilities":[
                {
                  "id":"width",
                  "type":0,
                  "variableAliasRefs":["~spacing"],
                  "emit":{"type":"property","property":"width"},
                  "matchers":[{"type":"key","keys":["w"]}]
                }
              ]
            }"#,
        )
        .unwrap();
    let entries = session.completion_index().unwrap().class_entries;

    assert!(entries.iter().any(|entry| {
        entry.label == ":has()" && entry.sort_text.as_deref() == Some("yyyhas()")
    }));
    assert!(entries.iter().any(|entry| {
        entry.label == "display:block"
            && entry.detail.as_deref() == Some("display: block")
            && entry.sort_text.as_deref() == Some("cccccblock")
    }));
    assert!(entries.iter().any(|entry| entry.label == "w:-md"));
}

#[test]
fn commits_only_host_supported_native_class_semantics() {
    let mut session = LanguageSession::create(r#"{"version":1,"utilities":[]}"#).unwrap();
    let class_names = ["display:block", "made-up:nope"];
    let candidates = session.native_declaration_candidates(class_names).unwrap();
    assert_eq!(candidates.len(), 2);
    let batch = session
        .classify_class_names(class_names, Some(&[true, false]))
        .unwrap();
    assert_eq!(
        batch.classes[0].kind,
        mastercss_engine::ClassSemanticKind::Declaration
    );
    assert_eq!(
        batch.classes[1].kind,
        mastercss_engine::ClassSemanticKind::Unknown
    );
    assert_eq!(
        session
            .inspect_class_name("display:block", None, None)
            .unwrap()
            .kind,
        ClassSemanticKind::Declaration
    );
    assert_eq!(
        session
            .inspect_class_name("made-up:nope", None, None)
            .unwrap()
            .kind,
        ClassSemanticKind::Unknown
    );
}

#[test]
fn renders_isolated_hover_inspection_css() {
    let session = LanguageSession::create(
        r#"{
              "version":1,
              "settings":{"modeTrigger":"class"},
              "variables":{"color":[{"key":"brand","value":"oklch(50% .1 20)"}]},
              "utilities":[
                {
                  "id":"card",
                  "name":"card",
                  "type":-2,
                  "layer":"components",
                  "emit":{"type":"static","rules":[{"declarations":{"display":"block"}}]},
                  "matchers":[{"type":"static","name":"card"}]
                },
                {
                  "id":"foreground-color",
                  "type":0,
                  "variableAliases":[["brand","color-brand"]],
                  "emit":{"type":"property","property":"color"},
                  "matchers":[{"type":"variable","keys":["fg"]}]
                }
              ]
            }"#,
    )
    .unwrap();
    let inspection = session
        .inspect_class_name("card:hover", None, None)
        .unwrap();
    assert_eq!(inspection.version, LANGUAGE_BATCH_VERSION);
    assert!(inspection.valid);
    assert_eq!(inspection.kind, ClassSemanticKind::Component);
    assert_eq!(inspection.base, "card");
    assert_eq!(inspection.suffix, ":hover");
    assert_eq!(inspection.state_token.as_deref(), Some(":hover"));
    assert_eq!(inspection.rules.len(), 1);
    assert_eq!(
        inspection.text,
        "@layer components{.card\\:hover:hover{display:block}}"
    );
    let forced_mode = session
        .inspect_class_name("card", None, Some("dark"))
        .unwrap();
    assert_eq!(
        forced_mode.text,
        "@layer components{.dark .card{display:block}}"
    );
    let variable = session
        .inspect_class_name("fg:brand:hover", None, None)
        .unwrap();
    assert_eq!(variable.base, "fg:brand");
    assert_eq!(variable.suffix, ":hover");
    assert_eq!(variable.key.as_deref(), Some("fg"));
    assert_eq!(variable.value.as_deref(), Some("brand"));
    assert_eq!(variable.variables.len(), 1);
    assert_eq!(variable.variables[0].key, "brand");
    assert_eq!(variable.variables[0].variable.name, "color-brand");
    assert_eq!(
        variable.variables[0].variable.value,
        Some(serde_json::Value::String("oklch(50% .1 20)".into()))
    );
    let completion_index = session.completion_index().unwrap();
    assert_eq!(completion_index.version, LANGUAGE_BATCH_VERSION);
    assert!(completion_index.class_entries.iter().any(|entry| {
        entry.label == "card"
            && entry.kind == LanguageCompletionKind::Value
            && entry.detail.as_deref() == Some("component")
            && entry.documentation_text.as_deref()
                == Some("@layer components{.card{display:block}}")
    }));
    assert!(completion_index.class_entries.iter().any(|entry| {
        entry.label == "filter:blur()"
            && entry.kind == LanguageCompletionKind::Function
            && entry.detail.as_deref() == Some("filter: blur()")
    }));
    assert_eq!(
        session
            .color_presentation("rgb(0|0|0)")
            .unwrap()
            .source_format,
        Some(LanguageColorFormatIr {
            syntax: "rgb".into(),
            space: None,
        })
    );
    assert_eq!(
        session
            .color_presentation("brand/.5")
            .unwrap()
            .source_format,
        Some(LanguageColorFormatIr {
            syntax: "oklch".into(),
            space: None,
        })
    );
    let color_tokens = session
        .color_tokens(&[
            LanguageColorCandidateInputIr {
                class_name: "fg:brand/.5".into(),
                start: 2,
            },
            LanguageColorCandidateInputIr {
                class_name: "fg:linear-gradient(#000,brand)".into(),
                start: 20,
            },
        ])
        .unwrap();
    assert_eq!(color_tokens.version, LANGUAGE_BATCH_VERSION);
    assert_eq!(
        color_tokens.tokens,
        vec![
            LanguageColorTokenIr {
                range: SourceRange { start: 5, end: 13 },
                expression: LanguageColorExpressionIr::Literal {
                    value: "oklch(50% .1 20)".into(),
                    alpha: Some(0.5),
                },
            },
            LanguageColorTokenIr {
                range: SourceRange { start: 39, end: 43 },
                expression: LanguageColorExpressionIr::Literal {
                    value: "#000".into(),
                    alpha: None,
                },
            },
            LanguageColorTokenIr {
                range: SourceRange { start: 44, end: 49 },
                expression: LanguageColorExpressionIr::Literal {
                    value: "oklch(50% .1 20)".into(),
                    alpha: None,
                },
            },
        ]
    );
    assert!(completion_index.class_entries.iter().any(|entry| {
        entry.label == "fg:"
            && entry.kind == LanguageCompletionKind::Property
            && entry.detail.as_deref() == Some("color")
            && entry.trigger_suggest
    }));
}
