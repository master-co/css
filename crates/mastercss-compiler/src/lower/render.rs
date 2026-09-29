use super::{CssDirectiveSourceReference, CssOutputMapping, MergedStyleDefinition};

pub(super) fn render_style_definitions(
    definitions: Vec<MergedStyleDefinition>,
) -> (String, Vec<CssOutputMapping>) {
    fn anchor(
        mappings: &mut Vec<CssOutputMapping>,
        start: u32,
        end: u32,
        source: Option<&CssDirectiveSourceReference>,
    ) {
        if let Some(source) = source {
            mappings.push(CssOutputMapping {
                generated_start: start,
                generated_end: Some(end),
                source: source.clone(),
            });
        }
    }
    let mut css = String::new();
    let mut offset = 0u32;
    let mut mappings = Vec::new();
    for definition in definitions {
        let conditions = definition
            .conditions
            .iter()
            .map(|condition| condition.trim())
            .filter(|condition| !condition.is_empty())
            .collect::<Vec<_>>();
        for condition in &conditions {
            css.push_str(condition);
            css.push('{');
            offset += condition.encode_utf16().count() as u32 + 1;
        }
        let selector_end = offset + definition.selector.encode_utf16().count() as u32;
        anchor(
            &mut mappings,
            offset,
            selector_end,
            definition.selector_source.as_ref(),
        );
        css.push_str(&definition.selector);
        css.push('{');
        offset = selector_end + 1;
        for (index, declaration) in definition.declarations.into_iter().enumerate() {
            let property = declaration.property;
            let value = declaration.value;
            if index > 0 {
                css.push(';');
                offset += 1;
            }
            let text = format!("{property}:{}", value.as_str().unwrap_or_default());
            let end = offset + text.encode_utf16().count() as u32;
            anchor(&mut mappings, offset, end, declaration.source.as_ref());
            css.push_str(&text);
            offset = end;
        }
        css.push('}');
        offset += 1;
        for _ in conditions {
            css.push('}');
            offset += 1;
        }
    }
    (css, mappings)
}
