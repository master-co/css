export const bootstrapIllustration = {
  "title": "Preserve the threshold, not its name",
  "alt": "On the same width axis, Bootstrap md begins at 768 pixels and Master CSS preset md begins at 1024 pixels with a 16-pixel initial font size. A custom bootstrap-md condition aligns the converted layout with the original 768-pixel threshold.",
  "caption": "This comparison uses Bootstrap 5.3 defaults and a 16px initial font size. Read the installed theme before translating a breakpoint name.",
  "labels": {
    "original": "Bootstrap md",
    "preset": "Master CSS md",
    "kept": "--bootstrap-md",
    "start": "640px",
    "bootstrap": "768px",
    "master": "1024px",
    "end": "1152px",
    "condition": "@custom-media --bootstrap-md (width >= 768px);",
    "same": "Same viewport width",
    "difference": "Different activation points"
  },
  "description": [
    {
      "title": "Original threshold",
      "text": "Bootstrap 5.3 md starts at 768px unless the Sass configuration changes it."
    },
    {
      "title": "Different preset",
      "text": "Master CSS md starts at 64rem, shown as 1024px here. Reusing the name would change the layout boundary."
    },
    {
      "title": "Explicit migration condition",
      "text": "Define --bootstrap-md at 768px and use grid-cols(3)@bootstrap-md to keep the original threshold."
    }
  ]
} as const
export function bootstrapIllustrationMarkdown() {
  const figure = bootstrapIllustration
  return `**${figure.title}**\n\n${figure.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${figure.caption}`
}
