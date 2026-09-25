//! BH-0062: native output mapping anchors scanned the source from its start for
//! every rule, making stylesheet compilation quadratic in the rule count.
use mastercss_compiler::{
    CompileManifestOptions, CompileNativeCssOptions, compile_css_directives,
    compile_manifest_input_with_styles,
};
use serde_json::Value;
use std::time::{Duration, Instant};

#[derive(Clone, Copy, Debug)]
enum Shape {
    /// Plain rules inside `@media`; every rule keeps an anchored output mapping.
    Media,
    /// Native rules lowering `@compose`; every rule keeps selector and directive references.
    Compose,
    /// Native rules with `url()` resources; every reference keeps a UTF-16 range.
    Resources,
    /// `@theme` variables merged into the manifest, with a base manifest holding as many.
    Theme,
    /// `@utilities` definitions merged into the manifest utilities.
    Components,
}

fn stylesheet(shape: Shape, rules: usize, multiline: bool) -> String {
    let prefix = match shape {
        Shape::Compose => "@master entry;",
        Shape::Theme => "@master entry;@theme{",
        Shape::Components => "@master entry;@utilities{",
        Shape::Media | Shape::Resources => "",
    };
    let suffix = match shape {
        Shape::Theme | Shape::Components => "}",
        _ => "",
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
                Shape::Theme => format!("--v{index}:{index}px"),
                Shape::Components => format!("c{index}{{padding:{}px;color:red}}", index % 9),
            })
            .collect::<Vec<_>>()
            .join(match (shape, multiline) {
                (Shape::Theme, true) => ";\n",
                (Shape::Theme, false) => ";",
                (_, true) => "\n",
                (_, false) => "",
            })
        + suffix
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
        Shape::Theme | Shape::Components => {
            // Merge twice: the first manifest becomes the base of the second, so
            // every definition also goes through the base-array merge.
            let started = Instant::now();
            let definitions = result.style_definitions.as_deref().unwrap_or_default();
            let first = compile_manifest_input_with_styles(
                &result.manifest_input,
                definitions,
                &CompileManifestOptions {
                    base_manifest: None,
                },
            )
            .unwrap();
            let merged = compile_manifest_input_with_styles(
                &result.manifest_input,
                definitions,
                &CompileManifestOptions {
                    base_manifest: Some(first.manifest),
                },
            )
            .unwrap();
            let theme = matches!(shape, Shape::Theme);
            let count = if theme {
                merged.manifest["variables"]
                    .as_object()
                    .map_or(0, |groups| {
                        groups
                            .values()
                            .filter_map(Value::as_array)
                            .map(Vec::len)
                            .sum()
                    })
            } else {
                merged.manifest["utilities"].as_array().map_or(0, Vec::len)
            };
            // Naming may group definitions under namespaces; every definition
            // must still survive both merges.
            assert!(count >= rules, "{rules} definitions merged into {count}");
            return elapsed + started.elapsed();
        }
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

#[test]
fn theme_variable_merges_scale_linearly_with_definition_count() {
    assert_linear(Shape::Theme, "theme");
}

#[test]
fn component_merges_scale_linearly_with_definition_count() {
    assert_linear(Shape::Components, "components");
}
