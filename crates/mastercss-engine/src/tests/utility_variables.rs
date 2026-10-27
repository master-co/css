/// A namespace and its variables as `(name, key)`; a `None` name is the default one.
type VariableGroup<'a> = (&'a str, &'a [(Option<&'a str>, &'a str)]);

/// A decoded program with `variables` in declaration order.
fn variables_program(variables: &[VariableGroup<'_>]) -> super::Program {
    let groups = variables
        .iter()
        .map(|(namespace, variables)| {
            let definitions = variables
                .iter()
                .map(|(name, key)| {
                    let mut definition = serde_json::json!({
                        "key": key,
                        "values": [{ "path": [":root"], "value": "1px" }]
                    });
                    if let Some(name) = name {
                        definition["name"] = (*name).into();
                    }
                    definition
                })
                .collect::<Vec<_>>();
            ((*namespace).to_owned(), serde_json::Value::Array(definitions))
        })
        .collect::<serde_json::Map<_, _>>();
    let manifest = serde_json::json!({
        "version": mastercss_schema::MANIFEST_VERSION,
        "languageVersion": mastercss_schema::LANGUAGE_VERSION,
        "variables": groups
    });
    crate::program::decode(&crate::compile_program(&manifest.to_string()).unwrap()).unwrap()
}

fn token_utility(
    aliases: &[(&str, &str)],
    references: &[&str],
    emit: super::UtilityEmit,
) -> super::UtilityDefinition {
    super::UtilityDefinition {
        id: "test".into(),
        name: None,
        utility_type: 0,
        order: None,
        layer: super::UtilityLayerName::Utilities,
        keys: Vec::new(),
        alias_groups: Vec::new(),
        variable_aliases: aliases
            .iter()
            .map(|(key, name)| ((*key).to_owned(), (*name).to_owned()))
            .collect(),
        variable_alias_refs: references
            .iter()
            .map(|reference| mastercss_lexer::concat_text!("~", reference))
            .collect(),
        native_fallback: false,
        emit,
        matchers: Vec::new(),
    }
}

/// Lookups agree with the entries the old eager mapping produced, for `keys` and
/// for every key that has an entry.
fn assert_lookups_match_entries(
    utility: &super::UtilityDefinition,
    program: &super::Program,
    keys: &[&str],
) {
    let entries = crate::utility::utility_variable_entries(utility, program);
    for (key, name) in &entries {
        assert_eq!(
            crate::utility::utility_variable(utility, key, program),
            Some(name.as_str()),
            "{key}"
        );
    }
    for key in keys {
        let expected = entries
            .iter()
            .find(|(entry, _)| entry == key)
            .map(|(_, name)| name.as_str());
        assert_eq!(
            crate::utility::utility_variable(utility, key, program),
            expected,
            "{key}"
        );
    }
}

#[test]
fn utility_variables_resolve_like_their_entries_in_every_corpus_program() {
    for (manifest, _) in program_manifests() {
        let program =
            crate::program::decode(&crate::compile_program(&manifest).unwrap()).unwrap();
        for utility in &program.utilities {
            assert_lookups_match_entries(utility, &program, &["", "-", "missing", "-missing"]);
        }
    }
}

#[test]
fn variable_keys_and_names_cannot_start_or_end_with_a_dash() {
    for (name, key) in [
        (None, "-x"),
        (None, "x-"),
        (Some("-space-x"), "x"),
        (Some("space-"), "x"),
    ] {
        let mut variable = serde_json::json!({ "key": key, "values": [] });
        if let Some(name) = name {
            variable["name"] = name.into();
        }
        let manifest = serde_json::json!({
            "version": mastercss_schema::MANIFEST_VERSION,
            "languageVersion": mastercss_schema::LANGUAGE_VERSION,
            "variables": { "space": [variable] }
        });
        assert!(
            crate::compile_program(&manifest.to_string()).is_err(),
            "{name:?} {key}"
        );
    }
}

#[test]
fn utility_variables_follow_alias_and_namespace_precedence() {
    let program = variables_program(&[
        ("space", &[(None, ""), (None, "y"), (None, "a--b")]),
        ("alt", &[(None, "y"), (None, "z")]),
    ]);
    let property = || super::UtilityEmit::Property {
        property: "margin".into(),
    };
    let utility = token_utility(&[], &["space", "alt"], property());
    for (key, expected) in [
        // The first namespace with the key wins over later ones.
        ("y", Some("space-y")),
        ("z", Some("alt-z")),
        ("a--b", Some("space-a--b")),
        // A namespace's own variable is not a token.
        ("", None),
        ("w", None),
    ] {
        assert_eq!(
            crate::utility::utility_variable(&utility, key, &program),
            expected,
            "{key:?}"
        );
    }
    assert_lookups_match_entries(&utility, &program, &["y", "z", "a--b", "", "w"]);

    // Explicit aliases come first; one naming a missing variable is skipped.
    let aliased = token_utility(
        &[("y", "alt-y"), ("w", "missing"), ("w", "alt-z")],
        &["space"],
        property(),
    );
    assert_eq!(
        crate::utility::utility_variable(&aliased, "y", &program),
        Some("alt-y")
    );
    assert_eq!(
        crate::utility::utility_variable(&aliased, "w", &program),
        Some("alt-z")
    );
    assert_lookups_match_entries(&aliased, &program, &["y", "w"]);

    // String keys of recipes never resolve custom-property-like keys through a
    // namespace, while aliases still do.
    let recipe = token_utility(
        &[("--alias", "space-y")],
        &["space"],
        super::UtilityEmit::Recipe {
            definition: 0,
            key: true,
        },
    );
    assert_eq!(crate::utility::utility_variable(&recipe, "a--b", &program), None);
    assert_eq!(
        crate::utility::utility_variable(&recipe, "--alias", &program),
        Some("space-y")
    );
    assert_lookups_match_entries(&recipe, &program, &["a--b", "--alias", "y"]);
}
