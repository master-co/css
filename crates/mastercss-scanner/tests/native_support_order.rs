use mastercss_scanner::{ScannerSession, ScannerSourceOptions};
use mastercss_schema::CssDirectiveBlocklistEntry;

fn scan(scanner: &mut ScannerSession, source: &str, candidates: &[&str]) {
    let blocklist = [CssDirectiveBlocklistEntry::Exact("blocked:value".into())];
    scanner
        .scan_candidates(
            source,
            &candidates.join(" "),
            candidates.iter().map(|name| (*name).into()).collect(),
            &blocklist,
            &ScannerSourceOptions::default(),
        )
        .unwrap();
}

#[test]
fn unknown_native_capabilities_are_preserved_without_host_support() {
    let manifest = include_str!("../../../packages/preset/src/default-manifest.json");
    let mut scanner = ScannerSession::create(manifest).unwrap();
    scan(&mut scanner, "a.html", &["made-up:bad"]);
    scan(&mut scanner, "b.html", &["accent-color:red", "made-up:bad"]);
    let state = scanner.state().unwrap();
    assert_eq!(state.valid_classes, ["accent-color:red", "made-up:bad"]);
    assert!(state.invalid_classes.is_empty());
    assert!(state.engine.text.contains("accent-color:"));
}

#[test]
fn output_is_stable_with_duplicates_groups_blocklists_and_source_order() {
    let inputs: [&[&str]; 3] = [
        &["made-up:bad", "color:red"],
        &[
            "blocked:value",
            "made-up:bad",
            "{border-color:red;outline-color:blue}",
            "{border-color:red;outline-color:blue}",
            "made-up:other",
            "background-color:blue",
        ],
        &["color:red", "background-color:blue"],
    ];
    let mut expected = None;
    for order in [[0, 1, 2], [1, 2, 0], [2, 0, 1]] {
        let mut scanner = ScannerSession::create(r#"{"version":1,"languageVersion":3}"#).unwrap();
        for index in order {
            scan(&mut scanner, &format!("{index}.html"), inputs[index]);
        }
        let state = scanner.state().unwrap();
        let mut valid = state.valid_classes.clone();
        valid.sort();
        assert_eq!(valid.len(), 5);
        assert_eq!(
            valid
                .iter()
                .filter(|name| name.starts_with("made-up"))
                .count(),
            2
        );
        let actual = (valid, state.engine.text);
        if let Some(expected) = &expected {
            assert_eq!(&actual, expected);
        } else {
            expected = Some(actual);
        }
        scan(&mut scanner, "repeat.html", inputs[1]);
        assert_eq!(
            scanner.state().unwrap().engine.text,
            expected.as_ref().unwrap().1
        );
    }
}
