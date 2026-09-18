use super::{
    CompilerError, CssOutputMapping, LowerCssDirectivesOptions, LowerCssDirectivesResult, Value,
    merge::create_merged_style_definitions,
    render::render_style_definitions,
    resolution::{compile_with_base, directive_error, engine_for_manifest},
};
use crate::{NativeCssOutput, utf16_to_byte_offset};

pub(super) fn assemble_native_output(
    output: &NativeCssOutput,
    options: &LowerCssDirectivesOptions,
    result: &mut LowerCssDirectivesResult,
) -> Result<(), CompilerError> {
    let manifest = compile_with_base(
        &result.input,
        options
            .resolution_manifest
            .clone()
            .or_else(|| options.base_manifest.clone()),
    )?;
    let root_size = manifest
        .get("settings")
        .and_then(|value| value.get("rootSize"))
        .and_then(Value::as_f64)
        .unwrap_or(16.0);
    let mut engine = engine_for_manifest(&manifest)?;
    let mut css = String::new();
    let mut mappings = Vec::new();
    let source_length = output.css.encode_utf16().count() as u32;
    if output.mappings.iter().any(|mapping| {
        mapping.generated_start > source_length
            || mapping
                .generated_end
                .is_some_and(|end| end < mapping.generated_start || end > source_length)
    }) {
        return Err(directive_error("Invalid native output mapping range"));
    }
    let mut native_mappings = output.mappings.clone();
    native_mappings.sort_by_key(|mapping| mapping.generated_start);
    let mut mapping_index = 0;
    let mut source_byte = 0;
    let mut source_offset = 0;
    let mut offset = 0;
    for slot in &output.slots {
        let relative_start = slot
            .start
            .checked_sub(source_offset)
            .ok_or_else(|| directive_error("Native output slots overlap"))?;
        let length = slot
            .end
            .checked_sub(slot.start)
            .ok_or_else(|| directive_error("Invalid native output slot end"))?;
        let start = source_byte
            + utf16_to_byte_offset(&output.css[source_byte..], relative_start)
                .ok_or_else(|| directive_error("Invalid native output slot start"))?;
        let end = start
            + utf16_to_byte_offset(&output.css[start..], length)
                .ok_or_else(|| directive_error("Invalid native output slot end"))?;
        if start < source_byte || start >= end || output.css.get(start..end) != Some(&slot.marker) {
            return Err(directive_error(
                "Native output slots overlap or do not match the compiled template",
            ));
        }
        append_native_mappings(
            &mut mappings,
            &native_mappings,
            &mut mapping_index,
            source_offset,
            slot.start,
            offset,
        );
        css.push_str(&output.css[source_byte..start]);
        offset += slot.start - source_offset;
        let (replacement, slot_mappings) = render_style_definitions(
            create_merged_style_definitions(&slot.definitions, &mut engine, None, root_size)?,
        );
        mappings.extend(slot_mappings.into_iter().map(|mut mapping| {
            mapping.generated_start += offset;
            mapping.generated_end = mapping.generated_end.map(|end| end + offset);
            mapping
        }));
        offset += replacement.encode_utf16().count() as u32;
        css.push_str(&replacement);
        source_byte = end;
        source_offset = slot.end;
    }
    append_native_mappings(
        &mut mappings,
        &native_mappings,
        &mut mapping_index,
        source_offset,
        source_length,
        offset,
    );
    css.push_str(&output.css[source_byte..]);
    result.css = Some(css);
    result.output_mappings = mappings;
    Ok(())
}

fn append_native_mappings(
    target: &mut Vec<CssOutputMapping>,
    mappings: &[CssOutputMapping],
    index: &mut usize,
    start: u32,
    end: u32,
    offset: u32,
) {
    while let Some(mapping) = mappings.get(*index) {
        if mapping.generated_start >= end {
            break;
        }
        *index += 1;
        if mapping.generated_start < start {
            continue;
        }
        let mut mapping = mapping.clone();
        mapping.generated_start = offset + mapping.generated_start - start;
        mapping.generated_end = mapping
            .generated_end
            .map(|value| offset + value.min(end) - start);
        target.push(mapping);
    }
}
