use super::{
    SourceRange, byte_to_utf16_offset, collect_class_list_token_ranges,
    collect_css_variable_references, css_escape, extract_top_level_at_rule_blocks,
    find_css_import_statements, find_standalone_css_directive_statements,
    has_master_css_manifest_entrypoint, parse_css_import_source, remove_standalone_css_directives,
    transform_css_variable_references, utf16_to_byte_offset,
};

#[test]
fn matches_existing_css_escape_examples() {
    assert_eq!(css_escape("font:48px"), "font\\:48px");
    assert_eq!(css_escape("1col"), "\\31 col");
    assert_eq!(css_escape("-1col"), "-\\31 col");
    assert_eq!(css_escape("-"), "\\-");
    assert_eq!(css_escape("a b"), "a\\ b");
    assert_eq!(css_escape("\u{1}a\u{1f}\u{7f}"), "\\1 a\\1f \\7f ");
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
fn entry_imports_use_css_token_boundaries_and_utf16_offsets() {
    let source = "/*😀*/\n@IMPORT \"@master/css\";";
    let imports = find_css_import_statements(source);
    assert_eq!(imports.len(), 1);
    assert_eq!(imports[0].start, 7);
    assert!(has_master_css_manifest_entrypoint(source));
    assert!(has_master_css_manifest_entrypoint(
        r#"@im\70ort "@master/css";"#
    ));
}

#[test]
fn parses_and_removes_top_level_extraction_policy_directives() {
    let source = "/*😀*/ @source not \"vendor/**\"; @safelist \"flex color:red\"; .x{@source \"nested\";} @preserve native;";
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

#[test]
fn extracts_many_mixins_with_utf16_ranges_and_untouched_gaps() {
    let mut source = String::from("/*😀*/\n");
    let mut expected = Vec::new();
    for index in 0..256 {
        let block = format!("@mixin --item-{index} {{ content: '漢😀'; }}");
        let start = super::utf16_len(&source);
        source.push_str(&block);
        expected.push((start, super::utf16_len(&source), block));
        source.push_str("\n.native { content: '𐀀'; }\n");
    }
    let (remaining, blocks) = extract_top_level_at_rule_blocks(&source, &["mixin"]);
    assert_eq!(blocks.len(), expected.len());
    for (block, (start, end, text)) in blocks.iter().zip(expected) {
        assert_eq!((block.start, block.end), (start, end));
        assert_eq!(block.source, text);
    }
    assert_eq!(remaining.matches(".native { content: '𐀀'; }").count(), 256);
    assert_eq!(remaining.lines().count(), source.lines().count());
    assert!(!remaining.contains("@mixin"));
}

#[test]
fn leading_declaration_name_matches_the_first_two_tokens() {
    use super::{CssSyntaxKind, leading_declaration_name, tokenize_css_syntax};
    for source in [
        "display:block",
        "font-family:mono",
        "--size:1rem",
        "--:1",
        "-webkit-line-clamp:2",
        "\\31 0:x",
        "f\\:oo:bar",
        "color :red",
        " color:red",
        "/**/color:red",
        "1px:red",
        "-1px:red",
        "--1:red",
        "calc(1):x",
        "@media:x",
        "\"color\":red",
        "color",
        "color:",
        ":hover",
        "é:x",
        "+a:b",
    ] {
        let tokens = tokenize_css_syntax(source);
        let expected = match tokens.as_slice() {
            [first, colon, ..] => match &first.kind {
                CssSyntaxKind::Ident(name)
                    if first.bytes.start == 0
                        && colon.bytes.start == first.bytes.end
                        && colon.kind == CssSyntaxKind::Delim(':')
                        && name != "--" =>
                {
                    Some((colon.bytes.start, name.clone()))
                }
                _ => None,
            },
            _ => None,
        };
        assert_eq!(leading_declaration_name(source), expected, "{source}");
    }
}
