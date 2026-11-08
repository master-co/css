//! `@theme { --name: initial }` removes a token instead of declaring `initial`.
//!
//! Earlier definitions of the name, including the base manifest's preset tokens, are
//! dropped together with the declaration itself, so neither the preset value nor
//! `initial` reaches `:root`. A later declaration of the same name defines it again.
use mastercss_schema::{MasterCssManifest, ThemeNode, flatten_variables, group_variables};
use std::collections::{HashMap, HashSet};

fn removes(value: &str) -> bool {
    value.trim().eq_ignore_ascii_case("initial")
}

/// The theme with its removals applied in declaration order, and the removed names.
pub(super) fn apply(theme: &[ThemeNode]) -> (Vec<ThemeNode>, HashSet<String>) {
    // The position of each name's last removal, in document order.
    let mut last_removal = HashMap::new();
    let mut position = 0;
    visit(theme, &mut |name, value| {
        if removes(value) {
            last_removal.insert(name.to_owned(), position);
        }
        position += 1;
    });
    if last_removal.is_empty() {
        return (theme.to_vec(), HashSet::new());
    }
    let mut position = 0;
    let output = rebuild(theme, &mut |name, value| {
        let keep = !removes(value) && last_removal.get(name).is_none_or(|last| position > *last);
        position += 1;
        keep
    });
    (output, last_removal.into_keys().collect())
}

fn visit(nodes: &[ThemeNode], each: &mut impl FnMut(&str, &str)) {
    for node in nodes {
        match node {
            ThemeNode::Rule { children, .. } => visit(children, each),
            ThemeNode::Declaration { name, value, .. } => each(name, value),
        }
    }
}

/// The nodes whose declarations `keep` accepts, without rules left empty.
fn rebuild(nodes: &[ThemeNode], keep: &mut impl FnMut(&str, &str) -> bool) -> Vec<ThemeNode> {
    let mut output = Vec::with_capacity(nodes.len());
    for node in nodes {
        match node {
            ThemeNode::Rule { prelude, children } => {
                let children = rebuild(children, keep);
                if !children.is_empty() {
                    output.push(ThemeNode::Rule {
                        prelude: prelude.clone(),
                        children,
                    });
                }
            }
            ThemeNode::Declaration { name, value, .. } => {
                if keep(name, value) {
                    output.push(node.clone());
                }
            }
        }
    }
    output
}

/// The base manifest without the theme declarations and variables of removed names.
pub(super) fn base_without(
    base: &MasterCssManifest,
    removed: &HashSet<String>,
) -> MasterCssManifest {
    let mut base = base.clone();
    if let Some(theme) = base.theme.take() {
        let theme = rebuild(&theme, &mut |name, _| !removed.contains(name));
        base.theme = (!theme.is_empty()).then_some(theme);
    }
    if let Some(variables) = base.variables.take() {
        let retained = flatten_variables(variables)
            .into_iter()
            .filter(|variable| {
                variable
                    .name
                    .as_ref()
                    .is_none_or(|name| !removed.contains(name))
            })
            .collect();
        base.variables = group_variables(retained);
    }
    base
}
