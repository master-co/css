#![forbid(unsafe_code)]

use std::collections::HashSet;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

use serde::Deserialize;

const GENERATED_CONTRACT_TEMPLATE: &str = include_str!("../templates/rust-contract.ts");

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
    GENERATED_CONTRACT_TEMPLATE.replace("{{MASTER_CSS_ERROR_CODES}}", &error_codes)
}

fn codegen(check: bool) -> Result<(), String> {
    let output = workspace_root().join("packages/schema/src/rust-contract.ts");
    let generated = generated_contract();
    if check {
        let current = fs::read_to_string(&output)
            .map_err(|error| format!("Cannot read {}: {error}", output.display()))?;
        if current != generated {
            return Err(format!(
                "{} is stale. Run `cargo xtask codegen`.",
                output.display()
            ));
        }
        return Ok(());
    }
    fs::write(&output, generated)
        .map_err(|error| format!("Cannot write {}: {error}", output.display()))
}

fn validate_parity() -> Result<(), String> {
    let path = workspace_root().join("parity-exceptions.json");
    let source = fs::read_to_string(&path)
        .map_err(|error| format!("Cannot read {}: {error}", path.display()))?;
    let parity: ParityFile = serde_json::from_str(&source)
        .map_err(|error| format!("Invalid {}: {error}", path.display()))?;
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
    Ok(())
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

fn build_native(release: bool) -> Result<(), String> {
    let root = workspace_root();
    let mut command = Command::new("cargo");
    command
        .current_dir(&root)
        .args(["build", "--package", "mastercss-node"]);
    if release {
        command.arg("--release");
    }
    run_command(&mut command, "native binding build")?;

    let profile = if release { "release" } else { "debug" };
    let candidates = if cfg!(target_os = "macos") {
        vec![root.join(format!("target/{profile}/libmastercss_node.dylib"))]
    } else if cfg!(target_os = "windows") {
        vec![root.join(format!("target/{profile}/mastercss_node.dll"))]
    } else {
        vec![root.join(format!("target/{profile}/libmastercss_node.so"))]
    };
    let source = candidates
        .into_iter()
        .find(|path| path.exists())
        .ok_or_else(|| "Cargo did not produce the expected native binding artifact.".to_string())?;
    let output_dir = root.join("packages/native/artifacts");
    fs::create_dir_all(&output_dir)
        .map_err(|error| format!("Cannot create {}: {error}", output_dir.display()))?;
    let output = output_dir.join("mastercss.node");
    fs::copy(&source, &output).map_err(|error| {
        format!(
            "Cannot copy {} to {}: {error}",
            source.display(),
            output.display()
        )
    })?;
    println!("Built {}", output.display());
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
            "wasm-runtime",
            "mastercss-wasm-runtime",
            "mastercss_wasm_runtime",
        ),
        "compiler" => (
            "wasm-compiler",
            "mastercss-wasm-compiler",
            "mastercss_wasm_compiler",
        ),
        "tooling" => (
            "wasm-tooling",
            "mastercss-wasm-tooling",
            "mastercss_wasm_tooling",
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
            output.join("mastercss_wasm_runtime_bg.wasm"),
            runtime_output.join("mastercss_wasm_runtime_bg.wasm"),
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
        [command] if command == "build-wasm" => build_wasm("runtime"),
        [command, surface] if command == "build-wasm" => build_wasm(surface),
        _ => Err(
            "Usage: cargo xtask codegen [--check] | parity | build-native [--release] | build-wasm [all|runtime|compiler|tooling]"
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
