import { markdownTree } from '../docs-shell/utils/markdown-tree'

// Editorial policy, not a class parser. Current API declarations and ordinary
// DOM/CSS diffs remain valid; this list records the retired teaching material.
const retiredSyntax = /@(?:master\s+entry|utilities?\b|compose\b|defaults\b|components\b|settings\b|mode\b|custom-variant\b|variant\b|slot\b)|@theme\s+dark\b|--master-value\(\)|\b(?:base-unit|root-size|cssValuePolicy|configs\.stylesheet|createMasterCSSManifest)\b|\bmaster-css\s+migrate\b|\$name\b/
const history = /\b(?:Master CSS v1|Master CSS v2 RC|rc-(?:legacy|named|native|managed|utilities|sizing|mixins|preset))\b|\b(?:previous|old|removed|former)\s+(?:syntax|names?|token (?:names?|prefix)|project settings|length multipliers?)\b|\blength multipliers?\b|\b(?:migrat(?:e|es|ed|ing|ion)|upgrade (?:an? |the )?(?:existing|old|previous))\b/i
const externalConversion = /\b(?:convert|port|replace|switch(?:\s+from)?)\b[^\n]{0,120}\b(?:CSS Modules|Tailwind(?: CSS)?|Sass|CSS-in-JS|component[- ]library styling)\b|\bconvert\b[^\n]{0,80}\bCSS\b[^\n]{0,80}\b(?:to|into) Master CSS\b|\b(?:CSS Modules|Tailwind(?: CSS)?|Sass|CSS-in-JS|component[- ]library styling)\b[^\n]{0,120}\b(?:to|into) (?:current )?Master CSS\b/i

export function documentationHygieneIssues(markdown: string, navigation = false, promptCatalog = false): string[] {
  const issues: string[] = []
  function visit(node: any, catalog = false) {
    // The public prompt catalog may identify this current external-system API.
    if (promptCatalog && node.type === 'tableRow' && node.children?.some((cell: any) => cell.children?.some((child: any) => child.type === 'inlineCode' && child.value === 'migrate-to-mastercss'))) catalog = true
    if (navigation && node.type === 'link') return
    if (node.type === 'link' && /\/guide\/migration(?:[\/#.]|$)/.test(node.url)) issues.push(`Migration link: ${node.url}`)
    if (typeof node.value === 'string' && retiredSyntax.test(node.value)) issues.push(`Retired syntax: ${node.value.slice(0, 180)}`)
    if (node.type === 'text' && !catalog && history.test(node.value)) issues.push(`Historical teaching: ${node.value.slice(0, 180)}`)
    if ((node.type === 'text' || node.type === 'code') && !catalog && externalConversion.test(node.value)) issues.push(`External conversion tutorial: ${node.value.slice(0, 180)}`)
    node.children?.forEach((child: any) => visit(child, catalog))
  }
  visit(markdownTree(markdown))
  return issues
}
