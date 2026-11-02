import '@master/internal-site/styles/system/data.css'
import '~/site/styles/reference-sheet.css'

/**
 * Shared pieces of the structured sheet views. Each view imports this module, so the sheet
 * stylesheets load with any of them; the blocks themselves are the `Sheet*.astro` components.
 */

/** Class pattern → native declarations, the first fact a reader looks for. */
/** One width for every first column on a page, from its longest class: columns align down the page. */
export function keyWidth(names: string[]) {
  const longest = Math.max(...names.map(name => name.length))
  return `${Math.max(9.75, Math.min(17, longest * .5 + 1.25))}rem`
}

/** Backticks in short editorial sentences mark inline code. */
export function inlineTextParts(text: string) {
  return text.split(/(`[^`]+`)/).map(part => part.startsWith('`')
    ? { code: true, text: part.slice(1, -1) }
    : { code: false, text: part })
}

/** `<placeholder>` segments of a class or value pattern. */
export function placeholderParts(text: string) {
  return text.split(/(<[^>]+>)/).map(part => ({ placeholder: part.startsWith('<'), text: part }))
}
