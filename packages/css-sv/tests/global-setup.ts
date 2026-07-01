import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { setupGlobal } from 'sv/testing'

export const TEST_DIR = join(tmpdir(), 'master-css-sv-tests')

export default setupGlobal({
    TEST_DIR,
    post: async () => {
        removeTestDir()
    }
})

function removeTestDir() {
    rmSync(TEST_DIR, {
        force: true,
        maxRetries: 5,
        recursive: true,
        retryDelay: 100
    })
}
