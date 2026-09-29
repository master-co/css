use super::{
    BUILTIN_NAMESPACES, CompilerError, CssDirectiveManifestInput, Map, NUMERIC_THEME_NAMESPACES,
    Number, Value, json,
};
use std::collections::HashMap;

pub(crate) fn manifest_error(message: impl Into<String>) -> CompilerError {
    CompilerError::Directive {
        message: message.into(),
        filename: "manifest.json".into(),
        range: None,
    }
}

pub(super) fn object(value: &Value) -> Result<&Map<String, Value>, CompilerError> {
    value
        .as_object()
        .ok_or_else(|| manifest_error("CSS directive manifest definition must be an object"))
}

pub(super) fn string_array(value: Option<&Value>) -> Vec<String> {
    value
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(Value::as_str)
        .map(str::to_owned)
        .collect()
}

pub(super) fn push_unique(target: &mut Vec<String>, value: impl Into<String>) {
    let value = value.into();
    if !target.contains(&value) {
        target.push(value);
    }
}

pub(super) fn collect_namespaces(
    input: &CssDirectiveManifestInput,
    base: Option<&Value>,
) -> Vec<String> {
    let mut namespaces = BUILTIN_NAMESPACES
        .iter()
        .map(|value| (*value).to_owned())
        .collect::<Vec<_>>();
    if let Some(variables) = base
        .and_then(Value::as_object)
        .and_then(|base| base.get("variables"))
        .and_then(Value::as_object)
    {
        for namespace in variables.keys() {
            if !namespace.is_empty() {
                push_unique(&mut namespaces, namespace.clone());
            }
        }
    }
    for mixin in input.mixins.iter().flatten() {
        if mixin.parameters.len() == 1
            && mixin.parameters[0].syntax == Some(mastercss_schema::MixinParameterSyntax::String)
        {
            push_unique(
                &mut namespaces,
                mixin.name.trim_start_matches("--").to_owned(),
            );
        }
    }
    namespaces.sort_by(|left, right| right.len().cmp(&left.len()).then_with(|| left.cmp(right)));
    namespaces
}

pub(super) fn resolved_variable_name(
    name: Option<&str>,
    namespace: Option<&str>,
    key: Option<&str>,
    namespaces: &[String],
) -> (String, String, Option<String>) {
    let explicit_name = name.unwrap_or_default().trim_start_matches("--");
    if namespace.is_some() || key.is_some() {
        let key = key.unwrap_or(explicit_name).to_owned();
        let name = namespace
            .map(|namespace| {
                if key.is_empty() {
                    namespace.to_owned()
                } else {
                    format!("{namespace}-{key}")
                }
            })
            .unwrap_or_else(|| key.clone());
        return (name, key, namespace.map(str::to_owned));
    }
    let namespace = namespaces
        .iter()
        .find(|namespace| explicit_name.starts_with(&format!("{namespace}-")))
        .cloned();
    let key = namespace
        .as_deref()
        .map(|namespace| explicit_name[namespace.len() + 1..].to_owned())
        .unwrap_or_else(|| explicit_name.to_owned());
    (explicit_name.to_owned(), key, namespace)
}

pub(super) fn variable_dependencies(value: &str) -> Vec<String> {
    mastercss_lexer::collect_css_variable_references(value)
}

pub(super) fn parse_numeric_value(
    value: &Value,
    namespace: Option<&str>,
) -> Option<(f64, Option<String>)> {
    if !namespace.is_some_and(|namespace| NUMERIC_THEME_NAMESPACES.contains(&namespace)) {
        return None;
    }
    if let Some(number) = value.as_f64() {
        return Some((number, None));
    }
    let source = value.as_str()?.trim();
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

pub(super) fn number_value(value: f64) -> Value {
    let value = if value == 0.0 { 0.0 } else { value };
    if value.fract() == 0.0 && value >= i64::MIN as f64 && value <= i64::MAX as f64 {
        return Value::Number((value as i64).into());
    }
    Number::from_f64(value)
        .map(Value::Number)
        .unwrap_or(Value::Null)
}

pub(super) fn variable_slot(variable: &Map<String, Value>) -> String {
    variable
        .get("name")
        .and_then(Value::as_str)
        .map(str::to_owned)
        .unwrap_or_else(|| {
            format!(
                "{}\0{}",
                variable
                    .get("namespace")
                    .and_then(Value::as_str)
                    .unwrap_or_default(),
                variable
                    .get("key")
                    .and_then(Value::as_str)
                    .unwrap_or_default()
            )
        })
}

/// Compiled variables with their slot positions, so repeated definitions merge
/// without rescanning every earlier variable.
#[derive(Default)]
pub(super) struct VariableTable {
    variables: Vec<Map<String, Value>>,
    slots: HashMap<String, usize>,
}

impl VariableTable {
    pub(super) fn position(&self, slot: &str) -> Option<usize> {
        self.slots.get(slot).copied()
    }

    pub(super) fn get_mut(&mut self, index: usize) -> &mut Map<String, Value> {
        &mut self.variables[index]
    }

    /// Appends a variable under its slot and returns its position.
    pub(super) fn insert(&mut self, variable: Map<String, Value>) -> usize {
        let index = self.variables.len();
        self.slots.insert(variable_slot(&variable), index);
        self.variables.push(variable);
        index
    }

    pub(super) fn into_variables(self) -> Vec<Map<String, Value>> {
        self.variables
    }
}

pub(super) fn compile_variables(
    input: &CssDirectiveManifestInput,
    base: Option<&Value>,
) -> Result<Vec<Map<String, Value>>, CompilerError> {
    let namespaces = collect_namespaces(input, base);
    let mut variables = VariableTable::default();
    fn visit(
        nodes: &[mastercss_schema::ThemeNode],
        path: &mut Vec<String>,
        namespaces: &[String],
        variables: &mut VariableTable,
    ) -> Result<(), CompilerError> {
        for node in nodes {
            match node {
                mastercss_schema::ThemeNode::Rule { prelude, children } => {
                    path.push(prelude.clone());
                    visit(children, path, namespaces, variables)?;
                    path.pop();
                }
                mastercss_schema::ThemeNode::Declaration { name, value } => {
                    let (_, key, namespace) =
                        resolved_variable_name(Some(name), None, None, namespaces);
                    let index = variables.position(name).unwrap_or_else(|| {
                        let mut variable = Map::new();
                        variable.insert("name".into(), name.clone().into());
                        variable.insert("key".into(), key.into());
                        if let Some(namespace) = namespace {
                            variable.insert("namespace".into(), namespace.into());
                        }
                        variable.insert("values".into(), json!([]));
                        variable.insert("dependencies".into(), json!([]));
                        variables.insert(variable)
                    });
                    let variable = variables.get_mut(index);
                    variable
                        .get_mut("values")
                        .and_then(Value::as_array_mut)
                        .expect("values")
                        .push(json!({ "path": path, "value": value }));
                    let mut dependencies = string_array(variable.get("dependencies"));
                    for dependency in variable_dependencies(value) {
                        push_unique(&mut dependencies, dependency);
                    }
                    variable.insert("dependencies".into(), json!(dependencies));
                }
            }
        }
        Ok(())
    }
    visit(
        input.theme.as_deref().unwrap_or_default(),
        &mut Vec::new(),
        &namespaces,
        &mut variables,
    )?;
    let mut variables = variables.into_variables();
    for variable in &mut variables {
        let namespace = variable.get("namespace").and_then(Value::as_str);
        let values = variable["values"].as_array().expect("scoped values");
        let numeric = values
            .iter()
            .map(|entry| parse_numeric_value(&entry["value"], namespace))
            .collect::<Option<Vec<_>>>();
        let common = numeric
            .as_ref()
            .and_then(|values| {
                values
                    .first()
                    .filter(|first| values.iter().all(|value| value == *first))
            })
            .cloned();
        variable.insert(
            "type".into(),
            if numeric.is_some() {
                "number"
            } else {
                "string"
            }
            .into(),
        );
        if let Some((value, unit)) = common {
            variable.insert(
                "numeric".into(),
                json!({ "value": number_value(value), "unit": unit.unwrap_or_default() }),
            );
        }
    }
    Ok(variables)
}

pub(super) fn group_variables(variables: Vec<Map<String, Value>>) -> Option<Value> {
    if variables.is_empty() {
        return None;
    }
    let mut grouped = Map::new();
    for mut variable in variables {
        let namespace = variable
            .shift_remove("namespace")
            .and_then(|value| value.as_str().map(str::to_owned))
            .unwrap_or_default();
        grouped
            .entry(namespace)
            .or_insert_with(|| Value::Array(Vec::new()))
            .as_array_mut()
            .expect("variable group is an array")
            .push(Value::Object(variable));
    }
    Some(Value::Object(grouped))
}
