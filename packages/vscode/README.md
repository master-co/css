<br>
<div align="center">

<p align="center">
    <img alt="Master CSS" src="https://github.com/master-co/css/assets/33840671/fabe83d3-e882-4c7b-93f1-ca06792a6fb2" width="100%">
</p>
<p align="center">Master CSS for Visual Studio Code</p>

</div>

Master CSS for Visual Studio Code provides manifest-aware language features for Master CSS classes, CSS directives, and project-specific tokens. The extension starts the bundled Master CSS language server, loads the nearest project manifest, and brings completion, hover, TextMate directive highlighting, semantic class-list highlighting, color tools, directive diagnostics, and directive formatting into supported files.

## Quick Start

Install the extension from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=masterco.master-css) or open it directly in VS Code with [vscode:extension/masterco.master-css](vscode:extension/masterco.master-css).

Enable suggestions inside strings so utility completions appear in markup, JSX, template strings, and helper calls:

```json
{
    "editor.quickSuggestions": {
        "strings": true
    }
}
```

For project-aware tokens, create a CSS entry that imports `@master/css`, or declare a Master CSS package dependency in the project `package.json`.

```css
@import "@master/css";

@theme {
    --color-primary: #4f46e5;
}

.button {
    @compose inline-flex items:center gap:2x fg:primary;
}
```

## Features

- **Syntax suggestions**: Completes Master CSS utilities, values, selectors, queries, groups, and directive syntax in configured languages.
- **Hover inspection**: Shows generated CSS previews for Master CSS syntax at the cursor.
- **Syntax highlighting**: Highlights CSS directive syntax with the bundled TextMate grammar, then uses semantic tokens for embedded class lists, manifest-aware variables, components, selectors, pseudo states, queries, units, important markers, and quoted strings.
- **Embedded highlighting modes**: Highlights the active class context by default, can highlight every discovered embedded utility, or can disable embedded utility highlighting.
- **Color support**: Shows VS Code color decorators for supported Master CSS color syntax and lets the VS Code color picker edit those values.
- **Directive diagnostics**: Reports Master CSS directive errors in CSS, SCSS, LESS, and style blocks inside Vue, Svelte, and Astro files.
- **Directive formatting**: Formats Master CSS directives and keeps class important markers attached, such as `bg:transparent !` to `bg:transparent!`.
- **Workspace-aware manifests**: Loads project manifests from the closest detected Master CSS workspace so completions and tokens reflect custom variables, components, utilities, and modes.
- **Restart command**: Provides `Master CSS: Restart Language Server` for reloading the language server after dependency, manifest, or workspace changes.

The default language list covers HTML, PHP, JavaScript, TypeScript, JSX, TSX, CSS, SCSS, LESS, Vue, Svelte, Rust, Astro, Markdown, and MDX.

For CSS, SCSS, and LESS document formatting, the extension delegates to VS Code's existing formatter first, then repairs Master CSS directive spacing and class-list important markers on the formatted text. Vue, Svelte, and Astro CSS-family `<style>` blocks can be formatted when Master CSS is explicitly selected as the formatter, but the extension does not take over their default formatters automatically.

## Workspace Discovery

`masterCSS.workspaces` defaults to `auto`. In auto mode, the language server always creates a root workspace and also detects:

- CSS files importing `@master/css`
- CSS files containing the lightweight `@master entry;` marker
- `package.json` files that declare Master CSS package dependencies such as `@master/css`, `@master/css-runtime`, or official integration packages matching `@master/css*`

Each detected workspace gets its own language service and project manifest. In monorepos, this lets each package use its nearest Master CSS manifest while still keeping the root workspace available.

Use explicit workspace globs when auto detection is not the intended project shape:

```json
{
    "masterCSS.workspaces": [
        "apps/admin",
        "apps/shop",
        "packages/design-system"
    ]
}
```

## Settings

Set options in `.vscode/settings.json` or VS Code user settings with the `masterCSS.` prefix.

```json
{
    "masterCSS.suggestSyntax": true,
    "masterCSS.formatDirectives": true,
    "masterCSS.embeddedSyntaxHighlighting": "active"
}
```

| Setting | Type and default | Description |
| --- | --- | --- |
| `masterCSS.includedLanguages` | `string[]`, default supported language list | Language IDs that receive Master CSS language features. |
| `masterCSS.exclude` | `string[]`, default `["**/.git/**", "**/node_modules/**", "**/.hg/**"]` | Glob patterns excluded from all Master CSS language-service features. |
| `masterCSS.classAttributes` | `string[]`, default `["class", "className"]` | Markup attributes whose quoted string values are treated as Master CSS class strings. |
| `masterCSS.classAttributeBindings` | `Record<string, [string, string] \| false>`, see defaults below | Bound markup attributes and their wrapping delimiters for framework binding syntax. Set an entry to `false` to disable that binding form. |
| `masterCSS.classDeclarations` | `string[]`, default `[]` | Variable declarations or object properties whose strings are treated as Master CSS class strings. |
| `masterCSS.classFunctions` | `string[]`, see defaults below | Function, tagged template, or method-call patterns whose string arguments are treated as Master CSS class strings. |
| `masterCSS.suggestSyntax` | `boolean`, default `true` | Enables Master CSS completion items. |
| `masterCSS.inspectSyntax` | `boolean`, default `true` | Enables hover inspection and generated CSS previews. |
| `masterCSS.renderSyntaxColors` | `boolean`, default `true` | Enables color information for Master CSS syntax. |
| `masterCSS.formatDirectives` | `boolean`, default `true` | Enables Master CSS directive formatting in CSS-family documents. |
| `masterCSS.embeddedSyntaxHighlighting` | `"active"`, `"always"`, or `"off"`; default `"active"` | Controls semantic highlighting for embedded utilities in markup and scripts. CSS directive syntax is still highlighted by the TextMate grammar. |
| `masterCSS.workspaces` | `"auto"` or `string[]`, default `"auto"` | Configures Master CSS workspaces. Auto mode detects CSS entries and Master CSS package dependencies. |

Default class binding and function detection:

```json
{
    "masterCSS.classAttributeBindings": {
        "className": ["{", "}"],
        "class": ["{", "}"],
        "class:list": ["{", "}"],
        ":class": ["\"", "\""],
        "v-bind:class": ["\"", "\""],
        "[class]": ["\"", "\""],
        "[className]": ["\"", "\""],
        "[ngClass]": ["\"", "\""]
    },
    "masterCSS.classFunctions": [
        "clsx",
        "cva",
        "ctl",
        "cv",
        "class",
        "classnames",
        "classVariant",
        "styled(?:\\s+)?(?:\\.\\w+)?",
        "classList(?:\\s+)?\\.(?:add|remove|toggle|replace)"
    ]
}
```

### Common Customizations

Add a custom language ID:

```json
{
    "masterCSS.includedLanguages": [
        "html",
        "typescriptreact",
        "vue",
        "astro",
        "edge"
    ]
}
```

Recognize project-specific class containers:

```json
{
    "masterCSS.classAttributes": [
        "class",
        "className",
        "ui"
    ],
    "masterCSS.classDeclarations": [
        "classes",
        "styles"
    ],
    "masterCSS.classFunctions": [
        "clsx",
        "cva",
        "tw",
        "cn"
    ]
}
```

Exclude generated or vendored files:

```json
{
    "masterCSS.exclude": [
        "**/.git/**",
        "**/node_modules/**",
        "**/.hg/**",
        "**/dist/**",
        "**/.next/**"
    ]
}
```

Choose embedded highlighting behavior:

```json
{
    "masterCSS.embeddedSyntaxHighlighting": "always"
}
```

Use `active` for lower-noise active-context highlighting, `always` to highlight all discovered embedded utility classes, and `off` to disable embedded utility highlighting. Master CSS syntax inside CSS, SCSS, and LESS documents remains highlighted by the extension.

Disable directive formatting when another formatter integration must own all directive whitespace:

```json
{
    "masterCSS.formatDirectives": false
}
```

## Commands

Open the Command Palette and run:

```txt
Master CSS: Restart Language Server
```

Use this after changing dependencies, workspace layout, or project manifest files if VS Code has not reloaded the language server automatically. The extension also restarts the Master CSS language server when `masterCSS.*` settings change.

## Requirements and Limitations

- Requires VS Code `1.120.0` or newer.
- Requires a trusted local workspace because the language server loads configuration and code from the workspace.
- Does not support VS Code virtual workspaces or untrusted workspaces.
- Uses a TextMate injection grammar for CSS directive syntax and semantic tokens for Master CSS class-list spans. It does not contribute a custom `.mcss` language.

## Troubleshooting

- **Completions do not show inside strings**: Enable `editor.quickSuggestions.strings` as shown in [Quick Start](#quick-start).
- **Manifest-specific variables or components are missing**: Ensure the project has a detected CSS entry or Master CSS package dependency, then run `Master CSS: Restart Language Server`.
- **The wrong monorepo package is used**: Set `masterCSS.workspaces` to explicit workspace directories.
- **Embedded markup highlighting is too noisy or too quiet**: Change `masterCSS.embeddedSyntaxHighlighting` to `active`, `always`, or `off`.
- **Semantic colors do not appear**: Confirm VS Code semantic highlighting is enabled for the active theme.

## Documentation

See the [language service guide](https://rc.css.master.co/guide/language-service), the [`@master/css-language-service`](../language-service) README, and the [`@master/css-language-server`](../language-server) README for deeper details.

## Community

The Master CSS community can be found here:

- [Discuss on GitHub](https://github.com/master-co/css/discussions) - Ask questions, voice ideas, and do any other discussion
- [Join our Discord Server](https://discord.com/invite/sZNKpAAAw6) - Casually chat with other people using the language <sup><sub>✓ 中文</sub></sup>

<sub>Our [《 Code of Conduct 》](https://github.com/master-co/css/blob/main/CODE_OF_CONDUCT.md) applies to all Master CSS community channels.</sub>

## Contributing

Please see our [CONTRIBUTING](https://github.com/master-co/css/blob/rc/.github/CONTRIBUTING.md) for workflow.
