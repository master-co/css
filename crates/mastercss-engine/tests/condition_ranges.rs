use mastercss_engine::native_query_features;

#[test]
fn equivalent_native_ranges_share_sorting_data_without_converting_units() {
    let range = native_query_features("@media (width>=40rem) and (width<64rem)");
    assert_eq!(range, vec![("width:rem".into(), 40.0, 64.0)]);
    for query in [
        "@media (40rem<=width<64rem)",
        "@media (64rem>width>=40rem)",
        "@media (min-width:40rem) and (max-width:64rem)",
        "@container card (40rem<=width<64rem)",
    ] {
        assert_eq!(native_query_features(query), range, "{query}");
    }
    assert_ne!(
        native_query_features("@media (width>=640px)"),
        native_query_features("@media (width>=40rem)")
    );
    assert_eq!(
        native_query_features("@media (width>=64rem) and (width>=40rem)"),
        native_query_features("@media (width>=64rem)")
    );
    assert_eq!(
        native_query_features("@media (2x<=resolution)"),
        native_query_features("@media (resolution>=2x)")
    );
}

#[test]
fn expressions_and_non_ranges_keep_syntax_sorting() {
    for query in [
        "@media not (width>=40rem)",
        "@media (width>=40rem) or (width>=64rem)",
        "@media (width>=calc(40rem + 1px))",
        "@media (40rem<=width>64rem)",
        "@media (width>>40rem)",
        "@container style(--density:compact)",
    ] {
        assert!(native_query_features(query).is_empty(), "{query}");
    }
}
