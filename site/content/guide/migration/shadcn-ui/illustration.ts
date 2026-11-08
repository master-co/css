export const shadcnIllustration = {
  "title": "Let the layer decide the override",
  "alt": "A converted Button renders data-slot=\"button\" and receives the caller's px-lg class. The data-slot attribute selects a components-layer rule with padding-inline: 1rem; px-lg generates a utilities-layer rule with padding-inline: 1.5rem. Both rules match, and the utilities rule wins.",
  "caption": "Both rules stay in the stylesheet and both match the button. Utilities follow components in the layer order, so the caller's padding applies without removing the component's class.",
  "labels": {
    "markupKeyword": "<button ",
    "slot": "data-slot=\"button\"",
    "classKeyword": " class=\"",
    "utility": "px-lg",
    "markupEnd": "\">",
    "componentTitle": "@layer components",
    "componentDetail": "padding-inline: 1rem",
    "utilityTitle": "@layer utilities",
    "utilityDetail": "padding-inline: 1.5rem",
    "order": "Later layer",
    "result": "Computed padding-inline: 24px"
  },
  "description": [
    {
      "title": "Component defaults",
      "text": "The Button's own styles select [data-slot=button] inside @layer components and set padding-inline: 1rem."
    },
    {
      "title": "Caller adjustment",
      "text": "The caller passes px-lg through className. Master CSS generates it in @layer utilities with padding-inline: 1.5rem."
    },
    {
      "title": "Layer order",
      "text": "Utilities come after components, so the button computes 24px at a 16px root size. No class is removed from the string."
    }
  ]
} as const
export function shadcnIllustrationMarkdown() {
  const figure = shadcnIllustration
  return `**${figure.title}**\n\n${figure.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${figure.caption}`
}
