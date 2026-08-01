use super::*;

pub(crate) fn lower_theme_keyframes(
    source: &str,
    filename: &str,
    rule_start_byte: usize,
    keyframes_source: &str,
    is_static: bool,
    manifest_input: &mut CssDirectiveManifestInput,
) -> Result<(), CompilerError> {
    let stylesheet = StyleSheet::parse(
        keyframes_source,
        ParserOptions {
            filename: filename.to_owned(),
            ..ParserOptions::default()
        },
    )
    .map_err(|error| CompilerError::Parse {
        message: error.to_string(),
        filename: filename.to_owned(),
        range: directive_range(source, rule_start_byte),
    })?;
    let mut found = false;
    for css_rule in stylesheet.rules.0 {
        let CssRule::Keyframes(keyframes) = css_rule else {
            return Err(directive_error(
                source,
                filename,
                rule_start_byte,
                "@theme only accepts theme token declarations and @keyframes definitions",
            ));
        };
        found = true;
        let name = match keyframes.name {
            KeyframesName::Ident(name) => name.0.to_string(),
            KeyframesName::Custom(name) => name.to_string(),
        };
        if name.is_empty() {
            return Err(directive_error(
                source,
                filename,
                rule_start_byte,
                "@keyframes requires a name",
            ));
        }
        let mut frames = serde_json::Map::new();
        for keyframe in keyframes.keyframes {
            let declarations =
                Value::Object(collect_declarations(&keyframe.declarations, filename)?);
            for selector in keyframe.selectors {
                let selector =
                    selector
                        .to_css_string(PrinterOptions::default())
                        .map_err(|error| CompilerError::Print {
                            message: error.to_string(),
                            filename: filename.to_owned(),
                        })?;
                frames.insert(selector, declarations.clone());
            }
        }
        manifest_input
            .animations
            .get_or_insert_default()
            .insert(name.clone(), Value::Object(frames));
        if is_static {
            manifest_input
                .animation_options
                .get_or_insert_default()
                .insert(name, serde_json::json!({ "static": true }));
        }
    }
    if !found {
        return Err(directive_error(
            source,
            filename,
            rule_start_byte,
            "@keyframes requires a name",
        ));
    }
    Ok(())
}

pub(crate) fn strict_css_number(value: &str) -> Option<f64> {
    let number = value.parse::<f64>().ok()?;
    let normalized = if number == 0.0 {
        "0".to_owned()
    } else {
        number.to_string()
    };
    (normalized == value).then_some(number)
}

pub(crate) fn add_mode(manifest_input: &mut CssDirectiveManifestInput, mode: &str) {
    let modes = manifest_input.modes.get_or_insert_default();
    if !modes.iter().any(|existing| existing == mode) {
        modes.push(mode.to_owned());
    }
}

pub(crate) fn lower_settings_rule(
    source: &str,
    filename: &str,
    rule: ThemeAtRule,
    manifest_input: &mut CssDirectiveManifestInput,
) -> Result<(), CompilerError> {
    if !rule.prelude.parts.is_empty() {
        return Err(directive_error(
            source,
            filename,
            rule.start_byte,
            format!(
                "Unsupported @settings section: {}",
                rule.prelude.parts.join(" ")
            ),
        ));
    }
    let body = rule.body.as_deref().ok_or_else(|| {
        directive_error(
            source,
            filename,
            rule.start_byte,
            "@settings requires a style block",
        )
    })?;
    let declarations = DeclarationBlock::parse_string(
        body,
        ParserOptions {
            filename: filename.to_owned(),
            ..ParserOptions::default()
        },
    )
    .map_err(|error| directive_error(source, filename, rule.start_byte, error.to_string()))?;
    for declaration in declarations.declarations {
        let property = declaration_name(&declaration).map_err(|error| CompilerError::Print {
            message: error.to_string(),
            filename: filename.to_owned(),
        })?;
        let value = declaration
            .value_to_css_string(PrinterOptions::default())
            .map_err(|error| CompilerError::Print {
                message: error.to_string(),
                filename: filename.to_owned(),
            })?;
        match property.as_str() {
            "root-size" => {
                manifest_input.root_size = Some(strict_css_number(&value).ok_or_else(|| {
                    directive_error(
                        source,
                        filename,
                        rule.start_byte,
                        "root-size must be a number",
                    )
                })?);
            }
            "base-unit" => {
                manifest_input.base_unit = Some(strict_css_number(&value).ok_or_else(|| {
                    directive_error(
                        source,
                        filename,
                        rule.start_byte,
                        "base-unit must be a number",
                    )
                })?);
            }
            "default-mode" => {
                if value == "false" {
                    return Err(directive_error(
                        source,
                        filename,
                        rule.start_byte,
                        "default-mode must be a mode name or none",
                    ));
                }
                manifest_input.default_mode = Some(value);
            }
            "mode-trigger" => {
                if !matches!(value.as_str(), "class" | "media" | "host") {
                    return Err(directive_error(
                        source,
                        filename,
                        rule.start_byte,
                        "mode-trigger must be class, media, or host",
                    ));
                }
                manifest_input.mode_trigger = Some(value);
            }
            "important" => {
                manifest_input.important = Some(match value.as_str() {
                    "on" => true,
                    "off" => false,
                    _ => {
                        return Err(directive_error(
                            source,
                            filename,
                            rule.start_byte,
                            "important must be on or off",
                        ));
                    }
                });
            }
            "modes" => {
                for mode in value
                    .split(',')
                    .flat_map(str::split_whitespace)
                    .filter(|mode| !mode.is_empty())
                {
                    add_mode(manifest_input, mode);
                }
            }
            "scope" => manifest_input.scope = Some(value),
            _ => {
                return Err(directive_error(
                    source,
                    filename,
                    rule.start_byte,
                    format!("Unsupported @settings option: {property}"),
                ));
            }
        }
    }
    if let Some(declaration) = declarations.important_declarations.first() {
        let property = declaration_name(declaration).map_err(|error| CompilerError::Print {
            message: error.to_string(),
            filename: filename.to_owned(),
        })?;
        return Err(directive_error(
            source,
            filename,
            rule.start_byte,
            format!("@settings does not accept !important declarations: {property}"),
        ));
    }
    Ok(())
}

pub(crate) fn lower_theme_rule(
    source: &str,
    filename: &str,
    rule: ThemeAtRule,
    manifest_input: &mut CssDirectiveManifestInput,
) -> Result<(), CompilerError> {
    let (mode, inline, is_static) = parse_theme_prelude(source, filename, &rule)?;
    let body = rule.body.as_deref().ok_or_else(|| {
        directive_error(
            source,
            filename,
            rule.start_byte,
            "@theme requires a style block",
        )
    })?;
    if let Some(mode) = &mode {
        let modes = manifest_input.modes.get_or_insert_default();
        if !modes.contains(mode) {
            modes.push(mode.clone());
        }
    }

    let (declaration_source, keyframe_blocks) =
        extract_top_level_at_rule_blocks(body, &["keyframes", "-webkit-keyframes"]);
    if !keyframe_blocks.is_empty() && (mode.is_some() || inline) {
        return Err(directive_error(
            source,
            filename,
            rule.start_byte,
            "@theme keyframes cannot be mode-specific or inline",
        ));
    }
    for keyframes in keyframe_blocks {
        lower_theme_keyframes(
            source,
            filename,
            rule.start_byte,
            &keyframes.source,
            is_static,
            manifest_input,
        )?;
    }

    let declarations = DeclarationBlock::parse_string(
        &declaration_source,
        ParserOptions {
            filename: filename.to_owned(),
            ..ParserOptions::default()
        },
    )
    .map_err(|error| directive_error(source, filename, rule.start_byte, error.to_string()))?;

    for declaration in declarations.declarations {
        let value = declaration
            .value_to_css_string(PrinterOptions::default())
            .map_err(|error| CompilerError::Print {
                message: error.to_string(),
                filename: filename.to_owned(),
            })?;
        let value = normalize_theme_stylesheet_value(&value)
            .map_err(|message| directive_error(source, filename, rule.start_byte, message))?;
        let Property::Custom(custom) = declaration else {
            return Err(directive_error(
                source,
                filename,
                rule.start_byte,
                format!(
                    "@theme token declarations must be CSS custom properties: {}",
                    declaration.property_id().name()
                ),
            ));
        };
        let property = custom.name.as_ref();
        let name = property.strip_prefix("--").filter(|name| !name.is_empty());
        let Some(name) = name else {
            return Err(directive_error(
                source,
                filename,
                rule.start_byte,
                if property == "--" {
                    "@theme token name cannot be empty".to_owned()
                } else {
                    format!("@theme token declarations must be CSS custom properties: {property}")
                },
            ));
        };
        define_theme_variable(
            manifest_input,
            CssDirectiveVariableDefinition {
                name: Some(name.to_owned()),
                value: theme_value(value),
                mode: mode.clone(),
                inline: inline.then_some(true),
                r#static: is_static.then_some(true),
                namespace: None,
                key: None,
            },
        );
    }

    if let Some(declaration) = declarations.important_declarations.first() {
        let property_id = declaration.property_id();
        let property = property_id.name().trim_start_matches("--");
        return Err(directive_error(
            source,
            filename,
            rule.start_byte,
            format!("@theme token declarations cannot be !important: {property}"),
        ));
    }
    Ok(())
}
