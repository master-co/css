import { execSync } from 'child_process'
import dedent from 'dedent'

it('tree-shaking', () => {
    expect(
        execSync([
            `echo "import { rootSize } from '../src'; console.log(rootSize)"`,
            `esbuild --format=esm --bundle --platform=node --external:react --external:@master/css`
        ].join(' | '), { cwd: __dirname })
            .toString()
    )
        .toEqual(dedent`
            // ../src/config/root-size.ts
            var rootSize = 16;

            // <stdin>
            console.log(rootSize);\n
        `)
})