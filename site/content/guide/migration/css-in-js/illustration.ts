export const cssInJSIllustration = {
  "title": "One class, changing values",
  "alt": "The same width class reads a local custom property in two meter instances. A value of 25 percent fills one quarter of its track; 75 percent fills three quarters. The class stays identical.",
  "caption": "Pass changing data through a custom property. Keep the complete class string visible to the scanner and keep state validation in the component.",
  "labels": {
    "class": "(width:var(--value))",
    "shared": "One reusable declaration",
    "first": "--value: 25%",
    "second": "--value: 75%",
    "firstValue": "25%",
    "secondValue": "75%",
    "local": "Local values on separate instances"
  },
  "description": [
    {
      "title": "Stable class",
      "text": "Both instances request (width:var(--value)). No percentage is interpolated into a class name."
    },
    {
      "title": "Local data",
      "text": "Each instance sets --value on its own element, so the same declaration produces a different width."
    },
    {
      "title": "Preserved behavior",
      "text": "The component still clamps the value and supplies the matching aria-valuenow."
    }
  ]
} as const
export function cssInJSIllustrationMarkdown() {
  const figure = cssInJSIllustration
  return `**${figure.title}**\n\n${figure.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${figure.caption}`
}
