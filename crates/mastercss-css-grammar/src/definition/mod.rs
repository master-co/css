//! CSS Value Definition Syntax parser and generator.
//!
//! Parses the [CSS Value Definition Syntax](https://drafts.csswg.org/css-values/#value-defs)
//! (the meta-grammar used by CSS specs to define property value syntax) into an AST,
//! and can generate the syntax string back from the AST.
//!
//! The parsing algorithm and AST structure are based on the W3C CSS Values and Units
//! specification and informed by [css-tree](https://github.com/csstree/csstree)'s
//! `definition-syntax/parse.js` for compatibility.
//!
//! css-tree copyright: Copyright (C) 2016-2026 by Roman Dvornov, MIT License.
//! <https://github.com/csstree/csstree/blob/master/LICENSE>

pub mod ast;
pub mod generate;
mod scanner;

use ast::{Combinator, MultiplierInfo, SyntaxNode, TypeRange};
use scanner::Scanner;

/// Parse a CSS Value Definition Syntax string into an AST.
///
/// # Errors
///
/// Returns an error if the syntax string is malformed.
///
/// # Examples
///
/// ```
/// use mastercss_css_grammar::definition::parse;
///
/// let node = parse("<color>").unwrap();
/// let node = parse("<length> | <percentage>").unwrap();
/// let node = parse("[ <number> ]{1,4}").unwrap();
/// ```
pub fn parse(source: &str) -> Result<SyntaxNode, String> {
    let mut scanner = Scanner::new(source);
    let result = read_implicit_group(&mut scanner, None)?;

    if scanner.pos != source.len() {
        return Err(scanner.error("Unexpected input"));
    }

    // Reduce redundant groups with single group term
    if let SyntaxNode::Group { ref terms, .. } = result
        && terms.len() == 1
        && matches!(&terms[0], SyntaxNode::Group { .. })
    {
        return Ok(terms[0].clone());
    }

    Ok(result)
}

// --- Combinator precedence ---

fn combinator_precedence(c: &Combinator) -> u8 {
    match c {
        Combinator::Juxtaposition => 1,
        Combinator::DoubleAmpersand => 2,
        Combinator::DoubleBar => 3,
        Combinator::Bar => 4,
    }
}

// --- Multiplier reading ---

fn read_multiplier_range(scanner: &mut Scanner) -> Result<(u32, u32), String> {
    scanner.eat(b'{')?;
    scanner.skip_ws();

    let min_str = scanner.scan_number()?;
    scanner.skip_ws();

    let max;
    if scanner.char_code() == Some(b',') {
        scanner.pos += 1;
        scanner.skip_ws();

        if scanner.char_code() == Some(b'}') {
            max = 0; // unbounded
        } else {
            let max_str = scanner.scan_number()?;
            scanner.skip_ws();
            max = max_str.parse::<u32>().map_err(|e| e.to_string())?;
        }
    } else {
        max = min_str.parse::<u32>().map_err(|e| e.to_string())?;
    }

    scanner.eat(b'}')?;

    let min = min_str.parse::<u32>().map_err(|e| e.to_string())?;
    Ok((min, max))
}

fn read_multiplier(scanner: &mut Scanner) -> Result<Option<MultiplierInfo>, String> {
    let Some(code) = scanner.char_code() else {
        return Ok(None);
    };

    match code {
        b'*' => {
            scanner.pos += 1;
            Ok(Some(MultiplierInfo {
                min: 0,
                max: 0,
                comma: false,
            }))
        }
        b'+' => {
            scanner.pos += 1;
            Ok(Some(MultiplierInfo {
                min: 1,
                max: 0,
                comma: false,
            }))
        }
        b'?' => {
            scanner.pos += 1;
            Ok(Some(MultiplierInfo {
                min: 0,
                max: 1,
                comma: false,
            }))
        }
        b'#' => {
            scanner.pos += 1;

            if scanner.char_code() == Some(b'{') {
                let (min, max) = read_multiplier_range(scanner)?;
                Ok(Some(MultiplierInfo {
                    min,
                    max,
                    comma: true,
                }))
            } else if scanner.char_code() == Some(b'?') {
                // #? → optional comma-separated
                scanner.pos += 1;
                Ok(Some(MultiplierInfo {
                    min: 0,
                    max: 0,
                    comma: true,
                }))
            } else {
                Ok(Some(MultiplierInfo {
                    min: 1,
                    max: 0,
                    comma: true,
                }))
            }
        }
        b'{' => {
            let (min, max) = read_multiplier_range(scanner)?;
            Ok(Some(MultiplierInfo {
                min,
                max,
                comma: false,
            }))
        }
        _ => Ok(None),
    }
}

fn maybe_multiplied(scanner: &mut Scanner, node: SyntaxNode) -> Result<SyntaxNode, String> {
    let Some(info) = read_multiplier(scanner)? else {
        return Ok(node);
    };

    let multiplied = SyntaxNode::Multiplier {
        term: Box::new(node),
        info: info.clone(),
    };

    // Stacked multipliers: +# → nested
    if scanner.char_code() == Some(b'#')
        && scanner.char_code_at(scanner.pos.wrapping_sub(1)) == Some(b'+')
    {
        return maybe_multiplied(scanner, multiplied);
    }

    // Stacked multipliers: {}? → nested
    if scanner.char_code() == Some(b'?')
        && scanner.char_code_at(scanner.pos.wrapping_sub(1)) == Some(b'}')
    {
        return maybe_multiplied(scanner, multiplied);
    }

    Ok(multiplied)
}

fn maybe_token(scanner: &mut Scanner) -> Result<Option<SyntaxNode>, String> {
    let Some(ch) = scanner.peek_char() else {
        return Ok(None);
    };

    let node = SyntaxNode::Token {
        value: ch.to_string(),
    };
    Ok(Some(maybe_multiplied(scanner, node)?))
}

// --- Type/Property/Keyword readers ---

fn read_property(scanner: &mut Scanner) -> Result<SyntaxNode, String> {
    scanner.eat(b'<')?;
    scanner.eat(b'\'')?;

    let name = scanner.scan_word()?;

    scanner.eat(b'\'')?;
    scanner.eat(b'>')?;

    maybe_multiplied(scanner, SyntaxNode::Property { name })
}

fn read_range_value(scanner: &mut Scanner) -> Result<Option<String>, String> {
    let start = scanner.pos;

    if scanner.char_code() == Some(b'-') {
        scanner.pos += 1;
    }

    let rest = &scanner.source()[scanner.pos..];
    if rest.starts_with('\u{221E}') {
        scanner.pos += '\u{221E}'.len_utf8();
        return Ok(None); // ±∞
    }

    scanner.scan_number()?;

    // Consume optional unit suffix (e.g., "s" in "0s", "px" in "0px")
    while scanner
        .char_code()
        .is_some_and(|c| c.is_ascii_alphabetic() || c == b'%')
    {
        scanner.pos += 1;
    }

    Ok(Some(scanner.source()[start..scanner.pos].to_owned()))
}

fn read_type_range(scanner: &mut Scanner) -> Result<TypeRange, String> {
    scanner.eat(b'[')?;

    let min = read_range_value(scanner)?;
    scanner.skip_ws();
    scanner.eat(b',')?;
    scanner.skip_ws();
    let max = read_range_value(scanner)?;

    scanner.eat(b']')?;

    Ok(TypeRange { min, max })
}

fn read_type(scanner: &mut Scanner) -> Result<SyntaxNode, String> {
    scanner.eat(b'<')?;
    let name = scanner.scan_word()?;

    // <boolean-expr[...]>
    if name == "boolean-expr" {
        scanner.eat(b'[')?;
        let implicit_group = read_implicit_group(scanner, Some(b']'))?;
        scanner.eat(b']')?;
        scanner.eat(b'>')?;

        let term = if let SyntaxNode::Group { ref terms, .. } = implicit_group {
            if terms.len() == 1 {
                terms[0].clone()
            } else {
                implicit_group
            }
        } else {
            implicit_group
        };

        return maybe_multiplied(
            scanner,
            SyntaxNode::Boolean {
                term: Box::new(term),
            },
        );
    }

    // Check for function type: <foo()>
    let mut full_name = name;
    if scanner.char_code() == Some(b'(') && scanner.next_char_code() == Some(b')') {
        scanner.pos += 2;
        full_name = format!("{full_name}()");
    }

    // Check for range: <integer [0, 10]>
    let opts = if scanner
        .char_code_at(scanner.find_ws_end(scanner.pos))
        .is_some_and(|c| c == b'[')
    {
        scanner.skip_ws();
        Some(read_type_range(scanner)?)
    } else {
        None
    };

    scanner.eat(b'>')?;

    maybe_multiplied(
        scanner,
        SyntaxNode::Type {
            name: full_name,
            opts,
        },
    )
}

fn read_keyword_or_function(scanner: &mut Scanner) -> Result<SyntaxNode, String> {
    let name = scanner.scan_word()?;

    if scanner.char_code() == Some(b'(') {
        scanner.pos += 1;
        return Ok(SyntaxNode::Function { name });
    }

    maybe_multiplied(scanner, SyntaxNode::Keyword { name })
}

// --- Group reading ---

/// Intermediate token used during flat parsing before regrouping.
#[derive(Clone, Debug)]
enum FlatToken {
    Node(SyntaxNode),
    Combinator(Combinator),
    Spaces,
}

fn regroup_terms(
    terms: &mut Vec<FlatToken>,
    combinators_used: &mut Vec<Combinator>,
) -> Option<Combinator> {
    combinators_used.sort_by_key(combinator_precedence);
    combinators_used.dedup();

    let mut last_combinator = None;

    while !combinators_used.is_empty() {
        let combinator = combinators_used.remove(0);
        last_combinator = Some(combinator.clone());

        let mut i = 0;
        let mut subgroup_start: Option<usize> = None;

        while i < terms.len() {
            let is_this_combinator =
                matches!(&terms[i], FlatToken::Combinator(c) if *c == combinator);
            let is_other_combinator = matches!(&terms[i], FlatToken::Combinator(_));

            if is_this_combinator {
                if subgroup_start.is_none() {
                    subgroup_start = Some(if i > 0 { i - 1 } else { 0 });
                }
                terms.remove(i);
            } else if is_other_combinator {
                if let Some(start) = subgroup_start
                    && i - start > 1
                {
                    let group_terms: Vec<SyntaxNode> = terms[start..i]
                        .iter()
                        .filter_map(|t| {
                            if let FlatToken::Node(n) = t {
                                Some(n.clone())
                            } else {
                                None
                            }
                        })
                        .collect();

                    let group = FlatToken::Node(SyntaxNode::Group {
                        terms: group_terms,
                        combinator: combinator.clone(),
                        disallow_empty: false,
                        explicit: false,
                    });

                    terms.splice(start..i, [group]);
                    i = start + 1;
                }
                subgroup_start = None;
                i += 1;
            } else {
                i += 1;
            }
        }

        if let Some(start) = subgroup_start
            && !combinators_used.is_empty()
        {
            let group_terms: Vec<SyntaxNode> = terms[start..i]
                .iter()
                .filter_map(|t| {
                    if let FlatToken::Node(n) = t {
                        Some(n.clone())
                    } else {
                        None
                    }
                })
                .collect();

            let group = FlatToken::Node(SyntaxNode::Group {
                terms: group_terms,
                combinator: combinator.clone(),
                disallow_empty: false,
                explicit: false,
            });

            terms.splice(start..i, [group]);
        }
    }

    last_combinator
}

#[allow(clippy::too_many_lines)]
fn read_implicit_group(scanner: &mut Scanner, stop_char: Option<u8>) -> Result<SyntaxNode, String> {
    let mut combinators_used: Vec<Combinator> = Vec::new();
    let mut terms: Vec<FlatToken> = Vec::new();
    let mut prev_is_combinator = true; // Start as true to detect leading combinators
    let mut prev_is_function = false;
    let mut first_token = true;

    while stop_char.is_none_or(|sc| scanner.char_code() != Some(sc)) {
        if scanner.char_code().is_none() {
            break;
        }

        let token = if prev_is_function {
            let group = read_implicit_group(scanner, Some(b')'))?;
            // Don't eat ')' here - it's consumed by the caller
            Some(FlatToken::Node(group))
        } else {
            peek_token(scanner)?
        };

        let Some(token) = token else {
            break;
        };

        if matches!(token, FlatToken::Spaces) {
            continue;
        }

        if prev_is_function {
            prev_is_function = false;

            if let FlatToken::Node(SyntaxNode::Group {
                terms: ref fn_terms,
                combinator: ref comb,
                ..
            }) = token
            {
                if fn_terms.is_empty() {
                    continue;
                }

                if *comb == Combinator::Juxtaposition && fn_terms.len() > 1 {
                    let mut fn_terms_clone = fn_terms.clone();
                    while fn_terms_clone.len() > 1 {
                        combinators_used.push(Combinator::Juxtaposition);
                        terms.push(FlatToken::Combinator(Combinator::Juxtaposition));
                        terms.push(FlatToken::Node(fn_terms_clone.remove(0)));
                    }
                    let last_token = fn_terms_clone.remove(0);
                    prev_is_combinator = false;
                    prev_is_function = matches!(&last_token, SyntaxNode::Function { .. });
                    terms.push(FlatToken::Node(last_token));
                    first_token = false;
                    continue;
                }
            }

            let node = if let FlatToken::Node(SyntaxNode::Group {
                terms: mut fn_terms,
                combinator: fn_comb,
                disallow_empty: fn_de,
                explicit: fn_ex,
            }) = token
            {
                if fn_terms.len() == 1 {
                    FlatToken::Node(fn_terms.remove(0))
                } else {
                    FlatToken::Node(SyntaxNode::Group {
                        terms: fn_terms,
                        combinator: fn_comb,
                        disallow_empty: fn_de,
                        explicit: fn_ex,
                    })
                }
            } else {
                token
            };

            if !first_token && !prev_is_combinator {
                combinators_used.push(Combinator::Juxtaposition);
                terms.push(FlatToken::Combinator(Combinator::Juxtaposition));
            }
            prev_is_combinator = false;
            if let FlatToken::Node(ref n) = node {
                prev_is_function = matches!(n, SyntaxNode::Function { .. });
            }
            terms.push(node);
            first_token = false;
            continue;
        }

        match &token {
            FlatToken::Combinator(c) => {
                if first_token || prev_is_combinator {
                    return Err(scanner.error("Unexpected combinator"));
                }
                combinators_used.push(c.clone());
                prev_is_combinator = true;
            }
            FlatToken::Node(node) => {
                if !first_token && !prev_is_combinator {
                    combinators_used.push(Combinator::Juxtaposition);
                    terms.push(FlatToken::Combinator(Combinator::Juxtaposition));
                }
                prev_is_combinator = false;
                prev_is_function = matches!(node, SyntaxNode::Function { .. });
            }
            FlatToken::Spaces => unreachable!(),
        }

        terms.push(token);
        first_token = false;
    }

    if !first_token && prev_is_combinator {
        return Err(scanner.error("Unexpected combinator"));
    }

    let combinator =
        regroup_terms(&mut terms, &mut combinators_used).unwrap_or(Combinator::Juxtaposition);

    let final_terms: Vec<SyntaxNode> = terms
        .into_iter()
        .filter_map(|t| {
            if let FlatToken::Node(n) = t {
                Some(n)
            } else {
                None
            }
        })
        .collect();

    Ok(SyntaxNode::Group {
        terms: final_terms,
        combinator,
        disallow_empty: false,
        explicit: false,
    })
}

fn read_group(scanner: &mut Scanner) -> Result<SyntaxNode, String> {
    scanner.eat(b'[')?;
    let mut result = read_implicit_group(scanner, Some(b']'))?;
    scanner.eat(b']')?;

    if let SyntaxNode::Group {
        ref mut explicit,
        ref mut disallow_empty,
        ..
    } = result
    {
        *explicit = true;

        if scanner.char_code() == Some(b'!') {
            scanner.pos += 1;
            *disallow_empty = true;
        }
    }

    Ok(result)
}

fn peek_token(scanner: &mut Scanner) -> Result<Option<FlatToken>, String> {
    let Some(code) = scanner.char_code() else {
        return Ok(None);
    };

    match code {
        // Stop group scan / Prohibited tokens (multiplier starters)
        b']' | b'*' | b'+' | b'?' | b'#' | b'!' => Ok(None),

        b'[' => {
            let group = read_group(scanner)?;
            let node = maybe_multiplied(scanner, group)?;
            Ok(Some(FlatToken::Node(node)))
        }

        b'<' => {
            let node = if scanner.next_char_code() == Some(b'\'') {
                read_property(scanner)?
            } else {
                read_type(scanner)?
            };
            Ok(Some(FlatToken::Node(node)))
        }

        b'|' => {
            if scanner.next_char_code() == Some(b'|') {
                scanner.pos += 2;
                Ok(Some(FlatToken::Combinator(Combinator::DoubleBar)))
            } else {
                scanner.pos += 1;
                Ok(Some(FlatToken::Combinator(Combinator::Bar)))
            }
        }

        b'&' => {
            scanner.pos += 1;
            scanner.eat(b'&')?;
            Ok(Some(FlatToken::Combinator(Combinator::DoubleAmpersand)))
        }

        b',' => {
            scanner.pos += 1;
            Ok(Some(FlatToken::Node(SyntaxNode::Comma)))
        }

        b'\'' => {
            let value = scanner.scan_string()?;
            let node = maybe_multiplied(scanner, SyntaxNode::StringNode { value })?;
            Ok(Some(FlatToken::Node(node)))
        }

        b' ' | b'\t' | b'\n' | b'\r' | 0x0C => {
            scanner.scan_spaces();
            Ok(Some(FlatToken::Spaces))
        }

        b'@' => {
            if scanner.next_char_code().is_some_and(Scanner::is_name_char) {
                scanner.pos += 1;
                let name = scanner.scan_word()?;
                Ok(Some(FlatToken::Node(SyntaxNode::AtKeyword { name })))
            } else {
                Ok(maybe_token(scanner)?.map(FlatToken::Node))
            }
        }

        b'{' => {
            // LEFTCURLYBRACKET is allowed if next char isn't a digit
            if scanner.next_char_code().is_some_and(|c| c.is_ascii_digit()) {
                Ok(None) // Likely a disjoined multiplier
            } else {
                Ok(maybe_token(scanner)?.map(FlatToken::Node))
            }
        }

        _ => {
            if Scanner::is_name_char(code) {
                let node = read_keyword_or_function(scanner)?;
                Ok(Some(FlatToken::Node(node)))
            } else {
                Ok(maybe_token(scanner)?.map(FlatToken::Node))
            }
        }
    }
}
