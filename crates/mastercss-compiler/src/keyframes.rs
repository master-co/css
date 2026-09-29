use crate::{CompilerError, CssOutputMapping};
use mastercss_lexer::{CssSyntaxKind as Kind, collect_css_syntax_statements, tokenize_css_syntax};
use mastercss_schema::KeyframeDefinition;
use serde_json::Value;
use std::collections::BTreeMap;

pub(crate) fn native_variables(css: &str) -> BTreeMap<String, Vec<String>> {
    let mut output = BTreeMap::<String, Vec<String>>::new();
    for (name, value) in mastercss_engine::stylesheet_declarations(css) {
        if let Some(name) = name.strip_prefix("--") {
            let values = output.entry(name.into()).or_default();
            if !values.contains(&value) {
                values.push(value);
            }
        }
    }
    output
}

pub(crate) fn include_native_variables(manifest: &mut Value, css: &str) {
    let variables = native_variables(css);
    if variables.is_empty() {
        return;
    }
    let target = manifest
        .as_object_mut()
        .expect("manifest")
        .entry("animationVariables")
        .or_insert_with(|| serde_json::json!({}))
        .as_object_mut()
        .expect("variable values");
    for (name, values) in variables {
        let target = target
            .entry(name)
            .or_insert_with(|| serde_json::json!([]))
            .as_array_mut()
            .expect("values");
        for value in values {
            let value = Value::String(value);
            if !target.contains(&value) {
                target.push(value);
            }
        }
    }
}

pub(crate) fn validate_native_names(
    css: &str,
    filename: &str,
    definitions: &[KeyframeDefinition],
    mappings: &[CssOutputMapping],
) -> Result<(), CompilerError> {
    let tokens = tokenize_css_syntax(css);
    for statement in collect_css_syntax_statements(&tokens) {
        if statement.declaration || !statement.has_block {
            continue;
        }
        let index = statement.tokens.start;
        let token = &tokens[index];
        if !matches!(&token.kind, Kind::AtKeyword(name) if name.eq_ignore_ascii_case("keyframes") || name.eq_ignore_ascii_case("-webkit-keyframes"))
        {
            continue;
        }
        let name = match tokens.get(index + 1).map(|token| &token.kind) {
            Some(Kind::Ident(name) | Kind::String(name)) => name.as_ref(),
            _ => continue,
        };
        let Some(definition) = definitions
            .iter()
            .rev()
            .find(|definition| definition.name == name)
        else {
            continue;
        };
        let offset =
            mastercss_lexer::byte_to_utf16_offset(css, token.bytes.start).expect("token boundary");
        let mapped = mappings.iter().rev().find(|mapping| {
            mapping.generated_start <= offset
                && mapping.generated_end.is_none_or(|end| offset < end)
        });
        let managed = definition
            .source
            .as_ref()
            .map(|source| {
                format!(
                    "{}:{}",
                    source.file.as_deref().unwrap_or("stylesheet.css"),
                    source.loc.as_ref().map_or(1, |loc| loc.start.line)
                )
            })
            .unwrap_or_else(|| "the compiled manifest".into());
        return Err(CompilerError::Directive {
            message: format!(
                "Native @keyframes {name} conflicts with managed keyframes defined at {managed}; use one delivery mode for this name"
            ),
            filename: mapped
                .and_then(|mapping| mapping.source.file.clone())
                .unwrap_or_else(|| filename.into()),
            range: mapped.map(|mapping| mapping.source.range.clone()),
        });
    }
    Ok(())
}

pub(crate) fn validate_manifest_native_names(
    css: &str,
    filename: &str,
    manifest: &Value,
    mappings: &[CssOutputMapping],
) -> Result<(), CompilerError> {
    let definitions: Vec<KeyframeDefinition> = serde_json::from_value(
        manifest
            .get("keyframes")
            .cloned()
            .unwrap_or_else(|| serde_json::json!([])),
    )
    .map_err(|error| CompilerError::Directive {
        message: error.to_string(),
        filename: filename.into(),
        range: None,
    })?;
    validate_native_names(css, filename, &definitions, mappings)
}

pub(crate) fn native_notices(
    css: &str,
    filename: &str,
    manifest: &Value,
    mappings: &[CssOutputMapping],
) -> Result<Vec<mastercss_schema::CssDirectiveNotice>, CompilerError> {
    if manifest
        .get("keyframes")
        .and_then(Value::as_array)
        .is_none_or(Vec::is_empty)
    {
        return Ok(Vec::new());
    }
    let engine =
        mastercss_engine::EngineSession::create(&manifest.to_string()).map_err(|cause| {
            CompilerError::Directive {
                message: cause.to_string(),
                filename: filename.into(),
                range: None,
            }
        })?;
    let mut notices = Vec::new();
    let tokens = tokenize_css_syntax(css);
    let statements = collect_css_syntax_statements(&tokens);
    for statement in &statements {
        if !statement.declaration {
            continue;
        }
        let mut parent = statement.parent;
        let mut in_keyframes = false;
        while let Some(index) = parent {
            let ancestor = &statements[index];
            if matches!(&tokens[ancestor.tokens.start].kind, Kind::AtKeyword(name) if name.eq_ignore_ascii_case("keyframes") || name.eq_ignore_ascii_case("-webkit-keyframes"))
            {
                in_keyframes = true;
                break;
            }
            parent = ancestor.parent;
        }
        if in_keyframes {
            continue;
        }
        let first = &tokens[statement.tokens.start];
        let Kind::Ident(property) = &first.kind else {
            continue;
        };
        if !matches!(
            property.to_ascii_lowercase().as_str(),
            "animation" | "animation-name" | "-webkit-animation" | "-webkit-animation-name"
        ) {
            continue;
        }
        let end = tokens[statement.tokens.end - 1].bytes.end;
        let declaration = &css[first.bytes.start..end];
        if !engine
            .animation_references(&format!("a{{{declaration}}}"))
            .is_ok_and(|references| references.retain_all)
        {
            continue;
        }
        let offset =
            mastercss_lexer::byte_to_utf16_offset(css, first.bytes.start).expect("token boundary");
        let source = mappings
            .iter()
            .rev()
            .find(|mapping| {
                mapping.generated_start <= offset
                    && mapping.generated_end.is_none_or(|end| offset < end)
            })
            .map(|mapping| mapping.source.clone())
            .or_else(|| {
                crate::source_index::SourceIndex::new(css).reference(
                    filename,
                    first.bytes.start,
                    end,
                )
            });
        notices.push(mastercss_schema::CssDirectiveNotice {
            code: mastercss_schema::ErrorCode::DynamicAnimationNames,
            message: "Dynamic animation names retain all managed keyframes for this usage root"
                .into(),
            source,
        });
    }
    Ok(notices)
}
