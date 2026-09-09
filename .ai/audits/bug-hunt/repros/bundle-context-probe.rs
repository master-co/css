use mastercss_compiler::{
    CssImportGraphRequest, compose_css_bundle_graph, relocate_css_bundle_resources,
    render_css_stylesheet_graph, resolve_prepared_css_stylesheet_graph,
};
use serde_json::json;
use std::collections::HashMap;

fn main() {
    let slot = "#master-css-slot{--slot:0}";
    let mut records = Vec::new();
    for (id, namespaces, before, after, layered, resources) in [
        (
            "prefix",
            "@namespace svg 'http://www.w3.org/2000/svg';",
            "svg|a{fill:red}",
            "svg|a{fill:blue;stroke:green}",
            false,
            false,
        ),
        (
            "default",
            "@namespace 'http://www.w3.org/2000/svg';",
            "a{color:red}",
            "a{color:blue}",
            false,
            false,
        ),
        (
            "redeclared",
            "@namespace ns 'http://www.w3.org/2000/svg';@namespace ns 'http://www.w3.org/1999/xhtml';",
            "ns|a{color:red}",
            "ns|a{color:green}",
            false,
            false,
        ),
        (
            "layer",
            "@namespace svg url('http://www.w3.org/2000/svg');",
            "svg|a{fill:red!important}",
            "svg|a{fill:green!important}",
            true,
            false,
        ),
        (
            "layer-order-namespace",
            "@layer first;@namespace svg 'http://www.w3.org/2000/svg';",
            "svg|a{fill:red}",
            "svg|a{fill:blue}",
            false,
            false,
        ),
        (
            "urls",
            "@namespace ns url(namespace-uri);",
            ".example{outline-style:solid}",
            ".example{background-image:image-set('pixel.svg?q=1#part' 1x,url(big.svg) 2x);mask:url(#local);content:'url(fake.svg)'}",
            false,
            true,
        ),
    ] {
        let managed_source = ".example{background-color:yellow}";
        let managed = resolve_prepared_css_stylesheet_graph(&CssImportGraphRequest {
            entry: "managed".into(),
            files: HashMap::from([("managed".into(), managed_source.into())]),
            edges: vec![],
        })
        .unwrap();
        let imported = if resources {
            "@import 'paint.css?rev=1';"
        } else {
            ""
        };
        let body = format!("{before}{slot}{after}");
        let source = format!(
            "/*🦀*/{imported}{namespaces}{}",
            if layered {
                format!("@layer{{@media print{{{body}}}}}")
            } else {
                body
            }
        );
        let mut author = HashMap::from([
            ("before.css".to_string(), format!("{namespaces}{before}")),
            ("after.css".into(), format!("{namespaces}{after}")),
            ("managed.css".into(), managed_source.into()),
            (
                "inner.css".into(),
                "@import 'before.css';@import 'managed.css';@import 'after.css';".into(),
            ),
            ("paint.css".into(), ".example{outline-color:purple}".into()),
        ]);
        author.insert(
            "entry.css".into(),
            format!(
                "{imported}@import 'inner.css'{};",
                if layered { " layer print" } else { "" }
            ),
        );
        let result = compose_css_bundle_graph(&source, "bundle", slot, &managed).unwrap();
        let result = relocate_css_bundle_resources(
            &result,
            &HashMap::from([
                ("paint.css?rev=1".into(), "/author/paint.css?rev=1".into()),
                (
                    "pixel.svg?q=1#part".into(),
                    "/author/pixel.svg?q=1#part".into(),
                ),
                ("big.svg".into(), "/author/big.svg".into()),
                ("namespace-uri".into(), "/wrong-namespace".into()),
            ]),
        )
        .unwrap();
        let urls = result
            .graph
            .stylesheets
            .iter()
            .enumerate()
            .map(|(index, node)| (node.id.clone(), format!("/moved/{id}/{index}.css")))
            .collect();
        let assets = render_css_stylesheet_graph(&result.graph, &urls).unwrap();
        let entry = assets
            .iter()
            .find(|asset| asset.id == "bundle")
            .unwrap()
            .href
            .clone();
        records.push(json!({ "id": id, "source": source, "author": author, "entry": entry, "assets": assets, "resources": resources, "slots": result.slots }));
    }
    println!("{}", json!(records));
}
