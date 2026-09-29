use mastercss_source::{SourceExtractionInputIr, SourceExtractorKind, extract_source_result};

#[test]
fn preserves_occurrences_and_display_ranges_after_unicode_and_crlf() {
    let content = "中文😀\r\n\r\n`color:blue`\r\n\r\n```html\r\n<div class=\"color:blue\" />\r\n```\r\n\r\n<div className=\"color:red color:red\" />\r\n";
    let result = extract_source_result(&SourceExtractionInputIr {
        source: "guide.mdx".into(),
        content: content.into(),
        kind: SourceExtractorKind::Mdx,
        owner: Some("fixture".into()),
    });
    assert!(result.diagnostics.is_empty());
    assert_eq!(result.candidates, ["color:red"]);
    let units = content.encode_utf16().collect::<Vec<_>>();
    for token in ["color:red", "color:blue"] {
        let occurrences = result
            .occurrences
            .iter()
            .filter(|occurrence| occurrence.candidate == token)
            .collect::<Vec<_>>();
        let expected = content.match_indices(token).collect::<Vec<_>>();
        assert_eq!(occurrences.len(), expected.len());
        for (occurrence, (byte, _)) in occurrences.iter().zip(expected) {
            assert_eq!(
                occurrence.range.start as usize,
                content[..byte].encode_utf16().count()
            );
            assert_eq!(
                String::from_utf16(
                    &units[occurrence.range.start as usize..occurrence.range.end as usize]
                )
                .unwrap(),
                token
            );
            assert!(occurrence.context_range.start <= occurrence.range.start);
            assert!(occurrence.context_range.end >= occurrence.range.end);
            assert_eq!(occurrence.included, token == "color:red");
            assert_eq!(occurrence.owner, "fixture");
            assert_eq!(
                occurrence.reason,
                if occurrence.included {
                    "static-source"
                } else {
                    "markdown-display"
                }
            );
        }
    }
}

#[test]
fn retains_every_display_occurrence_in_large_documents() {
    // This used to rescan the entire document prefix four times per occurrence.
    // Keep the growing-input fixture without a hardware-dependent time assertion.
    for lines in [80, 160, 320] {
        let paragraph = "中文😀 color:blue color:blue\r\n\r\n";
        let content = paragraph.repeat(lines);
        let result = extract_source_result(&SourceExtractionInputIr {
            source: "large.mdx".into(),
            content: content.clone(),
            kind: SourceExtractorKind::Mdx,
            owner: None,
        });
        assert!(result.diagnostics.is_empty());
        assert!(result.candidates.is_empty());
        let occurrences = result
            .occurrences
            .iter()
            .filter(|item| item.candidate == "color:blue")
            .collect::<Vec<_>>();
        assert_eq!(occurrences.len(), lines * 2);
        let last = occurrences.last().unwrap();
        let byte = content.rfind("color:blue").unwrap();
        assert_eq!(
            last.range.start as usize,
            content[..byte].encode_utf16().count()
        );
    }
}
