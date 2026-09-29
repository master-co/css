//! Frozen Manifest v3 / language 5 preset migration. Never consulted at runtime.
use super::{RcClassMigration, RcMigrationRequest, RcMigrationResult, error};
use mastercss_schema::{MixinDefinition, MixinNode, MixinValuePart};
use serde_json::Value;
use std::collections::HashSet;

const REMOVED: &[(&str, &[(&str, &str)])] = &[
    (
        "fit",
        &[("width", "fit-content"), ("height", "fit-content")],
    ),
    ("full", &[("width", "100%"), ("height", "100%")]),
    (
        "center",
        &[
            ("left", "0"),
            ("right", "0"),
            ("margin-left", "auto"),
            ("margin-right", "auto"),
        ],
    ),
    (
        "middle",
        &[
            ("top", "0"),
            ("bottom", "0"),
            ("margin-top", "auto"),
            ("margin-bottom", "auto"),
        ],
    ),
    (
        "round",
        &[("border-radius", "50%"), ("aspect-ratio", "1/1")],
    ),
];

fn preset_body(definition: &MixinDefinition, expected: &[(&str, &str)]) -> bool {
    definition.parameters.is_empty() && definition.body.len() == expected.len()
        && definition.body.iter().zip(expected).all(|(node, (key, text))| {
            matches!(node, MixinNode::Declaration { property, value, .. }
                if property == key && value.iter().all(|part| matches!(part, MixinValuePart::Text {..}))
                && value.iter().filter_map(|part| match part { MixinValuePart::Text {value} => Some(value.as_str()), _ => None }).collect::<String>().split_whitespace().collect::<String>() == *text)
        })
}

struct Saved {
    mixins: Vec<MixinDefinition>,
    tokens: HashSet<String>,
}

impl Saved {
    fn new(manifest: &Value) -> Result<Self, crate::CompilerError> {
        let mixins = serde_json::from_value(
            manifest
                .get("mixins")
                .cloned()
                .unwrap_or_else(|| serde_json::json!([])),
        )
        .map_err(|cause| error(format!("Invalid saved mixins: {cause}")))?;
        let mut tokens = HashSet::new();
        for (namespace, values) in manifest["variables"].as_object().into_iter().flatten() {
            for value in values.as_array().into_iter().flatten() {
                if value["value"] == false {
                    continue;
                }
                let key = value["key"].as_str().unwrap_or_default();
                tokens.insert(
                    value["name"]
                        .as_str()
                        .map(str::to_owned)
                        .unwrap_or_else(|| {
                            if namespace.is_empty() {
                                key.into()
                            } else if key.is_empty() {
                                namespace.clone()
                            } else {
                                format!("{namespace}-{key}")
                            }
                        }),
                );
            }
        }
        Ok(Self { mixins, tokens })
    }

    fn class(&self, source: &str) -> Result<String, String> {
        mastercss_lexer::decode_native_content(source)
            .ok_or("Invalid class structure; review manually")?;
        if source.contains("${") || source.contains("{{") {
            return Err("Enumerate complete classes before migrating dynamic construction".into());
        }
        let (head, suffix) = super::values::split_rc_value_state(source);
        // Preserve native declarations, including properties whose names overlap mixins.
        if suffix.starts_with(':') && mastercss_schema::is_native_css_property(&head) {
            return Ok(source.into());
        }
        let bare = head.strip_suffix("()").unwrap_or(&head);
        if let Some(definition) = self.mixins.iter().rev().find(|definition| {
            definition.name == format!("--{bare}") && definition.parameters.is_empty()
        }) {
            if let Some((_, declarations)) = REMOVED.iter().find(|(name, _)| *name == bare)
                && preset_body(definition, declarations)
            {
                return Ok(declarations
                    .iter()
                    .map(|(property, value)| format!("{property}:{value}{suffix}"))
                    .collect::<Vec<_>>()
                    .join(" "));
            }
            return Ok(source.into());
        }
        let positive = head.strip_prefix('-').unwrap_or(&head);
        if [
            "border",
            "border-top",
            "border-right",
            "border-bottom",
            "border-left",
            "border-block",
            "border-inline",
            "border-block-start",
            "border-block-end",
            "border-inline-start",
            "border-inline-end",
            "animation",
            "transition",
        ]
        .iter()
        .any(|prefix| {
            positive
                .strip_prefix(prefix)
                .and_then(|rest| rest.strip_prefix('-'))
                .is_some_and(|key| {
                    self.tokens.contains(&format!("color-line-{key}"))
                        || self.tokens.contains(&format!("color-{key}"))
                        || self.tokens.contains(&format!("duration-{key}"))
                        || self.tokens.contains(&format!("easing-{key}"))
                })
        }) {
            return Err("This historical compound token family was removed; choose independent properties from the saved CSS".into());
        }
        let mut families = super::legacy_registry::builtin_token_families()
            .map(|(prefix, property, _)| (prefix, property))
            .collect::<Vec<_>>();
        families.push(("surface", "background-color"));
        let builtin = families
            .into_iter()
            .filter(|(prefix, _)| positive.starts_with(&format!("{prefix}-")))
            .max_by_key(|(prefix, _)| prefix.len());
        let custom = self
            .mixins
            .iter()
            .filter(|definition| {
                definition.parameters.len() == 1
                    && definition.parameters[0].syntax
                        == Some(mastercss_schema::MixinParameterSyntax::String)
            })
            .map(|definition| definition.name.trim_start_matches("--"))
            .filter(|prefix| positive.starts_with(&format!("{prefix}-")))
            .max_by_key(|prefix| prefix.len());
        if custom
            .is_some_and(|custom| builtin.is_none_or(|(prefix, _)| custom.len() >= prefix.len()))
        {
            return Ok(source.into());
        }
        let Some((prefix, property)) = builtin else {
            return Ok(source.into());
        };
        // Frozen namespace precedence of language 5, including role-first border
        // and caret families, and color-first foreground. Never guess by token value.
        let namespaces: &[&str] = if prefix == "surface" {
            &["color-surface"]
        } else if property == "color" {
            &["color", "color-text"]
        } else if property.starts_with("border") && !property.contains("radius")
            || matches!(property, "outline" | "outline-color" | "stroke")
        {
            &["color-line", "color"]
        } else if matches!(
            property,
            "caret-color" | "-webkit-text-fill-color" | "text-decoration-color"
        ) {
            &["color-text", "color"]
        } else {
            return Ok(source.into());
        };
        let value = &positive[prefix.len() + 1..];
        let (key, alpha) = value
            .split_once('/')
            .map_or((value, ""), |(key, _)| (key, &value[key.len()..]));
        let Some(resolved) = namespaces
            .iter()
            .map(|namespace| format!("{namespace}-{key}"))
            .find(|name| self.tokens.contains(name))
        else {
            return Ok(source.into());
        };
        let target_prefix = if prefix == "surface" { "bg" } else { prefix };
        let sign = if head.starts_with('-') { "-" } else { "" };
        Ok(format!(
            "{sign}{target_prefix}-{}{alpha}{suffix}",
            resolved.strip_prefix("color-").expect("color namespace")
        ))
    }
}

pub(super) fn migrate(
    request: &RcMigrationRequest,
) -> Result<RcMigrationResult, crate::CompilerError> {
    if request.manifest["version"] != 3 || request.manifest["languageVersion"] != 5 {
        return Err(error(
            "rc-preset requires the saved Manifest v3 / languageVersion 5",
        ));
    }
    if request.source_version.trim().is_empty() {
        return Err(error("Record the source package version before migration"));
    }
    let saved = Saved::new(&request.manifest)?;
    let target = mastercss_engine::EngineSession::create(&request.target_manifest.to_string())
        .map_err(|cause| error(cause.to_string()))?;
    let mut class_lists: Vec<Vec<RcClassMigration>> = request
        .class_lists
        .iter()
        .map(|list| {
            list.iter()
                .map(|before| match saved.class(before) {
                    Ok(after) => {
                        let diagnostics = mastercss_lexer::collect_class_list_token_ranges(&after)
                            .into_iter()
                            .flat_map(|token| {
                                target
                                    .inspect(&token.token)
                                    .ok()
                                    .into_iter()
                                    .flat_map(|inspection| inspection.diagnostics)
                            })
                            .filter(|diagnostic| {
                                diagnostic.severity == mastercss_schema::DiagnosticSeverity::Error
                            })
                            .collect::<Vec<_>>();
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
                            } else if &after == before {
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
    for list in &mut class_lists {
        for index in 0..list.len() {
            if list[index]
                .after
                .as_ref()
                .is_none_or(|after| after == &list[index].before || !after.contains(' '))
            {
                continue;
            }
            let expanded = mastercss_lexer::collect_class_list_token_ranges(
                list[index].after.as_ref().unwrap(),
            )
            .into_iter()
            .flat_map(|item| target.composition_rules(&item.token).unwrap_or_default())
            .collect::<Vec<_>>();
            let overlaps = list
                .iter()
                .enumerate()
                .filter(|(other, _)| *other != index)
                .any(|(_, other)| {
                    mastercss_lexer::collect_class_list_token_ranges(
                        other.after.as_deref().unwrap_or(&other.before),
                    )
                    .into_iter()
                    .flat_map(|item| target.composition_rules(&item.token).unwrap_or_default())
                    .any(|other| {
                        expanded.iter().any(|rule| {
                            rule.layer == other.layer
                                && rule.selector == other.selector
                                && rule.conditions == other.conditions
                                && rule.declarations.iter().any(|a| {
                                    other.declarations.iter().any(|b| {
                                        super::properties_overlap(&a.property, &b.property)
                                    })
                                })
                        })
                    })
                });
            if overlaps {
                list[index].status = "review";
                list[index].notes.push("Expanded native declarations overlap another class; confirm cascade order before writing".into());
            }
        }
    }
    Ok(RcMigrationResult { version: 2, from: request.from, source_version: request.source_version.clone(), configuration_css: String::new(), notes: Vec::new(),
        behavior_changes: vec!["Expanded recipes use native property priority; review overlapping declarations. round preserves 50% radius and square aspect ratio, rather than becoming r-pill".into(), "Native keyframes remain delivered; move only intentionally managed definitions directly into @theme".into()],
        class_lists, stylesheets: request.stylesheets.iter().map(|source| super::stylesheets::RcStylesheetMigration { is_entry: mastercss_lexer::has_master_css_manifest_entrypoint(source), edits: Vec::new(), notes: Vec::new() }).collect(), documents: request.documents.iter().map(|source| super::values::audit_source(source)).collect(),
    })
}
