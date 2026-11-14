//! Static checks of CSS math functions: operator structure and arity, and the
//! result types the lexer cannot infer. Values, ranges and substitutions are
//! never evaluated.

use std::collections::BTreeMap;

use crate::check::match_type;
use crate::parser::Node;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MathStatus {
    Valid,
    Invalid,
    Unknown,
}

pub const MATH_FUNCTIONS: [&str; 21] = [
    "calc", "min", "max", "clamp", "mod", "rem", "sin", "cos", "tan", "asin", "acos", "atan",
    "atan2", "pow", "sqrt", "hypot", "exp", "abs", "sign", "log", "round",
];

pub fn is_math_function(name: &str) -> bool {
    MATH_FUNCTIONS.contains(&name.to_lowercase().as_str())
}

fn one() -> Node {
    Node::Number("1".into())
}

fn is_comma(node: &Node) -> bool {
    matches!(node, Node::Operator(value) if value.trim() == ",")
}

fn split_arguments(children: &[Node]) -> Vec<Vec<Node>> {
    let mut arguments = vec![Vec::new()];
    for child in children {
        if is_comma(child) {
            arguments.push(Vec::new());
        } else {
            arguments
                .last_mut()
                .expect("an argument")
                .push(child.clone());
        }
    }
    arguments
}

fn contains_function(nodes: &[Node]) -> bool {
    nodes.iter().any(|node| match node {
        Node::Function { .. } => true,
        Node::Parentheses(children) | Node::Brackets(children) | Node::Value(children) => {
            contains_function(children)
        }
        _ => false,
    })
}

/// Replaces nested functions (reporting non-math ones) and dimensions with `1`.
fn normalize(children: &mut [Node], uncertain: &mut bool) {
    for child in children {
        match child {
            Node::Function { name, .. } => {
                if !is_math_function(name) {
                    *uncertain = true;
                }
                *child = one();
            }
            Node::Dimension { .. } | Node::Percentage(_) => *child = one(),
            Node::Parentheses(nested) | Node::Brackets(nested) | Node::Value(nested) => {
                normalize(nested, uncertain)
            }
            _ => {}
        }
    }
}

/// Checks operator structure and arity without inferring the result's
/// dimension. CSS Values 4 allows dimensional division, so operands are
/// normalized for grammar-only checks.
pub fn math_function_status(name: &str, children: &[Node]) -> Option<MathStatus> {
    let lower = name.to_lowercase();
    if !is_math_function(&lower) {
        return None;
    }
    let mut normalized = children.to_vec();
    let mut uncertain = false;
    normalize(&mut normalized, &mut uncertain);
    // A substitution may contain commas or operators; do not validate its assumed
    // expansion. Still check independent arguments and a definitely missing RHS.
    if uncertain {
        for argument in split_arguments(children) {
            if matches!(argument.last(), Some(Node::Operator(value)) if ["+", "-", "*", "/"].contains(&value.trim()))
            {
                return Some(MathStatus::Invalid);
            }
            if !contains_function(&argument)
                && math_function_status("calc", &argument) == Some(MathStatus::Invalid)
            {
                return Some(MathStatus::Invalid);
            }
        }
        return Some(MathStatus::Unknown);
    }
    if lower == "log" || lower == "round" {
        // The bundled grammar still requires commas for omitted optional
        // arguments. Validate the current arity and reuse its calc-sum grammar.
        let mut parts = split_arguments(&normalized);
        if lower == "round"
            && matches!(parts.first().map(Vec::as_slice), Some([Node::Identifier(keyword)]) if ["nearest", "up", "down", "to-zero"].contains(&keyword.as_str()))
        {
            parts.remove(0);
        }
        if parts.is_empty() || parts.len() > 2 {
            return Some(MathStatus::Invalid);
        }
        let invalid = parts
            .into_iter()
            .any(|children| !match_type("calc-sum", &Node::Value(children)));
        return Some(if invalid {
            MathStatus::Invalid
        } else {
            MathStatus::Valid
        });
    }
    let function = Node::Function {
        name: name.to_owned(),
        children: normalized,
    };
    Some(if match_type(&format!("{lower}()"), &function) {
        MathStatus::Valid
    } else {
        MathStatus::Invalid
    })
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Dimension {
    Length,
    Angle,
    Time,
    Frequency,
    Resolution,
    Flex,
    Percentage,
}

const DIMENSIONS: [Dimension; 6] = [
    Dimension::Length,
    Dimension::Angle,
    Dimension::Time,
    Dimension::Frequency,
    Dimension::Resolution,
    Dimension::Flex,
];

fn unit_dimension(unit: &str) -> Option<Dimension> {
    let unit = unit.to_ascii_lowercase();
    let units = crate::grammar::UNITS;
    let index = units
        .iter()
        .position(|units| units.contains(&unit.as_str()))?;
    DIMENSIONS.get(index).copied()
}

fn example_unit(dimension: Dimension) -> &'static str {
    match dimension {
        Dimension::Length => "px",
        Dimension::Angle => "deg",
        Dimension::Time => "s",
        Dimension::Frequency => "hz",
        Dimension::Resolution => "dppx",
        Dimension::Flex => "fr",
        Dimension::Percentage => "%",
    }
}

type Powers = BTreeMap<Dimension, i32>;

#[derive(Debug, Clone, PartialEq, Eq)]
enum Inferred {
    Known(Powers),
    Invalid,
    Unknown,
}

/// The percentage basis a context gives: `Some(None)` is a context without one
/// (`null`), `None` an undetermined one (`undefined`).
type Hint = Option<Option<Dimension>>;

fn number() -> Inferred {
    Inferred::Known(Powers::new())
}

fn dimension(name: Dimension) -> Inferred {
    Inferred::Known(Powers::from([(name, 1)]))
}

fn combine(a: &Inferred, b: &Inferred, operator: &str, hint: Hint) -> Inferred {
    let (Inferred::Known(a), Inferred::Known(b)) = (a, b) else {
        return if matches!(a, Inferred::Invalid) || matches!(b, Inferred::Invalid) {
            Inferred::Invalid
        } else {
            Inferred::Unknown
        };
    };
    if operator == "+" || operator == "-" {
        if a == b {
            return Inferred::Known(a.clone());
        }
        if hint.is_none()
            && (a.contains_key(&Dimension::Percentage) || b.contains_key(&Dimension::Percentage))
        {
            return Inferred::Unknown;
        }
        return Inferred::Invalid;
    }
    let mut powers = a.clone();
    for (&dimension, &exponent) in b {
        let power = powers.entry(dimension).or_default();
        *power += exponent * if operator == "/" { -1 } else { 1 };
        if *power == 0 {
            powers.remove(&dimension);
        }
    }
    Inferred::Known(powers)
}

fn expression(nodes: &[Node], hint: Hint) -> Inferred {
    let mut offset = 0;
    let operator = |offset: usize| match nodes.get(offset) {
        Some(Node::Operator(value)) => value.trim().to_owned(),
        _ => String::new(),
    };
    let atom = |offset: &mut usize| -> Inferred {
        let Some(node) = nodes.get(*offset) else {
            *offset += 1;
            return Inferred::Invalid;
        };
        *offset += 1;
        match node {
            Node::Number(_) => number(),
            Node::Dimension { unit, .. } => {
                unit_dimension(unit).map_or(Inferred::Unknown, dimension)
            }
            Node::Percentage(_) => dimension(hint.flatten().unwrap_or(Dimension::Percentage)),
            Node::Identifier(name) => {
                if ["e", "pi", "infinity", "-infinity", "nan"]
                    .contains(&name.to_lowercase().as_str())
                {
                    number()
                } else {
                    Inferred::Unknown
                }
            }
            Node::Parentheses(children) => expression(children, hint),
            Node::Function { name, children } => infer_function(name, children, hint),
            _ => Inferred::Unknown,
        }
    };
    let product = |offset: &mut usize| -> Inferred {
        let mut result = atom(offset);
        while ["*", "/"].contains(&operator(*offset).as_str()) {
            let op = operator(*offset);
            *offset += 1;
            result = combine(&result, &atom(offset), &op, hint);
        }
        result
    };
    let mut result = product(&mut offset);
    let mut known_sum = matches!(result, Inferred::Known(_)).then(|| result.clone());
    while ["+", "-"].contains(&operator(offset).as_str()) {
        let op = operator(offset);
        offset += 1;
        let right = product(&mut offset);
        if matches!(right, Inferred::Known(_)) {
            let sum = match &known_sum {
                Some(known) => combine(known, &right, &op, hint),
                None => right.clone(),
            };
            if sum == Inferred::Invalid {
                return Inferred::Invalid;
            }
            known_sum = matches!(sum, Inferred::Known(_)).then_some(sum);
        }
        result = combine(&result, &right, &op, hint);
    }
    if offset == nodes.len() {
        result
    } else {
        Inferred::Unknown
    }
}

/// The type a known result has: `number` (`Some(None)`), one dimension, or none.
fn primitive(powers: &Powers) -> Option<Option<Dimension>> {
    let mut entries = powers.iter();
    match (entries.next(), entries.next()) {
        (None, _) => Some(None),
        (Some((&dimension, &1)), None) => Some(Some(dimension)),
        _ => None,
    }
}

fn infer_function(name: &str, children: &[Node], hint: Hint) -> Inferred {
    let name = name.to_lowercase();
    if !is_math_function(&name) {
        return Inferred::Unknown;
    }
    let mut arguments = split_arguments(children);
    if name == "round"
        && matches!(arguments.first().map(Vec::as_slice), Some([Node::Identifier(keyword)]) if ["nearest", "up", "down", "to-zero"].contains(&keyword.as_str()))
    {
        arguments.remove(0);
    }
    let values: Vec<Inferred> = arguments
        .iter()
        .enumerate()
        .filter(|(index, nodes)| {
            !(name == "clamp"
                && *index != 1
                && matches!(nodes.as_slice(), [Node::Identifier(keyword)] if keyword == "none"))
        })
        .map(|(_, nodes)| expression(nodes, hint))
        .collect();
    if values.contains(&Inferred::Invalid) {
        return Inferred::Invalid;
    }
    // Check all known arguments, even when an independent argument is unknown.
    let known: Vec<&Powers> = values
        .iter()
        .filter_map(|value| match value {
            Inferred::Known(powers) => Some(powers),
            _ => None,
        })
        .collect();
    let uncertain = known.len() != values.len();
    let accepts = |types: &[Option<Dimension>]| {
        known
            .iter()
            .all(|value| primitive(value).is_some_and(|ty| types.contains(&ty)))
    };
    let result = match name.as_str() {
        "calc" => return values.into_iter().next().unwrap_or(Inferred::Invalid),
        "sin" | "cos" | "tan" => {
            if accepts(&[None, Some(Dimension::Angle)]) {
                number()
            } else {
                Inferred::Invalid
            }
        }
        "asin" | "acos" | "atan" => {
            if accepts(&[None]) {
                dimension(Dimension::Angle)
            } else {
                Inferred::Invalid
            }
        }
        "pow" | "sqrt" | "exp" | "log" => {
            if accepts(&[None]) {
                number()
            } else {
                Inferred::Invalid
            }
        }
        "sign" => {
            if known.iter().all(|value| primitive(value).is_some()) {
                number()
            } else {
                Inferred::Invalid
            }
        }
        "abs" => values.first().cloned().unwrap_or(Inferred::Invalid),
        _ => {
            // min/max/clamp/hypot/mod/rem/round/atan2 require compatible argument types.
            let first = known.first().map_or(Inferred::Unknown, |powers| {
                Inferred::Known((*powers).clone())
            });
            let mut result = known.iter().fold(first, |result, value| {
                combine(&result, &Inferred::Known((*value).clone()), "+", hint)
            });
            if name == "round" && values.len() == 1 && !accepts(&[None]) {
                result = Inferred::Invalid;
            }
            if name == "atan2" && matches!(result, Inferred::Known(_)) {
                result = dimension(Dimension::Angle);
            }
            result
        }
    };
    match result {
        Inferred::Invalid => Inferred::Invalid,
        _ if uncertain => Inferred::Unknown,
        result => result,
    }
}

fn representative(ty: Option<Dimension>) -> Node {
    match ty {
        None => one(),
        Some(Dimension::Percentage) => Node::Percentage("1".into()),
        Some(dimension) => Node::Dimension {
            value: "1".into(),
            unit: example_unit(dimension).into(),
        },
    }
}

/// The paths of the outermost math functions in walk order.
fn math_paths(node: &Node, path: &mut Vec<usize>, paths: &mut Vec<Vec<usize>>) {
    let children = match node {
        Node::Value(children)
        | Node::Parentheses(children)
        | Node::Brackets(children)
        | Node::Function { children, .. } => children,
        _ => return,
    };
    for (index, child) in children.iter().enumerate() {
        path.push(index);
        match child {
            Node::Function { name, .. } if is_math_function(name) => paths.push(path.clone()),
            _ => math_paths(child, path, paths),
        }
        path.pop();
    }
}

fn node_at<'a>(node: &'a mut Node, path: &[usize]) -> &'a mut Node {
    let mut node = node;
    for &index in path {
        node = match node {
            Node::Value(children)
            | Node::Parentheses(children)
            | Node::Brackets(children)
            | Node::Function { children, .. } => &mut children[index],
            _ => unreachable!("math paths follow child lists"),
        };
    }
    node
}

fn contains_percentage(node: &Node) -> bool {
    match node {
        Node::Percentage(_) => true,
        Node::Value(children)
        | Node::Parentheses(children)
        | Node::Brackets(children)
        | Node::Function { children, .. } => children.iter().any(contains_percentage),
        _ => false,
    }
}

/// Substitutes only proven result types into a disposable grammar AST. A nested
/// calc may have a compound intermediate type which its parent cancels.
pub fn validate_math_types(
    ast: &Node,
    matches: &dyn Fn(&Node) -> bool,
) -> (Node, Option<MathStatus>) {
    let mut normalized = ast.clone();
    let mut paths = Vec::new();
    math_paths(&normalized, &mut Vec::new(), &mut paths);
    if paths.is_empty() {
        return (normalized, None);
    }
    let mut status = MathStatus::Valid;
    for path in paths {
        let node = node_at(&mut normalized, &path).clone();
        let Node::Function { name, children } = &node else {
            continue;
        };
        let accepts = |normalized: &Node, ty: Option<Dimension>| {
            let mut candidate = normalized.clone();
            *node_at(&mut candidate, &path) = representative(ty);
            matches(&candidate)
        };
        let mut hint: Hint = Some(None);
        let has_percentage = contains_percentage(&node);
        if has_percentage {
            // Infer the context from the complete property grammar at this location.
            // A failed match containing substitutions cannot prove a percentage basis.
            let bases: Vec<Dimension> = DIMENSIONS
                .iter()
                .copied()
                .filter(|&ty| accepts(&normalized, Some(ty)))
                .collect();
            hint = if accepts(&normalized, Some(Dimension::Percentage)) && bases.len() == 1 {
                Some(Some(bases[0]))
            } else if bases.is_empty() {
                None
            } else {
                Some(None)
            };
        }
        match infer_function(name, children, hint) {
            Inferred::Invalid => status = MathStatus::Invalid,
            Inferred::Unknown => {
                if status != MathStatus::Invalid {
                    status = MathStatus::Unknown;
                }
            }
            Inferred::Known(powers) => match primitive(&powers) {
                None => {
                    if has_percentage && hint.is_none() {
                        if status != MathStatus::Invalid {
                            status = MathStatus::Unknown;
                        }
                    } else {
                        status = MathStatus::Invalid;
                    }
                }
                Some(ty) => *node_at(&mut normalized, &path) = representative(ty),
            },
        }
    }
    (normalized, Some(status))
}
