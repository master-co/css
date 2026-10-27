use mastercss_compiler::{CompileCssStylesheetGraphRequest, compile_css_stylesheet_graph};
use mastercss_engine::EngineSession;
use serde_json::json;

fn request(entry: &str, child: &str) -> CompileCssStylesheetGraphRequest {
    serde_json::from_value(json!({"graph":{"entry":"entry.css","files":{"entry.css":entry,"child.css":child},"edges":[{"from":"entry.css","specifier":"./child.css","resolved":"child.css"}]},"urls":{"entry.css":"/out/entry.css","child.css":"/out/child.css"}})).unwrap()
}

#[test]
fn delivered_native_roots_resolve_all_files_and_preserve_definition_url_ownership() {
    let mut request = request(
        "@import './child.css';.run{animation:var(--motion)}",
        "@prune native;@theme{}@keyframes reveal{to{background:url('./image.png');opacity:0;opacity:1}}.dark{--motion:reveal 1s}",
    );
    request.resource_urls = Some(std::collections::HashMap::from([(
        "child.css".into(),
        std::collections::HashMap::from([("./image.png".into(), "/assets/image.png".into())]),
    )]));
    let result = compile_css_stylesheet_graph(&request).unwrap();
    let mut engine = EngineSession::create(&result.resolution_manifest.to_string()).unwrap();
    for sheet in &result.stylesheets {
        engine.ensure_stylesheet_resources(&sheet.css).unwrap();
    }
    let frame = &engine.snapshot().unwrap().resources.keyframes[0];
    assert!(frame.text.contains("/assets/image.png"), "{}", frame.text);
    assert!(frame.text.contains("opacity:0;opacity:1"));
    let definition = &result.manifest["keyframes"][0];
    assert!(
        definition["resources"][0]["value"]
            .as_str()
            .unwrap()
            .contains("/assets/image.png")
    );
    assert!(result.stylesheets.iter().any(|sheet| {
        sheet
            .css
            .contains("--master-css-keyframe-resource-0:url(\"/assets/image.png\")")
    }));
    assert_eq!(
        result.manifest["keyframes"][0]["source"]["file"],
        "child.css"
    );
    assert_eq!(
        engine.emitted_globals_snapshot().unwrap().keyframes[&frame.id],
        1
    );
}

#[test]
fn same_name_definitions_across_imports_keep_both_sources() {
    let result = compile_css_stylesheet_graph(&request(
        "@import './child.css';@keyframes reveal{to{opacity:1}}",
        "@keyframes reveal{to{opacity:.5}}",
    ))
    .unwrap();
    let definitions = result.manifest["keyframes"].as_array().unwrap();
    assert_eq!(definitions.len(), 2);
    assert_eq!(definitions[0]["source"]["file"], "child.css");
    assert_eq!(definitions[1]["source"]["file"], "entry.css");
    assert_ne!(definitions[0]["id"], definitions[1]["id"]);
}

#[test]
fn suppressed_native_styles_never_add_roots_or_custom_property_overrides() {
    let mut request = request(
        "@import './child.css';@prune native;@theme {--animate-run:one 1s;}@keyframes one{to{opacity:1}}@keyframes two{to{opacity:.5}}",
        ".hidden{--animate-run:two 1s;animation:var(--unknown)}@keyframes one{to{opacity:0}}",
    );
    request.native_stylesheets = Some(vec!["entry.css".into()]);
    let result = compile_css_stylesheet_graph(&request).unwrap();
    assert!(result.manifest.get("animationVariables").is_none());
    let mut engine = EngineSession::create_with_emitted_globals(
        &result.manifest.to_string(),
        Some(
            &serde_json::json!({"suppressedKeyframes":result.directives.suppressed_keyframes})
                .to_string(),
        ),
    )
    .unwrap();
    engine
        .ensure_class_rules(["animation:var(--animate-run)"])
        .unwrap();
    let resources = engine.snapshot().unwrap().resources;
    assert_eq!(resources.keyframes.len(), 1);
    assert_eq!(resources.keyframes[0].name, "one");
}

#[test]
fn apply_expansion_is_a_local_root_and_unused_mixins_are_not() {
    let result = compile_css_stylesheet_graph(&request("@import './child.css';.caption{@apply --motion}", "@prune native;@theme{}@keyframes one{to{opacity:1}}@keyframes two{to{opacity:0}}@mixin --motion{animation:one 1s} @utility motion {animation:one 1s}@mixin --unused{animation:two 1s} @utility unused {animation:two 1s}")).unwrap();
    let mut engine = EngineSession::create(&result.manifest.to_string()).unwrap();
    for sheet in &result.stylesheets {
        engine.ensure_stylesheet_resources(&sheet.css).unwrap();
    }
    assert_eq!(engine.snapshot().unwrap().resources.keyframes.len(), 1);
    assert!(
        engine
            .snapshot()
            .unwrap()
            .stylesheets
            .iter()
            .any(|css| css.contains("@keyframes one"))
    );
    assert!(!engine.css_text().contains(".motion"));
}

#[test]
fn dynamic_native_roots_report_information_at_the_authored_source() {
    let result = compile_css_stylesheet_graph(&request("@import './child.css';@prune native;@theme{}@keyframes managed{to{opacity:1}}", "/* source */\n.run{animation:var(--unknown)}\n@keyframes native{to{animation:var(--ignored)}}")).unwrap();
    assert_eq!(result.directives.notices.len(), 1);
    let notice = &result.directives.notices[0];
    assert_eq!(
        notice.source.as_ref().unwrap().file.as_deref(),
        Some("child.css")
    );
    assert_eq!(
        notice
            .source
            .as_ref()
            .unwrap()
            .loc
            .as_ref()
            .unwrap()
            .start
            .line,
        2
    );
}

#[test]
fn native_policies_stay_local_and_safelists_resolve_across_the_graph() {
    let mut input = request(
        "@import './child.css' layer screen;@prune native;@safelist keyframes \"child\";@keyframes parent{to{opacity:1}}",
        "@prune native;@keyframes child{to{opacity:.5}}@keyframes unused{to{opacity:0}}",
    );
    input.options.classes = Some(vec![]);
    let result = compile_css_stylesheet_graph(&input).unwrap();
    assert!(result.directives.warnings.is_empty());
    let css = result
        .stylesheets
        .iter()
        .map(|sheet| sheet.css.as_str())
        .collect::<String>();
    assert!(css.contains("@keyframes child"), "{css}");
    assert!(!css.contains("@keyframes parent"), "{css}");
    assert!(!css.contains("@keyframes unused"), "{css}");

    input.graph.files.insert(
        "child.css".into(),
        "@keyframes child{to{opacity:.5}}@keyframes unused{to{opacity:0}}".into(),
    );
    let result = compile_css_stylesheet_graph(&input).unwrap();
    let css = result
        .stylesheets
        .iter()
        .map(|sheet| sheet.css.as_str())
        .collect::<String>();
    assert!(
        css.contains("@keyframes unused"),
        "parent prune must not cross import: {css}"
    );
}

#[test]
fn repeated_imports_retain_distinct_definitions_and_anonymous_layer_identity() {
    let input = request(
        "@import './child.css' layer;@import './child.css' layer;",
        "@prune native;@safelist keyframes \"shared\";@keyframes shared{to{opacity:1}}",
    );
    let result = compile_css_stylesheet_graph(&input).unwrap();
    let frames = result.manifest["keyframes"].as_array().unwrap();
    assert_eq!(frames.len(), 2);
    assert_ne!(frames[0]["id"], frames[1]["id"]);
    assert_ne!(
        frames[0]["containers"][0]["id"],
        frames[1]["containers"][0]["id"]
    );
    assert_eq!(frames[0]["occurrence"], 0);
    assert_eq!(frames[1]["occurrence"], 1);
    assert_eq!(frames[0]["slotId"], frames[1]["slotId"]);
}
