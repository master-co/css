#![forbid(unsafe_code)]

use std::collections::HashSet;
use std::env;
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};

use mastercss_compiler::{
    CompileNativeCssOptions, LowerCssDirectivesOptions, compile_css_directives,
    lower_css_directives,
};
use mastercss_engine::EngineSession;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};

const GENERATED_CONTRACT_TEMPLATE: &str = include_str!("../templates/rust-contract.ts");
static COPY_NONCE: AtomicU64 = AtomicU64::new(0);
const BINDING_TARGET_PACKAGES: [&str; 8] = [
    "binding-darwin-arm64",
    "binding-darwin-x64",
    "binding-linux-arm64-gnu",
    "binding-linux-arm64-musl",
    "binding-linux-x64-gnu",
    "binding-linux-x64-musl",
    "binding-win32-arm64-msvc",
    "binding-win32-x64-msvc",
];

#[derive(Deserialize)]
struct ParityFile {
    exceptions: Vec<ParityException>,
}

#[derive(Deserialize)]
struct ParityException {
    id: String,
    reason: String,
    old: String,
    new: String,
    packages: Vec<String>,
    test: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SemanticParityCorpus {
    version: u32,
    semantic_baseline: String,
    public_baseline: String,
    engine_cases: Vec<EngineParityCase>,
    compiler_cases: Vec<CompilerParityCase>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct EngineParityCase {
    id: String,
    manifest: Value,
    #[serde(default)]
    emitted_globals: Option<Value>,
    steps: Vec<EngineParityStep>,
}

#[derive(Deserialize)]
#[serde(tag = "op", rename_all = "camelCase", rename_all_fields = "camelCase")]
enum EngineParityStep {
    Ensure {
        classes: Vec<String>,
        expected_css: String,
        #[serde(default)]
        expected_resource_order: Option<Vec<String>>,
    },
    Delete {
        classes: Vec<String>,
        expected_css: String,
    },
    Inspect {
        class_name: String,
        expected_valid: bool,
        #[serde(default)]
        expected_rule_texts: Vec<String>,
        #[serde(default)]
        expected_selector_texts: Vec<Option<String>>,
        #[serde(default)]
        expected_layers: Vec<String>,
        #[serde(default)]
        expected_priorities: Vec<Value>,
        #[serde(default)]
        expected_variable_names: Vec<Vec<String>>,
        #[serde(default)]
        expected_animation_names: Vec<Vec<String>>,
    },
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CompilerParityCase {
    id: String,
    source: String,
    base_manifest: Value,
    expected_generated_css: String,
    #[serde(default)]
    expected_utilities: Vec<Value>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RustTakeoverLedger {
    version: u32,
    semantic_baseline: String,
    expected_legacy_tests: usize,
    suites: Vec<RustTakeoverLedgerSuite>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RustTakeoverLedgerSuite {
    file: String,
    expected_tests: usize,
    tests: Vec<RustTakeoverLedgerEntry>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RustTakeoverLedgerEntry {
    name: String,
    coverage: Vec<String>,
}

#[derive(Deserialize)]
struct NativePackageJson {
    name: String,
    files: Vec<String>,
    bin: serde_json::Map<String, serde_json::Value>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ArtifactChecksum {
    path: String,
    bytes: u64,
    sha256: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeArtifactPackage {
    package_name: String,
    target: String,
    addon: ArtifactChecksum,
    executable: ArtifactChecksum,
}

#[derive(Serialize)]
struct NativeArtifactManifest {
    version: u32,
    packages: Vec<NativeArtifactPackage>,
    assets: Vec<ArtifactChecksum>,
}

fn workspace_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .canonicalize()
        .expect("workspace root exists")
}

fn generated_contract() -> String {
    let error_codes = mastercss_schema::ErrorCode::ALL
        .iter()
        .map(|code| format!("  | '{}'", code.as_wire_code()))
        .collect::<Vec<_>>()
        .join("\n");
    GENERATED_CONTRACT_TEMPLATE
        .replace(
            "{{MASTER_CSS_BINDING_ABI_VERSION}}",
            &mastercss_schema::BINDING_ABI_VERSION.to_string(),
        )
        .replace(
            "{{MASTER_CSS_MANIFEST_VERSION}}",
            &mastercss_schema::MANIFEST_VERSION.to_string(),
        )
        .replace(
            "{{MASTER_CSS_HYDRATION_MANIFEST_VERSION}}",
            &mastercss_schema::HYDRATION_MANIFEST_VERSION.to_string(),
        )
        .replace(
            "{{MASTER_CSS_ENGINE_TRANSITION_VERSION}}",
            &mastercss_schema::ENGINE_TRANSITION_VERSION.to_string(),
        )
        .replace(
            "{{MASTER_CSS_VALIDATOR_BATCH_VERSION}}",
            &mastercss_schema::VALIDATOR_BATCH_VERSION.to_string(),
        )
        .replace(
            "{{MASTER_CSS_DIAGNOSTICS_REPORT_VERSION}}",
            &mastercss_schema::DIAGNOSTICS_REPORT_VERSION.to_string(),
        )
        .replace(
            "{{MASTER_CSS_LINT_BATCH_VERSION}}",
            &mastercss_schema::LINT_BATCH_VERSION.to_string(),
        )
        .replace(
            "{{MASTER_CSS_LANGUAGE_BATCH_VERSION}}",
            &mastercss_schema::LANGUAGE_BATCH_VERSION.to_string(),
        )
        .replace(
            "{{MASTER_CSS_LEXER_BATCH_VERSION}}",
            &mastercss_schema::LEXER_BATCH_VERSION.to_string(),
        )
        .replace(
            "{{MASTER_CSS_SOURCE_BATCH_VERSION}}",
            &mastercss_schema::SOURCE_BATCH_VERSION.to_string(),
        )
        .replace("{{MASTER_CSS_ERROR_CODES}}", &error_codes)
}

fn generated_package_version() -> String {
    format!(
        "// Generated by `cargo xtask codegen`. Do not edit directly.\n\nexport const MASTER_CSS_PACKAGE_VERSION = {:?} as const\n",
        env!("CARGO_PKG_VERSION")
    )
}

fn generated_builtin_registry() -> String {
    let key_aliases = mastercss_engine::builtin_key_aliases()
        .iter()
        .copied()
        .collect::<std::collections::BTreeMap<_, _>>();
    let native_value_namespaces = mastercss_engine::builtin_native_value_namespaces()
        .iter()
        .map(|(properties, variable_alias_refs)| {
            serde_json::json!({
                "properties": properties,
                "variableAliasRefs": variable_alias_refs,
            })
        })
        .collect::<Vec<_>>();
    let key_aliases =
        serde_json::to_string_pretty(&key_aliases).expect("built-in key aliases are serializable");
    let native_value_namespaces = serde_json::to_string_pretty(&native_value_namespaces)
        .expect("built-in native-value namespaces are serializable");

    format!(
        r#"// Generated by `cargo xtask codegen`. Do not edit directly.

export interface MasterCSSBuiltinNativeValueNamespace {{
  readonly properties: readonly string[]
  readonly variableAliasRefs: readonly string[]
}}

export type MasterCSSBuiltinKeyAliases = Readonly<Record<string, string>>
export type MasterCSSBuiltinNativeValueNamespaces = readonly MasterCSSBuiltinNativeValueNamespace[]

export const builtinKeyAliases = Object.freeze({key_aliases}) as MasterCSSBuiltinKeyAliases

export const builtinNativeValueNamespaces = Object.freeze(
  {native_value_namespaces}.map((namespace) => Object.freeze({{
    properties: Object.freeze(namespace.properties),
    variableAliasRefs: Object.freeze(namespace.variableAliasRefs)
  }}))
) as MasterCSSBuiltinNativeValueNamespaces
"#
    )
}

fn check_generated_file(path: &Path, generated: &str) -> Result<(), String> {
    let current = fs::read_to_string(path)
        .map_err(|error| format!("Cannot read {}: {error}", path.display()))?;
    if current != generated {
        return Err(format!(
            "{} is stale. Run `cargo xtask codegen`.",
            path.display()
        ));
    }
    Ok(())
}

fn codegen(check: bool) -> Result<(), String> {
    let root = workspace_root();
    let outputs = [
        (
            root.join("packages/binding/src/protocol.ts"),
            generated_contract(),
        ),
        (
            root.join("packages/binding/src/version.ts"),
            generated_package_version(),
        ),
        (
            root.join("packages/tooling/src/builtins.ts"),
            generated_builtin_registry(),
        ),
    ];
    if check {
        for (output, generated) in &outputs {
            check_generated_file(output, generated)?;
        }
        return Ok(());
    }
    for (output, generated) in outputs {
        fs::write(&output, generated)
            .map_err(|error| format!("Cannot write {}: {error}", output.display()))?;
    }
    Ok(())
}

fn read_json<T: for<'de> Deserialize<'de>>(path: &Path) -> Result<T, String> {
    let source = fs::read_to_string(path)
        .map_err(|error| format!("Cannot read {}: {error}", path.display()))?;
    serde_json::from_str(&source).map_err(|error| format!("Invalid {}: {error}", path.display()))
}

fn manifest_json(root: &Path, value: &Value) -> Result<String, String> {
    if value.as_str() == Some("default") {
        let path = root.join("packages/preset/src/default-manifest.json");
        return fs::read_to_string(&path)
            .map_err(|error| format!("Cannot read {}: {error}", path.display()));
    }
    serde_json::to_string(value)
        .map_err(|error| format!("Cannot serialize parity manifest: {error}"))
}

fn validate_semantic_parity_corpus(
    root: &Path,
    corpus: &SemanticParityCorpus,
) -> Result<HashSet<String>, String> {
    if corpus.version != 1
        || corpus.semantic_baseline != "ef1a7c851"
        || corpus.public_baseline != "v2.0.0-rc.87"
    {
        return Err("Semantic parity corpus has an unsupported version or baseline.".into());
    }
    let mut ids = HashSet::new();
    for case in &corpus.engine_cases {
        if case.id.is_empty() || !ids.insert(case.id.clone()) {
            return Err(format!(
                "Duplicate or empty semantic parity case id: {}",
                case.id
            ));
        }
        let manifest = manifest_json(root, &case.manifest)?;
        let emitted_globals = case
            .emitted_globals
            .as_ref()
            .map(serde_json::to_string)
            .transpose()
            .map_err(|error| {
                format!(
                    "Cannot serialize emitted globals for parity case {}: {error}",
                    case.id
                )
            })?;
        let mut engine =
            EngineSession::create_with_emitted_globals(&manifest, emitted_globals.as_deref())
                .map_err(|error| {
                    format!("Parity case {} cannot create engine: {error}", case.id)
                })?;
        for (step_index, step) in case.steps.iter().enumerate() {
            match step {
                EngineParityStep::Ensure {
                    classes,
                    expected_css,
                    expected_resource_order,
                } => {
                    let candidate_count = engine
                        .native_declaration_candidates(classes)
                        .map_err(|error| {
                            format!(
                                "Parity case {} step {} cannot inspect native declarations: {error}",
                                case.id, step_index
                            )
                        })?
                        .len();
                    engine
                        .ensure_class_rules_with_native_support(
                            classes,
                            &vec![true; candidate_count],
                        )
                        .map_err(|error| {
                            format!(
                                "Parity case {} step {} cannot ensure classes: {error}",
                                case.id, step_index
                            )
                        })?;
                    if engine.css_text() != *expected_css {
                        return Err(format!(
                            "Parity case {} step {} CSS mismatch.\nexpected: {}\nactual:   {}",
                            case.id,
                            step_index,
                            expected_css,
                            engine.css_text()
                        ));
                    }
                    if let Some(expected_resource_order) = expected_resource_order {
                        let snapshot = engine.snapshot().map_err(|error| {
                            format!(
                                "Parity case {} step {} cannot snapshot resources: {error}",
                                case.id, step_index
                            )
                        })?;
                        let resource_order = snapshot
                            .resources
                            .variables
                            .into_iter()
                            .map(|resource| resource.name)
                            .chain(
                                snapshot
                                    .resources
                                    .animations
                                    .into_iter()
                                    .map(|resource| resource.name),
                            )
                            .collect::<Vec<_>>();
                        if resource_order != *expected_resource_order {
                            return Err(format!(
                                "Parity case {} step {} resource order mismatch.",
                                case.id, step_index
                            ));
                        }
                    }
                }
                EngineParityStep::Delete {
                    classes,
                    expected_css,
                } => {
                    engine.delete_class_rules(classes).map_err(|error| {
                        format!(
                            "Parity case {} step {} cannot delete classes: {error}",
                            case.id, step_index
                        )
                    })?;
                    if engine.css_text() != *expected_css {
                        return Err(format!(
                            "Parity case {} step {} CSS mismatch after delete.\nexpected: {}\nactual:   {}",
                            case.id,
                            step_index,
                            expected_css,
                            engine.css_text()
                        ));
                    }
                }
                EngineParityStep::Inspect {
                    class_name,
                    expected_valid,
                    expected_rule_texts,
                    expected_selector_texts,
                    expected_layers,
                    expected_priorities,
                    expected_variable_names,
                    expected_animation_names,
                } => {
                    let inspection = engine.inspect(class_name).map_err(|error| {
                        format!(
                            "Parity case {} step {} cannot inspect {class_name}: {error}",
                            case.id, step_index
                        )
                    })?;
                    if inspection.valid != *expected_valid {
                        return Err(format!(
                            "Parity case {} step {} validity mismatch for {class_name}.",
                            case.id, step_index
                        ));
                    }
                    let rule_texts = inspection
                        .rules
                        .iter()
                        .map(|rule| rule.text.clone())
                        .collect::<Vec<_>>();
                    if !expected_rule_texts.is_empty() && rule_texts != *expected_rule_texts {
                        return Err(format!(
                            "Parity case {} step {} rule text mismatch for {class_name}.",
                            case.id, step_index
                        ));
                    }
                    let selector_texts = inspection
                        .rules
                        .iter()
                        .map(|rule| rule.selector_text.clone())
                        .collect::<Vec<_>>();
                    if !expected_selector_texts.is_empty()
                        && selector_texts != *expected_selector_texts
                    {
                        return Err(format!(
                            "Parity case {} step {} selector metadata mismatch for {class_name}.",
                            case.id, step_index
                        ));
                    }
                    let layers = inspection
                        .rules
                        .iter()
                        .map(|rule| {
                            serde_json::to_value(rule.layer)
                                .expect("utility layer serializes")
                                .as_str()
                                .expect("utility layer is a string")
                                .to_owned()
                        })
                        .collect::<Vec<_>>();
                    if !expected_layers.is_empty() && layers != *expected_layers {
                        return Err(format!(
                            "Parity case {} step {} layer metadata mismatch for {class_name}.",
                            case.id, step_index
                        ));
                    }
                    let priorities = inspection
                        .rules
                        .iter()
                        .map(|rule| {
                            serde_json::to_value(&rule.priority).expect("rule priority serializes")
                        })
                        .collect::<Vec<_>>();
                    if !expected_priorities.is_empty() && priorities != *expected_priorities {
                        return Err(format!(
                            "Parity case {} step {} priority metadata mismatch for {class_name}.",
                            case.id, step_index
                        ));
                    }
                    let variable_names = inspection
                        .rules
                        .iter()
                        .map(|rule| rule.variable_names.clone())
                        .collect::<Vec<_>>();
                    if !expected_variable_names.is_empty()
                        && variable_names != *expected_variable_names
                    {
                        return Err(format!(
                            "Parity case {} step {} variable metadata mismatch for {class_name}.",
                            case.id, step_index
                        ));
                    }
                    let animation_names = inspection
                        .rules
                        .iter()
                        .map(|rule| rule.animation_names.clone())
                        .collect::<Vec<_>>();
                    if !expected_animation_names.is_empty()
                        && animation_names != *expected_animation_names
                    {
                        return Err(format!(
                            "Parity case {} step {} animation metadata mismatch for {class_name}.",
                            case.id, step_index
                        ));
                    }
                }
            }
        }
    }
    for case in &corpus.compiler_cases {
        if case.id.is_empty() || !ids.insert(case.id.clone()) {
            return Err(format!(
                "Duplicate or empty semantic parity case id: {}",
                case.id
            ));
        }
        let base_manifest = serde_json::from_str(&manifest_json(root, &case.base_manifest)?)
            .map_err(|error| {
                format!(
                    "Parity case {} has an invalid compiler base manifest: {error}",
                    case.id
                )
            })?;
        let compiled = compile_css_directives(
            &case.source,
            &CompileNativeCssOptions {
                from: format!("parity/{}.css", case.id),
                ..Default::default()
            },
        )
        .map_err(|error| format!("Parity case {} cannot compile CSS: {error}", case.id))?;
        let lowered = lower_css_directives(
            &compiled.manifest_input,
            compiled.style_definitions.as_deref().unwrap_or_default(),
            &compiled.warnings,
            &LowerCssDirectivesOptions {
                base_manifest: Some(base_manifest),
                resolution_manifest: None,
            },
        )
        .map_err(|error| format!("Parity case {} cannot lower CSS: {error}", case.id))?;
        if lowered.generated_css != case.expected_generated_css {
            return Err(format!(
                "Parity case {} generated CSS mismatch.\nexpected: {}\nactual:   {}",
                case.id, case.expected_generated_css, lowered.generated_css
            ));
        }
        for expected in &case.expected_utilities {
            let name = expected
                .get("name")
                .and_then(Value::as_str)
                .ok_or_else(|| format!("Parity case {} expected utility has no name.", case.id))?;
            let actual = lowered
                .manifest
                .get("utilities")
                .and_then(Value::as_array)
                .and_then(|utilities| {
                    utilities
                        .iter()
                        .find(|utility| utility.get("name").and_then(Value::as_str) == Some(name))
                });
            if actual != Some(expected) {
                return Err(format!(
                    "Parity case {} utility {name} mismatch.\nexpected: {}\nactual:   {}",
                    case.id,
                    expected,
                    actual.map_or_else(|| "<missing>".into(), Value::to_string)
                ));
            }
        }
    }
    Ok(ids)
}

fn validate_rust_takeover_ledger(
    root: &Path,
    ledger: &RustTakeoverLedger,
    corpus_ids: &HashSet<String>,
    exception_ids: &HashSet<String>,
) -> Result<(), String> {
    if ledger.version != 1 || ledger.semantic_baseline != "ef1a7c851" {
        return Err("Rust takeover ledger has an unsupported version or baseline.".into());
    }
    let mut entries = HashSet::new();
    let mut total = 0;
    for suite in &ledger.suites {
        if suite.tests.len() != suite.expected_tests {
            return Err(format!(
                "Rust takeover ledger suite {} expected {} tests but lists {}.",
                suite.file,
                suite.expected_tests,
                suite.tests.len()
            ));
        }
        for test in &suite.tests {
            total += 1;
            let id = format!("{}#{}", suite.file, test.name);
            if test.name.is_empty() || !entries.insert(id.clone()) {
                return Err(format!(
                    "Duplicate or empty Rust takeover ledger entry: {id}"
                ));
            }
            if test.coverage.is_empty() {
                return Err(format!("Rust takeover ledger entry {id} has no coverage."));
            }
            for coverage in &test.coverage {
                if let Some(case_id) = coverage.strip_prefix("corpus:") {
                    if !corpus_ids.contains(case_id) {
                        return Err(format!(
                            "Rust takeover ledger entry {id} references unknown corpus case {case_id}."
                        ));
                    }
                } else if let Some(exception_id) = coverage.strip_prefix("exception:") {
                    if !exception_ids.contains(exception_id) {
                        return Err(format!(
                            "Rust takeover ledger entry {id} references unknown exception {exception_id}."
                        ));
                    }
                } else if let Some(test_reference) = coverage.strip_prefix("test:") {
                    let (path, needle) = test_reference.split_once('#').ok_or_else(|| {
                        format!("Rust takeover ledger entry {id} has invalid test reference.")
                    })?;
                    let source_path = root.join(path);
                    let source = fs::read_to_string(&source_path).map_err(|error| {
                        format!(
                            "Cannot read coverage test {}: {error}",
                            source_path.display()
                        )
                    })?;
                    if needle.is_empty() || !source.contains(needle) {
                        return Err(format!(
                            "Rust takeover ledger entry {id} references missing test marker {coverage}."
                        ));
                    }
                } else {
                    return Err(format!(
                        "Rust takeover ledger entry {id} has unsupported coverage {coverage}."
                    ));
                }
            }
        }
    }
    if total != ledger.expected_legacy_tests {
        return Err(format!(
            "Rust takeover ledger expected {} legacy tests but lists {total}.",
            ledger.expected_legacy_tests
        ));
    }
    Ok(())
}

fn validate_parity() -> Result<(), String> {
    let root = workspace_root();
    let path = root.join("parity-exceptions.json");
    let parity: ParityFile = read_json(&path)?;
    let mut ids = HashSet::new();
    for exception in parity.exceptions {
        if !ids.insert(exception.id.clone()) {
            return Err(format!("Duplicate parity exception id: {}", exception.id));
        }
        if exception.id.is_empty()
            || exception.reason.is_empty()
            || exception.packages.is_empty()
            || exception.test.is_empty()
        {
            return Err(format!(
                "Parity exception {} is missing required evidence.",
                exception.id
            ));
        }
        let _ = (exception.old, exception.new);
    }
    let corpus: SemanticParityCorpus = read_json(&root.join("parity/rust-semantic-corpus.json"))?;
    let corpus_ids = validate_semantic_parity_corpus(&root, &corpus)?;
    let ledger: RustTakeoverLedger = read_json(&root.join("parity/rust-takeover-ledger.json"))?;
    validate_rust_takeover_ledger(&root, &ledger, &corpus_ids, &ids)
}

fn run_command(command: &mut Command, label: &str) -> Result<(), String> {
    let status = command
        .status()
        .map_err(|error| format!("Cannot start {label}: {error}"))?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("{label} failed with {status}."))
    }
}

fn files_equal(left: &Path, right: &Path) -> Result<bool, String> {
    let left_metadata = fs::metadata(left)
        .map_err(|error| format!("Cannot inspect {}: {error}", left.display()))?;
    let right_metadata = fs::metadata(right)
        .map_err(|error| format!("Cannot inspect {}: {error}", right.display()))?;
    if left_metadata.len() != right_metadata.len() {
        return Ok(false);
    }

    let left =
        fs::read(left).map_err(|error| format!("Cannot read {}: {error}", left.display()))?;
    let right =
        fs::read(right).map_err(|error| format!("Cannot read {}: {error}", right.display()))?;
    Ok(left == right)
}

fn replace_from_temporary(temporary: &Path, output: &Path) -> Result<(), String> {
    #[cfg(windows)]
    if output.exists() {
        if files_equal(temporary, output)? {
            fs::remove_file(temporary)
                .map_err(|error| format!("Cannot remove {}: {error}", temporary.display()))?;
            return Ok(());
        }
        fs::remove_file(output)
            .map_err(|error| format!("Cannot replace {}: {error}", output.display()))?;
    }

    fs::rename(temporary, output).map_err(|error| {
        format!(
            "Cannot move {} to {}: {error}",
            temporary.display(),
            output.display()
        )
    })
}

fn copy_fresh(source: &Path, output: &Path) -> Result<(), String> {
    let output_name = output.file_name().ok_or_else(|| {
        format!(
            "Cannot replace path without a file name: {}",
            output.display()
        )
    })?;
    let mut temporary_name = output_name.to_os_string();
    temporary_name.push(format!(
        ".{}.{}.tmp",
        std::process::id(),
        COPY_NONCE.fetch_add(1, Ordering::Relaxed)
    ));
    let temporary = output.with_file_name(temporary_name);
    fs::copy(source, &temporary).map_err(|error| {
        format!(
            "Cannot copy {} to {}: {error}",
            source.display(),
            temporary.display()
        )
    })?;
    if let Err(error) = replace_from_temporary(&temporary, output) {
        let _ = fs::remove_file(&temporary);
        return Err(error);
    }
    Ok(())
}

fn build_native(release: bool) -> Result<(), String> {
    let root = workspace_root();
    let mut command = Command::new("cargo");
    command.current_dir(&root).args([
        "build",
        "--package",
        "mastercss-binding-native",
        "--package",
        "mastercss-cli",
    ]);
    if release {
        command.arg("--release");
    }
    run_command(&mut command, "native binding build")?;

    let profile = if release { "release" } else { "debug" };
    let candidates = if cfg!(target_os = "macos") {
        vec![root.join(format!(
            "target/{profile}/libmastercss_binding_native.dylib"
        ))]
    } else if cfg!(target_os = "windows") {
        vec![root.join(format!("target/{profile}/mastercss_binding_native.dll"))]
    } else {
        vec![root.join(format!("target/{profile}/libmastercss_binding_native.so"))]
    };
    let source = candidates
        .into_iter()
        .find(|path| path.exists())
        .ok_or_else(|| "Cargo did not produce the expected native binding artifact.".to_string())?;
    let output_dir = root.join("packages/binding/artifacts");
    fs::create_dir_all(&output_dir)
        .map_err(|error| format!("Cannot create {}: {error}", output_dir.display()))?;
    let output = output_dir.join("mastercss.node");
    copy_fresh(&source, &output)?;
    let executable_name = if cfg!(target_os = "windows") {
        "mcss.exe"
    } else {
        "mcss"
    };
    let executable_source = root.join(format!("target/{profile}/{executable_name}"));
    let executable_output = output_dir.join(executable_name);
    copy_fresh(&executable_source, &executable_output)?;
    println!("Built {}", output.display());
    println!("Built {}", executable_output.display());
    Ok(())
}

fn stage_native_target(package: &str, release: bool) -> Result<(), String> {
    if !BINDING_TARGET_PACKAGES.contains(&package) {
        return Err(format!("Unknown native target package: {package}"));
    }
    build_native(release)?;
    let root = workspace_root();
    let artifact_dir = root.join("packages/binding/artifacts");
    let package_dir = root.join("packages").join(package);
    let executable_name = if package.contains("win32") {
        "mcss.exe"
    } else {
        "mcss"
    };
    for file in ["mastercss.node", executable_name] {
        let source = artifact_dir.join(file);
        let output = package_dir.join(file);
        copy_fresh(&source, &output)?;
        println!("Staged {}", output.display());
    }
    Ok(())
}

fn artifact_checksum(path: &Path, manifest_path: String) -> Result<ArtifactChecksum, String> {
    let mut file = fs::File::open(path)
        .map_err(|error| format!("Cannot read native artifact {}: {error}", path.display()))?;
    let bytes = file
        .metadata()
        .map_err(|error| format!("Cannot inspect native artifact {}: {error}", path.display()))?
        .len();
    if bytes == 0 {
        return Err(format!("Native artifact is empty: {}", path.display()));
    }
    let mut hasher = Sha256::new();
    let mut buffer = [0_u8; 64 * 1024];
    loop {
        let read = file
            .read(&mut buffer)
            .map_err(|error| format!("Cannot hash native artifact {}: {error}", path.display()))?;
        if read == 0 {
            break;
        }
        hasher.update(&buffer[..read]);
    }
    Ok(ArtifactChecksum {
        path: manifest_path,
        bytes,
        sha256: format!("{:x}", hasher.finalize()),
    })
}

fn native_artifact_directory(artifacts_root: &Path, package: &str) -> Result<PathBuf, String> {
    [
        artifacts_root.join(format!("mastercss-{package}")),
        artifacts_root.join(package),
    ]
    .into_iter()
    .find(|path| path.is_dir())
    .ok_or_else(|| format!("Missing native artifact package: {package}"))
}

#[cfg(unix)]
fn make_executable(path: &Path) -> Result<(), String> {
    use std::os::unix::fs::PermissionsExt;
    let mut permissions = fs::metadata(path)
        .map_err(|error| format!("Cannot inspect {}: {error}", path.display()))?
        .permissions();
    permissions.set_mode(0o755);
    fs::set_permissions(path, permissions)
        .map_err(|error| format!("Cannot mark {} executable: {error}", path.display()))
}

#[cfg(not(unix))]
fn make_executable(_path: &Path) -> Result<(), String> {
    Ok(())
}

fn assemble_native_release(
    artifacts_root: &Path,
    output: &Path,
    stage: bool,
    require_assets: bool,
    verify_staged: bool,
) -> Result<(), String> {
    assemble_native_release_at(
        &workspace_root(),
        artifacts_root,
        output,
        stage,
        require_assets,
        verify_staged,
    )
}

fn assemble_native_release_at(
    root: &Path,
    artifacts_root: &Path,
    output: &Path,
    stage: bool,
    require_assets: bool,
    verify_staged: bool,
) -> Result<(), String> {
    let mut packages = Vec::new();
    for package in BINDING_TARGET_PACKAGES {
        let artifact_dir = native_artifact_directory(artifacts_root, package)?;
        let package_json_path = artifact_dir.join("package.json");
        let package_json: NativePackageJson =
            serde_json::from_str(&fs::read_to_string(&package_json_path).map_err(|error| {
                format!("Cannot read {}: {error}", package_json_path.display())
            })?)
            .map_err(|error| format!("Invalid {}: {error}", package_json_path.display()))?;
        let expected_name = format!("@master/css-{package}");
        if package_json.name != expected_name {
            return Err(format!(
                "Native package name mismatch for {package}: {}",
                package_json.name
            ));
        }
        let executable_name = if package.contains("win32") {
            "mcss.exe"
        } else {
            "mcss"
        };
        if !package_json
            .files
            .iter()
            .any(|file| file == "mastercss.node")
            || !package_json
                .files
                .iter()
                .any(|file| file == executable_name)
            || package_json
                .bin
                .get("mcss")
                .and_then(serde_json::Value::as_str)
                != Some(if package.contains("win32") {
                    "./mcss.exe"
                } else {
                    "./mcss"
                })
        {
            return Err(format!(
                "Native package {expected_name} does not publish both required artifacts."
            ));
        }
        let addon_path = artifact_dir.join("mastercss.node");
        let executable_path = artifact_dir.join(executable_name);
        packages.push(NativeArtifactPackage {
            package_name: expected_name,
            target: package.trim_start_matches("binding-").to_owned(),
            addon: artifact_checksum(&addon_path, format!("packages/{package}/mastercss.node"))?,
            executable: artifact_checksum(
                &executable_path,
                format!("packages/{package}/{executable_name}"),
            )?,
        });

        let target = root.join("packages").join(package);
        let staged_addon = target.join("mastercss.node");
        let staged_executable = target.join(executable_name);
        if stage {
            copy_fresh(&addon_path, &staged_addon)?;
            copy_fresh(&executable_path, &staged_executable)?;
            make_executable(&staged_executable)?;
        }
        if verify_staged {
            for (source, staged, relative) in [
                (&addon_path, &staged_addon, "mastercss.node"),
                (&executable_path, &staged_executable, executable_name),
            ] {
                if !staged.is_file() || !files_equal(source, staged)? {
                    return Err(format!(
                        "Staged native artifact differs from release input: packages/{package}/{relative}"
                    ));
                }
            }
        }
    }

    let mut assets = Vec::new();
    let public_assets = [
        "packages/runtime/dist/global.min.js",
        "packages/runtime/artifacts/mastercss_binding_wasm_engine_bg.wasm",
        "packages/preset/dist/default-manifest.json",
    ];
    for relative in public_assets {
        let path = root.join(relative);
        if path.is_file() {
            assets.push(artifact_checksum(&path, relative.to_owned())?);
        } else if require_assets {
            return Err(format!("Missing required release asset: {relative}"));
        }
    }
    let manifest = NativeArtifactManifest {
        version: 1,
        packages,
        assets,
    };
    if let Some(parent) = output.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Cannot create {}: {error}", parent.display()))?;
    }
    let mut json = serde_json::to_string_pretty(&manifest)
        .map_err(|error| format!("Cannot serialize native artifact manifest: {error}"))?;
    json.push('\n');
    fs::write(output, json)
        .map_err(|error| format!("Cannot write {}: {error}", output.display()))?;
    println!("Verified and recorded {}", output.display());
    Ok(())
}

fn build_wasm(surface: &str) -> Result<(), String> {
    if surface == "all" {
        for surface in ["runtime", "compiler", "tooling"] {
            build_wasm(surface)?;
        }
        return Ok(());
    }
    let root = workspace_root();
    let (package, crate_name, artifact_name) = match surface {
        "runtime" => (
            "binding-wasm-engine",
            "mastercss-binding-wasm-engine",
            "mastercss_binding_wasm_engine",
        ),
        "compiler" => (
            "binding-wasm-compiler",
            "mastercss-binding-wasm-compiler",
            "mastercss_binding_wasm_compiler",
        ),
        "tooling" => (
            "binding-wasm-tooling",
            "mastercss-binding-wasm-tooling",
            "mastercss_binding_wasm_tooling",
        ),
        _ => return Err(format!("Unknown Wasm surface: {surface}")),
    };
    let mut command = Command::new("cargo");
    command.current_dir(&root).args([
        "build",
        "--package",
        crate_name,
        "--target",
        "wasm32-unknown-unknown",
        "--release",
    ]);
    run_command(&mut command, &format!("{surface} Wasm build"))?;

    let input = root.join(format!(
        "target/wasm32-unknown-unknown/release/{artifact_name}.wasm"
    ));
    let output = root.join(format!("packages/{package}/artifacts"));
    fs::create_dir_all(&output)
        .map_err(|error| format!("Cannot create {}: {error}", output.display()))?;
    let mut bindgen = wasm_bindgen_cli_support::Bindgen::new();
    bindgen
        .input_path(&input)
        .out_name(artifact_name)
        .typescript(true)
        .web(true)
        .map_err(|error| error.to_string())?
        .generate(&output)
        .map_err(|error| format!("Cannot generate Wasm bindings: {error}"))?;
    if surface == "runtime" {
        let runtime_output = root.join("packages/runtime/artifacts");
        fs::create_dir_all(&runtime_output)
            .map_err(|error| format!("Cannot create {}: {error}", runtime_output.display()))?;
        fs::copy(
            output.join("mastercss_binding_wasm_engine_bg.wasm"),
            runtime_output.join("mastercss_binding_wasm_engine_bg.wasm"),
        )
        .map_err(|error| format!("Cannot stage runtime Wasm asset: {error}"))?;
    }
    println!("Built {}", output.display());
    Ok(())
}

fn run() -> Result<(), String> {
    let args: Vec<String> = env::args().skip(1).collect();
    match args.as_slice() {
        [command] if command == "codegen" => codegen(false),
        [command, flag] if command == "codegen" && flag == "--check" => codegen(true),
        [command] if command == "parity" => validate_parity(),
        [command] if command == "build-native" => build_native(false),
        [command, flag] if command == "build-native" && flag == "--release" => build_native(true),
        [command, package] if command == "stage-native-target" => {
            stage_native_target(package, false)
        }
        [command, package, flag] if command == "stage-native-target" && flag == "--release" => {
            stage_native_target(package, true)
        }
        [command] if command == "build-wasm" => build_wasm("runtime"),
        [command, surface] if command == "build-wasm" => build_wasm(surface),
        [command, artifacts, output] if command == "assemble-native-release" => {
            assemble_native_release(
                Path::new(artifacts),
                Path::new(output),
                false,
                false,
                false,
            )
        }
        [command, artifacts, output, flags @ ..] if command == "assemble-native-release" => {
            let stage = flags.iter().any(|flag| flag == "--stage");
            let require_assets = flags.iter().any(|flag| flag == "--require-assets");
            let verify_staged = flags.iter().any(|flag| flag == "--verify-staged");
            if flags
                .iter()
                .any(|flag| {
                    flag != "--stage"
                        && flag != "--require-assets"
                        && flag != "--verify-staged"
                })
            {
                return Err(format!(
                    "Unknown assemble-native-release option: {}",
                    flags.join(" ")
                ));
            }
            assemble_native_release(
                Path::new(artifacts),
                Path::new(output),
                stage,
                require_assets,
                verify_staged,
            )
        }
        _ => Err(
            "Usage: cargo xtask codegen [--check] | parity | build-native [--release] | stage-native-target <package> [--release] | build-wasm [all|runtime|compiler|tooling] | assemble-native-release <artifacts-dir> <checksums.json> [--stage] [--require-assets] [--verify-staged]"
                .into(),
        ),
    }
}

fn main() {
    if let Err(error) = run() {
        eprintln!("{error}");
        std::process::exit(1);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temporary_directory(label: &str) -> PathBuf {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        env::temp_dir().join(format!("mastercss-{label}-{nonce}"))
    }

    #[test]
    fn atomically_replaces_staged_artifacts() {
        let root = temporary_directory("atomic-copy");
        fs::create_dir_all(&root).unwrap();
        let source = root.join("source.node");
        let output = root.join("mastercss.node");
        fs::write(&source, "new binding").unwrap();
        fs::write(&output, "stale binding").unwrap();

        copy_fresh(&source, &output).unwrap();

        assert_eq!(fs::read_to_string(&output).unwrap(), "new binding");
        assert_eq!(fs::read_dir(&root).unwrap().count(), 2);
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn assembles_all_native_packages_and_writes_stable_checksums() {
        let root = temporary_directory("native-release");
        fs::create_dir_all(&root).unwrap();
        for package in BINDING_TARGET_PACKAGES {
            let directory = root.join(format!("mastercss-{package}"));
            fs::create_dir_all(&directory).unwrap();
            fs::create_dir_all(root.join("packages").join(package)).unwrap();
            let executable = if package.contains("win32") {
                "mcss.exe"
            } else {
                "mcss"
            };
            fs::write(directory.join("mastercss.node"), format!("addon:{package}")).unwrap();
            fs::write(directory.join(executable), format!("cli:{package}")).unwrap();
            fs::write(
                directory.join("package.json"),
                serde_json::json!({
                    "name": format!("@master/css-{package}"),
                    "files": ["mastercss.node", executable],
                    "bin": { "mcss": format!("./{executable}") }
                })
                .to_string(),
            )
            .unwrap();
        }
        let output = root.join("checksums.json");
        assemble_native_release_at(&root, &root, &output, true, false, false).unwrap();
        let manifest: serde_json::Value =
            serde_json::from_str(&fs::read_to_string(&output).unwrap()).unwrap();
        assert_eq!(manifest["version"], 1);
        assert_eq!(manifest["packages"].as_array().unwrap().len(), 8);
        assert_eq!(manifest["assets"].as_array().unwrap().len(), 0);
        assert!(
            manifest["packages"][0]["addon"]["sha256"]
                .as_str()
                .is_some_and(|checksum| checksum.len() == 64)
        );
        let staged_addon = root.join("packages/binding-darwin-arm64/mastercss.node");
        fs::write(&staged_addon, "modified after staging").unwrap();
        assert_eq!(
            assemble_native_release_at(
                &root,
                &root,
                &root.join("verified-checksums.json"),
                false,
                false,
                true,
            )
            .unwrap_err(),
            "Staged native artifact differs from release input: packages/binding-darwin-arm64/mastercss.node"
        );
        let required_output = root.join("required-checksums.json");
        assert_eq!(
            assemble_native_release_at(&root, &root, &required_output, false, true, false)
                .unwrap_err(),
            "Missing required release asset: packages/runtime/dist/global.min.js"
        );
        fs::remove_dir_all(root).unwrap();
    }
}
