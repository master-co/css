use super::*;
use mastercss_engine::EngineSession;

fn compile(source: &str) -> (CompileCssDirectivesResult, Value) {
    let source = format!(
        "{source}@mixin --bg(--color){{background-color:var(--color)}} @utility bg(--color) {{background-color:var(--color)}}@utility bg-(--color) {{background-color:var(--color)}}@mixin --animate(--animate){{animation:var(--animate)}} @utility animate(--animate) {{animation:var(--animate)}}@utility animate-(--animate) {{animation:var(--animate)}}"
    );
    let result = compile_css_directives(&source, &CompileNativeCssOptions::default()).unwrap();
    let manifest =
        compile_manifest_input(&result.manifest_input, &CompileManifestOptions::default())
            .unwrap()
            .manifest;
    (result, manifest)
}
fn engine(source: &str) -> EngineSession {
    EngineSession::create(&compile(source).1.to_string()).unwrap()
}

#[test]
fn theme_modes_and_ordered_defaults() {
    let (_, manifest) =
        compile("@theme static inline{--color-brand:red;--color-brand:blue;--spacing-card:2rem}");
    assert_eq!(manifest["languageVersion"], 16);
    assert_eq!(manifest["theme"][0]["prelude"], ":root,:host");
    assert_eq!(manifest["theme"][0]["children"][0]["inline"], true);
    let mut engine = EngineSession::create(&manifest.to_string()).unwrap();
    assert!(
        engine
            .css_text()
            .contains("--color-brand:red;--color-brand:blue")
    );
    engine.ensure_class_rules(["bg-brand"]).unwrap();
    assert!(engine.css_text().contains("background-color:blue"));
    engine.delete_class_rules(["bg-brand"]).unwrap();
    assert!(
        engine
            .css_text()
            .contains("--color-brand:red;--color-brand:blue")
    );
    assert_eq!(
        compile("@theme inline static{--color-brand:red}").1,
        compile("@theme static inline{--color-brand:red}").1
    );
}

#[test]
fn only_theme_registers_tokens_and_native_css_keeps_delivery() {
    let (result, manifest) = compile(
        "@theme{--color-brand:white}:root{--color-native:red}[data-theme=ocean]{--color-brand:blue}",
    );
    assert!(
        result
            .native_css
            .replace(' ', "")
            .contains("--color-native:red")
    );
    assert_eq!(manifest["variables"]["color"].as_array().unwrap().len(), 1);
    let mut engine = EngineSession::create(&manifest.to_string()).unwrap();
    engine
        .ensure_class_rules(["bg-native", "bg-brand"])
        .unwrap();
    assert!(!engine.css_text().contains("bg-native"));
    assert!(
        engine
            .css_text()
            .contains("background-color:var(--color-brand)")
    );
    assert!(!engine.css_text().contains("ocean"));
}

#[test]
fn inline_is_one_pass_and_recomputes_dependencies() {
    let mut e = engine(
        "@theme{--color-base:red}@theme inline{--color-brand:var(--color-base);--color-alias:var(--color-brand)}",
    );
    e.ensure_class_rules(["bg-brand", "color:var(--color-alias)"])
        .unwrap();
    let css = e.css_text().replace(' ', "");
    assert!(css.contains("background-color:var(--color-base)"));
    assert!(css.contains("color:var(--color-brand)"));
    assert!(css.contains("--color-base:red"));
    assert!(css.contains("--color-brand:var(--color-base)"));
    assert!(!css.contains("--color-alias:"));
    e.delete_class_rules(["color:var(--color-alias)"]).unwrap();
    assert!(!e.css_text().contains("--color-brand:"));
    e.delete_class_rules(["bg-brand"]).unwrap();
    assert!(e.css_text().is_empty());
}

#[test]
fn inline_preserves_external_variables_fallbacks_and_opaque_strings() {
    let mut e = engine(
        "@theme inline{--color-brand:var(--app-brand,red)}@mixin --card{color:var(--color-brand,blue);content:\"var(--color-brand)\"} @utility card {color:var(--color-brand,blue);content:\"var(--color-brand)\"}",
    );
    e.ensure_class_rules(["bg-brand", "card"]).unwrap();
    let css = e.css_text().replace(' ', "");
    assert!(css.contains("background-color:var(--app-brand,red)"));
    assert!(css.contains("color:var(--app-brand,red)"));
    assert!(css.contains("content:\"var(--color-brand)\""));
    assert!(!css.contains("@layer theme"));
}

#[test]
fn inline_importance_selects_value_and_mode_without_important_leaking() {
    let mut e = engine(
        "@theme inline{--color-brand:red!important;--color-brand:blue}@theme{--color-brand:green}",
    );
    e.ensure_class_rules(["bg-brand"]).unwrap();
    assert!(e.css_text().contains("background-color:red}"));
    let mut e = engine("@theme{--color-brand:red!important}@theme inline{--color-brand:blue}");
    e.ensure_class_rules(["bg-brand"]).unwrap();
    assert!(e.css_text().contains("background-color:var(--color-brand)"));
}

#[test]
fn inline_applies_to_native_apply_but_not_authored_declarations() {
    let input = compile_css_directives("@theme inline{--color-brand:var(--app-brand)}@mixin --paint{color:var(--color-brand)} @utility paint {color:var(--color-brand)}.card{border-color:var(--color-brand);@apply --paint}", &CompileNativeCssOptions::default()).unwrap();
    let lowered = lower_css_directives_request(
        &LowerCssDirectivesRequest {
            native_output: input.native_output,
            manifest_input: input.manifest_input,
            style_definitions: input.style_definitions.unwrap_or_default(),
            ..Default::default()
        },
        &Default::default(),
    )
    .unwrap();
    let css = lowered.css.unwrap();
    assert!(css.contains("border-color:var(--color-brand)"));
    assert!(css.contains("color:var(--app-brand)"));
}

#[test]
fn static_animation_retains_only_referenced_keyframes_and_dependencies() {
    let mut e = engine(
        "@theme static{--animate-reveal:reveal 1s}@prune native;@theme{--color-brand:red;}@keyframes reveal{to{color:var(--color-brand)}}@keyframes unused{to{opacity:0}}",
    );
    let initial = e.css_text();
    assert!(initial.contains("@keyframes reveal"));
    assert!(initial.contains("--color-brand:red"));
    assert!(!initial.contains("@keyframes unused"));
    e.ensure_class_rules(["animate-reveal", "bg-brand"])
        .unwrap();
    e.delete_class_rules(["animate-reveal", "bg-brand"])
        .unwrap();
    assert_eq!(e.css_text(), initial);
    let id = e.snapshot().unwrap().resources.keyframes[0].id.clone();
    e.replace_emitted_globals(
        &serde_json::json!({"variables":{"animate-reveal":1,"color-brand":1},"keyframes":{id:1}})
            .to_string(),
    )
    .unwrap();
    assert!(e.css_text().is_empty());
    e.replace_emitted_globals("{}").unwrap();
    assert_eq!(e.css_text(), initial);
}

#[test]
fn static_hmr_replaces_roots_without_leaking_counts() {
    let mut e = engine("@theme static{--color-brand:red}@theme{--color-unused:blue}");
    e.ensure_class_rules(["bg-brand"]).unwrap();
    e.refresh(&compile("@theme static{--color-brand:green}").1.to_string())
        .unwrap();
    e.delete_class_rules(["bg-brand"]).unwrap();
    assert!(e.css_text().contains("--color-brand:green"));
    e.refresh(&compile("@theme{--color-brand:black}").1.to_string())
        .unwrap();
    assert!(e.css_text().is_empty());
}

#[test]
fn theme_accepts_only_tokens_and_native_keyframes_are_registered() {
    for source in [
        "@theme{color:red}",
        "@theme{:root{--x:red}}",
        "@theme{.dark{--x:red}}",
        "@theme{@media all{--x:red}}",
        "@theme{@supports(display:grid){--x:red}}",
        "@theme{@container card{--x:red}}",
        "@theme{@scope (.card){--x:red}}",
        "@theme{@starting-style{--x:red}}",
        "@theme dark{--x:red}",
        "@theme inline inline{--x:red}",
        "@theme static static{--x:red}",
        "@theme;",
    ] {
        assert!(
            compile_css_directives(source, &Default::default()).is_err(),
            "{source}"
        );
    }
    let (result, _) = compile(
        "/*😀*/@prune native;@theme{--label:\"夜\";--animate-turn:turn 1s}@keyframes turn{to{opacity:1}}",
    );
    assert!(!result.native_css.contains("@keyframes"));
    assert_eq!(result.manifest_input.keyframes.unwrap()[0].name, "turn");
}

#[test]
fn reference_static_tokens_are_context_not_unconditional_roots() {
    let reference = compile("@theme static{--color-brand:red;--color-unused:blue}").1;
    let lowered = lower_css_directives_request(
        &Default::default(),
        &LowerCssDirectivesOptions {
            resolution_manifest: Some(reference),
            ..Default::default()
        },
    )
    .unwrap();
    let mut e = EngineSession::create(&lowered.resolution_manifest.to_string()).unwrap();
    assert!(e.css_text().is_empty());
    e.ensure_stylesheet_resources(".card{color:var(--color-brand)}")
        .unwrap();
    assert!(e.css_text().contains("--color-brand:red"));
    assert!(!e.css_text().contains("--color-unused:"));
}

#[test]
fn invalid_theme_declarations_point_to_the_offending_unicode_position() {
    let source = "/*😀*/@theme{--label:夜;color:red}";
    let error = compile_css_directives(source, &Default::default()).unwrap_err();
    let start = source[..source.find("color:red").unwrap()]
        .encode_utf16()
        .count() as u32;
    assert_eq!(
        error.diagnostic().range,
        Some(mastercss_schema::SourceRange {
            start,
            end: start + 5
        })
    );
}

#[test]
fn inline_wrapper_applications_substitute_each_authored_reference_once() {
    let mut e = engine(
        "@theme inline{--color-base:red;--color-alias:var(--color-base)}@mixin --hover{&:hover{@contents}} @utility hover {&:hover{@contents}}@mixin --paint{color:var(--color-alias)} @utility paint {color:var(--color-alias)}",
    );
    e.ensure_class_rules([
        "bg-alias@apply(--hover)",
        "paint@apply(--hover)",
        "color:var(--color-alias)@apply(--hover)",
    ])
    .unwrap();
    let css = e.css_text();
    assert_eq!(css.matches("color:var(--color-base)").count(), 3, "{css}");
    assert!(css.contains("--color-base:red"));
    assert!(!css.contains("--color-alias:"));
}

#[test]
fn reference_context_preserves_normalized_base_static_tokens_with_empty_keys() {
    let base = serde_json::json!({
        "version":6,"languageVersion":16,
        "variables":{"color":[{"key":"","values":[{"path":[":root,:host"],"value":"red","static":true}]}]},
        "theme":[{"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"color","value":"red","static":true}]}]
    });
    let context = crate::manifest::reference_context(base.clone(), Some(&base));
    assert_eq!(context, base);
}
