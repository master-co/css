use super::*;

struct LexerParityCorpus {
    parser_cases: Vec<LexerParityCase>,
}

struct LexerParityCase {
    source_id: String,
    input: String,
    expected_canonical: String,
}

fn lexer_parity_case(source_id: &str, input: &str, expected_canonical: &str) -> LexerParityCase {
    LexerParityCase {
        source_id: source_id.into(),
        input: input.into(),
        expected_canonical: expected_canonical.into(),
    }
}

fn slice_utf16<'a>(source: &'a str, range: &SourceRange) -> &'a str {
    let start = utf16_to_byte_offset(source, range.start).unwrap();
    let end = utf16_to_byte_offset(source, range.end).unwrap();
    &source[start..end]
}

fn directive_depth(source: &str, range: &SourceRange) -> u32 {
    let end = utf16_to_byte_offset(source, range.start).unwrap();
    let mut depth = 0_u32;
    let mut index = 0;
    while index < end {
        if let Some(skip) = skip_css_string_or_comment(source, index) {
            index = skip.min(end);
            continue;
        }
        let character = source[index..].chars().next().unwrap();
        if character == '{' {
            depth += 1;
        } else if character == '}' {
            depth = depth.saturating_sub(1);
        }
        index += character.len_utf8();
    }
    depth
}

#[test]
fn executes_rc87_lexer_parity_corpus() {
    let corpus_source = include_str!("../../../parity/rust-semantic-corpus.json");
    let corpus = LexerParityCorpus {
        parser_cases: vec![
            lexer_parity_case("rc87-f388e6c161004b97", "  block\tfg:red\nm:1x ", "ranges"),
            lexer_parity_case("rc87-6d5d386f580d29af", "block\u{3000}fg:red", "one token"),
            lexer_parity_case(
                "rc87-167ae2709f22cd6d",
                "content:\\'\\' block|content:\\`\\`",
                "unescaped",
            ),
            lexer_parity_case(
                "rc87-9548ae64df5ed481",
                " block  fg:red\u{3000}m:1x ",
                "ranges",
            ),
            lexer_parity_case(
                "rc87-7de028667721a877",
                "@import url(\"@master/css\") layer(theme);\n.x { content: \"@import url(\\\"ignored\\\");\" }\n@import \"./a;b.css\";",
                "imports",
            ),
            lexer_parity_case("rc87-80cea11f6437844e", "manifest entrypoints", "booleans"),
            lexer_parity_case(
                "rc87-c338962e34e07c1c",
                "@master entry;\n@source \"./x.css\";\n.a{}",
                "\n@source \"./x.css\";\n.a{}",
            ),
            lexer_parity_case(
                "rc87-85fe07eee3ea650e",
                "@master;\n@master global;\n@master shake;\n@master no-shake;\n.a{}",
                "unchanged",
            ),
            lexer_parity_case(
                "rc87-a99556d32ad12a9b",
                ".quoted { content: \"var(--color-blue-60)\"; }\n/* var(--color-red-60) */\n.real { color: var(--color-green-60); }\n.fallback { color: var(--color-brand, var(--color-green-60)); }",
                "references",
            ),
            lexer_parity_case(
                "rc87-4d294d715eb82c2d",
                "--alpha(var(--color-brand, \"a)b\") / calc(100% - 20% /* ) */))",
                "balanced",
            ),
            lexer_parity_case(
                "rc87-9ccb1609c26acb3a",
                ".quoted { content: \"var(--color-blue-60)\"; }\n/* var(--color-red-60) */\n.real { color: var(--color-green-60); }",
                "replaced",
            ),
            lexer_parity_case(
                "rc87-c853daf53b370443",
                "@source \"a;b.css\";\n@theme { --color-primary: red; @keyframes fade { to { opacity: 1; } } }",
                "ranges",
            ),
            lexer_parity_case(
                "rc87-9e23b9ca5eba0b7f",
                "@reference \"./a;b.css\";\n@layer components { .btn { @reference \"./nested.css\"; } }",
                "ranges",
            ),
            lexer_parity_case(
                "rc87-cd1d137ee89e9efb",
                "@layer components { .btn { @compose block; @variant <sm { @compose hidden; } } }",
                "directives",
            ),
            lexer_parity_case(
                "rc87-0ecc38899002a5db",
                ".card { @dark { @compose fg:white; } @light { color: black; } }",
                "variants",
            ),
            lexer_parity_case(
                "rc87-bf007c1edf054a11",
                "@custom-variant motion-safe { @media (prefers-reduced-motion: no-preference) { @slot; } }",
                "directives",
            ),
            lexer_parity_case(
                "rc87-8b8911fa6dc3e148",
                "@components { btn { @compose block; } }",
                "directives",
            ),
            lexer_parity_case(
                "rc87-2f3cc1f8149e5aac",
                "@utility text-<left|center|right> { text-align: --value(); }",
                "none",
            ),
            lexer_parity_case(
                "rc87-0200c9f8cb24fb9e",
                "@theme { --content: \"a;b\"; --root-size: 16 }",
                "declarations",
            ),
            lexer_parity_case(
                "rc87-9e290a26e4a4bcd2",
                "@theme { --color-primary: red; @keyframes fade { to { opacity: 1; } } --duration-fast: 150ms }",
                "declarations",
            ),
            lexer_parity_case("rc87-8825de071b213b2d", "@theme dark", "eof"),
            lexer_parity_case(
                "rc87-a16dfb59baf769b1",
                "font:48px|1col|-1col|-|a b",
                "escaped",
            ),
            lexer_parity_case("rc87-e84fc87f66b88072", "a.b[c]", "a\\.b\\[c\\]"),
        ],
    };
    let mut executed = 0;
    for case in corpus.parser_cases {
        assert!(corpus_source.contains(&format!("\"sourceId\": \"{}\"", case.source_id)));
        assert!(!case.input.is_empty());
        assert!(!case.expected_canonical.is_empty());
        executed += 1;
        match case.source_id.as_str() {
            "rc87-f388e6c161004b97" => {
                let ranges = collect_class_list_token_ranges(&case.input);
                assert_eq!(
                    ranges,
                    [
                        ClassListTokenRange {
                            range: SourceRange { start: 2, end: 7 },
                            token: "block".into()
                        },
                        ClassListTokenRange {
                            range: SourceRange { start: 8, end: 14 },
                            token: "fg:red".into()
                        },
                        ClassListTokenRange {
                            range: SourceRange { start: 15, end: 19 },
                            token: "m:1x".into()
                        },
                    ]
                );
            }
            "rc87-6d5d386f580d29af" => {
                let ranges = collect_class_list_token_ranges(&case.input);
                assert_eq!(ranges.len(), 1);
                assert_eq!(ranges[0].token, "block\u{3000}fg:red");
                assert_eq!(ranges[0].range, SourceRange { start: 0, end: 12 });
            }
            "rc87-167ae2709f22cd6d" => {
                let result = analyze_lexer_batch(&LexerBatchRequestIr {
                    class_lists: vec![
                        LexerClassListInputIr {
                            source: "content:\\'\\' block".into(),
                            unescape: vec!["'".into()],
                        },
                        LexerClassListInputIr {
                            source: "content:\\`\\`".into(),
                            unescape: vec!["`".into()],
                        },
                    ],
                    ..LexerBatchRequestIr::default()
                });
                assert_eq!(result.class_lists[0][0].raw, "content:\\'\\'");
                assert_eq!(result.class_lists[0][0].token, "content:''");
                assert_eq!(result.class_lists[1][0].token, "content:``");
            }
            "rc87-9548ae64df5ed481" => {
                let ranges = collect_class_list_token_ranges(&case.input);
                assert_eq!(ranges[0].range, SourceRange { start: 1, end: 6 });
                assert_eq!(ranges[1].range, SourceRange { start: 8, end: 19 });
                assert_eq!(ranges[1].token, "fg:red\u{3000}m:1x");
            }
            "rc87-7de028667721a877" => {
                let imports = find_css_import_statements(&case.input);
                assert_eq!(imports.len(), 2);
                assert_eq!(
                    imports[0].statement,
                    "@import url(\"@master/css\") layer(theme);"
                );
                assert_eq!(imports[1].statement, "@import \"./a;b.css\";");
                assert_eq!(
                    parse_css_import_source(&imports[0].statement).as_deref(),
                    Some("@master/css")
                );
                assert_eq!(
                    parse_css_import_source(&imports[1].statement).as_deref(),
                    Some("./a;b.css")
                );
            }
            "rc87-80cea11f6437844e" => {
                assert!(has_master_css_manifest_entrypoint("@master entry;"));
                assert!(has_master_css_manifest_entrypoint(
                    "@import \"@master/css\";"
                ));
                assert!(!has_master_css_manifest_entrypoint("@master;"));
                assert!(!has_master_css_manifest_entrypoint("@master global;"));
            }
            "rc87-c338962e34e07c1c" => {
                let source = &case.input;
                assert!(has_master_css_manifest_entrypoint(source));
                assert_eq!(find_master_directive_statements(source)[0].name, "entry");
                assert_eq!(
                    remove_master_directive_statements(source),
                    (case.expected_canonical, true)
                );
            }
            "rc87-85fe07eee3ea650e" => {
                assert!(!has_master_css_manifest_entrypoint(&case.input));
                assert!(find_master_directive_statements(&case.input).is_empty());
                assert_eq!(
                    remove_master_directive_statements(&case.input),
                    (case.input, false)
                );
            }
            "rc87-a99556d32ad12a9b" => {
                assert_eq!(
                    collect_css_variable_references(&case.input),
                    ["color-green-60", "color-brand"]
                );
            }
            "rc87-4d294d715eb82c2d" => {
                let function = read_css_function(&case.input, 0, "--alpha").unwrap();
                assert_eq!(
                    function.body,
                    "var(--color-brand, \"a)b\") / calc(100% - 20% /* ) */)"
                );
                assert_eq!(function.end, 61);
                assert_eq!(function.text, case.input);
            }
            "rc87-9ccb1609c26acb3a" => {
                let output = transform_css_variable_references(&case.input, |name, _| {
                    Ok::<_, ()>(Some(format!("token({name})")))
                })
                .unwrap();
                assert_eq!(
                    output,
                    [
                        ".quoted { content: \"var(--color-blue-60)\"; }",
                        "/* var(--color-red-60) */",
                        ".real { color: token(color-green-60); }",
                    ]
                    .join("\n")
                );
            }
            "rc87-c853daf53b370443" => {
                let ranges = find_css_directive_ranges(&case.input);
                assert_eq!(
                    ranges
                        .iter()
                        .map(|range| range.name.as_str())
                        .collect::<Vec<_>>(),
                    ["source", "theme"]
                );
                assert_eq!(
                    slice_utf16(
                        &case.input,
                        &ranges[0].quoted_string_ranges[0].content_range
                    ),
                    "a;b.css"
                );
                assert!(ranges[1].block_range.is_some());
                assert_eq!(
                    slice_utf16(
                        &case.input,
                        &SourceRange {
                            start: ranges[1].block_range.as_ref().unwrap().start,
                            end: ranges[1].block_range.as_ref().unwrap().start + 1
                        }
                    ),
                    "{"
                );
                assert_eq!(
                    slice_utf16(
                        &case.input,
                        &SourceRange {
                            start: ranges[1].block_range.as_ref().unwrap().end - 1,
                            end: ranges[1].block_range.as_ref().unwrap().end
                        }
                    ),
                    "}"
                );
            }
            "rc87-9e23b9ca5eba0b7f" => {
                let ranges = find_css_directive_ranges(&case.input);
                assert_eq!(
                    ranges
                        .iter()
                        .map(|range| range.name.as_str())
                        .collect::<Vec<_>>(),
                    ["reference", "reference"]
                );
                assert_eq!(directive_depth(&case.input, &ranges[0].range), 0);
                assert_eq!(directive_depth(&case.input, &ranges[1].range), 2);
                assert_eq!(
                    slice_utf16(
                        &case.input,
                        &ranges[0].quoted_string_ranges[0].content_range
                    ),
                    "./a;b.css"
                );
            }
            "rc87-cd1d137ee89e9efb" => {
                let ranges = find_css_directive_ranges(&case.input);
                assert_eq!(
                    ranges
                        .iter()
                        .map(|range| range.name.as_str())
                        .collect::<Vec<_>>(),
                    ["compose", "variant", "compose"]
                );
                assert_eq!(
                    slice_utf16(&case.input, &ranges[1].prelude_range).trim(),
                    "<sm"
                );
                assert_eq!(
                    slice_utf16(&case.input, &ranges[2].prelude_range).trim(),
                    "hidden"
                );
            }
            "rc87-0ecc38899002a5db" => {
                let ranges = find_css_directive_ranges(&case.input);
                assert_eq!(
                    ranges
                        .iter()
                        .map(|range| range.name.as_str())
                        .collect::<Vec<_>>(),
                    ["variant", "compose", "variant"]
                );
                assert!(slice_utf16(&case.input, &ranges[0].range).starts_with("@dark"));
                assert!(slice_utf16(&case.input, &ranges[2].range).starts_with("@light"));
            }
            "rc87-bf007c1edf054a11" => {
                let ranges = find_css_directive_ranges(&case.input);
                assert_eq!(
                    ranges
                        .iter()
                        .map(|range| range.name.as_str())
                        .collect::<Vec<_>>(),
                    ["custom-variant", "slot"]
                );
                assert_eq!(slice_utf16(&case.input, &ranges[1].range), "@slot;");
            }
            "rc87-8b8911fa6dc3e148" => {
                let ranges = find_css_directive_ranges(&case.input);
                assert_eq!(
                    ranges
                        .iter()
                        .map(|range| range.name.as_str())
                        .collect::<Vec<_>>(),
                    ["components", "compose"]
                );
                assert_eq!(
                    slice_utf16(&case.input, &ranges[1].prelude_range).trim(),
                    "block"
                );
            }
            "rc87-2f3cc1f8149e5aac" => {
                assert!(find_css_directive_ranges(&case.input).is_empty())
            }
            "rc87-0200c9f8cb24fb9e" => {
                let start = utf16_len(&case.input[..case.input.find('{').unwrap() + 1]);
                let end = utf16_len(&case.input[..case.input.rfind('}').unwrap()]);
                let ranges = collect_css_declaration_ranges(&case.input, start, end);
                assert_eq!(
                    ranges
                        .iter()
                        .map(|range| slice_utf16(&case.input, &range.property_range))
                        .collect::<Vec<_>>(),
                    ["--content", "--root-size"]
                );
                assert_eq!(slice_utf16(&case.input, &ranges[0].value_range), "\"a;b\"");
                assert!(ranges[0].terminator_range.is_some());
            }
            "rc87-9e290a26e4a4bcd2" => {
                let start = utf16_len(&case.input[..case.input.find('{').unwrap() + 1]);
                let end = utf16_len(&case.input[..case.input.rfind('}').unwrap()]);
                let ranges = collect_css_declaration_ranges(&case.input, start, end);
                assert_eq!(
                    ranges
                        .iter()
                        .map(|range| slice_utf16(&case.input, &range.property_range))
                        .collect::<Vec<_>>(),
                    ["--color-primary", "--duration-fast"]
                );
            }
            "rc87-8825de071b213b2d" => {
                let end = find_css_statement_end(&case.input, "@theme".len());
                assert_eq!(end.end, case.input.len());
                assert_eq!(end.reason, CssStatementEndReason::Eof);
            }
            "rc87-a16dfb59baf769b1" => {
                assert_eq!(
                    ["font:48px", "1col", "-1col", "-", "a b"].map(css_escape),
                    ["font\\:48px", "\\31 col", "-\\31 col", "\\-", "a\\ b"]
                );
            }
            "rc87-e84fc87f66b88072" => {
                assert_eq!(escape_regexp(&case.input), case.expected_canonical)
            }
            source_id => panic!("unhandled rc.87 lexer parity source {source_id}"),
        }
    }
    assert_eq!(executed, 23);
}

#[test]
fn matches_existing_css_escape_examples() {
    assert_eq!(css_escape("font:48px"), "font\\:48px");
    assert_eq!(css_escape("1col"), "\\31 col");
    assert_eq!(css_escape("-1col"), "-\\31 col");
    assert_eq!(css_escape("-"), "\\-");
    assert_eq!(css_escape("a b"), "a\\ b");
}

#[test]
fn class_ranges_use_javascript_utf16_offsets() {
    let ranges = collect_class_list_token_ranges("😀a fg:red\u{3000}m:1x");
    assert_eq!(ranges.len(), 2);
    assert_eq!(ranges[0].range, SourceRange { start: 0, end: 3 });
    assert_eq!(ranges[0].token, "😀a");
    assert_eq!(ranges[1].range, SourceRange { start: 4, end: 15 });
    assert_eq!(ranges[1].token, "fg:red\u{3000}m:1x");
}

#[test]
fn converts_only_valid_utf16_boundaries() {
    let value = "a😀b";
    assert_eq!(byte_to_utf16_offset(value, 1), Some(1));
    assert_eq!(byte_to_utf16_offset(value, 5), Some(3));
    assert_eq!(utf16_to_byte_offset(value, 1), Some(1));
    assert_eq!(utf16_to_byte_offset(value, 2), None);
    assert_eq!(utf16_to_byte_offset(value, 3), Some(5));
}

#[test]
fn collects_only_active_css_variable_references() {
    let references = collect_css_variable_references(
        r#"var(--real) "var(--quoted)" /* var(--commented) */ VAR( --brand, var(--fallback)) xvar(--ignored)"#,
    );
    assert_eq!(references, ["real", "brand", "fallback"]);
}

#[test]
fn transforms_balanced_css_variable_references_without_touching_literals() {
    let source =
        r#"var(--real) "var(--quoted)" /* var(--commented) */ VAR( --brand, var(--fallback))"#;
    let output = transform_css_variable_references(source, |name, text| {
        Ok::<_, ()>((name == "brand").then(|| format!("token({name}:{text})")))
    })
    .unwrap();
    assert_eq!(
        output,
        r#"var(--real) "var(--quoted)" /* var(--commented) */ token(brand:VAR( --brand, var(--fallback)))"#
    );
}

#[test]
fn preserves_unclosed_css_variable_references() {
    let source = "color:var(--brand, calc(1px + 2px)";
    assert_eq!(
        transform_css_variable_references(source, |_name, _text| {
            Ok::<_, ()>(Some("replaced".into()))
        })
        .unwrap(),
        source
    );
}

#[test]
fn finds_top_level_imports_and_parses_quoted_semicolons() {
    let source = [
        "@import url(\"@master/css\") layer(theme);",
        ".x { content: \"@import url(\\\"ignored\\\");\" }",
        "@import \"./a;b.css\";",
    ]
    .join("\n");
    let imports = find_css_import_statements(&source);
    assert_eq!(imports.len(), 2);
    assert_eq!(
        imports
            .iter()
            .map(|item| parse_css_import_source(&item.statement))
            .collect::<Vec<_>>(),
        vec![Some("@master/css".into()), Some("./a;b.css".into())]
    );
}

#[test]
fn finds_removes_and_ranges_master_entry_directives_in_utf16() {
    let source = "😀\n@master entry;\n@source \"./x.css\";\n.a{}";
    let statements = find_master_directive_statements(source);
    assert_eq!(statements.len(), 1);
    assert_eq!(statements[0].start, 3);
    assert_eq!(statements[0].end, 17);
    assert!(has_master_css_manifest_entrypoint(source));
    assert_eq!(
        remove_master_directive_statements(source),
        ("😀\n\n@source \"./x.css\";\n.a{}".into(), true)
    );
}

#[test]
fn parses_and_removes_top_level_extraction_policy_directives() {
    let source = "/*😀*/ @source not \"vendor/**\"; @safelist \"flex fg:red\"; .x{@source \"nested\";} @preserve native;";
    let statements = find_standalone_css_directive_statements(source);
    assert_eq!(
        statements
            .iter()
            .map(|statement| statement.at_rule_name.as_str())
            .collect::<Vec<_>>(),
        ["source", "safelist", "preserve"]
    );
    assert_eq!(statements[0].args, ["vendor/**"]);
    assert_eq!(statements[0].modifiers, ["not"]);
    let (remaining, _) = remove_standalone_css_directives(source);
    assert_eq!(remaining, "/*😀*/   .x{@source \"nested\";} ");
}

#[test]
fn ignores_non_entry_and_nested_master_syntax() {
    let source = "@master;\n@master global;\n.x{@master entry;}\n/* @master entry; */";
    assert!(find_master_directive_statements(source).is_empty());
    assert!(!has_master_css_manifest_entrypoint(source));
}

#[test]
fn extracts_only_top_level_keyframe_blocks_without_losing_lines() {
    let source = "--color: red;\n@keyframes fade {\n  from { content: '}'; }\n  to { opacity: 1; }\n}\n--spacing: 1rem;";
    let (declarations, blocks) =
        extract_top_level_at_rule_blocks(source, &["keyframes", "-webkit-keyframes"]);
    assert_eq!(blocks.len(), 1);
    assert_eq!(blocks[0].name, "keyframes");
    assert!(blocks[0].source.starts_with("@keyframes fade"));
    assert_eq!(declarations.lines().count(), source.lines().count());
    assert!(declarations.contains("--color: red;"));
    assert!(declarations.contains("--spacing: 1rem;"));
    assert!(!declarations.contains("@keyframes"));
}
