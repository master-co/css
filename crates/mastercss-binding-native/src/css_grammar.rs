//! CSS syntax and value-grammar checks (`mastercss-css-grammar`).

use napi_derive::napi;

#[napi(js_name = "cssGrammarVersion")]
pub fn css_grammar_version() -> String {
    mastercss_css_grammar::MDN_DATA_VERSION.to_owned()
}

#[napi(js_name = "cssSyntaxStatus")]
pub fn css_syntax_status(text: String) -> String {
    mastercss_css_grammar::syntax_status(&text)
        .as_str()
        .to_owned()
}

#[napi(js_name = "cssValueStatus")]
pub fn css_value_status(property: String, value: String, at_rule: Option<String>) -> String {
    mastercss_css_grammar::value_status(&property, &value, at_rule.as_deref())
        .as_str()
        .to_owned()
}

#[napi(js_name = "cssRuleDeclarationsJson")]
pub fn css_rule_declarations_json(text: String) -> String {
    mastercss_css_grammar::rule_declarations_json(&text)
}

#[napi(js_name = "validateCssJson")]
pub fn validate_css_json(text: String) -> String {
    mastercss_css_grammar::validate_css_json(&text)
}

#[napi(js_name = "parseCssDeclarationsJson")]
pub fn parse_css_declarations_json(text: String) -> String {
    mastercss_css_grammar::parse_declarations_json(&text)
}
