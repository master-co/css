import { execSync } from 'child_process'

try {
    execSync('mastercss', { stdio: 'inherit' })
} catch (error) {
    console.error('Command not found. Try installing "@master/css-cli" first.')
}