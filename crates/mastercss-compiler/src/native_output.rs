use crate::{
    CompilerError, CssDirectiveStyleDefinition, CssOutputMapping, CssRule, ThemeAtRule,
    directives::NativeStyleSlot,
};
use mastercss_lexer::{CssSyntaxKind, tokenize_css_syntax};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

/// Serialized compiler output plan. Slot ranges address UTF-16 offsets in `css`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeCssOutput {
    pub css: String,
    #[serde(default)]
    pub mappings: Vec<CssOutputMapping>,
    pub slots: Vec<NativeCssOutputSlot>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeCssOutputSlot {
    pub start: u32,
    pub end: u32,
    pub marker: String,
    pub definitions: Vec<CssDirectiveStyleDefinition>,
}

pub(crate) fn prepare_native_output(
    source: &str,
    filename: &str,
    css: String,
    mappings: Vec<CssOutputMapping>,
    slots: &mut [NativeStyleSlot],
) -> Result<NativeCssOutput, CompilerError> {
    // Slot definitions are copied before the normal source-range refinement.
    // Refine them as one batch, retaining each slot's relative conditions.
    let mut definitions = slots
        .iter()
        .flat_map(|slot| slot.definitions.clone())
        .collect::<Vec<_>>();
    crate::output_mappings::refine_native_declaration_sources(source, &mut definitions);
    let mut definitions = definitions.into_iter();
    for slot in slots.iter_mut() {
        for definition in &mut slot.definitions {
            *definition = definitions
                .next()
                .expect("one refined definition per original");
        }
    }
    let slots_by_name = slots
        .iter()
        .map(|slot| (slot.name.as_str(), slot))
        .collect::<HashMap<_, _>>();
    let mut output_slots = Vec::new();
    let mut previous_byte = 0;
    let mut previous_offset = 0;
    for token in tokenize_css_syntax(&css) {
        let CssSyntaxKind::AtKeyword(name) = token.kind else {
            continue;
        };
        let Some(slot) = slots_by_name.get(name.as_ref()) else {
            continue;
        };
        let marker = format!("@{};", slot.name);
        let start = token.bytes.start;
        let end = start + marker.len();
        if css.get(start..end) != Some(&marker) {
            return Err(CompilerError::Print {
                message: "Native output slot was altered while printing".into(),
                filename: filename.into(),
            });
        }
        let start_offset =
            previous_offset + css[previous_byte..start].encode_utf16().count() as u32;
        let end_offset = start_offset + marker.encode_utf16().count() as u32;
        previous_byte = end;
        previous_offset = end_offset;
        output_slots.push(NativeCssOutputSlot {
            start: start_offset,
            end: end_offset,
            marker,
            definitions: slot.definitions.clone(),
        });
    }
    if output_slots.len() != slots.len() {
        return Err(CompilerError::Print {
            message: "Native output slots were lost while printing".into(),
            filename: filename.into(),
        });
    }
    let mappings = mappings
        .into_iter()
        .filter(|mapping| {
            let index = output_slots.partition_point(|slot| slot.start <= mapping.generated_start);
            index == 0 || output_slots[index - 1].end <= mapping.generated_start
        })
        .collect();
    Ok(NativeCssOutput {
        css,
        mappings,
        slots: output_slots,
    })
}

/// When native output is disabled, retain the context around composed styles but
/// discard ordinary native rules. No container is reconstructed from strings.
pub(crate) fn retain_style_slots<'i>(
    rules: Vec<CssRule<'i, ThemeAtRule>>,
    names: &HashSet<&str>,
) -> Vec<CssRule<'i, ThemeAtRule>> {
    rules
        .into_iter()
        .filter_map(|mut rule| {
            let children = match &mut rule {
                CssRule::Unknown(rule) => {
                    return names
                        .contains(rule.name.as_ref())
                        .then_some(CssRule::Unknown(rule.clone()));
                }
                CssRule::Media(rule) => &mut rule.rules.0,
                CssRule::Supports(rule) => &mut rule.rules.0,
                CssRule::Container(rule) => &mut rule.rules.0,
                CssRule::LayerBlock(rule) => &mut rule.rules.0,
                CssRule::StartingStyle(rule) => &mut rule.rules.0,
                _ => return None,
            };
            *children = retain_style_slots(std::mem::take(children), names);
            (!children.is_empty()).then_some(rule)
        })
        .collect()
}

/// Remove only compiler slots and containers emptied by that removal. Native
/// empty layers that were authored without slots retain their original identity.
pub(crate) fn strip_style_slots<'i>(
    rules: Vec<CssRule<'i, ThemeAtRule>>,
    names: &HashSet<&str>,
) -> (Vec<CssRule<'i, ThemeAtRule>>, bool) {
    let mut changed = false;
    let rules = rules
        .into_iter()
        .filter_map(|mut rule| {
            let children = match &mut rule {
                CssRule::Unknown(value) if names.contains(value.name.as_ref()) => {
                    changed = true;
                    return None;
                }
                CssRule::Media(value) => &mut value.rules.0,
                CssRule::Supports(value) => &mut value.rules.0,
                CssRule::Container(value) => &mut value.rules.0,
                CssRule::LayerBlock(value) => &mut value.rules.0,
                CssRule::StartingStyle(value) => &mut value.rules.0,
                _ => return Some(rule),
            };
            let (retained, removed) = strip_style_slots(std::mem::take(children), names);
            *children = retained;
            changed |= removed;
            (!removed || !children.is_empty()).then_some(rule)
        })
        .collect();
    (rules, changed)
}
