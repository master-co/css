use mastercss_compiler::{
    CompileManifestOptions, CompileNativeCssOptions, compile_css_directives, compile_manifest_input,
};
use mastercss_engine::EngineSession;

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
    if let Some(classes) = classes {
        engine.ensure_class_rules(classes).unwrap();
    }
    engine
        .ensure_stylesheet_resources(&parsed.native_css)
        .unwrap();
    let css = engine.snapshot().unwrap().stylesheets.concat();
    (engine, css)
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
        let (_, css) = compile(&format!("{policy}{frames}"), Some(&[]));
        assert_eq!(css.matches("@keyframes").count(), 2, "{policy}: {css}");
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
        r#"@safelist keyframes "\66 ade" "with space";@safelist "display:flex opacity:1";"#,
        &Default::default(),
    )
    .unwrap();
    assert_eq!(
        parsed.extraction_policy.safelist_keyframes,
        ["fade", "with space"]
    );
    assert_eq!(
        parsed.extraction_policy.safelist,
        ["display:flex", "opacity:1"]
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
fn same_names_keep_conditions_layers_and_original_positions() {
    let source = "@prune native;@layer before;@layer{.kept{opacity:1}@keyframes fade{to{opacity:.2}}@media(width>50rem){@keyframes fade{to{opacity:.4}}}}@supports(display:grid){@keyframes fade{to{opacity:.6}}}@keyframes fade{to{opacity:.8}}.after{opacity:.9}";
    let (engine, css) = compile(source, Some(&["kept", "after", "animation-name:fade"]));
    let frames = engine.snapshot().unwrap().resources.keyframes;
    assert_eq!(frames.len(), 4, "{css}");
    let ids = frames
        .iter()
        .map(|frame| &frame.id)
        .collect::<std::collections::HashSet<_>>();
    assert_eq!(ids.len(), 4);
    assert_eq!(css.matches("@layer {").count(), 1, "{css}");
    assert!(css.find(".kept").unwrap() < css.find("@keyframes fade").unwrap());
    assert!(css.rfind("@keyframes fade").unwrap() < css.find(".after").unwrap());
    assert!(engine.css_text().contains("animation-name:fade"));
    assert!(!engine.css_text().contains("@keyframes"));
}

#[test]
fn last_dynamic_use_releases_all_definitions_and_body_tokens() {
    let source = "@prune native;@theme{--color-frame:red}@keyframes fade{to{color:var(--color-frame)}}@media(width>30rem){@keyframes fade{to{opacity:.5}}}";
    let (mut engine, _) = compile(source, Some(&[]));
    engine
        .ensure_class_rules(["animation-name:fade", "animation:fade|1s"])
        .unwrap();
    assert_eq!(engine.snapshot().unwrap().resources.keyframes.len(), 2);
    engine.delete_class_rules(["animation-name:fade"]).unwrap();
    assert_eq!(engine.snapshot().unwrap().resources.keyframes.len(), 2);
    engine.delete_class_rules(["animation:fade|1s"]).unwrap();
    let snapshot = engine.snapshot().unwrap();
    assert!(snapshot.resources.keyframes.is_empty());
    assert!(snapshot.resources.variables.is_empty());
    assert!(!snapshot.stylesheets.concat().contains("@keyframes"));
}

#[test]
fn native_output_suppression_wins_over_safelist_and_preserve() {
    let parsed = compile_css_directives(
        "@preserve native;@safelist keyframes \"fade\";@keyframes fade{to{opacity:1}}",
        &CompileNativeCssOptions {
            preserve_native_css: false,
            ..Default::default()
        },
    )
    .unwrap();
    assert!(parsed.native_css.is_empty());
    assert_eq!(parsed.suppressed_keyframes.len(), 1);
    assert_eq!(parsed.manifest_input.keyframes.unwrap().len(), 1);
}

#[test]
fn preserved_source_uses_the_same_resource_positions_and_utf16_maps() {
    let source = "/* 😀 */\n@prune native;\n@layer { @keyframes fade { to { opacity:1 } } }\n.after {color:red}";
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
fn suppressed_delivery_keeps_metadata_without_retaining_frame_body_tokens() {
    let parsed = compile_css_directives("@theme{--color-frame:red}@preserve native;@safelist keyframes \"fade\";@keyframes fade{to{color:var(--color-frame)}}", &CompileNativeCssOptions { preserve_native_css: false, ..Default::default() }).unwrap();
    let manifest = compile_manifest_input(&parsed.manifest_input, &Default::default())
        .unwrap()
        .manifest;
    let mut engine = EngineSession::create_with_emitted_globals(
        &manifest.to_string(),
        Some(&serde_json::json!({"suppressedKeyframes":parsed.suppressed_keyframes}).to_string()),
    )
    .unwrap();
    engine.ensure_class_rules(["animation-name:fade"]).unwrap();
    assert!(engine.snapshot().unwrap().resources.keyframes.is_empty());
    assert!(engine.snapshot().unwrap().resources.variables.is_empty());
    assert_eq!(engine.keyframe_definitions().unwrap().len(), 1);
}

#[test]
fn vendor_definitions_keep_their_identity_and_order() {
    let (_, css) = compile(
        "@prune native;@-webkit-keyframes fade{to{opacity:.5}}@keyframes fade{to{opacity:1}}",
        Some(&["animation-name:fade"]),
    );
    assert!(css.find("@-webkit-keyframes").unwrap() < css.find("@keyframes").unwrap());
}

#[test]
fn atomic_refresh_replaces_definitions_and_external_ownership() {
    let (mut engine, _) = compile(
        "@prune native;@keyframes fade{to{opacity:1}}",
        Some(&["animation-name:fade"]),
    );
    let parsed = compile_css_directives(
        "@preserve native;@keyframes next{to{opacity:.5}}",
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
fn identical_text_in_different_sources_has_independent_resource_ownership() {
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
    assert_ne!(a.owner_id, b.owner_id);
    assert_eq!(a.id, compile("first.css").id);
}

#[test]
fn server_snapshots_keep_transported_urls_without_retaining_inactive_slot_bodies() {
    let (engine, css) = compile(
        "@prune native;@keyframes probe{to{background:url('./original.svg')}}",
        Some(&[]),
    );
    let manifest = engine.manifest_json().unwrap();
    let mut server = EngineSession::create(&manifest.to_string()).unwrap();
    server
        .ensure_stylesheet_resources(&css.replace("./original.svg", "/assets/final.svg"))
        .unwrap();
    server.ensure_class_rules(["animation-name:probe"]).unwrap();
    let used = server
        .snapshot_for_classes(["animation-name:probe"])
        .unwrap();
    assert_eq!(used.stylesheets.len(), 1);
    assert!(used.stylesheets[0].contains("background:url('/assets/final.svg')"));
    assert!(!used.stylesheets[0].contains("original.svg"));
    let unused = server.snapshot_for_classes([] as [&str; 0]).unwrap();
    assert!(!unused.stylesheets[0].contains("@keyframes"));
    assert!(unused.resources.keyframes.is_empty());
}

#[test]
fn reference_resource_transport_has_no_animation_or_layer_roots() {
    let (engine, _) = compile(
        "@prune native;@layer reference{@keyframes probe{to{background:url('./original.svg')}}}",
        Some(&[]),
    );
    let manifest = engine.manifest_json().unwrap();
    let parsed: serde_json::Value = serde_json::from_str(&manifest).unwrap();
    let id = parsed["keyframes"][0]["id"].as_str().unwrap();
    let metadata = format!(
        "@media only all,(master-css-keyframe-resource-{id}){{:not(*){{--master-css-slot:0;--master-css-keyframe-resource-0:url('/assets/final.svg')}}}}"
    );
    let mut server = EngineSession::create(&manifest.to_string()).unwrap();
    server.ensure_stylesheet_resources(&metadata).unwrap();
    assert!(server.snapshot().unwrap().resources.keyframes.is_empty());
    assert!(!server.snapshot().unwrap().text.contains("@layer reference"));
    server.ensure_class_rules(["animation-name:probe"]).unwrap();
    let used = server
        .snapshot_for_classes(["animation-name:probe"])
        .unwrap();
    assert!(
        used.text.contains("background:url('/assets/final.svg')"),
        "{}",
        used.text
    );
    assert!(!used.resources.keyframes[0].anchored);
    assert_eq!(used.stylesheets, [metadata]);
}
