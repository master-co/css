use serde::Deserialize;

use super::{
    ClassSemanticInspection, ClassSemanticKind, EngineError, EngineSession,
    NativeDeclarationCandidateIr, RuleMutationIr, RuleTarget, UtilityMatcherType, css_escape,
    render_condition_token, selector_token_to_template,
};
use crate::state::compose_selector_templates;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ParserParityCorpus {
    version: u32,
    parser_cases: Vec<ParserParityCorpusCase>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ParserParityCorpusCase {
    id: String,
    source_id: String,
    kind: String,
    input: String,
    expected_canonical: String,
}

const MANIFEST: &str = r##"{
      "version":1,
      "conditions":{
        "sm":{"id":"media","nodes":[{"type":"number","value":52.125,"unit":"rem"}]}
      },
      "variables":{
        "":[
          {"key":"min","value":"min-content","inline":true},
          {"key":"max","value":"max-content","inline":true}
        ],
        "color":[{"key":"red-60","value":"#d00"}],
        "spacing":[
          {"key":"3xs","type":"number","value":".25rem"},
          {"key":"md","type":"number","value":"1rem"}
        ]
      },
      "variants":[
        {"token":"@base","branches":[{"layer":"base"}]},
        {"token":"@default","branches":[{"layer":"defaults"}]},
        {"token":"@screen","branches":[{"conditions":["@media screen"]}]},
        {"token":"@scope","branches":[{"selector":".scope &"}]}
      ],
      "utilities":[
        {
          "id":"display-block",
          "name":"block",
          "type":-2,
          "emit":{"type":"static","rules":[{"declarations":{"display":"block"}}]},
          "matchers":[{"type":"static","name":"block"}]
        },
        {
          "id":"bg-origin",
          "type":-2,
          "emit":{"type":"static","rules":[{"declarations":{"background-origin":null}}]},
          "matchers":[{
            "type":"pattern",
            "prefix":"bg-origin-",
            "values":["border"],
            "valueMap":{"border":"border-box"}
          }]
        },
        {
          "id":"background-color",
          "type":0,
          "kind":"color",
          "variableAliasRefs":["~color"],
          "emit":{"type":"static","rules":[{"declarations":{"background-color":null}}]},
          "matchers":[
            {"type":"variable","keys":["bg"]},
            {"type":"value","keys":["bg"]}
          ]
        },
        {
          "id":"width",
          "name":"width",
          "type":0,
          "emit":{"type":"property","property":"width"},
          "matchers":[{"type":"key","keys":["w"]}]
        }
      ]
    }"##;

include!("tests/lifecycle.rs");
include!("tests/syntax.rs");
