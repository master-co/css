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
    #[serde(default)]
    historical_rejection: bool,
}

const MANIFEST: &str = r##"{"version":2,"languageVersion":4,"conditions":{"sm":{"id":"media","nodes":[{"type":"number","value":52.125,"unit":"rem"}]}},"variables":{"":[{"key":"min","values":[{"path":[":root,:host"],"value":"min-content"}]},{"key":"max","values":[{"path":[":root,:host"],"value":"max-content"}]}],"color":[{"key":"red-60","values":[{"path":[":root,:host"],"value":"#d00"}]}],"spacing":[{"key":"3xs","type":"number","values":[{"path":[":root,:host"],"value":".25rem"}]},{"key":"md","type":"number","values":[{"path":[":root,:host"],"value":"1rem"}]}]},"variants":[{"token":"@base","branches":[{"layer":"base"}]},{"token":"@default","branches":[{"layer":"defaults"}]},{"token":"@screen","branches":[{"conditions":["@media screen"]}]},{"token":"@scope","branches":[{"selector":".scope &"}]},{"token":"@dark","branches":[{"selector":"&:where(:root,:root *)","conditions":["@media (prefers-color-scheme:dark)"]}]}],"utilities":[{"id":"display-block","name":"block","type":-2,"emit":{"type":"static","rules":[{"declarations":{"display":"block"}}]},"matchers":[{"type":"static","name":"block"}]},{"id":"bg-origin-border","type":-2,"emit":{"type":"static","rules":[{"declarations":{"background-origin":"border-box"}}]},"matchers":[{"type":"static","name":"bg-origin-border"}],"name":"bg-origin-border"},{"id":"bg-origin-padding","type":-2,"emit":{"type":"static","rules":[{"declarations":{"background-origin":"padding"}}]},"matchers":[{"type":"static","name":"bg-origin-padding"}],"name":"bg-origin-padding"},{"id":"background-color","type":0,"variableAliasRefs":["~color"],"emit":{"type":"static","rules":[{"declarations":{"background-color":null}}]},"matchers":[{"type":"token","prefix":"bg-"}]},{"id":"width","name":"width","type":0,"emit":{"type":"property","property":"width"},"matchers":[{"type":"key","keys":["w"]}]}],"theme":[{"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"min","value":"min-content"},{"type":"declaration","name":"max","value":"max-content"},{"type":"declaration","name":"color-red-60","value":"#d00"},{"type":"declaration","name":"spacing-3xs","value":".25rem"},{"type":"declaration","name":"spacing-md","value":"1rem"}]}]}"##;

include!("tests/lifecycle.rs");
include!("tests/syntax.rs");

include!("tests/native_boundaries.rs");
