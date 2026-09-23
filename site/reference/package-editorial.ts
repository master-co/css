/** Reader guidance only. Export paths and declarations are derived from package sources. */
export interface PackageEditorial {
  introduction: string
  usage: string
  entries: Record<string, string>
}

export const packageEditorial: Record<string, PackageEditorial> = {
  '@master/css': {
    introduction: 'Execute a compiled manifest, generate rules for class names and inspect engine state. CSS entrypoints provide the preset stylesheet layers.',
    usage: 'Pass an explicit manifest to engine and render APIs. Reuse a session for repeated work and dispose it when finished. For stylesheet authoring and project loading, use [the compiler](/reference/packages/css-compiler); for DOM observation, use [the runtime](/reference/packages/css-runtime).',
    entries: {
      '.': 'Asynchronous engine creation and one-shot class rendering.',
      './node': 'Synchronous native engine and reusable render sessions in Node.js.',
      './client': 'Ambient TypeScript declarations for generated virtual modules.',
      './index.css': 'Complete preset stylesheet entry.',
      './base.css': 'Base styles and the stable cascade-layer order.',
      './theme.css': 'Preset theme definitions.',
      './variants.css': 'Preset reusable conditions.',
      './utilities.css': 'Preset utility definitions.'
    }
  },
  '@master/css-compiler': {
    introduction: 'Compile stylesheet directives, load project manifests and compose generated CSS with authored styles. Choose the entrypoint that matches the work and execution environment.',
    usage: 'Supply the base manifest explicitly when an API requires it. Inspect returned diagnostics before using the result. A delivery result is an asset set: publish every stylesheet and resource at its assigned URL. See [Stylesheet entrypoints](/reference/directives/entry) for resolution and delivery boundaries.',
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
    usage: 'Add the preset to your ESLint flat configuration. Configure project-specific behavior through the plugin settings described in [Code linting](/guide/code-linting).',
    entries: { '.': 'Recommended ESLint flat configuration.' }
  },
  '@master/eslint-plugin-css': {
    introduction: 'The ESLint plugin connects JavaScript and template syntax to Master CSS validation, class ordering and fixes. Its default and `masterCSS` exports expose the same plugin.',
    usage: 'Use [the official preset](/reference/packages/eslint-config-css) for the standard rules, or register the plugin in your own flat configuration. See [Code linting](/guide/code-linting) for rule behavior and settings.',
    entries: { '.': 'Plugin rules and recommended configuration.' }
  },
  '@master/css-language-server': {
    introduction: 'Provide Master CSS completion, hover, colors, formatting and semantic tokens through the Language Server Protocol. The library entry supports host-managed lifecycle; the server entry starts the process.',
    usage: 'Create and start `MasterCSSLanguageServer` when embedding it in a host, then dispose it during shutdown. Loading the `/server` entry constructs and starts a server immediately. See [Language Service](/guide/language-service) for the editor-facing workflow.',
    entries: { '.': 'Language server, workspace settings and semantic-token request names.', './server': 'Executable server startup entry; no named or default exports.' }
  },
  '@master/css-language-service': {
    introduction: 'Map Master CSS tooling results to editor documents, language features and syntax highlighting. Use the Shiki entrypoint for server-rendered code presentation.',
    usage: 'Supply a tooling session when creating `MasterCSSLanguageService`. Shiki helpers accept a reusable language session or manifest through their options. See [Language Service](/guide/language-service) for configuration and examples.',
    entries: {
      '.': 'Editor document services, settings and trigger characters.',
      './common': 'Shared completion trigger characters.',
      './shiki': 'Shiki transformer, semantic decorations and language registration.',
      './syntaxes/master-css.tmLanguage.json': 'TextMate grammar asset for directive highlighting.'
    }
  },
  '@master/css-mcp': {
    introduction: 'Create a Master CSS Model Context Protocol server or start its stdio transport. Tool contracts describe each request and its file effects separately.',
    usage: 'Use `createMasterCSSMCPServer()` when the host owns transport setup, or `startMasterCSSMCPStdioServer()` for stdio. See [MCP Server](/guide/mcp-server) for client registration and [the tool catalog](/guide/mcp-server) for request contracts.',
    entries: { '.': 'Server factory and stdio startup.' }
  },
  '@master/css-next': {
    introduction: 'Connect Master CSS to Next.js configuration and build output. The root export wraps Next configuration; the adapter entry supports build integration and adapter composition.',
    usage: 'Use the root default export in Next configuration. Its overloads distinguish synchronous runtime or disabled configuration from asynchronous static configuration. See [Next.js installation](/guide/installation/nextjs) for the setup and supported rendering modes.',
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
      './variants.css': 'Preset reusable conditions.',
      './utilities.css': 'Preset utility definitions.'
    }
  },
  '@master/css-runtime': {
    introduction: 'Observe classes in a document or shadow root and maintain their generated CSS. Runtime startup requires a compiled manifest and returns an owned session.',
    usage: 'Await `MasterCSSRuntime.start()` before using the session, and call `dispose()` when its owner is finished. `withMasterCSSRuntime()` integrates startup and disposal with custom-element connection callbacks and requires a shadow root. See [Rendering Modes](/guide/rendering-modes) for the browser workflow.',
    entries: { '.': 'Runtime startup, observation, snapshots and custom-element integration.' }
  },
  '@master/css-schema': {
    introduction: 'Shared types and codecs describe manifests, diagnostics, hydration and integration options. These contracts let hosts exchange structured Master CSS data.',
    usage: 'Import types from the narrow subpath that owns them. A type declaration describes a data shape; it does not validate arbitrary input or compile stylesheet directives. Preserve version fields when passing manifests and diagnostics between APIs.',
    entries: {
      '.': 'Common manifest, diagnostic and rendering-mode exports.',
      './manifest': 'Manifest v1 types, variable helpers and serialization.',
      './hydration-manifest': 'Hydration rules, resource order and serialization helpers.',
      './css-directives': 'Directive results, source ranges and output mappings.',
      './css-syntax': 'Utility, selector and value representation types.',
      './utility-type': 'Utility classification constants and their type.',
      './runtime-style': 'Runtime style element identifier.',
      './emitted-globals': 'Counts of resources already emitted outside a session.',
      './native-css-shorthand': 'Native CSS shorthand property lookup.',
      './css-common': 'Shared CSS vendor identifiers.',
      './diagnostics': 'Diagnostic versions, source ranges and error payloads.',
      './integration': 'Rendering modes and shared integration options.'
    }
  },
  '@master/css-server': {
    introduction: 'Render generated CSS into HTML and produce hydration data for the browser. Use a one-shot helper, a reusable renderer or a streaming HTML session to match the host lifecycle.',
    usage: 'Provide a compiled manifest before rendering. Keep emitted-global and hydration metadata aligned with the CSS delivered to the client, and dispose reusable sessions after use. See [Rendering Modes](/guide/rendering-modes) for complete HTML examples.',
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
      './builtins': 'Built-in property aliases and value namespaces.',
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
