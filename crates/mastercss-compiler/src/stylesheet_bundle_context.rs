use std::collections::HashMap;

use lightningcss::{stylesheet::PrinterOptions, traits::ToCss};
use mastercss_lexer::{byte_to_utf16_offset, utf16_to_byte_offset};
use mastercss_schema::SourceRange;

use crate::{
    CompilerError, CssBundleGraph, CssBundleSource, CssResourceReference, CssStylesheetNode,
    analyze_css_resources,
};

pub(crate) fn fragment(
    source: &str,
    filename: &str,
    id: String,
    start: usize,
    end: usize,
    prefix: &str,
) -> Result<(CssStylesheetNode, CssBundleSource), CompilerError> {
    let text = &source[start..end];
    let start_units = byte_to_utf16_offset(source, start).expect("fragment boundary");
    let mut resources = analyze_css_resources(text);
    for resource in &mut resources {
        resource.start += start_units;
        resource.end += start_units;
    }
    let imports = crate::stylesheet_graph::source_imports(text, filename)?
        .into_iter()
        .map(|import| CssResourceReference {
            start: import.start + start_units,
            end: import.end + start_units,
            url: import.specifier,
        })
        .collect();
    let node = crate::stylesheet_bundle::import_node(id.clone(), format!("{prefix}{text}"), &[])?;
    Ok((
        node,
        CssBundleSource {
            id,
            filename: filename.into(),
            range: SourceRange {
                start: start_units,
                end: byte_to_utf16_offset(source, end).expect("fragment boundary"),
            },
            prefix: prefix.into(),
            resources,
            imports,
        },
    ))
}

/// Relocate only ordinary bundle-owned CSS. Mappings use decoded original URLs;
/// namespace identifiers and the already compiled managed graph are untouched.
/// Original source ranges/references stay original after URL spelling changes.
/// A failed mapping leaves the caller's graph unchanged.
pub fn relocate_css_bundle_resources(
    bundle: &CssBundleGraph,
    mappings: &HashMap<String, String>,
) -> Result<CssBundleGraph, CompilerError> {
    let mut result = bundle.clone();
    for reference in &bundle.sources {
        let node = result
            .graph
            .stylesheets
            .iter_mut()
            .find(|node| node.id == reference.id)
            .ok_or_else(|| CompilerError::Import {
                filename: reference.filename.clone(),
                message: "Missing bundle source node".into(),
            })?;
        let mut source = String::new();
        let mut cursor = 0;
        for import in &node.imports {
            let start = utf16_to_byte_offset(&node.source, import.start).ok_or_else(|| {
                CompilerError::Import {
                    filename: reference.filename.clone(),
                    message: "Invalid bundle import start".into(),
                }
            })?;
            let end = utf16_to_byte_offset(&node.source, import.end).ok_or_else(|| {
                CompilerError::Import {
                    filename: reference.filename.clone(),
                    message: "Invalid bundle import end".into(),
                }
            })?;
            if start < cursor
                || end < start
                || node.source.get(start..end) != Some(import.statement.as_str())
                || import.resolved.is_some()
            {
                return Err(CompilerError::Import {
                    filename: reference.filename.clone(),
                    message: "Invalid ordinary bundle import".into(),
                });
            }
            source.push_str(&node.source[cursor..start]);
            if let Some(target) = mappings.get(&import.specifier) {
                if !crate::stylesheet_resources::independent_url(target) {
                    return Err(CompilerError::Import {
                        filename: reference.filename.clone(),
                        message: format!(
                            "Bundle import URL must be root-relative or absolute: {target}"
                        ),
                    });
                }
                let mut parsed =
                    crate::stylesheet_graph::parse_import(&import.statement, &reference.filename)?;
                parsed.url = target.clone().into();
                source.push_str(&parsed.to_css_string(PrinterOptions::default()).map_err(
                    |error| CompilerError::Print {
                        filename: reference.filename.clone(),
                        message: error.to_string(),
                    },
                )?);
            } else if crate::stylesheet_resources::independent_url(&import.specifier) {
                source.push_str(&import.statement);
            } else {
                return Err(CompilerError::Import {
                    filename: reference.filename.clone(),
                    message: format!("Missing bundle import URL mapping for {}", import.specifier),
                });
            }
            cursor = end;
        }
        source.push_str(&node.source[cursor..]);
        node.source = crate::stylesheet_resources::rewrite_css_resources(
            &source,
            &reference.filename,
            mappings,
            false,
        )?
        .source;
        node.imports = crate::stylesheet_graph::source_imports(&node.source, &reference.filename)?;
    }
    Ok(result)
}
