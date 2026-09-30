use super::*;
use mastercss_engine::EngineSession;
use serde_json::json;

fn compile(source: &str) -> (CompileCssDirectivesResult, Value) {
    let result = compile_css_directives(source, &CompileNativeCssOptions::default()).unwrap();
    let manifest =
        compile_manifest_input(&result.manifest_input, &CompileManifestOptions::default())
            .unwrap()
            .manifest;
    (result, manifest)
}

#[test]
fn direct_theme_declarations_match_explicit_defaults() {
    let (_, short) = compile("@theme{--color-brand:red;--color-brand:blue;--spacing-card:2rem;}");
    let (_, explicit) =
        compile("@theme{:root,:host{--color-brand:red;--color-brand:blue;--spacing-card:2rem;}}");
    assert_eq!(short, explicit);
}

#[test]
fn default_runs_preserve_scope_order_keyframes_and_dependencies() {
    let (result, manifest) = compile(
        r#"@theme {
        --color-base:red; --color-brand:var(--color-base);
        [data-theme=dark] {--color-brand:black}
        --color-brand:blue;
        @media (width > 1px) {:root {--color-brand:green}}
        @keyframes turn {to{color:var(--color-brand)}}
        --animate-turn:turn;
    }"#,
    );
    assert!(result.native_css.is_empty());
    let theme = manifest["theme"].as_array().unwrap();
    assert_eq!(theme.len(), 5);
    assert_eq!(theme[0]["prelude"], ":root,:host");
    assert_eq!(theme[1]["prelude"], "[data-theme=dark]");
    assert_eq!(theme[2]["children"][0]["value"], "blue");
    assert_eq!(manifest["keyframes"][0]["name"], "turn");
    let mut engine = EngineSession::create(&manifest.to_string()).unwrap();
    engine.ensure_class_rules(["bg-brand"]).unwrap();
    let text = engine.snapshot().unwrap().text;
    assert!(text.contains("--color-base:red"));
    assert!(text.contains("[data-theme=dark]{--color-brand:black}"));
    assert!(!text.contains("--animate-turn"));
}

#[test]
fn native_tokens_register_without_managed_delivery() {
    let (result, manifest) = compile(
        r#"@layer theme {
        :root,:host {--color-brand:red;--spacing-card:2rem}
        @media (width > 1px) {[data-theme=dark] {--color-brand:blue}}
    }"#,
    );
    assert!(result.native_css.contains("--color-brand"));
    assert!(manifest.get("theme").is_none());
    let values = &manifest["variables"]["color"][0]["values"];
    assert_eq!(values[0]["delivery"], "native");
    assert_eq!(
        values[1]["path"],
        json!(["@layer theme", "@media (width > 1px)", "[data-theme=dark]"])
    );
    assert_eq!(
        result.manifest_input.native_tokens.as_ref().unwrap()[0]
            .source
            .as_ref()
            .unwrap()
            .file
            .as_deref(),
        Some("master.css")
    );
    let mut engine = EngineSession::create(&manifest.to_string()).unwrap();
    engine.ensure_class_rules(["bg-brand", "p-card"]).unwrap();
    let snapshot = engine.snapshot().unwrap();
    assert!(
        snapshot
            .text
            .contains("background-color:var(--color-brand)")
    );
    assert!(snapshot.text.contains("padding:var(--spacing-card)"));
    assert!(snapshot.resources.variables.is_empty());
    assert!(
        engine
            .emitted_globals_snapshot()
            .unwrap()
            .variables
            .is_empty()
    );
}

#[test]
fn native_aliases_retain_managed_dependencies_and_scopes_only() {
    let (_, manifest) = compile(
        r#"
        @theme {--color-base:red;--color-brand:white;[data-theme=dark]{--color-brand:black}}
        :root{--color-alias:var(--color-base)}
        [data-theme=ocean]{--color-brand:blue}
    "#,
    );
    let mut engine = EngineSession::create(&manifest.to_string()).unwrap();
    engine.ensure_class_rules(["bg-alias", "bg-brand"]).unwrap();
    let text = engine.snapshot().unwrap().text;
    assert!(text.contains("--color-base:red"));
    assert!(text.contains("[data-theme=dark]{--color-brand:black}"));
    assert!(!text.contains("--color-brand:blue"));
    assert!(!text.contains("--color-alias:"));
    assert!(
        !engine
            .emitted_globals_snapshot()
            .unwrap()
            .variables
            .contains_key("color-alias")
    );
    engine.delete_class_rules(["bg-alias", "bg-brand"]).unwrap();
    assert!(engine.snapshot().unwrap().text.is_empty());
}

#[test]
fn native_catalog_excludes_descriptors_keyframe_locals_and_mixin_bodies() {
    let (result, manifest) = compile(
        r#"
        @property --color-registered {syntax:"<color>";inherits:true;initial-value:red}
        @keyframes local {to{--color-frame:red}}
        @mixin --local {--color-parameter:red}
        .card {--color-real:red;--empty:;--data:{"nested":"var(--ignored)"};}
    "#,
    );
    let names = result
        .manifest_input
        .native_tokens
        .unwrap()
        .into_iter()
        .map(|token| token.name)
        .collect::<Vec<_>>();
    assert_eq!(names, ["color-real", "empty", "data"]);
    assert_eq!(manifest["variables"]["color"].as_array().unwrap().len(), 1);
}

#[test]
fn rejected_theme_forms_remain_explicit() {
    for source in [
        "@theme{color:red}",
        "@theme static{--color-brand:red}",
        "@theme inline{--color-brand:red}",
        "@theme dark{--color-brand:red}",
        ".x{@theme{--color-brand:red}}",
        "@theme{@media all{--color-brand:red}}",
    ] {
        assert!(
            compile_css_directives(source, &CompileNativeCssOptions::default()).is_err(),
            "{source}"
        );
    }
}

#[test]
fn native_named_recipes_retain_managed_animation_dependencies() {
    let (_, manifest) = compile(
        r#"
        @mixin --animate(--name <string>) {
            animation-name: var(ident("--animate-" var(--name)));
            animation-duration: var(ident("--animate-" var(--name) "--duration"), 1s);
        }
        :root { --animate-turn: turn; --animate-turn--duration: 2s; }
        @theme {
            --color-brand: red;
            @keyframes turn { to { color: var(--color-brand); } }
            @keyframes unused { to { opacity: 0; } }
        }
        "#,
    );
    let mut engine = EngineSession::create(&manifest.to_string()).unwrap();
    engine.ensure_class_rules(["animate-turn"]).unwrap();
    let snapshot = engine.snapshot().unwrap();
    assert!(snapshot.text.contains("@keyframes turn"));
    assert!(snapshot.text.contains("--color-brand:red"));
    assert!(
        snapshot
            .text
            .contains("animation-duration:var(--animate-turn--duration"),
        "{}",
        snapshot.text
    );
    assert!(!snapshot.text.contains("--animate-turn:"));
    assert!(!snapshot.text.contains("@keyframes unused"));
    assert_eq!(snapshot.resources.variables.len(), 1);
    engine.delete_class_rules(["animate-turn"]).unwrap();
    assert!(engine.snapshot().unwrap().text.is_empty());
}

#[test]
fn default_runs_keep_escaped_names_importance_and_unicode_offsets() {
    let source = "/*😀*/@theme{--label:\"😀夜\";--color-\\62rand:red!important;--color-brand:blue;[data-theme=夜]{--color-brand:black}--color-brand:green;@keyframes turn{to{opacity:1}}}";
    let (result, manifest) = compile(source);
    assert_eq!(manifest["variables"]["color"][0]["name"], "color-brand");
    assert_eq!(
        manifest["theme"][0]["children"][1]["value"],
        "red !important"
    );
    assert_eq!(manifest["theme"][0]["children"][2]["value"], "blue");
    assert_eq!(manifest["theme"][1]["prelude"], "[data-theme=夜]");
    assert_eq!(manifest["theme"][2]["children"][0]["value"], "green");
    let keyframe = &result.manifest_input.keyframes.unwrap()[0];
    assert_eq!(keyframe.text, "@keyframes turn{to{opacity:1}}");
    let native = crate::native_tokens::collect("/*😀*/:root{--color-\\62rand:red;}", "tokens.css");
    assert_eq!(native[0].name, "color-brand");
    assert_eq!(native[0].value, "red");
    assert_eq!(
        native[0].source.as_ref().unwrap().file.as_deref(),
        Some("tokens.css")
    );
}
