use mastercss_scanner::{ScannerSession, ScannerSourceOptions};
use mastercss_schema::CssDirectiveBlocklistEntry;

#[test]
fn cache_tracks_empty_results_and_policy_changes_without_host_support_filtering() {
    let mut scanner = ScannerSession::create(r#"{"version":1,"languageVersion":2}"#).unwrap();
    let options = ScannerSourceOptions::default();
    let candidates = vec!["future-property:new-value".into(), "color:red".into()];
    let blocklist = [CssDirectiveBlocklistEntry::Exact("color:red".into())];
    let first = scanner
        .scan_candidates("a", "content", candidates.clone(), &blocklist, &options)
        .unwrap();
    assert!(first.changed && first.source_changed && !first.cache_hit);
    assert_eq!(
        scanner.state().unwrap().valid_classes,
        ["future-property:new-value"]
    );
    assert!(
        scanner
            .scan_candidates("a", "content", candidates.clone(), &blocklist, &options)
            .unwrap()
            .cache_hit
    );
    let changed_policy = scanner
        .scan_candidates("a", "content", candidates, &[], &options)
        .unwrap();
    assert!(changed_policy.changed && !changed_policy.cache_hit);
    assert_eq!(
        scanner.state().unwrap().valid_classes,
        ["color:red", "future-property:new-value"]
    );
    let cleared = scanner
        .scan_candidates("a", "", vec![], &[], &options)
        .unwrap();
    assert!(cleared.changed && cleared.source_changed);
    assert!(scanner.state().unwrap().engine.rules.is_empty());
    assert!(
        scanner
            .scan_candidates("a", "", vec![], &[], &options)
            .unwrap()
            .cache_hit
    );
    scanner.reset().unwrap();
    assert!(
        !scanner
            .scan_candidates("a", "", vec![], &[], &options)
            .unwrap()
            .cache_hit
    );
}

#[test]
fn extraction_cache_does_not_reuse_host_candidates_and_reapplies_policy() {
    let mut scanner = ScannerSession::create(r#"{"version":1,"languageVersion":2}"#).unwrap();
    let options = ScannerSourceOptions::default();
    let source = "<div class=\"color:red\"/>";
    scanner
        .scan_candidates("a.html", source, vec!["color:blue".into()], &[], &options)
        .unwrap();
    scanner.scan("a.html", source).unwrap();
    assert_eq!(scanner.state().unwrap().valid_classes, ["color:red"]);
    assert!(scanner.scan("a.html", source).unwrap().cache_hit);
    let blocklist = [CssDirectiveBlocklistEntry::Exact("color:red".into())];
    assert!(
        scanner
            .scan_source("a.html", source, &options, &blocklist)
            .unwrap()
            .changed
    );
    assert!(scanner.state().unwrap().valid_classes.is_empty());
    assert!(
        scanner
            .scan_source("a.html", source, &options, &blocklist)
            .unwrap()
            .cache_hit
    );
}
