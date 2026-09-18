use crate::{
    CssDirectiveSourceReference, CssOutputMapping, CssRule, ParserOptions, SourceLocationRange,
    SourceRange, StyleSheet, ThemeAtRule, ThemeAtRuleParser, byte_offset_for_location,
    byte_to_utf16_offset,
};
use lightningcss::rules::Location;

fn location(rule: &CssRule<'_, ThemeAtRule>) -> Option<(&'static str, Location)> {
    macro_rules! locations {
        ($($kind:ident),*) => {
            match rule {
                $(CssRule::$kind(value) => Some((stringify!($kind), value.loc)),)*
                CssRule::Ignored | CssRule::Custom(_) => None,
            }
        };
    }
    locations!(
        Media,
        Import,
        Style,
        Keyframes,
        FontFace,
        FontPaletteValues,
        FontFeatureValues,
        Page,
        Supports,
        CounterStyle,
        Namespace,
        MozDocument,
        Nesting,
        NestedDeclarations,
        Viewport,
        CustomMedia,
        LayerStatement,
        LayerBlock,
        Property,
        Container,
        Scope,
        StartingStyle,
        ViewTransition,
        PositionTry,
        Unknown
    )
}

struct Mapper<'a> {
    source: &'a str,
    parsed_source: &'a str,
    output: &'a str,
    filename: &'a str,
    mappings: Vec<CssOutputMapping>,
}

impl Mapper<'_> {
    fn anchor(&self, original: Location, generated: Location) -> Option<CssOutputMapping> {
        let original_byte =
            byte_offset_for_location(self.parsed_source, original.line, original.column)?;
        let generated_byte =
            byte_offset_for_location(self.output, generated.line, generated.column)?;
        let original_offset = byte_to_utf16_offset(self.source, original_byte)?;
        let loc = crate::variant::source_location(self.source, original_byte)?;
        Some(CssOutputMapping {
            generated_start: byte_to_utf16_offset(self.output, generated_byte)?,
            generated_end: None,
            source: CssDirectiveSourceReference {
                file: Some(self.filename.into()),
                range: SourceRange {
                    start: original_offset,
                    end: original_offset,
                },
                loc: Some(SourceLocationRange {
                    start: loc.clone(),
                    end: loc,
                }),
            },
        })
    }

    fn rules(
        &mut self,
        original: &[CssRule<'_, ThemeAtRule>],
        output: &[CssRule<'_, ThemeAtRule>],
    ) {
        let original = original
            .iter()
            .filter(|rule| !matches!(rule, CssRule::Ignored))
            .collect::<Vec<_>>();
        let output = output
            .iter()
            .filter(|rule| !matches!(rule, CssRule::Ignored))
            .collect::<Vec<_>>();
        // The printer can omit rules. Never associate different trees by index.
        if original.len() != output.len()
            || original.iter().zip(&output).any(|(a, b)| {
                location(a).map(|(kind, _)| kind) != location(b).map(|(kind, _)| kind)
            })
        {
            return;
        }
        for (original, output) in original.into_iter().zip(output) {
            if let Some(mapping) = location(original)
                .zip(location(output))
                .and_then(|((_, original), (_, generated))| self.anchor(original, generated))
            {
                self.mappings.push(mapping);
            }
            macro_rules! children {
                ($($kind:ident),*) => {
                    match (original, output) {
                        $((CssRule::$kind(a), CssRule::$kind(b)) => self.rules(&a.rules.0, &b.rules.0),)*
                        (CssRule::Nesting(a), CssRule::Nesting(b)) => self.rules(&a.style.rules.0, &b.style.rules.0),
                        _ => {},
                    }
                };
            }
            children!(
                Media,
                Style,
                Supports,
                MozDocument,
                LayerBlock,
                Container,
                Scope,
                StartingStyle
            );
        }
    }
}

pub(crate) fn native_output_mappings(
    source: &str,
    parsed_source: &str,
    filename: &str,
    rules: &[CssRule<'_, ThemeAtRule>],
    output: &str,
) -> Vec<CssOutputMapping> {
    if output.is_empty() {
        return Vec::new();
    }
    let Ok(printed) = StyleSheet::parse_with(
        output,
        ParserOptions::default(),
        &mut ThemeAtRuleParser::default(),
    ) else {
        return Vec::new();
    };
    let mut mapper = Mapper {
        source,
        parsed_source,
        output,
        filename,
        mappings: Vec::new(),
    };
    mapper.rules(rules, &printed.rules.0);
    mapper.mappings
}

/// Lightning CSS nested-declaration locations point into the first value.
/// Recover that declaration's authored range from the shared syntax lexer.
pub(crate) fn refine_native_declaration_sources(
    source: &str,
    definitions: &mut [crate::CssDirectiveStyleDefinition],
) {
    use mastercss_lexer::{collect_css_syntax_statements, tokenize_css_syntax};
    if !definitions.iter().any(|definition| {
        matches!(
            definition,
            crate::CssDirectiveStyleDefinition::Native {
                source: Some(_),
                ..
            }
        )
    }) {
        return;
    }
    let tokens = tokenize_css_syntax(source);
    let mut ranges = collect_css_syntax_statements(&tokens)
        .into_iter()
        .filter(|statement| statement.declaration && !statement.tokens.is_empty())
        .filter_map(|statement| {
            let start = tokens[statement.tokens.start].bytes.start;
            let end = tokens[statement.tokens.end - 1].bytes.end;
            Some((byte_to_utf16_offset(source, start)?, start, end))
        })
        .collect::<Vec<_>>();
    ranges.sort_by_key(|range| range.0);
    for definition in definitions {
        let crate::CssDirectiveStyleDefinition::Native {
            source: Some(reference),
            ..
        } = definition
        else {
            continue;
        };
        let index = ranges.partition_point(|(start, _, _)| *start <= reference.range.start);
        let Some((_, start, end)) = index.checked_sub(1).and_then(|index| ranges.get(index)) else {
            continue;
        };
        if byte_to_utf16_offset(source, *end).is_some_and(|end| end >= reference.range.start)
            && let Some(mapped) = crate::source_reference_from_bytes(
                source,
                reference.file.as_deref().unwrap_or_default(),
                *start,
                *end,
            )
        {
            *reference = mapped;
        }
    }
}
