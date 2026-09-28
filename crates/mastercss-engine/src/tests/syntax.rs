#[test]
fn renders_selector_condition_layer_and_important_state() {
    for (class_name, expected) in [
        (
            "block:hover",
            "@layer utilities{.block\\:hover:hover{display:block}}",
        ),
        (
            "block:first",
            "@layer utilities{.block\\:first:first-child{display:block}}",
        ),
        (
            "block_button",
            "@layer utilities{.block_button button{display:block}}",
        ),
        (
            "block_button@base",
            "@layer base{.block_button\\@base button{display:block}}",
        ),
        (
            "block_button@screen",
            "@layer utilities{@media screen{.block_button\\@screen button{display:block}}}",
        ),
        (
            "block_button@scope",
            "@layer utilities{.scope .block_button\\@scope button{display:block}}",
        ),
        (
            "{block}_:is(h4,.app-nav)@default",
            "@layer defaults{.\\{block\\}_\\:is\\(h4\\,\\.app-nav\\)\\@default :is(h4,.app-nav){display:block}}",
        ),
        (
            "block@sm",
            "@layer utilities{@media (width>=52.125rem){.block\\@sm{display:block}}}",
        ),
        (
            "block@media(print)",
            "@layer utilities{@media print{.block\\@media\\(print\\){display:block}}}",
        ),
        (
            "block@supports((display:grid))",
            "@layer utilities{@supports (display:grid){.block\\@supports\\(\\(display\\:grid\\)\\){display:block}}}",
        ),
        (
            "block@container((height>160px))",
            "@layer utilities{@container (height>160px){.block\\@container\\(\\(height\\>160px\\)\\){display:block}}}",
        ),
        (
            "w:10px:hover@sm",
            "@layer utilities{@media (width>=52.125rem){.w\\:10px\\:hover\\@sm:hover{width:10px}}}",
        ),
        (
            "w:10px[open]",
            "@layer utilities{.w\\:10px\\[open\\][open]{width:10px}}",
        ),
        (
            "block:of(.active)",
            "@layer utilities{.active .block\\:of\\(\\.active\\){display:block}}",
        ),
        (
            "block:of(.active>)",
            "@layer utilities{.active>.block\\:of\\(\\.active\\>\\){display:block}}",
        ),
        (
            "block:of(.active+)",
            "@layer utilities{.active+.block\\:of\\(\\.active\\+\\){display:block}}",
        ),
        (
            "block:of(.active~)",
            "@layer utilities{.active~.block\\:of\\(\\.active\\~\\){display:block}}",
        ),
        ("block@base", "@layer base{.block\\@base{display:block}}"),
        (
            "block!",
            "@layer utilities{.block\\!{display:block!important}}",
        ),
        ("w:0.25rem", "@layer utilities{.w\\:0\\.25rem{width:0.25rem}}"),
        ("m:-0.25rem", "@layer utilities{.m\\:-0\\.25rem{margin:-0.25rem}}"),
        (
            "block:before",
            "@layer utilities{.block\\:before::before{display:block}}",
        ),
        (
            "block::before",
            "@layer utilities{.block\\:\\:before::before{display:block}}",
        ),
        (
            "block:after",
            "@layer utilities{.block\\:after::after{display:block}}",
        ),
        (
            "block:first-letter",
            "@layer utilities{.block\\:first-letter::first-letter{display:block}}",
        ),
        (
            "block:first-line",
            "@layer utilities{.block\\:first-line::first-line{display:block}}",
        ),
    ] {
        let mut engine = EngineSession::create(MANIFEST).unwrap();
        engine.ensure_class_rules([class_name]).unwrap();
        assert_eq!(engine.css_text(), expected, "{class_name}");
    }
}

#[test]
fn preserves_selector_templates_across_selectorless_variants() {
    assert_eq!(
        compose_selector_templates(Some("& button"), None).as_deref(),
        Some("& button")
    );
    assert_eq!(
        compose_selector_templates(Some("& button"), Some("&")).as_deref(),
        Some("& button")
    );
    assert_eq!(
        compose_selector_templates(Some("& button"), Some(".scope &")).as_deref(),
        Some(".scope & button")
    );
    assert_eq!(compose_selector_templates(None, None), None);
}

#[test]
fn resolves_legacy_pseudo_elements_without_rewriting_explicit_double_colons() {
    let engine = EngineSession::create(MANIFEST).unwrap();
    assert_eq!(
        engine
            .resolve_style_selector(".card:before,.card:first-line,.card::after")
            .unwrap(),
        ".card::before,.card::first-line,.card::after"
    );
}

#[test]
fn animation_declarations_do_not_register_native_keyframes() {
    let manifest = include_str!("../../../../packages/preset/src/default-manifest.json");
    let mut engine = EngineSession::create(manifest).unwrap();
    engine.ensure_class_rules(["float:left", "animation:float|1s"]).unwrap();
    assert!(!engine.css_text().contains("@keyframes"));
    assert!(engine.css_text().contains("animation:float 1s"));
    assert!(serde_json::to_value(engine.snapshot().unwrap()).unwrap()["resources"].get("animations").is_none());
}

#[test]
fn native_keyframe_values_retain_theme_dependencies_as_stylesheet_usage() {
    let manifest = r##"{"version":2,"languageVersion":4,"variables":{"color":[{"key":"primary","values":[{"path":[":root,:host"],"value":"#ff0"}]}]},"theme":[{"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"color-primary","value":"#ff0"}]}]}"##;
    let mut engine = EngineSession::create(manifest).unwrap();
    engine.ensure_stylesheet_resources("@keyframes fade{to{background:var(--color-primary)}}").unwrap();
    assert!(engine.css_text().contains("--color-primary:#ff0"));
    assert!(!engine.css_text().contains("@keyframes"));
    assert_eq!(engine.emitted_globals_snapshot().unwrap().variable_count("color-primary"), 1);
}

#[test]
fn parses_each_compound_condition_as_a_condition() {
    for (class_name, expected) in [
        (
            "block@dark@sm",
            "@layer utilities{@media (prefers-color-scheme:dark){@media (width>=52.125rem){.block\\@dark\\@sm:where(:root,:root *){display:block}}}}",
        ),
        (
            "block@sm@dark",
            "@layer utilities{@media (width>=52.125rem){@media (prefers-color-scheme:dark){.block\\@sm\\@dark:where(:root,:root *){display:block}}}}",
        ),
    ] {
        let mut engine = EngineSession::create(MANIFEST).unwrap();
        engine.ensure_class_rules([class_name]).unwrap();
        assert_eq!(engine.css_text(), expected, "{class_name}");
    }

    let engine = EngineSession::create(MANIFEST).unwrap();
    let original = engine.inspect("block@dark@sm").unwrap();
    let canonical = engine.inspect("block@sm@dark").unwrap();
    assert_ne!(original.rules[0].priority.features, canonical.rules[0].priority.features);
    assert_ne!(original.rules[0].priority.conditions, canonical.rules[0].priority.conditions);
}

#[test]
fn renders_the_compiled_condition_grammar() {
    for (class_name, expected_condition) in [
        ("block@media((pointer:coarse))", "@media (pointer:coarse)"),
        ("block@media((height<52.125rem))", "@media (height<52.125rem)"),
        ("block@media((52.125rem<=height<80rem))", "@media (52.125rem<=height<80rem)"),
        ("block@starting-style", "@starting-style"),
    ] {
        let mut engine = EngineSession::create(include_str!(
            "../../../../packages/preset/src/default-manifest.json"
        ))
        .unwrap();
        engine.ensure_class_rules([class_name]).unwrap();
        assert_eq!(
            engine.css_text(),
            format!(
                "@layer utilities{{{expected_condition}{{.{}{{display:block}}}}}}",
                css_escape(class_name)
            ),
            "{class_name}"
        );
    }
}

#[test]
fn separates_child_selectors_from_dynamic_values() {
    let mut engine = EngineSession::create(r#"{"version":2,"languageVersion":4,"utilities":[]}"#).unwrap();
    engine.ensure_class_rules(["mt:0>div"]).unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer utilities{.mt\\:0\\>div>div{margin-top:0}}"
    );

    let mut engine = EngineSession::create(MANIFEST).unwrap();
    let class_name =
        "bg:transparent_:is(.monaco-editor,.monaco-editor-background,.monaco-editor_.margin)";
    engine.ensure_class_rules([class_name]).unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer utilities{.bg\\:transparent_\\:is\\(\\.monaco-editor\\,\\.monaco-editor-background\\,\\.monaco-editor_\\.margin\\) :is(.monaco-editor,.monaco-editor-background,.monaco-editor .margin){background:transparent}}"
    );
}

#[test]
fn native_property_precedes_overlapping_enum_name_inside_groups() {
    let manifest = r#"{"version":2,"languageVersion":4,"utilities":[{"id":"text-wrap","type":-2,"emit":{"type":"static","rules":[{"declarations":{"text-wrap":"wrap"}}]},"matchers":[{"type":"static","name":"text-wrap"}],"name":"text-wrap"},{"id":"text-pretty","type":-2,"emit":{"type":"static","rules":[{"declarations":{"text-wrap":"pretty"}}]},"matchers":[{"type":"static","name":"text-pretty"}],"name":"text-pretty"}]}"#;
    let mut engine = EngineSession::create(manifest).unwrap();
    engine
        .ensure_class_rules(["{text-wrap:pretty}"])
        .unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer utilities{.\\{text-wrap\\:pretty\\}{text-wrap:pretty}}"
    );
}

#[test]
fn preserves_math_function_names_that_overlap_inline_variables() {
    let mut engine = EngineSession::create(MANIFEST).unwrap();
    engine
        .ensure_class_rules(["w:min(1px,max(2px,3px))"])
        .unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer utilities{.w\\:min\\(1px\\,max\\(2px\\,3px\\)\\){width:min(1px,max(2px,3px))}}"
    );
}

#[test]
fn prefers_exact_utilities_over_patterns_and_rejects_legacy_variable_functions() {
    let manifest = r#"{"version":2,"languageVersion":4,"utilities":[{"id":"text-left","type":-2,"emit":{"type":"template","declarations":{"text-align":"$value"}},"matchers":[{"type":"static","name":"text-left"}],"name":"text-left"},{"id":"text-center","type":-2,"emit":{"type":"template","declarations":{"text-align":"$value"}},"matchers":[{"type":"static","name":"text-center"}],"name":"text-center"},{"id":"text-center","type":-2,"emit":{"type":"static","rules":[{"declarations":{"text-align":"start"}}]},"matchers":[{"type":"static","name":"text-center"}]}]}"#;
    let engine = EngineSession::create(manifest).unwrap();
    assert_eq!(
        engine.inspect("text-center").unwrap().rules[0].text,
        ".text-center{text-align:start}"
    );

    let engine = EngineSession::create(r#"{"version":2,"languageVersion":4,"utilities":[]}"#).unwrap();
    assert!(engine.inspect("margin:$(spacing-x1)").unwrap().match_status != mastercss_schema::MatchStatus::Matched);
    assert!(
        engine
            .inspect("width:calc(-2px+$(spacing-x1))")
            .unwrap()
            .match_status != mastercss_schema::MatchStatus::Matched
    );
}

#[test]
fn preserves_all_static_rules_for_the_same_class_across_layers() {
    let manifest = r#"{
          "version":2,"languageVersion":4,
          "utilities":[
            {
              "id":"demo-defaults",
              "type":-2,
              "layer":"defaults",
              "emit":{"type":"static","rules":[{"declarations":{"background":"var(--stripe)"}}]},
              "matchers":[{"type":"static","name":"demo"}]
            },
            {
              "id":"demo-components",
              "type":-2,
              "layer":"components",
              "emit":{"type":"static","rules":[{"declarations":{"display":"flex"}}]},
              "matchers":[{"type":"static","name":"demo"}]
            }
          ]
        }"#;
    let mut engine = EngineSession::create(manifest).unwrap();
    engine.ensure_class_rules(["demo"]).unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer defaults{.demo{background:var(--stripe)}}@layer components{.demo{display:flex}}"
    );
}

#[test]
fn lets_native_key_aliases_handle_variables_outside_managed_namespaces() {
    let manifest = r#"{"version":2,"languageVersion":4,"variables":{"":[{"name":"stripe","key":"stripe","type":"string","values":[{"path":[":root,:host"],"value":"0 / 7.5px 7.5px linear-gradient(red,blue) transparent"}]}]},"utilities":[{"id":"bg-<~color>","type":0,"variableAliasRefs":["~color"],"emit":{"type":"static","rules":[{"declarations":{"background-color":null}}]},"matchers":[{"type":"token","prefix":"bg-"}]}],"theme":[{"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"stripe","value":"0 / 7.5px 7.5px linear-gradient(red,blue) transparent"}]}]}"#;
    let mut engine = EngineSession::create(manifest).unwrap();
    assert_eq!(
        engine.native_declaration_candidates(["bg:var(--stripe)"]).unwrap(),
        vec![NativeDeclarationCandidateIr {
            class_name: "bg:var(--stripe)".into(),
            property: "background".into(),
            value: "var(--stripe)".into(),
        }]
    );
    engine
        .ensure_class_rules(["bg:var(--stripe)"])
        .unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer theme{:root,:host{--stripe:0 / 7.5px 7.5px linear-gradient(red,blue) transparent}}@layer utilities{.bg\\:var\\(--stripe\\){background:var(--stripe)}}"
    );
}

#[test]
fn preserves_native_alias_matchers_for_shared_declarations() {
    let manifest = r#"{"version":2,"languageVersion":4,"variables":{"":[{"name":"stripe","key":"stripe","type":"string","values":[{"path":[":root,:host"],"value":"linear-gradient(red,blue)"}]}]},"utilities":[],"theme":[{"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"stripe","value":"linear-gradient(red,blue)"}]}]}"#;
    let mut engine = EngineSession::create(manifest).unwrap();
    engine
        .ensure_class_rules(["background:var(--stripe)"])
        .unwrap();
    engine
        .ensure_class_rules(["bg:var(--stripe)"])
        .unwrap();

    assert!(engine.inspect("bg:var(--stripe)").unwrap().match_status == mastercss_schema::MatchStatus::Matched);
    assert_eq!(
        engine.css_text(),
        "@layer theme{:root,:host{--stripe:linear-gradient(red,blue)}}@layer utilities{.background\\:var\\(--stripe\\){background:var(--stripe)}.bg\\:var\\(--stripe\\){background:var(--stripe)}}"
    );
}
