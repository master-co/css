import fs from 'fs'
import { execSync } from 'child_process'
import { generateTSFileSchema } from '../src'

it('create master.css.ts config', async () => {
    const test = (aot: boolean, jit: boolean) => {
        execSync(`mcss init${aot ? ' --aot' : ''}${jit ? ' --jit' : ''}`)

        const path = 'master.css.ts'
        if (fs.existsSync(path)) {
            const content = fs.readFileSync(path, { encoding: 'utf-8' })
            if (content !== generateTSFileSchema({ aot, jit })) {
                fail('incorrect master.css.ts')
            }
    
            fs.rmSync(path)
        } else {
            fail('failed to create master.css.ts')
        }
    }

    test(false, false)
    test(true, false)
    test(false, true)
    test(true, true)
})
