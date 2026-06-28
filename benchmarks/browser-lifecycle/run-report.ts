import { writeBrowserLifecycleReport } from '../shared/browser-lifecycle'

const output = await writeBrowserLifecycleReport()

console.log(`Wrote browser lifecycle report JSON to ${output.jsonFile}`)
console.log(`Wrote browser lifecycle report Markdown to ${output.markdownFile}`)
