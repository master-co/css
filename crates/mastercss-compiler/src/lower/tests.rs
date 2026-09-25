use super::{
    CssDirectiveManifestInput, CssDirectiveStyleDefinition, LowerCssDirectivesOptions,
    LowerCssDirectivesResult, Value, lower_css_directives,
};
use serde_json::json;

fn lower_for_test(
    manifest_input: CssDirectiveManifestInput,
    definitions: Value,
) -> LowerCssDirectivesResult {
    let definitions: Vec<CssDirectiveStyleDefinition> =
        serde_json::from_value(definitions).unwrap();
    lower_css_directives(
        &manifest_input,
        &definitions,
        &[],
        &LowerCssDirectivesOptions {
            base_manifest: Some(json!({ "version": 1,"languageVersion":2, "utilities": [] })),
            resolution_manifest: None,
        },
    )
    .unwrap()
}

#[test]
fn preserves_native_values_in_compose_for_tooling_validation() {
    let definition: CssDirectiveStyleDefinition = serde_json::from_value(json!({
        "type": "compose",
        "order": 1,
        "className": "background:neutral-120",
        "selector": ".card"
    }))
    .unwrap();
    let result = lower_css_directives(
        &CssDirectiveManifestInput::default(),
        &[definition],
        &[],
        &LowerCssDirectivesOptions {
            base_manifest: Some(json!({ "version": 1,"languageVersion":2, "utilities": [] })),
            resolution_manifest: None,
        },
    )
    .unwrap();
    assert_eq!(result.generated_css, ".card{background:neutral-120}");
}

#[test]
fn accepts_valid_unparsed_native_declarations_in_compose() {
    let definitions: Vec<CssDirectiveStyleDefinition> = serde_json::from_value(json!([
        {
            "type": "compose",
            "order": 1,
            "className": "contain:content",
            "selector": ".card"
        },
        {
            "type": "compose",
            "order": 2,
            "className": "content:'stripe'",
            "selector": ".card"
        },
        {
            "type": "compose",
            "order": 3,
            "className": "fg:inherit!",
            "selector": ".card"
        },
        {
            "type": "compose",
            "order": 4,
            "className": "content:none",
            "selector": ".card::before"
        },
        {
            "type": "compose",
            "order": 5,
            "className": "text-underline-offset:2px",
            "selector": ".card"
        },
        {
            "type": "compose",
            "order": 6,
            "className": "outline-offset:0",
            "selector": ".card"
        }
    ]))
    .unwrap();
    let result = lower_css_directives(
        &CssDirectiveManifestInput::default(),
        &definitions,
        &[],
        &LowerCssDirectivesOptions {
            base_manifest: Some(json!({ "version": 1,"languageVersion":2, "utilities": [] })),
            resolution_manifest: None,
        },
    )
    .unwrap();
    assert!(result.generated_css.contains("contain:content"));
    assert!(result.generated_css.contains("content:'stripe'"));
    assert!(result.generated_css.contains("color:inherit!important"));
    assert!(result.generated_css.contains("content:none"));
    assert!(result.generated_css.contains("text-underline-offset:2px"));
    assert!(result.generated_css.contains("outline-offset:0"));
}

#[test]
fn preserves_authored_order_for_native_conditions() {
    let result = lower_for_test(
        CssDirectiveManifestInput::default(),
        json!([
            {
                "type": "native",
                "order": 1,
                "selector": ".prose :is(h1,h2,h3,h4,h5,h6)",
                "declarations": [{"property":"margin-top","value":"var(--spacing-2xl)"},{"property":"scroll-margin-top","value":"100px"}],
                "conditions": ["@media (width>=52.125rem)"]
            },
            {
                "type": "native",
                "order": 2,
                "selector": ".prose :is(h1,h2,h3,h4,h5,h6)",
                "declarations": [{"property":"margin-top","value":"var(--spacing-lg)"},{"property":"scroll-margin-top","value":"60px"}]
            }
        ]),
    );
    assert_eq!(
        result.generated_css,
        "@media (width>=52.125rem){.prose :is(h1,h2,h3,h4,h5,h6){margin-top:var(--spacing-2xl);scroll-margin-top:100px}}.prose :is(h1,h2,h3,h4,h5,h6){margin-top:var(--spacing-lg);scroll-margin-top:60px}"
    );
}

#[test]
fn preserves_statement_order_for_compose_conditions() {
    let result = lower_for_test(
        CssDirectiveManifestInput::default(),
        json!([
            {
                "type": "compose",
                "order": 1,
                "className": "display:grid",
                "selector": ".card",
                "conditions": ["@media (width>=48rem)"]
            },
            {
                "type": "compose",
                "order": 2,
                "className": "display:block",
                "selector": ".card"
            }
        ]),
    );
    assert_eq!(
        result.generated_css,
        "@media (width>=48rem){.card{display:grid}}.card{display:block}"
    );
}

#[test]
fn preserves_source_order_across_distinct_units() {
    let result = lower_for_test(
        CssDirectiveManifestInput::default(),
        json!([
            {
                "type": "native",
                "order": 1,
                "selector": ".card",
                "declarations": [{ "property": "color", "value": "red" }],
                "conditions": ["@media (width>=42rem)"]
            },
            {
                "type": "native",
                "order": 2,
                "selector": ".card",
                "declarations": [{ "property": "color", "value": "blue" }],
                "conditions": ["@media (width>=800px)"]
            }
        ]),
    );
    assert_eq!(
        result.generated_css,
        "@media (width>=42rem){.card{color:red}}@media (width>=800px){.card{color:blue}}"
    );
}

#[test]
fn keeps_source_order_for_non_numeric_conditions_and_distinct_targets() {
    let result = lower_for_test(
        CssDirectiveManifestInput::default(),
        json!([
            {
                "type": "native",
                "order": 1,
                "selector": ".same",
                "declarations": [{ "property": "opacity", "value": "0" }],
                "conditions": ["@starting-style"]
            },
            {
                "type": "native",
                "order": 2,
                "selector": ".same",
                "declarations": [{ "property": "opacity", "value": "1" }],
                "conditions": ["@container card (inline-size>30rem)"]
            },
            {
                "type": "native",
                "order": 3,
                "selector": ".other",
                "declarations": [{ "property": "color", "value": "red" }],
                "conditions": ["@media (prefers-color-scheme:dark)"]
            },
            {
                "type": "native",
                "order": 4,
                "selector": ".base-layer",
                "layer": "base",
                "declarations": [{ "property": "display", "value": "grid" }],
                "conditions": ["@media (width>=40rem)"]
            },
            {
                "type": "native",
                "order": 5,
                "selector": ".base-layer",
                "layer": "components",
                "declarations": [{ "property": "display", "value": "block" }]
            }
        ]),
    );
    assert_eq!(
        result.generated_css,
        "@starting-style{.same{opacity:0}}@container card (inline-size>30rem){.same{opacity:1}}@media (prefers-color-scheme:dark){.other{color:red}}@media (width>=40rem){.base-layer{display:grid}}.base-layer{display:block}"
    );
}

#[test]
fn preserves_utility_body_order_without_moving_layers() {
    let result = lower_for_test(
        CssDirectiveManifestInput::default(),
        json!([
            {
                "type": "native",
                "order": 1,
                "name": "prose",
                "layer": "defaults",
                "selector": "& :is(h1,h2)",
                "declarations": [{ "property": "margin-top", "value": "2rem" }],
                "conditions": ["@media (width>=52rem)"]
            },
            {
                "type": "native",
                "order": 2,
                "name": "prose",
                "layer": "defaults",
                "selector": "& :is(h1,h2)",
                "declarations": [{ "property": "margin-top", "value": "1rem" }]
            }
        ]),
    );
    let utility = &result.input.utilities.unwrap()[0];
    assert_eq!(
        utility,
        &json!({
            "name":"prose", "type":"static", "layer":"defaults",
            "rules":[
                {"declarations":{"margin-top":"2rem"},"selector":"& :is(h1,h2)","conditions":["@media (width>=52rem)"]},
                {"declarations":{"margin-top":"1rem"},"selector":"& :is(h1,h2)"}
            ]
        })
    );
}
