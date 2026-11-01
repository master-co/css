/** Shared by the drawing, accessible description, search and Markdown export. */
export const themeIllustration = {
  "title": "One shared value changes padding and gap together",
  "alt": "Before and after changing --spacing-card from 1.5rem to 2rem: p-card padding increases from 24 to 32 pixels, and gap-card space between two list items increases by the same amount.",
  "caption": "The markup stays the same in both columns. Measurements assume a 16px root font size; the highlighted regions show padding and gap at their actual relative sizes.",
  "labels": {
    "token": "--spacing-card",
    "before": "Before",
    "after": "After",
    "oldValue": "1.5rem · 24px",
    "newValue": "2rem · 32px",
    "padding": "p-card",
    "gap": "gap-card",
    "card": "Field notes",
    "first": "Draft",
    "second": "Ready",
    "unchanged": "Same classes · one token edit"
  },
  "description": [
    {
      "title": "Before",
      "text": "At a root font size of 16px, --spacing-card: 1.5rem supplies 24px of padding through p-card and a 24px gap through gap-card."
    },
    {
      "title": "After",
      "text": "Changing the token to 2rem increases both measurements to 32px without editing the classes."
    },
    {
      "title": "Choose the coupling",
      "text": "Use one token only when these spaces should change together. Separate design decisions need separate tokens even if their current values match."
    }
  ]
} as const

export function themeIllustrationMarkdown() {
  const figure = themeIllustration
  return `**${figure.title}**\n\n${figure.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${figure.caption}`
}
