#![forbid(unsafe_code)]

use std::collections::HashSet;
use std::fs;
use std::path::{Component, Path, PathBuf};

use mastercss_compiler::{
    CompileNativeCssOptions, CompilerError, CssImportProvider, LowerCssDirectivesOptions,
    compile_css_directives, inspect_css, lower_css_directives, resolve_css_import_graph,
};
use mastercss_schema::CssDirectiveExtractionPolicy;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use thiserror::Error;

const IGNORED_DIRECTORIES: &[&str] = &[
    "node_modules",
    "dist",
    "out",
    ".next",
    ".nuxt",
    ".svelte-kit",
];

pub const PROJECT_SOURCE_PLAN_VERSION: u32 = 1;

#[derive(Debug, Error)]
pub enum ProjectError {
    #[error("Cannot read project resource {path}: {source}")]
    Io {
        path: PathBuf,
        source: std::io::Error,
    },
    #[error(transparent)]
    Compiler(#[from] CompilerError),
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectManifestIr {
    pub entries: Vec<String>,
    pub manifest: Value,
    pub dependencies: Vec<String>,
    pub extraction_policy: CssDirectiveExtractionPolicy,
    pub class_names: Vec<String>,
    pub native_class_names: Vec<String>,
    #[serde(rename = "nativeCSS")]
    pub native_css: String,
    pub css: String,
    #[serde(rename = "generatedCSS")]
    pub generated_css: String,
    pub warnings: Vec<String>,
    pub source_plan: ProjectSourcePlanIr,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectEntryGraphIr {
    pub entry: String,
    pub source: String,
    pub dependencies: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSourcePlanIr {
    pub version: u32,
    pub entries: Vec<ProjectSourceEntryPlanIr>,
    pub files: Vec<String>,
}

impl Default for ProjectSourcePlanIr {
    fn default() -> Self {
        Self {
            version: PROJECT_SOURCE_PLAN_VERSION,
            entries: Vec::new(),
            files: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSourceEntryPlanIr {
    pub entry: String,
    pub include: Vec<String>,
    pub exclude: Vec<String>,
    pub files: Vec<String>,
}

struct FilesystemCssProvider;

impl CssImportProvider for FilesystemCssProvider {
    type Error = String;

    fn load(&self, id: &str) -> Result<String, Self::Error> {
        fs::read_to_string(id).map_err(|error| error.to_string())
    }

    fn resolve(&self, specifier: &str, from: &str) -> Result<Option<String>, Self::Error> {
        if !specifier.starts_with('.') && !Path::new(specifier).is_absolute() {
            return Ok(None);
        }
        let from = Path::new(from);
        let candidate = if Path::new(specifier).is_absolute() {
            PathBuf::from(specifier)
        } else {
            from.parent()
                .unwrap_or_else(|| Path::new(""))
                .join(specifier)
        };
        candidate
            .canonicalize()
            .map(|path| Some(path.to_string_lossy().into_owned()))
            .map_err(|error| error.to_string())
    }
}

fn push_unique(target: &mut Vec<String>, values: impl IntoIterator<Item = String>) {
    for value in values {
        if !target.contains(&value) {
            target.push(value);
        }
    }
}

fn merge_extraction_policy(
    target: &mut CssDirectiveExtractionPolicy,
    source: CssDirectiveExtractionPolicy,
) {
    push_unique(&mut target.include, source.include);
    push_unique(&mut target.exclude, source.exclude);
    push_unique(&mut target.safelist, source.safelist);
    for value in source.blocklist {
        if !target.blocklist.contains(&value) {
            target.blocklist.push(value);
        }
    }
    target.preserve_native |= source.preserve_native;
}

fn normalize_lexical_path(path: &Path) -> PathBuf {
    let mut normalized = PathBuf::new();
    for component in path.components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                if !normalized.pop() {
                    normalized.push(component.as_os_str());
                }
            }
            _ => normalized.push(component.as_os_str()),
        }
    }
    normalized
}

fn normalize_path(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

fn expand_braces(pattern: &str) -> Vec<String> {
    let Some(open) = pattern.find('{') else {
        return vec![pattern.to_owned()];
    };
    let Some(relative_close) = pattern[open + 1..].find('}') else {
        return vec![pattern.to_owned()];
    };
    let close = open + 1 + relative_close;
    pattern[open + 1..close]
        .split(',')
        .flat_map(|choice| {
            expand_braces(&format!(
                "{}{}{}",
                &pattern[..open],
                choice,
                &pattern[close + 1..]
            ))
        })
        .collect()
}

fn glob_matches(pattern: &str, path: &str) -> bool {
    fn is_component_start(path: &[u16], index: usize) -> bool {
        index == 0 || path.get(index.wrapping_sub(1)) == Some(&(b'/' as u16))
    }

    fn class_match(pattern: &[u16], start: usize, value: u16) -> Option<(usize, bool)> {
        let mut index = start + 1;
        let negated = matches!(pattern.get(index), Some(value) if *value == b'!' as u16 || *value == b'^' as u16);
        if negated {
            index += 1;
        }
        let mut matched = false;
        let mut had_value = false;
        while let Some(&current) = pattern.get(index) {
            if current == b']' as u16 && had_value {
                return Some((index + 1, if negated { !matched } else { matched }));
            }
            had_value = true;
            if pattern.get(index + 1) == Some(&(b'-' as u16)) {
                let end = *pattern.get(index + 2)?;
                if end == b']' as u16 {
                    return None;
                }
                matched |= current <= value && value <= end;
                index += 3;
            } else {
                matched |= current == value;
                index += 1;
            }
        }
        None
    }

    fn matches(
        pattern: &[u16],
        path: &[u16],
        pattern_index: usize,
        path_index: usize,
        memo: &mut std::collections::HashMap<(usize, usize), bool>,
    ) -> bool {
        if let Some(result) = memo.get(&(pattern_index, path_index)) {
            return *result;
        }
        let result = if pattern_index == pattern.len() {
            path_index == path.len()
        } else if pattern.get(pattern_index..pattern_index + 2) == Some(&[b'*' as u16, b'*' as u16])
        {
            let mut next = pattern_index + 2;
            while pattern.get(next) == Some(&(b'*' as u16)) {
                next += 1;
            }
            if pattern.get(next) == Some(&(b'/' as u16)) {
                next += 1;
            }
            matches(pattern, path, next, path_index, memo)
                || (path_index < path.len()
                    && !(is_component_start(path, path_index) && path[path_index] == b'.' as u16)
                    && matches(pattern, path, pattern_index, path_index + 1, memo))
        } else {
            match pattern[pattern_index] {
                value if value == b'*' as u16 => {
                    matches(pattern, path, pattern_index + 1, path_index, memo)
                        || (path_index < path.len()
                            && path[path_index] != b'/' as u16
                            && !(is_component_start(path, path_index)
                                && path[path_index] == b'.' as u16)
                            && matches(pattern, path, pattern_index, path_index + 1, memo))
                }
                value if value == b'?' as u16 => {
                    path_index < path.len()
                        && path[path_index] != b'/' as u16
                        && !(is_component_start(path, path_index)
                            && path[path_index] == b'.' as u16)
                        && matches(pattern, path, pattern_index + 1, path_index + 1, memo)
                }
                value if value == b'[' as u16 => path
                    .get(path_index)
                    .filter(|value| **value != b'/' as u16)
                    .and_then(|value| class_match(pattern, pattern_index, *value))
                    .is_some_and(|(next, matched)| {
                        matched && matches(pattern, path, next, path_index + 1, memo)
                    }),
                value => {
                    path.get(path_index) == Some(&value)
                        && matches(pattern, path, pattern_index + 1, path_index + 1, memo)
                }
            }
        };
        memo.insert((pattern_index, path_index), result);
        result
    }

    let pattern = pattern.encode_utf16().collect::<Vec<_>>();
    let path = path.encode_utf16().collect::<Vec<_>>();
    matches(&pattern, &path, 0, 0, &mut std::collections::HashMap::new())
}

fn resolve_source_pattern(project_dir: &Path, entry: &Path, pattern: &str) -> String {
    let pattern = pattern.replace('\\', "/");
    let path = Path::new(&pattern);
    let resolved = if path.is_absolute() {
        path.to_path_buf()
    } else if pattern.starts_with("./") || pattern.starts_with("../") {
        entry.parent().unwrap_or(project_dir).join(path)
    } else {
        project_dir.join(path)
    };
    normalize_path(&normalize_lexical_path(&resolved))
}

fn source_pattern_root(pattern: &str) -> PathBuf {
    let wildcard = pattern
        .char_indices()
        .find_map(|(index, character)| "*?[{".contains(character).then_some(index));
    let prefix = wildcard.map_or(pattern, |index| &pattern[..index]);
    let prefix = Path::new(prefix);
    if wildcard.is_none() || prefix.to_string_lossy().ends_with(['/', '\\']) {
        prefix.to_path_buf()
    } else {
        prefix
            .parent()
            .unwrap_or_else(|| Path::new(""))
            .to_path_buf()
    }
}

fn has_glob_magic(pattern: &str) -> bool {
    pattern.chars().any(|character| "*?[{".contains(character))
}

fn collect_source_files(directory: &Path, files: &mut Vec<PathBuf>) -> Result<(), ProjectError> {
    let children = match fs::read_dir(directory) {
        Ok(children) => children,
        Err(error)
            if matches!(
                error.kind(),
                std::io::ErrorKind::NotFound | std::io::ErrorKind::NotADirectory
            ) =>
        {
            return Ok(());
        }
        Err(source) => {
            return Err(ProjectError::Io {
                path: directory.to_path_buf(),
                source,
            });
        }
    };
    for child in children {
        let child = child.map_err(|source| ProjectError::Io {
            path: directory.to_path_buf(),
            source,
        })?;
        let path = child.path();
        let file_type = child.file_type().map_err(|source| ProjectError::Io {
            path: path.clone(),
            source,
        })?;
        if file_type.is_dir() {
            collect_source_files(&path, files)?;
        } else if file_type.is_file() {
            files.push(path);
        }
    }
    Ok(())
}

fn resolve_source_entry_plan(
    project_dir: &Path,
    entry: &Path,
    policy: &CssDirectiveExtractionPolicy,
) -> Result<ProjectSourceEntryPlanIr, ProjectError> {
    let include = policy
        .include
        .iter()
        .map(|pattern| resolve_source_pattern(project_dir, entry, pattern))
        .flat_map(|pattern| expand_braces(&pattern))
        .collect::<Vec<_>>();
    let exclude = policy
        .exclude
        .iter()
        .map(|pattern| resolve_source_pattern(project_dir, entry, pattern))
        .flat_map(|pattern| expand_braces(&pattern))
        .collect::<Vec<_>>();
    let mut candidates = Vec::new();
    for pattern in &include {
        let direct = PathBuf::from(pattern);
        if direct.is_file() {
            candidates.push(direct);
            continue;
        }
        if !has_glob_magic(pattern) {
            continue;
        }
        collect_source_files(&source_pattern_root(pattern), &mut candidates)?;
    }
    let mut files = candidates
        .into_iter()
        .filter_map(|file| {
            let file = normalize_path(&normalize_lexical_path(&file));
            (include.iter().any(|pattern| glob_matches(pattern, &file))
                && !exclude.iter().any(|pattern| glob_matches(pattern, &file)))
            .then_some(file)
        })
        .collect::<Vec<_>>();
    files.sort();
    files.dedup();

    Ok(ProjectSourceEntryPlanIr {
        entry: normalize_path(entry),
        include,
        exclude,
        files,
    })
}

fn collect_entries(directory: &Path, entries: &mut Vec<PathBuf>) {
    let Ok(children) = fs::read_dir(directory) else {
        return;
    };
    for child in children.flatten() {
        let path = child.path();
        let Ok(file_type) = child.file_type() else {
            continue;
        };
        if file_type.is_dir() {
            if child
                .file_name()
                .to_str()
                .is_some_and(|name| IGNORED_DIRECTORIES.contains(&name))
            {
                continue;
            }
            collect_entries(&path, entries);
        } else if file_type.is_file() && path.extension().is_some_and(|value| value == "css") {
            let Ok(source) = fs::read_to_string(&path) else {
                continue;
            };
            if inspect_css(&source).has_master_entry {
                entries.push(path.canonicalize().unwrap_or(path));
            }
        }
    }
}

pub fn find_css_manifest_entries(project_dir: &Path) -> Vec<PathBuf> {
    let mut entries = Vec::new();
    collect_entries(project_dir, &mut entries);
    entries.sort();
    entries.dedup();
    entries
}

pub fn load_project_manifest(
    project_dir: &Path,
    base_manifest: Value,
) -> Result<ProjectManifestIr, ProjectError> {
    let project_dir = project_dir
        .canonicalize()
        .map_err(|source| ProjectError::Io {
            path: project_dir.to_path_buf(),
            source,
        })?;
    load_project_manifest_entries_with_root(
        &project_dir,
        &find_css_manifest_entries(&project_dir),
        base_manifest,
    )
}

pub fn load_project_manifest_entries(
    entries: &[PathBuf],
    base_manifest: Value,
) -> Result<ProjectManifestIr, ProjectError> {
    let project_dir = entries
        .first()
        .and_then(|entry| entry.parent())
        .unwrap_or_else(|| Path::new("."));
    load_project_manifest_entries_with_root(project_dir, entries, base_manifest)
}

pub fn load_project_manifest_entries_with_root(
    project_dir: &Path,
    entries: &[PathBuf],
    base_manifest: Value,
) -> Result<ProjectManifestIr, ProjectError> {
    let mut graphs = Vec::with_capacity(entries.len());
    for entry in entries {
        let entry = entry.canonicalize().map_err(|source| ProjectError::Io {
            path: entry.clone(),
            source,
        })?;
        let entry_text = entry.to_string_lossy().into_owned();
        let graph = resolve_css_import_graph(&entry_text, &FilesystemCssProvider)?;
        graphs.push(ProjectEntryGraphIr {
            entry: entry_text,
            source: graph.source,
            dependencies: graph.dependencies,
        });
    }
    load_project_manifest_graphs_with_root(project_dir, graphs, base_manifest)
}

pub fn load_project_manifest_graphs_with_root(
    project_dir: &Path,
    graphs: Vec<ProjectEntryGraphIr>,
    base_manifest: Value,
) -> Result<ProjectManifestIr, ProjectError> {
    let project_dir = project_dir
        .canonicalize()
        .map_err(|source| ProjectError::Io {
            path: project_dir.to_path_buf(),
            source,
        })?;
    let mut manifest = base_manifest;
    let mut dependencies = Vec::new();
    let mut extraction_policy = CssDirectiveExtractionPolicy::default();
    let mut class_names = Vec::new();
    let mut native_class_names = Vec::new();
    let mut native_css = Vec::new();
    let mut css = Vec::new();
    let mut generated_css = Vec::new();
    let mut warnings = Vec::new();
    let mut resolved_entries = Vec::new();
    let mut source_plan = ProjectSourcePlanIr::default();

    for graph in graphs {
        let entry_path = PathBuf::from(&graph.entry);
        let entry = entry_path
            .canonicalize()
            .map_err(|source| ProjectError::Io {
                path: entry_path,
                source,
            })?;
        let entry_text = entry.to_string_lossy().into_owned();
        let result = compile_css_directives(
            &graph.source,
            &CompileNativeCssOptions {
                from: entry_text.clone(),
                preserve_native_css: false,
                classes: None,
            },
        )?;
        let lowered = lower_css_directives(
            &result.manifest_input,
            result.style_definitions.as_deref().unwrap_or_default(),
            &result.warnings,
            &LowerCssDirectivesOptions {
                base_manifest: Some(manifest),
                resolution_manifest: None,
            },
        )?;
        manifest = lowered.manifest;

        resolved_entries.push(entry_text);
        push_unique(&mut dependencies, graph.dependencies);
        push_unique(&mut dependencies, result.dependencies);
        push_unique(&mut class_names, result.class_names);
        push_unique(&mut native_class_names, result.native_class_names);
        push_unique(&mut warnings, lowered.warnings);
        let entry_source_plan =
            resolve_source_entry_plan(&project_dir, &entry, &result.extraction_policy)?;
        push_unique(&mut source_plan.files, entry_source_plan.files.clone());
        if !entry_source_plan.include.is_empty() || !entry_source_plan.exclude.is_empty() {
            source_plan.entries.push(entry_source_plan);
        }
        merge_extraction_policy(&mut extraction_policy, result.extraction_policy);
        if !result.native_css.is_empty() {
            native_css.push(result.native_css.clone());
        }
        if !lowered.generated_css.is_empty() {
            css.push(
                [result.native_css.as_str(), lowered.generated_css.as_str()]
                    .into_iter()
                    .filter(|value| !value.is_empty())
                    .collect::<Vec<_>>()
                    .join("\n"),
            );
            generated_css.push(lowered.generated_css);
        } else if !result.native_css.is_empty() {
            css.push(result.native_css.clone());
        }
    }

    Ok(ProjectManifestIr {
        entries: resolved_entries,
        manifest,
        dependencies,
        extraction_policy,
        class_names,
        native_class_names,
        native_css: native_css.join("\n"),
        css: css.join("\n"),
        generated_css: generated_css.join("\n"),
        warnings,
        source_plan,
    })
}

pub fn collect_project_files(project_dir: &Path, extensions: &HashSet<&str>) -> Vec<PathBuf> {
    fn visit(directory: &Path, extensions: &HashSet<&str>, files: &mut Vec<PathBuf>) {
        let Ok(children) = fs::read_dir(directory) else {
            return;
        };
        for child in children.flatten() {
            let path = child.path();
            let Ok(file_type) = child.file_type() else {
                continue;
            };
            if file_type.is_dir() {
                if child
                    .file_name()
                    .to_str()
                    .is_some_and(|name| IGNORED_DIRECTORIES.contains(&name))
                {
                    continue;
                }
                visit(&path, extensions, files);
            } else if file_type.is_file()
                && path
                    .extension()
                    .and_then(|value| value.to_str())
                    .is_some_and(|value| extensions.contains(value))
            {
                files.push(path);
            }
        }
    }

    let mut files = Vec::new();
    visit(project_dir, extensions, &mut files);
    files.sort();
    files
}

#[cfg(test)]
mod tests {
    use super::*;
    use mastercss_scanner::ScannerSession;
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::time::{SystemTime, UNIX_EPOCH};

    static TEMP_PROJECT_COUNTER: AtomicU64 = AtomicU64::new(0);

    fn temp_project() -> PathBuf {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let counter = TEMP_PROJECT_COUNTER.fetch_add(1, Ordering::Relaxed);
        let path = std::env::temp_dir().join(format!(
            "mastercss-project-{}-{nonce}-{counter}",
            std::process::id()
        ));
        fs::create_dir_all(&path).unwrap();
        path
    }

    #[test]
    fn discovers_entries_and_compiles_local_imports() {
        let project = temp_project();
        fs::write(
            project.join("entry.css"),
            "@master entry; @import './components.css';",
        )
        .unwrap();
        fs::write(
            project.join("components.css"),
            "@components { btn { display: block; } }",
        )
        .unwrap();
        fs::create_dir_all(project.join("node_modules/ignored")).unwrap();
        fs::write(
            project.join("node_modules/ignored/entry.css"),
            "@master entry;",
        )
        .unwrap();

        let entries = find_css_manifest_entries(&project);
        assert_eq!(entries.len(), 1);
        let result = load_project_manifest_entries(
            &entries,
            serde_json::json!({ "version": 1, "utilities": [] }),
        )
        .unwrap();
        let mut scanner = ScannerSession::create(&result.manifest.to_string()).unwrap();
        scanner
            .scan("index.html", "<button class=\"btn\"></button>")
            .unwrap();
        let css = scanner.state().unwrap().engine.text;
        assert!(
            css.contains(".btn{display:block}"),
            "css={css} manifest={}",
            result.manifest
        );
        assert_eq!(result.dependencies.len(), 2);

        fs::remove_dir_all(project).unwrap();
    }

    #[test]
    fn lowers_compose_definitions_against_the_base_manifest() {
        let project = temp_project();
        let entry = project.join("entry.css");
        fs::write(&entry, "@master entry; .hidden-card { @compose hidden; }").unwrap();
        let base_manifest = serde_json::from_str(include_str!(
            "../../../packages/preset/src/default-manifest.json"
        ))
        .unwrap();

        let result = load_project_manifest_entries(&[entry], base_manifest).unwrap();
        assert!(
            result.generated_css.contains(".hidden-card{display:none}"),
            "generated CSS: {}",
            result.generated_css
        );
        assert!(result.css.contains(".hidden-card{display:none}"));

        fs::remove_dir_all(project).unwrap();
    }

    #[test]
    fn resolves_entry_owned_source_plans_and_arbitrary_extensions() {
        let workspace = temp_project();
        let project = workspace.join("app");
        let styles = project.join("styles");
        let templates = project.join("templates");
        let shared = workspace.join("shared");
        fs::create_dir_all(&styles).unwrap();
        fs::create_dir_all(&templates).unwrap();
        fs::create_dir_all(&shared).unwrap();
        fs::write(
            styles.join("entry.css"),
            r#"@master entry;
@source "../templates/**/*.{liquid,erb}";
@source not "../templates/skip.*";
@source "../../shared/*.cshtml";"#,
        )
        .unwrap();
        fs::write(
            templates.join("product.liquid"),
            "<div class=\"block\"></div>",
        )
        .unwrap();
        fs::write(templates.join("detail.erb"), "<div class=\"m:0\"></div>").unwrap();
        fs::write(
            templates.join("skip.liquid"),
            "<div class=\"fg:red\"></div>",
        )
        .unwrap();
        fs::write(
            shared.join("shell.cshtml"),
            "<div class=\"text:center\"></div>",
        )
        .unwrap();

        let result = load_project_manifest(
            &project,
            serde_json::json!({ "version": 1, "utilities": [] }),
        )
        .unwrap();
        let entry_plan = &result.source_plan.entries[0];
        assert_eq!(result.source_plan.version, PROJECT_SOURCE_PLAN_VERSION);
        assert_eq!(
            entry_plan.entry,
            normalize_path(&styles.join("entry.css").canonicalize().unwrap())
        );
        assert_eq!(entry_plan.include.len(), 3);
        assert_eq!(entry_plan.exclude.len(), 1);
        assert_eq!(
            result.source_plan.files,
            vec![
                normalize_path(&templates.join("detail.erb").canonicalize().unwrap()),
                normalize_path(&templates.join("product.liquid").canonicalize().unwrap()),
                normalize_path(&shared.join("shell.cshtml").canonicalize().unwrap()),
            ]
        );

        fs::remove_dir_all(workspace).unwrap();
    }

    #[test]
    fn resolves_bare_source_patterns_from_the_project_root() {
        let project = temp_project();
        fs::create_dir_all(project.join("styles")).unwrap();
        fs::create_dir_all(project.join("views")).unwrap();
        fs::write(
            project.join("styles/entry.css"),
            "@master entry; @source \"views/*.tmpl\";",
        )
        .unwrap();
        fs::write(
            project.join("views/page.tmpl"),
            "<div class=\"block\"></div>",
        )
        .unwrap();

        let result = load_project_manifest(
            &project,
            serde_json::json!({ "version": 1, "utilities": [] }),
        )
        .unwrap();
        assert_eq!(
            result.source_plan.files,
            vec![normalize_path(
                &project.join("views/page.tmpl").canonicalize().unwrap()
            )]
        );

        fs::remove_dir_all(project).unwrap();
    }

    #[test]
    fn matches_source_globs_with_fast_glob_compatible_primitives() {
        assert!(glob_matches("/root/**/[a-c]?.tsx", "/root/a/b2.tsx"));
        assert!(glob_matches("/root/icon-??.svg", "/root/icon-😀.svg"));
        assert!(!glob_matches("/root/icon-?.svg", "/root/icon-😀.svg"));
        assert!(!glob_matches("/root/**/*.tsx", "/root/.hidden/page.tsx"));
        assert!(glob_matches(
            "/root/.hidden/**/*.tsx",
            "/root/.hidden/page.tsx"
        ));
        assert!(glob_matches("/root/[!a]*.tsx", "/root/button.tsx"));
        assert!(!glob_matches("/root/[!a]*.tsx", "/root/alert.tsx"));
    }
}
