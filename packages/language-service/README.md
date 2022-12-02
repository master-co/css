![image](https://raw.githubusercontent.com/master-co/css-language-service/alpha/images/cover.jpg)

The official [Master CSS](https://github.com/master-co/css) Language Service extension for Visual Studio Code upgrades your development experience.

[![Install to Visual Studio Code now](https://user-images.githubusercontent.com/33840671/185619535-3b426030-7efd-4470-a8d1-d35b5698ee0e.jpg)](https://marketplace.visualstudio.com/items?itemName=masterco.master-css-language-service)

##### On this page
- [Features](#features)
  - [Code-completion](#code-completion)
  - [Syntax highlighting](#syntax-highlighting)
  - [Generate preview](#generate-preview)
- [Settings](#settings)
  - [`editor.quickSuggestions`](#editorquicksuggestions)
  - [`masterCSS.languages`](#mastercsslanguages)
  - [`masterCSS.files.exclude`](#mastercssfilesexclude)
  - [`masterCSS.classNameMatches`](#mastercssclassnamematches)
  - [`masterCSS.previewColor: true`](#mastercsspreviewcolor-true)
  - [`masterCSS.previewOnHover: true`](#mastercsspreviewonhover-true)
  - [`masterCSS.suggestions: true`](#mastercsssuggestions-true)

# Features

## Code-completion
Smart suggestions for style names, values, semantics and selectors.

![code-completion](https://user-images.githubusercontent.com/33840671/185128193-de6c0550-7fa6-4b2d-842c-72f6b79e6d8f.gif)

## Syntax highlighting
Highlight class names to make them easier to read and identify.

![syntax-highlighting](https://user-images.githubusercontent.com/33840671/185127233-1556414a-2859-425f-a421-4b30ff228b9e.jpg)

Master CSS has pioneered applying syntax highlighting to class names in markup, which solves the problem of unreadable classes that are too long.

## Generate preview
Hover over Master class names to see their CSS generation.

![rendering-preview](https://user-images.githubusercontent.com/33840671/185128766-614f302e-7cc3-4294-9179-76f29069d4a6.gif)

# Settings
We have given friendly presets based on mainstream frameworks and languages. If you think there are other commonly used ones that should be built in, please [send a feature issue](https://github.com/master-co/css-language-service/issues/new?assignees=&labels=enhancement&template=feature_request.yml) to us.

- [User and Workspace Settings - Visual Studio Code](https://code.visualstudio.com/docs/getstarted/settings#:~:text=To%20open%20the%20Settings%20editor,macOS%20%2D%20Code%20%3E%20Preferences%20%3E%20Settings)

The following examples are default values：

## `editor.quickSuggestions`
```json
"editor.quickSuggestions": {
    "strings": true
},
```

## `masterCSS.languages`
Configure which languages should apply the Master CSS Language Service.
```json
"masterCSS.languages": [
  "html",
  "php",
  "javascript",
  "typescript",
  "javascriptreact",
  "typescriptreact",
  "vue",
  "svelte",
  "rust"
],
```

## `masterCSS.files.exclude`
Configure a glob pattern to prevent Master CSS Language Service from being applied.
```json
"masterCSS.files.exclude": [
    "**/.git/**",
    "**/node_modules/**",
    "**/.hg/**"
],
```

## `masterCSS.classNameMatches`
Configure Regex patterns as conditions for triggering Suggestions and generating previews.
```json
"masterCSS.classNameMatches": [
  "(class(?:Name)?\\s?=\\s?)((?:\"[^\"]+\")|(?:'[^']+')|(?:`[^`]+`))",
  "(class(?:Name)?={)([^}]*)}",
  "(?:(\\$|(?:(?:element|el)\\.[^\\s.`]+)`)([^`]+)`)",
  "(classList.(?:add|remove|replace|replace|toggle)\\()([^)]*)\\)",
  "(template\\s*\\:\\s*)((?:\"[^\"]+\")|(?:'[^']+')|(?:`[^`]+`))"
],
```

## `masterCSS.previewColor: true`
Render color boxes by color-related class names as previews.

## `masterCSS.previewOnHover: true`
Preview the generated CSS rules when hovering over a class name.

## `masterCSS.suggestions: true`
Enable autocomplete suggestions.
