//! Process-wide reuse of the programs compiled from manifest JSON.
//!
//! Hosts create many short-lived sessions from one project manifest, such as a
//! render session per stylesheet. The JSON text identifies the program, so an
//! identical text reuses it instead of validating and compiling the manifest
//! again. Entries are immutable; an evicted one only costs a recompilation.

use std::collections::VecDeque;
use std::hash::{BuildHasher, BuildHasherDefault, DefaultHasher};
use std::sync::{Arc, Mutex, PoisonError};

use super::session::{decode_program, parse_manifest};
use super::{EngineError, Program, compile_manifest};

/// Distinct manifests a host alternates between: its project manifest, the
/// resolution manifests of its references and a few stylesheet-local ones.
const MAX_ENTRIES: usize = 8;

struct Entry {
    hash: u64,
    text: Box<str>,
    program: Arc<Program>,
    json: Arc<str>,
}

/// Least recently used entries first.
static PROGRAMS: Mutex<VecDeque<Entry>> = Mutex::new(VecDeque::new());

/// The program a session executes for `manifest_json`, and the normalized manifest
/// JSON it reports, compiled exactly as [`compile_program`](crate::compile_program)
/// encodes it and a browser decodes it.
pub(crate) fn manifest_program(
    manifest_json: &str,
) -> Result<(Arc<Program>, Arc<str>), EngineError> {
    let hash = BuildHasherDefault::<DefaultHasher>::default().hash_one(manifest_json);
    {
        let mut programs = PROGRAMS.lock().unwrap_or_else(PoisonError::into_inner);
        if let Some(index) = programs
            .iter()
            .position(|entry| entry.hash == hash && &*entry.text == manifest_json)
        {
            let entry = programs.remove(index).expect("found entry");
            let found = (entry.program.clone(), entry.json.clone());
            programs.push_back(entry);
            return Ok(found);
        }
    }
    let (manifest, json) = parse_manifest(manifest_json)?;
    let program = Arc::new(decode_program(&super::program::encode(&compile_manifest(
        &manifest,
    )?))?);
    let json: Arc<str> = json.into();
    let mut programs = PROGRAMS.lock().unwrap_or_else(PoisonError::into_inner);
    // Another thread may have compiled the same manifest meanwhile.
    programs.retain(|entry| entry.hash != hash || &*entry.text != manifest_json);
    while programs.len() >= MAX_ENTRIES {
        programs.pop_front();
    }
    programs.push_back(Entry {
        hash,
        text: manifest_json.into(),
        program: program.clone(),
        json: json.clone(),
    });
    Ok((program, json))
}
