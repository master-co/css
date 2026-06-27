import { writeInteractionCostReport } from '../shared/interaction-cost'

const output = await writeInteractionCostReport()

console.log(`Wrote interaction cost report JSON to ${output.jsonFile}`)
console.log(`Wrote interaction cost report Markdown to ${output.markdownFile}`)
