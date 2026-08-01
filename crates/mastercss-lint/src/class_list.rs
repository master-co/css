use crate::{
    CanonicalClassGroupSuggestionIr, CanonicalClassSuggestionIr, CanonicalComposeDirectiveIr,
    CanonicalComposeSuggestionKind, LintBatchIr, LintClassListIr, LintDiagnosticIr, LintEditIr,
    LintEditScope, RawValueCandidateIr, RawValuePolicy,
};
use mastercss_lexer::utf16_len;
use mastercss_schema::{LINT_BATCH_VERSION, SourceRange};
use std::collections::{HashMap, VecDeque};

#[derive(Debug, Clone)]
enum ClassListItem {
    Class {
        raw: String,
        token: String,
        range: SourceRange,
    },
    Space(String),
}

struct ValidationContext<'a> {
    matches: &'a [bool],
    errors: &'a [Vec<String>],
    disallow_unknown_class: bool,
}

pub(crate) struct ClassListPolicy<'a> {
    pub matches: &'a [bool],
    pub validation_errors: &'a [Vec<String>],
    pub disallow_unknown_class: bool,
    pub raw_value_candidates: &'a [RawValueCandidateIr],
    pub raw_value_policy: Option<&'a RawValuePolicy>,
}

pub(crate) fn create_class_list_ir(
    class_list: &str,
    class_names: &[String],
    analysis: LintBatchIr,
    policy: ClassListPolicy<'_>,
) -> LintClassListIr {
    let items = parse_class_list(class_list, class_names);
    let range = SourceRange {
        start: 0,
        end: utf16_len(class_list),
    };
    let sorted_text = sort_class_list(&items, &analysis.sorted_class_names);
    let sort_edit = (sorted_text != class_list).then_some(LintEditIr {
        range: range.clone(),
        text: sorted_text,
        scope: LintEditScope::ClassList,
    });
    let conflict_names = if analysis.conflicts.is_empty() {
        analysis
            .partial_conflicts
            .iter()
            .map(|conflict| conflict.class_name.as_str())
            .collect::<Vec<_>>()
    } else {
        analysis
            .conflicts
            .iter()
            .map(|conflict| conflict.class_name.as_str())
            .collect::<Vec<_>>()
    };
    let conflict_range = conflict_names
        .first()
        .and_then(|class_name| find_class_range(&items, class_name));
    let conflict_text = if analysis.conflicts.is_empty() {
        replace_partial_conflicts(&items, &analysis)
    } else {
        remove_full_conflicts(&items, &analysis)
    };
    let conflict_edit = (conflict_text != class_list).then_some(LintEditIr {
        range,
        text: conflict_text,
        scope: LintEditScope::ClassList,
    });
    let validation = ValidationContext {
        matches: policy.matches,
        errors: policy.validation_errors,
        disallow_unknown_class: policy.disallow_unknown_class,
    };
    let mut diagnostics = create_diagnostics(
        class_names,
        &items,
        &analysis,
        sort_edit.as_ref(),
        conflict_edit.as_ref(),
        &validation,
    );
    if let Some(raw_value_policy) = policy.raw_value_policy {
        diagnostics.extend(create_raw_value_diagnostics(
            &items,
            policy.raw_value_candidates,
            raw_value_policy,
        ));
    }
    LintClassListIr {
        version: LINT_BATCH_VERSION,
        analysis,
        diagnostics,
        sort_edit,
        conflict_edit,
        conflict_range,
    }
}

fn create_raw_value_diagnostics(
    items: &[ClassListItem],
    candidates: &[RawValueCandidateIr],
    policy: &RawValuePolicy,
) -> Vec<LintDiagnosticIr> {
    if policy.allow_raw_values {
        return Vec::new();
    }
    let mut diagnostics = Vec::new();
    for candidate in candidates {
        if policy.allow_properties.contains(&candidate.key)
            || candidate
                .properties
                .iter()
                .any(|property| policy.allow_properties.contains(property))
        {
            continue;
        }
        let value = candidate
            .segments
            .iter()
            .filter(|segment| {
                !policy
                    .allowed_patterns
                    .iter()
                    .any(|pattern| pattern.is_match(segment))
            })
            .map(String::as_str)
            .collect::<Vec<_>>()
            .join("|");
        if value.is_empty() {
            continue;
        }
        let Some(range) = find_class_range(items, &candidate.class_name) else {
            continue;
        };
        diagnostics.push(LintDiagnosticIr {
            rule_id: "no-unapproved-raw-values".into(),
            code: "unapproved-raw-value".into(),
            message: format!(
                "Raw value {} is not approved for class {}. Use a token or allow the value explicitly.",
                quote_diagnostic_value(&value),
                quote_diagnostic_value(&candidate.class_name),
            ),
            range,
            data: serde_json::Map::from_iter([
                (
                    "className".into(),
                    serde_json::Value::String(candidate.class_name.clone()),
                ),
                ("value".into(), serde_json::Value::String(value)),
                (
                    "key".into(),
                    serde_json::Value::String(candidate.key.clone()),
                ),
                (
                    "properties".into(),
                    serde_json::json!(candidate.properties),
                ),
            ]),
            fix: None,
        });
    }
    diagnostics
}

fn create_diagnostics(
    class_names: &[String],
    items: &[ClassListItem],
    analysis: &LintBatchIr,
    sort_edit: Option<&LintEditIr>,
    conflict_edit: Option<&LintEditIr>,
    validation: &ValidationContext<'_>,
) -> Vec<LintDiagnosticIr> {
    let mut diagnostics = Vec::new();
    if let Some(fix) = sort_edit {
        let actual = class_names.join(" ");
        let expected = analysis.sorted_class_names.join(" ");
        diagnostics.push(LintDiagnosticIr {
            rule_id: "sort-classes".into(),
            code: "invalid-class-order".into(),
            message: format!(
                "Sort classes into the expected order: {}.",
                quote_diagnostic_value(&expected)
            ),
            range: fix.range.clone(),
            data: serde_json::Map::from_iter([
                ("actual".into(), serde_json::Value::String(actual)),
                ("expected".into(), serde_json::Value::String(expected)),
            ]),
            fix: Some(fix.clone()),
        });
    }
    diagnostics.extend(create_validation_diagnostics(
        class_names,
        items,
        validation.matches,
        validation.errors,
        validation.disallow_unknown_class,
    ));
    let Some(fix) = conflict_edit else {
        return diagnostics;
    };
    if !analysis.conflicts.is_empty() {
        let removed = analysis
            .conflicts
            .iter()
            .map(|conflict| conflict.class_name.clone())
            .collect::<Vec<_>>();
        let mut kept = Vec::new();
        for class_name in analysis
            .conflicts
            .iter()
            .flat_map(|conflict| &conflict.conflicts)
        {
            if !kept.contains(class_name) {
                kept.push(class_name.clone());
            }
        }
        let removed_plural = removed.len() != 1;
        let kept_plural = kept.len() != 1;
        let message = format!(
            "Remove {} {}; {} overridden by later {} {}.",
            if removed_plural { "classes" } else { "class" },
            format_class_list(&removed),
            if removed_plural { "they are" } else { "it is" },
            if kept_plural { "classes" } else { "class" },
            format_class_list(&kept),
        );
        diagnostics.push(LintDiagnosticIr {
            rule_id: "no-conflicting-classes".into(),
            code: "conflicting-class".into(),
            message: message.clone(),
            range: find_class_range(items, &removed[0]).unwrap_or_else(|| fix.range.clone()),
            data: serde_json::Map::from_iter([
                ("message".into(), serde_json::Value::String(message)),
                ("classNames".into(), serde_json::json!(removed)),
                ("conflicts".into(), serde_json::json!(kept)),
                (
                    "removed".into(),
                    serde_json::Value::String(removed.join(" ")),
                ),
                ("kept".into(), serde_json::Value::String(kept.join(" "))),
            ]),
            fix: Some(fix.clone()),
        });
        return diagnostics;
    }
    let mut range_queues = HashMap::<String, VecDeque<SourceRange>>::new();
    for item in items {
        if let ClassListItem::Class { token, range, .. } = item {
            range_queues
                .entry(token.clone())
                .or_default()
                .push_back(range.clone());
        }
    }
    for conflict in &analysis.partial_conflicts {
        let message = format!(
            "Replace {} with {}; later class {} overrides part of {}.",
            quote_diagnostic_value(&conflict.class_name),
            quote_diagnostic_value(&conflict.replacement),
            quote_diagnostic_value(&conflict.conflict),
            quote_diagnostic_value(&conflict.class_name),
        );
        diagnostics.push(LintDiagnosticIr {
            rule_id: "no-conflicting-classes".into(),
            code: "partially-conflicting-class".into(),
            message,
            range: range_queues
                .get_mut(&conflict.class_name)
                .and_then(VecDeque::pop_front)
                .unwrap_or_else(|| fix.range.clone()),
            data: serde_json::Map::from_iter([
                (
                    "actual".into(),
                    serde_json::Value::String(conflict.class_name.clone()),
                ),
                (
                    "replacement".into(),
                    serde_json::Value::String(conflict.replacement.clone()),
                ),
                (
                    "conflict".into(),
                    serde_json::Value::String(conflict.conflict.clone()),
                ),
            ]),
            fix: Some(fix.clone()),
        });
    }
    diagnostics
}

fn create_validation_diagnostics(
    class_names: &[String],
    items: &[ClassListItem],
    matches: &[bool],
    validation_errors: &[Vec<String>],
    disallow_unknown_class: bool,
) -> Vec<LintDiagnosticIr> {
    let ranges = items
        .iter()
        .filter_map(|item| match item {
            ClassListItem::Class { range, .. } => Some(range.clone()),
            ClassListItem::Space(_) => None,
        })
        .collect::<Vec<_>>();
    let fallback = SourceRange {
        start: 0,
        end: ranges.last().map_or(0, |range| range.end),
    };
    let mut diagnostics = Vec::new();
    for (index, class_name) in class_names.iter().enumerate() {
        let range = ranges
            .get(index)
            .cloned()
            .unwrap_or_else(|| fallback.clone());
        if matches.get(index).copied().unwrap_or(false) {
            for reason in validation_errors.get(index).into_iter().flatten() {
                let reason = format_reason(reason);
                let message = format!(
                    "Class {} emits invalid CSS: {reason}",
                    quote_diagnostic_value(class_name)
                );
                diagnostics.push(LintDiagnosticIr {
                    rule_id: "no-invalid-classes".into(),
                    code: "invalid-class".into(),
                    message: message.clone(),
                    range: range.clone(),
                    data: serde_json::Map::from_iter([
                        (
                            "className".into(),
                            serde_json::Value::String(class_name.clone()),
                        ),
                        ("kind".into(), serde_json::Value::String("invalid".into())),
                        ("message".into(), serde_json::Value::String(message)),
                    ]),
                    fix: None,
                });
            }
        } else if disallow_unknown_class {
            let message = format!(
                "Unknown Master CSS class {}. It is not generated by the active manifest.",
                quote_diagnostic_value(class_name)
            );
            diagnostics.push(LintDiagnosticIr {
                rule_id: "no-invalid-classes".into(),
                code: "unknown-class".into(),
                message: message.clone(),
                range,
                data: serde_json::Map::from_iter([
                    (
                        "className".into(),
                        serde_json::Value::String(class_name.clone()),
                    ),
                    ("kind".into(), serde_json::Value::String("unknown".into())),
                    ("message".into(), serde_json::Value::String(message)),
                ]),
                fix: None,
            });
        }
    }
    diagnostics
}

fn format_reason(reason: &str) -> String {
    let reason = reason.trim();
    let reason = if reason.is_empty() {
        "CSS validation failed"
    } else {
        reason
    };
    if reason.ends_with(['.', '!', '?']) {
        reason.to_owned()
    } else {
        format!("{reason}.")
    }
}

fn quote_diagnostic_value(value: &str) -> String {
    serde_json::to_string(value).unwrap_or_else(|_| "\"\"".into())
}

fn format_class_list(class_names: &[String]) -> String {
    quote_diagnostic_value(&class_names.join(" "))
}

fn parse_class_list(class_list: &str, class_names: &[String]) -> Vec<ClassListItem> {
    let mut items = Vec::new();
    let mut byte_index = 0_usize;
    let mut token_index = 0_usize;
    while byte_index < class_list.len() {
        let start = byte_index;
        let is_space = class_list[byte_index..]
            .chars()
            .next()
            .is_some_and(is_ascii_whitespace);
        while byte_index < class_list.len() {
            let character = class_list[byte_index..].chars().next().unwrap_or_default();
            if is_ascii_whitespace(character) != is_space {
                break;
            }
            byte_index += character.len_utf8();
        }
        let raw = class_list[start..byte_index].to_owned();
        if is_space {
            items.push(ClassListItem::Space(raw));
        } else {
            let token = class_names
                .get(token_index)
                .cloned()
                .unwrap_or_else(|| raw.clone());
            token_index += 1;
            items.push(ClassListItem::Class {
                range: SourceRange {
                    start: utf16_len(&class_list[..start]),
                    end: utf16_len(&class_list[..byte_index]),
                },
                raw,
                token,
            });
        }
    }
    items
}

fn is_ascii_whitespace(character: char) -> bool {
    matches!(character, '\t' | '\n' | '\u{000c}' | '\r' | ' ')
}

fn build_class_list(items: &[ClassListItem]) -> String {
    items
        .iter()
        .map(|item| match item {
            ClassListItem::Class { raw, .. } | ClassListItem::Space(raw) => raw.as_str(),
        })
        .collect()
}

fn remove_class_at(items: &mut Vec<ClassListItem>, index: usize) -> usize {
    if index > 0 && matches!(items[index - 1], ClassListItem::Space(_)) {
        items.drain(index - 1..=index);
        index - 1
    } else if index + 1 < items.len() && matches!(items[index + 1], ClassListItem::Space(_)) {
        items.drain(index..=index + 1);
        index
    } else {
        items.remove(index);
        index
    }
}

fn remove_class_token(items: &mut Vec<ClassListItem>, token: &str) -> bool {
    let Some(index) = items.iter().position(
        |item| matches!(item, ClassListItem::Class { token: value, .. } if value == token),
    ) else {
        return false;
    };
    remove_class_at(items, index);
    true
}

fn replace_class_token(items: &mut [ClassListItem], token: &str, replacement: &str) -> bool {
    for item in items {
        let ClassListItem::Class {
            raw, token: value, ..
        } = item
        else {
            continue;
        };
        if value != token {
            continue;
        }
        *raw = replacement.to_owned();
        *value = replacement.to_owned();
        return true;
    }
    false
}

fn find_class_range(items: &[ClassListItem], token: &str) -> Option<SourceRange> {
    items.iter().find_map(|item| match item {
        ClassListItem::Class {
            token: value,
            range,
            ..
        } if value == token => Some(range.clone()),
        _ => None,
    })
}

fn canonical_message(actual: &str, recommended: &str) -> String {
    format!(
        "Use canonical class \"{}\" instead of \"{}\".",
        recommended.replace('`', "\\`"),
        actual.replace('`', "\\`")
    )
}

pub(crate) fn add_canonical_class_diagnostics(
    result: &mut LintClassListIr,
    class_list: &str,
    class_names: &[String],
    groups: &[CanonicalClassGroupSuggestionIr],
    names: &[CanonicalClassSuggestionIr],
) {
    let original_items = parse_class_list(class_list, class_names);
    let mut replacement_items = parse_class_list(class_list, class_names);
    let mut diagnostics = Vec::new();
    let mut covered = std::collections::HashSet::new();
    for suggestion in groups {
        let Some(first) = suggestion.class_names.first() else {
            continue;
        };
        let actual = suggestion.class_names.join(" ");
        let range = find_class_range(&original_items, first).unwrap_or(SourceRange {
            start: 0,
            end: utf16_len(class_list),
        });
        if replace_class_token(&mut replacement_items, first, &suggestion.recommended) {
            for class_name in suggestion.class_names.iter().skip(1) {
                remove_class_token(&mut replacement_items, class_name);
            }
        }
        covered.extend(suggestion.class_names.iter().cloned());
        diagnostics.push(LintDiagnosticIr {
            rule_id: "prefer-canonical-classes".into(),
            code: "prefer-canonical-class".into(),
            message: canonical_message(&actual, &suggestion.recommended),
            range,
            data: serde_json::Map::from_iter([
                ("actual".into(), serde_json::Value::String(actual)),
                (
                    "recommended".into(),
                    serde_json::Value::String(suggestion.recommended.clone()),
                ),
            ]),
            fix: None,
        });
    }
    for suggestion in names {
        if covered.contains(&suggestion.class_name) {
            continue;
        }
        let Some(range) = find_class_range(&original_items, &suggestion.class_name) else {
            continue;
        };
        replace_class_token(
            &mut replacement_items,
            &suggestion.class_name,
            &suggestion.recommended,
        );
        diagnostics.push(LintDiagnosticIr {
            rule_id: "prefer-canonical-classes".into(),
            code: "prefer-canonical-class".into(),
            message: canonical_message(&suggestion.class_name, &suggestion.recommended),
            range,
            data: serde_json::Map::from_iter([
                (
                    "actual".into(),
                    serde_json::Value::String(suggestion.class_name.clone()),
                ),
                (
                    "recommended".into(),
                    serde_json::Value::String(suggestion.recommended.clone()),
                ),
            ]),
            fix: None,
        });
    }
    let replacement = build_class_list(&replacement_items);
    if replacement != class_list {
        let fix = LintEditIr {
            range: SourceRange {
                start: 0,
                end: utf16_len(class_list),
            },
            text: replacement,
            scope: LintEditScope::ClassList,
        };
        for diagnostic in &mut diagnostics {
            diagnostic.fix = Some(fix.clone());
        }
    }
    result.diagnostics.extend(diagnostics);
}

pub(crate) fn add_canonical_compose_diagnostics(
    result: &mut LintClassListIr,
    class_list: &str,
    class_names: &[String],
    compose: &CanonicalComposeDirectiveIr,
) {
    let items = parse_class_list(class_list, class_names);
    let fix = compose.replacement.as_ref().map(|text| LintEditIr {
        range: SourceRange {
            start: 0,
            end: utf16_len(class_list),
        },
        text: text.clone(),
        scope: LintEditScope::Directive,
    });
    for suggestion in &compose.suggestions {
        let range = suggestion
            .class_names
            .first()
            .and_then(|class_name| find_class_range(&items, class_name))
            .unwrap_or(SourceRange {
                start: 0,
                end: utf16_len(class_list),
            });
        let (code, message) = match suggestion.kind {
            CanonicalComposeSuggestionKind::Class => (
                "prefer-canonical-class",
                canonical_message(&suggestion.actual, &suggestion.recommended),
            ),
            CanonicalComposeSuggestionKind::NativeDeclaration => (
                "prefer-native-declaration",
                format!(
                    "Use CSS declaration `{}` instead of class `{}`.",
                    suggestion.recommended.replace('`', "\\`"),
                    suggestion.actual.replace('`', "\\`")
                ),
            ),
            CanonicalComposeSuggestionKind::VariantBlock => (
                "prefer-variant-block",
                format!(
                    "Move class `{}` into the canonical @compose block.",
                    suggestion.actual.replace('`', "\\`")
                ),
            ),
        };
        result.diagnostics.push(LintDiagnosticIr {
            rule_id: "prefer-canonical-classes".into(),
            code: code.into(),
            message,
            range,
            data: serde_json::Map::from_iter([
                (
                    "actual".into(),
                    serde_json::Value::String(suggestion.actual.clone()),
                ),
                (
                    "recommended".into(),
                    serde_json::Value::String(suggestion.recommended.clone()),
                ),
                (
                    "kind".into(),
                    serde_json::to_value(suggestion.kind).unwrap_or_default(),
                ),
            ]),
            fix: fix.clone(),
        });
    }
}

fn sort_class_list(items: &[ClassListItem], sorted_class_names: &[String]) -> String {
    let mut raw_queues = HashMap::<String, VecDeque<String>>::new();
    for item in items {
        let ClassListItem::Class { raw, token, .. } = item else {
            continue;
        };
        raw_queues
            .entry(token.clone())
            .or_default()
            .push_back(raw.clone());
    }
    let mut items = items.to_vec();
    let mut sorted_index = 0_usize;
    let mut index = 0_usize;
    while index < items.len() {
        if !matches!(items[index], ClassListItem::Class { .. }) {
            index += 1;
            continue;
        }
        let Some(token) = sorted_class_names.get(sorted_index) else {
            index = remove_class_at(&mut items, index);
            continue;
        };
        sorted_index += 1;
        if let ClassListItem::Class {
            raw,
            token: current,
            ..
        } = &mut items[index]
        {
            *raw = raw_queues
                .get_mut(token)
                .and_then(VecDeque::pop_front)
                .unwrap_or_else(|| token.clone());
            *current = token.clone();
        }
        index += 1;
    }
    build_class_list(&items)
}

fn remove_full_conflicts(items: &[ClassListItem], analysis: &LintBatchIr) -> String {
    let mut items = items.to_vec();
    for conflict in &analysis.conflicts {
        remove_class_token(&mut items, &conflict.class_name);
    }
    build_class_list(&items)
}

fn replace_partial_conflicts(items: &[ClassListItem], analysis: &LintBatchIr) -> String {
    let mut items = items.to_vec();
    for conflict in &analysis.partial_conflicts {
        replace_class_token(&mut items, &conflict.class_name, &conflict.replacement);
    }
    build_class_list(&items)
}

#[cfg(test)]
#[path = "class_list/tests.rs"]
mod tests;
