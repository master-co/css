import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileCSSConfigFile } from '@master/css-compiler'
import { encodeMasterCSSPlan } from '@master/css-engine/plan-codec'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..')
const sourceFile = resolve(packageRoot, 'src/index.css')
const outputFile = resolve(packageRoot, 'src/default-plan.ts')
const { plan } = compileCSSConfigFile(sourceFile)
const encodedPlan = JSON.stringify(encodeMasterCSSPlan(plan))
const code = [
    '// @ts-nocheck',
    "import { decodeMasterCSSPlan } from '@master/css-engine/plan-codec'",
    "import type { MasterCSSPlan } from 'shared/master-css-plan'",
    '',
    `const defaultPlan: MasterCSSPlan = decodeMasterCSSPlan(${encodedPlan})`,
    '',
    'export default defaultPlan',
    ''
].join('\n')

writeFileSync(outputFile, code)
