//! BH-0062: native output mapping anchors scanned the source from its start for
//! every rule, making stylesheet compilation quadratic in the rule count.
use mastercss_compiler::{CompileNativeCssOptions, compile_css_directives};
use std::time::{Duration, Instant};

#[derive(Clone, Copy)]
enum Shape {
    /// Plain rules inside `@media`; every rule keeps an anchored output mapping.
    Media,
    /// Native rules lowering `@compose`; every rule keeps selector and directive references.
    Compose,
    /// Native rules with `url()` resources; every reference keeps a UTF-16 range.
    Resources,
}

fn stylesheet(shape: Shape, rules: usize, multiline: bool) -> String {
    let prefix = match shape {
        Shape::Compose => "@master entry;",
        Shape::Media | Shape::Resources => "",
    };
    prefix.to_owned()
        + &(0..rules)
            .map(|index| match shape {
                Shape::Media => format!(
                    "@media (min-width:{index}px){{.r{index}{{content:\"ü😀\";padding:{}px}}}}",
                    index % 9
                ),
                Shape::Compose => {
                    format!(".r{index}{{@compose p:{}px;content:\"ü😀\"}}", index % 9)
                }
                Shape::Resources => {
                    format!(".r{index}{{background:url(\"./ü😀{index}.svg\");color:red}}")
                }
            })
            .collect::<Vec<_>>()
            .join(if multiline { "\n" } else { "" })
}

fn compile(shape: Shape, rules: usize, multiline: bool) -> Duration {
    let source = stylesheet(shape, rules, multiline);
    let started = Instant::now();
    let result = compile_css_directives(&source, &CompileNativeCssOptions::default()).unwrap();
    let elapsed = started.elapsed();
    match shape {
        Shape::Media => assert_eq!(result.native_mappings.len(), rules * 2, "{rules} rules"),
        Shape::Compose => assert_eq!(
            result
                .style_definitions
                .map_or(0, |definitions| definitions.len()),
            rules * 2,
            "{rules} compose rules"
        ),
        Shape::Resources => assert_eq!(result.native_mappings.len(), rules, "{rules} rules"),
    }
    elapsed
}

fn assert_linear(shape: Shape, label: &str) {
    for multiline in [false, true] {
        // Warm up allocators and caches before timing.
        compile(shape, 64, multiline);
        let small = compile(shape, 500, multiline);
        let large = compile(shape, 4000, multiline);
        let ratio = large.as_secs_f64() / small.as_secs_f64().max(0.001);
        // Eight times the rules: linear stays near 8x; the quadratic anchors were 64x
        // and took minutes here in debug builds.
        assert!(
            ratio < 40.0 && large < Duration::from_secs(10),
            "{label} multiline={multiline}: 500 rules {small:?}, 4000 rules {large:?}, ratio {ratio:.1}"
        );
    }
}

#[test]
fn native_mapping_anchors_scale_linearly_with_rule_count() {
    assert_linear(Shape::Media, "media");
}

#[test]
fn native_compose_lowering_scales_linearly_with_rule_count() {
    assert_linear(Shape::Compose, "compose");
}

#[test]
fn resource_references_scale_linearly_with_rule_count() {
    assert_linear(Shape::Resources, "resources");
}
