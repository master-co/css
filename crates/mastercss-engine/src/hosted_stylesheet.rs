//! A stylesheet delivered with a rendered page can already provide resources that
//! generated CSS would otherwise define again. Rendering counts them as the page's
//! emitted globals, which the hydration manifest hands to the runtime.
use super::*;
use mastercss_lexer::{CssSyntaxKind as Kind, collect_css_syntax_statements, tokenize_css_syntax};
use mastercss_schema::ThemeNode;

/// Compare preludes regardless of the whitespace that minifiers remove.
fn normalize_prelude(prelude: &str) -> String {
    let mut output = String::new();
    let mut depth = 0usize;
    let mut space = false;
    for character in prelude.chars() {
        if character.is_whitespace() {
            space = !output.is_empty();
            continue;
        }
        if space {
            let previous = output.chars().last();
            let joined = matches!(previous, Some(',' | '(' | '>' | '+' | '~'))
                || matches!(character, ',' | ')' | '>' | '+' | '~')
                || depth > 0 && (previous == Some(':') || character == ':');
            if !joined {
                output.push(' ');
            }
            space = false;
        }
        match character {
            '(' => depth += 1,
            ')' => depth = depth.saturating_sub(1),
            _ => {}
        }
        output.push(character);
    }
    output
}

fn is_layer(prelude: &str) -> bool {
    prelude
        .get(..6)
        .is_some_and(|keyword| keyword.eq_ignore_ascii_case("@layer"))
}

fn theme_paths(
    nodes: &[ThemeNode],
    chain: &mut Vec<String>,
    paths: &mut HashMap<String, Vec<Vec<String>>>,
) {
    for node in nodes {
        match node {
            ThemeNode::Rule { prelude, children } => {
                let layer = is_layer(prelude);
                if !layer {
                    chain.push(normalize_prelude(prelude));
                }
                theme_paths(children, chain, paths);
                if !layer {
                    chain.pop();
                }
            }
            ThemeNode::Declaration { name, .. } => {
                let entry = paths.entry(name.clone()).or_default();
                if !entry.contains(chain) {
                    entry.push(chain.clone());
                }
            }
        }
    }
}

/// Custom properties with the rule paths that declare them, ignoring cascade layers.
fn declared_paths(css: &str) -> HashMap<String, HashSet<Vec<String>>> {
    let tokens = tokenize_css_syntax(css);
    let statements = collect_css_syntax_statements(&tokens);
    let mut declared: HashMap<String, HashSet<Vec<String>>> = HashMap::default();
    'declarations: for statement in &statements {
        if !statement.declaration {
            continue;
        }
        let Kind::Ident(property) = &tokens[statement.tokens.start].kind else {
            continue;
        };
        let Some(name) = property.strip_prefix("--") else {
            continue;
        };
        let mut chain = Vec::new();
        let mut parent = statement.parent;
        while let Some(index) = parent {
            let ancestor = &statements[index];
            parent = ancestor.parent;
            if ancestor.tokens.is_empty() {
                continue 'declarations;
            }
            if let Kind::AtKeyword(keyword) = &tokens[ancestor.tokens.start].kind
                && keyword.to_ascii_lowercase().ends_with("keyframes")
            {
                continue 'declarations;
            }
            let prelude = &css[tokens[ancestor.tokens.start].bytes.start
                ..tokens[ancestor.tokens.end - 1].bytes.end];
            if !is_layer(prelude) {
                chain.push(normalize_prelude(prelude));
            }
        }
        chain.reverse();
        declared.entry(name.to_owned()).or_default().insert(chain);
    }
    declared
}

impl EngineSession {
    /// Resources `native_css` provides that the host has not reported yet: variables
    /// it declares on every theme path that defines them, and keyframes it uses
    /// through a native slot on the page, whose frames rendering materializes there.
    fn hosted_stylesheet_resources(&self, native_css: &str) -> EmittedGlobals {
        let mut hosted = EmittedGlobals::default();
        let declared = declared_paths(native_css);
        if !declared.is_empty() {
            let mut paths = HashMap::default();
            theme_paths(&self.compiled.theme, &mut Vec::new(), &mut paths);
            for (name, chains) in &declared {
                if self.emitted_globals.variable_count(name) == 0
                    && self.compiled.compiled_variables.contains_key(name)
                    && paths
                        .get(name)
                        .is_some_and(|theme| theme.iter().all(|chain| chains.contains(chain)))
                {
                    hosted.variables.insert(name.clone(), 1);
                }
            }
        }
        let slots = super::keyframe_slots::active_slot_ids(native_css);
        let animation = super::animation::analyze(
            &stylesheet_declarations(&self.keyframe_template(native_css)),
            &self.compiled,
        );
        for definition in &self.compiled.keyframes {
            let own_slot = slots.contains(definition.slot_id.as_ref().unwrap_or(&definition.id));
            if own_slot && !self.emitted_globals.keyframe_slots.contains(&definition.id) {
                hosted.keyframe_slots.push(definition.id.clone());
            }
            if (own_slot || self.keyframe_has_slot(&definition.id))
                && (animation.retain_all || animation.names.contains(&definition.name))
                && !self
                    .emitted_globals
                    .suppressed_keyframes
                    .contains(&definition.id)
                && !self.emitted_globals.keyframes.contains_key(&definition.id)
            {
                hosted.keyframes.insert(definition.id.clone(), 1);
            }
        }
        hosted
    }

    /// Register a stylesheet delivered with the rendered page. Unlike
    /// `ensure_stylesheet_resources`, resources the stylesheet provides itself become
    /// emitted globals rather than references that generated CSS defines again.
    pub fn ensure_hosted_stylesheet_resources(
        &mut self,
        native_css: &str,
    ) -> Result<EngineTransitionIr, EngineError> {
        self.ensure_active()?;
        let hosted = self.hosted_stylesheet_resources(native_css);
        if hosted.is_empty() {
            return self.ensure_stylesheet_resources(native_css);
        }
        let mut emitted_globals = self.emitted_globals.clone();
        emitted_globals.variables.extend(hosted.variables);
        emitted_globals.keyframes.extend(hosted.keyframes);
        emitted_globals.keyframe_slots.extend(hosted.keyframe_slots);
        self.stylesheet_sources.push(native_css.into());
        self.rebuild(emitted_globals)
    }
}

#[cfg(test)]
mod tests {
    use super::normalize_prelude;

    #[test]
    fn normalizes_minified_preludes() {
        assert_eq!(normalize_prelude(":root, :host"), ":root,:host");
        assert_eq!(
            normalize_prelude("@media (prefers-color-scheme : dark)"),
            "@media (prefers-color-scheme:dark)"
        );
        assert_eq!(normalize_prelude(".dark  .card > a"), ".dark .card>a");
        assert_ne!(
            normalize_prelude(".a :hover"),
            normalize_prelude(".a:hover")
        );
    }
}
