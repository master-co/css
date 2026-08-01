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
        sha256: format!("{:x}", hasher.finalize()),
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

pub(crate) fn build_wasm(surface: &str) -> Result<(), String> {
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
