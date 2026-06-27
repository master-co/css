import { writeMasterDeliveryModeReport } from '../shared/delivery-mode-report'

const output = await writeMasterDeliveryModeReport()

console.log(`Wrote Master delivery modes report JSON to ${output.jsonFile}`)
console.log(`Wrote Master delivery modes report Markdown to ${output.markdownFile}`)
