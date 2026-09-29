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
        "@theme{@keyframes reveal{to{background:url('./image.png');opacity:0;opacity:1}}}.dark{--motion:reveal 1s}",
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
    assert_eq!(
        result.manifest["keyframes"][0]["source"]["file"],
        "child.css"
    );
    assert_eq!(
        engine.emitted_globals_snapshot().unwrap().keyframes["reveal"],
        1
    );
}

#[test]
fn delivered_native_conflicts_report_the_two_source_files() {
    let error = compile_css_stylesheet_graph(&request(
        "@import './child.css';@theme{@keyframes reveal{to{opacity:1}}}",
        "@keyframes reveal{to{opacity:.5}}",
    ))
    .unwrap_err();
    let diagnostic = error.diagnostic();
    assert!(diagnostic.message.contains("entry.css"), "{diagnostic:?}");
    assert_eq!(diagnostic.source.as_deref(), Some("child.css"));
}

#[test]
fn suppressed_native_styles_never_add_roots_or_custom_property_overrides() {
    let mut request = request(
        "@import './child.css';@theme{:root{--animate-run:one 1s}@keyframes one{to{opacity:1}}@keyframes two{to{opacity:.5}}}",
        ".hidden{--animate-run:two 1s;animation:var(--unknown)}@keyframes one{to{opacity:0}}",
    );
    request.native_stylesheets = Some(vec!["entry.css".into()]);
    let result = compile_css_stylesheet_graph(&request).unwrap();
    assert!(result.manifest.get("animationVariables").is_none());
    let mut engine = EngineSession::create(&result.manifest.to_string()).unwrap();
    engine.ensure_class_rules(["animate-run"]).unwrap();
    let resources = engine.snapshot().unwrap().resources;
    assert_eq!(resources.keyframes.len(), 1);
    assert_eq!(resources.keyframes[0].name, "one");
}

#[test]
fn apply_expansion_is_a_local_root_and_unused_mixins_are_not() {
    let result = compile_css_stylesheet_graph(&request("@import './child.css';.caption{@apply --motion}", "@theme{@keyframes one{to{opacity:1}}@keyframes two{to{opacity:0}}}@mixin --motion{animation:one 1s}@mixin --unused{animation:two 1s}")).unwrap();
    let mut engine = EngineSession::create(&result.manifest.to_string()).unwrap();
    for sheet in &result.stylesheets {
        engine.ensure_stylesheet_resources(&sheet.css).unwrap();
    }
    assert_eq!(engine.snapshot().unwrap().resources.keyframes.len(), 1);
    assert!(engine.css_text().contains("@keyframes one"));
    assert!(!engine.css_text().contains(".motion"));
}

#[test]
fn dynamic_native_roots_report_information_at_the_authored_source() {
    let result = compile_css_stylesheet_graph(&request("@import './child.css';@theme{@keyframes managed{to{opacity:1}}}", "/* source */\n.run{animation:var(--unknown)}\n@keyframes native{to{animation:var(--ignored)}}")).unwrap();
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
