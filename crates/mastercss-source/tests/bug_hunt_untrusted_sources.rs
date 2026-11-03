use mastercss_source::{
    SourceExtractionInputIr, SourceExtractorKind, extract_class_candidates, extract_source_result,
};
use std::time::{Duration, Instant};

fn extract(content: String, source: &str) -> mastercss_source::SourceExtractionIr {
    extract_source_result(&SourceExtractionInputIr {
        source: source.into(),
        content,
        kind: SourceExtractorKind::Auto,
        owner: None,
    })
}

/// Each input took minutes or gigabytes when every step rescanned the whole block.
fn assert_fast(label: &str, run: impl FnOnce()) {
    let started = Instant::now();
    run();
    assert!(
        started.elapsed() < Duration::from_secs(20),
        "{label} took {:?}",
        started.elapsed()
    );
}

#[test]
fn many_distinct_candidates_are_located_in_one_pass() {
    let content = (0..100_000)
        .map(|index| format!("c{index}:hover"))
        .collect::<Vec<_>>()
        .join(" ");
    assert_fast("distinct candidates", || {
        let result = extract(content, "page.vue");
        assert_eq!(result.candidates.len(), 100_000);
        assert_eq!(result.occurrences.len(), 100_000);
    });
}

#[test]
fn overlapping_candidates_cannot_multiply_occurrences() {
    let content = (1..1_400)
        .map(|length| "a:".repeat(length))
        .collect::<Vec<_>>()
        .join(" ");
    assert_fast("overlapping candidates", || {
        let result = extract(content, "page.vue");
        assert!(result.occurrences.len() < 1 << 19);
    });
}

#[test]
fn adjacent_strings_unclosed_quotes_and_assignments_stay_linear() {
    assert_fast("adjacent strings", || {
        extract_class_candidates(&"'a:b'".repeat(100_000));
    });
    assert_fast("unclosed quotes", || {
        extract_class_candidates(&"'\\".repeat(100_000));
    });
    assert_fast("assignments", || {
        extract_class_candidates(&"a=".repeat(200_000));
    });
}
