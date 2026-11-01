export const materialUIIllustration = {
  "title": "Resolve the theme before choosing a token",
  "alt": "Three sx values are resolved using the theme: gap 2 becomes 16 pixels, padding 3 becomes 24 pixels, and borderRadius 2 becomes 16 pixels because the example theme sets its base radius to 8 pixels. The corresponding classes are gap-md, p-lg and the custom r-panel.",
  "caption": "The example uses default 8px spacing, an explicit 8px base radius and a 16px root font size. The same number in sx does not always mean the same CSS length.",
  "labels": {
    "source": "MUI sx",
    "value": "Resolved CSS",
    "target": "Master CSS",
    "gap": "gap: 2",
    "gapMath": "2 × 8px = 16px",
    "gapClass": "gap-md",
    "padding": "p: 3",
    "paddingMath": "3 × 8px = 24px",
    "paddingClass": "p-lg",
    "radius": "borderRadius: 2",
    "radiusMath": "2 × 8px = 16px",
    "radiusClass": "r-panel",
    "token": "--radius-panel: 1rem;",
    "explicit": "The radius comes from this theme, not the default MUI radius."
  },
  "description": [
    {
      "title": "Resolve spacing",
      "text": "With the default spacing function, gap: 2 is 16px and p: 3 is 24px."
    },
    {
      "title": "Resolve shape",
      "text": "The article sets theme.shape.borderRadius to 8px, so borderRadius: 2 produces 16px."
    },
    {
      "title": "Choose matching tokens",
      "text": "gap-md and p-lg match the spacing at a 16px root size. A custom --radius-panel: 1rem supplies r-panel."
    }
  ]
} as const
export function materialUIIllustrationMarkdown() {
  const figure = materialUIIllustration
  return `**${figure.title}**\n\n${figure.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${figure.caption}`
}
