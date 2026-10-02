//! Explicit migration from the final @utility contract (Manifest v2/language 4).
//! These frozen spellings are never used by normal compilation or runtime.
use super::stylesheets::{RcStylesheetMigration, add_edit};
use super::{RcClassMigration, RcMigrationProfile, RcMigrationRequest, RcMigrationResult, error};
use mastercss_lexer::{CssSyntaxKind as Kind, collect_css_syntax_statements, tokenize_css_syntax};
use mastercss_schema::MixinParameter;
use serde_json::Value;

const PARAMETER_RECIPES: &[&str] = &[
    "grid-cols",
    "grid-rows",
    "grid-col-span",
    "grid-row-span",
    "clamp-lines",
];

fn boundary(value: &str) -> bool {
    value.is_empty() || value.starts_with([':', '@', '!', '>', '+', '~', '.', '[', '_'])
}

fn raw_property(key: &str) -> &str {
    // bg: was the native background shorthand; bg-* is now background-color.
    if key == "bg" {
        return "background";
    }
    super::legacy_registry::builtin_token_aliases()
        .iter()
        .find_map(|(alias, property)| (*alias == key).then_some(*property))
        .unwrap_or(key)
}

fn static_name(source: &str) -> (&str, &str) {
    let tokens = tokenize_css_syntax(source);
    let Some(first) = tokens.first() else {
        return (source, "");
    };
    if matches!(first.kind, Kind::Ident(_)) {
        (&source[..first.bytes.end], &source[first.bytes.end..])
    } else {
        (source, "")
    }
}

pub(super) fn class(source: &str, saved: &Value) -> Result<String, String> {
    mastercss_lexer::decode_native_content(source)
        .ok_or("Invalid class structure; review manually")?;
    if source.contains("${") || source.contains("{{") {
        return Err("Dynamic class construction requires manual migration; enumerate complete mixin calls or use native CSS variables".into());
    }
    let (name, suffix) = static_name(source);
    if let Some(key) = name.strip_prefix("text-") {
        let contains = |namespace: &str| {
            saved["variables"][namespace]
                .as_array()
                .into_iter()
                .flatten()
                .any(|entry| entry["key"] == key)
        };
        if contains("color-text") {
            if contains("font-size") {
                return Err(format!(
                    "{name} matches both typography and color tokens in the saved manifest; choose text-{key} or fg-text-{key} explicitly"
                ));
            }
            return Ok(format!("fg-text-{key}{suffix}"));
        }
    }
    // A native property colon keeps its declaration meaning even when the
    // old preset also supplied a bare fixed class (flex, top, left, ...).
    if boundary(suffix)
        && !(suffix.starts_with(':') && mastercss_schema::is_native_css_property(name))
        && let Some((_, replacement)) = super::removed_static::REMOVED_STATIC_CLASSES
            .iter()
            .find(|(old, _)| *old == name)
    {
        // A saved custom definition of a preset spelling must be reviewed.
        for utility in saved["utilities"]
            .as_array()
            .into_iter()
            .flatten()
            .filter(|utility| {
                utility["matchers"]
                    .as_array()
                    .into_iter()
                    .flatten()
                    .any(|matcher| matcher["type"] == "static" && matcher["name"] == name)
            })
        {
            let rules = utility["emit"]["rules"].as_array();
            let (property, value) = replacement.split_once(':').expect("native declaration");
            if !rules.is_some_and(|rules| {
                rules.len() == 1
                    && rules[0]["declarations"]
                        .as_object()
                        .is_some_and(|declarations| {
                            declarations.len() == 1
                                && declarations
                                    .get(property)
                                    .and_then(Value::as_str)
                                    .is_some_and(|saved| {
                                        saved.split_whitespace().collect::<Vec<_>>().join("|")
                                            == value
                                    })
                        })
            }) {
                return Err(format!(
                    "{name} overrides a preset spelling; retain its definition as @utility {name} and review its use"
                ));
            }
        }
        return Ok(format!("{replacement}{suffix}"));
    }
    let Some((key, rest)) = source.split_once(':') else {
        return Ok(source.into());
    };
    if key.contains('(') {
        return Ok(source.into());
    }
    let (value, suffix) = super::values::split_rc_value_state(rest);
    let custom = saved["utilities"]
        .as_array()
        .into_iter()
        .flatten()
        .any(|utility| {
            utility["matchers"]
                .as_array()
                .into_iter()
                .flatten()
                .any(|matcher| {
                    matcher["type"] == "key"
                        && matcher["keys"]
                            .as_array()
                            .into_iter()
                            .flatten()
                            .any(|name| name == key)
                })
        });
    if PARAMETER_RECIPES.contains(&key)
        || (custom && !mastercss_schema::is_native_css_property(raw_property(key)))
    {
        let parameter = MixinParameter {
            name: "--value".into(),
            syntax: if PARAMETER_RECIPES.contains(&key) {
                Some(mastercss_schema::MixinParameterSyntax::Integer)
            } else {
                None
            },
            default: None,
            source: None,
        };
        mastercss_engine::validate_mixin_argument(&parameter, &value.replace('|', " ")).map_err(|_| format!("{source} requires manual migration: mixin arguments must be static; move the declarations to native CSS when using var(), attr(), or runtime values"))?;
        if PARAMETER_RECIPES.contains(&key) && value.parse::<i64>().is_ok_and(|value| value <= 0) {
            return Err(format!("{key} requires a positive integer"));
        }
        return Ok(format!("{key}({value}){suffix}"));
    }
    if key == "text" {
        return Err("text:value was removed; choose font-size:value for one declaration, or define a --text-name token and use text-name. Review the previous line-height and letter-spacing".into());
    }
    Ok(format!("{}:{value}{suffix}", raw_property(key)))
}

fn stylesheet(source: &str) -> RcStylesheetMigration {
    let mut result = RcStylesheetMigration {
        is_entry: mastercss_lexer::has_master_css_manifest_entrypoint(source),
        edits: Vec::new(),
        notes: Vec::new(),
    };
    let tokens = tokenize_css_syntax(source);
    let statements = collect_css_syntax_statements(&tokens);
    for statement in &statements {
        let first = &tokens[statement.tokens.start];
        if !matches!(&first.kind, Kind::AtKeyword(name) if name.eq_ignore_ascii_case("utility")) {
            continue;
        }
        if statement.parent.is_some() {
            result.notes.push(
                "Nested @utility requires manual restructuring into top-level @utility".into(),
            );
            continue;
        }
        let Some(open) = tokens
            .get(statement.tokens.end)
            .filter(|token| token.kind == Kind::Delim('{'))
        else {
            continue;
        };
        let Some(close) = open.close.map(|index| &tokens[index]) else {
            continue;
        };
        let prelude = source[first.bytes.end..open.bytes.start].trim();
        if let Some(after) = value_family(prelude, &source[open.bytes.end..close.bytes.start]) {
            add_edit(
                &mut result,
                source,
                first.bytes.start,
                close.bytes.end,
                after,
            );
            continue;
        }
        let (name, parameterized) = prelude
            .strip_suffix(":*")
            .map_or((prelude, false), |name| (name, true));
        if !mastercss_lexer::decode_utility_name(name).is_some() {
            result.notes.push(format!("Migrate @utility {prelude} manually: create a same-name primary token (or alias token), a single <string> token placeholder, and var(ident(...)); preserve namespace priority explicitly"));
            continue;
        }
        if parameterized && mastercss_schema::is_native_css_property(raw_property(name)) {
            result.notes.push(format!("@utility {prelude} overrides a native property. Use a distinct utility name and update callers; property:value always keeps its native meaning"));
            continue;
        }
        let mut body = source[open.bytes.end..close.bytes.start].to_owned();
        let body_tokens = tokenize_css_syntax(&body);
        let mut replacements = Vec::new();
        let mut index = 0;
        while index < body_tokens.len() {
            let token = &body_tokens[index];
            if let Kind::Function(function) = &token.kind {
                if function.eq_ignore_ascii_case("url") {
                    index = token.close.unwrap_or(index) + 1;
                    continue;
                }
                if function == "--master-value" {
                    if !parameterized {
                        result
                            .notes
                            .push(format!("--master-value() has no parameter in {name}"));
                        break;
                    }
                    if let Some(end) = token.close {
                        replacements.push(token.bytes.start..body_tokens[end].bytes.end);
                    }
                }
            }
            index += 1;
        }
        for range in replacements.into_iter().rev() {
            body.replace_range(range, "var(--value)");
        }
        let header = if parameterized {
            let syntax = if PARAMETER_RECIPES.contains(&name) {
                " <integer>"
            } else {
                ""
            };
            format!("@utility {name}(--value{syntax})")
        } else {
            format!("@utility {name}")
        };
        let after = format!("{header} {{{body}}}");
        if let Err(error) =
            crate::compile_css_directives(&after, &crate::CompileNativeCssOptions::default())
        {
            result.notes.push(format!("Review {name}: {error}"));
            continue;
        }
        add_edit(
            &mut result,
            source,
            first.bytes.start,
            close.bytes.end,
            after,
        );
    }
    result
}

// Recognize one old namespace and one forwarded native declaration. Keep
// ambiguous namespace precedence in the manual migration path.
fn value_family(prelude: &str, body: &str) -> Option<String> {
    let tokens = tokenize_css_syntax(prelude);
    let [prefix, star, from, namespace, namespace_star, close] = tokens.as_slice() else {
        return None;
    };
    let (
        Kind::Ident(prefix),
        Kind::Delim('*'),
        Kind::Function(from),
        Kind::Ident(namespace),
        Kind::Delim('*'),
        Kind::Delim(')'),
    ) = (
        &prefix.kind,
        &star.kind,
        &from.kind,
        &namespace.kind,
        &namespace_star.kind,
        &close.kind,
    )
    else {
        return None;
    };
    if !from.eq_ignore_ascii_case("from") {
        return None;
    }
    let name = prefix.strip_suffix('-')?;
    let namespace = namespace.strip_prefix("--")?.strip_suffix('-')?;
    let body = body.replace("--master-value()", "var(--value)");
    let definition = crate::mixins::definition("--migration(--value)", &body).ok()?;
    let (_, property) = mastercss_engine::direct_value_mixin(&definition)?;
    Some(format!(
        "@utility {name}-(--{namespace}){{{property}:var(--{namespace})}}"
    ))
}

pub(super) fn migrate(
    request: &RcMigrationRequest,
) -> Result<RcMigrationResult, crate::CompilerError> {
    if request.manifest["version"] != 2 || request.manifest["languageVersion"] != 4 {
        return Err(error(
            "rc-mixins requires the saved Manifest v2 / languageVersion 4",
        ));
    }
    if request.source_version.trim().is_empty() {
        return Err(error("Record the source package version before migration"));
    }
    let target = mastercss_engine::EngineSession::create(&request.target_manifest.to_string())
        .map_err(|error| super::error(error.to_string()))?;
    let class_lists = request
        .class_lists
        .iter()
        .map(|list| {
            list.iter()
                .map(|before| match class(before, &request.manifest) {
                    Ok(after) => {
                        let inspection = target.inspect(&after).ok();
                        let diagnostics = inspection
                            .map(|inspection| inspection.diagnostics)
                            .unwrap_or_default();
                        let invalid_syntax = diagnostics.iter().any(|diagnostic| {
                            diagnostic.code == mastercss_schema::ErrorCode::ClassSyntaxError
                        });
                        let notes = diagnostics
                            .into_iter()
                            .map(|diagnostic| diagnostic.message)
                            .collect::<Vec<_>>();
                        RcClassMigration {
                            before: before.clone(),
                            status: if !notes.is_empty() {
                                "review"
                            } else if before == &after {
                                "unchanged"
                            } else {
                                "replace"
                            },
                            after: (!invalid_syntax).then_some(after),
                            notes,
                        }
                    }
                    Err(note) => RcClassMigration {
                        before: before.clone(),
                        after: None,
                        status: "review",
                        notes: vec![note],
                    },
                })
                .collect()
        })
        .collect();
    Ok(RcMigrationResult {
        version: 2, from: RcMigrationProfile::RcMixins, source_version: request.source_version.clone(), configuration_css: String::new(), notes: Vec::new(),
        behavior_changes: vec!["Raw aliases and fixed preset aliases now use full native properties; check overlapping declarations because recipe/property priority differs".into(), "text-* is typography only. Its explicit line-height and letter-spacing are intentional visual changes; review wrapping on desktop and mobile".into()],
        class_lists, stylesheets: request.stylesheets.iter().map(|source| stylesheet(source)).collect(), documents: request.documents.iter().map(|source| super::values::audit_source(source)).collect(),
    })
}
