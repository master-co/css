use super::*;

struct MemoryImportProvider {
    files: HashMap<String, String>,
    resolutions: HashMap<(String, String), String>,
}

impl CssImportProvider for MemoryImportProvider {
    type Error = &'static str;

    fn load(&self, id: &str) -> Result<String, Self::Error> {
        self.files.get(id).cloned().ok_or("missing file")
    }

    fn resolve(&self, specifier: &str, from: &str) -> Result<Option<String>, Self::Error> {
        Ok(self
            .resolutions
            .get(&(from.to_owned(), specifier.to_owned()))
            .cloned())
    }
}

#[test]
fn recognizes_only_explicit_project_entry_markers() {
    let inspection = inspect_css("@master entry;");
    assert!(inspection.has_master_entry_directive);
    assert!(!inspection.has_master_css_import);
    assert!(inspection.has_master_entry);
    assert_eq!(inspection.directives.len(), 1);
    assert!(inspect_css("@import \"@master/css\";").has_master_entry);
    assert!(!inspect_css("@master;").has_master_entry);
    assert!(!inspect_css("@master global;").has_master_entry);
    assert!(!inspect_css(".x{content:'@import \"@master/css\";'}").has_master_entry);
}

#[test]
fn resolves_import_graphs_through_a_provider_without_filesystem_ownership() {
    let provider = MemoryImportProvider {
            files: HashMap::from([
                (
                    "/entry.css".into(),
                    "@import \"./theme.css\";\n@import \"https://example.com/font.css\";\n.entry{display:block}".into(),
                ),
                (
                    "/theme.css".into(),
                    "@reference \"./tokens.css\";\n@import \"./utilities.css\";\n@theme{--color-brand:red}".into(),
                ),
                (
                    "/utilities.css".into(),
                    "@utilities{block{display:block}}".into(),
                ),
            ]),
            resolutions: HashMap::from([
                (
                    ("/entry.css".into(), "./theme.css".into()),
                    "/theme.css".into(),
                ),
                (
                    ("/theme.css".into(), "./utilities.css".into()),
                    "/utilities.css".into(),
                ),
            ]),
        };
    let graph = resolve_css_import_graph("/entry.css", &provider).unwrap();
    assert_eq!(
        graph.dependencies,
        ["/entry.css", "/theme.css", "/utilities.css"]
    );
    assert_eq!(graph.references.len(), 1);
    assert_eq!(graph.references[0].file.as_deref(), Some("/theme.css"));
    assert_eq!(graph.references[0].source, "./tokens.css");
    assert!(
        graph
            .source
            .starts_with("@import \"https://example.com/font.css\";\n")
    );
    assert!(graph.source.contains("@utilities{block{display:block}}"));
    assert!(graph.source.ends_with(".entry{display:block}"));
}

#[test]
fn rejects_provider_import_cycles_deterministically() {
    let provider = MemoryImportProvider {
        files: HashMap::from([
            ("/a.css".into(), "@import \"./b.css\";".into()),
            ("/b.css".into(), "@import \"./a.css\";".into()),
        ]),
        resolutions: HashMap::from([
            (("/a.css".into(), "./b.css".into()), "/b.css".into()),
            (("/b.css".into(), "./a.css".into()), "/a.css".into()),
        ]),
    };
    let error = resolve_css_import_graph("/a.css", &provider).unwrap_err();
    assert_eq!(
        error.to_string(),
        "Circular CSS import: /a.css -> /b.css -> /a.css"
    );
    assert_eq!(error.diagnostic().code, ErrorCode::CssImportError);
}

#[test]
fn compiles_native_css_and_removes_entry_directive() {
    let result = compile_native_css(
        "@master entry;\n.card { color: red; margin: 0px 1.0rem; }",
        &CompileNativeCssOptions::default(),
    )
    .unwrap();
    assert!(result.had_master_entry_directive);
    assert_eq!(
        result.native_css,
        ".card {\n  color: red;\n  margin: 0 1rem;\n}"
    );
}

#[test]
fn can_skip_native_css_printing() {
    let result = compile_native_css(
        ".card { color: red; }",
        &CompileNativeCssOptions {
            preserve_native_css: false,
            ..CompileNativeCssOptions::default()
        },
    )
    .unwrap();
    assert_eq!(result.native_css, "");
}

#[test]
fn filters_native_selectors_without_losing_discovered_classes() {
    let result = compile_css_directives(
        ".used,.unused { color: red; }\n@media print { .unused { display: none; } }",
        &CompileNativeCssOptions {
            classes: Some(vec!["used".into()]),
            ..CompileNativeCssOptions::default()
        },
    )
    .unwrap();
    assert_eq!(result.native_class_names, ["used", "unused"]);
    assert_eq!(result.native_css, ".used {\n  color: red;\n}");
}

#[test]
fn lowers_theme_tokens_and_preserves_native_css() {
    let result = compile_theme_css(
        "@theme { --color-brand: rgb(0 128 255); --leading-tight: 1.0; }\n.card { color: red; }",
        &CompileNativeCssOptions::default(),
    )
    .unwrap();
    assert_eq!(
        serde_json::to_value(result.manifest_input).unwrap(),
        serde_json::json!({
            "variables": [
                { "name": "color-brand", "value": "#0080ff" },
                { "name": "leading-tight", "value": 1 }
            ]
        })
    );
    assert_eq!(result.native_css, ".card {\n  color: red;\n}");
}

#[test]
fn lowers_theme_modifiers_and_replaces_duplicate_mode_tokens_in_order() {
    let result = compile_theme_css(
        "@theme { --color-brand: #111; --color-accent: #222; }\n\
             @theme dark static { --color-brand: #333; }\n\
             @theme { --color-brand: #444; }",
        &CompileNativeCssOptions::default(),
    )
    .unwrap();
    assert_eq!(
        serde_json::to_value(result.manifest_input).unwrap(),
        serde_json::json!({
            "variables": [
                { "name": "color-accent", "value": "#222" },
                { "name": "color-brand", "value": "#333", "mode": "dark", "static": true },
                { "name": "color-brand", "value": "#444" }
            ],
            "modes": ["dark"]
        })
    );
}

#[test]
fn rejects_invalid_theme_modifier_combinations() {
    let error = compile_theme_css(
        "/*😀*/\n@theme dark inline { --color-brand: #fff; }",
        &CompileNativeCssOptions::default(),
    )
    .unwrap_err();
    assert_eq!(error.to_string(), "@theme inline cannot be mode-specific");
    assert_eq!(
        error.diagnostic().range,
        Some(SourceRange { start: 7, end: 13 })
    );
}

#[test]
fn owns_compose_syntax_diagnostic_codes_and_utf16_ranges() {
    let quoted = compile_css_directives(
        "/*😀*/ .btn { @compose \"block\"; }",
        &CompileNativeCssOptions::default(),
    )
    .unwrap_err()
    .diagnostic();
    assert_eq!(quoted.code, ErrorCode::ComposeQuotedSyntax);
    assert_eq!(quoted.range, Some(SourceRange { start: 23, end: 30 }));

    let grouped = compile_css_directives(
        ".btn { @compose {block}; }",
        &CompileNativeCssOptions::default(),
    )
    .unwrap_err()
    .diagnostic();
    assert_eq!(grouped.code, ErrorCode::ComposeGroupSyntax);
    assert_eq!(grouped.range, Some(SourceRange { start: 16, end: 23 }));
}

#[test]
fn lowers_static_theme_keyframes_outside_layers() {
    let result = compile_theme_css(
        "@theme static {\n\
               --color-brand: #123;\n\
               @keyframes fade {\n\
                 from, 50% { opacity: 0; transform: translateX(0px); }\n\
                 to { opacity: 1 !important; }\n\
               }\n\
             }",
        &CompileNativeCssOptions::default(),
    )
    .unwrap();
    assert_eq!(
        serde_json::to_value(result.manifest_input).unwrap(),
        serde_json::json!({
            "variables": [{ "name": "color-brand", "value": "#123", "static": true }],
            "animations": {
                "fade": {
                    "from": { "opacity": "0", "transform": "translateX(0)" },
                    "50%": { "opacity": "0", "transform": "translateX(0)" },
                    "to": { "opacity": "1 !important" }
                }
            },
            "animationOptions": { "fade": { "static": true } }
        })
    );
}

#[test]
fn normalizes_theme_alpha_aliases_and_unquoted_pipes() {
    let result = compile_theme_css(
        "@theme {\n\
               --color-muted: --alpha(var(--color-primary) / .5);\n\
               --content-quoted: \"a | b\";\n\
               --content-piped: a | b;\n\
             }",
        &CompileNativeCssOptions::default(),
    )
    .unwrap();
    assert_eq!(
        serde_json::to_value(result.manifest_input).unwrap(),
        serde_json::json!({
            "variables": [
                {
                    "name": "color-muted",
                    "value": "color-mix(in oklab,var(--color-primary) 50%,transparent)"
                },
                { "name": "content-quoted", "value": "\"a | b\"" },
                { "name": "content-piped", "value": "a   b" }
            ]
        })
    );

    let error = compile_theme_css(
        "@theme { --color-brand: $color-blue-60; }",
        &CompileNativeCssOptions::default(),
    )
    .unwrap_err();
    assert_eq!(
        error.to_string(),
        "Stylesheet values use native CSS variable references. Replace \"$color-blue-60\" with \"var(--color-blue-60)\"."
    );
}

#[test]
fn lowers_settings_into_the_canonical_manifest_input() {
    let result = compile_theme_css(
        "@settings {\n\
               root-size: 16;\n\
               base-unit: 1;\n\
               default-mode: light;\n\
               mode-trigger: class;\n\
               important: on;\n\
               modes: light, dark chrisma;\n\
               scope: .app;\n\
             }",
        &CompileNativeCssOptions::default(),
    )
    .unwrap();
    assert_eq!(
        serde_json::to_value(result.manifest_input).unwrap(),
        serde_json::json!({
            "rootSize": 16.0,
            "baseUnit": 1.0,
            "defaultMode": "light",
            "scope": ".app",
            "important": true,
            "modes": ["light", "dark", "chrisma"],
            "modeTrigger": "class"
        })
    );
}

#[test]
fn lowers_static_managed_definitions_with_utf16_source_ranges() {
    let result = compile_theme_css(
            "/* 😀 */\n@components {\n  btn { display: inline-flex; color: red; }\n}\n@utilities { content-auto { content-visibility: auto; } }",
            &CompileNativeCssOptions::default(),
        )
        .unwrap();
    assert_eq!(result.class_names, ["btn", "content-auto"]);
    assert_eq!(
        serde_json::to_value(result.style_definitions).unwrap(),
        serde_json::json!([
            {
                "type": "native",
                "order": 1,
                "selector": "&",
                "declarations": {
                    "display": "inline-flex",
                    "color": "red"
                },
                "selectorSource": {
                    "file": "master.css",
                    "range": { "start": 25, "end": 28 },
                    "loc": {
                        "start": { "line": 3, "column": 3 },
                        "end": { "line": 3, "column": 6 }
                    }
                },
                "layer": "components",
                "name": "btn"
            },
            {
                "type": "native",
                "order": 2,
                "selector": "&",
                "declarations": { "content-visibility": "auto" },
                "selectorSource": {
                    "file": "master.css",
                    "range": { "start": 82, "end": 94 },
                    "loc": {
                        "start": { "line": 5, "column": 14 },
                        "end": { "line": 5, "column": 26 }
                    }
                },
                "layer": "utilities",
                "name": "content-auto"
            }
        ])
    );
}

#[test]
fn lowers_native_compose_and_variant_styles() {
    let result = compile_css_directives(
        "@custom-variant wide { @media (width >= 640px) { @slot; } }\n\
             @components { brand { color: red; } }\n\
             .button { @compose brand; @variant wide { @compose brand; } }",
        &CompileNativeCssOptions::default(),
    )
    .unwrap();
    let native_composes = result
        .style_definitions
        .as_ref()
        .unwrap()
        .iter()
        .filter_map(|definition| match definition {
            CssDirectiveStyleDefinition::Compose {
                selector,
                condition_path,
                name,
                ..
            } if name.is_none() => Some((selector, condition_path)),
            _ => None,
        })
        .collect::<Vec<_>>();
    assert_eq!(native_composes.len(), 2);
    assert_eq!(native_composes[0].0, ".button");
    assert_eq!(
        native_composes[1].1,
        &Some(vec![CssDirectiveConditionPathEntry::Variant {
            token: "@wide".into()
        }])
    );
    assert!(result.native_css.is_empty());
}

#[test]
fn lowers_numeric_leading_variant_names() {
    let result = compile_css_directives(
        ".button { @variant 3xs { @compose block; } }",
        &CompileNativeCssOptions::default(),
    )
    .unwrap();
    let condition_path = result
        .style_definitions
        .as_ref()
        .unwrap()
        .iter()
        .find_map(|definition| match definition {
            CssDirectiveStyleDefinition::Compose { condition_path, .. } => condition_path.as_ref(),
            _ => None,
        })
        .unwrap();
    assert_eq!(
        condition_path,
        &[CssDirectiveConditionPathEntry::Variant {
            token: "@3xs".into()
        }]
    );
    assert!(result.native_css.is_empty());
}
