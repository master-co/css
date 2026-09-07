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
    #[serde(default)]
    parser_cases: Vec<ParserParityCase>,
    engine_cases: Vec<EngineParityCase>,
    compiler_cases: Vec<CompilerParityCase>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ParserParityCase {
    id: String,
    source_id: String,
    kind: String,
    input: String,
    expected_canonical: String,
    #[serde(default)]
    target_package: Option<String>,
    #[serde(default)]
    runner: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct EngineParityCase {
    id: String,
    #[serde(default)]
    source_id: Option<String>,
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
    InspectContains {
        class_name: String,
        expected_rule_contains: String,
    },
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CompilerParityCase {
    id: String,
    #[serde(default)]
    source_id: Option<String>,
    source: String,
    base_manifest: Value,
    #[serde(default)]
    expected_generated_css: Option<String>,
    #[serde(default)]
    expected_manifest: Option<Value>,
    #[serde(default)]
    expected_error: Option<String>,
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

mod artifacts;
mod codegen;
mod parity;

pub(crate) use artifacts::*;
pub(crate) use codegen::*;
pub(crate) use parity::*;

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
#[path = "tests.rs"]
mod tests;
