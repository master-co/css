import { expectFileIncludes } from '../../../utils/expect-file-includes'
import { execSync } from 'child_process'

execSync('rm -rf .svelte-kit', { stdio: 'inherit'  })
execSync('npm run build', { stdio: 'inherit'  })

test('check that the output contains the expected css rules', () => {
    expectFileIncludes('../.svelte-kit/output/client/_app/immutable/assets/src/routes/master-*.css', [
        'bg\\:gray-90'
    ])
})