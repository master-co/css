# @master/css-compiler

Rust-backed CSS directive and manifest compilation for Master CSS.

## Installation

```bash
npm install @master/css-compiler
```

## Responsibility

The Rust compiler and project crates own parsing, directive lowering, manifest
compilation, normalization, native CSS transformation, graph policy, and project
merge policy. TypeScript is limited to platform loading, filesystem/package
resolution, file IO, host CSS capability checks, and orchestration.

## Universal session

```ts
import { createCompiler } from '@master/css-compiler'

const compiler = await createCompiler()
const result = compiler.compileCSS(source, { from: 'src/app.css' })
compiler.dispose()
```

The universal entry prefers the native binding in Node and falls back to
`binding-wasm-compiler`. It never runs a TypeScript parser, lowerer, or CSS transformer.
Session methods are synchronous after asynchronous initialization.

The session exposes batched Rust operations for CSS inspection, directive compilation,
theme compilation, dependency analysis, extraction-policy merging, manifest lowering
and normalization, default-preset compilation, and prepared import graphs.

## Compile separate stylesheets

For a registered stylesheet collection, `collection.compose({ ...options, sourceIds })`
selects the source IDs owned by one host output. Omit `sourceIds` to compose all
registered sources; pass an empty array to emit only the generated CSS from the
supplied manifest and scanner classes. Selection leaves the collection intact.
Publish the selected result's stylesheet and resource assets together.

`compiler.compileStylesheets(request)` compiles prepared files with a shared
manifest while retaining each stylesheet's import order, conditions, and layers.
It is available with native and compiler-Wasm sessions.

```ts
const result = compiler.compileStylesheets({
  graph: {
    entry: 'app',
    files: {
      app: '@import "./theme.css" layer(theme);',
      theme: '@utilities { paint { color: red } } .example { @compose paint; }'
    },
    edges: [{ from: 'app', specifier: './theme.css', resolved: 'theme' }]
  },
  urls: { app: '/styles/app.css', theme: '/styles/theme.css' },
  baseManifest: { version: 1, utilities: [] }
})
```

Deliver every item in `result.stylesheets` at its `href`, and load the entry's
stylesheet. `result.css` contains the entry CSS only. Imports without prepared
edges remain external CSS imports. Imported authoring definitions share the
manifest; native CSS and native `@compose` output retain their stylesheet scopes
and rule positions.

The host supplies file contents, import resolution, and delivery URLs. Use `resourceURLs` to map each source file ID and decoded resource URL to a
root-relative or absolute delivery URL before definitions are merged. For example,
`resourceURLs: { child: { "image.png": "/assets/image.png" } }` preserves a child
definition's image when another file composes it. With this option present, every
parsed relative `url()` or `image-set()` resource requires a mapping. Empty URLs,
fragment-only references, import edges, and namespace identifiers are preserved.
Root-relative replacements require assets to share an origin; use absolute URLs
when output stylesheets can be served from different origins. Without this option,
delivery must retain the original resource bases.
For `@reference`, supply the prepared reference context as `resolutionManifest`;
reference-only definitions are not added to the emitted manifest.

For standalone assets in one directory, `relativeResourceURLs: true` permits
mapped sibling URLs such as `./image.svg`. Every stylesheet URL must also be a
sibling `./name.css` URL. The resulting manifest's resource URLs are scoped to
those stylesheets; do not use it for inline CSS at a different document base.

The Node stylesheet collection accepts `delivery` on both `register` and
`compose`: supply `entryURL`, `stylesheetURL(file, variant)`, `resourceURL(file)`, and,
for sibling assets, `relativeResourceURLs: true`. Composition returns
`stylesheets`, `resources` (source file plus destination href), and dependencies
alongside the entry `css`. Delivery hosts can also supply `onDependency(file)` to observe
attempted stylesheet and resource paths, including missing files, before
registration or composition completes. Use the optional `variant` identity for
stylesheet URLs: shared files can need separate assets for different entry
pruning scopes. Each variant must have a distinct URL. Composition independently
supports `includeNativeCSS`, `includeMasterBaseCSS`, and `includeGeneratedCSS`.
Disabling native output suppresses that file's rules, native compose output and
external imports. Local links from suppressed files remain only when needed to
reach selected output, so empty imports cannot declare excluded cascade layers.
Unreachable stylesheet assets are omitted; authoring definitions and dependencies
still contribute to compilation. The low-level graph
request exposes the same native selection through `nativeStylesheets` (file IDs).
`preserveNativeCSS: false` omits raw native rules and unresolved external imports
while retaining compiled native `@compose` in otherwise included stylesheets;
`includeNativeCSS: false` excludes both kinds of project-native output.
Publish all returned assets together. References are
resolved without emitting their native CSS, while their used resources retain
the reference file's ownership.

`transformStylesheet(id, source, { baseManifest, delivery })` also supports
supplied local stylesheets. It compiles imported `@compose` rules and shared
authoring definitions through the Rust graph compiler, including roots whose
directives occur only in imported descendants. With `preserveImports: true`,
stylesheet resolution classifies these graphs as local while preserving the
original root source. A wholly native graph stays unchanged and its resources
remain owned by the host by default. Hosts that have already transformed a native
graph, such as scoped CSS Modules, can set `transformNativeStylesheets: true`
alongside `delivery` to publish that graph and its resources through the same
asset contract. This option has no effect without `delivery`. `code` is the entry CSS;
`stylesheets` contains retained children and `resources` identifies resource files
to publish. The host must publish the complete returned asset set at the supplied
URLs. `resolveImport` can supply host aliases, and `emittedGlobals` suppresses
variables and animations already provided by global stylesheets. Reference-only
native rules stay excluded. Omitting `delivery` keeps the existing single-source
transform contract. Vite consumes this asset result for local compose entries in
development and production, including inline requests. Further host input and
lifecycle combinations remain under integration validation.

Graph diagnostics retain original UTF-16 source spans after resource URL
relocation and consumption of entry, extraction, and reference directives.
The public binding converts ranges using the diagnostic's own source
file, and collection composition reports the original filename for entry variants.
Errors that do not provide a source range remain unlocated.

CLI `generate --output dist/output.css` publishes these sibling CSS/resource
assets automatically. Deploy the full output asset set, not only output.css.
The legacy file/project/build APIs and `--no-export` still use their existing
single-string paths; their remaining graph-delivery limitations are not removed
by the standalone CLI export path.

## Compose a stylesheet bundle

Use `prepareStylesheetBundle` to insert an existing `compileStylesheets` result
at a complete placeholder rule in a host stylesheet. Rust preserves ordinary
rules before and after each placeholder, shared layer scopes, import conditions,
and valid namespace declarations. Native and compiler-Wasm sessions expose the
same two-phase API:

```ts
const bundle = compiler.prepareStylesheetBundle({
  source: 'body{margin:0}#master-css-slot{--slot:0}body{color:green}',
  from: 'bundle.css',
  slotCSSRule: '#master-css-slot{--slot:0}',
  managed: result // The complete compileStylesheets result above
})
const urls = Object.fromEntries(bundle.graph.stylesheets.map((sheet, index) => [
  sheet.id, `/styles/bundle-${index}.css`
]))
const assets = compiler.renderStylesheetBundle({ bundle, urls })
const entryURL = urls[bundle.graph.entry]
```

Publish every returned asset at its `href` before loading `entryURL`. Assign
URLs after preparation, because the bundle can contain additional stylesheet
nodes. The bundle can be serialized as JSON between preparation and rendering.
The managed input must retain its compiler-issued import URLs and distinct,
nonempty asset `href` values so Rust can reconnect the graph after relocation.

For CSS string delivery, rendering accepts `inlineImports: true`. Rust expands
import-free local children when import order and namespace scope remain intact;
a wrapper containing only one unqualified import can also promote its child.
Select the returned asset whose ID is `bundle.graph.entry` for the CSS string.
Publish the remaining referenced assets and supply URLs valid at the insertion
site. Boundaries that protect external imports or separate namespaces remain
imports. The default rendering mode keeps separate stylesheet assets.

For ordinary bundle fragments, `bundle.sources` reports original UTF-16 ranges,
resource URLs, and imports. Supply `resourceURLs` to rendering as a map from each
decoded URL to an absolute or root-relative URL. Every ordinary relative resource
or CSS import requires a mapping; query strings and fragments belong in the
replacement. Namespace identifiers and fragment-only resource references are
preserved. Managed resources must already have suitable delivery URLs from
`compileStylesheets`; this step does not relocate them again.

Hosts that publish every fragment beside the original stylesheet can instead
set `preserveResourceBase: true`. This preserves ordinary URLs verbatim and cannot
be combined with `resourceURLs`. The host must guarantee the same resource base;
the compiler cannot infer a deployment directory from filesystem paths.

Node delivery hosts can use `resolveStylesheetSync(..., { preserveImports: true })`
for graph-based classification without flattening. `compilationSource` then stays
unexpanded. Set collection delivery's `resolveNodePackageImports: true` to resolve
CSS package exports with Node and preserve their native rules when project CSS is
pruned. Host-specific aliases and virtual CSS resolvers require separate integration.

Placeholders in comments, strings, and larger selectors are not insertion points.
Every matching rule is retained, including repeated occurrences. Supported wrapper
scopes are media, supports, and layers. Other wrapper scopes and invalid namespace
or import placement currently produce diagnostics. This API returns assets;
Vite production builds publish these assets automatically. Vite development CSS
entries serve retained graph assets through the development server; virtual/local
composition paths and graph lifecycle coverage remain incomplete. Webpack
integration remains separate migration work.

`collectStylesheetEmittedGlobals()` compiles the managed import/reference graph
without flattening it. Qualified local imports may retain external imports in
their descendants. Metadata collection reports stylesheet/reference dependencies
and leaves resource-file reads and publication to the delivery host.

## Native synchronous session

```ts
import { createCompilerSync } from '@master/css-compiler/node'

const compiler = createCompilerSync()
```

`createCompilerSync()` requires the native binding and throws
`NATIVE_UNAVAILABLE` when it cannot be loaded.

## Node file helpers

The root entry also provides Node convenience functions such as `compileCSSFile`,
`compileCSSManifestFile`, `compileProjectManifest`, and `resolveCSSImportGraph`.
These functions supply files and Node package `exports` resolution to the Rust
compiler; they do not contain a TypeScript semantic fallback.

The native binding's filesystem project loader retains imported file boundaries
when collecting managed definitions, resolving references and planning source
scans. Native `@compose` output keeps import conditions and layer scopes, while
the separate `generatedCSS` field remains a definition metadata view. Ordinary
native CSS and asset publication belong to stylesheet delivery APIs. This does
not extend the raw `resolveCSSImportGraph().source` flattening contract.

Compiler binding sessions also expose `resolveCSSStylesheetGraph(request)` for
metadata consumers. It accepts prepared files and import edges, returns each
file with its ordered imports, and validates import syntax and cycles without
compiling native or managed CSS. References remain metadata and unresolved
external imports remain edges. Source directives are collected from their
owning files, so relative patterns retain the imported file's directory.

Default stylesheet collections retain the original import graph through
registration and composition. Imported scanning directives are consumed before
native import conditions are applied; source patterns and references retain
their owning files. Native, generated, and Master base output switches apply
across every registered graph. Unresolved entry imports remain the host source's
responsibility. Binding graph requests can identify those exact imports with
`hostImports`; Rust validates ownership and preserves output source anchors.
External imports inside child files still require explicit asset delivery when
they prevent safe inlining.

## Publish a compiled file

`compileManifestFileSync(file, { baseManifest, delivery, preserveNativeCSS: true })`
can prepare a file and its imports for publication as separate stylesheets. The
Node host resolves local imports, package entries and references; the existing
Rust graph compiler retains external import order, conditions and native
`@compose` positions. `delivery` uses the same URL callbacks as standalone
stylesheet collections: `entryURL`, `stylesheetURL(file)` and `resourceURL(file)`.
Each stylesheet must have a distinct final URL.

The returned `stylesheets` include the entry and every required imported CSS
asset; copy each returned `resources` file to its `href` and publish each
stylesheet at its `href` before loading the entry. Compilation performs reads
and returns assets without writing output files. `css`, `nativeCSS` and
`generatedCSS` describe the entry only, so publishing only `css` is insufficient.
Relative resource URLs are rewritten for their original source owner and retain
query strings and fragments. Reference-only stylesheets are not published.
Omitting `preserveNativeCSS` retains the file API's existing default of removing
raw native CSS while preserving compiled native `@compose` and its conditions.
Omitting `delivery` continues to use the legacy single-string file path, whose
external-import limitations remain; other build and `--no-export` consumers
still require their own asset publishing integration.

## Browser entry

```ts
import { createCompiler } from '@master/css-compiler/browser'

const compiler = await createCompiler()
const result = compiler.compileCSS(source)
compiler.dispose()
```

The browser entry loads only `binding-wasm-compiler`. Browser compilation cannot resolve
filesystem `@reference` directives unless the host provides a prepared graph.

The former TypeScript `core`, `lowerCSSDirectives`, and
`createMasterCSSManifest` semantic exports are removed.

## Project, stylesheet, and inspection APIs

Project entry discovery and manifest loading are available from
`@master/css-compiler/project` and its `sync`, `entries`, and `workspace` subpaths.
Managed stylesheet composition is available from
`@master/css-compiler/stylesheet`; browser-safe compilation and directive helpers use
its explicit subpaths. Complete project inspection reports are exposed from
`@master/css-compiler/diagnostics`.

Inspection reports associate each file's `discovered` classes with that file's
actual extracted candidates, including classes repeated across files. Class
classification still comes from the shared Rust scanner after all sources finish.
Invalid-class diagnostics point to the first containing file in report input
order. Safelisted classes absent from source do not create file occurrences.
The per-file `changed` flag reports scanner changes, so it can be false even when
that file contains classes already discovered in another file.


Node project manifest loading (`compileProjectManifest`, `loadProjectManifest`,
and their synchronous variants) preserves each imported stylesheet while
compiling shared definitions. A qualified local import containing an external
import can therefore supply definitions without fetching that external CSS.
`@reference` supplies definitions for composition and contributes dependencies;
its native rules, standalone utility classes, and source policies are not imported.
Relative `@source` and `@source not` patterns beginning with `./` or `../` resolve
from the file that declares them, including imported files. Bare patterns resolve
from the project root. Explicit project entries merge in the supplied order.
These APIs return a manifest and metadata; they do not publish native CSS assets.

These are cohesive compiler host responsibilities. The former project, stylesheet,
and diagnostics package identities are retired.


Build hosts can supply asynchronous CSS file resolution through
`resolveStylesheet(id, source, { preserveImports: true, resolveImport })` and
`collection.register(scanner, id, source, { delivery: { ...delivery, resolveImport } })`.
Use the same resolver for classification and registration. It receives the import
specifier and the importing source ID, and returns an absolute CSS file path,
a `{ id, source, baseFile? }` record from a host loader, `undefined` to use Node
resolution, or `null` to retain an external import. Supplied IDs are absolute file
paths or null-prefixed virtual IDs; virtual sources are not read as files. Query
suffixes remain part of a virtual source identity.
An absolute `baseFile` supplies the original filesystem owner for relative CSS
references as well as imports, resource URLs and source patterns. Reference
definitions retain their own resource bases; parser diagnostics retain the supplied
source identity. Attempted reference paths are reported even when the file is missing.
For CSS emitted from multiple original files, provide a serialized source-map v3
string as `sourceMap` on each supplied import record or entry delivery options.
Reference positions from the Rust compiler are mapped to their original files
before filesystem lookup. An explicitly supplied map must identify a filesystem
origin for every reference; unavailable origins produce an error instead of using
an unrelated directory. Without a map, references use that source's `baseFile`.
Registration stores the prepared graph, so composition does not resolve those
imports again. `onDependency` reports source IDs and attempted file reads; build
hosts should watch filesystem IDs and retain their loader dependencies separately;
aborting or disposing the collection during resolution prevents registration.

For a loader-supplied import, `baseFile` names its absolute source owner for
relative resource URLs and source patterns. Resource delivery preserves URL query
strings and fragments. A virtual source with relative resources and no owner
produces an error instead of inventing a filesystem path. Preprocessing and custom
resolution for `@reference` or resource URLs require further host integration.
Synchronous file compilation does not accept this asynchronous resolver.
For a preprocessed or virtual root, async resolution and delivery options also
accept `baseFile`. Relative Node fallback imports and resource URLs use that
absolute owner while the graph retains the root source identity.


For production graph delivery, an alias or custom resolver pointing to project
CSS follows the project's native CSS pruning policy. A bare-looking import name
alone does not make the file package CSS: the resolved file must belong to the
named package. Package export conditions may select another CSS file within that
package while retaining its native rules. `@preserve native;` explicitly keeps
project-native rules regardless of class usage.

Project loading and compilation options accept `onDependency(file)` in both async
and synchronous APIs. The callback observes each CSS file once per operation,
before reading it, including a missing import or `@reference` target. Hosts can
retain attempted dependencies when loading throws and retry after a file changes.
Manifest results and compiler diagnostics keep their existing semantics.

### Stylesheet source maps

The direct Node stylesheet APIs return a serialized source map v3 in `sourceMap`:
`compileStylesheet()` and `compileRenderedStylesheet()` map their final `css`, and
`transformStylesheet()` maps its returned `code`. Pass a host-prepared input map
through the `sourceMap` option; Sass preparation also supplies its original map.
The compiler chains these inputs through directive removal, import expansion,
native printing and compose lowering, retaining original source contents.

Mappings are source anchors: printed native rules identify their originating rule,
and composed declarations identify the winning authored declaration group or
`@compose` token. An expanded interpolation retains the host map's segment anchor.
Generated wrappers, classes and resources without an authoring location are left
unmapped. Separate assets returned by the `delivery` path do not yet carry output
maps. For otherwise valid native CSS, malformed input maps label the successful
output with its prepared source rather than claiming an original Sass location.
Reference ownership validation still requires valid input context.

### Graph output positions

Each stylesheet returned by `compileStylesheets()` includes `outputMappings` in
UTF-16 offsets relative to that stylesheet's final `css`. Source references address
the original input file, including after import URL changes, resource relocation
and native composition. These are compiler anchors, not a serialized source map;
hosts must chain them through their preprocessor maps and any later delivery edits.

### Inlining compiled imports

`compileStylesheets({ ...request, inlineImports: true })` inlines compatible
local stylesheets after their managed definitions have been compiled. The returned
`stylesheets` array contains the entry and any assets still required by imports,
namespace boundaries or resource URL bases. Publish every returned asset at its
assigned URL. Relative resources can move only between the same delivery base;
provide explicit resource URL mappings when relocating them.

Each final stylesheet keeps `outputMappings` into the original input files through
inlining and qualifier wrappers. `nativeCSS` and `generatedCSS` remain metadata
views of the separately compiled files; use `css` for delivery.

The Node rendered stylesheet path uses this graph compilation for file imports,
so qualified imported files may define managed utilities and compose them in native
rules. If boundaries require multiple assets, use stylesheet delivery options;
the single-output path reports `CSS_IMPORT_ERROR` instead of losing those assets.

With `delivery` options, `compileRenderedStylesheet()` returns `entry`,
`stylesheets`, and `resources`. The stylesheet list includes the entry; publish
all assets at their assigned `href` values. Each stylesheet has a serialized
`sourceMap` for its final CSS. The entry's `css` equals the top-level result and
contains generated globals once, after its retained import rules. Sass dependencies
and original diagnostic locations remain attached to their source files.

### Ordered native composition

Direct `compileManifest()`, stylesheet compilation and local transforms return
final `css` with native and composed rules in their original positions. Repeated
selectors retain their cascade order; anonymous layers remain the same layer.
Do not reconstruct this output by concatenating `nativeCSS` and `generatedCSS`:
those fields are separate metadata views.

For raw compiler binding calls, forward the parser's `nativeOutput` together with
`manifestInput`, `styleDefinitions` and `warnings` to `lowerCSSDirectives()`.
Rust returns ordered `css` and its UTF-16 `outputMappings`; the Node stylesheet
host chains those mappings through import and Sass origins. Treat `nativeOutput`
as a compiler-produced plan and pass it unchanged. Invalid or overlapping slot
ranges are rejected. The plan stays in compiler data and is not part of a runtime
manifest or the engine Wasm payload.
