use mastercss_compiler::{
    CompileNativeCssOptions, LowerCssDirectivesRequest, compile_css_directives,
    lower_css_directives_request,
};
use mastercss_engine::EngineSession;
use mastercss_schema::MatchStatus;

fn compile(
    source: &str,
) -> Result<mastercss_compiler::LowerCssDirectivesResult, mastercss_compiler::CompilerError> {
    let parsed = compile_css_directives(source, &CompileNativeCssOptions::default())?;
    lower_css_directives_request(
        &LowerCssDirectivesRequest {
            utility_sources: parsed.utility_sources,
            native_output: parsed.native_output,
            manifest_input: parsed.manifest_input,
            style_definitions: parsed.style_definitions.unwrap_or_default(),
            warnings: parsed.warnings,
        },
        &mastercss_compiler::LowerCssDirectivesOptions {
            base_manifest: Some(
                serde_json::json!({"version":2,"languageVersion":4,"customMedia":{"--always":{"type":"true"}},"utilities":[]}),
            ),
            resolution_manifest: None,
        },
    )
}
fn css(source: &str, classes: &[&str]) -> String {
    let result = compile(source).unwrap();
    let mut engine = EngineSession::create(&result.manifest.to_string()).unwrap();
    engine.ensure_class_rules(classes.iter().copied()).unwrap();
    engine.snapshot().unwrap().text
}
#[test]
fn raw_intent_does_not_depend_on_value_kind() {
    let source =
        r###"@utility size:* {@variant always{width:--master-value();height:--master-value()}}"###;
    for value in ["red", "-1px", "var(--size)", "future(1px)", "1px|2px"] {
        let generated = css(source, &[&format!("size:{value}")]);
        assert!(generated.contains("width:"), "{value}: {generated}");
        assert!(generated.contains("height:"), "{value}: {generated}");
        assert!(!generated.contains("{size:"), "{generated}");
    }
}
#[test]
fn removed_pattern_forms_and_duplicate_enum_keys_fail() {
    for pattern in [
        "x:<number>",
        "x:<number|*>",
        "x:<auto|none>",
        "x-<=spacing>",
        "x-<a|a>",
        "x-<a=left|a=right>",
    ] {
        assert!(
            compile(&format!("@utilities{{{pattern}{{width:--value()}}}} ")).is_err(),
            "{pattern}"
        );
    }
}
#[test]
fn replacement_removes_nested_rules() {
    let generated = css(
        r###"@utility card {color:red;&:hover{color:blue}@variant always{}}@utility card {padding:1px}"###,
        &["card"],
    );
    assert!(generated.contains("padding:1px"), "{generated}");
    assert!(!generated.contains("color:"), "{generated}");
    assert!(!generated.contains(":hover"), "{generated}");
}
#[test]
fn empty_utility_is_matched() {
    let result = compile(
        r###"@utility card {color:red}@utility card {}.x{@variant always{}display:block}"###,
    )
    .unwrap();
    let engine = EngineSession::create(&result.manifest.to_string()).unwrap();
    let inspection = engine.inspect("card").unwrap();
    assert_eq!(inspection.match_status, MatchStatus::Matched);
    assert!(inspection.rules.is_empty());
    assert_eq!(
        engine.inspect_class_semantics("card").unwrap().kind,
        mastercss_engine::ClassSemanticKind::Semantic
    );
    assert_eq!(
        engine.inspect("{card}").unwrap().match_status,
        MatchStatus::Matched
    );
}
#[test]
fn enum_identity_ignores_key_order_and_mapping_values() {
    let generated = css(
        "@utility align-a {text-align:left;&:hover{color:red}}@utility align-b {text-align:right;&:hover{color:red}}@utility align-b {text-align:center}@utility align-a {text-align:justify}",
        &["align-a"],
    );
    assert!(generated.contains("text-align:justify"), "{generated}");
    assert!(!generated.contains("color:red"), "{generated}");
}
#[test]
fn fixed_definitions_replace_and_raw_fixed_collisions_fail() {
    assert!(compile("@utility a-x {color:red}@utility a-y {color:red}@utility a-y {color:blue}@utility a-z {color:blue}").is_ok());
    assert!(
        compile("@utility thing {display:block}@utility thing:* {color:--master-value()}").is_err()
    );
}
#[test]
fn static_names_accept_future_pseudo_classes() {
    for state in [":open", ":state(open)", ":future-pseudo(hello)", "::before"] {
        let generated = css(
            "@utility block {display:block}",
            &[&format!("block{state}")],
        );
        assert!(generated.contains("display:block"), "{generated}");
        assert!(generated.contains(&format!("{state}{{")), "{generated}");
    }
}
#[test]
fn template_replacement_respects_css_tokens_and_does_not_recurse() {
    let generated = css(
        "@utility sample:* {width:--master-value();--quoted:'--value()';--fragment:prefix--master-value();--escaped:\\--master-value();}",
        &["sample:--value()"],
    );
    assert!(generated.contains("width:--value()"), "{generated}");
    assert!(generated.contains("prefix--master-value()"), "{generated}");
    assert!(
        generated.contains("'--value()'") || generated.contains("\"--value()\""),
        "{generated}"
    );
}
#[test]
fn identifiers_preserve_case_unicode_and_decoded_escapes() {
    let generated = css(
        r"@utility Accent {color:red}@utility accent {color:blue}@utility \31 st {display:block}@utility 文字 {display:grid}",
        &["Accent", "accent", "1st", "文字"],
    );
    for declaration in ["color:red", "color:#00f", "display:block", "display:grid"] {
        assert!(generated.contains(declaration), "{generated}");
    }
    for name in [r"bad\:name", r"bad\20 name", r"bad\@name"] {
        assert!(
            compile(&format!("@utilities{{{name}{{color:red}}}}")).is_err(),
            "{name}"
        );
    }
}

#[test]
fn public_manifest_compilation_resolves_fixed_pattern_composition() {
    let parsed = compile_css_directives(
        r###"@utility pair:* {@variant always{display:block;} width:--master-value()}@utility block {display:block}"###,
        &CompileNativeCssOptions::default(),
    )
    .unwrap();
    let result =
        mastercss_compiler::compile_manifest_input(&parsed.manifest_input, &mastercss_compiler::CompileManifestOptions { base_manifest: Some(serde_json::json!({"version":2,"languageVersion":4,"customMedia":{"--always":{"type":"true"}},"utilities":[]})) })
            .unwrap();
    let engine = EngineSession::create(&result.manifest.to_string()).unwrap();
    let rules = engine.composition_rules("pair:1px").unwrap();
    assert!(
        rules
            .iter()
            .flat_map(|rule| &rule.declarations)
            .any(|declaration| declaration.property == "display")
    );
}

#[test]
fn conflicts_report_both_original_sources() {
    let error =
        compile("@utility thing {color:red}@utility thing:* {color:--master-value()}").unwrap_err();
    assert!(matches!(
        error,
        mastercss_compiler::CompilerError::DirectiveDiagnostic {
            code: mastercss_schema::ErrorCode::UtilityNameConflict,
            ..
        }
    ));
    let message = error.to_string();
    assert_eq!(message.matches("master.css:").count(), 2, "{message}");
}

#[test]
fn clearing_raw_and_token_definitions_does_not_fall_back_or_retain_resources() {
    let result = compile(r###"@theme{:root, :host {--color-brand:red}}@utility paint-* from(--color-*) {color:--master-value()}@utility paint-* from(--color-*) {}@utility size:* {width:--master-value()}@utility size:* {}.x{@variant always{}}"###).unwrap();
    let mut engine = EngineSession::create(&result.manifest.to_string()).unwrap();
    for class in ["size:red", "paint-brand"] {
        assert_eq!(
            engine.inspect(class).unwrap().match_status,
            MatchStatus::Matched
        );
        engine.ensure_class_rules([class]).unwrap();
    }
    let output = engine.css_text();
    assert!(
        !output.contains("size:red") && !output.contains("--color-brand"),
        "{output}"
    );
}

#[test]
fn custom_manifest_token_alias_content_does_not_change_definition_identity() {
    use serde_json::json;
    let old = json!({"id":"old", "type":0, "variableAliasRefs":["~spacing"], "variableAliases":[["md","spacing-md"]],"emit":{"type":"property","property":"margin"},"matchers":[{"type":"token","prefix":"gutter-"}]});
    let mut new = old.clone();
    new["id"] = json!("new");
    new["variableAliases"] = json!([]);
    new["emit"] = json!({"type":"property","property":"padding"});
    let manifest = json!({"version":2,"languageVersion":4, "customMedia":{"--always":{"type":"true"}},"variables":{"spacing":[{"key":"md","values":[{"path":[":root,:host"],"value":"1rem"}]}]},"utilities":[old,new]});
    let mut engine = EngineSession::create(&manifest.to_string()).unwrap();
    engine.ensure_class_rules(["gutter-md"]).unwrap();
    let result = engine.snapshot().unwrap();
    assert!(result.text.contains("padding:"), "{}", result.text);
    assert!(!result.text.contains("margin:"), "{}", result.text);
}
#[test]
fn removed_enum_matchers_are_rejected_across_layers() {
    use serde_json::json;
    let utility = |id, layer, values| json!({"id":id,"layer":layer,"type":-2,"emit":{"type":"property","property":"text-align"},"matchers":[{"type":"pattern","prefix":"align-","values":values}]});
    let mut manifest = json!({"version":2,"languageVersion":4, "customMedia":{"--always":{"type":"true"}},"utilities":[utility("a","components",vec!["left","right"]),utility("b","utilities",vec!["center","right"])]});
    assert!(EngineSession::create(&manifest.to_string()).is_err());
    manifest["utilities"][1] = utility("b", "utilities", vec!["right", "left"]);
    assert!(EngineSession::create(&manifest.to_string()).is_err());
}
