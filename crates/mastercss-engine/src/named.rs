use super::utility::match_utility_filtered;
use super::{
    ManifestProjection, UtilityDefinition, UtilityEmit, UtilityMatch, UtilityMatcher,
    emit_declarations,
};

/// Select a family before looking up a token. Missing qualified tokens never
/// fall through to a shorter prefix, and exact named utilities reserve names.
pub(crate) fn matching_utilities(
    source: &str,
    manifest: &ManifestProjection,
) -> Vec<(usize, UtilityMatch)> {
    if let Some(found) = super::utility_matching::matching(source, manifest) {
        return found;
    }
    let native = is_native_declaration(source, manifest);
    if !native {
        for entries in [&manifest.static_utilities] {
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
                                |matcher| matches!(matcher, UtilityMatcher::Static { .. }),
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
        return token_candidates(source, prefix, manifest);
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
    let candidates = token_owners(source, prefix, manifest);
    let [index] = candidates.as_slice() else {
        return Vec::new();
    };
    match_utility_filtered(source, &manifest.utilities[*index], manifest, |matcher| {
        matches!(matcher, UtilityMatcher::Token { .. })
    })
    .map(|matched| vec![(*index, matched)])
    .unwrap_or_default()
}

/// Select namespace ownership before applying any sign or opacity capability.
/// Values, body shape and registration order cannot disambiguate a token key.
fn token_owners(source: &str, prefix: &str, manifest: &ManifestProjection) -> Vec<usize> {
    let Some(indexes) = manifest.token_utilities.get(prefix) else {
        return Vec::new();
    };
    let Some(raw) = source.strip_prefix(prefix).or_else(|| {
        source
            .strip_prefix('-')
            .and_then(|source| source.strip_prefix(prefix))
    }) else {
        return Vec::new();
    };
    let (value, _) = super::split_dynamic_value_state(raw);
    if value.is_empty()
        || value.starts_with('-')
        || super::utility::has_top_level_value_separator(&value)
    {
        return Vec::new();
    }
    let key = value.split_once('/').map_or(value.as_str(), |(key, _)| key);
    indexes
        .iter()
        .copied()
        .filter(|index| manifest.utilities[*index].variables.contains_key(key))
        .collect()
}

pub(crate) fn diagnostics(source: &str, manifest: &ManifestProjection) -> Vec<super::Diagnostic> {
    let diagnostic_source = source;
    let source = source.strip_suffix('!').unwrap_or(source);
    let error = |code, message: String| super::Diagnostic {
        phase: mastercss_schema::DiagnosticPhase::Match,
        severity: mastercss_schema::DiagnosticSeverity::Error,
        code,
        message,
        source: None,
        range: Some(mastercss_schema::SourceRange {
            start: 0,
            end: diagnostic_source.encode_utf16().count() as u32,
        }),
        notes: Vec::new(),
    };
    if let Some((_, property)) = super::native_declaration_head(source)
        && let Some(message) = super::removed_syntax::removed_recipe(&property)
    {
        return vec![error(super::ErrorCode::ClassSyntaxError, message)];
    }
    if let Some((_, property)) = super::native_declaration_head(source)
        && let Some(target) = super::removed_syntax::removed_raw_alias(&property)
    {
        return vec![error(
            super::ErrorCode::ClassSyntaxError,
            format!(
                "Raw property alias {property}: was removed; use {target}: (named tokens use their canonical prefixes)"
            ),
        )];
    }
    if let Some(message) = super::utility_matching::diagnostic(source, manifest) {
        return vec![error(super::ErrorCode::CssDirectiveError, message)];
    }
    if mastercss_lexer::decode_native_content(source).is_none() {
        return vec![error(
            super::ErrorCode::ClassSyntaxError,
            format!("Unbalanced or invalid Master class structure: {source}"),
        )];
    }
    let native_state = super::native_declaration_head(source)
        .map(|(colon, _)| super::split_dynamic_value_state(&source[colon + 1..]).1);
    for state in matching_utilities(source, manifest)
        .into_iter()
        .map(|(_, matched)| matched.state_token)
        .chain(native_state)
    {
        let selector = super::state::split_state_token(&state).0;
        if let Some((old, replacement)) = super::state::removed_selector(&selector) {
            return vec![error(
                super::ErrorCode::ClassSyntaxError,
                format!(":{old} was removed; use {replacement}"),
            )];
        }
        if !selector.is_empty()
            && super::state::selector_token_to_template(&selector, manifest)
                .is_none_or(|template| !mastercss_lexer::valid_selector_structure(&template))
        {
            return vec![error(
                super::ErrorCode::ClassSyntaxError,
                format!("Invalid selector structure: {selector}"),
            )];
        }
    }
    let mut explicit_layer = None;
    for token in super::state::split_state_token(source).1 {
        if !manifest.custom_media.contains_key(&format!("--{token}")) {
            let replacement = match token.as_str() {
                "base" => Some("@layer(base)"),
                "default" => Some("@layer(defaults)"),
                "component" => Some("@layer(components)"),
                "utility" => Some("@layer(utilities)"),
                "motion" => Some("@motion-safe"),
                "reduce-motion" => Some("@motion-reduce"),
                "print" => Some("@media(print)"),
                "screen" => Some("@media(screen)"),
                "all" => Some("@media(all)"),
                _ => None,
            };
            if let Some(replacement) = replacement {
                return vec![error(
                    super::ErrorCode::UnknownCondition,
                    format!("@{token} was removed; use {replacement}"),
                )];
            }
            if token == "speech" {
                return vec![error(
                    super::ErrorCode::UnknownCondition,
                    "@speech was removed; speech is an obsolete CSS media type".into(),
                )];
            }
        }
        if let Some(call) = super::class_apply::invocation(&token) {
            let result = call.and_then(|(name, arguments)| {
                super::expand_mixin_with_contents(&manifest.mixins, &name, &arguments, Some(&[]))
            });
            if let Err(message) = result {
                return vec![error(super::ErrorCode::CssDirectiveError, message)];
            }
            continue;
        }
        if let Some(layer) = super::resolve_layer_condition(&token, manifest) {
            if explicit_layer.is_some_and(|current| current != layer) {
                return vec![error(
                    super::ErrorCode::ClassSyntaxError,
                    "A class cannot select multiple layers".into(),
                )];
            }
            explicit_layer = Some(layer);
            continue;
        }
        if mastercss_lexer::query_requires_css(&token) {
            let (kind, body) = token.split_once('(').expect("recognized query");
            let prelude =
                mastercss_lexer::decode_native_content(body.strip_suffix(')').unwrap_or(body))
                    .unwrap_or_default();
            let mut diagnostic = error(
                super::ErrorCode::MasterQueryRequiresCss,
                format!(
                    "Complex @{kind} queries belong in CSS; define @custom-media or a mixin with @contents"
                ),
            );
            diagnostic.notes.push(format!(
                "@mixin --query-name {{ @{kind} {prelude} {{ @contents; }} }}"
            ));
            diagnostic.notes.push(
                "Use @apply(--query-name). Verify literal pipes in the CSS query before copying."
                    .into(),
            );
            return vec![diagnostic];
        }
        if let Some(query) = mastercss_lexer::parse_native_query(&token)
            && query.kind == "media"
            && query.prelude.contains("--")
            && let Err(message) = crate::parse_custom_media_query(&query.prelude, &mut |name| {
                manifest
                    .custom_media
                    .get(name)
                    .cloned()
                    .ok_or_else(|| format!("Undefined custom media {name}"))
            })
        {
            return vec![error(super::ErrorCode::UnknownCondition, message)];
        }
        if !manifest.custom_media.contains_key(&format!("--{token}"))
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
    if !matching_utilities(source, manifest).is_empty() {
        return Vec::new();
    }
    let prefix = token_prefix(source, manifest);
    if let Some(prefix) = prefix {
        let candidates = token_owners(source, prefix, manifest);
        if candidates.len() > 1 {
            let raw = source
                .strip_prefix(prefix)
                .or_else(|| {
                    source
                        .strip_prefix('-')
                        .and_then(|source| source.strip_prefix(prefix))
                })
                .unwrap_or_default();
            let (value, _) = super::split_dynamic_value_state(raw);
            let key = value.split_once('/').map_or(value.as_str(), |(key, _)| key);
            let mut definitions = Vec::new();
            let mut alternatives = Vec::new();
            for index in candidates {
                let utility = &manifest.utilities[index];
                let token = &utility.variables[key];
                let definition = manifest
                    .utility_definitions
                    .iter()
                    .find(|definition| definition.identity() == utility.id);
                let location = definition
                    .and_then(|definition| definition.recipe.source.as_ref())
                    .map(|source| {
                        let file = source.file.as_deref().unwrap_or("stylesheet");
                        if let Some(loc) = &source.loc {
                            format!(" at {file}:{}:{}", loc.start.line, loc.start.column)
                        } else {
                            format!(" at {file}:{}..{}", source.range.start, source.range.end)
                        }
                    })
                    .unwrap_or_default();
                definitions.push(format!(
                    "--{token} ({prefix}(--{}){location})",
                    &utility.variable_alias_refs[0][1..]
                ));
                // Suggest the branch's actual declarations, including recipes,
                // without inventing a second class prefix or choosing a branch.
                if let Some(matched) = match_utility_filtered(
                    &format!("{prefix}{key}"),
                    utility,
                    manifest,
                    |matcher| matches!(matcher, UtilityMatcher::Token { .. }),
                ) {
                    for (_, declarations, _, _) in
                        emit_declarations(utility, matched.value.as_deref(), false, manifest)
                    {
                        for declaration in super::split_top_level(&declarations, ';') {
                            if !declaration.is_empty() && !alternatives.contains(&declaration) {
                                alternatives.push(declaration);
                            }
                        }
                    }
                }
            }
            let mut diagnostic = error(
                super::ErrorCode::AmbiguousToken,
                format!(
                    "Ambiguous named token {source}; conflicting definitions: {}. Use explicit native declarations or distinct token keys",
                    definitions.join(", ")
                ),
            );
            diagnostic.notes = alternatives;
            return vec![diagnostic];
        }
    }
    if let Some(message) = retired_token_message(source, manifest) {
        return vec![error(super::ErrorCode::ClassSyntaxError, message)];
    }
    let Some(prefix) = prefix else {
        return Vec::new();
    };
    let raw = source
        .strip_prefix('-')
        .unwrap_or(source)
        .strip_prefix(prefix)
        .unwrap_or_default();
    vec![error(
        super::ErrorCode::UnknownToken,
        format!(
            "Unknown or unsupported token for {prefix}: {raw}; named tokens require a registered token, a supported sign, and a color-only opacity modifier"
        ),
    )]
}

/// Retirement metadata never participates in matching. A valid canonical class
/// or project mixin always wins, including token keys resembling an old prefix.
pub(crate) fn retired_token_message(source: &str, manifest: &ManifestProjection) -> Option<String> {
    if is_native_declaration(source, manifest) || !matching_utilities(source, manifest).is_empty() {
        return None;
    }
    let mut replacements = Vec::new();
    let families = manifest
        .token_families
        .iter()
        .filter(|family| family.argument == super::TokenFamilyArgument::Value)
        .filter_map(|family| {
            family
                .properties
                .first()
                .map(|property| (property.as_str(), family.prefix.as_str()))
        })
        .filter(|(property, prefix)| property != prefix)
        .chain([("text-stroke-color", "text-stroke")]);
    for (old, current) in families {
        for (positive, sign) in [
            (source, ""),
            (source.strip_prefix('-').unwrap_or(source), "-"),
        ] {
            if let Some(tail) = positive
                .strip_prefix(old)
                .and_then(|tail| tail.strip_prefix('-'))
            {
                let candidate = format!("{sign}{current}-{tail}");
                if !matching_utilities(&candidate, manifest).is_empty()
                    && !replacements.contains(&candidate)
                {
                    replacements.push(candidate);
                }
            }
        }
    }
    if !replacements.is_empty() {
        return Some(format!(
            "Token spelling {source} was removed; use the canonical family: {}",
            replacements.join(", ")
        ));
    }
    None
}

pub(crate) fn token_prefix<'a>(source: &str, manifest: &'a ManifestProjection) -> Option<&'a str> {
    // A registered declaration key owns its colon, even if a shorter named
    // family exists (font-family:mono must never mean font-family:hover).
    if let Some((key, _)) = source.split_once(':')
        && (is_native_declaration(source, manifest) || manifest.declaration_keys.contains(key))
    {
        return None;
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
    let Some((_, key)) = super::native_declaration_head(source) else {
        return false;
    };
    mastercss_schema::is_native_css_property(&key)
        || manifest.utilities.iter().any(|utility| {
            utility.native_fallback
                && utility
                    .id
                    .strip_prefix("native:")
                    .is_some_and(|id| id.split('\0').next() == Some(key.as_ref()))
        })
}

pub(crate) fn sort_key(
    utility: &UtilityDefinition,
    matched: &UtilityMatch,
    manifest: &ManifestProjection,
) -> String {
    if utility.utility_type == -2 && matched.matcher_type != super::UtilityMatcherType::Token {
        return String::new(); // Static/enum identities retain their existing semantic order.
    }
    emit_declarations(utility, matched.value.as_deref(), false, manifest)
        .into_iter()
        .map(|(_, declarations, _, _)| declarations)
        .collect::<Vec<_>>()
        .join(";")
}

pub(crate) fn allows_negative_token(utility: &UtilityDefinition) -> bool {
    let properties = match &utility.emit {
        UtilityEmit::Recipe { .. } => return false,
        UtilityEmit::Property { property } => vec![property.as_str()],
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
