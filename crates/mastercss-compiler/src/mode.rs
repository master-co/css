use super::{
    CompilerError, CssDirectiveManifestInput, CssRule, ParserOptions, StyleSheet, ThemeAtRule,
    collect_declarations, directive_error, minified_css, printed_selectors,
};
use mastercss_schema::{ModeBranch, ModeDefinition};

fn collect_branches(
    rules: Vec<CssRule<'_>>,
    selector: Option<&str>,
    conditions: &[String],
    filename: &str,
    branches: &mut Vec<ModeBranch>,
) -> Result<(), CompilerError> {
    let invalid = |message: &str| CompilerError::Directive {
        message: message.into(),
        filename: filename.into(),
        range: None,
    };
    for rule in rules {
        match rule {
            CssRule::Unknown(slot) if slot.name.eq_ignore_ascii_case("slot") => {
                if slot.block.is_some() || !slot.prelude.0.is_empty() {
                    return Err(invalid("@mode only accepts bare @slot statements"));
                }
                let selector = selector.ok_or_else(|| {
                    invalid("@mode requires an activation element selector around @slot")
                })?;
                branches.push(ModeBranch {
                    selector: selector.into(),
                    conditions: conditions.to_vec(),
                });
            }
            CssRule::Style(style) => {
                if !collect_declarations(&style.declarations, filename)?.is_empty() {
                    return Err(invalid(
                        "@mode does not accept declarations; put token values in @theme and ordinary CSS outside @mode",
                    ));
                }
                for child in printed_selectors(&style.selectors.0, filename)? {
                    if !mastercss_lexer::valid_mode_selector(&child) {
                        return Err(invalid(
                            "@mode activation must select elements, without pseudo-elements",
                        ));
                    }
                    let combined = match selector {
                        Some(parent) => mastercss_lexer::replace_nesting_selector(&child, parent)
                            .unwrap_or_else(|| format!("{parent} {child}")),
                        None if mastercss_lexer::replace_nesting_selector(&child, "").is_some() => {
                            return Err(invalid("Top-level @mode selectors cannot contain &"));
                        }
                        None => child,
                    };
                    collect_branches(
                        style.rules.0.clone(),
                        Some(&combined),
                        conditions,
                        filename,
                        branches,
                    )?;
                }
            }
            CssRule::Media(media) => {
                let mut path = conditions.to_vec();
                path.push(format!("@media {}", minified_css(&media.query, filename)?));
                collect_branches(media.rules.0, selector, &path, filename, branches)?;
            }
            CssRule::Supports(supports) => {
                let mut path = conditions.to_vec();
                path.push(format!(
                    "@supports {}",
                    minified_css(&supports.condition, filename)?
                ));
                collect_branches(supports.rules.0, selector, &path, filename, branches)?;
            }
            _ => {
                return Err(invalid(
                    "@mode only accepts element selectors, @media, @supports, and @slot; containers, layers, declarations, and mode references are not allowed",
                ));
            }
        }
    }
    Ok(())
}

pub(crate) fn lower_mode_rule(
    source: &str,
    filename: &str,
    rule: ThemeAtRule,
    input: &mut CssDirectiveManifestInput,
) -> Result<(), CompilerError> {
    let invalid = |message: &str| directive_error(source, filename, rule.start_byte, message);
    let [name] = rule.prelude.parts.as_slice() else {
        return Err(invalid("@mode requires a single mode name"));
    };
    if !mastercss_lexer::valid_mode_name(name) {
        return Err(invalid("@mode requires a bare identifier"));
    }
    let body = rule
        .body
        .as_deref()
        .ok_or_else(|| invalid("@mode requires a block"))?;
    let stylesheet = StyleSheet::parse(
        body,
        ParserOptions {
            filename: filename.into(),
            ..ParserOptions::default()
        },
    )
    .map_err(|error| invalid(&error.to_string()))?;
    let mut branches = Vec::new();
    collect_branches(stylesheet.rules.0, None, &[], filename, &mut branches)?;
    if branches.is_empty() {
        return Err(invalid(
            "@mode requires an element selector containing @slot",
        ));
    }
    let modes = input.modes.get_or_insert_default();
    modes.retain(|mode| mode.name != *name);
    modes.push(ModeDefinition {
        name: name.clone(),
        branches,
    });
    Ok(())
}
