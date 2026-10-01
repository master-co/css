use super::{ClassListPolicy, LintBatchIr, SourceRange, create_class_list_ir};
use crate::{ClassConflictIr, PartialClassConflictIr};

fn analysis() -> LintBatchIr {
    LintBatchIr {
        version: 1,
        sorted_class_names: vec!["margin:2x".into(), "color:white".into()],
        conflicts: Vec::new(),
        partial_conflicts: Vec::new(),
    }
}

#[test]
fn preserves_raw_tokens_and_whitespace_while_sorting() {
    let ir = create_class_list_ir(
        "color:white  margin:2x\tcolor:white",
        &[
            "color:white".into(),
            "margin:2x".into(),
            "color:white".into(),
        ],
        analysis(),
        ClassListPolicy {
            token_families: &[],
            matches: &[true, true, true],
            validation_errors: &[],
            disallow_unknown_class: false,
            raw_value_candidates: &[],
            raw_value_policy: None,
        },
    );
    assert_eq!(ir.sort_edit.unwrap().text, "margin:2x  color:white");
}

#[test]
fn creates_utf16_conflict_ranges_and_whole_list_fixes() {
    let mut full = analysis();
    full.conflicts.push(ClassConflictIr {
        class_name: "margin:1x".into(),
        conflicts: vec!["margin:2x".into()],
    });
    let ir = create_class_list_ir(
        "😀 margin:1x  margin:2x",
        &["😀".into(), "margin:1x".into(), "margin:2x".into()],
        full,
        ClassListPolicy {
            token_families: &[],
            matches: &[false, true, true],
            validation_errors: &[],
            disallow_unknown_class: false,
            raw_value_candidates: &[],
            raw_value_policy: None,
        },
    );
    assert_eq!(ir.conflict_range, Some(SourceRange { start: 3, end: 12 }));
    assert_eq!(ir.conflict_edit.unwrap().text, "😀  margin:2x");

    let mut partial = analysis();
    partial.partial_conflicts.push(PartialClassConflictIr {
        class_name: "margin-inline:md".into(),
        conflict: "margin-left:lg".into(),
    });
    let ir = create_class_list_ir(
        "margin-inline:md margin-left:lg",
        &["margin-inline:md".into(), "margin-left:lg".into()],
        partial,
        ClassListPolicy {
            token_families: &[],
            matches: &[true, true],
            validation_errors: &[],
            disallow_unknown_class: false,
            raw_value_candidates: &[],
            raw_value_policy: None,
        },
    );
    assert!(ir.conflict_edit.is_none());
    let diagnostic = ir
        .diagnostics
        .iter()
        .find(|item| item.code == "partially-conflicting-class")
        .unwrap();
    assert!(diagnostic.fix.is_none());
    assert!(!diagnostic.data.contains_key("replacement"));
}

#[test]
fn creates_invalid_and_unknown_class_diagnostics() {
    let ir = create_class_list_ir(
        "text-decoration:bad() 😀 unknown",
        &[
            "text-decoration:bad()".into(),
            "😀".into(),
            "unknown".into(),
        ],
        LintBatchIr {
            version: 1,
            sorted_class_names: vec![
                "text-decoration:bad()".into(),
                "😀".into(),
                "unknown".into(),
            ],
            conflicts: Vec::new(),
            partial_conflicts: Vec::new(),
        },
        ClassListPolicy {
            token_families: &[],
            matches: &[true, false, false],
            validation_errors: &[vec![
                "Invalid value for `text-decoration-color` property".into(),
            ]],
            disallow_unknown_class: true,
            raw_value_candidates: &[],
            raw_value_policy: None,
        },
    );
    let invalid = ir
        .diagnostics
        .iter()
        .find(|diagnostic| diagnostic.code == "invalid-class")
        .unwrap();
    assert_eq!(invalid.range, SourceRange { start: 0, end: 21 });
    assert_eq!(
        invalid.message,
        "Class \"text-decoration:bad()\" emits invalid CSS: Invalid value for `text-decoration-color` property."
    );
    let unknown = ir
        .diagnostics
        .iter()
        .filter(|diagnostic| diagnostic.code == "unknown-class")
        .collect::<Vec<_>>();
    assert_eq!(unknown.len(), 2);
    assert_eq!(unknown[0].range, SourceRange { start: 22, end: 24 });
    assert_eq!(unknown[1].range, SourceRange { start: 25, end: 32 });
}
