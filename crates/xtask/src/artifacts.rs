use super::*;

pub(crate) fn run_command(command: &mut Command, label: &str) -> Result<(), String> {
    let status = command
        .status()
        .map_err(|error| format!("Cannot start {label}: {error}"))?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("{label} failed with {status}."))
    }
}

pub(crate) fn files_equal(left: &Path, right: &Path) -> Result<bool, String> {
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

pub(crate) fn replace_from_temporary(temporary: &Path, output: &Path) -> Result<(), String> {
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

pub(crate) fn copy_fresh(source: &Path, output: &Path) -> Result<(), String> {
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

pub(crate) fn build_native(release: bool) -> Result<(), String> {
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

pub(crate) fn stage_native_target(package: &str, release: bool) -> Result<(), String> {
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

pub(crate) fn artifact_checksum(
    path: &Path,
    manifest_path: String,
) -> Result<ArtifactChecksum, String> {
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
        sha256: hasher
            .finalize()
            .iter()
            .map(|byte| format!("{byte:02x}"))
            .collect(),
    })
}

pub(crate) fn native_artifact_directory(
    artifacts_root: &Path,
    package: &str,
) -> Result<PathBuf, String> {
    [
        artifacts_root.join(format!("mastercss-{package}")),
        artifacts_root.join(package),
    ]
    .into_iter()
    .find(|path| path.is_dir())
    .ok_or_else(|| format!("Missing native artifact package: {package}"))
}

#[cfg(unix)]
pub(crate) fn make_executable(path: &Path) -> Result<(), String> {
    use std::os::unix::fs::PermissionsExt;
    let mut permissions = fs::metadata(path)
        .map_err(|error| format!("Cannot inspect {}: {error}", path.display()))?
        .permissions();
    permissions.set_mode(0o755);
    fs::set_permissions(path, permissions)
        .map_err(|error| format!("Cannot mark {} executable: {error}", path.display()))
}

#[cfg(not(unix))]
pub(crate) fn make_executable(_path: &Path) -> Result<(), String> {
    Ok(())
}

pub(crate) fn assemble_native_release(
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

pub(crate) fn assemble_native_release_at(
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
        "packages/runtime/dist/default-program.bin",
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

pub(crate) fn build_wasm(surface: &str) -> Result<(), String> {
    if surface == "all" {
        for surface in ["runtime", "compiler", "tooling"] {
            build_wasm(surface)?;
        }
        return Ok(());
    }
    let root = workspace_root();
    match surface {
        // Browsers execute programs with the JavaScript engine; the engine Wasm
        // serves Node without a native binding and other non-browser hosts.
        "runtime" => build_wasm_artifact(
            &root,
            &WasmBuild {
                label: "engine",
                crate_name: "mastercss-binding-wasm-engine",
                artifact_name: "mastercss_binding_wasm_engine",
                profile: "release-wasm",
                default_features: true,
                typescript: true,
                output: "packages/binding-wasm-engine/artifacts",
                target_dir: None,
                keep_names: false,
                rebuild_std: false,
            },
        ),
        "compiler" => build_wasm_artifact(
            &root,
            &WasmBuild {
                label: "compiler",
                crate_name: "mastercss-binding-wasm-compiler",
                artifact_name: "mastercss_binding_wasm_compiler",
                profile: "release",
                default_features: true,
                typescript: true,
                output: "packages/binding-wasm-compiler/artifacts",
                target_dir: None,
                keep_names: false,
                rebuild_std: false,
            },
        ),
        "tooling" => build_wasm_artifact(
            &root,
            &WasmBuild {
                label: "tooling",
                crate_name: "mastercss-binding-wasm-tooling",
                artifact_name: "mastercss_binding_wasm_tooling",
                profile: "release",
                default_features: true,
                typescript: true,
                output: "packages/binding-wasm-tooling/artifacts",
                target_dir: None,
                keep_names: false,
                rebuild_std: false,
            },
        ),
        _ => Err(format!("Unknown Wasm surface: {surface}")),
    }
}

// Keeps nightly build outputs apart from the stable ones in `target`.
const WASM_SIZE_TARGET: &str = "target/wasm-size";
/// Browsers download the runtime engine Wasm, so it rebuilds the standard library
/// with immediate-abort panics: no panic message, location or formatting code is
/// linked. Native code and the other Wasm builds use the stable toolchain in
/// `rust-toolchain.toml`.
const RUNTIME_WASM_TOOLCHAIN: &str = "nightly-2026-09-03";

/// Builds the runtime engine Wasm with its name section into `target/wasm-size/runtime`
/// for `scripts/report-runtime-wasm-size.mjs`. Nothing is staged into packages.
pub(crate) fn build_wasm_names(surface: &str) -> Result<(), String> {
    if surface != "runtime" {
        return Err(format!(
            "build-wasm --names supports only the runtime surface, not {surface}"
        ));
    }
    build_wasm_artifact(
        &workspace_root(),
        &WasmBuild {
            label: "runtime (names)",
            crate_name: "mastercss-binding-wasm-engine",
            artifact_name: "mastercss_binding_wasm_engine",
            profile: "release-wasm",
            default_features: false,
            typescript: false,
            output: "target/wasm-size/runtime",
            target_dir: Some(WASM_SIZE_TARGET),
            keep_names: true,
            rebuild_std: true,
        },
    )
}

struct WasmBuild {
    label: &'static str,
    crate_name: &'static str,
    artifact_name: &'static str,
    profile: &'static str,
    default_features: bool,
    typescript: bool,
    output: &'static str,
    target_dir: Option<&'static str>,
    keep_names: bool,
    /// Rebuilds the standard library with [`RUNTIME_WASM_TOOLCHAIN`] so panics abort
    /// without formatting a message.
    rebuild_std: bool,
}

fn build_wasm_artifact(root: &Path, build: &WasmBuild) -> Result<(), String> {
    let profile_env = |key: &str| {
        format!(
            "CARGO_PROFILE_{}_{key}",
            build.profile.to_ascii_uppercase().replace('-', "_")
        )
    };
    let mut command = Command::new("cargo");
    command.current_dir(root);
    if build.rebuild_std {
        ensure_runtime_wasm_toolchain()?;
        command.arg(format!("+{RUNTIME_WASM_TOOLCHAIN}"));
    }
    command.args([
        "build",
        "--package",
        build.crate_name,
        "--target",
        "wasm32-unknown-unknown",
        "--profile",
        build.profile,
    ]);
    if !build.default_features {
        command.arg("--no-default-features");
    }
    if let Some(target_dir) = build.target_dir {
        command.arg("--target-dir").arg(root.join(target_dir));
    }
    if build.rebuild_std {
        // Trimming keeps local toolchain and checkout paths, which the rebuilt
        // standard library would otherwise embed, out of the shipped bytes.
        command
            .args([
                "-Zbuild-std=std,panic_abort",
                "-Zpanic-immediate-abort",
                "-Ztrim-paths",
            ])
            .env(profile_env("PANIC"), "immediate-abort")
            .env(profile_env("TRIM_PATHS"), "all");
        // The standard library keeps the opt-level of its prebuilt copy: rebuilt for
        // size it measured larger under brotli and slower to start.
        for package in ["core", "alloc", "std"] {
            command.arg("--config").arg(format!(
                "profile.{}.package.{package}.opt-level=3",
                build.profile
            ));
        }
    }
    if build.keep_names {
        // The release profile strips symbols, which drops the name section at link time.
        command.env(profile_env("STRIP"), "none");
    }
    run_command(&mut command, &format!("{} Wasm build", build.label))?;

    let input = root
        .join(build.target_dir.unwrap_or("target"))
        .join(format!(
            "wasm32-unknown-unknown/{}/{}.wasm",
            build.profile, build.artifact_name
        ));
    let output = root.join(build.output);
    fs::create_dir_all(&output)
        .map_err(|error| format!("Cannot create {}: {error}", output.display()))?;
    let mut bindgen = wasm_bindgen_cli_support::Bindgen::new();
    bindgen
        .input_path(&input)
        .out_name(build.artifact_name)
        .typescript(build.typescript)
        .remove_name_section(!build.keep_names)
        .remove_producers_section(true)
        .web(true)
        .map_err(|error| error.to_string())?
        .generate(&output)
        .map_err(|error| format!("Cannot generate Wasm bindings: {error}"))?;
    println!("Built {}", output.display());
    Ok(())
}

/// Installs [`RUNTIME_WASM_TOOLCHAIN`] with the standard library sources when missing.
fn ensure_runtime_wasm_toolchain() -> Result<(), String> {
    let installed = Command::new("rustup")
        .args([
            "component",
            "list",
            "--installed",
            "--toolchain",
            RUNTIME_WASM_TOOLCHAIN,
        ])
        .output()
        .is_ok_and(|output| {
            output.status.success()
                && String::from_utf8_lossy(&output.stdout)
                    .lines()
                    .any(|line| line == "rust-src")
        });
    if installed {
        return Ok(());
    }
    run_command(
        Command::new("rustup").args([
            "toolchain",
            "install",
            RUNTIME_WASM_TOOLCHAIN,
            "--profile",
            "minimal",
            "--component",
            "rust-src",
        ]),
        &format!("{RUNTIME_WASM_TOOLCHAIN} installation"),
    )
}
