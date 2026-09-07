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
            "block@supports(display:grid)",
            "@layer utilities{@supports (display:grid){.block\\@supports\\(display\\:grid\\){display:block}}}",
        ),
        (
            "block@container(h>160)",
            "@layer utilities{@container (height>10rem){.block\\@container\\(h\\>160\\){display:block}}}",
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
        ("w:1x", "@layer utilities{.w\\:1x{width:0.25rem}}"),
        ("m:-1x", "@layer utilities{.m\\:-1x{margin:-.25rem}}"),
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
fn tracks_keyframes_only_from_animation_declarations() {
    let manifest = include_str!("../../../../packages/preset/src/default-manifest.json");
    let mut engine = EngineSession::create(manifest).unwrap();
    engine
        .ensure_class_rules(["float:left", "rotate:180deg"])
        .unwrap();
    assert!(!engine.css_text().contains("@keyframes"));
    assert!(
        engine
            .inspect("float:left")
            .unwrap()
            .rules
            .iter()
            .all(|rule| rule.animation_names.is_empty())
    );

    engine.ensure_class_rules(["animation:float|1s"]).unwrap();
    assert!(engine.css_text().contains("@keyframes float{"));
    assert_eq!(
        engine.inspect("animation:float|1s").unwrap().rules[0].animation_names,
        ["float"]
    );
}

#[test]
fn tracks_theme_variables_referenced_by_keyframes() {
    let manifest = r##"{
          "version":1,
          "variables":{"color":[{"name":"color-primary","key":"primary","value":"#ff0"}]},
          "animations":{"fade":{"to":{"background":"var(--color-primary)"}}},
          "utilities":[{
            "id":".btn",
            "name":"btn",
            "type":-2,
            "layer":"components",
            "emit":{"type":"static","rules":[{"declarations":{"animation":"1s fade"}}]},
            "matchers":[{"type":"static","name":"btn"}]
          }]
        }"##;
    let mut engine = EngineSession::create(manifest).unwrap();

    engine.ensure_class_rules(["btn"]).unwrap();
    assert_eq!(
        engine.resource_snapshot().theme_text.as_deref(),
        Some(":root{--color-primary:#ff0}")
    );
    assert!(
        engine
            .css_text()
            .contains("@keyframes fade{to{background:var(--color-primary)}}")
    );

    engine.delete_class_rules(["btn"]).unwrap();
    assert!(engine.resource_snapshot().theme_text.is_none());
    assert!(!engine.css_text().contains("@keyframes fade"));
}

#[test]
fn parses_each_compound_condition_as_a_condition() {
    for (class_name, expected) in [
        (
            "block@dark@sm",
            "@layer utilities{@media (prefers-color-scheme:dark) and (width>=52.125rem){.block\\@dark\\@sm{display:block}}}",
        ),
        (
            "block@sm@dark",
            "@layer utilities{@media (width>=52.125rem) and (prefers-color-scheme:dark){.block\\@sm\\@dark{display:block}}}",
        ),
    ] {
        let mut engine = EngineSession::create(MANIFEST).unwrap();
        engine.ensure_class_rules([class_name]).unwrap();
        assert_eq!(engine.css_text(), expected, "{class_name}");
    }

    let engine = EngineSession::create(MANIFEST).unwrap();
    let original = engine.inspect("block@dark@sm").unwrap();
    let canonical = engine.inspect("block@sm@dark").unwrap();
    assert_eq!(original.rules[0].priority, canonical.rules[0].priority);
}

#[test]
fn renders_the_compiled_condition_grammar() {
    for (class_name, expected_condition) in [
        ("block@media(pointer:coarse)", "@media (pointer:coarse)"),
        ("block@h<sm", "@media (height<52.125rem)"),
        (
            "block@h>=sm&h<lg",
            "@media (height>=52.125rem) and (height<80rem)",
        ),
        ("block@!sm", "@media not (width>=52.125rem)"),
        ("block@only(print)", "@media only print"),
        (
            "block@!(screen&(any-hover:hover))",
            "@media not (screen and (any-hover:hover))",
        ),
        (
            "block@<sm,>=lg",
            "@media (width<52.125rem) or (width>=80rem)",
        ),
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
    let mut engine = EngineSession::create(r#"{"version":1,"utilities":[]}"#).unwrap();
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
        "@layer utilities{.bg\\:transparent_\\:is\\(\\.monaco-editor\\,\\.monaco-editor-background\\,\\.monaco-editor_\\.margin\\) :is(.monaco-editor,.monaco-editor-background,.monaco-editor .margin){background-color:transparent}}"
    );
}

#[test]
fn preserves_pattern_utility_precedence_inside_groups() {
    let manifest = r#"{
          "version":1,
          "utilities":[{
            "id":"text-<wrap|pretty>",
            "type":-2,
            "emit":{"type":"static","rules":[{"declarations":{"text-wrap":null}}]},
            "matchers":[{"type":"pattern","prefix":"text-","values":["wrap","pretty"]}]
          }]
        }"#;
    let mut engine = EngineSession::create(manifest).unwrap();
    engine
        .ensure_class_rules_with_native_support(["{text-wrap:pretty}"], &[true])
        .unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer utilities{.\\{text-wrap\\:pretty\\}{text-wrap:wrap}}"
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
    let manifest = r#"{
          "version":1,
          "utilities":[
            {
              "id":"text-<left|center>",
              "type":-2,
              "emit":{"type":"template","declarations":{"text-align":"$value"}},
              "matchers":[{"type":"pattern","prefix":"text-","values":["left","center"]}]
            },
            {
              "id":"text-center",
              "type":-2,
              "emit":{"type":"static","rules":[{"declarations":{"text-align":"start"}}]},
              "matchers":[{"type":"static","name":"text-center"}]
            }
          ]
        }"#;
    let engine = EngineSession::create(manifest).unwrap();
    assert_eq!(
        engine.inspect("text-center").unwrap().rules[0].text,
        ".text-center{text-align:start}"
    );

    let engine = EngineSession::create(r#"{"version":1,"utilities":[]}"#).unwrap();
    assert!(!engine.inspect("margin:$(spacing-x1)").unwrap().valid);
    assert!(
        !engine
            .inspect("width:calc(-2px+$(spacing-x1))")
            .unwrap()
            .valid
    );
}

#[test]
fn preserves_all_static_rules_for_the_same_class_across_layers() {
    let manifest = r#"{
          "version":1,
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
    let manifest = r#"{
          "version":1,
          "variables":{"":[
            {
              "name":"stripe",
              "key":"stripe",
              "type":"string",
              "value":"0 / 7.5px 7.5px linear-gradient(red,blue) transparent"
            }
          ]},
          "utilities":[{
            "id":"bg:<~color|color>",
            "type":0,
            "kind":"color",
            "variableAliasRefs":["~color"],
            "emit":{"type":"static","rules":[{"declarations":{"background-color":null}}]},
            "matchers":[
              {"type":"variable","keys":["bg"]},
              {"type":"value","keys":["bg"]}
            ]
          }]
        }"#;
    let mut engine = EngineSession::create(manifest).unwrap();
    assert_eq!(
        engine.native_declaration_candidates(["bg:stripe"]).unwrap(),
        vec![NativeDeclarationCandidateIr {
            class_name: "bg:stripe".into(),
            property: "background".into(),
            value: "var(--stripe)".into(),
        }]
    );
    engine
        .ensure_class_rules_with_native_support(["bg:stripe"], &[true])
        .unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer theme{:root{--stripe:0 / 7.5px 7.5px linear-gradient(red,blue) transparent}}@layer utilities{.bg\\:stripe{background:var(--stripe)}}"
    );
}

#[test]
fn preserves_native_alias_matchers_for_shared_declarations() {
    let manifest = r#"{
          "version":1,
          "variables":{"":[
            {
              "name":"stripe",
              "key":"stripe",
              "type":"string",
              "value":"linear-gradient(red,blue)"
            }
          ]},
          "utilities":[]
        }"#;
    let mut engine = EngineSession::create(manifest).unwrap();
    engine
        .ensure_class_rules_with_native_support(["background:var(--stripe)"], &[true])
        .unwrap();
    engine
        .ensure_class_rules_with_native_support(["bg:stripe"], &[true])
        .unwrap();

    assert!(engine.inspect("bg:stripe").unwrap().valid);
    assert_eq!(
        engine.css_text(),
        "@layer theme{:root{--stripe:linear-gradient(red,blue)}}@layer utilities{.background\\:var\\(--stripe\\){background:var(--stripe)}.bg\\:stripe{background:var(--stripe)}}"
    );
}

#[test]
fn resolves_dependencies_of_inline_variables_without_emitting_resources() {
    let manifest = r##"{
          "version":1,
          "variables":{"color":[
            {"name":"color-primary","key":"primary","value":"#123","inline":true},
            {"name":"color-brand","key":"brand","value":"var(--color-primary)","inline":true}
          ]},
          "utilities":[{
            "id":"foreground",
            "type":0,
            "variableAliasRefs":["color"],
            "emit":{"type":"property","property":"color"},
            "matchers":[{"type":"variable","keys":["fg"]}]
          }]
        }"##;
    let mut engine = EngineSession::create(manifest).unwrap();
    engine.ensure_class_rules(["fg:brand"]).unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer utilities{.fg\\:brand{color:#123}}"
    );
    assert!(
        engine
            .snapshot()
            .unwrap()
            .resources
            .theme_text
            .is_none_or(|text| text.is_empty())
    );
}

#[test]
fn resolves_inline_dependencies_in_emitted_base_and_mode_variables() {
    let manifest = r##"{
          "version":1,
          "settings":{"defaultMode":"light","modeTrigger":"class","modes":["light","dark"]},
          "variables":{
            "color":[
              {"name":"color-white","key":"white","value":"oklch(100% 0 none)","inline":true},
              {"name":"color-brand","key":"brand","value":"var(--color-white)","dependencies":["color-white"],"inline":true},
              {"name":"color-gray-90","key":"gray-90","value":"oklch(23.5% 0 none)"}
            ],
            "color-surface":[
              {
                "name":"color-surface-raised",
                "key":"raised",
                "dependencies":["color-brand","color-gray-90"],
                "modes":{
                  "light":{"value":"VAR( --color-brand, red)"},
                  "dark":{"value":"var(--color-gray-90)"}
                }
              }
            ]
          },
          "utilities":[{
            "id":"surface",
            "type":0,
            "variableAliasRefs":["color-surface"],
            "emit":{"type":"property","property":"background-color"},
            "matchers":[{"type":"variable","keys":["surface"]}]
          }]
        }"##;
    let mut engine = EngineSession::create(manifest).unwrap();
    engine.ensure_class_rules(["surface:raised"]).unwrap();
    assert_eq!(
        engine.css_text(),
        "@layer theme{.light,:root{color-scheme:light;--color-surface-raised:oklch(100% 0 none)}:root{--color-gray-90:oklch(23.5% 0 none)}.dark{color-scheme:dark;--color-surface-raised:var(--color-gray-90)}}@layer utilities{.surface\\:raised{background-color:var(--color-surface-raised)}}"
    );
    assert_eq!(
        engine
            .snapshot()
            .unwrap()
            .resources
            .variables
            .iter()
            .map(|resource| resource.name.as_str())
            .collect::<Vec<_>>(),
        ["color-surface-raised", "color-gray-90"]
    );

    let refreshed = manifest.replace("oklch(100% 0 none)", "#fff");
    engine.refresh(&refreshed).unwrap();
    assert!(engine.css_text().contains("--color-surface-raised:#fff"));
    assert!(!engine.css_text().contains("--color-white:"));

    engine.delete_class_rules(["surface:raised"]).unwrap();
    assert_eq!(engine.css_text(), "");
}

#[test]
fn rejects_circular_inline_variable_references() {
    let error = EngineSession::create(
        r##"{
              "version":1,
              "variables":{"color":[
                {"name":"color-a","key":"a","value":"var(--color-b)","inline":true},
                {"name":"color-b","key":"b","value":"var(--color-a)","inline":true}
              ]}
            }"##,
    )
    .unwrap_err();
    assert_eq!(
        error.to_string(),
        "Invalid MasterCSSManifest engine field: Circular inline variable reference: color-a -> color-b -> color-a"
    );
}
