import { writeRuntimeMutationDiagnosticsReport } from '../shared/runtime-mutation-diagnostics'

const output = await writeRuntimeMutationDiagnosticsReport()

console.log(`Wrote runtime mutation diagnostics report JSON to ${output.jsonFile}`)
console.log(`Wrote runtime mutation diagnostics report Markdown to ${output.markdownFile}`)
