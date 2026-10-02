#[test]
fn renders_selector_condition_layer_and_important_state() {
    for (class_name, expected) in [
        (
            "block:hover",
            "@layer utilities{.block\\:hover:hover{display:block}}",
        ),
        (
            "block:first-child",
            "@layer utilities{.block\\:first-child:first-child{display:block}}",
        ),
        (
            "block_button",
            "@layer utilities{.block_button button{display:block}}",
        ),
        (
            "block_button@layer(base)",
            "@layer base{.block_button\\@layer\\(base\\) button{display:block}}",
        ),
        (
            "block_button@media(screen)",
            "@layer utilities{@media screen{.block_button\\@media\\(screen\\) button{display:block}}}",
        ),
        (
            "block_button@apply(--scope)",
            "@layer utilities{.scope .block_button\\@apply\\(--scope\\) button{display:block}}",
        ),
        (
            "block_:is(h4,.app-nav)@layer(defaults)",
            "@layer defaults{.block_\\:is\\(h4\\,\\.app-nav\\)\\@layer\\(defaults\\) :is(h4,.app-nav){display:block}}",
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
            "width:10px:hover@sm",
            "@layer utilities{@media (width>=52.125rem){.width\\:10px\\:hover\\@sm:hover{width:10px}}}",
        ),
        (
            "width:10px[open]",
            "@layer utilities{.width\\:10px\\[open\\][open]{width:10px}}",
        ),
        (
            "block@layer(base)",
            "@layer base{.block\\@layer\\(base\\){display:block}}",
        ),
        (
            "block!",
            "@layer utilities{.block\\!{display:block!important}}",
        ),
        (
            "width:0.25rem",
            "@layer utilities{.width\\:0\\.25rem{width:0.25rem}}",
        ),
        (
            "margin:-0.25rem",
            "@layer utilities{.margin\\:-0\\.25rem{margin:-0.25rem}}",
        ),
        (
            "block:before",
            "@layer utilities{.block\\:before:before{display:block}}",
        ),
        (
            "block::before",
            "@layer utilities{.block\\:\\:before::before{display:block}}",
        ),
        (
            "block:after",
            "@layer utilities{.block\\:after:after{display:block}}",
        ),
        (
            "block:first-letter",
            "@layer utilities{.block\\:first-letter:first-letter{display:block}}",
        ),
        (
            "block:first-line",
            "@layer utilities{.block\\:first-line:first-line{display:block}}",
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
        ".card:before,.card:first-line,.card::after"
    );
}

#[test]
fn animation_declarations_do_not_register_native_keyframes() {
    let manifest = include_str!("../../../../packages/preset/src/default-manifest.json");
    let mut engine = EngineSession::create(manifest).unwrap();
    engine
        .ensure_class_rules(["float:left", "animation:external|1s"])
        .unwrap();
    assert!(!engine.css_text().contains("@keyframes"));
    engine.ensure_class_rules(["animation:float|1s"]).unwrap();
    assert!(engine.css_text().contains("@keyframes float"));
    assert!(engine.css_text().contains("animation:float 1s"));
    assert!(
        serde_json::to_value(engine.snapshot().unwrap()).unwrap()["resources"]
            .get("animations")
            .is_none()
    );
}

#[test]
fn native_keyframe_values_retain_theme_dependencies_as_stylesheet_usage() {
    let manifest = r##"{"version":5,"languageVersion":14,"variables":{"color":[{"key":"primary","values":[{"path":[":root,:host"],"value":"#ff0"}]}]},"theme":[{"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"color-primary","value":"#ff0"}]}]}"##;
    let mut engine = EngineSession::create(manifest).unwrap();
    engine
        .ensure_stylesheet_resources("@keyframes fade{to{background:var(--color-primary)}}")
        .unwrap();
    assert!(engine.css_text().contains("--color-primary:#ff0"));
    assert!(!engine.css_text().contains("@keyframes"));
    assert_eq!(
        engine
            .emitted_globals_snapshot()
            .unwrap()
            .variable_count("color-primary"),
        1
    );
}

#[test]
fn parses_each_compound_condition_as_a_condition() {
    for (class_name, expected) in [
        (
            "block@apply(--dark)@sm",
            "@layer utilities{@media (prefers-color-scheme:dark){@media (width>=52.125rem){.block\\@apply\\(--dark\\)\\@sm:where(:root,:root *){display:block}}}}",
        ),
        (
            "block@sm@apply(--dark)",
            "@layer utilities{@media (width>=52.125rem){@media (prefers-color-scheme:dark){.block\\@sm\\@apply\\(--dark\\):where(:root,:root *){display:block}}}}",
        ),
    ] {
        let mut engine = EngineSession::create(MANIFEST).unwrap();
        engine.ensure_class_rules([class_name]).unwrap();
        assert_eq!(engine.css_text(), expected, "{class_name}");
    }

    let engine = EngineSession::create(MANIFEST).unwrap();
    let original = engine.inspect("block@apply(--dark)@sm").unwrap();
    let canonical = engine.inspect("block@sm@apply(--dark)").unwrap();
    assert_ne!(
        original.rules[0].priority.features,
        canonical.rules[0].priority.features
    );
    assert_ne!(
        original.rules[0].priority.conditions,
        canonical.rules[0].priority.conditions
    );
}

#[test]
fn renders_the_compiled_condition_grammar() {
    for (class_name, expected_condition) in [
        (
            "display:block@media((pointer:coarse))",
            "@media (pointer:coarse)",
        ),
        (
            "display:block@media((height<52.125rem))",
            "@media (height<52.125rem)",
        ),
        (
            "display:block@media((52.125rem<=height<80rem))",
            "@media (52.125rem<=height<80rem)",
        ),
        ("display:block@starting-style", "@starting-style"),
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
    let mut engine = EngineSession::create(r#"{"version":5,"languageVersion":14}"#).unwrap();
    engine.ensure_class_rules(["margin-top:0>div"]).unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer utilities{.margin-top\\:0\\>div>div{margin-top:0}}"
    );

    let mut engine = EngineSession::create(MANIFEST).unwrap();
    let class_name = "background:transparent_:is(.monaco-editor,.monaco-editor-background,.monaco-editor_.margin)";
    engine.ensure_class_rules([class_name]).unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer utilities{.background\\:transparent_\\:is\\(\\.monaco-editor\\,\\.monaco-editor-background\\,\\.monaco-editor_\\.margin\\) :is(.monaco-editor,.monaco-editor-background,.monaco-editor .margin){background:transparent}}"
    );
}

#[test]
fn native_property_precedes_overlapping_enum_name() {
    let manifest = r#"{"version":5,"languageVersion":14,"mixins":[{"name":"--text-wrap","body":[{"type":"declaration","property":"text-wrap","value":[{"type":"text","value":"wrap"}]}]},{"name":"--text-pretty","body":[{"type":"declaration","property":"text-wrap","value":[{"type":"text","value":"pretty"}]}]}]}"#;
    let mut engine = EngineSession::create(manifest).unwrap();
    engine.ensure_class_rules(["text-wrap:pretty"]).unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer utilities{.text-wrap\\:pretty{text-wrap:pretty}}"
    );
}

#[test]
fn preserves_math_function_names_that_overlap_inline_variables() {
    let mut engine = EngineSession::create(MANIFEST).unwrap();
    engine
        .ensure_class_rules(["width:min(1px,max(2px,3px))"])
        .unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer utilities{.width\\:min\\(1px\\,max\\(2px\\,3px\\)\\){width:min(1px, max(2px, 3px))}}"
    );
}

#[test]
fn prefers_exact_utilities_over_patterns_and_rejects_legacy_variable_functions() {
    let manifest = r#"{"version":5,"languageVersion":14,"mixins":[{"name":"--text-left","body":[{"type":"declaration","property":"text-align","value":[{"type":"function","name":"var","value":[{"type":"text","value":"--value"}]}]}]},{"name":"--text-center","body":[{"type":"declaration","property":"text-align","value":[{"type":"function","name":"var","value":[{"type":"text","value":"--value"}]}]}]},{"name":"--text-center","body":[{"type":"declaration","property":"text-align","value":[{"type":"text","value":"start"}]}]}]}"#;
    let engine = EngineSession::create(manifest).unwrap();
    assert_eq!(
        engine.inspect("text-center").unwrap().rules[0].text,
        ".text-center{text-align:start}"
    );

    let engine = EngineSession::create(r#"{"version":5,"languageVersion":14}"#).unwrap();
    assert!(
        engine.inspect("margin:$(spacing-x1)").unwrap().match_status
            != mastercss_schema::MatchStatus::Matched
    );
    assert!(
        engine
            .inspect("width:calc(-2px+$(spacing-x1))")
            .unwrap()
            .match_status
            != mastercss_schema::MatchStatus::Matched
    );
}

#[test]
fn mixin_variants_keep_the_requested_layer() {
    let manifest = r#"{"version":5,"languageVersion":14,"mixins":[{"name":"--demo","body":[{"type":"declaration","property":"display","value":[{"type":"text","value":"flex"}]}]}],"customMedia":{}}"#;
    let mut engine = EngineSession::create(manifest).unwrap();
    engine
        .ensure_class_rules(["demo@layer(defaults)", "demo@layer(components)"])
        .unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer defaults{.demo\\@layer\\(defaults\\){display:flex}}@layer components{.demo\\@layer\\(components\\){display:flex}}"
    );
}

#[test]
fn lets_native_key_aliases_handle_variables_outside_managed_namespaces() {
    let manifest = r#"{"version":5,"languageVersion":14,"variables":{"":[{"name":"stripe","key":"stripe","type":"string","values":[{"path":[":root,:host"],"value":"0 / 7.5px 7.5px linear-gradient(red,blue) transparent"}]}]},"theme":[{"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"stripe","value":"0 / 7.5px 7.5px linear-gradient(red,blue) transparent"}]}]}"#;
    let mut engine = EngineSession::create(manifest).unwrap();
    assert_eq!(
        engine
            .native_declaration_candidates(["background:var(--stripe)"])
            .unwrap(),
        vec![NativeDeclarationCandidateIr {
            class_name: "background:var(--stripe)".into(),
            property: "background".into(),
            value: "var(--stripe)".into(),
        }]
    );
    engine
        .ensure_class_rules(["background:var(--stripe)"])
        .unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer theme{:root,:host{--stripe:0 / 7.5px 7.5px linear-gradient(red,blue) transparent}}@layer utilities{.background\\:var\\(--stripe\\){background:var(--stripe)}}"
    );
}

#[test]
fn repeated_native_declarations_share_one_rule() {
    let manifest = r#"{"version":5,"languageVersion":14,"variables":{"":[{"name":"stripe","key":"stripe","type":"string","values":[{"path":[":root,:host"],"value":"linear-gradient(red,blue)"}]}]},"theme":[{"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"stripe","value":"linear-gradient(red,blue)"}]}]}"#;
    let mut engine = EngineSession::create(manifest).unwrap();
    engine
        .ensure_class_rules(["background:var(--stripe)"])
        .unwrap();
    engine
        .ensure_class_rules(["background:var(--stripe)"])
        .unwrap();

    assert!(
        engine
            .inspect("background:var(--stripe)")
            .unwrap()
            .match_status
            == mastercss_schema::MatchStatus::Matched
    );
    assert_eq!(
        engine.css_text(),
        "@layer theme{:root,:host{--stripe:linear-gradient(red,blue)}}@layer utilities{.background\\:var\\(--stripe\\){background:var(--stripe)}}"
    );
}
