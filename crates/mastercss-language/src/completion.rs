//! Cursor-aware completion inside a `(property:value)` class head. Rust owns host
//! unescaping, CSS component boundaries and source positions; editors only map the
//! returned range and text.
use super::*;
use mastercss_lexer::NativeHeadCursor;

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeDeclarationCompletionRequestIr {
    #[serde(flatten)]
    pub document: AnalyzeDocumentRequestIr,
    /// The UTF-16 cursor offset in the document.
    pub offset: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum NativeCompletionKind {
    /// The property name; the range includes its colon when present.
    Property,
    /// A top-level value component.
    Value,
    /// A string, comment, URL or nested function or block: nothing completes.
    None,
}

/// The completion context of a cursor inside a native declaration head.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeDeclarationCompletionIr {
    pub version: u32,
    pub kind: NativeCompletionKind,
    /// The property of a value context.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub property: Option<String>,
    /// The class text of the component before the cursor.
    pub prefix: String,
    /// The document range a chosen completion replaces, including the rest of the
    /// component after the cursor.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub range: Option<SourceRange>,
    /// Text a completion must end with, such as the `)` an unclosed head lacks.
    #[serde(skip_serializing_if = "String::is_empty")]
    pub suffix: String,
}

impl LanguageSession {
    /// The context of `offset` when it sits inside a `(property:value)` head of a class,
    /// or `None` elsewhere, including after the head's closing parenthesis.
    pub fn native_declaration_completion(
        &self,
        request: &NativeDeclarationCompletionRequestIr,
    ) -> Result<Option<NativeDeclarationCompletionIr>, LanguageError> {
        let prepared = self.document_input(&request.document, 0)?;
        let offset = request.offset;
        let Some(position) = prepared
            .positions
            .iter()
            .filter(|position| position.range.start <= offset && offset <= position.range.end)
            .min_by_key(|position| position.range.end - position.range.start)
        else {
            return Ok(None);
        };
        // Token UTF-16 offsets to source offsets relative to the class.
        let offsets = if position.raw == position.token {
            (0..=utf16_len(&position.raw)).collect::<Vec<_>>()
        } else {
            let Some(context) = prepared.contexts.iter().find(|context| {
                context.start == position.context_range.start
                    && context.end == position.context_range.end
                    && !context.unescape.is_empty()
            }) else {
                // Decoded entities and expressions have no character mapping.
                return Ok(None);
            };
            positions::unescape_offsets(&position.raw, &context.unescape)
        };
        let relative = offset - position.range.start;
        let Some(cursor) = offsets.iter().rposition(|candidate| *candidate <= relative) else {
            return Ok(None);
        };
        let token = &position.token;
        let Some(cursor) = utf16_to_byte_offset(token, cursor as u32) else {
            return Ok(None);
        };
        let source = |byte: usize| -> Result<u32, LanguageError> {
            let utf16 = utf16_len(&token[..byte]) as usize;
            offsets
                .get(utf16)
                .map(|offset| position.range.start + offset)
                .ok_or(LanguageError::InvalidRange)
        };
        let range = |bytes: std::ops::Range<usize>| -> Result<SourceRange, LanguageError> {
            Ok(SourceRange {
                start: source(bytes.start)?,
                end: source(bytes.end)?,
            })
        };
        let completion = |kind, property, prefix: &str, range, suffix: &str| {
            Some(NativeDeclarationCompletionIr {
                version: LANGUAGE_BATCH_VERSION,
                kind,
                property,
                prefix: prefix.to_owned(),
                range,
                suffix: suffix.to_owned(),
            })
        };
        Ok(match mastercss_lexer::native_head_cursor(token, cursor) {
            None => None,
            Some(NativeHeadCursor::Protected) => {
                completion(NativeCompletionKind::None, None, "", None, "")
            }
            Some(NativeHeadCursor::Property { range: property }) => completion(
                NativeCompletionKind::Property,
                None,
                &token[property.start..cursor],
                Some(range(property)?),
                "",
            ),
            Some(NativeHeadCursor::Value {
                property,
                component,
                closed,
            }) => completion(
                NativeCompletionKind::Value,
                Some(token[property].to_owned()),
                &token[component.start..cursor],
                Some(range(component)?),
                if closed { "" } else { ")" },
            ),
        })
    }
}
