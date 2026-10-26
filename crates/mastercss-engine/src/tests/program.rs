/// The default manifest and every manifest in the engine parity corpus, with the
/// classes each corpus case ensures.
fn program_manifests() -> Vec<(String, Vec<String>)> {
    let corpus: serde_json::Value = serde_json::from_str(include_str!(
        "../../../../parity/v2-language-corpus.json"
    ))
    .unwrap();
    let default_manifest =
        include_str!("../../../../packages/preset/src/default-manifest.json").to_owned();
    let mut manifests = vec![(default_manifest.clone(), Vec::new())];
    for case in corpus["engineCases"].as_array().unwrap() {
        let manifest = match &case["manifest"] {
            serde_json::Value::String(name) if name == "default" => default_manifest.clone(),
            manifest => manifest.to_string(),
        };
        let classes = case["steps"]
            .as_array()
            .unwrap()
            .iter()
            .flat_map(|step| {
                step["classes"]
                    .as_array()
                    .into_iter()
                    .flatten()
                    .chain(step.get("className"))
                    .filter_map(|class| class.as_str().map(str::to_owned))
            })
            .collect();
        manifests.push((manifest, classes));
    }
    manifests
}

#[test]
fn programs_encode_every_field_they_decode() {
    for (manifest, _) in program_manifests() {
        let program = crate::compile_program(&manifest).unwrap();
        let decoded = crate::program::decode(&program).unwrap();
        assert!(crate::program::encode(&decoded) == program);
    }
}

#[test]
fn program_encoding_is_deterministic() {
    let manifest = include_str!("../../../../packages/preset/src/default-manifest.json");
    assert!(crate::compile_program(manifest).unwrap() == crate::compile_program(manifest).unwrap());
}

#[test]
fn decoded_programs_execute_like_compiled_manifests() {
    for (manifest, classes) in program_manifests() {
        let parsed = mastercss_schema::MasterCssManifest::parse(&manifest).unwrap();
        let mut program = crate::compile_manifest(&parsed).unwrap();
        crate::finish_program(&mut program).unwrap();
        let mut compiled =
            EngineSession::with_program(program, mastercss_schema::EmittedGlobals::default());
        let mut decoded = EngineSession::from_program(
            &crate::compile_program(&manifest).unwrap(),
            Default::default(),
        )
        .unwrap();
        assert_eq!(
            decoded.ensure_class_rules(&classes).unwrap(),
            compiled.ensure_class_rules(&classes).unwrap()
        );
        assert_eq!(decoded.snapshot().unwrap(), compiled.snapshot().unwrap());
    }
}

#[test]
fn malformed_programs_return_errors() {
    let program = crate::compile_program(include_str!(
        "../../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    let step = (program.len() / 400).max(1);
    for length in (0..64).chain((64..program.len()).step_by(step)) {
        assert!(
            crate::program::decode(&program[..length]).is_err(),
            "{length}"
        );
    }
    for position in (0..program.len()).step_by(step) {
        let mut corrupted = program.clone();
        corrupted[position] ^= 0xff;
        // A flipped byte may still decode; it must never panic.
        let _ = crate::program::decode(&corrupted);
    }
    let mut trailing = program.clone();
    trailing.push(0);
    assert!(crate::program::decode(&trailing).is_err());
}

#[test]
fn programs_from_other_versions_are_rejected() {
    let mut program = crate::compile_program(include_str!(
        "../../../../packages/preset/src/default-manifest.json"
    ))
    .unwrap();
    program[4] = (mastercss_schema::PROGRAM_VERSION + 1) as u8;
    assert!(matches!(
        EngineSession::from_program(&program, Default::default()),
        Err(EngineError::UnsupportedProgramVersion)
    ));
    assert!(matches!(
        EngineSession::from_program(b"{\"version\":6}", Default::default()),
        Err(EngineError::InvalidProgram(_))
    ));
}
