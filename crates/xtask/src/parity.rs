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
    if corpus.version != 2
        || corpus.semantic_baseline != "ef1a7c851"
        || corpus.public_baseline != "v2.0.0-rc.87"
    {
        return Err("Semantic parity corpus has an unsupported version or baseline.".into());
    }
    let mut ids = HashSet::new();
    for case in &corpus.parser_cases {
        if case.id.is_empty() || !ids.insert(case.id.clone()) {
            return Err(format!(
                "Duplicate or empty semantic parity case id: {}",
                case.id
            ));
        }
        if case.source_id.is_empty()
            || !matches!(case.kind.as_str(), "condition" | "selector" | "lexer")
            || case.input.is_empty()
            || case.expected_canonical.is_empty()
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
        if case.source_id.as_deref().is_some_and(str::is_empty) {
            return Err(format!("Parity case {} has an empty source id.", case.id));
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
                    let candidate_count = engine
                        .native_declaration_candidates(classes)
                        .map_err(|error| {
                            format!(
                                "Parity case {} step {} cannot inspect native declarations: {error}",
                                case.id, step_index
                            )
                        })?
                        .len();
                    engine
                        .ensure_class_rules_with_native_support(
                            classes,
                            &vec![true; candidate_count],
                        )
                        .map_err(|error| {
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
                            .chain(
                                snapshot
                                    .resources
                                    .animations
                                    .into_iter()
                                    .map(|resource| resource.name),
                            )
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
                    expected_animation_names,
                } => {
                    let inspection = engine.inspect(class_name).map_err(|error| {
                        format!(
                            "Parity case {} step {} cannot inspect {class_name}: {error}",
                            case.id, step_index
                        )
                    })?;
                    if inspection.valid != *expected_valid {
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
                    let animation_names = inspection
                        .rules
                        .iter()
                        .map(|rule| rule.animation_names.clone())
                        .collect::<Vec<_>>();
                    if !expected_animation_names.is_empty()
                        && animation_names != *expected_animation_names
                    {
                        return Err(format!(
                            "Parity case {} step {} animation metadata mismatch for {class_name}.",
                            case.id, step_index
                        ));
                    }
                }
                EngineParityStep::InspectContains {
                    class_name,
                    expected_rule_contains,
                } => {
                    let candidate_count = engine
                        .native_declaration_candidates(std::slice::from_ref(class_name))
                        .map_err(|error| {
                            format!(
                                "Parity case {} step {} cannot inspect native declarations for {class_name}: {error}",
                                case.id, step_index
                            )
                        })?
                        .len();
                    engine
                        .ensure_class_rules_with_native_support(
                            std::slice::from_ref(class_name),
                            &vec![true; candidate_count],
                        )
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
                    if !inspection.valid
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
        if case.source_id.as_deref().is_some_and(str::is_empty) {
            return Err(format!("Parity case {} has an empty source id.", case.id));
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
        for expected in &case.expected_utilities {
            let name = expected
                .get("name")
                .and_then(Value::as_str)
                .ok_or_else(|| format!("Parity case {} expected utility has no name.", case.id))?;
            let actual = lowered
                .manifest
                .get("utilities")
                .and_then(Value::as_array)
                .and_then(|utilities| {
                    utilities
                        .iter()
                        .find(|utility| utility.get("name").and_then(Value::as_str) == Some(name))
                });
            if actual != Some(expected) {
                return Err(format!(
                    "Parity case {} utility {name} mismatch.\nexpected: {}\nactual:   {}",
                    case.id,
                    expected,
                    actual.map_or_else(|| "<missing>".into(), Value::to_string)
                ));
            }
        }
    }
    Ok(ids)
}

pub(crate) fn validate_rust_takeover_ledger(
    root: &Path,
    ledger: &RustTakeoverLedger,
    corpus_ids: &HashSet<String>,
    exception_ids: &HashSet<String>,
) -> Result<(), String> {
    if ledger.version != 1 || ledger.semantic_baseline != "ef1a7c851" {
        return Err("Rust takeover ledger has an unsupported version or baseline.".into());
    }
    let mut entries = HashSet::new();
    let mut total = 0;
    for suite in &ledger.suites {
        if suite.tests.len() != suite.expected_tests {
            return Err(format!(
                "Rust takeover ledger suite {} expected {} tests but lists {}.",
                suite.file,
                suite.expected_tests,
                suite.tests.len()
            ));
        }
        for test in &suite.tests {
            total += 1;
            let id = format!("{}#{}", suite.file, test.name);
            if test.name.is_empty() || !entries.insert(id.clone()) {
                return Err(format!(
                    "Duplicate or empty Rust takeover ledger entry: {id}"
                ));
            }
            if test.coverage.is_empty() {
                return Err(format!("Rust takeover ledger entry {id} has no coverage."));
            }
            for coverage in &test.coverage {
                if let Some(case_id) = coverage.strip_prefix("corpus:") {
                    if !corpus_ids.contains(case_id) {
                        return Err(format!(
                            "Rust takeover ledger entry {id} references unknown corpus case {case_id}."
                        ));
                    }
                } else if let Some(exception_id) = coverage.strip_prefix("exception:") {
                    if !exception_ids.contains(exception_id) {
                        return Err(format!(
                            "Rust takeover ledger entry {id} references unknown exception {exception_id}."
                        ));
                    }
                } else if let Some(test_reference) = coverage.strip_prefix("test:") {
                    let (path, needle) = test_reference.split_once('#').ok_or_else(|| {
                        format!("Rust takeover ledger entry {id} has invalid test reference.")
                    })?;
                    let source_path = root.join(path);
                    let source = fs::read_to_string(&source_path).map_err(|error| {
                        format!(
                            "Cannot read coverage test {}: {error}",
                            source_path.display()
                        )
                    })?;
                    if needle.is_empty() || !source.contains(needle) {
                        return Err(format!(
                            "Rust takeover ledger entry {id} references missing test marker {coverage}."
                        ));
                    }
                } else {
                    return Err(format!(
                        "Rust takeover ledger entry {id} has unsupported coverage {coverage}."
                    ));
                }
            }
        }
    }
    if total != ledger.expected_legacy_tests {
        return Err(format!(
            "Rust takeover ledger expected {} legacy tests but lists {total}.",
            ledger.expected_legacy_tests
        ));
    }
    Ok(())
}

pub(crate) fn validate_parity() -> Result<(), String> {
    let root = workspace_root();
    let path = root.join("parity-exceptions.json");
    let parity: ParityFile = read_json(&path)?;
    let mut ids = HashSet::new();
    for exception in parity.exceptions {
        if !ids.insert(exception.id.clone()) {
            return Err(format!("Duplicate parity exception id: {}", exception.id));
        }
        if exception.id.is_empty()
            || exception.reason.is_empty()
            || exception.packages.is_empty()
            || exception.test.is_empty()
        {
            return Err(format!(
                "Parity exception {} is missing required evidence.",
                exception.id
            ));
        }
        let _ = (exception.old, exception.new);
    }
    let corpus: SemanticParityCorpus = read_json(&root.join("parity/rust-semantic-corpus.json"))?;
    let corpus_ids = validate_semantic_parity_corpus(&root, &corpus)?;
    let ledger: RustTakeoverLedger = read_json(&root.join("parity/rust-takeover-ledger.json"))?;
    validate_rust_takeover_ledger(&root, &ledger, &corpus_ids, &ids)
}
