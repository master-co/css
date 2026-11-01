/** Reader guidance only. Export paths and searchable symbols come from public package contracts. */
export interface PackageEditorial {
  introduction: string
  usage: string
  entries: Record<string, string>
}

export const packageEditorial: Record<string, PackageEditorial> = {
  '@master/css': {
    introduction: 'Execute a compiled manifest or runtime program, generate rules for class names and inspect engine state. CSS entrypoints provide the preset stylesheet layers.',
    usage: 'Pass an explicit manifest to engine and render APIs in Node.js, or a runtime program from `compileRuntimeProgram()` anywhere; browsers execute only programs. Reuse a session for repeated work and dispose it when finished. For stylesheet authoring and project loading, use [the compiler](/reference/packages#css-compiler); for DOM observation, use [the runtime](/reference/packages#css-runtime).\n\n'
      + 'Build integrations expose the delivery artifacts as virtual modules declared by `./client`: `virtual:master-css-manifest` is the compiled `MasterCSSManifest` for the Node engine, server renderer and tooling; `virtual:master-css-program` is the browser engine program, a hashed `.bin` asset in production builds; `virtual:master-css-emitted-globals` lists variables and keyframes the CSS entry already emits, so runtime generation does not repeat them. A page hydration manifest is separate and describes one response.\n\n'
      + 'Build-time and server generation use Rust semantics; the browser engine executes compiled programs and produces the same CSS for the same definitions and classes. Compile with matching compiler, server and runtime releases: unsupported execution or language versions are rejected.\n\n'
      + '`executionState(names)` reads stored rule references in request order, repeats included, without generating rules; unknown or never-ensured classes have empty references. Use `snapshot()` for complete rules and CSS. The browser engine has no inspection or render sessions. A host must synchronize resource state even when a transition has no CSS mutations, and a wrapper must forward every `MasterCSSEngine` member, including `executionState`, `registerEmittedGlobals`, `replaceEmittedGlobals`, `refresh`, `dispose` and `Symbol.dispose`.',
    entries: {
      '.': 'Asynchronous engine creation and one-shot class rendering.',
      './node': 'Synchronous native engine, runtime program compilation and reusable render sessions in Node.js.',
      './client': 'Ambient TypeScript declarations for generated virtual modules.',
      './index.css': 'Complete preset stylesheet entry.',
      './base.css': 'Base styles and the stable cascade-layer order.',
      './theme.css': 'Preset theme definitions.',
      './media.css': 'Preset viewport and preference conditions.',
      './container.css': 'Preset container width conditions.',
      './utilities.css': 'Preset utility registrations.'
    }
  },
  '@master/css-compiler': {
    introduction: 'Compile stylesheet directives, load project manifests and compose generated CSS with authored styles. Choose the entrypoint that matches the work and execution environment.',
    usage: 'Supply the base manifest explicitly when an API requires it. Inspect returned diagnostics before using the result. A delivery result is an asset set: publish every stylesheet and resource at its assigned URL. See [Stylesheet entrypoints](/reference/directives/imports) for resolution and delivery boundaries.',
    entries: {
      '.': 'Asynchronous compiler sessions and in-memory directive compilation.',
      './node': 'Synchronous native compilation and filesystem resolution.',
      './project': 'Asynchronous project entry discovery and manifest loading.',
      './project/sync': 'Synchronous project entry discovery and manifest loading.',
      './stylesheet': 'Node.js stylesheet resolution, composition and delivery assets.',
      './stylesheet/browser': 'Browser compilation from supplied source and a base manifest.',
      './diagnostics': 'Project inspection reports with classes, files and diagnostics.'
    }
  },
  '@master/create-css': {
    introduction: 'Plan and apply Master CSS setup for an existing project. The plan describes dependency changes, file edits, commands and warnings before application.',
    usage: 'Call `planMasterCSSSetup()` to inspect the proposed changes. `applyMasterCSSSetupPlan()` checks recorded file preconditions before writing; create a new plan if those files change. Setup can modify project files and install dependencies. See [Installation](/guide/installation) for the interactive workflow.',
    entries: { '.': 'Setup planning, application and their options and result types.' }
  },
  '@master/css-svelte-addon': {
    introduction: 'The official Svelte CLI add-on configures Master CSS in SvelteKit projects, including dependencies, Vite integration, stylesheet imports and server hooks.',
    usage: 'Run this add-on through the Svelte CLI. Its setup rejects projects without SvelteKit, and its run step requires a Svelte dependency. See [Svelte installation](/guide/installation/svelte) for the complete setup.',
    entries: { '.': 'Default add-on consumed by the Svelte CLI.' }
  },
  '@master/eslint-config-css': {
    introduction: 'Use the official flat-config preset to enable Master CSS lint rules in ESLint. The default export and `recommended` refer to the same configuration.',
    usage: 'Add the preset to your ESLint flat configuration. Configure project-specific behavior through [the plugin settings](/reference/packages#eslint-plugin-css); [Code linting](/guide/code-linting) shows each rule.\n\n'
      + '| Rule | Default | Fixable | Reports |\n| --- | --- | --- | --- |\n'
      + '| `@master/css/sort-classes` | `warn` | Yes | Classes out of generated-rule order, and duplicates. |\n'
      + '| `@master/css/no-invalid-classes` | `error` | No | Invalid Master CSS syntax and invalid generated CSS; unmatched classes only with `disallowUnknownClass`. |\n'
      + '| `@master/css/no-conflicting-classes` | `warn` | Yes | Full and partial declaration conflicts in the same variant scope; only full overrides are fixed. |\n'
      + '| `@master/css/prefer-canonical-classes` | `warn` | Yes | Non-canonical forms, only when token identity and generated-rule behavior are preserved. |\n\n'
      + '`@master/css/no-unapproved-raw-values` and `@master/css/prefer-component-classes` are not in the preset.',
    entries: { '.': 'Recommended ESLint flat configuration.' }
  },
  '@master/eslint-plugin-css': {
    introduction: 'The ESLint plugin connects JavaScript and template syntax to Master CSS validation, class ordering and fixes. Its default and `masterCSS` exports expose the same plugin.',
    usage: 'Use [the official preset](/reference/packages#eslint-config-css) for the standard rules, or register the plugin in your own flat configuration. See [Code linting](/guide/code-linting) for rule behavior.\n\n'
      + 'Settings live under the `@master/css` settings key. Arrays replace their defaults.\n\n'
      + '| Setting | Default | Use |\n| --- | --- | --- |\n'
      + '| `classAttributes` | `[\'class\', \'className\']` | Markup attributes that contain class strings. |\n'
      + '| `classFunctions` | `clsx`, `cva`, `ctl`, `cv`, `class`, `classnames`, `classVariant`, `styled`, `classList.add/remove/toggle/replace` | Callees and tagged templates whose arguments can contain class strings; `styled` also accepts member forms such as `styled.button`. |\n'
      + '| `classDeclarations` | `[]` | Project variables or object properties treated as class declarations. |\n'
      + '| `ignoredKeys` | `[\'compoundVariants\', \'defaultVariants\']` | Object keys skipped while traversing variant config objects. |\n\n'
      + '`@master/css/no-unapproved-raw-values` reports raw values in token-backed utilities. `requireProperties` limits it to listed native properties (empty or omitted checks every token-backed property); `allowProperties` and `allowedPatterns` add exceptions; `allowRawValues` disables it. Native custom-property references stay valid. Its diagnostic `data` names the property scope and canonical token families; it has no autofix.\n\n'
      + '`@master/css/prefer-component-classes` reports a class list in which more than `max` classes (default `3`) style other elements through a top-level `_`, `>`, `+` or `~` combinator. Its diagnostic `data` lists `classNames` and their `targets`; it has no autofix.',
    entries: { '.': 'Plugin rules and recommended configuration.' }
  },
  '@master/css-language-server': {
    introduction: 'Provide Master CSS completion, hover, colors, formatting and semantic tokens through the Language Server Protocol. The library entry supports host-managed lifecycle; the server entry starts the process.',
    usage: 'Create and start `MasterCSSLanguageServer` when embedding it in a host, then dispose it during shutdown. Loading the `/server` entry constructs and starts a server immediately. See [Language Service](/guide/language-service) for the editor-facing workflow.',
    entries: { '.': 'Language server, workspace settings and semantic-token request names.', './server': 'Executable server startup entry; no named or default exports.' }
  },
  '@master/css-language-service': {
    introduction: 'Map Master CSS tooling results to editor documents, language features and syntax highlighting. Use the Shiki entrypoint for server-rendered code presentation.',
    usage: 'Supply a tooling session when creating `MasterCSSLanguageService`. Shiki helpers accept a reusable language session or manifest through their options. Import `@master/css-language-service/shiki.css` for hover-activated markup highlighting. See [Language Service](/guide/language-service) for configuration and examples.',
    entries: {
      '.': 'Editor document services, settings and trigger characters.',
      './common': 'Shared completion trigger characters.',
      './shiki': 'Shiki transformer, semantic decorations and language registration.',
      './shiki.css': 'Hover-activated markup class colors for Shiki output.',
      './syntaxes/master-css.tmLanguage.json': 'TextMate grammar asset for directive highlighting.'
    }
  },
  '@master/css-mcp': {
    introduction: 'Create a Master CSS Model Context Protocol server or start its stdio transport. The tool catalog identifies operations and their file effects.',
    usage: 'Use `createMasterCSSMCPServer()` when the host owns transport setup, or `startMasterCSSMCPStdioServer()` for stdio. See [MCP Server](/guide/ai-coding#connect-the-mcp-server) for client registration and [the tool catalog](/guide/ai-coding#connect-the-mcp-server) for usage; read complete contracts through `tools/list`.',
    entries: { '.': 'Server factory and stdio startup.' }
  },
  '@master/css-next': {
    introduction: 'Connect Master CSS to Next.js configuration and build output. The root export wraps Next configuration; the adapter entry supports build integration and adapter composition.',
    usage: 'Use the root default export in Next configuration. Await the wrapper when using a rendering mode that processes build output. See [Next.js installation](/guide/installation/nextjs) for the setup and supported rendering modes.',
    entries: { '.': 'Next configuration wrapper and integration options.', './adapter': 'Build adapter, composition helpers and rendered-output reports.' }
  },
  '@master/css-nuxt': {
    introduction: 'Register Master CSS as a Nuxt module. The default and `masterCSSNuxtModule` exports refer to the same module.',
    usage: 'Register the module through Nuxt configuration so the framework owns its setup and lifecycle. See [Nuxt installation](/guide/installation/nuxtjs) for configuration.',
    entries: { '.': 'Nuxt module.' }
  },
  '@master/css-preset': {
    introduction: 'The preset supplies theme tokens, conditions, utilities and a compiled default manifest. CSS imports and the JSON manifest serve different consumers.',
    usage: 'Import CSS when authoring a stylesheet; pass the JSON manifest to APIs that execute or compile against a base manifest. [Theme Tokens](/guide/theme) explains authoring and overrides.',
    entries: {
      '.': 'Complete preset stylesheet entry.',
      './default-manifest.json': 'Compiled default manifest for engine, compiler and tooling APIs.',
      './index.css': 'Complete preset stylesheet entry.',
      './base.css': 'Base styles and the stable cascade-layer order.',
      './theme.css': 'Preset theme definitions.',
      './media.css': 'Preset viewport and preference conditions.',
      './container.css': 'Preset container width conditions.',
      './utilities.css': 'Preset utility registrations.'
    }
  },
  '@master/css-runtime': {
    introduction: 'Observe classes in a document or shadow root and maintain their generated CSS. Runtime startup requires a runtime program, the project manifest compiled for the browser engine, and returns an owned session.',
    usage: 'Await `MasterCSSRuntime.start()` before using the session, and call `dispose()` when its owner is finished. `withMasterCSSRuntime()` integrates startup and disposal with custom-element connection callbacks and requires a shadow root. See [Rendering Modes](/guide/rendering-modes) for the browser workflow.\n\n'
      + 'Official integrations inject startup. A custom entry passes `program` as a loader, such as `() => import(\'virtual:master-css-program\').then(module => module.default)`, plus `emittedGlobals`, then calls `observe()`. Runtime-only pages load the program during startup; progressive pages with a valid `hydrationManifest` defer the engine until a class outside it appears, unless `engine: \'eager\'` or `enginePrefetch: \'idle\'` is set. `emittedGlobals` applies to every page using the bundle. The runtime inserts generated rules and on-demand keyframes into its own stylesheet and never writes to linked stylesheets.\n\n'
      + '`snapshot()` separates `usageCounts`, connected DOM usage, from `classRules`, which can also hold warmed, hydrated or retained rules. `engine` is `\'deferred\'`, `\'loading\'`, `\'ready\'` or `\'failed\'`; before a deferred engine starts, class snapshots have no rule entries and `layers` is empty. `ensureClassRules()` and `deleteClassRules()` act independently of DOM usage; deletion is synchronous and bypasses retention. Before the engine is ready they throw `RUNTIME_ENGINE_NOT_READY` and start it, so await `ready()` first.',
    entries: {
      '.': 'Runtime startup, observation, snapshots and custom-element integration.',
      './default-program': 'The default preset compiled into a runtime program, for apps without a Master CSS build integration.'
    }
  },
  '@master/css-schema': {
    introduction: 'Shared types and codecs describe manifests, diagnostics, hydration and integration options. These contracts let hosts exchange structured Master CSS data.',
    usage: 'Import types from the narrow subpath that owns them. A type declaration describes a data shape; it does not validate arbitrary input or compile stylesheet directives. Preserve version fields when passing manifests and diagnostics between APIs; editing them by hand does not make a manifest compatible.\n\n'
      + 'Store manifests with `serializeMasterCSSManifest()`. Serialization normalizes derived fields; it does not replace engine validation or keep comments and editable CSS formatting. Unknown fields are not an extension mechanism: an outer envelope that retains them does not make nested fields accepted or executable.',
    entries: {
      '.': 'Common manifest, diagnostic and rendering-mode exports.',
      './manifest': 'Manifest v6 types, variable helpers and serialization.',
      './hydration-manifest': 'Hydration rules, resource order and serialization helpers.',
      './css-directives': 'Directive results, source ranges and output mappings.',
      './css-syntax': 'Utility, selector and value representation types.',
      './utility-type': 'Utility classification constants and their type.',
      './runtime-style': 'Runtime style element identifier.',
      './emitted-globals': 'Counts of resources already emitted outside a session.',
      './css-common': 'Shared CSS vendor identifiers.',
      './diagnostics': 'Diagnostic versions, source ranges and error payloads.',
      './integration': 'Rendering modes and shared integration options.'
    }
  },
  '@master/css-server': {
    introduction: 'Render generated CSS into HTML and produce hydration data for the browser. Use a one-shot helper, a reusable renderer or a streaming HTML session to match the host lifecycle.',
    usage: 'Provide a compiled manifest before rendering. Keep emitted-global and hydration metadata aligned with the CSS delivered to the client, and dispose reusable sessions after use. See [Rendering Modes](/guide/rendering-modes) for complete HTML examples.\n\n'
      + '`createServerRenderer()` caches rules across renders: recreate it when the manifest changes, and bound `maxCachedClasses` in a long-lived server. Custom hosts can pass the final `stylesheets` a page may link, as `{ href, css, imports }` from `describeLinkedStylesheet()` in `@master/css-compiler/stylesheet`, with the `documentURL` that resolves them; theme variables and native keyframes those stylesheets already deliver are not repeated in `style#master-css`. Rendering tracks each keyframe definition independently, including same-name definitions in different layers or conditions.',
    entries: { '.': 'HTML rendering, streaming sessions and hydration options.' }
  },
  '@master/css-svelte': {
    introduction: 'Integrate Master CSS with Svelte builds and SvelteKit server responses. Build and request handling use separate entrypoints.',
    usage: 'Register the Vite plugin in build configuration and the named `handle` export in the SvelteKit server hook. See [Svelte installation](/guide/installation/svelte) for the complete wiring.',
    entries: { './vite': 'Svelte-aware Vite plugin and options.', './hooks.server': 'Named SvelteKit request handler.' }
  },
  '@master/css-tooling': {
    introduction: 'Analyze class syntax, extract candidates, validate rules and provide lint or language results. Choose a focused entrypoint or reuse a tooling session across operations.',
    usage: 'Supply the project manifest when creating sessions or calling semantic helpers. Reuse sessions for repeated analysis, then dispose them. Node subpaths expose synchronous native operations; filesystem scanning has its own asynchronous lifecycle.',
    entries: {
      '.': 'Reusable asynchronous tooling session spanning analysis capabilities.',
      './node': 'Synchronous native session and native declaration support.',
      './lexer': 'Class-list and CSS source analysis.',
      './lexer/node': 'Synchronous native class-list analysis.',
      './source': 'Source candidate extraction and source-range types.',
      './source/node': 'Synchronous native source extraction.',
      './scanner/node': 'Filesystem scanner, retained candidates and scanner lifecycle.',
      './validator': 'Class validation against a supplied manifest.',
      './validator/node': 'Synchronous native class validation.',
      './lint': 'Lint diagnostics, edits, canonical suggestions and content helpers.',
      './lint/node': 'Synchronous native class linting.',
      './language': 'Editor-neutral analysis, completions, colors and semantic tokens.',
      './language/node': 'Synchronous native language sessions and analysis.'
    }
  },
  '@master/css-vite': {
    introduction: 'Register Master CSS in Vite to compile project styles and coordinate the selected rendering mode. The default export and `createMasterCSSVitePlugin` are the same factory.',
    usage: 'Call the factory in Vite configuration and let Vite own the returned plugin lifecycle. See [Vite installation](/guide/installation/vite) for the stylesheet entry and rendering-mode setup.',
    entries: { '.': 'Vite plugin factory and options.' }
  },
  '@master/css-webpack': {
    introduction: 'Register Master CSS with Webpack. The default export and `MasterCSSWebpackPlugin` expose the plugin class; options select its rendering and scanner behavior.',
    usage: 'Construct the plugin in Webpack configuration so Webpack controls its compilation hooks. See [Webpack installation](/guide/installation/webpack) for the stylesheet and loader setup.',
    entries: { '.': 'Webpack plugin class and options.' }
  },
  '@master/css-astro': {
    introduction: 'Connect Master CSS to Astro configuration and request handling. The integration configures build behavior; the middleware entry exposes Astro’s request hook.',
    usage: 'Use the default integration factory in Astro configuration. See [Astro installation](/guide/installation/astro) for build and middleware setup.',
    entries: { '.': 'Astro integration factory and options.', './middleware': 'Astro request middleware.' }
  }
}
