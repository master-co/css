//! Port of css-tree's match graph (`lib/lexer/match-graph.js`).
//!
//! The graph is kept in an arena: a node is an index, so the loops a multiplier makes are plain
//! index cycles. The node shapes and the reductions of `createCondition` follow css-tree, because
//! they decide the order the matcher explores and the number of iterations it spends, and the
//! matcher gives up after a fixed number of iterations as css-tree does.

use std::collections::{HashMap, HashSet};
use std::rc::Rc;

use crate::definition::ast::{Combinator, MultiplierInfo, SyntaxNode, TypeRange};

use super::generic::Generic;

pub type Id = usize;

pub const MATCH: Id = 0;
pub const MISMATCH: Id = 1;
pub const DISALLOW_EMPTY: Id = 2;

/// A node of the match graph. Names are shared (`Rc`) so the matcher can copy a node cheaply.
#[derive(Debug, Clone)]
pub enum Node {
    Match,
    Mismatch,
    DisallowEmpty,
    If {
        m: Id,
        then: Id,
        else_: Id,
    },
    MatchOnce {
        terms: Rc<[Id]>,
        all: bool,
    },
    Enum {
        map: Rc<HashMap<String, Id>>,
    },
    Generic(Generic),
    Type {
        name: Rc<str>,
        opts: Option<Rc<TypeRange>>,
    },
    Property {
        name: Rc<str>,
    },
    Keyword {
        name: Rc<str>,
    },
    AtKeyword {
        name: Rc<str>,
    },
    Function {
        name: Rc<str>,
    },
    Token {
        value: Rc<str>,
    },
    Comma,
    Str {
        value: Rc<str>,
    },
    MatchGraph {
        m: Id,
    },
}

pub struct Graph {
    pub nodes: Vec<Node>,
}

impl Default for Graph {
    fn default() -> Self {
        Self {
            nodes: vec![Node::Match, Node::Mismatch, Node::DisallowEmpty],
        }
    }
}

/// css-tree `isFunctionType`: a type named like `rgb()`.
fn is_function_type(name: &str) -> bool {
    name.len() > 2 && name.ends_with("()")
}

/// css-tree `groupNode`.
fn group_node(terms: Vec<SyntaxNode>, combinator: Combinator) -> SyntaxNode {
    SyntaxNode::Group {
        terms,
        combinator,
        disallow_empty: false,
        explicit: false,
    }
}

fn type_node(name: &str) -> SyntaxNode {
    SyntaxNode::Type {
        name: name.to_owned(),
        opts: None,
    }
}

fn keyword_node(name: &str) -> SyntaxNode {
    SyntaxNode::Keyword {
        name: name.to_owned(),
    }
}

impl Graph {
    fn push(&mut self, node: Node) -> Id {
        self.nodes.push(node);
        self.nodes.len() - 1
    }

    /// css-tree `createCondition`.
    fn condition(&mut self, mut m: Id, mut then: Id, else_: Id) -> Id {
        // reduce node count
        if then == MATCH && else_ == MISMATCH {
            return m;
        }
        if m == MATCH && then == MATCH && else_ == MATCH {
            return m;
        }
        if let Node::If {
            m: inner_m,
            then: inner_then,
            else_: MISMATCH,
        } = self.nodes[m]
            && then == MATCH
        {
            then = inner_then;
            m = inner_m;
        }
        self.push(Node::If { m, then, else_ })
    }

    /// css-tree `isEnumCapatible`.
    fn is_enum_compatible(&self, id: Id) -> bool {
        match &self.nodes[id] {
            Node::Keyword { .. } | Node::AtKeyword { .. } | Node::Function { .. } => true,
            Node::Type { name, .. } => is_function_type(name),
            _ => false,
        }
    }

    /// The key of a term in an `Enum` map: its name, lower-cased, without the `)` of a function
    /// type.
    fn enum_key(&self, id: Id) -> String {
        let name: &str = match &self.nodes[id] {
            Node::Keyword { name }
            | Node::AtKeyword { name }
            | Node::Function { name }
            | Node::Type { name, .. } => name,
            _ => "",
        };
        let name = if is_function_type(name) {
            &name[..name.len() - 1]
        } else {
            name
        };
        name.to_lowercase()
    }

    /// css-tree `buildGroupMatchGraph`.
    fn group(
        &mut self,
        combinator: &Combinator,
        terms: &[Id],
        at_least_one_term_matched: bool,
    ) -> Id {
        match combinator {
            Combinator::Juxtaposition => {
                let mut result = MATCH;
                for &term in terms.iter().rev() {
                    result = self.condition(term, result, MISMATCH);
                }
                result
            }
            Combinator::Bar => {
                let mut result = MISMATCH;
                let mut map: Option<(Id, HashMap<String, Id>)> = None;
                let mut maps: Vec<(Id, HashMap<String, Id>)> = Vec::new();
                for i in (0..terms.len()).rev() {
                    let term = terms[i];
                    // reduce sequence of keywords into a Enum
                    if self.is_enum_compatible(term) {
                        if map.is_none() && i > 0 && self.is_enum_compatible(terms[i - 1]) {
                            let enum_id = self.push(Node::Enum {
                                map: Rc::new(HashMap::new()),
                            });
                            map = Some((enum_id, HashMap::new()));
                            result = self.condition(enum_id, MATCH, result);
                        }
                        if let Some((_, entries)) = &mut map {
                            let key = self.enum_key(term);
                            if let std::collections::hash_map::Entry::Vacant(e) = entries.entry(key)
                            {
                                e.insert(term);
                                continue;
                            }
                        }
                    }
                    if let Some(done) = map.take() {
                        maps.push(done);
                    }
                    result = self.condition(term, MATCH, result);
                }
                if let Some(done) = map.take() {
                    maps.push(done);
                }
                for (enum_id, entries) in maps {
                    self.nodes[enum_id] = Node::Enum {
                        map: Rc::new(entries),
                    };
                }
                result
            }
            Combinator::DoubleAmpersand | Combinator::DoubleBar => {
                let all = matches!(combinator, Combinator::DoubleAmpersand);
                // Use MatchOnce for groups with a large number of terms, since &&- and ||-groups
                // produce at least N!-node trees
                if terms.len() > 5 {
                    return self.push(Node::MatchOnce {
                        terms: terms.into(),
                        all,
                    });
                }
                let mut result = if !all && at_least_one_term_matched {
                    MATCH
                } else {
                    MISMATCH
                };
                for i in (0..terms.len()).rev() {
                    let term = terms[i];
                    let then = if terms.len() > 1 {
                        let rest: Vec<Id> = terms
                            .iter()
                            .enumerate()
                            .filter(|&(j, _)| j != i)
                            .map(|(_, &t)| t)
                            .collect();
                        self.group(combinator, &rest, !all)
                    } else {
                        MATCH
                    };
                    result = self.condition(term, then, result);
                }
                result
            }
        }
    }

    /// css-tree `buildMultiplierMatchGraph`.
    fn multiplier(&mut self, term: &SyntaxNode, info: &MultiplierInfo) -> Id {
        let mut result = MATCH;
        let mut match_term = self.build(term);

        if info.max == 0 {
            // disable repeating of empty match to prevent infinite loop
            match_term = self.condition(match_term, DISALLOW_EMPTY, MISMATCH);
            // `createCondition(matchTerm, null, MISMATCH)`: `then` becomes the loop below
            let loop_id = self.push(Node::If {
                m: match_term,
                then: MATCH,
                else_: MISMATCH,
            });
            let then = self.push(Node::If {
                m: MATCH,
                then: MATCH,
                else_: loop_id,
            });
            if let Node::If { then: t, .. } = &mut self.nodes[loop_id] {
                *t = then;
            }
            if info.comma {
                let comma = self.push(Node::Comma);
                let else_ = self.condition(comma, loop_id, MISMATCH);
                if let Node::If { else_: e, .. } = &mut self.nodes[then] {
                    *e = else_;
                }
            }
            result = loop_id;
        } else {
            // create a match node chain for [min .. max] interval with optional matches
            for _ in info.min.max(1)..=info.max {
                if info.comma && result != MATCH {
                    let comma = self.push(Node::Comma);
                    result = self.condition(comma, result, MISMATCH);
                }
                let then = self.condition(MATCH, MATCH, result);
                result = self.condition(match_term, then, MISMATCH);
            }
        }

        if info.min == 0 {
            // allow zero match
            result = self.condition(MATCH, MATCH, result);
        } else {
            // create a match node chain to collect [0 ... min - 1] required matches
            for _ in 0..info.min.saturating_sub(1) {
                if info.comma && result != MATCH {
                    let comma = self.push(Node::Comma);
                    result = self.condition(comma, result, MISMATCH);
                }
                result = self.condition(match_term, result, MISMATCH);
            }
        }

        result
    }

    /// css-tree `replaceTypeInGraph`.
    fn replace_type(
        &mut self,
        id: Id,
        replacements: &[(&str, Id)],
        visited: &mut HashSet<Id>,
    ) -> Id {
        if visited.insert(id) {
            match self.nodes[id].clone() {
                Node::If { m, then, else_ } => {
                    let m = self.replace_type(m, replacements, visited);
                    let then = self.replace_type(then, replacements, visited);
                    let else_ = self.replace_type(else_, replacements, visited);
                    self.nodes[id] = Node::If { m, then, else_ };
                }
                Node::Type { name, .. } => {
                    if let Some((_, replacement)) = replacements.iter().find(|(n, _)| *n == &*name)
                    {
                        return *replacement;
                    }
                }
                _ => {}
            }
        }
        id
    }

    /// css-tree's graph of `<boolean-expr[ <test> ]>` (CSS Values 5).
    ///
    /// @see <https://drafts.csswg.org/css-values-5/#boolean>
    fn boolean(&mut self, term: &SyntaxNode) -> Id {
        let term = self.build(term);
        let star = |term: SyntaxNode| SyntaxNode::Multiplier {
            term: Box::new(term),
            info: MultiplierInfo {
                min: 0,
                max: 0,
                comma: false,
            },
        };
        // <boolean-expr[ <test> ]> = not <boolean-expr-group> | <boolean-expr-group> [ [ and <boolean-expr-group> ]* | [ or <boolean-expr-group> ]* ]
        let match_node = self.build(&group_node(
            vec![
                group_node(
                    vec![keyword_node("not"), type_node("!boolean-group")],
                    Combinator::Juxtaposition,
                ),
                group_node(
                    vec![
                        type_node("!boolean-group"),
                        group_node(
                            vec![
                                star(group_node(
                                    vec![keyword_node("and"), type_node("!boolean-group")],
                                    Combinator::Juxtaposition,
                                )),
                                star(group_node(
                                    vec![keyword_node("or"), type_node("!boolean-group")],
                                    Combinator::Juxtaposition,
                                )),
                            ],
                            Combinator::Bar,
                        ),
                    ],
                    Combinator::Juxtaposition,
                ),
            ],
            Combinator::Bar,
        ));
        // <boolean-expr-group> = <test> | ( <boolean-expr[ <test> ]> ) | <general-enclosed>
        let boolean_group = self.build(&group_node(
            vec![
                type_node("!term"),
                group_node(
                    vec![
                        SyntaxNode::Token {
                            value: "(".to_owned(),
                        },
                        type_node("!self"),
                        SyntaxNode::Token {
                            value: ")".to_owned(),
                        },
                    ],
                    Combinator::Juxtaposition,
                ),
                type_node("general-enclosed"),
            ],
            Combinator::Bar,
        ));
        self.replace_type(
            boolean_group,
            &[("!term", term), ("!self", match_node)],
            &mut HashSet::new(),
        );
        self.replace_type(
            match_node,
            &[("!boolean-group", boolean_group)],
            &mut HashSet::new(),
        );
        match_node
    }

    /// css-tree `buildMatchGraphInternal`.
    pub fn build(&mut self, node: &SyntaxNode) -> Id {
        match node {
            SyntaxNode::Group {
                terms,
                combinator,
                disallow_empty,
                ..
            } => {
                let ids: Vec<Id> = terms.iter().map(|t| self.build(t)).collect();
                let mut result = self.group(combinator, &ids, false);
                if *disallow_empty {
                    result = self.condition(result, DISALLOW_EMPTY, MISMATCH);
                }
                result
            }
            SyntaxNode::Multiplier { term, info } => self.multiplier(term, info),
            SyntaxNode::Boolean { term } => self.boolean(term),
            SyntaxNode::Type { name, opts } => self.push(Node::Type {
                name: name.as_str().into(),
                opts: opts.clone().map(Rc::new),
            }),
            SyntaxNode::Property { name } => self.push(Node::Property {
                name: name.as_str().into(),
            }),
            SyntaxNode::Keyword { name } => self.push(Node::Keyword {
                name: name.to_lowercase().into(),
            }),
            SyntaxNode::AtKeyword { name } => self.push(Node::AtKeyword {
                name: format!("@{}", name.to_lowercase()).into(),
            }),
            SyntaxNode::Function { name } => self.push(Node::Function {
                name: format!("{}(", name.to_lowercase()).into(),
            }),
            SyntaxNode::StringNode { value } => {
                let units: Vec<u16> = value.encode_utf16().collect();
                // convert a one char length String to a Token
                if units.len() == 3 {
                    return self.push(Node::Token {
                        value: String::from_utf16_lossy(&units[1..2]).into(),
                    });
                }
                let inner =
                    String::from_utf16_lossy(&units[1..units.len().saturating_sub(1).max(1)]);
                self.push(Node::Str {
                    value: inner.replace("\\'", "'").into(),
                })
            }
            SyntaxNode::Token { value } => self.push(Node::Token {
                value: value.as_str().into(),
            }),
            SyntaxNode::Comma => self.push(Node::Comma),
        }
    }

    /// css-tree `buildMatchGraph` of a generic type's function.
    pub fn build_generic_graph(&mut self, generic: Generic) -> Id {
        let m = self.push(Node::Generic(generic));
        self.push(Node::MatchGraph { m })
    }

    /// css-tree `buildMatchGraph`: the `MatchGraph` node of a syntax.
    pub fn build_match_graph(&mut self, node: &SyntaxNode) -> Id {
        let m = self.build(node);
        self.push(Node::MatchGraph { m })
    }
}
