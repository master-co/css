use super::*;
use mastercss_schema::is_css_class_blocklisted;
fn manifest() -> &'static str {
    r#"{"version":1,"languageVersion":2,"variables":{"spacing":[{"key":"md","value":"1rem"}]}}"#
}
fn options(owner: &str) -> ScannerSourceOptions {
    ScannerSourceOptions {
        owner: owner.into(),
        ..Default::default()
    }
}
#[test]
fn replaces_clears_and_removes_current_contributions() {
    let mut scanner = ScannerSession::create(manifest()).unwrap();
    scanner.scan("a.html", "<div class='p-md'>").unwrap();
    scanner.scan("b.html", "<div class='p-md'>").unwrap();
    scanner.scan("a.html", "<div class='p:2px'>").unwrap();
    assert_eq!(scanner.state().unwrap().engine.rules.len(), 2);
    assert_eq!(scanner.state().unwrap().engine.resources.variables.len(), 1);
    let removed = scanner.scan("b.html", "").unwrap();
    assert!(removed.changed && removed.source_changed);
    assert_eq!(scanner.state().unwrap().engine.rules.len(), 1);
    assert!(
        scanner
            .state()
            .unwrap()
            .engine
            .resources
            .variables
            .is_empty()
    );
    assert!(scanner.scan("b.html", "").unwrap().cache_hit);
    scanner
        .remove_source("a.html", &options("project"))
        .unwrap();
    assert!(scanner.state().unwrap().engine.rules.is_empty());
}
#[test]
fn owner_reconciliation_and_virtual_children_keep_shared_rules() {
    let mut scanner = ScannerSession::create(manifest()).unwrap();
    for owner in ["one", "two"] {
        scanner
            .scan_source("a.html", "<div class='p:2px'>", &options(owner), &[])
            .unwrap();
    }
    let child = ScannerSourceOptions {
        parent_source: Some("a.html".into()),
        ..options("one")
    };
    scanner
        .scan_source("virtual.html", "<div class='p:3px'>", &child, &[])
        .unwrap();
    scanner.remove_source("a.html", &options("one")).unwrap();
    assert_eq!(scanner.state().unwrap().valid_classes, ["p:2px"]);
    scanner.remove_owner("two").unwrap();
    assert!(scanner.state().unwrap().engine.rules.is_empty());
}
#[test]
fn parses_all_snapshot_inputs_before_committing_and_tracks_empty_sources() {
    let mut scanner = ScannerSession::create(manifest()).unwrap();
    scanner.scan("a.html", "<div class='p:2px'>").unwrap();
    let before = scanner.state().unwrap();
    let inputs = vec![
        ScannerSourceInput {
            source: "a.html".into(),
            content: "<div class='p:3px'>".into(),
            options: options("project"),
            candidates: None,
            blocklist: vec![],
        },
        ScannerSourceInput {
            source: "bad.tsx".into(),
            content: "const x =".into(),
            options: options("project"),
            candidates: None,
            blocklist: vec![],
        },
    ];
    assert!(scanner.reconcile_sources("project", inputs).is_err());
    assert_eq!(scanner.state().unwrap(), before);
    let update = scanner.scan("empty.html", "").unwrap();
    assert!(!update.changed && update.source_changed);
    assert!(scanner.scan("empty.html", "").unwrap().cache_hit);
    assert_eq!(scanner.collect_candidates(["p:99px"]), ["p:99px"]);
    assert!(
        !scanner
            .state()
            .unwrap()
            .latent_classes
            .contains(&"p:99px".into())
    );
}
#[test]
fn native_names_policy_and_safelist_have_independent_owners() {
    let mut scanner = ScannerSession::create(manifest()).unwrap();
    scanner.register_native_classes("stylesheet", ["card"]);
    scanner.scan("a.html", "<div class='card p:2px'>").unwrap();
    scanner.ensure_classes(["p:2px"]).unwrap();
    assert_eq!(scanner.state().unwrap().used_native_classes, ["card"]);
    scanner.register_native_classes("stylesheet", Vec::<String>::new());
    assert!(scanner.state().unwrap().used_native_classes.is_empty());
    scanner
        .scan_source(
            "a.html",
            "<div class='card p:2px'>",
            &options("project"),
            &[CssDirectiveBlocklistEntry::Exact("p:2px".into())],
        )
        .unwrap();
    assert_eq!(scanner.state().unwrap().valid_classes, ["p:2px"]);
    scanner.remove_owner("safelist").unwrap();
    assert!(scanner.state().unwrap().engine.rules.is_empty());
}

#[test]
fn matches_compiler_blocklist_values_without_changing_regex_dialects() {
    let blocklist = vec![
        CssDirectiveBlocklistEntry::Exact("exact".into()),
        CssDirectiveBlocklistEntry::Pattern {
            source: "^debug\\-.*$".into(),
            flags: String::new(),
        },
        CssDirectiveBlocklistEntry::Pattern {
            source: "^icon\\-.$".into(),
            flags: String::new(),
        },
    ];
    assert!(is_css_class_blocklisted("exact", &blocklist));
    assert!(is_css_class_blocklisted("debug-card", &blocklist));
    assert!(is_css_class_blocklisted("icon-a", &blocklist));
    assert!(!is_css_class_blocklisted("icon-😀", &blocklist));
    assert!(!is_css_class_blocklisted("debug", &blocklist));
    assert!(!is_css_class_blocklisted("icon-long", &blocklist));

    let scanner_blocklist = vec![CssDirectiveBlocklistEntry::Pattern {
        source: "^bg:".into(),
        flags: "g".into(),
    }];
    assert!(is_css_class_blocklisted("bg:red", &scanner_blocklist));
    assert!(!is_css_class_blocklisted("fg:red", &scanner_blocklist));
}

#[test]
fn snapshot_membership_is_exact_even_when_a_virtual_parent_is_removed() {
    let mut scanner = ScannerSession::create(manifest()).unwrap();
    scanner.scan("parent.html", "<div class='p:1px'>").unwrap();
    let child = ScannerSourceOptions {
        parent_source: Some("parent.html".into()),
        ..Default::default()
    };
    scanner
        .scan_source("live.html", "<div class='p:2px'>", &child, &[])
        .unwrap();
    scanner
        .reconcile_sources(
            "project",
            vec![ScannerSourceInput {
                source: "live.html".into(),
                content: "<div class='p:2px'>".into(),
                options: child,
                candidates: None,
                blocklist: vec![],
            }],
        )
        .unwrap();
    let state = scanner.state().unwrap();
    assert_eq!(state.valid_classes, ["p:2px"]);
    assert_eq!(state.sources.len(), 1);
    assert_eq!(
        state.sources[0].parent_source.as_deref(),
        Some("parent.html")
    );
    scanner
        .remove_source("parent.html", &ScannerSourceOptions::default())
        .unwrap();
    assert!(scanner.state().unwrap().sources.is_empty());
    assert!(scanner.state().unwrap().engine.rules.is_empty());
}
