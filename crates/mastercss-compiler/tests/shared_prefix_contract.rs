use mastercss_compiler::{
    LowerCssDirectivesRequest, compile_css_directives, lower_css_directives_request,
};
use mastercss_engine::EngineSession;
use mastercss_schema::{ErrorCode, MatchStatus};

fn compile(css: &str) -> mastercss_compiler::LowerCssDirectivesResult {
    let parsed = compile_css_directives(css, &Default::default()).unwrap();
    lower_css_directives_request(
        &LowerCssDirectivesRequest {
            definition_sources: parsed.definition_sources,
            native_output: parsed.native_output,
            manifest_input: parsed.manifest_input,
            style_definitions: parsed.style_definitions.unwrap_or_default(),
            warnings: parsed.warnings,
        },
        &Default::default(),
    )
    .unwrap()
}
fn engine(css: &str) -> EngineSession {
    EngineSession::create(&compile(css).manifest.to_string()).unwrap()
}
fn declarations(e: &EngineSession, class: &str) -> String {
    e.composition_rules(class)
        .unwrap()
        .iter()
        .flat_map(|rule| &rule.declarations)
        .map(|d| format!("{}:{}", d.property, d.value.as_str().unwrap()))
        .collect::<Vec<_>>()
        .join(";")
}
const TOKENS: &str = "@theme{--font-family-sans:sans-serif;--font-size-sm:.875rem;--font-weight-bold:700;--duration-fast:100ms;--easing-smooth:ease}";
const FONT: &str = "@utility font-(--font-family){font-family:var(--font-family)}@utility font-(--font-size){font-size:var(--font-size)}@utility font-(--font-weight){font-weight:var(--font-weight)}";

#[test]
fn shared_prefixes_are_independent_of_registration_order() {
    let definitions = [
        "@utility font-(--font-family){font-family:var(--font-family)}",
        "@utility font-(--font-size){font-size:var(--font-size)}",
        "@utility font-(--font-weight){font-weight:var(--font-weight)}",
        "@utility transition-(--duration){transition-duration:var(--duration)}",
        "@utility transition-(--easing){transition-timing-function:var(--easing)}",
        "@utility animation-(--duration){animation-duration:var(--duration)}",
        "@utility animation-(--easing){animation-timing-function:var(--easing)}",
    ];
    for css in [
        definitions.join(""),
        definitions.into_iter().rev().collect::<String>(),
    ] {
        let e = engine(&format!("{TOKENS}{css}"));
        for (class, property, variable) in [
            ("font-sans", "font-family", "font-family-sans"),
            ("font-sm", "font-size", "font-size-sm"),
            ("font-bold", "font-weight", "font-weight-bold"),
            ("transition-fast", "transition-duration", "duration-fast"),
            (
                "transition-smooth",
                "transition-timing-function",
                "easing-smooth",
            ),
            ("animation-fast", "animation-duration", "duration-fast"),
            (
                "animation-smooth",
                "animation-timing-function",
                "easing-smooth",
            ),
        ] {
            assert_eq!(
                declarations(&e, class),
                format!("{property}:var(--{variable})")
            );
        }
        assert_eq!(e.token_families().unwrap().len(), 7);
        assert!(e.inspect("font-family-sans").unwrap().rules.is_empty());
        assert!(
            e.inspect("font-sm:hover@media(print)!").unwrap().rules[0]
                .text
                .contains("font-size:var(--font-size-sm)!important")
        );
    }
}

#[test]
fn ambiguity_is_based_on_key_ownership_before_sign_opacity_or_value_type() {
    let e = engine(
        "@theme{--spacing-brand:1rem;--color-brand:red}@utility shared-(--spacing){margin:var(--spacing)}@utility shared-(--color){color:var(--color)}",
    );
    for class in [
        "shared-brand",
        "-shared-brand",
        "shared-brand/.5",
        "-shared-brand/.5:hover!",
        "shared-brand/invalid",
    ] {
        let inspected = e.inspect(class).unwrap();
        assert!(inspected.rules.is_empty(), "{class}");
        let diagnostic = inspected
            .diagnostics
            .iter()
            .find(|d| d.code == ErrorCode::AmbiguousToken)
            .unwrap();
        assert!(
            diagnostic.message.contains("--spacing-brand")
                && diagnostic.message.contains("--color-brand")
        );
        assert!(
            diagnostic
                .notes
                .contains(&"margin:var(--spacing-brand)".into())
        );
        assert!(
            diagnostic
                .notes
                .contains(&"color:var(--color-brand)".into())
        );
        assert!(e.class_utility_definition(class).unwrap().is_none());
    }
    assert!(
        !e.class_completion_candidates()
            .unwrap()
            .iter()
            .any(|c| c.label.contains("shared-brand"))
    );
}

#[test]
fn same_namespace_replaces_mode_body_dependencies_and_can_be_empty() {
    let e = engine(&format!(
        r#"{TOKENS}{FONT}
        @utility font-(--font-size <string>){{font-size:var(ident("--font-size-" var(--font-size)));line-height:2}}
    "#
    ));
    assert_eq!(
        declarations(&e, "font-sm"),
        "font-size:var(--font-size-sm);line-height:2"
    );
    assert_eq!(
        declarations(&e, "font-sans"),
        "font-family:var(--font-family-sans)"
    );
    assert_eq!(e.token_families().unwrap().len(), 3);
    let e = engine(&format!("{TOKENS}{FONT}@utility font-(--font-size){{}}"));
    assert_eq!(
        e.inspect("font-sm").unwrap().match_status,
        MatchStatus::Matched
    );
    assert!(e.inspect("font-sm").unwrap().rules.is_empty());
    assert!(!e.inspect("font-bold").unwrap().rules.is_empty());
}

#[test]
fn static_longest_prefix_native_and_function_precedence_remain_independent() {
    let e = engine(&format!(
        "{TOKENS}{FONT}@theme{{--font-family-sm:Small;--font-size-big-sm:2rem;--other-md:3rem}}@utility font-sm{{color:red}}@utility font-big-(--other){{width:var(--other)}}@utility font(--value){{font:var(--value)}}"
    ));
    assert_eq!(declarations(&e, "font-sm"), "color:red");
    assert!(e.inspect("font-big-sm").unwrap().rules.is_empty());
    assert_eq!(declarations(&e, "font-big-md"), "width:var(--other-md)");
    assert_eq!(
        declarations(&e, "font-size:var(--font-size-sm)"),
        "font-size:var(--font-size-sm)"
    );
    assert_eq!(declarations(&e, "font(16px|serif)"), "font:16px serif");
    let completion = e.class_completion_candidates().unwrap();
    assert!(
        !completion
            .iter()
            .find(|c| c.label == "font-sm")
            .unwrap()
            .detail
            .as_deref()
            .unwrap()
            .contains("token")
    );
}

#[test]
fn key_recipes_and_value_bodies_share_the_generic_dispatch() {
    let e = engine(
        r#"@theme{--text-sm:1rem;--text-sm--line-height:1.5;--text-orphan--line-height:2;--space-wide:2rem;--space-sm--line-height:3rem}
        @utility type-(--text <string>){font-size:var(ident("--text-" var(--text)));line-height:var(ident("--text-" var(--text) "--line-height"))}
        @utility type-(--space){width:var(--space);height:var(--space)}"#,
    );
    assert_eq!(
        declarations(&e, "type-sm"),
        "font-size:var(--text-sm);line-height:var(--text-sm--line-height)"
    );
    assert_eq!(
        declarations(&e, "type-wide"),
        "width:var(--space-wide);height:var(--space-wide)"
    );
    assert_eq!(
        declarations(&e, "type-sm--line-height"),
        "width:var(--space-sm--line-height);height:var(--space-sm--line-height)"
    );
    assert!(e.inspect("type-orphan").unwrap().rules.is_empty());
}

#[test]
fn numeric_unicode_and_css_escaped_headers_and_keys_are_decoded() {
    let e = engine(
        r#"@theme{--size-2:2rem;--weight-細:200;--size-\73 m:1rem}
        @utility f\6f nt-(--size){font-size:var(--size)}@utility font-(--weight){font-weight:var(--weight)}
        @utility font-(--\73 ize){font-size:var(--size);line-height:2}"#,
    );
    for (class, expected) in [
        ("font-2", "font-size:var(--size-2);line-height:2"),
        ("font-sm", "font-size:var(--size-sm);line-height:2"),
        ("font-細", "font-weight:var(--weight-細)"),
    ] {
        assert_eq!(declarations(&e, class), expected);
    }
    assert_eq!(e.token_families().unwrap().len(), 2);
}

#[test]
fn metadata_and_refresh_follow_only_the_resolved_branch() {
    let css = format!("{TOKENS}{FONT}");
    let unique = compile(&css).manifest.to_string();
    let ambiguous = compile(&format!("{css}@theme{{--font-family-sm:Small}} "))
        .manifest
        .to_string();
    let mut e = EngineSession::create(&unique).unwrap();
    e.ensure_class_rules(["font-sm", "font-bold"]).unwrap();
    assert_eq!(e.snapshot().unwrap().rules.len(), 2);
    e.refresh(&ambiguous).unwrap();
    let snapshot = e.snapshot().unwrap();
    assert_eq!(snapshot.rules.len(), 1);
    assert!(!snapshot.text.contains("--font-size-sm"));
    e.refresh(&unique).unwrap();
    assert_eq!(e.snapshot().unwrap().rules.len(), 2);
    assert_eq!(
        e.class_utility_definition("font-sm")
            .unwrap()
            .unwrap()
            .recipe
            .parameters[0]
            .name,
        "--font-size"
    );
    let only_family = engine(&format!("@theme{{--font-family-sans:sans-serif}}{FONT}"));
    assert!(only_family.has_named_tokens_for_key("font-family"));
    assert!(!only_family.has_named_tokens_for_key("font-size"));
    assert!(!only_family.has_named_tokens_for_key("font-weight"));
    e.delete_class_rules(["font-sm", "font-bold"]).unwrap();
    assert!(e.snapshot().unwrap().text.is_empty());
}

#[test]
fn color_hints_follow_the_resolved_value_branch() {
    let e = engine(
        r#"@theme{--color-red:red;--color-brand:blue;--size-sm:1rem;--size-brand:2rem;--palette-warm:orange}
        @utility shared-(--color){color:var(--color)}
        @utility shared-(--size){width:var(--size)}
        @utility shared-(--palette <string>){background:var(ident("--palette-" var(--palette)))}"#,
    );
    assert_eq!(e.color_tokens("shared-red").unwrap().len(), 1);
    assert!(e.color_tokens("shared-sm").unwrap().is_empty());
    assert!(e.color_tokens("shared-brand").unwrap().is_empty());
    // String-key recipes do not inherit the value branch's color capability.
    assert!(e.color_tokens("shared-warm").unwrap().is_empty());
}

#[test]
fn direct_manifest_load_replaces_only_the_same_namespace() {
    let mut manifest = compile(&format!("{TOKENS}{FONT}")).manifest;
    let definitions = manifest["utilities"].as_array_mut().unwrap();
    let mut replacement = definitions[1].clone();
    replacement["body"] = serde_json::json!([]);
    definitions.push(replacement);
    let e = EngineSession::create(&manifest.to_string()).unwrap();
    assert_eq!(e.token_families().unwrap().len(), 3);
    assert!(e.inspect("font-sm").unwrap().rules.is_empty());
    assert!(!e.inspect("font-sans").unwrap().rules.is_empty());
}

#[test]
fn base_manifest_merge_replaces_the_effective_branch_including_duplicates() {
    let mut base = compile(&format!("{TOKENS}{FONT}")).manifest;
    let definitions = base["utilities"].as_array_mut().unwrap();
    definitions.push(definitions[1].clone());
    let parsed = compile_css_directives(
        "@utility font-(--font-size){font-size:var(--font-size);line-height:2}",
        &Default::default(),
    )
    .unwrap();
    let merged = lower_css_directives_request(
        &LowerCssDirectivesRequest {
            definition_sources: parsed.definition_sources,
            native_output: parsed.native_output,
            manifest_input: parsed.manifest_input,
            style_definitions: parsed.style_definitions.unwrap_or_default(),
            warnings: parsed.warnings,
        },
        &mastercss_compiler::LowerCssDirectivesOptions {
            base_manifest: Some(base),
            ..Default::default()
        },
    )
    .unwrap();
    let e = EngineSession::create(&merged.manifest.to_string()).unwrap();
    assert_eq!(e.token_families().unwrap().len(), 3);
    assert_eq!(
        declarations(&e, "font-sm"),
        "font-size:var(--font-size-sm);line-height:2"
    );
    assert_eq!(
        declarations(&e, "font-sans"),
        "font-family:var(--font-family-sans)"
    );
}

#[test]
fn imports_and_definition_sources_share_branch_identity() {
    let request = serde_json::from_value::<mastercss_compiler::CompileCssStylesheetGraphRequest>(serde_json::json!({
            "graph":{"entry":"/entry.css","files":{
                "/entry.css":"@import './tokens.css';@utility font-(--font-size){font-size:var(--font-size);line-height:2}",
                "/tokens.css":format!("{TOKENS}{FONT}")
            },"edges":[{"from":"/entry.css","specifier":"./tokens.css","resolved":"/tokens.css"}]},
            "urls":{"/entry.css":"/entry.css","/tokens.css":"/tokens.css"}
        })).unwrap();
    let graph = mastercss_compiler::compile_css_stylesheet_graph(&request).unwrap();
    let parsed = graph.directives;
    let definitions = parsed.definition_sources.clone();
    let compiled = lower_css_directives_request(
        &LowerCssDirectivesRequest {
            definition_sources: parsed.definition_sources,
            native_output: parsed.native_output,
            manifest_input: parsed.manifest_input,
            style_definitions: parsed.style_definitions.unwrap_or_default(),
            warnings: parsed.warnings,
        },
        &Default::default(),
    )
    .unwrap();
    let e = EngineSession::create(&compiled.manifest.to_string()).unwrap();
    assert_eq!(
        declarations(&e, "font-sm"),
        "font-size:var(--font-size-sm);line-height:2"
    );
    assert_eq!(
        declarations(&e, "font-sans"),
        "font-family:var(--font-family-sans)"
    );
    for (class, namespace, file) in [
        ("font-sm", "--font-size", "/entry.css"),
        ("font-sans", "--font-family", "/tokens.css"),
    ] {
        let definition = e.class_utility_definition(class).unwrap().unwrap();
        assert_eq!(definition.recipe.parameters[0].name, namespace);
        assert_eq!(
            definition.recipe.source.as_ref().unwrap().file.as_deref(),
            Some(file)
        );
        let identity = format!("utility:{}", definition.identity());
        assert!(
            e.class_definition_references(class)
                .unwrap()
                .contains(&identity)
        );
        let matching = definitions
            .iter()
            .filter(|source| source.identity == identity)
            .collect::<Vec<_>>();
        assert_eq!(
            matching
                .iter()
                .filter(|source| source.replaced_by.is_none())
                .count(),
            1
        );
        assert_eq!(matching.len(), if class == "font-sm" { 2 } else { 1 });
    }
}
