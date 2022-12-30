import { spawnSync } from 'child_process'
import MasterCSSCompiler from '@master/css-compiler'
import { expectFileIncludes } from '../../../utils/expect-file-includes'

it('check if dist contains virtual:master.css result ( usually bundled with styles.css )', async () => {
    spawnSync('npm.cmd', ['run', 'build'])
   
    const compiler = new MasterCSSCompiler()
    await compiler.init()

    expectFileIncludes(
        'dist/assets/index-*.css', 
        Object.keys(compiler.css.ruleOfClass).map(CSS.escape),
        process.cwd()
    )
})