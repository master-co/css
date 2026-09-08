use mastercss_source::{SourceBatchRequestIr, decode_html_attribute, extract_source_batch};

#[test]
fn maps_entities_as_indivisible_utf16_spans() {
    let decoded = decode_html_attribute("é&amp;😀\r\n&#13;\0&NotEqualTilde;");
    assert_eq!(decoded.value, "é&😀\n\r\u{fffd}≂\u{338}");
    let spans = decoded
        .spans
        .iter()
        .map(|span| {
            (
                span.range.start,
                span.range.end,
                span.source_range.start,
                span.source_range.end,
            )
        })
        .collect::<Vec<_>>();
    assert_eq!(
        spans,
        vec![
            (0, 1, 0, 1),
            (1, 2, 1, 6),
            (2, 4, 6, 8),
            (4, 5, 8, 10),
            (5, 6, 10, 15),
            (6, 7, 15, 16),
            (7, 9, 16, 31)
        ]
    );
}

#[test]
fn preserves_attribute_ambiguous_ampersands_and_decodes_numeric_boundaries() {
    for (raw, expected) in [
        ("&amp= &ampx &amp;", "&amp= &ampx &"),
        ("&#x1f600;", "😀"),
        ("&#0;", "\u{fffd}"),
        ("&#xD800;", "\u{fffd}"),
        ("&#x110000;", "\u{fffd}"),
        ("&#128;", "€"),
        ("&amp;lt;", "&lt;"),
        ("\r\n\r&#10;&#13;", "\n\n\n\r"),
        ("", ""),
    ] {
        let decoded = decode_html_attribute(raw);
        assert_eq!(decoded.value, expected, "{raw:?}");
        let mut previous = (0, 0);
        for span in decoded.spans {
            assert_eq!((span.range.start, span.source_range.start), previous);
            previous = (span.range.end, span.source_range.end);
        }
        assert_eq!(
            previous,
            (
                expected.encode_utf16().count() as u32,
                raw.encode_utf16().count() as u32
            )
        );
    }
}

#[test]
fn source_batch_returns_requested_attribute_maps_without_source_files() {
    let result = extract_source_batch(&SourceBatchRequestIr {
        files: Vec::new(),
        html_attributes: vec!["&#32;".into(), "&quot;".into()],
    });
    assert!(result.files.is_empty());
    assert_eq!(result.html_attributes[0].value, " ");
    assert_eq!(result.html_attributes[1].value, "\"");
    assert!(
        extract_source_batch(&SourceBatchRequestIr::default())
            .html_attributes
            .is_empty()
    );
}
