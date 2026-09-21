use std::collections::HashSet;

use mastercss_scanner::ScannerSession;
use mastercss_schema::CssDirectiveBlocklistEntry;

#[test]
fn source_cache_retains_all_candidates_and_pending_validation_preserves_order() {
    let mut scanner = ScannerSession::create(r#"{"version":1}"#).unwrap();
    let blocklist = [CssDirectiveBlocklistEntry::Exact("blocked:value".into())];
    for (source, candidates, expected) in [
        ("a", vec!["made-up:bad"], vec!["made-up:bad"]),
        (
            "b",
            vec![
                "blocked:value",
                "made-up:bad",
                "color:red",
                "color:red",
                "background:blue",
            ],
            vec!["color:red", "background:blue"],
        ),
    ] {
        let candidates = candidates
            .into_iter()
            .map(str::to_owned)
            .collect::<Vec<_>>();
        let pending = scanner.pending_candidates(&candidates, &blocklist);
        assert_eq!(pending, expected);
        let support = scanner
            .native_declaration_candidates(&pending)
            .unwrap()
            .iter()
            .map(|candidate| candidate.property != "made-up")
            .collect::<Vec<_>>();
        scanner
            .scan_pending_candidates(
                source,
                "content",
                candidates.clone(),
                &blocklist,
                &support,
                &HashSet::new(),
            )
            .unwrap();
        assert_eq!(
            scanner.cached_source_candidates(source, "content"),
            Some(candidates.as_slice())
        );
        assert!(
            scanner
                .pending_candidates(&candidates, &blocklist)
                .is_empty()
        );
        assert!(
            scanner
                .cached_source_candidates(source, "changed")
                .is_none()
        );
    }
    assert_eq!(
        scanner.state().unwrap().valid_classes,
        ["color:red", "background:blue"]
    );
    assert!(scanner.cached_source_candidates("", "content").is_none());
    assert!(scanner.cached_source_candidates("a", "").is_none());
    scanner.reset().unwrap();
    assert!(scanner.cached_source_candidates("a", "content").is_none());
}
