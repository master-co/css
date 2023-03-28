import { execSync } from 'child_process'

it('make sure the build is successful.', () => {
    expect(() => execSync('npm run build', { stdio: 'inherit' })).not.toThrowError()
})