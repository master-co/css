//! Read-only overlap diagnostics. Never decompose or rewrite authored classes.
use super::{ClassDescriptor, PartialClassConflictIr, equal_rule_scope};
use std::collections::BTreeSet;

fn affected_properties(property: &str) -> BTreeSet<String> {
    let sides = ["top", "right", "bottom", "left"];
    match property {
        "margin" | "padding" | "scroll-margin" | "scroll-padding" => sides
            .iter()
            .map(|side| format!("{property}-{side}"))
            .collect(),
        "inset" => sides.iter().map(|side| (*side).into()).collect(),
        "border-radius" => ["top-left", "top-right", "bottom-right", "bottom-left"]
            .iter()
            .map(|corner| format!("border-{corner}-radius"))
            .collect(),
        "border-color" | "border-style" | "border-width" => {
            let kind = property.strip_prefix("border-").unwrap();
            sides
                .iter()
                .map(|side| format!("border-{side}-{kind}"))
                .collect()
        }
        _ => {
            for family in [
                "margin",
                "padding",
                "inset",
                "scroll-margin",
                "scroll-padding",
            ] {
                for axis in ["inline", "block"] {
                    if property == format!("{family}-{axis}") {
                        return ["start", "end"]
                            .iter()
                            .map(|end| format!("{property}-{end}"))
                            .collect();
                    }
                }
            }
            [property.into()].into()
        }
    }
}

pub(crate) fn find_partial_conflicts(
    descriptors: &[ClassDescriptor],
) -> Vec<PartialClassConflictIr> {
    let mut entries = descriptors
        .iter()
        .filter_map(|entry| {
            let rule = entry.rule.as_ref()?;
            if !entry.valid_for_conflicts || entry.declarations.len() != 1 || !rule.nodes.is_empty()
            {
                return None;
            }
            Some((entry, rule, affected_properties(&entry.declarations[0].0)))
        })
        .collect::<Vec<_>>();
    entries.sort_by(|(_, left, _), (_, right, _)| {
        mastercss_engine::compare_rule_priority(left, right)
    });
    let mut conflicts = Vec::new();
    for (index, (entry, rule, properties)) in entries.iter().enumerate() {
        // Different logical/physical coordinate systems are deliberately not equated:
        // their overlap depends on the element's writing mode and direction.
        if let Some((winner, _, _)) =
            entries[index + 1..]
                .iter()
                .rev()
                .find(|(_, other, affected)| {
                    equal_rule_scope(rule, other)
                        && properties != affected
                        && !properties.is_disjoint(affected)
                })
        {
            conflicts.push(PartialClassConflictIr {
                class_name: entry.class_name.clone(),
                conflict: winner.class_name.clone(),
            });
        }
    }
    conflicts
}
