use serde::Deserialize;
use std::collections::HashMap;

use crate::{
    CompilerError, CssBundleGraph, CssStylesheetAsset, CssStylesheetGraph, CssStylesheetNode,
};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssBundleManagedStylesheets {
    pub entry: String,
    pub stylesheets: Vec<CssStylesheetAsset>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrepareCssStylesheetBundleRequest {
    pub source: String,
    pub from: String,
    #[serde(rename = "slotCSSRule")]
    pub slot_css_rule: String,
    pub managed: CssBundleManagedStylesheets,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderCssStylesheetBundleRequest {
    pub bundle: CssBundleGraph,
    pub urls: HashMap<String, String>,
    #[serde(default, rename = "resourceURLs")]
    pub resource_urls: HashMap<String, String>,
    /// Host publishes every fragment at the input stylesheet's resource base.
    #[serde(default)]
    pub preserve_resource_base: bool,
    /// Inline local children only when import order and namespace scope survive.
    #[serde(default)]
    pub inline_imports: bool,
}

/// Accept the existing compiled stylesheet output. Rust discovers its remaining
/// imports and reconnects exact compiler-issued hrefs to their known node IDs.
pub fn prepare_css_stylesheet_bundle(
    request: &PrepareCssStylesheetBundleRequest,
) -> Result<CssBundleGraph, CompilerError> {
    let mut hrefs = HashMap::new();
    for asset in &request.managed.stylesheets {
        if asset.href.is_empty()
            || hrefs
                .insert(asset.href.as_str(), asset.id.as_str())
                .is_some()
        {
            return Err(CompilerError::Import {
                filename: request.from.clone(),
                message: "Managed stylesheets require distinct nonempty delivery URLs".into(),
            });
        }
    }
    let mut nodes = Vec::new();
    for asset in &request.managed.stylesheets {
        let mut imports = crate::stylesheet_graph::source_imports(&asset.css, &asset.id)?;
        for import in &mut imports {
            import.resolved = hrefs
                .get(import.specifier.as_str())
                .map(|id| (*id).to_owned());
        }
        nodes.push(CssStylesheetNode {
            id: asset.id.clone(),
            source: asset.css.clone(),
            imports,
        });
    }
    let managed = CssStylesheetGraph {
        version: 1,
        entry: request.managed.entry.clone(),
        stylesheets: nodes,
        references: Vec::new(),
    };
    // Validate the managed input even when the bundle contains no slot.
    let urls = request
        .managed
        .stylesheets
        .iter()
        .map(|asset| (asset.id.clone(), asset.href.clone()))
        .collect();
    crate::render_css_stylesheet_graph(&managed, &urls)?;
    crate::compose_css_bundle_graph(
        &request.source,
        &request.from,
        &request.slot_css_rule,
        &managed,
    )
}

pub fn render_css_stylesheet_bundle(
    request: &RenderCssStylesheetBundleRequest,
) -> Result<Vec<CssStylesheetAsset>, CompilerError> {
    let bundle = if request.preserve_resource_base {
        if !request.resource_urls.is_empty() {
            return Err(CompilerError::Import {
                filename: request.bundle.graph.entry.clone(),
                message: "Preserving the resource base cannot also relocate resource URLs".into(),
            });
        }
        request.bundle.clone()
    } else {
        crate::relocate_css_bundle_resources(&request.bundle, &request.resource_urls)?
    };
    let assets = crate::render_css_stylesheet_graph(&bundle.graph, &request.urls)?;
    if request.inline_imports {
        crate::stylesheet_inline::inline_stylesheet_imports(&bundle.graph, assets)
    } else {
        Ok(assets)
    }
}
