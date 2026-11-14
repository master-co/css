//! Port of css-tree's matcher (`internalMatch` of `lib/lexer/match.js`).
//!
//! A state machine over the match graph with a `then` stack (what follows a match) and an `else`
//! stack (the alternatives left to try), so a mismatch backtracks to the last choice point. The
//! stacks are persistent lists, as in css-tree, because a choice point keeps the stacks of its
//! moment and the identity of the match stack is what `DISALLOW_EMPTY` compares.
//!
//! The iteration limit is css-tree's: a syntax and value that need more steps mismatch, as they do
//! in TS.

use std::rc::Rc;

use crate::definition::ast::TypeRange;

use super::super::tokenizer::{Token, TokenType};
use super::Run;
use super::generic::Cursor;
use super::graph::{DISALLOW_EMPTY, Id, MATCH, MISMATCH, Node};

const ITERATION_LIMIT: usize = 150_000;

/// css-tree `EXIT_REASON_MISMATCH`.
pub const EXIT_REASON_MISMATCH: &str = "Mismatch";
/// css-tree `EXIT_REASON_ITERATION_LIMIT`.
pub const EXIT_REASON_ITERATION_LIMIT: &str = "Maximum iteration number exceeded (please fill an issue on https://github.com/csstree/csstree/issues)";

#[derive(Clone)]
enum State {
    Node(Id),
    /// `MatchOnceBuffer`
    Buffer {
        syntax: Id,
        index: usize,
        mask: u64,
    },
    AddMatchOnce {
        syntax: Id,
        mask: u64,
    },
}

#[derive(PartialEq, Eq)]
enum MatchKind {
    Stub,
    Token,
    Open,
    Close,
}

struct MatchEntry {
    kind: MatchKind,
    /// The index of the token of the entry (`matchStack.token`).
    token: Option<usize>,
    prev: Option<Rc<MatchEntry>>,
}

struct SyntaxEntry {
    opts: Option<Rc<TypeRange>>,
    prev: Option<Rc<SyntaxEntry>>,
}

struct ThenEntry {
    next: State,
    match_stack: Rc<MatchEntry>,
    syntax_stack: Option<Rc<SyntaxEntry>>,
    prev: Option<Rc<ThenEntry>>,
}

struct ElseEntry {
    next: State,
    match_stack: Rc<MatchEntry>,
    syntax_stack: Option<Rc<SyntaxEntry>>,
    then_stack: Option<Rc<ThenEntry>>,
    token_index: usize,
    prev: Option<Rc<ElseEntry>>,
}

/// css-tree `syntaxStash`: `null`, `false`, or a stashed state.
enum Stash {
    Null,
    Disabled,
    Some(Rc<ElseEntry>),
}

fn same<T>(a: Option<&Rc<T>>, b: Option<&Rc<T>>) -> bool {
    match (a, b) {
        (None, None) => true,
        (Some(a), Some(b)) => Rc::ptr_eq(a, b),
        _ => false,
    }
}

/// The outcome of a match: whether it matched, why not, and the furthest token index reached.
pub struct Outcome {
    pub matched: bool,
    pub reason: &'static str,
    pub longest_match: usize,
}

/// `name.replace(/\\[09].*$/, '')`: drops the `\0` and `\9` hacks from a keyword.
fn strip_ie_hack(value: &str) -> &str {
    let bytes = value.as_bytes();
    for i in 0..bytes.len().saturating_sub(1) {
        if bytes[i] == b'\\'
            && matches!(bytes[i + 1], b'0' | b'9')
            && !value[i..].contains(['\n', '\r', '\u{2028}', '\u{2029}'])
        {
            return &value[..i];
        }
    }
    value
}

/// css-tree `areStringsEqualCaseInsensitive`: only A-Z of `test` is folded.
fn eq_ci(test: &str, reference: &str) -> bool {
    let mut t = test.encode_utf16();
    let mut r = reference.encode_utf16();
    loop {
        match (t.next(), r.next()) {
            (None, None) => return true,
            (Some(a), Some(b)) => {
                let a = if (0x41..=0x5A).contains(&a) {
                    a | 32
                } else {
                    a
                };
                if a != b {
                    return false;
                }
            }
            _ => return false,
        }
    }
}

/// css-tree `isCommaContextStart`.
fn is_comma_context_start(token: Option<&Token>) -> bool {
    let Some(token) = token else {
        return true;
    };
    match token.ty {
        TokenType::Comma
        | TokenType::Function
        | TokenType::LeftParenthesis
        | TokenType::LeftSquareBracket
        | TokenType::LeftCurlyBracket => true,
        // Fix matching for unicode-range: U+30??, U+FF00-FF9F
        TokenType::Delim => token.value != "?",
        _ => false,
    }
}

/// css-tree `isCommaContextEnd`.
fn is_comma_context_end(token: Option<&Token>) -> bool {
    let Some(token) = token else {
        return true;
    };
    matches!(
        token.ty,
        TokenType::RightParenthesis | TokenType::RightSquareBracket | TokenType::RightCurlyBracket
    ) || (token.ty == TokenType::Delim && token.value == "/")
}

struct Machine<'r, 'a> {
    run: &'r mut Run<'a>,
    tokens: &'r [Token],
    token_index: usize,
    longest_match: usize,
    match_stack: Rc<MatchEntry>,
    syntax_stack: Option<Rc<SyntaxEntry>>,
    then_stack: Option<Rc<ThenEntry>>,
    else_stack: Option<Rc<ElseEntry>>,
    stash: Stash,
}

impl Machine<'_, '_> {
    fn token(&self) -> Option<&Token> {
        self.tokens.get(self.token_index)
    }

    fn move_to_next_token(&mut self) {
        loop {
            self.token_index += 1;
            if !self
                .tokens
                .get(self.token_index)
                .is_some_and(|t| matches!(t.ty, TokenType::WhiteSpace | TokenType::Comment))
            {
                break;
            }
        }
    }

    fn snapshot(&self, next: State, prev: Option<Rc<ElseEntry>>) -> Rc<ElseEntry> {
        Rc::new(ElseEntry {
            next,
            match_stack: Rc::clone(&self.match_stack),
            syntax_stack: self.syntax_stack.clone(),
            then_stack: self.then_stack.clone(),
            token_index: self.token_index,
            prev,
        })
    }

    fn push_then(&mut self, next: State) {
        self.then_stack = Some(Rc::new(ThenEntry {
            next,
            match_stack: Rc::clone(&self.match_stack),
            syntax_stack: self.syntax_stack.clone(),
            prev: self.then_stack.take(),
        }));
    }

    fn push_else(&mut self, next: State) {
        self.else_stack = Some(self.snapshot(next, self.else_stack.clone()));
    }

    fn add_token_to_match(&mut self) {
        self.match_stack = Rc::new(MatchEntry {
            kind: MatchKind::Token,
            token: Some(self.token_index),
            prev: Some(Rc::clone(&self.match_stack)),
        });
        self.move_to_next_token();
        self.stash = Stash::Null;
        if self.token_index > self.longest_match {
            self.longest_match = self.token_index;
        }
    }

    fn open_syntax(&mut self, opts: Option<Rc<TypeRange>>) {
        let opts = opts.or_else(|| self.syntax_stack.as_ref().and_then(|s| s.opts.clone()));
        self.syntax_stack = Some(Rc::new(SyntaxEntry {
            opts,
            prev: self.syntax_stack.take(),
        }));
        self.match_stack = Rc::new(MatchEntry {
            kind: MatchKind::Open,
            token: self.match_stack.token,
            prev: Some(Rc::clone(&self.match_stack)),
        });
    }

    fn close_syntax(&mut self) {
        if self.match_stack.kind == MatchKind::Open {
            if let Some(prev) = self.match_stack.prev.clone() {
                self.match_stack = prev;
            }
        } else {
            self.match_stack = Rc::new(MatchEntry {
                kind: MatchKind::Close,
                token: self.match_stack.token,
                prev: Some(Rc::clone(&self.match_stack)),
            });
        }
        self.syntax_stack = self.syntax_stack.as_ref().and_then(|s| s.prev.clone());
    }

    /// One step on a `MatchOnceBuffer`.
    fn buffer(&mut self, syntax: Id, index: usize, mask: u64) -> State {
        let Node::MatchOnce { terms, all } = &self.run.graph.nodes[syntax] else {
            return State::Node(MISMATCH);
        };
        let (terms, all) = (Rc::clone(terms), *all);
        if index == terms.len() {
            // no matches at all or it's required all terms to be matched
            return State::Node(if mask == 0 || all { MISMATCH } else { MATCH });
        }
        // all terms are matched
        if mask == (1u64 << terms.len()) - 1 {
            return State::Node(MATCH);
        }
        for (i, &term) in terms.iter().enumerate().skip(index) {
            let flag = 1u64 << i;
            if mask & flag == 0 {
                // the else branch must be pushed first: it keeps the then stack of this moment
                self.push_else(State::Buffer {
                    syntax,
                    index: i + 1,
                    mask,
                });
                self.push_then(State::AddMatchOnce {
                    syntax,
                    mask: mask | flag,
                });
                return State::Node(term);
            }
        }
        State::Buffer {
            syntax,
            index: terms.len(),
            mask,
        }
    }

    /// The `Match` state.
    fn on_match(&mut self) -> Result<State, bool> {
        let Some(then) = self.then_stack.clone() else {
            // turn to MISMATCH when some tokens left unmatched
            if let Some(token) = self.token() {
                // doesn't mismatch if just one token left and it's an IE hack
                if self.token_index != self.tokens.len() - 1
                    || (token.value != "\\0" && token.value != "\\9")
                {
                    return Ok(State::Node(MISMATCH));
                }
            }
            return Err(true);
        };
        // go to next syntax (`then` branch)
        let mut state = then.next.clone();
        // check match is not empty
        if matches!(state, State::Node(DISALLOW_EMPTY)) {
            if Rc::ptr_eq(&then.match_stack, &self.match_stack) {
                return Ok(State::Node(MISMATCH));
            }
            state = State::Node(MATCH);
        }
        // close syntax if needed
        while !same(then.syntax_stack.as_ref(), self.syntax_stack.as_ref()) {
            self.close_syntax();
        }
        // pop stack
        self.then_stack.clone_from(&then.prev);
        Ok(state)
    }

    /// The `Mismatch` state.
    fn on_mismatch(&mut self) -> Result<State, bool> {
        // when some syntax is stashed
        if let Stash::Some(stash) = &self.stash {
            // there is no else branches or a branch reduce match stack
            if self
                .else_stack
                .as_ref()
                .is_none_or(|e| self.token_index > e.token_index)
            {
                // restore state from the stash
                self.else_stack = Some(Rc::clone(stash));
                // disable stashing
                self.stash = Stash::Disabled;
            }
        } else if self.else_stack.is_none() {
            // no else branches -> break the main loop
            return Err(false);
        }
        let Some(entry) = self.else_stack.take() else {
            return Err(false);
        };
        // go to next syntax (`else` branch) and restore all the rest stack states
        self.then_stack.clone_from(&entry.then_stack);
        self.syntax_stack.clone_from(&entry.syntax_stack);
        self.match_stack = Rc::clone(&entry.match_stack);
        self.token_index = entry.token_index;
        // pop stack
        self.else_stack.clone_from(&entry.prev);
        Ok(entry.next.clone())
    }

    /// The step of a graph node; `Err` is an exit (`true`: match) or a bad syntax reference.
    #[allow(clippy::too_many_lines)]
    fn step(&mut self, id: Id) -> Result<State, Exit> {
        let node = self.run.graph.nodes[id].clone();
        Ok(match node {
            Node::Match => self.on_match().map_err(Exit::Done)?,
            Node::Mismatch => self.on_mismatch().map_err(Exit::Done)?,
            // css-tree throws `Unknown node type` for a state it cannot step; DISALLOW_EMPTY is
            // only ever a `then` branch, which the `Match` state reads.
            Node::DisallowEmpty => {
                return Err(Exit::Error("Unknown node type: DisallowEmpty".to_owned()));
            }
            Node::MatchGraph { m } => State::Node(m),
            Node::If { m, then, else_ } => {
                // the else branch must be pushed first: it keeps the then stack of this moment
                if else_ != MISMATCH {
                    self.push_else(State::Node(else_));
                }
                if then != MATCH {
                    self.push_then(State::Node(then));
                }
                State::Node(m)
            }
            Node::MatchOnce { .. } => State::Buffer {
                syntax: id,
                index: 0,
                mask: 0,
            },
            Node::Enum { map } => {
                let target = self.token().and_then(|token| {
                    let mut name = token.value.to_lowercase();
                    // drop \0 and \9 hack from keyword name
                    if name.contains('\\') {
                        name = strip_ie_hack(&name).to_owned();
                    }
                    map.get(&name).copied()
                });
                State::Node(target.unwrap_or(MISMATCH))
            }
            Node::Generic(generic) => {
                let opts = self.syntax_stack.as_ref().and_then(|s| s.opts.clone());
                let cursor = Cursor {
                    tokens: self.tokens,
                    index: self.token_index,
                };
                let count = generic.consume(&cursor, opts.as_deref());
                if count > 0 {
                    let last = self.token_index + count;
                    while self.token_index < last {
                        self.add_token_to_match();
                    }
                    State::Node(MATCH)
                } else {
                    State::Node(MISMATCH)
                }
            }
            Node::Type { name, opts } => {
                let Some(target) = self.run.descriptor(false, &name) else {
                    return Err(Exit::Error(format!("Bad syntax reference: <{name}>")));
                };
                // stash a syntax for types with low priority
                if !matches!(self.stash, Stash::Disabled)
                    && let Some(token) = self.token()
                {
                    let low_priority_matching =
                        // https://drafts.csswg.org/css-values-4/#custom-idents
                        // When parsing positionally-ambiguous keywords in a property value, a
                        // <custom-ident> production can only claim the keyword if no other
                        // unfulfilled production can claim it.
                        (&*name == "custom-ident" && token.ty == TokenType::Ident)
                        // https://drafts.csswg.org/css-values-4/#lengths
                        // ... if a `0` could be parsed as either a <number> or a <length> in a
                        // property (such as line-height), it must parse as a <number>
                        || (&*name == "length" && token.value == "0");
                    if low_priority_matching {
                        if matches!(self.stash, Stash::Null) {
                            self.stash = Stash::Some(
                                self.snapshot(State::Node(id), self.else_stack.clone()),
                            );
                        }
                        return Ok(State::Node(MISMATCH));
                    }
                }
                self.open_syntax(opts);
                State::Node(target)
            }
            Node::Property { name } => {
                let Some(target) = self.run.descriptor(true, &name) else {
                    return Err(Exit::Error(format!("Bad syntax reference: <'{name}'>")));
                };
                self.open_syntax(None);
                State::Node(target)
            }
            Node::Keyword { name } => {
                let matched = self.token().is_some_and(|token| {
                    let keyword_name = if token.value.contains('\\') {
                        strip_ie_hack(&token.value)
                    } else {
                        &token.value
                    };
                    eq_ci(keyword_name, &name)
                });
                if matched {
                    self.add_token_to_match();
                    State::Node(MATCH)
                } else {
                    State::Node(MISMATCH)
                }
            }
            Node::AtKeyword { name } | Node::Function { name } => {
                if self.token().is_some_and(|t| eq_ci(&t.value, &name)) {
                    self.add_token_to_match();
                    State::Node(MATCH)
                } else {
                    State::Node(MISMATCH)
                }
            }
            Node::Token { value } => {
                if self.token().is_some_and(|t| *t.value == *value) {
                    self.add_token_to_match();
                    State::Node(MATCH)
                } else {
                    State::Node(MISMATCH)
                }
            }
            Node::Comma => {
                let prev = self.match_stack.token.and_then(|i| self.tokens.get(i));
                if self.token().is_some_and(|t| t.ty == TokenType::Comma) {
                    if is_comma_context_start(prev) {
                        State::Node(MISMATCH)
                    } else {
                        self.add_token_to_match();
                        State::Node(if is_comma_context_end(self.token()) {
                            MISMATCH
                        } else {
                            MATCH
                        })
                    }
                } else if is_comma_context_start(prev) || is_comma_context_end(self.token()) {
                    State::Node(MATCH)
                } else {
                    State::Node(MISMATCH)
                }
            }
            Node::Str { value } => {
                let target_len = value.encode_utf16().count();
                let mut string = String::new();
                let mut string_len = 0;
                let mut last = self.token_index;
                while last < self.tokens.len() && string_len < target_len {
                    string.push_str(&self.tokens[last].value);
                    string_len += self.tokens[last].value.encode_utf16().count();
                    last += 1;
                }
                if eq_ci(&string, &value) {
                    while self.token_index < last {
                        self.add_token_to_match();
                    }
                    State::Node(MATCH)
                } else {
                    State::Node(MISMATCH)
                }
            }
        })
    }

    fn run(mut self, start: Id) -> Result<Outcome, String> {
        let mut state = State::Node(start);
        let mut iteration_count = 0;
        loop {
            iteration_count += 1;
            if iteration_count >= ITERATION_LIMIT {
                return Ok(Outcome {
                    matched: false,
                    reason: EXIT_REASON_ITERATION_LIMIT,
                    longest_match: self.longest_match,
                });
            }
            let next = match state {
                State::Buffer {
                    syntax,
                    index,
                    mask,
                } => Ok(self.buffer(syntax, index, mask)),
                State::AddMatchOnce { syntax, mask } => Ok(State::Buffer {
                    syntax,
                    index: 0,
                    mask,
                }),
                State::Node(id) => self.step(id),
            };
            state = match next {
                Ok(next) => next,
                Err(Exit::Done(matched)) => {
                    return Ok(Outcome {
                        matched,
                        reason: if matched {
                            "Match"
                        } else {
                            EXIT_REASON_MISMATCH
                        },
                        longest_match: self.longest_match,
                    });
                }
                Err(Exit::Error(message)) => return Err(message),
            };
        }
    }
}

enum Exit {
    /// The match ended: `true` matched.
    Done(bool),
    /// css-tree throws.
    Error(String),
}

/// css-tree `matchAsTree` (without the tree): matches `tokens` against the graph from `start`.
///
/// # Errors
///
/// Returns the message css-tree throws when the graph references a type or property the lexer
/// does not define.
pub fn match_tokens(run: &mut Run<'_>, tokens: &[Token], start: Id) -> Result<Outcome, String> {
    let mut machine = Machine {
        run,
        tokens,
        token_index: 0,
        longest_match: 0,
        match_stack: Rc::new(MatchEntry {
            kind: MatchKind::Stub,
            token: None,
            prev: None,
        }),
        syntax_stack: None,
        then_stack: None,
        else_stack: None,
        stash: Stash::Null,
    };
    // `tokenIndex = -1; moveToNextToken()`
    if machine
        .tokens
        .first()
        .is_some_and(|t| matches!(t.ty, TokenType::WhiteSpace | TokenType::Comment))
    {
        machine.move_to_next_token();
    }
    machine.run(start)
}
