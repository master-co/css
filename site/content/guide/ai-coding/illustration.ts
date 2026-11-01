/** Shared by the drawing, accessible description, search and Markdown export. */
export const aiIllustration = {
  "title": "Present in the output does not mean winning in the browser",
  "alt": "A layered p-md utility declares padding from --spacing-md, while an unlayered notice rule declares 8px. The normal unlayered rule wins; the rendered notice has 8px padding.",
  "caption": "Both rules are valid and present. Normal unlayered CSS outranks normal layered CSS, so inspecting generated output alone cannot prove the intended spacing.",
  "labels": {
    "utility": "Generated utility",
    "native": "Native stylesheet",
    "loser": "Present · overridden",
    "winner": "Wins · unlayered",
    "result": "class=\"notice p-md\"",
    "computed": "Computed padding: 8px",
    "sample": "Saved locally",
    "assumption": "Normal declarations · no !important"
  },
  "description": [
    {
      "title": "Generated rule",
      "text": "The preset p-md utility supplies padding: var(--spacing-md) inside the utilities layer. Its default value is 1rem."
    },
    {
      "title": "Competing rule",
      "text": "The unlayered native rule .notice { padding: 8px; } takes precedence over the layered utility for normal declarations."
    },
    {
      "title": "Observed result",
      "text": "An element with both notice and p-md has 8px padding on every side. Fixing its spacing requires reviewing the winning native rule, not generating the same utility again."
    }
  ]
} as const

export function aiIllustrationMarkdown() {
  const figure = aiIllustration
  return `**${figure.title}**\n\n${figure.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${figure.caption}`
}
