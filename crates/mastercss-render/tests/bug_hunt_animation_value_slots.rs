use mastercss_render::RenderSession;

fn generated_names(value: &str) -> Vec<String> {
    let names = ["fade", "linear", "infinite", "backwards"];
    let manifest = serde_json::json!({
        "version": 1,"languageVersion":2,
        "utilities": [],
        "variables": {"animation": [{"key": "easing", "value": "linear"}]},
        "animations": names.into_iter().map(|name| {
            (name.to_owned(), serde_json::json!({"to": {"opacity": "1"}}))
        }).collect::<serde_json::Map<String, serde_json::Value>>()
    });
    let mut session = RenderSession::create(&manifest.to_string(), None).unwrap();
    session
        .ensure_stylesheet_resources(&format!(".x{{animation:{value}}}"))
        .unwrap();
    let output = session.snapshot().unwrap().snapshot.text;
    names
        .into_iter()
        .filter(|name| output.contains(&format!("@keyframes {name}")))
        .map(str::to_owned)
        .collect()
}

macro_rules! animation_value_case {
    ($name:ident, $value:expr, $expected:expr) => {
        #[test]
        fn $name() {
            let expected: Vec<String> = if $expected == "none" {
                Vec::new()
            } else {
                vec![$expected.to_owned()]
            };
            assert_eq!(generated_names($value), expected, "{}", $value);
        }
    };
}

animation_value_case!(timing_keyword, "linear 1s", "none");
animation_value_case!(repeated_timing, "linear linear 1s", "linear");
animation_value_case!(numeric_iteration_before_name, "1 infinite 1s", "infinite");
animation_value_case!(decimal_iteration_before_name, ".5 infinite 1s", "infinite");
animation_value_case!(fill_none_before_name, "none backwards 1s", "backwards");
animation_value_case!(
    compiled_variable_timing,
    "var(--animation-easing) linear 1s",
    "linear"
);
animation_value_case!(fallback_timing, "var(--missing,linear) linear 1s", "linear");
animation_value_case!(invalid_multiple_names, "fade unexpected 1s", "none");
animation_value_case!(quoted_keyword_name, "\"linear\" 1s", "linear");

animation_value_case!(signed_decimal_iteration, "+.5 infinite 1e2ms", "infinite");
animation_value_case!(exponent_iteration, "1e2 infinite 1s", "infinite");
animation_value_case!(negative_iteration, "-1 infinite 1s", "none");
animation_value_case!(negative_time_is_delay, "fade -1s", "fade");
animation_value_case!(negative_delay, "fade 1s -1s", "fade");
animation_value_case!(too_many_times, "fade 1s 2s 3s", "none");
animation_value_case!(duplicate_numbers, "fade 1 2 1s", "none");
animation_value_case!(invalid_dimension, "fade 1px", "none");
animation_value_case!(trailing_comma, "fade 1s,", "none");
animation_value_case!(css_wide_mixed, "initial fade 1s", "none");
animation_value_case!(css_wide_alone, "initial", "none");
animation_value_case!(escaped_time_unit, "fade 1\\73", "fade");
animation_value_case!(comment_separates_number_unit, "fade 1/**/s", "none");
animation_value_case!(fill_and_none_name, "backwards none 1s", "none");
animation_value_case!(too_many_none_slots, "none none backwards 1s", "none");
animation_value_case!(math_duration, "fade calc(1s + 1s)", "fade");
animation_value_case!(math_iteration, "calc(1 + 1) infinite 1s", "infinite");
animation_value_case!(math_time_and_iteration, "calc(1s + 1s) infinite 1s", "none");
animation_value_case!(auto_duration, "auto fade", "fade");
animation_value_case!(
    sign_returns_iteration_number,
    "sign(1s) infinite 1s",
    "infinite"
);
