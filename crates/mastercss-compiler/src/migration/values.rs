use super::{Family, Migration, token_class};

impl Migration {
    pub(super) fn rewrite_value(
        &self,
        value: &str,
        family: Option<&Family>,
        resolution: bool,
    ) -> Result<String, String> {
        self.rewrite_segment(value, family, resolution)
    }

    fn rewrite_segment(
        &self,
        value: &str,
        family: Option<&Family>,
        resolution: bool,
    ) -> Result<String, String> {
        let mut result = String::new();
        let mut index = 0;
        while index < value.len() {
            let character = value[index..].chars().next().unwrap();
            if matches!(character, '\'' | '"') {
                let end = quoted_end(value, index).ok_or("Unterminated quoted value")?;
                result.push_str(&value[index..end]);
                index = end;
                continue;
            }
            if character == '\\' {
                return Err("Escaped CSS values require manual migration".into());
            }
            if character.is_alphanumeric() || matches!(character, '-' | '.' | '$' | '#' | '_') {
                let start = index;
                let numeric = character.is_ascii_digit()
                    || character == '.'
                    || (character == '-'
                        && value[index + 1..]
                            .starts_with(|c: char| c.is_ascii_digit() || c == '.'));
                index += character.len_utf8();
                while index < value.len() {
                    let character = value[index..].chars().next().unwrap();
                    if numeric && character == '-' {
                        break;
                    }
                    if !character.is_alphanumeric()
                        && !matches!(character, '-' | '.' | '$' | '#' | '_' | '/' | '%')
                    {
                        break;
                    }
                    index += character.len_utf8();
                }
                let token = &value[start..index];
                if value[index..].starts_with('(') {
                    let end = closing(value, index, '(', ')').ok_or("Unbalanced CSS function")?;
                    if token == "url" {
                        result.push_str(&value[start..=end]);
                    } else if token == "var" {
                        // The custom-property identifier is literal; only its
                        // fallback participates in RC value and unit rewriting.
                        if let Some(comma) = value[index + 1..end].find(',') {
                            let fallback = index + 2 + comma;
                            result.push_str(&value[start..fallback]);
                            result.push_str(&self.rewrite_segment(
                                &value[fallback..end],
                                family,
                                resolution,
                            )?);
                            result.push(')');
                        } else {
                            result.push_str(&value[start..=end]);
                        }
                    } else {
                        result.push_str(token);
                        result.push('(');
                        result.push_str(&self.rewrite_segment(
                            &value[index + 1..end],
                            family,
                            (resolution && matches!(token, "calc" | "min" | "max" | "clamp"))
                                || token == "image-set"
                                || token == "-webkit-image-set",
                        )?);
                        result.push(')');
                    }
                    index = end + 1;
                    continue;
                }
                if let Some(resolved) = self.resolve_component(token, family) {
                    if resolved.contains(' ') && resolved.contains(['\'', '"']) {
                        return Err(
                            "Inline token containing quoted whitespace requires manual migration"
                                .into(),
                        );
                    }
                    result.push_str(&resolved.replace(' ', "|"));
                } else if token.contains('$') {
                    return Err(format!(
                        "Unknown RC variable shortcut {token}; recover its original definition"
                    ));
                } else if let Some(number) = token
                    .strip_suffix('x')
                    .filter(|_| !resolution)
                    .and_then(|number| number.parse::<f64>().ok())
                {
                    if !number.is_finite() {
                        return Err("Non-finite RC length".into());
                    }
                    result.push_str(&format!("{}rem", number * self.base_unit / self.root_size));
                } else {
                    result.push_str(token);
                }
            } else {
                result.push(character);
                index += character.len_utf8();
            }
        }
        Ok(result)
    }

    fn resolve_component(&self, token: &str, family: Option<&Family>) -> Option<String> {
        let explicit = token.strip_prefix('$').or_else(|| token.strip_prefix("-$"));
        let global = if let Some(name) = explicit {
            format!("{}{name}", if token.starts_with('-') { "-" } else { "" })
        } else {
            token.into()
        };
        let candidates = family
            .filter(|_| explicit.is_none())
            .map(|family| token_class(&family.resolver, token, ""))
            .into_iter()
            .chain(std::iter::once(token_class(
                "migration-global",
                &global,
                "",
            )));
        for class in candidates {
            if let Some(value) = self
                .rules(&self.helper, &class)
                .first()
                .and_then(|rule| rule.declarations.values().next())
                .and_then(|value| value.as_str())
            {
                return Some(value.into());
            }
        }
        None
    }
}

fn quoted_end(source: &str, start: usize) -> Option<usize> {
    let quote = source[start..].chars().next()?;
    let mut escaped = false;
    for (offset, character) in source[start + 1..].char_indices() {
        if escaped {
            escaped = false;
        } else if character == '\\' {
            escaped = true;
        } else if character == quote {
            return Some(start + offset + 2);
        }
    }
    None
}

fn closing(source: &str, start: usize, open: char, close: char) -> Option<usize> {
    let mut depth = 0;
    let mut index = start;
    while index < source.len() {
        let character = source[index..].chars().next()?;
        if matches!(character, '\'' | '"') {
            index = quoted_end(source, index)?;
            continue;
        }
        if character == open {
            depth += 1;
        }
        if character == close {
            depth -= 1;
            if depth == 0 {
                return Some(index);
            }
        }
        index += character.len_utf8();
    }
    None
}

pub(super) fn group_parts(source: &str) -> Option<(Vec<&str>, &str)> {
    let end = closing(source, 0, '{', '}')?;
    let mut parts = Vec::new();
    let mut index = 1;
    let mut start = 1;
    while index < end {
        let character = source[index..].chars().next()?;
        if matches!(character, '\'' | '"') {
            index = quoted_end(source, index)?;
            continue;
        }
        if matches!(character, '(' | '[' | '{') {
            let close = match character {
                '(' => ')',
                '[' => ']',
                _ => '}',
            };
            index = closing(source, index, character, close)? + 1;
            continue;
        }
        if character == ';' {
            parts.push(&source[start..index]);
            start = index + 1;
        }
        index += character.len_utf8();
    }
    parts.push(&source[start..end]);
    Some((parts, &source[end + 1..]))
}

/// Conservative source audit, deliberately separate from class extraction.
/// These constructs need project knowledge that a literal-only rewrite lacks.
pub(super) fn audit_source(source: &str) -> Vec<String> {
    let mut notes = Vec::new();
    if [
        "querySelector",
        "getElementsByClassName",
        "classList.",
        "matches(",
        "closest(",
    ]
    .iter()
    .any(|needle| source.contains(needle))
    {
        notes.push("Selector or class-name API reference requires manual migration and cross-file verification".into());
    }
    let dynamic = [
        "class=",
        "class =",
        "className=",
        "className =",
        "class:list=",
        ":class=",
        "className:",
        "class:",
    ]
    .iter()
    .any(|needle| {
        source.match_indices(needle).any(|(start, _)| {
            let value = source[start + needle.len()..].trim_start();
            if let Some(value) = value.strip_prefix('{') {
                let value = value.trim_start();
                if !value.starts_with(['\'', '"', '`']) {
                    return true;
                }
                let end = quoted_end(value, 0);
                return end.is_none_or(|end| {
                    value[..end].contains("${") || !value[end..].trim_start().starts_with('}')
                });
            }
            value.starts_with('`')
                && quoted_end(value, 0).is_none_or(|end| value[..end].contains("${"))
        })
    });
    let helper_expression = ["clsx(", "cva(", "ctl(", "classVariant(", "classnames("]
        .iter()
        .any(|helper| source.contains(helper))
        && (source.contains('+') || source.contains("${"));
    let bound_attribute = [":class=", "v-bind:class=", "[class]=", "[ngClass]="]
        .iter()
        .any(|binding| source.contains(binding));
    if dynamic
        || helper_expression
        || bound_attribute
        || source.contains("${") && source.contains([':', '-'])
    {
        notes.push("Dynamic class construction requires manual migration; enumerate complete class names before applying edits".into());
    }
    notes
}
