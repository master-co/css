//! Explicit utility headers share the ordered recipe body grammar with mixins.
use mastercss_schema::{UtilityDefinition, UtilityKind};

pub(crate) fn definition(prelude: &str, body: &str) -> Result<UtilityDefinition, String> {
    if prelude.starts_with("--") {
        return Err("Utility names are class names, without a -- prefix".into());
    }
    let tokens = mastercss_lexer::tokenize_css_syntax(prelude);
    let kind = match tokens.first().map(|token| &token.kind) {
        Some(mastercss_lexer::CssSyntaxKind::Ident(_)) => UtilityKind::Static,
        Some(mastercss_lexer::CssSyntaxKind::Function(name)) if name.ends_with('-') => {
            UtilityKind::Token
        }
        Some(mastercss_lexer::CssSyntaxKind::Function(_)) => UtilityKind::Function,
        _ => return Err("Expected a utility name, token pattern or function header".into()),
    };
    let mut recipe = crate::mixins::definition(&format!("--{prelude}"), body)
        .map_err(|message| format!("Invalid utility header or body: {message}"))?;
    recipe.name = recipe.name[2..].to_owned();
    if kind == UtilityKind::Token {
        recipe.name.pop();
    }
    Ok(UtilityDefinition { kind, recipe })
}
