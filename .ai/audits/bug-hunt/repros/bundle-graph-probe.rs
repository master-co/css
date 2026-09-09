use mastercss_compiler::{
    CssImportGraphRequest, compose_css_bundle_graph, render_css_stylesheet_graph,
    resolve_prepared_css_stylesheet_graph,
};
use serde_json::json;
use std::collections::HashMap;

fn main() {
    let slot = "#master-css-slot{--slot:0}";
    let mut records = Vec::new();
    for (id, before, after, wrappers, duplicate) in [
        ("before", ".example{color:green}", "", vec![], false),
        ("after", "", ".example{color:green}", vec![], false),
        (
            "named",
            ".example{color:red!important}",
            ".example{color:green!important}",
            vec![("@layer named", " layer(named)")],
            false,
        ),
        (
            "anonymous",
            ".example{color:red!important}",
            ".example{color:green!important}",
            vec![("@layer", " layer")],
            false,
        ),
        (
            "nested",
            ".example{color:red!important}",
            ".example{color:green!important}",
            vec![
                ("@layer", " layer"),
                ("@supports (display:grid)", " supports(display:grid)"),
                ("@media print", " print"),
            ],
            false,
        ),
        (
            "false-supports",
            ".example{color:red}",
            "",
            vec![(
                "@supports (not-a-property:invalid)",
                " supports(not-a-property:invalid)",
            )],
            false,
        ),
        (
            "trivia",
            "/*🦀 #master-css-slot{--slot:0}*/.example{content:'#master-css-slot{--slot:0}';color:green}",
            "",
            vec![],
            false,
        ),
        ("duplicate", "", ".example{color:green}", vec![], true),
    ] {
        let managed_source =
            "@import 'https://remote.test/style.css';.example{background-color:yellow}";
        let managed = resolve_prepared_css_stylesheet_graph(&CssImportGraphRequest {
            entry: "managed".into(),
            files: HashMap::from([("managed".into(), managed_source.into())]),
            edges: vec![],
        })
        .unwrap();
        let mut source = format!("{before}{slot}{after}{}", if duplicate { slot } else { "" });
        let mut author = HashMap::from([
            ("before.css".to_string(), before.to_string()),
            ("after.css".into(), after.into()),
            ("managed.css".into(), managed_source.into()),
            (
                "inner.css".into(),
                format!(
                    "@import 'before.css';@import 'managed.css';@import 'after.css';{}",
                    if duplicate {
                        "@import 'managed.css';"
                    } else {
                        ""
                    }
                ),
            ),
        ]);
        let mut previous = "inner.css".to_string();
        for (index, (prelude, suffix)) in wrappers.iter().rev().enumerate() {
            source = format!("{prelude}{{{source}}}");
            let name = format!("group-{index}.css");
            author.insert(name.clone(), format!("@import '{previous}'{suffix};"));
            previous = name;
        }
        author.insert("entry.css".into(), format!("@import '{previous}';"));
        let result = compose_css_bundle_graph(&source, "bundle", slot, &managed).unwrap();
        let urls = result
            .graph
            .stylesheets
            .iter()
            .enumerate()
            .map(|(index, node)| (node.id.clone(), format!("/generated/{id}/{index}.css")))
            .collect();
        let assets = render_css_stylesheet_graph(&result.graph, &urls).unwrap();
        let entry = assets
            .iter()
            .find(|asset| asset.id == "bundle")
            .unwrap()
            .href
            .clone();
        records.push(json!({ "id": id, "source": source, "author": author, "entry": entry, "assets": assets, "sources": result.sources, "slots": result.slots }));
    }
    println!("{}", json!(records));
}
