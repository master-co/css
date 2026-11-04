//! Process-wide reuse of pure stylesheet graph compilations.
//!
//! A request carries every file, URL and manifest its compilation reads, so the
//! exact request text identifies the result. Hosts repeat identical requests, for
//! example one shared reference graph per local stylesheet; the binding returns
//! the cached response text, and each caller parses its own copy.

use std::collections::VecDeque;
use std::hash::{BuildHasher, BuildHasherDefault, DefaultHasher};
use std::sync::{Arc, Mutex, PoisonError};

use crate::{CompileCssStylesheetGraphInput, CompilerError, compile_css_stylesheet_graph_input};

const BUDGET_BYTES: usize = 16 * 1024 * 1024;
const MAX_ENTRIES: usize = 64;

#[derive(Debug)]
pub enum CompileCssStylesheetGraphJsonError {
    Request(serde_json::Error),
    Compile(CompilerError),
    Response(serde_json::Error),
}

struct Entry {
    hash: u64,
    request: Box<str>,
    response: Arc<str>,
}

impl Entry {
    fn bytes(&self) -> usize {
        self.request.len() + self.response.len()
    }
}

/// Least recently used entries first.
struct Compilations {
    entries: VecDeque<Entry>,
    bytes: usize,
}

static COMPILATIONS: Mutex<Compilations> = Mutex::new(Compilations {
    entries: VecDeque::new(),
    bytes: 0,
});

fn find(compilations: &Compilations, hash: u64, request: &str) -> Option<usize> {
    compilations
        .entries
        .iter()
        .position(|entry| entry.hash == hash && &*entry.request == request)
}

/// Compiles a JSON `CompileCssStylesheetGraphInput` to its JSON result, reusing the
/// response of an identical earlier request. Failed compilations are not retained.
pub fn compile_css_stylesheet_graph_json(
    request_json: &str,
) -> Result<Arc<str>, CompileCssStylesheetGraphJsonError> {
    let hash = BuildHasherDefault::<DefaultHasher>::default().hash_one(request_json);
    {
        let mut compilations = COMPILATIONS.lock().unwrap_or_else(PoisonError::into_inner);
        if let Some(index) = find(&compilations, hash, request_json) {
            let entry = compilations.entries.remove(index).expect("found entry");
            let response = entry.response.clone();
            compilations.entries.push_back(entry);
            return Ok(response);
        }
    }
    let request = serde_json::from_str::<CompileCssStylesheetGraphInput>(request_json)
        .map_err(CompileCssStylesheetGraphJsonError::Request)?;
    let result = compile_css_stylesheet_graph_input(&request)
        .map_err(CompileCssStylesheetGraphJsonError::Compile)?;
    let response: Arc<str> = serde_json::to_string(&result)
        .map_err(CompileCssStylesheetGraphJsonError::Response)?
        .into();
    let entry = Entry {
        hash,
        request: request_json.into(),
        response: response.clone(),
    };
    let bytes = entry.bytes();
    if bytes <= BUDGET_BYTES {
        let mut compilations = COMPILATIONS.lock().unwrap_or_else(PoisonError::into_inner);
        // Another thread may have compiled the same request meanwhile.
        if let Some(index) = find(&compilations, hash, request_json) {
            let previous = compilations.entries.remove(index).expect("found entry");
            compilations.bytes -= previous.bytes();
        }
        while compilations.bytes + bytes > BUDGET_BYTES || compilations.entries.len() >= MAX_ENTRIES
        {
            let oldest = compilations.entries.pop_front().expect("bounded entries");
            compilations.bytes -= oldest.bytes();
        }
        compilations.bytes += bytes;
        compilations.entries.push_back(entry);
    }
    Ok(response)
}

#[cfg(test)]
mod tests {
    use super::compile_css_stylesheet_graph_json;
    use serde_json::json;

    fn request(entry_css: &str) -> String {
        json!({
            "graph": { "entry": "/entry.css", "files": { "/entry.css": entry_css }, "edges": [] },
            "urls": { "/entry.css": "file:///entry.css" },
            "options": { "preserveNativeCSS": true }
        })
        .to_string()
    }

    #[test]
    fn identical_requests_share_one_response() {
        let source = request("@utility memo-a { color: red }\n.a { color: blue }");
        let first = compile_css_stylesheet_graph_json(&source).unwrap();
        let second = compile_css_stylesheet_graph_json(&source).unwrap();
        assert!(std::sync::Arc::ptr_eq(&first, &second));
        let request = serde_json::from_str(&source).unwrap();
        let uncached = crate::compile_css_stylesheet_graph_input(&request).unwrap();
        assert_eq!(*first, *serde_json::to_string(&uncached).unwrap());
    }

    #[test]
    fn distinct_requests_and_failures_compile_separately() {
        let a = compile_css_stylesheet_graph_json(&request(".memo-b { color: red }")).unwrap();
        let b = compile_css_stylesheet_graph_json(&request(".memo-b { color: blue }")).unwrap();
        assert_ne!(a, b);
        let invalid = request("@utility { color: red }");
        assert!(compile_css_stylesheet_graph_json(&invalid).is_err());
        assert!(compile_css_stylesheet_graph_json(&invalid).is_err());
        assert!(compile_css_stylesheet_graph_json("{").is_err());
    }
}
