import { writeProgressiveHydrationDiagnosticsReport } from '../shared/progressive-hydration-diagnostics'

const output = await writeProgressiveHydrationDiagnosticsReport()

console.log(`Wrote progressive hydration diagnostics report JSON to ${output.jsonFile}`)
console.log(`Wrote progressive hydration diagnostics report Markdown to ${output.markdownFile}`)
