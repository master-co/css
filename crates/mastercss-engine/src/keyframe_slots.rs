//! Compiler-issued native resource anchors. This module owns their interpretation
//! in every host; TypeScript only installs the resulting CSS and CSSOM mutations.
use super::*;
use mastercss_lexer::{CssSyntaxKind as Kind, collect_css_syntax_statements, tokenize_css_syntax};

struct Slot {
    id: String,
    range: std::ops::Range<usize>,
    values: HashMap<String, String>,
    resources_only: bool,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyframeOutputEdit {
    pub start: u32,
    pub end: u32,
    pub text: String,
    pub mappings: Vec<mastercss_schema::CssOutputMapping>,
}

fn slots(css: &str) -> Vec<Slot> {
    if !css.contains("master-css-keyframe-") {
        return Vec::new();
    }
    let tokens = tokenize_css_syntax(css);
    let mut result = collect_css_syntax_statements(&tokens)
        .into_iter()
        .filter_map(|statement| {
            let token = &tokens[statement.tokens.start];
            let Kind::AtKeyword(name) = &token.kind else {
                return None;
            };
            let delimiter = tokens.get(statement.tokens.end)?;
            if let Some(id) = name.strip_prefix("--master-css-keyframe-") {
                return (delimiter.kind == Kind::Delim(';')).then(|| Slot {
                    id: id.into(),
                    range: token.bytes.start..delimiter.bytes.end,
                    values: HashMap::new(),
                    resources_only: false,
                });
            }
            if name != "media" || !statement.has_block {
                return None;
            }
            let id = tokens[statement.tokens.clone()].iter().find_map(|token| {
                let Kind::Ident(name) = &token.kind else {
                    return None;
                };
                name.strip_prefix("master-css-keyframe-").map(str::to_owned)
            })?;
            let resources_only = id.starts_with("resource-");
            Some(Slot {
                id: id.strip_prefix("resource-").unwrap_or(&id).to_owned(),
                resources_only,
                range: token.bytes.start..tokens[delimiter.close?].bytes.end,
                values: tokens[statement.tokens.end + 1..delimiter.close?]
                    .iter()
                    .find(|token| token.kind == Kind::Delim('{'))
                    .and_then(|open| open.close.map(|close| (open, &tokens[close])))
                    .map(|(open, close)| {
                        parse_serialized_declarations(&css[open.bytes.end..close.bytes.start])
                            .into_iter()
                            .filter_map(|declaration| {
                                declaration
                                    .value
                                    .as_str()
                                    .map(|value| (declaration.property, value.to_owned()))
                            })
                            .collect()
                    })
                    .unwrap_or_default(),
            })
        })
        .collect::<Vec<_>>();
    result.sort_by_key(|slot| slot.range.start);
    result
}

impl EngineSession {
    pub(crate) fn keyframe_template(&self, css: &str) -> String {
        let known = self
            .compiled
            .keyframes
            .iter()
            .map(|definition| definition.slot_id.as_ref().unwrap_or(&definition.id))
            .collect::<HashSet<_>>();
        let mut output = String::new();
        let mut previous = 0;
        for slot in slots(css) {
            if slot.resources_only || slot.range.start < previous || !known.contains(&slot.id) {
                continue;
            }
            output.push_str(&css[previous..slot.range.start]);
            output.push_str(&format!("@--master-css-keyframe-{};", slot.id));
            previous = slot.range.end;
        }
        output.push_str(&css[previous..]);
        output
    }
    pub(crate) fn keyframe_has_slot(&self, id: &str) -> bool {
        self.emitted_globals
            .keyframe_slots
            .iter()
            .any(|slot| slot == id)
            || self.stylesheet_keyframe_slots.contains(id)
    }

    pub(crate) fn register_keyframe_slots(&mut self, css: &str) {
        let active = slots(css)
            .into_iter()
            .filter(|slot| !slot.resources_only)
            .map(|slot| slot.id)
            .collect::<HashSet<_>>();
        for definition in &self.compiled.keyframes {
            if active.contains(definition.slot_id.as_ref().unwrap_or(&definition.id)) {
                self.stylesheet_keyframe_slots.insert(definition.id.clone());
            }
        }
    }

    /// Materialize each leaf in its original native container. The always-true
    /// media wrapper is an addressable CSSOM slot, including while it is empty.
    pub fn render_stylesheet_resources(&self, css: &str) -> String {
        let mut output = String::new();
        let mut previous = 0;
        let mut previous_units = 0;
        for edit in self.keyframe_output_edits(css) {
            let start = previous
                + mastercss_lexer::utf16_to_byte_offset(
                    &css[previous..],
                    edit.start - previous_units,
                )
                .unwrap();
            let end = start
                + mastercss_lexer::utf16_to_byte_offset(&css[start..], edit.end - edit.start)
                    .unwrap();
            previous_units = edit.end;
            output.push_str(&css[previous..start]);
            output.push_str(&edit.text);
            previous = end;
        }
        output.push_str(&css[previous..]);
        output
    }

    pub fn keyframe_output_edits(&self, css: &str) -> Vec<KeyframeOutputEdit> {
        let mut definitions = HashMap::new();
        for definition in &self.compiled.keyframes {
            definitions
                .entry(definition.slot_id.as_ref().unwrap_or(&definition.id))
                .or_insert(definition);
        }
        let mut edits = Vec::new();
        let mut previous = 0;
        let mut units = 0;
        for slot in slots(css).into_iter().filter(|slot| !slot.resources_only) {
            let Some(definition) = definitions.get(&slot.id) else {
                continue;
            };
            units += css[previous..slot.range.start].encode_utf16().count() as u32;
            let start = units;
            units += css[slot.range.clone()].encode_utf16().count() as u32;
            previous = slot.range.end;
            let mut text = format!(
                "@media only all,(master-css-keyframe-{}){{:not(*){{--master-css-slot:0",
                definition.slot_id.as_ref().unwrap_or(&definition.id)
            );
            let mut frame = String::new();
            let mut cursor = 0;
            for (index, resource) in definition.resources.iter().enumerate() {
                let value = slot
                    .values
                    .get(&format!("--master-css-keyframe-resource-{index}"))
                    .map(String::as_str)
                    .unwrap_or(&resource.value);
                text.push_str(&format!(";--master-css-keyframe-resource-{index}:{value}"));
                let start = mastercss_lexer::utf16_to_byte_offset(&definition.text, resource.start)
                    .unwrap();
                let end =
                    mastercss_lexer::utf16_to_byte_offset(&definition.text, resource.end).unwrap();
                frame.push_str(&definition.text[cursor..start]);
                frame.push_str(value);
                cursor = end;
            }
            frame.push_str(&definition.text[cursor..]);
            text.push('}');
            let mut mappings = Vec::new();
            if self
                .keyframe_counts
                .get(&definition.id)
                .copied()
                .unwrap_or_default()
                > 0
            {
                if let Some(source) = definition.source.clone() {
                    let start = text.encode_utf16().count() as u32;
                    mappings.push(mastercss_schema::CssOutputMapping {
                        generated_start: start,
                        generated_end: Some(start + frame.encode_utf16().count() as u32),
                        source,
                    });
                }
                text.push_str(&frame);
            }
            text.push('}');
            edits.push(KeyframeOutputEdit {
                start,
                end: units,
                text,
                mappings,
            });
        }
        edits
    }

    pub(crate) fn resolved_keyframe_text(
        &self,
        definition: &mastercss_schema::KeyframeDefinition,
    ) -> String {
        if definition.resources.is_empty() {
            return definition.text.clone();
        }
        let id = definition.slot_id.as_ref().unwrap_or(&definition.id);
        let values = self
            .stylesheet_sources
            .iter()
            .flat_map(|source| slots(source))
            .find(|slot| slot.resources_only && &slot.id == id)
            .map(|slot| slot.values);
        let Some(values) = values else {
            return definition.text.clone();
        };
        let mut text = String::new();
        let mut cursor = 0;
        for (index, resource) in definition.resources.iter().enumerate() {
            let start =
                mastercss_lexer::utf16_to_byte_offset(&definition.text, resource.start).unwrap();
            let end =
                mastercss_lexer::utf16_to_byte_offset(&definition.text, resource.end).unwrap();
            text.push_str(&definition.text[cursor..start]);
            text.push_str(
                values
                    .get(&format!("--master-css-keyframe-resource-{index}"))
                    .unwrap_or(&resource.value),
            );
            cursor = end;
        }
        text.push_str(&definition.text[cursor..]);
        text
    }

    pub(crate) fn standalone_keyframe_text(&self) -> String {
        let mut text = String::new();
        let mut path: Vec<mastercss_schema::KeyframeContainer> = Vec::new();
        for frame in self
            .keyframe_snapshot()
            .into_iter()
            .filter(|frame| !frame.anchored)
        {
            let common = path
                .iter()
                .zip(&frame.containers)
                .take_while(|(a, b)| a.id == b.id)
                .count();
            text.extend(std::iter::repeat_n('}', path.len() - common));
            for container in &frame.containers[common..] {
                text.push_str(&container.prelude);
                text.push('{');
            }
            text.push_str(&frame.text);
            path = frame.containers;
        }
        text.extend(std::iter::repeat_n('}', path.len()));
        text
    }
}
