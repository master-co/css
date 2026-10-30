use super::*;

fn manifest() -> Value {
    let preset: Value = serde_json::from_str(include_str!(
        "../../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    let variable = |key: &str, value: &str| json!({"key":key,"type":"string","values":[{"path":[":root,:host"],"value":value}]});
    json!({"version":6,"languageVersion":mastercss_schema::LANGUAGE_VERSION,
        "utilities":preset["utilities"],
        "variables":{
            "color":[variable("brand","red"),variable("fallback","blue"),variable("alias","var(--color-brand)")],
            "spacing":[variable("md","1rem")],
            "font-size":[variable("brand","1rem")],"font-family":[variable("brand","sans-serif")]
        }
    })
}

fn inspect(content: &str, options: Value) -> DesignSystemReport {
    let mut request = json!({"version":1,"stylesheets":[{"source":"app.css","content":content,"importers":["entry.css"]}]});
    request
        .as_object_mut()
        .unwrap()
        .extend(options.as_object().unwrap().clone());
    LintSession::create(&manifest().to_string())
        .unwrap()
        .inspect_design_system(&serde_json::from_value(request).unwrap())
        .unwrap()
}

fn slice_utf16(source: &str, range: &SourceRange) -> String {
    String::from_utf16(
        &source.encode_utf16().collect::<Vec<_>>()[range.start as usize..range.end as usize],
    )
    .unwrap()
}

#[test]
fn references_keep_authored_utf16_ranges_ancestry_duplicates_and_fallbacks() {
    let content = r#"/* var(--ignored) 😀 */ @layer components { .😀 { color: var(--color-br\61 nd, var(--color-fallback)); color:var(--color-brand); content:"var(--fake)"; background-image:url(var(--fake)); @media (width > 1px) { &:hover { color:var(--external,); } } } } @theme { --color-alias:var(--color-brand); } @utility sample {color:var(--parameter)} @mixin --sample {color:var(--parameter)}"#;
    let report = inspect(content, json!({}));
    assert_eq!(
        report
            .references
            .iter()
            .map(|item| item.token.as_str())
            .collect::<Vec<_>>(),
        [
            "--color-brand",
            "--color-fallback",
            "--color-brand",
            "--external",
            "--color-brand"
        ]
    );
    let first = &report.references[0];
    assert_eq!(slice_utf16(content, &first.range), r"--color-br\61 nd");
    assert!(first.has_fallback);
    assert!(!first.in_fallback);
    assert!(report.references[1].in_fallback);
    assert_eq!(first.importers, ["entry.css"]);
    assert_eq!(first.ancestry[0].name.as_deref(), Some("layer"));
    assert_eq!(first.ancestry[0].prelude, "components");
    assert_eq!(first.ancestry[1].prelude, ".😀");
    assert_eq!(
        report.references[3].ancestry[2].name.as_deref(),
        Some("media")
    );
    assert_eq!(report.references[3].ancestry[3].prelude, "&:hover");
    assert!(report.references[3].has_fallback);
    assert!(!report.references[3].registered);
    assert!(
        report.references[0].declaration_range.start < report.references[2].declaration_range.start
    );
    assert_eq!(report.references[4].property, "--color-alias");
    assert_eq!(report.coverage.browser, "not-checked");
}

#[test]
fn raw_policy_is_optional_bounded_and_reuses_existing_exemptions() {
    let content = ".card{color:#fff;color:#fff;color:var(--color-brand,red);padding:0 var(--spacing-md);opacity:.5} @theme{--color-raw:red} @utility raw{color:red}";
    assert!(
        !inspect(content, json!({}))
            .diagnostics
            .iter()
            .any(|item| item.code == "UNAPPROVED_RAW_VALUE")
    );
    let report = inspect(
        content,
        json!({"rawValuePolicy":{"requireProperties":["color","padding"],"allowedPatterns":["^0$"]}}),
    );
    let raw = report
        .diagnostics
        .iter()
        .filter(|item| item.code == "UNAPPROVED_RAW_VALUE")
        .collect::<Vec<_>>();
    assert_eq!(raw.len(), 2);
    assert!(
        raw.iter()
            .all(|item| slice_utf16(content, item.range.as_ref().unwrap()) == "#fff")
    );
    assert!(
        inspect(
            content,
            json!({"rawValuePolicy":{"allowProperties":["color","padding"]}})
        )
        .diagnostics
        .iter()
        .all(|item| item.code != "UNAPPROVED_RAW_VALUE")
    );
    assert!(
        inspect(content, json!({"rawValuePolicy":{"allowRawValues":true}}))
            .diagnostics
            .iter()
            .all(|item| item.code != "UNAPPROVED_RAW_VALUE")
    );
}

#[test]
fn native_policy_requires_property_ownership_not_a_matching_class_prefix() {
    let mut input = manifest();
    input["variables"]["font-size"]
        .as_array_mut()
        .unwrap()
        .push(json!({
            "key":"small", "values":[{"path":[":root,:host"],"value":"1rem"}]
        }));
    let session = LintSession::create(&input.to_string()).unwrap();
    let request = serde_json::from_value(json!({
        "version":1,
        "stylesheets":[{"source":"app.css","content":".card { font: 700 1rem sans-serif; font-size:18px }"}],
        "rawValuePolicy":{"requireProperties":["font","font-size"]}
    })).unwrap();
    let report = session.inspect_design_system(&request).unwrap();
    let raw = report
        .diagnostics
        .iter()
        .filter(|item| item.code == "UNAPPROVED_RAW_VALUE")
        .collect::<Vec<_>>();
    assert_eq!(raw.len(), 1);
    assert_eq!(raw[0].data["property"], "font-size");
    assert!(!raw[0].data["tokenFamilies"].as_array().unwrap().is_empty());

    // An empty color family cannot borrow usable keys from a utility whose
    // prefix happens to be "color" but whose declarations set padding.
    input["variables"]["color"] = json!([]);
    input["utilities"].as_array_mut().unwrap().push(json!({
        "kind":"token","name":"color","parameters":[{"name":"--spacing"}],
        "body":[{"type":"declaration","property":"padding","value":[{"type":"function","name":"var","value":[{"type":"text","value":"--spacing"}]}]}]
    }));
    let session = LintSession::create(&input.to_string()).unwrap();
    let request = serde_json::from_value(json!({
        "version":1,"stylesheets":[{"source":"app.css","content":".card{color:red;padding:8px}"}],
        "rawValuePolicy":{"requireProperties":["color","padding"]}
    }))
    .unwrap();
    let report = session.inspect_design_system(&request).unwrap();
    let raw = report
        .diagnostics
        .iter()
        .filter(|item| item.code == "UNAPPROVED_RAW_VALUE")
        .collect::<Vec<_>>();
    assert_eq!(raw.len(), 1);
    assert_eq!(raw[0].data["property"], "padding");
}

#[test]
fn metadata_stays_tooling_only_and_validates_replacements() {
    let report = inspect(
        ".a{color:var(--color-brand)}",
        json!({"metadata":{
            "--color-brand":{"description":"Brand accent","deprecated":true,"replacement":"--missing"},
            "--color-fallback":{"replacement":"--color-fallback"},
            "--missing":{"deprecated":true,"replacement":"--color-brand"}
        }}),
    );
    for code in [
        "DEPRECATED_TOKEN",
        "UNKNOWN_METADATA_TOKEN",
        "UNKNOWN_TOKEN_REPLACEMENT",
        "INVALID_TOKEN_REPLACEMENT",
        "DEPRECATED_TOKEN_REPLACEMENT",
    ] {
        assert!(
            report.diagnostics.iter().any(|item| item.code == code),
            "{code}"
        );
    }
    assert_eq!(
        report
            .tokens
            .iter()
            .find(|token| token.name == "--color-brand")
            .unwrap()
            .metadata
            .as_ref()
            .unwrap()
            .description
            .as_deref(),
        Some("Brand accent")
    );
    assert!(!report.tokens.iter().any(|token| token.name == "--missing"));
    let usage = report
        .diagnostics
        .iter()
        .find(|item| item.code == "DEPRECATED_TOKEN")
        .unwrap();
    assert_eq!(usage.source.as_deref(), Some("app.css"));
    assert!(usage.range.is_some());
}

#[test]
fn collisions_use_resolved_engine_ownership_and_respect_static_shadows() {
    let report = inspect("", json!({}));
    assert_eq!(report.collisions.len(), 1);
    assert_eq!(report.collisions[0].class_name, "font-brand");
    assert_eq!(
        report.collisions[0].namespaces,
        ["font-family", "font-size"]
    );
    let mut input = manifest();
    input["utilities"].as_array_mut().unwrap().push(json!({"kind":"static","name":"font-brand","body":[{"type":"declaration","property":"color","value":[{"type":"text","value":"red"}]}]}));
    let session = LintSession::create(&input.to_string()).unwrap();
    let request = serde_json::from_value(json!({"version":1,"stylesheets":[]})).unwrap();
    assert!(
        session
            .inspect_design_system(&request)
            .unwrap()
            .collisions
            .is_empty()
    );
}

#[test]
fn collision_namespaces_belong_to_the_winning_longest_prefix() {
    let utility = |prefix: &str, namespace: &str| {
        json!({
            "kind":"token", "name":prefix, "parameters":[{"name":format!("--{namespace}")}],
            "body":[{"type":"declaration","property":"color","value":[{"type":"function","name":"var","value":[{"type":"text","value":format!("--{namespace}")}]}]}]
        })
    };
    let variable =
        |key: &str| json!([{"key":key,"values":[{"path":[":root,:host"],"value":"red"}]}]);
    let input = json!({"version":6,"languageVersion":mastercss_schema::LANGUAGE_VERSION,
        "utilities":[utility("font","short-a"),utility("font","short-b"),utility("font-size","long-a"),utility("font-size","long-b")],
        "variables":{"short-a":variable("size-brand"),"short-b":variable("size-brand"),"long-a":variable("brand"),"long-b":variable("brand")}
    });
    let session = LintSession::create(&input.to_string()).unwrap();
    let request = serde_json::from_value(json!({"version":1,"stylesheets":[]})).unwrap();
    let report = session.inspect_design_system(&request).unwrap();
    assert_eq!(report.collisions.len(), 1);
    assert_eq!(report.collisions[0].class_name, "font-size-brand");
    assert_eq!(report.collisions[0].prefix, "font-size");
    assert_eq!(report.collisions[0].namespaces, ["long-a", "long-b"]);
}

#[test]
fn rejects_unknown_options_versions_and_bad_patterns() {
    assert!(
        serde_json::from_value::<DesignSystemRequest>(
            json!({"version":1,"stylesheets":[],"unknown":true})
        )
        .is_err()
    );
    let session = LintSession::create(&manifest().to_string()).unwrap();
    for value in [
        json!({"version":2,"stylesheets":[]}),
        json!({"version":1,"stylesheets":[],"rawValuePolicy":{"allowedPatterns":["["]}}),
    ] {
        assert!(
            session
                .inspect_design_system(&serde_json::from_value(value).unwrap())
                .is_err()
        );
    }
}

#[test]
fn collision_candidates_exclude_string_family_companion_keys() {
    let mut input = manifest();
    input["variables"] = json!({
        "text":[{"key":"hero","values":[{"path":[":root"],"value":"2rem"}]},{"key":"hero--line-height","values":[{"path":[":root"],"value":"1.5"}]}],
        "other":[{"key":"hero","values":[{"path":[":root"],"value":"2rem"}]},{"key":"hero--line-height","values":[{"path":[":root"],"value":"1.5"}]}]
    });
    input["utilities"].as_array_mut().unwrap().push(json!({"kind":"token","name":"text","parameters":[{"name":"--other"}],"body":[{"type":"declaration","property":"font-size","value":[{"type":"function","name":"var","value":[{"type":"text","value":"--other"}]}]}]}));
    let session = LintSession::create(&input.to_string()).unwrap();
    let request = serde_json::from_value(json!({"version":1,"stylesheets":[]})).unwrap();
    let report = session.inspect_design_system(&request).unwrap();
    assert_eq!(report.collisions.len(), 1);
    assert_eq!(report.collisions[0].class_name, "text-hero");
}

#[test]
fn decoded_function_and_property_names_preserve_original_ranges() {
    let content = r".a { C\4f LOR: V\41 R( /* before */ --color-brand /* after */, var(--color-fallback, var(--external))); }";
    let report = inspect(content, json!({}));
    assert_eq!(report.references.len(), 3);
    assert!(
        report
            .references
            .iter()
            .all(|item| item.property == "color")
    );
    assert_eq!(
        report
            .references
            .iter()
            .map(|item| (item.has_fallback, item.in_fallback))
            .collect::<Vec<_>>(),
        [(true, false), (true, true), (false, true)]
    );
    for reference in &report.references {
        assert_eq!(slice_utf16(content, &reference.range), reference.token);
    }
}
