#![forbid(unsafe_code)]

use mastercss_engine::EngineSession;
use mastercss_project::{collect_project_files, load_project_manifest};
use mastercss_scanner::ScannerSession;
use serde::Serialize;
use serde_json::Value;
use std::collections::HashSet;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::ExitCode;

const BINDING_ABI_VERSION: u32 = 1;
const DEFAULT_OUTPUT: &str = "master.css";
const DEFAULT_MANIFEST: &str = include_str!("../../../packages/preset/src/default-manifest.json");
const SELF_TEST_MANIFEST: &str = r#"{
  "version":1,
  "utilities":[{
    "id":"display-block",
    "name":"block",
    "type":-2,
    "emit":{"type":"static","rules":[{"declarations":{"display":"block"}}]},
    "matchers":[{"type":"static","name":"block"}]
  }]
}"#;
const SOURCE_EXTENSIONS: &[&str] = &[
    "html", "htm", "js", "jsx", "cjs", "ts", "tsx", "mts", "cts", "svelte", "astro", "vue", "md",
    "mdx", "pug", "php",
];

#[derive(Debug)]
struct CliError {
    code: &'static str,
    message: String,
}

impl CliError {
    fn new(code: &'static str, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }
}

#[derive(Debug)]
struct ScanArgs {
    source_patterns: Vec<String>,
    output: PathBuf,
    export: bool,
    verbose: u32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct BinaryInfo<'a> {
    binding_abi_version: u32,
    package_version: &'a str,
    manifest_version: u32,
    hydration_manifest_version: u32,
    target: &'a str,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SelfTest<'a> {
    version: u32,
    binary: BinaryInfo<'a>,
    css: String,
}

fn binary_info() -> BinaryInfo<'static> {
    BinaryInfo {
        binding_abi_version: BINDING_ABI_VERSION,
        package_version: env!("CARGO_PKG_VERSION"),
        manifest_version: mastercss_schema::MANIFEST_VERSION,
        hydration_manifest_version: mastercss_schema::HYDRATION_MANIFEST_VERSION,
        target: env!("MASTER_CSS_TARGET"),
    }
}

fn print_json(value: &impl Serialize) -> Result<(), CliError> {
    println!(
        "{}",
        serde_json::to_string(value)
            .map_err(|error| CliError::new("CLI_SERIALIZATION_FAILED", error.to_string()))?
    );
    Ok(())
}

fn self_test() -> Result<(), CliError> {
    let mut engine = EngineSession::create(SELF_TEST_MANIFEST)
        .map_err(|error| CliError::new("CLI_SELF_TEST_FAILED", error.to_string()))?;
    engine
        .ensure_class_rules(["block"])
        .map_err(|error| CliError::new("CLI_SELF_TEST_FAILED", error.to_string()))?;
    let css = engine.css_text();
    if css != "@layer utilities{.block{display:block}}" {
        return Err(CliError::new(
            "CLI_SELF_TEST_FAILED",
            format!("Unexpected self-test CSS: {css}"),
        ));
    }
    print_json(&SelfTest {
        version: 1,
        binary: binary_info(),
        css,
    })
}

fn print_help() {
    println!(
        "mcss {}\n\nUsage: mcss [OPTIONS] [source paths...]\n\nOptions:\n  -o, --output <path>  Specify the CSS output path [default: master.css]\n      --no-export      Print only CSS results\n  -v, --verbose <N>   Verbose logging level [default: 1]\n      --binding-info  Print native ABI and schema versions\n      --self-test     Run an engine/load smoke test\n  -V, --version       Print version\n  -h, --help          Print help\n\nCommands kept in the Node host during migration:\n  lint, inspect, --watch",
        env!("CARGO_PKG_VERSION")
    );
}

fn parse_scan_args(args: &[String]) -> Result<ScanArgs, CliError> {
    let mut source_patterns = Vec::new();
    let mut output = PathBuf::from(DEFAULT_OUTPUT);
    let mut export = true;
    let mut verbose = 1;
    let mut index = 0;
    while index < args.len() {
        match args[index].as_str() {
            "-o" | "--output" => {
                index += 1;
                let Some(value) = args.get(index) else {
                    return Err(CliError::new(
                        "CLI_INVALID_ARGUMENT",
                        "--output requires a path.",
                    ));
                };
                output = PathBuf::from(value);
            }
            "--no-export" => export = false,
            "-v" | "--verbose" => {
                index += 1;
                let Some(value) = args.get(index) else {
                    return Err(CliError::new(
                        "CLI_INVALID_ARGUMENT",
                        "--verbose requires a numeric level.",
                    ));
                };
                verbose = value.parse().map_err(|_| {
                    CliError::new("CLI_INVALID_ARGUMENT", "--verbose must be a number.")
                })?;
            }
            "--backend" => {
                index += 1;
                let Some(value) = args.get(index) else {
                    return Err(CliError::new(
                        "CLI_INVALID_ARGUMENT",
                        "--backend requires auto or native.",
                    ));
                };
                if value != "auto" && value != "native" {
                    return Err(CliError::new(
                        "CLI_INVALID_ARGUMENT",
                        "The native mcss executable accepts only auto or native backends.",
                    ));
                }
            }
            "-w" | "--watch" | "lint" | "inspect" => {
                return Err(CliError::new(
                    "CLI_COMMAND_UNAVAILABLE",
                    "This command remains in the @master/css-cli Node host during migration.",
                ));
            }
            value if value.starts_with('-') => {
                return Err(CliError::new(
                    "CLI_INVALID_ARGUMENT",
                    format!("Unknown option: {value}"),
                ));
            }
            value => source_patterns.push(value.to_owned()),
        }
        index += 1;
    }
    Ok(ScanArgs {
        source_patterns,
        output,
        export,
        verbose,
    })
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
    fn matches(pattern: &[u8], path: &[u8]) -> bool {
        if pattern.is_empty() {
            return path.is_empty();
        }
        if pattern.starts_with(b"**") {
            let remaining = &pattern[2..];
            if matches(remaining.strip_prefix(b"/").unwrap_or(remaining), path) {
                return true;
            }
            return !path.is_empty() && matches(pattern, &path[1..]);
        }
        match pattern[0] {
            b'*' => {
                matches(&pattern[1..], path)
                    || (!path.is_empty() && path[0] != b'/' && matches(pattern, &path[1..]))
            }
            b'?' => !path.is_empty() && path[0] != b'/' && matches(&pattern[1..], &path[1..]),
            value => !path.is_empty() && value == path[0] && matches(&pattern[1..], &path[1..]),
        }
    }
    matches(pattern.as_bytes(), path.as_bytes())
}

fn normalize_path(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

fn resolve_source_files(cwd: &Path, patterns: &[String]) -> Vec<PathBuf> {
    let extensions = SOURCE_EXTENSIONS.iter().copied().collect::<HashSet<_>>();
    let all_files = collect_project_files(cwd, &extensions);
    if patterns.is_empty() {
        return all_files;
    }
    let expanded_patterns = patterns
        .iter()
        .flat_map(|pattern| expand_braces(&pattern.replace('\\', "/")))
        .collect::<Vec<_>>();
    let mut files = Vec::new();
    for pattern in &expanded_patterns {
        let direct = cwd.join(pattern);
        if direct.is_file() {
            files.push(direct);
        }
    }
    for file in all_files {
        let relative = file.strip_prefix(cwd).unwrap_or(&file);
        let relative = normalize_path(relative);
        if expanded_patterns
            .iter()
            .any(|pattern| glob_matches(pattern, &relative))
        {
            files.push(file);
        }
    }
    files.sort();
    files.dedup();
    files
}

fn run_scan(args: ScanArgs) -> Result<(), CliError> {
    let cwd = env::current_dir()
        .map_err(|error| CliError::new("CLI_PROJECT_IO_FAILED", error.to_string()))?;
    let base_manifest: Value = serde_json::from_str(DEFAULT_MANIFEST)
        .map_err(|error| CliError::new("CLI_MANIFEST_INVALID", error.to_string()))?;
    let project = load_project_manifest(&cwd, base_manifest)
        .map_err(|error| CliError::new("CLI_PROJECT_LOAD_FAILED", error.to_string()))?;
    let manifest_json = serde_json::to_string(&project.manifest)
        .map_err(|error| CliError::new("CLI_SERIALIZATION_FAILED", error.to_string()))?;
    let mut scanner = ScannerSession::create(&manifest_json)
        .map_err(|error| CliError::new("CLI_SCANNER_FAILED", error.to_string()))?;
    let source_files = resolve_source_files(&cwd, &args.source_patterns);
    for file in &source_files {
        let content = fs::read_to_string(file).map_err(|error| {
            CliError::new(
                "CLI_PROJECT_IO_FAILED",
                format!("Cannot read {}: {error}", file.display()),
            )
        })?;
        scanner
            .scan(&normalize_path(file), &content)
            .map_err(|error| CliError::new("CLI_SCANNER_FAILED", error.to_string()))?;
    }
    if !project.extraction_policy.safelist.is_empty() {
        scanner
            .ensure_classes(&project.extraction_policy.safelist)
            .map_err(|error| CliError::new("CLI_SCANNER_FAILED", error.to_string()))?;
    }
    let generated_css = scanner
        .state()
        .map_err(|error| CliError::new("CLI_SCANNER_FAILED", error.to_string()))?
        .engine
        .text;
    let css = [project.native_css, project.generated_css, generated_css]
        .into_iter()
        .filter(|value| !value.is_empty())
        .collect::<Vec<_>>()
        .join("\n\n");

    if args.export {
        let output = if args.output.is_absolute() {
            args.output
        } else {
            cwd.join(args.output)
        };
        if let Some(parent) = output.parent() {
            fs::create_dir_all(parent).map_err(|error| {
                CliError::new(
                    "CLI_PROJECT_IO_FAILED",
                    format!("Cannot create {}: {error}", parent.display()),
                )
            })?;
        }
        fs::write(&output, &css).map_err(|error| {
            CliError::new(
                "CLI_PROJECT_IO_FAILED",
                format!("Cannot write {}: {error}", output.display()),
            )
        })?;
        if args.verbose > 0 {
            eprintln!("{} exported {} B", output.display(), css.len());
        }
    } else {
        println!("{css}");
    }
    Ok(())
}

fn run() -> Result<(), CliError> {
    let args = env::args().skip(1).collect::<Vec<_>>();
    match args.as_slice() {
        [flag] if flag == "--help" || flag == "-h" => {
            print_help();
            Ok(())
        }
        [flag] if flag == "--version" || flag == "-V" => {
            println!("mcss {}", env!("CARGO_PKG_VERSION"));
            Ok(())
        }
        [flag] if flag == "--binding-info" => print_json(&binary_info()),
        [flag] if flag == "--self-test" => self_test(),
        _ => run_scan(parse_scan_args(&args)?),
    }
}

fn main() -> ExitCode {
    match run() {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!(
                "{}",
                serde_json::json!({
                    "code": error.code,
                    "message": error.message
                })
            );
            ExitCode::from(2)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn self_test_engine_contract_is_stable() {
        let mut engine = EngineSession::create(SELF_TEST_MANIFEST).unwrap();
        engine.ensure_class_rules(["block"]).unwrap();
        assert_eq!(engine.css_text(), "@layer utilities{.block{display:block}}");
    }

    #[test]
    fn matches_cross_platform_glob_patterns() {
        assert!(!glob_matches("src/**/*.{ts,tsx}", "src/a/b.tsx"));
        assert!(
            expand_braces("src/**/*.{ts,tsx}")
                .iter()
                .any(|pattern| glob_matches(pattern, "src/a/b.tsx"))
        );
        assert!(!glob_matches("src/**/*.ts", "test/a.ts"));
    }
}
