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

const MANIFEST: &str = r##"{"version":4,"languageVersion":10,"variables":{"":[{"key":"min","values":[{"path":[":root,:host"],"value":"min-content"}]},{"key":"max","values":[{"path":[":root,:host"],"value":"max-content"}]}],"color":[{"key":"red-60","values":[{"path":[":root,:host"],"value":"#d00"}]}],"spacing":[{"key":"3xs","type":"number","values":[{"path":[":root,:host"],"value":".25rem"}]},{"key":"md","type":"number","values":[{"path":[":root,:host"],"value":"1rem"}]}]},"theme":[{"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"min","value":"min-content"},{"type":"declaration","name":"max","value":"max-content"},{"type":"declaration","name":"color-red-60","value":"#d00"},{"type":"declaration","name":"spacing-3xs","value":".25rem"},{"type":"declaration","name":"spacing-md","value":"1rem"}]}],"mixins":[{"name":"--block","body":[{"type":"declaration","property":"display","value":[{"type":"text","value":"block"}]}]},{"name":"--bg-origin-border","body":[{"type":"declaration","property":"background-origin","value":[{"type":"text","value":"border-box"}]}]},{"name":"--bg-origin-padding","body":[{"type":"declaration","property":"background-origin","value":[{"type":"text","value":"padding"}]}]},{"name":"--screen","body":[{"type":"condition","condition":"@media screen","body":[{"type":"contents","fallback":[]}]}]},{"name":"--scope","body":[{"type":"rule","selector":".scope &","body":[{"type":"contents","fallback":[]}]}]},{"name":"--dark","body":[{"type":"condition","condition":"@media (prefers-color-scheme:dark)","body":[{"type":"rule","selector":"&:where(:root,:root *)","body":[{"type":"contents","fallback":[]}]}]}]}],"customMedia":{"--sm":{"type":"feature","value":"(width>=52.125rem)"}}}"##;

include!("tests/lifecycle.rs");
include!("tests/syntax.rs");

include!("tests/native_boundaries.rs");
