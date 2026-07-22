use crate::{LintBatchIr, LintClassListIr, LintDiagnosticIr, LintEditIr};
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

pub(crate) fn create_class_list_ir(
    class_list: &str,
    class_names: &[String],
    analysis: LintBatchIr,
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
    });
    let diagnostics = create_diagnostics(
        class_names,
        &items,
        &analysis,
        sort_edit.as_ref(),
        conflict_edit.as_ref(),
    );
    LintClassListIr {
        version: LINT_BATCH_VERSION,
        analysis,
        diagnostics,
        sort_edit,
        conflict_edit,
        conflict_range,
    }
}

fn create_diagnostics(
    class_names: &[String],
    items: &[ClassListItem],
    analysis: &LintBatchIr,
    sort_edit: Option<&LintEditIr>,
    conflict_edit: Option<&LintEditIr>,
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
mod tests {
    use super::*;
    use crate::{ClassConflictIr, PartialClassConflictIr};

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
        );
        assert_eq!(ir.conflict_range, Some(SourceRange { start: 3, end: 7 }));
        assert_eq!(ir.conflict_edit.unwrap().text, "😀  m:2x");

        let mut partial = analysis();
        partial.partial_conflicts.push(PartialClassConflictIr {
            class_name: "mx:md".into(),
            replacement: "mr:md".into(),
            conflict: "ml:lg".into(),
        });
        let ir = create_class_list_ir("mx:md ml:lg", &["mx:md".into(), "ml:lg".into()], partial);
        assert_eq!(ir.conflict_edit.unwrap().text, "mr:md ml:lg");
    }
}
