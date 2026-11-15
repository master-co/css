//! The tokens of recently tokenized texts, independent of where a text is stored.

use std::cell::RefCell;
use std::collections::VecDeque;
use std::ops::Range;

use super::{CssSyntaxKind, CssSyntaxToken};

/// Shorter texts tokenize faster than they are compared and copied.
pub(crate) const MIN_CACHED_LEN: usize = 256;
/// The texts one compilation alternates between: its source, the source with
/// consumed statements blanked, and the CSS it produces.
const MAX_ENTRIES: usize = 8;
/// Larger texts are tokenized each time rather than retained.
const MAX_CACHED_LEN: usize = 1 << 20;

/// A name or slice of a token: a range of its text, or a decoded name.
enum Text {
    Range(Range<usize>),
    Owned(Box<str>),
}

enum Kind {
    Ident(Text),
    String(Text),
    AtKeyword(Text),
    Function(Text),
    Number(Range<usize>),
    Dimension(Range<usize>, Text),
    Percentage(Range<usize>),
    Other,
    Delim(char),
}

struct Token {
    kind: Kind,
    bytes: Range<usize>,
    close: Option<usize>,
}

struct Entry {
    source: Box<str>,
    tokens: Vec<Token>,
}

thread_local! {
    static RECENT: RefCell<VecDeque<Entry>> = const { RefCell::new(VecDeque::new()) };
}

/// The range of `slice` within `source`, when it is a slice of it.
fn range_in(source: &str, slice: &str) -> Option<Range<usize>> {
    let start = (slice.as_ptr() as usize).checked_sub(source.as_ptr() as usize)?;
    let end = start + slice.len();
    (end <= source.len() && source.get(start..end) == Some(slice)).then_some(start..end)
}

#[allow(clippy::ptr_arg)] // A borrowed name is stored as a range of the text, an owned one as itself.
fn store_text(source: &str, text: &std::borrow::Cow<'_, str>) -> Text {
    match text {
        std::borrow::Cow::Borrowed(slice) => {
            range_in(source, slice).map_or_else(|| Text::Owned((*slice).into()), Text::Range)
        }
        std::borrow::Cow::Owned(name) => Text::Owned(name.as_str().into()),
    }
}

fn store_slice(source: &str, slice: &str) -> Option<Range<usize>> {
    range_in(source, slice)
}

fn store(source: &str, tokens: &[CssSyntaxToken<'_>]) -> Option<Vec<Token>> {
    tokens
        .iter()
        .map(|token| {
            let kind = match &token.kind {
                CssSyntaxKind::Ident(text) => Kind::Ident(store_text(source, text)),
                CssSyntaxKind::String(text) => Kind::String(store_text(source, text)),
                CssSyntaxKind::AtKeyword(text) => Kind::AtKeyword(store_text(source, text)),
                CssSyntaxKind::Function(text) => Kind::Function(store_text(source, text)),
                CssSyntaxKind::Number(number) => Kind::Number(store_slice(source, number)?),
                CssSyntaxKind::Dimension(number, unit) => {
                    Kind::Dimension(store_slice(source, number)?, store_text(source, unit))
                }
                CssSyntaxKind::Percentage(number) => Kind::Percentage(store_slice(source, number)?),
                CssSyntaxKind::Other => Kind::Other,
                CssSyntaxKind::Delim(c) => Kind::Delim(*c),
            };
            Some(Token {
                kind,
                bytes: token.bytes.clone(),
                close: token.close,
            })
        })
        .collect()
}

fn restore<'a>(source: &'a str, tokens: &[Token]) -> Vec<CssSyntaxToken<'a>> {
    let text = |text: &Text| match text {
        Text::Range(range) => std::borrow::Cow::Borrowed(&source[range.clone()]),
        Text::Owned(name) => std::borrow::Cow::Owned(name.to_string()),
    };
    tokens
        .iter()
        .map(|token| CssSyntaxToken {
            kind: match &token.kind {
                Kind::Ident(name) => CssSyntaxKind::Ident(text(name)),
                Kind::String(name) => CssSyntaxKind::String(text(name)),
                Kind::AtKeyword(name) => CssSyntaxKind::AtKeyword(text(name)),
                Kind::Function(name) => CssSyntaxKind::Function(text(name)),
                Kind::Number(range) => CssSyntaxKind::Number(&source[range.clone()]),
                Kind::Dimension(range, unit) => {
                    CssSyntaxKind::Dimension(&source[range.clone()], text(unit))
                }
                Kind::Percentage(range) => CssSyntaxKind::Percentage(&source[range.clone()]),
                Kind::Other => CssSyntaxKind::Other,
                Kind::Delim(c) => CssSyntaxKind::Delim(*c),
            },
            bytes: token.bytes.clone(),
            close: token.close,
        })
        .collect()
}

/// The tokens of `source`, from a recent identical text or from `tokenize`.
pub(crate) fn tokens<'a>(
    source: &'a str,
    tokenize: fn(&'a str) -> Vec<CssSyntaxToken<'a>>,
) -> Vec<CssSyntaxToken<'a>> {
    let cached = RECENT.with(|recent| {
        let mut recent = recent.borrow_mut();
        let index = recent.iter().position(|entry| *entry.source == *source)?;
        let entry = recent.remove(index)?;
        let tokens = restore(source, &entry.tokens);
        recent.push_front(entry);
        Some(tokens)
    });
    if let Some(tokens) = cached {
        return tokens;
    }
    let tokens = tokenize(source);
    if source.len() <= MAX_CACHED_LEN
        && let Some(stored) = store(source, &tokens)
    {
        RECENT.with(|recent| {
            let mut recent = recent.borrow_mut();
            if recent.len() >= MAX_ENTRIES {
                recent.pop_back();
            }
            recent.push_front(Entry {
                source: source.into(),
                tokens: stored,
            });
        });
    }
    tokens
}
