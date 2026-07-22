#![forbid(unsafe_code)]

use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

use mastercss_compiler::{
    CompileManifestOptions, CompileNativeCssOptions, CompilerError, CssImportProvider,
    compile_css_directives, compile_manifest_input_with_styles, inspect_css,
    resolve_css_import_graph,
};
use mastercss_schema::CssDirectiveExtractionPolicy;
use serde::Serialize;
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
    load_project_manifest_entries(&find_css_manifest_entries(project_dir), base_manifest)
}

pub fn load_project_manifest_entries(
    entries: &[PathBuf],
    base_manifest: Value,
) -> Result<ProjectManifestIr, ProjectError> {
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

    for entry in entries {
        let entry = entry.canonicalize().map_err(|source| ProjectError::Io {
            path: entry.clone(),
            source,
        })?;
        let entry_text = entry.to_string_lossy().into_owned();
        let graph = resolve_css_import_graph(&entry_text, &FilesystemCssProvider)?;
        let result = compile_css_directives(
            &graph.source,
            &CompileNativeCssOptions {
                from: entry_text.clone(),
                preserve_native_css: false,
                classes: None,
            },
        )?;
        manifest = compile_manifest_input_with_styles(
            &result.manifest_input,
            result.style_definitions.as_deref().unwrap_or_default(),
            &CompileManifestOptions {
                base_manifest: Some(manifest),
            },
        )?
        .manifest;

        resolved_entries.push(entry_text);
        push_unique(&mut dependencies, graph.dependencies);
        push_unique(&mut dependencies, result.dependencies);
        push_unique(&mut class_names, result.class_names);
        push_unique(&mut native_class_names, result.native_class_names);
        push_unique(&mut warnings, result.warnings);
        merge_extraction_policy(&mut extraction_policy, result.extraction_policy);
        if !result.native_css.is_empty() {
            native_css.push(result.native_css);
        }
        if !result.css.is_empty() {
            css.push(result.css);
        }
        if !result.generated_css.is_empty() {
            generated_css.push(result.generated_css);
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
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_project() -> PathBuf {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let path = std::env::temp_dir().join(format!("mastercss-project-{nonce}"));
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
}
