use super::{
    CompilerError, CssDirectiveConditionPathEntry, CssDirectiveStyleDefinition, CssRule, HashSet,
    NativeStyleContext, ThemeAtRule, condition_properties, lower_native_style_rule, minified_css,
    native_rule_list_has_directives, printed_selectors,
};
use crate::directives::{NativeStyleSlot, native_style_slot};
use crate::source_index::SourceIndex;

/// Traverses stylesheet-level containers without treating unrelated native children
/// (for example font faces and keyframes) as managed declarations.
pub(crate) struct NativeConditionalLowerer<'a> {
    /// Indexes of the original and rewritten sources, shared across every
    /// top-level rule of one compilation.
    pub source: &'a SourceIndex<'a>,
    pub filename: &'a str,
    pub rewritten: &'a SourceIndex<'a>,
    pub definitions: &'a mut Vec<CssDirectiveStyleDefinition>,
    pub order: &'a mut u32,
    pub slots: Option<&'a mut Vec<NativeStyleSlot>>,
    pub occupied: &'a mut HashSet<String>,
}

impl NativeConditionalLowerer<'_> {
    pub fn lower<'i>(
        &mut self,
        mut rule: CssRule<'i, ThemeAtRule>,
        path: &[CssDirectiveConditionPathEntry],
    ) -> Result<Option<CssRule<'i, ThemeAtRule>>, CompilerError> {
        if let CssRule::Custom(directive) = &rule
            && directive.name == super::DirectiveName::Apply
        {
            return Err(CompilerError::Directive {
                message: "@apply requires a style rule".into(),
                filename: self.filename.into(),
                range: None,
            });
        }
        if !native_rule_list_has_directives(std::slice::from_ref(&rule)) {
            return Ok(Some(rule));
        }
        if let CssRule::Style(style) = &rule {
            let start = self.definitions.len();
            let loc = style.loc;
            let context = NativeStyleContext {
                selectors: printed_selectors(&style.selectors.0, self.filename)?,
                selector_source: self.source.selector_reference(
                    self.filename,
                    self.rewritten,
                    0,
                    loc.line,
                    loc.column,
                ),
            };
            let CssRule::Style(style) = rule else {
                unreachable!()
            };
            lower_native_style_rule(
                self.source,
                self.filename,
                self.rewritten,
                style,
                context,
                path,
                self.definitions,
                self.order,
            )?;
            return Ok(self.slot(start, loc, path.len()));
        }
        let (children, condition) = match &mut rule {
            CssRule::Media(media) => (
                &mut media.rules.0,
                format!("@media {}", minified_css(&media.query, self.filename)?),
            ),
            CssRule::Supports(supports) => (
                &mut supports.rules.0,
                format!(
                    "@supports {}",
                    minified_css(&supports.condition, self.filename)?
                ),
            ),
            CssRule::Container(container) => {
                let mut prelude = Vec::new();
                if let Some(name) = &container.name {
                    prelude.push(minified_css(name, self.filename)?);
                }
                if let Some(condition) = &container.condition {
                    prelude.push(minified_css(condition, self.filename)?);
                }
                (
                    &mut container.rules.0,
                    format!("@container {}", prelude.join(" ")),
                )
            }
            CssRule::LayerBlock(layer) => {
                let condition = match &layer.name {
                    Some(name) => format!("@layer {}", minified_css(name, self.filename)?),
                    None => "@layer".into(),
                };
                (&mut layer.rules.0, condition)
            }
            CssRule::StartingStyle(style) => (&mut style.rules.0, "@starting-style".into()),
            _ => return Ok(Some(rule)),
        };
        let mut nested_path = path.to_vec();
        nested_path.push(CssDirectiveConditionPathEntry::Condition { value: condition });
        let mut retained = Vec::with_capacity(children.len());
        for child in std::mem::take(children) {
            if let Some(child) = self.lower(child, &nested_path)? {
                retained.push(child);
            }
        }
        *children = retained;
        Ok((!children.is_empty()).then_some(rule))
    }

    fn slot<'i>(
        &mut self,
        start: usize,
        loc: lightningcss::rules::Location,
        retained_prefix: usize,
    ) -> Option<CssRule<'i, ThemeAtRule>> {
        let slots = self.slots.as_deref_mut()?;
        let mut definitions = self.definitions[start..].to_vec();
        // The graph slot remains inside its authored container. Only conditions
        // introduced within the replaced style/application belong in its replacement.
        for definition in &mut definitions {
            if let CssDirectiveStyleDefinition::Apply { condition_path, .. } = definition {
                let suffix =
                    condition_path.as_deref().unwrap_or_default()[retained_prefix..].to_vec();
                *condition_path = (!suffix.is_empty()).then_some(suffix);
                continue;
            }
            let (conditions, path) = match definition {
                CssDirectiveStyleDefinition::Native {
                    conditions,
                    condition_path,
                    ..
                } => (conditions, condition_path),
                CssDirectiveStyleDefinition::Apply { .. } => unreachable!(),
            };
            let suffix = path.as_deref().unwrap_or_default()[retained_prefix..].to_vec();
            (*conditions, *path) = condition_properties(&suffix);
        }
        Some(native_style_slot(slots, self.occupied, &definitions, loc))
    }
}
