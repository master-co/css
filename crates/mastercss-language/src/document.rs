use super::*;

pub(crate) fn collect_document_contexts(
    source: &str,
    language_id: &str,
    settings: &LanguageDocumentSettingsIr,
) -> Vec<ClassListContextIr> {
    let language_id = language_id.to_ascii_lowercase();
    if matches!(
        language_id.as_str(),
        "master-css" | "mcss" | "text" | "plaintext"
    ) {
        return vec![ClassListContextIr {
            start: 0,
            end: utf16_len(source),
            unescape: Vec::new(),
        }];
    }
    let mut contexts = Vec::new();
    if matches!(language_id.as_str(), "css" | "scss" | "less") {
        collect_css_directive_contexts(source, 0, &mut contexts);
    } else if matches!(language_id.as_str(), "vue" | "svelte" | "astro") {
        collect_sfc_style_contexts(source, &mut contexts);
    }
    if matches!(
        language_id.as_str(),
        "html" | "angular-html" | "vue" | "svelte" | "astro" | "markdown" | "mdx"
    ) {
        collect_markup_attribute_contexts(source, &mut contexts, settings);
    }
    if matches!(
        language_id.as_str(),
        "javascript"
            | "typescript"
            | "javascriptreact"
            | "typescriptreact"
            | "html"
            | "vue"
            | "svelte"
            | "astro"
    ) {
        collect_script_string_contexts(source, &mut contexts, settings);
        collect_braced_class_bindings(source, &mut contexts);
    }
    contexts
}

pub(crate) fn push_byte_context(
    source: &str,
    contexts: &mut Vec<ClassListContextIr>,
    start: usize,
    end: usize,
    unescape: Vec<String>,
) {
    if start > end || end > source.len() {
        return;
    }
    let (Some(start), Some(end)) = (
        byte_to_utf16_offset(source, start),
        byte_to_utf16_offset(source, end),
    ) else {
        return;
    };
    contexts.push(ClassListContextIr {
        start,
        end,
        unescape,
    });
}

pub(crate) fn collect_markup_attribute_contexts(
    source: &str,
    contexts: &mut Vec<ClassListContextIr>,
    settings: &LanguageDocumentSettingsIr,
) {
    let bytes = source.as_bytes();
    let mut names = vec![
        "class".to_owned(),
        "classname".to_owned(),
        "class:list".to_owned(),
        ":class".to_owned(),
        "v-bind:class".to_owned(),
        "[class]".to_owned(),
        "[classname]".to_owned(),
        "[ngclass]".to_owned(),
    ];
    for name in &settings.class_attributes {
        let name = name.to_ascii_lowercase();
        if !names.contains(&name) {
            names.push(name);
        }
    }
    let mut index = 0;
    while index < bytes.len() {
        if bytes[index..].starts_with(b"<!--") {
            index = source[index + "<!--".len()..]
                .find("-->")
                .map_or(source.len(), |end| index + "<!--".len() + end + "-->".len());
            continue;
        }
        if !matches!(bytes[index], b'\'' | b'"') {
            index += 1;
            continue;
        }
        let quote = bytes[index];
        let mut cursor = index;
        while cursor > 0 && bytes[cursor - 1].is_ascii_whitespace() {
            cursor -= 1;
        }
        if cursor == 0 || bytes[cursor - 1] != b'=' {
            index += 1;
            continue;
        }
        cursor -= 1;
        while cursor > 0 && bytes[cursor - 1].is_ascii_whitespace() {
            cursor -= 1;
        }
        let name_end = cursor;
        while cursor > 0
            && !bytes[cursor - 1].is_ascii_whitespace()
            && !matches!(bytes[cursor - 1], b'<' | b'>' | b'/' | b'{' | b'}')
        {
            cursor -= 1;
        }
        let name = source[cursor..name_end].to_ascii_lowercase();
        let mut end = index + 1;
        let mut escaped = false;
        while end < bytes.len() {
            if escaped {
                escaped = false;
            } else if bytes[end] == b'\\' {
                escaped = true;
            } else if bytes[end] == quote {
                break;
            }
            end += 1;
        }
        if names.contains(&name) && end < bytes.len() {
            if matches!(
                name.as_str(),
                ":class" | "v-bind:class" | "[class]" | "[classname]" | "[ngclass]"
            ) {
                collect_nested_string_contexts(source, index + 1, end, contexts);
            } else {
                push_byte_context(
                    source,
                    contexts,
                    index + 1,
                    end,
                    vec![(quote as char).to_string()],
                );
            }
        }
        index = end.saturating_add(1);
    }
}

pub(crate) fn collect_script_string_contexts(
    source: &str,
    contexts: &mut Vec<ClassListContextIr>,
    settings: &LanguageDocumentSettingsIr,
) {
    let bytes = source.as_bytes();
    let mut patterns = vec![
        "class=".to_owned(),
        "classname=".to_owned(),
        "class:list=".to_owned(),
        "clsx(".to_owned(),
        "classnames(".to_owned(),
        "cva(".to_owned(),
        "ctl(".to_owned(),
        "classlist.add(".to_owned(),
        "classlist.remove(".to_owned(),
        "classlist.toggle(".to_owned(),
    ];
    for function in &settings.class_functions {
        let function = function.to_ascii_lowercase();
        if function.chars().all(|character| {
            character.is_ascii_alphanumeric() || matches!(character, '_' | '$' | '.')
        }) {
            let pattern = format!("{function}(");
            if !patterns.contains(&pattern) {
                patterns.push(pattern);
            }
        }
    }
    for declaration in &settings.class_declarations {
        let declaration = declaration.trim().to_ascii_lowercase();
        if !declaration.is_empty() {
            patterns.push(format!("{declaration}="));
            patterns.push(format!("{declaration} ="));
            patterns.push(format!("{declaration}:"));
        }
    }
    let mut index = 0;
    while index < bytes.len() {
        let quote = bytes[index];
        if !matches!(quote, b'\'' | b'"' | b'`') {
            index += 1;
            continue;
        }
        let inside_html_comment = source[..index].rfind("<!--").is_some_and(|comment_start| {
            source[..index]
                .rfind("-->")
                .is_none_or(|comment_end| comment_end < comment_start)
        });
        if inside_html_comment {
            index += 1;
            continue;
        }
        let line_start = source[..index]
            .rfind(['\n', '\r'])
            .map_or(0, |line| line + 1);
        if source[line_start..index].trim_start().starts_with("//") {
            index += 1;
            continue;
        }
        let prefix_start = index.saturating_sub(512);
        let prefix = source[prefix_start..index].to_ascii_lowercase();
        let compact_prefix = prefix
            .chars()
            .filter(|character| !character.is_ascii_whitespace())
            .collect::<String>();
        let binding_expression = compact_prefix.ends_with(":class=")
            || compact_prefix.ends_with("v-bind:class=")
            || compact_prefix.ends_with("class:list=");
        let direct_class = !binding_expression
            && patterns.iter().any(|pattern| {
                let compact_pattern = pattern
                    .chars()
                    .filter(|character| !character.is_ascii_whitespace())
                    .collect::<String>();
                compact_prefix
                    .trim_end_matches('{')
                    .ends_with(&compact_pattern)
            });
        let in_class_call = patterns.iter().any(|pattern| {
            let compact_pattern = pattern
                .chars()
                .filter(|character| !character.is_ascii_whitespace())
                .collect::<String>();
            let Some(call) = compact_pattern.strip_suffix('(') else {
                return false;
            };
            let Some(start) = compact_prefix.rfind(&format!("{call}(")) else {
                return false;
            };
            let suffix = &compact_prefix[start + call.len()..];
            suffix
                .chars()
                .fold(0_i32, |depth, character| match character {
                    '(' => depth + 1,
                    ')' => depth - 1,
                    _ => depth,
                })
                > 0
        });
        let styled_template = quote == b'`'
            && compact_prefix.rfind("styled").is_some_and(|start| {
                compact_prefix[start + "styled".len()..]
                    .chars()
                    .all(|character| {
                        character.is_ascii_alphanumeric() || matches!(character, '_' | '$' | '.')
                    })
            });
        let styled_call = compact_prefix.rfind("styled").is_some_and(|start| {
            let suffix = &compact_prefix[start + "styled".len()..];
            let Some(open) = suffix.find('(') else {
                return false;
            };
            suffix[..open].chars().all(|character| {
                character.is_ascii_alphanumeric() || matches!(character, '_' | '$' | '.')
            }) && suffix[open..]
                .chars()
                .fold(0_i32, |depth, character| match character {
                    '(' => depth + 1,
                    ')' => depth - 1,
                    _ => depth,
                })
                > 0
        });
        let likely_class = direct_class || in_class_call || styled_call || styled_template;
        let mut end = index + 1;
        let mut escaped = false;
        let mut interpolation = false;
        while end < bytes.len() {
            if escaped {
                escaped = false;
            } else if bytes[end] == b'\\' {
                escaped = true;
            } else if quote == b'`' && bytes[end] == b'$' && bytes.get(end + 1) == Some(&b'{') {
                interpolation = true;
            } else if bytes[end] == quote {
                break;
            }
            end += 1;
        }
        if likely_class && !interpolation && end < bytes.len() {
            push_byte_context(
                source,
                contexts,
                index + 1,
                end,
                vec![(quote as char).to_string()],
            );
        }
        index = end.saturating_add(1);
    }
}

pub(crate) fn collect_nested_string_contexts(
    source: &str,
    start: usize,
    end: usize,
    contexts: &mut Vec<ClassListContextIr>,
) {
    let bytes = source.as_bytes();
    let mut index = start;
    while index < end {
        let quote = bytes[index];
        if !matches!(quote, b'\'' | b'"' | b'`') {
            index += 1;
            continue;
        }
        let mut cursor = index + 1;
        let mut escaped = false;
        let mut segment_start = cursor;
        while cursor < end {
            if escaped {
                escaped = false;
                cursor += 1;
                continue;
            }
            if bytes[cursor] == b'\\' {
                escaped = true;
                cursor += 1;
                continue;
            }
            if quote == b'`' && bytes[cursor] == b'$' && bytes.get(cursor + 1) == Some(&b'{') {
                if segment_start < cursor {
                    push_byte_context(
                        source,
                        contexts,
                        segment_start,
                        cursor,
                        vec!["`".to_owned()],
                    );
                }
                let expression_start = cursor + 2;
                let mut expression_end = expression_start;
                let mut depth = 1_u32;
                while expression_end < end && depth > 0 {
                    match bytes[expression_end] {
                        b'{' => depth += 1,
                        b'}' => depth -= 1,
                        _ => {}
                    }
                    expression_end += 1;
                }
                let inner_end = expression_end.saturating_sub(1);
                collect_nested_string_contexts(source, expression_start, inner_end, contexts);
                cursor = expression_end;
                segment_start = cursor;
                continue;
            }
            if bytes[cursor] == quote {
                if segment_start <= cursor {
                    push_byte_context(
                        source,
                        contexts,
                        segment_start,
                        cursor,
                        vec![(quote as char).to_string()],
                    );
                }
                cursor += 1;
                break;
            }
            cursor += 1;
        }
        index = cursor.max(index + 1);
    }
}

pub(crate) fn collect_braced_class_bindings(source: &str, contexts: &mut Vec<ClassListContextIr>) {
    let lower = source.to_ascii_lowercase();
    for name in ["class", "classname", "class:list"] {
        let mut cursor = 0;
        while let Some(relative) = lower[cursor..].find(name) {
            let name_start = cursor + relative;
            let mut expression = name_start + name.len();
            while source
                .as_bytes()
                .get(expression)
                .is_some_and(u8::is_ascii_whitespace)
            {
                expression += 1;
            }
            if source.as_bytes().get(expression) != Some(&b'=') {
                cursor = name_start + name.len();
                continue;
            }
            expression += 1;
            while source
                .as_bytes()
                .get(expression)
                .is_some_and(u8::is_ascii_whitespace)
            {
                expression += 1;
            }
            if source.as_bytes().get(expression) != Some(&b'{') {
                cursor = expression;
                continue;
            }
            let mut end = expression + 1;
            let mut depth = 1_u32;
            while end < source.len() && depth > 0 {
                match source.as_bytes()[end] {
                    b'{' => depth += 1,
                    b'}' => depth -= 1,
                    _ => {}
                }
                end += 1;
            }
            collect_nested_string_contexts(source, expression + 1, end.saturating_sub(1), contexts);
            cursor = end;
        }
    }
}

pub(crate) fn collect_css_directive_contexts(
    source: &str,
    offset: u32,
    contexts: &mut Vec<ClassListContextIr>,
) {
    for directive in find_css_directive_ranges(source) {
        if directive.name == "compose" {
            if directive.block_range.is_some() || !directive.quoted_string_ranges.is_empty() {
                continue;
            }
            let Some(mut start) = utf16_to_byte_offset(source, directive.prelude_range.start)
            else {
                continue;
            };
            let Some(mut end) = utf16_to_byte_offset(source, directive.prelude_range.end) else {
                continue;
            };
            while start < end && source.as_bytes()[start].is_ascii_whitespace() {
                start += 1;
            }
            while end > start && source.as_bytes()[end - 1].is_ascii_whitespace() {
                end -= 1;
            }
            let Some(start) = byte_to_utf16_offset(source, start) else {
                continue;
            };
            let Some(end) = byte_to_utf16_offset(source, end) else {
                continue;
            };
            contexts.push(ClassListContextIr {
                start: offset + start,
                end: offset + end,
                unescape: Vec::new(),
            });
        } else if directive.name == "safelist" {
            for quoted in directive.quoted_string_ranges {
                contexts.push(ClassListContextIr {
                    start: offset + quoted.content_range.start,
                    end: offset + quoted.content_range.end,
                    unescape: Vec::new(),
                });
            }
        }
    }
}

pub(crate) fn collect_sfc_style_contexts(source: &str, contexts: &mut Vec<ClassListContextIr>) {
    let lower = source.to_ascii_lowercase();
    let mut cursor = 0;
    while let Some(relative_open) = lower[cursor..].find("<style") {
        let open = cursor + relative_open;
        let Some(relative_body) = source[open..].find('>') else {
            break;
        };
        let body_start = open + relative_body + 1;
        let Some(relative_close) = lower[body_start..].find("</style>") else {
            break;
        };
        let body_end = body_start + relative_close;
        let Some(offset) = byte_to_utf16_offset(source, body_start) else {
            break;
        };
        collect_css_directive_contexts(&source[body_start..body_end], offset, contexts);
        cursor = body_end + "</style>".len();
    }
}
