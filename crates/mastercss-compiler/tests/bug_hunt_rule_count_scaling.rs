//! BH-0062: native output mapping anchors scanned the source from its start for
//! every rule, making stylesheet compilation quadratic in the rule count.
use mastercss_compiler::{CompileNativeCssOptions, compile_css_directives};
use std::time::{Duration, Instant};

fn stylesheet(rules: usize, multiline: bool) -> String {
    (0..rules)
        .map(|index| {
            format!(
                "@media (min-width:{index}px){{.r{index}{{content:\"ü😀\";padding:{}px}}}}",
                index % 9
            )
        })
        .collect::<Vec<_>>()
        .join(if multiline { "\n" } else { "" })
}

fn compile(rules: usize, multiline: bool) -> Duration {
    let source = stylesheet(rules, multiline);
    let started = Instant::now();
    let result = compile_css_directives(&source, &CompileNativeCssOptions::default()).unwrap();
    let elapsed = started.elapsed();
    // Every media rule and its style rule keep an anchored mapping.
    assert_eq!(result.native_mappings.len(), rules * 2, "{rules} rules");
    elapsed
}

#[test]
fn native_mapping_anchors_scale_linearly_with_rule_count() {
    for multiline in [false, true] {
        // Warm up allocators and caches before timing.
        compile(64, multiline);
        let small = compile(500, multiline);
        let large = compile(4000, multiline);
        let ratio = large.as_secs_f64() / small.as_secs_f64().max(0.001);
        // Eight times the rules: linear stays near 8x; the quadratic anchors were 64x
        // and took minutes here in debug builds.
        assert!(
            ratio < 40.0 && large < Duration::from_secs(10),
            "multiline={multiline}: 500 rules {small:?}, 4000 rules {large:?}, ratio {ratio:.1}"
        );
    }
}
