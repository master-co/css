use mastercss_compiler::compile_css_stylesheet_graph;
use serde_json::json;

#[test]
fn diagnostics_after_removed_directives_retain_original_utf16_offsets() {
    for prefix in [
        "@master entry;\n",
        "@reference './😀.css';\r\n@master entry;@preserve native;\n",
        "@source './😀.html';\n/*😀*/@master entry;\n",
    ] {
        for (body, token) in [
            (
                ".example {\n  @compose unknown-utility;\n}",
                "unknown-utility",
            ),
            ("@utilities invalid {paint{color:red}}", "@utilities"),
            (
                "@utilities {paint{@compose unknown-utility;}}",
                "unknown-utility",
            ),
        ] {
            let source = format!("{prefix}{body}");
            let request = serde_json::from_value(json!({
                "graph":{"entry":"entry.css","files":{"entry.css":source},"edges":[]},
                "urls":{"entry.css":"/entry.css"},
                "baseManifest":{"version":1,"languageVersion":2,"utilities":[]},
                "resolutionManifest":{"version":1,"languageVersion":2,"utilities":[]}
            }))
            .unwrap();
            let error = compile_css_stylesheet_graph(&request)
                .unwrap_err()
                .diagnostic();
            assert_eq!(error.source.as_deref(), Some("entry.css"));
            let start = source[..source.find(token).unwrap()].encode_utf16().count() as u32;
            let range = error
                .range
                .as_ref()
                .unwrap_or_else(|| panic!("{source}: {error:?}"));
            assert_eq!(range.start, start, "{source}: {error:?}");
            assert_eq!(
                range.end,
                start + token.encode_utf16().count() as u32,
                "{source}"
            );
        }
    }
}
