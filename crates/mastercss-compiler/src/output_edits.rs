use crate::{CompilerError, CssOutputMapping, utf16_to_byte_offset};

/// A compiler-owned replacement in UTF-16 output coordinates. Replacement
/// mappings are relative to its text and already address authored input.
pub(crate) struct OutputEdit {
    pub start: u32,
    pub end: u32,
    pub text: String,
    pub mappings: Vec<CssOutputMapping>,
}

/// Move anchors through ordered edits without treating printed CSS as an exact
/// copy of authoring text. Original source ranges must never shift with output.
pub(crate) fn apply_output_edits(
    source: &str,
    mappings: &[CssOutputMapping],
    edits: Vec<OutputEdit>,
    filename: &str,
) -> Result<(String, Vec<CssOutputMapping>), CompilerError> {
    let error = || CompilerError::Print {
        filename: filename.into(),
        message: "Invalid compiler output edit range".into(),
    };
    let mut result = String::new();
    let mut output = Vec::new();
    let mut sorted = mappings.to_vec();
    sorted.sort_by_key(|mapping| mapping.generated_start);
    let mut index = 0;
    let mut previous_byte = 0;
    let mut previous_offset = 0;
    let mut output_offset = 0;
    for edit in edits {
        let relative = edit.start.checked_sub(previous_offset).ok_or_else(error)?;
        let length = edit.end.checked_sub(edit.start).ok_or_else(error)?;
        let start = previous_byte
            + utf16_to_byte_offset(&source[previous_byte..], relative).ok_or_else(error)?;
        let end = start + utf16_to_byte_offset(&source[start..], length).ok_or_else(error)?;
        copy_mappings(
            &sorted,
            &mut index,
            &mut output,
            previous_offset,
            edit.start,
            output_offset,
        );
        result.push_str(&source[previous_byte..start]);
        output_offset += relative;
        output.extend(edit.mappings.into_iter().map(|mut mapping| {
            mapping.generated_start += output_offset;
            mapping.generated_end = mapping.generated_end.map(|end| end + output_offset);
            mapping
        }));
        output_offset += edit.text.encode_utf16().count() as u32;
        result.push_str(&edit.text);
        previous_byte = end;
        previous_offset = edit.end;
    }
    copy_mappings(
        &sorted,
        &mut index,
        &mut output,
        previous_offset,
        source.encode_utf16().count() as u32,
        output_offset,
    );
    result.push_str(&source[previous_byte..]);
    Ok((result, output))
}

fn copy_mappings(
    mappings: &[CssOutputMapping],
    index: &mut usize,
    target: &mut Vec<CssOutputMapping>,
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
