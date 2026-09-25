//! RC-native decoding is build-time migration only; execution never calls it.
use super::{Migration, RcMigrationProfile};
use mastercss_lexer::{CssSyntaxKind, tokenize_css_syntax};
use serde_json::json;

impl Migration {
    pub(super) fn query(&self, token: &str) -> Result<String, String> {
        if mastercss_lexer::parse_native_query(token).is_some() {
            return Ok(token.into());
        }
        let Some((kind, rest)) = token.split_once('(') else {
            return Ok(token.into());
        };
        if !matches!(kind, "media" | "supports" | "container") {
            return Ok(token.into());
        }
        let body = rest
            .strip_suffix(')')
            .ok_or("Unbalanced RC query requires review")?;
        if body.contains("|=") || body.contains("\\|") {
            return Err("A literal pipe may have been decoded as whitespace; verify the saved RC CSS before moving this query".into());
        }
        let prelude = mastercss_lexer::decode_native_content(body)
            .ok_or("Malformed RC query requires review")?;
        let wrapper = format!("@{kind} {prelude}");
        let css = format!("{wrapper}{{}}");
        lightningcss::stylesheet::StyleSheet::parse(&css, Default::default())
            .map_err(|_| "The saved query was invalid or cannot be proven equivalent; review its previous browser effect".to_owned())?;
        let hash = wrapper.bytes().fold(0xcbf29ce484222325_u64, |hash, byte| {
            (hash ^ u64::from(byte)).wrapping_mul(0x100000001b3)
        });
        let name = format!("migrated-query-{hash:016x}");
        let mut manifest = self.target_manifest.borrow_mut();
        let variants = manifest
            .as_object_mut()
            .unwrap()
            .entry("variants")
            .or_insert_with(|| json!([]))
            .as_array_mut()
            .ok_or("Invalid target variants")?;
        let definition = json!({"token":format!("@{name}"),"branches":[{"conditions":[wrapper]}]});
        if let Some(existing) = variants
            .iter()
            .find(|variant| variant["token"] == definition["token"])
        {
            if existing != &definition {
                return Err(format!(
                    "Generated variant {name} conflicts with an existing definition"
                ));
            }
        } else {
            variants.push(definition);
            self.target
                .borrow_mut()
                .refresh(&manifest.to_string())
                .map_err(|error| error.to_string())?;
        }
        self.query_definitions.borrow_mut().insert(
            name.clone(),
            format!("@custom-variant {name}{{{wrapper}{{@slot;}}}}\n"),
        );
        Ok(name)
    }

    pub(super) fn native_profile(&self) -> bool {
        matches!(
            self.profile,
            RcMigrationProfile::RcNative
                | RcMigrationProfile::RcManaged
                | RcMigrationProfile::RcUtilities
        )
    }
}

pub(super) fn declares_alpha(source: &str) -> bool {
    let tokens = tokenize_css_syntax(source);
    tokens.windows(2).any(|pair| matches!(&pair[0].kind, CssSyntaxKind::AtKeyword(name) if name == "function") && matches!(&pair[1].kind, CssSyntaxKind::Ident(name) | CssSyntaxKind::Function(name) if name == "--alpha"))
}

pub(super) fn alpha(body: &str) -> Result<String, String> {
    let tokens = tokenize_css_syntax(body);
    let mut slash = None;
    let mut index = 0;
    while index < tokens.len() {
        let token = &tokens[index];
        if token.kind == CssSyntaxKind::Delim('/') {
            if slash.is_some() {
                return Err("Invalid RC --alpha(): more than one separator".into());
            }
            slash = Some(token.bytes.start);
        }
        index = token.close.map_or(index + 1, |close| close + 1);
    }
    let slash = slash.ok_or("Invalid RC --alpha(): expected color / alpha")?;
    let color = body[..slash].trim();
    if color.is_empty() {
        return Err("Invalid RC --alpha(): missing color".into());
    }
    let opacity = body[slash + 1..].trim();
    let percentage = if let Some(number) = opacity.strip_suffix('%') {
        number
            .parse::<f64>()
            .ok()
            .filter(|value| value.is_finite() && (0.0..=100.0).contains(value))
    } else {
        opacity
            .parse::<f64>()
            .ok()
            .filter(|value| value.is_finite() && (0.0..=1.0).contains(value))
            .map(|value| value * 100.0)
    };
    let opacity = if let Some(number) = percentage {
        format!("{number}%")
    } else {
        let tokens = tokenize_css_syntax(opacity);
        if !matches!(tokens.first().map(|token| &token.kind), Some(CssSyntaxKind::Function(name)) if matches!(name.as_ref(), "var" | "calc"))
            || tokens[0].close != Some(tokens.len() - 1)
        {
            return Err("Invalid or unverified RC --alpha() value requires review".into());
        }
        opacity.into()
    };
    Ok(format!("color-mix(in oklab,{color} {opacity},transparent)"))
}

/// Recover only migration-owned CSS variants on a subsequent run. The normal
/// compiler lowers their authored CSS; no runtime legacy decoder is introduced.
pub(super) fn restore_query_variants(
    stylesheets: &[String],
    manifest: &mut serde_json::Value,
) -> Result<(), crate::CompilerError> {
    for source in stylesheets {
        let tokens = tokenize_css_syntax(source);
        for statement in mastercss_lexer::collect_css_syntax_statements(&tokens) {
            if statement.parent.is_some() || !statement.has_block {
                continue;
            }
            let start = statement.tokens.start;
            if !matches!(&tokens[start].kind, CssSyntaxKind::AtKeyword(name) if name == "custom-variant")
            {
                continue;
            }
            if !matches!(tokens.get(start + 1).map(|token| &token.kind), Some(CssSyntaxKind::Ident(name)) if name.starts_with("migrated-query-"))
            {
                continue;
            }
            let Some(close) = tokens[statement.tokens.end].close else {
                continue;
            };
            let definition = &source[tokens[start].bytes.start..tokens[close].bytes.end];
            let parsed = crate::compile_css_directives(definition, &Default::default())?;
            let compiled =
                crate::compile_manifest_input(&parsed.manifest_input, &Default::default())?;
            for variant in compiled.manifest["variants"]
                .as_array()
                .into_iter()
                .flatten()
            {
                let variants = manifest
                    .as_object_mut()
                    .unwrap()
                    .entry("variants")
                    .or_insert_with(|| json!([]))
                    .as_array_mut()
                    .ok_or_else(|| super::error("Invalid target variants"))?;
                if let Some(existing) = variants
                    .iter()
                    .find(|entry| entry["token"] == variant["token"])
                {
                    if existing != variant {
                        return Err(super::error(
                            "A migrated query name has conflicting definitions; review the target manifest",
                        ));
                    }
                } else {
                    variants.push(variant.clone());
                }
            }
        }
    }
    Ok(())
}
