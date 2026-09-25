use super::utility::match_utility_filtered;
use super::{
    ManifestProjection, UtilityDefinition, UtilityEmit, UtilityMatch, UtilityMatcher,
    builtin_key_alias, emit_declarations,
};

/// Select a family before looking up a token. Missing qualified tokens never
/// fall through to a shorter prefix, and exact named utilities reserve names.
pub(crate) fn matching_utilities(
    source: &str,
    manifest: &ManifestProjection,
) -> Vec<(usize, UtilityMatch)> {
    let native = is_native_declaration(source, manifest);
    if !native {
        for entries in [&manifest.static_utilities, &manifest.enum_utilities] {
            for end in std::iter::once(source.len())
                .chain(source.char_indices().map(|(index, _)| index).rev())
            {
                if super::utility::is_match_state_boundary(&source[end..])
                    && let Some(indexes) = entries.get(&source[..end])
                {
                    let matches = indexes
                        .iter()
                        .filter_map(|index| {
                            match_utility_filtered(
                                source,
                                &manifest.utilities[*index],
                                manifest,
                                |matcher| {
                                    matches!(
                                        matcher,
                                        UtilityMatcher::Static { .. }
                                            | UtilityMatcher::Pattern { .. }
                                    )
                                },
                            )
                            .map(|matched| (*index, matched))
                        })
                        .collect::<Vec<_>>();
                    if !matches.is_empty() {
                        return matches;
                    }
                }
            }
        }
    }

    if let Some(prefix) = token_prefix(source, manifest) {
        let mut matches = token_candidates(source, prefix, manifest);
        if matches.len() > 1 {
            let first = emitted_signature(&manifest.utilities[matches[0].0], &matches[0].1);
            if matches.iter().skip(1).any(|(index, matched)| {
                emitted_signature(&manifest.utilities[*index], matched) != first
            }) {
                return Vec::new();
            }
            matches.truncate(1);
        }
        return matches;
    }
    let Some((key, _)) = source.split_once(':') else {
        return Vec::new();
    };
    let indexes = manifest
        .raw_utilities
        .get(key)
        .map(Vec::as_slice)
        .unwrap_or_default();
    let has_explicit = indexes
        .iter()
        .any(|index| !manifest.utilities[*index].native_fallback);
    indexes
        .iter()
        .filter(|index| !has_explicit || !manifest.utilities[**index].native_fallback)
        .filter_map(|index| {
            match_utility_filtered(source, &manifest.utilities[*index], manifest, |matcher| {
                matches!(matcher, UtilityMatcher::Key { .. })
            })
            .map(|matched| (*index, matched))
        })
        .collect()
}

pub(crate) fn token_candidates(
    source: &str,
    prefix: &str,
    manifest: &ManifestProjection,
) -> Vec<(usize, UtilityMatch)> {
    let Some(indexes) = manifest.token_utilities.get(prefix) else {
        return Vec::new();
    };
    let has_explicit = indexes
        .iter()
        .any(|index| !manifest.utilities[*index].builtin_token);
    indexes
        .iter()
        .copied()
        .filter(|index| !has_explicit || !manifest.utilities[*index].builtin_token)
        .filter_map(|index| {
            match_utility_filtered(source, &manifest.utilities[index], manifest, |matcher| {
                matches!(matcher, UtilityMatcher::Token { .. })
            })
            .map(|matched| (index, matched))
        })
        .collect()
}

pub(crate) fn diagnostics(source: &str, manifest: &ManifestProjection) -> Vec<super::Diagnostic> {
    let source = source.strip_suffix('!').unwrap_or(source);
    if let Some(body) = source.strip_prefix('{')
        && let Some(close) = super::find_group_close(body)
    {
        return super::split_top_level(&body[..close], ';')
            .iter()
            .flat_map(|item| diagnostics(&format!("{item}{}", &body[close + 1..]), manifest))
            .collect();
    }
    let error = |code, message: String| super::Diagnostic {
        phase: mastercss_schema::DiagnosticPhase::Match,
        severity: mastercss_schema::DiagnosticSeverity::Error,
        code,
        message,
        source: None,
        range: Some(mastercss_schema::SourceRange {
            start: 0,
            end: source.encode_utf16().count() as u32,
        }),
        notes: Vec::new(),
    };
    if mastercss_lexer::decode_native_content(source).is_none() {
        return vec![error(
            super::ErrorCode::ClassSyntaxError,
            format!("Unbalanced or invalid Master class structure: {source}"),
        )];
    }
    for token in super::state::split_state_token(source).1 {
        if mastercss_lexer::query_requires_css(&token) {
            let (kind, body) = token.split_once('(').expect("recognized query");
            let prelude =
                mastercss_lexer::decode_native_content(body.strip_suffix(')').unwrap_or(body))
                    .unwrap_or_default();
            let mut diagnostic = error(
                super::ErrorCode::MasterQueryRequiresCss,
                format!(
                    "Complex @{kind} queries belong in CSS; define @custom-variant and use its name"
                ),
            );
            diagnostic.notes.push(format!(
                "@custom-variant query-name {{ @{kind} {prelude} {{ @slot; }} }}"
            ));
            diagnostic.notes.push(
                "Use @query-name. Verify literal pipes in the CSS query before copying.".into(),
            );
            return vec![diagnostic];
        }
        if !manifest.modes.iter().any(|mode| mode.name == token)
            && !manifest
                .variants
                .iter()
                .any(|variant| variant.token == format!("@{token}"))
            && super::render_condition_token(&token, manifest).is_none()
            && super::resolve_layer_condition(&token, manifest).is_none()
        {
            return vec![error(
                super::ErrorCode::UnknownCondition,
                format!(
                    "Unknown or invalid condition @{token}; define a named condition or use @media(...), @supports(...), or @container(...)"
                ),
            )];
        }
    }
    for (_, matched) in matching_utilities(source, manifest) {
        let selector = super::state::split_state_token(&matched.state_token).0;
        if !selector.is_empty()
            && super::state::selector_token_to_template(&selector, manifest)
                .is_some_and(|template| !mastercss_lexer::valid_selector_structure(&template))
        {
            return vec![error(
                super::ErrorCode::ClassSyntaxError,
                format!("Invalid selector structure: {selector}"),
            )];
        }
    }
    if !matching_utilities(source, manifest).is_empty() {
        return Vec::new();
    }
    let Some(prefix) = token_prefix(source, manifest) else {
        return Vec::new();
    };
    let candidates = token_candidates(source, prefix, manifest);
    let mut alternatives = Vec::new();
    let raw = source
        .strip_prefix('-')
        .unwrap_or(source)
        .strip_prefix(prefix)
        .unwrap_or_default();
    for (index, matched) in &candidates {
        for (_, declarations, _, _) in
            emit_declarations(&manifest.utilities[*index], matched.value.as_deref(), false)
        {
            for declaration in declarations.split(';') {
                if let Some((property, _)) = declaration.split_once(':') {
                    let alternative = format!(
                        "{}{property}-{raw}",
                        if source.starts_with('-') { "-" } else { "" }
                    );
                    if alternative != source
                        && !matching_utilities(&alternative, manifest).is_empty()
                        && !alternatives.contains(&alternative)
                    {
                        alternatives.push(alternative);
                    }
                }
            }
        }
    }
    vec![super::Diagnostic {
        phase: mastercss_schema::DiagnosticPhase::Match,
        severity: mastercss_schema::DiagnosticSeverity::Error,
        code: if candidates.len() > 1 {
            super::ErrorCode::AmbiguousToken
        } else {
            super::ErrorCode::UnknownToken
        },
        message: if candidates.len() > 1 {
            format!(
                "Ambiguous named token {source}; use an explicit utility name{}",
                if alternatives.is_empty() {
                    String::new()
                } else {
                    format!(": {}", alternatives.join(", "))
                }
            )
        } else {
            format!(
                "Unknown or unsupported token for {prefix}: {raw}; named tokens require a registered token, a supported sign, and a color-only opacity modifier"
            )
        },
        source: None,
        range: None,
        notes: alternatives,
    }]
}

pub(crate) fn token_prefix<'a>(source: &str, manifest: &'a ManifestProjection) -> Option<&'a str> {
    // A registered declaration key owns its colon, even if a shorter named
    // family exists (font-family:mono must never mean font-family:hover).
    if let Some((key, _)) = source.split_once(':') {
        let key = builtin_key_alias(key).unwrap_or(key);
        if is_native_declaration(source, manifest) || manifest.declaration_keys.contains(key) {
            return None;
        }
    }
    [source, source.strip_prefix('-').unwrap_or(source)]
        .into_iter()
        .flat_map(|source| {
            source.match_indices('-').filter_map(|(index, _)| {
                manifest
                    .token_utilities
                    .get_key_value(&source[..index + 1])
                    .map(|(key, _)| key.as_str())
            })
        })
        .max_by_key(|prefix| prefix.len())
}

fn is_native_declaration(source: &str, manifest: &ManifestProjection) -> bool {
    let Some((key, _)) = source.split_once(':') else {
        return false;
    };
    let key = builtin_key_alias(key).unwrap_or(key);
    mastercss_schema::is_native_css_property(key)
        || manifest.utilities.iter().any(|utility| {
            utility.native_fallback
                && utility
                    .id
                    .strip_prefix("native:")
                    .is_some_and(|id| id.split('\0').next() == Some(key))
        })
}

fn emitted_signature(utility: &UtilityDefinition, matched: &UtilityMatch) -> String {
    format!(
        "{:?}:{:?}",
        utility.layer,
        emit_declarations(utility, matched.value.as_deref(), false)
    )
}

pub(crate) fn sort_key(utility: &UtilityDefinition, matched: &UtilityMatch) -> String {
    if utility.utility_type == -2 && matched.matcher_type != super::UtilityMatcherType::Token {
        return String::new(); // Static/enum identities retain their existing semantic order.
    }
    emit_declarations(utility, matched.value.as_deref(), false)
        .into_iter()
        .map(|(_, declarations, _, _)| declarations)
        .collect::<Vec<_>>()
        .join(";")
}

pub(crate) fn allows_negative_token(utility: &UtilityDefinition) -> bool {
    let properties = match &utility.emit {
        UtilityEmit::Property { property } => vec![property.as_str()],
        UtilityEmit::Static { rules } => rules
            .iter()
            .flat_map(|rule| rule.declarations.keys().map(String::as_str))
            .collect(),
        UtilityEmit::Template { declarations } => declarations.keys().map(String::as_str).collect(),
        UtilityEmit::Declarations { declarations } => declarations
            .iter()
            .filter_map(|declaration| declaration.split_once(':').map(|(property, _)| property))
            .collect(),
    };
    !properties.is_empty()
        && properties.iter().all(|property| {
            property.starts_with("margin")
                || property.starts_with("scroll-margin")
                || property.starts_with("inset")
                || matches!(
                    *property,
                    "outline-offset"
                        | "text-underline-offset"
                        | "mask-position"
                        | "perspective-origin"
                        | "transform-origin"
                        | "cx"
                        | "cy"
                        | "x"
                        | "y"
                        | "stroke-dashoffset"
                        | "top"
                        | "right"
                        | "bottom"
                        | "left"
                        | "translate"
                        | "rotate"
                        | "letter-spacing"
                        | "word-spacing"
                        | "text-indent"
                        | "background-position"
                        | "object-position"
                        | "animation-delay"
                        | "transition-delay"
                        | "order"
                        | "z-index"
                )
        })
}
