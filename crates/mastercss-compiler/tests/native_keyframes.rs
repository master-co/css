use mastercss_compiler::{
    CompileManifestOptions, CompileNativeCssOptions, compile_css_directives, compile_manifest_input,
};
use mastercss_engine::EngineSession;

/// The native output of one stylesheet followed by the CSS its engine generates for
/// `classes`, as a static build delivers them.
fn compile(source: &str, classes: Option<&[&str]>) -> (EngineSession, String) {
    let parsed = compile_css_directives(
        source,
        &CompileNativeCssOptions {
            classes: classes.map(|values| values.iter().map(|value| (*value).into()).collect()),
            ..Default::default()
        },
    )
    .unwrap();
    let manifest =
        compile_manifest_input(&parsed.manifest_input, &CompileManifestOptions::default())
            .unwrap()
            .manifest;
    let mut engine = EngineSession::create(&manifest.to_string()).unwrap();
    engine
        .ensure_stylesheet_resources(&parsed.native_css)
        .unwrap();
    if let Some(classes) = classes {
        engine.ensure_class_rules(classes).unwrap();
    }
    let css = format!("{}\n{}", parsed.native_css, engine.css_text());
    (engine, css)
}

#[test]
fn preserved_keyframes_stay_native_and_verbatim() {
    let source = "@keyframes spin { to { rotate: 1turn } }\n@keyframes spin { to { rotate: -1turn } }\n.x { animation: spin 1s }";
    let parsed = compile_css_directives(source, &Default::default()).unwrap();
    // Lightning CSS would merge the same-name rules; native keyframes stay as authored.
    let first = parsed
        .native_css
        .find("@keyframes spin { to { rotate: 1turn } }");
    let second = parsed
        .native_css
        .find("@keyframes spin { to { rotate: -1turn } }");
    assert!(
        first
            .zip(second)
            .is_some_and(|(first, second)| first < second),
        "{}",
        parsed.native_css
    );
    assert!(!parsed.native_css.contains("master-css"));
    let definitions = parsed.manifest_input.keyframes.as_deref().unwrap();
    assert_eq!(definitions.len(), 2);
    assert!(definitions.iter().all(|definition| definition.native));
    let (engine, css) = compile(source, Some(&["(animation:spin|1s)"]));
    assert_eq!(css.matches("@keyframes spin").count(), 2, "{css}");
    assert!(engine.snapshot().unwrap().resources.keyframes.is_empty());
}

#[test]
fn native_keyframes_share_native_preservation_policy() {
    let frames = "@keyframes fade{to{opacity:1}}@keyframes pop{to{opacity:.5}}";
    for policy in [
        "",
        "@preserve native;",
        "@prune native;@preserve native;",
        "@preserve native;@prune native;",
    ] {
        let (engine, css) = compile(&format!("{policy}{frames}"), Some(&[]));
        assert_eq!(css.matches("@keyframes").count(), 2, "{policy}: {css}");
        assert!(engine.snapshot().unwrap().resources.keyframes.is_empty());
    }
    let (engine, css) = compile(&format!("@prune native;{frames}"), Some(&[]));
    assert!(!css.contains("@keyframes"), "{css}");
    assert!(engine.snapshot().unwrap().resources.keyframes.is_empty());
}

#[test]
fn pruned_native_rules_are_not_animation_roots() {
    let source = "@prune native;.used{animation:fade 1s}.unused{animation:pop 1s}@keyframes fade{to{opacity:1}}@keyframes pop{to{opacity:0}}";
    let (_, css) = compile(source, Some(&["used"]));
    assert!(css.contains("@keyframes fade"), "{css}");
    assert!(!css.contains("@keyframes pop"), "{css}");
    let (_, all) = compile(source, None);
    assert_eq!(all.matches("@keyframes").count(), 2);
    let (_, empty) = compile(source, Some(&[]));
    assert!(!empty.contains("@keyframes"));
}

#[test]
fn exact_keyframe_safelist_does_not_generate_classes() {
    let (engine, css) = compile(
        r#"@prune native;@safelist keyframes "fade" "with space";@keyframes fade{to{opacity:1}}@keyframes "with space"{to{opacity:.5}}@keyframes Fade{to{opacity:0}}"#,
        Some(&[]),
    );
    assert_eq!(css.matches("@keyframes").count(), 2, "{css}");
    assert!(!css.contains("@keyframes Fade"));
    assert!(engine.snapshot().unwrap().rules.is_empty());
    let parsed = compile_css_directives(
        r#"@safelist keyframes "\66 ade" "with space";@safelist "(display:flex) (opacity:1)";"#,
        &Default::default(),
    )
    .unwrap();
    assert_eq!(
        parsed.extraction_policy.safelist_keyframes,
        ["fade", "with space"]
    );
    assert_eq!(
        parsed.extraction_policy.safelist,
        ["(display:flex)", "(opacity:1)"]
    );
}

#[test]
fn keyframes_inside_theme_and_malformed_safelists_are_errors() {
    for source in [
        "@theme{@keyframes fade{to{opacity:1}}}",
        "@theme static{@keyframes fade{to{opacity:1}}}",
    ] {
        let error = compile_css_directives(source, &Default::default()).unwrap_err();
        assert!(error.to_string().contains("move @keyframes"), "{error}");
        assert!(error.diagnostic().range.is_some());
    }
    for source in [
        "@safelist keyframes;",
        "@safelist keyframes fade;",
        "@safelist keyframes \"fade\",\"pop\";",
        "@safelist keyframes \"fade\"",
        "@media all{@safelist keyframes \"fade\";}",
    ] {
        assert!(
            compile_css_directives(source, &Default::default()).is_err(),
            "{source}"
        );
    }
}

#[test]
fn same_names_are_emitted_in_their_conditions_and_layers() {
    let source = "@prune native;@layer before;@layer motion{.kept{opacity:1}@keyframes fade{to{opacity:.2}}@media(width>50rem){@keyframes fade{to{opacity:.4}}}}@supports(display:grid){@keyframes fade{to{opacity:.6}}}@keyframes fade{to{opacity:.8}}.after{opacity:.9}";
    let (engine, css) = compile(source, Some(&["kept", "after", "(animation-name:fade)"]));
    let frames = engine.snapshot().unwrap().resources.keyframes;
    let ids = frames
        .iter()
        .map(|frame| &frame.id)
        .collect::<std::collections::HashSet<_>>();
    assert_eq!(ids.len(), 4, "{css}");
    assert!(css.find(".after").unwrap() < css.find("@keyframes fade").unwrap());
    assert!(
        engine.css_text().ends_with(
            "@layer motion{@keyframes fade{to{opacity:.2}}@media(width>50rem){@keyframes fade{to{opacity:.4}}}}@supports(display:grid){@keyframes fade{to{opacity:.6}}}@keyframes fade{to{opacity:.8}}"
        ),
        "{}",
        engine.css_text()
    );
}

#[test]
fn on_demand_keyframes_need_reenterable_containers_and_portable_urls() {
    for source in [
        "@prune native;@layer{@keyframes fade{to{opacity:1}}}",
        "@prune native;@keyframes probe{to{background:url('./original.svg')}}",
        "@prune native;@keyframes probe{to{background:url(icons/a.svg)}}",
    ] {
        let error = compile_css_directives(source, &Default::default()).unwrap_err();
        assert!(error.to_string().contains("On-demand keyframes"), "{error}");
        assert!(error.diagnostic().range.is_some());
    }
    // Native keyframes keep their URLs for the host's asset pipeline.
    let parsed = compile_css_directives(
        "@layer{@keyframes probe{to{background:url('./original.svg')}}}",
        &Default::default(),
    )
    .unwrap();
    assert!(parsed.native_css.contains("url('./original.svg')"));
    let (_, css) = compile(
        "@prune native;@keyframes probe{to{background:url('/assets/final.svg')}}",
        Some(&["(animation-name:probe)"]),
    );
    assert!(css.contains("background:url('/assets/final.svg')"), "{css}");
}

#[test]
fn last_dynamic_use_releases_all_definitions_and_body_tokens() {
    let source = "@prune native;@theme{--color-frame:red}@keyframes fade{to{color:var(--color-frame)}}@media(width>30rem){@keyframes fade{to{opacity:.5}}}";
    let (mut engine, _) = compile(source, Some(&[]));
    engine
        .ensure_class_rules(["(animation-name:fade)", "(animation:fade|1s)"])
        .unwrap();
    assert_eq!(engine.snapshot().unwrap().resources.keyframes.len(), 2);
    engine
        .delete_class_rules(["(animation-name:fade)"])
        .unwrap();
    assert_eq!(engine.snapshot().unwrap().resources.keyframes.len(), 2);
    engine.delete_class_rules(["(animation:fade|1s)"]).unwrap();
    let snapshot = engine.snapshot().unwrap();
    assert!(snapshot.resources.keyframes.is_empty());
    assert!(snapshot.resources.variables.is_empty());
    assert!(!snapshot.text.contains("@keyframes"));
}

#[test]
fn native_definitions_are_never_emitted_but_root_the_tokens_their_frames_read() {
    let source =
        "@theme{--color-frame:red}@preserve native;@keyframes fade{to{color:var(--color-frame)}}";
    let parsed = compile_css_directives(
        source,
        &CompileNativeCssOptions {
            preserve_native_css: false,
            ..Default::default()
        },
    )
    .unwrap();
    assert!(parsed.native_css.is_empty());
    let definitions = parsed.manifest_input.keyframes.clone().unwrap();
    assert_eq!(definitions.len(), 1);
    assert!(definitions[0].native);
    let manifest = compile_manifest_input(&parsed.manifest_input, &Default::default())
        .unwrap()
        .manifest;
    let mut engine = EngineSession::create(&manifest.to_string()).unwrap();
    engine
        .ensure_class_rules(["(animation-name:fade)"])
        .unwrap();
    // Whoever delivers the native stylesheet delivers its keyframes; a use roots
    // the tokens its frames read.
    let snapshot = engine.snapshot().unwrap();
    assert!(snapshot.resources.keyframes.is_empty());
    assert!(!snapshot.text.contains("@keyframes"));
    assert_eq!(snapshot.resources.variables[0].name, "color-frame");
    engine
        .delete_class_rules(["(animation-name:fade)"])
        .unwrap();
    assert!(engine.snapshot().unwrap().resources.variables.is_empty());
    assert_eq!(engine.keyframe_definitions().unwrap().len(), 1);
}

#[test]
fn undelivered_on_demand_keyframes_are_still_emitted_on_use() {
    let parsed = compile_css_directives(
        "@prune native;@keyframes fade{to{opacity:1}}",
        &CompileNativeCssOptions {
            preserve_native_css: false,
            ..Default::default()
        },
    )
    .unwrap();
    let manifest = compile_manifest_input(&parsed.manifest_input, &Default::default())
        .unwrap()
        .manifest;
    let mut engine = EngineSession::create(&manifest.to_string()).unwrap();
    assert!(!engine.css_text().contains("@keyframes"));
    engine
        .ensure_class_rules(["(animation-name:fade)"])
        .unwrap();
    assert!(engine.css_text().contains("@keyframes fade{to{opacity:1}}"));
}

#[test]
fn preserved_source_removes_on_demand_keyframes_with_utf16_maps() {
    let source = "/* 😀 */\n@prune native;\n@layer motion { @keyframes fade { to { opacity:1 } } }\n.after {color:red}";
    let parsed = compile_css_directives(
        source,
        &CompileNativeCssOptions {
            preserve_native_source: true,
            ..Default::default()
        },
    )
    .unwrap();
    assert!(!parsed.native_css.contains("@keyframes"));
    assert!(parsed.native_css.contains(".after {color:red}"));
    let after = parsed.native_css.find(".after").unwrap();
    let offset = parsed.native_css[..after].encode_utf16().count() as u32;
    let mapping = parsed
        .native_mappings
        .iter()
        .find(|mapping| mapping.generated_start == offset)
        .unwrap();
    assert_eq!(
        mapping.source.range.start,
        source[..source.find(".after").unwrap()]
            .encode_utf16()
            .count() as u32
    );
}

#[test]
fn vendor_definitions_keep_their_identity_and_order() {
    let (_, css) = compile(
        "@prune native;@-webkit-keyframes fade{to{opacity:.5}}@keyframes fade{to{opacity:1}}",
        Some(&["(animation-name:fade)"]),
    );
    assert!(css.find("@-webkit-keyframes").unwrap() < css.find("@keyframes").unwrap());
}

#[test]
fn atomic_refresh_replaces_definitions_and_external_ownership() {
    let (mut engine, _) = compile(
        "@prune native;@keyframes fade{to{opacity:1}}",
        Some(&["(animation-name:fade)"]),
    );
    let parsed = compile_css_directives(
        "@prune native;@safelist keyframes \"next\";@keyframes next{to{opacity:.5}}",
        &Default::default(),
    )
    .unwrap();
    let manifest = compile_manifest_input(&parsed.manifest_input, &Default::default())
        .unwrap()
        .manifest;
    engine
        .refresh_with_emitted_globals(&manifest.to_string(), Some("{}"))
        .unwrap();
    let resources = engine.snapshot().unwrap().resources.keyframes;
    assert_eq!(resources.len(), 1);
    assert_eq!(resources[0].name, "next");
    let before = engine.snapshot().unwrap();
    assert!(
        engine
            .refresh_with_emitted_globals("{}", Some("{}"))
            .is_err()
    );
    assert_eq!(engine.snapshot().unwrap(), before);
}

#[test]
fn identical_text_in_different_sources_has_independent_identity() {
    let source = "@keyframes same{to{opacity:1}}";
    let compile = |file: &str| {
        compile_css_directives(
            source,
            &CompileNativeCssOptions {
                from: file.into(),
                ..Default::default()
            },
        )
        .unwrap()
        .manifest_input
        .keyframes
        .unwrap()
        .remove(0)
    };
    let a = compile("first.css");
    let b = compile("second.css");
    assert_ne!(a.id, b.id);
    assert_eq!(a.id, compile("first.css").id);
}
