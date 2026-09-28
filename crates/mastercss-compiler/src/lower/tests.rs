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
            base_manifest: Some(json!({ "version": 2,"languageVersion":4, "utilities": [] })),
            resolution_manifest: None,
        },
    )
    .unwrap()
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
