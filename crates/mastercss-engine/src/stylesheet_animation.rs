use mastercss_lexer::{CssSyntaxKind as Kind, collect_css_syntax_statements, tokenize_css_syntax};

pub(crate) struct StylesheetAnimationValue {
    pub value: String,
    pub name_only: bool,
}

pub(crate) fn stylesheet_resource_syntax(
    source: &str,
) -> (Vec<String>, Vec<StylesheetAnimationValue>, Vec<String>) {
    let tokens = tokenize_css_syntax(source);
    let statements = collect_css_syntax_statements(&tokens);
    let mut contexts: Vec<(bool, bool)> = Vec::new();
    let mut definitions = Vec::new();
    let mut declarations = Vec::new();
    for statement in statements {
        let (in_style, blocked) = statement.parent.map_or((false, false), |p| contexts[p]);
        let header = &tokens[statement.tokens.clone()];
        let first = header.first().map(|token| &token.kind);
        let mut child_context = (in_style, blocked);
        if let Some(Kind::AtKeyword(name)) = first {
            let name = name.to_ascii_lowercase();
            let keyframes = matches!(name.as_str(), "keyframes" | "-webkit-keyframes");
            if keyframes && statement.has_block && !blocked && header.len() == 2 {
                let animation = match &header[1].kind {
                    Kind::String(name) => Some(name.as_ref()),
                    Kind::Ident(name)
                        if !matches!(
                            name.to_ascii_lowercase().as_str(),
                            "none" | "initial" | "inherit" | "unset" | "revert" | "revert-layer"
                        ) =>
                    {
                        Some(name.as_ref())
                    }
                    _ => None,
                };
                if let Some(name) = animation
                    && !definitions.iter().any(|n| n == name)
                {
                    definitions.push(name.to_owned());
                }
            }
            // Descriptor blocks and keyframe steps are not style declarations
            // that start animations. Group rules inherit their enclosing mode.
            child_context.1 |= !matches!(
                name.as_str(),
                "media"
                    | "supports"
                    | "layer"
                    | "container"
                    | "scope"
                    | "starting-style"
                    | "document"
                    | "-moz-document"
            );
        } else if statement.has_block {
            child_context.0 = true;
        } else if statement.declaration
            && in_style
            && !blocked
            && header.len() > 2
            && let Some(Kind::Ident(property)) = first
        {
            let property = property.to_ascii_lowercase();
            if matches!(
                property.as_str(),
                "animation" | "animation-name" | "-webkit-animation" | "-webkit-animation-name"
            ) {
                declarations.push(StylesheetAnimationValue {
                    value: source[header[2].bytes.start..header.last().unwrap().bytes.end]
                        .to_owned(),
                    name_only: property.ends_with("-name"),
                });
            }
        }
        contexts.push(child_context);
    }
    let variables = super::stylesheet_resources::collect_stylesheet_variable_names(&tokens);
    (definitions, declarations, variables)
}
