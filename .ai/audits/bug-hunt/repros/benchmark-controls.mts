import assert from 'node:assert/strict'
import { summarizeValues, summarizeReportSamples } from '../../../../benchmarks/shared/stats.ts'
import { validateFixtures, getFixture } from '../../../../benchmarks/shared/fixtures.ts'
import { benchmarkFixtures } from '../../../../benchmarks/fixtures/manifest.ts'
assert.deepEqual(summarizeValues([3,1,2,NaN,Infinity]), {min:1,median:2,mean:2,max:3,sampleCount:3})
assert.deepEqual(summarizeValues([]), {min:0,median:0,mean:0,max:0,sampleCount:0})
assert.equal(summarizeValues([1,4]).median,2.5)
validateFixtures(benchmarkFixtures)
assert.throws(()=>validateFixtures([benchmarkFixtures[0],benchmarkFixtures[0]]), /Duplicate/)
assert.throws(()=>getFixture([], 'minimal'), /Unknown/)
assert.equal(summarizeReportSamples([{metricId:'bytes',variantId:'a',round:0,value:5},{metricId:'bytes',variantId:'b',round:0,value:7}],new Map([['bytes','B']])).length,2)
console.log('Stats finite/empty/even median + fixture valid/duplicate/missing + variant isolation PASS')

const { runCommand } = await import('../../../../benchmarks/shared/runner.ts')
assert.equal((await runCommand(process.execPath, ['-e', 'process.stdout.write("ok")'], process.cwd())).stdout, 'ok')
await assert.rejects(runCommand(process.execPath, ['-e', 'process.stderr.write("boundary");process.exit(3)'], process.cwd()), /boundary/)
await assert.rejects(runCommand(process.execPath, ['-e', 'setInterval(()=>{},1000)'], process.cwd(), {timeoutMs:50}), /Command failed/)
console.log('Command success/error output/timeout termination PASS')
