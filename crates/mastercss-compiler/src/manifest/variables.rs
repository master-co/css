use super::{
    BUILTIN_NAMESPACES, CompilerError, CssDirectiveManifestInput, NUMERIC_THEME_NAMESPACES,
};
use mastercss_schema::{
    ManifestVariable, MasterCssManifest, ScopedThemeValue, ThemeNode, UtilityKind, VariableNumeric,
};
use serde_json::Number;
use std::collections::HashMap;

pub(crate) fn manifest_error(message: impl Into<String>) -> CompilerError {
    CompilerError::Directive {
        message: message.into(),
        filename: "manifest.json".into(),
        range: None,
    }
}

pub(super) fn push_unique(target: &mut Vec<String>, value: impl Into<String>) {
    let value = value.into();
    if !target.contains(&value) {
        target.push(value);
    }
}

/// The namespaces a theme declaration name can start with, longest first.
fn collect_namespaces(
    input: &CssDirectiveManifestInput,
    base: Option<&MasterCssManifest>,
) -> Vec<String> {
    let mut namespaces = BUILTIN_NAMESPACES
        .iter()
        .map(|value| (*value).to_owned())
        .collect::<Vec<_>>();
    for namespace in base
        .and_then(|base| base.variables.as_ref())
        .into_iter()
        .flat_map(|groups| groups.keys())
    {
        if !namespace.is_empty() {
            push_unique(&mut namespaces, namespace.clone());
        }
    }
    let base_utilities = base.and_then(|base| base.utilities.as_ref());
    for utility in input.utilities.iter().chain(base_utilities).flatten() {
        if utility.kind == UtilityKind::Token
            && let Some(parameter) = utility.recipe.parameters.first()
        {
            push_unique(
                &mut namespaces,
                parameter.name.trim_start_matches("--").to_owned(),
            );
        }
    }
    namespaces.sort_by(|left, right| right.len().cmp(&left.len()).then_with(|| left.cmp(right)));
    namespaces
}

/// The key and namespace of the theme declaration `name`: the longest namespace
/// it starts with, and the rest.
fn split_variable_name(name: &str, namespaces: &[String]) -> (String, Option<String>) {
    let name = name.trim_start_matches("--");
    match namespaces.iter().find(|namespace| {
        name.strip_prefix(namespace.as_str())
            .is_some_and(|rest| rest.starts_with('-'))
    }) {
        Some(namespace) => (
            name[namespace.len() + 1..].to_owned(),
            Some(namespace.clone()),
        ),
        None => (name.to_owned(), None),
    }
}

fn parse_numeric_value(value: &str, namespace: Option<&str>) -> Option<(f64, Option<String>)> {
    if !namespace.is_some_and(|namespace| NUMERIC_THEME_NAMESPACES.contains(&namespace)) {
        return None;
    }
    let source = value.trim();
    let (number, unit) = if let Some(number) = source.strip_suffix("rem") {
        (number, Some("rem"))
    } else if let Some(number) = source.strip_suffix("px") {
        (number, Some("px"))
    } else {
        (source, None)
    };
    let number = number.parse::<f64>().ok()?;
    Some((number, unit.map(str::to_owned)))
}

/// An integral number as an integer; `None` when it is not finite.
fn number_value(value: f64) -> Option<Number> {
    let value = if value == 0.0 { 0.0 } else { value };
    if value.fract() == 0.0 && value >= i64::MIN as f64 && value <= i64::MAX as f64 {
        return Some((value as i64).into());
    }
    Number::from_f64(value)
}

/// Compiled variables with their name positions, so repeated declarations merge
/// without rescanning every earlier variable.
#[derive(Default)]
struct VariableTable {
    variables: Vec<ManifestVariable>,
    slots: HashMap<String, usize>,
}

impl VariableTable {
    fn value(&mut self, name: &str, value: ScopedThemeValue, namespaces: &[String]) {
        let index = *self.slots.entry(name.to_owned()).or_insert_with(|| {
            let (key, namespace) = split_variable_name(name, namespaces);
            self.variables.push(ManifestVariable {
                name: Some(name.to_owned()),
                key,
                namespace,
                dependencies: Some(Vec::new()),
                ..ManifestVariable::default()
            });
            self.variables.len() - 1
        });
        let variable = &mut self.variables[index];
        let dependencies = variable.dependencies.get_or_insert_default();
        for dependency in mastercss_lexer::collect_css_variable_references(&value.value) {
            push_unique(dependencies, dependency);
        }
        variable.values.push(value);
    }
}

/// The variables the theme of `input` declares, with their scoped values in
/// declaration order, their type, and the number every value shares.
pub(super) fn compile_variables(
    input: &CssDirectiveManifestInput,
    base: Option<&MasterCssManifest>,
) -> Vec<ManifestVariable> {
    let namespaces = collect_namespaces(input, base);
    let mut table = VariableTable::default();
    fn visit(
        nodes: &[ThemeNode],
        path: &mut Vec<String>,
        namespaces: &[String],
        table: &mut VariableTable,
    ) {
        for node in nodes {
            match node {
                ThemeNode::Rule { prelude, children } => {
                    path.push(prelude.clone());
                    visit(children, path, namespaces, table);
                    path.pop();
                }
                ThemeNode::Declaration {
                    name,
                    value,
                    inline,
                    is_static,
                } => table.value(
                    name,
                    ScopedThemeValue {
                        path: path.clone(),
                        value: value.clone(),
                        inline: *inline,
                        is_static: *is_static,
                    },
                    namespaces,
                ),
            }
        }
    }
    visit(
        input.theme.as_deref().unwrap_or_default(),
        &mut Vec::new(),
        &namespaces,
        &mut table,
    );
    let mut variables = table.variables;
    for variable in &mut variables {
        let numeric = variable
            .values
            .iter()
            .map(|entry| parse_numeric_value(&entry.value, variable.namespace.as_deref()))
            .collect::<Option<Vec<_>>>();
        let common = numeric
            .as_ref()
            .and_then(|values| {
                values
                    .first()
                    .filter(|first| values.iter().all(|value| value == *first))
            })
            .cloned();
        variable.variable_type = Some(
            if numeric.is_some() {
                "number"
            } else {
                "string"
            }
            .into(),
        );
        if let Some((value, unit)) = common {
            variable.numeric = Some(VariableNumeric {
                value: number_value(value),
                unit: unit.unwrap_or_default(),
            });
        }
    }
    variables
}
