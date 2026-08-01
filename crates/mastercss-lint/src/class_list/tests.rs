use super::*;
use crate::{CanonicalComposeSuggestionIr, ClassConflictIr, PartialClassConflictIr};

fn analysis() -> LintBatchIr {
    LintBatchIr {
        version: 1,
        sorted_class_names: vec!["m:2x".into(), "fg:white".into()],
        conflicts: Vec::new(),
        partial_conflicts: Vec::new(),
    }
}

#[test]
fn preserves_raw_tokens_and_whitespace_while_sorting() {
    let ir = create_class_list_ir(
        "fg:white  m:2x\tfg:white",
        &["fg:white".into(), "m:2x".into(), "fg:white".into()],
        analysis(),
        ClassListPolicy {
            matches: &[true, true, true],
            validation_errors: &[],
            disallow_unknown_class: false,
            raw_value_candidates: &[],
            raw_value_policy: None,
        },
    );
    assert_eq!(ir.sort_edit.unwrap().text, "m:2x  fg:white");
}

#[test]
fn creates_utf16_conflict_ranges_and_whole_list_fixes() {
    let mut full = analysis();
    full.conflicts.push(ClassConflictIr {
        class_name: "m:1x".into(),
        conflicts: vec!["m:2x".into()],
    });
    let ir = create_class_list_ir(
        "😀 m:1x  m:2x",
        &["😀".into(), "m:1x".into(), "m:2x".into()],
        full,
        ClassListPolicy {
            matches: &[false, true, true],
            validation_errors: &[],
            disallow_unknown_class: false,
            raw_value_candidates: &[],
            raw_value_policy: None,
        },
    );
    assert_eq!(ir.conflict_range, Some(SourceRange { start: 3, end: 7 }));
    assert_eq!(ir.conflict_edit.unwrap().text, "😀  m:2x");

    let mut partial = analysis();
    partial.partial_conflicts.push(PartialClassConflictIr {
        class_name: "mx:md".into(),
        replacement: "mr:md".into(),
        conflict: "ml:lg".into(),
    });
    let ir = create_class_list_ir(
        "mx:md ml:lg",
        &["mx:md".into(), "ml:lg".into()],
        partial,
        ClassListPolicy {
            matches: &[true, true],
            validation_errors: &[],
            disallow_unknown_class: false,
            raw_value_candidates: &[],
            raw_value_policy: None,
        },
    );
    assert_eq!(ir.conflict_edit.unwrap().text, "mr:md ml:lg");
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

#[test]
fn formats_canonical_compose_class_names_as_code_spans() {
    let mut result = LintClassListIr {
        version: LINT_BATCH_VERSION,
        analysis: analysis(),
        diagnostics: Vec::new(),
        sort_edit: None,
        conflict_range: None,
        conflict_edit: None,
    };
    add_canonical_compose_diagnostics(
        &mut result,
        "contain:content bg:blue-60:hover@sm",
        &["contain:content".into(), "bg:blue-60:hover@sm".into()],
        &CanonicalComposeDirectiveIr {
            version: LINT_BATCH_VERSION,
            suggestions: vec![
                CanonicalComposeSuggestionIr {
                    actual: "contain:content".into(),
                    recommended: "contain: content".into(),
                    class_names: vec!["contain:content".into()],
                    kind: CanonicalComposeSuggestionKind::NativeDeclaration,
                },
                CanonicalComposeSuggestionIr {
                    actual: "bg:blue-60:hover@sm".into(),
                    recommended: "&:hover { @variant sm { @compose bg:blue-60; } }".into(),
                    class_names: vec!["bg:blue-60:hover@sm".into()],
                    kind: CanonicalComposeSuggestionKind::VariantBlock,
                },
            ],
            structural_change: Some(true),
            replacement: None,
        },
    );

    assert_eq!(
        result
            .diagnostics
            .iter()
            .map(|diagnostic| diagnostic.message.as_str())
            .collect::<Vec<_>>(),
        [
            "Use CSS declaration `contain: content` instead of class `contain:content`.",
            "Move class `bg:blue-60:hover@sm` into the canonical @compose block.",
        ]
    );
}
