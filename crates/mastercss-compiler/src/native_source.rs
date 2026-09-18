use crate::source_index::SourceIndex;
use crate::{CompilerError, CssOutputMapping, directives::NativeStyleSlot};
use mastercss_lexer::{collect_css_syntax_statements, tokenize_css_syntax};
use std::collections::HashMap;

#[derive(Clone)]
pub(crate) struct PreservedSource {
    pub css: String,
    pub mappings: Vec<CssOutputMapping>,
}

/// Audit prototype: copy untouched source spans and replace only compiler-owned
/// definitions and native lowering slots. The existing Rust lexer owns spans.
pub(crate) fn preserve_native_source(
    source: &str,
    original: &str,
    rewritten: &str,
    filename: &str,
    consumed: &[usize],
    slots: &[NativeStyleSlot],
) -> Result<(PreservedSource, PreservedSource), CompilerError> {
    let error = |message: &str| CompilerError::Print {
        message: message.into(),
        filename: filename.into(),
    };
    let tokens = tokenize_css_syntax(source);
    let statements = collect_css_syntax_statements(&tokens);
    // One index per text: anchors are emitted for every token boundary.
    let source_index = SourceIndex::new(source);
    let original_index = SourceIndex::new(original);
    let rewritten_index = SourceIndex::new(rewritten);
    let mut ends = HashMap::new();
    for statement in statements {
        let Some(first) = tokens.get(statement.tokens.start) else {
            continue;
        };
        let end = if statement.has_block {
            let open = tokens
                .get(statement.tokens.end)
                .ok_or_else(|| error("Missing source block"))?;
            tokens
                .get(open.close.ok_or_else(|| error("Unclosed source block"))?)
                .ok_or_else(|| error("Missing source block end"))?
                .bytes
                .end
        } else {
            tokens
                .get(statement.tokens.end)
                .map(|token| token.bytes.end)
                .unwrap_or_else(|| tokens[statement.tokens.end - 1].bytes.end)
        };
        ends.insert(first.bytes.start, end);
    }
    let mut edits = Vec::new();
    for start in consumed {
        let end = *ends
            .get(start)
            .ok_or_else(|| error("Consumed directive has no source statement"))?;
        edits.push((*start, end, String::new()));
    }
    for slot in slots {
        let start = rewritten_index
            .byte_offset_for_location(slot.loc.line, slot.loc.column)
            .ok_or_else(|| error("Lowered slot has no source location"))?;
        let end = *ends
            .get(&start)
            .ok_or_else(|| error("Lowered slot has no source statement"))?;
        edits.push((start, end, format!("@{};", slot.name)));
    }
    edits.sort_by_key(|edit| edit.0);
    let mut cursor = 0;
    let mut ordered = PreservedSource {
        css: String::new(),
        mappings: Vec::new(),
    };
    let mut plain = ordered.clone();
    let mut anchors = tokens
        .iter()
        .flat_map(|token| [token.bytes.start, token.bytes.end])
        .collect::<Vec<_>>();
    anchors.extend(source.match_indices('\n').map(|(offset, _)| offset + 1));
    anchors.sort_unstable();
    anchors.dedup();
    let append =
        |output: &mut PreservedSource, start: usize, end: usize| -> Result<(), CompilerError> {
            let unchanged = source
                .get(start..end)
                .ok_or_else(|| error("Invalid native source range"))?;
            let generated = output.css.encode_utf16().count() as u32;
            let unchanged_units = source_index
                .utf16_offset(start)
                .ok_or_else(|| error("Invalid native source range"))?;
            for offset in std::iter::once(start).chain(
                anchors
                    .iter()
                    .copied()
                    .filter(|offset| *offset > start && *offset < end),
            ) {
                if offset == end {
                    continue;
                }
                let reference = original_index
                    .reference(filename, offset, offset)
                    .ok_or_else(|| error("Invalid preserved source anchor"))?;
                let shift = source_index
                    .utf16_offset(offset)
                    .map(|units| units - unchanged_units)
                    .ok_or_else(|| error("Invalid preserved output anchor"))?;
                output.mappings.push(CssOutputMapping {
                    generated_start: generated + shift,
                    generated_end: None,
                    source: reference,
                });
            }
            output.css.push_str(unchanged);
            Ok(())
        };
    for (start, end, replacement) in edits {
        if start < cursor || end < start {
            return Err(error("Overlapping native source edits"));
        }
        append(&mut ordered, cursor, start)?;
        append(&mut plain, cursor, start)?;
        ordered.css.push_str(&replacement);
        cursor = end;
    }
    append(&mut ordered, cursor, source.len())?;
    append(&mut plain, cursor, source.len())?;
    for output in [&mut ordered, &mut plain] {
        if output.css.trim().is_empty() {
            output.css.clear();
            output.mappings.clear();
        }
    }
    Ok((ordered, plain))
}
