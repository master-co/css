//! Embeds a Windows `VERSIONINFO` resource into the MSVC-target native addon.
//!
//! Unsigned PE files with no resources at all match the generic heuristics some
//! antivirus engines apply to downloaded binaries (for example Kaspersky's
//! `Convagent.gen`), so the published `mastercss.node` describes its product,
//! publisher and version like ordinary Windows software. The compiled resource
//! file is written directly, which needs neither a resource compiler nor a
//! dependency; MSVC `link.exe` and `lld-link` both accept `.res` inputs.

use std::{env, fs, path::PathBuf};

const COMPANY: &str = "Aoyue Design LLC";
const PRODUCT: &str = "Master CSS";
const LANGUAGE_ID: u16 = 0x0409;
const CODE_PAGE: u16 = 1200;
const RT_VERSION: u16 = 16;
const VFT_DLL: u32 = 2;

/// Emits the resource link argument when Cargo builds for an MSVC target.
pub fn embed(description: &str, original_filename: &str) {
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed={}", file!());
    if env::var("CARGO_CFG_TARGET_OS").as_deref() != Ok("windows")
        || env::var("CARGO_CFG_TARGET_ENV").as_deref() != Ok("msvc")
    {
        return;
    }
    let version = env::var("CARGO_PKG_VERSION").expect("Cargo provides CARGO_PKG_VERSION");
    let bytes = compile(&version, description, original_filename);
    let path = PathBuf::from(env::var("OUT_DIR").expect("Cargo provides OUT_DIR"))
        .join("windows-resource.res");
    fs::write(&path, bytes).expect("write the Windows resource file");
    println!("cargo:rustc-link-arg-cdylib={}", path.display());
}

/// Returns a compiled `.res` file holding the version info.
pub fn compile(version: &str, description: &str, original_filename: &str) -> Vec<u8> {
    let numbers = version_numbers(version);
    let copyright = format!("Copyright (c) {COMPANY}");
    let internal_name = original_filename
        .rsplit_once('.')
        .map_or(original_filename, |(stem, _)| stem);
    let strings = [
        ("CompanyName", COMPANY),
        ("FileDescription", description),
        ("FileVersion", version),
        ("InternalName", internal_name),
        ("LegalCopyright", copyright.as_str()),
        ("OriginalFilename", original_filename),
        ("ProductName", PRODUCT),
        ("ProductVersion", version),
    ];

    // An empty first entry marks the file as a 32-bit resource file.
    let mut res = resource_entry(0, 0, &[]);
    res.extend(resource_entry(
        RT_VERSION,
        1,
        &version_info(numbers, &strings),
    ));
    res
}

fn version_numbers(version: &str) -> [u16; 4] {
    let core = version.split(['-', '+']).next().unwrap_or_default();
    let mut numbers = [0; 4];
    for (slot, part) in numbers.iter_mut().zip(core.split('.')) {
        *slot = part.parse().unwrap_or(0);
    }
    numbers
}

fn resource_entry(type_id: u16, name_id: u16, data: &[u8]) -> Vec<u8> {
    let mut entry = Vec::with_capacity(32 + data.len() + 3);
    push_u32(&mut entry, data.len() as u32);
    push_u32(&mut entry, 32);
    for id in [type_id, name_id] {
        push_u16(&mut entry, 0xFFFF);
        push_u16(&mut entry, id);
    }
    push_u32(&mut entry, 0); // DataVersion
    let (memory_flags, language) = if type_id == 0 {
        (0, 0)
    } else {
        (0x1030, LANGUAGE_ID)
    };
    push_u16(&mut entry, memory_flags); // MOVEABLE | PURE | DISCARDABLE
    push_u16(&mut entry, language);
    push_u32(&mut entry, 0); // Version
    push_u32(&mut entry, 0); // Characteristics
    entry.extend_from_slice(data);
    align(&mut entry);
    entry
}

fn version_info(numbers: [u16; 4], strings: &[(&str, &str)]) -> Vec<u8> {
    let [major, minor, patch, build] = numbers.map(u32::from);
    let mut fixed = Vec::with_capacity(52);
    for value in [
        0xFEEF_04BD,         // dwSignature
        0x0001_0000,         // dwStrucVersion
        major << 16 | minor, // dwFileVersionMS
        patch << 16 | build, // dwFileVersionLS
        major << 16 | minor, // dwProductVersionMS
        patch << 16 | build, // dwProductVersionLS
        0x3F,                // dwFileFlagsMask
        0,                   // dwFileFlags
        0x0004_0004,         // dwFileOS: VOS_NT_WINDOWS32
        VFT_DLL,             // dwFileType
        0,                   // dwFileSubtype
        0,                   // dwFileDateMS
        0,                   // dwFileDateLS
    ] {
        push_u32(&mut fixed, value);
    }

    let table = strings
        .iter()
        .map(|(key, value)| {
            let text = utf16z(value);
            node(key, &text, (text.len() / 2) as u16, 1, &[])
        })
        .collect::<Vec<_>>();
    let table_key = format!("{LANGUAGE_ID:04X}{CODE_PAGE:04X}");
    let string_file_info = node(
        "StringFileInfo",
        &[],
        0,
        1,
        &[node(&table_key, &[], 0, 1, &table)],
    );
    let mut translation = Vec::with_capacity(4);
    push_u16(&mut translation, LANGUAGE_ID);
    push_u16(&mut translation, CODE_PAGE);
    let var_file_info = node(
        "VarFileInfo",
        &[],
        0,
        1,
        &[node("Translation", &translation, 4, 0, &[])],
    );
    node(
        "VS_VERSION_INFO",
        &fixed,
        fixed.len() as u16,
        0,
        &[string_file_info, var_file_info],
    )
}

/// Serializes one version-info block: wLength, wValueLength, wType, szKey,
/// padding, Value, padding, then the DWORD-aligned children.
fn node(
    key: &str,
    value: &[u8],
    value_length: u16,
    value_type: u16,
    children: &[Vec<u8>],
) -> Vec<u8> {
    let mut block = vec![0, 0];
    push_u16(&mut block, value_length);
    push_u16(&mut block, value_type);
    block.extend(utf16z(key));
    align(&mut block);
    block.extend_from_slice(value);
    for child in children {
        align(&mut block);
        block.extend_from_slice(child);
    }
    let length = u16::try_from(block.len()).expect("version info block fits in a WORD");
    block[..2].copy_from_slice(&length.to_le_bytes());
    block
}

fn utf16z(text: &str) -> Vec<u8> {
    text.encode_utf16()
        .chain([0])
        .flat_map(u16::to_le_bytes)
        .collect()
}

fn align(bytes: &mut Vec<u8>) {
    bytes.resize(bytes.len().next_multiple_of(4), 0);
}

fn push_u16(bytes: &mut Vec<u8>, value: u16) {
    bytes.extend_from_slice(&value.to_le_bytes());
}

fn push_u32(bytes: &mut Vec<u8>, value: u32) {
    bytes.extend_from_slice(&value.to_le_bytes());
}
