//! Comparison of resolved project states. No filesystem access or DOM cascade claims.
use crate::{CompileNativeCssOptions, CompilerError};
use mastercss_engine::EngineSession;
use mastercss_lexer::{
    CssSyntaxKind, collect_css_syntax_statements, collect_css_variable_references,
    tokenize_css_syntax,
};
use mastercss_schema::{GeneratedRuleIr, MatchStatus};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ProjectSnapshot {
    pub version: u32,
    pub manifest: Value,
    pub sources: Vec<ProjectSource>,
    /// Resolved, delivered native CSS in delivery order, after Master lowering.
    pub stylesheets: Vec<ProjectAsset>,
    /// Final output assets in delivery order. URLs are identities, not local paths.
    pub outputs: Vec<ProjectAsset>,
    /// Explicitly excluded paths/patterns; this is never inferred as full coverage.
    pub excluded: Vec<String>,
    /// Host extraction failures or dynamic sources which could not be enumerated.
    pub unresolved: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ProjectSource {
    pub path: String,
    pub classes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ProjectAsset {
    pub path: String,
    pub css: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ProjectComparisonRequest {
    pub before: ProjectSnapshot,
    pub after: ProjectSnapshot,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DefinitionChange {
    pub id: String,
    pub before: Option<Value>,
    pub after: Option<Value>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClassChange {
    pub class_name: String,
    pub files: Vec<String>,
    pub reasons: Vec<String>,
    pub changed_dependencies: Vec<String>,
    pub before_match_status: Option<MatchStatus>,
    pub after_match_status: Option<MatchStatus>,
    pub before_rules: Vec<GeneratedRuleIr>,
    pub after_rules: Vec<GeneratedRuleIr>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetChange {
    pub path: String,
    pub before: Option<String>,
    pub after: Option<String>,
    pub changed_dependencies: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectComparison {
    pub version: u32,
    pub definitions: Vec<DefinitionChange>,
    pub classes: Vec<ClassChange>,
    pub stylesheets: Vec<AssetChange>,
    pub outputs: Vec<AssetChange>,
    pub stylesheet_order_changed: bool,
    pub output_order_changed: bool,
    pub files: Vec<String>,
    pub coverage: ComparisonCoverage,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ComparisonCoverage {
    pub scope: &'static str,
    pub browser: &'static str,
    pub excluded: Vec<String>,
    pub unresolved: Vec<String>,
    pub notes: Vec<String>,
}

type Definitions = BTreeMap<String, Value>;
type Dependencies = BTreeMap<String, BTreeSet<String>>;
struct Analyzed {
    engine: EngineSession,
    definitions: Definitions,
    dependencies: Dependencies,
    native_classes: BTreeMap<String, BTreeSet<String>>,
    stylesheet_dependencies: Dependencies,
    classes: BTreeMap<String, BTreeSet<String>>,
}

fn error(message: impl ToString) -> CompilerError {
    CompilerError::Directive {
        message: message.to_string(),
        filename: "project snapshot".into(),
        range: None,
    }
}

fn semantic_definition(value: &Value) -> Value {
    match value {
        Value::Object(fields) => Value::Object(
            fields
                .iter()
                .filter(|(key, _)| key.as_str() != "source")
                .map(|(key, value)| (key.clone(), semantic_definition(value)))
                .collect(),
        ),
        Value::Array(values) => Value::Array(values.iter().map(semantic_definition).collect()),
        _ => value.clone(),
    }
}

fn refs(value: &str) -> BTreeSet<String> {
    collect_css_variable_references(value)
        .into_iter()
        .map(|name| format!("variable:--{name}"))
        .collect()
}

fn mixin_references(value: &Value, references: &mut BTreeSet<String>) {
    match value {
        Value::Object(fields) => {
            if value["type"] == "apply"
                && let Some(name) = value["name"].as_str()
            {
                references.insert(format!("mixin:{name}"));
            }
            for (key, child) in fields {
                if key != "source" {
                    mixin_references(child, references);
                }
            }
        }
        Value::Array(values) => {
            for value in values {
                mixin_references(value, references);
            }
        }
        _ => {}
    }
}

fn add_variable(
    definitions: &mut Definitions,
    dependencies: &mut Dependencies,
    name: &str,
    value: &str,
    evidence: Value,
) {
    let id = format!("variable:--{}", name.trim_start_matches("--"));
    definitions
        .entry(id.clone())
        .or_insert_with(|| json!([]))
        .as_array_mut()
        .unwrap()
        .push(evidence);
    dependencies.entry(id).or_default().extend(refs(value));
}

fn theme_definitions(
    nodes: &[Value],
    scope: &[String],
    definitions: &mut Definitions,
    dependencies: &mut Dependencies,
) {
    for node in nodes {
        if node["type"] == "declaration" {
            if let (Some(name), Some(value)) = (node["name"].as_str(), node["value"].as_str()) {
                add_variable(
                    definitions,
                    dependencies,
                    name,
                    value,
                    json!({"scope": scope, "declaration": node}),
                );
            }
        } else if let Some(children) = node["children"].as_array() {
            let mut nested = scope.to_vec();
            nested.push(node["prelude"].as_str().unwrap_or_default().into());
            theme_definitions(children, &nested, definitions, dependencies);
        }
    }
}

fn native_variables(
    asset: &ProjectAsset,
    definitions: &mut Definitions,
    dependencies: &mut Dependencies,
) {
    let tokens = tokenize_css_syntax(&asset.css);
    let statements = collect_css_syntax_statements(&tokens);
    for statement in &statements {
        if !statement.declaration {
            continue;
        }
        let start = statement.tokens.start;
        let Some(CssSyntaxKind::Ident(name)) = tokens.get(start).map(|token| &token.kind) else {
            continue;
        };
        if !name.starts_with("--")
            || !matches!(
                tokens.get(start + 1).map(|token| &token.kind),
                Some(CssSyntaxKind::Delim(':'))
            )
        {
            continue;
        }
        let Some(last) = tokens.get(statement.tokens.end.saturating_sub(1)) else {
            continue;
        };
        let value = &asset.css[tokens[start + 1].bytes.end..last.bytes.end];
        let mut scope = Vec::new();
        let mut parent = statement.parent;
        while let Some(index) = parent {
            let owner = &statements[index];
            let from = tokens[owner.tokens.start].bytes.start;
            let to = (owner.tokens.clone())
                .find(|&index| matches!(tokens[index].kind, CssSyntaxKind::Delim('{')))
                .map(|index| tokens[index].bytes.start)
                .unwrap_or(from);
            scope.push(asset.css[from..to].to_owned());
            parent = owner.parent;
        }
        scope.reverse();
        add_variable(
            definitions,
            dependencies,
            name,
            value,
            json!({"file": asset.path, "scope": scope, "value": value}),
        );
    }
}

fn unique_paths<'a>(
    paths: impl Iterator<Item = &'a str>,
    label: &str,
) -> Result<(), CompilerError> {
    let mut seen = BTreeSet::new();
    for path in paths {
        if path.is_empty() || !seen.insert(path) {
            return Err(error(format!(
                "{label} requires unique, nonempty identities: {path}"
            )));
        }
    }
    Ok(())
}

fn analyze(snapshot: &ProjectSnapshot) -> Result<Analyzed, CompilerError> {
    if snapshot.version != 1 {
        return Err(error(format!(
            "Unsupported project snapshot version {}",
            snapshot.version
        )));
    }
    unique_paths(
        snapshot.sources.iter().map(|item| item.path.as_str()),
        "Sources",
    )?;
    unique_paths(
        snapshot.stylesheets.iter().map(|item| item.path.as_str()),
        "Stylesheets",
    )?;
    unique_paths(
        snapshot.outputs.iter().map(|item| item.path.as_str()),
        "Outputs",
    )?;
    let engine = EngineSession::create(&snapshot.manifest.to_string()).map_err(error)?;
    let mut definitions = Definitions::new();
    let mut dependencies = Dependencies::new();
    if let Some(theme) = snapshot.manifest["theme"].as_array() {
        theme_definitions(theme, &[], &mut definitions, &mut dependencies);
    }
    // Retain execution metadata (inline/static/importance) as well as theme runs.
    if let Some(namespaces) = snapshot.manifest["variables"].as_object() {
        for (namespace, entries) in namespaces {
            for entry in entries.as_array().into_iter().flatten() {
                if let Some(key) = entry["key"].as_str() {
                    let name = if namespace.is_empty() {
                        key.to_owned()
                    } else {
                        format!("{namespace}-{key}")
                    };
                    let id = format!("variable:--{name}");
                    definitions
                        .entry(id.clone())
                        .or_insert_with(|| json!([]))
                        .as_array_mut()
                        .unwrap()
                        .push(entry.clone());
                    for value in entry["values"].as_array().into_iter().flatten() {
                        if let Some(value) = value["value"].as_str() {
                            dependencies
                                .entry(id.clone())
                                .or_default()
                                .extend(refs(value));
                        }
                    }
                }
            }
        }
    }
    for (field, kind) in [("mixins", "mixin"), ("keyframes", "keyframes")] {
        for definition in snapshot.manifest[field].as_array().into_iter().flatten() {
            if let Some(name) = definition["name"].as_str() {
                let id = format!("{kind}:{name}");
                if let Some(text) = definition["text"].as_str() {
                    dependencies
                        .entry(id.clone())
                        .or_default()
                        .extend(refs(text));
                }
                if kind == "mixin" {
                    mixin_references(definition, dependencies.entry(id.clone()).or_default());
                }
                definitions.insert(id, definition.clone());
            }
        }
    }
    if let Some(media) = snapshot.manifest["customMedia"].as_object() {
        for (name, value) in media {
            definitions.insert(format!("custom-media:{name}"), value.clone());
        }
    }
    let mut native_classes = BTreeMap::new();
    let mut stylesheet_dependencies = Dependencies::new();
    for asset in &snapshot.stylesheets {
        if tokenize_css_syntax(&asset.css).iter().any(|token| matches!(&token.kind, CssSyntaxKind::AtKeyword(name) if matches!(name.as_ref(), "theme" | "mixin" | "apply" | "contents" | "reference" | "source" | "safelist" | "blocklist" | "prune" | "preserve"))) {
            return Err(error(format!("Snapshot stylesheet {} must contain resolved native CSS, not Master directives", asset.path)));
        }
        native_variables(asset, &mut definitions, &mut dependencies);
        stylesheet_dependencies.insert(asset.path.clone(), refs(&asset.css));
        let compiled = crate::compile_css_directives(
            &asset.css,
            &CompileNativeCssOptions {
                from: asset.path.clone(),
                ..Default::default()
            },
        )?;
        native_classes.insert(
            asset.path.clone(),
            compiled.native_class_names.into_iter().collect(),
        );
    }
    let mut classes: BTreeMap<String, BTreeSet<String>> = BTreeMap::new();
    for source in &snapshot.sources {
        for class in &source.classes {
            classes
                .entry(class.clone())
                .or_default()
                .insert(source.path.clone());
        }
    }
    Ok(Analyzed {
        engine,
        definitions,
        dependencies,
        native_classes,
        stylesheet_dependencies,
        classes,
    })
}

fn closure(roots: BTreeSet<String>, graph: &Dependencies) -> BTreeSet<String> {
    let mut seen = BTreeSet::new();
    let mut pending: Vec<_> = roots.into_iter().collect();
    while let Some(id) = pending.pop() {
        if seen.insert(id.clone()) {
            pending.extend(graph.get(&id).into_iter().flatten().cloned());
        }
    }
    seen
}

fn affected(
    roots: BTreeSet<String>,
    state: &Analyzed,
    changed: &BTreeSet<String>,
) -> BTreeSet<String> {
    closure(roots, &state.dependencies)
        .intersection(changed)
        .cloned()
        .collect()
}

fn asset_changes(
    before: &[ProjectAsset],
    after: &[ProjectAsset],
    states: [&Analyzed; 2],
    changed: &BTreeSet<String>,
    dependencies: bool,
) -> Vec<AssetChange> {
    let left: BTreeMap<_, _> = before
        .iter()
        .map(|asset| (&asset.path, &asset.css))
        .collect();
    let right: BTreeMap<_, _> = after
        .iter()
        .map(|asset| (&asset.path, &asset.css))
        .collect();
    left.keys()
        .chain(right.keys())
        .copied()
        .collect::<BTreeSet<_>>()
        .into_iter()
        .filter_map(|path| {
            let before = left.get(path).copied();
            let after = right.get(path).copied();
            let mut changed_dependencies = BTreeSet::new();
            if dependencies {
                for state in states {
                    changed_dependencies.extend(affected(
                        state
                            .stylesheet_dependencies
                            .get(path)
                            .cloned()
                            .unwrap_or_default(),
                        state,
                        changed,
                    ));
                }
            }
            (before != after || !changed_dependencies.is_empty()).then(|| AssetChange {
                path: path.clone(),
                before: before.cloned(),
                after: after.cloned(),
                changed_dependencies: changed_dependencies.into_iter().collect(),
            })
        })
        .collect()
}

pub fn compare_project_snapshots(
    request: &ProjectComparisonRequest,
) -> Result<ProjectComparison, CompilerError> {
    let left = analyze(&request.before)?;
    let right = analyze(&request.after)?;
    let definitions: Vec<_> = left
        .definitions
        .keys()
        .chain(right.definitions.keys())
        .collect::<BTreeSet<_>>()
        .into_iter()
        .filter_map(|id| {
            let before = left.definitions.get(id);
            let after = right.definitions.get(id);
            (before.map(semantic_definition) != after.map(semantic_definition)).then(|| {
                DefinitionChange {
                    id: id.clone(),
                    before: before.cloned(),
                    after: after.cloned(),
                }
            })
        })
        .collect();
    let changed: BTreeSet<_> = definitions.iter().map(|change| change.id.clone()).collect();
    let stylesheet_order_changed = request
        .before
        .stylesheets
        .iter()
        .map(|asset| &asset.path)
        .ne(request.after.stylesheets.iter().map(|asset| &asset.path));
    let output_order_changed = request
        .before
        .outputs
        .iter()
        .map(|asset| &asset.path)
        .ne(request.after.outputs.iter().map(|asset| &asset.path));
    let stylesheets = asset_changes(
        &request.before.stylesheets,
        &request.after.stylesheets,
        [&left, &right],
        &changed,
        true,
    );
    let outputs = asset_changes(
        &request.before.outputs,
        &request.after.outputs,
        [&left, &right],
        &changed,
        false,
    );
    let changed_stylesheets: BTreeSet<_> = stylesheets
        .iter()
        .map(|asset| asset.path.as_str())
        .collect();
    let mut classes = Vec::new();
    for name in left
        .classes
        .keys()
        .chain(right.classes.keys())
        .collect::<BTreeSet<_>>()
    {
        let before = left.engine.inspect(name).map_err(error)?;
        let after = right.engine.inspect(name).map_err(error)?;
        let mut dependencies = BTreeSet::new();
        for (state, inspection) in [(&left, &before), (&right, &after)] {
            let mut roots: BTreeSet<_> = state
                .engine
                .class_definition_references(name)
                .map_err(error)?
                .into_iter()
                .collect();
            for rule in &inspection.rules {
                roots.extend(refs(&rule.text));
                roots.extend(
                    rule.variable_names
                        .iter()
                        .map(|name| format!("variable:--{}", name.trim_start_matches("--"))),
                );
                roots.extend(
                    rule.keyframe_names
                        .iter()
                        .map(|name| format!("keyframes:{name}")),
                );
                if rule.retain_all_keyframes {
                    roots.extend(
                        state
                            .definitions
                            .keys()
                            .filter(|id| id.starts_with("keyframes:"))
                            .cloned(),
                    );
                }
            }
            dependencies.extend(affected(roots, state, &changed));
        }
        let mut reasons = Vec::new();
        if left.classes.get(name) != right.classes.get(name) {
            reasons.push("usage-membership".into());
        }
        if before.rules != after.rules || before.match_status != after.match_status {
            reasons.push("generated-rules".into());
        }
        if !dependencies.is_empty() {
            reasons.push("definition-dependencies".into());
        }
        if [&left, &right].into_iter().any(|state| {
            state.native_classes.iter().any(|(file, names)| {
                names.contains(name)
                    && (stylesheet_order_changed || changed_stylesheets.contains(file.as_str()))
            })
        }) {
            reasons.push("native-stylesheet".into());
        }
        if reasons.is_empty() {
            continue;
        }
        classes.push(ClassChange {
            class_name: name.clone(),
            files: left
                .classes
                .get(name)
                .into_iter()
                .flatten()
                .chain(right.classes.get(name).into_iter().flatten())
                .cloned()
                .collect::<BTreeSet<_>>()
                .into_iter()
                .collect(),
            reasons,
            changed_dependencies: dependencies.into_iter().collect(),
            before_match_status: left
                .classes
                .contains_key(name)
                .then_some(before.match_status),
            after_match_status: right
                .classes
                .contains_key(name)
                .then_some(after.match_status),
            before_rules: before.rules,
            after_rules: after.rules,
        });
    }
    let files = classes
        .iter()
        .flat_map(|class| class.files.iter())
        .chain(stylesheets.iter().map(|asset| &asset.path))
        .cloned()
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect();
    Ok(ProjectComparison {
        version: 1, definitions, classes, stylesheets, outputs, stylesheet_order_changed, output_order_changed, files,
        coverage: ComparisonCoverage {
            scope: "known-sources", browser: "not-checked",
            excluded: request.before.excluded.iter().chain(&request.after.excluded).cloned().collect::<BTreeSet<_>>().into_iter().collect(),
            unresolved: request.before.unresolved.iter().chain(&request.after.unresolved).cloned().collect::<BTreeSet<_>>().into_iter().collect(),
            notes: vec![
                "Only supplied sources, definitions and delivered assets are covered; JavaScript, remote content and future DOM classes may add other consumers.".into(),
                "Native variable dependencies and selector consumers are conservative at stylesheet granularity; selectors, inheritance and conditions are not evaluated against a DOM.".into(),
                "CSS output and dependency changes are evidence for review, not verification of computed styles, accessibility or visual behavior.".into(),
                "Remote stylesheets and binary resource contents are not fetched or compared; delivered CSS retains their URL references.".into(),
            ],
        },
    })
}
