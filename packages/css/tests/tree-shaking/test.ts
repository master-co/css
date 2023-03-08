import { execSync } from 'child_process'
import dedent from 'dedent'

it('tree-shaking', async () => {
    expect(
        execSync('esbuild ./index.ts --format=esm --bundle --platform=node --external:react --external:@master/css', { cwd: __dirname })
            .toString()
    )
        .toEqual(dedent`
            // ../../src/config/root-size.ts
            var rootSize = 16;

            // index.ts
            console.log(rootSize);\n
        `)
})