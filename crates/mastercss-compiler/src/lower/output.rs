use super::{CompilerError, EngineSession, api::render_definitions, resolution::directive_error};
use crate::output_edits::{OutputEdit, apply_output_edits};
use crate::{CssOutputMapping, NativeCssOutput};
use mastercss_schema::MasterCssManifest;

/// Replaces the style slots of a native output with their rendered definitions,
/// then lowers the custom media of the resolution manifest.
pub(super) fn assemble_native_output(
    output: &NativeCssOutput,
    engine: &EngineSession,
    resolution_manifest: &MasterCssManifest,
) -> Result<(String, Vec<CssOutputMapping>), CompilerError> {
    let mut edits = Vec::with_capacity(output.slots.len());
    for slot in &output.slots {
        let start = crate::utf16_to_byte_offset(&output.css, slot.start);
        let end = crate::utf16_to_byte_offset(&output.css, slot.end);
        if start
            .zip(end)
            .and_then(|(start, end)| output.css.get(start..end))
            != Some(slot.marker.as_str())
        {
            return Err(directive_error(
                "Native output slots overlap or do not match the compiled template",
            ));
        }
        let (text, mappings) = render_definitions(&slot.definitions, engine)?;
        edits.push(OutputEdit {
            start: slot.start,
            end: slot.end,
            text,
            mappings,
        });
    }
    let source_length = output.css.encode_utf16().count() as u32;
    if output.mappings.iter().any(|mapping| {
        mapping.generated_start > source_length
            || mapping
                .generated_end
                .is_some_and(|end| end < mapping.generated_start || end > source_length)
    }) {
        return Err(directive_error("Invalid native output mapping range"));
    }
    let (css, mappings) =
        apply_output_edits(&output.css, &output.mappings, edits, "stylesheet.css")?;
    let registry = crate::custom_media::registry(Some(resolution_manifest));
    crate::custom_media::lower_css(&css, &mappings, &registry, "stylesheet.css")
}
