use crate::source_index::SourceIndex;
use crate::{
    CssDirectiveSourceReference, CssOutputMapping, CssRule, ParserOptions, SourceLocationRange,
    SourceRange, StyleSheet, ThemeAtRule, ThemeAtRuleParser,
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
    source: SourceIndex<'a>,
    parsed_source: SourceIndex<'a>,
    output: SourceIndex<'a>,
    filename: &'a str,
    mappings: Vec<CssOutputMapping>,
}

impl Mapper<'_> {
    fn anchor(&self, original: Location, generated: Location) -> Option<CssOutputMapping> {
        let original_byte = self
            .parsed_source
            .byte_offset_for_location(original.line, original.column)?;
        let generated_byte = self
            .output
            .byte_offset_for_location(generated.line, generated.column)?;
        let original_offset = self.source.utf16_offset(original_byte)?;
        let loc = self.source.location(original_byte)?;
        Some(CssOutputMapping {
            generated_start: self.output.utf16_offset(generated_byte)?,
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
        source: SourceIndex::new(source),
        parsed_source: SourceIndex::new(parsed_source),
        output: SourceIndex::new(output),
        filename,
        mappings: Vec::new(),
    };
    mapper.rules(rules, &printed.rules.0);
    mapper.mappings
}

/// Recover authored declaration order (including importance) and individual
/// source ranges after Lightning CSS separates important declarations.
pub(crate) fn refine_native_declaration_sources(
    source: &str,
    definitions: &mut [crate::CssDirectiveStyleDefinition],
) {
    use mastercss_lexer::{CssSyntaxKind, collect_css_syntax_statements, tokenize_css_syntax};
    let source_index = SourceIndex::new(source);
    let tokens = tokenize_css_syntax(source);
    let statements = collect_css_syntax_statements(&tokens);
    let mut ranges = statements.iter().filter(|statement| statement.declaration)
        .filter_map(|statement| {
            let first = &tokens[statement.tokens.start];
            let CssSyntaxKind::Ident(property) = &first.kind else { return None };
            let last = &tokens[statement.tokens.end - 1];
            let important = matches!(&last.kind, CssSyntaxKind::Ident(value) if value.eq_ignore_ascii_case("important"))
                && statement.tokens.len() >= 3
                && tokens[statement.tokens.end - 2].kind == CssSyntaxKind::Delim('!');
            Some((first.bytes.start, last.bytes.end, property.as_ref(), important, statement.parent))
        }).collect::<Vec<_>>();
    ranges.sort_by_key(|entry| entry.0);
    for definition in definitions {
        let crate::CssDirectiveStyleDefinition::Native {
            source: Some(reference),
            declarations,
            ..
        } = definition
        else {
            continue;
        };
        let Some(anchor) = source_index.byte_offset(reference.range.start) else {
            continue;
        };
        let index = ranges.partition_point(|(start, ..)| *start <= anchor);
        let first = index
            .checked_sub(1)
            .filter(|index| ranges[*index].1 >= anchor)
            .unwrap_or(index);
        let Some(candidates) = ranges.get(first..first + declarations.len()) else {
            continue;
        };
        if candidates.iter().any(|entry| entry.4 != candidates[0].4) {
            continue;
        }
        let mut used = std::collections::HashSet::new();
        for declaration in declarations.iter_mut() {
            let important = declaration
                .value
                .as_str()
                .is_some_and(|value| value.ends_with("!important"));
            if let Some((index, (start, end, _, _, _))) =
                candidates.iter().enumerate().find(|(index, entry)| {
                    !used.contains(index)
                        && (if entry.2.starts_with("--") {
                            entry.2 == declaration.property
                        } else {
                            entry.2.eq_ignore_ascii_case(&declaration.property)
                        })
                        && entry.3 == important
                })
            {
                used.insert(index);
                declaration.source = source_index.reference(
                    reference.file.as_deref().unwrap_or_default(),
                    *start,
                    *end,
                );
            }
        }
        if used.len() == declarations.len() {
            declarations.sort_by_key(|declaration| {
                declaration.source.as_ref().map(|source| source.range.start)
            });
            if let Some(source) = declarations
                .first()
                .and_then(|declaration| declaration.source.as_ref())
            {
                *reference = source.clone();
            }
        }
    }
}
