use super::{CompilerError, CssDirectiveStyleDefinition, EngineSession};
use mastercss_schema::CssCompositionTrace;

/// Compiler-only provenance. None of this is serialized into the runtime manifest.
pub(super) fn inspect_compositions(
    definitions: &[CssDirectiveStyleDefinition],
    engine: &mut EngineSession,
) -> Result<Vec<CssCompositionTrace>, CompilerError> {
    let mut statements: Vec<Vec<CssDirectiveStyleDefinition>> = Vec::new();
    let mut previous = None;
    for definition in definitions {
        let CssDirectiveStyleDefinition::Compose { order, .. } = definition else {
            previous = None;
            continue;
        };
        if previous != Some(*order) {
            statements.push(Vec::new());
        }
        statements.last_mut().unwrap().push(definition.clone());
        previous = Some(*order);
    }
    statements
        .into_iter()
        .map(|statement| {
            let CssDirectiveStyleDefinition::Compose {
                order,
                directive_source,
                source,
                ..
            } = &statement[0]
            else {
                unreachable!()
            };
            let mut trace = CssCompositionTrace {
                order: *order,
                classes: Vec::new(),
                resolved_utilities: Vec::new(),
                source: directive_source.clone().or_else(|| source.clone()),
                definition_sources: Vec::new(),
                css: String::new(),
                variable_names: Vec::new(),
                animation_names: Vec::new(),
            };
            for definition in &statement {
                let CssDirectiveStyleDefinition::Compose { class_name, .. } = definition else {
                    unreachable!()
                };
                trace.classes.push(class_name.clone());
                for rule in engine
                    .inspect(class_name)
                    .map_err(|error| super::resolution::directive_error(error.to_string()))?
                    .rules
                {
                    for name in rule.variable_names {
                        if !trace.variable_names.contains(&name) {
                            trace.variable_names.push(name);
                        }
                    }
                    for name in rule.animation_names {
                        if !trace.animation_names.contains(&name) {
                            trace.animation_names.push(name);
                        }
                    }
                }
            }
            trace.css = super::render::render_style_definitions(
                super::merge::create_merged_style_definitions(&statement, engine, None)?,
            )
            .0;
            attach_definition_sources(&mut trace, definitions, engine)?;
            Ok(trace)
        })
        .collect()
}

pub(crate) fn attach_definition_sources(
    trace: &mut CssCompositionTrace,
    definitions: &[CssDirectiveStyleDefinition],
    engine: &EngineSession,
) -> Result<(), CompilerError> {
    let mut pending = trace.classes.clone();
    let mut visited = std::collections::HashSet::new();
    while let Some(class) = pending.pop() {
        if !visited.insert(class.clone()) {
            continue;
        }
        let names = engine
            .composition_rules(&class)
            .map_err(|error| super::resolution::directive_error(error.to_string()))?
            .into_iter()
            .filter_map(|rule| rule.utility_name)
            .collect::<Vec<_>>();
        for name in &names {
            if !trace.resolved_utilities.contains(name) {
                trace.resolved_utilities.push(name.clone());
            }
        }
        for definition in definitions {
            let (name, source, dependency) = match definition {
                CssDirectiveStyleDefinition::Native {
                    name: Some(name),
                    selector_source,
                    ..
                } => (name, selector_source, None),
                CssDirectiveStyleDefinition::Compose {
                    name: Some(name),
                    selector_source,
                    class_name,
                    ..
                } => (name, selector_source, Some(class_name)),
                _ => continue,
            };
            if names.contains(name) {
                if let Some(source) = source
                    && !trace.definition_sources.contains(source)
                {
                    trace.definition_sources.push(source.clone());
                }
                if let Some(dependency) = dependency {
                    pending.push(dependency.clone());
                }
            }
        }
    }
    Ok(())
}
