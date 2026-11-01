export const sassIllustration = {
  "title": "Let each compiler read its own language",
  "alt": "Sass compiles legacy.scss into ordinary legacy.css. A separate app.css imports that result and contains Master CSS definitions. Master CSS compiles the app entry after the Sass output exists.",
  "caption": "Keep Master CSS definitions in the .css entry. Import Sass’s compiled result, and preserve the same build order during development and production.",
  "labels": {
    "sassFile": "legacy.scss",
    "sassDefinition": "@mixin stack { … }",
    "sassUse": "@include stack;",
    "sass": "Sass",
    "legacy": "legacy.css",
    "selector": ".article-summary {",
    "declaration": "  display: grid;",
    "close": "}",
    "app": "app.css",
    "import": "@import \"./legacy.css\";",
    "masterDefinition": "@mixin --stack { … }",
    "master": "Master CSS",
    "output": "CSS for the browser"
  },
  "description": [
    {
      "title": "Preprocess Sass",
      "text": "The Sass compiler expands @mixin stack and @include stack into ordinary CSS."
    },
    {
      "title": "Import the output",
      "text": "app.css imports legacy.css after that generated file exists."
    },
    {
      "title": "Compile the app entry",
      "text": "Master CSS reads its own definitions in app.css and preserves the imported native rules."
    }
  ]
} as const
export function sassIllustrationMarkdown() {
  const figure = sassIllustration
  return `**${figure.title}**\n\n${figure.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${figure.caption}`
}
