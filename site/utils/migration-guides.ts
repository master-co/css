/** Shared navigation and portable content; brand artwork stays in the existing registry. */
export const migrationGuides = [
  { slug: 'tailwindcss', brand: 'tailwindcss', title: 'Tailwind CSS', description: 'Utilities, variants, theme tokens and separate build inputs.' },
  { slug: 'css', brand: 'css', title: 'CSS Modules', description: 'Local selectors, shared tokens and class forwarding.' },
  { slug: 'css-in-js', brand: 'styled-components', title: 'CSS-in-JS', description: 'Styled wrappers, variants and runtime values.' },
  { slug: 'material-ui', brand: 'mui', title: 'Material UI', description: 'App-owned sx styles, resolved values and retained widgets.' },
  { slug: 'bootstrap', brand: 'bootstrap', title: 'Bootstrap', description: 'Grid geometry, vendor cascade and JavaScript components.' },
  { slug: 'sass', brand: 'sass', title: 'Sass', description: 'Compiler inputs, variables, mixins and useful native CSS.' },
  { slug: 'v2-rc', brand: 'mastercss', title: 'Master CSS v2 RC', description: 'Named tokens, native declarations, unit migration and coordinated package upgrades.' },
  { slug: 'v1', brand: 'v1', title: 'Master CSS v1', description: 'Package upgrades, CSS-first configuration and runtime wiring.' }
] as const

export function migrationGuidesMarkdown() {
  return migrationGuides.map(guide => `- [${guide.title}](/guide/migration/${guide.slug}) — ${guide.description}`).join('\n')
}
