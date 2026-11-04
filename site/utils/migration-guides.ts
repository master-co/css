/** Shared navigation and portable content; brand artwork stays in the existing registry. */
export const migrationGuides = [
  { slug: 'tailwindcss', brand: 'tailwindcss', title: 'Tailwind CSS', description: 'Utilities, variants, theme tokens and separate build inputs.' },
  { slug: 'css', brand: 'css', title: 'CSS and CSS Modules', description: 'Global and local selectors, shared tokens and class forwarding.' },
  { slug: 'css-in-js', brand: 'styled-components', title: 'CSS-in-JS', description: 'Styled wrappers, variants and runtime values.' },
  { slug: 'material-ui', brand: 'mui', title: 'Material UI', description: 'App-owned sx styles, resolved values and retained widgets.' },
  { slug: 'bootstrap', brand: 'bootstrap', title: 'Bootstrap', description: 'Grid geometry, vendor cascade and JavaScript components.' },
  { slug: 'sass', brand: 'sass', title: 'Sass', description: 'Compiler inputs, variables, mixins and useful native CSS.' },
] as const

export function migrationGuidesMarkdown(t: (text: string) => string = text => text) {
  return migrationGuides.map(guide => `- [${t(guide.title)}](/guide/migration/${guide.slug}) — ${t(guide.description)}`).join('\n')
}
