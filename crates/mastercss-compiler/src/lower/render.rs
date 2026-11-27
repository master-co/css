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
    // Wrappers stay open across definitions while they share an anonymous
    // layer: each authored anonymous block must print as one layer.
    let mut open = Vec::<String>::new();
    for definition in definitions {
        let conditions = definition
            .conditions
            .iter()
            .map(|condition| condition.trim())
            .filter(|condition| !condition.is_empty())
            .collect::<Vec<_>>();
        let common = open
            .iter()
            .zip(&conditions)
            .take_while(|(open, next)| open == next)
            .count();
        let shared = open[..common]
            .iter()
            .rposition(|condition| is_anonymous_layer(condition))
            .map_or(0, |index| index + 1);
        for _ in shared..open.len() {
            css.push('}');
            offset += 1;
        }
        open.truncate(shared);
        for condition in &conditions[shared..] {
            let printed = if is_anonymous_layer(condition) {
                "@layer"
            } else {
                condition
            };
            css.push_str(printed);
            css.push('{');
            offset += printed.encode_utf16().count() as u32 + 1;
            open.push((*condition).to_owned());
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
    }
    for _ in open {
        css.push('}');
    }
    (css, mappings)
}

fn is_anonymous_layer(condition: &str) -> bool {
    condition
        .strip_prefix("@layer")
        .is_some_and(|rest| rest.starts_with(crate::native_style::ANONYMOUS_LAYER_PREFIX))
}
