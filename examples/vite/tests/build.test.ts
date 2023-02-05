import { execSync } from 'child_process'
import MasterCSSCompiler from '@master/css-compiler'
import { expectFileIncludes } from '../../../utils/expect-file-includes'
import upath from 'upath'

it('check if dist contains virtual:master.css result ( usually bundled with styles.css )', async () => {
    execSync('npm run build')
   
    const compiler = await new MasterCSSCompiler().compile()

    expectFileIncludes(
        upath.join('..', 'dist', 'assets', 'index-*.css'),
        Object.keys(compiler.css.ruleOfClass).map(CSS.escape)
    )
})