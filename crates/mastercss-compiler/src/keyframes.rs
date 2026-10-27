use crate::{CompilerError, CssOutputMapping};
use mastercss_lexer::{CssSyntaxKind as Kind, collect_css_syntax_statements, tokenize_css_syntax};
use serde_json::Value;
use std::collections::BTreeMap;

pub(crate) fn native_variables(css: &str) -> BTreeMap<String, Vec<String>> {
    let mut output = BTreeMap::<String, Vec<String>>::new();
    for (name, value) in mastercss_engine::stylesheet_declarations(css) {
        if let Some(name) = name.strip_prefix("--") {
            if name == "master-css-slot" || name.starts_with("master-css-keyframe-resource-") {
                continue;
            }
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
