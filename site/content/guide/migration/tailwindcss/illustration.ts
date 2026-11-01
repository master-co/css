export const tailwindIllustration = {
  "title": "The same keyword has a different input",
  "alt": "Tailwind applies a list of utility classes with @apply px-4 py-2. Master CSS applies a named CSS mixin with @apply --control. The highlighted arguments identify what each compiler expects.",
  "caption": "A Tailwind utility list is not a Master CSS mixin name. Write native declarations or define a mixin before changing the application syntax.",
  "labels": {
    "tailwind": "Tailwind v4",
    "master": "Master CSS",
    "firstKeyword": "@apply ",
    "utilities": "px-4 py-2",
    "firstEnd": ";",
    "secondKeyword": "@apply ",
    "mixin": "--control",
    "secondEnd": ";",
    "utilityTitle": "Utility class list",
    "utilityDetail": "Expands the requested utility declarations",
    "mixinTitle": "Named CSS mixin",
    "mixinDetail": "Expands the definition of @mixin --control"
  },
  "description": [
    {
      "title": "Tailwind input",
      "text": "@apply px-4 py-2 expands Tailwind utility declarations in the current rule."
    },
    {
      "title": "Master CSS input",
      "text": "@apply --control expands one previously defined @mixin --control."
    },
    {
      "title": "Keep the values",
      "text": "The article defines padding-inline: 1rem and padding-block: .5rem explicitly before applying the mixin."
    }
  ]
} as const
export function tailwindIllustrationMarkdown() {
  const figure = tailwindIllustration
  return `**${figure.title}**\n\n${figure.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${figure.caption}`
}
