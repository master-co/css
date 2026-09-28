//! CSS custom media uses logical substitution. A resolved expression retains
//! media types separately from features; mixed types lower to nested @media
//! blocks rather than being spliced into an invalid feature expression.
use mastercss_lexer::{CssSyntaxKind as Kind, CssSyntaxToken, tokenize_css_syntax};
use mastercss_schema::MediaQueryExpr as Expr;

pub fn parse_custom_media_query(
    source: &str,
    resolve: &mut impl FnMut(&str) -> Result<Expr, String>,
) -> Result<Expr, String> {
    let tokens = tokenize_css_syntax(source);
    if tokens.len() == 1
        && let Kind::Ident(value) = &tokens[0].kind
    {
        if value.eq_ignore_ascii_case("true") {
            return Ok(Expr::True);
        }
        if value.eq_ignore_ascii_case("false") {
            return Ok(Expr::False);
        }
    }
    let mut depth = 0usize;
    for token in &tokens {
        if token.close.is_some() {
            depth += 1;
            if depth > 128 {
                return Err("Custom media nesting exceeds 128 levels".into());
            }
        }
        if matches!(token.kind, Kind::Delim(')' | ']' | '}')) {
            depth = depth.saturating_sub(1);
        }
    }
    let parser = MediaParser {
        source,
        tokens: &tokens,
    };
    parser.list(0, tokens.len(), resolve)
}

struct MediaParser<'a> {
    source: &'a str,
    tokens: &'a [CssSyntaxToken<'a>],
}
impl MediaParser<'_> {
    fn ident(&self, index: usize, name: &str) -> bool {
        self.tokens.get(index).is_some_and(
            |token| matches!(&token.kind, Kind::Ident(value) if value.eq_ignore_ascii_case(name)),
        )
    }
    fn top(&self, start: usize, end: usize) -> Result<Vec<usize>, String> {
        let mut result = Vec::new();
        let mut index = start;
        while index < end {
            result.push(index);
            let token = &self.tokens[index];
            if matches!(token.kind, Kind::Function(_) | Kind::Delim('(' | '[' | '{')) {
                let close = token
                    .close
                    .filter(|close| *close < end)
                    .ok_or("Unclosed media query")?;
                index = close + 1;
            } else {
                index += 1;
            }
        }
        Ok(result)
    }
    fn list(
        &self,
        start: usize,
        end: usize,
        resolve: &mut impl FnMut(&str) -> Result<Expr, String>,
    ) -> Result<Expr, String> {
        let mut queries = Vec::new();
        let mut cursor = start;
        for index in self.top(start, end)? {
            if self.tokens[index].kind == Kind::Delim(',') {
                queries.push(self.query(cursor, index, resolve)?);
                cursor = index + 1;
            }
        }
        queries.push(self.query(cursor, end, resolve)?);
        Ok(if queries.len() == 1 {
            queries.remove(0)
        } else {
            Expr::Or { queries }
        })
    }
    fn query(
        &self,
        start: usize,
        end: usize,
        resolve: &mut impl FnMut(&str) -> Result<Expr, String>,
    ) -> Result<Expr, String> {
        if start >= end {
            return Err("Empty media query".into());
        }
        let top = self.top(start, end)?;
        let qualifier = self.ident(start, "not") || self.ident(start, "only");
        let type_index = start + usize::from(qualifier);
        if let Some(Kind::Ident(name)) = self.tokens.get(type_index).map(|token| &token.kind) {
            if matches!(
                name.to_ascii_lowercase().as_str(),
                "not" | "only" | "and" | "or"
            ) || name.starts_with("--")
            {
                return Err("Invalid media type; custom aliases require (--name)".into());
            }
            let mut query = if name.eq_ignore_ascii_case("all") {
                Expr::True
            } else {
                Expr::MediaType {
                    name: name.to_ascii_lowercase(),
                }
            };
            if type_index + 1 < end {
                if !self.ident(type_index + 1, "and") {
                    return Err("Media types require and before a condition".into());
                }
                let condition = self.condition(type_index + 2, end, resolve)?;
                if self
                    .top(type_index + 2, end)?
                    .iter()
                    .any(|index| self.ident(*index, "or"))
                {
                    return Err("A media type requires parentheses around an or condition".into());
                }
                query = Expr::And {
                    queries: vec![query, condition],
                };
            }
            return Ok(if self.ident(start, "not") {
                Expr::Not {
                    query: Box::new(query),
                }
            } else {
                query
            });
        }
        if qualifier && self.ident(start, "only") {
            return Err("only requires a media type".into());
        }
        if top.is_empty() {
            return Err("Empty media query".into());
        }
        self.condition(start, end, resolve)
    }
    fn condition(
        &self,
        start: usize,
        end: usize,
        resolve: &mut impl FnMut(&str) -> Result<Expr, String>,
    ) -> Result<Expr, String> {
        let top = self.top(start, end)?;
        if top.is_empty() {
            return Err("Empty media condition".into());
        }
        if self.ident(start, "not") {
            if top.len() != 2 {
                return Err("not requires one parenthesized condition".into());
            }
            return Ok(Expr::Not {
                query: Box::new(self.atom(top[1], end, resolve)?),
            });
        }
        let mut queries = Vec::new();
        let mut operator = None;
        for (position, index) in top.iter().copied().enumerate() {
            if position % 2 == 0 {
                queries.push(self.atom(
                    index,
                    top.get(position + 1).copied().unwrap_or(end),
                    resolve,
                )?);
            } else {
                let next = if self.ident(index, "and") {
                    false
                } else if self.ident(index, "or") {
                    true
                } else {
                    return Err("Expected and/or in media condition".into());
                };
                if operator.is_some_and(|previous| previous != next) {
                    return Err("Mixed and/or media conditions require parentheses".into());
                }
                operator = Some(next);
            }
        }
        if top.len() % 2 == 0 {
            return Err("Missing media condition operand".into());
        }
        Ok(match operator {
            None => queries.remove(0),
            Some(true) => Expr::Or { queries },
            Some(false) => Expr::And { queries },
        })
    }
    fn atom(
        &self,
        start: usize,
        end: usize,
        resolve: &mut impl FnMut(&str) -> Result<Expr, String>,
    ) -> Result<Expr, String> {
        let token = &self.tokens[start];
        let close = token
            .close
            .filter(|close| *close + 1 == end)
            .ok_or("Media conditions require parentheses")?;
        if token.kind == Kind::Delim('(') {
            let inner = self.top(start + 1, close)?;
            if inner.len() == 1
                && let Kind::Ident(name) = &self.tokens[inner[0]].kind
                && name.starts_with("--")
            {
                return resolve(name);
            }
            if inner.first().is_some_and(|index| {
                matches!(
                    self.tokens[*index].kind,
                    Kind::Delim('(') | Kind::Function(_)
                ) || self.ident(*index, "not")
            }) {
                return self.condition(start + 1, close, resolve);
            }
            if inner.iter().any(|index| matches!(&self.tokens[*index].kind, Kind::Ident(name) if name.starts_with("--"))) {
                return Err("Custom media references must be boolean (--name), not a range or value".into());
            }
            if inner.is_empty() {
                return Err("Empty media feature".into());
            }
        } else if !matches!(token.kind, Kind::Function(_)) {
            return Err("Invalid media feature".into());
        }
        Ok(Expr::Feature {
            value: self.source[token.bytes.start..self.tokens[close].bytes.end].to_owned(),
        })
    }
}

/// Disjunction of conjunctions of native media queries. Each inner list is
/// nested, so negated media types work even alongside arbitrary feature logic.
pub fn custom_media_branches(query: &Expr) -> Result<Vec<Vec<String>>, String> {
    fn branches(
        query: &Expr,
        negate: bool,
        depth: usize,
        remaining: &mut usize,
    ) -> Result<Vec<Vec<String>>, String> {
        if *remaining == 0 {
            return Err("Custom media expansion exceeds 32768 expression nodes".into());
        }
        *remaining -= 1;
        if depth > 128 {
            return Err("Custom media nesting exceeds 128 levels".into());
        }
        Ok(match query {
            Expr::True => {
                if negate {
                    vec![]
                } else {
                    vec![vec![]]
                }
            }
            Expr::False => {
                if negate {
                    vec![vec![]]
                } else {
                    vec![]
                }
            }
            Expr::Feature { value } => vec![vec![if negate {
                format!("not {value}")
            } else {
                value.clone()
            }]],
            Expr::MediaType { name } => {
                let name = mastercss_lexer::css_escape(name);
                vec![vec![if negate { format!("not {name}") } else { name }]]
            }
            Expr::Not { query } => branches(query, !negate, depth + 1, remaining)?,
            Expr::And { queries } | Expr::Or { queries } => {
                let and = matches!(query, Expr::And { .. }) != negate;
                let mut result = if and { vec![Vec::new()] } else { Vec::new() };
                for query in queries {
                    let next = branches(query, negate, depth + 1, remaining)?;
                    let count = if and {
                        result.len().saturating_mul(next.len())
                    } else {
                        result.len().saturating_add(next.len())
                    };
                    if count > 4096 {
                        return Err("Custom media expansion exceeds 4096 branches".into());
                    }
                    if and {
                        result = result
                            .into_iter()
                            .flat_map(|prefix| {
                                next.iter().map(move |suffix| {
                                    let mut branch = prefix.clone();
                                    branch.extend(suffix.clone());
                                    branch
                                })
                            })
                            .collect();
                    } else {
                        result.extend(next);
                    }
                }
                result
            }
        })
    }
    branches(query, false, 0, &mut 32768)
}
