use super::*;

pub(crate) fn read_json<T: for<'de> Deserialize<'de>>(path: &Path) -> Result<T, String> {
    let source = fs::read_to_string(path)
        .map_err(|error| format!("Cannot read {}: {error}", path.display()))?;
    serde_json::from_str(&source).map_err(|error| format!("Invalid {}: {error}", path.display()))
}

pub(crate) fn manifest_json(root: &Path, value: &Value) -> Result<String, String> {
    if value.as_str() == Some("default") {
        let path = root.join("packages/preset/src/default-manifest.json");
        return fs::read_to_string(&path)
            .map_err(|error| format!("Cannot read {}: {error}", path.display()));
    }
    serde_json::to_string(value)
        .map_err(|error| format!("Cannot serialize parity manifest: {error}"))
}

pub(crate) fn validate_semantic_parity_corpus(
    root: &Path,
    corpus: &SemanticParityCorpus,
) -> Result<HashSet<String>, String> {
    if corpus.version != 3
        || corpus.semantic_baseline != "language-16-shared-prefixes"
        || corpus.public_baseline != "Master CSS v2"
    {
        return Err("Language corpus has an unsupported version or contract.".into());
    }
    let mut ids = HashSet::new();
    for case in &corpus.parser_cases {
        if case.id.is_empty() || !ids.insert(case.id.clone()) {
            return Err(format!(
                "Duplicate or empty semantic parity case id: {}",
                case.id
            ));
        }
        if !matches!(case.kind.as_str(), "condition" | "selector" | "lexer")
            || case.input.is_empty()
            || (case.kind != "lexer" && case.expected_canonical.is_empty())
        {
            return Err(format!("Invalid parser parity case: {}", case.id));
        }
        if case.kind == "lexer"
            && (case.target_package.as_deref() != Some("tooling")
                || case.runner.as_deref() != Some("cargo-test"))
        {
            return Err(format!("Lexer parity ownership is invalid: {}", case.id));
        }
    }
    for case in &corpus.engine_cases {
        if case.id.is_empty() || !ids.insert(case.id.clone()) {
            return Err(format!(
                "Duplicate or empty semantic parity case id: {}",
                case.id
            ));
        }
        let manifest = manifest_json(root, &case.manifest)?;
        let emitted_globals = case
            .emitted_globals
            .as_ref()
            .map(serde_json::to_string)
            .transpose()
            .map_err(|error| {
                format!(
                    "Cannot serialize emitted globals for parity case {}: {error}",
                    case.id
                )
            })?;
        let mut engine =
            EngineSession::create_with_emitted_globals(&manifest, emitted_globals.as_deref())
                .map_err(|error| {
                    format!("Parity case {} cannot create engine: {error}", case.id)
                })?;
        for (step_index, step) in case.steps.iter().enumerate() {
            match step {
                EngineParityStep::Ensure {
                    classes,
                    expected_css,
                    expected_resource_order,
                } => {
                    engine.ensure_class_rules(classes).map_err(|error| {
                        format!(
                            "Parity case {} step {} cannot ensure classes: {error}",
                            case.id, step_index
                        )
                    })?;
                    if engine.css_text() != *expected_css {
                        return Err(format!(
                            "Parity case {} step {} CSS mismatch.\nexpected: {}\nactual:   {}",
                            case.id,
                            step_index,
                            expected_css,
                            engine.css_text()
                        ));
                    }
                    if let Some(expected_resource_order) = expected_resource_order {
                        let snapshot = engine.snapshot().map_err(|error| {
                            format!(
                                "Parity case {} step {} cannot snapshot resources: {error}",
                                case.id, step_index
                            )
                        })?;
                        let resource_order = snapshot
                            .resources
                            .variables
                            .into_iter()
                            .map(|resource| resource.name)
                            .collect::<Vec<_>>();
                        if resource_order != *expected_resource_order {
                            return Err(format!(
                                "Parity case {} step {} resource order mismatch.",
                                case.id, step_index
                            ));
                        }
                    }
                }
                EngineParityStep::Delete {
                    classes,
                    expected_css,
                } => {
                    engine.delete_class_rules(classes).map_err(|error| {
                        format!(
                            "Parity case {} step {} cannot delete classes: {error}",
                            case.id, step_index
                        )
                    })?;
                    if engine.css_text() != *expected_css {
                        return Err(format!(
                            "Parity case {} step {} CSS mismatch after delete.\nexpected: {}\nactual:   {}",
                            case.id,
                            step_index,
                            expected_css,
                            engine.css_text()
                        ));
                    }
                }
                EngineParityStep::Inspect {
                    class_name,
                    expected_valid,
                    expected_rule_texts,
                    expected_selector_texts,
                    expected_layers,
                    expected_priorities,
                    expected_variable_names,
                } => {
                    let inspection = engine.inspect(class_name).map_err(|error| {
                        format!(
                            "Parity case {} step {} cannot inspect {class_name}: {error}",
                            case.id, step_index
                        )
                    })?;
                    if (inspection.match_status == mastercss_schema::MatchStatus::Matched)
                        != *expected_valid
                    {
                        return Err(format!(
                            "Parity case {} step {} validity mismatch for {class_name}.",
                            case.id, step_index
                        ));
                    }
                    let rule_texts = inspection
                        .rules
                        .iter()
                        .map(|rule| rule.text.clone())
                        .collect::<Vec<_>>();
                    if !expected_rule_texts.is_empty() && rule_texts != *expected_rule_texts {
                        return Err(format!(
                            "Parity case {} step {} rule text mismatch for {class_name}.",
                            case.id, step_index
                        ));
                    }
                    let selector_texts = inspection
                        .rules
                        .iter()
                        .map(|rule| rule.selector_text.clone())
                        .collect::<Vec<_>>();
                    if !expected_selector_texts.is_empty()
                        && selector_texts != *expected_selector_texts
                    {
                        return Err(format!(
                            "Parity case {} step {} selector metadata mismatch for {class_name}.",
                            case.id, step_index
                        ));
                    }
                    let layers = inspection
                        .rules
                        .iter()
                        .map(|rule| {
                            serde_json::to_value(rule.layer)
                                .expect("utility layer serializes")
                                .as_str()
                                .expect("utility layer is a string")
                                .to_owned()
                        })
                        .collect::<Vec<_>>();
                    if !expected_layers.is_empty() && layers != *expected_layers {
                        return Err(format!(
                            "Parity case {} step {} layer metadata mismatch for {class_name}.",
                            case.id, step_index
                        ));
                    }
                    let priorities = inspection
                        .rules
                        .iter()
                        .map(|rule| {
                            serde_json::to_value(&rule.priority).expect("rule priority serializes")
                        })
                        .collect::<Vec<_>>();
                    if !expected_priorities.is_empty() && priorities != *expected_priorities {
                        return Err(format!(
                            "Parity case {} step {} priority metadata mismatch for {class_name}.",
                            case.id, step_index
                        ));
                    }
                    let variable_names = inspection
                        .rules
                        .iter()
                        .map(|rule| rule.variable_names.clone())
                        .collect::<Vec<_>>();
                    if !expected_variable_names.is_empty()
                        && variable_names != *expected_variable_names
                    {
                        return Err(format!(
                            "Parity case {} step {} variable metadata mismatch for {class_name}.",
                            case.id, step_index
                        ));
                    }
                }
                EngineParityStep::InspectContains {
                    class_name,
                    expected_rule_contains,
                } => {
                    engine
                        .ensure_class_rules(std::slice::from_ref(class_name))
                        .map_err(|error| {
                            format!(
                                "Parity case {} step {} cannot ensure {class_name}: {error}",
                                case.id, step_index
                            )
                        })?;
                    let inspection = engine.inspect(class_name).map_err(|error| {
                        format!(
                            "Parity case {} step {} cannot inspect {class_name}: {error}",
                            case.id, step_index
                        )
                    })?;
                    if inspection.match_status != mastercss_schema::MatchStatus::Matched
                        || !inspection
                            .rules
                            .iter()
                            .any(|rule| rule.text.contains(expected_rule_contains))
                    {
                        return Err(format!(
                            "Parity case {} step {} has no rule for {class_name} containing {expected_rule_contains}.",
                            case.id, step_index
                        ));
                    }
                }
            }
        }
    }
    for case in &corpus.compiler_cases {
        if case.id.is_empty() || !ids.insert(case.id.clone()) {
            return Err(format!(
                "Duplicate or empty semantic parity case id: {}",
                case.id
            ));
        }
        let base_manifest = serde_json::from_str(&manifest_json(root, &case.base_manifest)?)
            .map_err(|error| {
                format!(
                    "Parity case {} has an invalid compiler base manifest: {error}",
                    case.id
                )
            })?;
        let result = compile_css_directives(
            &case.source,
            &CompileNativeCssOptions {
                from: format!("parity/{}.css", case.id),
                ..Default::default()
            },
        )
        .map_err(|error| error.to_string())
        .and_then(|compiled| {
            lower_css_directives(
                &compiled.manifest_input,
                compiled.style_definitions.as_deref().unwrap_or_default(),
                &compiled.warnings,
                &LowerCssDirectivesOptions {
                    base_manifest: Some(base_manifest),
                    resolution_manifest: None,
                },
            )
            .map_err(|error| error.to_string())
        });
        if let Some(expected_error) = &case.expected_error {
            let error =
                result.expect_err(&format!("Parity case {} unexpectedly compiled.", case.id));
            if !error.contains(expected_error) {
                return Err(format!(
                    "Parity case {} error mismatch.\nexpected to contain: {}\nactual:              {}",
                    case.id, expected_error, error
                ));
            }
            continue;
        }
        let lowered = result
            .map_err(|error| format!("Parity case {} cannot compile CSS: {error}", case.id))?;
        if let Some(expected_generated_css) = &case.expected_generated_css
            && lowered.generated_css != *expected_generated_css
        {
            return Err(format!(
                "Parity case {} generated CSS mismatch.\nexpected: {}\nactual:   {}",
                case.id, expected_generated_css, lowered.generated_css
            ));
        }
        if let Some(expected_manifest) = &case.expected_manifest
            && lowered.manifest != *expected_manifest
        {
            return Err(format!(
                "Parity case {} manifest mismatch.\nexpected: {}\nactual:   {}",
                case.id, expected_manifest, lowered.manifest
            ));
        }
        for expected in &case.expected_mixins {
            let name = expected
                .get("name")
                .and_then(Value::as_str)
                .ok_or_else(|| format!("Parity case {} expected mixin has no name.", case.id))?;
            let actual = lowered
                .manifest
                .get("mixins")
                .and_then(Value::as_array)
                .and_then(|utilities| {
                    utilities
                        .iter()
                        .find(|utility| utility.get("name").and_then(Value::as_str) == Some(name))
                });
            if actual != Some(expected) {
                return Err(format!(
                    "Parity case {} mixin {name} mismatch.\nexpected: {}\nactual:   {}",
                    case.id,
                    expected,
                    actual.map_or_else(|| "<missing>".into(), Value::to_string)
                ));
            }
        }
    }
    Ok(ids)
}

pub(crate) fn validate_parity() -> Result<(), String> {
    let root = workspace_root();
    let corpus: SemanticParityCorpus = read_json(&root.join("parity/v2-language-corpus.json"))?;
    validate_semantic_parity_corpus(&root, &corpus).map(|_| ())
}
