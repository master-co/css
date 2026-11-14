use super::ast::{Combinator, MultiplierInfo, SyntaxNode, TypeRange};

#[must_use]
pub fn generate(node: &SyntaxNode) -> String {
    generate_node(node)
}

fn generate_multiplier(info: &MultiplierInfo) -> String {
    let MultiplierInfo { min, max, comma } = *info;

    if min == 0 && max == 0 {
        return if comma {
            "#?".to_owned()
        } else {
            "*".to_owned()
        };
    }

    if min == 0 && max == 1 {
        return "?".to_owned();
    }

    if min == 1 && max == 0 {
        return if comma {
            "#".to_owned()
        } else {
            "+".to_owned()
        };
    }

    if min == 1 && max == 1 {
        return String::new();
    }

    let prefix = if comma { "#" } else { "" };
    if min == max {
        format!("{prefix}{{{min}}}")
    } else if max == 0 {
        format!("{prefix}{{{min},}}")
    } else {
        format!("{prefix}{{{min},{max}}}")
    }
}

fn generate_type_range(range: &TypeRange) -> String {
    let min_str = range.min.as_deref().unwrap_or("-\u{221E}");
    let max_str = range.max.as_deref().unwrap_or("\u{221E}");
    format!(" [{min_str},{max_str}]")
}

fn generate_sequence(terms: &[SyntaxNode], combinator: &Combinator, explicit: bool) -> String {
    let sep = match combinator {
        Combinator::Juxtaposition => " ",
        Combinator::DoubleAmpersand => " && ",
        Combinator::DoubleBar => " || ",
        Combinator::Bar => " | ",
    };

    let result: String = terms
        .iter()
        .map(generate_node)
        .collect::<Vec<_>>()
        .join(sep);

    if explicit {
        let open = if result.starts_with(',') { "[" } else { "[ " };
        format!("{open}{result} ]")
    } else {
        result
    }
}

fn generate_node(node: &SyntaxNode) -> String {
    match node {
        SyntaxNode::Group {
            terms,
            combinator,
            disallow_empty,
            explicit,
        } => {
            let mut result = generate_sequence(terms, combinator, *explicit);
            if *disallow_empty {
                result.push('!');
            }
            result
        }

        SyntaxNode::Multiplier { term, info } => {
            format!("{}{}", generate_node(term), generate_multiplier(info))
        }

        SyntaxNode::Boolean { term } => {
            format!("<boolean-expr[{}]>", generate_node(term))
        }

        SyntaxNode::Type { name, opts } => {
            let opts_str = opts.as_ref().map_or_else(String::new, generate_type_range);
            format!("<{name}{opts_str}>")
        }

        SyntaxNode::Property { name } => {
            format!("<'{name}'>")
        }

        SyntaxNode::Keyword { name } => name.clone(),

        SyntaxNode::AtKeyword { name } => {
            format!("@{name}")
        }

        SyntaxNode::Function { name } => {
            format!("{name}(")
        }

        SyntaxNode::StringNode { value } | SyntaxNode::Token { value } => value.clone(),

        SyntaxNode::Comma => ",".to_owned(),
    }
}
